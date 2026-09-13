# Account OS V3 — UI Exactness Pass — Final Report

Self-contained. Does not assume any other document still exists.

## 0. Scope and starting state

- Starting HEAD: `8b4c48e` (`docs(v3): update checkpoint/continuation doc to HEAD aa1b027`), clean tree.
- Ending HEAD: `7208796` (`fix(v3): Item 4 - connected-account rows as distinct cards, not a blended pill`).
- Branch: `v3-design-intelligence`. No push performed (owner's call, per standing project rule).
- Commits made this pass, in order:
  1. `746d69a` — `fix(v3): Item 1 - complete relationship badge labels, no dangling "for"`
  2. `a586f30` — `fix(v3): Item 2 - strip per-brand tint from small icon tiles`
  3. `38f7dc6` — `fix(v3): Item 3 - reassurance banner color, green to blue`
  4. `7208796` — `fix(v3): Item 4 - connected-account rows as distinct cards, not a blended pill`
- **No 1.0 Final work. No `src-tauri/` or vault-crypto changes** — confirmed by `cargo test` returning the identical 30/30 test list, unchanged, both before and after this pass.
- Every fix was CSS/label-only except the tests updated to match the corrected label strings.
- `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-MASTER-PLAN.md` (repo root, untracked) is a leftover working doc from the *previous* pass (UI Refinement Pass 2), whose own final report already exists at `c064110`. It predates this session's task and was not acted on or deleted — left for the owner, since the instructions for this pass didn't ask for repo housekeeping.

All five items were reproduced live in the Vite dev server (`npm run dev`, `http://localhost:1420/?seed=1`, the real dev-seed fixture in `scripts/dev-seed-vault.mjs`) before any fix, and re-verified live after. Screenshots for every item are under `docs/walkthrough-2026-09-13-ui-exactness-pass/{light,dark}/`.

---

## 1. Item 1 — Relationship badge text incomplete

**Cause, confirmed live (not a guess): (b), not (a).** This was never a truncation/overflow bug. `relationshipDirectionLabel()` in `src/components/RelationshipDialog.tsx` built every incoming-direction label by appending literal `" for"` to the outward label:

```ts
LOGIN_WITH: "Login for",
GOOGLE_SSO: "Google sign-in for",
GITHUB_SSO: "GitHub sign-in for",
RECOVERY_EMAIL: "Recovery for",
"2FA_DEVICE": "2FA for",
```

The template genuinely only ever produced `"{type} for"` with nothing after it — there was no trailing text being cut off by CSS overflow anywhere; the string itself ended at `"for"`. This one function is shared by both `AccountConnectionsPanel` (Relationships screen + Map side panel) and `AccountInspector` (Vault), so the bug reproduced identically in all three surfaces.

**Fix.** Replaced with complete, self-contained labels, matching the reference's own vocabulary (04/07: "Uses", "Shares login", "Same account", "Syncs with", "Owns", "Depends on"):

| Type | Outward (unchanged unless noted) | Incoming (new) |
|---|---|---|
| `LOGIN_WITH` | Logs in with | **Shares login** (was "Login for") |
| `GOOGLE_SSO` | Google sign-in | *(falls back to outward — already complete once " for" is gone)* |
| `GITHUB_SSO` | GitHub sign-in | *(falls back to outward)* |
| `RECOVERY_EMAIL` | Recovery email | **Recovery contact** (was "Recovery for") |
| `CONNECTED_TO` | Connected to | *(unchanged, already complete, no incoming variant existed)* |
| `OWNS` | Owns | Owned by *(unchanged, already complete)* |
| `DEPENDS_ON` | Depends on | Required by *(unchanged, already complete)* |
| `LINKED_ACCOUNT` | Linked account | *(unchanged, already complete, no incoming variant existed)* |
| `2FA_DEVICE` | 2FA device | *(falls back to outward — was "2FA for")* |

**Verified live across every one of the 9 relationship types in the dev-seed fixture** (`scripts/dev-seed-vault.mjs`), both directions where applicable, by opening each account and reading its connected-accounts list:

- `LINKED_ACCOUNT` — Gmail → Google (personal): "Linked account"
- `GOOGLE_SSO` — Google (personal) → Notion: "Google sign-in"
- `RECOVERY_EMAIL` — Gmail → Apple ID/iCloud: "Recovery contact"; Facebook → Instagram: "Recovery contact"; PayPal → Old catch-all mailbox: "Recovery contact"
- `2FA_DEVICE` — Google (personal) → Pixel phone: "2FA device"
- `GITHUB_SSO` — Supabase → GitHub: "GitHub sign-in"
- `LOGIN_WITH` — Microsoft 365 (work) → Slack (work): "Shares login"
- `OWNS` — Facebook → Instagram: "Owns"
- `DEPENDS_ON` — University portal → University email: "Required by"
- `CONNECTED_TO` — PayPal → Everyday bank: "Connected to"

No dangling "for" remains anywhere. One test (`RelationshipDialog.test.tsx`) asserted on the old broken strings ("Google sign-in for", "Recovery for") and was updated to the corrected ones.

**Screenshots:** `docs/walkthrough-2026-09-13-ui-exactness-pass/light/01-before-vault-inspector-connected-accounts.jpg` vs `01-after-...jpg`; `03-before-relationships-panel.jpg` / `04-before-relationships-panel-zoom.png` vs `02-after-relationships-panel.jpg` / `04-after-relationships-panel-zoom.png`.

---

## 2. Item 2 — Small icon tiles brand-tinted

**Cause, confirmed live.** `.service-identity` in `src/App.css` — the one shared class every `ServiceIdentityMark` size renders through (Vault list rows, Map nodes, Relationships panel rows/header, and even the icon avatar inside `ServiceIdentityHero`'s own banner) — washed its own `border`, `background`, `box-shadow`, and monogram-fallback `color` in the per-account `--service-accent`/`--service-soft` custom properties. A dark-theme override (`[data-theme="dark"] .service-identity`, dating to the fixture pass's Item 8 "vibrancy" work) made this *worse* in dark mode with a richer 24% mix, deliberately, per its own comment.

**Fix.** Base rule now uses plain neutral tokens (`--aos-border`, `--aos-text`, `--aos-surface`, a fixed neutral shadow tint) at every size, including `.service-identity-large` (the hero's own icon avatar) — the reference (04) shows that avatar as a plain white circle too, not tinted, and reserves color exclusively for `ServiceIdentityHero`'s giant watermark (`.service-hero-watermark-svg`, untouched) and the hero's own gradient-wash background (`.service-identity-hero`, untouched). The dark-theme override now uses a plain neutral dark surface, dropping the per-service mix entirely.

**Verified live across 7 distinct brand colors, both themes:** Gmail (red/multi), Pixel phone "AD" monogram (was blue-tinted), GitHub (near-black), Vercel (black), Supabase (green), npm (red), LinkedIn (blue), Slack (multi), Microsoft 365 (multi), Steam (dark), "MO"/Everyday bank monogram, "UP"/University portal monogram, "O"/Orbit-style monograms — every one is now a plain neutral tile in both light and dark theme. The banner watermark (checked on Google, Supabase, PayPal, Facebook) still carries its own brand color correctly — confirming the fix is scoped exactly as intended and didn't accidentally flatten the banner too.

**Screenshots:** `light/02-before-list-row-icon-tint-zoom.png` vs `light/02-after-list-row-icon-tint-zoom.png`; `dark/02-after-list-row-icon-tint-zoom-7-brands.png` (7 brands, dark theme, all neutral — no dark "before" zoom was taken at this exact crop, but `dark/01-before-...jpg` shows the same Gmail/Pixel-phone tint live in dark theme before the fix).

---

## 3. Item 3 — Reassurance banner color

**Cause, confirmed live in both themes.** `.local-encryption-note` ("Stored locally and encrypted", `AccountInspector.tsx`) used `--aos-success` (green) for its icon/text color and background tint. The reference (`04-vault-populated-account-selected.png`) renders this banner blue.

**Fix.** Switched to `--aos-primary`. This is also the more semantically correct token: this banner is a standing reassurance statement, not a confirmation that an action just succeeded — `--aos-success` was the wrong category of color, not just the wrong hue. No dark-theme-specific override existed for this class, so the single token change fixes both themes; verified live in both.

**Screenshots:** `light/01-before-...jpg` (green) vs `light/01-after-...jpg` (blue); `dark/01-before-vault-inspector-connected-accounts-dark.jpg` (green in dark) vs `dark/01-after-vault-inspector-connected-accounts-dark.jpg` (blue in dark).

---

## 4. Item 4 — Connected-account rows: distinct cards, not a shared pill

**Investigation finding.** `AccountInspector` (Vault) and `AccountConnectionsPanel` (Relationships screen + Map) are, as the plan suspected, **two separate component implementations** of their own connected-accounts list — `AccountInspector.tsx` has its own bespoke `.inspector-relationship-list` (a 2-column grid), while `AccountConnectionsPanel.tsx` has `.relationship-connected-items` (a single-column, full-width list). However, **both already funnel their individual row/card markup through the same shared CSS class, `.inspector-relationship`** (`AccountConnectionsPanel` applies it via `className="inspector-relationship relationship-row-main"`). So the actual bug was not "two different card stylings that need reconciling" — it was one shared style whose color values were wrong, most visibly so in `AccountConnectionsPanel`'s full-width single-column layout where the effect was strongest.

**Cause, confirmed live via computed styles.** `.inspector-relationship`'s `background: var(--aos-surface-soft)` (`#f4f8fc` in light theme) sat only a few points of lightness away from its own `border` color (`#dbe8f3`, `--aos-border`) and from the white panel surrounding it (`getComputedStyle` measured both the row and its parent `.inspector-section`/`.account-connections-panel` and confirmed the near-collision). Adjacent rows in `AccountConnectionsPanel`'s full-width list read as one continuous pale-blue block rather than the reference's (04) individually distinct white bordered cards.

**Fix.** `.inspector-relationship` now uses the same background+shadow recipe `.inspector-section` already uses elsewhere in this app for card definition: plain `--aos-surface` background with a soft neutral shadow, letting the border and shadow do the visual separating rather than a background tint — consistent in both light and dark theme without needing a separate dark override (dark theme's `--aos-surface` already equals the page background there too, exactly like `.inspector-section`, and the cards still read as distinct via border, matching that established convention).

**Confirmed both call sites now render identically** as distinct, individually bordered white (or dark-navy-with-border) cards: Vault inspector's connected-accounts list, and the Relationships-screen/Map's shared `AccountConnectionsPanel` connected-accounts list. Map-specific behaviors (focus-dimming of unselected nodes, click-to-refocus, search, fit-graph) were re-checked live and are unaffected — this was a CSS-only, color-value change to one already-shared class, no JS/behavior touched.

**Left for your call:** whether `AccountInspector`'s bespoke relationships-list markup and `AccountConnectionsPanel`'s should actually be merged into one component (not just one shared row style). They're currently two implementations by design — `AccountInspector` is one section among several flat, always-visible sections (fields, notes, relationships all inline); `AccountConnectionsPanel` is a whole tabbed side panel (Relationships/Details/Security/Notes) built for a different context (a dedicated focused-account view on the Relationships screen and Map, where there's no room for flat always-visible sections). Merging them would mean redesigning `AccountInspector`'s layout from flat sections into tabs, which is a bigger structural change than "restyle a shared row" — not attempted here since the plan's guardrail was fidelity/cohesion fixes, not new structural work, and the actual visual bug (the blended-pill look) is fully resolved by the shared-class fix above.

**Screenshots:** same before/after pairs as Item 1/2/3 above — the connected-account cards are visible in all of them (`01-*`, `02-*`, `04-*` in both `light/` and `dark/`).

---

## 5. Item 5 — Icon positioning "rumbled" complaint

**Investigated with fresh evidence, per the instruction to fix Items 1 and re-check before starting this one.**

Zoomed screenshots (3-4x) of at least 6 connected-account rows were taken before any fix, in both the narrow Relationships-panel context and the wide Vault-inspector context (see the `*-before-*` files above). At that point, three things were compounding in the same rows:

1. **Item 1's dangling "for" text**, sometimes concatenated with the relationship's own notes in `AccountInspector`'s version (e.g. `"Google sign-in for · Notion signs in with Google."`) — a visibly longer, run-on string sitting right next to the icon.
2. **Item 2's per-brand tint**, making tiles in the same list read as visually noisy/inconsistent with each other (a red tile next to a blue tile next to a green tile, each with a different intensity of wash).
3. **Item 4's low-contrast card boundary**, making adjacent rows blend into each other so there was no clear "seam" establishing where one row's icon-and-text group ended and the next began.

**Conclusion, evidenced, not speculative:** there is no independent icon-padding/centering bug in `ServiceIdentityMark`/`ServiceIdentityHero`. The CSS controlling icon position within its tile (`.service-identity { display: inline-grid; place-items: center; }`, `.service-identity svg { width: 52%; height: 52%; }`) was not touched by any of the four fixes above and was re-checked directly — icons sit exactly centered in their tile at every size, in every zoomed screenshot taken both before and after. What genuinely changed the perceived "rumpled" quality was the combination of the three effects above creating visual noise around otherwise-correctly-positioned icons. Re-zoomed the same rows live after Items 1/2/4 landed (`*-after-*` files) and the icons read as clean and consistently positioned — same coordinates, now with nothing crowding or visually competing with them.

No separate Item 5 code change was made, since none was warranted by the evidence — this is reported as a real finding (root cause identified and independently verified), not a decision to skip the item.

---

## 6. Gate suite results (this session)

```
npm test                    -> 136/136 passed (23 files) - same count as the last checkpoint
tsc --noEmit                 -> clean, 0 errors
npm run build                -> pass; main chunk 1,201.96 kB / 378.79 kB gzip (pre-existing warning
                                 category, effectively unchanged from the 1,202.04 kB / 378.80 kB
                                 checkpoint figure - this pass is CSS/label-only)
npm audit --omit=dev         -> 0 vulnerabilities
cargo test                   -> 30/30 passed - IDENTICAL test list to the pre-pass checkpoint,
                                 confirming src-tauri/ is untouched
cargo audit                  -> 0 vulnerabilities; 7 allowed warnings (6 unmaintained unic-*,
                                 1 unsound glib 0.18.5 GTK/Linux transitive) - same set as every
                                 prior report, unchanged
cargo clippy --all-targets   -> clean, 0 warnings
secret-pattern grep          -> 0 findings across src/, dist/, src-tauri/src/ (checked for API-key-
                                 shaped strings, PEM private-key headers, service_role, and JWT-
                                 shaped tokens; the intentional Supabase publishable key in dist/
                                 was excluded from the match set, as in every prior report)
```

---

## 7. Scope confirmation

- No 1.0 Final work (Windows Hello, OS keystore, code signing, auto-updater, mobile, passkeys, device authorization) — none touched.
- No vault-crypto, atomic-write, or rekey changes — `src-tauri/` untouched, confirmed by the identical Rust test list.
- No multi-profile-vault work started.
- No Person/Device/Organization/"You"-hub additions.
- Every change is CSS token values, one relationship-label lookup table, and the one test file that asserted on the old broken label strings.

## 8. Left for your call

1. **Item 4's component question** (Section 4 above): whether `AccountInspector`'s flat-section relationships list and `AccountConnectionsPanel`'s tabbed side panel should eventually become one shared component, not just one shared row style. Not attempted this pass — it's a structural change bigger than a restyle, and the actual visual bug is already resolved.
2. This pass did not rebuild native installers (renderer-only changes, same as the prior two passes) — a native rebuild is still owed before any release/acceptance pass, per the existing checkpoint doc.
3. `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-MASTER-PLAN.md` is a stale leftover from the prior pass (its own report already exists) — left in place rather than deleted, since removing files wasn't asked for this pass; safe to delete whenever convenient.
