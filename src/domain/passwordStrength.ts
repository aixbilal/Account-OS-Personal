/**
 * Live password-strength checklist (Phase 4 of the V3 UI correction pass).
 * This is real, testable logic - not styling - so it lives in `domain`
 * rather than inline in the editor component.
 *
 * Deliberately informational, not a gate: `AccountEditor` never blocks
 * saving on this. The "Password / sensitive value" field also holds
 * non-password secrets (API keys, PINs, recovery codes, ...), so scoring
 * every value as if it must look like a strong password would be wrong;
 * this just reports which of the five criteria the current value happens
 * to meet.
 */
export interface PasswordStrengthCheck {
  id: "length" | "uppercase" | "lowercase" | "numbers" | "symbols";
  label: string;
  met: boolean;
}

const MIN_LENGTH = 12;

export function evaluatePasswordStrength(value: string): PasswordStrengthCheck[] {
  return [
    { id: "length", label: `${MIN_LENGTH} characters`, met: value.length >= MIN_LENGTH },
    { id: "uppercase", label: "Uppercase", met: /[A-Z]/.test(value) },
    { id: "lowercase", label: "Lowercase", met: /[a-z]/.test(value) },
    { id: "numbers", label: "Numbers", met: /[0-9]/.test(value) },
    { id: "symbols", label: "Symbols", met: /[^A-Za-z0-9]/.test(value) },
  ];
}
