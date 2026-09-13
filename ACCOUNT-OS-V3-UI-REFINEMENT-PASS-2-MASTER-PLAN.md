# Account OS V3 — UI Refinement Pass 2: Master Implementation Plan

**This is the only document you need to execute this pass.** Read it fully
before writing any code. Work through the items in order, in one sitting
where possible, committing after each. Only stop early on a genuine block —
see each item's own guardrails for what that means.

Produce the report specified in Section 6 at the repo root. This doc may be
deleted after that report exists, so the report must stand on its own.

---

## 0. Why this pass exists

Two prior passes (the 7-phase UI Correction & Enhancement workstream, then
an 8-item fixture pass) made the app *technically correct* against the
reference — every individual element matches, every test passes. Live
testing after both still came back "everything works, but I'm not satisfied
with the UI." That's not a contradiction — it means the remaining gap is in
**fidelity and cohesion**, not correctness: components built in different
sessions that don't yet feel like one considered product, icon/typography
quality that reads as "close enough" rather than "right," and a couple of
screens where the right *component* already exists elsewhere in the app but
wasn't reused where it's needed again.

This pass is scoped to close that gap on five specific, evidenced items.
**Explicitly not in this pass**: a multi-profile vault concept (personal
vault + separate client profiles under one master password) that came up in
the same conversation — that's a real, good idea, but it needs a schema
change and its own dedicated plan, gated on one open design question (see
Section 7). Do not start any part of it here.

---

## 1. Before you start — ground rules (same as every prior session)

1. Read `CONTINUE-ACCOUNT-OS.md`, `account-os-checkpoint.json`, and the two
   most recent reports in `docs/` (the 7-phase workstream report and the
   fixture-pass report) in full first.
2. `git status -sb` and `git log --oneline -8` — confirm clean tree and
   expected HEAD before touching anything. If unexpected, stop and report.
3. **No 1.0 Final work** (Windows Hello, OS keystore, code signing,
   auto-updater, mobile app, passkeys, device authorization) — not even
   adjacent to it.
4. **No vault-crypto, atomic-write, or rekey code changes.** Nothing in
   this pass should touch `src-tauri/` at all — if an item seems to need
   it, stop and flag rather than proceed.
5. **Reproduce live before fixing, verify live after, screenshot both.**
   This project has repeatedly found that reading code and assuming
   behavior produces wrong diagnoses (the password-strength contradiction
   two sessions ago is the clearest example). Every item below requires
   evidence, not inference.
6. Commit small, one logical change per commit, never one giant commit for
   the whole pass.
7. Never report a gate, a test, or a "matches reference" claim without
   having actually run/verified it this session.
8. Where an item's own instructions include a decision point, follow them
   exactly — don't resolve ambiguity by guessing when the item says to
   flag it instead.

---

## 2. Item 1 — Icon fidelity: investigate, then decide with evidence

### What it is (current state)

Across two prior sessions, icon work has focused on **color accuracy**:
fixing which brands get real-vs-monogram treatment, and which get true
multi-color fills instead of a flat single hex. Both were real, verified
fixes. Despite that, the owner has now flagged icon quality as a problem
**twice**, including after the color fixes shipped — most recently: *"the
icons i think this is the time where we should change these icons with
high fidelity icons."*

This is a signal that the actual gap may not be (only) color — it could be
path crispness, stroke weight, internal padding, rendering size, or
antialiasing. Two sessions of color-only fixes not resolving the complaint
means the diagnosis needs to change, not just the target list of which
icons to fix.

### What it should be

Every icon should be indistinguishable in perceived quality from the
reference pack's icons, whether it's a full-color brand mark (Google,
Instagram) or a single-color one (GitHub, Vercel, npm) — the reference
itself uses both treatments, so "high fidelity" does not mean "everything
must be full-color." It means: sharp at the sizes actually used in this
app (list rows ~32px, banner watermark ~120px+, Map nodes ~24px), properly
proportioned within whatever container/padding wraps it, and colored
correctly per the brand.

### How to build it — this is an investigation with a decision gate, not a
### prescribed fix

