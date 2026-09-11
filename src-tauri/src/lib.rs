mod vault;

use std::sync::Mutex;

use tauri::{Manager, State};
use vault::{validate_vault, UnlockedVault, VaultData, VaultService, VaultStatus};

struct VaultState {
    service: VaultService,
    unlocked_vault: Mutex<Option<UnlockedVault>>,
}

#[tauri::command]
fn vault_status(state: State<'_, VaultState>) -> VaultStatus {
    VaultStatus {
        has_vault: state.service.exists(),
        unlocked: state
            .unlocked_vault
            .lock()
            .map(|vault| vault.is_some())
            .unwrap_or(false),
    }
}

#[tauri::command]
fn create_vault(password: String, state: State<'_, VaultState>) -> Result<VaultData, String> {
    let unlocked_vault = state
        .service
        .create(password)
        .map_err(|error| error.public_message())?;
    let vault = unlocked_vault.data.clone();
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    *unlocked = Some(unlocked_vault);
    Ok(vault)
}

#[tauri::command]
fn unlock_vault(password: String, state: State<'_, VaultState>) -> Result<VaultData, String> {
    let unlocked_vault = state
        .service
        .unlock(password)
        .map_err(|error| error.public_message())?;
    let vault = unlocked_vault.data.clone();
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    *unlocked = Some(unlocked_vault);
    Ok(vault)
}

#[tauri::command]
fn lock_vault(state: State<'_, VaultState>) -> Result<(), String> {
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    *unlocked = None;
    Ok(())
}

#[tauri::command]
fn save_vault(vault: VaultData, state: State<'_, VaultState>) -> Result<VaultData, String> {
    validate_vault(&vault).map_err(|error| error.public_message())?;
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    let unlocked = unlocked
        .as_mut()
        .ok_or_else(|| "Unlock the local vault before saving changes.".to_string())?;
    state
        .service
        .save_data(&vault, unlocked)
        .map_err(|error| error.public_message())?;
    unlocked.data = vault;
    Ok(unlocked.data.clone())
}

#[tauri::command]
fn change_master_password(
    current_password: String,
    new_password: String,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    if new_password.is_empty() {
        return Err("Enter a new master password.".to_string());
    }
    if current_password == new_password {
        return Err("Choose a new master password that differs from the current one.".to_string());
    }
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    if unlocked.is_none() {
        return Err("Unlock the local vault before changing the master password.".to_string());
    }
    let rekeyed = state
        .service
        .change_master_password(current_password, new_password)
        .map_err(|error| error.public_message().to_string())?;
    *unlocked = Some(rekeyed);
    Ok(())
}

#[tauri::command]
fn export_backup(path: String, state: State<'_, VaultState>) -> Result<(), String> {
    let unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    if unlocked.is_none() {
        return Err("Unlock the local vault before exporting a backup.".to_string());
    }
    state
        .service
        .export_backup(path.into())
        .map_err(|error| error.public_message().to_string())
}

#[tauri::command]
fn import_backup(
    path: String,
    password: String,
    state: State<'_, VaultState>,
) -> Result<VaultData, String> {
    let imported = state
        .service
        .import_backup(path.into(), password)
        .map_err(|error| error.public_message())?;
    let vault = imported.data.clone();
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    *unlocked = Some(imported);
    Ok(vault)
}

#[tauri::command]
fn export_sync_payload(state: State<'_, VaultState>) -> Result<String, String> {
    let unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    if unlocked.is_none() {
        return Err("Unlock the local vault before syncing.".to_string());
    }
    state
        .service
        .export_sync_payload()
        .map_err(|error| error.public_message().to_string())
}

#[tauri::command]
fn import_sync_payload(
    payload: String,
    password: String,
    state: State<'_, VaultState>,
) -> Result<VaultData, String> {
    let imported = state
        .service
        .import_sync_payload(payload, password)
        .map_err(|error| error.public_message())?;
    let vault = imported.data.clone();
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    *unlocked = Some(imported);
    Ok(vault)
}

