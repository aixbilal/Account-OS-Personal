import { ChevronDown, Copy, Eye, EyeOff, FileText, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, Tag, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ACCOUNT_CATEGORIES, AUTHENTICATION_METHODS, type Account } from "../domain/types";
import { copySecretToClipboard } from "../domain/clipboard";
import { evaluatePasswordStrength } from "../domain/passwordStrength";
import { generatePassword } from "../domain/passwordGenerator";
import { serviceCatalog } from "../domain/serviceCatalog";
import { formatTwoFactorInformation, parseTwoFactorInformation, TWO_FACTOR_TYPES, twoFactorTypeExamplePlaceholder, type TwoFactorType } from "../domain/twoFactorFormat";
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
                <Field ariaDescribedBy={error ? "account-editor-error" : undefined} autoComplete="organization" autoFocus={!account} caption="Choose a service or add a custom entry" inputRef={serviceRef} invalid={Boolean(error && !draft.serviceName.trim())} label="Service" list="local-service-catalog" name="serviceName" onChange={(value) => update("serviceName", value)} required value={draft.serviceName} />
                <Field ariaDescribedBy={error ? "account-editor-error" : undefined} autoComplete="off" autoFocus={Boolean(account)} caption="A friendly name to easily identify this account" inputRef={titleRef} invalid={Boolean(error && !draft.accountName.trim())} label="Account title" name="accountName" onChange={(value) => update("accountName", value)} required value={draft.accountName} />
                <SelectField icon={<Tag size={15} />} label="Category" name="category" onChange={(value) => update("category", value as AccountDraft["category"])} value={draft.category} values={ACCOUNT_CATEGORIES} />
                <SelectField icon={<LockKeyhole size={15} />} label="Authentication method" name="authenticationMethod" onChange={(value) => update("authenticationMethod", value as AccountDraft["authenticationMethod"])} value={draft.authenticationMethod} values={AUTHENTICATION_METHODS} />
              </div>
            </section>

            <section className="editor-section" aria-labelledby="account-details-title">
              <div className="editor-section-heading"><h3 id="account-details-title">Account details</h3></div>
              <div className="form-grid editor-essential">
                <Field autoComplete="email" label="Email" name="email" onChange={(value) => update("email", value)} type="email" value={draft.email} />
                <Field autoComplete="username" caption="If different from email" label="Username" name="username" onChange={(value) => update("username", value)} value={draft.username} />
                <Field autoComplete="url" fullWidth label="Website" name="website" onChange={(value) => update("website", value)} placeholder="https://example.com…" type="url" value={draft.website ?? ""} />
                <CredentialField onChange={(value) => update("password", value)} onNotify={onNotify} value={draft.password} />
              </div>
            </section>

            <section className="editor-section" aria-labelledby="security-details-title">
              <div className="editor-section-heading"><h3 id="security-details-title">2FA / additional security</h3></div>
              <TwoFactorFields key={account?.id ?? "new"} onChange={(value) => update("twoFactorInformation", value)} value={draft.twoFactorInformation} />
              <Field icon={<FileText size={15} />} label="Recovery information" name="recoveryInformation" onChange={(value) => update("recoveryInformation", value)} placeholder="e.g. recovery email, backup codes, or notes" value={draft.recoveryInformation} />
              <label className="field-label" htmlFor="account-notes"><span className="field-caption">Notes <small>(optional)</small></span><span className="field-with-icon"><FileText aria-hidden="true" className="field-inline-icon" size={15} /><textarea id="account-notes" name="notes" onChange={(event) => update("notes", event.target.value)} spellCheck="false" value={draft.notes} /></span></label>
            </section>
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

function Field({ ariaDescribedBy, autoComplete, autoFocus, caption, fullWidth, icon, inputRef, invalid, label, list, name, onChange, placeholder, required, type = "text", value }: {
  ariaDescribedBy?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  caption?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
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
  const hintId = caption ? `${id}-hint` : undefined;
  return (
    <div className={`field-label${fullWidth ? " field-span-2" : ""}`}>
      <label className="field-caption" htmlFor={id}>{label}{!required && <small> (optional)</small>}</label>
      <span className={icon ? "field-with-icon" : undefined}>
        {icon && <span aria-hidden="true" className="field-inline-icon">{icon}</span>}
        <input aria-describedby={[ariaDescribedBy, hintId].filter(Boolean).join(" ") || undefined} aria-invalid={invalid || undefined} autoComplete={autoComplete} data-autofocus={autoFocus || undefined} id={id} list={list} name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} ref={inputRef} required={required} spellCheck="false" type={type} value={value} />
      </span>
      {caption && <small className="field-hint" id={hintId}>{caption}</small>}
    </div>
  );
}

function SelectField({ icon, label, name, onChange, value, values }: { icon?: React.ReactNode; label: string; name: string; onChange: (value: string) => void; value: string; values: readonly string[] }) {
  const id = `account-${name}`;
  return (
    <div className="field-label">
      <label className="field-caption" htmlFor={id}>{label}</label>
      <span className={icon ? "field-with-icon" : undefined}>
        {icon && <span aria-hidden="true" className="field-inline-icon">{icon}</span>}
        <select id={id} name={name} onChange={(event) => onChange(event.target.value)} value={value}>{values.map((item) => <option key={item}>{item}</option>)}</select>
      </span>
    </div>
  );
}

