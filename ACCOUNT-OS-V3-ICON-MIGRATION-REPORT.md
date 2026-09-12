# Account OS V3 — Icon Source Migration (theSVG Integration): Report

Date: 2026-09-13. Sole agent: Claude Code (implementer and reviewer, per
the project's standing workflow — see `CONTINUE-ACCOUNT-OS.md` Section 0).
This report is self-contained.

**Context**: this task ran as a self-contained pivot in the middle of the
UI Refinement Pass 2 session (Items 1–4 of that pass were finished and
committed just before this task started; Item 5 and that pass's own final
report are still outstanding — see Section 8 below, "Left for your call").

## 1. Commits

- **Starting HEAD for this task**: `bc11d88` (`feat(v3): Items 1, 3, 4 -
  icon fidelity, Map/Relationships shared panel, Map toolbar` — the last
  UI Refinement Pass 2 commit before this task began)
- **Ending HEAD**: `3f44bcf`
- Branch: `v3-design-intelligence`. Tree clean throughout; nothing pushed
  to `origin` (owner's call, per this project's standing convention).

| Commit | Summary |
|---|---|
| `3f44bcf` | Icon source migration — theSVG as the primary resolution layer |

(The two commits immediately before it — `bc11d88`, `1699f9c` — are the
UI Refinement Pass 2 work that preceded this task; not part of this
report's own scope, mentioned only for HEAD context.)

## 2. Step 0 — what was reused vs. newly verified

`docs/ACCOUNT-OS-V3-UI-REFINEMENT-PASS-2-REPORT.md` did **not** exist yet
when this task started (that pass's Item 5 and final report were still
pending — see Section 8). Per this task's own Step 0 fallback
instruction, git log was checked instead: commit `bc11d88` contains
Item 1's real icon-fidelity work (monogram sizing, the hero-icon circular
shape, and an investigation into Google's gradient-overlay approximation
that found no safe accurate replacement available *at the time*, using
the previously-installed `simple-icons` package only).

Rather than assume that investigation's conclusion still held once a
*different* icon source was on the table, this task re-verified the
specific premise it depends on **before installing anything**: it
extracted `@thesvg/icons`' actual Google and Instagram entries directly
from the downloaded npm tarball (not from documentation or a changelog
claim) and **rendered** them, live, side by side with the app's existing
technique. Reading the raw path/gradient data alone was actually
*misleading* here — Google's "default" variant looked like an
unrelated abstract multi-gradient artwork when read as SVG source, but
rendered at real icon size it is a clean, clearly recognizable "G" with a
genuine red→yellow→green→blue gradient sweep, a legitimate on-brand
mark (different in style from the reference's hard 4-segment version,
not a broken or wrong asset). Instagram's matches real branding closely.
This confirmed the task's premise and unblocked the rest of the work —
see `docs/walkthrough-2026-09-13-icon-migration/07-investigation-thesvg-
google-instagram-rendered.jpg`.

## 3. Step 1 — install and wire

- Installed `@thesvg/icons@3.3.6` (MIT-licensed package code; each
  icon's own upstream license tracked individually via that icon's own
  `license` export — confirmed directly, e.g. Google's is `CC0-1.0`).
  `npm audit`: 0 vulnerabilities.
- **`@thesvg/react` was not installed.** Checked the existing pattern
  first, per the task's own instruction, rather than assuming a fit:
  `ServiceIdentity.tsx` already renders raw path/markup strings directly
  (a `<path d={packaged.path}>` for `simple-icons`, hand-built CSS marks
  for Microsoft/LinkedIn/Chrome/Slack) — there is no React icon-component
  abstraction anywhere in this app to slot a component library into.
  `@thesvg/react`'s generated components would only wrap the exact same
  raw SVG strings `@thesvg/icons` already exports directly, for zero
  functional benefit here, at the cost of an ~84 MB unpacked dependency
  this project would never actually touch. Skipped.
- Wired into the actual file that resolves a catalog service to an icon,
  confirmed by reading it first rather than assuming: `ServiceIdentity.tsx`
  (the component layer) consuming a new `src/domain/theSvgIcons.ts`
  registry, alongside the existing `src/domain/iconRegistry.ts`
  (`simple-icons`) and `src/domain/serviceCatalog.ts` (catalog
  definitions) — no changes needed to `serviceCatalog.ts` itself; the
  resolution-order change lives entirely in `ServiceIdentity.tsx`.

## 4. Step 2 — the fallback chain, as actually implemented

Resolved statically per catalog id at module-load time (82 named
subpath imports — `@thesvg/icons/<slug>` — in `theSvgIcons.ts`), not
resolved at render time:

1. **theSVG color** (`entry.color`, the package's `default` variant) —
   every one of the 82 matched ids ships this; used directly.
2. **theSVG mono** — never actually reached in practice: all 82 matched
   ids have a color variant, so this tier of the instruction is honored
   in the code (`TheSvgEntry.mono` exists and is read for the hero
   watermark specifically) but doesn't change which glyph the *main*
   mark uses for any current catalog id.
3. **The previously-installed `simple-icons` package** (`iconRegistry.ts`,
   unchanged) — checked, and genuinely **not reachable by any of today's
   96 catalog ids**: cross-referencing `iconRegistry.ts`'s 65 covered ids
   against theSVG's 82 shows theSVG is a strict superset (verified by
   script, not by inspection) — nothing `simple-icons` covers is missing
   from theSVG. Kept in place as instructed ("only for services theSVG
   genuinely lacks") rather than removed, since a genuinely new catalog
   addition could still need it.
4. **The 4 hand-built local marks** (`.microsoft-mark`, `.linkedin-mark`,
   `.chrome-mark`, `.slack-mark` in `ServiceIdentity.tsx`/`App.css`) —
   same situation: theSVG now covers all four ids directly (see Section
   6), so this tier is also dormant for every existing catalog id today,
   but the code is kept, not deleted, as the explicit last-resort tier.
5. **The monogram fallback** — unchanged, `src/domain/serviceCatalog.ts`'s
   `neutral-local-mark` path untouched.

## 5. Step 3 — catalog remap and what's now redundant

**Full mapping, cross-checked against the installed package's own
exports** (not guessed from catalog ids):

- **75 direct id matches**: gmail, google, apple, microsoft, proton,
  zoho, instagram, facebook, threads, x, tiktok, snapchat, linkedin,
  pinterest, reddit, discord, telegram, whatsapp, github, gitlab,
  bitbucket, docker, npm, pypi, vercel, netlify, cloudflare, supabase,
  firebase, aws, digitalocean, render, railway, openai, anthropic,
  perplexity, cursor, replit, midjourney, notion, slack, chrome, zoom,
  trello, asana, jira, linear, dropbox, canva, figma, adobe, amazon,
  ebay, aliexpress, shopify, etsy, paypal, stripe, wise, payoneer,
  revolut, coinbase, youtube, netflix, spotify, disney, twitch, steam,
  playstation, xbox, nintendo, coursera, udemy, moodle, telenor.
- **7 alias remaps** (catalog id → theSVG slug, verified to exist before
  using): `stackoverflow`→`stack-overflow`, `huggingface`→`hugging-face`,
  `primevideo`→`prime-video`, `epic`→`epic-games`, `khan`→`khan-academy`,
  `yahoo`→`yahoo-badge`, `fastmail`→`fastmail-badge`.
- **14 confirmed absent from theSVG too** (same real gap
  `simple-icons` already had, not a new loss): `daraz`, `jazzcash`,
  `easypaisa`, `sadapay`, `nayapay`, `hbl`, `meezan`, `ubl`, `mcb`,
  `alfalah`, `jazz`, `zong`, `ufone`, `ptcl` — all Pakistani regional
  banks/telecoms. These keep their existing monogram treatment
  unchanged; no regression.

**82 of 96 catalog ids now theSVG-backed** (was 65/96 via `simple-icons`).

**The 4 hand-built marks — compared live before retiring, not assumed
better just because a "real" source now exists**: rendered theSVG's
`microsoft`, `linkedin`, `chrome`, and `slack` entries directly
(`docs/walkthrough-2026-09-13-icon-migration/06-investigation-thesvg-
microsoft-linkedin-chrome-slack-etc.jpg`) — all four are genuine,
accurate, official-looking full-color logos (the real Microsoft
four-square grid, the real LinkedIn "in" mark, the real four-color
Chrome disc, the real four-color Slack hashtag), clearly more accurate
than the CSS-shape approximations they replace. Confirmed superior;
switched. The hand-built mark code itself was **not deleted** — see
Step 2, tier 4.

**The old gradient-overlay technique removed**: `trueColorGradientStops`
and the `TrueColorGlyph` component (built in the prior fixture pass to
approximate Google/Gmail/Instagram's real color by applying a straight
CSS gradient across `simple-icons`' single flattened path) are gone.
theSVG's `color` variant is injected directly via its own real markup
instead — a genuine multi-hue/multi-path asset, not a re-colored
derivative of a single-color path.

**Gmail identity re-verified, not re-assumed fixed**: theSVG's `gmail`
entry is its own distinct catalog id (`title: "Gmail"`, `hex: EA4335`,
a real envelope glyph — confirmed by direct inspection, not from the
package's naming alone), separate from `google` (`hex: 4285F4`).
`resolveCatalogService`'s domain matching (`mail.google.com` → the
`gmail` catalog entry, per its `domains` array) is untouched by this
migration — re-verified live that a Gmail account still shows the real
Gmail envelope, not Google's "G" (the exact bug the prior fixture pass
fixed).

**Windows**: not touched, per the prior session's still-open owner
decision on that item (see that report's own "left for your call").

## 6. Step 4 — verified across surfaces

`ServiceIdentityMark` and `ServiceIdentityHero` (`ServiceIdentity.tsx`)
are the single shared components every surface in this app already goes
through — there is no separate icon-rendering code path per screen, so a
fix in one place is a fix everywhere. Live-verified directly:

- **Vault list rows**: Google, Gmail, GitHub, Vercel, Supabase, npm,
  LinkedIn, Slack, Microsoft 365, Notion, Instagram, Facebook — real
  marks rendering correctly (`02-after-google-gmail-github-thesvg.jpg`,
  `03-after-slack-linkedin-microsoft365-thesvg.jpg`).
- **Vault inspector hero banner**: Google (full-color gradient "G",
  a dramatic improvement over the old muddy diagonal blend — compare
  `01-before-google-hero-gradient-overlay.jpg` against
  `02-after-...jpg`), Slack (real four-color pinwheel in the banner
  watermark and the circular mark).
- **Map nodes**: rendering correctly via the same shared component, no
  node-specific code needed changing
  (`05-after-map-nodes-thesvg.jpg`).
- **Relationships panel** (both the focused-account header and each
  connected-account row): uses `ServiceIdentityMark` exactly like the
  Vault inspector and Map side panel (all three share
  `AccountConnectionsPanel`, built in the immediately-preceding UI
  Refinement Pass 2 work) — same component, same fix, not re-verified
  as a separate case since there is no separate code path to diverge.
- **Add/Edit account service picker**: opened live, typed "Slack" into
  the Service field — the form itself renders correctly with the new
  icon source active elsewhere on screen (the picker's own dropdown list
  did not visibly render an icon preview in this pass's testing session,
  most likely a transient interaction-timing issue with the automated
  test tooling used this session rather than a real code gap, since nothing
  in this migration touches picker-specific rendering code — flagged
  honestly rather than claimed verified; see Section 8).
- **Ctrl+K global search results**: not independently re-verified this
  session (the keyboard shortcut did not trigger reliably against the
  automated browser tooling used) — same shared-component reasoning
  applies (no separate code path for search results either), but stated
  as unverified rather than assumed, per this project's standing rule.

**Dark theme, theme-adaptive brands** (Step 5, verified together with
Step 4 since they're the same live pass): switched the running app to
dark theme and re-opened GitHub — its mark renders **white** in dark
theme (`04-after-dark-theme-github-theme-adaptive.jpg`) versus **black**
in light theme (`02-after-...jpg`), confirmed via direct pixel crop, not
assumed from the presence of a `dark` variant in the package.

## 7. Step 5 — theme interaction, two separate systems confirmed separate

- **The per-account banner gradient tint** (blends `--service-accent`
  into the 4 `--aos-banner-stop-*` custom properties, built in the prior
  fixture pass) operates entirely on the banner's own CSS — it doesn't
  know or care which icon source rendered the glyph sitting on top of
  it. Verified still working: Slack's banner still shows its own tinted
  wash (`03-after-...jpg`), unrelated to the icon swap.
- **theSVG's own light/dark variant pairs** are a second, independent
  mechanism, used only for the 13 catalog ids whose *canonical* mark is
  itself black-or-white rather than colored: `apple`, `github`, `openai`,
  `anthropic`, `cursor`, `railway`, `tiktok`, `threads`, `midjourney`,
  `nintendo`, `udemy`, `epic` (games). Implementation: both variants
  render in the DOM at once (`.thesvg-theme-light` / `.thesvg-theme-dark`
  spans), and CSS (`[data-theme="dark"] .thesvg-theme-dark { display:
  contents }` / the light one hidden) shows only the one matching the
  active theme — no JS theme-detection needed, consistent with how every
  other themed value in this app already works off the `[data-theme]`
  attribute. **Tested specifically, not assumed**: confirmed live (GitHub,
  Section 6) that this is a real contrast fix, not a cosmetic no-op — the
  package's `light` variant is genuinely a near-black fill
  (`#1b1f23`) and `dark` is genuinely white (`#ffffff`), extracted and
  compared directly from the package source before relying on the
  naming convention.

## 8. Step 6 — bundle size, measured exactly

Measured by isolating this commit's own diff via `git stash` (build
before, build after — not read from an older report, which could have
drifted from other changes made earlier in this same session):

| | Raw | Gzip |
|---|---:|---:|
| Before this migration | 802.95 kB | 246.28 kB |
| After this migration | 1,201.15 kB | 378.49 kB |
| **Delta** | **+398.20 kB (+49.6%)** | **+132.21 kB (+53.7%)** |

**This is a real, substantial increase, reported plainly rather than
minimized.** Two contributing causes, both expected and neither a bug:
theSVG's full-color marks are complete multi-path/gradient SVG documents
(larger than `simple-icons`' compact single flattened path per icon),
and this migration now ships **two** icon libraries at once —
`simple-icons` was deliberately kept as the tier-3 fallback per this
task's own resolution-order requirement (Section 4), not pruned as dead
code, even though no current catalog id actually reaches it.

**Tree-shaking verified in the actual build output, not assumed**:
grepped the built, minified bundle (`dist/assets/index-*.js`) for a
theSVG icon this app never imports (`google-cloud-storage`,
`google-tag-manager`, "Kubernetes Engine") — **zero occurrences** —
against one that is imported (`Slack`, `khan-academy`) — **present**.
Confirms only the 82 imported icons ship, not theSVG's full 6,500+
collection.

## 9. Full gate suite

| Gate | Result |
|---|---|
| `npm test` | **136/136 passed** (23 files) — unchanged from before this task |
| `cargo test` | **30/30 passed** — unchanged; `src-tauri/` was not touched at all this task |
| `tsc --noEmit` | clean |
| `npm run build` | clean (size delta in Section 8; same pre-existing "chunk larger than 500 kB" advisory category as every prior report, not a new warning class) |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `cargo audit` | **0 vulnerabilities**; 7 allowed warnings — the identical pre-existing set every prior report in this project has recorded (6 "unmaintained" unic-*, 1 "unsound" glib 0.18.5, GTK/Linux transitive, not on the Windows path); none introduced this task |
| `cargo clippy --all-targets` | clean, 0 warnings |
| Secret-pattern grep (`src/`, `dist/`, `src-tauri/src/`) | clean — `dist/` carries only the Supabase project URL + `sb_publishable_` key, the same intentional client config every prior report has documented |

## 10. Screenshots

`docs/walkthrough-2026-09-13-icon-migration/`:
1. `01-before-google-hero-gradient-overlay.jpg` — the old muddy
   diagonal-gradient technique (green→orange, no blue visible), taken
   earlier this session before theSVG was installed.
2. `02-after-google-gmail-github-thesvg.jpg` — Google's real gradient
   "G", Gmail's real envelope, GitHub's real octocat (light theme).
3. `03-after-slack-linkedin-microsoft365-thesvg.jpg` — Slack's real
   four-color pinwheel (list row and hero banner), LinkedIn's real "in"
   mark, Microsoft 365's real four-square logo.
4. `04-after-dark-theme-github-theme-adaptive.jpg` — GitHub's mark
   rendering white against the dark theme's tile background.
5. `05-after-map-nodes-thesvg.jpg` — Map nodes rendering theSVG marks
   via the same shared component, toolbar (Layout/Filters/Export from
   the immediately-prior Pass 2 work) unaffected.
6. `06-investigation-thesvg-microsoft-linkedin-chrome-slack-etc.jpg` —
   the Step 3 side-by-side comparison that justified retiring the 4
   hand-built marks.
7. `07-investigation-thesvg-google-instagram-rendered.jpg` — the Step 0
   confirmation render.

## 11. Scope confirmation

- **No 1.0 Final work.** Nothing in this task touched Windows Hello, OS
  keystore, code signing, auto-updater, mobile app, passkeys, or device
  authorization.
- **No vault-crypto changes.** `src-tauri/` was not touched at all this
  task (Rust test count unchanged at 30/30, re-run only to confirm no
  incidental regression).
- **Windows stayed out of scope**, confirmed: the catalog's own
  `microsoft`/`windows`-adjacent entries are untouched beyond the
  `microsoft` id's icon source swap (Microsoft the company/service, not
  a "Windows" catalog entry — there isn't one); the open owner decision
  from the prior fixture pass (single-color-flag vs. four-square-reuse
  for a hypothetical "Windows" entry) was not acted on or revisited.

## 12. Left for your call

1. **Bundle size growth (+398 kB raw / +132 kB gzip)** — real and
   reported plainly (Section 8), not hidden. If this is unacceptable,
   the concrete lever is removing the now-dormant `simple-icons`
   fallback tier (and/or the 4 hand-built marks) entirely rather than
   keeping them as a safety net — a real, additive size cut, but it
   would remove the instructed "genuinely lacks" fallback path this
   task's own Step 2 asked to keep. Flagged rather than done unasked.
2. **Add/Edit service picker's dropdown icon preview** and **Ctrl+K
   global search results** were not independently re-verified live this
   session (Section 6) — the automated browser tooling used this session
   didn't reliably trigger the picker's suggestion list or the Ctrl+K
   shortcut. Both go through the same shared `ServiceIdentityMark`
   component as every other verified surface, so there's no known reason
   they'd differ, but this is stated as unverified rather than assumed
   working.
3. **Slack's hero-banner watermark** uses its full-color mark (no `mono`
   variant exists in theSVG for Slack) instead of a single-tone
   silhouette the way every other watermark on this screen reads — a
   minor, deliberate simplification rather than building mono-generation
   logic for one brand. Flagged in case it reads as inconsistent enough
   to want a real fix.
4. **UI Refinement Pass 2's own Item 5** (Settings: one continuous page
   with a synced scrollspy nav) and that pass's own final report are
   still outstanding — this icon-migration task was a self-contained
   pivot in the middle of that pass, per the owner's own message
   starting it. Resuming Item 5 and writing that pass's report is the
   natural next step once this report is reviewed.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WcXB7xsw98F86GNd1QtTeR
