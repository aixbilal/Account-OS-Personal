# Account OS V3 Release Candidate

## Status

Windows desktop release candidate for final human and ChatGPT review. No tag, publication, merge, or V3 freeze has occurred.

## Verified on 2026-09-05

- Frontend tests: 57/57 pass.
- Rust tests: 16/16 pass.
- Typecheck: pass through `npm.cmd run build`.
- Lint: not configured.
- Production frontend build: pass.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Targeted application secret scan: pass; no application API keys, JWTs, service-role secrets, or AWS-style keys were found in source or `dist`.
- Windows executable, MSI, and NSIS installer: built successfully.

## Product scope

- Encrypted local vault with explicit lock/unlock.
- Account create, view, edit, search, filters, Reveal/Copy, and password generation.
- Account relationships and a dependency Map, including Map-originated relationship creation with explicit confirmation.
- Encrypted backup and restore.
- Appearance, Security, Data & Recovery, and Connected settings.
- Hybrid, Dark, Light, and System themes.
- Local-only service identity resolver with 94 audited service definitions and stable fallback identity.
- Offline-first operation and optional ciphertext-only cloud-sync foundation.

## Pending release evidence

The isolated native review vault has been created, but its full synthetic fixture, native walkthrough, real native screenshots/PDF, backup/restore walkthrough, and safe installer execution still require completion before release readiness can be asserted. `cargo audit` remains environment-blocked while checking yanked-package status; it reported 17 established upstream Tauri/GTK warnings before the external timeout.

## Build artifacts and hashes

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `account-os.exe` | 9,586,176 bytes | `BC75002C175144E13A5734A17A713FE738D6E9512BA960C2DD80EEADC4AD43E9` |
| `Account OS_0.1.0_x64_en-US.msi` | 3,280,896 bytes | `E1218FC55C505EFBECF6832C1519EACAB0A411054A24D6C580FB71551DD1E006` |
| `Account OS_0.1.0_x64-setup.exe` | 2,191,143 bytes | `266B03924FB2988A76FAB1A85D4FD9E97B6E77B2B16F94E93BC48C133A4D0D38` |

## Binary release checklist

| Gate | Status |
| --- | --- |
| Vault, unlock, lock, CRUD, search, filters, generator | PASS (automated coverage; final native walkthrough pending) |
| Relationships and Map relationship creation | PASS (automated coverage; final native walkthrough pending) |
| Settings, themes, service identity, offline/cloud boundary | PASS (automated coverage; final native walkthrough pending) |
| Backup export, restore, wrong-password safety | PASS (Rust regression coverage; final native walkthrough pending) |
| Frontend tests, Rust tests, production build | PASS |
| Windows executable, MSI, NSIS build | PASS |
| Installer smoke | FAIL - not yet executed safely in a disposable install location |
| Targeted secret scan | PASS |
| Documentation | PASS |
| Git clean | pending final commit |
| npm audit | PASS |
| cargo audit | ENVIRONMENT-BLOCKED |