/**
 * Uncontrolled-by-parent-value on purpose: `AccountEditor` only stores the
 * combined string, so this component owns the split type/detail state from
 * its own initial parse and pushes the recombined string upward on every
 * change. The parent remounts it (via `key={account?.id ?? "new"}`) when a
 * different account is opened, so it always starts from the right parsed
 * value rather than needing an effect to resync mid-life.
 */
function TwoFactorFields({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const [type, setType] = useState<TwoFactorType>(() => parseTwoFactorInformation(value).type);
  const [detail, setDetail] = useState(() => parseTwoFactorInformation(value).detail);

  function changeType(nextType: TwoFactorType) {
    setType(nextType);
    onChange(formatTwoFactorInformation(nextType, detail));
  }

  function changeDetail(nextDetail: string) {
    setDetail(nextDetail);
    onChange(formatTwoFactorInformation(type, nextDetail));
  }

  return (
    <div className="form-grid two-factor-fields">
      <SelectField icon={<ShieldCheck size={15} />} label="2FA type" name="twoFactorType" onChange={(next) => changeType(next as TwoFactorType)} value={type} values={TWO_FACTOR_TYPES} />
      <Field autoComplete="off" label="2FA detail" name="twoFactorDetail" onChange={changeDetail} placeholder={twoFactorTypeExamplePlaceholder[type] ?? "Optional detail"} value={detail} />
    </div>
  );
}

function CredentialField({ onChange, onNotify, value }: { onChange: (value: string) => void; onNotify?: (message: string, tone?: "success" | "error" | "info") => void; value: string }) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [visible, setVisible] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  // Most values saved here are passwords for pre-existing external accounts
  // whose password policy this app doesn't control, not new credentials
  // being created here - so weakness is a suggestion, never a gate (see
  // domain/passwordStrength.ts). Reset the dismissal once the value stops
  // being weak, so a later weak paste/edit surfaces the suggestion again
  // instead of staying silenced from an earlier, unrelated value.
  const isWeak = value.length > 0 && evaluatePasswordStrength(value).some((check) => !check.met);
  useEffect(() => { if (!isWeak) setSuggestionDismissed(false); }, [isWeak]);

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
      <div className="credential-row">
        <input autoComplete="new-password" className="credential-input" id="account-password" name="password" onChange={(event) => onChange(event.target.value)} spellCheck="false" type={visible ? "text" : "password"} value={value} />
        <button aria-label={visible ? "Hide password" : "Reveal password"} className="icon-button icon-button-outline" onClick={() => setVisible((current) => !current)} type="button">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        <button className="secondary-button compact-button" onClick={generate} type="button"><Sparkles size={15} />Generate</button>
        <button className="field-copy" disabled={!value} onClick={() => void copyPassword()} type="button"><Copy size={15} />Copy</button>
      </div>
      {/* Never blocks saving - a password manager mostly stores passwords
          for pre-existing external accounts whose policy it doesn't set,
          so a persistent requirements checklist would misrepresent what's
          actually enforced here. Instead: a soft, dismissible nudge toward
          the existing Generate function, shown only while the value looks
          weak (domain/passwordStrength.ts's same five criteria - applied
          the same way whether this holds an actual password or another
          kind of sensitive value). */}
      {isWeak && !suggestionDismissed && (
        <div className="password-weak-suggestion" role="status">
          <span>This looks weak — generate a stronger one instead?</span>
          <div className="password-weak-suggestion-actions">
            <button className="text-button" onClick={generate} type="button"><Sparkles size={13} />Generate</button>
            <button aria-label="Dismiss weak password suggestion" className="icon-button" onClick={() => setSuggestionDismissed(true)} type="button"><X size={13} /></button>
          </div>
        </div>
      )}
      <button aria-expanded={generatorOpen} className="generator-toggle" onClick={() => setGeneratorOpen((open) => !open)} type="button">Generator options <ChevronDown aria-hidden="true" data-open={generatorOpen} size={14} /></button>
      {generatorOpen && <div className="generator-options"><label>Length<input aria-label="Password length" max="64" min="8" name="generatedPasswordLength" onChange={(event) => setLength(Number(event.target.value))} type="number" value={length} /></label><label><input checked={uppercase} name="generatedPasswordUppercase" onChange={(event) => setUppercase(event.target.checked)} type="checkbox" />Uppercase</label><label><input checked={lowercase} name="generatedPasswordLowercase" onChange={(event) => setLowercase(event.target.checked)} type="checkbox" />Lowercase</label><label><input checked={numbers} name="generatedPasswordNumbers" onChange={(event) => setNumbers(event.target.checked)} type="checkbox" />Numbers</label><label><input checked={symbols} name="generatedPasswordSymbols" onChange={(event) => setSymbols(event.target.checked)} type="checkbox" />Symbols</label></div>}
    </div>
  );
}

