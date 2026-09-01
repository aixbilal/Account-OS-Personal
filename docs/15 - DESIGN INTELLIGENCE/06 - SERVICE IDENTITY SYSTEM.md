# Service Identity System

**LOCKED:** local recognition only.

`domain/url -> normalize locally -> local service registry -> local approved icon/identity -> future user-provided local icon -> stable monogram fallback`

Supported identity may include a local icon, canonical name, restrained approved accent, and subtle tile. Its purpose is scanning and orientation, not decoration or advertising. Unknown services use a stable high-quality monogram/generic identity.

No silent third-party favicon or asset request occurs when a domain is entered. Common-service planning metadata may cover Google, Instagram, GitHub, Microsoft, and Apple; this lock downloads no assets. Licensing/trademark state remains explicit in registry metadata.

## V3 implementation evidence — 2026-09-01

- Known local service identities: 99.
- Generic identity categories: 18.
- Pakistan finance identities: 9.
- Resolution is local-only: normalized service/domain input is matched against the in-repository catalog; known identities use neutral local marks and all other catalog entries or unknown services retain the stable monogram fallback.
- No silent third-party favicon, icon, or other identity lookup is performed.
- Production artifact scan: PASS. The rebuilt `dist` output contained no credential, API-key, token, vault, backup-payload, or synthetic-demo-value leak. Matches for encrypted-backup labels and bundled dependency protocol identifiers were reviewed as non-secret.
- Web Design Guidelines review: ISSUES. Semantic controls, labels, and icon-button labels are present in the V3 Vault implementation, but the human native review identified material hierarchy, density, focus, settings architecture, Map quality, and lock-screen polish issues that require a later approved polish pass.
- Native evidence: real Tauri review completed on an isolated disposable profile. No critical functional issue was found. The retained review screenshots are under `C:\tmp\account-os-v3-vault-implementation-review\`.
- R2 comparison: ISSUES. The implemented three-pane composition, local identities, selected inspector, and themes are present; the native review found excessive outlined containers, weak button hierarchy, form-like view mode, incomplete identity treatment, and insufficient Map/Settings/Unlock refinement.

**Status: IMPLEMENTED — PENDING HUMAN/CHATGPT NATIVE VISUAL APPROVAL.** The review findings above are evidence for a future visual-polish scope, not authorization to redesign this implementation.
