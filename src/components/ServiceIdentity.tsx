import type { CSSProperties } from "react";
import type { Account } from "../domain/types";
import { iconRegistry } from "../domain/iconRegistry";
import { resolveCatalogService, type CatalogService } from "../domain/serviceCatalog";

// Real bundled brand marks, keyed by catalog id (see domain/iconRegistry -
// Phase 2 of the V3 UI correction pass fixed this from a hardcoded 8-id
// allowlist to every service the installed `simple-icons` package covers).
const packagedIcons = iconRegistry;

export interface ServiceIdentity {
  id: string;
  label: string;
  monogram: string;
  accent: string;
  softAccent: string;
  iconSource: "simple-icons" | "local" | "monogram";
  iconSlug: string | null;
}

function monogramFor(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function fallbackAccent(value: string) {
  const palette = ["#477ca9", "#6076a8", "#557f86", "#776e9c", "#527393"];
  const hash = Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0);
  return palette[hash % palette.length];
}

export function resolveServiceIdentity(serviceName: string, website = "", email = ""): ServiceIdentity {
  const catalog = resolveCatalogService(serviceName, website || email);
  if (catalog) return fromCatalog(catalog);
  const label = serviceName.trim() || "Unknown service";
  return {
    id: "custom",
    label,
    monogram: monogramFor(label),
    accent: fallbackAccent(label),
    softAccent: "#edf3f8",
    iconSource: "monogram",
    iconSlug: null,
  };
}

function fromCatalog(service: CatalogService): ServiceIdentity {
  return {
    id: service.id,
    label: service.displayName,
    monogram: monogramFor(service.displayName),
    accent: service.accent,
    softAccent: service.secondaryAccent,
    iconSource: service.visualIdentity.iconSource,
    iconSlug: service.visualIdentity.iconSlug,
  };
}

type IdentityAccount = Pick<Account, "serviceName"> & Partial<Pick<Account, "email" | "website">>;

export function ServiceIdentityMark({ account, size = "regular" }: { account: IdentityAccount; size?: "small" | "regular" | "large" }) {
  const identity = resolveServiceIdentity(account.serviceName, account.website, account.email);
  const style = {
    "--service-accent": identity.accent,
    "--service-soft": identity.softAccent,
  } as CSSProperties;
  const packaged = packagedIcons[identity.id];
  return (
    <span
      aria-label={`${identity.label} local identity`}
      className={`service-identity service-identity-${size}`}
      data-service={identity.id}
      data-source={identity.iconSource}
      role="img"
      style={style}
    >
      {packaged ? (
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d={packaged.path} /></svg>
      ) : identity.id === "microsoft" ? (
        <span aria-hidden="true" className="microsoft-mark"><i /><i /><i /><i /></span>
      ) : identity.id === "linkedin" ? (
        <strong aria-hidden="true" className="linkedin-mark">in</strong>
      ) : (
        <strong aria-hidden="true">{identity.monogram}</strong>
      )}
    </span>
  );
}

export function ServiceIdentityHero({ account }: { account: Pick<Account, "serviceName" | "email" | "username" | "accountName" | "category"> & Partial<Pick<Account, "website">> }) {
  const identity = resolveServiceIdentity(account.serviceName, account.website, account.email);
  const style = {
    "--service-accent": identity.accent,
    "--service-soft": identity.softAccent,
  } as CSSProperties;
  // Phase 3 restyle: the banner watermark used to always be the 2-letter
  // monogram, even for services with a real bundled logo. When one exists,
  // fade the real mark into the banner instead; unmatched services keep
  // the monogram watermark (there's nothing else to show).
  const packaged = packagedIcons[identity.id];
  return (
    <div className="service-identity-hero" data-service={identity.id} style={style}>
      <ServiceIdentityMark account={account} size="large" />
      <div className="service-hero-copy">
        <p>{identity.label}</p>
        <h2>{account.accountName}</h2>
        <span>{account.category} · {account.email || account.username || "No sign-in identity"}</span>
      </div>
      {packaged ? (
        <svg aria-hidden="true" className="service-hero-watermark service-hero-watermark-svg" focusable="false" viewBox="0 0 24 24"><path d={packaged.path} /></svg>
      ) : (
        <strong aria-hidden="true" className="service-hero-watermark">{identity.monogram}</strong>
      )}
    </div>
  );
}
