# Account OS Design OS

## Status and scope

**LOCKED PRINCIPLE:** V2 is frozen. This system plans future UI work; it does not authorize UI, product, security, sync, or data-model changes.

## Roles

| Role | Responsibility |
| --- | --- |
| User / owner | Defines outcomes, reports real-life friction, approves direction, and performs human-only testing. |
| ChatGPT | Product/UX/security-boundary architect; audits evidence, defines batches, and gives PASS or exact corrections. |
| Codex | Engineering/operator agent; researches, implements approved work, validates it, captures evidence, and never silently makes major design decisions. |

## Mandatory workflow

`CURRENT SCREEN → screenshot evidence → ChatGPT audit → KEEP / POLISH / RESTRUCTURE / REBUILD → Mobbin research → Screen Recipe → Component Registry → implementation → screenshot evidence → ChatGPT PASS/corrections → security regression → accepted`

Before meaningful work, Codex reads this system, the applicable recipe, evidence, registry, and theme/service/motion rules. It records research and checks offline, privacy, keyboard, reduced-motion, and security regressions.

**LOCKED PRINCIPLE:** Do not redesign a meaningful screen from model intuition when Account OS patterns, a recipe, or relevant reference research are available.

## Evidence standard

Screenshots are sanitized: no real credentials, secrets, or personally identifying vault data. Evidence must name the build, screen/state, viewport, and review decision.
