# Account OS V3 UX Friction Audit

Static source review performed for the RC delivery checkpoint. This is not a substitute for the remaining direct native visual review.

## GREEN

- Create and unlock screens label the master-password field and state that the password stays on-device.
- Vault search and both filters have accessible labels; the empty state explains how to begin.
- Account editing separates Reveal, Hide, Generate, Copy, Save, and Delete actions. Destructive account deletion requires confirmation.
- Relationship creation validates the target/type and Map relationship creation has explicit confirmation.
- Data & Recovery distinguishes export from restore and gives both success and error feedback.
- Keyboard focus styling exists for buttons and form controls; reduced-motion fallback exists.
- Settings groups Appearance, Security, Data & Recovery, and Connected into explicit navigation.

## YELLOW

- Static review cannot establish whether the selected-account and Map-node states are visually obvious; direct native review should check this.
- Restore correctly asks for the backup master password, but the human checklist should confirm the distinction is immediately clear in context.
- Map relationship composition and the relationship inspector need direct review for discoverability and keyboard comfort.
- No lint/a11y-specific tool is configured, so the review is source-based rather than a dedicated automated accessibility scan.

## RED

None evidenced by source review. No product changes were made.

## Follow-up

Use `ACCOUNT-OS-V3-FINAL-HUMAN-REVIEW.md` for the short native visual pass. Any RED finding there should be handled as a focused follow-up rather than a broad redesign.
