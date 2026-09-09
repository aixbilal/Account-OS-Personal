# ACCOUNT OS V3 — OVERNIGHT FINAL IMPLEMENTATION, VERIFICATION & DELIVERY RUNBOOK

> **Execution mode:** autonomous implementation sprint.  
> **Repository:** `C:\Account OS`  
> **Target branch:** `v3-design-intelligence`  
> **Expected local starting HEAD:** `03c14e6` (`feat: polish V3 final account experience`)  
> **Remote branch warning:** GitHub was last observed at `e2f2076`, so the current local work must be pushed immediately after verification.  
> **Target outcome:** one coherent, working, polished **Account OS V3 Stable Candidate** built from the approved light-calm references, with all existing real functionality preserved, all new rendered controls genuinely working, regression tests passing, Windows packages rebuilt, and the branch pushed safely to GitHub.

---

# 0. PRIMARY DIRECTIVE

This is **not** another research, design-exploration, or planning sprint.

Do not return with only:
- a plan,
- a design document,
- screenshots,
- a list of recommendations,
- partial CSS,
- one implemented screen,
- or “ready for owner review.”

You must **implement the complete V3 visual/product layer end-to-end tonight**, verify it, package it, checkpoint it, push it, and report exact evidence.

The approved UI images are the visual authority. The existing code/data/security model is the functional authority.

When those conflict:
1. preserve real functionality and security,
2. preserve data compatibility,
3. reproduce the visual reference as closely as practical,
4. remove/omit any generated-image control that would otherwise be fake,
5. only add a small new capability when explicitly authorized below and fully implemented/tested.

Do **not** invent fake settings, fake entities, fake cloud states, fake device objects, fake people records, fake storage quotas, fake analytics, fake global search, or dead buttons.

---

# 1. FIRST 10 MINUTES — SAFETY, STATE, BACKUP, PUSH

Before modifying source:

## 1.1 Read authoritative project context

Read completely:

- `CONTINUE-ACCOUNT-OS.md`
- `account-os-checkpoint.json`
- `DESIGN.md`
- `docs/15 - DESIGN INTELLIGENCE/00 - DESIGN OS.md`
- `docs/15 - DESIGN INTELLIGENCE/03 - COMPONENT REGISTRY.md`
- `docs/15 - DESIGN INTELLIGENCE/04 - SCREEN RECIPES.md`
- `docs/15 - DESIGN INTELLIGENCE/05 - THEME SYSTEM.md`
- `docs/15 - DESIGN INTELLIGENCE/06 - SERVICE IDENTITY SYSTEM.md`
- `docs/15 - DESIGN INTELLIGENCE/07 - MOTION RULES.md`
- `docs/15 - DESIGN INTELLIGENCE/08 - UI QA CHECKLIST.md`
- `docs/ACCOUNT-OS-V3-FINAL-UX-CORRECTION.md`
- the new reference manifest under `docs/15 - DESIGN INTELLIGENCE/V3 FINAL UI REFERENCES/`

## 1.2 Verify repository state

Run and record:

```powershell
cd "C:\Account OS"
git branch --show-current
git rev-parse HEAD
git status --short
git log -5 --oneline
```

Expected:

- branch: `v3-design-intelligence`
- local HEAD: `03c14e6` or a direct descendant created only for saving the approved visual references
- working tree: clean before implementation

If local HEAD is unexpectedly older than `03c14e6`, **do not overwrite newer work**. Resolve the actual local state first.

## 1.3 Verify approved visual-reference files exist

Expected structure:

```text
C:\Account OS\docs\15 - DESIGN INTELLIGENCE\V3 FINAL UI REFERENCES\
├── 00-REFERENCE-MANIFEST.md
├── 01 - MAIN SCREENS\
│   ├── 01-create-vault-light.png
│   ├── 02-unlock-vault-light.png
│   ├── 03-vault-empty-state.png
│   ├── 04-vault-populated-account-selected.png
│   ├── 05-add-account.png
│   ├── 06-edit-account.png
│   ├── 07-manage-relationships-reference.png
│   ├── 08-map.png
│   └── 09-settings.png
└── 02 - DIALOGS & EDGE STATES\
    └── 10-dialogs-and-edge-states-reference.png
```

If names differ but equivalent approved files exist, locate them and update the manifest. Do not silently substitute old rejected dark/hybrid screenshots.

## 1.4 Protect the work immediately

The remote branch was last observed behind the local work. Once current state is verified and any reference-image-only changes are committed, push **before the main implementation begins**:

```powershell
git push origin v3-design-intelligence
```

If the push fails because authentication/network is unavailable, continue local implementation but keep frequent local commits and retry push after every checkpoint.

Do **not** merge to `main`.
Do **not** tag a release yet.
Do **not** delete or rewrite V1/V2 history.

---

# 2. GROUND TRUTH — EXISTING PRODUCT FUNCTIONALITY

The product already has a real engineering foundation. Preserve it.

Current real application areas:

- local encrypted vault creation
- vault unlock / lock
- account CRUD
- search
- category filtering
- authentication-method filtering
- password/sensitive-value storage
- password generation
- reveal/hide
- copy
- relationship CRUD
- relationship validation / duplicate prevention
- Map using existing account relationships
- encrypted backup export
- encrypted restore/import
- wrong-password rejection
- corrupt/invalid restore non-mutation behavior
- cloud identity / ciphertext-only sync foundation
- offline use
- theme/preferences infrastructure
- Windows/Tauri application packaging

Current account data model includes:

