import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { Cloud, DatabaseBackup, Eye, EyeOff, Info, LockKeyhole, MonitorCog, Palette, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import appPackage from "../../package.json";
import type { VaultData } from "../domain/types";
import { CloudSyncPanel } from "./CloudSyncPanel";
import { Dialog } from "./ui/Modal";

export type ThemePreference = "light" | "dark" | "system";
type SettingsSection = "appearance" | "security" | "data" | "connected" | "system";
type OperationStatus = { tone: "success" | "error" | "info"; message: string } | null;

interface SettingsScreenProps {
  isNative: boolean;
  onCloudVaultRestored: (vault: VaultData) => void;
  onThemeChange: (theme: ThemePreference) => void;
  onVaultOperationChange: (busy: boolean) => void;
  onVaultRestored: (vault: VaultData) => void;
  theme: ThemePreference;
}

const settingsSections: Array<{ id: SettingsSection; label: string; icon: typeof Palette }> = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "data", label: "Data & Recovery", icon: DatabaseBackup },
  { id: "connected", label: "Connected", icon: Cloud },
  { id: "system", label: "System", icon: MonitorCog },
];

export function SettingsScreen({ isNative, onCloudVaultRestored, onVaultOperationChange, onVaultRestored, theme, onThemeChange }: SettingsScreenProps) {
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

  useEffect(() => {
    if (!isNative) return;
    getVersion().then(setAppVersion).catch(() => setAppVersion(appPackage.version));
  }, [isNative]);

  useEffect(() => {
    onVaultOperationChange(exportWorking || restoreWorking || cloudWorking);
    return () => onVaultOperationChange(false);
  }, [cloudWorking, exportWorking, onVaultOperationChange, restoreWorking]);

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

  return (
    <section className="settings-screen" aria-labelledby="settings-title">
      <aside className="settings-nav" aria-label="Settings sections">
        <div><p className="eyebrow">Settings</p><h2 id="settings-title">Preferences</h2></div>
        {settingsSections.map((item) => {
          const Icon = item.icon;
          return <button aria-current={section === item.id ? "page" : undefined} data-active={section === item.id} disabled={(exportWorking || restoreWorking || cloudWorking) && section !== item.id} key={item.id} onClick={() => setSection(item.id)} type="button"><Icon aria-hidden="true" size={17} /><span>{item.label}</span></button>;
        })}
      </aside>

      <div className="settings-content">
        {section === "appearance" && (
          <SettingsSectionHeading description="Choose how Account OS looks on this device." icon={Palette} title="Appearance">
            <div className="theme-choice" role="radiogroup" aria-label="Appearance theme">
              {(["light", "dark", "system"] as const).map((option) => (
                <button aria-checked={theme === option} data-active={theme === option} key={option} onClick={() => onThemeChange(option)} role="radio" type="button">
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
                  <button className="secondary-button" disabled={restoreWorking} onClick={() => void chooseBackup()} type="button">Choose backup file</button>
                  <span className="selected-file" data-selected={Boolean(importPath)}>{importPath ? "Encrypted backup selected" : "No backup selected"}</span>
                  <label className="field-label" htmlFor="backup-master-password">Backup master password<span className="input-with-action"><input autoComplete="current-password" id="backup-master-password" name="backupMasterPassword" onChange={(event) => setMasterPassword(event.target.value)} spellCheck="false" type={passwordVisible ? "text" : "password"} value={masterPassword} /><button aria-label={passwordVisible ? "Hide backup master password" : "Show backup master password"} onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
                  <button className="primary-button" disabled={!importPath || !masterPassword || restoreWorking} type="submit">{restoreWorking ? "Restoring…" : "Restore encrypted backup"}</button>
                  <OperationMessage status={restoreStatus} />
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
    </section>
  );
}

function SettingsSectionHeading({ children, description, icon: Icon, title }: { children: React.ReactNode; description: string; icon: typeof Palette; title: string }) {
  return <div className="settings-section"><header className="settings-section-header"><div className="settings-section-icon"><Icon aria-hidden="true" size={22} /></div><div><p className="eyebrow">Account OS settings</p><h2>{title}</h2><p>{description}</p></div></header>{children}</div>;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Palette; label: string; value: string }) {
  return <div className="settings-info-row"><span><Icon aria-hidden="true" size={17} /></span><div><strong>{label}</strong><p>{value}</p></div></div>;
}

function OperationMessage({ status }: { status: OperationStatus }) {
  if (!status) return null;
  return <p className="operation-message" data-tone={status.tone} role={status.tone === "error" ? "alert" : "status"}>{status.message}</p>;
}
