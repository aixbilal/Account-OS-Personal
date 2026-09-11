# Account OS V3 — UI Correction & Enhancement: Final Report

Date: 2026-09-12. This report is self-contained: it does not assume the
master plan doc (`ACCOUNT-OS-V3-UI-CORRECTION-MASTER-PLAN.md`) still
exists, and restates every decision's reasoning inline.

All 7 phases were completed in one sitting.

## 1. Commits

- **Starting HEAD**: `0741973` (`docs: 2026-09-11 walkthrough for the security-ledger cleanup`)
- **Ending HEAD**: `b654580` (`docs(v3): update checkpoint/continuation docs to HEAD 32f18f7`)
- Branch: `v3-design-intelligence`. Tree clean throughout; nothing pushed to origin (owner's call, per this project's standing convention).

Commits, oldest to newest:

| Commit | Summary |
|---|---|
| `a30a94b` | docs: add the UI correction master plan to the repo root |
| `5622fae` | Phase 1 — re-extract the light palette, scaffold dark companion tokens |
| `c1d081e` | Phase 2 — fix the real-icon matching bug (PayPal etc.) |
| `a129758` | Phase 3 — restyle the Vault inspector |
| `abc4fe7` | Phase 4 — flatten the Add/Edit form, live password-strength checklist |
| `bd6ba88` | Phase 5 — new Relationships screen |
| `b3fac75` | Phase 6 — restyle the Map |
| `6e4c624` | Phase 7 backend — real device/storage facts, vault deletion |
| `af7578f` | Phase 7 frontend — Settings System/Danger Zone, a dark-mode fix |
| `6e0923c` | docs — Phase 7 walkthrough screenshots |
| `32f18f7` | docs — Phase 7 dark-theme final-regression addendum |
| `b654580` | docs — checkpoint/continuation docs updated to this HEAD |

## 2. Per-phase account

Tags below (`[RESTYLE]`, `[BUG]`, `[NEW CAPABILITY]`, `[DO NOT COPY]`) are
restated from the plan's own scope classification, so the reasoning
travels with this report.

### Phase 1 — Design tokens

**Did**: Re-sampled the reference PNGs' real pixel colors programmatically
— PowerShell `System.Drawing.Bitmap`, not Python/PIL (no Python
interpreter existed in this environment) — for the primary button
gradient, the account-hero banner wash (4 stops), the category-chip
fill, and the password-strength success green. Updated `src/theme/
tokens.css` values only, added two new token groups
(`--aos-primary-gradient-start/-end`, `--aos-banner-stop-1..4`) plus dark
companions. Documented every value, its source coordinates, and a
dominant-color confidence percentage in `docs/ACCOUNT-OS-V3-DESIGN-
TOKENS.md`.

**Skipped**: nothing from this phase's scope. The plan's own "rough
anchor" colors turned out not to exactly match the real measurements
(e.g. the banner's real left-to-right order is cream→blue→pink→peach, not
blue-first as guessed) — the plan explicitly flagged its anchor as
unconfirmed, so the measured values are what shipped.

**Gate**: green first try. `npm test` 86/86, `cargo test` 26/26 (Rust
untouched), tsc clean, build clean, `npm audit`/`cargo audit` 0 vulns,
clippy clean, secret grep clean.

### Phase 2 — Icon system `[BUG fix]`

**Root cause found**: `ServiceIdentity.tsx` hardcoded a real-icon
allowlist of exactly 10 ids (`priorityServiceIds`); every other catalog
service — PayPal included — fell back to a 2-letter monogram even though
the already-installed `simple-icons@16.30.0` package ships real marks for
dozens more of them.

**Did**: New `src/domain/iconRegistry.ts` statically imports every
catalog id the installed package actually exports (verified
programmatically via `Object.keys(require('simple-icons'))`) — 65
entries. `serviceCatalog.ts` now derives a real visual identity from the
package's own hex/guidelines data for any id the registry covers but
isn't hand-curated; `priorityServiceIds` is now computed from the
catalog itself instead of a literal that could (and did) silently drift.
Also restyled the monogram fallback: each unmatched service's secondary
accent is now a pale tint of its *own* rotating accent color instead of
one flat gray shared by all of them.

