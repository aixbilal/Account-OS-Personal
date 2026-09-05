# Account OS V3 Backup and Recovery

Account OS exports encrypted `.aosbackup` files. It does not provide plaintext JSON or CSV credential exports.

## Export

1. Unlock the local vault.
2. Open Settings, then Data & Recovery.
3. Choose an unused destination for the encrypted backup.
4. Confirm that the new backup file exists before relying on it.

## Restore

1. Use a disposable profile when validating a backup.
2. Open Settings, then Data & Recovery, and select the encrypted backup.
3. Enter the backup's local master password.
4. Restore replaces the local vault only after decryption and validation succeed.

A wrong password, corrupted file, unsupported format, or invalid vault data must leave the active vault unchanged. The Rust regression suite covers encrypted export/import, wrong-password rejection, tamper rejection, and non-mutating failed restore. The final native synthetic-backup walkthrough remains pending.

Account OS cannot recover a forgotten master password. Keep encrypted backups and their passwords safely under the user's control.