- `serviceName`
- `accountName`
- `category`
- `username`
- `email`
- `password`
- `authenticationMethod`
- `recoveryInformation`
- `twoFactorInformation`
- `notes`
- timestamps / id

Current relationship types are the existing project constants. Do not create new relationship semantics just because a generated image contains words such as “same account,” “uses,” or “owns” unless they map cleanly to the existing real enum.

Current navigation is intentionally:

- Vault
- Map
- Settings

Do **not** create a new permanent “Relationships” page.

---

# 3. APPROVED VISUAL DIRECTION

## 3.1 Signature character

Account OS V3 should feel:

- calm
- premium
- light
- private
- precise
- trustworthy
- desktop-native
- fast to scan
- intentionally minimal
- visually softer than the rejected dark/hybrid build

It must **not** feel like:

- a SaaS analytics dashboard
- an AI dashboard
- a crypto wallet
- a gaming interface
- a generic admin form
- a card wall
- a neon/glow showcase
- a marketing website
- a collection of mismatched component-library demos

## 3.2 Core palette

Create a centralized token layer. Approximate starting values may be tuned against the approved references:

```css
--aos-bg: #f6fafe;
--aos-bg-soft: #eef6fd;
--aos-surface: #ffffff;
--aos-surface-soft: #f4f8fc;
--aos-surface-selected: #e7f2ff;
--aos-border: #dbe8f3;
--aos-border-strong: #c8dceb;
--aos-text: #10254a;
--aos-text-secondary: #5f7394;
--aos-text-muted: #8193ad;
--aos-primary: #2f8cf5;
--aos-primary-hover: #237de4;
--aos-success: #16a765;
--aos-warning: #e7a52b;
--aos-danger: #e34850;
--aos-shadow-soft: 0 14px 36px rgba(47, 89, 132, 0.08);
--aos-shadow-float: 0 20px 50px rgba(47, 89, 132, 0.12);
```

Do not scatter random hex values through unrelated components. Service brand accents are the exception and must come from the local service identity layer.

## 3.3 Geometry

Target:

- inputs: 10–12px radius
- compact cards: 12–14px
- panels/sheets: 16–20px
- thin low-contrast borders
- generous whitespace
- subtle shadows
- no excessive nested boxes

## 3.4 Typography

Use the existing approved typography stack unless the local project already includes a better licensed local font setup.

Hierarchy should be obvious:

- page titles strong and calm
- section headings clearly subordinate
- labels readable, not micro-text
- metadata muted but still accessible
- no low-contrast tiny text that only looks good in screenshots

## 3.5 Motion

- 120–220ms
- easing should be calm
- use motion only for sheet/dialog entry, selection changes, toasts, small state transitions
- respect `prefers-reduced-motion`
- no continuous decorative animation
- no animated secrets

## 3.6 Background decoration

Reproduce the pale blue wave/arc ambience from the approved references using CSS gradients, pseudo-elements, SVG/CSS geometry, or lightweight local assets.

Do not ship giant raster screenshots as application backgrounds.
Do not make decoration intercept pointer events.
Do not reduce readability.

---

# 4. REFERENCE IMAGES — EXACT IMPLEMENTATION MEANING

The images are **visual authority, not permission to invent functionality**.

## 4.1 `01-create-vault-light.png`

Implement:

- full-window calm light background
- Account OS identity
- centered secure panel
- master password
- confirm password
- reveal/hide control
- password-strength feedback for create mode
- inline validation
- primary `Create encrypted vault`
- clear local-first reassurance
- loading/disabled state
- keyboard submission

Do not add fake recovery links.

## 4.2 `02-unlock-vault-light.png`

Implement:

- same visual family as Create Vault
- one master-password field
- reveal/hide
- `Unlock vault`
- inline wrong-password error
- busy state
- focus returns to password field after failure

Do **not** render “Forgot your password?” unless a real tested recovery flow exists. At present it should be omitted.

## 4.3 `03-vault-empty-state.png`

Interpret coherently within the real shell.

Do not create redundant fourth panes.

Use the real layout:

- left app navigation
- account list/search/filter pane
- main content/inspector area

When no accounts exist:

- list pane clearly shows no accounts
- main content displays a polished onboarding empty state inspired by the approved image
- one primary action: `Add first account`
- explain the real benefits briefly: encrypted storage, relationships, local-first
- do not add tutorial complexity

## 4.4 `04-vault-populated-account-selected.png`

This is the primary authority for normal daily usage.

Implement:

- stable navigation
- high-quality account list
- real local service icon
- account title + category
- email/username metadata
- selected-row state
- service-aware account hero/banner
- email/username fields
- password hidden by default
- reveal/hide
- copy
- website only if implemented as a real stored field (see Section 7)
- relationship cards/rows based on real relationships
- notes
- security/2FA state
- explicit Edit button
- no accidental edit-on-click

## 4.5 `05-add-account.png`

Implement as a high-quality right-side sheet/drawer.

Core goals:

- common credential can be saved quickly
- essential fields do not require scrolling at a normal desktop height
- additional metadata is progressively disclosed
- sticky footer actions
- no giant centered administrative form

Essential fields:

- service
- account title
- email
- username (optional)
- password/sensitive value
- website if Section 7 is implemented

Secondary / “More details”:

- category
- authentication method
- 2FA metadata
- recovery information
- notes

Password generation must remain functional but visually compact.

## 4.6 `06-edit-account.png`

Use the same sheet system as Add Account.

Implement:

