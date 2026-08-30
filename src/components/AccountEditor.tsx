import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ACCOUNT_CATEGORIES, AUTHENTICATION_METHODS, type Account } from "../domain/types";

export type AccountDraft = Omit<Account, "id" | "createdAt" | "updatedAt">;

interface AccountEditorProps {
  account: Account | null;
  onClose: () => void;
  onDelete: (account: Account) => Promise<void>;
  onSave: (draft: AccountDraft) => Promise<void>;
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

export function AccountEditor({ account, onClose, onDelete, onSave }: AccountEditorProps) {
  const [draft, setDraft] = useState<AccountDraft>(account ?? emptyDraft);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
            <Field label="Service" value={draft.serviceName} onChange={(value) => update("serviceName", value)} required />
            <Field label="Account title" value={draft.accountName} onChange={(value) => update("accountName", value)} required />
            <SelectField label="Category" value={draft.category} values={ACCOUNT_CATEGORIES} onChange={(value) => update("category", value as AccountDraft["category"])} />
            <SelectField label="Authentication" value={draft.authenticationMethod} values={AUTHENTICATION_METHODS} onChange={(value) => update("authenticationMethod", value as AccountDraft["authenticationMethod"])} />
            <Field label="Email" type="email" value={draft.email} onChange={(value) => update("email", value)} />
            <Field label="Username" value={draft.username} onChange={(value) => update("username", value)} />
            <Field label="Password / sensitive value" type="password" value={draft.password} onChange={(value) => update("password", value)} />
            <Field label="2FA metadata" value={draft.twoFactorInformation} onChange={(value) => update("twoFactorInformation", value)} />
          </div>
          <Field label="Recovery information" value={draft.recoveryInformation} onChange={(value) => update("recoveryInformation", value)} />
          <label className="field-label">Notes<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="editor-actions">
            {account && <button className="danger-button" disabled={isSaving} onClick={remove} type="button">Delete account</button>}
            <div><button className="secondary-button" onClick={onClose} type="button">Cancel</button><button className="unlock-submit" disabled={isSaving} type="submit">{isSaving ? "Saving…" : "Save account"}</button></div>
          </footer>
        </form>
      </section>
    </div>
  );
}

function Field({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return <label className="field-label">{label}<input onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>;
}

function SelectField({ label, onChange, value, values }: { label: string; onChange: (value: string) => void; value: string; values: readonly string[] }) {
  return <label className="field-label">{label}<select onChange={(event) => onChange(event.target.value)} value={value}>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}
