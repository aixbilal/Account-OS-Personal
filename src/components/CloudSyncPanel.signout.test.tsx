import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../sync/cloudSync", () => ({
  canRestoreRemote: vi.fn(),
  createCloudClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "test-owner" } } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
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

describe("CloudSyncPanel sign-out", () => {
  it("confirms cloud sign-out without affecting the local-vault surface", async () => {
    const user = userEvent.setup();
    render(<CloudSyncPanel isNative={false} onVaultRestored={vi.fn()} />);

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out cloud identity" }));

    expect(await screen.findByText("Cloud identity signed out. Your local vault remains available.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account OS Cloud" })).toBeInTheDocument();
  });
});
