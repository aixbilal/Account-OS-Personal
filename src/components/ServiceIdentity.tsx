import type { Account } from "../domain/types";
import { resolveCatalogService } from "../domain/serviceCatalog";

type IdentityKind = "google" | "instagram" | "github" | "microsoft" | "apple" | "generic";

export interface ServiceIdentity {
  kind: IdentityKind;
  label: string;
  monogram: string;
}

const knownServices: Array<{ kind: Exclude<IdentityKind, "generic">; names: string[]; label: string; monogram: string }> = [
  { kind: "google", names: ["google"], label: "Google", monogram: "G" },
  { kind: "instagram", names: ["instagram"], label: "Instagram", monogram: "I" },
  { kind: "github", names: ["github"], label: "GitHub", monogram: "GH" },
  { kind: "microsoft", names: ["microsoft", "outlook", "office", "azure"], label: "Microsoft", monogram: "M" },
  { kind: "apple", names: ["apple", "icloud"], label: "Apple", monogram: "A" },
];

/** Local-only identity resolver. It never fetches favicons, domains, or external assets. */
export function resolveServiceIdentity(serviceName: string, email = ""): ServiceIdentity {
  const catalog = resolveCatalogService(serviceName, email);
  if (catalog) return { kind: (["google", "instagram", "github", "microsoft", "apple"].includes(catalog.id) ? catalog.id : "generic") as IdentityKind, label: catalog.displayName, monogram: catalog.displayName.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() };
  const candidate = `${serviceName} ${email}`.toLowerCase();
  const found = knownServices.find((service) => service.names.some((name) => candidate.includes(name)));
  if (found) return { kind: found.kind, label: found.label, monogram: found.monogram };

  const letters = serviceName.trim().split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return { kind: "generic", label: serviceName || "Unknown service", monogram: letters || "?" };
}

export function ServiceIdentityMark({ account, size = "regular" }: { account: Pick<Account, "serviceName" | "email">; size?: "small" | "regular" | "large" }) {
  const identity = resolveServiceIdentity(account.serviceName, account.email);
  const catalog = resolveCatalogService(account.serviceName, account.email);
  const mark = catalog?.id ?? identity.kind;
  if (identity.kind === "microsoft") {
    return <span className={`service-identity service-identity-${size} service-microsoft`} aria-label={`${identity.label} local identity`}><i /><i /><i /><i /></span>;
  }
  if (identity.kind === "instagram") return <span className={`service-identity service-identity-${size} service-instagram`} aria-label={`${identity.label} local identity`}><i /></span>;
  if (identity.kind === "google") return <span className={`service-identity service-identity-${size} service-google`} aria-label={`${identity.label} local identity`}><b>G</b></span>;
  const glyphs: Record<string, string> = { github: "<>", apple: "●", spotify: "≋", openai: "◎", amazon: "a", facebook: "f", linkedin: "in", discord: "◉", slack: "#", figma: "F", canva: "C", supabase: "S", vercel: "▲", cloudflare: "☁", paypal: "P", stripe: "S", jazzcash: "J", easypaisa: "E", sadapay: "S", nayapay: "N" };
  return <span className={`service-identity service-identity-${size} service-${mark}`} aria-label={`${identity.label} local identity`}>{glyphs[mark] ?? identity.monogram}</span>;
}

export function ServiceIdentityHero({ account }: { account: Pick<Account, "serviceName" | "email" | "accountName" | "category"> }) {
  const identity = resolveServiceIdentity(account.serviceName, account.email);
  return <div className="service-identity-hero"><ServiceIdentityMark account={account} size="large" /><div><p className="service-hero-name">{identity.label}</p><h2>{account.accountName}</h2><span>{account.category} · {account.email || account.serviceName}</span></div><strong aria-hidden="true">{identity.monogram}</strong></div>;
}