#[tauri::command]
fn delete_vault(state: State<'_, VaultState>) -> Result<(), String> {
    let mut unlocked = state
        .unlocked_vault
        .lock()
        .map_err(|_| "The local vault is temporarily unavailable.".to_string())?;
    if unlocked.is_none() {
        return Err("Unlock the local vault before deleting it.".to_string());
    }
    // Reuses the existing storage layer's own file removal, not a new
    // ad hoc deletion path; never touches key derivation or the atomic
    // write primitive used for saves.
    state
        .service
        .delete_vault_file()
        .map_err(|_| "Unable to delete the local vault file.".to_string())?;
    *unlocked = None;
    Ok(())
}

#[tauri::command]
fn vault_file_size(state: State<'_, VaultState>) -> Option<u64> {
    state.service.vault_file_size()
}

/// Real, locally-observable device facts for Settings -> System's Device
/// card (Section 3.6: every value here is real and already knowable, no
/// fabricated fields). No network calls, no telemetry.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DeviceInfo {
    app_data_path: String,
    hostname: String,
    os: String,
}

#[tauri::command]
fn device_info(state: State<'_, VaultState>) -> DeviceInfo {
    DeviceInfo {
        app_data_path: state.service.storage_dir().display().to_string(),
        hostname: std::env::var("COMPUTERNAME")
            .or_else(|_| std::env::var("HOSTNAME"))
            .unwrap_or_else(|_| "Unknown device".to_string()),
        os: windows_display_name(),
    }
}

#[cfg(target_os = "windows")]
fn windows_display_name() -> String {
    // `cmd /c ver` reports "Microsoft Windows [Version 10.0.<build>]".
    // Windows 11 shipped as build >= 22000 while keeping major.minor at
    // 10.0, so std::env::consts::OS alone ("windows") can't tell them
    // apart; this is the smallest real (non-fabricated) way to do so
    // without adding a registry-reading dependency.
    let build = std::process::Command::new("cmd")
        .args(["/C", "ver"])
        .output()
        .ok()
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .and_then(|text| {
            text.rsplit_once("10.0.").and_then(|(_, rest)| {
                rest.trim_end_matches([']', '\r', '\n']).parse::<u32>().ok()
            })
        });
    match build {
        Some(build) if build >= 22000 => "Windows 11".to_string(),
        Some(_) => "Windows 10".to_string(),
        None => "Windows".to_string(),
    }
}

#[cfg(not(target_os = "windows"))]
fn windows_display_name() -> String {
    std::env::consts::OS.to_string()
}

/// Opens the vault's app-data folder in the OS file browser. Windows-only
/// (the shipped packaging targets Windows x64 - see KNOWN-LIMITATIONS);
/// reveals only a path already shown in the Device card, nothing sensitive.
#[tauri::command]
fn open_app_data_folder(state: State<'_, VaultState>) -> Result<(), String> {
    let dir = state.service.storage_dir();
    std::fs::create_dir_all(dir).map_err(|_| "Unable to prepare the app data folder.".to_string())?;
    open_folder(dir)
}

#[cfg(target_os = "windows")]
fn open_folder(dir: &std::path::Path) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(dir)
        .spawn()
        .map_err(|_| "Unable to open the app data folder.".to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn open_folder(_dir: &std::path::Path) -> Result<(), String> {
    Err("Opening the app data folder is only supported on Windows in this build.".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let storage_dir = app.path().app_data_dir()?;
            let service = VaultService::new(storage_dir);

            // Clear any *.tmp files a previous run left behind if it was killed
            // mid-save. They are ciphertext-only litter. Log names only.
            let swept = service.sweep_stale_temp_files();
            if !swept.is_empty() {
                eprintln!(
                    "account-os: removed {} stale temp file(s) from an interrupted save: {}",
                    swept.len(),
                    swept.join(", ")
                );
            }

            app.manage(VaultState {
                service,
                unlocked_vault: Mutex::new(None),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            vault_status,
            create_vault,
            unlock_vault,
            lock_vault,
            save_vault,
            change_master_password,
            export_backup,
            import_backup,
            export_sync_payload,
            import_sync_payload,
            delete_vault,
            vault_file_size,
            device_info,
            open_app_data_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running Account OS");
}
