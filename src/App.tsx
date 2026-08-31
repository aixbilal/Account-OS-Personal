import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import {
  Boxes,
  CircleUserRound,
  LockKeyhole,
  Map,
  Settings,
  ShieldCheck,
  Vault,
} from "lucide-react";
import { AccountList } from "./components/AccountList";
import { AccountEditor, type AccountDraft } from "./components/AccountEditor";
import { DependencyMap } from "./components/DependencyMap";
import { fakeVault } from "./data/fakeVault";
import { isDuplicateRelationship, isValidRelationship } from "./domain/relationships";
import { ACCOUNT_CATEGORIES, AUTHENTICATION_METHODS, type Account, type AccountCategory, type AccountRelationship, type AuthenticationMethod, type VaultData } from "./domain/types";
import "./App.css";

type View = "vault" | "map" | "settings";

interface NativeVaultStatus {
  hasVault: boolean;
  unlocked: boolean;
}

const isTauriRuntime = "__TAURI_INTERNALS__" in window;

const navigation: Array<{ id: View; label: string; icon: typeof Vault }> = [
  { id: "vault", label: "Vault", icon: Vault },
  { id: "map", label: "Map", icon: Map },
  { id: "settings", label: "Settings", icon: Settings },
];

const viewContent: Record<
  View,
  { eyebrow: string; title: string; description: string; icon: typeof Vault }
> = {
  vault: {
    eyebrow: "Local vault",
    title: "Your accounts, clearly organized",
    description:
      "Account records, credentials, recovery details, and authentication methods will live here.",
    icon: LockKeyhole,
  },
  map: {
    eyebrow: "Identity map",
    title: "See how every account connects",
    description:
      "Authentication, recovery, ownership, and dependency relationships will form an interactive map.",
    icon: Boxes,
  },
  settings: {
    eyebrow: "Preferences",
    title: "Control your local Account OS",
    description:
      "Vault location, lock behavior, backups, and local application preferences will be managed here.",
    icon: ShieldCheck,
  },
};

