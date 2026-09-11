import { describe, expect, it } from "vitest";
import { formatTwoFactorInformation, parseTwoFactorInformation } from "./twoFactorFormat";

describe("twoFactorFormat", () => {
  it("round-trips every type with a detail", () => {
    for (const type of ["Authenticator app", "SMS", "Email code", "Security key", "Backup codes"] as const) {
      const formatted = formatTwoFactorInformation(type, "Google Authenticator");
      expect(parseTwoFactorInformation(formatted)).toEqual({ type, detail: "Google Authenticator" });
    }
  });

  it("round-trips a type with no detail", () => {
    const formatted = formatTwoFactorInformation("Security key", "");
    expect(formatted).toBe("Security key");
    expect(parseTwoFactorInformation(formatted)).toEqual({ type: "Security key", detail: "" });
  });

  it("treats an empty string as type None", () => {
    expect(parseTwoFactorInformation("")).toEqual({ type: "None", detail: "" });
    expect(formatTwoFactorInformation("None", "anything")).toBe("");
  });

  it("preserves pre-existing freeform data byte-for-byte under type Other", () => {
    const legacy = "Authenticator app + printed backup codes";
    const parsed = parseTwoFactorInformation(legacy);
    expect(parsed).toEqual({ type: "Other", detail: legacy });
    expect(formatTwoFactorInformation(parsed.type, parsed.detail)).toBe(legacy);
  });
});
