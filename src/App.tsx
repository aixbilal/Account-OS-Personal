import { invoke } from "@tauri-apps/api/core";
import { LockKeyhole, Map, Settings, Vault, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccountEditor, type AccountDraft } from "./components/AccountEditor";
import { AccountInspector } from "./components/AccountInspector";
import { AccountList } from "./components/AccountList";
import { AccountOsBrand } from "./components/Brand";
import { DependencyMap } from "./components/DependencyMap";
import { RelationshipDialog } from "./components/RelationshipDialog";
import { SettingsScreen, type ThemePreference } from "./components/SettingsScreen";
import { VaultEntry, VaultLoading } from "./components/VaultEntry";
import { Dialog } from "./components/ui/Modal";
import { ToastProvider, useToast } from "./components/ui/ToastProvider";
import { isDuplicateRelationship, isValidRelationship, relationshipsForAccount } from "./domain/relationships";
import { ACCOUNT_CATEGORIES, AUTHENTICATION_METHODS, type Account, type AccountCategory, type AccountRelationship, type AuthenticationMethod, type VaultData } from "./domain/types";
import { markFreshLocalVault, markLocalVaultChange } from "./sync/cloudSync";
import "./App.css";

type View = "vault" | "map" | "settings";

interface NativeVaultStatus {
  hasVault: boolean;
  unlocked: boolean;
}

interface RelationshipUiState {
  initialMode: "manage" | "add";
  managingAccountId?: string;
  sourceAccountId?: string;
}

const isTauriRuntime = "__TAURI_INTERNALS__" in window;
const emptyPreviewVault: VaultData = { formatVersion: 1, categories: [...ACCOUNT_CATEGORIES], accounts: [], relationships: [] };
const navigation: Array<{ id: View; label: string; icon: typeof Vault }> = [
  { id: "vault", label: "Vault", icon: Vault },
  { id: "map", label: "Map", icon: Map },
  { id: "settings", label: "Settings", icon: Settings },
];

function readThemePreference(): ThemePreference {
  const stored = window.localStorage.getItem("account-os-theme");
  if (stored === "dark" || stored === "system") return stored;
  return "light";
}

function App({ previewVault }: { previewVault?: VaultData }) {
  return <ToastProvider><AccountOsApplication previewVault={previewVault} /></ToastProvider>;
}

