import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowUpDown, CircleOff, ExternalLink, Eye, EyeOff, Grid3x3, Link2, List, MoreVertical, Network, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { copySecretToClipboard } from "../domain/clipboard";
import { relationshipsForAccount } from "../domain/relationships";
import type { Account, AccountRelationship } from "../domain/types";
import { CopyButton, formatDate, InspectorField, openWebsite, OpenButton } from "./AccountInspector";
import { buildEgoGraph, mapEdgeTypes, mapNodeTypes } from "./DependencyMap";
import { relationshipDirectionLabel, relationshipTypeLabels } from "./RelationshipDialog";
import { ServiceIdentityMark } from "./ServiceIdentity";
import { Dialog } from "./ui/Modal";

interface RelationshipsScreenProps {
  accounts: Account[];
  onDelete?: (account: Account) => Promise<void>;
  onEdit: (account: Account) => void;
  onEditRelationship: (relationship: AccountRelationship) => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenAccount: (account: Account) => void;
  onRemoveRelationship: (relationship: AccountRelationship) => void;
  onRequestRelationship: (sourceAccountId?: string) => void;
  relationships: AccountRelationship[];
}

type InspectorTab = "relationships" | "details" | "security" | "notes";
type MainView = "graph" | "list" | "matrix";
type ListSortKey = "account" | "connectedTo" | "type";

/** The account with the most direct connections, used as the screen's
 * initial focus so it opens on something worth looking at rather than an
 * arbitrary or isolated account. Ties break on id for determinism. */
function mostConnectedAccountId(accounts: Account[], relationships: AccountRelationship[]) {
  if (!accounts.length) return undefined;
  const degree = new Map(accounts.map((account) => [account.id, 0]));
  for (const relationship of relationships) {
    if (degree.has(relationship.sourceAccountId)) degree.set(relationship.sourceAccountId, (degree.get(relationship.sourceAccountId) ?? 0) + 1);
    if (degree.has(relationship.targetAccountId)) degree.set(relationship.targetAccountId, (degree.get(relationship.targetAccountId) ?? 0) + 1);
  }
  return [...accounts].sort((left, right) => {
    const byDegree = (degree.get(right.id) ?? 0) - (degree.get(left.id) ?? 0);
    return byDegree !== 0 ? byDegree : left.id.localeCompare(right.id);
  })[0].id;
}