- populated values
- clear service identity header
- complete edit capability
- Save changes
- Cancel
- Delete account
- unsaved-change protection
- deletion confirmation

Do not hide existing supported fields merely to look cleaner.

## 4.7 `07-manage-relationships-reference.png`

**Do not build the generated full Relationships page.**

Use only its visual language for real existing relationship workflows:

- Add Relationship dialog/sheet
- Edit Relationship dialog/sheet
- Remove Relationship confirmation
- existing account relationship summary in the inspector
- Map-originated relationship creation

## 4.8 `08-map.png`

Use the approved light/premium graph aesthetic, but preserve the real data model.

Do **not** invent:

- “You” person object
- Work/Social/Personal hub entities
- device records
- organizations
- family entities
- fake account counts for generated clusters

Map must display **real accounts as nodes** and **real relationships as edges**.

Use service identity, selection, relationship direction, and layout quality to achieve the reference feeling without fake entities.

## 4.9 `09-settings.png`

Adopt:

- light calm settings layout
- strong section hierarchy
- polished cards/rows
- clear nav between real sections

Render only actual project functionality:

- Appearance
- Security information/controls that really exist
- Data & Recovery
- Connected/cloud sync
- System/About if actual metadata is available

Do not invent:

- fake storage quota
- startup toggle
- tray behavior
- accent chooser
- interface-density control
- update controls
- support links
- device-management actions

unless they are actually implemented and tested in this repository.

## 4.10 `10-dialogs-and-edge-states-reference.png`

Implement only supported real states:

- create-vault validation
- wrong-password unlock state
- no search results
- unknown-service fallback
- copy feedback
- save feedback
- reveal/hide
- unsaved form close
- unsaved lock attempt when relevant
- delete confirmation
- remove relationship confirmation
- backup export status
- restore/import validation/status
- connectivity state
- loading/busy state
- actionable unexpected-error toast/banner

---

# 5. COMPONENT ARCHITECTURE — BUILD ONCE, USE EVERYWHERE

Do not patch each screen with one-off CSS.

Refactor enough to establish reusable UI primitives. Suggested organization; adapt to actual repo structure if a cleaner equivalent already exists:

```text
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── Field.tsx
│   │   ├── SelectField.tsx
│   │   ├── Sheet.tsx
│   │   ├── Dialog.tsx
│   │   ├── ToastProvider.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Spinner.tsx
│   │   └── SectionCard.tsx
│   ├── ServiceIdentity.tsx
│   ├── AccountList.tsx
│   ├── AccountInspector.tsx
│   ├── AccountEditor.tsx
│   ├── RelationshipDialog.tsx
│   └── DependencyMap.tsx
├── theme/
│   ├── tokens.css
│   └── serviceThemes.ts
└── ...
```

This structure is guidance, not a mandatory rename exercise. Do not waste time moving files that already have a clean responsibility.

Minimum primitive behavior:

### Sheet
- fixed right-side desktop panel
- accessible dialog semantics
- focus moves into sheet
- Escape closes unless blocked by unsaved changes
- focus returns to opener
- backdrop click obeys unsaved-change rules
- sticky header/footer
- body scrolls independently only when necessary

### Dialog
- centered
- focus management
- Escape behavior
- clear destructive hierarchy
- no `window.confirm` in final polished flows

### Toast
- status/alert semantics as appropriate
- non-secret messages only
- auto-dismiss
- keyboard/screen-reader safe
- never include password values

---

# 6. DEPENDENCY POLICY — QUALITY WITHOUT LIBRARY BLOAT

Existing checked stack includes:

- React 19
- TypeScript
- Vite
- Tauri 2
- Tailwind CSS 4
- Lucide React
- `@xyflow/react`
- Supabase

The repo already has the tools needed for most of the UI.

Do not add a large UI framework simply because a screenshot resembles it.

## 6.1 shadcn/ui

Use shadcn Sheet/Dialog patterns as **interaction references**, especially for:

- side sheets
- header/body/footer separation
- dialogs

Do not migrate the app wholesale to shadcn tonight.

## 6.2 React Flow

Keep `@xyflow/react`.

Use real custom nodes / custom edges rather than styling the stock demo superficially.

Use:

- custom `nodeTypes`
- custom node component with service icon + title + service/category metadata
- handles only where needed
- custom edge label treatment
- existing `Controls` or restrained custom controls
- `fitView`
- selected node emphasis
- dim unrelated nodes/edges

## 6.3 Graph layout

The current hard-coded 3-column grid is not acceptable for the final Map.

Authorized dependency if needed:

```text
@dagrejs/dagre
```

Use it for deterministic automatic account-node layout because React Flow's own official examples recommend dagre as a simple layouting solution.

Do not use Pro-only copied source.
Do not implement fake clusters/entities.

## 6.4 Service brand icons

The current generic glyph system (`<>`, `≋`, letters, etc.) is not acceptable for recognized services.

Authorized dependency if needed:

```text
simple-icons
```

However:

- Simple Icons package licensing does not automatically grant permission for every individual brand/trademark.
- do not falsify license metadata
- do not claim every icon is CC0
- create/update a local icon manifest containing source/package slug and any known guideline/license status
- where use is uncertain, use the polished local monogram fallback instead of a broken or legally misrepresented brand mark

Runtime must remain local. No remote favicon/icon API.

Do not add Magic UI, Framer Motion, Material UI, Chakra, Ant, or another design system unless absolutely necessary. They are not needed for this sprint.

---

# 7. WEBSITE FIELD — REAL IMPLEMENTATION OR NO UI

