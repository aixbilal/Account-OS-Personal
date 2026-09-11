# ACCOUNT OS - CONTINUE HERE

## 0. Workflow (permanent - read before assuming a two-agent split)

**Codex is no longer part of this project.** Claude Code is the sole coding
agent going forward - implementer **and** reviewer, permanently. There is no
second agent to catch mistakes, so: prefer flagging a decision over guessing,
and prefer a small proven fix over a clever one. Any earlier note in this repo
that describes a "Claude implements / Codex reviews" (or vice-versa) split is
obsolete. The commit `bd94eb8` ("1.0 Final work") was a Codex artifact left on
this branch before that change and is not part of the V3 finish-out.

## A. Project state

- Product: Account OS - Personal Digital Identity Vault.
- Current generation: V3, calm-light product layer implemented; the 7-phase "UI Correction & Enhancement" workstream (design-token re-extraction, icon fix, Vault/Add-Edit restyle, new Relationships screen, Map restyle, Settings Device/Danger-Zone + dark-theme regression) is done.
- Status: **ENGINEERING COMPLETE / HUMAN VISUAL ACCEPTANCE + INSTALLER SMOKE PENDING**.
- Repository: `C:\Account OS`.
- Branch: `v3-design-intelligence`.
- Authoritative checkpoint: `32f18f7 docs(v3): Phase 7 dark-theme final-regression addendum` (2026-09-12). Code state, in order: `5622fae` (Phase 1 tokens) → `c1d081e` (Phase 2 icon fix) → `a129758` (Phase 3 inspector) → `abc4fe7` (Phase 4 Add/Edit) → `bd6ba88` (Phase 5 Relationships) → `b3fac75` (Phase 6 Map) → `6e4c624`+`af7578f` (Phase 7 Settings/dark-mode fix) → `6e0923c`+`32f18f7` (Phase 7 docs).
- This supersedes `bee3fd0` and everything older. Full self-contained account of this workstream: `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md` (repo root).
- Git state at checkpoint: clean. **Local commits are NOT yet pushed to `origin/v3-design-intelligence`** - pushing is the owner's call.
- Application version: `0.1.0`.

## B. What Account OS is

Account OS is a local-first encrypted account/password vault with a first-class dependency and relationship graph. Local persistence and backups are encrypted; optional connected functionality is a ciphertext-only sync foundation. Local vault password and cloud identity are separate, and the master password is not intended to be sent to Supabase or another cloud service. No independent professional security audit has been completed.

## C. V1 / V2 / V3 history

- V1: local encrypted vault foundation (v0.1.0). No separate authoritative commit/tag is recorded here.
- V2: connected / ciphertext-only sync foundation. Frozen on `main` at `540098a chore: freeze V2 connected foundation release`.
- V3: branched from `main` as `v3-design-intelligence`. Progression:
  - `e4128b4`..`072ec17` — design intelligence system and locked V3 design direction.
  - `c8271cb`..`aae05ba` — first V3 vault, inspector, service-identity implementation and R2 corrections.
  - `a98a9ea`..`c3e5806` — release-candidate packaging and autonomous QA hardening (57 frontend / 16 Rust era).
  - `03c14e6`..`2d9b12c` — the "overnight" calm-light redesign: rebuilt Create/Unlock, three-pane Vault, right-side Add/Edit sheet, Settings, dialogs, and theme system toward the approved reference frames in `docs/15 - DESIGN INTELLIGENCE/V3 FINAL UI REFERENCES/`.
  - `99fd15e` — identity Map rebuilt as an in-house deterministic phyllotaxis dependency graph; `@dagrejs/dagre` dependency removed.
  - `22fce96`..`bee3fd0` — 2026-09-11 finish-out: F1/F2/F3 fixes, master password change (vault rekey), Phase 3 self-audit hardening, walkthrough.
  - `9cd8c6a`..`0741973` — 2026-09-11 security-ledger cleanup: redacted `Debug`, clipboard auto-clear, stale `.tmp` sweep, clippy fixes, IPC investigate-only doc, walkthrough.
  - `5622fae`..`32f18f7` — the 7-phase "UI Correction & Enhancement" workstream: design-token re-extraction (1), icon-matching bug fix (2), Vault/inspector restyle (3), Add/Edit form flattening + password strength + 2FA split (4), new Relationships screen (5), Map restyle (6), Settings Device/Danger-Zone + dark-theme final regression (7).
