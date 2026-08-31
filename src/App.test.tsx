import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Account OS shell", () => {
  it("renders the synthetic vault dataset without exposing passwords", () => {
    render(<App />);

    expect(screen.getByText("Google Personal TEST")).toBeInTheDocument();
    expect(screen.getByText("6 accounts")).toBeInTheDocument();
    expect(screen.queryByText("FAKE-PASSWORD-ONLY")).not.toBeInTheDocument();
  });

  it("navigates to the interactive map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Map" }));

    expect(screen.getByRole("heading", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByLabelText("Account dependency map")).toBeInTheDocument();
  });

  it("adds, edits, and deletes a synthetic account in preview mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add account" }));
    await user.type(screen.getByLabelText("Service"), "Example Service TEST");
    await user.type(screen.getByLabelText("Account title"), "Example Account TEST");
    await user.type(screen.getByLabelText("Email"), "example@test.invalid");
    await user.click(screen.getByRole("button", { name: "Save account" }));

    expect(screen.getByText("Example Account TEST")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Example Account TEST/ }));
    const title = screen.getByLabelText("Account title");
    await user.clear(title);
    await user.type(title, "Updated Account TEST");
    await user.click(screen.getByRole("button", { name: "Save account" }));
    expect(await screen.findByText("Updated Account TEST")).toBeInTheDocument();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: /Updated Account TEST/ }));
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.queryByText("Updated Account TEST")).not.toBeInTheDocument();
  });

  it("filters synthetic accounts by search, category, and authentication method", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Search accounts"), "Claude");
    expect(screen.getByText("Claude Personal TEST")).toBeInTheDocument();
    expect(screen.queryByText("Google Personal TEST")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search accounts"));
    await user.selectOptions(screen.getByLabelText("Filter by category"), "Development");
    expect(screen.getByText("GitHub TEST")).toBeInTheDocument();
    expect(screen.queryByText("Facebook TEST")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filter by authentication method"), "GitHub OAuth");
    expect(screen.getByText("Supabase TEST")).toBeInTheDocument();
    expect(screen.queryByText("GitHub TEST")).not.toBeInTheDocument();
  });

  it("creates, edits, and removes a relationship from account details", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /GitHub TEST/ }));
    await user.selectOptions(screen.getByLabelText("Related account"), "account-facebook-test");
    await user.selectOptions(screen.getByLabelText("Relationship type"), "DEPENDS_ON");
    await user.click(screen.getByRole("button", { name: "Add relationship" }));
    expect(screen.getAllByText("DEPENDS_ON").some((element) => element.tagName === "STRONG")).toBe(true);

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[editButtons.length - 1]);
    await user.selectOptions(screen.getByLabelText("Relationship type"), "CONNECTED_TO");
    await user.click(screen.getByRole("button", { name: "Update relationship" }));
    expect(screen.getAllByText("CONNECTED_TO").some((element) => element.tagName === "STRONG")).toBe(true);

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(removeButtons[removeButtons.length - 1]);
    expect(screen.queryAllByText("CONNECTED_TO").some((element) => element.tagName === "STRONG")).toBe(false);
  });

  it("shows encrypted backup controls in Settings", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Encrypted backup and restore" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export encrypted backup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose backup file" })).toBeInTheDocument();
  });

  it("reveals, hides, generates, and intentionally copies a synthetic credential", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Google Personal TEST/ }));
    await user.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByDisplayValue("FAKE-PASSWORD-ONLY")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.getByDisplayValue("FAKE-PASSWORD-ONLY")).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Generate" }));
    const password = screen.getByLabelText(/Password \/ sensitive value/) as HTMLInputElement;
    expect(password.value).toHaveLength(20);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(password.value);
  });
});
