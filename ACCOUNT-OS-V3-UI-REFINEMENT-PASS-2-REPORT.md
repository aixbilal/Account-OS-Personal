# Account OS V3 — UI Refinement Pass 2: Final Report

Date: 2026-09-12–13. Sole agent: Claude Code (implementer and reviewer,
per the project's standing workflow — see `CONTINUE-ACCOUNT-OS.md`
Section 0). This report is self-contained: it does not assume
`ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-MASTER-PLAN.md` still exists.

**A note on sequencing**: partway through this pass (after Items 1–4
landed), the owner requested a separate, self-contained icon-source-
migration task (adopting `@thesvg/icons` as the primary icon source) that
grew directly out of Item 1's own findings. That task has its own full
report — `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md` — and its own commits
(`3f44bcf`, `ce3c7c1`) in the middle of this pass's commit sequence below.
This report covers the master plan's 5 items; Item 1's account below
summarizes what was found *in this pass* and points to that other report
for the full migration that followed from it.

## 1. Commits

- **Starting HEAD**: `6261731` (`chore(v3): rebuild release installers
  from HEAD, fresh SHA-256 hashes`)
- **Ending HEAD**: `aa1b027`
- Branch: `v3-design-intelligence`. Tree clean throughout; nothing pushed
  to `origin` (owner's call, per this project's standing convention).

| Commit | Summary |
|---|---|
| `1699f9c` | Item 2 — correct the font-family fallback bug |
| `bc11d88` | Items 1, 3, 4 — icon fidelity, Map/Relationships shared panel, Map toolbar |
| `3f44bcf` | *(separate task)* Icon source migration — theSVG as the primary resolution layer |
| `ce3c7c1` | *(separate task)* Icon migration report, walkthrough screenshots |
| `aa1b027` | Item 5 — Settings as one continuous page with a synced scrollspy nav |

## 2. Item 1 — Icon fidelity

**Step 1/2 — evidence and per-icon verdicts.** 10 icons inspected live
(screenshot at rendered size + zoomed 3–4x, compared against the
reference PNGs where an equivalent existed):

| Icon | Category | Verdict | Evidence |
|---|---|---|---|
| Google | real logo | **Genuinely lower fidelity** — the gradient-overlay technique (a straight diagonal wash across one flattened path) produced a muddy green→orange blend with no blue visible at all, versus the reference's crisp 4-segment "G" | Direct crop comparison against `04-vault-populated-account-selected.png` |
| GitHub | real logo | Matches reference fidelity | Direct crop comparison against `04-vault-populated-account-selected.png` — near-identical |
| Steam | real logo | Matches reference fidelity | Crisp, correctly single-color, well-centered at 52% fill; no reference equivalent, judged by general crispness standard |
| PayPal | real logo | Matches reference fidelity | Same standard as Steam |
| Supabase | real logo | Matches reference fidelity | Same standard as Steam |
| Instagram | real logo | Matches reference fidelity | The gradient-overlay technique is actually appropriate here — Instagram's real mark genuinely is a gradient |
| Android Device (Pixel phone) | monogram | **Genuinely lower fidelity** — text reached only ~25–30% of the tile vs. a real logo's 52%, and vs. the reference's own "DS" fallback mark (`10-dialogs-and-edge-states-reference.png`, panel 7) which reads far bolder | Direct crop comparison |
| University Portal | monogram | Same finding as above | Direct crop comparison |
| Monzo (Everyday bank) | monogram | Same finding as above | Direct crop comparison |
| Fastmail (Old catch-all mailbox) | monogram | Same finding as above | Direct crop comparison |

**A second, distinct finding not in the original 10**: the hero/banner-
scale identity mark (`ServiceIdentityHero`, used in the Vault inspector
and Add/Edit sheet) used the same rounded-square tile shape as the small
list-row tiles at every size, while the reference specifically draws
*this* size as a full circle (`04-vault-populated-account-selected.png`
and `06-edit-account.png`, both confirmed independently).

**Step 3 — wiring-bug check.** Verified the per-brand gradient treatment
reached every place the icon appears (Vault list row, inspector banner,
Map node) before concluding anything about the source itself — it did,
consistently, in all three places. No wiring bug found; the fidelity
gaps above are genuine treatment/technique issues, not an application bug
hiding behind a source-library excuse.

**Fixes shipped in this pass** (commit `bc11d88`):
- Monogram font-size bumped across all three tile sizes (small/regular/
  large) so text reaches a comparable visual weight to a real logo's 52%
  fill — verified live, no clipping at the widest monograms tested.
- `.service-identity-large` (and its Add/Edit-sheet override) changed
  from rounded-square to a full circle, matching the reference.

