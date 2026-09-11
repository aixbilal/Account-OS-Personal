import { ChevronDown, Copy, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ACCOUNT_CATEGORIES, AUTHENTICATION_METHODS, type Account } from "../domain/types";
import { copySecretToClipboard } from "../domain/clipboard";
import { generatePassword } from "../domain/passwordGenerator";
import { serviceCatalog } from "../domain/serviceCatalog";
import { ServiceIdentityHero } from "./ServiceIdentity";
import { Dialog, Sheet } from "./ui/Modal";

export type AccountDraft = Omit<Account, "id" | "createdAt" | "updatedAt">;

interface AccountEditorProps {
  account: Account | null;
  onClose: () => void;
  onDelete: (account: Account) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onLock?: () => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
  onSave: (draft: AccountDraft) => Promise<void>;
  relationshipCount?: number;
}

const emptyDraft: AccountDraft = {
  serviceName: "",
  accountName: "",
  category: "Personal",
  username: "",
  email: "",
  website: "",
  password: "",
  authenticationMethod: "Password",
  recoveryInformation: "",
  twoFactorInformation: "",
  notes: "",
};

function draftFor(account: Account | null): AccountDraft {
  if (!account) return { ...emptyDraft };
  return {
    serviceName: account.serviceName,
    accountName: account.accountName,
    category: account.category,
    username: account.username,
    email: account.email,
    website: account.website ?? "",
    password: account.password,
    authenticationMethod: account.authenticationMethod,
    recoveryInformation: account.recoveryInformation,
    twoFactorInformation: account.twoFactorInformation,
    notes: account.notes,
  };
}

