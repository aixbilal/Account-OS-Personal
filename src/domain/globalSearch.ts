import type { Account } from "./types";

/**
 * Global search (Item 3, V3 fixture pass - a pre-approved, scope-fixed
 * exception to a previously locked "planned only" decision; see the
 * session report for that log). Searches only real, already-stored
 * account fields - name, service, email, website/domain - never a
 * fabricated "people" search, since no Person entity exists in this app.
 *
 * A simple in-memory filter over the already-loaded account list, not a
 * new backend index/service: a personal vault's account count (tens, not
 * thousands) never approaches the scale where that tradeoff would matter.
 */
export function searchAccounts(accounts: Account[], query: string): Account[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  return accounts.filter((account) =>
    account.accountName.toLowerCase().includes(trimmed)
    || account.serviceName.toLowerCase().includes(trimmed)
    || account.email.toLowerCase().includes(trimmed)
    || (account.website ?? "").toLowerCase().includes(trimmed));
}
