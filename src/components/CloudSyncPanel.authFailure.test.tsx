import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../sync/cloudSync", () => ({
  canRestoreRemote: vi.fn(),
  createCloudClient: () => ({
    auth: {
      getSession: auth.getSession,
      signInWithPassword: auth.signInWithPassword,
      signOut: auth.signOut,
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

describe("CloudSyncPanel authentication failures", () => {
  beforeEach(() => {
    auth.getSession.mockReset();
    auth.signInWithPassword.mockReset();
    auth.signOut.mockReset();
  });

  it("contains a rejected cloud sign-in while leaving the local Settings surface rendered", async () => {
    const user = userEvent.setup();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInWithPassword.mockRejectedValue(new Error("offline"));
    render(<CloudSyncPanel isNative={false} onVaultRestored={vi.fn()} />);

    await user.type(screen.getByLabelText("Cloud email"), "offline@example.invalid");
    await user.type(screen.getByLabelText("Cloud password"), "synthetic-only");
    await user.click(screen.getByRole("button", { name: "Connect cloud identity" }));

    expect(await screen.findByText("Cloud sign-in is unavailable. Your local vault remains available offline.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account OS Cloud" })).toBeInTheDocument();
  });

  it("contains a rejected cloud sign-out without changing the local-vault surface", async () => {
    const user = userEvent.setup();
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: "synthetic-owner" } } }, error: null });
    auth.signOut.mockResolvedValue({ error: new Error("offline") });
    render(<CloudSyncPanel isNative={false} onVaultRestored={vi.fn()} />);

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out cloud identity" }));

    expect(await screen.findByText("Cloud sign-out could not be completed. Your local vault remains available.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account OS Cloud" })).toBeInTheDocument();
  });
});
