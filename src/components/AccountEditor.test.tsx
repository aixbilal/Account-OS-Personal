import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { AccountEditor } from "./AccountEditor";

describe("AccountEditor local relationships", () => {
  const account = fakeVault.accounts.find((item) => item.id === "account-github-test")!;

  function renderEditor() {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onSaveRelationship = vi.fn().mockResolvedValue(undefined);
    render(<AccountEditor account={account} accounts={fakeVault.accounts} relationships={fakeVault.relationships} onClose={vi.fn()} onDelete={vi.fn()} onDeleteRelationship={vi.fn()} onSave={onSave} onSaveRelationship={onSaveRelationship} />);
    return { onSave, onSaveRelationship };
  }

  it("saves a local relationship without submitting the enclosing account form", async () => {
    const user = userEvent.setup();
    const { onSave, onSaveRelationship } = renderEditor();

    await user.selectOptions(screen.getByLabelText("Related account"), "account-facebook-test");
    await user.selectOptions(screen.getByLabelText("Relationship type"), "DEPENDS_ON");
    await user.click(screen.getByRole("button", { name: "Add relationship" }));

    expect(onSaveRelationship).toHaveBeenCalledWith(expect.objectContaining({
      sourceAccountId: "account-github-test",
      targetAccountId: "account-facebook-test",
      relationshipType: "DEPENDS_ON",
    }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a local validation error instead of silently ignoring an incomplete relationship", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Add relationship" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a related account before saving this relationship.");
  });
});
