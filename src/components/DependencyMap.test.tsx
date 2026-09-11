import { describe, expect, it } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { buildDependencyGraph, buildEgoGraph, resolveMapNodeFocus, toMapAccount } from "./DependencyMap";

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

  it("lets a search match override an unrelated selected-node dim state", () => {
    const related = new Set(["related"]);
    const matches = new Set(["searched"]);

    expect(resolveMapNodeFocus("searched", "selected", related, matches, true)).toBe("normal");
    expect(resolveMapNodeFocus("selected", "selected", related, matches, true)).toBe("muted");
    expect(resolveMapNodeFocus("selected", "selected", related, matches, false)).toBe("selected");
    expect(resolveMapNodeFocus("related", "selected", related, matches, false)).toBe("related");
  });
});

describe("buildEgoGraph (Relationships screen radial view, Phase 5)", () => {
  it("includes only the focused account's direct connections for a hub account", () => {
    const graph = buildEgoGraph(fakeVault.accounts, fakeVault.relationships, "account-google-personal-test");

    expect(graph.nodes.map((node) => node.id).sort()).toEqual([
      "account-claude-personal-test",
      "account-facebook-test",
      "account-google-personal-test",
      "account-openai-test",
      "account-university-test",
    ].sort());
    expect(graph.nodes.find((node) => node.id === "account-google-personal-test")?.data.focus).toBe("selected");
    expect(graph.edges).toHaveLength(4);
    // None of Facebook's own further relationships (e.g. to Instagram) leak into Google's ego graph.
    expect(graph.edges.some((edge) => edge.id === "relationship-facebook-instagram-test")).toBe(false);
  });

  it("renders a simple one-to-one pair with a single node on each side plus both edges between them", () => {
    const graph = buildEgoGraph(fakeVault.accounts, fakeVault.relationships, "account-github-test");
    expect(graph.nodes.map((node) => node.id).sort()).toEqual(["account-github-test", "account-supabase-test"]);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges.every((edge) => edge.source === "account-supabase-test" && edge.target === "account-github-test")).toBe(true);
  });

  it("renders just the focused node with no edges for an isolated account", () => {
    const graph = buildEgoGraph(fakeVault.accounts, fakeVault.relationships, "account-apple-test");
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].data.focus).toBe("selected");
    expect(graph.edges).toHaveLength(0);
  });

  it("returns an empty graph for an unknown focus id instead of throwing", () => {
    expect(buildEgoGraph(fakeVault.accounts, fakeVault.relationships, "missing-account-test")).toEqual({ nodes: [], edges: [] });
  });
});
