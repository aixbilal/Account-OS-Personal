import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { AccountEditor } from "./AccountEditor";

describe("AccountEditor", () => {
  const account = fakeVault.accounts.find((item) => item.id === "account-github-test")!;

  function renderEditor(overrides: Partial<React.ComponentProps<typeof AccountEditor>> = {}) {
    const callbacks = {
      onClose: vi.fn(),
      onDelete: vi.fn().mockResolvedValue(undefined),
      onDirtyChange: vi.fn(),
      onNotify: vi.fn(),
      onSave: vi.fn().mockResolvedValue(undefined),
    };
    render(
      <AccountEditor
        account={account}
        {...callbacks}
        {...overrides}
      />,
    );
    return callbacks;
  }

  it("loads and trims the real website field when saving", async () => {
    const user = userEvent.setup();
    const { onClose, onDirtyChange, onSave } = renderEditor();
    const website = screen.getByRole("textbox", { name: /Website/ });

    expect(website).toHaveValue("https://github.example.invalid");
    await user.clear(website);
    await user.type(website, "  https://accounts.example.invalid/profile  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      serviceName: "GitHub",
      website: "https://accounts.example.invalid/profile",
    }));
    expect(onDirtyChange).toHaveBeenCalledWith(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("requires explicit confirmation before discarding dirty fields", async () => {
    const user = userEvent.setup();
    const { onClose } = renderEditor();

    await user.type(screen.getByRole("textbox", { name: "Account title" }), " changed");
    await user.click(screen.getByRole("button", { name: "Close account editor" }));

    const confirmation = screen.getByRole("dialog", { name: "Discard unsaved changes?" });
    expect(onClose).not.toHaveBeenCalled();
    await user.click(within(confirmation).getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close account editor" }));
    await user.click(within(screen.getByRole("dialog", { name: "Discard unsaved changes?" })).getByRole("button", { name: "Discard changes" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("explains relationship removal before deleting an account", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderEditor({ relationshipCount: 2 });

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    const confirmation = screen.getByRole("dialog", { name: `Delete ${account.accountName}?` });
    expect(confirmation).toHaveTextContent("removes its 2 relationships");
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(within(confirmation).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(account));
  });
});