- Authoritative continuation checkpoint is `32f18f7`.

## D. V3 features implemented

- Create / Unlock local vault surface with strength meter and explicit local-security language.
- Three-pane, view-first Vault: navigation, searchable/filterable account list, read-only inspector with a real-logo banner watermark, an un-boxed continuous field panel, and an overflow ("•••") menu (Delete account).
- Account create / view / edit / delete via a right-side sheet; flattened layout with field captions; search; category + authentication filters; reveal / copy; local password generator with options; a live password-strength checklist (12 chars/upper/lower/numbers/symbols, informational only); a 2FA type dropdown + free-text detail (still one `twoFactorInformation` string on disk, split/combined in the UI layer only).
- Local-only service identity resolver (94 audited catalog entries; ~65 get a real bundled brand icon via `domain/iconRegistry.ts`, the rest a two-tone monogram fallback). No remote favicon or logo lookups.
- Relationships: inspector summary, Manage dialog (add / edit / remove with confirmation), the Map, **and a dedicated Relationships screen** (stat cards + a pick-one-account radial "ego graph" of its direct connections + a connected-accounts panel) — all driven by one persisted relationship model.
- Dependency Map with node selection (clearable via empty-canvas click or `Escape`), focus dimming, search, fit, category color-hint dots + legend, and Map-originated relationship creation with confirmation. The React Flow attribution is shown (xyflow restricts hiding it to a paid plan).
- Settings sections: Appearance, Security, Data & Recovery, Connected, System (now including a real Device card, a real vault-file-size display, and a Danger Zone with Reset App and Delete Vault, each behind a confirmation dialog).
- **Change master password** (Settings -> Security): re-derives an Argon2id key from a fresh salt, re-encrypts the whole vault, verifies the new envelope, and swaps it in atomically. A wrong current password, or a failure at any step, leaves the vault file byte-for-byte intact. `change_master_password` in `src-tauri/src/{vault,lib}.rs`.
- **Delete Vault** (Settings -> System): removes the on-disk vault file only (`delete_vault_file` reuses existing file-removal/dir-sync patterns, never new crypto); returns to the Create Vault screen.
- Themes: `light`, `dark`, `system` (the in-code `ThemePreference`). Dark is newly designed (no dark reference exists), re-tuned in Phase 1 to match the re-extracted light primary/success hues; documented contrast ratios in `docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md`.
- Encrypted backup export and validated, non-mutating restore.
- Offline-first operation; optional ciphertext-only cloud-sync foundation.
- Windows EXE / MSI / NSIS packaging (unsigned x64).

## E. Verified QA state (2026-09-12)

