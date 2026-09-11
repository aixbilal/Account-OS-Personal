# Account OS V3 — UI Correction & Enhancement: Master Implementation Plan

**This is the only document you need to execute this entire workstream.**
Read it fully, once, before writing any code. Do not wait for further chat
prompts between phases — work through Phase 1 → 7 in order, in one sitting
if possible, committing after each phase. Only stop early if a gate
genuinely cannot be made to pass after real effort, or a phase's own
"if blocked" instruction tells you to stop that phase specifically.

At the end (whether you complete all 7 phases or stop partway), produce the
report specified in Section 7 at the repo root. This doc may be deleted
after that report exists — so the report must stand on its own and must
not say "see the plan doc for details."

---

## 0. Before you start

Read these, in full, in this order:

1. `CONTINUE-ACCOUNT-OS.md`
2. `account-os-checkpoint.json`
3. `docs/ACCOUNT-OS-V3-SCOPE-CLARITY.md`
4. The most recent `docs/ACCOUNT-OS-V3-WALKTHROUGH-*.md`
5. Every file listed in Section 2 below

Then:
```
git status -sb
git log --oneline -8
```
Confirm a clean tree and that HEAD matches what the most recent report in
`docs/` says it should be. If it doesn't, STOP and describe what you find
instead of assuming it's safe to build on.

---

## 1. Ground rules — non-negotiable for this entire workstream

- **Do not invent unsupported functionality merely because a reference
  image contains it.** This is the reference pack's own stated rule
  (`00-REFERENCE-MANIFEST.md`). Every task below has already been checked
  against this rule — if you find yourself wanting to add something not
  explicitly listed in a phase's "Do" section because "the reference shows
  it," stop and log it under "left for your call" in the final report
  instead of building it.
- Every previously **locked decision** (DI-012, the Component Matrix, the
  Screen Reference Ledger, anything else in
  `docs/ACCOUNT-OS-V3-SCOPE-CLARITY.md`) still stands. This plan does not
  override any of them. Where this plan and a locked decision seem to
  conflict, the locked decision wins — stop and log it.
- **No 1.0 Final work, ever, in this workstream.** No Windows Hello, OS
  keystore, code signing, auto-updater, mobile app, passkeys, device
  authorization. Not even a small piece of one. This applies regardless of
  anything a reference image seems to suggest.
- **Never modify vault encryption, the atomic-write primitive, or the
  master-password/rekey code as part of this workstream.** Where a task
  needs a new destructive file action (Delete Vault, Reset App — see Phase
  7), it must reuse the existing atomic-safe patterns already in the
  codebase, not invent new ones.
- You are the sole implementer and reviewer (Codex is no longer part of
  this project — see `CONTINUE-ACCOUNT-OS.md` section 0 if present). Be
  conservative: prefer a small proven change over a clever one, and prefer
  flagging a genuinely ambiguous call over guessing.
- Commit small and often — one commit per logical change within a phase,
  never one giant commit per phase.
- Never report a gate, a test, or a visual match as passing if it didn't
  actually run or you didn't actually verify it. If something can't be
  verified in this environment (e.g. anything requiring the native
  installed app, not the dev/browser renderer), say so explicitly, the same
  way every prior report in this project has.
- If a gate fails because of a change you made, fix it before moving to
  the next phase. Do not report a phase done with a known-failing gate.

---

## 2. Reference materials

All reference images live at:
```
C:\Account OS\docs\15 - DESIGN INTELLIGENCE\V3 FINAL UI REFERENCES
```

