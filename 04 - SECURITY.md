# Account OS — Security

## 1. Security Philosophy

Account OS will hold highly sensitive information.

Security is therefore a product requirement, not an optional polish layer.

AI can assist with implementation, but AI-generated cryptography must never be trusted merely because it looks plausible.

---

## 2. Absolute Rules

### NEVER

- hardcode passwords
- hardcode private API keys
- commit real vault contents
- store plaintext passwords in ordinary localStorage
- write plaintext vault exports as routine backups
- send the master password to Supabase
- send plaintext vault credentials to Supabase
- log sensitive credentials
- print decrypted vault data for debugging
- invent a custom cipher/KDF/protocol
- keep decrypted temporary files unnecessarily

---

## 3. Master Password

The master password should be used only to derive or unlock the vault key.

It must not:

- be stored as plaintext
- be sent to cloud services
- appear in logs
- be committed to source code
- be used as a general app/server password

---

## 4. Key Derivation

Use a vetted password-based KDF such as Argon2id with appropriate parameters.

Parameters should be versioned so they can evolve safely.

Do not hand-roll hashing logic.

---

## 5. Encryption

Use authenticated encryption through established libraries.

Encryption must provide confidentiality and integrity.

Do not reuse nonces/IVs incorrectly.

Version encryption metadata so migrations are possible later.

---

## 6. Local Storage

Store sensitive vault data only in encrypted form at rest.

Vault files should live in the application data directory—not inside the Git repository.

Repository paths and build folders must not contain real vault data.

---

## 7. Memory

Plaintext must exist in memory when the user is actively using the vault, but minimize unnecessary copies.

Avoid:

- global debug dumps
- long-lived redundant plaintext copies
- serializing decrypted vault contents to logs
- crash reports containing sensitive values

---

## 8. Clipboard

Password copy is useful but sensitive.

Design for:

- intentional user action
- minimal clipboard exposure
- optional clearing behavior later
- no hidden/background copying

---

## 9. Logging

Logs must never contain:

- password values
- master password
- recovery codes
- API keys
- complete decrypted vault
- sensitive backup payloads

Logs should favor event metadata over secret values.

---

## 10. Backup Security

Backups must remain encrypted.

Backup flows must be tested for:

- successful restore
- wrong password
- corruption
- incompatible version
- accidental overwrite

---

## 11. Git Security

Keep the personal repository private initially.

Never rely on repository privacy as credential protection.

Exclude:

- vault files
- backups
- `.env`
- local secrets
- real configuration containing credentials
- screenshots with visible secrets
- debug exports

If a secret reaches Git history, treat it as potentially exposed and rotate it.

---

## 12. Cloud Security — V2+

Cloud sync should upload ciphertext only for vault-sensitive content.

Supabase should not need plaintext passwords, notes, recovery codes, or the master password.

Use:
- Auth
- RLS
- owner scoping
- secure device authorization as maturity grows

---

## 13. Recovery

Recovery must not introduce a backdoor that makes the encryption model meaningless.

Recovery design must be treated as security architecture, not only UX.

---

## 14. Security Review

Before real credentials:
- internal review
- static checks
- functional abuse testing
- fake-data validation

Before public trust claims:
- deeper independent review
- dependency/security review
- threat-model review
- cryptographic implementation review

---

## 15. Public Release Security

Before publishing the reusable core:

- remove personal data
- remove private environment details
- review entire Git history
- use sanitized demo data
- verify no secrets remain
- document security model and limitations
- provide a responsible vulnerability-reporting path