**Step 1 — Evidence gathering.** Pick 10 icons spanning both categories:
at least 5 real-logo icons (include Google, GitHub, Steam, PayPal,
Supabase) and at least 3 monogram-fallback icons (whatever the seed data
currently falls back to). For each:
- Screenshot it live from the running app at its actual rendered size,
  then again cropped and zoomed 3-4x.
- Where a reference equivalent exists (check all 10 reference PNGs, not
  just `04`), crop the same icon at matching zoom from the reference.
- Place them side by side.

**Step 2 — Diagnose per icon, not in aggregate.** For each of the 10, write
a specific verdict: "matches reference fidelity" or "genuinely lower
fidelity — here is specifically why" (options include: softer/blurrier
edges, wrong stroke weight, icon sitting off-center or too small/large
within its container, wrong padding, aliasing at small sizes, a color that
LOOKS right in isolation but reads muddy against this app's specific
background). Do not write a single aggregate "icons are fine now" or
"icons need replacing" conclusion — the evidence must support each
individual verdict.

**Step 3 — Check for an application bug before blaming the source.**
Verify the per-brand gradient treatment (shipped in the fixture pass for
Google/Instagram) is actually reaching every place that icon appears —
Vault list row, Vault inspector banner, Map node, Relationships panel,
Add/Edit account service picker. If Supabase's small list-row icon isn't
showing its green gradient even though its banner does, that's an
application wiring bug, fixable without touching the icon source at all —
find and fix any of these before concluding the source library itself is
the problem.

**Step 4 — If genuine fidelity issues remain after Steps 1-3**, prototype
ONE replacement icon using a higher-fidelity source, and put it side by
side with the current version at the same zoom level used in Step 1. A
real candidate worth checking directly (found via research, not assumed):
a package called **theSVG** — ships dark/light/mono/wordmark variants per
icon, has React/Vue/Svelte packages, larger collection than what's
currently installed. Also worth a direct look: whether increasing the
render size/adding subtle anti-aliasing hints on the *existing* icons
closes the gap without a library change at all — cheaper to try first.

**Step 5 — Decide, with the evidence attached.** If the prototype
comparison shows real, visible improvement, propose expanding it — scoped
to which icons actually need it (probably not all of them, given several
already verified as matching). If it doesn't show a real difference,
report that plainly too. Either way, **do not perform a wholesale icon
library swap in this session** — that's a bigger, riskier change than this
pass's scope; the decision to actually do it belongs in a follow-up once
the evidence is in front of the owner.

### Guardrails
- Do not skip straight to "replace the library" without Steps 1-3.
- Do not write a vague "icons improved" report — every verdict must be
  individually justified with the side-by-side evidence.

---

## 3. Item 2 — Typography audit

### What it is (current state)

Reported as "doesn't feel subtle or appropriate" — too vague to act on
directly without first establishing what's actually happening, since this
project has repeatedly found that vague visual complaints often trace to a
specific, fixable technical cause (a CSS specificity bug, a font not
actually loading, a missing letter-spacing rule) rather than needing a
full redesign.

### What it should be

Confirm the intended typeface is the one actually rendering everywhere,
with a weight/size scale that gives real visual hierarchy between headings,
section labels, body text, and metadata — matching the calm, precise
character of the reference images' typography.

### How to build it

1. Identify the current font stack in `tokens.css` / wherever it's
   declared. Confirm what typeface the reference images actually use —
   Inter is the most visually likely match for this style, but verify by
   comparing letterforms (the shape of a lowercase "a" and "g" are usually
   the clearest tell) rather than assuming.
2. Check whether that font is **actually applying everywhere**, or falling
   back to a system font in some component (a common bug: a component with
   its own scoped styles that doesn't inherit the global font-family, or a
   web font that fails to load in the Tauri webview specifically even
   though it loads fine in the browser dev renderer).
3. Check the weight/size scale: is there enough real contrast between an
   `h1`, a section label (e.g. "CONNECTIONS", "SELECTED ACCOUNT"), body
   text, and metadata/timestamps? Compare against the reference's scale.
4. Check tracked uppercase labels specifically (e.g. "SELECTED ACCOUNT",
   "CONNECTED ACCOUNTS", "PASSWORD") — the reference uses deliberate
   letter-spacing on these; confirm the current app does too, at a
   comparable value, rather than sitting at browser default.