function AccountOsApplication({ previewVault }: { previewVault?: VaultData }) {
  const toast = useToast();
  const [activeView, setActiveView] = useState<View>("vault");
  const [vaultStatus, setVaultStatus] = useState<NativeVaultStatus | null>(() => isTauriRuntime ? null : { hasVault: true, unlocked: true });
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null | undefined>(undefined);
  const [editorDirty, setEditorDirty] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [relationshipUi, setRelationshipUi] = useState<RelationshipUiState | null>(null);
  const [confirmingLock, setConfirmingLock] = useState(false);
  const [vaultOperationBusy, setVaultOperationBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AccountCategory | "all">("all");
  const [authenticationFilter, setAuthenticationFilter] = useState<AuthenticationMethod | "all">("all");
  const [theme, setTheme] = useState<ThemePreference>(readThemePreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [online, setOnline] = useState(() => navigator.onLine);
  const displayedVault = vaultData ?? (isTauriRuntime ? null : previewVault ?? emptyPreviewVault);
  const selectedAccount = displayedVault?.accounts.find((account) => account.id === selectedAccountId);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const visibleAccounts = useMemo(() => (displayedVault?.accounts ?? []).filter((account) => {
    const query = search.trim().toLowerCase();
    const searchable = [account.serviceName, account.accountName, account.email, account.username, account.website, account.category].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (categoryFilter === "all" || account.category === categoryFilter)
      && (authenticationFilter === "all" || account.authenticationMethod === authenticationFilter);
  }), [authenticationFilter, categoryFilter, displayedVault?.accounts, search]);

  useEffect(() => {
    if (!isTauriRuntime) return;
    invoke<NativeVaultStatus>("vault_status").then(setVaultStatus).catch(() => setVaultStatus({ hasVault: false, unlocked: false }));
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("account-os-theme", theme);
  }, [theme]);

  useEffect(() => {
    const accounts = displayedVault?.accounts ?? [];
    if (!accounts.length) {
      setSelectedAccountId(undefined);
      return;
    }
    if (!selectedAccountId || !accounts.some((account) => account.id === selectedAccountId)) setSelectedAccountId(accounts[0].id);
  }, [displayedVault?.accounts, selectedAccountId]);

  function notify(message: string, tone: "success" | "error" | "info" = "success") {
    toast(message, { tone });
  }

  async function handleCreateVault(password: string) {
    const vault = await invoke<VaultData>("create_vault", { password });
    markFreshLocalVault();
    setVaultData(vault);
    setVaultStatus({ hasVault: true, unlocked: true });
  }

  async function handleUnlockVault(password: string) {
    const vault = await invoke<VaultData>("unlock_vault", { password });
    setVaultData(vault);
    setVaultStatus({ hasVault: true, unlocked: true });
  }

  async function performLock() {
    if (!isTauriRuntime) return;
    try {
      await invoke("lock_vault");
      setEditingAccount(undefined);
      setRelationshipUi(null);
      setSelectedAccountId(undefined);
      setVaultData(null);
      setVaultStatus({ hasVault: true, unlocked: false });
    } catch {
      notify("Unable to lock the local vault", "error");
    }
  }

  function requestLock() {
    if (vaultOperationBusy) return;
    if (editorDirty && editingAccount !== undefined) setConfirmingLock(true);
    else void performLock();
  }

  async function persistVault(nextVault: VaultData) {
    const persisted = isTauriRuntime ? await invoke<VaultData>("save_vault", { vault: nextVault }) : nextVault;
    setVaultData(persisted);
    if (isTauriRuntime) markLocalVaultChange();
    return persisted;
  }

  async function saveAccount(draft: AccountDraft) {
    if (!displayedVault) return;
    const now = new Date().toISOString();
    const isEditing = Boolean(editingAccount);
    const account: Account = isEditing
      ? { ...editingAccount!, ...draft, website: draft.website ?? "", updatedAt: now }
      : { ...draft, website: draft.website ?? "", id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await persistVault({
      ...displayedVault,
      accounts: isEditing
        ? displayedVault.accounts.map((item) => item.id === account.id ? account : item)
        : [account, ...displayedVault.accounts],
    });
    setSelectedAccountId(account.id);
  }

  async function deleteAccount(account: Account) {
    if (!displayedVault) return;
    await persistVault({
      ...displayedVault,
      accounts: displayedVault.accounts.filter((item) => item.id !== account.id),
      relationships: displayedVault.relationships.filter((relationship) => relationship.sourceAccountId !== account.id && relationship.targetAccountId !== account.id),
    });
    if (selectedAccountId === account.id) setSelectedAccountId(undefined);
  }

  async function saveRelationship(draft: Omit<AccountRelationship, "id"> & { id?: string }) {
    if (!displayedVault) return;
    const relationship: AccountRelationship = { ...draft, id: draft.id ?? crypto.randomUUID() };
    if (!isValidRelationship(displayedVault.accounts, relationship)) throw new Error("Choose two different accounts that still exist in this vault.");
    if (isDuplicateRelationship(displayedVault.relationships, relationship)) throw new Error("That relationship already exists.");
    await persistVault({
      ...displayedVault,
      relationships: draft.id
        ? displayedVault.relationships.map((item) => item.id === draft.id ? relationship : item)
        : [...displayedVault.relationships, relationship],
    });
    notify(draft.id ? "Relationship changes saved" : "Relationship added");
  }

  async function deleteRelationship(relationship: AccountRelationship) {
    if (!displayedVault) return;
    await persistVault({ ...displayedVault, relationships: displayedVault.relationships.filter((item) => item.id !== relationship.id) });
    notify("Relationship removed");
  }

  function applyRestoredVault(vault: VaultData) {
    setEditingAccount(undefined);
    setEditorDirty(false);
    setRelationshipUi(null);
    setSelectedAccountId(undefined);
    setVaultData(vault);
  }

  function handleLocalBackupRestored(vault: VaultData) {
    markLocalVaultChange();
    applyRestoredVault(vault);
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setAuthenticationFilter("all");
  }

  if (!vaultStatus) return <VaultLoading />;
  if (!vaultStatus.unlocked) return <VaultEntry hasVault={vaultStatus.hasVault} onCreate={handleCreateVault} onUnlock={handleUnlockVault} />;

  return (
    <div className="app-shell" data-theme={resolvedTheme}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar" aria-label="Primary navigation">
        <AccountOsBrand />
        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button aria-current={activeView === item.id ? "page" : undefined} className="nav-item" data-active={activeView === item.id} disabled={vaultOperationBusy && activeView !== item.id} key={item.id} onClick={() => setActiveView(item.id)} type="button"><Icon aria-hidden="true" size={19} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="sidebar-footer">
          {isTauriRuntime ? <button className="sidebar-lock" disabled={vaultOperationBusy} onClick={requestLock} title={vaultOperationBusy ? "Wait for the active vault operation to finish" : undefined} type="button"><LockKeyhole aria-hidden="true" size={17} />{vaultOperationBusy ? "Vault operation active" : "Lock Vault"}</button> : <div className="sidebar-preview"><LockKeyhole aria-hidden="true" size={16} />Renderer preview</div>}
          <div className="sidebar-status" data-online={online}>{online ? <Wifi aria-hidden="true" size={17} /> : <WifiOff aria-hidden="true" size={17} />}<div><strong>{online ? "Online" : "Offline ready"}</strong><span>{online ? "Cloud connection is optional" : "Local vault remains available"}</span></div></div>
          <p className="sidebar-motto">Your data. Your control.</p>
        </div>
      </aside>

      <main className="workspace" id="main-content">
        {activeView === "vault" && (
          <section className="vault-screen" aria-labelledby="vault-title">
            <aside className="vault-list-pane">
              <header className="vault-list-header"><div><h1 id="vault-title">Vault</h1><p>{displayedVault?.accounts.length ?? 0} accounts · {displayedVault?.relationships.length ?? 0} relationships</p></div><button className="primary-button compact-button" onClick={() => setEditingAccount(null)} type="button">+ Add account</button></header>
              <div className="vault-filters">
                <label className="vault-search" htmlFor="vault-search"><span aria-hidden="true">⌕</span><input autoComplete="off" id="vault-search" name="vaultSearch" onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts" type="search" value={search} /></label>
                <div><select aria-label="Filter by category" name="categoryFilter" onChange={(event) => setCategoryFilter(event.target.value as AccountCategory | "all")} value={categoryFilter}><option value="all">All categories</option>{ACCOUNT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><select aria-label="Filter by authentication method" name="authenticationFilter" onChange={(event) => setAuthenticationFilter(event.target.value as AuthenticationMethod | "all")} value={authenticationFilter}><option value="all">All authentication methods</option>{AUTHENTICATION_METHODS.map((method) => <option key={method}>{method}</option>)}</select></div>
              </div>
              {displayedVault && displayedVault.accounts.length ? (
                visibleAccounts.length ? <AccountList accounts={visibleAccounts} onSelect={(account) => setSelectedAccountId(account.id)} selectedAccountId={selectedAccountId} /> : <div className="vault-zero list-zero"><span aria-hidden="true">⌕</span><h2>No matching accounts</h2><p>Try a different search or clear the active filters.</p><button className="secondary-button" onClick={clearFilters} type="button">Clear search and filters</button></div>
              ) : <div className="vault-zero list-zero"><span aria-hidden="true">▱</span><h2>No accounts yet</h2><p>Add your first account to begin your encrypted vault.</p></div>}
            </aside>
            <AccountInspector account={selectedAccount} accounts={displayedVault?.accounts ?? []} onAddFirstAccount={() => setEditingAccount(null)} onEdit={setEditingAccount} onManageRelationships={(account) => setRelationshipUi({ initialMode: "manage", managingAccountId: account.id, sourceAccountId: account.id })} onNotify={notify} onOpenAccount={(account) => setSelectedAccountId(account.id)} relationships={displayedVault?.relationships ?? []} />
          </section>
        )}

        {activeView === "map" && (
          <section className="map-screen" aria-labelledby="map-title">
            <header className="screen-header"><div><p className="eyebrow">Identity map</p><h1 id="map-title">Map</h1><p>Explore real accounts and the relationships stored in your local vault.</p></div><span>{displayedVault?.accounts.length ?? 0} accounts · {displayedVault?.relationships.length ?? 0} relationships</span></header>
            <DependencyMap accounts={displayedVault?.accounts ?? []} onOpenAccount={(account) => { setSelectedAccountId(account.id); setActiveView("vault"); }} onRequestRelationship={(sourceAccountId) => setRelationshipUi({ initialMode: "add", sourceAccountId })} onSelectAccount={(account) => setSelectedAccountId(account.id)} relationships={displayedVault?.relationships ?? []} />
          </section>
        )}

        {activeView === "settings" && <SettingsScreen isNative={isTauriRuntime} onCloudVaultRestored={applyRestoredVault} onThemeChange={setTheme} onVaultOperationChange={setVaultOperationBusy} onVaultRestored={handleLocalBackupRestored} theme={theme} />}
      </main>

      {editingAccount !== undefined && (
        <AccountEditor account={editingAccount} onClose={() => { setEditingAccount(undefined); setEditorDirty(false); }} onDelete={deleteAccount} onDirtyChange={setEditorDirty} onNotify={notify} onSave={saveAccount} relationshipCount={editingAccount ? relationshipsForAccount(displayedVault?.relationships ?? [], editingAccount.id).length : 0} />
      )}

      {relationshipUi && displayedVault && (
        <RelationshipDialog accounts={displayedVault.accounts} initialMode={relationshipUi.initialMode} initialSourceId={relationshipUi.sourceAccountId} managingAccountId={relationshipUi.managingAccountId} onClose={() => setRelationshipUi(null)} onDelete={deleteRelationship} onOpenAccount={(account) => { setSelectedAccountId(account.id); setActiveView("vault"); setRelationshipUi(null); }} onSave={saveRelationship} relationships={displayedVault.relationships} />
      )}

      {confirmingLock && (
        <Dialog className="confirm-dialog" labelledBy="discard-lock-title" onRequestClose={() => setConfirmingLock(false)}>
          <div className="confirm-icon warning" aria-hidden="true"><LockKeyhole size={22} /></div>
          <h2 id="discard-lock-title">Discard edits and lock?</h2>
          <p>You have unsaved account changes. Locking now will discard those edits before the decrypted vault leaves memory.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus onClick={() => setConfirmingLock(false)} type="button">Keep editing</button><button className="primary-button" onClick={() => { setConfirmingLock(false); setEditingAccount(undefined); setEditorDirty(false); void performLock(); }} type="button">Discard and lock</button></footer>
        </Dialog>
      )}
    </div>
  );
}

export default App;
