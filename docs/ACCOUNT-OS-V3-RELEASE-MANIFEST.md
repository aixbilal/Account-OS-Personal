# Account OS V3 Release Manifest

## Authoritative checkpoint

`bee3fd0` — `docs: 2026-09-11 walkthrough — F1/F2/F3 verified in the running app
+ rekey UI`. Code state includes the 2026-09-11 finish-out: `22fce96` (F1/F2/F3
fixes), `6acaf19` (master password change / vault rekey), `d1b789f` (Phase 3
audit hardening), `bee3fd0` (walkthrough). Supersedes the `13463d7` / `99fd15e`
checkpoint and everything older.

## Version and metadata

The application, npm package, Cargo package, and Tauri bundle are consistently
versioned `0.1.0`. No separate public V3/1.0 version has been decided; none was
invented. **Version decision required before public release.**

## Windows artifacts — rebuilt 2026-09-11 from HEAD

`npx tauri build` (which runs `npm run build` first) completed with exit 0 and
produced all three bundles. These files are **not** committed (`.gitignore`
excludes `src-tauri/target/`); the hashes below identify this build.

| Artifact | Path | Size (bytes) | SHA-256 |
| --- | --- | ---: | --- |
| EXE | `src-tauri/target/release/account-os.exe` | 9,614,848 | `99f81007dfb769c587b16575aea3047d0bef245a8a8936e283a750a346731ad8` |
| MSI | `src-tauri/target/release/bundle/msi/Account OS_0.1.0_x64_en-US.msi` | 3,301,376 | `404213bb2f3d508cf93e949c109d37c2a476c5a710df95e7e432c9a70a95cef1` |
| NSIS | `src-tauri/target/release/bundle/nsis/Account OS_0.1.0_x64-setup.exe` | 2,214,658 | `25803a3c98d566ab3f6da897b4791116eccf45cd01a7e2404282efe520f2cd48` |

x64 (`0x8664`), all three unsigned. Windows SmartScreen/reputation warnings may
occur; no signing certificate was created or simulated.

The prior 2026-09-10 artifacts (EXE `86e81f84…`, MSI `80cd3ee4…`, NSIS `f8c460a8…`)
and the 2026-09-06 artifacts before them are superseded by this build.

## Verification — 2026-09-11, at HEAD `bee3fd0`

- Frontend: **79/79** tests passed (17 files), `npm test`.
- Rust: **22/22** tests passed, `cargo test` (includes rekey round-trip, wrong-current-password rejection, simulated mid-rekey write-failure).
- Typecheck (`tsc --noEmit`): pass. Production frontend build (`npm run build`): pass (non-blocking 695.75 kB chunk-size warning — pre-existing, grew ~48 kB with the rekey UI). `npx tauri build`: pass (EXE + MSI + NSIS).
- `npm audit`: **0 vulnerabilities**. `npm audit --omit=dev`: **0 vulnerabilities**.
- `cargo audit`: run this session (network available). **0 vulnerabilities**; 7 allowed warnings — 6 "unmaintained" (`proc-macro-error`, `unic-*`) and 1 "unsound" (`glib 0.18.5` `VariantStrIter`, a GTK/Linux transitive dep not on the Windows path). None in the crypto path.
- Secret scan of `src/` and `dist/`: pass — no private keys, service-role keys, GitHub PATs, AWS keys, or JWT-shaped strings. `dist/` contains the `VITE_SUPABASE_URL` project ref and the `sb_publishable_…` key, both intentional client-side config baked by Vite; `sb_secret_` appears only as a bare guard literal in the Supabase SDK. `demo-not-a-real-password-*` placeholders live only in `src/data/devSeedVault.{json,ts}` (tree-shaken out of the production bundle).
- Renderer walkthrough against the 20-account synthetic fixture: F1/F2/F3 verified resolved in the running app; full regression clean, no JS errors — see `ACCOUNT-OS-V3-WALKTHROUGH-2026-09-11.md`.

## Manual gates (owner only)

1. Direct native visual/UX review of the built app using an isolated synthetic profile.
2. Disposable interactive installer smoke launch (EXE/MSI/NSIS).
3. Public version decision, then any merge / tag / freeze / publish.

## Previously flagged — now resolved (2026-09-11)

- **React Flow attribution** (F1): `proOptions={{ hideAttribution: true }}` reverted; the attribution link is visible and the console warning is gone.
- **Map node deselect** (F2): `onPaneClick` + an `Escape` handler clear the selection and restore every node to full opacity.
- **Add/Edit validation** (F3): `<form class="editor-form">` now has `noValidate`; the app's styled `role="alert"` error fires instead of the native bubble.
- **Change master password**: implemented — `change_master_password` in `src-tauri/src/{vault,lib}.rs` (Argon2id re-key, fresh salt, verify-before-swap, atomic write) and a card in Settings → Security.

## Left for owner decision (from the Phase 3 self-audit)

- `Account` derives `Debug` over a plaintext `password` field (no current code path prints it).
- No clipboard-clear timer (already documented as an intentional V3 omission).
- Master password crosses the webview heap as a JS string (inherent to Tauri; applies to create/unlock/import too).
- Supabase session persisted to `localStorage` (`persistSession: true`; standard, and separate from vault unlock per D020).
- Orphaned `.tmp` on a hard crash between temp-write and rename (ciphertext only; pre-existing for every save).
- Vault file mode not pinned to 0600 on Unix (Windows-first app).

No passwords, vaults, backups, or installers are committed to this repository.
Screenshots under `docs/walkthrough-2026-09-11/` are synthetic-data renderer captures.
