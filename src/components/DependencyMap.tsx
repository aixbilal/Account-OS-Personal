import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  getStraightPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link2, Maximize2, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Account, AccountRelationship } from "../domain/types";
import { relationshipTypeLabels } from "./RelationshipDialog";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface DependencyMapProps {
  accounts: Account[];
  onOpenAccount: (account: Account) => void;
  onRequestRelationship: (sourceAccountId?: string) => void;
  onSelectAccount: (account: Account) => void;
  relationships: AccountRelationship[];
}

export type MapAccount = Pick<Account, "id" | "accountName" | "serviceName" | "category">;
export type FocusState = "normal" | "selected" | "related" | "muted";
type AccountNodeData = { account: MapAccount; focus: FocusState };
type RelationshipEdgeData = { label: string; focus: FocusState };
type AccountNode = Node<AccountNodeData, "account">;
type RelationshipEdge = Edge<RelationshipEdgeData, "relationship">;

const nodeWidth = 232;
const nodeHeight = 78;
const layoutSpacing = 250;

export function toMapAccount(account: Account): MapAccount {
  return { id: account.id, accountName: account.accountName, serviceName: account.serviceName, category: account.category };
}

export function resolveMapNodeFocus(
  nodeId: string,
  selectedId: string | undefined,
  relatedIds: ReadonlySet<string>,
  matchingIds: ReadonlySet<string>,
  hasQuery: boolean,
): FocusState {
  if (hasQuery) {
    if (!matchingIds.has(nodeId)) return "muted";
    return nodeId === selectedId ? "selected" : "normal";
  }
  if (!selectedId) return "normal";
  if (nodeId === selectedId) return "selected";
  return relatedIds.has(nodeId) ? "related" : "muted";
}

export function buildDependencyGraph(accounts: Account[], relationships: AccountRelationship[]) {
  const sortedAccounts = [...accounts].sort((left, right) => left.id.localeCompare(right.id));
  const ids = new Set(sortedAccounts.map((account) => account.id));
  const accountById = new Map(sortedAccounts.map((account) => [account.id, account]));
  const validRelationships = relationships
    .filter((relationship) => ids.has(relationship.sourceAccountId) && ids.has(relationship.targetAccountId))
    .sort((left, right) => left.id.localeCompare(right.id));

  // Weight each account by how connected it is, so hubs settle near the centre.
  const degree = new Map(sortedAccounts.map((account) => [account.id, 0]));
  validRelationships.forEach((relationship) => {
    degree.set(relationship.sourceAccountId, (degree.get(relationship.sourceAccountId) ?? 0) + 1);
    degree.set(relationship.targetAccountId, (degree.get(relationship.targetAccountId) ?? 0) + 1);
  });
  const ordered = [...sortedAccounts].sort((left, right) => {
    const byDegree = (degree.get(right.id) ?? 0) - (degree.get(left.id) ?? 0);
    return byDegree !== 0 ? byDegree : left.id.localeCompare(right.id);
  });

  // Deterministic phyllotaxis (sunflower) placement: compact, balanced, hub-centred.
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const position = new Map<string, { x: number; y: number }>();
  ordered.forEach((account, index) => {
    const radius = layoutSpacing * Math.sqrt(index + 0.6);
    const angle = index * goldenAngle;
    position.set(account.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.74 });
  });

  const nodes: AccountNode[] = sortedAccounts.map((account) => {
    const point = position.get(account.id)!;
    return {
      id: account.id,
      type: "account",
      position: { x: point.x - nodeWidth / 2, y: point.y - nodeHeight / 2 },
      data: { account: toMapAccount(account), focus: "normal" },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      ariaLabel: `${account.accountName}, ${account.serviceName}`,
    };
  });
  const edges: RelationshipEdge[] = validRelationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.sourceAccountId,
    target: relationship.targetAccountId,
    type: "relationship",
    data: { label: relationshipTypeLabels[relationship.relationshipType], focus: "normal" },
    ariaLabel: `${accountById.get(relationship.sourceAccountId)?.accountName ?? "Source account"} ${relationshipTypeLabels[relationship.relationshipType]} ${accountById.get(relationship.targetAccountId)?.accountName ?? "target account"}`,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 },
  }));
  return { nodes, edges };
}

const nodeTypes = { account: AccountMapNode };
const edgeTypes = { relationship: RelationshipMapEdge };

