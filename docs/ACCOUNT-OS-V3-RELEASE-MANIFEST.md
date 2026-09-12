# Account OS V3 Release Manifest

## Authoritative checkpoint

`ea73281` — `docs(v3): fixture-pass final report, walkthrough screenshots,
checkpoint update`. This is the end of the Part A fixture pass that followed
the "V3 UI Correction & Enhancement" workstream (see
`ACCOUNT-OS-V3-FIXTURE-PASS-REPORT.md` at the repo root for the
self-contained account of what changed and why).

Code state, in order: `5622fae` (Phase 1, tokens) → `c1d081e` (Phase 2,
icon fix) → `a129758` (Phase 3, inspector restyle) → `abc4fe7` (Phase 4,
Add/Edit form) → `bd6ba88` (Phase 5, new Relationships screen) →
`b3fac75` (Phase 6, Map restyle) → `6e4c624` + `af7578f` (Phase 7,
Settings/Danger Zone + dark-mode fix) → `6e0923c` + `32f18f7` (Phase 7
docs) → `b926fdb` (fixture-pass Item 7) → `e1dd78c` (fixture-pass Item 4)
→ `dac2357` (fixture-pass Items 1–3) → `e705d98` (fixture-pass Items
5/6/8) → `ea73281` (fixture-pass docs). Supersedes the `32f18f7`
checkpoint and everything older.

## Version and metadata

The application, npm package, Cargo package, and Tauri bundle are consistently
versioned `0.1.0`. No separate public V3/1.0 version has been decided; none was
invented. **Version decision required before public release.**

## Windows artifacts — rebuilt 2026-09-12 from HEAD

`npx tauri build` (which runs `npm run build` first) completed with exit 0 and
produced all three bundles. These files are **not** committed (`.gitignore`
excludes `src-tauri/target/`); the hashes below identify this build. Sizes
verified two ways (Git Bash `ls`/`sha256sum` and PowerShell `Get-Item`/
`Get-FileHash`) after Git Bash's `ls -la` initially reported an implausible
identical byte count for all three files on the space-containing `bundle/msi`
and `bundle/nsis` paths — a path-resolution quirk in that shell, not a build
or hashing problem; the hashes from both tools matched exactly, and
PowerShell's sizes are the ones recorded below.

| Artifact | Path | Size (bytes) | SHA-256 |
| --- | --- | ---: | --- |
| EXE | `src-tauri/target/release/account-os.exe` | 9,715,200 | `bbcc0dada558d9c8587536e0beed06ea5b9316293e25c127980c5a576286cdee` |
| MSI | `src-tauri/target/release/bundle/msi/Account OS_0.1.0_x64_en-US.msi` | 3,354,624 | `e7a5f81267920dbfe7a1c19c7bba237af99712961061a8b5e7faca9962184f8f` |
| NSIS | `src-tauri/target/release/bundle/nsis/Account OS_0.1.0_x64-setup.exe` | 2,256,230 | `8d771a08636c339b2b7571d54a44d2387720ccf05196d6aa2ac34e677c5ff9a8` |

x64 (`0x8664`), all three unsigned. Windows SmartScreen/reputation warnings may
occur; no signing certificate was created or simulated.

The prior 2026-09-12 artifacts (EXE `d2b52d1b…`, MSI `72b342a6…`, NSIS
`4a8a283e…`, built from the 7-phase workstream's `32f18f7` checkpoint) and
everything before them are superseded by this build.

## Verification — 2026-09-12, at HEAD `32f18f7`

- Frontend: **114/114** tests passed (21 files), `npm test`.
- Rust: **30/30** tests passed, `cargo test` (adds 4 new tests this workstream: `vault_file_size_is_none_before_creation_and_a_real_byte_count_after`, `storage_dir_exposes_the_same_directory_the_service_was_built_with`, `delete_vault_file_removes_the_vault_and_leaves_siblings_alone`, `delete_vault_file_is_a_no_op_when_there_is_no_vault`).
- Typecheck (`tsc --noEmit`): pass. Production frontend build (`npm run build`): pass (non-blocking chunk-size warning, pre-existing; now 773.63 kB / 236.85 kB gzip — grew across this workstream mainly from Phase 2's ~55 additional bundled brand icon SVGs). `npx tauri build`: pass (EXE + MSI + NSIS).
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities**.
- `cargo audit`: run this session (network available). **0 vulnerabilities**; 7 allowed warnings — 6 "unmaintained" (`unic-*`) and 1 "unsound" (`glib 0.18.5` `VariantStrIter`, a GTK/Linux transitive dep not on the Windows path). None in the crypto path. Same set as every prior report; none introduced by this workstream.
- `cargo clippy --all-targets`: clean, 0 warnings.
- Secret scan of `src/`, `dist/`, and `src-tauri/src/`: pass — no private keys, service-role keys, GitHub PATs, AWS keys, or JWT-shaped strings. `dist/` contains only the intentional `sb_publishable_…` Supabase client key. `demo-not-a-real-password-*` placeholders live only in `src/data/devSeedVault.{json,ts}` (tree-shaken out of the production bundle).
- Full renderer walkthrough against the 20-account / 15-relationship synthetic fixture, both light and dark themes, every screen this workstream touched (Vault/inspector, Add/Edit, Map, Relationships, Settings): zero console errors. Screenshots in `docs/walkthrough-2026-09-11-phase7/{light,dark}/`. See `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md` for the full account.

## Manual gates (owner only) — unchanged by this workstream

1. Direct native visual/UX review of the built app using an isolated synthetic profile — now additionally covering the Settings → System Device card, real vault-size display, Delete Vault, and Reset App, none of which could be click-tested outside the native app (see the final report's honesty notes).
2. Disposable interactive installer smoke launch (EXE/MSI/NSIS).
3. Public version decision, then any merge / tag / freeze / publish.

## Left for owner decision

Carried forward, unchanged by this workstream (still real, still not this workstream's scope):

- `Account` derives `Debug` over a plaintext `password` field — **resolved** 2026-09-11 (redacting Debug impl shipped; see the security-ledger cleanup commits before this workstream).
- No clipboard-clear timer — **resolved** 2026-09-11 (40s auto-clear shipped).
- Master password crosses the webview heap as a JS string (inherent to Tauri; applies to create/unlock/import too) — still open, investigate-only doc exists.
- Supabase session persisted to `localStorage` (`persistSession: true`; standard, and separate from vault unlock per D020) — still open.
- Vault file mode not pinned to 0600 on Unix (Windows-first app) — still open.

New from this workstream — see the final report's "left for your call" section for full reasoning:

- Category is intentionally still a plain read-only field in the inspector, not the reference's dropdown-styled box (would imply inline editing that isn't wired up).
- The Relationships screen (Phase 5) was built despite the Screen Reference Ledger's "planned only" note for dedicated screens — the master plan explicitly pre-authorized this specific exception; flagged rather than silently overridden.
- Auto-lock-by-inactivity and a real clear-clipboard *toggle* (vs. today's always-on behavior) remain out of scope, per the master plan's own Section 3.6 marking them optional.

No passwords, vaults, backups, or installers are committed to this repository.
