# Account OS — AI Development Rules

These rules apply to Codex, Claude Code, Cursor agents, and other AI coding tools.

## 1. Read Before Editing

Before substantial work:

1. Read `00 - START HERE.md`.
2. Read the current version file in `02 - VERSIONS/`.
3. Read the relevant section of `05 - BUILD PLAN.md`.
4. Read `04 - SECURITY.md` for security-sensitive tasks.
5. Check `08 - DECISIONS.md` before reopening architecture choices.

---

## 2. Scope

- Work only on the current milestone.
- Do not expand V1 with V2/Final features.
- Do not redesign unrelated areas.
- Prefer small, testable changes.
- Preserve the V1 → V2 → Final evolution path.

---

## 3. Security

- Never invent cryptography.
- Use established security libraries.
- Never expose real credentials.
- Never print vault contents.
- Never log passwords/master password/recovery codes/API keys.
- Never commit vault or backup files.
- Never upload plaintext vault contents.
- Never send the master password to Supabase.

---

## 4. Real Data

Development uses fake data unless the user has explicitly moved past the release/security gate.

Agents must not request real credentials for ordinary development or testing.

---

## 5. Architecture

### V1
- local-first
- no mandatory internet
- no Supabase dependency
- encrypted local vault
- Tauri + React + TypeScript
- Rust/native layer where appropriate
- XYFlow relationship graph

### V2
- encrypted synchronization
- cloud sees ciphertext for sensitive vault content

### Final
- device security, mature sync, mobile, installer/updater, hardening

---

## 6. Coding Workflow

Preferred:

```text
Primary agent implements
   ↓
Run tests/build
   ↓
Second agent reviews sensitive/high-risk work
   ↓
Primary agent fixes verified findings
```

Do not have multiple agents independently redesign the same cryptographic subsystem.

---

## 7. Validation

Before claiming completion:

- run relevant tests
- run type/build checks
- verify affected user flow
- inspect for accidental sensitive logging
- report what changed
- report validation results
- report remaining known issues

---

## 8. Documentation

After a milestone:

- update `05 - BUILD PLAN.md`
- record major architecture/product decisions in `08 - DECISIONS.md`
- update version documentation only if scope genuinely changed

Do not create new documentation files casually.

---

## 9. No Unnecessary Refactors

Do not rewrite working code solely for style.

Refactor only when it:

- fixes a verified problem
- improves security
- unlocks the current milestone
- materially improves maintainability

---

## 10. Completion Standard

A task is complete only when:

- code exists
- expected behavior works
- relevant tests/checks pass
- security boundaries are respected
- no unrelated changes were introduced
