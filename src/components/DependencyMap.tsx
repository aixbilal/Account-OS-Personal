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
import { toSvg } from "html-to-image";
import { Download, Grid3x3, Link2, Maximize2, Plus, Search, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ACCOUNT_CATEGORIES, type Account, type AccountCategory, type AccountRelationship } from "../domain/types";
import { AccountConnectionsPanel } from "./AccountConnectionsPanel";
import { relationshipTypeLabels } from "./RelationshipDialog";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface DependencyMapProps {
  accounts: Account[];
  onDelete?: (account: Account) => Promise<void>;
  onEdit: (account: Account) => void;
  onEditRelationship: (relationship: AccountRelationship) => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenAccount: (account: Account) => void;
  onRemoveRelationship: (relationship: AccountRelationship) => void;
  onRequestRelationship: (sourceAccountId?: string) => void;
  onSelectAccount: (account: Account) => void;
  relationships: AccountRelationship[];
}

/**
 * Phase 6 restyle: a purely visual category hint (a small colored dot per
 * node) - not a new entity type, and not a layout change, so the existing
 * deterministic phyllotaxis positions are untouched. Reused on both the
 * full Map and the Relationships screen's ego-graph view since they share
 * the same node renderer.
 */
export const categoryMapColors: Record<AccountCategory, string> = {
  Personal: "#2c84fc",
  Development: "#3f8f5c",
  Social: "#b8548c",
  University: "#c98a2e",
  Finance: "#3f8b8f",
  Work: "#5c6bc0",
  Other: "#7c8494",
};

export type MapAccount = Pick<Account, "id" | "accountName" | "serviceName" | "category">;
export type FocusState = "normal" | "selected" | "related" | "muted";
type AccountNodeData = { account: MapAccount; focus: FocusState };
type RelationshipEdgeData = { label: string; focus: FocusState };
type AccountNode = Node<AccountNodeData, "account">;
type RelationshipEdge = Edge<RelationshipEdgeData, "relationship">;

const nodeWidth = 232;
const nodeHeight = 78;
const layoutSpacing = 250;

/** Rasterizes an SVG data URL to a PNG data URL with a plain `Image` +
 * `<canvas>` - see the `exportMapAsPng` comment for why this is used
 * instead of `html-to-image`'s own `toPng`/`toCanvas`. */
function rasterizeSvgToPng(svgDataUrl: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas 2D is not supported"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Failed to rasterize the map"));
    image.src = svgDataUrl;
  });
}

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

/** The Map toolbar's Layout control (Item 4, UI Refinement Pass 2): the
 * original deterministic phyllotaxis placement, plus one genuine second
 * arrangement rather than a dropdown that implies choice without
 * delivering it. "Grid" groups accounts by category (then name) into a
 * plain deterministic row/column grid - a real, different, useful way to
 * scan the same accounts, not a cosmetic reshuffle of the same layout. */
export type MapLayoutMode = "organic" | "grid";
export const mapLayoutLabels: Record<MapLayoutMode, string> = { organic: "Organic", grid: "Grid" };

function computeOrganicPositions(sortedAccounts: Account[], validRelationships: AccountRelationship[]) {
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
  return position;
}

function computeGridPositions(sortedAccounts: Account[]) {
  // Grouped by category (then name) so the grid reads as clusters, not an
  // arbitrary row-major dump of whatever order accounts happen to be in.
  const ordered = [...sortedAccounts].sort((left, right) => left.category.localeCompare(right.category) || left.accountName.localeCompare(right.accountName));
  const columns = Math.max(1, Math.ceil(Math.sqrt(ordered.length)));
  const position = new Map<string, { x: number; y: number }>();
  ordered.forEach((account, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    position.set(account.id, { x: column * layoutSpacing * 1.15, y: row * layoutSpacing * 0.85 });
  });
  return position;
}

