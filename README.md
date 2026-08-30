# Account OS

Account OS is a local-first encrypted desktop vault for understanding accounts, authentication identities, recovery paths, and dependencies.

The project is currently building **V1 Desktop** with Tauri 2, React, TypeScript, and Rust. Development uses synthetic credentials only.

Start with [`docs/00 - START HERE.md`](docs/00%20-%20START%20HERE.md) and follow `AGENTS.md` before making changes.

## Development

```powershell
npm.cmd install
npm.cmd run tauri dev
```

Frontend-only check:

```powershell
npm.cmd run build
```

Never commit real vault data, backups, credentials, or secrets.
