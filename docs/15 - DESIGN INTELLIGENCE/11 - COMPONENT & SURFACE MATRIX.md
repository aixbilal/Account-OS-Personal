# V3 Component & Surface Matrix

**Status:** IMPLEMENTED — PENDING HUMAN/CHATGPT CORE EXPERIENCE VISUAL APPROVAL

| Surface | Structural primitive & interaction | Visual treatment | Accessibility & motion | Account OS adaptation / avoid |
| --- | --- | --- | --- | --- |
| App shell & sidebar | Persistent desktop navigation | Graphite chrome, quiet active rail | Semantic nav buttons, visible focus; 120ms color changes | System action stays below navigation; no card-wrapped sidebar |
| Vault list & account row | Flat selectable list | Open cool-neutral surface, identity mark, selected tonal fill | `aria-pressed`, keyboard-native buttons | View selection is not edit; avoid outlined row cards |
| Inspector & value rows | Read-only detail region | Slightly elevated workspace, grouped by separators | Label/value reading order; utility controls labelled | Read-only values do not resemble inputs |
| Service identity | Local mark + monogram fallback | Small branded-neutral tile, service label | Text alternative via aria label | Local catalog only; no remote favicon/logo lookup |
| Add/Edit & relationships | Modal form, selects, grouped fields | Clear editable boundaries, restrained dialog | Labels, Escape/close affordance, inline errors | Preserve encrypted persistence and existing relationship model |
| Search, filters & appearance | Search + select controls / choice buttons | Compact utility bar | Explicit labels and focus ring | Appearance belongs in Settings, not Vault |
| Settings | Settings navigation + section content | Open rows: title, description, control | Semantic navigation and labelled controls | Only expose truthful backup/cloud controls; no fabricated devices |
| Map canvas, nodes & edges | React Flow graph + textual inspector | Dark dependency canvas, directed labelled edges | Map is supplementary to textual relationship data | No secrets on canvas, no decorative particles |
| Lock & unlock | System action / focused secure form | Quiet system placement; minimal secure surface | Keyboard form and visible focus; reduced motion | No crypto or vault-semantic change |
| Dialogs, tooltips & empty states | Modal / compact helper / direct empty state | One strong surface, minimal borders | Focusable close actions, descriptive text | Avoid nested boxes and decorative status clutter |

## Shared visual rules

- Surface changes, spacing, and low-contrast separators establish hierarchy before borders.
- Primary actions are reserved for create/save; edit and management controls are secondary; reveal/copy are utility controls.
- Hybrid is graphite navigation → cool-neutral list → slightly elevated inspector. Dark and Light preserve the same role hierarchy.
- Motion is limited to opacity, transform, and color at 120–220ms and disabled for reduced motion.

## R2 machine audit — 2026-09-02

| Surface | Current component | Audit result | Required follow-up |
| --- | --- | --- | --- |
| App shell & sidebar | `App`, `App.css` | Semantic roles exist but legacy hard-coded declarations remain outside R2 scope. Lock remains a visible system action. | Consolidate legacy declarations only in an approved visual-polish pass. |
| Vault / inspector / editor | `AccountList`, `AccountInspector`, `AccountEditor` | Existing semantic controls, labelled form fields, and view-first edit flow retained. | Native visual evidence remains required. |
| Service identity | `ServiceIdentity`, `serviceCatalog` | Local-only resolver, deterministic marks and monogram fallback; 94 implemented catalog entries, not the previously claimed 99. | Add only evidence-backed catalog entries. |
| Map | `DependencyMap` | Nodes now receive credential-free `id`, account name, service, and category view data; explicit dialog confirmation precedes relationship persistence. | Native interaction and visual review remains required. |
| Settings / backup / connected | `SettingsScreen`, `CloudSyncPanel` | Existing controls retained; normal Vault chrome has no theme selector. | Native visual and keyboard review remains required. |

Machine contrast audit covers sidebar, Vault list, inspector, selected rows, buttons, secondary metadata, and Map for Hybrid, Dark, and Light at WCAG AA (4.5:1). A Dark primary-action contrast failure and a near-threshold Hybrid metadata color were corrected. Status remains **IMPLEMENTED — PENDING HUMAN/CHATGPT FIXTURE R2 VISUAL APPROVAL**.
