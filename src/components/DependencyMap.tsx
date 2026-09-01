import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import type { Account, AccountRelationship } from "../domain/types";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface DependencyMapProps { accounts: Account[]; onSelectAccount: (account: Account) => void; relationships: AccountRelationship[]; }

export function buildDependencyGraph(accounts: Account[], relationships: AccountRelationship[]) {
  const nodes: Node[] = accounts.map((account, index) => ({
    id: account.id, position: { x: (index % 3) * 270, y: Math.floor(index / 3) * 160 },
    data: { label: <AccountNode account={account} /> }, sourcePosition: Position.Right, targetPosition: Position.Left,
  }));
  const ids = new Set(accounts.map((account) => account.id));
  const edges: Edge[] = relationships.filter((item) => ids.has(item.sourceAccountId) && ids.has(item.targetAccountId)).map((item) => ({
    id: item.id, source: item.sourceAccountId, target: item.targetAccountId, label: item.relationshipType, type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.5 }, labelStyle: { fontSize: 10 },
  }));
  return { nodes, edges };
}

export function DependencyMap({ accounts, onSelectAccount, relationships }: DependencyMapProps) {
  const { nodes, edges } = useMemo(() => buildDependencyGraph(accounts, relationships), [accounts, relationships]);
  const [selectedId, setSelectedId] = useState<string>();
  const accountsById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const selected = selectedId ? accountsById.get(selectedId) : undefined;
  const related = selectedId ? relationships.filter((item) => item.sourceAccountId === selectedId || item.targetAccountId === selectedId) : [];
  if (!accounts.length) return <div className="vault-empty"><h3>No accounts to map.</h3><p>Add accounts and relationships to see their dependencies.</p></div>;
  const focusedIds = new Set(selectedId ? [selectedId, ...related.flatMap((item) => [item.sourceAccountId, item.targetAccountId])] : accounts.map((item) => item.id));
  return <div className="map-explorer" aria-label="Account dependency map">
    <div className="map-toolbar"><span>{accounts.length} identities · {relationships.length} relationships</span><span>Directed edges show dependency direction</span></div>
    <div className="dependency-map">
      <ReactFlow edges={edges.map((edge) => ({ ...edge, style: { ...edge.style, opacity: focusedIds.has(edge.source) && focusedIds.has(edge.target) ? 1 : .14 } }))} fitView minZoom={0.35} nodes={nodes.map((node) => ({ ...node, style: { opacity: focusedIds.has(node.id) ? 1 : .28 } }))} onNodeClick={(_, node) => setSelectedId(node.id)} proOptions={{ hideAttribution: true }}>
        <Background gap={28} size={1} /><Controls showInteractive={false} />
      </ReactFlow>
    </div>
    {selected && <aside className="map-inspector"><div><p className="eyebrow">Relationship focus</p><h3>{selected.accountName}</h3><p>{related.filter((item) => item.targetAccountId === selected.id).length} incoming · {related.filter((item) => item.sourceAccountId === selected.id).length} outgoing</p></div><button className="secondary-button" onClick={() => onSelectAccount(selected)} type="button">Open account</button></aside>}
  </div>;
}

function AccountNode({ account }: { account: Account }) { return <div className="map-node"><ServiceIdentityMark account={account} size="small" /><div><strong>{account.accountName}</strong><small>{account.email || account.username || account.serviceName}</small></div></div>; }