**Skipped, deliberately (`[DO NOT COPY]`/scope discipline)**: did not
chase 94/94 real-logo coverage. Microsoft, LinkedIn, Amazon, Adobe, AWS,
Slack, OpenAI, Canva, Disney, Xbox, Nintendo, and several regional
Pakistani banks/telecoms are **verified absent** from the installed
package (confirmed by direct lookup, not assumed) — several of these are
well-documented as removed from Simple Icons after brand takedown
requests. Microsoft and LinkedIn already had hand-built local recognition
marks before this workstream; those are unchanged. No new hand-drawn
marks were invented for the others — that would be asset creation, not a
matching-bug fix.

**Icon coverage on the 20 seeded dev accounts** (measured with a script
against the real resolver, not eyeballed):

| | Real bundled logo (SVG) | Local recognition mark | Generic monogram |
|---|---:|---:|---:|
| Before | 6 | 3 (Microsoft ×2, LinkedIn) | 11 |
| After | 12 | 3 (unchanged) | 5 |

The 5 remaining monogram accounts: Android Device (not a real catalog
service — a device, not something with a domain), Slack, University
Portal (a placeholder name, not a real service), Monzo, Fastmail — Slack
and Fastmail are real brands but confirmed absent from the installed
package; the catalog itself has no PayPal-style bug left for them to hit.

**Gate**: green after adding tests. `npm test` 91/91 (2 new test files
added regression coverage for the fix), tsc clean, build clean (+56 KB
gzip for ~55 more bundled icon SVGs — a real, expected tradeoff for the
fix, not a regression), audits/clippy/secret-grep clean.

### Phase 3 — Vault list + Inspector `[RESTYLE, BUG]`

**Did**:
- Banner: the hero watermark now shows the account's real bundled logo
  (when Phase 2 resolved one) instead of always the 2-letter monogram;
  the wash uses the Phase 1 `--aos-banner-stop-*` tokens.
- Un-boxed the credential fields: removed the outer card border/shadow
  and the vertical divider between the two columns. Measured directly
  from a crop of reference `04`: it has only a full-bleed horizontal
  hairline between rows, no vertical rule and no outer box.
- Copy/Open buttons `[RESTYLE]`: the password field's Copy button now
  carries its text label (was icon-only); added a real "Open website"
  button (normalizes a bare domain to `https://`, refuses anything that
  isn't a plain http(s) URL, opens via `window.open` with
  `noopener,noreferrer`). The reference uses **Open**, not Copy, for the
  website row, so Copy-website was not added alongside it.
- Added the inspector header's "•••" overflow menu next to Edit, with
  the one real action the plan allowed for it: **Delete account** (reuses
  the vault's existing delete path and the same confirm-dialog pattern
  already used in the Add/Edit sheet — no new deletion logic).

**Skipped, deliberately**:
- The relationship-card copy (short label, e.g. "Depends on") was **kept
  as-is**, per the plan's own instruction — it already reads better than
  the reference's full sentence.
- The "stored locally and encrypted" reassurance banner already existed;
  nothing to add.
- Category is **intentionally still a plain read-only field**, not the
  reference's dropdown-styled box. The reference draws it with a select
  affordance (chevron included), which would visually claim inline
  category editing that isn't wired to anything — building the chrome
  without the function would be a fabricated control, which the ground
  rules explicitly rule out. Logged under "left for your call" below.

**Gate**: green. `npm test` 91/91, tsc/build/audits/clippy/secret-grep
clean. Live walkthrough (seeded vault): PayPal/Steam/Vercel etc. show
real logos in the banner watermark too; Copy/Open/overflow all function;
zero console errors.

### Phase 4 — Add/Edit Account `[RESTYLE, BUG, small logic]`

**Did**:
- Removed the "More details" progressive-disclosure toggle; Category,
  Authentication method, 2FA, Recovery information, and Notes are now
  always visible, matching the reference's flat layout. Added caption
  text under Service/Account title/Username, measured verbatim from the
  reference.
- **`[BUG]` fix**: a real, live password-strength checklist (12
  characters / uppercase / lowercase / numbers / symbols) —
  `src/domain/passwordStrength.ts`, unit tested. It's purely
  informational and never blocks saving, so the "Password / sensitive
  value" field still works for non-password secrets — the plan explicitly
  required this.
