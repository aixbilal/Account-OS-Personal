import { Copy, Eye, EyeOff, KeyRound, Link2, Pencil, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { copySecretToClipboard } from "../domain/clipboard";
import { relationshipsForAccount } from "../domain/relationships";
import type { Account, AccountRelationship } from "../domain/types";
import { relationshipDirectionLabel } from "./RelationshipDialog";
import { ServiceIdentityHero, ServiceIdentityMark } from "./ServiceIdentity";

interface AccountInspectorProps {
  account?: Account;
  accounts: Account[];
  onAddFirstAccount: () => void;
  onEdit: (account: Account) => void;
  onManageRelationships: (account: Account) => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenAccount: (account: Account) => void;
  relationships: AccountRelationship[];
}

export function AccountInspector({ account, accounts, onAddFirstAccount, onEdit, onManageRelationships, onNotify, onOpenAccount, relationships }: AccountInspectorProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const ownRelationships = account ? relationshipsForAccount(relationships, account.id) : [];

  useEffect(() => setPasswordVisible(false), [account?.id]);

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
        <button className="secondary-button inspector-edit" onClick={() => onEdit(account)} type="button"><Pencil size={15} />Edit</button>
      </header>

      <section className="inspector-fields" aria-label="Account credentials">
        <InspectorField action={account.email ? <CopyButton label="Copy email" onClick={() => void copy(account.email, "Email")} /> : undefined} label="Email" value={account.email || "Not recorded"} />
        <InspectorField action={account.username ? <CopyButton label="Copy username" onClick={() => void copy(account.username, "Username")} /> : undefined} label="Username" value={account.username || "Not recorded"} />
        <InspectorField
          action={account.password ? <span className="field-actions"><button aria-label={passwordVisible ? "Hide password" : "Reveal password"} className="icon-button field-icon-action" onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button><CopyButton iconOnly label="Copy password" onClick={() => void copy(account.password, "Password", true)} /></span> : undefined}
          label="Password"
          subvalue={account.password ? (passwordVisible ? "Visible until hidden" : "Hidden by default") : undefined}
          value={account.password ? (passwordVisible ? account.password : "••••••••••••••") : "Not recorded"}
        />
        <InspectorField action={account.website ? <CopyButton label="Copy website" onClick={() => void copy(account.website ?? "", "Website")} /> : undefined} label="Website" value={account.website || "Not recorded"} />
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
                  <span><strong>{related?.accountName ?? "Missing account"}</strong><small>{relationshipDirectionLabel(relationship, account.id)}{relationship.notes ? ` · ${relationship.notes}` : ""}</small></span>
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
    </section>
  );
}

function CopyButton({ iconOnly = false, label, onClick }: { iconOnly?: boolean; label: string; onClick: () => void }) {
  return <button aria-label={label} className={iconOnly ? "icon-button field-icon-action" : "field-copy"} onClick={onClick} type="button"><Copy size={15} />{!iconOnly && "Copy"}</button>;
}

function InspectorField({ action, label, subvalue, value }: { action?: React.ReactNode; label: string; subvalue?: string; value: string }) {
  return <div className="inspector-field"><p className="eyebrow">{label}</p><div className="inspector-field-line"><strong>{value}</strong>{action}</div>{subvalue && <span>{subvalue}</span>}</div>;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "recently";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
