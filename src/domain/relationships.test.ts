import { describe, expect, it } from "vitest";
import { dependenciesForAccount, dependentsForAccount, isDuplicateRelationship, isValidRelationship, relationshipsForAccount } from "./relationships";
import type { Account, AccountRelationship } from "./types";

const links: AccountRelationship[] = [
  { id: "one", sourceAccountId: "a", targetAccountId: "b", relationshipType: "LOGIN_WITH", notes: "" },
  { id: "two", sourceAccountId: "c", targetAccountId: "a", relationshipType: "RECOVERY_EMAIL", notes: "" },
];
const accounts = ["a", "b", "c"].map((id) => ({ id, serviceName: id, accountName: id, category: "Personal", username: "", email: "", password: "", authenticationMethod: "Password", recoveryInformation: "", twoFactorInformation: "", notes: "", createdAt: "", updatedAt: "" })) as Account[];

describe("relationship queries", () => {
  it("finds all links, dependencies, and dependents for an account", () => {
    expect(relationshipsForAccount(links, "a").map((item) => item.id)).toEqual(["one", "two"]);
    expect(dependenciesForAccount(links, "a").map((item) => item.id)).toEqual(["one"]);
    expect(dependentsForAccount(links, "a").map((item) => item.id)).toEqual(["two"]);
  });

  it("rejects self, dangling, and duplicate relationships", () => {
    expect(isValidRelationship(accounts, { ...links[0], id: "self", targetAccountId: "a" })).toBe(false);
    expect(isValidRelationship(accounts, { ...links[0], id: "missing", targetAccountId: "missing" })).toBe(false);
    expect(isDuplicateRelationship(links, { ...links[0], id: "copy" })).toBe(true);
    expect(isDuplicateRelationship(links, { ...links[0], id: "two", relationshipType: "OWNS" })).toBe(false);
  });

  it("serializes the relationship type using the native vault field name", () => {
    const payload = JSON.parse(JSON.stringify(links[0]));
    expect(payload).toMatchObject({ relationshipType: "LOGIN_WITH" });
    expect(payload).not.toHaveProperty("type");
  });
});
