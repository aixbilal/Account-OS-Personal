import { describe, expect, it } from "vitest";
import { generatePassword } from "./passwordGenerator";

describe("generatePassword", () => {
  it("honors the requested length and selected character groups", () => {
    const password = generatePassword({ length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true });
    expect(password).toHaveLength(24);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()\-_=+\[\]{}:,.?]/);
  });

  it("requires a selected character group", () => {
    expect(() => generatePassword({ length: 12, uppercase: false, lowercase: false, numbers: false, symbols: false })).toThrow();
  });
});
