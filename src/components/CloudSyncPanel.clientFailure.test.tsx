import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../sync/cloudSync", () => ({
  canRestoreRemote: vi.fn(),
  createCloudClient: () => { throw new Error("invalid test configuration"); },
  decideSync: vi.fn(),
  ensureDevice: vi.fn(),
  isFreshLocalVault: vi.fn(),
  isSupabaseConfigured: () => true,
  readSyncMetadata: vi.fn(),
  writeSyncMetadata: vi.fn(),
}));

import { CloudSyncPanel } from "./CloudSyncPanel";

describe("CloudSyncPanel client construction", () => {
  it("contains a cloud-client initialization failure without removing local Settings", () => {
    render(<CloudSyncPanel isNative={false} onVaultRestored={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Account OS Cloud" })).toBeInTheDocument();
    expect(screen.getByText("Cloud is unavailable. Check the optional local configuration and connection.")).toBeInTheDocument();
    expect(screen.getByText("Your local vault remains fully available offline.")).toBeInTheDocument();
  });
});
