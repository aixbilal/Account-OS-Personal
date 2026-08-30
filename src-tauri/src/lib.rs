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
    unlocked.data = vault;
    state
        .service
        .save_unlocked(unlocked)
        .map_err(|error| error.public_message())?;
    Ok(unlocked.data.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            save_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running Account OS");
}
