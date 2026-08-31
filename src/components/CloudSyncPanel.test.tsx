import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../sync/cloudSync", () => ({
  canRestoreRemote: vi.fn(),
  createCloudClient: () => ({
    auth: {
      getSession: vi.fn().mockRejectedValue(new Error("offline")),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  }),
  decideSync: vi.fn(),
  ensureDevice: vi.fn(),
  isFreshLocalVault: vi.fn(),
  isSupabaseConfigured: () => true,
  readSyncMetadata: vi.fn(),
  writeSyncMetadata: vi.fn(),
}));

import { CloudSyncPanel } from "./CloudSyncPanel";

describe("CloudSyncPanel offline session handling", () => {
  it("contains a failed cloud session read without affecting local settings", async () => {
    render(<CloudSyncPanel isNative={false} onVaultRestored={vi.fn()} />);

    expect(await screen.findByText("Cloud session is unavailable. Your local vault remains available offline.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account OS Cloud" })).toBeInTheDocument();
  });
});
