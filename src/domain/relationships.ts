import type { Account, AccountRelationship } from "./types";

export function relationshipsForAccount(relationships: AccountRelationship[], accountId: string) {
  return relationships.filter((relationship) =>
    relationship.sourceAccountId === accountId || relationship.targetAccountId === accountId,
  );
}

export function dependenciesForAccount(relationships: AccountRelationship[], accountId: string) {
  return relationships.filter((relationship) => relationship.sourceAccountId === accountId);
}

export function dependentsForAccount(relationships: AccountRelationship[], accountId: string) {
  return relationships.filter((relationship) => relationship.targetAccountId === accountId);
}

export function isValidRelationship(accounts: Account[], relationship: AccountRelationship) {
  if (relationship.sourceAccountId === relationship.targetAccountId) return false;
  const accountIds = new Set(accounts.map((account) => account.id));
  return accountIds.has(relationship.sourceAccountId) && accountIds.has(relationship.targetAccountId);
}

export function isDuplicateRelationship(relationships: AccountRelationship[], relationship: AccountRelationship) {
  return relationships.some((item) => item.id !== relationship.id
    && item.sourceAccountId === relationship.sourceAccountId
    && item.targetAccountId === relationship.targetAccountId
    && item.relationshipType === relationship.relationshipType);
}
