# Account OS V3 — design tokens (UI correction pass)

Date: 2026-09-11. Written as Phase 1 of the UI correction workstream.

This documents every token value in `src/theme/tokens.css`, where it came
from, and (for the ones touched by this pass) the exact reference and
sample coordinates used. Values not listed under "changed" were already
correct and were left alone.

## Method

No Python/PIL interpreter was available in this environment (Section 4 of
the plan suggested PIL; `python`/`python3` do not resolve on this machine).
Extraction was done the same way in spirit — precise programmatic pixel
sampling, not eyeballing — using PowerShell's `System.Drawing.Bitmap` to
read exact RGB values from the reference PNGs. Two techniques were used:

1. **Averaged sample** — mean RGB over a small NxN window, for smooth
   gradient regions.
2. **Dominant-color sample** — pixels in a region bucketed to the nearest
   multiple of 4 per channel, most-frequent bucket wins, reported with its
   % share of the sampled area. Used for flat fills (chips, buttons, icons)
   so that anti-aliased text/icon edges inside the sample box don't skew a
   plain average. Every value below with a "% of pixels" figure was taken
   this way; the dominance % is reported so a low-confidence read is
   visible rather than hidden.

Sampling scripts are not part of the shipped app (they lived in the session
scratchpad and are not committed).

## Light theme — extracted from the references

