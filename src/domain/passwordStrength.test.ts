import { describe, expect, it } from "vitest";
import { evaluatePasswordStrength } from "./passwordStrength";

describe("evaluatePasswordStrength", () => {
  it("reports all five criteria for an empty value as unmet", () => {
    const checks = evaluatePasswordStrength("");
    expect(checks).toHaveLength(5);
    expect(checks.every((check) => !check.met)).toBe(true);
  });

  it("marks each criterion independently", () => {
    const checks = evaluatePasswordStrength("abcDEF123!@#456789");
    const byId = Object.fromEntries(checks.map((check) => [check.id, check.met]));
    expect(byId).toEqual({ length: true, uppercase: true, lowercase: true, numbers: true, symbols: true });
  });

  it("requires at least 12 characters for the length criterion", () => {
    expect(evaluatePasswordStrength("Ab1!Ab1!Ab1").find((c) => c.id === "length")?.met).toBe(false);
    expect(evaluatePasswordStrength("Ab1!Ab1!Ab1!").find((c) => c.id === "length")?.met).toBe(true);
  });

  it("does not treat a non-password sensitive value as automatically weak or invalid - it just reports the same five criteria", () => {
    // e.g. a PIN or API key saved in the "Password / sensitive value" field.
    const checks = evaluatePasswordStrength("4821");
    expect(checks).toMatchObject([
      { id: "length", met: false },
      { id: "uppercase", met: false },
      { id: "lowercase", met: false },
      { id: "numbers", met: true },
      { id: "symbols", met: false },
    ]);
  });
});