The approved account references include a website/domain field, while the earlier checked data model did not have a real `website` property.

This is the one small data-model addition explicitly authorized tonight because it is core password-manager information and the owner already identified its absence as product friction.

Implement it properly, not as a label that displays `serviceName`.

## 7.1 TypeScript

Add an optional/backward-compatible website field to the account model.

Preferred:

```ts
website?: string;
```

or a defaulted string if the existing codebase handles required fields more cleanly.

Update:

- account draft
- create flow
- edit flow
- inspector
- search indexing if appropriate
- fixtures/tests
- service resolution to prefer a real website/domain when available

## 7.2 Rust / serialization compatibility

Add the Rust field with serde backward compatibility, e.g. conceptually:

```rust
#[serde(default)]
pub website: String,
```

Do not break old encrypted vaults that lack the field.

Do not change encryption, KDF, nonce, AAD, or vault envelope behavior.

Do not bump the vault format purely for an additive serde-default field unless existing architecture/tests prove a version bump is required.

Add a Rust compatibility test that loads/deserializes a legacy account payload without `website` and yields an empty website.

## 7.3 Website actions

A displayed action must work.

- `Copy` can always be implemented locally.
- `Open` should be rendered only if a safe tested http/https external-opening path is wired in the native app.
- Reject/suppress dangerous schemes such as `javascript:`.
- If there is no safe native opener configured tonight, omit `Open` rather than shipping a dead control.

---

# 8. SERVICE IDENTITY SYSTEM — COMPLETE IT PROPERLY

Current product value is damaged when Google, Spotify, GitHub, Instagram, etc. render as generic letters/glyphs.

## 8.1 Keep existing 94-service catalog

Do not throw it away.

Extend it with visual identity metadata rather than creating a parallel uncontrolled list.

Suggested metadata:

```ts
interface ServiceVisualIdentity {
  id: string;
  displayName: string;
  primaryAccent: string;
  secondaryAccent?: string;
  iconSlug?: string;
  iconSource: "simple-icons" | "local" | "monogram";
  visualMode: "brand" | "neutral";
}
```

Adapt naming to existing code.

## 8.2 Required release-proof sample

At minimum these must look intentional and recognizable in native review:

- Google
- Spotify
- GitHub
- Instagram
- Microsoft
- Apple
- YouTube
- LinkedIn
- Discord
- Facebook
- unknown/custom service

Do not stop at these if the local registry can safely map more automatically.

## 8.3 Unknown fallback

Unknown service must never look broken.

Use:

- 1–2 letter monogram
- neutral blue-grey tile
- deterministic soft accent
- same spacing as branded icons

## 8.4 Service-aware hero

Selected account hero should use a subtle surface derived from service accents.

Examples:

- Google: soft restrained multicolor/pastel wash
- Spotify: soft green wash
- Instagram: pale pink/purple/orange wash
- GitHub: neutral slate/graphite-on-light wash
- unknown: Account OS blue-grey wash

Do not recolor the entire application.
Do not compromise contrast.
Do not animate continuously.

---

# 9. BATCH 1 — DESIGN FOUNDATION + APP SHELL

Implement first:

- centralized tokens
- calm-light base theme
- sidebar
- navigation state
- panel borders/shadows
- buttons
- form controls
- focus rings
- disabled states
- backdrop
- sheet/dialog primitives
- toast primitive
- reusable service icon container

## Acceptance

- no random old dark/hybrid remnants on primary V3 path
- body/workspace does not flash dark on transition
- keyboard focus is visible
- contrast remains readable
- 1280×720 usable
- 1366×768 usable
- 1440×900 good
- 1920×1080 good
- no horizontal overflow in normal desktop widths

Checkpoint:

```text
ui: establish final V3 calm-light design foundation
```

Run focused tests/build/typecheck, then push branch.

---

# 10. BATCH 2 — CREATE VAULT + UNLOCK VAULT

Rebuild both from the approved references.

## Create Vault

Required:

- correct Account OS identity
- master password
- confirm password
- reveal/hide buttons
- minimum-length validation
- mismatch validation
- strength feedback based on actual entered value
- primary button
- busy state
- inline error state
- no secrets logged

## Unlock

Required:

- one password field
- reveal/hide
- submit
- busy state
- wrong-password error inline
- password cleared according to current security behavior
- focus restored appropriately
- no fake forgot-password link

## Tests

Add/update UI tests for:

- create rejects short password
- create rejects mismatch
- create submit calls correct handler
- unlock failure renders error
- busy state disables duplicate submit
- reveal toggle never changes stored value

Checkpoint:

```text
ui: rebuild V3 create and unlock experience
```

Push.

---

# 11. BATCH 3 — VAULT EMPTY, SEARCH, LIST, NO-SELECTION STATES

## Vault shell

Use stable three-part mental model:

1. app navigation
2. account list/search/filter
3. account content/inspector

Do not create redundant empty panes.

## Empty Vault

- polished onboarding in main content
- one Add First Account CTA
- brief benefit explanation
- list pane still structurally stable

## Search/filter no results

- `No matching accounts`
- clear search/filters action
- do not replace entire app

## List quality

- icon
- account title
- service/email metadata
- category chip only when useful
- strong selected state
- hover/focus state
- no giant row cards

## Tests

- search works
- category filter works
- auth filter works
- combined filters work
- empty state CTA opens editor
- no-results reset works

Checkpoint:

```text
ui: complete final V3 vault shell and empty states
```

Push.

---

