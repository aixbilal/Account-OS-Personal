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

The isolated native review vault has been created, but its full synthetic fixture, native walkthrough, real native screenshots/PDF, backup/restore walkthrough, and safe installer execution still require completion before release readiness can be asserted.

## Isolated RC backup/restore checkpoint — 2026-09-06

The dedicated source and restore executables were built with distinct Tauri identifiers and used only new disposable synthetic profiles. The production Rust vault service created the source vault, persisted a 10-account / 6-relationship fixture, reopened it, exported the encrypted backup, and restored it into the separate target profile. The backup at `C:\tmp\account-os-v3-final-review\aos-final-rc.aosbackup` exists (8,053 bytes; SHA-256 `0FC35172035AF329988B90F73996CB4D727ADF45737833B60009111184000592`).

The same exercise verified correct-password restore, representative known and fallback service identities, relationship preservation, wrong-password rejection without a target-file mutation, and corrupt-backup rejection without a target-file mutation. The temporary test-only harness and its process-only credentials were removed before this checkpoint; source and production-build scans found no fixture trigger, seed control, review credential, or synthetic fixture string.

The native success/error boxes are present in the production renderer and covered by the production build, but a visual unlocked-native walkthrough, focused screenshots/PDF, and disposable installer smoke test remain required for final release readiness. The 2026-09-06 `npm audit --omit=dev` request could not reach npm's audit endpoint, so its current status is environment-blocked rather than treated as a passing audit. `cargo audit` completed with 17 allowed upstream RustSec warnings.

## Native visual evidence policy

The isolated visual-review profile is `com.accountos.desktop.v3finalvisual20260906`; it contains only the approved synthetic fixture. Native screenshot automation is **ENVIRONMENT-BLOCKED**: the available Windows capture path repeatedly captured the wrong virtual-desktop/window. This is not a Vault, Map, Settings, or lock/unlock product failure. The Final Review PDF is therefore **MANUAL EVIDENCE REQUIRED**.

For direct human review, inspect: Hybrid/Dark/Light Vault; known and fallback service selection; relationship summary; Add/Edit/Search; populated Map, selected node, edges, inspector and relationship state; Appearance, Security, Data & Recovery and Connected; lock/unlock; representative 1280px layout; and green restore-success/red restore-error validation boxes.

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
| Backup export, restore, wrong-password safety | PASS (Rust regression plus isolated production-service exercise; final visual native walkthrough pending) |
| Frontend tests, Rust tests, production build | PASS |
| Windows executable, MSI, NSIS build | PASS |
| Installer smoke | FAIL - not yet executed safely in a disposable install location |
| Targeted secret scan | PASS |
| Documentation | PASS |
| Git clean | pending final commit |
| npm audit | ENVIRONMENT-BLOCKED (npm audit endpoint unavailable on 2026-09-06) |
| cargo audit | PASS with 17 allowed upstream warnings |

## Final RC handoff

Post-cleanup Windows EXE, MSI, and NSIS artifacts were rebuilt on 2026-09-06. Frontend tests (57), Rust tests (16), typecheck, production build, targeted source/dist secret scan, and fixture/review-helper scan passed. `npm audit --omit=dev` is environment-blocked because npm's audit endpoint was unavailable; it is not reported as a passing audit. A direct human visual review and a disposable installer smoke launch remain manual evidence required before broad installation.
