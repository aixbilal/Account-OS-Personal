import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ACCOUNT_CATEGORIES, AUTHENTICATION_METHODS, RELATIONSHIP_TYPES, type Account, type AccountRelationship, type RelationshipType } from "../domain/types";
import { generatePassword } from "../domain/passwordGenerator";
import { serviceCatalog } from "../domain/serviceCatalog";

export type AccountDraft = Omit<Account, "id" | "createdAt" | "updatedAt">;

interface AccountEditorProps {
  account: Account | null;
  accounts: Account[];
  relationships: AccountRelationship[];
  onClose: () => void;
  onDelete: (account: Account) => Promise<void>;
  onSave: (draft: AccountDraft) => Promise<void>;
  onSaveRelationship: (relationship: Omit<AccountRelationship, "id"> & { id?: string }) => Promise<void>;
  onDeleteRelationship: (relationship: AccountRelationship) => Promise<void>;
}

const emptyDraft: AccountDraft = {
  serviceName: "",
  accountName: "",
  category: "Personal",
  username: "",
  email: "",
  password: "",
  authenticationMethod: "Password",
  recoveryInformation: "",
  twoFactorInformation: "",
  notes: "",
};

export function AccountEditor({ account, accounts, relationships, onClose, onDelete, onSave, onSaveRelationship, onDeleteRelationship }: AccountEditorProps) {
  const [draft, setDraft] = useState<AccountDraft>(account ?? emptyDraft);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => setDraft(account ?? emptyDraft), [account]);

  function update<K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!draft.serviceName.trim() || !draft.accountName.trim()) {
      setError("Service and account title are required.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this account.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!account || !window.confirm(`Delete ${account.accountName}? This cannot be undone.`)) return;
    setIsSaving(true);
    try {
      await onDelete(account);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete this account.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <section aria-labelledby="account-editor-title" className="account-editor" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="editor-header">
          <div><p className="eyebrow">{account ? "Account details" : "New account"}</p><h2 id="account-editor-title">{account ? account.accountName : "Add account"}</h2></div>
          <button aria-label="Close account editor" className="icon-button" onClick={onClose} type="button"><X size={18} /></button>
        </header>
        <form className="editor-form" onSubmit={submit}>
          <div className="form-grid">
            <Field label="Service" list="local-service-catalog" value={draft.serviceName} onChange={(value) => update("serviceName", value)} required />
            <Field label="Account title" value={draft.accountName} onChange={(value) => update("accountName", value)} required />
            <SelectField label="Category" value={draft.category} values={ACCOUNT_CATEGORIES} onChange={(value) => update("category", value as AccountDraft["category"])} />
            <SelectField label="Authentication" value={draft.authenticationMethod} values={AUTHENTICATION_METHODS} onChange={(value) => update("authenticationMethod", value as AccountDraft["authenticationMethod"])} />
            <Field label="Email" type="email" value={draft.email} onChange={(value) => update("email", value)} />
            <Field label="Username" value={draft.username} onChange={(value) => update("username", value)} />
            <CredentialField
              onChange={(value) => update("password", value)}
              passwordVisible={passwordVisible}
              setPasswordVisible={setPasswordVisible}
              value={draft.password}
            />
            <Field label="2FA metadata" value={draft.twoFactorInformation} onChange={(value) => update("twoFactorInformation", value)} />
          </div>
          <Field label="Recovery information" value={draft.recoveryInformation} onChange={(value) => update("recoveryInformation", value)} />
          <label className="field-label">Notes<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          {account && <RelationshipManager account={account} accounts={accounts} relationships={relationships} onDelete={onDeleteRelationship} onSave={onSaveRelationship} />}
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="editor-actions">
            {account && <button className="danger-button" disabled={isSaving} onClick={remove} type="button">Delete account</button>}
            <div><button className="secondary-button" onClick={onClose} type="button">Cancel</button><button className="unlock-submit" disabled={isSaving} type="submit">{isSaving ? "Saving…" : "Save account"}</button></div>
          </footer>
        </form>
        <datalist id="local-service-catalog">{serviceCatalog.map((service) => <option key={service.id} value={service.displayName}>{service.domains[0]}</option>)}</datalist>
      </section>
    </div>
  );
}

function RelationshipManager({ account, accounts, relationships, onDelete, onSave }: { account: Account; accounts: Account[]; relationships: AccountRelationship[]; onDelete: (relationship: AccountRelationship) => Promise<void>; onSave: (relationship: Omit<AccountRelationship, "id"> & { id?: string }) => Promise<void> }) {
  const [targetAccountId, setTargetAccountId] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("CONNECTED_TO");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ownRelationships = relationships.filter((item) => item.sourceAccountId === account.id || item.targetAccountId === account.id);
  const targets = accounts.filter((item) => item.id !== account.id);

  async function submit() {
    if (!targetAccountId) {
      setError("Choose a related account before saving this relationship.");
      return;
    }
    setError("");
    try {
      const existing = editing ? relationships.find((item) => item.id === editing) : undefined;
      const incoming = existing?.targetAccountId === account.id;
      await onSave({
        id: editing ?? undefined,
        sourceAccountId: incoming ? targetAccountId : account.id,
        targetAccountId: incoming ? account.id : targetAccountId,
        relationshipType,
        notes,
      });
      setTargetAccountId(""); setRelationshipType("CONNECTED_TO"); setNotes(""); setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this relationship.");
    }
  }
  function edit(item: AccountRelationship) {
    setEditing(item.id);
    setTargetAccountId(item.sourceAccountId === account.id ? item.targetAccountId : item.sourceAccountId);
    setRelationshipType(item.relationshipType); setNotes(item.notes);
  }
  return <section className="relationship-manager" aria-label="Account relationships">
    <div><p className="eyebrow">Relationships</p><h3>Connected accounts</h3></div>
    {ownRelationships.length ? <ul className="relationship-list">{ownRelationships.map((item) => {
      const counterpart = accounts.find((candidate) => candidate.id === (item.sourceAccountId === account.id ? item.targetAccountId : item.sourceAccountId));
      return <li key={item.id}><span><strong>{item.relationshipType}</strong>{counterpart?.accountName ?? "Missing account"}</span><div><button onClick={() => edit(item)} type="button">Edit</button><button onClick={() => { if (window.confirm("Remove this relationship?")) void onDelete(item); }} type="button">Remove</button></div></li>;
    })}</ul> : <p className="relationship-empty">No account relationships yet.</p>}
    {targets.length > 0 && <div className="relationship-form">
      <select aria-label="Related account" onChange={(event) => setTargetAccountId(event.target.value)} value={targetAccountId}><option value="">Choose account</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.accountName}</option>)}</select>
      <select aria-label="Relationship type" onChange={(event) => setRelationshipType(event.target.value as RelationshipType)} value={relationshipType}>{RELATIONSHIP_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
      <input aria-label="Relationship notes" onChange={(event) => setNotes(event.target.value)} placeholder="Relationship notes" value={notes} />
      <button className="secondary-button" onClick={submit} type="button">{editing ? "Update relationship" : "Add relationship"}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>}
  </section>;
}

