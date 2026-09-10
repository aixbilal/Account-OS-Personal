import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AccountOsBrand } from "./Brand";

interface VaultEntryProps {
  hasVault: boolean;
  onCreate: (password: string) => Promise<void>;
  onUnlock: (password: string) => Promise<void>;
}

export function passwordStrength(password: string) {
  if (!password) return { score: 0, label: "Enter a password" };
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return {
    score,
    label: score <= 1 ? "Weak password" : score === 2 ? "Fair password strength" : score === 3 ? "Good password strength" : "Strong password strength",
  };
}

export function VaultEntry({ hasVault, onCreate, onUnlock }: VaultEntryProps) {
  const creating = !hasVault;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const strength = useMemo(() => passwordStrength(password), [password]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!password) {
      setError("Enter your master password.");
      passwordRef.current?.focus();
      return;
    }
    if (creating && password.length < 12) {
      setError("Use a master password with at least 12 characters.");
      passwordRef.current?.focus();
      return;
    }
    if (creating && password !== confirmation) {
      setError("The master password confirmation does not match.");
      confirmationRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (creating) await onCreate(password);
      else await onUnlock(password);
    } catch {
      setError(creating
        ? "The encrypted vault could not be created. Check the password and try again."
        : "The vault could not be unlocked. Check the master password and try again.");
      setPassword("");
      setConfirmation("");
      window.requestAnimationFrame(() => passwordRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="vault-entry">
      <div className="entry-ambient" aria-hidden="true" />
      <header className="entry-brand"><AccountOsBrand /></header>
      <aside className="entry-motto entry-motto-left" aria-hidden="true">Simple<br />Secure<br />Yours<i /></aside>
      <aside className="entry-motto entry-motto-right" aria-hidden="true">Private by design<br />Built for what matters<i /></aside>
      <section className="entry-card" aria-labelledby="vault-entry-title">
        <div className="entry-lock" aria-hidden="true"><LockKeyhole size={29} strokeWidth={1.8} /></div>
        <p className="eyebrow">Local-first desktop vault</p>
        <h1 id="vault-entry-title">{creating ? "Create your local vault" : "Unlock your local vault"}</h1>
        <p className="entry-description">
          {creating
            ? "Choose a master password. It stays on this device and is used only to encrypt your local vault."
            : "Enter your master password to decrypt your local vault on this device."}
        </p>
        <form noValidate onSubmit={submit}>
          <SecretInput
            autoComplete={creating ? "new-password" : "current-password"}
            inputRef={passwordRef}
            label="Master password"
            name="masterPassword"
            onChange={setPassword}
            onToggle={() => setPasswordVisible((visible) => !visible)}
            value={password}
            visible={passwordVisible}
          />
          {creating && (
            <div className="password-strength" aria-live="polite" data-score={strength.score}>
              <span className="strength-bars" aria-hidden="true">{[1, 2, 3, 4].map((bar) => <i data-active={bar <= strength.score} key={bar} />)}</span>
              <span>{strength.label}</span>
            </div>
          )}
          {creating && (
            <SecretInput
              autoComplete="new-password"
              inputRef={confirmationRef}
              label="Confirm master password"
              name="masterPasswordConfirmation"
              onChange={setConfirmation}
              onToggle={() => setConfirmationVisible((visible) => !visible)}
              value={confirmation}
              visible={confirmationVisible}
            />
          )}
          {error && <p className="form-error entry-error" role="alert">{error}</p>}
          <button className="primary-button entry-submit" disabled={isSubmitting} type="submit">
            {isSubmitting && <LoaderCircle className="spin" size={18} />}
            {isSubmitting ? (creating ? "Creating encrypted vault…" : "Unlocking vault…") : creating ? "Create encrypted vault" : "Unlock vault"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>
        <div className="entry-reassurance"><ShieldCheck aria-hidden="true" size={20} /><span>{creating ? "Local-first · Encrypted · Your master password stays on this device" : "Optional cloud sync stores ciphertext only. Your master password stays on this device."}</span></div>
      </section>
    </main>
  );
}

function SecretInput({ autoComplete, inputRef, label, name, onChange, onToggle, value, visible }: {
  autoComplete: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  label: string;
  name: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  value: string;
  visible: boolean;
}) {
  const inputId = `entry-${name}`;
  return (
    <label className="field-label entry-field" htmlFor={inputId}>
      {label}
      <span className="input-with-action">
        <input
          autoComplete={autoComplete}
          id={inputId}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          ref={inputRef}
          spellCheck="false"
          type={visible ? "text" : "password"}
          value={value}
        />
        <button aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} onClick={onToggle} type="button">
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </label>
  );
}

export function VaultLoading() {
  return <main className="vault-entry vault-loading"><AccountOsBrand /><LoaderCircle className="spin" size={28} /><p>Preparing your local vault…</p></main>;
}
