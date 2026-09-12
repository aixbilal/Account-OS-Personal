import { useId, type CSSProperties } from "react";
import type { Account } from "../domain/types";
import { iconRegistry } from "../domain/iconRegistry";
import { resolveCatalogService, type CatalogService } from "../domain/serviceCatalog";

// Real bundled brand marks, keyed by catalog id (see domain/iconRegistry -
// Phase 2 of the V3 UI correction pass fixed this from a hardcoded 8-id
// allowlist to every service the installed `simple-icons` package covers).
const packagedIcons = iconRegistry;

/**
 * A small, hand-curated set of catalog ids whose *real* brand mark is
 * genuinely multi-color - as opposed to the vast majority of
 * `simple-icons`-backed marks, which are correctly single-color by that
 * package's own design (Item 4, V3 fixture pass). Each entry reuses the
 * exact already-bundled/licensed `simple-icons` path for that id (Google's
 * "G", Gmail's envelope, Instagram's camera) and swaps only its fill from a
 * flat accent to the brand's own multi-hue palette - no new path geometry
 * is invented. Approximated as a straight gradient across the real brand
 * colors rather than the literal pinwheel/segment geometry (Google's G,
 * for instance) - close enough to read as "genuinely multi-color" without
 * hand-tracing brand artwork bezier-for-bezier.
 */
const trueColorGradientStops: Record<string, string[]> = {
  google: ["#4285F4", "#34A853", "#FBBC05", "#EA4335"],
  gmail: ["#EA4335", "#FBBC04", "#34A853", "#4285F4"],
  instagram: ["#4F5BD5", "#962FBF", "#D62976", "#FA7E1E", "#FEDA75"],
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

/** Renders an already-bundled/licensed `simple-icons` path filled with a
 * real multi-hue brand gradient instead of one flat accent (see
 * `trueColorGradientStops`). A per-instance gradient id (`useId`) avoids
 * collisions when the same service's mark renders more than once on a
 * page (sidebar row + inspector header + Map node, for example). */
function TrueColorGlyph({ path, stops }: { path: string; stops: string[] }) {
  const gradientId = `service-gradient-${useId()}`;
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {stops.map((color, index) => <stop key={color} offset={`${(index / (stops.length - 1)) * 100}%`} stopColor={color} />)}
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${gradientId})`} />
    </svg>
  );
}

export function ServiceIdentityMark({ account, size = "regular" }: { account: IdentityAccount; size?: "small" | "regular" | "large" }) {
  const identity = resolveServiceIdentity(account.serviceName, account.website, account.email);
  const style = {
    "--service-accent": identity.accent,
    "--service-soft": identity.softAccent,
  } as CSSProperties;
  const packaged = packagedIcons[identity.id];
  const gradientStops = trueColorGradientStops[identity.id];
  return (
    <span
      aria-label={`${identity.label} local identity`}
      className={`service-identity service-identity-${size}`}
      data-service={identity.id}
      data-source={identity.iconSource}
      role="img"
      style={style}
    >
      {packaged && gradientStops ? (
        <TrueColorGlyph path={packaged.path} stops={gradientStops} />
      ) : packaged ? (
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d={packaged.path} /></svg>
      ) : identity.id === "microsoft" ? (
        <span aria-hidden="true" className="microsoft-mark"><i /><i /><i /><i /></span>
      ) : identity.id === "chrome" ? (
        <span aria-hidden="true" className="chrome-mark"><i className="chrome-mark-ring" /><i className="chrome-mark-center" /></span>
      ) : identity.id === "slack" ? (
        <span aria-hidden="true" className="slack-mark"><i /><i /><i /><i /></span>
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
