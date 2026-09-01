# Component Registry

Only an approved entry may be implemented. Every entry records: Component; Source; URL/reference; Purpose; approved and forbidden use; theme support; keyboard accessibility; reduced-motion status; offline/network behavior; license status; adaptation notes; and approval status.

## Source roles

- **Account OS native/internal:** default for security-critical controls.
- **Unlumen UI:** provisional reference for desktop interactions, sidebar, controls, inputs, and restrained motion.
- **Magic UI:** provisional, selective polish only.
- **Vengeance UI:** provisional special interactions/search experiences.
- **Mobbin:** shipped-product UX reference only.

| Component | Source | Purpose | Status | Forbidden use |
| --- | --- | --- | --- | --- |
| Refined sidebar | internal / Unlumen reference | desktop navigation | PROVISIONAL | replacing audited flow without evidence |
| Command search modal | internal / Vengeance reference | future global search | PROVISIONAL | network-dependent search |
| Animated number | Magic reference | restrained non-sensitive metrics | PROVISIONAL | credential values or urgent security states |
| Card, toggle, input, tooltip | internal / selected reference | routine controls | PROVISIONAL | unreviewed licensing/accessibility |

**DISCOURAGED for core security UI:** particles, cursor trails, 3D carousels, liquid-metal effects, constant glow, giant animated backgrounds, excessive glass, bouncing navigation, and decorative motion that reduces usability.
