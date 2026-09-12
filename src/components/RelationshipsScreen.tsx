import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowUpDown, CircleOff, Grid3x3, Link2, List, Network, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Account, AccountRelationship } from "../domain/types";
import { AccountConnectionsPanel } from "./AccountConnectionsPanel";
import { buildEgoGraph, mapEdgeTypes, mapNodeTypes } from "./DependencyMap";
import { relationshipTypeLabels } from "./RelationshipDialog";
import { ServiceIdentityMark } from "./ServiceIdentity";

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
  const [listSort, setListSort] = useState<{ key: ListSortKey; direction: "asc" | "desc" }>({ key: "account", direction: "asc" });
  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const focusAccount = focusId ? accountById.get(focusId) : undefined;

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

        <AccountConnectionsPanel
          account={focusAccount}
          accounts={accounts}
          ariaLabel="Focused account details"
          className="relationship-side-panel"
          emptyStateHint="Choose a focus account to see its connections."
          onDelete={onDelete}
          onEdit={onEdit}
          onEditRelationship={onEditRelationship}
          onFocusAccount={setFocusId}
          onNotify={onNotify}
          onOpenAccount={onOpenAccount}
          onRemoveRelationship={onRemoveRelationship}
          onRequestRelationship={onRequestRelationship}
          relationships={relationships}
        />
      </div>
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
