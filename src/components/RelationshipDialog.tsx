import { ArrowRight, Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { relationshipsForAccount } from "../domain/relationships";
import { RELATIONSHIP_TYPES, type Account, type AccountRelationship, type RelationshipType } from "../domain/types";
import { ServiceIdentityMark } from "./ServiceIdentity";
import { Dialog } from "./ui/Modal";

export const relationshipTypeLabels: Record<RelationshipType, string> = {
  LOGIN_WITH: "Logs in with",
  GOOGLE_SSO: "Google sign-in",
  GITHUB_SSO: "GitHub sign-in",
  RECOVERY_EMAIL: "Recovery email",
  CONNECTED_TO: "Connected to",
  OWNS: "Owns",
  DEPENDS_ON: "Depends on",
  LINKED_ACCOUNT: "Linked account",
  "2FA_DEVICE": "2FA device",
};

export function relationshipDirectionLabel(relationship: AccountRelationship, accountId: string) {
  const incoming = relationship.targetAccountId === accountId;
  const outward = relationshipTypeLabels[relationship.relationshipType];
  if (!incoming) return outward;
  const incomingLabels: Partial<Record<RelationshipType, string>> = {
    LOGIN_WITH: "Login for",
    GOOGLE_SSO: "Google sign-in for",
    GITHUB_SSO: "GitHub sign-in for",
    RECOVERY_EMAIL: "Recovery for",
    OWNS: "Owned by",
    DEPENDS_ON: "Required by",
    "2FA_DEVICE": "2FA for",
  };
  return incomingLabels[relationship.relationshipType] ?? outward;
}

interface RelationshipDialogProps {
  accounts: Account[];
  initialMode?: "manage" | "add";
  initialSourceId?: string;
  managingAccountId?: string;
  onClose: () => void;
  onDelete: (relationship: AccountRelationship) => Promise<void>;
  onOpenAccount?: (account: Account) => void;
  onSave: (relationship: Omit<AccountRelationship, "id"> & { id?: string }) => Promise<void>;
  relationships: AccountRelationship[];
}

export function RelationshipDialog({
  accounts,
  initialMode = "manage",
  initialSourceId,
  managingAccountId,
  onClose,
  onDelete,
  onOpenAccount,
  onSave,
  relationships,
}: RelationshipDialogProps) {
  const [mode, setMode] = useState<"manage" | "add" | "edit">(initialMode);
  const [editing, setEditing] = useState<AccountRelationship | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [removing, setRemoving] = useState(false);
  const managingAccount = accounts.find((account) => account.id === managingAccountId);

  function beginEdit(relationship: AccountRelationship) {
    setEditing(relationship);
    setMode("edit");
  }

  function returnToManager() {
    if (managingAccount) {
      setEditing(null);
      setMode("manage");
    } else {
      onClose();
    }
  }

  async function removeRelationship() {
    if (!editing || removing) return;
    setRemoving(true);
    setRemoveError("");
    try {
      await onDelete(editing);
      setConfirmingRemove(false);
      returnToManager();
    } catch {
      setRemoveError("Unable to remove this relationship. The vault was not changed.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <Dialog active={!confirmingRemove} className="relationship-dialog" labelledBy="relationship-dialog-title" onRequestClose={onClose}>
        <header className="modal-header">
          <div className="modal-heading-icon" aria-hidden="true"><Link2 size={20} /></div>
          <div>
            <p className="eyebrow">Account connections</p>
            <h2 id="relationship-dialog-title">
              {mode === "manage" ? "Manage relationships" : mode === "edit" ? "Edit relationship" : "Add relationship"}
            </h2>
          </div>
          <button aria-label="Close relationship dialog" className="icon-button modal-close" onClick={onClose} type="button"><X size={18} /></button>
        </header>

        {mode === "manage" && managingAccount ? (
          <RelationshipManagerView
            account={managingAccount}
            accounts={accounts}
            onAdd={() => setMode("add")}
            onEdit={beginEdit}
            onOpenAccount={onOpenAccount}
            relationships={relationshipsForAccount(relationships, managingAccount.id)}
          />
        ) : accounts.length < 2 ? (
          <div className="relationship-zero relationship-unavailable">
            <Link2 aria-hidden="true" size={28} />
            <h3>Add another account first</h3>
            <p>A relationship needs two real accounts in this vault.</p>
            <button className="secondary-button" data-autofocus onClick={onClose} type="button">Close</button>
          </div>
        ) : (
          <RelationshipForm
            accounts={accounts}
            editing={editing}
            initialSourceId={editing?.sourceAccountId ?? initialSourceId ?? managingAccountId}
            onCancel={returnToManager}
            onRemove={editing ? () => setConfirmingRemove(true) : undefined}
            onSave={async (draft) => {
              await onSave(draft);
              returnToManager();
            }}
          />
        )}
      </Dialog>

      {confirmingRemove && editing && (
        <Dialog className="confirm-dialog" labelledBy="remove-relationship-title" onRequestClose={() => { if (!removing) setConfirmingRemove(false); }}>
          <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={22} /></div>
          <h2 id="remove-relationship-title">Remove relationship?</h2>
          <p>This connection will be removed from the Vault and Map. The accounts themselves will stay in your vault.</p>
          {removeError && <p className="form-error" role="alert">{removeError}</p>}
          <footer className="dialog-actions">
            <button className="secondary-button" data-autofocus disabled={removing} onClick={() => setConfirmingRemove(false)} type="button">Keep relationship</button>
            <button className="danger-button" disabled={removing} onClick={() => void removeRelationship()} type="button">{removing ? "Removing…" : "Remove relationship"}</button>
          </footer>
        </Dialog>
      )}
    </>
  );
}

function RelationshipManagerView({ account, accounts, onAdd, onEdit, onOpenAccount, relationships }: {
  account: Account;
  accounts: Account[];
  onAdd: () => void;
  onEdit: (relationship: AccountRelationship) => void;
  onOpenAccount?: (account: Account) => void;
  relationships: AccountRelationship[];
}) {
  return (
    <div className="relationship-manager-view">
      <div className="relationship-source-summary"><ServiceIdentityMark account={account} /><div><span>Relationships for</span><strong>{account.accountName}</strong></div></div>
      {relationships.length ? (
        <ul className="relationship-manage-list">
          {relationships.map((relationship) => {
            const counterpartId = relationship.sourceAccountId === account.id ? relationship.targetAccountId : relationship.sourceAccountId;
            const counterpart = accounts.find((candidate) => candidate.id === counterpartId);
            return (
              <li key={relationship.id}>
                <button className="relationship-counterpart" disabled={!counterpart || !onOpenAccount} onClick={() => counterpart && onOpenAccount?.(counterpart)} type="button">
                  {counterpart ? <ServiceIdentityMark account={counterpart} size="small" /> : <span className="missing-identity">?</span>}
                  <span><strong>{counterpart?.accountName ?? "Missing account"}</strong><small>{relationshipDirectionLabel(relationship, account.id)}</small></span>
                </button>
                <button aria-label={`Edit relationship with ${counterpart?.accountName ?? "missing account"}`} className="icon-button" onClick={() => onEdit(relationship)} type="button"><Pencil size={16} /></button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="relationship-zero"><Link2 aria-hidden="true" size={28} /><h3>No relationships yet</h3><p>Connect this account to another real account in your vault.</p></div>
      )}
      <footer className="dialog-actions"><span className="relationship-requirement">{accounts.length < 2 ? "Add a second account to create a relationship." : ""}</span><button className="primary-button" data-autofocus disabled={accounts.length < 2} onClick={onAdd} type="button"><Plus size={16} />Add relationship</button></footer>
    </div>
  );
}

function RelationshipForm({ accounts, editing, initialSourceId, onCancel, onRemove, onSave }: {
  accounts: Account[];
  editing: AccountRelationship | null;
  initialSourceId?: string;
  onCancel: () => void;
  onRemove?: () => void;
  onSave: (relationship: Omit<AccountRelationship, "id"> & { id?: string }) => Promise<void>;
}) {
  const [sourceAccountId, setSourceAccountId] = useState(editing?.sourceAccountId ?? initialSourceId ?? accounts[0]?.id ?? "");
  const [targetAccountId, setTargetAccountId] = useState(editing?.targetAccountId ?? "");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(editing?.relationshipType ?? "DEPENDS_ON");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const targetRef = useRef<HTMLSelectElement>(null);
  const source = accounts.find((account) => account.id === sourceAccountId);
  const target = accounts.find((account) => account.id === targetAccountId);
  const targets = useMemo(() => accounts.filter((account) => account.id !== sourceAccountId), [accounts, sourceAccountId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!sourceAccountId || !targetAccountId) {
      setError("Choose two different accounts before saving this relationship.");
      window.requestAnimationFrame(() => targetRef.current?.focus());
      return;
    }
    setSaving(true);
    try {
      await onSave({ id: editing?.id, sourceAccountId, targetAccountId, relationshipType, notes: notes.trim() });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this relationship.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="relationship-form" onSubmit={submit}>
      {editing ? (
        <div className="relationship-direction-accounts">
          <IdentitySummary account={source} /><ArrowRight aria-hidden="true" size={18} /><IdentitySummary account={target} />
        </div>
      ) : (
        <>
          <label className="field-label" htmlFor="relationship-source">From account<select data-autofocus id="relationship-source" name="relationshipSource" onChange={(event) => { setSourceAccountId(event.target.value); if (event.target.value === targetAccountId) setTargetAccountId(""); }} value={sourceAccountId}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}</select></label>
          <label className="field-label" htmlFor="relationship-target">To account<select aria-describedby={error ? "relationship-error" : undefined} aria-invalid={Boolean(error && !targetAccountId) || undefined} id="relationship-target" name="relationshipTarget" onChange={(event) => setTargetAccountId(event.target.value)} ref={targetRef} value={targetAccountId}><option value="">Choose an account</option>{targets.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}</select></label>
        </>
      )}
      <label className="field-label" htmlFor="relationship-type">Relationship type<select id="relationship-type" name="relationshipType" onChange={(event) => setRelationshipType(event.target.value as RelationshipType)} value={relationshipType}>{RELATIONSHIP_TYPES.map((type) => <option key={type} value={type}>{relationshipTypeLabels[type]}</option>)}</select></label>
      <label className="field-label" htmlFor="relationship-notes"><span className="field-caption">Notes <small>(optional)</small></span><textarea id="relationship-notes" maxLength={200} name="relationshipNotes" onChange={(event) => setNotes(event.target.value)} placeholder="Why are these accounts connected?…" spellCheck="false" value={notes} /></label>
      <div className="direction-preview" aria-live="polite"><span>{source?.accountName ?? "Source account"}</span><ArrowRight aria-hidden="true" size={15} /><strong>{relationshipTypeLabels[relationshipType]}</strong><ArrowRight aria-hidden="true" size={15} /><span>{target?.accountName ?? "Target account"}</span></div>
      {error && <p className="form-error" id="relationship-error" role="alert">{error}</p>}
      <footer className="dialog-actions relationship-form-actions">
        {onRemove && <button className="danger-button subtle-danger" disabled={saving} onClick={onRemove} type="button"><Trash2 size={15} />Remove</button>}
        <span className="action-spacer" />
        <button className="secondary-button" disabled={saving} onClick={onCancel} type="button">Cancel</button>
        <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : editing ? "Save changes" : "Add relationship"}</button>
      </footer>
    </form>
  );
}

function IdentitySummary({ account }: { account?: Account }) {
  return account ? <div className="relationship-identity-summary"><ServiceIdentityMark account={account} size="small" /><span><strong>{account.accountName}</strong><small>{account.serviceName}</small></span></div> : <div className="relationship-identity-summary missing">Missing account</div>;
}
