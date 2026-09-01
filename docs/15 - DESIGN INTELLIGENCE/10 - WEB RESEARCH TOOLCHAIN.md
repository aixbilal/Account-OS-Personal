# Account OS Web Research Toolchain

## Status and boundary

**Purpose:** route future public-web design research to the smallest appropriate tool and retain evidence for ChatGPT review. This is research infrastructure only. V2 is frozen; this document does not authorize UI, product, security, sync, data-model, dependency, or implementation changes.

Research tools provide evidence, not final design authority. Final decisions remain with ChatGPT / Account OS Design Intelligence after evidence review.

## Tool roles and current availability

| Tool | Role | Current availability | Rules |
| --- | --- | --- | --- |
| Mobbin MCP | Preferred curated shipped-product screen and flow references when paid access is available. | Official MCP registered; OAuth verified; **BLOCKED_PAID**. | Keep configured; do not bypass paid access; use automatically when access becomes available; evidence only, never design authority. |
| Firecrawl | Primary public-web discovery and structured extraction. | **HUMAN CONFIGURATION REQUIRED**: no MCP, CLI, or environment credential is available. | Use for public discovery/search/scrape/map, dynamic pages, structured comparison, and justified small crawls. Never bypass logins/paywalls, scrape private content or Mobbin paid content, run huge crawls, or persist large external datasets automatically. |
| Jina AI Reader / Search | Lightweight text extraction and reading. | **AVAILABLE** through the public Reader path; no local CLI/MCP is configured. | Use for simple/text-heavy pages and concise multi-page reading. It is not visual proof or the primary visual design evaluator. |
| agent-browser | Primary visual verification. | **ACTIVE** - Vercel Labs agent-browser 0.35.1. | Use for appearance, screenshots, interactions, hover/modal/navigation, and final visual evidence. Use a named isolated session; never connect a personal Chrome profile. |
| Crawl4AI | Optional future local/self-hosted deep-research layer. | **OPTIONAL_FUTURE** - not installed. | Consider only for a justified repeated, local/private, or persistent research corpus. Do not install it for ordinary research or turn Account OS into a tooling project. |

**Appearance rule:** if a design conclusion depends on appearance, text extraction alone is insufficient. Verify the relevant public reference with agent-browser or equivalent visual evidence.

**Firecrawl human setup path:** a human creates a Firecrawl account/API key, then configures the official Firecrawl MCP or CLI outside the Account OS project using secure local credential handling. Do not paste a key into chat, commit it, or add it to project dependencies.

## Tool router

| Need | First route |
| --- | --- |
| Find strong public references | Firecrawl Search |
| Read one simple public page | Jina Reader |
| Read several text-heavy public docs | Jina Search/Reader or Firecrawl |
| Extract a dynamic/JavaScript-heavy page | Firecrawl |
| Map or make a justified limited public crawl | Firecrawl |
| Verify actual visual appearance | agent-browser |
| Capture screenshots | agent-browser |
| Verify click, navigation, hover, or modal behavior | agent-browser |
| Review curated shipped app flows | Mobbin MCP when access is available |
| Build a large/local/self-hosted research corpus | Crawl4AI later, only when justified |
| Make a final Account OS design decision | ChatGPT / Account OS Design Intelligence, not a research tool |

Use agent-browser earlier than this table implies whenever visual confirmation is essential.

## Reference priority

1. Existing locked Account OS design decision.
2. Current real Account OS screenshot/evidence.
3. Existing Account OS Screen Recipe.
4. Mobbin MCP, when access is available.
5. Public real-product references.
6. Firecrawl discovery/extraction.
7. Jina lightweight extraction.
8. Approved component libraries.
9. agent-browser visual verification.
10. Model intuition, last.

The order is evidence priority, not a rigid execution sequence: visual verification moves earlier whenever appearance is material.

## Step 6B research procedure

For each Account OS area:

1. Read current screenshot evidence and the Screen Recipe.
2. Define the UX problem and read any recorded ChatGPT audit/design direction.
3. Run targeted public-reference discovery; favor mature design systems and high-quality shipped products.
4. Shortlist about 3-5 strong references.
5. Extract information hierarchy, density, navigation, selected state, action placement, keyboard behavior, theme behavior, service identity behavior, motion, and accessibility.
6. Visually verify the best references with agent-browser.
7. Record useful and rejected patterns in the Screen Reference Ledger; retain only needed metadata/evidence, not large external datasets.
8. Do not silently make a final Account OS design decision. Return the research pack for ChatGPT review.
9. Only after that review, update the final Screen Recipe, Component Registry, and Design Decision Log.

No UI implementation occurs during research.

## Approved Step 6B research groups

All hypotheses below are **PROVISIONAL - REQUIRES RESEARCH**.

### Group A - Vault + Account Inspector

- Current issues: uniform dark shell, excess empty space, a low-density single list, a large selected-account edit modal, weak service identity, and relationships that are not first-class.
- Hypothesis to verify: three-pane desktop architecture; account list plus selected-account inspector; view-first with explicit edit mode; local service identity treatment; relationship summary in the inspector.

### Group B - Add / Edit Account

- Current issues: visually dense form, too many equal-weight fields, no service recognition, and mixed viewing/editing concepts.
- Hypothesis to verify: grouped form, stronger hierarchy, progressive fields, service-aware header/identity, accessible password generator, and clear view/edit separation.

### Group C - Settings + Backup + Cloud / Devices

- Current issues: long stacked technical panels; backup and cloud resemble developer controls; connected state lacks product structure.
- Hypothesis to verify: grouped settings architecture; separate Data/Backup and Connected/Cloud areas; a future Devices surface; clearer status hierarchy.

### Group D - Unlock

- Current issues: strong structure but visually generic, with a uniform dark shell.
- Hypothesis to verify: preserve the minimal centered secure flow; strengthen premium material/identity; use restrained motion only; keep local/cloud privacy messaging clear.

### Group E - Map + Relationships

- Current strengths: the strongest unique screen; a fitting dark graph surface; understandable relationship direction.
- Current issues: generic nodes and weak first-class relationship management/selected-node behavior.
- Hypothesis to verify: preserve structure; improve service identity in nodes; strengthen selected state; add a side inspector; dim unrelated nodes when selected; use restrained relationship animations.

## Evidence and privacy rules

- Stay on public, accessible sources; never bypass paid/private access or authentication.
- Do not scrape private user content, Mobbin paid content, credentials, vault data, or secrets.
- Do not commit screenshots/assets unless an approved Design OS step explicitly requires sanitized evidence.
- Record source, purpose, useful/rejected pattern, visual verification status, and adaptation boundary before implementation.
- Respect local-first/offline behavior, service-identity privacy constraints, keyboard accessibility, reduced motion, and the V2 security boundary throughout.
