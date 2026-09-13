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
    onVaultDeleted: vi.fn(),
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

/** Number of times `invoke("change_master_password", ...)` specifically was
 * called - as opposed to raw call-count assertions, which the System tab's
 * unconditional mount-time device_info/vault_file_size fetches (Phase 7)
 * would otherwise make brittle. */
function rekeyInvocations() {
  return invoke.mock.calls.filter(([command]) => command === "change_master_password");
}

/**
 * SettingsScreen now fires background invoke calls on mount (device_info,
 * vault_file_size - Phase 7) in addition to whatever a test's own actions
 * trigger. A positional mock queue (mockResolvedValueOnce) can't tell those
 * apart from the call a test actually means to control, so this resolves
 * per command name instead: `mockInvokeOnce("change_master_password", impl)`
 * only intercepts that command's next call, however many other commands
 * fire around it.
 */
const invokeOverrides = new Map<string, () => Promise<unknown>>();
function mockInvokeOnce(command: string, impl: () => Promise<unknown>) {
  invokeOverrides.set(command, impl);
}

describe("SettingsScreen — change master password", () => {
  beforeEach(() => {
    invoke.mockReset();
    invokeOverrides.clear();
    // A real `invoke` always returns a Promise; device_info/vault_file_size
    // resolve to a harmless default unless a test overrides them.
    invoke.mockImplementation((command: string) => {
      const override = invokeOverrides.get(command);
      if (override) {
        invokeOverrides.delete(command);
        return override();
      }
      return Promise.resolve(undefined);
    });
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
    expect(rekeyInvocations()).toHaveLength(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks a new password shorter than the vault creation minimum", async () => {
    const user = userEvent.setup();
    renderSettings();
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "old-master-TEST");
    await user.type(screen.getByLabelText("New master password"), "short-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "short-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("at least 12 characters");
    expect(rekeyInvocations()).toHaveLength(0);
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
    expect(rekeyInvocations()).toHaveLength(0);
  });

  it("confirms, then invokes the rekey command and reports success", async () => {
    const user = userEvent.setup();
    mockInvokeOnce("change_master_password", () => Promise.resolve(undefined));
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
    mockInvokeOnce("change_master_password", () => Promise.reject("Unable to unlock the vault. Check the master password or vault file."));
    renderSettings();
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "wrong-current-TEST");
    await user.type(screen.getByLabelText("New master password"), "new-master-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "new-master-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Check the master password or vault file");
    expect(rekeyInvocations()).toHaveLength(1);
  });

  it("does not call the backend from the web renderer preview", async () => {
    const user = userEvent.setup();
    renderSettings({ isNative: false });
    await openSecuritySection(user);

    await user.type(screen.getByLabelText("Current master password"), "old-master-TEST");
    await user.type(screen.getByLabelText("New master password"), "new-master-TEST");
    await user.type(screen.getByLabelText("Confirm new master password"), "new-master-TEST");
    await user.click(screen.getByRole("button", { name: "Change master password" }));

    // Item 5 (UI Refinement Pass 2) made every section always-rendered, so
    // the generic phrase "available in the installed desktop application"
    // now also matches the System section's own always-visible device-info
    // placeholder - matched on the specific rekey message instead to keep
    // this assertion about the rekey status, not any status.
    expect(await screen.findByText(/Changing the master password is available/)).toBeInTheDocument();
    // Not just the rekey call: isNative false also skips the mount-time
    // device_info/vault_file_size fetches, so nothing should call invoke at all.
    expect(invoke).not.toHaveBeenCalled();
  });
});

async function openSystemSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "System" }));
}

describe("SettingsScreen — System: device, storage, danger zone (Phase 7)", () => {
  beforeEach(() => {
    invoke.mockReset();
    invokeOverrides.clear();
    invoke.mockImplementation((command: string) => {
      const override = invokeOverrides.get(command);
      if (override) {
        invokeOverrides.delete(command);
        return override();
      }
      return Promise.resolve(undefined);
    });
    window.localStorage.clear();
  });

  it("shows real device facts and the real vault file size, not a fabricated quota", async () => {
    mockInvokeOnce("device_info", () => Promise.resolve({
      appDataPath: "C:\\Users\\test\\AppData\\Roaming\\AccountOS",
      hostname: "TEST-DEVICE",
      os: "Windows 11",
    }));
    mockInvokeOnce("vault_file_size", () => Promise.resolve(2_500_000));
    const user = userEvent.setup();
    renderSettings();
    await openSystemSection(user);

    expect(await screen.findByText("TEST-DEVICE")).toBeInTheDocument();
    expect(screen.getByText("Windows 11")).toBeInTheDocument();
    expect(screen.getByText("C:\\Users\\test\\AppData\\Roaming\\AccountOS")).toBeInTheDocument();
    expect(await screen.findByText("2.38 MB")).toBeInTheDocument();
    expect(screen.queryByText(/used of/)).not.toBeInTheDocument();
  });

  it("opens the real app-data folder, not a decorative button", async () => {
    const user = userEvent.setup();
    renderSettings();
    await openSystemSection(user);

    await user.click(await screen.findByRole("button", { name: "Open folder" }));
    expect(invoke).toHaveBeenCalledWith("open_app_data_folder");
  });

  it("resets app settings after confirmation, without touching the vault", async () => {
    window.localStorage.setItem("account-os-theme", "dark");
    const user = userEvent.setup();
    const { onThemeChange, onVaultDeleted } = renderSettings();
    await openSystemSection(user);

    await user.click(screen.getByRole("button", { name: "Reset app" }));
    const dialog = await screen.findByRole("dialog", { name: "Reset app settings?" });
    await user.click(within(dialog).getByRole("button", { name: "Reset app" }));

    expect(onThemeChange).toHaveBeenCalledWith("light");
    expect(window.localStorage.getItem("account-os-theme")).toBeNull();
    expect(await screen.findByText(/Settings reset to defaults/)).toBeInTheDocument();
    expect(onVaultDeleted).not.toHaveBeenCalled();
  });

  it("deletes the vault only after typing through the confirmation dialog", async () => {
    mockInvokeOnce("delete_vault", () => Promise.resolve(undefined));
    const user = userEvent.setup();
    const { onVaultDeleted } = renderSettings();
    await openSystemSection(user);

    await user.click(screen.getByRole("button", { name: "Delete vault" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete this vault?" });
    expect(onVaultDeleted).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete vault" }));

    expect(invoke).toHaveBeenCalledWith("delete_vault");
    await vi.waitFor(() => expect(onVaultDeleted).toHaveBeenCalledTimes(1));
  });

  it("leaves the vault untouched when the backend rejects the delete", async () => {
    mockInvokeOnce("delete_vault", () => Promise.reject("The local vault could not be saved safely."));
    const user = userEvent.setup();
    const { onVaultDeleted } = renderSettings();
    await openSystemSection(user);

    await user.click(screen.getByRole("button", { name: "Delete vault" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete vault" }));

    expect(await screen.findByText("The local vault could not be saved safely.")).toBeInTheDocument();
    expect(onVaultDeleted).not.toHaveBeenCalled();
  });

  it("offers no real device/delete actions in the web renderer preview", async () => {
    const user = userEvent.setup();
    renderSettings({ isNative: false });
    await openSystemSection(user);

    expect(screen.getByRole("button", { name: "Open folder" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Delete vault" }));
    expect(await screen.findByRole("status")).toHaveTextContent("available in the installed desktop application");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
