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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let storage_dir = app.path().app_data_dir()?;
            app.manage(VaultState {
                service: VaultService::new(storage_dir),
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
            import_sync_payload
        ])
        .run(tauri::generate_context!())
        .expect("error while running Account OS");
}
