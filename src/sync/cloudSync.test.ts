import { describe, expect, it } from "vitest";
import { decideSync } from "./cloudSync";

describe("conservative encrypted sync decisions", () => {
  it("uploads a locally changed vault when no remote exists", () => {
    expect(decideSync({ remoteRevision: 0, localChanges: true }, null)).toBe("upload");
  });

  it("downloads a newer remote only when local data is unchanged", () => {
    expect(decideSync({ remoteRevision: 2, localChanges: false }, { revision: 3 })).toBe("download");
  });

  it("detects concurrent edits instead of overwriting either side", () => {
    expect(decideSync({ remoteRevision: 2, localChanges: true }, { revision: 3 })).toBe("conflict");
  });
});
