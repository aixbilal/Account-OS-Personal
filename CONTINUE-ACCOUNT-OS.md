# ACCOUNT OS - CONTINUE HERE

## A. Project state

- Product: Account OS - Personal Digital Identity Vault.
- Current generation: V3 Release Candidate.
- Status: **ENGINEERING COMPLETE / HUMAN ACCEPTANCE PENDING**.
- Repository: `C:\Account OS`.
- Branch: `v3-design-intelligence`.
- Authoritative checkpoint: `c3e5806 chore: complete Account OS V3 autonomous QA hardening`.
- Git state at checkpoint: clean.
- Application version: `0.1.0`.

## B. What Account OS is

Account OS is a local-first encrypted account/password vault with a first-class dependency and relationship graph. Local persistence and backups are encrypted; optional connected functionality is a ciphertext-only sync foundation. Local vault password and cloud identity are separate, and the master password is not intended to be sent to Supabase or another cloud service. No independent professional security audit has been completed.

## C. V1 / V2 / V3 history

- V1: frozen historical local-vault foundation, documented as v0.1.0; no separate authoritative commit/tag is recorded here.
- V2: connected/ciphertext sync foundation, documented as frozen/release ready; no separate release commit is asserted here.
- V3: current release candidate; authoritative continuation checkpoint is `c3e5806`.

## D. V3 features complete

- Vault and three-pane, view-first account workflow.
- Account CRUD, search/filter, reveal/copy/generate secret interactions.
- Local service identity resolver with known and deterministic fallback identities.
- Relationships and dependency Map.
- Hybrid, Dark, Light, and System themes; Settings including Security, Data & Recovery, and Connected.
- Encrypted backup/recovery and connected/device foundation where implemented.
- Windows EXE, MSI, and NSIS packaging.

## E. Verified QA state

- Frontend: 57/57 tests passed.
- Rust: 16/16 tests passed.
- Typecheck and production build: passed.
- Security: `npm audit --omit=dev` reported 0 vulnerabilities in the latest QA pass; cargo audit completed with 17 accepted upstream/transitive warnings; source/dist secret and fixture/review-helper scans passed.
- Functional coverage passed: vault lifecycle, CRUD, search/filter, secret interaction, relationships, Map, service identities, themes/settings, backup/restore, atomicity/failure handling, and offline/connected boundaries.

**ZERO KNOWN REPRODUCIBLE AUTOMATABLE P0/P1/P2 BUGS: YES**

## F. Backup/restore evidence

- Real encrypted synthetic backup export: PASS.
- Correct-password restore: PASS.
- Wrong-password rejection: PASS.
- Failed restore is non-mutating: PASS.
- Corrupt/tamper coverage: PASS.
- Relationships survived restore: PASS.
- Synthetic fixture: 10 accounts and 6 relationships.
- Test-only backup artifact, if retained: `C:\tmp\account-os-v3-final-review\aos-final-rc.aosbackup`. It must never be committed or treated as user data.

## G. Windows delivery artifacts

Version metadata is `0.1.0`; artifacts are x64 and unsigned. Windows SmartScreen/reputation warnings may occur. Code signing is not configured.

| Artifact | Path | Size | SHA-256 |
| --- | --- | ---: | --- |
| EXE | `C:\Account OS\src-tauri\target\release\account-os.exe` | 9,586,176 bytes | `97053B63378B222D5BEE578080CEB7ECEFCC6AB16BB5EE83D1C7C6E91BB7132D` |
| MSI | `C:\Account OS\src-tauri\target\release\bundle\msi\Account OS_0.1.0_x64_en-US.msi` | 3,280,896 bytes | `80DEFEFEC6D9F5ED1B8C4387A916B42BAC0CCD01178A9FD3187B9CE5025F1F66` |
| NSIS | `C:\Account OS\src-tauri\target\release\bundle\nsis\Account OS_0.1.0_x64-setup.exe` | 2,190,916 bytes | `35577F577118B931CFDD8842D3BD10ECA861784BD37264D7DD86622818C97C01` |

