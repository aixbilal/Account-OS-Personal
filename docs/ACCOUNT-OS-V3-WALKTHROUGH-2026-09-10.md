# Account OS V3 — autonomous renderer walkthrough

Date: 2026-09-10 · HEAD at time of walkthrough: `298cd2a` (docs) on top of `99fd15e` (code).
Method: `npm run dev` + Chrome, app rendered against the synthetic fixture
(`http://localhost:1420/?seed=1` → `scripts/dev-seed-vault.mjs` → 20 fake accounts,
15 relationships). Renderer only — not the native Tauri build.

Screenshots referenced below live in `docs/walkthrough-2026-09-10/` (numbered to match).

## What was exercised and worked

| Area | Actions | Result | Shots |
| --- | --- | --- | --- |
| Vault list + inspector | select account, read fields | OK | 01 |
| Search | typed "university" → 2 matches | OK | 02 |
| Category filter | Finance → 2 matches | OK | 03 |
| Combined filter | Finance + Password → 2; Finance + Passkey → empty state with "Clear search and filters" | OK | 04, 05 |
| Reveal secret | eye toggle → shows `demo-not-a-real-password-1`, subtext "Visible until hidden" | OK | 06 |
| Copy secret | copy icon → "Password copied" toast | OK | 07 |
| Password auto-hides | switching account re-hides the secret | OK | 08 |
| Isolated account | LinkedIn → "No connected accounts" + helper text + notes/recovery + encryption banner | OK | 08 |
| Add account – generator | "Generate" → "New password generated" toast, field filled; reveal toggle; "Generator options" expander | OK | 11 |
| Add account – More details | expander reveals Category / Auth method / 2FA / Recovery / Notes | OK | 12 |
| Add account – save | Service + title + generated password → "Account saved" toast, count 20→21, new row selected | OK | 13 |
| Edit account | opens prefilled with identity hero, Delete (danger, left) / Cancel / Save (right) | OK | 14 |
| Edit – discard guard | change a field, press ✕ → "Discard unsaved changes?" dialog; Discard reverts | OK | 15 |
| Edit – delete | "Delete account" → "Delete <name>?" confirm; confirm → "Account deleted" toast, count 21→20 | OK | 16, 17 |
| Manage relationships | opens for selected account, lists connections with edit affordance | OK | 18 |
| Relationship – add | From/To selects, type, notes, live direction preview → "Relationship added" toast | OK | 19, 20 |
| Relationship – edit | opens with identity summaries + type/notes + direction preview | OK | 21 |
| Relationship – remove | "Remove" → "Remove relationship?" confirm → "Relationship removed" toast | OK | 22, 23 |
| Map – overview | 20 nodes / 15 edges, radial layout, no attribution watermark on the canvas | OK | 24 |
| Map – node select | select "Google (personal)" → node + 3 connections highlighted, other 16 dimmed, right panel shows Incoming/Outgoing counts + Connections list | OK | 25 |
| Map – search | "google" → matching node stays lit, rest dim | OK | 26 |
| Map – fit graph | button re-frames the graph | OK | — |
| Settings – Appearance | Light / Dark / System radio cards | OK | 28 |
| Settings – Security | read-only info rows (locking, Argon2id · XChaCha20-Poly1305, cloud boundary) + "Windows Hello and automatic lock… not part of this V3 candidate" | OK | 29 |
| Settings – Data & Recovery | Export card + Restore card (file picker, backup password, restore) | OK | 30 |
| Settings – Export (renderer) | "Encrypted backup export is available in the installed desktop application." | OK (expected) | 31 |
| Settings – Restore validation | Restore with nothing selected → "Choose an encrypted backup and enter its master password." | OK | 31 |
| Settings – Connected | "Cloud account: Not connected", cloud email/password, "Connect cloud identity"; subtitle states cloud identity and vault unlock stay separate | OK | 32 |
| Settings – System | Application / Version 0.1.0 / Runtime "Web renderer preview" | OK | 33 |
| Theme – Dark | chrome, Vault inspector, and Map all switch to dark and stay readable | OK | 34, 35, 36 |
| Theme – System | follows OS (host is in dark mode → app went dark) | OK | 37 |
| Theme – back to Light | restored | OK | 38 |

**No JavaScript errors, no failed network requests, no broken links, no React
`act()` / state warnings during the entire session.**

## Console output (warnings only, no errors)

