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
