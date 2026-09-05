# Account OS V3 Known Limitations

- The application has not received an independent professional security audit.
- Native end-to-end test tooling is not retained because of upstream development-tool dependency-security findings; native review uses isolated synthetic data.
- The final isolated native fixture, high-value screenshot PDF, backup/restore walkthrough, and disposable installer smoke test are pending before final release approval.
- `cargo audit` is environment-blocked during yanked-package verification. Its last attempt loaded the advisory database, reported 17 existing upstream Tauri/GTK warnings, then timed out on external registry status.
- The production frontend build emits a non-blocking minified JavaScript chunk-size warning (648.16 kB); no late code-splitting refactor was made during release freeze.
- Cloud sync is optional and foundational. It is not a master-password recovery mechanism and does not make local-vault use depend on connectivity.
