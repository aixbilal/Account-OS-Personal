# Account OS V3 Known Limitations

- The application has not received an independent professional security audit.
- Native end-to-end test tooling is not retained because of upstream development-tool dependency-security findings; native review uses isolated synthetic data.
- Native visual review uses an isolated synthetic profile. Automated screenshot capture is environment-blocked because Windows capture repeatedly targets the wrong virtual-desktop/window; direct human review is required. The Final Review PDF is manual evidence required rather than a release blocker.
- A disposable installer smoke test remains manual evidence required; the installer build itself passed.
- `cargo audit` completed with 17 allowed upstream RustSec warnings.
- The production frontend build emits a non-blocking minified JavaScript chunk-size warning (648.16 kB); no late code-splitting refactor was made during release freeze.
- Cloud sync is optional and foundational. It is not a master-password recovery mechanism and does not make local-vault use depend on connectivity.
- Copied passwords are auto-cleared from the clipboard 40 seconds after the copy, but only if the clipboard still holds exactly the copied value. The timer runs in the app webview: if the application is fully quit before it elapses, the clipboard is not cleared. Clipboard history managers (e.g. Windows Win+V) may also retain an independent copy that this cannot reach.
