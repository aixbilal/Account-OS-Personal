# Account OS — Testing & Release

## 1. Development Data Rule

All development/testing starts with fake credentials.

Never use real credentials merely because the UI appears complete.

---

## 2. Fake Data Examples

Use obviously synthetic values:

```text
Google Personal TEST
test@example.invalid
FAKE-PASSWORD-ONLY
```

Avoid realistic personal secrets.

---

# V1 Release Gate

## Vault
- [ ] Correct master password unlocks
- [ ] Wrong master password fails safely
- [ ] Master password is not stored as plaintext
- [ ] Vault file does not reveal account data in plaintext
- [ ] Vault survives restart
- [ ] Corrupt vault produces a safe error

## Account CRUD
- [ ] Add persists
- [ ] Edit persists
- [ ] Delete persists
- [ ] Restart preserves correct state

## Credentials
- [ ] Reveal works intentionally
- [ ] Hide works
- [ ] Copy works
- [ ] Generator works
- [ ] Sensitive values are not logged

## Search
- [ ] Search works
- [ ] Categories work
- [ ] Authentication filters work

## Relationships
- [ ] Add relationship
- [ ] Edit relationship
- [ ] Delete relationship
- [ ] Graph updates correctly
- [ ] Dependents/dependencies are correct

## Offline
- [ ] Disconnect internet
- [ ] Unlock works
- [ ] Search works
- [ ] CRUD works
- [ ] Map works
- [ ] Password tools work
- [ ] Backup works

## Backup
- [ ] Export succeeds
- [ ] Backup is encrypted
- [ ] Import restores data
- [ ] Wrong-password restore fails safely
- [ ] Corrupted backup fails safely

## Git / Filesystem
- [ ] No vault files in Git
- [ ] No backups in Git
- [ ] No secrets in `.env` committed
- [ ] No screenshots with real credentials
- [ ] No plaintext debug exports

## Build
- [ ] Production desktop build succeeds
- [ ] Production build launches
- [ ] Release behavior matches development behavior

---

# Real Credential Migration Gate

Only migrate real account data after all critical V1 security checks pass.

Recommended migration order:

1. primary identity hubs
2. Google identities
3. GitHub
4. Microsoft/Apple/Meta
5. major developer services
6. major SaaS accounts
7. university accounts
8. remaining lower-priority services

For each account capture:

- service
- account name
- email
- username
- authentication method
- password if applicable
- recovery method
- 2FA method
- relationships
- notes

---

# V2 Testing

Test:

- sync upload
- sync download
- ciphertext-only cloud storage
- multiple devices
- offline edits
- reconnect behavior
- duplicate/change detection
- conflict behavior
- failed sync recovery
- device revocation
- auth/RLS scoping
- local data survival if cloud is unavailable

---

# Final Testing

Add:

- Windows Hello/biometric flows
- secure key storage
- device authorization
- hostile/corrupt sync inputs
- mature conflict cases
- mobile secure storage
- installer
- updater
- migration between versions
- backup compatibility
- dependency scanning
- security-review findings

---

# Public Release Gate

Before publishing the reusable core:

- [ ] remove real credentials
- [ ] remove personal emails/account names
- [ ] remove personal vault data
- [ ] remove production secrets
- [ ] review Git history
- [ ] replace data with sanitized examples
- [ ] review screenshots
- [ ] verify default config is generic
- [ ] include installation documentation
- [ ] document security model
- [ ] document limitations
- [ ] choose license
- [ ] include contribution guidance
- [ ] include vulnerability-reporting guidance