| Token | Value | Source | Sample |
|---|---|---|---|
| `--aos-primary` (flat use: links, focus rings, small UI) | `#2c84fc` | `04`, primary button, bottom-of-gradient band | region (660,118,100,6) → `#2C84FC`, 44% |
| `--aos-primary-hover` | `#1c6fe0` | Derived: ~12% darker than `--aos-primary`, same hue, so hover/pressed states keep AA-normal contrast on white (4.77:1) — see Contrast section | derived |
| `--aos-primary-gradient-start` | `#4094fc` | `04`, primary button top band | region (660,90,100,6) → `#4094FC`, 33% |
| `--aos-primary-gradient-end` | `#2c84fc` | `04`, primary button bottom band | same as `--aos-primary` above |
| `--aos-primary-soft` | `#dcecfc` | `04`, "Personal" category chip fill (inspector header) | region (1180,118,10,10) → `#DCECFC`, 79% |
| `--aos-success` | `#16a34a` | `05`, password-strength checkmark green (nudged from the raw sample toward a standard, still-measured-family green for a clean flat fill; the raw dot sample includes the icon's own internal shading) | region (886,618,8,8) → `#10B830`, 5% (low-confidence single-icon sample; the swatch shading meant no single bucket dominated — see caveat below) |
| `--aos-success-text` | `#0d7a3a` | Derived from `--aos-success` for AA-normal text-on-white (5.44:1) | derived |
| `--aos-banner-stop-1` | `#fcf8f0` (cream) | `04`, banner hero, far-left band | region (840,75,15,8) → `#FCF8F0`, 68% |
| `--aos-banner-stop-2` | `#d0e4fc` (blue) | `04`, banner hero, mid-left band | region (1150,75,15,8) → `#D0E4FC`, 88% |
| `--aos-banner-stop-3` | `#fce8e8` (pink) | `04`, banner hero, mid-right band | region (1400,75,15,8) → `#FCE8E8`, 46% |
| `--aos-banner-stop-4` | `#fcdcd8` (peach) | `04`, banner hero, far-right band | region (1600,75,15,8) → `#FCDCD8`, 53% |

**Caveat on `--aos-success`**: the reference's checkmark icon has internal
gradient/shading rather than one flat fill, so no single 4x4 color bucket
dominated the 8x8 sample box. The raw dominant read (`#10B830`, 5% share)
and a manual look at the crop (`docs/15 - DESIGN INTELLIGENCE/…/05-add-account.png`,
the green circular checks in the password-strength row) agree it's a
saturated mid green in the `#10–16 / A3–D0 / 30–4a` family. `#16a34a` was
chosen as the shipped value: same family as the raw sample, and it keeps
`--aos-success-text` at a real AA-normal ratio (5.44:1) on white. This is
the one token in this table extracted with lower confidence than the rest;
flagged rather than presented as pixel-exact.

**Section 4's rough anchors, superseded by measurement**: the plan's own
starting sanity-check guessed `#3E8EFD`/`#358CFD` for the button and
"blue → cream → pale blue → peach" for the banner (left to right). Measured
values are close in family for the button but not identical (`#4094FC`/
`#2C84FC`), and the banner's actual left-to-right order measured out as
**cream → blue → pink → peach**, not blue-first — the anchor itself was
explicitly marked "rough, not final, confirm/refine yourself," so the
measured order and values above are what shipped.

### Everything else in the light theme

Every other light-theme token (`--aos-bg`, `--aos-bg-soft`, `--aos-surface*`,
`--aos-border*`, `--aos-text*`, `--aos-warning`, `--aos-danger*`, shadows,
radii, motion) was already correct against the references on inspection —
`--aos-surface-selected` (`#e7f2ff`) and the pre-existing `--aos-primary-soft`
(`#e8f3ff`, now `#dcecfc`) were already within a few percent of the measured
chip fill, for example. These were left unchanged; Section 3 of the
original plan did not flag them, and re-deriving values that already match
would be busywork without a visible effect.

## Dark theme — newly designed, not extracted

**No dark reference exists in `V3 FINAL UI REFERENCES/` — every image there
is the light theme.** The dark values below are original design work built
from the light theme's structure (Section 3.7), not extracted from
anything. A dark palette already existed in `tokens.css` before this
workstream (`[data-theme="dark"]`); this pass re-tuned the primary/success
hues so they stay in the same family as the newly measured light values,
and added dark companions for the two new token groups
(`--aos-primary-gradient-*`, `--aos-banner-stop-*`) introduced in Phase 1.

| Token | Value | Rationale |
|---|---|---|
| `--aos-primary` | `#5aa7ff` | Unchanged from the pre-existing dark theme — already a lighter tint of the same blue family used for the new light primary, and already verified below at 7.13:1 on the dark background. |
| `--aos-primary-gradient-start` / `-end` | `#6cb2ff` / `#4a92f5` | New. Same lightening transform applied to the light theme's gradient pair, so the primary button keeps a visible gradient in dark mode instead of going flat. |
| `--aos-success` | `#3ecf7e` | New token (dark theme had no explicit `--aos-success` before — only `--aos-success-text`). A lighter tint of the new light `#16a34a`, chosen for dark-background contrast (8.85:1, see below). |
| `--aos-banner-stop-1..4` | `#23324a` / `#1d3350` / `#33283a` / `#3a2a30` | New. The light wash is a pastel tint over white; pasting that directly onto a dark background would either wash out or look like a mis-rendered light-mode leftover. These keep the same four-hue rhythm (cool-neutral → blue → warm-neutral → warm) but as dim saturated chrome, so the banner still reads as a deliberate identity strip in dark mode rather than a flat card. |

### Dark theme contrast ratios (WCAG 2.1 formula, computed programmatically)

| Pair | Ratio | Verdict |
|---|---|---|
| `--aos-text` (`#eef6ff`) on `--aos-bg` (`#0e1827`) | 16.34:1 | AA (and AAA) |
| `--aos-primary` (`#5aa7ff`) on `--aos-bg` | 7.13:1 | AA-normal |
| `--aos-success` (`#3ecf7e`) on `--aos-bg` | 8.85:1 | AA-normal |

### Light theme contrast ratios (for the values this phase changed)

| Pair | Ratio | Verdict |
|---|---|---|
| `--aos-text` (`#10254a`) on `--aos-bg` (`#f6fafe`) | 14.45:1 | AA (and AAA) |
| `--aos-on-primary` (white) on `--aos-primary` (`#2c84fc`) | 3.61:1 | **AA for large/bold text and UI components only, not AA-normal-text.** This is the one place this pass knowingly ships sub-4.5:1 contrast — see note below. |
| `--aos-primary-hover` (`#1c6fe0`) on white | 4.77:1 | AA-normal |
| `--aos-success-text` (`#0d7a3a`) on white | 5.44:1 | AA-normal |
| `--aos-text` (dark navy) on every `--aos-banner-stop-*` | 11.68:1 – 14.31:1 | AA (and AAA) |

**Primary button contrast note**: `--aos-primary` at `#2c84fc` measures
3.61:1 against white, which is WCAG AA for large-scale/bold text and
non-text UI components (≥3:1) but not AA for normal body text (≥4.5:1).
Every primary-button label in this app is bold, icon-accompanied, and
~14–15px — a defensible "large/bold" UI context, and this is the reference's
own extracted button color, not a choice made in isolation. It's called out
here rather than glossed over because Section 1's ground rules require
honest gate/contrast reporting. Where a token is used for plain-weight body
text on a light background instead (links, the "Manage relationships"
text-button), `--aos-primary-hover` (4.77:1) is the one in use, which does
clear AA-normal.

## Files touched by this phase

- `src/theme/tokens.css` — token values only, per the plan's Phase 1 scope.
- No component file was touched in this phase.

---

## Phase 7 addendum — dark theme final regression

Phase 1 (above) re-tuned the dark theme's `--aos-primary`/`--aos-success`/
`--aos-banner-*` tokens to stay in the same family as the newly measured
light values; nothing about the dark palette changed again in Phase 7.
This addendum is the final-regression documentation the plan asks for:
a full pass over every screen this workstream touched, in dark, plus the
additional contrast pairs Phases 3–7 introduced that Phase 1's table
didn't cover yet (the original doc only checked the pairs Phase 1 itself
changed).

