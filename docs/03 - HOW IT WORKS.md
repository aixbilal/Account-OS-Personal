# Account OS — How It Works

## 1. System Overview

### V1

```text
React UI
   ↓
Tauri IPC/commands
   ↓
Rust/native services
   ↓
Vault + crypto + storage
   ↓
Encrypted local vault
```

### V2+

```text
Local device
   ↓
Local vault
   ↓
Encrypt locally
   ↓
Ciphertext sync
   ↓
Supabase
   ↓
Other authorized device
   ↓
Decrypt locally
```

---

## 2. Technology Stack

### Frontend
- React
- TypeScript
- Tailwind CSS or equivalent clean UI system

### Desktop
- Tauri 2

### Native/security-sensitive layer
- Rust where appropriate

### Dependency visualization
- `@xyflow/react`

### Local storage
- V1: encrypted local vault/storage
- later: may evolve toward encrypted SQLite/local database if justified

### Cloud
- Supabase PostgreSQL from V2 onward

### Cloud authentication
- Supabase Auth from V2 onward where appropriate

### Authorization
- Supabase Row Level Security

---

## 3. Main Domain Models

### Account
Represents a service/account/identity.

Typical fields:

- ID
- service name
- account name
- category
- email
- username
- encrypted sensitive values
- authentication method
- recovery metadata
- 2FA metadata
- notes
- timestamps

### Relationship
Represents how one identity/account relates to another.

Typical fields:

- ID
- source
- target
- relationship type
- notes

---

## 4. Relationship Graph

Nodes represent accounts/identities.

Edges represent:

- login-through
- SSO
- recovery
- ownership
- dependency
- linked account
- 2FA device relationship

The graph is not decorative; it is a primary product capability.

---

## 5. V1 Vault Flow

```text
Master password
   ↓
Password-based KDF
   ↓
Vault key
   ↓
Authenticated encryption
   ↓
Encrypted local vault
```

On unlock:

```text
Encrypted vault
   ↓
Local decryption
   ↓
In-memory vault
   ↓
UI receives only required data
```

On change:

```text
Add/Edit/Delete
   ↓
Update vault state
   ↓
Serialize
   ↓
Encrypt
   ↓
Safe write/replace
```

---

## 6. Cryptographic Direction

Use established, reviewed libraries and modern primitives.

Preferred password KDF direction:
- Argon2id or another appropriately vetted modern password KDF

Encryption:
- authenticated encryption using established libraries/constructions

Never create custom encryption protocols.

---

## 7. Offline Behavior

V1 core functions must not depend on internet.

Offline:

- unlock
- view
- search
- reveal/copy
- CRUD
- relationship graph
- password generator
- backup/import
- lock

V2 cloud sync adds convenience, not basic availability.

---

## 8. Backup Architecture

Backup/export must remain encrypted.

Never export plaintext credential CSV/JSON as the normal backup format.

Restore should:

1. validate backup format
2. avoid overwriting good data silently
3. decrypt only after authorization/unlock requirements are met
4. fail safely on corruption

---

## 9. V2 Sync Architecture

Sensitive payloads are encrypted locally before upload.

Supabase stores ciphertext and synchronization metadata.

The master password must not be transmitted.

The local device remains responsible for vault decryption.

---

## 10. Account Login vs Vault Unlock

These are different:

### Cloud/App Login
Determines whether a user/device may participate in Account OS cloud synchronization.

### Vault Unlock
Determines whether the local vault contents can be decrypted.

Cloud authorization must not automatically imply access to plaintext vault contents.

---

## 11. Final Architecture Evolution

Later architecture may introduce:

- OS-secure key storage
- Windows Hello
- mobile secure storage
- device authorization
- conflict-safe synchronization
- richer history/versioning
- installer/update infrastructure

Do not implement all future architecture prematurely if it harms current-version delivery.
