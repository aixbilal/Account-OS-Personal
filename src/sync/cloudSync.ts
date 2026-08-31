import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

export interface SyncMetadata {
  remoteRevision: number;
  localChanges: boolean;
}

export interface RemoteVaultRecord {
  encrypted_payload: string;
  revision: number;
}

export type SyncDecision = "upload" | "download" | "conflict" | "up-to-date";

const metadataKey = (ownerId: string) => `account-os:sync:${ownerId}`;
const deviceKey = "account-os:device-id";
const localChangesKey = "account-os:sync:local-changes";
const freshVaultKey = "account-os:sync:fresh-local-vault";

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
}

export function createCloudClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true },
  });
}

export function readSyncMetadata(ownerId: string): SyncMetadata {
  try {
    const value = localStorage.getItem(metadataKey(ownerId));
    if (value) {
      const parsed = JSON.parse(value) as Partial<SyncMetadata>;
      if (Number.isSafeInteger(parsed.remoteRevision) && typeof parsed.localChanges === "boolean") {
        return { remoteRevision: parsed.remoteRevision!, localChanges: parsed.localChanges || localStorage.getItem(localChangesKey) === "true" };
      }
    }
  } catch { /* Treat unavailable/corrupt local metadata as unsynced local changes. */ }
  return { remoteRevision: 0, localChanges: true };
}

export function writeSyncMetadata(ownerId: string, metadata: SyncMetadata) {
  localStorage.setItem(metadataKey(ownerId), JSON.stringify(metadata));
  if (!metadata.localChanges) {
    localStorage.removeItem(localChangesKey);
    localStorage.removeItem(freshVaultKey);
  }
}

export function markFreshLocalVault() {
  localStorage.setItem(freshVaultKey, "true");
}

export function isFreshLocalVault() {
  return localStorage.getItem(freshVaultKey) === "true";
}

export function markLocalVaultChange() {
  localStorage.removeItem(freshVaultKey);
  localStorage.setItem(localChangesKey, "true");
}

export function getDeviceId() {
  const existing = localStorage.getItem(deviceKey);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(deviceKey, id);
  return id;
}

export function decideSync(metadata: SyncMetadata, remote: Pick<RemoteVaultRecord, "revision"> | null): SyncDecision {
  if (!remote) return metadata.localChanges ? "upload" : "up-to-date";
  if (remote.revision === metadata.remoteRevision) return metadata.localChanges ? "upload" : "up-to-date";
  return metadata.localChanges ? "conflict" : "download";
}

export function canRestoreRemote(metadata: SyncMetadata, remoteRevision: number) {
  return !metadata.localChanges && remoteRevision >= metadata.remoteRevision;
}

export async function ensureDevice(client: SupabaseClient, session: Session) {
  const id = getDeviceId();
  const { error } = await client.from("devices").upsert({
    id,
    owner_id: session.user.id,
    device_name: `Account OS on ${navigator.platform || "desktop"}`,
    platform: navigator.platform || "unknown",
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw error;
  return id;
}
