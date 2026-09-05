# Account OS V3 Release Manifest

## RC checkpoint

`0e1ba2d` - `chore: prepare Account OS V3 release candidate`

## Version and metadata

The application, npm package, Cargo package, and Tauri bundle are consistently versioned `0.1.0`. Repository documents do not define a separate public V3 version decision; no version was invented. **Version decision required before public release.**

## Windows artifacts

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `account-os.exe` | 9,586,176 bytes | `97053B63378B222D5BEE578080CEB7ECEFCC6AB16BB5EE83D1C7C6E91BB7132D` |
| `Account OS_0.1.0_x64_en-US.msi` | 3,280,896 bytes | `80DEFEFEC6D9F5ED1B8C4387A916B42BAC0CCD01178A9FD3187B9CE5025F1F66` |
| `Account OS_0.1.0_x64-setup.exe` | 2,190,916 bytes | `35577F577118B931CFDD8842D3BD10ECA861784BD37264D7DD86622818C97C01` |

The executable is x64 (`0x8664`) and all three artifacts are unsigned. Windows SmartScreen/reputation warnings may occur; no signing certificate was created or simulated.

## Verification

- Synthetic persistence: 10 accounts and 6 relationships.
- Backup: encrypted export, correct restore, wrong-password rejection, corrupt-backup rejection, and non-mutating failed restore passed.
- Frontend: 57 tests passed. Rust: 16 tests passed. Typecheck and production build passed.
- Targeted secret/artifact and fixture/review-helper scans passed.
- `cargo audit` completed with 17 allowed upstream warnings. `npm audit --omit=dev` is environment-blocked because the npm audit endpoint was unavailable.
- MSI administrative extraction passed and exposed `PFiles\Account OS\account-os.exe`. NSIS structural extraction tooling was unavailable; its built artifact and checksum were verified.

## Manual gates

1. Direct native visual review of the isolated synthetic profile.
2. Disposable interactive installer smoke launch.

No passwords, vaults, backups, screenshots, or installers are committed to this repository.
