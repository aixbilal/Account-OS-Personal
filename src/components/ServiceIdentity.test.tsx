import { describe, expect, it } from "vitest";
import { resolveServiceIdentity } from "./ServiceIdentity";

describe("ServiceIdentity local priority services", () => {
  it.each([
    ["Google", "google"], ["Apple", "apple"], ["Instagram", "instagram"], ["GitHub", "github"], ["Microsoft", "microsoft"],
    ["OpenAI", "generic"], ["Spotify", "generic"], ["Amazon", "generic"], ["Northern Star Archive", "generic"],
  ])("resolves %s without a remote asset lookup", (serviceName, kind) => {
    expect(resolveServiceIdentity(serviceName)).toMatchObject({ kind });
  });
});