# 12. BATCH 4 — WEBSITE + SERVICE IDENTITY + POPULATED INSPECTOR

This is one of the most important batches.

## 12.1 Website compatibility

Implement Section 7 completely before rendering website UI.

## 12.2 Service identity

Replace generic recognized-service glyphs with proper local visual identity.

No remote requests.

## 12.3 Inspector

Match the approved populated Vault reference closely:

- hero banner
- service mark
- account title
- category
- email/username
- password hidden by default
- reveal/hide
- copy
- website
- relationship summary
- notes
- security/2FA metadata
- Edit

Use clean sections and separators rather than excessive cards.

## 12.4 Copy feedback

Use toast/status feedback:

- `Email copied`
- `Username copied`
- `Password copied`
- `Website copied`

Never include copied values in the toast.

## Tests

- known service mapping
- unknown fallback
- no runtime fetch
- website legacy compatibility
- copy calls clipboard only with requested value
- password hidden initially
- reveal/hide
- account click is view-first

Checkpoint:

```text
ui: complete service identity and populated vault inspector
```

Push.

---

# 13. BATCH 5 — ADD ACCOUNT + EDIT ACCOUNT SHEETS

Replace the current giant modal with the approved right-side sheet experience.

## Add Account

Essential top section:

- Service
- Account title
- Email
- Username
- Website
- Password / sensitive value

Password generator should be compact and useful.

Progressive secondary section:

- Category
- Authentication
- 2FA metadata
- Recovery information
- Notes

Rules:

- common save path should fit without internal scrolling at 768px height where practical
- if content must scroll, only sheet body scrolls
- header/footer remain visible
- Save/Cancel sticky
- validation inline
- service datalist/autocomplete preserved or improved

## Edit Account

- same component system
- prefilled data
- delete account action
- complete metadata
- unsaved state detection
- no accidental close losing edits

## Destructive behavior

Replace `window.confirm` with the shared confirmation dialog.

Delete account dialog must state that relationships involving the account will also be removed because that is the actual current behavior.

## Tests

- required fields
- save
- editing existing account
- dirty-close confirmation
- delete confirmation
- delete account removes relationships through existing app behavior
- Escape close behavior
- backdrop close behavior

Checkpoint:

```text
ui: rebuild final V3 account add and edit workflow
```

Push.

---

# 14. BATCH 6 — RELATIONSHIP WORKFLOWS

Do not add a new page.

Build reusable relationship UI using the approved relationship/dialog visual language.

## Add Relationship

Required:

- source account
- relationship type
- target account
- optional notes
- direction preview
- validation
- duplicate rejection surfaced clearly
- save/cancel

## Edit Relationship

Required:

- source/target visible
- type editable as supported
- notes editable
- Save changes
- Remove relationship

## Remove confirmation

- compact destructive dialog
- no `window.confirm`

## Relationship display in inspector

- counterpart service icon
- counterpart account name
- readable relationship label
- direction meaning preserved
- clicking/opening counterpart works only if real handler exists

## Tests

- source cannot equal target
- deleted account cannot be target
- duplicate blocked
- edit persists
- remove persists
- Map-created relationships use same persistence path

Checkpoint:

```text
ui: complete final V3 relationship management experience
```

Push.

---

# 15. BATCH 7 — MAP: REBUILD THE PRESENTATION, KEEP REAL DATA

The Map must stop looking like a stock flowchart demo.

## 15.1 Use React Flow properly

Implement:

- custom node type
- custom edge type or strongly customized edge presentation
- deterministic layout
- service icons
- selected state
- related state
- de-emphasized unrelated state
- search
- filter if current filter has meaningful behavior
- Fit
- inspector
- create relationship action

## 15.2 Layout

Authorized/recommended:

- `@dagrejs/dagre`

Create a layout from real account nodes and existing relationship edges.

Prefer a clean left-to-right or top-to-bottom relationship graph that minimizes overlaps.

Do not create generated-image hubs such as You/Work/Social unless they exist as real Account nodes.

On graph data change, recalculate layout deterministically.

Preserve user pan/zoom interactions sensibly.

## 15.3 Node design

Each node:

- service identity mark
- account title
- service/category secondary line
- compact premium surface
- clear selected ring/glow that remains subtle

## 15.4 Edge design

- directional where relationship is directional
- readable existing relationship type
- labels should not overlap nodes excessively
- selected graph path stronger
- unrelated edges dim
- no decorative animation unless useful and reduced-motion safe

## 15.5 Inspector

When selected:

- service/account identity
- incoming count
- outgoing count
- connected-account list or concise relationship list
- Open in Vault
- Create Relationship

No fake person/device metadata.

## Tests

- graph builder contains every valid account
- ignores invalid orphan edges as current logic does
- selected account sets focus state
- search dims/nonmatches correctly
- relationship composer persists
- Fit works
- no credentials passed into node data

Checkpoint:

```text
ui: rebuild V3 identity map with real account graph
```

Push.

---

# 16. BATCH 8 — SETTINGS

Rebuild Settings using the approved light reference while keeping only real features.

Recommended real section structure:

```text
GENERAL
- Appearance

SECURITY
- local-vault security information
- real lock/clipboard settings only if they truly exist

DATA & RECOVERY
- Export encrypted backup
- Restore encrypted backup

CONNECTED
- existing cloud identity/sync panel

SYSTEM
- app version/build information if available from real metadata
- diagnostics only if real
```

If current project does not actually implement auto-lock or clipboard timeout configuration, do not render toggles pretending it does.

## Appearance