5. Fix whatever Steps 2-4 actually find. Report the specific problems
   identified BEFORE describing what was changed — "found X, fixed by Y,"
   not "improved typography."

### Guardrails
- Do not perform a full typographic redesign speculatively. Fix what's
  actually diagnosed as wrong.

---

## 4. Item 3 — Map side panel: reuse the Relationships panel

### What it is (current state)

When a node is selected on the Map, the side panel shows: a bare account
name/type header, two plain stat boxes ("Incoming" / "Outgoing"), a
"CONNECTIONS" list where each row shows only an icon + name + relationship
type as plain text, and two buttons ("Open in Vault", "Create
relationship").

The Relationships screen, built in an earlier session, already has a
materially richer version of this exact same kind of panel: an Edit +
"•••" overflow header, four tabs (Relationships / Details / Security /
Notes), and a connected-accounts list where the relationship type renders
as a proper badge/pill rather than plain concatenated text.

### What it should be

The Map's side panel should look and behave like the Relationships panel —
not a new design toward the reference's aspirational "You" hub (which
needs Person/Device/Organization entities this app doesn't have, and stays
explicitly out of scope), but a straightforward reuse of the richer panel
that already exists one screen over.

### How to build it

1. If the Relationships panel isn't already structured as an extractable
   component (it may partially be, from how it was built), refactor it
   into one shared component that takes a focused account + its
   connections as props, usable by both the Relationships screen and the
   Map screen.
2. Wire the Map's node-selection state into this shared component instead
   of the current bare stat-box/plain-list version.
3. While doing this, fix the badge inconsistency noted directly from the
   screenshots: the Map/older-style panel renders relationship context as
   plain concatenated text (e.g. "2FA for · alex.demo@example.test"); the
   Relationships panel renders it as a clean badge/pill. Standardize on
   the badge treatment in both places.
4. Confirm the Map's own specific behaviors (focus-dimming of unselected
   nodes, click-to-refocus, search, fit-graph) all still work correctly
   with the new panel wired in — these are Map-specific and must not
   regress.

### Guardrails
- Do not add: a "You" identity node, Person/Device/Organization entity
  types, or Phone/Location/Member-since fields. This item is component
  reuse, not new data modeling — same boundary every prior session in this
  project has held.
- Do not duplicate the panel's markup instead of sharing the component —
  the whole point is one component, two call sites, so future fixes to it
  apply everywhere automatically.

---

## 5. Item 4 — Map toolbar: Layout, Filters, Export

### What it is (current state)

The Map's toolbar currently has only a search box and a "Fit graph"
button. The reference shows a toolbar with Layout / Filters / Export as
additional controls.

### What it should be, and how to build each piece

**Filters** — reuse the exact category-filter pattern already built and
working on the Vault list screen, applied here to which map nodes are
visible. This is the lowest-risk of the three: existing pattern, existing
data, just a new consumer of it.

**Export** — export the current map view as a PNG image of what's on
screen. If exporting the underlying relationship data as CSV turns out to
be genuinely trivial on top of the PNG export, include it; if it adds real
complexity, skip it and note that rather than forcing it in.

**Layout** — do not build a dropdown that implies full layout flexibility
if only one layout actually exists. Offer the current organic
(phyllotaxis) layout plus exactly one real alternative — something like a
simple grid or hierarchical arrangement is enough to make the control
meaningfully functional. If building a genuine second layout algorithm
turns out to be disproportionate effort for this pass, say so explicitly
and flag it rather than shipping a dropdown with only one working option
dressed up as a menu — a control that implies choice but doesn't deliver
it is exactly the kind of fabricated-functionality trap this project's
reference manifest has warned against from the start.

### Guardrails
- Every control added must actually do something real. No decorative
  toolbar buttons.

---

## 6. Item 5 — Settings: one continuous page with a synced nav

### What it is (current state)

Settings currently works as separate tab-swapped screens — clicking
"Security" replaces the visible content with only the Security section;
"General," "Vault," "Appearance," etc. are not visible at the same time.

### What it should be

