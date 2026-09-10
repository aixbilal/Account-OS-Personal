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
    ["MAIL.GOOGLE.COM", "Google"],
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

    expect(serviceCatalog).toHaveLength(94);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(domains).size).toBe(domains.length);
    expect(new Set(aliases).size).toBe(aliases.length);
    expect(domains.every((domain) => /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain))).toBe(true);
    expect(serviceCatalog.every((service) => service.status === "catalog-v1" && Boolean(service.visualIdentity.trademarkNotice))).toBe(true);
    expect(priorityServiceIds.every((id) => serviceCatalog.some((service) => service.id === id && service.iconStrategy !== "neutral-local-mark"))).toBe(true);
    expect(serviceCatalog.filter((service) => !priorityServiceIds.includes(service.id as typeof priorityServiceIds[number])).every((service) => service.iconStrategy === "neutral-local-mark" && service.licenseStatus === "no-trademark-asset")).toBe(true);
  });
});