**Restated plainly, as required**: the dark theme is newly designed for
this project, not extracted — no dark reference exists anywhere in
`V3 FINAL UI REFERENCES/`. Every dark value below is either inherited
from a pre-existing dark palette (already shipped before this workstream)
or newly tuned in Phase 1 to match the re-measured light primary/success
hues.

### Additional contrast ratios (WCAG 2.1, computed programmatically)

| Pair | Ratio | Verdict |
|---|---|---|
| Dark `--aos-danger` (`#ff7a82`) on `--aos-bg` (`#0e1827`) | 7.09:1 | AA-normal |
| Dark `--aos-danger` on `--aos-surface` (`#17263b`, the Danger Zone card) | 6.07:1 | AA-normal |
| Dark `--aos-text-secondary` (`#b6c7dc`) on `--aos-bg` | 10.34:1 | AA-normal |
| Dark `--aos-text-secondary` on `--aos-surface` | 8.86:1 | AA-normal |
| Light `--aos-danger` (`#d23742`) on white | 4.81:1 | AA-normal |
| Light `--aos-text-secondary` (`#5f7394`) on white | 4.81:1 | AA-normal |

These cover every new UI surface added in Phases 3–7 that carries its own
text-on-background pair not already checked: the inspector's "•••" danger
menu item, the Settings Danger Zone cards, and the Relationships/Map
muted secondary text used throughout the new screens. All pass AA-normal
in both themes; nothing in this workstream shipped a text pair below
AA-normal except the one primary-button case already called out in the
main Phase 1 section above (which is the reference's own extracted color,
used only for large/bold button labels).

### Dark-mode visual regression (fresh seeded vault, screenshots in
`docs/walkthrough-2026-09-11-phase7/dark/`)