- **2FA `[RESTYLE + small logic]`**: replaced the single free-text field
  with a type dropdown (None/Authenticator app/SMS/Email code/Security
  key/Backup codes/Other) plus a free-text detail field with a
  type-specific placeholder. The vault schema is **unchanged** — the two
  UI fields combine into the existing single `twoFactorInformation`
  string on save and parse back into type+detail on load
  (`src/domain/twoFactorFormat.ts`, unit tested). Pre-existing freeform
  values (e.g. the seed's "Authenticator app + printed backup codes")
  round-trip byte-for-byte under type "Other" — verified both by a unit
  test and live, by opening the seeded GitHub account.
- Restyled the password row to match the reference exactly: Reveal,
  Generate, and Copy are three separate bordered controls (previously
  merged into one bordered box), and Generate/Copy now carry text labels.

**Skipped**: nothing from this phase's Do list.

**Gate — one real regression found and fixed**: nesting the new caption
text inside the same `<label>` as the input changed the input's
accessible name (e.g. "Account title" became "Account titleA friendly
name to easily identify this account"), which two pre-existing
`AccountEditor.test.tsx` tests caught immediately by failing. Fixed by
giving `Field`/`SelectField` an explicit `<label htmlFor>` around just
the caption text, with the hint linked via `aria-describedby` instead of
being inside the label. Final state: `npm test` 99/99, tsc/build/audits/
clippy/secret-grep clean. Live walkthrough: the checklist flips all 5
items green on Generate; editing GitHub shows type "Other" with the full
original 2FA text preserved; zero console errors (confirmed in a fresh
tab after a stale-HMR error from mid-edit was ruled out as not
reproducible on reload).

### Phase 5 — Relationships (new screen) `[NEW CAPABILITY — PRE-APPROVED]`

**A note on scope, stated plainly rather than glossed over**: the Screen
Reference Ledger (`docs/15 - DESIGN INTELLIGENCE/02 - SCREEN REFERENCE
LEDGER.md`) lists a dedicated Relationships screen as "planned only, not
a current screen," and `docs/ACCOUNT-OS-V3-SCOPE-CLARITY.md` (written
2026-09-10) called its absence **INTENTIONAL** on exactly that basis. The
ground rules for this workstream state that where the plan and a locked
decision conflict, the locked decision wins and should be logged rather
than silently overridden — but the plan's own Section 3.5 explicitly
carved out this one exception ("this is your sign-off, already given in
this doc. Do not pause to ask; do not expand scope."), i.e. the plan
itself is where that locked-decision update was made. This report logs
the tension rather than pretending it didn't exist; the screen was built
because the document governing this specific workstream explicitly said
to, not because the older ledger was disregarded.

**Did**: a new "Relationships" nav item and screen, built entirely on the
existing `Account`/`AccountRelationship` model:
- Stat cards: Total Accounts / Connected / Isolated, computed from the
  real vault (not fabricated). The reference's "People / Entities" card
  is **omitted**, not stubbed to 0 — there is no Person/Organization
  entity backing it, and a card for a concept the app doesn't have would
  itself be fabricated UI.
- A single-account radial "ego graph": pick a focus account (a dropdown
  defaulting to whichever account has the most connections, so the
  screen opens on something worth looking at) and see just its direct
  connections, labeled by relationship type. The relationship "type"
  field the plan anticipated might need adding **already existed**
  (`RELATIONSHIP_TYPES`/`relationshipTypeLabels`), so no data-model change
  was needed at all. `DependencyMap.tsx` gained an exported
  `buildEgoGraph()` plus exported `mapNodeTypes`/`mapEdgeTypes` so this
  view reuses the exact same node/edge rendering as the full Map, rather
  than a visually distinct duplicate.
- A right panel listing the focused account's connections (click one to
  re-focus on it) and an "Add relationship" button that opens the
  **existing** `RelationshipDialog`, pre-filled — no new relationship
  editing logic was written.

**Skipped, per the plan's explicit scope boundary**: no "You" identity
hub, no Person/Device/Organization entity types, no Graph/List/Matrix
view toggle, no legend beyond the Map's own category dots (added in
Phase 6). All of these appear in reference `08` (the aspirational Map)
and would require new data modeling the plan explicitly puts out of
scope for this entire workstream.

**Done-when criterion, verified against 3 differently-connected seeded
accounts** (live, in the running renderer): Pixel phone (hub, 3
connections to Google/Steam/Everyday bank), Old catch-all mailbox
(one-to-one, 1 connection to PayPal), LinkedIn (isolated, 0 connections)
— all rendered sensibly. Also covered by 13 new unit tests against the
`fakeVault` fixture's own hub (Google, 4 connections) / one-to-one
(GitHub↔Supabase, 2 edges between the same pair) / isolated (Apple, 0)
accounts.

