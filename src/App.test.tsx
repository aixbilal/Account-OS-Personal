import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fakeVault } from "./data/fakeVault";
import { ACCOUNT_CATEGORIES, type VaultData } from "./domain/types";

function installMatchMedia(matches = false) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function renderApp(previewVault: VaultData = fakeVault) {
  return render(<App previewVault={previewVault} />);
}

describe("Account OS shell", () => {
  beforeEach(() => {
    installMatchMedia();
    window.localStorage.clear();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("renders only the synthetic vault fixture without exposing its passwords", async () => {
    renderApp();

    expect(screen.getAllByText("Google Personal TEST").length).toBeGreaterThan(0);
    expect(screen.getByText(/13 accounts/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Google Personal TEST account details")).toBeInTheDocument());
    expect(screen.queryByText("FAKE-PASSWORD-ONLY")).not.toBeInTheDocument();
  });

  it("resets a revealed credential when a different account is selected", async () => {
    const user = userEvent.setup();
    renderApp();
    const list = screen.getByRole("list", { name: "Account list" });

    await user.click(within(list).getByText("Google Personal TEST").closest("button")!);
    await user.click(screen.getByRole("button", { name: "Reveal password" }));
    expect(screen.getByText("FAKE-PASSWORD-ONLY")).toBeInTheDocument();

    await user.click(within(list).getByText("Spotify TEST").closest("button")!);
    expect(screen.queryByText("FAKE-PASSWORD-ONLY")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal password" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide password" })).not.toBeInTheDocument();
  });

  it("shows a truthful empty-vault onboarding path", async () => {
    const user = userEvent.setup();
    renderApp({ formatVersion: 1, categories: [...ACCOUNT_CATEGORIES], accounts: [], relationships: [] });

    expect(screen.getByRole("heading", { name: "No accounts yet" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your vault is empty" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add first account" }));
    expect(screen.getByRole("dialog", { name: "Add account" })).toBeInTheDocument();
  });

  it("offers a recoverable no-results state and clears every filter", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByRole("searchbox"), "does-not-exist.invalid");
    expect(screen.getByRole("heading", { name: "No matching accounts" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search and filters" }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getAllByText("Google Personal TEST").length).toBeGreaterThan(0);
  });

  it("persists a real website through the shared account editor", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /Add account/ }));
    await user.type(screen.getByRole("combobox", { name: "Service" }), "Example Service TEST");
    await user.type(screen.getByRole("textbox", { name: "Account title" }), "Example Account TEST");
    await user.type(screen.getByRole("textbox", { name: /Website/ }), "https://account.example.invalid");
    await user.click(screen.getByRole("button", { name: "Save account" }));

    expect((await screen.findAllByText("Example Account TEST")).length).toBeGreaterThan(0);
    expect(screen.getByText("https://account.example.invalid")).toBeInTheDocument();
  });

  it("uses the shared friendly relationship flow from the Map", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Map" }));
    expect(screen.getByLabelText("Account dependency map")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Relationship" }));

    const dialog = screen.getByRole("dialog", { name: "Add relationship" });
    await user.selectOptions(within(dialog).getByLabelText("To account"), "account-facebook-test");
    await user.selectOptions(within(dialog).getByLabelText("Relationship type"), "DEPENDS_ON");
    expect(within(dialog).getByText("Depends on", { selector: "strong" })).toBeInTheDocument();
    expect(within(dialog).queryByText("DEPENDS_ON")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Add relationship" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add relationship" })).not.toBeInTheDocument());
    expect(screen.getByText("Relationship added")).toBeInTheDocument();
  });

  it("migrates legacy appearance values to Light and persists explicit choices", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("account-os-theme", "adaptive");
    renderApp();
    const shell = screen.getByRole("complementary", { name: "Primary navigation" }).parentElement;

    expect(shell).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("account-os-theme")).toBe("light");
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("radio", { name: /Light/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Adaptive")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Dark/ }));
    expect(shell).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("account-os-theme")).toBe("dark");
  });
});
