# ACCOUNT OS V3 DESIGN SYSTEM

**STATUS: V3 DESIGN SYSTEM LOCKED - IMPLEMENTATION NOT STARTED**

The detailed source of truth remains `docs/15 - DESIGN INTELLIGENCE/`. This lock authorizes the V3 visual/product direction, not code changes. Exact final colors, pane widths, spacing, typography, breakpoints, curves, icon sizes, radii, and micro-copy remain implementation-tested through approved reference frames and screenshot review.

## Product character

**Quiet confidence:** calm, precise, premium, private, controlled, trustworthy, desktop-native, and information-dense without clutter. Security is communicated through structure, clarity, restraint, predictable behavior, and hierarchy.

Never make Account OS a generic AI/SaaS dashboard, gaming/cyberpunk/crypto-wallet UI, neon security app, card wall, marketing website, or glassmorphism showcase. Avoid excessive empty space, decorative locks, warning-color noise, and visual effects.

## Theme architecture

User-facing modes are **Hybrid** (signature default), Dark, Light, and System. System follows OS Light/Dark preference; it never forces Hybrid.

- **Hybrid:** graphite/dark app chrome plus soft lighter work surfaces and restrained security/service accents.
- **Dark-dominant:** persistent navigation, app chrome, Unlock environment, Map canvas, command/search overlay, and security-critical overlays where appropriate.
- **Lighter/soft:** Vault list, inspector, forms, Settings details, Devices, and Backup/Recovery management.
- **Mixed:** security views, dialogs, account details, and search results.

Hybrid is coherent surface hierarchy, not random black-and-white panels. Dark and Light retain the same information hierarchy and Account OS identity. Color roles and token structure are locked; final hex tuning is implementation-tested.

## App shell

Persistent desktop sidebar navigation remains icon-plus-label, keyboard-visible, hover-independent, compact, graphite/dark, and predictably selected. Vault, Map, and Settings remain core. Future Security, Devices, and Backups appear only when their real surfaces exist; no placeholder navigation. A future collapse mode must preserve usability.

## Vault and account model

**Vault is the primary V3 restructure.** Large desktop uses `NAV -> LIST -> INSPECTOR`:

- Left: application navigation.
- Middle: searchable, information-dense account list with local service identity, name, useful secondary identifier, restrained category/tag, and obvious selection.
- Right: selected account inspector.

Selecting an account means **View**, never immediate edit. The inspector prioritizes service identity, account name, username/email, explicit Reveal/Copy actions, website/domain, notes/metadata, relationships, explicit Edit, then safely placed secondary/destructive actions. Secrets remain hidden by default. At narrower supported windows, the inspector may become an alternate detail state; exact behavior is implementation-tested.

View and Edit are distinct states. View is calm and readable; Edit has grouped fields, Save and Cancel, visually separated destructive actions, and accessible password generation. The current giant edit modal is not the primary view interaction; inspector transformation, sheet/panel, or a justified modal remain implementation-tested presentation choices.

## Add account, identity, and relationships

Add Account preserves valid capability while making hierarchy clear: Service/Account Identity (service, name, domain), Login (identifier, password, generator), Organization (category/tags), Optional details, then optional Relationships. Relationships should not dominate initial creation.

Service identity is local-only: `domain/url -> normalize locally -> local registry -> approved local icon/identity -> future user-provided local icon -> stable monogram fallback`. It may provide canonical name, restrained accent, and subtle tile for recognition and scanning, never advertising. No silent third-party favicon requests or other third-party asset requests. Licensing/trademark metadata remains explicit; no assets are added by this lock.

Relationships are first-class: inspector summaries show direction, type, related identity, navigation to the related account, and Manage Relationships. Map and inspector represent the same model coherently.

## Map, Settings, Backup, Connected, and Unlock

**Map is KEEP + POLISH:** retain a predominantly dark central graph, readable directional/type semantics, natural zoom/pan, and Account OS character. Add later only the locked polish direction: local identity in nodes where appropriate, stronger selection/focus, related/unrelated dimming, optional side inspector, and restrained relationship feedback. Never turn it into a white dashboard, overload nodes with credentials, add particles, or add continuous animation.

**Settings is a restructure:** General (Appearance, Behavior); Security (Auto Lock, Clipboard, Vault Security); Data (Backups, Recovery); Connected (Cloud Sync, Devices); System (About, Version, diagnostics where appropriate). Future markers are allowed; nonexistent functionality is not.

Backup/Recovery is a first-class Data/Security surface with status where available, clear Create Backup and Restore actions, clear destructive replacement distinction/confirmation, and concise non-alarmist privacy messaging.

Connected uses Status, Sync, future Devices, and Identity areas. Cloud identity and local vault unlock remain visibly separate; UI must never imply a Supabase password unlocks the local vault.

**Unlock is KEEP + POLISH:** retain centered, minimal, keyboard-first single-task flow. Improve material quality, identity, depth, focus, restrained motion, and local/security language; never use heroes, particles, beams, neon, marketing copy, constant glow, or hacker aesthetics.

## Motion and components

Motion communicates hierarchy, selection, state change, and continuity: typically 120-250ms, with quick hover, restrained selection/panel/dialog continuity, meaningful account/relationship/state feedback, and `prefers-reduced-motion`. Never use constant loops, ordinary-control bounce, animated secrets, excessive springs, or distracting gradients.

Component authority: Account OS approved components, Design Intelligence, approved visual reference, `gpt-taste` guardrail, `image-to-code` workflow, approved external inspiration, model invention last. Unlumen informs product controls; Magic UI is limited polish; Vengeance is limited special/command interaction. Every adopted component needs keyboard, accessibility, reduced-motion, offline/privacy, theme, and security review.

## Planned global search

Not implemented by this lock. If roadmap permits, Ctrl/Cmd+K is local-first, keyboard-first, fast, and restrained for account search/open, add account, Map, Settings, lock, and backup. Vault restructuring comes first.

## Design authority and implementation loop

`LOCKED Design Intelligence > DESIGN.md > approved reference image/screen > existing Account OS pattern > Taste/Image-to-Code > external library > model intuition`

`current screenshot -> ChatGPT decision -> DESIGN.md + Screen Recipe -> approved reference -> implementation -> agent-browser screenshot -> ChatGPT comparison -> Web Design Guidelines audit -> security regression -> PASS`

If visual design conflicts with privacy, encryption, offline/local-first behavior, secret handling, accessibility, or credential safety, the security boundary wins.