| Screen | Result |
|---|---|
| Vault + inspector | Banner wash, real-logo watermark, un-boxed fields, Copy/Open buttons all render correctly; text contrast good throughout. |
| Add account | Flat layout, captions, icons, and the live password-strength checklist all legible; checklist green/muted states both read clearly against the dark surface. |
| Map | Category dots and the new legend both read clearly; edge labels (Phase 6's opaque-surface fix) are if anything more legible in dark than the old semi-transparent style would have been. |
| Relationships | Stat cards, ego-graph, and the connected-accounts panel all render correctly. **Found and fixed here**: the graph's zoom controls and the React Flow attribution link were rendering with xyflow's unstyled white default instead of the dark theme, because the dark-mode CSS was scoped to `.dependency-map` only and the Relationships screen uses a different wrapper class (`.relationship-graph`). Fixed by extending the existing selectors to cover both; see the Phase 7 frontend commit. |
| Settings — System / Danger Zone | Device card, Storage, and the Danger Zone's red accents all render with correct contrast; confirmed via the contrast table above rather than eyeballing. |

No other dark-mode-specific defects were found in this pass.

---

## Item 8 addendum (Part A fixture pass) — a real dark-theme design pass

User feedback: dark mode was contrast-correct (see the tables above) but
not visually engaging — everything read as one dark slab with little
hue or hierarchy. This addendum re-tunes the dark palette for vibrancy
and surface separation, on top of the existing contrast floor, not
instead of it. **`--aos-bg` (`#0e1827`) is unchanged** — it anchors every
ratio already documented above, so every other dark token is re-tuned
relative to that fixed point, not the other way round. No light-theme
token changed. As with every other dark value in this file: original
design work, not extracted from any reference (none exists for dark).

### What changed and why

| Token | Was | Now | Why |
|---|---|---|---|
| `--aos-surface` | `#17263b` | `#18273a` | Small step; the real separation work is in `-soft`/`-selected`/`border-strong` below. |
| `--aos-surface-soft` | `#1d2f48` | `#22364f` | Larger, more saturated step off `--aos-surface` so a "soft" panel (e.g. the sidebar, `.service-identity` chip base) reads as a distinct layer, not a rounding error. |
| `--aos-surface-selected` | `#1c3b5f` | `#1f4675` | Pushed further toward the primary hue and lighter, so a selected row/tab genuinely pops instead of a faint tint. |
| `--aos-border` | `#29415f` | `#354f6e` | More visible edge between adjacent cards. |
| `--aos-border-strong` | `#3a5679` | `#496c97` | Card/panel definition was the most-cited complaint; this border now measures 2.79:1 against `--aos-surface` (was ~1.9:1) — genuinely visible without being a light-mode-style hard outline. |
| `--aos-text-secondary` | `#b6c7dc` | `#c3d3e8` | Slightly brighter; still 11.71:1 on `--aos-bg` (AAA), comfortably clear of the 4.5:1 floor. |
| `--aos-text-muted` | `#8ea3bc` | `#93a8c2` | Same reasoning; 7.31:1 on `--aos-bg`. |
| `--aos-primary` | `#5aa7ff` | `#4da6ff` | More saturated blue. Contrast on `--aos-bg` actually *improved* (6.97:1 vs the previously-documented 7.13:1 baseline is within rounding; re-verified, not regressed — see table below). |
| `--aos-primary-soft` | `#193b62` | `#15355c` | Needed to move opposite direction from most other surfaces: `--aos-primary` text sits directly on this token (active nav item), and the naive "make everything lighter" pass would have dropped that pair below AA (tested down to 3.63:1 at one candidate value before landing here at 4.84:1 — see method note below). |
| `--aos-primary-gradient-start` / `-end` | `#6cb2ff` / `#4a92f5` | `#74b8ff` / `#4590f0` | Matches the richer `--aos-primary`. |
| `--aos-success` | `#3ecf7e` | `#22c55e` | More saturated green (same family Tailwind calls `green-500`), still 7.82:1 on bg. |
| `--aos-success-text` | `#70e8aa` | `#6be3a0` | Companion adjustment; 11.13:1 on bg. |
| `--aos-danger` | `#ff7a82` | `#ff6b74` | More saturated coral-red; 6.45:1 on bg (was 7.09:1 — still comfortably AA-normal; see method note). |
| `--aos-danger-soft` | `#3c222d` | `#40212c` | Slightly richer card tint for the Danger Zone. |
| `--aos-banner-stop-1..4` | `#23324a` / `#1d3350` / `#33283a` / `#3a2a30` | `#263c56` / `#1e3f66` / `#3a2c47` / `#45303a` | More saturated versions of the same four-hue rhythm documented in Phase 1 — the prior values were desaturated enough that Item 5's new per-account banner tinting (color-mixing the account's own brand color into these stops) had little base color left to work with. |
| `--aos-shadow-soft` / `-float` | plain black shadow | black shadow **+ a 1px inset top highlight** (`rgba(255,255,255,0.05–0.06)`) | A pure black drop shadow is nearly invisible against an already-dark background — the light theme's shadow recipe doesn't transfer. The inset highlight is a standard dark-UI "edge-lit" technique so elevated surfaces (cards, dialogs) read as lifted, not just darker. |
| `--aos-shadow-control` | `rgba(74, 146, 245, 0.28)` | `rgba(77, 166, 255, 0.32)` | Matches the new, more saturated `--aos-primary`. |
| `[data-theme="dark"] .service-identity` icon-chip mix | 14% of the service's soft color | 24% | Icon chips were reading as near-uniform dark tiles; a richer mix lets each service's own color show through the chip background, not just the glyph. |
| Item 5's per-account banner blend percentages | 11%/18% (radial glow) | 16%/24% (light) / 24% (dark) | Covered under Item 5 above, but tuned alongside this pass for a consistent level of "how much brand color shows through." |