**Gate**: green. `npm test` 108/108, tsc/build/audits/clippy/secret-grep
clean, zero console errors.

### Phase 6 — Map restyle `[RESTYLE, BUG]`

**Did**:
- Phase 1's tokens already flow into the Map automatically (CSS custom
  properties, not hardcoded) — no code change was needed for that part.
- Category color-hint dots (one hue per real `AccountCategory`) plus a
  compact legend, purely visual — no layout change, the existing
  deterministic phyllotaxis position logic and its equality tests are
  untouched.
- **`[BUG]` fix**: the node subtitle's CSS selector (`.map-node span`)
  never matched anything — the markup renders that text as a `<small>` —
  so it silently rendered at the browser's unstyled default instead of
  the intended size/color. Fixed to target the real element. Also
  increased edge-label contrast (opaque surface + full text color instead
  of a secondary/semi-transparent mix) and size.
- The Relationships screen's ego-graph reuses this styling for free
  (shared node renderer).

**Skipped, explicitly**: did not re-touch the prior session's F1
(attribution) or F2 (deselect) fixes. Did not build anything from the
aspirational Map (reference `08`) — no "You" node, no Person/Device/
Organization types.

**Gate**: green. `npm test` 108/108 unchanged (no new logic to test —
this phase is CSS/data-hint only), tsc/build/audits/clippy/secret-grep
clean. Live walkthrough: select/deselect/search/fit-graph all still work;
dots and legend render; zero console errors.

### Phase 7 — Settings, dark theme, final regression `[RESTYLE, BUG, NEW CAPABILITY]`

**Did**, all real, per Section 3.6's "no fabricated devices" rule:
- **Device card**: hostname (`COMPUTERNAME`/`HOSTNAME`), OS (Windows 10
  vs 11 disambiguated via `cmd /c ver`'s build number, since both report
  major.minor `10.0`), and the real app-data path, plus a working "Open
  folder" button (`explorer.exe <path>`, Windows-only — the shipped
  packaging targets Windows x64 only anyway).
- **Delete Vault**: removes the on-disk vault file only
  (`VaultService::delete_vault_file`, reusing the existing storage
  layer's own file-removal and directory-sync patterns — no new
  encryption or atomic-write code was written). Requires an unlocked
  vault; a confirmation dialog gates it; on success the app returns to
  the Create Vault screen.
- **Reset App**: clears the one real client-side preference this app has
  (the appearance theme, via `localStorage`) and restores its default.
  Vault data is never touched. Fully functional in the web renderer too,
  since it's client-side only — verified live.
- **Real vault-file-size display** (`vault_file_size`, formatted B/KB/
  MB/GB), replacing the reference's fabricated "1.2 GB used of 5 GB"
  quota entirely rather than reproducing a number that doesn't exist.
- **Dark theme final regression**: full walkthrough of every screen this
  workstream touched, in both themes. **One real bug found and fixed**:
  the Relationships screen's graph used its own `.relationship-graph`
  wrapper class, but the dark styling for React Flow's zoom controls and
  attribution link was scoped only to `.dependency-map` (the full Map's
  wrapper) — so those controls rendered with xyflow's unstyled white
  default on top of the dark canvas. Fixed by extending the existing
  selectors to cover both wrappers.

