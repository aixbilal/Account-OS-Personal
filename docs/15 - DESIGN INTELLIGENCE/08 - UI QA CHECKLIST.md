# UI QA Checklist

For every major changed screen, capture before/after sanitized screenshots and record tests and review decision.

- **Visual:** hierarchy, spacing, alignment, density, typography, themes, service identity, icons, empty/loading/error states, long values, and small-window behavior.
- **Interaction:** keyboard, focus, hover, targets, shortcuts, scrolling, resize, dialogs, and destructive actions.
- **Accessibility:** contrast, visible focus, reduced motion, relevant text scaling, and no color-only meaning.
- **Privacy:** no accidental network requests, credential exposure, secret screenshots/logs, or default third-party favicon leakage.
- **Security:** lock/clipboard controls, encrypted persistence, offline behavior, and sync/RLS/conflict behavior remain intact.
- **Evidence:** current screenshot, reference/recipe record, implementation evidence, regression results, and reviewer PASS/corrections.
