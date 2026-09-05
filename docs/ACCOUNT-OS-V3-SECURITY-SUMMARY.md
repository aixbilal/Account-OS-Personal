# Account OS V3 Security Summary

## Local vault boundary

The master password remains local. It is used for vault creation/unlock and is not sent to cloud services or retained as ordinary application data. The vault uses the established Argon2id and XChaCha20-Poly1305 implementation documented in the project decisions, with versioned metadata and encrypted atomic writes.

## Backup and cloud boundary

Backups use the encrypted vault envelope. Optional cloud synchronization is a connected foundation: sensitive vault content is encrypted locally and cloud storage receives ciphertext, revision, and device metadata only. Cloud identity is distinct from local vault unlock.

## UI and identity privacy

Passwords are hidden by default and Reveal/Copy require explicit action. Service identity resolution is local-only: 94 audited local service definitions and a stable monogram fallback are used; runtime favicon or other third-party identity requests are not used.

## Verification status

The frontend and Rust suites pass, including wrong-password, tamper, encrypted-backup, relationship-persistence, sync-payload, and atomic-write regressions. The isolated synthetic RC exercise also completed a real encrypted export, correct-password restore, wrong-password rejection, relationship restore, and non-mutating failed restore. The production targeted secret scan passed for application keys/tokens. This is not an independent security audit. Windows Hello, OS-secure key storage, and an updater remain deferred.