**Skipped, per the plan's own optional list**: auto-lock-by-inactivity
and a real clear-clipboard *toggle* (today it's always-on) — the plan
marks both explicitly optional and not required.

**Gate — a real regression found and fixed in the test harness itself**:
`SettingsScreen.test.tsx`'s existing mock for `invoke` used a positional
queue (`mockResolvedValueOnce`/`mockRejectedValueOnce`), which worked
only because every prior test triggered exactly one `invoke` call. The
System tab's new mount-time `device_info`/`vault_file_size` fetches broke
that assumption: 3 tests failed on `expect(invoke).not.toHaveBeenCalled()`
(now legitimately false — mount itself calls invoke) and one on
`toHaveBeenCalledTimes(1)` (now 3, not 1), and — more seriously — a
positional queue meant a test's own `mockRejectedValueOnce` intended for
the rekey call would have silently been consumed by the mount-time
`device_info` call instead, making the *rekey* call succeed when the test
meant it to fail. Fixed by rewriting the mock to be command-name-aware
(`mockInvokeOnce("change_master_password", …)` only intercepts that
command's next call, regardless of what else fires around it) — a more
correct mock of the real always-a-Promise `invoke()` API, not a
workaround. Final state: `npm test` 114/114 (12 new tests: 4 Rust-side
covered separately below, plus 6 new System-tab tests and fixes to the 4
existing rekey tests whose assertions this exposed as brittle), `cargo
test` 30/30 (4 new: `vault_file_size`/`storage_dir`/`delete_vault_file`),
tsc/build clean, `cargo clippy --all-targets` clean, `npm audit`/`cargo
audit` 0 vulnerabilities (cargo audit's 7 allowed warnings are the same
pre-existing set every prior report in this project has recorded — none
introduced here), secret grep clean.

**What could not be verified in this environment, stated plainly rather
than glossed over**: Device details, the real vault size, Open folder,
and Delete Vault are all native-only (the web renderer has no
`__TAURI_INTERNALS__` bridge) — none of these were click-tested against
the actual running desktop app this session, the same limitation every
prior report in this project has recorded for native-only features. They
are covered by 4 new Rust unit tests (`vault.rs`) and 6 new component
tests (`SettingsScreen.test.tsx`) instead. Reset App **was** exercised
live in the renderer, since it's client-side only. This is part of the
owner's native acceptance pass (see `CONTINUE-ACCOUNT-OS.md` section J).

## 3. Dark theme

**Stated plainly, as the ground rules require**: the dark theme is
**newly designed for this project, not extracted** — no dark reference
exists anywhere in `V3 FINAL UI REFERENCES/`; every image there is the
light theme. A dark palette already existed in `tokens.css` before this
workstream (from an earlier session); Phase 1 re-tuned its primary and
success hues to stay in the same family as the newly re-extracted light
values, and added dark companions for the two new Phase 1 token groups.

Contrast ratios (WCAG 2.1, computed programmatically, not eyeballed):

| Pair | Ratio | Verdict |
|---|---|---|
| Dark text (`#eef6ff`) on dark bg (`#0e1827`) | 16.34:1 | AA/AAA |
| Dark primary (`#5aa7ff`) on dark bg | 7.13:1 | AA-normal |
| Dark success (`#3ecf7e`) on dark bg | 8.85:1 | AA-normal |
| Dark danger (`#ff7a82`) on dark bg | 7.09:1 | AA-normal |
| Dark danger on dark surface (`#17263b`) | 6.07:1 | AA-normal |
| Dark text-secondary (`#b6c7dc`) on dark bg | 10.34:1 | AA-normal |
| Light text (`#10254a`) on light bg (`#f6fafe`) | 14.45:1 | AA/AAA |
| Light on-primary (white) on the new light primary (`#2c84fc`) | 3.61:1 | **AA for large/bold text and UI components only, not AA-normal body text** — see caveat below |
| Light primary-hover (`#1c6fe0`) on white (used for plain-weight links) | 4.77:1 | AA-normal |
| Light success-text (`#0d7a3a`) on white | 5.44:1 | AA-normal |
| Light danger (`#d23742`) on white | 4.81:1 | AA-normal |

**The one sub-4.5:1 pair, called out rather than hidden**: the primary
button's white-on-blue text measures 3.61:1, which clears WCAG AA for
large-scale/bold text and non-text UI components (≥3:1) but not AA-normal
body text (≥4.5:1). This is the reference's own extracted color (measured
directly from the button in `04-vault-populated-account-selected.png`,
not chosen independently), and every primary-button label in this app is
bold, icon-accompanied, ~14–15px — a defensible large/bold context. Full
methodology, sample coordinates, and dominant-color confidence
percentages for every token are in `docs/ACCOUNT-OS-V3-DESIGN-TOKENS.md`.

## 4. Screenshots

Fresh, seeded-vault (20 accounts / 15 relationships) walkthrough
screenshots, light and dark, for every screen this workstream touched:

`docs/walkthrough-2026-09-11-phase7/light/`
1. `01-vault-inspector.jpg`
2. `02-add-account-top.jpg`
3. `03-add-account-password-2fa.jpg`
4. `04-add-account-strength-checklist.jpg` (all 5 criteria green)
5. `05-map.jpg`
6. `06-relationships.jpg`
7. `07-settings-system-danger-zone.jpg`

`docs/walkthrough-2026-09-11-phase7/dark/`
1. `01-vault-inspector.jpg`
2. `02-add-account.jpg`
3. `03-map.jpg`
4. `04-relationships.jpg`
5. `05-settings-system-danger-zone.jpg`

## 5. Left for your call

- **Category field in the inspector is read-only**, not the reference's
  dropdown-styled box (Phase 3). Building the select-styled chrome
  without wiring it to a real category-change action would be a
  fabricated control; inline category editing itself was never in any
  phase's Do list. If wanted, it's a small, real, additive change — happy
  to build it on request.
- **The Relationships screen's construction** (Phase 5) — logged in
  detail in that phase's section above. It was pre-authorized by this
  workstream's own governing plan as an explicit, scoped exception to an
  older locked decision; flagged here rather than silently treated as
  uncontroversial.
- **Auto-lock-by-inactivity timer and a real clear-clipboard toggle**
  remain unbuilt — the plan marked both explicitly optional, and neither
  was built. The clipboard auto-clear behavior itself already exists
  (shipped before this workstream); only a user-facing on/off toggle for
  it is absent.
- **Native-only features were not click-tested in the actual desktop
  app**: Change master password (carried over caveat from before this
  workstream), Delete Vault, the Device card's real values, and Open
  Folder — no desktop-automation tool exists in this environment and the
  web renderer has no Tauri bridge. (Reset App *was* exercised live,
  since it's client-side only.) The untested ones are covered by new
  unit/component tests instead; this is the same category of gap every
  prior report in this project has recorded for native-only features,
  not new to this workstream.
- **The primary button's sub-AA-normal text contrast** (3.61:1, AA for
  large/bold only) — see Section 3. It's the reference's own color; flagged
  rather than silently accepted or silently "fixed" by darkening it away
  from what the reference actually shows.
- **The icon fix's remaining monogram accounts** (Slack, Fastmail, and a
  few regional Pakistani banks/telecoms) are real brands the installed
  `simple-icons` package genuinely doesn't ship — not a bug in this
  app's matching logic. Adding hand-drawn local marks for them was
  judged out of scope (asset creation, not a matching fix) — flagged in
  case that judgment call should go the other way.
