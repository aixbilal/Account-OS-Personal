import { Copy, Eye, EyeOff, Pencil, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { relationshipsForAccount } from "../domain/relationships";
import type { Account, AccountRelationship } from "../domain/types";
import { ServiceIdentityHero, ServiceIdentityMark } from "./ServiceIdentity";

function relationshipLabel(relationship: AccountRelationship, accountId: string) {
  const incoming = relationship.targetAccountId === accountId;
  const labels: Record<string, string> = {
    DEPENDS_ON: incoming ? "Required by" : "Depends on",
    RECOVERY_EMAIL: incoming ? "Recovery for" : "Uses recovery",
    GOOGLE_SSO: incoming ? "Google sign-in for" : "Signs in with",
    GITHUB_SSO: incoming ? "GitHub sign-in for" : "Signs in with",
    OWNS: incoming ? "Owned by" : "Owns",
    LINKED_ACCOUNT: "Linked account",
    LOGIN_WITH: incoming ? "Login for" : "Logs in with",
    CONNECTED_TO: "Connected to",
    "2FA_DEVICE": incoming ? "2FA for" : "2FA device",
  };
  return labels[relationship.relationshipType] ?? relationship.relationshipType.replace(/_/g, " ");
}

export function AccountInspector({ account, accounts, relationships, onEdit, onManageRelationships }: { account?: Account; accounts: Account[]; relationships: AccountRelationship[]; onEdit: (account: Account) => void; onManageRelationships: (account: Account) => void }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const ownRelationships = account ? relationshipsForAccount(relationships, account.id) : [];

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopyStatus(`${label} copied`); }
    catch { setCopyStatus("Copy unavailable"); }
  }

  if (!account) return <aside className="account-inspector inspector-empty" aria-label="Account inspector"><div><p className="eyebrow">Account view</p><h2>No account selected</h2><p>Select an account from the Vault to inspect its details, credentials, and relationships.</p></div></aside>;

  return <aside className="account-inspector" aria-label="Account inspector">
    <header className="inspector-header"><ServiceIdentityHero account={account} /><button className="inspector-edit" onClick={() => onEdit(account)} type="button"><Pencil size={14} />Edit</button></header>
    <section className="inspector-fields" aria-label="Account credentials">
      <InspectorField label="Email" value={account.email || "Not recorded"} actionLabel="Copy email" onAction={() => void copy(account.email, "Email")} />
      <InspectorField label="Password" value={passwordVisible ? account.password : "••••••••••••••"} subvalue={passwordVisible ? "Visible until hidden" : "Hidden by default"} actions={<><button aria-label={passwordVisible ? "Hide password" : "Reveal password"} className="field-action" onClick={() => setPasswordVisible(!passwordVisible)} type="button">{passwordVisible ? <EyeOff size={14} /> : <Eye size={14} />}</button><button aria-label="Copy password" className="field-action" onClick={() => void copy(account.password, "Password")} type="button"><Copy size={14} /></button></>} />
      <InspectorField label="Website" value={account.serviceName} subvalue={account.authenticationMethod} />
      <InspectorField label="Category" value={account.category} subvalue={account.username || "No username recorded"} />
    </section>
    <section className="inspector-relationships"><p className="eyebrow">Relationships</p>{ownRelationships.length ? <div className="inspector-relationship-list">{ownRelationships.map((relationship) => { const relatedId = relationship.sourceAccountId === account.id ? relationship.targetAccountId : relationship.sourceAccountId; const related = accounts.find((candidate) => candidate.id === relatedId); return <div className="inspector-relationship" key={relationship.id}>{related ? <ServiceIdentityMark account={related} size="small" /> : <span className="missing-identity">?</span>}<div><strong>{related?.accountName ?? "Missing account"}</strong><span>{relationshipLabel(relationship, account.id)} · {relationship.notes || relationship.relationshipType.replace(/_/g, " ")}</span></div></div>; })}</div> : <p className="inspector-muted">No account relationships yet.</p>}<button className="manage-relationships" onClick={() => onManageRelationships(account)} type="button"><SlidersHorizontal size={13} />Manage relationships</button></section>
    <section className="inspector-notes"><div><p className="eyebrow">Notes</p><p>{account.notes || "No notes recorded."}</p></div><div><p className="eyebrow">Security</p><span className="inspector-tag">{account.twoFactorInformation || "No 2FA metadata"}</span></div></section>
    {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
  </aside>;
}

function InspectorField({ label, value, subvalue, actionLabel, onAction, actions }: { label: string; value: string; subvalue?: string; actionLabel?: string; onAction?: () => void; actions?: React.ReactNode }) {
  return <div className="inspector-field"><p className="eyebrow">{label}</p><div className="inspector-field-line"><strong>{value}</strong>{actions ?? (onAction && <button aria-label={actionLabel} className="field-copy" onClick={onAction} type="button">Copy</button>)}</div>{subvalue && <span>{subvalue}</span>}</div>;
}
