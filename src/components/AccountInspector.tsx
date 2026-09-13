import { Copy, ExternalLink, Eye, EyeOff, KeyRound, Link2, MoreVertical, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copySecretToClipboard } from "../domain/clipboard";
import { relationshipsForAccount } from "../domain/relationships";
import type { Account, AccountRelationship } from "../domain/types";
import { relationshipDirectionLabel } from "./RelationshipDialog";
import { ServiceIdentityHero, ServiceIdentityMark } from "./ServiceIdentity";
import { Dialog } from "./ui/Modal";

interface AccountInspectorProps {
  account?: Account;
  accounts: Account[];
  onAddFirstAccount: () => void;
  onDelete?: (account: Account) => Promise<void>;
  onEdit: (account: Account) => void;
  onManageRelationships: (account: Account) => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenAccount: (account: Account) => void;
  relationships: AccountRelationship[];
}

export function AccountInspector({ account, accounts, onAddFirstAccount, onDelete, onEdit, onManageRelationships, onNotify, onOpenAccount, relationships }: AccountInspectorProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const ownRelationships = account ? relationshipsForAccount(relationships, account.id) : [];

  useEffect(() => { setPasswordVisible(false); setMenuOpen(false); }, [account?.id]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function confirmDelete() {
    if (!account || !onDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete(account);
      onNotify?.("Account deleted", "success");
      setConfirmingDelete(false);
    } catch {
      setDeleteError("Unable to delete this account. The local vault was not changed.");
    } finally {
      setDeleting(false);
    }
  }

  async function copy(value: string, label: string, sensitive = false) {
    if (!value) return;
    try {
      // Sensitive values are auto-cleared from the clipboard after a short
      // delay (see domain/clipboard); non-secret fields are a plain copy.
      if (sensitive) {
        await copySecretToClipboard(value);
      } else {
        await navigator.clipboard.writeText(value);
      }
      onNotify?.(`${label} copied`, "success");
    } catch {
      onNotify?.(`${label} copy unavailable`, "error");
    }
  }

  if (!account) {
    if (!accounts.length) {
      return (
        <section className="account-inspector inspector-onboarding" aria-label="Empty vault onboarding">
          <div className="onboarding-card">
            <div className="onboarding-icon" aria-hidden="true"><KeyRound size={31} /></div>
            <h2>Your vault is empty</h2>
            <p>Start with one account. Your vault stays clear, local, and ready to grow with you.</p>
            <button className="primary-button onboarding-action" onClick={onAddFirstAccount} type="button"><Plus size={17} />Add first account</button>
            <ul className="onboarding-benefits">
              <li><span><KeyRound size={18} /></span><div><strong>Store credentials</strong><p>Keep sign-ins and sensitive details encrypted.</p></div></li>
              <li><span><Link2 size={18} /></span><div><strong>Link related accounts</strong><p>See how your real accounts depend on each other.</p></div></li>
              <li><span><ShieldCheck size={18} /></span><div><strong>Stay local-first</strong><p>Your vault remains useful without a cloud connection.</p></div></li>
            </ul>
          </div>
        </section>
      );
    }
    return <section className="account-inspector inspector-empty" aria-label="Account inspector"><div className="inspector-empty-icon" aria-hidden="true"><KeyRound size={27} /></div><p className="eyebrow">Account view</p><h2>No account selected</h2><p>Select an account from the Vault to inspect its details, credentials, and relationships.</p></section>;
  }

  return (
    <section className="account-inspector" aria-label={`${account.accountName} account details`}>
      <header className="inspector-header">
        <ServiceIdentityHero account={account} />
        <div className="inspector-header-actions">
          <button className="secondary-button inspector-edit" onClick={() => onEdit(account)} type="button"><Pencil size={15} />Edit</button>
          {onDelete && (
            <div className="inspector-overflow" ref={menuRef}>
              <button aria-expanded={menuOpen} aria-haspopup="menu" aria-label="More account actions" className="icon-button" onClick={() => setMenuOpen((open) => !open)} type="button"><MoreVertical size={17} /></button>
              {menuOpen && (
                <div className="inspector-overflow-menu" role="menu">
                  <button className="inspector-overflow-item danger" onClick={() => { setMenuOpen(false); setConfirmingDelete(true); }} role="menuitem" type="button"><Trash2 size={15} />Delete account</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="inspector-fields" aria-label="Account credentials">
        <InspectorField action={account.email ? <CopyButton label="Copy email" onClick={() => void copy(account.email, "Email")} /> : undefined} label="Email" value={account.email || "Not recorded"} />
        <InspectorField action={account.username ? <CopyButton label="Copy username" onClick={() => void copy(account.username, "Username")} /> : undefined} label="Username" value={account.username || "Not recorded"} />
        <InspectorField
          action={account.password ? <span className="field-actions"><button aria-label={passwordVisible ? "Hide password" : "Reveal password"} className="icon-button field-icon-action" onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button><CopyButton label="Copy password" onClick={() => void copy(account.password, "Password", true)} /></span> : undefined}
          label="Password"
          subvalue={account.password ? (passwordVisible ? "Visible until hidden" : "Hidden by default") : undefined}
          value={account.password ? (passwordVisible ? account.password : "••••••••••••••") : "Not recorded"}
        />
        <InspectorField action={account.website ? <OpenButton label="Open website" onClick={() => openWebsite(account.website ?? "")} /> : undefined} label="Website" value={account.website || "Not recorded"} />
        <InspectorField label="Authentication" subvalue={account.twoFactorInformation || "No 2FA metadata"} value={account.authenticationMethod} />
        <InspectorField label="Category" subvalue={`Updated ${formatDate(account.updatedAt)}`} value={account.category} />
      </section>

      <section className="inspector-section inspector-relationships">
        <div className="inspector-section-heading"><div><p className="eyebrow">Relationships</p><h3>{ownRelationships.length ? `${ownRelationships.length} connected account${ownRelationships.length === 1 ? "" : "s"}` : "No connected accounts"}</h3></div><button className="text-button" onClick={() => onManageRelationships(account)} type="button"><Plus size={15} />Manage</button></div>
        {ownRelationships.length ? (
          <div className="inspector-relationship-list">
            {ownRelationships.map((relationship) => {
              const relatedId = relationship.sourceAccountId === account.id ? relationship.targetAccountId : relationship.sourceAccountId;
              const related = accounts.find((candidate) => candidate.id === relatedId);
              return (
                <button className="inspector-relationship" disabled={!related} key={relationship.id} onClick={() => related && onOpenAccount(related)} type="button">
                  {related ? <ServiceIdentityMark account={related} size="small" /> : <span className="missing-identity">?</span>}
                  <span className="inspector-relationship-text"><strong>{related?.accountName ?? "Missing account"}</strong><small>{relationshipDirectionLabel(relationship, account.id)}{relationship.notes ? ` · ${relationship.notes}` : ""}</small></span>
                  <span aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
        ) : <p className="inspector-muted">Add a relationship to show how this account connects to another account in your vault.</p>}
      </section>

      <section className="inspector-notes">
        <div><p className="eyebrow">Notes</p><p>{account.notes || "No notes recorded."}</p></div>
        <div><p className="eyebrow">Recovery information</p><p>{account.recoveryInformation || "No recovery information recorded."}</p></div>
      </section>
      <div className="local-encryption-note"><ShieldCheck aria-hidden="true" size={22} /><div><strong>Stored locally and encrypted</strong><span>Your master password protects this account with the rest of your vault.</span></div></div>

      {confirmingDelete && (
        <Dialog className="confirm-dialog" labelledBy="delete-account-inspector-title" onRequestClose={() => { if (!deleting) setConfirmingDelete(false); }}>
          <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={22} /></div>
          <h2 id="delete-account-inspector-title">Delete {account.accountName}?</h2>
          <p>This permanently deletes the account{ownRelationships.length ? ` and removes its ${ownRelationships.length} relationship${ownRelationships.length === 1 ? "" : "s"}` : ""}. This action cannot be undone.</p>
          {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus disabled={deleting} onClick={() => setConfirmingDelete(false)} type="button">Cancel</button><button className="danger-button" disabled={deleting} onClick={() => void confirmDelete()} type="button">{deleting ? "Deleting…" : "Delete account"}</button></footer>
        </Dialog>
      )}
    </section>
  );
}

export function CopyButton({ iconOnly = false, label, onClick }: { iconOnly?: boolean; label: string; onClick: () => void }) {
  return <button aria-label={label} className={iconOnly ? "icon-button field-icon-action" : "field-copy"} onClick={onClick} type="button"><Copy size={15} />{!iconOnly && "Copy"}</button>;
}

export function OpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button aria-label={label} className="field-copy" onClick={onClick} type="button"><ExternalLink size={15} />Open</button>;
}

/** Opens a stored website value in the default browser. Adds an `https://`
 * scheme when the user saved a bare domain, and refuses to open anything
 * that isn't (or can't be normalized into) a plain http(s) link. */
export function openWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch {
    // Not a openable URL - silently ignore rather than navigate somewhere unexpected.
  }
}

export function InspectorField({ action, label, subvalue, value }: { action?: React.ReactNode; label: string; subvalue?: string; value: string }) {
  return <div className="inspector-field"><p className="eyebrow">{label}</p><div className="inspector-field-line"><strong>{value}</strong>{action}</div>{subvalue && <span>{subvalue}</span>}</div>;
}

export function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "recently";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