- If nothing above changes your view of what's needed before native
  acceptance, no further action from this workstream is pending — the
  next steps are the standing manual gates in `CONTINUE-ACCOUNT-OS.md`
  section J (native visual acceptance, installer smoke, version/publish
  decision).

## 6. Scope confirmation

- **No 1.0 Final work occurred**: no Windows Hello, no OS keystore
  integration, no code signing, no auto-updater, no mobile app, no
  passkeys, no device authorization — none were touched, in whole or in
  part, anywhere in this workstream.
- **No vault encryption, atomic-write primitive, or master-password/
  rekey code was modified.** The one new destructive action (Delete
  Vault) calls a new `delete_vault_file` method that does nothing but
  `fs::remove_file` plus the same directory-sync helper `atomic_write_to`
  already used after every rename — it does not touch key derivation,
  the cipher, or the existing rekey path at all. Reset App is
  `localStorage.removeItem` in the renderer; no Rust code, no vault
  interaction whatsoever.

## 7. Installer artifacts (Phase 7)

Rebuilt 2026-09-12 from HEAD `32f18f7` via `npx tauri build` (exit 0):

| Artifact | Path | Size (bytes) | SHA-256 |
|---|---|---:|---|
| EXE | `src-tauri/target/release/account-os.exe` | 9,711,104 | `d2b52d1b169d49befa3030274a1eba42447c9469988084cd81d1ba0c64d375ba` |
| MSI | `src-tauri/target/release/bundle/msi/Account OS_0.1.0_x64_en-US.msi` | 3,350,528 | `72b342a61230b10ff1491bbd6bf52ae32e35e22be397d7ecf7c679bd51f1d763` |
| NSIS | `src-tauri/target/release/bundle/nsis/Account OS_0.1.0_x64-setup.exe` | 2,247,383 | `4a8a283e209f0e17e3cab714482858cd682a39ec095f45f0064db2c8adc47627` |

x64, unsigned (Windows SmartScreen/reputation warnings expected — no
change to signing status). `src-tauri/target/` is gitignored; these
files are not committed. Full detail in
`docs/ACCOUNT-OS-V3-RELEASE-MANIFEST.md`.

## 8. On the master plan doc

`ACCOUNT-OS-V3-UI-CORRECTION-MASTER-PLAN.md` at the repo root said it
"may be deleted" once this report exists. This report was written to
stand on its own without it, per that instruction — but the deletion
itself was left to the owner rather than done here, since removing a
committed doc is a judgment call about the repo's history, not something
this report's own completion requires.