| # | Message | Assessment |
| --- | --- | --- |
| C1 | `React Flow: It seems like you are hiding the attribution. Please only do this when you are subscribed to React Flow Pro` — fires on every Map mount | **Direct result of `proOptions={{ hideAttribution: true }}` added in `99fd15e`.** `@xyflow/react` is MIT-licensed and the option exists, but xyflow asks for a paid Pro plan to hide the "React Flow" label and logs this each time. **Flagged for your decision** (see F1). |
| C2 | `Multiple GoTrueClient instances detected in the same browser context` (Supabase) | Benign ("It is not an error"). Caused by more than one `createClient` in the same page — amplified by React StrictMode double-invoke in dev. Pre-existing, not from this session's changes. Low priority. |

## Findings

Severity: **FLAG** = needs your decision; **LOW/MED** = real but not blocking; **INFO** = expected behaviour, recorded for completeness.

### F1 — Map hides the React Flow attribution (FLAG)
`src/components/DependencyMap.tsx` passes `proOptions={{ hideAttribution: true }}`
(added in `99fd15e` to stop the Map "looking like a generic React Flow demo").
This removes the small "React Flow" link from the canvas and triggers console
warning C1 on every mount. xyflow's guidance is that hiding it is for Pro
subscribers.
**Decision needed:** keep it hidden, or revert the one prop and show the label.
Reverting is a one-line change with no other effect.

### F2 — Map: a selected node cannot be deselected (LOW-MED)
Once you click a node, that node + its neighbours stay highlighted and the other
~16 nodes stay dimmed. Clicking empty canvas does nothing; `Escape` does nothing.
The only way back to the full graph is to reload the screen.
Cause: `DependencyMap` wires `onNodeClick` but no `onPaneClick` handler and no
`Escape` key handler to clear `selectedId`.
Shot 27. Small, low-risk fix, but it changes Map interaction behaviour so it is
left for your call rather than changed unilaterally.

### F3 — Add / Edit account: required-field feedback is the browser's native bubble (LOW)
Submitting the Add/Edit sheet with an empty **Service** or **Account title**
correctly blocks the save and focuses the empty field, but the feedback is
Chrome's native "Please fill out this field" tooltip, not the app's own styled
error. The component already contains the styled-error code
(`setError("Service and account title are required.")`) but it never runs because
`<form className="editor-form">` has no `noValidate` (unlike the Create/Unlock
form, which does). Inconsistent, but the user is not left without feedback.
Shot 10. One-line fix (`noValidate` on the form) would activate the existing
styled path — left for your call.

### F4 — "Multiple GoTrueClient instances" warning in dev (LOW)
See C2. Benign, pre-existing, dev-amplified.

### F5 — Inspector does not follow the list filter (INFO / very low)
If you select an account and then apply a search/filter that excludes it, the
inspector keeps showing the now-hidden account. Arguably correct (selection is
independent of the filtered view); recorded in case you want the inspector to
clear when its account leaves the visible list.

### F6 — Add Relationship dialog is tall (INFO / very low)
At the ~577 px effective viewport height used for this walkthrough, the dialog's
Cancel / Add relationship buttons sit at the very bottom and need a small scroll
inside the dialog. On a normal-height desktop window this is not an issue.
Shots 19, 35.

### F7 — Only 8 of 94 catalog services render a brand glyph (INFO)
`ServiceIdentity.tsx` ships bundled `simple-icons` paths for 8 services
(Apple, Discord, Facebook, GitHub, Google, Instagram, Spotify, YouTube). Every
other catalog entry — Dropbox, Vercel, Supabase, npm, Monzo, PayPal, Steam, etc. —
falls back to a monogram tile with the catalog accent colour. This matches the
locked "local-only, deterministic fallback, no remote logo lookups" rule; noting
it so the "94 audited service identities" figure is not mistaken for "94 icons".

### F8 — Lock/Unlock and the real encrypted backup round-trip are not renderer-testable (INFO)
In the browser the app is not a Tauri runtime, so it is permanently "unlocked",
the sidebar shows "Renderer preview" instead of "Lock Vault", and
export/restore return the "available in the installed desktop application"
message. These paths are covered by the 19 Rust tests
(`src-tauri/src/vault.rs`) and `VaultEntry.test.tsx`, and remain part of the
owner's native acceptance pass.

## Net

The full intended V3 flow — vault → search/filter → inspect → reveal/copy →
add → edit → delete → relationships (add/edit/remove) → Map (select/search/fit) →
all five Settings sections → light/dark/system — works end to end against a
realistic 20-account vault with no errors. Three items (F1 attribution, F2 map
deselect, F3 validation style) are left for your sign-off; the rest are
informational.
