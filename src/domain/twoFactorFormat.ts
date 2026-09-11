/**
 * 2FA type dropdown + free-text example field (Phase 4, Section 3.3).
 *
 * The vault schema (`Account.twoFactorInformation`) stays a single string -
 * this is a UI-only decomposition, not a data-model change, so it needs no
 * Rust/vault-schema change (out of scope for this workstream regardless).
 * A "type" is combined with its free-text detail into one string on save,
 * and parsed back into type + detail when an existing account is opened
 * for editing.
 *
 * Round-trip is lossless for both shapes of existing data:
 *  - empty string -> type "None", detail ""
 *  - anything else that isn't a recognized "<Type>: " prefix -> type
 *    "Other", detail = the original string verbatim (formatting "Other"
 *    back out never adds a prefix), so pre-existing freeform values (e.g.
 *    the seeded "Authenticator app + printed backup codes") are preserved
 *    exactly rather than being reinterpreted or truncated.
 */
export const TWO_FACTOR_TYPES = [
  "None",
  "Authenticator app",
  "SMS",
  "Email code",
  "Security key",
  "Backup codes",
  "Other",
] as const;

export type TwoFactorType = (typeof TWO_FACTOR_TYPES)[number];

export const twoFactorTypeExamplePlaceholder: Partial<Record<TwoFactorType, string>> = {
  "Authenticator app": "e.g. Google Authenticator, Authy",
  SMS: "e.g. the phone number on file",
  "Email code": "e.g. the recovery email code is sent to",
  "Security key": "e.g. YubiKey 5C, Titan Key",
  "Backup codes": "e.g. where the codes are stored",
  Other: "Describe the 2FA / additional security method",
};

export function parseTwoFactorInformation(value: string): { detail: string; type: TwoFactorType } {
  if (!value.trim()) return { type: "None", detail: "" };
  for (const type of TWO_FACTOR_TYPES) {
    if (type === "None" || type === "Other") continue;
    const prefix = `${type}: `;
    if (value.startsWith(prefix)) return { type, detail: value.slice(prefix.length) };
    if (value === type) return { type, detail: "" };
  }
  return { type: "Other", detail: value };
}

export function formatTwoFactorInformation(type: TwoFactorType, detail: string): string {
  const trimmedDetail = detail.trim();
  if (type === "None") return "";
  if (type === "Other") return trimmedDetail;
  return trimmedDetail ? `${type}: ${trimmedDetail}` : type;
}