function Field({ label, list, onChange, required, type = "text", value }: { label: string; list?: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return <label className="field-label">{label}<input list={list} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>;
}

function SelectField({ label, onChange, value, values }: { label: string; onChange: (value: string) => void; value: string; values: readonly string[] }) {
  return <label className="field-label">{label}<select onChange={(event) => onChange(event.target.value)} value={value}>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function CredentialField({ onChange, passwordVisible, setPasswordVisible, value }: { onChange: (value: string) => void; passwordVisible: boolean; setPasswordVisible: (visible: boolean) => void; value: string }) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [copyStatus, setCopyStatus] = useState("");

  async function copyPassword() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }
  }

  function generate() {
    try {
      onChange(generatePassword({ length, uppercase, lowercase, numbers, symbols }));
      setPasswordVisible(true);
    } catch (reason) {
      setCopyStatus(reason instanceof Error ? reason.message : "Unable to generate a password.");
    }
  }

  return <div className="credential-field">
    <label className="field-label">Password / sensitive value
      <div className="secret-input"><input onChange={(event) => onChange(event.target.value)} type={passwordVisible ? "text" : "password"} value={value} /><button onClick={() => setPasswordVisible(!passwordVisible)} type="button">{passwordVisible ? "Hide" : "Reveal"}</button></div>
    </label>
    <div className="credential-controls">
      <label>Length <input aria-label="Password length" max="64" min="8" onChange={(event) => setLength(Number(event.target.value))} type="number" value={length} /></label>
      <label><input checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} type="checkbox" />Uppercase</label>
      <label><input checked={lowercase} onChange={(event) => setLowercase(event.target.checked)} type="checkbox" />Lowercase</label>
      <label><input checked={numbers} onChange={(event) => setNumbers(event.target.checked)} type="checkbox" />Numbers</label>
      <label><input checked={symbols} onChange={(event) => setSymbols(event.target.checked)} type="checkbox" />Symbols</label>
      <button className="secondary-button" onClick={generate} type="button">Generate</button>
      <button className="secondary-button" disabled={!value} onClick={copyPassword} type="button">Copy</button>
      {copyStatus && <span role="status">{copyStatus}</span>}
    </div>
  </div>;
}
