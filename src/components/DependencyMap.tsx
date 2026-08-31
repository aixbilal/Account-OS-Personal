import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type { Account, AccountRelationship } from "../domain/types";

interface DependencyMapProps {
  accounts: Account[];
  onSelectAccount: (account: Account) => void;
  relationships: AccountRelationship[];
}

export function buildDependencyGraph(accounts: Account[], relationships: AccountRelationship[]) {
  const nodes: Node[] = accounts.map((account, index) => ({
    id: account.id,
    position: { x: (index % 3) * 290, y: Math.floor(index / 3) * 175 },
    data: { label: <AccountNode account={account} /> },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
  const accountIds = new Set(accounts.map((account) => account.id));
  const edges: Edge[] = relationships
    .filter((relationship) => accountIds.has(relationship.sourceAccountId) && accountIds.has(relationship.targetAccountId))
    .map((relationship) => ({
      id: relationship.id,
      source: relationship.sourceAccountId,
      target: relationship.targetAccountId,
      label: relationship.type,
      type: "smoothstep",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
  return { nodes, edges };
}

export function DependencyMap({ accounts, onSelectAccount, relationships }: DependencyMapProps) {
  const { nodes, edges } = useMemo(() => buildDependencyGraph(accounts, relationships), [accounts, relationships]);
  const accountsById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);

  if (!accounts.length) return <div className="vault-empty"><h3>No accounts to map.</h3><p>Add accounts and relationships to see their dependencies.</p></div>;

  return <div className="dependency-map" aria-label="Account dependency map">
    <ReactFlow
      edges={edges}
      fitView
      minZoom={0.35}
      nodes={nodes}
      onNodeClick={(_, node) => {
        const account = accountsById.get(node.id);
        if (account) onSelectAccount(account);
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}

function AccountNode({ account }: { account: Account }) {
  return <div className="map-node"><span>{account.category}</span><strong>{account.accountName}</strong><small>{account.authenticationMethod}</small></div>;
}
