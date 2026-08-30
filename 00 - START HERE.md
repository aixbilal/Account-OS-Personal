# Account OS — Start Here

## What Account OS Is

Account OS is a **local-first encrypted digital identity vault** that combines:

- a secure credential/account vault
- a visual account relationship map
- dependency/blast-radius analysis
- security-health awareness

The defining idea is:

> **See my entire digital account ecosystem, not just a list of passwords.**

It is designed first as a personal desktop application, then evolves into a connected multi-device system, and finally into a mature reusable product core that can be sanitized and published for other developers.

---

## Why It Exists

The problem is larger than remembering passwords.

Account OS should make it easy to understand:

- which email owns each service
- which services use Google SSO, GitHub OAuth, password, passkey, Meta, Microsoft, Apple, etc.
- which accounts depend on another account
- which account acts as a recovery identity
- how Facebook/Instagram or similar identities are linked
- which accounts are critical digital hubs
- what breaks if one important identity is lost
- where 2FA, recovery details, backup codes, and sensitive metadata belong

---

## Product Formula

**Vault + Identity Map + Dependency Analysis + Security Health**

---

## Version Strategy

Account OS has exactly three planned versions:

1. **V1 — Desktop**
   - local-first
   - encrypted vault
   - account CRUD
   - relationship graph
   - search/filtering
   - password tools
   - encrypted backup/import
   - fully usable offline

2. **V2 — Connected**
   - encrypted synchronization
   - Supabase as ciphertext storage/sync infrastructure
   - multi-device foundation
   - improved security/account-health analysis
   - better recovery/history/backup management

3. **FINAL — Mature Account OS**
   - Windows Hello / secure OS integration
   - mature device authorization
   - conflict-safe sync
   - mobile
   - richer passkey/security/recovery capabilities
   - installer/update system
   - security hardening and independent review

The product must **evolve between versions instead of being rebuilt from zero**.

---

## Current Build Strategy

### V1 target
Approximately **14 focused hours**.

### After V1
Use the application with fake data first, pass the release/security gate, then migrate real account information carefully.

### University pace
Expected maintenance/build availability: roughly **3–4 focused hours per week**.

Recommended:
- finish V1
- complete V2 over several weeks
- freeze major feature work
- build the Final version gradually when university workload allows

---

## Core Technology Direction

- React
- TypeScript
- Tauri 2
- Rust for native/security-sensitive boundaries where appropriate
- `@xyflow/react` for the dependency graph
- encrypted local-first storage
- Supabase only from V2 onward for encrypted synchronization
- established cryptographic libraries/primitives only

---

## Critical Rules

- V1 must not require internet.
- Never hardcode real credentials.
- Never commit real vault data.
- Never store plaintext passwords in ordinary localStorage.
- Never send the master password to Supabase.
- Never upload plaintext vault credentials to Supabase.
- Never invent custom cryptography.
- Use fake test credentials during development.
- Real-account migration happens only after release/security checks pass.
- Keep the personal repository private initially.
- The future public repository must be sanitized.

---

## Documentation Map

- `01 - PRODUCT.md` — what the product does
- `02 - VERSIONS/` — exact scope of V1, V2, and Final
- `03 - HOW IT WORKS.md` — architecture and data flow
- `04 - SECURITY.md` — security boundaries and rules
- `05 - BUILD PLAN.md` — execution roadmap
- `06 - TESTING & RELEASE.md` — release gates and migration safety
- `07 - AI DEVELOPMENT RULES.md` — Codex/Claude development rules
- `08 - DECISIONS.md` — locked architectural/product decisions
- `09 - PUBLIC RELEASE.md` — personal-to-public-core sanitization plan
