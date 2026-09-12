import { describe, expect, it } from "vitest";
import { fakeVault } from "../data/fakeVault";
import { searchAccounts } from "./globalSearch";

describe("searchAccounts", () => {
  it("returns nothing for an empty or whitespace-only query", () => {
    expect(searchAccounts(fakeVault.accounts, "")).toEqual([]);
    expect(searchAccounts(fakeVault.accounts, "   ")).toEqual([]);
  });

  it("matches account name case-insensitively", () => {
    const results = searchAccounts(fakeVault.accounts, "github test");
    expect(results.map((account) => account.id)).toContain("account-github-test");
  });

  it("matches email", () => {
    const results = searchAccounts(fakeVault.accounts, "ai@example.invalid");
    expect(results.map((account) => account.id)).toContain("account-openai-test");
  });

  it("matches website/domain", () => {
    const results = searchAccounts(fakeVault.accounts, "spotify.example");
    expect(results.map((account) => account.id)).toContain("account-spotify-test");
  });

  it("does not match on fields other than name/email/website (no fabricated 'people' search)", () => {
    // Notes/username/etc. are real fields on Account but explicitly out of
    // scope for Item 3 - only name, service, email, and website search.
    const results = searchAccounts(fakeVault.accounts, "Synthetic AI account");
    expect(results).toEqual([]);
  });
});
