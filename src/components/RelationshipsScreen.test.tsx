import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { RelationshipsScreen } from "./RelationshipsScreen";

describe("RelationshipsScreen", () => {
  function renderScreen() {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onEdit = vi.fn();
    const onEditRelationship = vi.fn();
    const onOpenAccount = vi.fn();
    const onRemoveRelationship = vi.fn();
    const onRequestRelationship = vi.fn();
    render(
      <RelationshipsScreen
        accounts={fakeVault.accounts}
        onDelete={onDelete}
        onEdit={onEdit}
        onEditRelationship={onEditRelationship}
        onOpenAccount={onOpenAccount}
        onRemoveRelationship={onRemoveRelationship}
        onRequestRelationship={onRequestRelationship}
        relationships={fakeVault.relationships}
      />,
    );
    return { onDelete, onEdit, onEditRelationship, onOpenAccount, onRemoveRelationship, onRequestRelationship };
  }

  it("computes Total/Connected/Isolated from real data - no People/Entities card (Section 3.5)", () => {
    renderScreen();
    // 13 accounts total; 8 appear in at least one relationship (google, claude,
    // github, supabase, facebook, instagram, openai, university); 5 isolated
    // (apple, microsoft, spotify, amazon, custom).
    expect(screen.getByText("Total accounts").previousSibling).toHaveTextContent("13");
    expect(screen.getByText("Connected").previousSibling).toHaveTextContent("8");
    expect(screen.getByText("Isolated").previousSibling).toHaveTextContent("5");
    expect(screen.queryByText(/People/)).not.toBeInTheDocument();
  });

  it("opens on the most-connected account (a hub) and lists its real connections", () => {
    renderScreen();
    expect(screen.getByRole("combobox", { name: "Focus account" })).toHaveValue("account-google-personal-test");
    expect(screen.getByText("Connected accounts (4)")).toBeInTheDocument();
  });

  it("shows a simple one-to-one account with just its one counterpart", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.selectOptions(screen.getByRole("combobox", { name: "Focus account" }), "account-github-test");
    expect(screen.getByText("Connected accounts (2)")).toBeInTheDocument();
    expect(screen.getAllByText("Supabase TEST").length).toBeGreaterThan(0);
  });

  it("shows an isolated account with zero connections instead of erroring", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.selectOptions(screen.getByRole("combobox", { name: "Focus account" }), "account-apple-test");
    expect(screen.getByText("Connected accounts (0)")).toBeInTheDocument();
    expect(screen.getByText("No connections yet for this account.")).toBeInTheDocument();
  });

  it("requests a new relationship for the focused account", async () => {
    const user = userEvent.setup();
    const { onRequestRelationship } = renderScreen();
    await user.click(screen.getByRole("button", { name: "Add relationship" }));
    expect(onRequestRelationship).toHaveBeenCalledWith("account-google-personal-test");
  });

  // Item 1 (V3 fixture pass): the focused-account panel gets real parity
  // with the Vault inspector - Edit + "..." overflow, and Details/Security/
  // Notes tabs built only from fields that already exist on Account.
  it("edits and deletes the focused account via Edit + the \"...\" overflow, matching the Vault inspector's pattern", async () => {
    const user = userEvent.setup();
    const { onDelete, onEdit } = renderScreen();
    const googlePersonal = fakeVault.accounts.find((account) => account.id === "account-google-personal-test")!;

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(googlePersonal);

    await user.click(screen.getByRole("button", { name: "More account actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete account" }));
    const confirmation = screen.getByRole("dialog", { name: `Delete ${googlePersonal.accountName}?` });
    await user.click(within(confirmation).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(googlePersonal));
  });

  it("shows only fields that already exist on Account across the Details/Security/Notes tabs", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Security" }));
    expect(screen.getByText("Authentication method")).toBeInTheDocument();
    expect(screen.getByText("2FA")).toBeInTheDocument();
    expect(screen.getByText("Recovery information")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("Synthetic primary identity hub.")).toBeInTheDocument();
  });

  it("edits and removes one connected account's relationship via its own row menu, not the full manage list", async () => {
    const user = userEvent.setup();
    const { onEditRelationship, onRemoveRelationship } = renderScreen();

    const menus = screen.getAllByRole("button", { name: /More actions for the relationship with/ });
    await user.click(menus[0]);
    await user.click(screen.getByRole("menuitem", { name: "Edit relationship" }));
    expect(onEditRelationship).toHaveBeenCalledTimes(1);

    await user.click(menus[0]);
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(onRemoveRelationship).toHaveBeenCalledTimes(1);
    expect(onRemoveRelationship.mock.calls[0][0]).toEqual(onEditRelationship.mock.calls[0][0]);
  });

  // Item 2 (V3 fixture pass): Graph/List/Matrix all read the same
  // Account + AccountRelationship data - no new modeling.
  it("switches into the List view and shows every relationship as a sortable row", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "List" }));
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: /Account/ })).toBeInTheDocument();
    expect(within(table).getAllByRole("row").length).toBe(fakeVault.relationships.length + 1);
  });

  it("switches into the Matrix view and shows a clickable cell for a real connected pair", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Matrix" }));
    // The grid is symmetric - the same connected pair shows a clickable
    // cell at both [row, col] and [col, row].
    expect(screen.getAllByRole("button", { name: /GitHub TEST.*Supabase TEST|Supabase TEST.*GitHub TEST/ }).length).toBe(2);
  });
});