The approved primary V3 look is calm light.

Preserve old persisted theme values safely so existing settings do not crash.

Recommended release behavior:

- `Light` = default/recommended V3 appearance
- keep `Dark` / `System` only if existing behavior remains functional and contrast-safe
- old `hybrid` value should migrate/map safely rather than produce the rejected old hybrid look

Do not spend the night building four independent design systems.

## Backup/restore

Preserve all existing security semantics.

Improve only the presentation:

- clearer file selection
- clearer master-password field
- busy state
- success state
- failure state
- warning that restore changes the local vault according to the actual implementation

Never expose secrets in error messages/logs.

Checkpoint:

```text
ui: complete final V3 settings and recovery presentation
```

Push.

---

# 17. BATCH 9 — EDGE STATES & MICRO-INTERACTIONS

Implement the supported states from the dialog reference board.

Required:

1. create-vault weak/short password
2. create-vault password mismatch
3. unlock failure
4. no search results
5. unknown-service fallback
6. password/email/username/website copied
7. account saved
8. secret reveal/hide
9. unsaved editor close
10. unsaved changes when locking if an editor is open
11. delete account confirm
12. remove relationship confirm
13. backup export busy/success/failure
14. restore busy/success/failure
15. connectivity states based on real state
16. generic operation failure with useful retry only when retry is real

Do not create fake recovery/help actions.

Checkpoint:

```text
ui: finish V3 dialogs feedback and edge states
```

Push.

---

# 18. RESPONSIVENESS / DESKTOP WINDOW BEHAVIOR

This is a Windows desktop product, not a mobile app.

Test these viewport/window classes:

- 1280×720
- 1366×768
- 1440×900
- 1600×900
- 1920×1080

Requirements:

- no clipped primary action
- no horizontal scrollbar under normal usage
- Add/Edit sheets remain operable
- account list remains readable
- inspector adapts
- Map canvas remains useful
- Settings do not create giant dead zones

At narrower supported widths, it is acceptable for inspector/content proportions to change, but functionality must remain available.

---

# 19. ACCESSIBILITY & INTERACTION QUALITY

Must verify:

- all inputs have labels
- icon-only buttons have accessible names
- focus rings visible
- keyboard Tab order logical
- Enter submits when appropriate
- Escape closes dialog/sheet when safe
- focus returns to launcher after close
- dialogs use appropriate semantics
- toasts/status messages use appropriate live regions
- destructive actions are not the default focused action
- color is not the only indicator of selection/error
- reduced motion supported

Do not use accessibility as a reason to replace the approved visuals with generic browser controls; style accessible controls properly.

---

# 20. PRIVACY / SECURITY NON-NEGOTIABLES

This visual sprint must not weaken the security model.

Never:

- send credentials to icon/favicon services
- log master passwords
- log account passwords
- log recovery codes
- log decrypted vault JSON
- place secrets in URLs/query params
- place secret values in toast messages
- expose secret values to analytics
- introduce remote fonts that leak usage if local/system fonts work
- alter Argon2/KDF settings
- alter XChaCha20-Poly1305 behavior
- alter vault AAD
- alter backup encryption behavior
- alter sync ciphertext-only principle

Website opening must restrict to safe web schemes.

Service icons are local at runtime.

All visual QA fixtures must be synthetic.

---

# 21. TESTING STRATEGY — DO NOT JUST RUN OLD TESTS

The final result needs existing regression coverage **plus tests for what changed**.

## 21.1 Frontend automated tests

Run full suite.

Current historical baseline was 57/57; final count may increase.

Add/update tests for:

- create/unlock validation
- password reveal
- account editor dirty state
- website compatibility/display
- service identity mapping/fallback
- no remote icon behavior
- account save/edit/delete
- relationship dialog behavior
- map graph layout builder
- map selection
- no-results state
- toast/status behavior where practical
- theme migration/default behavior

Command:

```powershell
npm test
```

Do not report `57/57` if the suite grows. Report actual result.

## 21.2 TypeScript / production build

```powershell
npm run build
```

Must PASS.

## 21.3 Rust

Run:

```powershell
cd src-tauri
cargo test
```

Historical baseline was 16/16; website compatibility may add tests.

Add at minimum:

- legacy account JSON/vault payload without website still deserializes
- new account with website round-trips

## 21.4 Dependency audit

Run:

```powershell
npm audit
cargo audit
```

If npm audit is environment-blocked again:

- retry after restoring npm cache/log directory/network if possible
- distinguish BLOCKED from FAILED
- do not call it PASS without evidence

For cargo audit, preserve truthful accepted upstream/transitive warnings. Do not hide them.

---

# 22. SYNTHETIC END-TO-END PRODUCT JOURNEY

Use an isolated disposable profile. Never use the owner's default/private vault.

Create a synthetic vault and perform this exact sequence:

1. Create Vault
2. lock
3. unlock
4. add Google account
5. add Spotify account
6. add GitHub account
7. add Instagram account
8. add one unknown/custom service
9. include real synthetic website values where field is implemented
10. select Google
11. copy email
12. reveal password
13. hide password
14. copy password
15. edit Google
16. save
17. search Spotify
18. clear search
19. filter category
20. clear filter
21. create at least 5 relationships using multiple real relationship types
22. edit one relationship
23. remove one relationship
24. create one relationship from Map
25. open Map
26. select multiple nodes
27. search Map
28. Fit graph
29. open selected node in Vault
30. Settings → Appearance
31. Settings → Data & Recovery
32. export encrypted backup
33. mutate synthetic vault
34. restore backup with correct backup master password
35. verify restored account/relationship counts
36. attempt wrong-password restore and verify current vault remains unchanged
37. close app
38. reopen
39. unlock
40. verify persistence

