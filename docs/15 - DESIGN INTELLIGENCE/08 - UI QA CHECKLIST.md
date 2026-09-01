# UI QA Checklist

For every major changed screen, capture before/after sanitized screenshots and record tests and review decision.

- **Visual:** hierarchy, spacing, alignment, density, typography, themes, service identity, icons, empty/loading/error states, long values, and small-window behavior.
- **Interaction:** keyboard, focus, hover, targets, shortcuts, scrolling, resize, dialogs, and destructive actions.
- **Accessibility:** contrast, visible focus, reduced motion, relevant text scaling, and no color-only meaning.
- **Privacy:** no accidental network requests, credential exposure, secret screenshots/logs, or default third-party favicon leakage.
- **Security:** lock/clipboard controls, encrypted persistence, offline behavior, and sync/RLS/conflict behavior remain intact.
- **Evidence:** current screenshot, reference/recipe record, implementation evidence, regression results, and reviewer PASS/corrections.

## V3 Vault native-review result — 2026-09-01

- Real Tauri/native review completed using a disposable V3 review vault; no critical functional issue was found.
- Human visual findings preserved: excessive borders/outlined containers; weak button hierarchy; griddy/form-like view mode; incomplete Hybrid material hierarchy; spacing/alignment/density refinement needed; service identity treatment not yet rich enough; Map is not yet a premium dependency explorer; Settings/Lock remain generic; move theme selection to Settings → General → Appearance in a future approved polish pass.
- Do not treat these findings as authorization for unscoped UI changes. Current status remains **IMPLEMENTED — PENDING HUMAN/CHATGPT NATIVE VISUAL APPROVAL**.
