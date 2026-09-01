# Account OS V3 Design Toolchain

## Status and boundary

This is the final normal V3 UI workflow. V2 remains frozen. These tools do not authorize UI, product, security, sync, data-model, dependency, or implementation changes without the Design Intelligence approval path.

## Default V3 route

`CURRENT ACCOUNT OS -> REAL SCREENSHOT -> CHATGPT VISUAL / PRODUCT AUDIT -> DESIGN.md + SCREEN RECIPE -> TASTE QUALITY GUARDRAIL -> APPROVED VISUAL REFERENCE -> IMAGE-TO-CODE -> CODEX IMPLEMENTATION -> AGENT-BROWSER SCREENSHOT -> CHATGPT REVIEW -> WEB DESIGN GUIDELINES AUDIT -> SECURITY REGRESSION -> PASS`

| Tool | Normal role | Status |
| --- | --- | --- |
| Account OS Design Intelligence + `DESIGN.md` | Design authority and agent-readable direction. | ACTIVE |
| `gpt-taste` | Quality guardrail against generic output; adapt its website conventions to the desktop security product. | ACTIVE |
| `image-to-code` | Analyze and implement against an approved visual reference; desktop-product constraints override landing-page conventions. | ACTIVE |
| agent-browser | Isolated visual capture and verification. | ACTIVE - 0.35.1 |
| Web Design Guidelines | Post-implementation accessibility and UX audit; not the visual designer. | ACTIVE |
| Mobbin MCP | Curated reference evidence. | DORMANT - official MCP/OAuth verified; paid access unavailable; use automatically if access becomes available. |

## Not default

Firecrawl, Jina, and Crawl4AI are **NOT_REQUIRED_DEFAULT** for Account OS V3 UI work. Do not configure Firecrawl, install Crawl4AI, route normal UI work through Jina, run broad crawls, or collect large reference corpora. Reconsider them only for a concrete later problem that genuinely requires one.

Historical assessment: Firecrawl was evaluated as a capable public-web discovery tool but requires human configuration; Jina was evaluated as lightweight text extraction; Crawl4AI was evaluated as an optional future local/self-hosted layer. None is part of the normal V3 route.

## Operating rules

- Start from current Account OS evidence and the applicable Screen Recipe, not from tool output.
- A design decision depends on appearance only after visual evidence; use agent-browser when appearance, interaction, or screenshots matter.
- Record approved references, useful/rejected patterns, and reviewer decisions before implementation.
- Do not bypass paid/private access or use research tooling as design authority.
- Respect local-first/offline behavior, service-identity privacy, keyboard accessibility, reduced motion, and the V2 security boundary.