export function buildDependencyGraph(accounts: Account[], relationships: AccountRelationship[], layout: MapLayoutMode = "organic") {
  const sortedAccounts = [...accounts].sort((left, right) => left.id.localeCompare(right.id));
  const ids = new Set(sortedAccounts.map((account) => account.id));
  const accountById = new Map(sortedAccounts.map((account) => [account.id, account]));
  const validRelationships = relationships
    .filter((relationship) => ids.has(relationship.sourceAccountId) && ids.has(relationship.targetAccountId))
    .sort((left, right) => left.id.localeCompare(right.id));

  const position = layout === "grid" ? computeGridPositions(sortedAccounts) : computeOrganicPositions(sortedAccounts, validRelationships);

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

export const mapNodeTypes = { account: AccountMapNode };
export const mapEdgeTypes = { relationship: RelationshipMapEdge };
const nodeTypes = mapNodeTypes;
const edgeTypes = mapEdgeTypes;

/**
 * A single account's direct connections only, laid out radially (the
 * account at the centre, each direct neighbour spaced evenly on a circle
 * around it) - the Relationships screen's ego-network view (Phase 5).
 * Reuses the same node/edge shapes and renderers as the full Map so the
 * two surfaces read as one coherent system (DI-011), just scoped down to
 * one account instead of the whole vault.
 */
export function buildEgoGraph(accounts: Account[], relationships: AccountRelationship[], focusAccountId: string) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const focusAccount = accountById.get(focusAccountId);
  if (!focusAccount) return { nodes: [] as AccountNode[], edges: [] as RelationshipEdge[] };

  const direct = relationships.filter(
    (relationship) =>
      (relationship.sourceAccountId === focusAccountId || relationship.targetAccountId === focusAccountId)
      && accountById.has(relationship.sourceAccountId)
      && accountById.has(relationship.targetAccountId),
  );
  const neighborIds = [...new Set(direct.map((relationship) =>
    relationship.sourceAccountId === focusAccountId ? relationship.targetAccountId : relationship.sourceAccountId,
  ))];

  const radius = neighborIds.length > 6 ? 300 : 240;
  const nodes: AccountNode[] = [
    {
      id: focusAccountId,
      type: "account",
      position: { x: -nodeWidth / 2, y: -nodeHeight / 2 },
      data: { account: toMapAccount(focusAccount), focus: "selected" },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      ariaLabel: `${focusAccount.accountName}, focused account`,
    },
    ...neighborIds.map((id, index): AccountNode => {
      const account = accountById.get(id)!;
      const angle = (index / neighborIds.length) * Math.PI * 2 - Math.PI / 2;
      const point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.85 };
      return {
        id,
        type: "account",
        position: { x: point.x - nodeWidth / 2, y: point.y - nodeHeight / 2 },
        data: { account: toMapAccount(account), focus: "related" },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        ariaLabel: `${account.accountName}, ${account.serviceName}`,
      };
    }),
  ];
  const edges: RelationshipEdge[] = direct.map((relationship) => ({
    id: relationship.id,
    source: relationship.sourceAccountId,
    target: relationship.targetAccountId,
    type: "relationship",
    data: { label: relationshipTypeLabels[relationship.relationshipType], focus: "related" },
    ariaLabel: `${accountById.get(relationship.sourceAccountId)?.accountName ?? "Source account"} ${relationshipTypeLabels[relationship.relationshipType]} ${accountById.get(relationship.targetAccountId)?.accountName ?? "target account"}`,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 },
  }));
  return { nodes, edges };
}

