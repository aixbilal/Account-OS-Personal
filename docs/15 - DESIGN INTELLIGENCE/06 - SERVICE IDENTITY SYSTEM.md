# Service Identity System

## Service Identity Resolver

Goal: recognizable identity without privacy leakage. Resolution is local: `URL/domain → normalize locally → local service registry → local bundled icon when available → user-provided/local icon when supported → generic monogram`.

**LOCKED PRIVACY RULE:** Account OS must not silently contact third-party favicon services when a domain is entered. Future remote retrieval is explicit, opt-in, privacy reviewed, and never required for basic operation.

Visual treatment is provisional: service name, restrained accent, optional subtle tile, and generic fallback. `service-identities.json` contains conservative metadata only; this step downloads no trademark/copyright assets and makes no icon network requests.
