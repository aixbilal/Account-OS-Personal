import { invoke } from "@tauri-apps/api/core";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { createCloudClient, decideSync, ensureDevice, isSupabaseConfigured, readSyncMetadata, writeSyncMetadata, type RemoteVaultRecord } from "../sync/cloudSync";
import type { VaultData } from "../domain/types";

export function CloudSyncPanel({ isNative, onVaultRestored }: { isNative: boolean; onVaultRestored: (vault: VaultData) => void }) {
  const client = useMemo(() => createCloudClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, [client]);

  async function connect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setWorking(true); setMessage("");
    const { error } = await client.auth.signInWithPassword({ email, password });
    setPassword(""); setWorking(false);
    if (error) setMessage(error.message); else setMessage("Cloud identity connected. Unlocking the local vault remains separate.");
  }

  async function syncNow() {
    if (!client || !session || !isNative) return;
    setWorking(true); setMessage(""); setStatus("Syncing");
    try {
      const deviceId = await ensureDevice(client, session);
      const { data: remote, error: readError } = await client
        .from("vault_sync")
        .select("encrypted_payload, revision")
        .eq("owner_id", session.user.id)
        .maybeSingle<RemoteVaultRecord>();
      if (readError) throw readError;
      const metadata = readSyncMetadata(session.user.id);
      const decision = decideSync(metadata, remote);
      if (decision === "up-to-date") { setStatus("Synced"); setMessage("No local changes to upload."); return; }
      if (decision === "conflict") { setStatus("Conflict"); setMessage("A newer encrypted vault exists remotely while this device also has local changes. Neither copy was changed."); return; }
      if (decision === "download") {
        if (!vaultPassword) { setStatus("Sync error"); setMessage("Enter the local vault password to validate and apply the remote encrypted vault."); return; }
        const vault = await invoke<VaultData>("import_sync_payload", { payload: remote!.encrypted_payload, password: vaultPassword });
        onVaultRestored(vault);
        writeSyncMetadata(session.user.id, { remoteRevision: remote!.revision, localChanges: false });
        setVaultPassword(""); setStatus("Synced"); setMessage("Remote encrypted vault validated and applied locally."); return;
      }
      const payload = await invoke<string>("export_sync_payload");
      const { data: writeResult, error: writeError } = await client.rpc("write_vault_sync", {
        expected_revision: metadata.remoteRevision,
        payload,
        device_id: deviceId,
      }).single<{ status: string; revision: number }>();
      if (writeError) throw writeError;
      if (writeResult.status !== "synced") { setStatus("Conflict"); setMessage("The remote revision changed during sync. Neither local vault nor remote payload was overwritten."); return; }
      writeSyncMetadata(session.user.id, { remoteRevision: writeResult.revision, localChanges: false });
      setStatus("Synced"); setMessage("Encrypted vault payload synced. Cloud storage received no plaintext vault data.");
    } catch (reason) {
      setStatus("Sync error"); setMessage(reason instanceof Error ? reason.message : "Sync failed safely; the local vault was not changed.");
    } finally { setWorking(false); }
  }

  if (!isSupabaseConfigured()) return <div className="settings-card"><h3>Account OS Cloud</h3><p>Not connected. Add a Supabase project URL and publishable key to an untracked <code>.env.local</code> file to enable optional ciphertext-only sync.</p><p className="selected-file">Your local vault remains fully available offline.</p></div>;

  return <div className="settings-card"><h3>Account OS Cloud</h3><p>Status: <strong>{session ? status : "Not connected"}</strong></p>{!session ? <form onSubmit={connect}><label className="field-label">Cloud email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label><label className="field-label">Cloud password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><button className="unlock-submit" disabled={working} type="submit">{working ? "Connecting…" : "Connect cloud identity"}</button></form> : <><p>Device: {navigator.platform || "Desktop"}</p><label className="field-label">Local vault password (only required to download a newer remote vault)<input autoComplete="current-password" onChange={(event) => setVaultPassword(event.target.value)} type="password" value={vaultPassword} /></label><div className="settings-actions"><button className="add-account-button" disabled={working || !isNative} onClick={() => void syncNow()} type="button">{working ? "Syncing…" : "Sync now"}</button><button className="secondary-button" disabled={working} onClick={() => void client?.auth.signOut()} type="button">Sign out cloud identity</button></div></>}{message && <p className="backup-status" role="status">{message}</p>}</div>;
}
