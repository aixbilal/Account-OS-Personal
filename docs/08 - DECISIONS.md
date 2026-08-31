# Account OS — Decisions

This file records important locked decisions so future development does not repeatedly reopen settled questions.

---

## D001 — Product Identity

**Decision:** Account OS is not merely a password manager.

**Core:** Vault + Identity Map + Dependency Analysis + Security Health.

---

## D002 — Three-Version Strategy

**Decision:** Account OS has three planned versions:

1. V1 Desktop
2. V2 Connected
3. Final Mature Account OS

Each version evolves the previous version.

---

## D003 — Build for Personal Use First

**Decision:** Build the personal application first, actually use it, then improve and sanitize before considering public release.

---

## D004 — Desktop Framework

**Decision:** Preferred desktop direction is **Tauri 2**.

---

## D005 — Frontend

**Decision:** React + TypeScript.

---

## D006 — Dependency Graph

**Decision:** Use `@xyflow/react` unless a concrete technical reason requires reconsideration.

---

## D007 — V1 Is Local-First

**Decision:** V1 must not require Supabase or internet to use the vault.

---

## D008 — Cloud Starts in V2

**Decision:** Supabase is introduced for encrypted synchronization, not basic V1 functionality.

---

## D009 — Cloud Does Not Receive Master Password

**Decision:** Master password remains local and must never be transmitted to Supabase.

---

## D010 — Sensitive Cloud Data Is Ciphertext

**Decision:** Sensitive vault content is encrypted locally before cloud upload.

---

## D011 — Established Cryptography Only

**Decision:** No custom crypto algorithms or protocols.

Use vetted primitives/libraries.

---

## D012 — Fake Data First

**Decision:** Development uses fake credentials until the release/security gate passes.

---

## D013 — Personal Repository Is Private

**Decision:** The real personal Account OS repository remains private initially.

---

## D014 — Public Core Later

**Decision:** After the mature version is complete, remove/sanitize personal information and extract/publish a reusable public core.

Possible conceptual split:

```text
PRIVATE:
account-os-personal

PUBLIC:
account-os-core
```

---

## D015 — Documentation Strategy

**Decision:** Keep documentation intentionally concise.

Use the locked 12-file documentation tree rather than creating 50–200 fragmented Markdown files.

Create additional files only when real project growth proves they are necessary.

---

## D016 — University Pace

**Decision:** After V1, major work should fit around university.

Expected availability: roughly 3–4 focused hours per week.

Finish V2, then freeze major feature work and build Final gradually.

---

## D017 — V1 Foundation Toolchain

**Decision:** V1 uses Tauri 2 with a React 19 + TypeScript + Vite renderer, Tailwind CSS through its official Vite plugin, and Lucide React icons.

Application dependencies are local to the repository and selected for compatibility at scaffold time. UI remains Account OS-specific rather than adopting a large component framework.

---

## D018 — V1 Local Vault Cryptography

**Decision:** The V1 vault uses Argon2id (64 MiB memory, 3 iterations, parallelism 1) to derive a 32-byte vault key from the master password and a random 16-byte salt. Vault payloads use XChaCha20-Poly1305 authenticated encryption with a fresh random 24-byte nonce for every write.

The master password is used only during create/unlock and is not retained. The derived vault key stays only in locked-process memory while the vault is unlocked, then is zeroized on lock. The versioned encrypted envelope and its KDF/encryption metadata are stored in Tauri's app-data directory; writes use an encrypted, same-directory temporary file followed by replacement. No plaintext vault or backup file is written.

---

## D019 — V1 Encrypted Backups

**Decision:** V1 backup files use the existing versioned encrypted vault envelope with the `.aosbackup` extension. Export copies encrypted bytes atomically to a user-selected new path. Import decrypts and validates the selected backup with its master password before replacing the current local vault; failures leave the existing vault unchanged. Plaintext JSON and CSV credential exports are out of scope.
