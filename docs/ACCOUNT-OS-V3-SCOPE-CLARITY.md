# Account OS V3 — Settings & Relationships scope clarity

Date: 2026-09-10. HEAD: `99fd15e`.

Purpose: my previous completion report called the current Settings and Relationships
screens "reduced-scope vs the aspirational references, which contain functionality
the project docs say not to build." That reads as a contradiction. This document
resolves it feature by feature.

## How the verdicts are decided

Three sources define what V3 is *supposed* to contain:

1. **`docs/15 - DESIGN INTELLIGENCE/09 - DESIGN DECISION LOG.md`**
   - `DI-012` (LOCKED): "Map is Keep + Polish; Settings is grouped preferences with
     Data/Backup and Connected architecture."
   - `DI-011` (LOCKED): "Local-only service identity and first-class coherent
     inspector/Map relationships."
2. **`docs/15 - DESIGN INTELLIGENCE/11 - COMPONENT & SURFACE MATRIX.md`**
   - Settings: "Only expose truthful backup/cloud controls; **no fabricated devices**."
   - Map: "No secrets on canvas, no decorative particles."
3. **`docs/15 - DESIGN INTELLIGENCE/02 - SCREEN REFERENCE LEDGER.md`**
   - "**REBUILD: none. Devices, dedicated Security, and global search are planned
     only; they are not current screens.**"

The reference PNGs (`09-settings.png`, `07-manage-relationships-reference.png`) are
marked in `00-REFERENCE-MANIFEST.md` as visual-authority for *composition, spacing,
hierarchy, palette* — with the explicit rule: "**Do not invent unsupported
functionality merely because a generated reference contains it.**"

So a control that appears in a reference PNG but is not backed by real vault/sync
functionality, and is not in the locked architecture, is **intentionally omitted**,
not unfinished.

Verdict key:
- **INTENTIONAL** — locked docs say don't build it, or it would be fabricated/non-functional UI.
- **INTENTIONAL (equivalent)** — present in a different, functionally-equivalent form.
- **UNFINISHED** — real feature, in the locked direction or a reasonable expectation, and genuinely absent.
- **FLAG** — needs your decision; not clearly in or out of V3 scope.

---

## Settings — `09-settings.png` vs current `SettingsScreen.tsx`

Current build sections: **Appearance · Security · Data & Recovery · Connected · System**
(left sub-nav, one section shown at a time).

| Reference element | Current build | Verdict | Note |
| --- | --- | --- | --- |
| 6 top tabs: General / Security / Vault / Appearance / Sync & Backup / Advanced | 5-section left sub-nav | INTENTIONAL (equivalent) | `DI-012` locks "grouped preferences with Data/Backup and Connected architecture", not a specific tab set. Current grouping covers the same ground. |
| All sections visible on one scroll + right rail | One section at a time, no right rail | INTENTIONAL (equivalent) | Layout choice; same content is reachable. The right rail in the reference is almost entirely fabricated cards (see below). |
| **App name** text field | absent | INTENTIONAL | App name is fixed (`Account OS`); an editable field would be a no-op. |
| **Start on system launch** toggle | absent | INTENTIONAL | No autostart integration exists; `DI` / Component Matrix forbids fabricated controls. Not implemented in Tauri config. |
| **Minimize to system tray** toggle | absent | INTENTIONAL | No tray integration exists. |
| **Default view** dropdown (which page opens after unlock) | absent | UNFINISHED (minor) | This *is* implementable cheaply (persist a `light`-style preference, honour it in `App.tsx` initial `activeView`). Small, real, low-risk. Not built. |
| **Change master password** button + flow | absent (Security section is read-only info rows) | **FLAG** | There is **no** `change_master_password` / rekey command in `src-tauri/src/lib.rs` or `vault.rs`. This is a real security feature, genuinely absent, and **not** explicitly listed as deferred in `KNOWN-LIMITATIONS` (which defers Windows Hello, OS keystore, updater, signing). Your call whether V3 ships without it. |
| **Auto-lock vault** dropdown (idle timeout) | absent; Security section shows the callout "Windows Hello and automatic lock controls are not part of this V3 candidate" | INTENTIONAL | Explicitly deferred, and the product says so in-line. |
| **Clear clipboard** toggle | present as always-on behaviour (no toggle) | MATCH (equivalent) | Implemented 2026-09-11 (Phase 3 ledger cleanup, item 2). Copied passwords are auto-cleared from the clipboard 40s after the copy (`src/domain/clipboard.ts`), and only if the clipboard still holds exactly the copied value. Shipped as unconditional behaviour rather than a user-facing toggle. |
| **Vault location / Change** | absent | INTENTIONAL | Vault path is fixed to Tauri app-data by `D018`. Relocating the encrypted envelope is out of scope. |
| **Export vault** (encrypted) | present — Data & Recovery → "Export encrypted backup" (`export_backup`) | MATCH | Fully functional. |
| **Import vault** (encrypted restore) | present — Data & Recovery → "Restore encrypted backup" with confirm dialog, non-mutating on failure (`import_backup`) | MATCH | Fully functional; better than the reference (adds explicit confirm + validation messaging). |
| **Appearance → theme** (Light/Dark/System) | present — Appearance section, radiogroup with keyboard support | MATCH | Reference dropdown shows only "Light"; current exposes Light/Dark/System per `DI-009`. |
| **Appearance → Accent colour** swatches | absent | INTENTIONAL | No accent-token system; a palette that doesn't repaint anything is fabricated UI. `DI-008` rejects dashboard decoration. |
| **Appearance → Interface density** dropdown | absent | INTENTIONAL | No density token system implemented. |
| **About** card (version, GitHub / Docs / Support links) | partial — System section shows Application, Version, Runtime info rows | INTENTIONAL (equivalent) | Version is real (`getVersion()`); external marketing links are omitted deliberately (`DI-008`: no marketing surface). |
| **Storage** card ("1.2 GB used of 5 GB", Manage) | absent | INTENTIONAL | Pure fabrication — there is no storage quota system. Component Matrix: "no fabricated devices". |
| **Device** card (device name, OS, app-data path, Open folder) | absent | INTENTIONAL | "Devices … planned only; not current screens" (Screen Reference Ledger). |
| **Danger Zone**: Reset App | absent | INTENTIONAL | No settings store to reset. |
| **Danger Zone**: Delete Vault | absent | **FLAG** | A real destructive action that a local vault app arguably should offer. Not built; not in the locked plan either. Low priority; your call. |
| **Search settings** (Ctrl+K) | absent | INTENTIONAL | Global search is "planned only" (Screen Reference Ledger). |
| **Connected** (cloud) section | present — `CloudSyncPanel` (status / sign-in / sync / sign-out, cloud identity separate from vault unlock) | MATCH | Per `DI-012` / `D020`. |

