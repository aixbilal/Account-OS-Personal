import { describe, expect, it, vi } from "vitest";
import { genericIdentityCategories, normalizeServiceInput, resolveCatalogService, serviceCatalog } from "./serviceCatalog";
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
    expect(resolveServiceIdentity("Le Grain Admin")).toMatchObject({ kind: "generic", monogram: "LG" });
    expect(normalizeServiceInput("HTTPS://WWW.GITHUB.COM/settings")).toBe("github.com");
  });

  it("does not perform a network request while resolving", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    resolveCatalogService("", "https://github.com/settings");
    resolveServiceIdentity("Unknown service");
    expect(fetch).not.toHaveBeenCalled();
  });
});