Release copies and checksums are under `C:\tmp\account-os-v3-release\`.

## H. Design state

Locked V3 direction: quiet confidence; premium, private, desktop-native; Hybrid signature theme with dark graphite chrome and softer work surfaces; three-pane Vault with a view-first inspector; relationships as first-class information; dark graph Map; minimal secure unlock; restrained motion. Avoid gaming/cyberpunk/neon/marketing-dashboard styling. Use `DESIGN.md` and `docs/15 - DESIGN INTELLIGENCE/` rather than restarting design research.

## I. Known limitations / deferred Final work

- Windows Hello, OS-secure key storage, and automatic updater are deferred.
- Windows production code signing is not configured.
- No independent professional security review.
- Automated native screenshot capture is environment-blocked by Windows virtual-desktop routing; direct review is required.
- Interactive installer smoke is still manual.

## J. What remains before V3 stable

Only required human acceptance remains:

1. Direct native visual/UX review: Create/Unlock, Vault, select/reveal/copy/edit/add/search, relationships, Map, Settings, Dark/Light, Lock/Unlock. Classify each finding GREEN (ship), YELLOW (minor polish), or RED (release blocker).
2. Disposable interactive installer smoke: launch installer safely; confirm Create Vault renders; create disposable vault; lock, unlock, close, reopen, and unlock.

## K. Exact next action when project resumes

**DO NOT BEGIN WITH CODING.** First verify HEAD and clean status, read this file in full, perform the direct human V3 visual acceptance test, then perform the disposable installer smoke test.

If both pass: resolve the public version decision, update metadata only if required, rerun affected checks/rebuild and re-hash artifacts if metadata changes, and only then consider a final release commit, merge/tag/freeze/publish with explicit owner authorization.

If a RED human-review defect is found: reproduce only that defect, make the smallest fix, add regression coverage where possible, rerun affected and authoritative checks, rebuild affected artifacts, and repeat only the failed human gate. Do not restart broad redesign or QA work.

## L. Things future agents must not do

Do not touch/reset the real/default private vault; delete V1/V2 history; casually reset/clean the repository; ask for real passwords; commit synthetic passwords; weaken encryption; add master-password recovery backdoors; send the master password to cloud; reintroduce fixture/bootstrap helpers or remote favicon calls; restart V3 design research; add Final-version features before V3 acceptance; or merge/tag/publish without explicit owner approval.

## M. Important files

- `README.md`
- `docs/ACCOUNT-OS-V3-RELEASE-CANDIDATE.md`
- `docs/ACCOUNT-OS-V3-INSTALLATION.md`
- `docs/ACCOUNT-OS-V3-BACKUP-RECOVERY.md`
- `docs/ACCOUNT-OS-V3-SECURITY-SUMMARY.md`
- `docs/ACCOUNT-OS-V3-KNOWN-LIMITATIONS.md`
- `docs/ACCOUNT-OS-V3-RELEASE-NOTES.md`
- `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`
- `docs/ACCOUNT-OS-V3-UX-FRICTION-AUDIT.md`
- `docs/ACCOUNT-OS-V3-AUTONOMOUS-QA-REPORT.md`
- `docs/ACCOUNT-OS-V3-FINAL-HUMAN-REVIEW.md`
- `DESIGN.md` and `docs/15 - DESIGN INTELLIGENCE/`
- `C:\tmp\account-os-v3-release\`

## N. Agent handoff summary

```text
ACCOUNT OS V3 CONTINUATION STATE

Engineering: COMPLETE
Automated QA: PASS
Known automated P0/P1/P2 bugs: NONE
Release package: READY
Human visual acceptance: PENDING
Interactive installer smoke: PENDING
Public release/tag/freeze: NOT AUTHORIZED YET
NEXT STEP: HUMAN ACCEPTANCE - NOT MORE DEVELOPMENT
```
