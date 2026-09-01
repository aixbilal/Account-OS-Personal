# Component Registry

Account OS internal components are first priority. No registry entry alone authorizes a dependency or implementation.

| Component/pattern | Source | Locked use | Forbidden use | Required checks |
| --- | --- | --- | --- | --- |
| Desktop sidebar | internal / Unlumen reference | persistent labels, restrained selection, compact density | dock, bouncing/hover-only navigation | keyboard, focus, contrast, resize |
| Vault list + inspector | internal | primary desktop architecture | immediate edit on selection; card wall | keyboard, selection, narrow-window behavior, privacy |
| Account view/edit | internal | distinct view and edit states | giant edit modal as primary view | save/cancel, focus, destructive separation |
| Service identity | local resolver / internal | local icon/accent/monogram recognition | remote favicon lookup, advertising wall | offline, privacy, licensing metadata |
| Relationship summary | internal | inspector summary + Map coherence | obscure advanced-only form control | direction, navigation, keyboard |
| Map selection | internal / XYFlow adaptation | strong selected/related/unrelated states | particles, credential-heavy nodes | focus, reduced motion, graph usability |
| Settings grouping | internal | desktop-preferences information architecture | developer-control stack | accessibility, existing-function preservation |
| Command palette | internal / Vengeance reference | planned local keyboard-first capability | network-dependent core search | keyboard, local-first, privacy |
| Subtle polish | Magic UI reference | non-sensitive, restrained feedback | secrets, urgent security state, decorative loops | reduced motion, offline behavior |

All external inspiration needs license, compatibility, accessibility, offline/network/privacy, theme, and security review before adoption.
