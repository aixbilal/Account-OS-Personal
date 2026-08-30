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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub service_name: String,
    pub account_name: String,
    pub category: String,
    pub username: String,
    pub email: String,
    pub password: String,
    pub authentication_method: String,
    pub recovery_information: String,
    pub two_factor_information: String,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
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
        validate_vault(&vault.data)?;
        let encrypted = encrypt_vault(&vault.data, &vault.kdf, vault.key.as_ref())?;
        self.atomic_write(&encrypted)
    }

    fn vault_path(&self) -> PathBuf {
        self.storage_dir.join(VAULT_FILE_NAME)
    }

    fn atomic_write(&self, contents: &[u8]) -> Result<(), VaultError> {
        fs::create_dir_all(&self.storage_dir).map_err(|_| VaultError::Storage)?;
        let destination = self.vault_path();
        let temp_path = unique_temp_path(&destination);

        let result = (|| {
            let mut file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temp_path)
                .map_err(|_| VaultError::Storage)?;
            file.write_all(contents).map_err(|_| VaultError::Storage)?;
            file.sync_all().map_err(|_| VaultError::Storage)?;
            drop(file);
            fs::rename(&temp_path, &destination).map_err(|_| VaultError::Storage)?;
            sync_parent_directory(&self.storage_dir);
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
    let parsed = serde_json::from_slice(&plaintext).map_err(|_| VaultError::InvalidPasswordOrData);
    plaintext.zeroize();
    parsed.map(|data| UnlockedVault {
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
}
