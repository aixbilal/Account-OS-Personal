import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { passwordStrength, VaultEntry } from "./VaultEntry";

describe("passwordStrength", () => {
  it("uses deterministic length and character-class checks", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "Enter a password" });
    expect(passwordStrength("short")).toMatchObject({ score: 0, label: "Weak password" });
    expect(passwordStrength("twelveletters")).toMatchObject({ score: 1, label: "Weak password" });
    expect(passwordStrength("Synthetic-Vault-42!")).toEqual({ score: 4, label: "Strong password strength" });
  });
});

describe("VaultEntry", () => {
  it("reveals the master password and confirmation independently", async () => {
    const user = userEvent.setup();
    render(<VaultEntry hasVault={false} onCreate={vi.fn()} onUnlock={vi.fn()} />);
    const password = screen.getByLabelText("Master password");
    const confirmation = screen.getByLabelText("Confirm master password");

    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show master password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(confirmation).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show confirm master password" }));
    expect(confirmation).toHaveAttribute("type", "text");
  });

  it("blocks a short or mismatched new master password locally", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<VaultEntry hasVault={false} onCreate={onCreate} onUnlock={vi.fn()} />);

    const password = screen.getByLabelText("Master password");
    await user.type(password, "too-short");
    await user.click(screen.getByRole("button", { name: /Create encrypted vault/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("at least 12 characters");
    expect(password).toHaveFocus();
    expect(onCreate).not.toHaveBeenCalled();

    await user.clear(password);
    await user.type(password, "Synthetic-Vault-42!");
    await user.type(screen.getByLabelText("Confirm master password"), "Synthetic-Vault-43!");
    await user.click(screen.getByRole("button", { name: /Create encrypted vault/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("confirmation does not match");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("clears a rejected unlock credential and returns focus to the field", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn().mockRejectedValue(new Error("Incorrect master password."));
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    render(<VaultEntry hasVault onCreate={vi.fn()} onUnlock={onUnlock} />);
    const password = screen.getByLabelText("Master password");

    await user.type(password, "Synthetic-Wrong-42!");
    await user.click(screen.getByRole("button", { name: /Unlock vault/ }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("The vault could not be unlocked. Check the master password and try again."));
    expect(password).toHaveValue("");
    expect(password).toHaveFocus();
    expect(onUnlock).toHaveBeenCalledWith("Synthetic-Wrong-42!");
  });
});