| File | What it shows |
|---|---|
| `00-REFERENCE-MANIFEST.md` | The rules governing all references below — read first |
| `01 - MAIN SCREENS\01-create-vault-light.png` | Create vault (light) |
| `01 - MAIN SCREENS\02-unlock-vault-light.png` | Unlock vault (light) |
| `01 - MAIN SCREENS\03-vault-empty-state.png` | Empty vault onboarding |
| `01 - MAIN SCREENS\04-vault-populated-account-selected.png` | Vault list + inspector detail — **primary reference for Phase 3** |
| `01 - MAIN SCREENS\05-add-account.png` | Add account form — **primary reference for Phase 4** |
| `01 - MAIN SCREENS\06-edit-account.png` | Edit account form — **Phase 4** |
| `01 - MAIN SCREENS\07-manage-relationships-reference.png` | Dedicated Relationships screen — **primary reference for Phase 5** |
| `01 - MAIN SCREENS\08-map.png` | Full aspirational Map (see Phase 6 note — do NOT build this literally) |
| `01 - MAIN SCREENS\09-settings.png` | Settings incl. Danger Zone/Device/Storage — **primary reference for Phase 7** |
| `02 - DIALOGS & EDGE STATES\10-dialogs-and-edge-states-reference.png` | 16 dialog/edge-state mockups — cross-cutting; reconcile the relevant panel whenever you touch a matching dialog in any phase (Add/Manage Relationship dialogs in Phase 5, Delete Account confirm in Phase 3, Create/Unlock/Backup/Discard/Loading/Error states in Phase 7's regression pass) |

---

## 3. Known problems — the full diff, tagged

Tags used throughout this doc:
- **[RESTYLE]** — safe, visual/structural only, no new data or logic
- **[BUG]** — currently broken relative to the app's own intent, not just "doesn't match reference"
- **[NEW CAPABILITY — PRE-APPROVED, SCOPE FIXED]** — genuinely new functionality, but the scope boundary below has already been decided; do not expand it
- **[DO NOT COPY]** — this reference element is fabricated or out of scope; explicitly skip it

### 3.1 Vault list + Inspector (ref `04`)

| Element | Current | Reference | Action |
|---|---|---|---|
| Banner | Flat gradient + giant faint **initials** watermark ("PA") | Soft multi-hue pastel wash + faint **real logo** watermark | [RESTYLE] |
| Field layout | Each field in its own bordered/shaded box | One continuous panel, thin dividers only | [RESTYLE] |
| Copy/Open buttons | Icon-only | Icon + visible text label | [RESTYLE] |
| Relationship card copy | Full descriptive sentence ("PayPal draws from the everyday bank account") | Short label only ("Depends on") | **Keep current — it's better. Do not regress this to match reference.** |
| "•••" overflow menu on inspector header | Absent | Present next to Edit | [RESTYLE] — only add if there's a real action to put in it (e.g. Delete, once Phase 7 exists); do not ship an empty menu |

### 3.2 Icons

| Element | Current | Reference | Action |
|---|---|---|---|
| Major-brand matching | PayPal (and likely other common services) render as a 2-letter monogram instead of their real logo | Real, recognizable brand logos for common services | [BUG] — find and fix the matching failure for known-major brands first |
| Fallback monogram styling | Flat, dull | Reference's own unmatched-service example (`10`, panel 7, "Discord" → "DS") is still clean/legible | [RESTYLE] — improve monogram color/weight; do not attempt 94/94 real-logo coverage as a goal in itself |

### 3.3 Add/Edit Account (ref `05`, `06`)

| Element | Current | Reference | Action |
|---|---|---|---|
| Field visibility | Progressive disclosure — most fields hidden behind "More details" | All fields flat/visible, each with a caption under its label | [RESTYLE] |
| Password strength | No validation feedback | Live checklist: 12 chars / uppercase / lowercase / numbers / symbols, each with a checkmark | [BUG] — this is real logic that doesn't exist, not styling |
| 2FA field | Plain free-text fill-in | Type dropdown ("Authenticator app") + a free-text example field | [RESTYLE] + small logic |
| Generator/Copy buttons | Icon-only | Icon + visible text label | [RESTYLE] |
| Blur-over-background effect on the modal | Present | Present | **Already correct — keep exactly as is.** |
| Email/Website format validation | None (known F3 side effect, already documented) | N/A in this reference | Optional, not required by this plan — see Section 5 note |

### 3.4 Map (ref `08`) — read this one carefully

The reference Map shows a "You" identity hub with Phone/Location/Member-since
fields, and Person/Device/Organization as distinct entity types with their
own profiles. **This requires new data modeling the app does not have today
— it is out of scope for this entire plan.** Nothing in Phase 6 below
attempts it. If you find yourself wanting to add a "You" node, a Person
entity, or a Device entity as part of Phase 6, stop — that's scope creep
into a decision that hasn't been made, not a restyle.

What Phase 6 *does* do: restyle the existing all-accounts map with the new
tokens/icons, improve label legibility, and optionally group nodes by
existing category as a purely visual aid — nothing that requires a new
entity type.

### 3.5 Relationships (ref `07`) — new screen, scope is fixed below

Reference 07 shows a dedicated **Relationships** nav item/screen: stat cards
(Total Accounts / Connected / Isolated / People-Entities), a
pick-one-account radial view showing just that account's direct connections
with labeled edges ("Uses", "Shares login", "Owns"), and a right panel with
connected-accounts list.

**[NEW CAPABILITY — PRE-APPROVED, SCOPE FIXED]** — this is genuinely new
(a new nav item, new screen), but it is fully buildable on the Account +
Relationship data that already exists, and the scope is pre-approved as
written in Phase 5. Do not expand it to include the "You"/Person/Device/
Organization concepts from 3.4 — that stays out, even though both
references come from the same mockup set. If the labeled-edge text needs
a relationship "type" field that doesn't exist in the data model yet, adding
that one field is in scope; inventing new entity types is not.

The "People/Entities" stat card in the reference implies a Person/
Organization concept — **skip that specific stat card**, or compute it as
0 / hide it, rather than inventing the underlying entities to feed it.

### 3.6 Settings (ref `09`)

| Element | Verdict | Action |
|---|---|---|
| Device card (hostname, OS, real app-data path, "Open folder") | Every value is real and already knowable | [RESTYLE] + small logic — build it |
| Delete Vault | Already flagged as a real, small, missing gap in `SCOPE-CLARITY.md` | [BUG] — build it |
| Reset App (clear settings, keep vault) | New, small, doesn't touch vault/crypto | [NEW CAPABILITY — PRE-APPROVED, SCOPE FIXED] — build it |
| Storage: "1.2GB used of 5GB" | No real 5GB quota exists anywhere in this app | [DO NOT COPY] — show real vault file size on disk instead, no fabricated ceiling |
| Auto-lock-by-inactivity timer dropdown | Not implemented anywhere today | [DO NOT COPY as a real feature] — either omit entirely or, if you build it, it must actually function (real inactivity timer that locks the vault), not a decorative dropdown. Treat as optional; not required by this plan. |
| Clear-clipboard toggle | Already implemented, but always-on (not a toggle) | Optional: add a real toggle if trivial; not required by this plan |

### 3.7 Themes

- **Light**: real palette exists in the references — extract precisely (Section 4).
- **Dark**: **no reference exists for this.** This is original design work,
  not extraction. Build it from the light palette's structure, with real
  documented contrast ratios (aim for WCAG AA on text-over-background at
  minimum). Do not present this as "matched to reference" in the report —
  say plainly that it's newly designed, since no reference existed.

---

## 4. Palette extraction

Do your own precise, programmatic extraction from the actual reference
files — do not eyeball coordinates. A starting sanity-check (manually
sampled, approximate, from `04` and cross-referenced against `09`):

- Primary accent blue: ~`#3E8EFD` (button top) fading to ~`#358CFD` (button
  bottom) — confirm/refine this yourself, it's a rough anchor, not final.
- Banner gradient (soft pastel wash, left to right): blue `#7AB6F9` → cream
  `#FDFBF1` → pale blue `#D9EAFD` → peach `#FEEBE3`.
- Category badge / chip background: pale blue, roughly `#E6F0FD`.

Suggested method (Python, PIL is already available in this environment):
```python
from PIL import Image
img = Image.open(r"C:\Account OS\docs\15 - DESIGN INTELLIGENCE\V3 FINAL UI REFERENCES\01 - MAIN SCREENS\04-vault-populated-account-selected.png").convert("RGB")
# crop small regions around each element you need (button, banner strip,
# badge, divider, text colors) and either sample multiple points and
# average, or use img.crop(...).getcolors() to get the dominant color in
# that exact region. Do this for every element in Section 3's tables
# across all 10 reference images, not just 04.
```

Output of this phase: a documented palette (light + newly-designed dark)
written into `tokens.css` and into a short new doc,
`docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md`, recording each token's value and
which reference (or "newly designed, no reference" for dark) it came from.

---

## 5. The seven phases

Each phase's **Definition of Done** requires, at minimum: the phase's own
tasks complete, a walkthrough on the seeded dev vault (`?seed=1`) covering
everything the phase touched, and the full gate suite from Section 6 green.
If a gate fails due to this phase's changes, fix it before proceeding. If a
phase gets genuinely stuck (not just "this is hard" — genuinely blocked on a
decision outside this doc's pre-approved scope), stop *that phase*, write it
into the "left for your call" section of the running report, and continue
to the next phase rather than stalling the whole run.

### Phase 1 — Design tokens (foundation)
**Do:** Extract the real palette per Section 4, from all 10 reference
images. Update `tokens.css` only. Write
`docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md`.
**Do not:** touch any component file this phase.
**Done when:** app renders visually identical to before Phase 1 (since
nothing consumes the new tokens differently yet) but now pulling from the
corrected values; gates green.

### Phase 2 — Icon system
**Do:** Investigate and fix why known major brands (PayPal confirmed;
check others in the 94-service catalog) fall back to monograms instead of
matching their real icon. Restyle the monogram fallback's color/weight.
**Do not:** treat "every service has a real logo" as the goal.
**Done when:** re-seed the dev vault, count how many of the 20 seeded
accounts that *should* have a real logo now do (report the before/after
count); gates green.

### Phase 3 — Vault list + Inspector
**Do:** Banner (real logo watermark, soft gradient per Phase 1 tokens),
un-box fields into a continuous grouped panel, add text labels to icon
buttons, confirm the "stored locally and encrypted" reassurance banner
exists (add it if missing). Reconcile the Delete Account dialog against
reference `10` panel 3 *only if* Delete Account already exists as a flow;
if not, that's Phase 7's job (Delete Vault is a different, vault-level
action — don't confuse the two).
**Do not:** touch the relationship-card copy (Section 3.1 — keep current).
**Done when:** full seeded walkthrough of list/search/filter/inspector/
reveal/copy, zero console errors, gates green.

### Phase 4 — Add/Edit Account
**Do:** Flatten the layout with field captions, build a real live
password-strength checklist (12 chars/upper/lower/numbers/symbols), add the
2FA type dropdown + example field, add text labels to Generate/Copy
buttons.
**Do not:** remove the "Password / sensitive value" flexibility (non-
password secrets must still work) — the strength checklist should apply
sensibly to it without forcing every sensitive value to look like a
password grade.
**Done when:** add + edit + validation-error + strength-checklist all
exercised live on seed data; gates green.

### Phase 5 — Relationships (new screen)
**Scope is fixed by Section 3.5 — this is your sign-off, already given in
this doc. Do not pause to ask; do not expand scope.**
**Do:** New nav item + screen. Stat cards (Total/Connected/Isolated —
computed from real data; omit or zero the People/Entities card, see 3.5).
Radial single-account view: pick an account, show just its direct
connections, labeled edges (add a relationship "type" field if one doesn't
already exist — that specific addition is in scope). Right panel with a
connected-accounts list for the selected account.
**Do not:** build "You", Person, Device, or Organization as entities.
**If genuinely blocked** (e.g. the data model can't support labeled edges
without a change bigger than adding one field): stop this phase, log it
clearly, continue to Phase 6.
**Done when:** build the relationships view for at least 3 differently-
connected seeded accounts (a hub with many connections, a simple one-to-one,
the intentionally isolated account) and confirm each renders sensibly;
gates green.

### Phase 6 — Map restyle
**Do:** Apply Phase 1 tokens/icons to the existing map. Improve label
legibility. Optionally group visually by existing category (color/spatial
hint only, not a new entity type).
**Do not:** re-touch the F1 (attribution) or F2 (deselect) fixes from the
prior session — those stay as they are. Do not build anything from Section
3.4.
**Done when:** same Map walkthrough as before (select/deselect/search/fit),
now restyled, gates green.

### Phase 7 — Settings, dark theme, final regression
**Do:**
- Device card (real hostname/OS/app-data path + working "Open folder").
- Delete Vault action — confirmation dialog, reuses existing atomic-safe
  file patterns, never a new ad hoc deletion path.
- Reset App action (clear settings only, vault data untouched) —
  confirmation dialog.
- Real vault-file-size display, replacing any fabricated storage quota.
- Design and implement the dark theme from scratch (Section 3.7) —
  document contrast ratios in `docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md`.
- **Then**, full final regression: re-seed the dev vault, walk through
  every screen — old and new (Vault, Map, Relationships, Add/Edit,
  Settings) — in both light and dark, take fresh screenshots, run the
  complete gate suite (Section 6), build fresh installers and hash them,
  update `account-os-checkpoint.json` and `CONTINUE-ACCOUNT-OS.md` to true
  new HEAD.
**Do not:** touch vault encryption or the rekey code to implement Delete
Vault/Reset App — reuse what exists.
**Done when:** everything above passes, and the final report (Section 7)
is written.

---

## 6. Gate suite (run at the end of every phase)

```
npm test
cargo test
tsc --noEmit
npm run build
npm audit --omit=dev
cargo audit
cargo clippy --all-targets
```
Plus a secret-pattern grep across `src/` and `dist/` (same pattern used in
every prior session's report). Only Phase 7 additionally needs
`npx tauri build` and fresh SHA-256 hashes, since intermediate phases don't
need a fresh installer each time.

---

## 7. Final report — required, written to the repo root

File: `ACCOUNT-OS-V3-UI-CORRECTION-REPORT.md`, at the repo root (not
`docs/`). Write this once, at the end of the run (whether all 7 phases
completed or you stopped partway) — not once per phase.

Must include, self-contained (this plan doc may not exist anymore by the
time this is read):
1. **Starting HEAD, ending HEAD, list of commits made**, one line each.
2. **Per phase**: what was done, what was explicitly skipped and why
   (referencing the tag from Section 3 — RESTYLE/BUG/NEW CAPABILITY/DO NOT
   COPY — so the reasoning travels with the report even without this doc).
3. **Icon fix**: before/after count of real-logo coverage on the 20 seeded
   accounts.
4. **Exact gate results** for every phase, not just the final one, if any
   phase's gate ever failed and was fixed — note what failed and how it was
   fixed.
5. **Dark theme**: explicitly stated as newly designed, not extracted, with
   the contrast ratios used.
6. **Screenshots**: fresh walkthrough screenshots for every touched screen,
   light and dark, path noted.
7. **Left for your call**: anything skipped as out of scope, anything a
   phase got blocked on, anything you're not fully confident about — same
   honesty standard as every prior report in this project. If nothing
   qualifies, say so explicitly rather than omitting the section.
8. **Scope confirmation**: an explicit line stating no 1.0 Final work and
   no vault-crypto changes occurred, matching Section 1's ground rules.
9. Fresh installer hashes (Phase 7).

Do not reference this plan document anywhere in the report as "see the
plan for details" — every decision's reasoning must be restated briefly
in the report itself, since this file may be deleted afterward.
