import dagre from "@dagrejs/dagre";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  getSmoothStepPath,
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
type FocusState = "normal" | "selected" | "related" | "muted";
type AccountNodeData = { account: MapAccount; focus: FocusState };
type RelationshipEdgeData = { label: string; focus: FocusState };
type AccountNode = Node<AccountNodeData, "account">;
type RelationshipEdge = Edge<RelationshipEdgeData, "relationship">;

const nodeWidth = 224;
const nodeHeight = 78;

export function toMapAccount(account: Account): MapAccount {
  return { id: account.id, accountName: account.accountName, serviceName: account.serviceName, category: account.category };
}

export function buildDependencyGraph(accounts: Account[], relationships: AccountRelationship[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "LR", ranksep: 92, nodesep: 48, edgesep: 24, marginx: 30, marginy: 30 });
  graph.setDefaultEdgeLabel(() => ({}));
  const sortedAccounts = [...accounts].sort((left, right) => left.id.localeCompare(right.id));
  const ids = new Set(sortedAccounts.map((account) => account.id));
  const validRelationships = relationships
    .filter((relationship) => ids.has(relationship.sourceAccountId) && ids.has(relationship.targetAccountId))
    .sort((left, right) => left.id.localeCompare(right.id));

  sortedAccounts.forEach((account) => graph.setNode(account.id, { width: nodeWidth, height: nodeHeight }));
  validRelationships.forEach((relationship) => graph.setEdge(relationship.sourceAccountId, relationship.targetAccountId, { id: relationship.id }));
  dagre.layout(graph);

  const nodes: AccountNode[] = sortedAccounts.map((account) => {
    const position = graph.node(account.id);
    return {
      id: account.id,
      type: "account",
      position: { x: position.x - nodeWidth / 2, y: position.y - nodeHeight / 2 },
      data: { account: toMapAccount(account), focus: "normal" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      ariaLabel: `${account.accountName}, ${account.serviceName}`,
    };
  });
  const edges: RelationshipEdge[] = validRelationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.sourceAccountId,
    target: relationship.targetAccountId,
    type: "relationship",
    data: { label: relationshipTypeLabels[relationship.relationshipType], focus: "normal" },
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

  const nodes = baseGraph.nodes.map((node): AccountNode => {
    let focus: FocusState = "normal";
    if (selectedId) focus = node.id === selectedId ? "selected" : relatedIds.has(node.id) ? "related" : "muted";
    if (normalizedQuery && !matchingIds.has(node.id)) focus = "muted";
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
        <label className="map-search" htmlFor="map-search"><Search aria-hidden="true" size={16} /><input autoComplete="off" id="map-search" name="mapSearch" onChange={(event) => setQuery(event.target.value)} placeholder="Search the map" type="search" value={query} />{query && <button aria-label="Clear Map search" onClick={() => setQuery("")} type="button"><X size={15} /></button>}</label>
        <button className="secondary-button" onClick={() => flow?.fitView({ padding: 0.22, duration: 180 })} type="button"><Maximize2 size={15} />Fit graph</button>
        <button className="primary-button" disabled={accounts.length < 2} onClick={() => onRequestRelationship(selected?.id)} title={accounts.length < 2 ? "Add a second account to create a relationship" : undefined} type="button"><Plus size={16} />Relationship</button>
      </div>
      <div className="map-layout">
        <div className="dependency-map">
          <ReactFlow<AccountNode, RelationshipEdge>
            edges={edges}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.22 }}
            minZoom={0.28}
            nodeTypes={nodeTypes}
            nodes={nodes}
            onInit={setFlow}
            onNodeClick={(_, node) => {
              setSelectedId(node.id);
              const account = byId.get(node.id);
              if (account) onSelectAccount(account);
            }}
            proOptions={{ hideAttribution: true }}
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
      <Handle className="map-handle" isConnectable={false} position={Position.Left} type="target" />
      <ServiceIdentityMark account={data.account} size="small" />
      <div><strong>{data.account.accountName}</strong><small>{data.account.serviceName} · {data.account.category}</small></div>
      <Handle className="map-handle" isConnectable={false} position={Position.Right} type="source" />
    </div>
  );
}

function RelationshipMapEdge({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, markerEnd, data }: EdgeProps<RelationshipEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 18 });
  return (
    <>
      <BaseEdge className="map-edge-path" id={id} markerEnd={markerEnd} path={path} style={{ opacity: data?.focus === "muted" ? 0.12 : 1 }} />
      <EdgeLabelRenderer><span className="map-edge-label" data-focus={data?.focus} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>{data?.label}</span></EdgeLabelRenderer>
    </>
  );
}
