use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

use argon2::{Algorithm, Argon2, Params, Version};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, Zeroizing};

const VAULT_FILE_NAME: &str = "vault.aosvault";
const VAULT_FORMAT_VERSION: u8 = 1;
const KDF_SALT_BYTES: usize = 16;
const XCHACHA_NONCE_BYTES: usize = 24;
const KEY_BYTES: usize = 32;
const VAULT_AAD: &[u8] = b"account-os:vault:1";
const ARGON2_MEMORY_KIB: u32 = 65_536;
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub service_name: String,
    pub account_name: String,
    pub category: String,
    pub username: String,
    pub email: String,
    #[serde(default)]
    pub website: String,
    pub password: String,
    pub authentication_method: String,
    pub recovery_information: String,
    pub two_factor_information: String,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Hand-rolled so a stray `dbg!`, log line, `.expect()` message, or panic can
/// never dump stored credentials. `password`, `recovery_information` and
/// `two_factor_information` are replaced with `[REDACTED]`; every other field
/// still renders so the output stays useful for debugging. `VaultData`'s derived
/// `Debug` routes through this impl, so it is redacted too.
impl std::fmt::Debug for Account {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Account")
            .field("id", &self.id)
            .field("service_name", &self.service_name)
            .field("account_name", &self.account_name)
            .field("category", &self.category)
            .field("username", &self.username)
            .field("email", &self.email)
            .field("website", &self.website)
            .field("password", &"[REDACTED]")
            .field("authentication_method", &self.authentication_method)
            .field("recovery_information", &"[REDACTED]")
            .field("two_factor_information", &"[REDACTED]")
            .field("notes", &self.notes)
            .field("created_at", &self.created_at)
            .field("updated_at", &self.updated_at)
            .finish()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountRelationship {
    pub id: String,
    pub source_account_id: String,
    pub target_account_id: String,
    pub relationship_type: String,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct VaultData {
    pub format_version: u8,
    pub accounts: Vec<Account>,
    pub relationships: Vec<AccountRelationship>,
    pub categories: Vec<String>,
}

impl VaultData {
    pub fn empty() -> Self {
        Self {
            format_version: VAULT_FORMAT_VERSION,
            accounts: Vec::new(),
            relationships: Vec::new(),
            categories: [
                "Personal",
                "Development",
                "Social",
                "University",
                "Finance",
                "Work",
                "Other",
            ]
            .into_iter()
            .map(String::from)
            .collect(),
        }
    }
}

pub fn validate_vault(vault: &VaultData) -> Result<(), VaultError> {
    if vault.format_version != VAULT_FORMAT_VERSION
        || vault.accounts.iter().any(|account| {
            account.id.trim().is_empty()
                || account.service_name.trim().is_empty()
                || account.account_name.trim().is_empty()
        })
    {
        return Err(VaultError::InvalidData);
    }

    let mut ids: Vec<&str> = vault
        .accounts
        .iter()
        .map(|account| account.id.as_str())
        .collect();
    ids.sort_unstable();
    if ids.windows(2).any(|pair| pair[0] == pair[1]) {
        return Err(VaultError::InvalidData);
    }
    if vault.relationships.iter().any(|relationship| {
        relationship.id.trim().is_empty()
            || relationship.source_account_id == relationship.target_account_id
            || !matches!(
                relationship.relationship_type.as_str(),
                "LOGIN_WITH"
                    | "GOOGLE_SSO"
                    | "GITHUB_SSO"
                    | "RECOVERY_EMAIL"
                    | "CONNECTED_TO"
                    | "OWNS"
                    | "DEPENDS_ON"
                    | "LINKED_ACCOUNT"
                    | "2FA_DEVICE"
            )
            || ids
                .binary_search(&relationship.source_account_id.as_str())
                .is_err()
            || ids
                .binary_search(&relationship.target_account_id.as_str())
                .is_err()
    }) {
        return Err(VaultError::InvalidData);
    }
    let mut relationship_keys: Vec<(&str, &str, &str)> = vault
        .relationships
        .iter()
        .map(|relationship| {
            (
                relationship.source_account_id.as_str(),
                relationship.target_account_id.as_str(),
                relationship.relationship_type.as_str(),
            )
        })
        .collect();
    relationship_keys.sort_unstable();
    if relationship_keys.windows(2).any(|pair| pair[0] == pair[1]) {
        return Err(VaultError::InvalidData);
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultStatus {
    pub has_vault: bool,
    pub unlocked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct KdfMetadata {
    algorithm: String,
    version: u8,
    memory_kib: u32,
    iterations: u32,
    parallelism: u32,
    salt: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EncryptionMetadata {
    algorithm: String,
    nonce: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EncryptedVaultEnvelope {
    format_version: u8,
    kdf: KdfMetadata,
    encryption: EncryptionMetadata,
    ciphertext: String,
}

#[derive(Debug)]
pub enum VaultError {
    AlreadyExists,
    Missing,
    InvalidPasswordOrData,
    InvalidData,
    Storage,
}

/// The in-memory vault state. The master password is never retained; this
/// contains only the derived vault key needed to encrypt later edits.
pub struct UnlockedVault {
    pub data: VaultData,
    key: Zeroizing<[u8; KEY_BYTES]>,
    kdf: KdfMetadata,
}

impl VaultError {
    pub fn public_message(&self) -> &'static str {
        match self {
            Self::AlreadyExists => "A local vault already exists.",
            Self::Missing => "No local vault exists yet.",
            Self::InvalidPasswordOrData => {
                "Unable to unlock the vault. Check the master password or vault file."
            }
            Self::InvalidData => "The vault data could not be saved.",
            Self::Storage => "The local vault could not be saved safely.",
        }
    }
}

pub struct VaultService {
    storage_dir: PathBuf,
}

impl VaultService {
    pub fn new(storage_dir: PathBuf) -> Self {
        Self { storage_dir }
    }

    pub fn exists(&self) -> bool {
        self.vault_path().is_file()
    }

    /// Real on-disk size of the encrypted vault file, in bytes. Used by
    /// Settings -> System to show a truthful storage figure instead of a
    /// fabricated quota (Section 3.6: "no fabricated devices/storage").
    /// `None` if the vault does not exist yet or its size cannot be read.
    pub fn vault_file_size(&self) -> Option<u64> {
        fs::metadata(self.vault_path()).ok().map(|metadata| metadata.len())
    }

    /// Directory the encrypted vault (and its backups-in-progress) live in.
    /// Exposed read-only for the Settings "Device" card's app-data path and
    /// its "Open folder" action — never for anything that touches the vault
    /// file's contents or encryption.
    pub fn storage_dir(&self) -> &Path {
        &self.storage_dir
    }

    /// Permanently deletes the on-disk encrypted vault file. Does not touch
    /// encryption, key derivation, or any other file in the storage
    /// directory. A no-op (not an error) if there is no vault file, so
    /// callers don't need to special-case "already gone". The caller is
    /// responsible for clearing any in-memory unlocked state.
    pub fn delete_vault_file(&self) -> Result<(), VaultError> {
        let path = self.vault_path();
        if !path.is_file() {
            return Ok(());
        }
        fs::remove_file(&path).map_err(|_| VaultError::Storage)?;
        if let Some(parent) = path.parent() {
            sync_parent_directory(parent);
        }
        Ok(())
    }

    pub fn create(&self, password: String) -> Result<UnlockedVault, VaultError> {
        if self.exists() {
            return Err(VaultError::AlreadyExists);
        }

        let kdf = new_kdf_metadata();
        let password = Zeroizing::new(password);
        let key = derive_key(password.as_str(), &decode_salt(&kdf)?)?;
        let unlocked = UnlockedVault {
            data: VaultData::empty(),
            key,
            kdf,
        };
        self.save_unlocked(&unlocked)?;
        Ok(unlocked)
    }

    pub fn unlock(&self, password: String) -> Result<UnlockedVault, VaultError> {
        let encrypted = fs::read(self.vault_path()).map_err(|_| VaultError::Missing)?;
        decrypt_vault(password, &encrypted)
    }

    pub fn save_unlocked(&self, vault: &UnlockedVault) -> Result<(), VaultError> {
        self.save_data(&vault.data, vault)
    }

    /// Persists candidate data with an already-unlocked vault's encryption material.
    /// The caller retains responsibility for updating in-memory state only after this
    /// succeeds, so an I/O failure cannot make a rejected mutation authoritative later.
    pub fn save_data(&self, data: &VaultData, unlocked: &UnlockedVault) -> Result<(), VaultError> {
        validate_vault(data)?;
        let encrypted = encrypt_vault(data, &unlocked.kdf, unlocked.key.as_ref())?;
        self.atomic_write(&encrypted)
    }

    pub fn export_backup(&self, destination: PathBuf) -> Result<(), VaultError> {
        if !self.exists() || destination == self.vault_path() || destination.exists() {
            return Err(VaultError::InvalidData);
        }
        let encrypted = fs::read(self.vault_path()).map_err(|_| VaultError::Storage)?;
        self.atomic_write_to(&destination, &encrypted)
    }

    pub fn import_backup(
        &self,
        source: PathBuf,
        password: String,
    ) -> Result<UnlockedVault, VaultError> {
        if source == self.vault_path() {
            return Err(VaultError::InvalidData);
        }
        let encrypted = fs::read(source).map_err(|_| VaultError::InvalidPasswordOrData)?;
        let unlocked = decrypt_vault(password, &encrypted)?;
        self.save_unlocked(&unlocked)?;
        Ok(unlocked)
    }

    /// Re-encrypts the entire vault under a key derived from `new_password`.
    ///
    /// `current_password` is authenticated against the on-disk vault first: a wrong
    /// current password is rejected before anything is written, and the vault file
    /// is left byte-for-byte unchanged. A fresh Argon2id salt is generated for the
    /// new key, so the two passwords never share key material. The re-encrypted
    /// envelope is verified by decrypting it again with the new password before the
    /// atomic temp-file swap replaces the original. A failure at any step
    /// (authentication, key derivation, encryption, verification, or the write)
    /// returns an error with the original vault file still intact.
    pub fn change_master_password(
        &self,
        current_password: String,
        new_password: String,
    ) -> Result<UnlockedVault, VaultError> {
        let encrypted = fs::read(self.vault_path()).map_err(|_| VaultError::Missing)?;

        // Authenticate the current master password against the stored vault. On a
        // wrong password this returns before any write and the file is untouched.
        let current = decrypt_vault(current_password, &encrypted)?;

        // Derive a brand-new key from a fresh random salt.
        let new_kdf = new_kdf_metadata();
        let new_password = Zeroizing::new(new_password);
        let new_key = derive_key(new_password.as_str(), &decode_salt(&new_kdf)?)?;

        let rekeyed = UnlockedVault {
            data: current.data,
            key: new_key,
            kdf: new_kdf,
        };

        let reencrypted = encrypt_vault(&rekeyed.data, &rekeyed.kdf, rekeyed.key.as_ref())?;

        // Verify the new envelope round-trips with the new password before the
        // original file is replaced. The transient password copy is zeroized
        // inside decrypt_vault.
        let verified = decrypt_vault(new_password.as_str().to_owned(), &reencrypted)?;
        if verified.data != rekeyed.data {
            return Err(VaultError::Storage);
        }

        // Atomic replace: temp file -> fsync -> rename -> fsync parent dir.
        self.atomic_write(&reencrypted)?;

        Ok(rekeyed)
    }

    pub fn export_sync_payload(&self) -> Result<String, VaultError> {
        let encrypted = fs::read(self.vault_path()).map_err(|_| VaultError::Missing)?;
        let _: EncryptedVaultEnvelope =
            serde_json::from_slice(&encrypted).map_err(|_| VaultError::InvalidPasswordOrData)?;
        Ok(BASE64.encode(encrypted))
    }

    pub fn import_sync_payload(
        &self,
        payload: String,
        password: String,
    ) -> Result<UnlockedVault, VaultError> {
        let encrypted = BASE64
            .decode(payload)
            .map_err(|_| VaultError::InvalidPasswordOrData)?;
        let unlocked = decrypt_vault(password, &encrypted)?;
        self.save_unlocked(&unlocked)?;
        Ok(unlocked)
    }

    /// Removes leftover `*.tmp` files from a previously interrupted atomic write.
    ///
    /// `atomic_write_to` writes to a uniquely named `.<rand>.tmp` file and then
    /// renames it over the target; its own error path deletes that temp file.
    /// Only a hard crash (power loss, kill) between the write and the rename can
    /// leave one behind. Such a file holds nothing but AEAD ciphertext — no
    /// plaintext — but it is litter. Call this once at startup.
    ///
    /// The real vault file is never touched. Returns the bare file names (not
    /// paths, not contents) of what it removed, so the caller can log them.
    /// A missing directory or an unremovable entry is ignored — this never fails.
    pub fn sweep_stale_temp_files(&self) -> Vec<String> {
        let mut removed = Vec::new();
        let Ok(entries) = fs::read_dir(&self.storage_dir) else {
            return removed;
        };
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name == VAULT_FILE_NAME || !name.ends_with(".tmp") {
                continue;
            }
            if entry.path().is_file() && fs::remove_file(entry.path()).is_ok() {
                removed.push(name.into_owned());
            }
        }
        removed
    }

    fn vault_path(&self) -> PathBuf {
        self.storage_dir.join(VAULT_FILE_NAME)
    }

    fn atomic_write(&self, contents: &[u8]) -> Result<(), VaultError> {
        let destination = self.vault_path();
        self.atomic_write_to(&destination, contents)
    }

    fn atomic_write_to(&self, destination: &Path, contents: &[u8]) -> Result<(), VaultError> {
        let parent = destination.parent().ok_or(VaultError::Storage)?;
        fs::create_dir_all(parent).map_err(|_| VaultError::Storage)?;
        let temp_path = unique_temp_path(destination);

        let result = (|| {
            let mut file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temp_path)
                .map_err(|_| VaultError::Storage)?;
            file.write_all(contents).map_err(|_| VaultError::Storage)?;
            file.sync_all().map_err(|_| VaultError::Storage)?;
            drop(file);
            fs::rename(&temp_path, destination).map_err(|_| VaultError::Storage)?;
            sync_parent_directory(parent);
            Ok(())
        })();

        if result.is_err() {
            let _ = fs::remove_file(temp_path);
        }

        result
    }
}

fn new_kdf_metadata() -> KdfMetadata {
    let mut salt = [0u8; KDF_SALT_BYTES];
    OsRng.fill_bytes(&mut salt);
    KdfMetadata {
        algorithm: "Argon2id".into(),
        version: 19,
        memory_kib: ARGON2_MEMORY_KIB,
        iterations: ARGON2_ITERATIONS,
        parallelism: ARGON2_PARALLELISM,
        salt: BASE64.encode(salt),
    }
}

fn encrypt_vault(vault: &VaultData, kdf: &KdfMetadata, key: &[u8]) -> Result<Vec<u8>, VaultError> {
    let mut nonce = [0u8; XCHACHA_NONCE_BYTES];
    OsRng.fill_bytes(&mut nonce);

    let cipher = XChaCha20Poly1305::new_from_slice(key).map_err(|_| VaultError::Storage)?;
    let plaintext = Zeroizing::new(serde_json::to_vec(vault).map_err(|_| VaultError::Storage)?);
    let ciphertext = cipher
        .encrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: plaintext.as_ref(),
                aad: VAULT_AAD,
            },
        )
        .map_err(|_| VaultError::Storage)?;

    let envelope = EncryptedVaultEnvelope {
        format_version: VAULT_FORMAT_VERSION,
        kdf: kdf.clone(),
        encryption: EncryptionMetadata {
            algorithm: "XChaCha20-Poly1305".into(),
            nonce: BASE64.encode(nonce),
        },
        ciphertext: BASE64.encode(ciphertext),
    };

    serde_json::to_vec(&envelope).map_err(|_| VaultError::Storage)
}

fn decrypt_vault(password: String, encrypted: &[u8]) -> Result<UnlockedVault, VaultError> {
    let envelope: EncryptedVaultEnvelope =
        serde_json::from_slice(encrypted).map_err(|_| VaultError::InvalidPasswordOrData)?;

    if envelope.format_version != VAULT_FORMAT_VERSION
        || envelope.kdf.algorithm != "Argon2id"
        || envelope.kdf.version != 19
        || envelope.kdf.memory_kib != ARGON2_MEMORY_KIB
        || envelope.kdf.iterations != ARGON2_ITERATIONS
        || envelope.kdf.parallelism != ARGON2_PARALLELISM
        || envelope.encryption.algorithm != "XChaCha20-Poly1305"
    {
        return Err(VaultError::InvalidPasswordOrData);
    }

    let salt = decode_salt(&envelope.kdf)?;
    let nonce = BASE64
        .decode(envelope.encryption.nonce)
        .map_err(|_| VaultError::InvalidPasswordOrData)?;
    let ciphertext = BASE64
        .decode(envelope.ciphertext)
        .map_err(|_| VaultError::InvalidPasswordOrData)?;

    if salt.len() != KDF_SALT_BYTES || nonce.len() != XCHACHA_NONCE_BYTES {
        return Err(VaultError::InvalidPasswordOrData);
    }

    let password = Zeroizing::new(password);
    let key = derive_key(password.as_str(), &salt)?;
    let cipher = XChaCha20Poly1305::new_from_slice(key.as_ref())
        .map_err(|_| VaultError::InvalidPasswordOrData)?;
    let mut plaintext = cipher
        .decrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: &ciphertext,
                aad: VAULT_AAD,
            },
        )
        .map_err(|_| VaultError::InvalidPasswordOrData)?;
    let parsed: Result<VaultData, VaultError> =
        serde_json::from_slice(&plaintext).map_err(|_| VaultError::InvalidPasswordOrData);
    plaintext.zeroize();
    let data = parsed?;
    validate_vault(&data)?;
    Ok(UnlockedVault {
        data,
        key,
        kdf: envelope.kdf,
    })
}

