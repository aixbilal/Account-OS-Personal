# ACCOUNT OS V3 DESIGN SYSTEM

**STATUS: DRAFT - DESIGN LOCK PENDING**

This short agent-readable guide summarizes the deeper source of truth in `docs/15 - DESIGN INTELLIGENCE/`. It does not authorize implementation or turn provisional directions into final decisions.

Its concise structure was informed by Awesome DESIGN.md as a format reference only; no external company design system or visual style is adopted by this document.

## Product character

Account OS should feel calm, precise, premium, private, controlled, trustworthy, desktop-native, and information-dense without clutter.

Avoid a gaming aesthetic, cyberpunk, generic AI dashboard output, giant SaaS cards, excessive empty space, excessive glassmorphism, neon everywhere, and constant animation.

## Current screen audit

| Screen | Classification |
| --- | --- |
| Unlock | POLISH |
| Vault | RESTRUCTURE |
| Add Account | POLISH / RESTRUCTURE |
| Account Selected / Edit | RESTRUCTURE |
| Relationships | RESTRUCTURE |
| Map | KEEP + POLISH |
| Settings / Backup | RESTRUCTURE |
| Cloud Panel | RESTRUCTURE |

**REBUILD:** none currently.

## Current V3 direction

All items in this section are **PROVISIONAL** until the Design Intelligence workflow records and approves a decision.

- Hybrid / Dark / Light theme architecture; Hybrid is the preferred candidate.
- Dark/graphite app chrome with softer/lighter work surfaces.
- Map remains predominantly dark; Unlock remains restrained/dark where appropriate.
- Three-pane Vault hypothesis: list plus inspector, view-first with explicit Edit.
- Local service identities and first-class relationships.
- Grouped Settings; Connected/Devices architecture later.

## Service identity

`domain -> local resolver -> bundled/local service identity -> local icon/accent -> monogram fallback`

Never make silent third-party favicon requests.

## Motion

Motion is restrained and purposeful, approximately 120-250ms where appropriate, with reduced-motion support. No continuous decorative motion and no decorative motion around secrets.

## Component sources

| Source | Role |
| --- | --- |
| Account OS internal components | First priority. |
| Taste Skill (`gpt-taste`) | Quality and anti-generic guardrail; desktop/security rules override its website conventions. |
| Image-to-Code | Translate an approved visual reference into implementation; adapt to desktop product UI. |
| Unlumen | Product-control inspiration. |
| Magic UI | Limited polish. |
| Vengeance | Special interactions such as command search. |
| Vercel Web Design Guidelines | Post-implementation audit. |
| Mobbin | Curated reference research when paid access exists. |

## Design authority

`LOCKED Account OS Design Intelligence > approved DESIGN.md > approved reference image/screen > existing Account OS pattern > Taste/design skill > external component library > model intuition`

## Security and privacy override

If a visual technique weakens privacy, encryption, offline operation, local-first behavior, secret handling, accessibility, or credential safety, visual design loses. The security boundary wins.

## Visual implementation loop

`current screenshot -> ChatGPT decision -> DESIGN.md / Screen Recipe -> approved reference image where needed -> Codex implementation -> agent-browser screenshot -> ChatGPT comparison -> Web Design Guidelines audit -> security regression -> PASS`
