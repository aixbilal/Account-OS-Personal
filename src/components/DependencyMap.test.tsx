import { describe, expect, it } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { buildDependencyGraph, toMapAccount } from "./DependencyMap";

describe("buildDependencyGraph", () => {
  it("creates one node per account and a labeled directed edge per valid relationship", () => {
    const graph = buildDependencyGraph(fakeVault.accounts, fakeVault.relationships);
    expect(graph.nodes).toHaveLength(fakeVault.accounts.length);
    expect(graph.edges).toHaveLength(fakeVault.relationships.length);
    expect(graph.edges.find((edge) => edge.id === "relationship-google-claude-test")).toMatchObject({
      source: "account-claude-personal-test", target: "account-google-personal-test", label: "GOOGLE_SSO",
    });
  });

  it("uses a credential-free view model for map nodes", () => {
    const account = fakeVault.accounts[0];
    expect(toMapAccount(account)).toEqual({ id: account.id, accountName: account.accountName, serviceName: account.serviceName, category: account.category });
    expect(toMapAccount(account)).not.toHaveProperty("password");
    expect(toMapAccount(account)).not.toHaveProperty("email");
    expect(toMapAccount(account)).not.toHaveProperty("recoveryInformation");
  });
});
