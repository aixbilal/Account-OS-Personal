import { render, screen } from "@testing-library/react";
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
});
