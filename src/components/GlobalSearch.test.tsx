import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { GlobalSearch } from "./GlobalSearch";

describe("GlobalSearch", () => {
  function renderSearch() {
    const onClose = vi.fn();
    const onSelectAccount = vi.fn();
    render(<GlobalSearch accounts={fakeVault.accounts} onClose={onClose} onSelectAccount={onSelectAccount} />);
    return { onClose, onSelectAccount };
  }

  it("shows nothing until a query is typed", () => {
    renderSearch();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByText("No matching accounts")).not.toBeInTheDocument();
  });

  it("finds a real account by name and selects it on click", async () => {
    const user = userEvent.setup();
    const { onClose, onSelectAccount } = renderSearch();

    await user.type(screen.getByRole("combobox"), "GitHub");
    const result = screen.getByRole("option", { name: /GitHub TEST/ });
    await user.click(result);

    expect(onSelectAccount).toHaveBeenCalledWith(expect.objectContaining({ id: "account-github-test" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("selects the active result with Enter", async () => {
    const user = userEvent.setup();
    const { onSelectAccount } = renderSearch();

    await user.type(screen.getByRole("combobox"), "spotify.example");
    await user.keyboard("{Enter}");

    expect(onSelectAccount).toHaveBeenCalledWith(expect.objectContaining({ id: "account-spotify-test" }));
  });

  it("shows a real no-results state for a query that matches nothing", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "zzz-nothing-matches");
    expect(screen.getByText("No matching accounts")).toBeInTheDocument();
  });

  it("uses the required placeholder copy without inventing a 'people' search", () => {
    renderSearch();
    expect(screen.getByPlaceholderText("Search accounts, domains…")).toBeInTheDocument();
  });

  it("clears the query and refocuses the input", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox");

    await user.type(input, "github");
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });
});
