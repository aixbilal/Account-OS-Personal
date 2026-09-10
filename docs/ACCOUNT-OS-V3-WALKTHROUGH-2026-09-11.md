# Account OS V3 — walkthrough after the 2026-09-11 finish-out

Date: 2026-09-11 · HEAD at time of walkthrough: `d1b789f` on branch
`v3-design-intelligence`.
Method: `node scripts/dev-seed-vault.mjs` (20 synthetic accounts, 15
relationships) → `npm run dev` + Chrome against `http://localhost:1420/?seed=1`.
Renderer only — not the native Tauri build (see "Native-only" note below).

Screenshots: `docs/walkthrough-2026-09-11/` (numbered to match).

## Purpose

Confirm the three walkthrough findings from `ACCOUNT-OS-V3-WALKTHROUGH-2026-09-10.md`
(F1 attribution, F2 map deselect, F3 form validation) are resolved **in the
running app**, and that the new Change-master-password surface renders and
behaves correctly in the renderer. Plus a regression pass over core flows.

## F1 / F2 / F3 — verified in the running app

| Finding | 2026-09-10 state | 2026-09-11 result | Evidence |
| --- | --- | --- | --- |
| **F1** — Map hid the React Flow attribution (`proOptions={{ hideAttribution: true }}`), which xyflow's own docs restrict to a paid React Flow Pro subscription, and which logged console warning C1 on every Map mount | prop present; C1 fired every mount | **Resolved.** The "React Flow" attribution link is visible in the canvas' bottom-right corner again. Full-session console capture shows **no** `React Flow … hideAttribution … Pro` warning at all. | Shot 01; console read (only `[vite] connecting/connected` + React DevTools info, zero warnings/errors) |
| **F2** — a selected Map node could not be deselected; empty-canvas click and `Escape` did nothing; only a reload restored the full graph | no `onPaneClick`, no `Escape` handler | **Resolved.** Selecting "Google (personal)" dims the other ~16 nodes and fills the right panel (2 Incoming / 1 Outgoing / Connections). Clicking empty canvas restores every node to full opacity and returns the panel to "Select an account". Re-selecting, then pressing **Escape**, does the same. | Shot 01 (cleared state after both paths) |
| **F3** — Add/Edit account showed the browser's native "Please fill out this field" bubble instead of the app's own styled error, because `<form class="editor-form">` lacked `noValidate` | native bubble; styled `setError(...)` path dead | **Resolved.** `form.editor-form.noValidate === true`. Submitting the Add sheet with empty Service/Account title now renders the app's styled `<p class="form-error" role="alert">Service and account title are required.</p>`, sets `aria-invalid="true"` on Service and focuses it. No native bubble appears. | Shot 02; DOM assertion (`errorClass: "form-error"`, `errorRole: "alert"`, `formNoValidate: true`, `serviceAriaInvalid: "true"`, `serviceHasFocus: true`) |

## Change master password — renderer behaviour

| Area | Result | Shot |
| --- | --- | --- |
| Settings → Security now shows a "Change master password" card below the three info rows and above the "Windows Hello … not part of this V3 candidate" callout. Description states the vault is replaced only after the new key is derived and verified, and a wrong current password changes nothing. | OK — matches the Data & Recovery card conventions | 03 |
| Card exposes Current / New / Confirm master-password fields, a shared show/hide toggle, and a "Change master password" submit button. | OK | 03 |
| Submitting in the **web renderer** shows the info message "Changing the master password is available in the installed desktop application." and makes **no** backend call — the same pattern as export/restore in the renderer. | OK (expected) | 04 |

### Native-only (not renderer-testable — same category as 2026-09-10 F8)

The actual rekey round-trip (successful change, wrong-current-password
rejection, and a fresh unlock with the new password) needs the Tauri runtime;
in the browser the app is permanently "unlocked" and the command is not wired.
These paths are covered by:

- **Rust** (`src-tauri/src/vault.rs`, `cargo test` — all 22 pass):
  `change_master_password_round_trips_under_the_new_password` (new password
  unlocks, old password rejected, KDF salt rotated),
  `change_master_password_rejects_a_wrong_current_password_and_leaves_the_file_untouched`
  (vault bytes byte-for-byte identical, old password still works, no temp files),
  `change_master_password_leaves_the_original_vault_intact_when_the_atomic_write_fails`
  (auth + key derivation + re-encrypt + verify succeed, then the swap fails —
  original vault survives intact, still unlocks with the old password).
- **Renderer** (`src/components/SettingsScreen.test.tsx`, 6 tests): mismatch,
  empty fields, `< 12` chars, new == current, confirm → `invoke` → success +
  `onMasterPasswordChanged`, backend rejection surfaced and fields cleared,
  renderer no-op.

The native click-through remains part of the owner's native acceptance pass.

## Regression pass

| Area | Action | Result | Shot |
| --- | --- | --- | --- |
| Vault list + inspector | seed loads 20 accounts / 15 relationships; select accounts | OK | 01 (implied), later shots |
| Search | typed "university" → University portal + University email | OK (2 matches) | — |
| Inspector follows selection | select "University portal" → hero, fields, "1 connected account · University email" | OK | — |
| Reveal secret | eye toggle → `demo-not-a-real-password-14`, subtext "Visible until hidden" | OK | — |
| Add account sheet | opens, all fields empty, generator + More details present | OK | 02 |
| Settings sections | Appearance / Security / Data & Recovery / Connected / System all reachable | OK | 03 |
| Theme — Dark | whole shell (sidebar, settings, cards) switches and stays readable; back to Light restores | OK | 05 |

**No JavaScript errors, no failed requests, no React `act()`/state warnings for
the entire session.** Console contained only `[vite]` HMR lines and the React
DevTools info hint.

## Net

F1, F2 and F3 are resolved in the running app, not just in code. The new
Change-master-password card renders to the existing Settings conventions and the
renderer safely defers to the desktop app. The security-critical rekey logic is
proven by the Rust suite (round-trip, wrong-password rejection, crash-safety)
and the renderer wiring by the component suite. Core flows unaffected.
