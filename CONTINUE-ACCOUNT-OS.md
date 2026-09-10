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
- Current generation: V3, calm-light product layer implemented; 2026-09-11 finish-out done.
- Status: **ENGINEERING COMPLETE / HUMAN VISUAL ACCEPTANCE + INSTALLER SMOKE PENDING**.
- Repository: `C:\Account OS`.
- Branch: `v3-design-intelligence`.
- Authoritative checkpoint: `bee3fd0 docs: 2026-09-11 walkthrough` (2026-09-11). Code state: `22fce96` (F1/F2/F3), `6acaf19` (master password change / vault rekey), `d1b789f` (Phase 3 audit hardening).
- This supersedes `99fd15e` / `13463d7` and everything older.
- Git state at checkpoint: clean. **Local commits `22fce96..bee3fd0` are NOT yet pushed to `origin/v3-design-intelligence`** - pushing is the owner's call.
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
- Authoritative continuation checkpoint is `bee3fd0` (code state through `d1b789f`).

## D. V3 features implemented

- Create / Unlock local vault surface with strength meter and explicit local-security language.
- Three-pane, view-first Vault: navigation, searchable/filterable account list, read-only inspector.
- Account create / view / edit / delete via a right-side sheet; search; category + authentication filters; reveal / copy; local password generator with options.
- Local-only service identity resolver (94 audited catalog entries + deterministic monogram/accent fallback). No remote favicon or logo lookups.
- Relationships: inspector summary, Manage dialog (add / edit / remove with confirmation), and the Map — all driven by one persisted relationship model.
- Dependency Map with node selection (clearable via empty-canvas click or `Escape`), focus dimming, search, fit, and Map-originated relationship creation with confirmation. The React Flow attribution is shown (xyflow restricts hiding it to a paid plan).
- Settings sections: Appearance, Security, Data & Recovery, Connected, System.
- **Change master password** (Settings -> Security): re-derives an Argon2id key from a fresh salt, re-encrypts the whole vault, verifies the new envelope, and swaps it in atomically. A wrong current password, or a failure at any step, leaves the vault file byte-for-byte intact. `change_master_password` in `src-tauri/src/{vault,lib}.rs`.
- Themes: `light`, `dark`, `system` (the in-code `ThemePreference`). Earlier docs referred to "Hybrid"/"Adaptive"; the shipped control exposes the three above.
- Encrypted backup export and validated, non-mutating restore.
- Offline-first operation; optional ciphertext-only cloud-sync foundation.
- Windows EXE / MSI / NSIS packaging (unsigned x64).

## E. Verified QA state (2026-09-11)

- Frontend: **79/79** tests passed (17 files), `npm test`.
- Rust: **22/22** tests passed, `cargo test` (adds rekey round-trip, wrong-current-password rejection, simulated mid-rekey write failure).
- Typecheck (`tsc --noEmit`): pass. Production build (`npm run build`): pass, non-blocking 695.75 kB chunk-size warning (pre-existing; +~48 kB from the rekey UI).
- `npx tauri build`: pass (exit 0) - EXE + MSI + NSIS. Hashes in `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`.
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities**.
- `cargo audit`: run this session (network available) - **0 vulnerabilities**; 7 allowed warnings (6 "unmaintained" proc-macro-error/unic-*, 1 "unsound" glib 0.18.5 - GTK/Linux transitive, not on the Windows path). None in the crypto path.
- Secret scan of `src/` and `dist/`: passed. `dist/` carries only the Supabase project URL + `sb_publishable_` key (intentional Vite client config); `sb_secret_` appears only as a bare SDK guard literal. No private keys, service-role keys, JWTs, PATs, or AWS keys.
- Phase 3 self-audit (Claude Code as sole reviewer): full adversarial pass over the crypto/vault boundary. No active vulnerability. Two small fixes applied; six items left for the owner (section I).
- Renderer walkthrough (2026-09-11): F1/F2/F3 verified resolved in the running app; regression pass over search/inspector/reveal/add sheet/settings/dark theme clean; zero console errors or warnings.

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

The installers under `src-tauri/target/release/` were rebuilt from HEAD on **2026-09-11** via `npx tauri build` (exit 0). `src-tauri/target/` is gitignored; the SHA-256 hashes that identify this build are in `docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`. All earlier builds (2026-09-10 and 2026-09-06) are superseded.

## H. Design state

Locked V3 direction: quiet confidence; premium, private, desktop-native; Hybrid signature theme with dark graphite chrome and softer work surfaces; three-pane Vault with a view-first inspector; relationships as first-class information; dark graph Map; minimal secure unlock; restrained motion. Avoid gaming/cyberpunk/neon/marketing-dashboard styling. Use `DESIGN.md` and `docs/15 - DESIGN INTELLIGENCE/` rather than restarting design research.

## I. Known limitations / deferred Final work

- Windows Hello, OS-secure key storage, and automatic updater are deferred.
- Windows production code signing is not configured.
- No independent professional security review.
- Automated native screenshot capture is environment-blocked by Windows virtual-desktop routing; direct review is required.
- Interactive installer smoke is still manual.
- Native master-password-change round-trip (successful change, wrong-current-password rejection, fresh unlock with the new password) was not click-tested in a native window this session - no desktop-automation tool exists and the web renderer cannot exercise native unlock. Covered by 3 Rust tests + 6 `SettingsScreen.test.tsx` tests; part of the owner's native acceptance pass.

