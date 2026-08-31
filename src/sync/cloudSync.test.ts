import { beforeEach, describe, expect, it } from "vitest";
import { canRestoreRemote, decideSync, isFreshLocalVault, markFreshLocalVault, markLocalVaultChange, writeSyncMetadata } from "./cloudSync";

describe("conservative encrypted sync decisions", () => {
  beforeEach(() => localStorage.clear());

  it("uploads a locally changed vault when no remote exists", () => {
    expect(decideSync({ remoteRevision: 0, localChanges: true }, null)).toBe("upload");
  });

  it("downloads a newer remote only when local data is unchanged", () => {
    expect(decideSync({ remoteRevision: 2, localChanges: false }, { revision: 3 })).toBe("download");
  });

  it("detects concurrent edits instead of overwriting either side", () => {
    expect(decideSync({ remoteRevision: 2, localChanges: true }, { revision: 3 })).toBe("conflict");
  });

  it("keeps a same-revision local edit eligible for its expected-revision write", () => {
    expect(decideSync({ remoteRevision: 2, localChanges: true }, { revision: 2 })).toBe("upload");
  });

  it("does not require cloud access when the local vault is already current", () => {
    expect(decideSync({ remoteRevision: 2, localChanges: false }, { revision: 2 })).toBe("up-to-date");
  });

  it("refuses a remote restore while unsynced local changes exist", () => {
    expect(canRestoreRemote({ remoteRevision: 2, localChanges: true }, 3)).toBe(false);
  });

  it("refuses an older remote restore and accepts a same or newer revision", () => {
    expect(canRestoreRemote({ remoteRevision: 3, localChanges: false }, 2)).toBe(false);
    expect(canRestoreRemote({ remoteRevision: 3, localChanges: false }, 3)).toBe(true);
    expect(canRestoreRemote({ remoteRevision: 3, localChanges: false }, 4)).toBe(true);
  });

  it("allows a fresh untouched vault to establish a remote baseline, but clears that status on any edit", () => {
    markFreshLocalVault();
    expect(isFreshLocalVault()).toBe(true);
    expect(decideSync({ remoteRevision: 0, localChanges: false }, { revision: 1 })).toBe("download");
    markLocalVaultChange();
    expect(isFreshLocalVault()).toBe(false);
    expect(decideSync({ remoteRevision: 0, localChanges: true }, { revision: 1 })).toBe("conflict");
  });

  it("clears fresh-vault status only after a successful sync metadata write", () => {
    markFreshLocalVault();
    writeSyncMetadata("owner-test", { remoteRevision: 1, localChanges: false });
    expect(isFreshLocalVault()).toBe(false);
  });

});
