# Account OS — V2 Connected

## 1. Goal

Evolve V1 into a **connected multi-device Account OS** while preserving the local-first security model.

Target effort: approximately **12–18 focused hours** after V1.

---

## 2. Core Principle

Cloud infrastructure provides synchronization—not basic vault functionality.

The device must remain capable of opening and using its local vault offline.

---

## 3. V2 Features

Add:

- Supabase-backed encrypted synchronization
- Supabase Auth for Account OS account/device authorization where appropriate
- multi-device foundation
- device registration metadata
- encrypted payload synchronization
- improved security dashboard
- account-health analysis
- dependency/blast-radius analysis
- stronger recovery workflows
- history/versioning foundation
- improved backup management
- sync status and failure handling

---

## 4. Sync Model

```text
Device
  ↓
Decrypt local vault
  ↓
Modify locally
  ↓
Encrypt locally
  ↓
Upload ciphertext
  ↓
Supabase stores ciphertext
  ↓
Other device downloads ciphertext
  ↓
Decrypt locally
```

Supabase should not need plaintext vault contents.

---

## 5. Cloud Data Boundary

Supabase may store:

- record ID
- owner ID
- encrypted payload
- nonce/IV where appropriate
- format version
- timestamps
- sync/device metadata

Supabase should not receive:

- master password
- plaintext password
- plaintext notes
- recovery codes
- plaintext sensitive metadata

---

## 6. Authentication vs Vault Unlock

V2 distinguishes:

### Account OS Login
Is this an authorized Account OS user/device?

Possible implementation: Supabase Auth.

### Vault Unlock
Can this device/user decrypt the vault?

Handled locally through the vault key/master-password model.

These are separate security layers.

---

## 7. Multi-Device Foundation

V2 should introduce:

- device identifier
- last sync state
- sync timestamps
- safe change tracking
- basic conflict awareness
- clear offline/online states

Avoid overly complex distributed-system behavior unless required.

---

## 8. Security Dashboard

V2 may begin surfacing:

- missing 2FA
- weak recovery structure
- critical identity hubs
- high dependency counts
- accounts needing review
- incomplete security metadata

Avoid pretending that simple heuristics equal a professional security audit.

---

## 9. Not Included

Leave for Final unless V2 genuinely requires it:

- Windows Hello
- mobile biometrics
- native mobile app
- mature conflict-resolution engine
- advanced device authorization
- full passkey management
- updater/installer polish
- independent professional security review

---

## 10. Definition of Done

V2 is done when:

- all V1 functionality remains intact
- core app remains usable offline
- encrypted sync works
- cloud stores ciphertext only for vault-sensitive payloads
- master password never leaves device
- multiple authorized devices can participate safely
- sync failures do not destroy local data
- basic conflict behavior is defined and tested
- security/account-health views provide useful information
- backup/recovery is stronger than V1
