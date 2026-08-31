import { describe, expect, it } from "vitest";
import { AUTHENTICATION_METHODS, RELATIONSHIP_TYPES } from "../domain/types";
import { fakeVault } from "./fakeVault";

describe("fakeVault", () => {
  it("contains only intentionally synthetic credentials", () => {
    expect(fakeVault.accounts.length).toBeGreaterThan(0);

    for (const account of fakeVault.accounts) {
      expect(account.email.endsWith(".invalid")).toBe(true);
      expect(account.password).toBe("FAKE-PASSWORD-ONLY");
      expect(AUTHENTICATION_METHODS).toContain(account.authenticationMethod);
    }
  });

  it("contains relationships that reference existing accounts", () => {
    const accountIds = new Set(fakeVault.accounts.map((account) => account.id));

    for (const relationship of fakeVault.relationships) {
      expect(accountIds.has(relationship.sourceAccountId)).toBe(true);
      expect(accountIds.has(relationship.targetAccountId)).toBe(true);
      expect(RELATIONSHIP_TYPES).toContain(relationship.relationshipType);
    }
  });

  it("uses unique account and relationship identifiers", () => {
    expect(new Set(fakeVault.accounts.map(({ id }) => id)).size).toBe(
      fakeVault.accounts.length,
    );
    expect(new Set(fakeVault.relationships.map(({ id }) => id)).size).toBe(
      fakeVault.relationships.length,
    );
  });
});
