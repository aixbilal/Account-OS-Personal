import type { CSSProperties } from "react";
import type { Account } from "../domain/types";
import { iconRegistry } from "../domain/iconRegistry";
import { resolveCatalogService, type CatalogService } from "../domain/serviceCatalog";
import { theSvgIcons, type TheSvgEntry } from "../domain/theSvgIcons";

// Real bundled brand marks, keyed by catalog id (see domain/iconRegistry -
// Phase 2 of the V3 UI correction pass fixed this from a hardcoded 8-id
// allowlist to every service the installed `simple-icons` package covers).
// Icon source migration (UI Refinement Pass 2 follow-up): `theSvgIcons`
// (below) is checked first now - this is kept as fallback tier 3, for any
// catalog id theSVG genuinely doesn't cover (see the migration report's
// resolution-order table; currently every id this stays reachable for
// happens to also be covered by theSVG, so this tier is dormant today, not
// removed - a real future catalog addition may need it).
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

/**
 * Renders a theSVG-sourced mark by injecting its own real markup directly
 * (each entry is a complete `<svg>...</svg>` string with its own viewBox
 * and, for full-color marks, its own per-path fill colors) rather than
 * re-deriving a single `d` path and re-coloring it the way the old
 * `TrueColorGlyph` gradient-overlay technique had to for Google/Instagram.
 * `dangerouslySetInnerHTML` is safe here: the markup comes only from our
 * own bundled `@thesvg/icons` dependency, never from account/user data.
 *
 * For brands whose canonical mark is itself black-or-white rather than
 * colored (`themeAdaptive`), both the light-background and dark-background
 * variant are rendered and CSS (`.thesvg-theme-light`/`-dark`, tokens.css'
 * `[data-theme="dark"]` selector) shows only the one that matches the
 * active theme - simpler and more robust than detecting theme in JS, and
 * consistent with how the rest of this app themes things.
 */
function TheSvgGlyph({ entry }: { entry: TheSvgEntry }) {
  if (entry.themeAdaptive) {
    return (
      <>
        <span aria-hidden="true" className="thesvg-icon thesvg-theme-light" dangerouslySetInnerHTML={{ __html: entry.themeAdaptive.light }} />
        <span aria-hidden="true" className="thesvg-icon thesvg-theme-dark" dangerouslySetInnerHTML={{ __html: entry.themeAdaptive.dark }} />
      </>
    );
  }
  return <span aria-hidden="true" className="thesvg-icon" dangerouslySetInnerHTML={{ __html: entry.color }} />;
}

export function ServiceIdentityMark({ account, size = "regular" }: { account: IdentityAccount; size?: "small" | "regular" | "large" }) {
  const identity = resolveServiceIdentity(account.serviceName, account.website, account.email);
  const style = {
    "--service-accent": identity.accent,
    "--service-soft": identity.softAccent,
  } as CSSProperties;
  const theSvg = theSvgIcons[identity.id];
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
      {theSvg ? (
        <TheSvgGlyph entry={theSvg} />
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
  // the monogram watermark (there's nothing else to show). Prefers
  // theSVG's single-tone `mono` variant for the watermark specifically
  // (a huge, low-opacity background silhouette reads better as one tone
  // than as the full-color mark); falls back to the full-color mark for
  // the handful of brands (Slack) that don't ship a mono variant, and
  // further to the old `simple-icons` path for anything theSVG lacks.
  const theSvg = theSvgIcons[identity.id];
  const packaged = packagedIcons[identity.id];
  const watermarkMarkup = theSvg?.mono ?? theSvg?.color;
  return (
    <div className="service-identity-hero" data-service={identity.id} style={style}>
      <ServiceIdentityMark account={account} size="large" />
      <div className="service-hero-copy">
        <p>{identity.label}</p>
        <h2>{account.accountName}</h2>
        <span>{account.category} · {account.email || account.username || "No sign-in identity"}</span>
      </div>
      {watermarkMarkup ? (
        <span aria-hidden="true" className="service-hero-watermark service-hero-watermark-svg" dangerouslySetInnerHTML={{ __html: watermarkMarkup }} />
      ) : packaged ? (
        <svg aria-hidden="true" className="service-hero-watermark service-hero-watermark-svg" focusable="false" viewBox="0 0 24 24"><path d={packaged.path} /></svg>
      ) : (
        <strong aria-hidden="true" className="service-hero-watermark">{identity.monogram}</strong>
      )}
    </div>
  );
}
