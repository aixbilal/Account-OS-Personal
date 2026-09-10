import type { CSSProperties } from "react";
import {
  siApple,
  siDiscord,
  siFacebook,
  siGithub,
  siGoogle,
  siInstagram,
  siSpotify,
  siYoutube,
} from "simple-icons";
import type { Account } from "../domain/types";
import { resolveCatalogService, type CatalogService } from "../domain/serviceCatalog";

interface LocalSimpleIcon {
  path: string;
  title: string;
}

const packagedIcons: Record<string, LocalSimpleIcon> = {
  apple: siApple,
  discord: siDiscord,
  facebook: siFacebook,
  github: siGithub,
  google: siGoogle,
  instagram: siInstagram,
  spotify: siSpotify,
  youtube: siYoutube,
};

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
  return (
    <div className="service-identity-hero" data-service={identity.id} style={style}>
      <ServiceIdentityMark account={account} size="large" />
      <div className="service-hero-copy">
        <p>{identity.label}</p>
        <h2>{account.accountName}</h2>
        <span>{account.category} · {account.email || account.username || "No sign-in identity"}</span>
      </div>
      <strong aria-hidden="true" className="service-hero-watermark">{identity.monogram}</strong>
    </div>
  );
}
