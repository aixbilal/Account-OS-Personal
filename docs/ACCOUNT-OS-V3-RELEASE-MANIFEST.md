# Account OS V3 Release Manifest

## Authoritative checkpoint

`13463d7` — `docs: add 2026-09-10 autonomous renderer walkthrough + screenshots`
(code state is `99fd15e`; `298cd2a`/`bd94eb8`/`13463d7` add docs, the dev seed
fixture, and walkthrough evidence). Supersedes the `0e1ba2d` RC checkpoint and
the `c3e5806` checkpoint that older docs named.

## Version and metadata

The application, npm package, Cargo package, and Tauri bundle are consistently
versioned `0.1.0`. No separate public V3/1.0 version has been decided; none was
invented. **Version decision required before public release.**

## Windows artifacts — rebuilt 2026-09-10 from HEAD

`npx tauri build` (which runs `npm run build` first) completed with exit 0 and
produced all three bundles. These files are **not** committed (`.gitignore`
excludes `src-tauri/target/`); the hashes below identify this build.

| Artifact | Path | Size (bytes) | SHA-256 |
| --- | --- | ---: | --- |
| EXE | `src-tauri/target/release/account-os.exe` | 9,606,144 | `86e81f842f27983db16ba5a7810fcb6f21fd1e38b4cd2d144529abfc60a10225` |
| MSI | `src-tauri/target/release/bundle/msi/Account OS_0.1.0_x64_en-US.msi` | 3,297,280 | `80cd3ee43903180972bbc2a15e8ebe8e840c0ec5f584f8979e79dba77ea42c0b` |
| NSIS | `src-tauri/target/release/bundle/nsis/Account OS_0.1.0_x64-setup.exe` | 2,207,070 | `f8c460a8cf225c67d60433aead2e6b54e30569cab0cfaf56c14712173016c832` |

x64 (`0x8664`), all three unsigned. Windows SmartScreen/reputation warnings may
occur; no signing certificate was created or simulated.

The prior 2026-09-06 artifacts (EXE `97053B63…`, MSI `80DEFEFE…`, NSIS `35577F57…`)
predate the entire calm-light UI redesign and the Map rebuild and are superseded.

## Verification — 2026-09-10, at HEAD `13463d7`

- Frontend: **72/72** tests passed (16 files), `npm test`.
- Rust: **19/19** tests passed, `cargo test`.
- Typecheck (`tsc --noEmit`): pass. Production frontend build (`npm run build`): pass. `npx tauri build`: pass (EXE + MSI + NSIS).
- `npm audit`: **0 vulnerabilities**. `npm audit --omit=dev`: **0 vulnerabilities**.
- `cargo audit`: not run this session (needs network); last known baseline is 17 accepted upstream/transitive RustSec warnings.
- Secret scan of `src/` and `dist/`: pass — no private keys, live API keys, GitHub PATs, AWS keys, or JWT-shaped strings. The only credential-like strings are `demo-not-a-real-password-*` placeholders in `src/data/devSeedVault.{json,ts}` (the dev fixture), which is tree-shaken out of the production bundle.
- Renderer walkthrough against the 20-account synthetic fixture: full flow works with no JS errors — see `ACCOUNT-OS-V3-WALKTHROUGH-2026-09-10.md`.

## Manual gates (owner only)

1. Direct native visual/UX review of the built app using an isolated synthetic profile.
2. Disposable interactive installer smoke launch (EXE/MSI/NSIS).
3. Public version decision, then any merge / tag / freeze / publish.

## Open decisions flagged in this session

- **React Flow attribution**: `DependencyMap.tsx` currently hides it (`proOptions`), which emits a console warning and is outside xyflow's free tier. Keep or revert — see `ACCOUNT-OS-V3-WALKTHROUGH-2026-09-10.md` F1.
- **Map node deselect**: no way to clear a Map node selection — see F2.
- **Add/Edit validation**: required-field feedback is the browser's native bubble, not the styled error — see F3.
- **Settings**: no "change master password" capability exists anywhere in the app; not on the deferred list — see `ACCOUNT-OS-V3-SCOPE-CLARITY.md`.

No passwords, vaults, backups, or installers are committed to this repository.
Screenshots under `docs/walkthrough-2026-09-10/` are synthetic-data renderer captures.