function App() {
  const [activeView, setActiveView] = useState<View>("vault");
  const [vaultStatus, setVaultStatus] = useState<NativeVaultStatus | null>(null);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AccountCategory | "all">("all");
  const [authenticationFilter, setAuthenticationFilter] = useState<AuthenticationMethod | "all">("all");
  const content = viewContent[activeView];
  const ContentIcon = content.icon;
  const displayedVault = vaultData ?? (isTauriRuntime ? null : fakeVault);
  const relationshipCount = displayedVault?.relationships.length ?? 0;
  const visibleAccounts = (displayedVault?.accounts ?? []).filter((account) => {
    const query = search.trim().toLowerCase();
    const searchable = [account.serviceName, account.accountName, account.email, account.username, account.category].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (categoryFilter === "all" || account.category === categoryFilter)
      && (authenticationFilter === "all" || account.authenticationMethod === authenticationFilter);
  });

  useEffect(() => {
    if (!isTauriRuntime) {
      setVaultStatus({ hasVault: true, unlocked: true });
      return;
    }

    invoke<NativeVaultStatus>("vault_status")
      .then(setVaultStatus)
      .catch(() => setVaultStatus({ hasVault: false, unlocked: false }));
  }, []);

  async function handleCreateVault(password: string) {
    const vault = await invoke<VaultData>("create_vault", { password });
    setVaultData(vault);
    setVaultStatus({ hasVault: true, unlocked: true });
  }

  async function handleUnlockVault(password: string) {
    const vault = await invoke<VaultData>("unlock_vault", { password });
    setVaultData(vault);
    setVaultStatus({ hasVault: true, unlocked: true });
  }

  async function handleLockVault() {
    if (!isTauriRuntime) {
      return;
    }

    await invoke("lock_vault");
    setVaultData(null);
    setVaultStatus({ hasVault: true, unlocked: false });
  }

  async function persistVault(nextVault: VaultData) {
    const persisted = isTauriRuntime
      ? await invoke<VaultData>("save_vault", { vault: nextVault })
      : nextVault;
    setVaultData(persisted);
  }

  async function saveAccount(draft: AccountDraft) {
    if (!displayedVault) return;
    const now = new Date().toISOString();
    const isEditing = Boolean(editingAccount);
    const account: Account = isEditing
      ? { ...editingAccount!, ...draft, updatedAt: now }
      : { ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await persistVault({
      ...displayedVault,
      accounts: isEditing
        ? displayedVault.accounts.map((item) => item.id === account.id ? account : item)
        : [account, ...displayedVault.accounts],
    });
  }

  async function deleteAccount(account: Account) {
    if (!displayedVault) return;
    await persistVault({
      ...displayedVault,
      accounts: displayedVault.accounts.filter((item) => item.id !== account.id),
      relationships: displayedVault.relationships.filter((relationship) =>
        relationship.sourceAccountId !== account.id && relationship.targetAccountId !== account.id,
      ),
    });
  }

  async function saveRelationship(draft: Omit<AccountRelationship, "id"> & { id?: string }) {
    if (!displayedVault) return;
    const relationship: AccountRelationship = { ...draft, id: draft.id ?? crypto.randomUUID() };
    if (!isValidRelationship(displayedVault.accounts, relationship)) {
      throw new Error("Choose two different accounts that still exist in this vault.");
    }
    if (isDuplicateRelationship(displayedVault.relationships, relationship)) {
      throw new Error("That relationship already exists.");
    }
    await persistVault({
      ...displayedVault,
      relationships: draft.id
        ? displayedVault.relationships.map((item) => item.id === draft.id ? relationship : item)
        : [...displayedVault.relationships, relationship],
    });
  }

  async function deleteRelationship(relationship: AccountRelationship) {
    if (!displayedVault) return;
    await persistVault({ ...displayedVault, relationships: displayedVault.relationships.filter((item) => item.id !== relationship.id) });
  }

  if (!vaultStatus) {
    return <main className="unlock-screen">Preparing the local vault…</main>;
  }

  if (!vaultStatus.unlocked) {
    return (
      <UnlockScreen
        hasVault={vaultStatus.hasVault}
        onCreate={handleCreateVault}
        onUnlock={handleUnlockVault}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <CircleUserRound size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className="brand-name">Account OS</p>
            <p className="brand-edition">Local desktop vault</p>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                className="nav-item"
                data-active={isActive}
                key={item.id}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <p>Offline ready</p>
            <span>No cloud connection</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="section-kicker">Account OS / V1</p>
            <h1>{navigation.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <button
            className="vault-state"
            onClick={handleLockVault}
            type="button"
            aria-label={isTauriRuntime ? "Lock local vault" : "Web preview mode"}
          >
            <LockKeyhole size={15} />
            {isTauriRuntime ? "Lock vault" : "Preview mode"}
          </button>
        </header>

        {activeView === "vault" ? (
          <section className="vault-screen" aria-labelledby="view-title">
            <div className="screen-intro">
              <div>
                <p className="eyebrow">{content.eyebrow}</p>
                <h2 id="view-title">{content.title}</h2>
                <p>{content.description}</p>
              </div>
              <div className="vault-intro-actions">
                {!isTauriRuntime && <span className="synthetic-badge">Synthetic preview only</span>}
                <button className="add-account-button" onClick={() => setEditingAccount(null)} type="button">Add account</button>
              </div>
            </div>
            <div className="vault-summary" aria-label="Synthetic vault summary">
              <span>{displayedVault?.accounts.length ?? 0} accounts</span>
              <span>{relationshipCount} relationships</span>
              <span>{displayedVault?.categories.length ?? 0} categories</span>
            </div>
            {displayedVault && displayedVault.accounts.length > 0 ? (
              <>
                <div className="vault-filters" aria-label="Account filters">
                  <input aria-label="Search accounts" onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts" type="search" value={search} />
                  <select aria-label="Filter by category" onChange={(event) => setCategoryFilter(event.target.value as AccountCategory | "all")} value={categoryFilter}>
                    <option value="all">All categories</option>{ACCOUNT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                  <select aria-label="Filter by authentication method" onChange={(event) => setAuthenticationFilter(event.target.value as AuthenticationMethod | "all")} value={authenticationFilter}>
                    <option value="all">All authentication methods</option>{AUTHENTICATION_METHODS.map((method) => <option key={method}>{method}</option>)}
                  </select>
                  <span>{visibleAccounts.length} shown</span>
                </div>
                {visibleAccounts.length > 0 ? <AccountList accounts={visibleAccounts} onSelect={setEditingAccount} /> : <div className="vault-empty"><h3>No matching accounts.</h3><p>Change the search or filters, or add a synthetic account.</p></div>}
              </>
            ) : (
              <div className="vault-empty">
                <h3>Your local vault is ready.</h3>
                <p>Add a synthetic account to begin organizing your local vault.</p>
                <button className="add-account-button" onClick={() => setEditingAccount(null)} type="button">Add account</button>
              </div>
            )}
          </section>
        ) : activeView === "map" ? (
          <section className="map-screen" aria-labelledby="view-title">
            <div className="screen-intro"><div><p className="eyebrow">{content.eyebrow}</p><h2 id="view-title">{content.title}</h2><p>{content.description}</p></div></div>
            <p className="map-explainer">Arrows point from the dependent/source account toward the account it relies on.</p>
            <DependencyMap accounts={displayedVault?.accounts ?? []} onSelectAccount={setEditingAccount} relationships={displayedVault?.relationships ?? []} />
          </section>
        ) : activeView === "settings" ? (
          <SettingsScreen
            isNative={isTauriRuntime}
            onImport={(vault) => setVaultData(vault)}
          />
        ) : (
          <section className="placeholder-panel" aria-labelledby="view-title">
            <div className="placeholder-icon" aria-hidden="true">
              <ContentIcon size={30} strokeWidth={1.6} />
            </div>
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 id="view-title">{content.title}</h2>
            <p>{content.description}</p>
            {activeView === "settings" && (
              <div className="milestone-note">
                <span>Foundation ready</span>
                <p>Local vault preferences arrive with encrypted storage.</p>
              </div>
            )}
          </section>
        )}
      </main>
      {editingAccount !== undefined && (
        <AccountEditor
          account={editingAccount}
          accounts={displayedVault?.accounts ?? []}
          relationships={displayedVault?.relationships ?? []}
          onClose={() => setEditingAccount(undefined)}
          onDelete={deleteAccount}
          onSave={saveAccount}
          onDeleteRelationship={deleteRelationship}
          onSaveRelationship={saveRelationship}
        />
      )}
    </div>
  );
}

export default App;

interface UnlockScreenProps {
  hasVault: boolean;
  onCreate: (password: string) => Promise<void>;
  onUnlock: (password: string) => Promise<void>;
}

function UnlockScreen({ hasVault, onCreate, onUnlock }: UnlockScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const creating = !hasVault;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Use a master password with at least 12 characters.");
      return;
    }
    if (creating && password !== confirmation) {
      setError("The master password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (creating) {
        await onCreate(password);
      } else {
        await onUnlock(password);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to access the local vault.");
    } finally {
      setPassword("");
      setConfirmation("");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="unlock-screen">
      <section className="unlock-card" aria-labelledby="unlock-title">
        <div className="brand-mark" aria-hidden="true">
          <LockKeyhole size={22} strokeWidth={1.8} />
        </div>
        <p className="eyebrow">Local-first desktop vault</p>
        <h1 id="unlock-title">{creating ? "Create your local vault" : "Unlock Account OS"}</h1>
        <p className="unlock-description">
          {creating
            ? "Choose a master password. It stays on this device and is used only to encrypt your local vault."
            : "Enter your master password to decrypt your local vault on this device."}
        </p>
        <form onSubmit={submit}>
          <label htmlFor="master-password">Master password</label>
          <input
            autoComplete={creating ? "new-password" : "current-password"}
            id="master-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {creating && (
            <>
              <label htmlFor="master-password-confirmation">Confirm master password</label>
              <input
                autoComplete="new-password"
                id="master-password-confirmation"
                onChange={(event) => setConfirmation(event.target.value)}
                required
                type="password"
                value={confirmation}
              />
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="unlock-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Working…" : creating ? "Create encrypted vault" : "Unlock vault"}
          </button>
        </form>
        <p className="unlock-footnote">Account OS does not use cloud sync in V1.</p>
      </section>
    </main>
  );
}

function SettingsScreen({ isNative, onImport }: { isNative: boolean; onImport: (vault: VaultData) => void }) {
  const [importPath, setImportPath] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  async function exportBackup() {
    setMessage("");
    if (!isNative) { setMessage("Encrypted backup export is available in the desktop application."); return; }
    const path = await saveDialog({ defaultPath: "account-os-backup.aosbackup", filters: [{ name: "Account OS encrypted backup", extensions: ["aosbackup"] }] });
    if (!path) return;
    setIsWorking(true);
    try { await invoke("export_backup", { path }); setMessage("Encrypted backup exported."); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to export the backup."); }
    finally { setIsWorking(false); }
  }

  async function chooseBackup() {
    setMessage("");
    if (!isNative) { setMessage("Encrypted backup import is available in the desktop application."); return; }
    const path = await openDialog({ directory: false, multiple: false, filters: [{ name: "Account OS encrypted backup", extensions: ["aosbackup"] }] });
    if (typeof path === "string") setImportPath(path);
  }

  async function importBackup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importPath || !masterPassword) return;
    setMessage(""); setIsWorking(true);
    try {
      const vault = await invoke<VaultData>("import_backup", { path: importPath, password: masterPassword });
      onImport(vault); setMessage("Encrypted backup restored. The previous local vault was replaced only after validation."); setImportPath("");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to restore the backup."); }
    finally { setMasterPassword(""); setIsWorking(false); }
  }

  return <section className="settings-screen" aria-labelledby="view-title">
    <div className="screen-intro"><div><p className="eyebrow">Preferences</p><h2 id="view-title">Encrypted backup and restore</h2><p>Backups use the same versioned encrypted vault format. Account OS never creates a plaintext credential export.</p></div></div>
    <div className="settings-card"><h3>Export encrypted backup</h3><p>Choose a new <code>.aosbackup</code> file location. Existing files are not silently overwritten.</p><button className="add-account-button" disabled={isWorking} onClick={exportBackup} type="button">Export encrypted backup</button></div>
    <div className="settings-card"><h3>Restore encrypted backup</h3><p>Select a backup, then enter its master password. Invalid or corrupted files leave the current local vault unchanged.</p><form onSubmit={importBackup}><button className="secondary-button" disabled={isWorking} onClick={chooseBackup} type="button">Choose backup file</button>{importPath && <p className="selected-file">Backup selected</p>}<label className="field-label">Backup master password<input autoComplete="current-password" onChange={(event) => setMasterPassword(event.target.value)} required type="password" value={masterPassword} /></label><button className="unlock-submit" disabled={!importPath || !masterPassword || isWorking} type="submit">{isWorking ? "Restoring…" : "Restore encrypted backup"}</button></form></div>
    {message && <p className="backup-status" role="status">{message}</p>}
  </section>;
}
