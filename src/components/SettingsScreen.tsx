import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { AlertTriangle, Cloud, DatabaseBackup, Eye, EyeOff, FolderOpen, HardDrive, Info, KeyRound, Laptop, LockKeyhole, MonitorCog, Palette, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import appPackage from "../../package.json";
import type { VaultData } from "../domain/types";
import { CloudSyncPanel } from "./CloudSyncPanel";
import { Dialog } from "./ui/Modal";

export type ThemePreference = "light" | "dark" | "system";
type SettingsSection = "appearance" | "security" | "data" | "connected" | "system";
type OperationStatus = { tone: "success" | "error" | "info"; message: string } | null;

interface DeviceInfo {
  appDataPath: string;
  hostname: string;
  os: string;
}

interface SettingsScreenProps {
  isNative: boolean;
  onCloudVaultRestored: (vault: VaultData) => void;
  onMasterPasswordChanged: () => void;
  onThemeChange: (theme: ThemePreference) => void;
  onVaultDeleted: () => void;
  onVaultOperationChange: (busy: boolean) => void;
  onVaultRestored: (vault: VaultData) => void;
  theme: ThemePreference;
}

/** Real byte count formatted for display - no fabricated quota (Section 3.6). */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value < 10 ? value.toFixed(2) : value < 100 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

const settingsSections: Array<{ id: SettingsSection; label: string; icon: typeof Palette }> = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "data", label: "Data & Recovery", icon: DatabaseBackup },
  { id: "connected", label: "Connected", icon: Cloud },
  { id: "system", label: "System", icon: MonitorCog },
];
const themeOptions: ThemePreference[] = ["light", "dark", "system"];

