# Account OS V3 — walkthrough after the security-ledger cleanup

Date: 2026-09-11. HEAD at time of walkthrough: `b21f7b3` on branch
`v3-design-intelligence`.
Method: `node scripts/dev-seed-vault.mjs` (20 synthetic accounts, 15
relationships) → `npm run dev` + Chrome against `http://localhost:1420/?seed=1`.
Renderer only — not the native Tauri build, same method and limitation as
`ACCOUNT-OS-V3-WALKTHROUGH-2026-09-11.md`.

Screenshots: `docs/walkthrough-2026-09-11-ledger-cleanup/`.

## Purpose

Fresh evidence for the three ledger-cleanup items with a UI or observable
surface (1, 2, 5), plus a regression pass over Vault, Settings, and Map after
all five code/doc changes in this session.

## Item 1 — redacted Debug output (no UI surface)

`Account`'s Debug impl has no renderer-visible behavior — it only matters to
whatever calls `format!("{:?}", ...)` in Rust (a future `dbg!`/log/panic).
There is nothing to screenshot. Evidence is the Rust test suite:

```
test vault::tests::account_debug_output_redacts_secret_fields ... ok
test vault::tests::vault_data_debug_output_redacts_account_secrets_transitively ... ok
```

Both assert the real password/recovery/2FA values never appear in the
formatted output and that `[REDACTED]` does.

## Item 2 — clipboard auto-clear

Shot `01-item2-password-reveal-and-copy.jpg`: the Google (personal) account's
Password field revealed (`demo-not-a-real-password-1`, "Visible until hidden")
with the Copy and Hide icons next to it — the same Reveal/Copy affordance that
now routes through `copySecretToClipboard` (40s auto-clear) for the password
field specifically.

**Live clipboard-content verification was not possible from this automated
browser session.** Both `navigator.clipboard.writeText()` (via a real,
trusted click on the Copy button) and `navigator.clipboard.readText()`
consistently hung the automated tab for the full CDP timeout (~30–45s) —
consistent with a clipboard permission prompt that this remote-controlled
Chrome profile cannot dismiss. This is the same category of environment
constraint already recorded in `KNOWN-LIMITATIONS` for native screenshot
capture, just hitting the browser-automation path instead of the native one.
No JavaScript errors were logged for the session; the click itself did not
crash or error the app once the tab recovered.

Authoritative verification for the actual clear/no-clear behavior is the
7 tests in `src/domain/clipboard.test.ts` (all passing — see gate results
below), which exercise exactly the two required cases: cleared after the
delay when unchanged, left alone when the user copied something else first.
The interactive click-through (copy → wait 40s → paste and confirm empty) in
the native app remains a manual acceptance step, the same category as the
native rekey round-trip in the prior walkthrough.

## Item 5 — stale `.tmp` sweep on startup (no UI surface)

Also backend-only; nothing in the renderer reflects it. Evidence is the Rust
test suite:

```
test vault::tests::sweep_stale_temp_files_removes_leftovers_without_touching_the_vault ... ok
test vault::tests::sweep_stale_temp_files_is_a_noop_when_the_directory_is_missing ... ok
```

The first test plants two fake stale `.tmp` files plus a non-`.tmp` sibling in
a temp vault directory and confirms only the two temp files are removed, the
sibling and the real vault file are untouched, and the vault still unlocks
with the original password afterward.

## Regression pass

| Area | Action | Result | Shot |
| --- | --- | --- | --- |
| Vault list + inspector | seed loads 20 accounts / 15 relationships; select Google (personal) | OK | 01 |
| Reveal password | eye toggle → `demo-not-a-real-password-1`, "Visible until hidden" | OK | 01 |
| Settings → Security | Vault locking / Vault encryption / Cloud boundary rows + Change master password card render as before | OK, no regression from the clipboard/redaction/tmp-sweep changes | 02 |
| Map | 20 accounts / 15 relationships graph renders, "Select an account" empty state, React Flow attribution present | OK, no regression | 03 |
| Console | full session | No JavaScript errors or exceptions (`read_console_messages`, `onlyErrors: true`) | — |

## Net

Items 1 and 5 are backend-only changes with no renderer surface; their
evidence is the Rust test suite. Item 2's UI (Reveal/Copy) is confirmed
unchanged and error-free; its auto-clear timing/matching logic is proven by
a dedicated unit-test suite, and its live clipboard-content round-trip could
not be exercised through browser automation (environment limitation, not an
app defect) — it joins the native manual-acceptance list. Settings and Map
show no regression from this session's changes.