export function DependencyMap({ accounts, relationships, onDelete, onEdit, onEditRelationship, onNotify, onSelectAccount, onOpenAccount, onRemoveRelationship, onRequestRelationship }: DependencyMapProps) {
  const [layoutMode, setLayoutMode] = useState<MapLayoutMode>("organic");
  const [categoryFilter, setCategoryFilter] = useState<AccountCategory | "all">("all");
  const [exporting, setExporting] = useState(false);
  const baseGraph = useMemo(() => buildDependencyGraph(accounts, relationships, layoutMode), [accounts, relationships, layoutMode]);
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState("");
  const [flow, setFlow] = useState<ReactFlowInstance<AccountNode, RelationshipEdge>>();
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const clearSelection = () => setSelectedId(undefined);
  const byId = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  /** Selects a node both for the graph's own focus-dimming (selectedId) and
   * for the host App's selection state (onSelectAccount) - shared by a
   * node click and by re-focusing from a connected-account row inside the
   * side panel (Item 3, UI Refinement Pass 2). */
  function focusAccount(accountId: string) {
    setSelectedId(accountId);
    const account = byId.get(accountId);
    if (account) onSelectAccount(account);
  }
  const selectedRelationships = selectedId ? relationships.filter((relationship) => relationship.sourceAccountId === selectedId || relationship.targetAccountId === selectedId) : [];
  const relatedIds = new Set(selectedRelationships.flatMap((relationship) => [relationship.sourceAccountId, relationship.targetAccountId]));
  const normalizedQuery = query.trim().toLowerCase();
  const hasCategoryFilter = categoryFilter !== "all";
  const hasFilter = Boolean(normalizedQuery) || hasCategoryFilter;
  // Item 4 (UI Refinement Pass 2): the category filter reuses the exact
  // pattern already built for the Vault list (a plain category select),
  // combined here with the existing search-match set rather than as a
  // separate dimming mechanism - a node must satisfy both to read as
  // "matching".
  const matchingIds = new Set(
    accounts
      .filter((account) => (!hasCategoryFilter || account.category === categoryFilter) && `${account.accountName} ${account.serviceName} ${account.category}`.toLowerCase().includes(normalizedQuery))
      .map((account) => account.id),
  );
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Item 4 (UI Refinement Pass 2) - Export: a real PNG of the current map
   * (whatever the current layout/filter/pan/zoom dims on screen is dimmed
   * in the export too).
   *
   * Two real issues were found live and fixed, not assumed away:
   * (1) `html-to-image`'s own `toPng`/`toCanvas` resolve their internal
   * image load via `requestAnimationFrame`, which the browser suspends on
   * a background/hidden tab (confirmed live: rAF simply never fires
   * there) - hung this feature completely during this session's own
   * automated testing. Fixed by using `toSvg` (no rAF involved) and
   * rasterizing that SVG to PNG myself with a plain `Image`/`<canvas>`
   * (`rasterizeSvgToPng` below), which only needs a plain `onload`.
   * (2) Passing an arbitrary `width`/`height` to `toSvg` - anything other
   * than `.react-flow__viewport`'s own real `scrollWidth`/`scrollHeight` -
   * produced a technically-successful but completely blank PNG (confirmed
   * live, side by side against the same capture at its real scroll size).
   * SVG's `<foreignObject>` clips HTML content to its own box regardless
   * of the source element's `overflow: visible`, so every absolutely-
   * positioned node account this layout places outside a guessed box
   * simply vanished. Fixed by always using the real `scrollWidth`/
   * `scrollHeight`, which correctly encloses every node regardless of the
   * current pan/zoom. */
  async function exportMapAsPng() {
    const viewportEl = mapWrapperRef.current?.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewportEl) return;
    setExporting(true);
    try {
      const width = viewportEl.scrollWidth;
      const height = viewportEl.scrollHeight;
      const background = getComputedStyle(document.documentElement).getPropertyValue("--aos-bg").trim() || "#ffffff";
      const svgDataUrl = await toSvg(viewportEl, { backgroundColor: background, width, height });
      const dataUrl = await rasterizeSvgToPng(svgDataUrl, width, height);
      const link = document.createElement("a");
      link.download = `account-os-map-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      onNotify?.("Map exported as a PNG image", "success");
    } catch {
      onNotify?.("Map export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  const nodes = baseGraph.nodes.map((node): AccountNode => {
    const focus = resolveMapNodeFocus(node.id, selectedId, relatedIds, matchingIds, hasFilter);
    return { ...node, data: { ...node.data, focus }, selected: node.id === selectedId };
  });
  const edges = baseGraph.edges.map((edge): RelationshipEdge => {
    const touchesSelected = Boolean(selectedId && (edge.source === selectedId || edge.target === selectedId));
    const filterVisible = !hasFilter || (matchingIds.has(edge.source) || matchingIds.has(edge.target));
    const focus: FocusState = (selectedId && !touchesSelected) || !filterVisible ? "muted" : touchesSelected ? "related" : "normal";
    return { ...edge, data: { ...edge.data!, focus }, selected: touchesSelected };
  });

  if (!accounts.length) {
    return <div className="map-empty"><div><Link2 aria-hidden="true" size={30} /><h3>No accounts to map</h3><p>Add accounts and real relationships to see their dependencies here.</p></div></div>;
  }

  return (
    <div className="map-explorer" aria-label="Account dependency map">
      <div className="map-toolbar">
        <label className="map-search" htmlFor="map-search"><Search aria-hidden="true" size={16} /><input autoComplete="off" id="map-search" name="mapSearch" onChange={(event) => setQuery(event.target.value)} placeholder="Search the map…" type="search" value={query} />{query && <button aria-label="Clear Map search" onClick={() => setQuery("")} type="button"><X size={15} /></button>}</label>
        <select aria-label="Filter the map by category" className="map-filter" name="mapCategoryFilter" onChange={(event) => setCategoryFilter(event.target.value as AccountCategory | "all")} value={categoryFilter}>
          <option value="all">All categories</option>
          {ACCOUNT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
        <div className="relationship-view-toggle map-layout-toggle" role="group" aria-label="Map layout">
          <button aria-pressed={layoutMode === "organic"} data-active={layoutMode === "organic"} onClick={() => setLayoutMode("organic")} title="Organic: a compact, hub-centred arrangement" type="button"><Sparkles aria-hidden="true" size={14} />Organic</button>
          <button aria-pressed={layoutMode === "grid"} data-active={layoutMode === "grid"} onClick={() => setLayoutMode("grid")} title="Grid: accounts grouped by category in rows" type="button"><Grid3x3 aria-hidden="true" size={14} />Grid</button>
        </div>
        <button className="secondary-button" disabled={exporting} onClick={() => void exportMapAsPng()} type="button"><Download size={15} />{exporting ? "Exporting…" : "Export"}</button>
        <button className="secondary-button" onClick={() => flow?.fitView({ padding: 0.22, maxZoom: 0.9, duration: reduceMotion ? 0 : 180 })} type="button"><Maximize2 size={15} />Fit graph</button>
        <button className="primary-button" disabled={accounts.length < 2} onClick={() => onRequestRelationship(selected?.id)} title={accounts.length < 2 ? "Add a second account to create a relationship" : undefined} type="button"><Plus size={16} />Relationship</button>
      </div>
      <div className="map-layout">
        <div
          className="dependency-map"
          ref={mapWrapperRef}
          onKeyDown={(event) => {
            if (event.key === "Escape" && selectedId) {
              event.stopPropagation();
              clearSelection();
            }
          }}
        >
          <ReactFlow<AccountNode, RelationshipEdge>
            edges={edges}
            edgesReconnectable={false}
            edgeTypes={edgeTypes}
            deleteKeyCode={null}
            fitView
            fitViewOptions={{ padding: 0.22, maxZoom: 0.9 }}
            minZoom={0.35}
            maxZoom={1.75}
            nodesConnectable={false}
            nodesDraggable={false}
            nodeTypes={nodeTypes}
            nodes={nodes}
            onInit={setFlow}
            onNodeClick={(_, node) => focusAccount(node.id)}
            onPaneClick={clearSelection}
          >
            <Background color="var(--aos-border-strong)" gap={34} size={0.8} />
            <Controls position="bottom-left" showInteractive={false} />
          </ReactFlow>
          <ul className="map-legend" aria-label="Category color key">
            {ACCOUNT_CATEGORIES.map((category) => <li key={category}><i aria-hidden="true" style={{ background: categoryMapColors[category] }} />{category}</li>)}
          </ul>
        </div>
        <AccountConnectionsPanel
          account={selected}
          accounts={accounts}
          ariaLabel="Map selection details"
          className="map-inspector"
          emptyStateHint="Choose a real account node to see its details and connections."
          onDelete={onDelete}
          onEdit={onEdit}
          onEditRelationship={onEditRelationship}
          onFocusAccount={focusAccount}
          onNotify={onNotify}
          onOpenAccount={onOpenAccount}
          onRemoveRelationship={onRemoveRelationship}
          onRequestRelationship={onRequestRelationship}
          relationships={relationships}
        />
      </div>
    </div>
  );
}

function AccountMapNode({ data, selected }: NodeProps<AccountNode>) {
  return (
    <div className="map-node" data-focus={data.focus} data-selected={selected || undefined}>
      <Handle className="map-handle" isConnectable={false} position={Position.Top} type="target" />
      <span aria-hidden="true" className="map-node-category-dot" style={{ background: categoryMapColors[data.account.category] }} title={data.account.category} />
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
