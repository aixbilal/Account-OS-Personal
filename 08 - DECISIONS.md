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
