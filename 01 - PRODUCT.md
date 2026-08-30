# Account OS — Product

## 1. Product Vision

Account OS is a personal **digital identity operating system**.

It should answer not only:

- What is my password?
- What email is attached to this account?

but also:

- How do I sign in?
- Which identity authenticates this account?
- What is the recovery identity?
- Which accounts depend on this one?
- What is the blast radius if this identity is compromised or lost?

---

## 2. Core Experience

Example:

```text
Google Personal
├── Claude Personal — Google SSO
├── Canva — Google SSO
├── Facebook — recovery/ownership relationship
│   └── Instagram — linked Meta account
└── Other services

Google Development
├── Claude
├── Supabase
├── Vercel
└── Developer tools

GitHub
├── Supabase
├── Vercel
└── Repositories/services
```

The system must make relationships visible, editable, and useful.

---

## 3. Main Product Areas

### Vault
Securely store and manage account information and sensitive values.

### Map
Visualize identity, login, ownership, recovery, and dependency relationships.

### Security
Surface risky structures such as weak recovery, missing 2FA, reused credentials, and high blast-radius accounts.

### Identity
Represent important hubs such as Google, GitHub, Microsoft, Apple, Meta, email accounts, and other major identities.

---

## 4. Main Screens

### V1
- Vault
- Map
- Settings

### Later
Security and Identity may become dedicated richer screens when their functionality is substantial enough.

---

## 5. Account Data

A service account may include:

- service name
- account name/title
- category
- email
- username
- password
- authentication method
- recovery information
- 2FA information
- notes
- timestamps

---

## 6. Authentication Methods

Supported metadata should include:

- Password
- Google SSO
- GitHub OAuth
- Apple SSO
- Microsoft SSO
- Meta
- Passkey
- Other

---

## 7. Relationship Types

The relationship engine should support:

- `LOGIN_WITH`
- `GOOGLE_SSO`
- `GITHUB_SSO`
- `RECOVERY_EMAIL`
- `CONNECTED_TO`
- `OWNS`
- `DEPENDS_ON`
- `LINKED_ACCOUNT`
- `2FA_DEVICE`

---

## 8. Account Details Experience

A selected account should make it easy to inspect:

- account identity
- email/username
- authentication method
- authenticated-through identity
- password reveal/copy where applicable
- recovery details
- 2FA details
- linked accounts
- notes
- dependency relationships

---

## 9. Search and Organization

V1 should support:

- full-text style search across key account fields
- category filtering
- authentication-method filtering

Example categories:

- Personal
- Development
- Social
- University
- Finance
- Work
- Other

---

## 10. Password Tools

V1:

- reveal/hide
- copy
- password generator

Generator basics:

- length
- uppercase
- lowercase
- numbers
- symbols

Advanced security scoring can wait.

---

## 11. Security Health — Later

Account OS should eventually identify:

- reused passwords
- weak passwords
- no recovery method
- no 2FA
- missing backup codes
- critical identity hubs
- accounts with many dependents
- old accounts that need review

The most important concept is **blast radius**:

> If this identity is lost or compromised, what else is affected?

---

## 12. Supported Secure Data Types — Long Term

Account OS should eventually represent:

- Login
- Password
- Passkey metadata
- 2FA information
- Recovery codes
- API key
- Secure note
- Email account
- Identity
- Service account
- Development credential/reference

Sensitive values remain encrypted.

---

## 13. Product Philosophy

1. Build it for personal use first.
2. Actually use it.
3. Discover real problems.
4. Fix those problems.
5. Improve security.
6. Improve UX.
7. Remove personal data and branding.
8. Extract reusable core components.
9. Publish the clean core if valuable.

The first successful user is the owner of the personal vault—not thousands of hypothetical users.
