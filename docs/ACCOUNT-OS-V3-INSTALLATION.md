# Account OS V3 Installation

## Release artifacts

The 2026-09-05 release build generated:

- `src-tauri/target/release/account-os.exe`
- `src-tauri/target/release/bundle/msi/Account OS_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/Account OS_0.1.0_x64-setup.exe`

Use only a reviewed artifact whose SHA-256 is recorded in the release-candidate handoff. Do not install over an important existing Account OS installation until the installer smoke test has completed.

## First launch

1. Run the reviewed installer or executable.
2. Create an encrypted vault, or unlock an existing local vault.
3. Keep the master password private; it is not an Account OS cloud password.
4. Use encrypted backups before moving any important data.

The V3 installer was built, but a disposable end-to-end installer execution has not yet been recorded. Treat that smoke test as required before broad installation.
