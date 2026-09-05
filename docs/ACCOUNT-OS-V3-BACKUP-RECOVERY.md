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

A wrong password, corrupted file, unsupported format, or invalid vault data must leave the active vault unchanged. The Rust regression suite covers encrypted export/import, wrong-password rejection, tamper rejection, and non-mutating failed restore. On 2026-09-06, the same production vault service was exercised with separate disposable source and restore profiles: a real encrypted synthetic backup was exported, restored successfully, and then verified non-mutating after wrong-password and corrupt-backup attempts. The final visual native synthetic-backup walkthrough remains pending.

Account OS cannot recover a forgotten master password. Keep encrypted backups and their passwords safely under the user's control.