Record PASS/FAIL for every step.

---

# 23. VISUAL QA — SMALL, HIGH-VALUE EVIDENCE SET

Do not generate another 100-screen matrix.

Capture/inspect the following representative final states:

1. Create Vault
2. Unlock Vault
3. Vault Empty
4. Vault Populated — Google selected
5. Vault Populated — Spotify selected
6. Unknown service selected
7. Add Account
8. Edit Account
9. Add Relationship
10. Manage/Edit Relationship
11. Map populated
12. Map selected node
13. Settings — Appearance
14. Settings — Data & Recovery
15. representative confirmation dialog
16. representative toast/error state

Compare against the approved references.

For each state classify:

- PASS
- YELLOW — acceptable minor visual deviation
- RED — release blocker

A RED means fix the exact issue and retest. Do not launch another broad redesign cycle.

If automated native screenshot capture is blocked by the known Windows virtual-desktop/window-routing problem, do not waste hours fighting tooling. Use reliable renderer evidence and open the native build for direct owner review after everything else is complete.

---

# 24. SECURITY / FIXTURE / SECRET SCANS

Run the project's existing scans and any relevant grep/checks used by the previous release process.

Verify:

- no synthetic fixture credential entered production source
- no temporary bootstrap helper remains
- no private path/password accidentally committed
- no generated screenshots with real credentials are in production assets
- reference PNGs are documentation assets only
- no remote favicon endpoints
- no secret values in logs/tests snapshots

---

# 25. WINDOWS NATIVE BUILD & PACKAGE

After frontend + Rust + security checks pass:

Build the Tauri application and Windows bundles using the existing project process.

Expected deliverables:

- native EXE
- MSI
- NSIS setup EXE

Do not silently reuse stale pre-redesign installers.

Record:

- exact paths
- byte sizes
- SHA-256 hashes
- build timestamp
- app version

The existing package metadata historically remained `0.1.0`. Do not invent/bump a public release version mid-run without recording the decision.

For tonight's Stable Candidate, it is acceptable to keep the current version metadata if changing it would create unnecessary release risk; document a recommended final V3 version separately.

Artifacts remain unsigned unless code signing is actually configured. State this truthfully.

---

# 26. CHECKPOINT / PUSH STRATEGY — SUBSCRIPTION MAY EXPIRE

Do not hold hours of work in one uncommitted diff.

Commit after each coherent batch and push.

Suggested sequence:

```text
ui: establish final V3 calm-light design foundation
ui: rebuild V3 create and unlock experience
ui: complete final V3 vault shell and empty states
ui: complete service identity and populated vault inspector
ui: rebuild final V3 account add and edit workflow
ui: complete final V3 relationship management experience
ui: rebuild V3 identity map with real account graph
ui: complete final V3 settings and recovery presentation
ui: finish V3 dialogs feedback and edge states
chore: verify and package Account OS V3 stable candidate
```

You may combine adjacent commits if work naturally overlaps, but do not create one giant unpushed overnight diff.

After each major checkpoint:

```powershell
git status
git push origin v3-design-intelligence
```

Never force-push.
Never rewrite V1/V2.

---

# 27. TIME MANAGEMENT — DO NOT BURN THE NIGHT ON RESEARCH

Maximum research allowance during execution: **20 minutes total**, only to answer an implementation-blocking question.

The design has already been decided.

Do not spend time browsing dozens of UI galleries.

Use:

- approved local PNG references
- existing design-intelligence docs
- official shadcn Sheet/Dialog patterns as interaction reference
- official React Flow custom nodes/edges/controls/layout examples
- Simple Icons package/documentation only for local icon integration and license metadata

Then code.

---

# 28. PROHIBITED SCOPE

Do not add tonight:

- people/entities data model
- organizations data model
- device records/model
- family graph
- team vaults
- browser extension
- mobile app
- AI assistant
- analytics
- billing
- global command palette
- fake Ctrl+K search
- updater
- Windows Hello
- OS secure-key storage
- new crypto
- new sync protocol
- storage quotas
- startup manager
- tray system
- SaaS features
- marketing website
- reservations/loyalty/etc. unrelated to Account OS

Do not use generated-image fiction as scope justification.

---

# 29. DEFINITION OF DONE — DO NOT STOP BEFORE THIS

The overnight sprint is complete only when all applicable items are true:

## Repository
- [ ] correct branch
- [ ] all approved reference files preserved
- [ ] clean working tree
- [ ] all checkpoints committed
- [ ] branch pushed to GitHub or push failure explicitly documented with local commits safe

## Entry
- [ ] Create Vault matches calm-light reference
- [ ] Unlock matches calm-light reference
- [ ] validation works
- [ ] reveal/hide works
- [ ] busy/error states work

## Vault
- [ ] empty state polished
- [ ] populated list polished
- [ ] search/filter works
- [ ] selected account clear
- [ ] account inspector matches reference quality

## Identity
- [ ] known services use intentional local identity
- [ ] unknown fallback polished
- [ ] no runtime icon/favicons network requests
- [ ] brand identity metadata truthful

## Account CRUD
- [ ] Add Account sheet
- [ ] Edit Account sheet
- [ ] progressive disclosure
- [ ] unsaved changes handled
- [ ] delete confirmation
- [ ] website is real or omitted everywhere

