# Account OS V3 Final UX Correction

## Scope completed

- Reworked the local Create/Unlock surface with integrated Account OS material, stronger focus hierarchy, and explicit local-security language.
- Replaced the add-account modal treatment with a right-side sheet. Essential identity, sign-in, and sensitive-value fields are immediately available; metadata, recovery, notes, and relationships are behind **More details**. Save/Cancel stays available at the bottom and Escape dismisses the sheet.
- Renamed the signature appearance to **Adaptive** and made it the default. Dark, Light, and System remain available. This is a UI-state migration only; no persisted vault data or security format changes were made.
- Added restrained local service-aware aurora surfaces for Google, Spotify, GitHub, and Instagram inspector identities. Unknown services retain the existing local monogram treatment.
- Refined Map canvas, nodes, selected-node emphasis, and the Unlock surface without changing the relationship model or React Flow behavior.

## Design and privacy decisions

- The existing V3 Nav/List/Inspector architecture remains intact.
- Service treatment uses local CSS and the existing local registry only. No logo downloads, favicon lookups, analytics, or remote branding requests were introduced.
- The progressive sheet preserves every existing account field and editing exposes advanced details by default.
- The implementation uses short state transitions only and respects reduced motion.

## Evidence

Renderer-only sanitized screenshots were captured outside the repository:

- `C:\tmp\account-os-v3-ux-create.png` — empty Vault / entry-adjacent shell
- `C:\tmp\account-os-v3-ux-add.png` — Add Account essentials and collapsed More details
- `C:\tmp\account-os-v3-ux-settings.png` — Adaptive selected in Appearance

Native screenshot routing remains environment-blocked. Google/Spotify/unknown selected-account and populated Map validation remain part of the owner’s isolated synthetic native acceptance review; no synthetic fixture was created or modified for this sprint.

## Affected files

- `src/App.tsx`
- `src/components/AccountEditor.tsx`
- `src/ux-correction.css`

## Verification

- Frontend tests: 57/57 passed.
- Rust tests: 16/16 passed.
- Typecheck and production build: passed.
- Renderer interaction check: Add Account sheet essentials, More details state, Escape dismissal, and Adaptive appearance state passed.
- Source check: no new remote favicon/branding lookup or fixture helper was introduced.
- `npm audit --omit=dev`: environment-blocked (npm audit endpoint/cache log directory unavailable), not treated as a pass.

## Remaining items

- YELLOW: direct native review of populated service-aware inspector and Map states is still owner acceptance evidence.
- RED: none identified by the automated and renderer checks in this correction sprint.
