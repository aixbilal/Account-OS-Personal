import { describe, expect, it } from "vitest";
import {
  AUTHENTICATION_METHODS,
  RELATIONSHIP_TYPES,
  type Account,
} from "../domain/types";
import { fakeVault } from "./fakeVault";

const legacyAccountWithoutWebsite: Account = {
  id: "legacy-account-test",
  serviceName: "Legacy Service",
  accountName: "Legacy Account TEST",
  category: "Other",
  username: "legacy-test",
  email: "legacy@example.invalid",
  password: "FAKE-PASSWORD-ONLY",
  authenticationMethod: "Password",
  recoveryInformation: "",
  twoFactorInformation: "",
  notes: "Synthetic legacy account without a website field.",
  createdAt: "2026-08-30T12:00:00.000Z",
  updatedAt: "2026-08-30T12:00:00.000Z",
};

describe("fakeVault", () => {
  it("contains only intentionally synthetic credentials", () => {
    expect(fakeVault.accounts.length).toBeGreaterThan(0);

    for (const account of fakeVault.accounts) {
      expect(account.email.endsWith(".invalid")).toBe(true);
      expect(account.website).toMatch(/^https:\/\//);
      expect(new URL(account.website!).hostname.endsWith(".invalid")).toBe(true);
      expect(account.password).toBe("FAKE-PASSWORD-ONLY");
      expect(AUTHENTICATION_METHODS).toContain(account.authenticationMethod);
    }
  });

  it("keeps website optional for legacy account objects", () => {
    expect(legacyAccountWithoutWebsite.website).toBeUndefined();
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
