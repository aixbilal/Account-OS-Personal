# Account OS — V1 Desktop

## 1. Goal

Build a genuinely usable personal desktop Account OS in approximately **14 focused hours**.

At completion:

> Open the desktop app, unlock the encrypted local vault, search accounts, inspect credentials, manage relationships, and visually understand account dependencies—without needing internet access.

---

## 2. User Experience

V1 must allow:

- master-password unlock
- vault lock
- add/edit/delete account
- account categories
- account title/service name
- email/username
- password
- reveal/hide
- copy password
- password generator
- authentication method
- recovery information
- 2FA metadata
- notes
- search
- filtering
- relationship graph
- add/edit/remove relationships
- encrypted backup/export
- encrypted backup import
- clean desktop UI

---

## 3. Architecture

Recommended:

- React
- TypeScript
- Tauri 2
- Rust/native boundary for vault/security-sensitive operations
- `@xyflow/react`
- encrypted local vault storage

No cloud dependency.

---

## 4. Offline Requirement

Without internet, V1 must still support:

- unlock
- view
- search
- reveal/copy
- add/edit/delete
- dependency map
- relationship editing
- password generation
- backup/import
- lock

---

## 5. Development Data Policy

Use synthetic credentials only during development.

Example:

```text
test@example.invalid
FAKE-PASSWORD-ONLY
```

Do not enter real credentials until the security/release gate passes.

---

## 6. V1 Data Model

### Account
- id
- service name
- account name
- category
- username
- email
- password
- authentication method
- recovery information
- 2FA information
- notes
- created/updated timestamps

### Relationship
- id
- source account
- target account
- relationship type
- notes

### Vault
- format/version
- accounts
- relationships
- categories

---

## 7. Not Included

Do not add during V1:

- Supabase
- cloud sync
- multi-device sync
- mobile
- Windows Hello
- browser extension
- autofill
- automatic account discovery
- advanced analytics
- advanced security dashboard
- sharing/teams
- commercial billing
- SaaS infrastructure

---

## 8. Estimated Time

**~14 focused hours**

Detailed milestones are maintained in `05 - BUILD PLAN.md`.

---

## 9. Definition of Done

V1 is done when:

- desktop build launches successfully
- vault unlock works
- wrong master password fails safely
- vault data is encrypted at rest
- CRUD persists across restart
- search/filtering works
- reveal/copy/generator works
- relationships are editable
- dependency map reflects relationships
- encrypted backup exports/imports correctly
- app remains usable offline
- fake-data test suite passes
- no real credentials are committed/logged
- security gate passes before real migration