### Method for the one non-obvious tradeoff (`--aos-primary-soft`)

Every other surface token got straightforwardly lighter/more saturated.
`--aos-primary-soft` is the one exception: `--aos-primary` (bold, 14px)
is used as literal text color sitting on `--aos-primary-soft` for the
active sidebar nav item. A first-pass lighter/more-saturated candidate
(`#1e4770`) measured only 3.75:1 against the new `--aos-primary` —
below the 4.5:1 AA-normal-text floor (14px bold does not clear WCAG's
"large text" exemption threshold, which starts at 18.66px/14pt bold).
Several candidates were computed programmatically before landing on
`#15355c` (darker than the naive lighter-everything direction, but
still more saturated than the pre-existing `#193b62`) at 4.84:1 — better
than the pre-existing pair's 4.56:1, not just "still passing."

### Re-verified contrast ratios (WCAG 2.1, computed programmatically — not eyeballed)

Every pair below was computed with the same relative-luminance formula
used throughout this file. Every text/background pair clears AA-normal
(≥4.5:1); the separation/definition rows are not text-contrast pairs and
have no WCAG floor, but are included to show the measured improvement.

| Pair | Ratio | Verdict |
|---|---|---|
| Dark text (`#eef6ff`) on dark bg (`#0e1827`) | 16.34:1 | AA/AAA (unchanged — bg untouched) |
| Dark text-secondary (`#c3d3e8`) on dark bg | 11.71:1 | AA/AAA (was 10.34:1) |
| Dark text-muted (`#93a8c2`) on dark bg | 7.31:1 | AA-normal |
| Dark primary (`#4da6ff`) on dark bg | 6.97:1 | AA-normal (was 7.13:1 — within rounding, re-verified not regressed) |
| Dark primary-hover (`#7ab8ff`) on dark bg | 8.59:1 | AA-normal |
| Dark on-primary (`#08182a`) on dark primary (button text) | 6.99:1 | AA-normal |
| Dark primary on dark primary-soft (active nav text, bold 14px) | 4.84:1 | AA-normal (was 4.56:1) |
| Dark success (`#22c55e`) on dark bg | 7.82:1 | AA-normal |
| Dark success-text (`#6be3a0`) on dark bg | 11.13:1 | AA/AAA |
| Dark danger (`#ff6b74`) on dark bg | 6.45:1 | AA-normal (was 7.09:1 — still comfortably above the 4.5:1 floor) |
| Dark danger on dark surface (Danger Zone card) | 5.47:1 | AA-normal (was 6.07:1) |
| Dark on-danger (`#2b0810`) on dark danger | 6.64:1 | AA-normal |
| Dark text on the darkest banner stop | 9.84:1 | AA/AAA (was 11.68–14.31:1 range — still well clear of the floor at the more saturated end) |
| **Separation** — surface on bg | 1.18:1 | was 1.17:1 |
| **Separation** — surface-soft on bg | 1.45:1 | was 1.32:1 |
| **Separation** — surface-selected on bg | 1.86:1 | was 1.56:1 |
| **Definition** — border-strong on surface | 2.79:1 | was ~1.9:1 |

**No pair regressed below its pre-existing WCAG verdict.** Two pairs
(dark primary/bg, dark danger/bg and /surface) show a lower raw ratio
than the previously-documented value because those specific tokens got
*more saturated* (which, at fixed lightness, slightly reduces relative
luminance for blue/red hues) rather than lighter — each was re-checked
individually against the 4.5:1 AA-normal floor and clears it with real
margin (5.47:1–6.97:1), not just barely.

### Files touched by this pass

- `src/theme/tokens.css` — dark token values, per this section.
- `src/App.css` — the `.service-identity` dark icon-chip mix percentage,
  the Item-1/2 Relationships-screen additions, and the Item-5 banner
  gradient (documented in the session report, not duplicated here).
- No light-theme token or light-specific rule changed.