export function RelationshipsScreen({ accounts, onDelete, onEdit, onEditRelationship, onNotify, onOpenAccount, onRemoveRelationship, onRequestRelationship, relationships }: RelationshipsScreenProps) {
  const [focusId, setFocusId] = useState<string | undefined>(() => mostConnectedAccountId(accounts, relationships));
  const [mainView, setMainView] = useState<MainView>("graph");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("relationships");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [listSort, setListSort] = useState<{ key: ListSortKey; direction: "asc" | "desc" }>({ key: "account", direction: "asc" });
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const focusAccount = focusId ? accountById.get(focusId) : undefined;

  useEffect(() => { setInspectorTab("relationships"); setPasswordVisible(false); setHeaderMenuOpen(false); setRowMenuOpenId(null); }, [focusId]);

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

  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const relationship of relationships) {
      if (accountById.has(relationship.sourceAccountId)) ids.add(relationship.sourceAccountId);
      if (accountById.has(relationship.targetAccountId)) ids.add(relationship.targetAccountId);
    }
    return ids;
  }, [accountById, relationships]);
  const totalAccounts = accounts.length;
  const connectedCount = connectedIds.size;
  const isolatedCount = totalAccounts - connectedCount;

  const egoGraph = useMemo(
    () => (focusId ? buildEgoGraph(accounts, relationships, focusId) : { nodes: [], edges: [] }),
    [accounts, focusId, relationships],
  );
  const focusRelationships = focusId ? relationshipsForAccount(relationships, focusId) : [];

  const sortedAccounts = useMemo(() => [...accounts].sort((left, right) => left.accountName.localeCompare(right.accountName)), [accounts]);

  const listRows = useMemo(() => {
    const rows = relationships
      .map((relationship) => ({
        relationship,
        account: accountById.get(relationship.sourceAccountId),
        connectedTo: accountById.get(relationship.targetAccountId),
      }))
      .filter((row): row is { relationship: AccountRelationship; account: Account; connectedTo: Account } => Boolean(row.account && row.connectedTo));
    const direction = listSort.direction === "asc" ? 1 : -1;
    return rows.sort((left, right) => {
      const leftValue = listSort.key === "account" ? left.account.accountName : listSort.key === "connectedTo" ? left.connectedTo.accountName : relationshipTypeLabels[left.relationship.relationshipType];
      const rightValue = listSort.key === "account" ? right.account.accountName : listSort.key === "connectedTo" ? right.connectedTo.accountName : relationshipTypeLabels[right.relationship.relationshipType];
      return leftValue.localeCompare(rightValue) * direction;
    });
  }, [accountById, listSort, relationships]);

  function toggleSort(key: ListSortKey) {
    setListSort((current) => (current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  }

  const matrixConnections = useMemo(() => {
    const map = new Map<string, AccountRelationship>();
    for (const relationship of relationships) {
      if (!accountById.has(relationship.sourceAccountId) || !accountById.has(relationship.targetAccountId)) continue;
      map.set(`${relationship.sourceAccountId}:${relationship.targetAccountId}`, relationship);
    }
    return map;
  }, [accountById, relationships]);

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
    if (!focusAccount || !onDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete(focusAccount);
      onNotify?.("Account deleted", "success");
      setConfirmingDelete(false);
      setFocusId(undefined);
    } catch {
      setDeleteError("Unable to delete this account. The local vault was not changed.");
    } finally {
      setDeleting(false);
    }
  }

  if (!totalAccounts) {
    return (
      <section className="relationships-screen" aria-labelledby="relationships-title">
        <header className="screen-header"><div><p className="eyebrow">Connections</p><h1 id="relationships-title">Relationships</h1><p>See how your accounts are connected.</p></div></header>
        <div className="map-empty"><div><Link2 aria-hidden="true" size={30} /><h3>No accounts yet</h3><p>Add accounts and real relationships to see them connected here.</p></div></div>
      </section>
    );
  }

  return (
    <section className="relationships-screen" aria-labelledby="relationships-title">
      <header className="screen-header">
        <div><p className="eyebrow">Connections</p><h1 id="relationships-title">Relationships</h1><p>See how your accounts are connected, one account at a time.</p></div>
      </header>

      <div className="relationship-stats">
        <div className="relationship-stat"><span className="relationship-stat-icon" data-tone="total"><Link2 aria-hidden="true" size={18} /></span><div><strong>{totalAccounts}</strong><span>Total accounts</span></div></div>
        <div className="relationship-stat"><span className="relationship-stat-icon" data-tone="connected"><Share2 aria-hidden="true" size={18} /></span><div><strong>{connectedCount}</strong><span>Connected</span></div></div>
        <div className="relationship-stat"><span className="relationship-stat-icon" data-tone="isolated"><CircleOff aria-hidden="true" size={18} /></span><div><strong>{isolatedCount}</strong><span>Isolated</span></div></div>
      </div>

      <div className="relationships-layout">
        <div className="relationship-graph-panel">
          <div className="relationship-graph-heading">
            <div><h2>Relationship map</h2><p>{mainView === "graph" ? "Pick an account to see just its direct connections." : mainView === "list" ? "Every stored relationship, sortable by any column." : "Every account against every other - a filled cell means a relationship exists."}</p></div>
            <div className="relationship-view-toggle" role="group" aria-label="Relationship view">
              <button aria-pressed={mainView === "graph"} data-active={mainView === "graph"} onClick={() => setMainView("graph")} type="button"><Network aria-hidden="true" size={14} />Graph</button>
              <button aria-pressed={mainView === "list"} data-active={mainView === "list"} onClick={() => setMainView("list")} type="button"><List aria-hidden="true" size={14} />List</button>
              <button aria-pressed={mainView === "matrix"} data-active={mainView === "matrix"} onClick={() => setMainView("matrix")} type="button"><Grid3x3 aria-hidden="true" size={14} />Matrix</button>
            </div>
            {mainView === "graph" && (
              <label className="relationship-focus-picker" htmlFor="relationship-focus-account">
                Focus account
                <select id="relationship-focus-account" name="relationshipFocusAccount" onChange={(event) => setFocusId(event.target.value)} value={focusId ?? ""}>
                  {sortedAccounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}
                </select>
              </label>
            )}
          </div>

          {mainView === "graph" && (
            <div className="relationship-graph" aria-label={focusAccount ? `${focusAccount.accountName}'s direct connections` : "Relationship map"}>
              <ReactFlow
                edges={egoGraph.edges}
                edgesReconnectable={false}
                edgeTypes={mapEdgeTypes}
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
                key={focusId}
                minZoom={0.5}
                maxZoom={1.5}
                nodesConnectable={false}
                nodesDraggable={false}
                nodeTypes={mapNodeTypes}
                nodes={egoGraph.nodes}
                onNodeClick={(_, node) => setFocusId(node.id)}
              >
                <Background color="var(--aos-border-strong)" gap={34} size={0.8} />
                <Controls position="bottom-left" showInteractive={false} />
              </ReactFlow>
            </div>
          )}

          {mainView === "list" && (
            relationships.length ? (
              <div className="relationship-list-view">
                <table>
                  <thead>
                    <tr>
                      <SortableHeader active={listSort.key === "account"} direction={listSort.direction} label="Account" onClick={() => toggleSort("account")} />
                      <SortableHeader active={listSort.key === "connectedTo"} direction={listSort.direction} label="Connected to" onClick={() => toggleSort("connectedTo")} />
                      <SortableHeader active={listSort.key === "type"} direction={listSort.direction} label="Relationship type" onClick={() => toggleSort("type")} />
                    </tr>
                  </thead>
                  <tbody>
                    {listRows.map(({ relationship, account, connectedTo }) => (
                      <tr data-focused={account.id === focusId || connectedTo.id === focusId} key={relationship.id}>
                        <td><button className="relationship-list-cell" onClick={() => setFocusId(account.id)} type="button"><ServiceIdentityMark account={account} size="small" />{account.accountName}</button></td>
                        <td><button className="relationship-list-cell" onClick={() => setFocusId(connectedTo.id)} type="button"><ServiceIdentityMark account={connectedTo} size="small" />{connectedTo.accountName}</button></td>
                        <td>{relationshipTypeLabels[relationship.relationshipType]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="map-inspector-empty"><Link2 aria-hidden="true" size={26} /><h3>No relationships yet</h3><p>Add a relationship to see it listed here.</p></div>
          )}

          {mainView === "matrix" && (
            <div className="relationship-matrix-view">
              <table>
                <thead>
                  <tr>
                    <th className="relationship-matrix-corner" />
                    {sortedAccounts.map((column) => <th data-focused={column.id === focusId} key={column.id} title={column.accountName}><span>{column.accountName}</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {sortedAccounts.map((row) => (
                    <tr key={row.id}>
                      <th data-focused={row.id === focusId} scope="row" title={row.accountName}>
                        <button onClick={() => setFocusId(row.id)} type="button">{row.accountName}</button>
                      </th>
                      {sortedAccounts.map((column) => {
                        if (column.id === row.id) return <td className="relationship-matrix-self" key={column.id} />;
                        const relationship = matrixConnections.get(`${row.id}:${column.id}`) ?? matrixConnections.get(`${column.id}:${row.id}`);
                        return (
                          <td key={column.id}>
                            {relationship ? (
                              <button
                                aria-label={`${row.accountName} - ${relationshipTypeLabels[relationship.relationshipType]} - ${column.accountName}`}
                                className="relationship-matrix-cell"
                                onClick={() => setFocusId(row.id)}
                                title={`${row.accountName} -> ${relationshipTypeLabels[relationship.relationshipType]} -> ${column.accountName}`}
                                type="button"
                              />
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="relationship-side-panel" aria-label="Focused account details">
          {focusAccount ? (
            <>
              <div className="relationship-side-heading">
                <ServiceIdentityMark account={focusAccount} />
                <div><strong>{focusAccount.accountName}</strong><span>{focusRelationships.length} relationship{focusRelationships.length === 1 ? "" : "s"}</span></div>
                <div className="relationship-side-heading-actions">
                  <button className="secondary-button compact-button" onClick={() => onEdit(focusAccount)} type="button"><Pencil size={14} />Edit</button>
                  {onDelete && (
                    <div className="inspector-overflow" ref={headerMenuRef}>
                      <button aria-expanded={headerMenuOpen} aria-haspopup="menu" aria-label="More account actions" className="icon-button" onClick={() => setHeaderMenuOpen((open) => !open)} type="button"><MoreVertical size={16} /></button>
                      {headerMenuOpen && (
                        <div className="inspector-overflow-menu" role="menu">
                          <button className="inspector-overflow-item" onClick={() => { setHeaderMenuOpen(false); onOpenAccount(focusAccount); }} role="menuitem" type="button"><ExternalLink size={14} />Open in Vault</button>
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
                    <p className="eyebrow">Connected accounts ({focusRelationships.length})</p>
                    {focusRelationships.length ? (
                      <ul className="relationship-connected-items">
                        {focusRelationships.map((relationship) => {
                          const counterpartId = relationship.sourceAccountId === focusAccount.id ? relationship.targetAccountId : relationship.sourceAccountId;
                          const counterpart = accountById.get(counterpartId);
                          if (!counterpart) return null;
                          return (
                            <li key={relationship.id}>
                              <button className="inspector-relationship relationship-row-main" onClick={() => setFocusId(counterpart.id)} type="button">
                                <ServiceIdentityMark account={counterpart} size="small" />
                                <span><strong>{counterpart.accountName}</strong><small>{relationshipDirectionLabel(relationship, focusAccount.id)}{counterpart.email ? ` · ${counterpart.email}` : ""}</small></span>
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
                  <button className="primary-button" onClick={() => onRequestRelationship(focusAccount.id)} type="button"><Plus size={16} />Add relationship</button>
                </>
              )}

              {inspectorTab === "details" && (
                <div className="relationship-tab-fields">
                  <InspectorField action={focusAccount.email ? <CopyButton label="Copy email" onClick={() => void copy(focusAccount.email, "Email")} /> : undefined} label="Email" value={focusAccount.email || "Not recorded"} />
                  <InspectorField action={focusAccount.username ? <CopyButton label="Copy username" onClick={() => void copy(focusAccount.username, "Username")} /> : undefined} label="Username" value={focusAccount.username || "Not recorded"} />
                  <InspectorField action={focusAccount.website ? <OpenButton label="Open website" onClick={() => openWebsite(focusAccount.website ?? "")} /> : undefined} label="Website" value={focusAccount.website || "Not recorded"} />
                  <InspectorField label="Category" subvalue={`Updated ${formatDate(focusAccount.updatedAt)}`} value={focusAccount.category} />
                </div>
              )}

              {inspectorTab === "security" && (
                <div className="relationship-tab-fields">
                  <InspectorField
                    action={focusAccount.password ? <span className="field-actions"><button aria-label={passwordVisible ? "Hide password" : "Reveal password"} className="icon-button field-icon-action" onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button><CopyButton label="Copy password" onClick={() => void copy(focusAccount.password, "Password", true)} /></span> : undefined}
                    label="Password"
                    subvalue={focusAccount.password ? (passwordVisible ? "Visible until hidden" : "Hidden by default") : undefined}
                    value={focusAccount.password ? (passwordVisible ? focusAccount.password : "••••••••••••••") : "Not recorded"}
                  />
                  <InspectorField label="Authentication method" value={focusAccount.authenticationMethod} />
                  <InspectorField label="2FA" value={focusAccount.twoFactorInformation || "No 2FA metadata"} />
                  <InspectorField label="Recovery information" value={focusAccount.recoveryInformation || "No recovery information recorded."} />
                </div>
              )}

              {inspectorTab === "notes" && (
                <div className="relationship-tab-fields">
                  <p className="inspector-notes-text">{focusAccount.notes || "No notes recorded."}</p>
                </div>
              )}
            </>
          ) : (
            <div className="map-inspector-empty"><Link2 aria-hidden="true" size={26} /><h3>Select an account</h3><p>Choose a focus account to see its connections.</p></div>
          )}
        </aside>
      </div>

      {confirmingDelete && focusAccount && (
        <Dialog className="confirm-dialog" labelledBy="delete-account-relationships-title" onRequestClose={() => { if (!deleting) setConfirmingDelete(false); }}>
          <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={22} /></div>
          <h2 id="delete-account-relationships-title">Delete {focusAccount.accountName}?</h2>
          <p>This permanently deletes the account{focusRelationships.length ? ` and removes its ${focusRelationships.length} relationship${focusRelationships.length === 1 ? "" : "s"}` : ""}. This action cannot be undone.</p>
          {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus disabled={deleting} onClick={() => setConfirmingDelete(false)} type="button">Cancel</button><button className="danger-button" disabled={deleting} onClick={() => void confirmDelete()} type="button">{deleting ? "Deleting…" : "Delete account"}</button></footer>
        </Dialog>
      )}
    </section>
  );
}

function SortableHeader({ active, direction, label, onClick }: { active: boolean; direction: "asc" | "desc"; label: string; onClick: () => void }) {
  return (
    <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button data-active={active} onClick={onClick} type="button">{label}<ArrowUpDown aria-hidden="true" data-direction={active ? direction : undefined} size={12} /></button>
    </th>
  );
}