One continuous, scrollable page containing every section in order. The top
tab row stays, but becomes a **synced navigation aid**, not a
content-switcher: clicking a tab smooth-scrolls the page to that section;
scrolling manually updates which tab is shown as active. This is a
standard "scrollspy" pattern (typically built with
`IntersectionObserver` watching each section's position).

### How to build it

1. Remove the conditional-render-per-tab logic; render every section's
   content in one continuous scrollable container, in the same order the
   tabs currently imply.
2. Add an `IntersectionObserver` (or equivalent) watching each section;
   update the active tab indicator based on which section is most in view.
3. Wire each tab's click handler to smooth-scroll to its section instead
   of switching visible content.
4. No new settings content or fields — this is purely a structural/
   navigational change to how the existing sections are presented.
5. Confirm this doesn't break anything for keyboard navigation or screen
   readers — a scrollspy pattern needs the tabs to remain properly
   focusable and the active state to be conveyed accessibly (e.g.
   `aria-current`), not just visually.

### Guardrails
- Do not change what any individual settings section contains or does —
  this item is presentation/navigation only.

---

## 7. Explicitly out of scope for this pass

- **Multi-profile vault** (personal vault + separate client/work profiles
  under one master password) — a real, good idea raised in the same
  conversation as this pass, but not started here. It needs an actual
  schema change (accounts belonging to a profile) and touches every
  screen, and getting it wrong has a real consequence (data bleeding
  between profiles), so it needs its own dedicated plan the way the
  Relationships screen got one — not a line item here.
  **This is gated on one open design question the owner hasn't answered
  yet: should a relationship ever be allowed to cross profiles (e.g. a
  personal email used as the recovery contact on a client account), or
  should profiles be fully walled off from each other with no connections
  possible between them at all?** Do not start this item, do not guess at
  an answer, and do not build anything that assumes one answer over the
  other (e.g. don't add a "profile" field to Account speculatively).
- The "You" identity hub, Person/Device/Organization entity types,
  Phone/Location/Member-since fields — same standing exclusion as every
  prior session, for the same reason (no data model for it, and building
  the chrome without the function would be fabricated UI).
- Anything from the 1.0 Final list (Windows Hello, code signing,
  auto-updater, mobile app, passkeys, device authorization).
- Installer rebuild — not needed for this pass; these are renderer-only
  changes, verifiable in the dev browser and (for a final check) the
  already-installed native app without a fresh build.

---

## 8. Testing protocol

For every item: reproduce the issue live in the running app first (dev
browser with `?seed=1` is sufficient for all five items — none of this
pass touches anything native-only), fix it, verify live after, screenshot
both states. Then run the full gate suite:

```
npm test
cargo test
tsc --noEmit
npm run build
npm audit --omit=dev
cargo audit
cargo clippy --all-targets
```

Plus the standard secret-pattern grep across `src/` and `dist/`. `cargo
test` should be unchanged from before this pass — nothing here should
touch `src-tauri/`; if it comes back different, that's a signal something
went out of scope.

---

## 9. Final report — required, written to the repo root

File: `ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md`, at the repo root.
Self-contained — do not assume this plan doc still exists when it's read.

Must include:
1. Starting HEAD, ending HEAD, commit list.
2. **Item 1**: the full per-icon verdict table from Step 2, the wiring-bug
   findings from Step 3 (if any), the prototype comparison from Step 4 (if
   it happened), and the explicit decision from Step 5 — not just "icons
   improved."
3. **Item 2**: the specific typography problems found, listed before the
   fixes applied.
4. **Item 3**: confirmation the shared component is genuinely reused (not
   duplicated) across both screens, and that Map-specific behaviors
   (focus-dimming, search, fit-graph) were re-verified working.
5. **Item 4**: which of Layout/Filters/Export shipped fully functional,
   and an explicit flag if Layout's second algorithm was judged
   disproportionate and scoped down.
6. **Item 5**: confirmation the scrollspy pattern works both by clicking a
   tab and by manual scroll, and that keyboard/screen-reader accessibility
   was checked, not assumed.
7. Exact gate results, before/after screenshots for every item, path
   noted.
8. Scope confirmation: no 1.0 Final work, no vault-crypto changes, no
   multi-profile work started, no Person/Device/Organization/"You" hub
   additions.
9. "Left for your call" — anything genuinely ambiguous, plus a clear
   restatement of the open multi-profile design question from Section 7
   so it isn't lost once this doc is gone.
