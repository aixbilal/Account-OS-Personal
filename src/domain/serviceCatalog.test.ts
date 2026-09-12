import { describe, expect, it, vi } from "vitest";
import { genericIdentityCategories, normalizeServiceInput, priorityServiceIds, resolveCatalogService, serviceCatalog } from "./serviceCatalog";
import { resolveServiceIdentity } from "../components/ServiceIdentity";

describe("local service identity catalog", () => {
  it("contains a useful local-only V1 catalog and generic fallbacks", () => {
    expect(serviceCatalog.length).toBeGreaterThanOrEqual(80);
    expect(genericIdentityCategories).toHaveLength(18);
  });

  it.each([
    ["https://accounts.google.com/login", "Google"],
    ["MAIL.GOOGLE.COM", "Gmail"],
    ["https://github.com/settings", "GitHub"],
    ["https://chatgpt.com/", "OpenAI"],
  ])("normalizes %s locally", (input, expected) => expect(resolveCatalogService("", input)?.displayName).toBe(expected));

  it("matches aliases and provides an intentional monogram fallback", () => {
    expect(resolveCatalogService("Claude", "")?.displayName).toBe("Anthropic");
    expect(resolveCatalogService("", "unknown.example.invalid")).toBeUndefined();
    expect(resolveServiceIdentity("Le Grain Admin")).toMatchObject({ id: "custom", iconSource: "monogram", monogram: "LG" });
    expect(normalizeServiceInput("HTTPS://WWW.GITHUB.COM/settings")).toBe("github.com");
  });

  it("does not perform a network request while resolving", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    resolveCatalogService("", "https://github.com/settings");
    resolveServiceIdentity("Unknown service");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("has unique, normalized local metadata for every catalog service", () => {
    const ids = serviceCatalog.map((service) => service.id);
    const domains = serviceCatalog.flatMap((service) => service.domains);
    const aliases = serviceCatalog.flatMap((service) => service.aliases.map((alias) => alias.toLowerCase()));

    // 94 + `gmail` + `chrome` (V3 fixture pass Item 4: real distinct Gmail
    // identity instead of showing the Google mark, plus a Chrome catalog
    // entry for its true-color mark).
    expect(serviceCatalog).toHaveLength(96);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(domains).size).toBe(domains.length);
    expect(new Set(aliases).size).toBe(aliases.length);
    expect(domains.every((domain) => /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain))).toBe(true);
    expect(serviceCatalog.every((service) => service.status === "catalog-v1" && Boolean(service.visualIdentity.trademarkNotice))).toBe(true);
    // Every non-priority service must still be internally consistent: a
    // neutral monogram strategy paired with the matching license status.
    expect(serviceCatalog.filter((service) => !priorityServiceIds.includes(service.id)).every((service) => service.iconStrategy === "neutral-local-mark" && service.licenseStatus === "no-trademark-asset")).toBe(true);
  });

  it("Phase 2 icon fix: matches a real bundled brand icon for known major brands beyond the original 10, not just a monogram", () => {
    // Regression coverage for the confirmed bug: PayPal (and many other
    // catalog services the installed simple-icons package already covers)
    // used to fall back to a 2-letter monogram because only 10 hardcoded
    // ids ever got a real icon. `priorityServiceIds` is now derived from
    // the catalog itself, so this only stays green if the fix is real.
    for (const id of ["paypal", "vercel", "supabase", "npm", "notion", "steam"]) {
      const service = serviceCatalog.find((candidate) => candidate.id === id);
      expect(service?.iconStrategy).toBe("simple-icons-svg");
      expect(service?.visualIdentity.iconSource).toBe("simple-icons");
    }
    // Not a 94/94 coverage goal (Section 3.2) - but the fix should recover
    // real icons for the large majority of the catalog, not a handful.
    expect(priorityServiceIds.length).toBeGreaterThanOrEqual(60);
  });
});
