import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RELATIONSHIP_TYPES, type Account, type AccountRelationship, type RelationshipType } from "../domain/types";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface DependencyMapProps { accounts: Account[]; relationships: AccountRelationship[]; onSelectAccount: (account: Account) => void; onOpenAccount: (account: Account) => void; onCreateRelationship: (draft: Omit<AccountRelationship, "id">) => Promise<void>; }
type MapAccount = Pick<Account, "id" | "accountName" | "serviceName" | "category">;

export function toMapAccount(account: Account): MapAccount {
  return { id: account.id, accountName: account.accountName, serviceName: account.serviceName, category: account.category };
}

export function buildDependencyGraph(accounts: Account[], relationships: AccountRelationship[]) {
  const nodes: Node[] = accounts.map((account, index) => {
    const mapAccount = toMapAccount(account);
    return { id: mapAccount.id, position: { x: (index % 3) * 270, y: Math.floor(index / 3) * 150 }, data: { label: <AccountNode account={mapAccount} /> }, sourcePosition: Position.Right, targetPosition: Position.Left };
  });
  const ids = new Set(accounts.map((account) => account.id));
  const edges: Edge[] = relationships.filter((item) => ids.has(item.sourceAccountId) && ids.has(item.targetAccountId)).map((item) => ({ id: item.id, source: item.sourceAccountId, target: item.targetAccountId, label: item.relationshipType, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.5 }, labelStyle: { fontSize: 10 } }));
  return { nodes, edges };
}

export function DependencyMap({ accounts, relationships, onSelectAccount, onOpenAccount, onCreateRelationship }: DependencyMapProps) {
  const { nodes, edges } = useMemo(() => buildDependencyGraph(accounts, relationships), [accounts, relationships]);
  const [selectedId, setSelectedId] = useState<string>(); const [query, setQuery] = useState(""); const [filterOpen, setFilterOpen] = useState(false); const [composerOpen, setComposerOpen] = useState(false); const [flow, setFlow] = useState<ReactFlowInstance>();
  const byId = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]); const selected = selectedId ? byId.get(selectedId) : undefined;
  const related = selectedId ? relationships.filter((item) => item.sourceAccountId === selectedId || item.targetAccountId === selectedId) : [];
  if (!accounts.length) return <div className="vault-empty"><h3>No accounts to map.</h3><p>Add accounts and relationships to see their dependencies.</p></div>;
  const focused = new Set(selectedId ? [selectedId, ...related.flatMap((item) => [item.sourceAccountId, item.targetAccountId])] : accounts.map((item) => item.id));
  const matches = new Set(accounts.filter((account) => `${account.accountName} ${account.serviceName}`.toLowerCase().includes(query.toLowerCase())).map((account) => account.id));
  return <div className="map-explorer" aria-label="Account dependency map">
    <div className="map-toolbar"><button className="add-account-button" onClick={() => setComposerOpen(true)} type="button"><Plus size={15}/>Relationship</button><label className="map-search"><Search size={14}/><input aria-label="Search Map" onChange={(event) => setQuery(event.target.value)} placeholder="Search identities" value={query}/></label><button aria-expanded={filterOpen} className="map-control" onClick={() => setFilterOpen(!filterOpen)} type="button"><SlidersHorizontal size={14}/>Filter</button><button className="map-control" onClick={() => flow?.fitView({ padding: .22 })} type="button"><Maximize2 size={14}/>Fit</button></div>
    {filterOpen && <p className="map-filter-note">All local relationship types are currently shown.</p>}
    <div className="dependency-map"><ReactFlow edges={edges.map((edge) => ({ ...edge, style: { ...edge.style, opacity: focused.has(edge.source) && focused.has(edge.target) ? 1 : .14 } }))} fitView minZoom={.35} nodes={nodes.map((node) => ({ ...node, style: { opacity: focused.has(node.id) && (!query || matches.has(node.id)) ? 1 : .22 } }))} onInit={setFlow} onNodeClick={(_, node) => { setSelectedId(node.id); onSelectAccount(byId.get(node.id)!); }} proOptions={{ hideAttribution: true }}><Background gap={32} size={.5}/><Controls showInteractive={false}/></ReactFlow></div>
    {selected && <aside className="map-inspector"><div><p className="eyebrow">Dependency inspector</p><div className="map-inspector-title"><ServiceIdentityMark account={selected} size="small"/><h3>{selected.accountName}</h3></div><p>{related.filter((item) => item.targetAccountId === selected.id).length} incoming · {related.filter((item) => item.sourceAccountId === selected.id).length} outgoing</p></div><div className="map-inspector-actions"><button className="secondary-button" onClick={() => onOpenAccount(selected)} type="button">Open in Vault</button><button className="secondary-button" onClick={() => setComposerOpen(true)} type="button">Create relationship</button></div></aside>}
    {composerOpen && (
      <RelationshipComposer accounts={accounts} onClose={() => setComposerOpen(false)} onSave={async (draft) => { await onCreateRelationship(draft); setComposerOpen(false); }} sourceId={selected?.id}/>
    )}
  </div>;
}

function RelationshipComposer({ accounts, sourceId, onClose, onSave }: { accounts: Account[]; sourceId?: string; onClose: () => void; onSave: (draft: Omit<AccountRelationship, "id">) => Promise<void> }) { const [source, setSource] = useState(sourceId ?? accounts[0]?.id ?? ""); const [target, setTarget] = useState(""); const [type, setType] = useState<RelationshipType>("DEPENDS_ON"); const [error, setError] = useState(""); useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [onClose]); async function submit(event: React.FormEvent) { event.preventDefault(); if (!source || !target) { setError("Choose a source and target account."); return; } try { await onSave({ sourceAccountId: source, targetAccountId: target, relationshipType: type, notes: "Created from Map" }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create relationship."); } } return <div aria-label="Create relationship" aria-modal="true" className="map-composer-backdrop" role="dialog" onMouseDown={onClose}><form className="map-composer" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><div><p className="eyebrow">Map relationship</p><h3>Create relationship</h3></div><button aria-label="Close relationship composer" className="icon-button" onClick={onClose} type="button"><X size={16}/></button></header><label className="field-label">Source account<select aria-label="Source account" onChange={(event) => setSource(event.target.value)} value={source}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}</select></label><label className="field-label">Relationship type<select aria-label="Map relationship type" onChange={(event) => setType(event.target.value as RelationshipType)} value={type}>{RELATIONSHIP_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Target account<select aria-label="Target account" onChange={(event) => setTarget(event.target.value)} value={target}><option value="">Choose target</option>{accounts.filter((account) => account.id !== source).map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}</select></label><p className="direction-preview">{accounts.find((account) => account.id === source)?.accountName ?? "Source"} → {accounts.find((account) => account.id === target)?.accountName ?? "Target"}</p>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose} type="button">Cancel</button><button className="add-account-button" type="submit">Create relationship</button></footer></form></div>; }
function AccountNode({ account }: { account: MapAccount }) { return <div className="map-node"><ServiceIdentityMark account={account} size="small"/><div><strong>{account.accountName}</strong><small>{account.serviceName} · {account.category}</small></div></div>; }
