import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { RelationshipsScreen } from "./RelationshipsScreen";

describe("RelationshipsScreen", () => {
  function renderScreen() {
    const onOpenAccount = vi.fn();
    const onRequestRelationship = vi.fn();
    render(
      <RelationshipsScreen
        accounts={fakeVault.accounts}
        onOpenAccount={onOpenAccount}
        onRequestRelationship={onRequestRelationship}
        relationships={fakeVault.relationships}
      />,
    );
    return { onOpenAccount, onRequestRelationship };
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
});