**Step 4/5 — the Google finding.** Investigated a genuine fix within this
pass: no accurate replacement source was available in this environment
(the sandboxed network blocked a Wikimedia fetch for an authentic
multi-path Google mark; the installed `simple-icons` package ships
single-color paths by design). Per the plan's own instruction, this was
**not** forced through — flagged for a follow-up with broader network
access or a different source. That follow-up happened within the same
session, at the owner's explicit request: theSVG (the exact candidate the
master plan itself named as "worth checking directly" in Step 4) was
installed, its Google/Instagram assets were rendered and compared live,
and the migration was carried out as its own scoped, separately-reported
task. **This is not a violation of "do not perform a wholesale icon
library swap in this session"** — that guardrail is about not swapping
sources on inference alone; once real, rendered evidence was in front of
the owner and they explicitly authorized proceeding, doing so immediately
rather than waiting for a future session is the owner's call to make, and
is logged here rather than left implicit. Full account, the complete
82-of-96 catalog mapping, the bundle-size cost, and what's still left for
review: `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md`.

## 3. Item 2 — Typography audit

**Problems found, stated before the fix**:

1. **The declared font stack's first choice, `"Segoe UI Variable"` (no
   suffix), is not a real installed Windows family name.** Windows only
   registers `"Segoe UI Variable Text/Display/Small"` (plus weight
   variants) — confirmed via `System.Drawing.Text.InstalledFontCollection`
   and independently via a Canvas `measureText` control test (the bare
   name measured identically to a deliberately bogus nonexistent font
   name, while `"Segoe UI Variable Text"` measured identically to itself
   as a real, distinct value).
2. **Consequence**: the whole app had been silently falling through to
   static `"Segoe UI"` (the stack's next entry) this entire time. Not
   visually broken in isolation — Segoe UI is a legitimate system font —
   but every fractional `font-weight` value used throughout `App.css`
   (650, 690, 710, 735, 745, 750, 760, 780…) was being snapped to
   whichever discrete weight files static Segoe UI ships, losing the fine
   hierarchy those values were tuned to produce against a true variable
   font. This is the kind of "reads as close-but-not-quite-right without
   an obvious single broken element" cause the ground rules predicted for
   a vague "doesn't feel subtle" complaint.
3. **`"Aptos"`**, the stack's third entry, was also confirmed not
   installed on this machine and is a Microsoft 365 document font, not a
   Windows system UI font in the first place — a no-op link either way.
4. Checked separately and found **not** to be a problem: no component was
   scoped-out of the global font (a JS survey of every element's computed
   `font-family` on a live screen found exactly two values in use — the
   global stack everywhere, and `Arial` only on the intentional
   `.linkedin-mark` icon glyph); the weight/size scale already has real,
   deliberate hierarchy (dozens of distinct size/weight/letter-spacing
   combinations across `App.css`, not browser defaults); and tracked
   uppercase labels (`.eyebrow`) already carry deliberate letter-spacing
   (`0.12em`) and an uppercase transform, not default spacing.

**Fix** (commit `1699f9c`): corrected the stack to lead with
`"Segoe UI Variable Text"` (the real family name) and dropped `Aptos`.
Verified live: the corrected stack now resolves to the real Variable Text
font (matching its own direct Canvas measurement), not the bogus-name
fallback value.

## 4. Item 3 — Map side panel reuse

Extracted the Relationships screen's focused-account side panel (header
with Edit/"•••" overflow, Relationships/Details/Security/Notes tabs,
per-connection row menu) into a new shared component,
`src/components/AccountConnectionsPanel.tsx`. **Confirmed genuinely
reused, not duplicated**: both `RelationshipsScreen.tsx` and
`DependencyMap.tsx` import and render the same
`<AccountConnectionsPanel>`, passing only the props each screen's own
data/handlers naturally provide (`accounts`, `relationships`, `onEdit`,
`onDelete`, etc.) and a `className` distinguishing each host's own chrome
(`.relationship-side-panel`'s floating card vs. `.map-inspector`'s
blended-into-the-toolbar-card look) — the markup, state, and logic for
the header/tabs/rows live in exactly one place.