export function AccountEditor({ account, onClose, onDelete, onDirtyChange, onLock, onNotify, onSave, relationshipCount = 0 }: AccountEditorProps) {
  const initialDraft = useMemo(() => draftFor(account), [account]);
  const [draft, setDraft] = useState<AccountDraft>(initialDraft);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(account));
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingLock, setConfirmingLock] = useState(false);
  const serviceRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => setDraft(initialDraft), [initialDraft]);
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const protectUnsavedChanges = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnsavedChanges);
    return () => window.removeEventListener("beforeunload", protectUnsavedChanges);
  }, [dirty]);

  function update<K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function requestClose() {
    if (isSaving) return;
    if (dirty) setConfirmingDiscard(true);
    else onClose();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!draft.serviceName.trim() || !draft.accountName.trim()) {
      setError("Service and account title are required.");
      window.requestAnimationFrame(() => {
        if (!draft.serviceName.trim()) serviceRef.current?.focus();
        else titleRef.current?.focus();
      });
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        ...draft,
        serviceName: draft.serviceName.trim(),
        accountName: draft.accountName.trim(),
        email: draft.email.trim(),
        username: draft.username.trim(),
        website: draft.website?.trim() ?? "",
      });
      onNotify?.(account ? "Account changes saved" : "Account saved", "success");
      onClose();
    } catch {
      setError("Unable to save this account. The local vault was not changed.");
      onNotify?.("Failed to save account", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!account) return;
    setIsSaving(true);
    setError("");
    try {
      await onDelete(account);
      onNotify?.("Account deleted", "success");
      onClose();
    } catch {
      setError("Unable to delete this account. The local vault was not changed.");
      setConfirmingDelete(false);
      onNotify?.("Failed to delete account", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function requestEditorLock() {
    if (!onLock || isSaving) return;
    if (dirty) setConfirmingLock(true);
    else onLock();
  }

  return (
    <>
      <Sheet active={!confirmingDiscard && !confirmingDelete && !confirmingLock} className="account-editor" labelledBy="account-editor-title" onRequestClose={requestClose}>
        <header className="editor-header">
          <div><p className="eyebrow">{account ? "Account details" : "New local account"}</p><h2 id="account-editor-title">{account ? "Edit account" : "Add account"}</h2><span>{account ? "Update the details stored in your encrypted local vault." : "Save a new account to your encrypted local vault."}</span></div>
          <div className="editor-header-actions">{onLock && <button aria-label="Lock vault" className="icon-button" onClick={requestEditorLock} title="Lock vault" type="button"><LockKeyhole size={18} /></button>}<button aria-label="Close account editor" className="icon-button" onClick={requestClose} type="button"><X size={19} /></button></div>
        </header>
        {account && <div className="editor-identity"><ServiceIdentityHero account={{ ...account, ...draft }} /></div>}
        <form className="editor-form" noValidate onSubmit={submit}>
          <div className="editor-scroll">
            <section className="editor-section" aria-labelledby="essential-details-title">
              <div className="editor-section-heading"><h3 id="essential-details-title">Essential details</h3><p>Everything needed for a common sign-in.</p></div>
              <div className="form-grid editor-essential">
                <Field ariaDescribedBy={error ? "account-editor-error" : undefined} autoComplete="organization" autoFocus={!account} inputRef={serviceRef} invalid={Boolean(error && !draft.serviceName.trim())} label="Service" list="local-service-catalog" name="serviceName" onChange={(value) => update("serviceName", value)} required value={draft.serviceName} />
                <Field ariaDescribedBy={error ? "account-editor-error" : undefined} autoComplete="off" autoFocus={Boolean(account)} inputRef={titleRef} invalid={Boolean(error && !draft.accountName.trim())} label="Account title" name="accountName" onChange={(value) => update("accountName", value)} required value={draft.accountName} />
                <Field autoComplete="email" label="Email" name="email" onChange={(value) => update("email", value)} type="email" value={draft.email} />
                <Field autoComplete="username" label="Username" name="username" onChange={(value) => update("username", value)} value={draft.username} />
                <Field autoComplete="url" label="Website" name="website" onChange={(value) => update("website", value)} placeholder="https://example.com…" type="url" value={draft.website ?? ""} />
                <CredentialField onChange={(value) => update("password", value)} onNotify={onNotify} value={draft.password} />
              </div>
            </section>
            <button aria-expanded={detailsOpen} className="details-toggle" onClick={() => setDetailsOpen((open) => !open)} type="button"><span><strong>{detailsOpen ? "Hide additional details" : "More details"}</strong><small>Category, authentication, recovery, 2FA, and notes</small></span><ChevronDown aria-hidden="true" data-open={detailsOpen} size={18} /></button>
            {detailsOpen && (
              <section className="editor-section editor-more" aria-label="Additional account details">
                <div className="form-grid">
                  <SelectField label="Category" name="category" value={draft.category} values={ACCOUNT_CATEGORIES} onChange={(value) => update("category", value as AccountDraft["category"])} />
                  <SelectField label="Authentication method" name="authenticationMethod" value={draft.authenticationMethod} values={AUTHENTICATION_METHODS} onChange={(value) => update("authenticationMethod", value as AccountDraft["authenticationMethod"])} />
                  <Field autoComplete="off" label="2FA metadata" name="twoFactorInformation" onChange={(value) => update("twoFactorInformation", value)} placeholder="Authenticator app, security key…" value={draft.twoFactorInformation} />
                  <Field autoComplete="off" label="Recovery information" name="recoveryInformation" onChange={(value) => update("recoveryInformation", value)} value={draft.recoveryInformation} />
                </div>
                <label className="field-label" htmlFor="account-notes"><span className="field-caption">Notes <small>(optional)</small></span><textarea id="account-notes" name="notes" onChange={(event) => update("notes", event.target.value)} spellCheck="false" value={draft.notes} /></label>
              </section>
            )}
            {error && <p className="form-error" id="account-editor-error" role="alert">{error}</p>}
          </div>
          <footer className="editor-actions">
            {account && <button className="danger-button subtle-danger" disabled={isSaving} onClick={() => setConfirmingDelete(true)} type="button"><Trash2 size={15} />Delete account</button>}
            <span className="action-spacer" />
            <button className="secondary-button" disabled={isSaving} onClick={requestClose} type="button">Cancel</button>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving && <LoaderCircle className="spin" size={16} />}{isSaving ? "Saving…" : account ? "Save changes" : "Save account"}</button>
          </footer>
        </form>
        <datalist id="local-service-catalog">{serviceCatalog.map((service) => <option key={service.id} value={service.displayName}>{service.domains[0]}</option>)}</datalist>
      </Sheet>

      {confirmingDiscard && (
        <Dialog className="confirm-dialog" labelledBy="discard-editor-title" onRequestClose={() => setConfirmingDiscard(false)}>
          <div className="confirm-icon warning" aria-hidden="true"><KeyRound size={22} /></div>
          <h2 id="discard-editor-title">Discard unsaved changes?</h2>
          <p>Your edits have not been saved to the local vault.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus onClick={() => setConfirmingDiscard(false)} type="button">Keep editing</button><button className="primary-button" onClick={onClose} type="button">Discard changes</button></footer>
        </Dialog>
      )}

      {confirmingDelete && account && (
        <Dialog className="confirm-dialog" labelledBy="delete-account-title" onRequestClose={() => setConfirmingDelete(false)}>
          <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={22} /></div>
          <h2 id="delete-account-title">Delete {account.accountName}?</h2>
          <p>This permanently deletes the account{relationshipCount ? ` and removes its ${relationshipCount} relationship${relationshipCount === 1 ? "" : "s"}` : ""}. This action cannot be undone.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus onClick={() => setConfirmingDelete(false)} type="button">Cancel</button><button className="danger-button" disabled={isSaving} onClick={() => void remove()} type="button">Delete account</button></footer>
        </Dialog>
      )}

      {confirmingLock && onLock && (
        <Dialog className="confirm-dialog" labelledBy="lock-editor-title" onRequestClose={() => setConfirmingLock(false)}>
          <div className="confirm-icon warning" aria-hidden="true"><LockKeyhole size={22} /></div>
          <h2 id="lock-editor-title">Discard edits and lock?</h2>
          <p>Locking now will discard these unsaved edits before the decrypted vault leaves memory.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus onClick={() => setConfirmingLock(false)} type="button">Keep editing</button><button className="primary-button" onClick={onLock} type="button">Discard and lock</button></footer>
        </Dialog>
      )}
    </>
  );
}

function Field({ ariaDescribedBy, autoComplete, autoFocus, inputRef, invalid, label, list, name, onChange, placeholder, required, type = "text", value }: {
  ariaDescribedBy?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  invalid?: boolean;
  label: string;
  list?: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  const id = `account-${name}`;
  return <label className="field-label" htmlFor={id}><span className="field-caption">{label}{!required && <small> (optional)</small>}</span><input aria-describedby={ariaDescribedBy} aria-invalid={invalid || undefined} autoComplete={autoComplete} data-autofocus={autoFocus || undefined} id={id} list={list} name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} ref={inputRef} required={required} spellCheck="false" type={type} value={value} /></label>;
}

function SelectField({ label, name, onChange, value, values }: { label: string; name: string; onChange: (value: string) => void; value: string; values: readonly string[] }) {
  const id = `account-${name}`;
  return <label className="field-label" htmlFor={id}>{label}<select id={id} name={name} onChange={(event) => onChange(event.target.value)} value={value}>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function CredentialField({ onChange, onNotify, value }: { onChange: (value: string) => void; onNotify?: (message: string, tone?: "success" | "error" | "info") => void; value: string }) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [visible, setVisible] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  async function copyPassword() {
    if (!value) return;
    try {
      // Auto-cleared from the clipboard after a short delay (domain/clipboard).
      await copySecretToClipboard(value);
      onNotify?.("Password copied", "success");
    } catch {
      onNotify?.("Password copy unavailable", "error");
    }
  }

  function generate() {
    try {
      onChange(generatePassword({ length, uppercase, lowercase, numbers, symbols }));
      onNotify?.("New password generated", "info");
    } catch (reason) {
      onNotify?.(reason instanceof Error ? reason.message : "Unable to generate a password.", "error");
    }
  }

  return (
    <div className="credential-field">
      <label className="field-label" htmlFor="account-password"><span className="field-caption">Password / sensitive value <small>(optional)</small></span></label>
      <div className="secret-input editor-secret-input">
        <input autoComplete="new-password" id="account-password" name="password" onChange={(event) => onChange(event.target.value)} spellCheck="false" type={visible ? "text" : "password"} value={value} />
        <button aria-label={visible ? "Hide password" : "Reveal password"} onClick={() => setVisible((current) => !current)} type="button">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        <button aria-label="Generate password" onClick={generate} type="button"><Sparkles size={17} /></button>
        <button aria-label="Copy password" disabled={!value} onClick={() => void copyPassword()} type="button"><Copy size={17} /></button>
      </div>
      <button aria-expanded={generatorOpen} className="generator-toggle" onClick={() => setGeneratorOpen((open) => !open)} type="button">Generator options <ChevronDown aria-hidden="true" data-open={generatorOpen} size={14} /></button>
      {generatorOpen && <div className="generator-options"><label>Length<input aria-label="Password length" max="64" min="8" name="generatedPasswordLength" onChange={(event) => setLength(Number(event.target.value))} type="number" value={length} /></label><label><input checked={uppercase} name="generatedPasswordUppercase" onChange={(event) => setUppercase(event.target.checked)} type="checkbox" />Uppercase</label><label><input checked={lowercase} name="generatedPasswordLowercase" onChange={(event) => setLowercase(event.target.checked)} type="checkbox" />Lowercase</label><label><input checked={numbers} name="generatedPasswordNumbers" onChange={(event) => setNumbers(event.target.checked)} type="checkbox" />Numbers</label><label><input checked={symbols} name="generatedPasswordSymbols" onChange={(event) => setSymbols(event.target.checked)} type="checkbox" />Symbols</label></div>}
    </div>
  );
}