export function SettingsScreen({ isNative, onCloudVaultRestored, onMasterPasswordChanged, onThemeChange, onVaultDeleted, onVaultOperationChange, onVaultRestored, theme }: SettingsScreenProps) {
  const [section, setSection] = useState<SettingsSection>("appearance");
  const [importPath, setImportPath] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [exportStatus, setExportStatus] = useState<OperationStatus>(null);
  const [restoreStatus, setRestoreStatus] = useState<OperationStatus>(null);
  const [exportWorking, setExportWorking] = useState(false);
  const [restoreWorking, setRestoreWorking] = useState(false);
  const [cloudWorking, setCloudWorking] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [appVersion, setAppVersion] = useState(appPackage.version);
  const [currentMaster, setCurrentMaster] = useState("");
  const [newMaster, setNewMaster] = useState("");
  const [confirmMaster, setConfirmMaster] = useState("");
  const [rekeyVisible, setRekeyVisible] = useState(false);
  const [rekeyStatus, setRekeyStatus] = useState<OperationStatus>(null);
  const [rekeyWorking, setRekeyWorking] = useState(false);
  const [confirmRekey, setConfirmRekey] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [vaultSizeBytes, setVaultSizeBytes] = useState<number | null>(null);
  const [openFolderStatus, setOpenFolderStatus] = useState<OperationStatus>(null);
  const [resetAppStatus, setResetAppStatus] = useState<OperationStatus>(null);
  const [confirmResetApp, setConfirmResetApp] = useState(false);
  const [deleteVaultStatus, setDeleteVaultStatus] = useState<OperationStatus>(null);
  const [deleteVaultWorking, setDeleteVaultWorking] = useState(false);
  const [confirmDeleteVault, setConfirmDeleteVault] = useState(false);
  const backupFileButtonRef = useRef<HTMLButtonElement>(null);
  const backupPasswordRef = useRef<HTMLInputElement>(null);
  const currentMasterRef = useRef<HTMLInputElement>(null);
  const newMasterRef = useRef<HTMLInputElement>(null);

  function resetRekeyFields() {
    setCurrentMaster("");
    setNewMaster("");
    setConfirmMaster("");
    setRekeyVisible(false);
    setConfirmRekey(false);
  }

  useEffect(() => {
    if (!isNative) return;
    getVersion().then(setAppVersion).catch(() => setAppVersion(appPackage.version));
  }, [isNative]);

  useEffect(() => {
    if (!isNative) return;
    invoke<DeviceInfo>("device_info").then(setDeviceInfo).catch(() => setDeviceInfo(null));
    invoke<number | null>("vault_file_size").then(setVaultSizeBytes).catch(() => setVaultSizeBytes(null));
  }, [isNative]);

  useEffect(() => {
    onVaultOperationChange(exportWorking || restoreWorking || cloudWorking || rekeyWorking || deleteVaultWorking);
    return () => onVaultOperationChange(false);
  }, [cloudWorking, deleteVaultWorking, exportWorking, onVaultOperationChange, rekeyWorking, restoreWorking]);

  async function openAppDataFolder() {
    setOpenFolderStatus(null);
    if (!isNative) {
      setOpenFolderStatus({ tone: "info", message: "Opening the app data folder is available in the installed desktop application." });
      return;
    }
    try {
      await invoke("open_app_data_folder");
    } catch {
      setOpenFolderStatus({ tone: "error", message: "Unable to open the app data folder." });
    }
  }

  function resetApp() {
    // Clears the one real client-side preference this app has (theme).
    // Deliberately does not touch anything under the "data/vault" umbrella
    // (backup/restore state, cloud sync bookkeeping) - those aren't
    // "settings", and the reference's own description is "keeps vault
    // data".
    window.localStorage.removeItem("account-os-theme");
    onThemeChange("light");
    setConfirmResetApp(false);
    setResetAppStatus({ tone: "success", message: "Settings reset to defaults. Your vault data was not touched." });
  }

  function requestDeleteVault() {
    if (!isNative) {
      setDeleteVaultStatus({ tone: "info", message: "Deleting the vault is available in the installed desktop application." });
      return;
    }
    setConfirmDeleteVault(true);
  }

  async function deleteVault() {
    setDeleteVaultWorking(true);
    setDeleteVaultStatus(null);
    try {
      await invoke("delete_vault");
      setConfirmDeleteVault(false);
      onVaultDeleted();
    } catch (reason) {
      setDeleteVaultStatus({ tone: "error", message: typeof reason === "string" ? reason : "Unable to delete the local vault." });
      setConfirmDeleteVault(false);
    } finally {
      setDeleteVaultWorking(false);
    }
  }

  async function exportBackup() {
    setExportStatus(null);
    if (!isNative) {
      setExportStatus({ tone: "info", message: "Encrypted backup export is available in the installed desktop application." });
      return;
    }
    const path = await saveDialog({
      defaultPath: "account-os-backup.aosbackup",
      filters: [{ name: "Account OS encrypted backup", extensions: ["aosbackup"] }],
    });
    if (!path) return;
    setExportWorking(true);
    try {
      await invoke("export_backup", { path });
      setExportStatus({ tone: "success", message: "Encrypted backup exported successfully." });
    } catch {
      setExportStatus({ tone: "error", message: "Backup export failed. Choose a new destination and try again." });
    } finally {
      setExportWorking(false);
    }
  }

  async function chooseBackup() {
    setRestoreStatus(null);
    if (!isNative) {
      setRestoreStatus({ tone: "info", message: "Encrypted backup restore is available in the installed desktop application." });
      return;
    }
    const path = await openDialog({
      directory: false,
      multiple: false,
      filters: [{ name: "Account OS encrypted backup", extensions: ["aosbackup"] }],
    });
    if (typeof path === "string") setImportPath(path);
  }

  function requestRestore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRestoreStatus(null);
    if (!importPath || !masterPassword) {
      setRestoreStatus({ tone: "error", message: "Choose an encrypted backup and enter its master password." });
      window.requestAnimationFrame(() => {
        if (!importPath) backupFileButtonRef.current?.focus();
        else backupPasswordRef.current?.focus();
      });
      return;
    }
    setConfirmRestore(true);
  }

  function cancelRestoreConfirmation() {
    if (restoreWorking) return;
    setConfirmRestore(false);
    setMasterPassword("");
    setPasswordVisible(false);
  }

  async function importBackup() {
    setRestoreWorking(true);
    setRestoreStatus(null);
    try {
      const vault = await invoke<VaultData>("import_backup", { path: importPath, password: masterPassword });
      onVaultRestored(vault);
      setRestoreStatus({ tone: "success", message: "Backup validated and restored. The previous local vault was replaced only after validation." });
      setImportPath("");
    } catch {
      setRestoreStatus({ tone: "error", message: "The backup could not be validated. Check the file and backup master password; your current vault was not changed." });
    } finally {
      setMasterPassword("");
      setPasswordVisible(false);
      setRestoreWorking(false);
      setConfirmRestore(false);
    }
  }

  function requestRekey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRekeyStatus(null);
    if (!isNative) {
      setRekeyStatus({ tone: "info", message: "Changing the master password is available in the installed desktop application." });
      return;
    }
    if (!currentMaster || !newMaster || !confirmMaster) {
      setRekeyStatus({ tone: "error", message: "Enter your current master password and choose a new one twice." });
      window.requestAnimationFrame(() => (!currentMaster ? currentMasterRef : newMasterRef).current?.focus());
      return;
    }
    if (newMaster.length < 12) {
      setRekeyStatus({ tone: "error", message: "Use a master password with at least 12 characters." });
      window.requestAnimationFrame(() => newMasterRef.current?.focus());
      return;
    }
    if (newMaster !== confirmMaster) {
      setRekeyStatus({ tone: "error", message: "The new master password entries do not match." });
      window.requestAnimationFrame(() => newMasterRef.current?.focus());
      return;
    }
    if (newMaster === currentMaster) {
      setRekeyStatus({ tone: "error", message: "Choose a new master password that differs from the current one." });
      window.requestAnimationFrame(() => newMasterRef.current?.focus());
      return;
    }
    setConfirmRekey(true);
  }

  function cancelRekeyConfirmation() {
    if (rekeyWorking) return;
    setConfirmRekey(false);
  }

  async function changeMasterPassword() {
    setRekeyWorking(true);
    setRekeyStatus(null);
    try {
      await invoke("change_master_password", { currentPassword: currentMaster, newPassword: newMaster });
      resetRekeyFields();
      setRekeyStatus({ tone: "success", message: "Master password changed. The vault was re-encrypted; use the new password at the next unlock." });
      onMasterPasswordChanged();
    } catch (reason) {
      resetRekeyFields();
      setRekeyStatus({ tone: "error", message: typeof reason === "string" ? reason : "The master password was not changed. Your vault is unchanged." });
    } finally {
      setRekeyWorking(false);
    }
  }

  function changeSection(nextSection: SettingsSection) {
    if (section === "data" && nextSection !== "data") {
      setMasterPassword("");
      setPasswordVisible(false);
      setConfirmRestore(false);
    }
    if (section === "security" && nextSection !== "security") {
      resetRekeyFields();
      setRekeyStatus(null);
    }
    if (section === "system" && nextSection !== "system") {
      setOpenFolderStatus(null);
      setResetAppStatus(null);
      setDeleteVaultStatus(null);
      setConfirmResetApp(false);
      setConfirmDeleteVault(false);
    }
    setSection(nextSection);
  }

  function handleThemeKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : 0;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? themeOptions.length - 1
        : direction
          ? (index + direction + themeOptions.length) % themeOptions.length
          : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const nextTheme = themeOptions[nextIndex];
    onThemeChange(nextTheme);
    window.requestAnimationFrame(() => document.getElementById(`theme-option-${nextTheme}`)?.focus());
  }

  return (
    <section className="settings-screen" aria-labelledby="settings-title">
      <aside className="settings-nav" aria-label="Settings sections">
        <div><p className="eyebrow">Settings</p><h1 id="settings-title">Preferences</h1></div>
        {settingsSections.map((item) => {
          const Icon = item.icon;
          return <button aria-current={section === item.id ? "page" : undefined} data-active={section === item.id} disabled={(exportWorking || restoreWorking || cloudWorking) && section !== item.id} key={item.id} onClick={() => changeSection(item.id)} type="button"><Icon aria-hidden="true" size={17} /><span>{item.label}</span></button>;
        })}
      </aside>

      <div className="settings-content">
        {section === "appearance" && (
          <SettingsSectionHeading description="Choose how Account OS looks on this device." icon={Palette} title="Appearance">
            <div className="theme-choice" role="radiogroup" aria-label="Appearance theme">
              {themeOptions.map((option, index) => (
                <button aria-checked={theme === option} data-active={theme === option} id={`theme-option-${option}`} key={option} onClick={() => onThemeChange(option)} onKeyDown={(event) => handleThemeKeyDown(event, index)} role="radio" tabIndex={theme === option ? 0 : -1} type="button">
                  <i aria-hidden="true" data-theme-preview={option} />
                  <span><strong>{option === "light" ? "Light" : option === "dark" ? "Dark" : "System"}</strong><small>{option === "light" ? "Recommended calm V3 appearance" : option === "dark" ? "Contrast-safe low-light workspace" : "Follow your Windows appearance"}</small></span>
                  <b aria-hidden="true" />
                </button>
              ))}
            </div>
          </SettingsSectionHeading>
        )}

        {section === "security" && (
          <SettingsSectionHeading description="Verified properties of the local vault—not simulated settings." icon={ShieldCheck} title="Security">
            <div className="settings-list">
              <InfoRow icon={LockKeyhole} label="Vault locking" value="Manual lock from the navigation" />
              <InfoRow icon={ShieldCheck} label="Vault encryption" value="Argon2id key derivation · XChaCha20-Poly1305" />
              <InfoRow icon={Cloud} label="Cloud boundary" value="Optional sync stores encrypted vault payloads only" />
            </div>
            <article className="settings-card">
              <div className="settings-card-heading"><div className="settings-card-icon"><KeyRound size={20} /></div><div><h3>Change master password</h3><p>Re-encrypts the entire local vault under a new key. The vault file is replaced only after the new key is derived and verified; a wrong current password changes nothing.</p></div></div>
              <form noValidate onSubmit={requestRekey}>
                <label className="field-label" htmlFor="current-master-password">Current master password<span className="input-with-action"><input aria-describedby={rekeyStatus?.tone === "error" ? "rekey-operation-status" : undefined} aria-invalid={rekeyStatus?.tone === "error" || undefined} autoComplete="current-password" id="current-master-password" name="currentMasterPassword" onChange={(event) => setCurrentMaster(event.target.value)} ref={currentMasterRef} spellCheck="false" type={rekeyVisible ? "text" : "password"} value={currentMaster} /><button aria-label={rekeyVisible ? "Hide master passwords" : "Show master passwords"} onClick={() => setRekeyVisible((visible) => !visible)} type="button">{rekeyVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
                <label className="field-label" htmlFor="new-master-password">New master password<input autoComplete="new-password" id="new-master-password" name="newMasterPassword" onChange={(event) => setNewMaster(event.target.value)} ref={newMasterRef} spellCheck="false" type={rekeyVisible ? "text" : "password"} value={newMaster} /></label>
                <label className="field-label" htmlFor="confirm-master-password">Confirm new master password<input autoComplete="new-password" id="confirm-master-password" name="confirmMasterPassword" onChange={(event) => setConfirmMaster(event.target.value)} spellCheck="false" type={rekeyVisible ? "text" : "password"} value={confirmMaster} /></label>
                <button className="primary-button" disabled={rekeyWorking} type="submit">{rekeyWorking ? "Changing…" : "Change master password"}</button>
                <OperationMessage id="rekey-operation-status" status={rekeyStatus} />
              </form>
            </article>
            <p className="settings-callout"><Info size={17} />Windows Hello and automatic lock controls are not part of this V3 candidate.</p>
          </SettingsSectionHeading>
        )}

        {section === "data" && (
          <SettingsSectionHeading description="Create and validate encrypted Account OS backups." icon={DatabaseBackup} title="Data & Recovery">
            <div className="recovery-grid">
              <article className="settings-card">
                <div className="settings-card-heading"><div className="settings-card-icon"><DatabaseBackup size={20} /></div><div><h3>Export encrypted backup</h3><p>Choose a new .aosbackup destination. Account OS never creates a plaintext credential export.</p></div></div>
                <button className="primary-button" disabled={exportWorking} onClick={() => void exportBackup()} type="button">{exportWorking ? "Exporting…" : "Export encrypted backup"}</button>
                <OperationMessage status={exportStatus} />
              </article>
              <article className="settings-card restore-card">
                <div className="settings-card-heading"><div className="settings-card-icon"><ShieldCheck size={20} /></div><div><h3>Restore encrypted backup</h3><p>The current local vault changes only after the backup password and encrypted payload are validated.</p></div></div>
                <form onSubmit={requestRestore}>
                  <button className="secondary-button" disabled={restoreWorking} onClick={() => void chooseBackup()} ref={backupFileButtonRef} type="button">Choose backup file</button>
                  <span className="selected-file" data-selected={Boolean(importPath)}>{importPath ? "Encrypted backup selected" : "No backup selected"}</span>
                  <label className="field-label" htmlFor="backup-master-password">Backup master password<span className="input-with-action"><input aria-describedby={restoreStatus?.tone === "error" ? "restore-operation-status" : undefined} aria-invalid={restoreStatus?.tone === "error" || undefined} autoComplete="current-password" id="backup-master-password" name="backupMasterPassword" onChange={(event) => setMasterPassword(event.target.value)} ref={backupPasswordRef} spellCheck="false" type={passwordVisible ? "text" : "password"} value={masterPassword} /><button aria-label={passwordVisible ? "Hide backup master password" : "Show backup master password"} onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
                  <button className="primary-button" disabled={restoreWorking} type="submit">{restoreWorking ? "Restoring…" : "Restore encrypted backup"}</button>
                  <OperationMessage id="restore-operation-status" status={restoreStatus} />
                </form>
              </article>
            </div>
          </SettingsSectionHeading>
        )}

        {section === "connected" && (
          <SettingsSectionHeading description="Cloud identity and local vault unlock stay separate." icon={Cloud} title="Connected">
            <CloudSyncPanel isNative={isNative} onBusyChange={setCloudWorking} onVaultRestored={onCloudVaultRestored} />
          </SettingsSectionHeading>
        )}

        {section === "system" && (
          <SettingsSectionHeading description="Build information for this Account OS installation." icon={MonitorCog} title="System">
            <div className="settings-list">
              <InfoRow icon={Info} label="Application" value="Account OS" />
              <InfoRow icon={MonitorCog} label="Version" value={appVersion} />
              <InfoRow icon={ShieldCheck} label="Runtime" value={isNative ? "Tauri desktop application" : "Web renderer preview"} />
            </div>

            <article className="settings-card">
              <div className="settings-card-heading"><div className="settings-card-icon"><Laptop size={20} /></div><div><h3>Device</h3><p>Real, locally-observable values - no telemetry, nothing sent anywhere.</p></div></div>
              {isNative && deviceInfo ? (
                <div className="settings-list">
                  <InfoRow icon={Laptop} label="Device name" value={deviceInfo.hostname} />
                  <InfoRow icon={MonitorCog} label="OS" value={deviceInfo.os} />
                  <InfoRow icon={HardDrive} label="App data" value={deviceInfo.appDataPath} />
                </div>
              ) : (
                <p className="operation-message" data-tone="info">{isNative ? "Loading device information…" : "Device details are available in the installed desktop application."}</p>
              )}
              <button className="secondary-button" disabled={!isNative} onClick={() => void openAppDataFolder()} type="button"><FolderOpen size={15} />Open folder</button>
              <OperationMessage status={openFolderStatus} />
            </article>

            <article className="settings-card">
              <div className="settings-card-heading"><div className="settings-card-icon"><HardDrive size={20} /></div><div><h3>Storage</h3><p>The real size of your encrypted vault file on disk.</p></div></div>
              <div className="settings-list">
                <InfoRow icon={HardDrive} label="Vault file size" value={isNative ? (vaultSizeBytes != null ? formatBytes(vaultSizeBytes) : "Unavailable") : "Available in the installed desktop application"} />
              </div>
            </article>

            <article className="settings-card danger-zone">
              <div className="settings-card-heading"><div className="settings-card-icon danger"><AlertTriangle size={20} /></div><div><h3>Danger zone</h3><p>These actions cannot be undone.</p></div></div>
              <div className="danger-zone-actions">
                <div className="danger-zone-row">
                  <div><strong>Reset app</strong><p>Clear all settings (keeps vault data).</p></div>
                  <button className="danger-button subtle-danger" onClick={() => setConfirmResetApp(true)} type="button"><RotateCcw size={15} />Reset app</button>
                </div>
                <div className="danger-zone-row">
                  <div><strong>Delete vault</strong><p>Permanently delete the vault from this device.</p></div>
                  <button className="danger-button subtle-danger" onClick={requestDeleteVault} type="button"><Trash2 size={15} />Delete vault</button>
                </div>
              </div>
              <OperationMessage status={resetAppStatus} />
              <OperationMessage status={deleteVaultStatus} />
            </article>
          </SettingsSectionHeading>
        )}
      </div>

      {confirmRestore && (
        <Dialog className="confirm-dialog" labelledBy="confirm-restore-title" onRequestClose={cancelRestoreConfirmation}>
          <div className="confirm-icon warning" aria-hidden="true"><DatabaseBackup size={22} /></div>
          <h2 id="confirm-restore-title">Restore this encrypted backup?</h2>
          <p>After validation, this backup will replace the current local vault. If validation fails, the current vault stays unchanged.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus disabled={restoreWorking} onClick={cancelRestoreConfirmation} type="button">Cancel</button><button className="primary-button" disabled={restoreWorking} onClick={() => void importBackup()} type="button">{restoreWorking ? "Restoring…" : "Restore and replace"}</button></footer>
        </Dialog>
      )}

      {confirmRekey && (
        <Dialog className="confirm-dialog" labelledBy="confirm-rekey-title" onRequestClose={cancelRekeyConfirmation}>
          <div className="confirm-icon warning" aria-hidden="true"><KeyRound size={22} /></div>
          <h2 id="confirm-rekey-title">Change the master password?</h2>
          <p>The local vault will be re-encrypted under the new password. The current password stops working once this succeeds. If anything fails, the vault is left unchanged.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus disabled={rekeyWorking} onClick={cancelRekeyConfirmation} type="button">Cancel</button><button className="primary-button" disabled={rekeyWorking} onClick={() => void changeMasterPassword()} type="button">{rekeyWorking ? "Changing…" : "Change password"}</button></footer>
        </Dialog>
      )}

      {confirmResetApp && (
        <Dialog className="confirm-dialog" labelledBy="confirm-reset-app-title" onRequestClose={() => setConfirmResetApp(false)}>
          <div className="confirm-icon warning" aria-hidden="true"><RotateCcw size={22} /></div>
          <h2 id="confirm-reset-app-title">Reset app settings?</h2>
          <p>This clears Account OS's saved preferences (currently just your appearance theme) and restores their defaults. Your vault and its accounts are not touched.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus onClick={() => setConfirmResetApp(false)} type="button">Cancel</button><button className="danger-button" onClick={resetApp} type="button">Reset app</button></footer>
        </Dialog>
      )}

      {confirmDeleteVault && (
        <Dialog className="confirm-dialog" labelledBy="confirm-delete-vault-title" onRequestClose={() => { if (!deleteVaultWorking) setConfirmDeleteVault(false); }}>
          <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={22} /></div>
          <h2 id="confirm-delete-vault-title">Delete this vault?</h2>
          <p>This permanently deletes the encrypted vault file from this device, including every account and relationship inside it. This cannot be undone - export a backup first if you want to keep a copy.</p>
          <footer className="dialog-actions"><button className="secondary-button" data-autofocus disabled={deleteVaultWorking} onClick={() => setConfirmDeleteVault(false)} type="button">Cancel</button><button className="danger-button" disabled={deleteVaultWorking} onClick={() => void deleteVault()} type="button">{deleteVaultWorking ? "Deleting…" : "Delete vault"}</button></footer>
        </Dialog>
      )}
    </section>
  );
}

function SettingsSectionHeading({ children, description, icon: Icon, title }: { children: React.ReactNode; description: string; icon: typeof Palette; title: string }) {
  return <div className="settings-section"><header className="settings-section-header"><div className="settings-section-icon"><Icon aria-hidden="true" size={22} /></div><div><p className="eyebrow">Account OS settings</p><h2>{title}</h2><p>{description}</p></div></header>{children}</div>;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Palette; label: string; value: string }) {
  return <div className="settings-info-row"><span><Icon aria-hidden="true" size={17} /></span><div><strong>{label}</strong><p>{value}</p></div></div>;
}

function OperationMessage({ id, status }: { id?: string; status: OperationStatus }) {
  if (!status) return null;
  return <p className="operation-message" data-tone={status.tone} id={id} role={status.tone === "error" ? "alert" : "status"}>{status.message}</p>;
}
