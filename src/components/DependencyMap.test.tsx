import { describe, expect, it } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { buildDependencyGraph, toMapAccount } from "./DependencyMap";

describe("buildDependencyGraph", () => {
  it("creates deterministic nodes and friendly directed edges", () => {
    const graph = buildDependencyGraph(fakeVault.accounts, fakeVault.relationships);
    const reordered = buildDependencyGraph([...fakeVault.accounts].reverse(), [...fakeVault.relationships].reverse());

    expect(graph.nodes).toHaveLength(fakeVault.accounts.length);
    expect(graph.edges).toHaveLength(fakeVault.relationships.length);
    expect(graph.edges.find((edge) => edge.id === "relationship-google-claude-test")).toMatchObject({
      source: "account-claude-personal-test",
      target: "account-google-personal-test",
      data: { label: "Google sign-in", focus: "normal" },
    });
    expect(reordered.nodes.map(({ id, position }) => ({ id, position }))).toEqual(
      graph.nodes.map(({ id, position }) => ({ id, position })),
    );
    expect(reordered.edges.map((edge) => edge.id)).toEqual(graph.edges.map((edge) => edge.id));
  });

  it("ignores orphan relationships instead of inventing graph entities", () => {
    const graph = buildDependencyGraph(fakeVault.accounts, [
      ...fakeVault.relationships,
      {
        id: "relationship-orphan-test",
        sourceAccountId: fakeVault.accounts[0].id,
        targetAccountId: "missing-account-test",
        relationshipType: "CONNECTED_TO",
        notes: "Synthetic orphan fixture.",
      },
    ]);

    expect(graph.nodes).toHaveLength(fakeVault.accounts.length);
    expect(graph.edges).toHaveLength(fakeVault.relationships.length);
    expect(graph.edges.find((edge) => edge.id === "relationship-orphan-test")).toBeUndefined();
  });

  it("uses a credential-free view model for map nodes", () => {
    const account = fakeVault.accounts[0];
    expect(toMapAccount(account)).toEqual({ id: account.id, accountName: account.accountName, serviceName: account.serviceName, category: account.category });
    expect(toMapAccount(account)).not.toHaveProperty("password");
    expect(toMapAccount(account)).not.toHaveProperty("email");
    expect(toMapAccount(account)).not.toHaveProperty("recoveryInformation");
    expect(toMapAccount(account)).not.toHaveProperty("website");
  });
});