### Settings — genuinely unfinished (not intentional)

1. **`Default view` preference** — small, real, safe. ~15 lines. Not built.
2. **`Change master password`** — real feature, no backend support at all. **FLAG for sign-off**: ship V3 without it, or add a `rekey` command + flow.
3. **`Delete Vault`** destructive action — **FLAG**, low priority.

Everything else absent from Settings is a deliberate omission of fabricated or
planned-only UI.

---

## Relationships — `07-manage-relationships-reference.png` vs current build

The reference shows a **dedicated top-level "Relationships" nav screen**. The locked
direction (`DI-011`, Screen Reference Ledger) is: **inspector relationship summary +
a Manage Relationships dialog + the Map as the management surface** — there is no
standalone Relationships nav item in the locked plan.

Current build: `AccountInspector` relationship summary → `RelationshipDialog`
("Manage relationships", add / edit / remove with confirmation) → `DependencyMap`,
all reading one persisted `relationships[]` model.

| Reference element | Current build | Verdict | Note |
| --- | --- | --- | --- |
| Dedicated "Relationships" left-nav screen | absent — nav is Vault / Map / Settings | INTENTIONAL | Not in the locked architecture. Ledger: dedicated screens are "planned only". |
| Stat cards: Total Accounts / Connected / Isolated | absent | INTENTIONAL | Belongs to the planned dedicated screen. Vault header does show "N accounts · N relationships". |
| **People / Entities** card ("6 people & organizations") | absent | INTENTIONAL | The data model is **accounts + typed relationships between accounts** only. There is no Person / Device / Organization entity type. Building it is a new feature, explicitly out of scope (`DI-011`, "no new features"). |
| Graph / **List** / **Matrix** view toggle | Map is graph-only; dialog is a list | INTENTIONAL (partial) | List exists (the Manage dialog and inspector summary are lists). Matrix view is planned-only. |
| **Rebuild Map** button | absent | INTENTIONAL | Layout is now deterministic (`99fd15e`); there is nothing to rebuild. |
| **Add Relationship** (from this surface) | present — "Add relationship" in Manage dialog and on the Map toolbar | MATCH | Functional; validates against self/dangling/duplicate. |
| Right-side account panel with **Relationships / Details / Security / Notes** tabs | inspector is a single scroll with Relationships + Notes + Recovery blocks | INTENTIONAL (equivalent) | Same information, un-tabbed. `DI-010`/`DI-011` require "first-class coherent" summary, not tabs specifically. |
| **Connected Accounts (8)** list with per-row type badge + kebab menu | present — inspector "N connected accounts" list + Manage dialog rows with edit affordance | MATCH | Per-row edit is a pencil, not a kebab. |
| Legend (Account / Person / Device / Service / Organization) | Map has no legend; only accounts exist | INTENTIONAL | No multi-entity model. |
| Edit / remove a relationship | present — Manage dialog → edit form (type, direction, notes) → Save, or Remove with confirm | MATCH | Non-mutating on failure. |
| Relationship **direction** control (bidirectional / one-way) | the edit form shows a direction preview; type carries the direction semantics (`relationshipDirectionLabel`) | INTENTIONAL (equivalent) | The reference's explicit "Bidirectional (both ways)" selector maps to relationship *type* semantics here; no data is lost. |

### Relationships — genuinely unfinished (not intentional)

**None.** Every gap is either the deliberate absence of the planned-only dedicated
screen / multi-entity model, or a presentation difference (tabs vs scroll, pencil vs
kebab) with no loss of function. The locked relationship direction — inspector
summary + Manage dialog + Map, one shared model — is fully implemented.

---

## One-paragraph answer

The Settings and Relationships **reference PNGs deliberately over-draw**: they show a
6-tab Settings shell with a fabricated Storage meter, Device card and Danger Zone,
and a dedicated Relationships screen with a Person/Device/Organization entity model
and Graph/List/Matrix toggle. The locked decision docs (`DI-011`, `DI-012`, the
Component Matrix's "no fabricated devices", and the Screen Reference Ledger's
"Devices, dedicated Security, and global search are planned only") say **not** to
build those. So most of the visible difference is **intentional**. The only real
unfinished items are all in Settings: a `Default view` preference (small), and —
the one that needs your decision — **there is no "change master password" capability
anywhere in the app**, and it is not on the deferred list. `Delete Vault` is a
secondary flag. Relationships has no unfinished work against its locked scope.
