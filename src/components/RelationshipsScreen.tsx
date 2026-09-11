import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CircleOff, Link2, Plus, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { relationshipsForAccount } from "../domain/relationships";
import type { Account, AccountRelationship } from "../domain/types";
import { buildEgoGraph, mapEdgeTypes, mapNodeTypes } from "./DependencyMap";
import { relationshipTypeLabels } from "./RelationshipDialog";
import { ServiceIdentityMark } from "./ServiceIdentity";

interface RelationshipsScreenProps {
  accounts: Account[];
  onOpenAccount: (account: Account) => void;
  onRequestRelationship: (sourceAccountId?: string) => void;
  relationships: AccountRelationship[];
}

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

export function RelationshipsScreen({ accounts, onOpenAccount, onRequestRelationship, relationships }: RelationshipsScreenProps) {
  const [focusId, setFocusId] = useState<string | undefined>(() => mostConnectedAccountId(accounts, relationships));
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
  const focusRelationships = focusId ? relationshipsForAccount(relationships, focusId) : [];

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
            <div><h2>Relationship map</h2><p>Pick an account to see just its direct connections.</p></div>
            <label className="relationship-focus-picker" htmlFor="relationship-focus-account">
              Focus account
              <select id="relationship-focus-account" name="relationshipFocusAccount" onChange={(event) => setFocusId(event.target.value)} value={focusId ?? ""}>
                {[...accounts].sort((left, right) => left.accountName.localeCompare(right.accountName)).map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}
              </select>
            </label>
          </div>
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
        </div>

        <aside className="relationship-side-panel" aria-label="Focused account connections">
          {focusAccount ? (
            <>
              <div className="relationship-side-heading">
                <ServiceIdentityMark account={focusAccount} />
                <div><strong>{focusAccount.accountName}</strong><span>{focusRelationships.length} relationship{focusRelationships.length === 1 ? "" : "s"}</span></div>
                <button className="secondary-button compact-button" onClick={() => onOpenAccount(focusAccount)} type="button">Open</button>
              </div>
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
                          <button className="inspector-relationship" onClick={() => setFocusId(counterpart.id)} type="button">
                            <ServiceIdentityMark account={counterpart} size="small" />
                            <span><strong>{counterpart.accountName}</strong><small>{relationshipTypeLabels[relationship.relationshipType]}</small></span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="inspector-muted">No connections yet for this account.</p>}
              </div>
              <button className="primary-button" onClick={() => onRequestRelationship(focusAccount.id)} type="button"><Plus size={16} />Add relationship</button>
            </>
          ) : (
            <div className="map-inspector-empty"><Link2 aria-hidden="true" size={26} /><h3>Select an account</h3><p>Choose a focus account to see its connections.</p></div>
          )}
        </aside>
      </div>
    </section>
  );
}
