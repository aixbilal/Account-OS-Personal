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
- Current generation: V3, calm-light product layer implemented; the 7-phase "UI Correction & Enhancement" workstream, a follow-up "Part A fixture pass", a "UI Refinement Pass 2" (icon fidelity, typography fallback-font bug, Map/Relationships shared side-panel component, Map toolbar Layout/Filters/Export, Settings scrollspy), and a mid-pass icon-source migration to `@thesvg/icons` are all done - see `ACCOUNT-OS-V3-FIXTURE-PASS-REPORT.md`, `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md`, and `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md`.
- Status: **ENGINEERING COMPLETE / HUMAN VISUAL ACCEPTANCE + INSTALLER SMOKE PENDING**.
- Repository: `C:\Account OS`.
- Branch: `v3-design-intelligence`.
- Authoritative checkpoint: `aa1b027 feat(v3): Item 5 - Settings as one continuous page with a synced scrollspy nav` (2026-09-13). Code state since the prior `e705d98` checkpoint, in order: `1699f9c` (Pass 2 Item 2, font-family fallback fix) → `bc11d88` (Pass 2 Items 1/3/4 - icon fidelity, Map/Relationships shared panel, Map toolbar) → `3f44bcf`+`ce3c7c1` (icon-source migration to theSVG + its report) → `aa1b027`+`c064110` (Pass 2 Item 5 - Settings scrollspy + the pass's final report).
- This supersedes `e705d98` and everything older as the authoritative checkpoint. Full self-contained accounts: `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md` (7-phase workstream), `ACCOUNT-OS-V3-FIXTURE-PASS-REPORT.md` (fixture pass), `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md` (Pass 2, all 5 items), `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md` (the theSVG migration) - all at repo root.
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

## E. Verified QA state (2026-09-13, updated after UI Refinement Pass 2 + the icon migration)

- Frontend: **136/136** tests passed (23 files), `npm test` (same count as the fixture pass - Pass 2 fixed one brittle assertion rather than adding/removing coverage; see `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md`).
- Rust: **30/30** tests passed, `cargo test` (unchanged - neither Pass 2 nor the icon migration touched `src-tauri/`, no vault/crypto work per the ground rules).
- Typecheck (`tsc --noEmit`): pass. Production build (`npm run build`): pass, non-blocking chunk-size warning (pre-existing category; main chunk now 1,202.04 kB / 378.80 kB gzip - the icon-source migration to `@thesvg/icons` is the dominant contributor, +398 kB raw / +132 kB gzip on its own, measured exactly via `git stash`; see `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md` Section 8 for the full accounting and the tree-shaking verification).
- `npx tauri build`: **not rebuilt this pass** - Pass 2 and the icon migration are renderer-only changes (confirmed: `src-tauri/` untouched, Rust test count unchanged), verifiable in the dev browser without a fresh native build. The installers on disk still reflect HEAD `ea73281` (fixture pass) - see `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`. Rebuild before any native acceptance pass or release.
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities** (re-run this session; includes the two new dependencies, `html-to-image` and `@thesvg/icons`).
- `cargo audit`: re-run this session - **0 vulnerabilities**; 7 allowed warnings (6 "unmaintained" unic-*, 1 "unsound" glib 0.18.5 - GTK/Linux transitive, not on the Windows path). None in the crypto path; same set as every prior report, unchanged.
- `cargo clippy --all-targets`: clean, 0 warnings (re-run this session).
- Secret scan of `src/`, `dist/`, and `src-tauri/src/`: passed (re-run this session). `dist/` carries only the Supabase project URL + `sb_publishable_` key (intentional Vite client config). No private keys, service-role keys, JWTs, PATs, or AWS keys.
- Full renderer walkthrough at the end of the 7-phase workstream: screenshots in `docs/walkthrough-2026-09-11-phase7/{light,dark}/`, account in `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md`. Fixture pass (2026-09-12): `docs/walkthrough-2026-09-12-fixture-pass/{light,dark}/`, account in `ACCOUNT-OS-V3-FIXTURE-PASS-REPORT.md`. UI Refinement Pass 2 + icon migration (2026-09-13): `docs/walkthrough-2026-09-13-icon-migration/` and `docs/walkthrough-2026-09-13-settings-scrollspy/`, accounts in `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md` and `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md` (that report's own Section 8 also flags two surfaces - the Add/Edit service picker's dropdown preview and Ctrl+K search results - as not independently re-verified live this pass, tooling limitations rather than a known defect).

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

The installers under `src-tauri/target/release/` were rebuilt from HEAD `ea73281` on **2026-09-12** via `npx tauri build` (exit 0), after the Part A fixture pass landed. `src-tauri/target/` is gitignored; the SHA-256 hashes that identify this build are in `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`. All earlier builds (including the 7-phase workstream's own same-day build) are superseded.

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

- `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md` (repo root) — self-contained final report for UI Refinement Pass 2 (icon fidelity, the Segoe UI Variable font-family fallback bug, the Map/Relationships shared `AccountConnectionsPanel` component, Map toolbar Layout/Filters/Export, Settings scrollspy). Read this first for the most recent renderer-only work.
- `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md` (repo root) — self-contained final report for the mid-Pass-2 migration to `@thesvg/icons` as the primary icon source (96-catalog-id mapping, the exact bundle-size delta, tree-shaking verification, theme-adaptive marks).
- `docs/walkthrough-2026-09-13-icon-migration/` and `docs/walkthrough-2026-09-13-settings-scrollspy/` — screenshots for the above two reports.
- `ACCOUNT-OS-V3-FIXTURE-PASS-REPORT.md` (repo root) — self-contained final report for the Part A fixture pass that followed the 7-phase workstream (Relationships panel parity, Graph/List/Matrix toggle, Ctrl+K global search, true-color icons, per-account banner gradient, an icon/text overlap CSS bug, password-strength reconciliation, and a dark-theme vibrancy pass). Read this first for anything about that pass.
- `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md` (repo root) — self-contained final report for the 7-phase UI Correction & Enhancement workstream (tokens, icon fix, Vault/Add-Edit restyle, new Relationships screen, Map restyle, Settings Device/Danger-Zone, dark theme). Read this first for anything about that workstream; it does not depend on the plan doc it was generated from still existing.
- `docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md` — the re-extracted light palette (with sample coordinates/methodology), the dark theme's contrast-ratio documentation, and (new) the fixture pass's "Item 8 addendum" re-tuning the dark palette for vibrancy with a full before/after contrast table.
- `docs/walkthrough-2026-09-12-fixture-pass/{light,dark}/` — fixture-pass renderer walkthrough screenshots, every item's before/after or verification shot in both themes.
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
ACCOUNT OS V3 CONTINUATION STATE  (authoritative checkpoint aa1b027, 2026-09-13)

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
2026-09-12 Part A fixture pass (see ACCOUNT-OS-V3-FIXTURE-PASS-REPORT.md):
  real hands-on testing found gaps the automated pass missed. Brought the
  Relationships focused-account panel to real parity with the Vault
  inspector (Edit/overflow, Details/Security/Notes tabs, per-row
  edit/remove); added a Graph/List/Matrix view toggle; added Ctrl+K
  global search (another pre-approved, logged exception to a locked
  decision); extended true-color icon marks to Google/Gmail/Instagram/
  Chrome/Slack (Gmail was a real identity bug, not just color); fixed the
  account-hero banner to actually derive from each account's brand color
  instead of one shared wash; found and fixed a CSS specificity bug that
  overlapped icons onto field text app-wide; reconciled a direct
  contradiction with the prior report about password-strength blocking
  (confirmed live: it never blocked; replaced the checklist with a soft
  dismissible weak-password suggestion); ran a real dark-theme vibrancy
  pass (surface separation, accent saturation, banner/icon richness) with
  every contrast ratio re-verified, none regressed.
2026-09-12..13 UI Refinement Pass 2 (see
  ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md), all 5 items: fixed a
  real font-family fallback bug (the declared "Segoe UI Variable" isn't a
  real Windows family name - the whole app had been silently rendering in
  static Segoe UI, losing the fine weight hierarchy the fractional
  font-weight values throughout App.css were tuned for); fixed monogram-
  fallback icon sizing and the hero-icon's shape (now circular, matching
  the reference); extracted the Relationships screen's focused-account
  side panel into a shared AccountConnectionsPanel component now reused
  by the Map's side panel too (was a separate, poorer bare panel before);
  added a real Map toolbar (category Filters reusing the Vault's own
  pattern, a genuine second Layout algorithm alongside the existing
  organic one, and a working PNG Export - two real bugs found and fixed
  live along the way, see the report); made Settings one continuous
  scrollable page with a synced IntersectionObserver-driven nav
  (aria-current="location", keyboard focus re-verified) instead of tab-
  swapped screens.
2026-09-13 icon-source migration (see ACCOUNT-OS-V3-ICON-MIGRATION-
  REPORT.md), grew out of Pass 2 Item 1 and landed mid-pass at the
  owner's explicit request: adopted @thesvg/icons as the primary icon
  source ahead of the previously-installed simple-icons package and the
  4 hand-built local marks (Microsoft/LinkedIn/Chrome/Slack, all now
  theSVG-backed with real logos instead of CSS approximations) - 82 of 96
  catalog ids now theSVG-backed (was 65/96). Real, substantial bundle-
  size cost (+398 kB raw / +132 kB gzip), reported plainly, not hidden.
Automated QA: PASS (frontend 136/136, Rust 30/30, typecheck, build,
  npm audit 0, cargo audit 0 vulns / 7 allowed transitive warnings,
  clippy clean)
Known automated P0/P1/P2 bugs: NONE
Local commits pushed to origin: NO (owner's call)
Release installers: STALE relative to HEAD - still built from HEAD
  `ea73281` (fixture pass, 2026-09-12). Pass 2 and the icon migration are
  renderer-only (src-tauri/ untouched, confirmed by unchanged Rust test
  count) so they're fully verifiable in the dev browser without a fresh
  native build, but a native/installer rebuild is needed before any
  native acceptance pass or release to pick these changes up.
Human native visual acceptance (incl. rekey flow, the Settings System
  tab / Delete Vault / Reset App, AND everything the fixture pass AND
  Pass 2 AND the icon migration touched): PENDING
Interactive installer smoke: PENDING
Public version decision / merge / tag / freeze / publish: NOT AUTHORIZED YET
Do NOT start 1.0 Final scope until the owner explicitly freezes V3.
Do NOT start the multi-profile-vault idea raised alongside Pass 2 - it's
  gated on one unanswered owner design question (can a relationship ever
  cross profiles, or are profiles fully walled off) - see Pass 2 report
  Section 10.
NEXT STEP: OWNER READS THE PASS 2 + ICON MIGRATION REPORTS, THEN (if a
  native build is wanted) REBUILD INSTALLERS FROM aa1b027, THEN NATIVE
  ACCEPTANCE + INSTALLER SMOKE + OUTSTANDING DECISIONS
```
