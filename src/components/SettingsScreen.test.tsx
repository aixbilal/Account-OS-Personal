import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({ invoke: (...args: unknown[]) => invoke(...args) }));
vi.mock("@tauri-apps/api/app", () => ({ getVersion: vi.fn().mockResolvedValue("0.1.0") }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn(), save: vi.fn() }));

import { SettingsScreen } from "./SettingsScreen";

function renderSettings(overrides: Partial<React.ComponentProps<typeof SettingsScreen>> = {}) {
  const props = {
    isNative: true,
    onCloudVaultRestored: vi.fn(),
    onMasterPasswordChanged: vi.fn(),
    onThemeChange: vi.fn(),
    onVaultOperationChange: vi.fn(),
    onVaultRestored: vi.fn(),
    theme: "light" as const,
    ...overrides,
  };
  render(<SettingsScreen {...props} />);
  return props;
}

async function openSecuritySection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Security" }));
}

describe("SettingsScreen — change master password", () => {
  beforeEach(() => {
    invoke.mockReset();
    window.localStorage.clear();
  });

  it("blocks the change when the new password entries do not match", async () => {
    const user = userEvent.setup();
    renderSettings();
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "old-master-TEST");
    await user.type(screen.getByLabelText("New master password"), "new-master-TEST-1");
    await user.type(screen.getByLabelText("Confirm new master password"), "new-master-TEST-2");
    await user.click(screen.getByRole("button", { name: "Change master password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("do not match");
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks the change when the new password equals the current one", async () => {
    const user = userEvent.setup();
    renderSettings();
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "same-master-TEST");
    await user.type(screen.getByLabelText("New master password"), "same-master-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "same-master-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("differs from the current one");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("confirms, then invokes the rekey command and reports success", async () => {
    const user = userEvent.setup();
    invoke.mockResolvedValueOnce(undefined);
    const { onMasterPasswordChanged } = renderSettings();
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "old-master-TEST");
    await user.type(screen.getByLabelText("New master password"), "new-master-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "new-master-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));

    const dialog = await screen.findByRole("dialog", { name: "Change the master password?" });
    await user.click(within(dialog).getByRole("button", { name: "Change password" }));

    expect(invoke).toHaveBeenCalledWith("change_master_password", {
      currentPassword: "old-master-TEST",
      newPassword: "new-master-TEST",
    });
    expect(await screen.findByText(/Master password changed/)).toBeInTheDocument();
    expect(onMasterPasswordChanged).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Current master password")).toHaveValue("");
  });

  it("surfaces the backend rejection message and leaves the form usable", async () => {
    const user = userEvent.setup();
    invoke.mockRejectedValueOnce("Unable to unlock the vault. Check the master password or vault file.");
    renderSettings();
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "wrong-current-TEST");
    await user.type(screen.getByLabelText("New master password"), "new-master-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "new-master-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Check the master password or vault file");
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("does not call the backend from the web renderer preview", async () => {
    const user = userEvent.setup();
    renderSettings({ isNative: false });
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "old-master-TEST");
    await user.type(screen.getByLabelText("New master password"), "new-master-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "new-master-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));

    expect(await screen.findByText(/available in the installed desktop application/)).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });
});