## Relationships
- [ ] add works
- [ ] edit works
- [ ] remove works
- [ ] duplicate validation works
- [ ] existing semantics preserved

## Map
- [ ] real accounts only
- [ ] real relationships only
- [ ] automatic deterministic layout
- [ ] custom nodes
- [ ] selected/related/unrelated visual hierarchy
- [ ] search
- [ ] fit
- [ ] inspector
- [ ] relationship creation

## Settings
- [ ] real settings only
- [ ] Appearance polished
- [ ] backup export works
- [ ] restore works
- [ ] cloud/connected panel preserved
- [ ] no fake controls

## Edge states
- [ ] validation
- [ ] copy feedback
- [ ] save feedback
- [ ] no-results
- [ ] confirmations
- [ ] loading
- [ ] error feedback

## Testing
- [ ] frontend tests PASS
- [ ] Rust tests PASS
- [ ] production build PASS
- [ ] npm audit PASS or truthfully BLOCKED with reason
- [ ] cargo audit completed with truthful result
- [ ] synthetic E2E journey PASS
- [ ] security/fixture scans PASS

## Native delivery
- [ ] current source compiled to native EXE
- [ ] MSI rebuilt
- [ ] NSIS rebuilt
- [ ] hashes recorded
- [ ] installer artifacts are current, not stale

---

# 30. FINAL REPORT FORMAT — RETURN ONLY AFTER EXECUTION

When the entire run is complete, return exactly this structure with real values:

```text
ACCOUNT OS V3 STABLE CANDIDATE — OVERNIGHT FINAL REPORT

START STATE
Branch:
Starting HEAD:
Remote branch before push:
Reference manifest verified: YES/NO
Initial safety push: PASS/FAIL/BLOCKED

IMPLEMENTATION
Design foundation: PASS/FAIL
Create Vault: PASS/FAIL
Unlock Vault: PASS/FAIL
Vault empty state: PASS/FAIL
Vault populated/list: PASS/FAIL
Service identities: PASS/FAIL
Unknown fallback: PASS/FAIL
Website field: IMPLEMENTED/OMITTED + reason
Add Account: PASS/FAIL
Edit Account: PASS/FAIL
Relationship add/edit/remove: PASS/FAIL
Map: PASS/FAIL
Settings: PASS/FAIL
Dialogs/toasts/edge states: PASS/FAIL

NO-FAKE-FUNCTIONALITY AUDIT
Invented people/entities: NO/YES
Invented devices: NO/YES
Fake settings: NO/YES
Dead buttons: NO/YES
Remote favicon/icon calls: NO/YES
Unsupported generated-reference controls removed/omitted: list

DEPENDENCIES
Existing reused:
New added:
Reason for each new dependency:
License/guideline notes:

TESTS
Frontend tests: X/X PASS/FAIL
Rust tests: X/X PASS/FAIL
Typecheck/build: PASS/FAIL
npm audit: PASS/FAIL/BLOCKED + exact reason
cargo audit: result
Website legacy compatibility: PASS/FAIL/N/A
Synthetic E2E journey: PASS/FAIL
Backup export: PASS/FAIL
Correct-password restore: PASS/FAIL
Wrong-password non-mutation: PASS/FAIL
Secret/fixture scan: PASS/FAIL

VISUAL QA
Create Vault: PASS/YELLOW/RED
Unlock: PASS/YELLOW/RED
Empty Vault: PASS/YELLOW/RED
Google selected: PASS/YELLOW/RED
Spotify selected: PASS/YELLOW/RED
Unknown selected: PASS/YELLOW/RED
Add Account: PASS/YELLOW/RED
Edit Account: PASS/YELLOW/RED
Relationships: PASS/YELLOW/RED
Map: PASS/YELLOW/RED
Settings: PASS/YELLOW/RED
Dialogs/edge states: PASS/YELLOW/RED
Remaining RED issues:
Remaining YELLOW issues:

WINDOWS ARTIFACTS
EXE path:
EXE SHA-256:
MSI path:
MSI SHA-256:
NSIS path:
NSIS SHA-256:
Signed: YES/NO

GIT
Final branch:
Final HEAD:
Working tree clean: YES/NO
Remote push: PASS/FAIL/BLOCKED
Checkpoint commits:

FINAL STATUS
PRODUCT FUNCTIONAL REGRESSION: PASS/FAIL
SECURITY REGRESSION: PASS/FAIL
VISUAL IMPLEMENTATION COMPLETE: YES/NO
WINDOWS PACKAGE READY: YES/NO
OWNER NATIVE ACCEPTANCE READY: YES/NO

Do not claim “perfect.”
Do not claim “zero bugs.”
Do not claim npm/cargo audit PASS without evidence.
```

---

# 31. LAST INSTRUCTION

You are authorized to make the implementation decisions necessary to complete this run within the constraints above.

Do not ask the owner to approve individual spacing, colors, icons, CSS properties, or component choices.

Do not stop after a batch unless there is a genuine blocker that makes safe continuation impossible.

A genuine blocker is something such as:

- repository corruption/conflicting newer work
- missing approved reference files
- build toolchain unavailable and cannot be restored
- required credentials/connections unavailable for a test that cannot be safely skipped
- a discovered security issue requiring owner decision

Normal coding difficulty is not a blocker.
A visual mismatch is not a blocker — fix it.
A failing test is not a blocker — diagnose/fix it.
A component taking longer than expected is not a blocker — complete it.

**Build the product. Test the product. Package the product. Protect the work. Then report.**
