# Account OS — Build Plan

```text
CURRENT VERSION: V2 CONNECTED FOUNDATION
V1 STATUS: Frozen at v0.1.0; ready for cautious staged personal use.
V2 STATUS: Release hardening; one native offline relationship persistence proof remains before real-data migration.
NATIVE E2E: Deferred due to current upstream testing-tool dependency-security findings.
NEXT MAJOR VERSION: FINAL — Mature Account OS
CURRENT MILESTONE: V2 Connected Foundation release hardening
NEXT TASK: Complete the isolated native offline relationship create → lock → unlock proof, then make the V2 release decision. Re-evaluate the official @wdio/tauri-service upstream and rerun MSI bundling where the Windows Installer service is available.
ESTIMATED REMAINING HOURS: One human-native verification gate plus release decision
BLOCKERS: The V2 native offline relationship persistence gate is pending. The current official @wdio/tauri-service dependency tree also reports unresolved high-severity npm audit findings, so it is not retained in this security-sensitive repository
ENVIRONMENT NOTE: On 2026-08-31, the production executable and NSIS bundle completed again. MSI bundling reached WiX ICE validation but could not complete because the Windows Installer service was unavailable in this environment.
FROZEN CHECKPOINT: 2026-08-31 — frontend tests/build, Rust tests/check, npm audit, cargo audit, and the production NSIS bundle pass.
LAST VERIFIED BUILD: 2026-09-01 — frontend build/tests, Rust tests/check, cargo audit, npm audit, production Tauri NSIS build
```

## Current Strategy

Build sequentially:

```text
V1 Desktop
   ↓
Use/Test
   ↓
V2 Connected
   ↓
Project Freeze / University Focus
   ↓
Final Version Gradually
   ↓
Sanitize
   ↓
Public Core
```

---

# V1 — Approximately 14 Hours

## Day 1 — Foundation
- Tauri 2 + React + TypeScript
- basic navigation
- Vault / Map / Settings shell

## Day 2 — Data Model + Fake Vault
- Account model
- Relationship model
- categories
- authentication methods
- fake data only

## Day 3 — Encryption Core
- create vault
- master password
- KDF
- encryption/decryption
- wrong-password handling

## Day 4 — Account CRUD
- add
- edit
- delete
- persistence

## Day 5 — Credential UX
- reveal/hide
- copy
- password generator

## Day 6 — Search + Filters
- search
- categories
- authentication filters

## Day 7 — Relationship Engine
- create/edit/delete relationships
- dependency queries

## Day 8 — Dependency Map
- XYFlow graph
- account nodes
- relationship edges
- account details on selection

## Day 9 — Relationship Editing UX
- edit relationships from account/details/map workflow
- live graph updates

## Day 10 — Backup + Restore
- encrypted export
- encrypted import
- restore testing

## Day 11 — UX Polish
- spacing
- typography
- empty states
- dialogs
- focus states
- error handling

## Day 12 — Destruction Testing
- wrong password
- restart
- CRUD persistence
- offline mode
- backup/restore
- corrupted vault
- lock/unlock

## Day 13 — Security Review
- crypto boundary
- storage
- logs
- clipboard
- temp files
- repository exclusions
- second-agent review

## Day 14 — Release Gate
- full fake-data workflow
- desktop production build
- final checks
- begin real migration only if security gate passes

---

# V2 — Approximately 12–18 Hours

Suggested milestones:

1. Supabase project/sync foundation
2. Account OS cloud authentication
3. device model
4. encrypted payload upload/download
5. sync state
6. offline/online transitions
7. basic conflict handling
8. security-health dashboard
9. dependency/blast-radius analysis
10. history/recovery improvements
11. backup improvements
12. multi-device testing
13. security review
14. V2 release gate

---

# Final — Approximately 22–35+ Additional Hours

Suggested areas:

- Windows Hello / secure key storage
- mature device authorization
- improved sync/conflict engine
- passkey metadata
- advanced security analysis
- stronger recovery
- mobile application
- mobile biometrics
- UX refinement
- installer
- updater
- security hardening
- independent review preparation

---

# University-Compatible Schedule

Expected availability after university starts:

**3–4 focused hours/week**

Recommended:

- finish V1 first
- complete V2 in roughly 3–5 weeks depending on actual available hours
- freeze major feature development after V2
- use Account OS normally
- build Final only when workload allows

Account OS should eventually save time rather than become a permanent daily obligation.

---
