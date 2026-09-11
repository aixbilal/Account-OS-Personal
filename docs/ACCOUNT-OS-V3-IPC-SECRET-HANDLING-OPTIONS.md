# Account OS V3 — Master password across the IPC boundary: options

Date: 2026-09-11. Status: **investigation only — no production code was changed for this.**
Origin: Phase 3 self-audit, item 3 ("left for your call").

## The finding

Every master-password entry point routes the password from the webview to Rust
as a plain JavaScript string argument to `invoke(...)`:

| Flow | Renderer call | Rust command |
| --- | --- | --- |
| Create vault | `create_vault({ password })` | `create_vault` → `VaultService::create` |
| Unlock vault | `unlock_vault({ password })` | `unlock_vault` → `VaultService::unlock` |
| Import backup | `import_backup({ path, password })` | `import_backup` |
| Import sync payload | `import_sync_payload({ payload, password })` | `import_sync_payload` |
| Change master password | `change_master_password({ currentPassword, newPassword })` | `change_master_password` |

On the Rust side the handling is already careful: the `String` is moved into
`Zeroizing`/`Zeroizing::new` immediately, the derived key lives in
`Zeroizing<[u8; 32]>`, and decrypted plaintext is `zeroize()`d after parsing
(`src-tauri/src/vault.rs`). The transient owned copy inside `decrypt_vault` is
also zeroized.

The gap is entirely on the **JavaScript side**, before the call and just after it:

1. The `<input type="password">` value is a JS string held by the DOM.
2. The password fields are **controlled React components** (`useState`), so
   React retains at least one more string copy in component state / fiber.
3. `invoke` serializes the argument — another copy — and posts it over the
   WebView2 IPC channel.
4. JavaScript strings are immutable and cannot be zeroed. Every copy above
   lingers in the WebView2 renderer heap until garbage collection, and the
   freed pages persist until the allocator reuses them.

This is inherent to routing a secret through a webview. It is **not** a new
regression and there is no known active exploit path (the webview is a single
first-party origin, no remote code, strict CSP, no `eval`). But the master
password is the KDF input for the whole vault lifetime, so it is worth a
deliberate decision rather than silence.

### Context that bounds the severity

The same architecture already moves the **decrypted vault JSON** (all account
passwords, recovery info, 2FA notes) across this exact IPC boundary and holds it
in JS state for the entire unlocked session — that is how the inspector and
editor render. So the threat model already accepts "plaintext secrets in the
webview heap while unlocked". The master-password delta over that baseline is:
it is un-zeroable, and it exists briefly even before unlock / after lock. Real,
but incremental.

---

## What does NOT solve it (checked)

### Tauri Isolation Pattern
`app.security.pattern.use = "isolation"` injects a sandboxed iframe that
intercepts each IPC message via `window.__TAURI_ISOLATION_HOOK__`, then encrypts
it with `SubtleCrypto` before it reaches Tauri Core. This defends against a
**compromised frontend tampering with IPC calls**. It does **not** help here: the
plaintext password is still marshalled as a JS string in the main frontend and
is then *copied into the isolation iframe* to be encrypted — one more heap, not
zero. Worth adopting for its actual purpose someday; irrelevant to this finding.

### Tauri Stronghold plugin (`@tauri-apps/plugin-stronghold`)
Encrypted-at-rest secret storage (IOTA Stronghold engine). Its own API takes the
vault password as a plain JS string (`Stronghold.load(path, password)`). It
secures what is *stored*, not what *crosses IPC*. Not applicable — and Account OS
already has its own at-rest encryption (XChaCha20-Poly1305 + Argon2id).

### OS keychain / `keyring` crate
Stores a secret for later retrieval; still needs the user to type the master
password the first time, through the webview. Also explicitly out of V3 scope
(`KNOWN-LIMITATIONS`: OS keystore deferred). Does not address the typed-entry
path.

---

## Realistic approaches

### Approach A — Accept, document, and do the cheap JS-side hygiene

**What:** Keep the IPC architecture. Reduce the number of un-zeroable copies and
shorten their lifetime:

- Switch the four/five password inputs from controlled `useState` to
  **uncontrolled** (`ref`), so the DOM node holds the only JS copy and React
  fiber holds none.
- Immediately after the `invoke` promise settles, set `inputRef.value = ""` and
  drop any local variable holding the string.
- Keep `autocomplete="new-password"`, `spellcheck="false"` (already present),
  and `type="password"`.
- Record the residual (one un-zeroable string per call, cleared on GC) in
  `KNOWN-LIMITATIONS` next to the existing "webview heap" note.