fn decode_salt(kdf: &KdfMetadata) -> Result<Vec<u8>, VaultError> {
    let salt = BASE64
        .decode(&kdf.salt)
        .map_err(|_| VaultError::InvalidPasswordOrData)?;
    if salt.len() != KDF_SALT_BYTES {
        return Err(VaultError::InvalidPasswordOrData);
    }
    Ok(salt)
}

fn derive_key(password: &str, salt: &[u8]) -> Result<Zeroizing<[u8; KEY_BYTES]>, VaultError> {
    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        Some(KEY_BYTES),
    )
    .map_err(|_| VaultError::Storage)?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut output = Zeroizing::new([0u8; KEY_BYTES]);
    argon2
        .hash_password_into(password.as_bytes(), salt, output.as_mut())
        .map_err(|_| VaultError::Storage)?;
    Ok(output)
}

fn unique_temp_path(destination: &Path) -> PathBuf {
    let mut random = [0u8; 16];
    OsRng.fill_bytes(&mut random);
    let file_name = format!(
        ".{}.tmp",
        BASE64.encode(random).replace(['/', '+', '='], "")
    );
    destination.with_file_name(file_name)
}

fn sync_parent_directory(directory: &Path) {
    if let Ok(file) = File::open(directory) {
        let _ = file.sync_all();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn fake_vault() -> VaultData {
        VaultData {
            accounts: vec![Account {
                id: "account-test".into(),
                service_name: "Claude".into(),
                account_name: "Claude Personal TEST".into(),
                category: "Personal".into(),
                username: "test-only".into(),
                email: "test@example.invalid".into(),
                website: "https://example.invalid".into(),
                password: "FAKE-PASSWORD-ONLY".into(),
                authentication_method: "Google SSO".into(),
                recovery_information: "recovery@example.invalid".into(),
                two_factor_information: "Authenticator TEST".into(),
                notes: "Synthetic only".into(),
                created_at: "2026-08-30T12:00:00.000Z".into(),
                updated_at: "2026-08-30T12:00:00.000Z".into(),
            }],
            relationships: Vec::new(),
            categories: vec!["Personal".into()],
            format_version: VAULT_FORMAT_VERSION,
        }
    }

    #[test]
    fn encrypts_and_unlocks_a_vault() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let vault = fake_vault();

        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = vault.clone();
        service.save_unlocked(&unlocked).unwrap();

        assert_eq!(
            service.unlock("test-master-password".into()).unwrap().data,
            vault
        );
    }

    #[test]
    fn legacy_vault_without_account_website_deserializes_with_an_empty_default() {
        let legacy_json = r#"{
            "formatVersion": 1,
            "accounts": [{
                "id": "legacy-account",
                "serviceName": "Legacy Service",
                "accountName": "Legacy TEST account",
                "category": "Personal",
                "username": "legacy-test",
                "email": "legacy@example.invalid",
                "password": "FAKE-LEGACY-PASSWORD",
                "authenticationMethod": "Password",
                "recoveryInformation": "",
                "twoFactorInformation": "",
                "notes": "Synthetic legacy payload",
                "createdAt": "2026-08-30T12:00:00.000Z",
                "updatedAt": "2026-08-30T12:00:00.000Z"
            }],
            "relationships": [],
            "categories": ["Personal"]
        }"#;

        let vault: VaultData = serde_json::from_str(legacy_json).unwrap();

        assert_eq!(vault.accounts[0].website, "");
        assert!(validate_vault(&vault).is_ok());
    }

    #[test]
    fn account_website_round_trips_through_vault_json() {
        let vault = fake_vault();

        let serialized = serde_json::to_vec(&vault).unwrap();
        let round_tripped: VaultData = serde_json::from_slice(&serialized).unwrap();

        assert_eq!(round_tripped.accounts[0].website, "https://example.invalid");
        assert_eq!(round_tripped, vault);
    }

    #[test]
    fn does_not_leave_plaintext_in_the_vault_file() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();

        let stored = fs::read(service.vault_path()).unwrap();
        let stored_text = String::from_utf8_lossy(&stored);
        assert!(!stored_text.contains("Claude Personal TEST"));
        assert!(!stored_text.contains("test@example.invalid"));
        assert!(!stored_text.contains("FAKE-PASSWORD-ONLY"));
    }

    #[test]
    fn account_debug_output_redacts_secret_fields() {
        let vault = fake_vault();
        let account = &vault.accounts[0];
        let rendered = format!("{:?}", account);

        // The three sensitive fields never appear in Debug output.
        assert!(!rendered.contains("FAKE-PASSWORD-ONLY"));
        assert!(!rendered.contains("recovery@example.invalid"));
        assert!(!rendered.contains("Authenticator TEST"));
        assert!(rendered.contains("[REDACTED]"));

        // Non-secret fields still render so the output stays useful.
        assert!(rendered.contains("account-test"));
        assert!(rendered.contains("Claude"));
        assert!(rendered.contains("test@example.invalid"));
    }

    #[test]
    fn vault_data_debug_output_redacts_account_secrets_transitively() {
        // VaultData derives Debug; it must inherit Account's redaction.
        let rendered = format!("{:?}", fake_vault());

        assert!(!rendered.contains("FAKE-PASSWORD-ONLY"));
        assert!(!rendered.contains("recovery@example.invalid"));
        assert!(!rendered.contains("Authenticator TEST"));
        assert!(rendered.contains("[REDACTED]"));
    }

    #[test]
    fn sweep_stale_temp_files_removes_leftovers_without_touching_the_vault() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let vault_bytes_before = fs::read(service.vault_path()).unwrap();

        // Plant stale temp files shaped like unique_temp_path output.
        let stale_one = directory.path().join(".AbC123stale.tmp");
        let stale_two = directory.path().join(".zzz999.tmp");
        fs::write(&stale_one, b"leftover ciphertext one").unwrap();
        fs::write(&stale_two, b"leftover ciphertext two").unwrap();
        // A non-temp sibling must be left alone.
        let sibling = directory.path().join("notes.txt");
        fs::write(&sibling, b"keep me").unwrap();

        let removed = service.sweep_stale_temp_files();

        assert_eq!(removed.len(), 2);
        assert!(removed.contains(&".AbC123stale.tmp".to_string()));
        assert!(removed.contains(&".zzz999.tmp".to_string()));
        assert!(!stale_one.exists());
        assert!(!stale_two.exists());
        assert!(sibling.exists());
        // The real vault file is byte-for-byte untouched and still unlocks.
        assert_eq!(fs::read(service.vault_path()).unwrap(), vault_bytes_before);
        assert_eq!(
            service.unlock("test-master-password".into()).unwrap().data,
            unlocked.data
        );
    }

    #[test]
    fn sweep_stale_temp_files_is_a_noop_when_the_directory_is_missing() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().join("does-not-exist"));
        assert!(service.sweep_stale_temp_files().is_empty());
    }

    #[test]
    fn rejects_a_wrong_password_and_corrupted_vault() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();

        assert!(matches!(
            service.unlock("wrong-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));

        fs::write(service.vault_path(), b"corrupted").unwrap();
        assert!(matches!(
            service.unlock("test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
    }

    #[test]
    fn persists_replacements_with_the_unlocked_key() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();

        unlocked.data.accounts[0].account_name = "Updated TEST account".into();
        service.save_unlocked(&unlocked).unwrap();

        assert_eq!(
            service.unlock("test-master-password".into()).unwrap().data,
            unlocked.data
        );
    }

    #[test]
    fn failed_candidate_save_does_not_mutate_the_unlocked_vault() {
        let directory = tempdir().unwrap();
        let storage_dir = directory.path().join("vault-storage");
        let service = VaultService::new(storage_dir.clone());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let before = unlocked.data.clone();

        let mut candidate = before.clone();
        candidate.accounts[0].account_name = "Rejected local TEST account".into();
        fs::remove_dir_all(&storage_dir).unwrap();
        fs::write(&storage_dir, b"not a vault directory").unwrap();

        assert!(matches!(
            service.save_data(&candidate, &unlocked),
            Err(VaultError::Storage)
        ));
        assert_eq!(unlocked.data, before);
    }

    #[test]
    fn rejects_dangling_and_self_referencing_relationships() {
        let mut vault = fake_vault();
        vault.relationships.push(AccountRelationship {
            id: "relationship-one".into(),
            source_account_id: "account-test".into(),
            target_account_id: "missing-account".into(),
            relationship_type: "DEPENDS_ON".into(),
            notes: String::new(),
        });
        assert!(matches!(
            validate_vault(&vault),
            Err(VaultError::InvalidData)
        ));

        vault.relationships[0].target_account_id = "account-test".into();
        assert!(matches!(
            validate_vault(&vault),
            Err(VaultError::InvalidData)
        ));
    }

    #[test]
    fn rejects_duplicate_relationships() {
        let mut vault = fake_vault();
        let mut second = vault.accounts[0].clone();
        second.id = "second-account".into();
        vault.accounts.push(second);
        let relationship = AccountRelationship {
            id: "relationship-one".into(),
            source_account_id: "account-test".into(),
            target_account_id: "second-account".into(),
            relationship_type: "DEPENDS_ON".into(),
            notes: String::new(),
        };
        vault.relationships.push(relationship.clone());
        let mut duplicate = relationship;
        duplicate.id = "relationship-two".into();
        vault.relationships.push(duplicate);
        assert!(matches!(
            validate_vault(&vault),
            Err(VaultError::InvalidData)
        ));
    }

    #[test]
    fn persists_relationships_after_reopen() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        let mut second = unlocked.data.accounts[0].clone();
        second.id = "second-account".into();
        unlocked.data.accounts.push(second);
        unlocked.data.relationships.push(AccountRelationship {
            id: "relationship-one".into(),
            source_account_id: "account-test".into(),
            target_account_id: "second-account".into(),
            relationship_type: "DEPENDS_ON".into(),
            notes: "Synthetic dependency".into(),
        });
        service.save_unlocked(&unlocked).unwrap();

        let reopened = service.unlock("test-master-password".into()).unwrap();
        assert_eq!(reopened.data.relationships, unlocked.data.relationships);
    }

    #[test]
    fn deserializes_the_renderer_relationship_field_name() {
        let relationship: AccountRelationship = serde_json::from_str(
            r#"{"id":"relationship-one","sourceAccountId":"account-a","targetAccountId":"account-b","relationshipType":"DEPENDS_ON","notes":"Synthetic dependency"}"#,
        )
        .unwrap();

        assert_eq!(relationship.relationship_type, "DEPENDS_ON");
        assert!(serde_json::from_str::<AccountRelationship>(
            r#"{"id":"relationship-one","sourceAccountId":"account-a","targetAccountId":"account-b","type":"DEPENDS_ON","notes":"Synthetic dependency"}"#,
        )
        .is_err());
    }

    #[test]
    fn exports_and_imports_an_encrypted_backup_without_plaintext() {
        let source_directory = tempdir().unwrap();
        let source = VaultService::new(source_directory.path().to_path_buf());
        let mut unlocked = source.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        source.save_unlocked(&unlocked).unwrap();
        let backup_path = source_directory.path().join("backup.aosbackup");
        source.export_backup(backup_path.clone()).unwrap();
        let backup_text = String::from_utf8_lossy(&fs::read(&backup_path).unwrap()).to_string();
        assert!(!backup_text.contains("FAKE-PASSWORD-ONLY"));

        let target_directory = tempdir().unwrap();
        let target = VaultService::new(target_directory.path().to_path_buf());
        let imported = target
            .import_backup(backup_path, "test-master-password".into())
            .unwrap();
        assert_eq!(imported.data, unlocked.data);
        assert_eq!(
            target.unlock("test-master-password".into()).unwrap().data,
            unlocked.data
        );
    }

    #[test]
    fn refuses_to_overwrite_an_existing_encrypted_backup() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let backup_path = directory.path().join("existing.aosbackup");
        let original = b"existing encrypted backup bytes";
        fs::write(&backup_path, original).unwrap();

        assert!(matches!(
            service.export_backup(backup_path.clone()),
            Err(VaultError::InvalidData)
        ));
        assert_eq!(fs::read(backup_path).unwrap(), original);
    }

    #[test]
    fn rejects_bad_backups_without_replacing_a_good_vault() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let bad_backup = directory.path().join("bad.aosbackup");
        fs::write(&bad_backup, b"not an account os backup").unwrap();

        assert!(matches!(
            service.import_backup(bad_backup, "test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        assert_eq!(
            service.unlock("test-master-password".into()).unwrap().data,
            unlocked.data
        );
    }

    #[test]
    fn rejects_a_wrong_backup_password_without_replacing_an_existing_vault() {
        let source_directory = tempdir().unwrap();
        let source = VaultService::new(source_directory.path().join("source-vault"));
        let mut source_unlocked = source.create("source-test-master-password".into()).unwrap();
        source_unlocked.data = fake_vault();
        source_unlocked.data.accounts[0].account_name = "Backup source TEST account".into();
        source.save_unlocked(&source_unlocked).unwrap();
        let backup_path = source_directory.path().join("source-backup.aosbackup");
        source.export_backup(backup_path.clone()).unwrap();

        let target_directory = tempdir().unwrap();
        let target = VaultService::new(target_directory.path().join("target-vault"));
        let mut target_unlocked = target.create("target-test-master-password".into()).unwrap();
        target_unlocked.data = fake_vault();
        target_unlocked.data.accounts[0].account_name = "Existing target TEST account".into();
        target.save_unlocked(&target_unlocked).unwrap();
        let target_bytes_before = fs::read(target.vault_path()).unwrap();

        assert!(matches!(
            target.import_backup(backup_path, "wrong-test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        assert_eq!(fs::read(target.vault_path()).unwrap(), target_bytes_before);
        assert_eq!(
            target
                .unlock("target-test-master-password".into())
                .unwrap()
                .data,
            target_unlocked.data
        );
    }

    #[test]
    fn sync_payload_is_encrypted_and_can_be_safely_imported() {
        let source_directory = tempdir().unwrap();
        let source = VaultService::new(source_directory.path().to_path_buf());
        let mut unlocked = source.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        source.save_unlocked(&unlocked).unwrap();

        let payload = source.export_sync_payload().unwrap();
        assert!(!payload.contains("FAKE-PASSWORD-ONLY"));

        let target_directory = tempdir().unwrap();
        let target = VaultService::new(target_directory.path().to_path_buf());
        let imported = target
            .import_sync_payload(payload, "test-master-password".into())
            .unwrap();
        assert_eq!(imported.data, unlocked.data);
    }

    #[test]
    fn rejects_tampered_sync_payload_without_replacing_the_local_vault() {
        let source_directory = tempdir().unwrap();
        let source = VaultService::new(source_directory.path().to_path_buf());
        let mut source_unlocked = source.create("source-test-master-password".into()).unwrap();
        source_unlocked.data = fake_vault();
        source.save_unlocked(&source_unlocked).unwrap();
        let known_good_payload = source.export_sync_payload().unwrap();

        let mut envelope: EncryptedVaultEnvelope =
            serde_json::from_slice(&BASE64.decode(&known_good_payload).unwrap()).unwrap();
        let mut ciphertext = envelope.ciphertext.into_bytes();
        ciphertext[0] = if ciphertext[0] == b'A' { b'B' } else { b'A' };
        envelope.ciphertext = String::from_utf8(ciphertext).unwrap();
        let tampered_payload = BASE64.encode(serde_json::to_vec(&envelope).unwrap());

        let target_directory = tempdir().unwrap();
        let target = VaultService::new(target_directory.path().to_path_buf());
        let mut target_unlocked = target.create("target-test-master-password".into()).unwrap();
        target_unlocked.data = fake_vault();
        target_unlocked.data.accounts[0].account_name = "Existing local TEST account".into();
        target.save_unlocked(&target_unlocked).unwrap();

        assert!(matches!(
            target.import_sync_payload(tampered_payload, "source-test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        assert_eq!(
            target
                .unlock("target-test-master-password".into())
                .unwrap()
                .data,
            target_unlocked.data
        );

        let recovered = target
            .import_sync_payload(known_good_payload, "source-test-master-password".into())
            .unwrap();
        assert_eq!(recovered.data, source_unlocked.data);
    }

    #[test]
    fn rejects_wrong_password_or_unsupported_sync_format_without_replacing_the_local_vault() {
        let source_directory = tempdir().unwrap();
        let source = VaultService::new(source_directory.path().to_path_buf());
        let mut source_unlocked = source.create("source-test-master-password".into()).unwrap();
        source_unlocked.data = fake_vault();
        source.save_unlocked(&source_unlocked).unwrap();
        let known_good_payload = source.export_sync_payload().unwrap();

        let target_directory = tempdir().unwrap();
        let target = VaultService::new(target_directory.path().to_path_buf());
        let mut target_unlocked = target.create("target-test-master-password".into()).unwrap();
        target_unlocked.data = fake_vault();
        target_unlocked.data.accounts[0].account_name = "Existing local TEST account".into();
        target.save_unlocked(&target_unlocked).unwrap();

        assert!(matches!(
            target.import_sync_payload(known_good_payload.clone(), "wrong-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        assert_eq!(
            target
                .unlock("target-test-master-password".into())
                .unwrap()
                .data,
            target_unlocked.data
        );

        let mut envelope: EncryptedVaultEnvelope =
            serde_json::from_slice(&BASE64.decode(known_good_payload).unwrap()).unwrap();
        envelope.format_version = VAULT_FORMAT_VERSION + 1;
        let unsupported_payload = BASE64.encode(serde_json::to_vec(&envelope).unwrap());
        assert!(matches!(
            target.import_sync_payload(unsupported_payload, "source-test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        assert_eq!(
            target
                .unlock("target-test-master-password".into())
                .unwrap()
                .data,
            target_unlocked.data
        );
    }

    #[test]
    fn change_master_password_round_trips_under_the_new_password() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("old-test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();

        let rekeyed = service
            .change_master_password(
                "old-test-master-password".into(),
                "new-test-master-password".into(),
            )
            .unwrap();
        assert_eq!(rekeyed.data, unlocked.data);

        // The new password unlocks; the old password no longer does.
        assert_eq!(
            service
                .unlock("new-test-master-password".into())
                .unwrap()
                .data,
            unlocked.data
        );
        assert!(matches!(
            service.unlock("old-test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));

        // A fresh salt was drawn, so the two keys never shared derivation material.
        let stored = fs::read(service.vault_path()).unwrap();
        let envelope: EncryptedVaultEnvelope = serde_json::from_slice(&stored).unwrap();
        assert_ne!(envelope.kdf.salt, unlocked.kdf.salt);
    }

    #[test]
    fn change_master_password_rejects_a_wrong_current_password_and_leaves_the_file_untouched() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("old-test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let bytes_before = fs::read(service.vault_path()).unwrap();

        assert!(matches!(
            service.change_master_password(
                "wrong-current-password".into(),
                "new-test-master-password".into(),
            ),
            Err(VaultError::InvalidPasswordOrData)
        ));

        // The vault file is byte-for-byte identical and still opens with the old password.
        assert_eq!(fs::read(service.vault_path()).unwrap(), bytes_before);
        assert_eq!(
            service
                .unlock("old-test-master-password".into())
                .unwrap()
                .data,
            unlocked.data
        );
        assert!(matches!(
            service.unlock("new-test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        // No orphaned temp files were left behind.
        assert!(!has_temp_file(directory.path()));
    }

    #[test]
    fn change_master_password_leaves_the_original_vault_intact_when_the_atomic_write_fails() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("old-test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let bytes_before = fs::read(service.vault_path()).unwrap();

        // Simulate a mid-rekey write failure: authentication, key derivation,
        // re-encryption and the verify step all succeed, then the atomic swap
        // cannot land. A read-only vault file blocks the rename-replace on
        // Windows; a read-only parent directory blocks the temp-file create on
        // Unix. Either way the write step is what fails.
        set_readonly(&service.vault_path(), true);
        set_readonly(directory.path(), true);

        let result = service.change_master_password(
            "old-test-master-password".into(),
            "new-test-master-password".into(),
        );

        // Restore permissions before asserting so a failure still cleans up.
        set_readonly(directory.path(), false);
        set_readonly(&service.vault_path(), false);

        assert!(matches!(result, Err(VaultError::Storage)));
        // The original vault file was not truncated, partially written, or replaced.
        assert_eq!(fs::read(service.vault_path()).unwrap(), bytes_before);
        assert_eq!(
            service
                .unlock("old-test-master-password".into())
                .unwrap()
                .data,
            unlocked.data
        );
        assert!(matches!(
            service.unlock("new-test-master-password".into()),
            Err(VaultError::InvalidPasswordOrData)
        ));
        assert!(!has_temp_file(directory.path()));
    }

    fn set_readonly(path: &Path, readonly: bool) {
        let mut permissions = fs::metadata(path).unwrap().permissions();
        permissions.set_readonly(readonly);
        fs::set_permissions(path, permissions).unwrap();
    }

    fn has_temp_file(directory: &Path) -> bool {
        fs::read_dir(directory).unwrap().any(|entry| {
            entry
                .unwrap()
                .file_name()
                .to_string_lossy()
                .ends_with(".tmp")
        })
    }

    #[test]
    fn rejects_authenticated_but_invalid_vault_data_on_unlock() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut vault = fake_vault();
        vault.relationships.push(AccountRelationship {
            id: "invalid-link".into(),
            source_account_id: "account-test".into(),
            target_account_id: "account-test".into(),
            relationship_type: "DEPENDS_ON".into(),
            notes: String::new(),
        });
        let kdf = new_kdf_metadata();
        let key = derive_key("test-master-password", &decode_salt(&kdf).unwrap()).unwrap();
        let encrypted = encrypt_vault(&vault, &kdf, key.as_ref()).unwrap();
        fs::create_dir_all(directory.path()).unwrap();
        fs::write(service.vault_path(), encrypted).unwrap();

        assert!(matches!(
            service.unlock("test-master-password".into()),
            Err(VaultError::InvalidData)
        ));
    }

    #[test]
    fn vault_file_size_is_none_before_creation_and_a_real_byte_count_after() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        assert_eq!(service.vault_file_size(), None);

        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();

        let size = service.vault_file_size().expect("vault file should exist");
        let on_disk = fs::metadata(service.vault_path()).unwrap().len();
        assert_eq!(size, on_disk);
        assert!(size > 0);
    }

    #[test]
    fn storage_dir_exposes_the_same_directory_the_service_was_built_with() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        assert_eq!(service.storage_dir(), directory.path());
    }

    #[test]
    fn delete_vault_file_removes_the_vault_and_leaves_siblings_alone() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        let mut unlocked = service.create("test-master-password".into()).unwrap();
        unlocked.data = fake_vault();
        service.save_unlocked(&unlocked).unwrap();
        let sibling = directory.path().join("unrelated-file.txt");
        fs::write(&sibling, b"not a vault").unwrap();

        assert!(service.exists());
        service.delete_vault_file().unwrap();
        assert!(!service.exists());
        assert!(!service.vault_path().exists());
        assert!(sibling.exists());
    }

    #[test]
    fn delete_vault_file_is_a_no_op_when_there_is_no_vault() {
        let directory = tempdir().unwrap();
        let service = VaultService::new(directory.path().to_path_buf());
        assert!(!service.exists());
        assert!(service.delete_vault_file().is_ok());
    }
}