### Left for owner decision (Phase 3 self-audit, 2026-09-11)

Each is a change to security architecture or behavior, so it was flagged rather than made:

- `Account` derives `Debug` over a plaintext `password` field. No current code path `{:?}`-prints an `Account`, but a future `dbg!`/`log`/panic could. Consider a redacting `Debug` impl or a `SecretString`-style newtype.
- No clipboard-clear timer on Reveal/Copy (already an intentional V3 omission per SCOPE-CLARITY / KNOWN-LIMITATIONS).
- The master password crosses the Tauri IPC as a plain, un-zeroable JS string and lingers in the webview heap (inherent to the model; applies to create/unlock/import too).
- Supabase session persisted to `localStorage` (`persistSession: true`). Standard Supabase behavior, separate from vault unlock (D020).
- A hard crash between temp-file write and `rename` leaves an orphaned `.{random}.tmp` (ciphertext only, harmless) in the vault dir. Pre-existing for every `save_vault`. Optional: sweep stale `*.tmp` on startup.
- Vault file mode is not pinned to `0600` on Unix (Windows-first app; Windows inherits the user-only AppData ACL).
- Two pre-existing `clippy::needless_borrow` warnings in `atomic_write_to` (unrelated to this work; clippy is not a gate).

## J. What remains before V3 stable

Only required human acceptance remains:

1. Direct native visual/UX review: Create/Unlock, Vault, select/reveal/copy/edit/add/search, relationships, Map, Settings, Dark/Light, Lock/Unlock, **and the new Settings -> Security "Change master password" flow: a successful change, a wrong-current-password rejection, and a fresh unlock with the new password afterward.** Classify each finding GREEN (ship), YELLOW (minor polish), or RED (release blocker).
2. Disposable interactive installer smoke: launch installer safely; confirm Create Vault renders; create disposable vault; lock, unlock, close, reopen, and unlock.
3. Review the Phase 3 "left for owner decision" list in section I and decide each.

## K. Exact next action when project resumes

**DO NOT BEGIN WITH CODING.** First verify HEAD and clean status, read this file in full, perform the direct human V3 visual acceptance test, then perform the disposable installer smoke test.

If both pass: resolve the public version decision, update metadata only if required, rerun affected checks/rebuild and re-hash artifacts if metadata changes, and only then consider a final release commit, merge/tag/freeze/publish with explicit owner authorization.

If a RED human-review defect is found: reproduce only that defect, make the smallest fix, add regression coverage where possible, rerun affected and authoritative checks, rebuild affected artifacts, and repeat only the failed human gate. Do not restart broad redesign or QA work.

## L. Things future agents must not do

Do not touch/reset the real/default private vault; delete V1/V2 history; casually reset/clean the repository; ask for real passwords; commit synthetic passwords; weaken encryption; add master-password recovery backdoors; send the master password to cloud; reintroduce fixture/bootstrap helpers or remote favicon calls; restart V3 design research; add Final-version features before V3 acceptance; or merge/tag/publish without explicit owner approval.

## M. Important files

- `docs/ACCOUNT-OS-V3-SCOPE-CLARITY.md` — feature-by-feature diff of Settings and Relationships against the approved reference frames, with each gap marked intentional (docs say do not build) or unfinished.
- `docs/ACCOUNT-OS-V3-WALKTHROUGH-2026-09-11.md` — latest renderer walkthrough: F1/F2/F3 verified resolved in the running app + rekey UI. Screenshots in `docs/walkthrough-2026-09-11/`.
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
ACCOUNT OS V3 CONTINUATION STATE  (authoritative checkpoint bee3fd0, 2026-09-11)

Workflow: Claude Code is sole implementer AND reviewer. Codex is gone.
Calm-light product layer: IMPLEMENTED across all screens
2026-09-11 finish-out: F1 (attribution) + F2 (Map deselect) + F3 (styled
  form error) resolved and verified in the running app; master password
  change implemented (Argon2id rekey, fresh salt, verify-before-swap,
  atomic write) with 3 Rust tests + 6 component tests; Phase 3 self-audit
  found no active vulnerability (6 items flagged for owner).
Automated QA: PASS (frontend 79/79, Rust 22/22, typecheck, build,
  npm audit 0, cargo audit 0 vulns / 7 allowed transitive warnings)
Known automated P0/P1/P2 bugs: NONE
Local commits 22fce96..bee3fd0 pushed to origin: NO (owner's call)
Release installers: rebuilt from HEAD 2026-09-11 (see RELEASE-MANIFEST)
Human native visual acceptance (incl. rekey flow): PENDING
Interactive installer smoke: PENDING
Public version decision / merge / tag / freeze / publish: NOT AUTHORIZED YET
Do NOT start 1.0 Final scope until the owner explicitly freezes V3.
NEXT STEP: OWNER NATIVE ACCEPTANCE + INSTALLER SMOKE + PHASE 3 DECISIONS
```
