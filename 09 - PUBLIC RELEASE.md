# Account OS — Public Release

## 1. Goal

After the Final personal version is mature, create a **sanitized reusable core** that other developers can inspect, learn from, run, extend, and potentially contribute to.

The public release must not expose personal vault contents or sensitive operational history.

---

## 2. Repository Strategy

### Private

Possible repository:

```text
account-os-personal
```

May contain private development context and personal configuration, but should still never intentionally contain plaintext credentials.

### Public

Possible repository:

```text
account-os-core
```

Contains sanitized reusable product/core functionality.

---

## 3. Public Core May Contain

- vault architecture
- dependency graph
- account model
- relationship engine
- encryption interfaces
- backup system
- generic UI
- generic configuration
- plugin/interfaces
- tests
- sanitized sample data
- developer documentation

---

## 4. Public Core Must Not Contain

- real personal credentials
- real passwords
- real recovery codes
- real API keys
- personal emails
- real account names if identifying
- real vault data
- private Supabase keys
- production secrets
- sensitive screenshots
- unsafe Git history
- personal-only branding unless intentionally retained

---

## 5. Sanitization Process

Before creating the public repository:

1. inventory all personal/sensitive data
2. remove real vault/database files
3. remove environment secrets
4. remove personal configuration
5. remove personal email/account references
6. replace with synthetic examples
7. inspect screenshots/assets
8. inspect logs/debug files
9. inspect Git history
10. run secret scanning
11. rebuild from a clean clone
12. test installation as an external developer

If there is doubt that a secret was exposed in Git history, rotate the credential rather than relying only on deletion.

---

## 6. Public Example Data

Use obviously synthetic accounts such as:

```text
Google Personal Demo
Claude Demo
GitHub Demo
Supabase Demo

demo@example.invalid
DEMO-NOT-A-REAL-PASSWORD
```

The demo should communicate relationship mapping without resembling real personal data.

---

## 7. Public Value Proposition

Suggested positioning:

> **Account OS is a local-first encrypted account vault that visually maps how digital identities and services depend on each other.**

The public repository must make the difference from ordinary credential lists immediately understandable.

---

## 8. Public Repository Requirements

Before promotion, include:

- clean README
- product screenshots
- architecture overview
- security/threat explanation
- easy installation
- Windows release/installer where applicable
- tests
- open-source license
- contribution guide
- sanitized example data
- documentation
- roadmap
- vulnerability-reporting/security policy

---

## 9. README Should Explain

- what Account OS is
- why the dependency graph matters
- local-first philosophy
- current security model
- supported platforms
- installation
- development setup
- screenshots
- architecture summary
- limitations
- roadmap
- contribution process

---

## 10. Security Documentation

Public users must be told clearly:

- what is encrypted
- where encryption happens
- what cloud services can see
- what the master password does
- what is not yet security-audited
- how to report vulnerabilities

Never imply a security audit that did not occur.

---

## 11. License

Choose a license deliberately based on the desired contributor/commercial-use model.

Do not add a random license without understanding its implications.

---

## 12. Public Release Checklist

- [ ] Personal vault removed
- [ ] Personal accounts removed
- [ ] Personal emails removed
- [ ] Secrets removed
- [ ] Git history reviewed
- [ ] Secret scan clean
- [ ] Demo data sanitized
- [ ] Screenshots sanitized
- [ ] Generic configuration works
- [ ] Fresh clone builds
- [ ] Fresh install works
- [ ] README complete
- [ ] Architecture documented
- [ ] Security model documented
- [ ] Limitations documented
- [ ] License selected
- [ ] Contribution guide present
- [ ] Security reporting path present
- [ ] Release artifact tested

---

## 13. Long-Term Public Strategy

Do not assume developers will use Account OS merely because it is on GitHub.

Trust must be earned through:

- clear differentiation
- clean code
- understandable architecture
- strong documentation
- transparent security limitations
- tests
- easy installation
- useful screenshots/demo
- responsible maintenance
