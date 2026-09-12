import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeVault } from "../data/fakeVault";
import type { AccountRelationship } from "../domain/types";
import { RelationshipDialog, relationshipDirectionLabel } from "./RelationshipDialog";

describe("relationshipDirectionLabel", () => {
  const relationship: AccountRelationship = {
    id: "relationship-direction-test",
    sourceAccountId: "source-test",
    targetAccountId: "target-test",
    relationshipType: "DEPENDS_ON",
    notes: "Synthetic direction test.",
  };

  it("describes both sides in friendly directional language", () => {
    expect(relationshipDirectionLabel(relationship, "source-test")).toBe("Depends on");
    expect(relationshipDirectionLabel(relationship, "target-test")).toBe("Required by");
  });
});

describe("RelationshipDialog", () => {
  function renderAddDialog() {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <RelationshipDialog
        accounts={fakeVault.accounts}
        initialMode="add"
        initialSourceId="account-github-test"
        onClose={onClose}
        onDelete={vi.fn()}
        onSave={onSave}
        relationships={fakeVault.relationships}
      />,
    );
    return { onClose, onSave };
  }

  it("previews and saves a friendly directed relationship", async () => {
    const user = userEvent.setup();
    const { onClose, onSave } = renderAddDialog();

    await user.selectOptions(screen.getByLabelText("To account"), "account-facebook-test");
    await user.selectOptions(screen.getByLabelText("Relationship type"), "DEPENDS_ON");
    await user.type(screen.getByLabelText(/Notes/), "  Synthetic dependency note.  ");

    const preview = screen.getByText("Depends on", { selector: "strong" }).closest("div");
    expect(preview).toHaveTextContent("GitHub TEST");
    expect(preview).toHaveTextContent("Facebook TEST");
    expect(screen.queryByText("DEPENDS_ON")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add relationship" }));
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      sourceAccountId: "account-github-test",
      targetAccountId: "account-facebook-test",
      relationshipType: "DEPENDS_ON",
      notes: "Synthetic dependency note.",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps an incomplete relationship local and reports validation", async () => {
    const user = userEvent.setup();
    const { onClose, onSave } = renderAddDialog();

    await user.click(screen.getByRole("button", { name: "Add relationship" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose two different accounts");
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses incoming-friendly labels in the manager instead of raw enum values", () => {
    render(
      <RelationshipDialog
        accounts={fakeVault.accounts}
        managingAccountId="account-google-personal-test"
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        relationships={fakeVault.relationships}
      />,
    );

    expect(screen.getAllByText("Google sign-in for").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Recovery for").length).toBeGreaterThan(0);
    expect(screen.queryByText("GOOGLE_SSO")).not.toBeInTheDocument();
  });

  // Item 1 (V3 fixture pass): the Relationships screen's per-row "..." menu
  // opens straight into editing/removing one specific relationship, instead
  // of the full manage list - same edit/remove form and remove-confirm
  // dialog either way, just a different, more direct entry point.
  it("jumps straight to editing one relationship when opened with initialMode=\"edit\"", () => {
    render(
      <RelationshipDialog
        accounts={fakeVault.accounts}
        initialEditingId="relationship-github-supabase-test"
        initialMode="edit"
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        relationships={fakeVault.relationships}
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit relationship" })).toBeInTheDocument();
    expect(screen.getAllByText("Supabase TEST").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GitHub TEST").length).toBeGreaterThan(0);
  });

  it("opens directly into the remove confirmation with autoConfirmRemove, and closes on cancel without deleting", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDelete = vi.fn();
    render(
      <RelationshipDialog
        accounts={fakeVault.accounts}
        autoConfirmRemove
        initialEditingId="relationship-github-supabase-test"
        initialMode="edit"
        onClose={onClose}
        onDelete={onDelete}
        onSave={vi.fn()}
        relationships={fakeVault.relationships}
      />,
    );

    const confirmation = screen.getByRole("dialog", { name: "Remove relationship?" });
    await user.click(within(confirmation).getByRole("button", { name: "Keep relationship" }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("removes the exact relationship an autoConfirmRemove was opened for", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <RelationshipDialog
        accounts={fakeVault.accounts}
        autoConfirmRemove
        initialEditingId="relationship-github-supabase-test"
        initialMode="edit"
        onClose={onClose}
        onDelete={onDelete}
        onSave={vi.fn()}
        relationships={fakeVault.relationships}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove relationship" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "relationship-github-supabase-test" }));
    // No managingAccountId was given for this entry point, so removal
    // closes the dialog outright instead of falling back to a manage list.
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
