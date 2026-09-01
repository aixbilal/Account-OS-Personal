# Account OS Agent Instructions

Before substantive work:

- Read `docs/00 - START HERE.md` first.
- Read the current version document under `docs/02 - VERSIONS/`.
- Read `docs/04 - SECURITY.md` before security-sensitive work.
- Follow `docs/05 - BUILD PLAN.md` and `docs/07 - AI DEVELOPMENT RULES.md`.
- Check `docs/08 - DECISIONS.md` before changing architecture.

## Browser automation

Use `agent-browser` as the default browser automation tool. Do not connect it to a personal Chrome profile.

Core flow:

1. Open the URL.
2. Snapshot interactive elements.
3. Interact through element refs.
4. Re-snapshot after significant page changes.

Use the later Tauri-compatible WebdriverIO setup for Tauri-native end-to-end testing, not Playwright MCP.

## Design gate

Before implementing or significantly modifying a user-facing screen: read `docs/15 - DESIGN INTELLIGENCE/`, the applicable Screen Recipe, and current screenshot evidence; use Mobbin MCP research when available and record useful findings in the Screen Reference Ledger; check the Component Registry and external-component offline/network/privacy behavior; implement with Account OS tokens/patterns and applicable Hybrid/Dark/Light behavior; respect keyboard accessibility and reduced motion; capture application screenshots, obtain visual review, and run relevant security regressions. Never redesign an important screen purely from model intuition when established Account OS patterns or relevant research are available.

## UI system

Base system:

1. shadcn/ui
2. Account OS custom components and design tokens

Approved optional, selective component sources:

3. Magic UI (official registry; supplementary to shadcn)
4. Vengeance UI (`https://www.vengenceui.com/`, `Ashutoshx7/VengeanceUI`)
5. UILora (free/licensed components only unless another tier is explicitly authorized)
6. 21st.dev (discovery source)
7. DevUI (`https://www.devui.in/`, `kumard3/dev.ui`) as visual/code reference only until the exact license is verified

Do not mix random components visually. Inspect dependencies and licenses, confirm React + Vite + Tauri compatibility, avoid marketing effects that harm desktop usability, and adapt every imported component to the Account OS design system. Do not copy DevUI code until its redistribution terms are verified.

## Phase-specific dependencies

- V1 construction: Tauri 2, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React, `@xyflow/react`, Motion, Vitest, and React Testing Library.
- V1 native E2E later: WebdriverIO and the official/current Tauri WebdriverIO tooling.
- V2 only: Supabase SDK/Auth, PostgreSQL/RLS integration, and official Supabase MCP/tooling if still appropriate.
- Final only: Windows Hello or OS-secure key storage, Tauri updater, and advanced security testing/hardening tooling.

Select compatible versions when each phase is scaffolded. Do not install these application dependencies early, activate Supabase during V1, invent cryptography, use real credentials, or commit secrets/vault data.