export function DependencyMap({ accounts, relationships, onSelectAccount, onOpenAccount, onRequestRelationship }: DependencyMapProps) {
  const baseGraph = useMemo(() => buildDependencyGraph(accounts, relationships), [accounts, relationships]);
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState("");
  const [flow, setFlow] = useState<ReactFlowInstance<AccountNode, RelationshipEdge>>();
  const byId = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedRelationships = selectedId ? relationships.filter((relationship) => relationship.sourceAccountId === selectedId || relationship.targetAccountId === selectedId) : [];
  const relatedIds = new Set(selectedRelationships.flatMap((relationship) => [relationship.sourceAccountId, relationship.targetAccountId]));
  const normalizedQuery = query.trim().toLowerCase();
  const matchingIds = new Set(accounts.filter((account) => `${account.accountName} ${account.serviceName} ${account.category}`.toLowerCase().includes(normalizedQuery)).map((account) => account.id));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nodes = baseGraph.nodes.map((node): AccountNode => {
    const focus = resolveMapNodeFocus(node.id, selectedId, relatedIds, matchingIds, Boolean(normalizedQuery));
    return { ...node, data: { ...node.data, focus }, selected: node.id === selectedId };
  });
  const edges = baseGraph.edges.map((edge): RelationshipEdge => {
    const touchesSelected = Boolean(selectedId && (edge.source === selectedId || edge.target === selectedId));
    const queryVisible = !normalizedQuery || matchingIds.has(edge.source) || matchingIds.has(edge.target);
    const focus: FocusState = (selectedId && !touchesSelected) || !queryVisible ? "muted" : touchesSelected ? "related" : "normal";
    return { ...edge, data: { ...edge.data!, focus }, selected: touchesSelected };
  });

  if (!accounts.length) {
    return <div className="map-empty"><div><Link2 aria-hidden="true" size={30} /><h3>No accounts to map</h3><p>Add accounts and real relationships to see their dependencies here.</p></div></div>;
  }

  return (
    <div className="map-explorer" aria-label="Account dependency map">
      <div className="map-toolbar">
        <label className="map-search" htmlFor="map-search"><Search aria-hidden="true" size={16} /><input autoComplete="off" id="map-search" name="mapSearch" onChange={(event) => setQuery(event.target.value)} placeholder="Search the map…" type="search" value={query} />{query && <button aria-label="Clear Map search" onClick={() => setQuery("")} type="button"><X size={15} /></button>}</label>
        <button className="secondary-button" onClick={() => flow?.fitView({ padding: 0.22, maxZoom: 0.9, duration: reduceMotion ? 0 : 180 })} type="button"><Maximize2 size={15} />Fit graph</button>
        <button className="primary-button" disabled={accounts.length < 2} onClick={() => onRequestRelationship(selected?.id)} title={accounts.length < 2 ? "Add a second account to create a relationship" : undefined} type="button"><Plus size={16} />Relationship</button>
      </div>
      <div className="map-layout">
        <div className="dependency-map">
          <ReactFlow<AccountNode, RelationshipEdge>
            edges={edges}
            edgesReconnectable={false}
            edgeTypes={edgeTypes}
            deleteKeyCode={null}
            fitView
            fitViewOptions={{ padding: 0.22, maxZoom: 0.9 }}
            minZoom={0.35}
            maxZoom={1.75}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            nodesDraggable={false}
            nodeTypes={nodeTypes}
            nodes={nodes}
            onInit={setFlow}
            onNodeClick={(_, node) => {
              setSelectedId(node.id);
              const account = byId.get(node.id);
              if (account) onSelectAccount(account);
            }}
          >
            <Background color="var(--aos-border-strong)" gap={34} size={0.8} />
            <Controls position="bottom-left" showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="map-inspector" aria-label="Map selection details">
          {selected ? (
            <>
              <div className="map-inspector-heading"><ServiceIdentityMark account={selected} /><div><p className="eyebrow">Selected account</p><h3>{selected.accountName}</h3><span>{selected.serviceName} · {selected.category}</span></div></div>
              <div className="map-counts"><div><strong>{selectedRelationships.filter((relationship) => relationship.targetAccountId === selected.id).length}</strong><span>Incoming</span></div><div><strong>{selectedRelationships.filter((relationship) => relationship.sourceAccountId === selected.id).length}</strong><span>Outgoing</span></div></div>
              <div className="map-connections"><p className="eyebrow">Connections</p>{selectedRelationships.length ? selectedRelationships.map((relationship) => {
                const counterpartId = relationship.sourceAccountId === selected.id ? relationship.targetAccountId : relationship.sourceAccountId;
                const counterpart = byId.get(counterpartId);
                return <div key={relationship.id}>{counterpart && <ServiceIdentityMark account={counterpart} size="small" />}<span><strong>{counterpart?.accountName ?? "Missing account"}</strong><small>{relationshipTypeLabels[relationship.relationshipType]}</small></span></div>;
              }) : <p>No relationships for this account.</p>}</div>
              <div className="map-inspector-actions"><button className="secondary-button" onClick={() => onOpenAccount(selected)} type="button">Open in Vault</button><button className="primary-button" disabled={accounts.length < 2} onClick={() => onRequestRelationship(selected.id)} title={accounts.length < 2 ? "Add a second account to create a relationship" : undefined} type="button">Create relationship</button></div>
            </>
          ) : (
            <div className="map-inspector-empty"><Link2 aria-hidden="true" size={26} /><h3>Select an account</h3><p>Choose a real account node to focus its incoming and outgoing relationships.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
}

function AccountMapNode({ data, selected }: NodeProps<AccountNode>) {
  return (
    <div className="map-node" data-focus={data.focus} data-selected={selected || undefined}>
      <Handle className="map-handle" isConnectable={false} position={Position.Top} type="target" />
      <ServiceIdentityMark account={data.account} size="small" />
      <div><strong>{data.account.accountName}</strong><small>{data.account.serviceName} · {data.account.category}</small></div>
      <Handle className="map-handle" isConnectable={false} position={Position.Bottom} type="source" />
    </div>
  );
}

function RelationshipMapEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, data }: EdgeProps<RelationshipEdge>) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <>
      <BaseEdge className="map-edge-path" id={id} markerEnd={markerEnd} path={path} style={{ opacity: data?.focus === "muted" ? 0.12 : 1 }} />
      <EdgeLabelRenderer><span className="map-edge-label" data-focus={data?.focus} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>{data?.label}</span></EdgeLabelRenderer>
    </>
  );
}