**Effort:** Low — hours. Touches `VaultEntry.tsx`, `SettingsScreen.tsx`
(rekey card), the import flows; small test updates for the uncontrolled inputs.

**Risk:** Low. Uncontrolled inputs slightly complicate inline validation and the
show/hide toggle (toggle now flips the `type` attribute on the ref instead of
re-rendering). No dependency, no UX change the user would see.

**Residual exposure:** The typed string still exists in the WebView2 heap for
one IPC call and until GC. This is a *reduction*, not a fix. Honest framing:
"same class of exposure as the decrypted vault already has while unlocked".

---

### Approach B — Transfer as a zeroable byte buffer, wipe both ends

**What:** Stop sending the password as a `String`. Send bytes:

- Frontend: read the input value once, `new TextEncoder().encode(value)` → a
  `Uint8Array`, pass it via Tauri v2 raw-request IPC (a command taking
  `tauri::ipc::Request` with an `ArrayBuffer` body, or the `Channel`/raw-body
  invoke form). Then `u8arr.fill(0)` and clear the input.
- Rust: receive `Vec<u8>` / `&[u8]`, wrap in `Zeroizing`, feed Argon2 directly
  from bytes (the KDF already takes `password.as_bytes()`), never build a
  `String`.
- Combine with Approach A's uncontrolled inputs so the DOM string is the only
  remaining JS-string copy.

**Effort:** Medium — ~1–2 days. All five flows change signature; the renderer
`invoke` wrappers change; new/adjusted commands on the Rust side; tests for the
raw-body path; verify paste, the show/hide toggle, and the rekey
"confirm new password" comparison still work with buffers.

**Risk:** Medium. `Uint8Array.fill(0)` is best-effort — the JS engine may have
made an intermediate copy during `TextEncoder.encode`, and WebView2 may retain
freed pages. It removes the **un-zeroable `String`** and gives the frontend an
explicit wipe primitive, but does not remove the keystroke-level DOM buffer.
Regression surface in form UX is real but contained. No new dependency.

**Residual exposure:** The DOM `<input>`'s internal value buffer and any
transient copy inside `TextEncoder`. Meaningfully smaller than today; still not
zero.

---

### Approach C — Native (Rust-side) password prompt; password never enters the webview

**What:** Collect the master password in a surface the webview never sees:

- Windows: a Win32 credential dialog (`CredUIPromptForWindowsCredentials` via the
  `windows` crate) or a minimal native window. Cross-platform dialog crates
  (`rfd`, `native-dialog`) have **no password field**, so this is
  platform-specific code, at least for Windows first.
- The webview calls e.g. `unlock_via_native_prompt()` which returns only
  `Result<VaultData, _>`; the password bytes live only in the Rust process, in
  `Zeroizing`, and never cross IPC.
- Applies to all five flows (create needs confirm; rekey needs current + new +
  confirm — a system credential dialog cannot express that in one shot, so rekey
  likely needs a small custom native window).

**Effort:** High — multiple days. Platform-specific UI (Windows now, macOS/Linux
later), rework of every entry flow, new dependency (`windows` / a native-UI
crate), visual + accessibility review, rework of the automated tests that
currently drive the styled React password forms.

**Risk:** High. Largest surface. The current custom password UX is lost for a
system-styled prompt: no app-consistent styling, no inline strength/So-far hints,
no unified show/hide, and the rekey three-field flow does not map onto a stock
credential dialog. Platform divergence becomes a permanent maintenance cost.
Automated coverage of unlock/create/rekey would need a native-UI test strategy
this project does not have.

**Residual exposure:** Essentially eliminates the JS-string problem for the
master password. OS credential dialogs have their own well-audited memory
handling. The decrypted vault still crosses IPC afterward (unchanged, and
out of scope for this item).

---

## Recommendation (for the owner to decide — not acted on)

- **Approach A** is the right size for V3: a few hours, no dependency, no
  user-visible change, and it removes the *extra* React-state copies which are
  the easiest to eliminate. Pair it with an honest `KNOWN-LIMITATIONS` entry.
- **Approach B** is the reasonable "1.0 hardening" target if the owner wants the
  un-zeroable `String` gone — do it as a deliberate, separately-reviewed change,
  not during a release freeze.
- **Approach C** is disproportionate for a Windows-first, single-origin,
  no-remote-code app and would regress the password UX. Revisit only if a formal
  threat model later requires the password to never touch the renderer at all.

No production code was modified for this investigation.
