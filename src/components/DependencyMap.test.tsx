import { describe, expect, it } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { buildDependencyGraph } from "./DependencyMap";

describe("buildDependencyGraph", () => {
  it("creates one node per account and a labeled directed edge per valid relationship", () => {
    const graph = buildDependencyGraph(fakeVault.accounts, fakeVault.relationships);
    expect(graph.nodes).toHaveLength(fakeVault.accounts.length);
    expect(graph.edges).toHaveLength(fakeVault.relationships.length);
    expect(graph.edges.find((edge) => edge.id === "relationship-google-claude-test")).toMatchObject({
      source: "account-claude-personal-test", target: "account-google-personal-test", label: "GOOGLE_SSO",
    });
  });
});