- Frontend: **114/114** tests passed (21 files), `npm test`.
- Rust: **30/30** tests passed, `cargo test` (adds 4 tests this workstream for `vault_file_size`/`storage_dir`/`delete_vault_file`).
- Typecheck (`tsc --noEmit`): pass. Production build (`npm run build`): pass, non-blocking 773.63 kB chunk-size warning (pre-existing category; grew mainly from Phase 2's ~55 additional bundled brand icon SVGs).
- `npx tauri build`: pass (exit 0) - EXE + MSI + NSIS. Hashes in `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`.
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities**.
- `cargo audit`: run this session (network available) - **0 vulnerabilities**; 7 allowed warnings (6 "unmaintained" unic-*, 1 "unsound" glib 0.18.5 - GTK/Linux transitive, not on the Windows path). None in the crypto path; same set as every prior report.
- `cargo clippy --all-targets`: clean, 0 warnings.
- Secret scan of `src/`, `dist/`, and `src-tauri/src/`: passed. `dist/` carries only the Supabase project URL + `sb_publishable_` key (intentional Vite client config). No private keys, service-role keys, JWTs, PATs, or AWS keys.
- Full renderer walkthrough (2026-09-12) at the end of the 7-phase workstream: every touched screen, light and dark, zero console errors. Screenshots in `docs/walkthrough-2026-09-11-phase7/{light,dark}/`. Full account in `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md`.

**ZERO KNOWN REPRODUCIBLE AUTOMATABLE P0/P1/P2 BUGS: YES.**

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

The installers under `src-tauri/target/release/` were rebuilt from HEAD on **2026-09-12** via `npx tauri build` (exit 0). `src-tauri/target/` is gitignored; the SHA-256 hashes that identify this build are in `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`. All earlier builds (2026-09-11 and before) are superseded.

## H. Design state

Locked V3 direction: quiet confidence; premium, private, desktop-native; Hybrid signature theme with dark graphite chrome and softer work surfaces; three-pane Vault with a view-first inspector; relationships as first-class information; dark graph Map; minimal secure unlock; restrained motion. Avoid gaming/cyberpunk/neon/marketing-dashboard styling. Use `DESIGN.md` and `docs/15 - DESIGN INTELLIGENCE/` rather than restarting design research.

## I. Known limitations / deferred Final work

- Windows Hello, OS-secure key storage, and automatic updater are deferred.
- Windows production code signing is not configured.
- No independent professional security review.
- Automated native screenshot capture is environment-blocked by Windows virtual-desktop routing; direct review is required.
- Interactive installer smoke is still manual.
- Native master-password-change round-trip (successful change, wrong-current-password rejection, fresh unlock with the new password) was not click-tested in a native window this session - no desktop-automation tool exists and the web renderer cannot exercise native unlock. Covered by 3 Rust tests + 6 `SettingsScreen.test.tsx` tests; part of the owner's native acceptance pass.
- Native Delete Vault / Reset App round-trip and the Device card's real values (hostname/OS/app-data path/Open folder) were not click-tested in a native window either, same reason. Covered by 4 new `vault.rs` tests + 6 new `SettingsScreen.test.tsx` tests; part of the owner's native acceptance pass.

### Left for owner decision (Phase 3 self-audit, 2026-09-11)

Each is a change to security architecture or behavior, so it was flagged rather than made:

- ~~`Account` derives `Debug` over a plaintext `password` field~~ — **resolved 2026-09-11**: redacting `Debug` impl shipped (security-ledger cleanup, before this UI workstream).
- ~~No clipboard-clear timer on Reveal/Copy~~ — **resolved 2026-09-11**: 40s auto-clear shipped (`src/domain/clipboard.ts`), now used by both the inspector and the Add/Edit editor's password Copy.
- The master password crosses the Tauri IPC as a plain, un-zeroable JS string and lingers in the webview heap (inherent to the model; applies to create/unlock/import too). Investigate-only options doc exists (`docs/…IPC…master-password…`); no change made.
- Supabase session persisted to `localStorage` (`persistSession: true`). Standard Supabase behavior, separate from vault unlock (D020).
- ~~A hard crash between temp-file write and `rename` leaves an orphaned `.{random}.tmp`~~ — **resolved 2026-09-11**: stale `*.tmp` files are swept on startup.
- Vault file mode is not pinned to `0600` on Unix (Windows-first app; Windows inherits the user-only AppData ACL).
- ~~Two pre-existing `clippy::needless_borrow` warnings in `atomic_write_to`~~ — **resolved 2026-09-11**; `cargo clippy --all-targets` is clean as of this workstream's final gate run too.

## J. What remains before V3 stable

Only required human acceptance remains:

1. Direct native visual/UX review: Create/Unlock, Vault, select/reveal/copy/edit/add/search, relationships (inspector, Manage dialog, Map, **and the new dedicated Relationships screen**), Map, Settings (**including the new System tab's Device card, real vault size, Delete Vault, and Reset App**), Dark/Light, Lock/Unlock, and the Settings -> Security "Change master password" flow: a successful change, a wrong-current-password rejection, and a fresh unlock with the new password afterward. Classify each finding GREEN (ship), YELLOW (minor polish), or RED (release blocker).
2. Disposable interactive installer smoke: launch installer safely; confirm Create Vault renders; create disposable vault; lock, unlock, close, reopen, and unlock.
3. Review the "left for owner decision" list in `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md` and decide each.
4. Read `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md` (repo root) for the full account of the 7-phase UI workstream, including the one item flagged as a deliberate exception to a previously locked decision (the new Relationships screen).

## K. Exact next action when project resumes

**DO NOT BEGIN WITH CODING.** First verify HEAD and clean status, read this file in full, perform the direct human V3 visual acceptance test, then perform the disposable installer smoke test.

If both pass: resolve the public version decision, update metadata only if required, rerun affected checks/rebuild and re-hash artifacts if metadata changes, and only then consider a final release commit, merge/tag/freeze/publish with explicit owner authorization.

If a RED human-review defect is found: reproduce only that defect, make the smallest fix, add regression coverage where possible, rerun affected and authoritative checks, rebuild affected artifacts, and repeat only the failed human gate. Do not restart broad redesign or QA work.

## L. Things future agents must not do

Do not touch/reset the real/default private vault; delete V1/V2 history; casually reset/clean the repository; ask for real passwords; commit synthetic passwords; weaken encryption; add master-password recovery backdoors; send the master password to cloud; reintroduce fixture/bootstrap helpers or remote favicon calls; restart V3 design research; add Final-version features before V3 acceptance; or merge/tag/publish without explicit owner approval.

## M. Important files

- `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md` (repo root) — self-contained final report for the 7-phase UI Correction & Enhancement workstream (tokens, icon fix, Vault/Add-Edit restyle, new Relationships screen, Map restyle, Settings Device/Danger-Zone, dark theme). Read this first for anything about that workstream; it does not depend on the plan doc it was generated from still existing.
- `docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md` — the re-extracted light palette (with sample coordinates/methodology) and the dark theme's contrast-ratio documentation.
- `docs/ACCOUNT-OS-V3-SCOPE-CLARITY.md` — feature-by-feature diff of Settings and Relationships against the approved reference frames, with each gap marked intentional (docs say do not build) or unfinished. **Partly superseded** by the UI correction report: the Relationships screen this doc calls "not in the locked architecture" was subsequently built under an explicit, scoped exception — see the report.
- `docs/walkthrough-2026-09-11-phase7/{light,dark}/` — latest renderer walkthrough screenshots (end of the UI correction workstream), every touched screen in both themes.
- `docs/ACCOUNT-OS-V3-WALKTHROUGH-2026-09-11-LEDGER-CLEANUP.md` — walkthrough for the security-ledger cleanup that immediately preceded the UI workstream (Debug redaction, clipboard auto-clear, stale-tmp sweep).
- `docs/ACCOUNT-OS-V3-WALKTHROUGH-2026-09-11.md` — prior renderer walkthrough: F1/F2/F3 verified resolved in the running app + rekey UI. Screenshots in `docs/walkthrough-2026-09-11/`.
- `docs/ACCOUNT-OS-V3-WALKTHROUGH-2026-09-10.md` — prior autonomous renderer walkthrough log (the one that raised F1/F2/F3).
- `scripts/dev-seed-vault.mjs` — dev-only test fixture generator (never touches the real vault; see its header).
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
ACCOUNT OS V3 CONTINUATION STATE  (authoritative checkpoint 32f18f7, 2026-09-12)

Workflow: Claude Code is sole implementer AND reviewer. Codex is gone.
Calm-light product layer: IMPLEMENTED across all screens
2026-09-11 finish-out + ledger cleanup: F1/F2/F3, master password change,
  Debug redaction, clipboard auto-clear, stale-tmp sweep - all resolved
  and verified.
2026-09-11..12 UI Correction & Enhancement workstream (7 phases, see
  ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md): re-extracted light design
  tokens; fixed the real-icon matching bug (PayPal etc.); restyled Vault/
  inspector and Add/Edit; shipped a new dedicated Relationships screen
  (pre-approved exception to a previously locked "planned only" note -
  flagged, not silently overridden); restyled the Map; added Settings ->
  System Device card + real vault size + Delete Vault + Reset App; ran a
  full dark-theme final regression (found and fixed one dark-mode CSS bug
  on the new Relationships screen).
Automated QA: PASS (frontend 114/114, Rust 30/30, typecheck, build,
  npm audit 0, cargo audit 0 vulns / 7 allowed transitive warnings,
  clippy clean)
Known automated P0/P1/P2 bugs: NONE
Local commits pushed to origin: NO (owner's call)
Release installers: rebuilt from HEAD 2026-09-12 (see RELEASE-MANIFEST)
Human native visual acceptance (incl. rekey flow AND the new Settings
  System tab / Delete Vault / Reset App): PENDING
Interactive installer smoke: PENDING
Public version decision / merge / tag / freeze / publish: NOT AUTHORIZED YET
Do NOT start 1.0 Final scope until the owner explicitly freezes V3.
NEXT STEP: OWNER READS THE UI CORRECTION REPORT, THEN NATIVE ACCEPTANCE +
  INSTALLER SMOKE + OUTSTANDING DECISIONS
```