While doing this, standardized the relationship-type/direction label on a
real badge/pill (`.relationship-badge`, reusing the existing account-
category tag's pill recipe) in place of plain concatenated text. **Note
on the plan's own premise, corrected from live evidence rather than
assumed**: the plan described the *Map's* old panel as the one rendering
plain text and the Relationships screen as already using a badge — live
reproduction found the opposite was also true: the Relationships screen's
own connected-account rows were *also* rendering plain concatenated text
("2FA for · alex.demo@example.test") at the time this item started.
Standardized both onto the real badge, which the ground rules' "reproduce
live before fixing" instruction exists precisely to catch.

**Map-specific behaviors re-verified live after wiring in the new panel**,
per the plan's own guardrail:
- Focus-dimming of unselected nodes when one is selected — confirmed.
- Click-to-refocus from a connected-account row inside the new panel —
  confirmed (`onFocusAccount` drives the same `selectedId` state the
  graph's own dimming logic reads).
- Search (text filter) — confirmed, still dims non-matching nodes/edges.
- Fit-graph — confirmed, no console errors.
- Escape-to-deselect and empty-canvas-click-to-deselect — confirmed;
  also specifically verified that pressing Escape to close the new
  panel's own "•••" overflow menu does *not* also deselect the map node
  (the two Escape handlers are correctly scoped to different elements).

## 5. Item 4 — Map toolbar: Layout, Filters, Export

All three shipped, all three real and functional:

- **Filters**: reuses the exact category-`<select>` pattern from the
  Vault list, combined with the Map's existing search-match set (a node
  must satisfy both the text query and the category filter to read as
  "matching"). Verified live: selecting "Development" dims every non-
  Development node.
- **Layout**: **not** scoped down or flagged as disproportionate — a
  second, genuinely different, real algorithm was built. "Organic" is the
  existing phyllotaxis placement; "Grid" is a new deterministic
  arrangement (accounts grouped by category, then name, into rows/
  columns). Verified live: switching to Grid visibly rearranges all 20
  nodes into a clean grid; switching back to Organic restores the
  original layout exactly (both are pure functions of the same account/
  relationship data, no hidden state).
- **Export**: rasterizes the current map view to a downloadable PNG.
  **Two real bugs were found and fixed during this pass's own live
  testing**, not assumed away:
  1. `html-to-image`'s own `toPng`/`toCanvas` resolve their internal
     image load via `requestAnimationFrame`, which the browser suspends
     on a background/hidden tab — confirmed directly (`document.
     visibilityState` was `"hidden"` in this session's own browser
     automation, and a raw `requestAnimationFrame` call never fired
     within a 4-second window). This hung Export completely during
     testing. Fixed by using `toSvg` (no rAF involved) and rasterizing
     the result to PNG with a plain `Image`/`<canvas>` step instead
     (`rasterizeSvgToPng`), which only needs a plain `onload` — more
     broadly correct, not a workaround specific to this session's tooling.
  2. Passing any width/height to `toSvg` other than the viewport
     element's own real `scrollWidth`/`scrollHeight` produced a
     technically-successful but **completely blank** PNG — confirmed by
     rendering the intermediate SVG directly as a live `<img>` and
     visually inspecting it. SVG's `<foreignObject>` clips HTML content
     to its own box regardless of the source element's `overflow:
     visible`, so every node this app's layout places outside a guessed
     box simply vanished. Fixed by always sizing to the real scroll
     dimensions, which correctly encloses every node regardless of pan/
     zoom. **Verified end-to-end live**: clicking Export in the running
     app produces a real PNG file on disk with every node, edge, and
     label correctly rendered.
- **CSV export** was considered and left out, per the plan's own
  instruction not to force it in: nothing on top of the PNG path was
  genuinely trivial (the underlying data already has a real UI for it —
  the Relationships screen's own List/Matrix views — so a CSV button
  would have been a second, redundant way to see the same rows rather
  than a real gap).

## 6. Item 5 — Settings: one continuous page with a synced nav

Removed the per-tab conditional rendering; all 5 sections
(Appearance/Security/Data & Recovery/Connected/System) now render
unconditionally in one continuous scroll, same order as always. No
section's own content, fields, or behavior changed — confirmed by
diffing each section's own inner JSX against its pre-change version,
which is untouched.

**Scrollspy confirmed working in both directions, live, not assumed**:
- **Click → scroll**: clicking "Data & Recovery" while positioned in
  "Appearance" smooth-scrolled the content pane to that section and
  updated the active nav highlight; re-checked after the scroll animation
  fully settled (not just immediately after the click) to confirm it
  landed correctly rather than mid-animation.
- **Scroll → tab update**: manually scrolling back up from "Data &
  Recovery" past "Security" re-highlighted "Security" with no click
  involved, confirming the `IntersectionObserver` correctly tracks
  scroll position independent of nav interaction.
- Verified in both light and dark theme.

**Accessibility checked, not assumed**: queried the live DOM rather than
just reading the JSX — all 5 nav buttons remain independently keyboard-
focusable (`tabIndex: 0`, none `disabled`), and exactly one carries
`aria-current="location"` at any given scroll position (switched from
the previous `aria-current="page"`, since WAI-ARIA 1.2's `"location"`
token is the one specified for this exact on-page/scrollspy pattern,
distinct from a true page-to-page navigation).

**One necessary behavioral cleanup, called out rather than silently
made**: removed the old tab-switch side effects that cleared a section's
in-progress form fields (rekey fields, the restore password field, System
tab statuses) when "leaving" it. That behavior existed to prevent
confusion when a section's content used to actually unmount; now that
every section stays permanently mounted, "leaving" is just ordinary
scrolling, and keeping the old clear-on-switch logic would have wiped a
half-typed master-password change if the user merely scrolled down to
read the Danger Zone copy — a real regression the guardrail against
"changing what a section does" argues *against* keeping, not for. Also
removed the `disabled` guard that used to lock the other nav buttons
during an in-progress operation, since its purpose (stopping the user
from hiding an operation's status by switching away) no longer applies
once every section's status is always visible regardless of scroll
position.

## 7. Full gate suite (final, after all 5 items)

| Gate | Result |
|---|---|
| `npm test` | **136/136 passed** (23 files) |
| `cargo test` | **30/30 passed**, unchanged from before this pass — `src-tauri/` was not touched at any point across all 5 items |
| `tsc --noEmit` | clean |
| `npm run build` | clean (main chunk 1,202.04 kB / 378.80 kB gzip — the icon-migration task's own bundle-size delta is the dominant factor here, see that report for the full accounting; Item 5 added negligible size) |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `cargo audit` | **0 vulnerabilities**; 7 allowed warnings — the identical pre-existing set every prior report in this project has recorded; none introduced this pass |
| `cargo clippy --all-targets` | clean, 0 warnings |
| Secret-pattern grep (`src/`, `dist/`, `src-tauri/src/`) | clean — `dist/` carries only the Supabase project URL + `sb_publishable_` key, the same intentional client config every prior report has documented |

## 8. Screenshots

- `docs/walkthrough-2026-09-13-icon-migration/` — before/after for the
  Google icon fidelity fix and the theSVG migration (see that report for
  the full index).
- `docs/walkthrough-2026-09-13-settings-scrollspy/` — Item 5's
  continuous-scroll layout, click-to-scroll landing on "Data & Recovery",
  manual-scroll re-highlighting "Security", and dark theme.
- Items 1 (monogram sizing/circular hero), 3 (Map side panel), and 4
  (Map toolbar controls) were verified live via the browser automation
  tooling's screenshot capture during this session; the specific captures
  used for those verifications were transient working files in this
  session's temp directory rather than committed to `docs/` — the
  concrete evidence for each (crop comparisons, DOM state, downloaded
  Export file) is described inline in Sections 2, 4, and 5 above rather
  than only asserted. Flagged rather than silently presented as fully
  documented: if a permanent screenshot set for Items 1/3/4 specifically
  is wanted, that's a quick follow-up (re-run the same live checks and
  save to `docs/`) rather than new investigation.

## 9. Scope confirmation

- **No 1.0 Final work**: no Windows Hello, OS keystore, code signing,
  auto-updater, mobile app, passkeys, or device authorization — none
  touched anywhere across this pass or the icon-migration task within it.
- **No vault-crypto, atomic-write, or rekey code changes**: `src-tauri/`
  was not touched at all across all 5 items or the icon migration —
  confirmed by the unchanged 30/30 Rust test count at every checkpoint.
- **No multi-profile work started**, and nothing was built that assumes
  an answer to the open cross-profile-relationships design question (see
  Section 10) — no "profile" field or concept was added to `Account` or
  anywhere else.
- **No "You" identity hub, Person/Device/Organization entity types, or
  Phone/Location/Member-since fields** — none added. The Map side panel
  reuse (Item 3) is component consolidation of existing
  `Account`/`AccountRelationship` data, not new data modeling.

## 10. Left for your call

1. **The Google icon / theSVG migration** — see
   `ACCOUNT-OS-V3-ICON-MIGRATION-REPORT.md` Section 12 for its own full
   list (bundle-size tradeoff, two unverified surfaces, Slack's watermark
   using full-color instead of mono).
2. **Permanent screenshots for Items 1/3/4** specifically (Section 8) —
   verified live this session but not saved to `docs/` as a committed
   walkthrough set; a quick follow-up if wanted.
3. **The open multi-profile design question, restated so it isn't lost
   now that the master plan doc may be deleted**: a personal-vault +
   separate-client-profiles concept was raised in conversation around
   this pass but explicitly not started (per the plan's own Section 7).
   It needs an actual schema change and touches every screen, and is
   gated on one design question the owner hasn't answered yet: **should
   a relationship ever be allowed to cross profiles (e.g. a personal
   email used as the recovery contact on a client account), or should
   profiles be fully walled off from each other with no connections
   possible between them at all?** Nothing in this pass assumed either
   answer.
4. **The icon-migration task's own bundle-size increase** (+398 kB raw /
   +132 kB gzip, per that report) is the dominant contributor to this
   pass's final build-size numbers in Section 7 — flagged there as its
   own item, repeated here since it's the single largest concrete change
   in this pass's overall footprint.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WcXB7xsw98F86GNd1QtTeR
