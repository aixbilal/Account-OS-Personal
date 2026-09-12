import { Eye, EyeOff, ExternalLink, Link2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { copySecretToClipboard } from "../domain/clipboard";
import { relationshipsForAccount } from "../domain/relationships";
import type { Account, AccountRelationship } from "../domain/types";
import { CopyButton, formatDate, InspectorField, openWebsite, OpenButton } from "./AccountInspector";
import { relationshipDirectionLabel } from "./RelationshipDialog";
import { ServiceIdentityMark } from "./ServiceIdentity";
import { Dialog } from "./ui/Modal";

type PanelTab = "relationships" | "details" | "security" | "notes";

export interface AccountConnectionsPanelProps {
  /** The account currently focused/selected on the host screen. */
  account?: Account;
  accounts: Account[];
  /** Accessible name for the panel's own `<aside>` - each host screen keeps
   * its own wording (e.g. "Map selection details" vs "Focused account
   * details") since the two screens' surrounding context differs. */
  ariaLabel: string;
  /** The host's own chrome class - `.relationship-side-panel` (a floating
   * bordered card) for the Relationships screen, `.map-inspector`
   * (blended into the Map's own toolbar card via a left border) for the
   * Map - applied alongside this component's shared structural class. */
  className: string;
  /** Secondary line for the empty state, phrased for the host screen's own
   * selection mechanism (a map node vs a focus-account picker). */
  emptyStateHint: string;
  onDelete?: (account: Account) => Promise<void>;
  onEdit: (account: Account) => void;
  onEditRelationship: (relationship: AccountRelationship) => void;
  /** Re-focuses the panel on a different account - clicking a connected-
   * account row. The host screen owns what "focus" means for it (map
   * node selection vs the Relationships screen's focus-account state). */
  onFocusAccount: (accountId: string) => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenAccount: (account: Account) => void;
  onRemoveRelationship: (relationship: AccountRelationship) => void;
  onRequestRelationship: (sourceAccountId?: string) => void;
  relationships: AccountRelationship[];
}

/** The relationship-type/direction badge - standardized here (UI
 * Refinement Pass 2, Item 3) in place of the plain concatenated text both
 * this panel and the Map's old bare panel used to render (e.g. "2FA for ·
 * alex.demo@example.test"). Reuses the same pill recipe as the existing
 * account-category tag (`.account-heading small`) so it reads as the same
 * visual language, not a new one-off. */
export function RelationshipBadge({ children }: { children: React.ReactNode }) {
  return <small className="relationship-badge">{children}</small>;
}

/**
 * The focused-account side panel: header (identity, Edit, "•••" overflow),
 * Relationships/Details/Security/Notes tabs, and per-connection row menu.
 * Originally built only for the Relationships screen (V3 fixture pass);
 * extracted here (UI Refinement Pass 2, Item 3) so the Map's side panel is
 * a second call site of the exact same component instead of a separate,
 * visually poorer, bare stat-box/plain-list implementation - one component,
 * two screens, so future fixes apply to both automatically.
 */
export function AccountConnectionsPanel({
  account,
  accounts,
  ariaLabel,
  className,
  emptyStateHint,
  onDelete,
  onEdit,
  onEditRelationship,
  onFocusAccount,
  onNotify,
  onOpenAccount,
  onRemoveRelationship,
  onRequestRelationship,
  relationships,
}: AccountConnectionsPanelProps) {
  const [inspectorTab, setInspectorTab] = useState<PanelTab>("relationships");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const accountById = useMemo(() => new Map(accounts.map((candidate) => [candidate.id, candidate])), [accounts]);
  const ownRelationships = account ? relationshipsForAccount(relationships, account.id) : [];

  useEffect(() => {
    setInspectorTab("relationships");
    setPasswordVisible(false);
    setHeaderMenuOpen(false);
    setRowMenuOpenId(null);
    setConfirmingDelete(false);
  }, [account?.id]);

  useEffect(() => {
    if (!headerMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) setHeaderMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setHeaderMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [headerMenuOpen]);

  async function copy(value: string, label: string, sensitive = false) {
    if (!value) return;
    try {
      if (sensitive) await copySecretToClipboard(value);
      else await navigator.clipboard.writeText(value);
      onNotify?.(`${label} copied`, "success");
    } catch {
      onNotify?.(`${label} copy unavailable`, "error");
    }
  }

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

  if (!account) {
    return (
      <aside aria-label={ariaLabel} className={`account-connections-panel account-connections-empty ${className}`}>
        <div className="map-inspector-empty"><Link2 aria-hidden="true" size={26} /><h3>Select an account</h3><p>{emptyStateHint}</p></div>
      </aside>
    );
  }

  return (
    <aside aria-label={ariaLabel} className={`account-connections-panel ${className}`}>
      <div className="relationship-side-heading">
        <ServiceIdentityMark account={account} />
        <div><strong>{account.accountName}</strong><span>{ownRelationships.length} relationship{ownRelationships.length === 1 ? "" : "s"}</span></div>
        <div className="relationship-side-heading-actions">
          <button className="secondary-button compact-button" onClick={() => onEdit(account)} type="button"><Pencil size={14} />Edit</button>
          {onDelete && (
            <div className="inspector-overflow" ref={headerMenuRef}>
              <button aria-expanded={headerMenuOpen} aria-haspopup="menu" aria-label="More account actions" className="icon-button" onClick={() => setHeaderMenuOpen((open) => !open)} type="button"><MoreVertical size={16} /></button>
              {headerMenuOpen && (
                <div className="inspector-overflow-menu" role="menu">
                  <button className="inspector-overflow-item" onClick={() => { setHeaderMenuOpen(false); onOpenAccount(account); }} role="menuitem" type="button"><ExternalLink size={14} />Open in Vault</button>
                  <button className="inspector-overflow-item danger" onClick={() => { setHeaderMenuOpen(false); setConfirmingDelete(true); }} role="menuitem" type="button"><Trash2 size={14} />Delete account</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relationship-tabs" role="tablist" aria-label="Account information">
        {(["relationships", "details", "security", "notes"] as const).map((tab) => (
          <button aria-selected={inspectorTab === tab} data-active={inspectorTab === tab} key={tab} onClick={() => setInspectorTab(tab)} role="tab" type="button">
            {tab === "relationships" ? "Relationships" : tab === "details" ? "Details" : tab === "security" ? "Security" : "Notes"}
          </button>
        ))}
      </div>

      {inspectorTab === "relationships" && (
        <>
          <div className="relationship-connected-list">
            <p className="eyebrow">Connected accounts ({ownRelationships.length})</p>
            {ownRelationships.length ? (
              <ul className="relationship-connected-items">
                {ownRelationships.map((relationship) => {
                  const counterpartId = relationship.sourceAccountId === account.id ? relationship.targetAccountId : relationship.sourceAccountId;
                  const counterpart = accountById.get(counterpartId);
                  if (!counterpart) return null;
                  return (
                    <li key={relationship.id}>
                      <button className="inspector-relationship relationship-row-main" onClick={() => onFocusAccount(counterpart.id)} type="button">
                        <ServiceIdentityMark account={counterpart} size="small" />
                        <span><strong>{counterpart.accountName}</strong>{counterpart.email && <small>{counterpart.email}</small>}</span>
                        <RelationshipBadge>{relationshipDirectionLabel(relationship, account.id)}</RelationshipBadge>
                      </button>
                      <div className="inspector-overflow relationship-row-menu">
                        <button aria-expanded={rowMenuOpenId === relationship.id} aria-haspopup="menu" aria-label={`More actions for the relationship with ${counterpart.accountName}`} className="icon-button" onClick={() => setRowMenuOpenId((current) => current === relationship.id ? null : relationship.id)} type="button"><MoreVertical size={15} /></button>
                        {rowMenuOpenId === relationship.id && (
                          <div className="inspector-overflow-menu" role="menu">
                            <button className="inspector-overflow-item" onClick={() => { setRowMenuOpenId(null); onEditRelationship(relationship); }} role="menuitem" type="button"><Pencil size={14} />Edit relationship</button>
                            <button className="inspector-overflow-item danger" onClick={() => { setRowMenuOpenId(null); onRemoveRelationship(relationship); }} role="menuitem" type="button"><Trash2 size={14} />Remove</button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="inspector-muted">No connections yet for this account.</p>}
          </div>
          <button className="primary-button" onClick={() => onRequestRelationship(account.id)} type="button"><Plus size={16} />Add relationship</button>
        </>
      )}

      {inspectorTab === "details" && (
        <div className="relationship-tab-fields">
          <InspectorField action={account.email ? <CopyButton label="Copy email" onClick={() => void copy(account.email, "Email")} /> : undefined} label="Email" value={account.email || "Not recorded"} />
          <InspectorField action={account.username ? <CopyButton label="Copy username" onClick={() => void copy(account.username, "Username")} /> : undefined} label="Username" value={account.username || "Not recorded"} />
          <InspectorField action={account.website ? <OpenButton label="Open website" onClick={() => openWebsite(account.website ?? "")} /> : undefined} label="Website" value={account.website || "Not recorded"} />
          <InspectorField label="Category" subvalue={`Updated ${formatDate(account.updatedAt)}`} value={account.category} />
        </div>
      )}

      {inspectorTab === "security" && (
        <div className="relationship-tab-fields">
          <InspectorField
            action={account.password ? <span className="field-actions"><button aria-label={passwordVisible ? "Hide password" : "Reveal password"} className="icon-button field-icon-action" onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button><CopyButton label="Copy password" onClick={() => void copy(account.password, "Password", true)} /></span> : undefined}
            label="Password"
            subvalue={account.password ? (passwordVisible ? "Visible until hidden" : "Hidden by default") : undefined}
            value={account.password ? (passwordVisible ? account.password : "••••••••••••••") : "Not recorded"}
          />
          <InspectorField label="Authentication method" value={account.authenticationMethod} />
          <InspectorField label="2FA" value={account.twoFactorInformation || "No 2FA metadata"} />
          <InspectorField label="Recovery information" value={account.recoveryInformation || "No recovery information recorded."} />
        </div>
      )}

      {inspectorTab === "notes" && (
        <div className="relationship-tab-fields">
          <p className="inspector-notes-text">{account.notes || "No notes recorded."}</p>
        </div>
      )}

      {confirmingDelete && (
        <Dialog className="confirm-dialog" labelledBy="delete-account-connections-title" onRequestClose={() => { if (!deleting) setConfirmingDelete(false); }}>
          <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={22} /></div>
          <h2 id="delete-account-connections-title">Delete {account.accountName}?</h2>
          <p>This permanently deletes the account{ownRelationships.length ? ` and removes its ${ownRelationships.length} relationship${ownRelationships.length === 1 ? "" : "s"}` : ""}. This action cannot be undone.</p>
          {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus disabled={deleting} onClick={() => setConfirmingDelete(false)} type="button">Cancel</button><button className="danger-button" disabled={deleting} onClick={() => void confirmDelete()} type="button">{deleting ? "Deleting…" : "Delete account"}</button></footer>
        </Dialog>
      )}
    </aside>
  );
}
