import { iconRegistry } from "./iconRegistry";

export type ServiceIconSource = "simple-icons" | "local" | "monogram";

export interface ServiceVisualIdentity {
  iconSource: ServiceIconSource;
  iconSlug: string | null;
  iconPackage: string | null;
  iconSourceUrl: string | null;
  iconGuidelinesUrl: string | null;
  iconLicense: { type: string; url?: string } | null;
  trademarkNotice: string;
}

export interface CatalogService {
  id: string;
  displayName: string;
  domains: string[];
  aliases: string[];
  category: string;
  accent: string;
  secondaryAccent: string;
  iconStrategy: "simple-icons-svg" | "local-recognition-mark" | "neutral-local-mark";
  licenseStatus: "brand-guidelines-apply" | "local-mark-no-brand-rights" | "no-trademark-asset";
  status: "catalog-v1";
  visualIdentity: ServiceVisualIdentity;
}
const groups: Array<[string, string, string[], string[], string]> = [
  ["google","Google",["google.com","gmail.com"],["gmail","google drive","google cloud","gemini"],"identity"],["apple","Apple",["apple.com","icloud.com"],["icloud","apple music"],"identity"],["microsoft","Microsoft",["microsoft.com","outlook.com","live.com","office.com"],["outlook","onedrive","azure","teams"],"identity"],["yahoo","Yahoo",["yahoo.com"],["yahoo mail"],"identity"],["proton","Proton",["proton.me","protonmail.com"],["proton mail"],"identity"],["zoho","Zoho",["zoho.com"],[],"identity"],["fastmail","Fastmail",["fastmail.com"],[],"identity"],
  ["instagram","Instagram",["instagram.com"],[],"social"],["facebook","Facebook",["facebook.com"],[],"social"],["threads","Threads",["threads.net"],[],"social"],["x","X",["x.com","twitter.com"],["twitter"],"social"],["tiktok","TikTok",["tiktok.com"],[],"social"],["snapchat","Snapchat",["snapchat.com"],[],"social"],["linkedin","LinkedIn",["linkedin.com"],[],"social"],["pinterest","Pinterest",["pinterest.com"],[],"social"],["reddit","Reddit",["reddit.com"],[],"social"],["discord","Discord",["discord.com"],[],"social"],["telegram","Telegram",["telegram.org"],[],"social"],["whatsapp","WhatsApp",["whatsapp.com"],[],"social"],
  ["github","GitHub",["github.com"],["gist"],"developer"],["gitlab","GitLab",["gitlab.com"],[],"developer"],["bitbucket","Bitbucket",["bitbucket.org"],[],"developer"],["stackoverflow","Stack Overflow",["stackoverflow.com"],[],"developer"],["docker","Docker",["docker.com","hub.docker.com"],[],"developer"],["npm","npm",["npmjs.com"],[],"developer"],["pypi","PyPI",["pypi.org"],[],"developer"],["vercel","Vercel",["vercel.com"],[],"developer"],["netlify","Netlify",["netlify.com"],[],"developer"],["cloudflare","Cloudflare",["cloudflare.com"],[],"developer"],["supabase","Supabase",["supabase.com"],[],"developer"],["firebase","Firebase",["firebase.google.com"],[],"developer"],["aws","AWS",["aws.amazon.com"],["amazon web services"],"developer"],["digitalocean","DigitalOcean",["digitalocean.com"],[],"developer"],["render","Render",["render.com"],[],"developer"],["railway","Railway",["railway.app"],[],"developer"],
  ["openai","OpenAI",["openai.com","chatgpt.com"],["chatgpt"],"ai"],["anthropic","Anthropic",["anthropic.com","claude.ai"],["claude"],"ai"],["perplexity","Perplexity",["perplexity.ai"],[],"ai"],["huggingface","Hugging Face",["huggingface.co"],[],"ai"],["cursor","Cursor",["cursor.com"],[],"ai"],["replit","Replit",["replit.com"],[],"ai"],["midjourney","Midjourney",["midjourney.com"],[],"ai"],
  ["notion","Notion",["notion.so"],[],"work"],["slack","Slack",["slack.com"],[],"work"],["zoom","Zoom",["zoom.us"],[],"work"],["trello","Trello",["trello.com"],[],"work"],["asana","Asana",["asana.com"],[],"work"],["jira","Jira",["atlassian.net"],[],"work"],["linear","Linear",["linear.app"],[],"work"],["dropbox","Dropbox",["dropbox.com"],[],"work"],["canva","Canva",["canva.com"],[],"work"],["figma","Figma",["figma.com"],[],"work"],["adobe","Adobe",["adobe.com"],[],"work"],
  ["amazon","Amazon",["amazon.com"],[],"shopping"],["ebay","eBay",["ebay.com"],[],"shopping"],["aliexpress","AliExpress",["aliexpress.com"],[],"shopping"],["shopify","Shopify",["shopify.com"],[],"shopping"],["etsy","Etsy",["etsy.com"],[],"shopping"],["daraz","Daraz",["daraz.pk"],[],"shopping"],
  ["paypal","PayPal",["paypal.com"],[],"finance"],["stripe","Stripe",["stripe.com"],[],"finance"],["wise","Wise",["wise.com"],[],"finance"],["payoneer","Payoneer",["payoneer.com"],[],"finance"],["revolut","Revolut",["revolut.com"],[],"finance"],["coinbase","Coinbase",["coinbase.com"],[],"finance"],["jazzcash","JazzCash",["jazzcash.com.pk"],[],"finance"],["easypaisa","Easypaisa",["easypaisa.com.pk"],[],"finance"],["sadapay","SadaPay",["sadapay.pk"],[],"finance"],["nayapay","NayaPay",["nayapay.com"],[],"finance"],["hbl","HBL",["hbl.com"],[],"finance"],["meezan","Meezan Bank",["meezanbank.com"],[],"finance"],["ubl","UBL",["ubl.com.pk"],[],"finance"],["mcb","MCB",["mcb.com.pk"],[],"finance"],["alfalah","Bank Alfalah",["bankalfalah.com"],[],"finance"],
  ["youtube","YouTube",["youtube.com"],[],"streaming"],["netflix","Netflix",["netflix.com"],[],"streaming"],["spotify","Spotify",["spotify.com"],[],"streaming"],["primevideo","Prime Video",["primevideo.com"],[],"streaming"],["disney","Disney+",["disneyplus.com"],[],"streaming"],["twitch","Twitch",["twitch.tv"],[],"streaming"],["steam","Steam",["steampowered.com"],[],"gaming"],["epic","Epic Games",["epicgames.com"],[],"gaming"],["playstation","PlayStation",["playstation.com"],[],"gaming"],["xbox","Xbox",["xbox.com"],[],"gaming"],["nintendo","Nintendo",["nintendo.com"],[],"gaming"],["coursera","Coursera",["coursera.org"],[],"education"],["udemy","Udemy",["udemy.com"],[],"education"],["khan","Khan Academy",["khanacademy.org"],[],"education"],["moodle","Moodle",["moodle.org"],[],"education"],["jazz","Jazz",["jazz.com.pk"],[],"telecom"],["zong","Zong",["zong.com.pk"],[],"telecom"],["ufone","Ufone",["ufone.com"],[],"telecom"],["telenor","Telenor",["telenor.com.pk"],[],"telecom"],["ptcl","PTCL",["ptcl.com.pk"],[],"telecom"]
];
const SIMPLE_ICONS_PACKAGE = "simple-icons@16.30.0";
const PACKAGE_TRADEMARK_NOTICE =
  "Simple Icons package licensing does not grant rights to the represented brand or trademark.";
const LOCAL_MARK_NOTICE =
  "Account OS supplies a local recognition mark because this brand is not exported by the installed Simple Icons package; no brand rights are granted.";
const MONOGRAM_NOTICE =
  "Account OS generates this local monogram and does not bundle a third-party brand asset.";

const priorityVisuals: Record<string, {
  accent: string;
  secondaryAccent: string;
  iconStrategy: CatalogService["iconStrategy"];
  licenseStatus: CatalogService["licenseStatus"];
  visualIdentity: ServiceVisualIdentity;
}> = {
  google: simpleIconVisual(
    "google",
    "#4285F4",
    "#EAF2FF",
    "https://partnermarketinghub.withgoogle.com",
    "https://about.google/brand-resource-center/brand-elements/",
  ),
  spotify: simpleIconVisual(
    "spotify",
    "#1ED760",
    "#E8F9EE",
    "https://developer.spotify.com/documentation/general/design-and-branding/#using-our-logo",
    "https://developer.spotify.com/documentation/general/design-and-branding/#using-our-logo",
  ),
  github: simpleIconVisual(
    "github",
    "#181717",
    "#ECEFF2",
    "https://github.com/logos",
    "https://github.com/logos",
  ),
  instagram: simpleIconVisual(
    "instagram",
    "#FF0069",
    "#FDEAF3",
    "https://about.meta.com/brand/resources/instagram",
    "https://about.meta.com/brand/resources/instagram",
  ),
  apple: simpleIconVisual(
    "apple",
    "#000000",
    "#ECEFF2",
    "https://www.apple.com",
    null,
  ),
  youtube: simpleIconVisual(
    "youtube",
    "#FF0000",
    "#FDECEC",
    "https://www.youtube.com/howyoutubeworks/resources/brand-resources/#logos-icons-and-colors",
    "https://www.youtube.com/howyoutubeworks/resources/brand-resources/#logos-icons-and-colors",
  ),
  discord: simpleIconVisual(
    "discord",
    "#5865F2",
    "#EEF0FF",
    "https://discord.com/branding",
    "https://discord.com/branding",
  ),
  facebook: simpleIconVisual(
    "facebook",
    "#0866FF",
    "#EAF2FF",
    "https://about.meta.com/brand/resources/facebook/logo",
    "https://about.meta.com/brand/resources/facebook/logo",
  ),
  microsoft: localVisual("#5E5E5E", "#EEF3F7"),
  linkedin: localVisual("#0A66C2", "#EAF3FB"),
};

function simpleIconVisual(
  iconSlug: string,
  accent: string,
  secondaryAccent: string,
  iconSourceUrl: string,
  iconGuidelinesUrl: string | null,
) {
  return {
    accent,
    secondaryAccent,
    iconStrategy: "simple-icons-svg" as const,
    licenseStatus: "brand-guidelines-apply" as const,
    visualIdentity: {
      iconSource: "simple-icons" as const,
      iconSlug,
      iconPackage: SIMPLE_ICONS_PACKAGE,
      iconSourceUrl,
      iconGuidelinesUrl,
      iconLicense: null,
      trademarkNotice: PACKAGE_TRADEMARK_NOTICE,
    },
  };
}

/**
 * A pale tint of `hex`, mixed toward white. Used to derive a chip/badge
 * background for every service that gets its color from `iconRegistry`
 * (the package's own official brand hex) rather than a hand-curated pair,
 * so the auto-covered ~55 services (Phase 2) still get a soft, on-brand
 * secondary accent instead of one flat neutral gray.
 */
function paleTint(hex: string, mixWithWhite = 0.9) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * mixWithWhite);
  return `#${[r, g, b].map((channel) => mix(channel).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Builds a `simple-icons`-backed visual identity straight from the
 * installed package's own data (hex, guidelines URL) for a catalog id that
 * `iconRegistry` covers but that has no hand-curated entry in
 * `priorityVisuals` above. This is the Phase 2 fix: previously only the 10
 * ids in `priorityVisuals` ever got a real icon, even though the package
 * bundles real marks for dozens more (PayPal included).
 */
function registryVisual(id: string) {
  const icon = iconRegistry[id];
  if (!icon) return undefined;
  const accent = `#${icon.hex}`;
  return {
    accent,
    secondaryAccent: paleTint(accent),
    iconStrategy: "simple-icons-svg" as const,
    licenseStatus: "brand-guidelines-apply" as const,
    visualIdentity: {
      iconSource: "simple-icons" as const,
      iconSlug: icon.slug,
      iconPackage: SIMPLE_ICONS_PACKAGE,
      iconSourceUrl: icon.guidelines ?? null,
      iconGuidelinesUrl: icon.guidelines ?? null,
      iconLicense: null,
      trademarkNotice: PACKAGE_TRADEMARK_NOTICE,
    },
  };
}

function localVisual(accent: string, secondaryAccent: string) {
  return {
    accent,
    secondaryAccent,
    iconStrategy: "local-recognition-mark" as const,
    licenseStatus: "local-mark-no-brand-rights" as const,
    visualIdentity: {
      iconSource: "local" as const,
      iconSlug: null,
      iconPackage: null,
      iconSourceUrl: null,
      iconGuidelinesUrl: null,
      iconLicense: null,
      trademarkNotice: LOCAL_MARK_NOTICE,
    },
  };
}

export const serviceCatalog: CatalogService[] = groups.map(
  ([id, displayName, domains, aliases, category], index) => {
    const visual = priorityVisuals[id] ?? registryVisual(id);
    if (visual) {
      return {
        id,
        displayName,
        domains,
        aliases,
        category,
        ...visual,
        status: "catalog-v1",
      };
    }

    // Phase 2 restyle: previously every fallback shared one flat gray
    // (`#E7EDF2`) regardless of its rotating accent, which read as dull. The
    // secondary accent is now a pale tint of that same entry's own accent,
    // so each unmatched service still gets a coherent two-tone mark instead
    // of a colored ring around a gray disc.
    const monogramAccent = ["#3B5E86", "#8A4E72", "#3F6B73", "#5C7050"][index % 4];
    return {
      id,
      displayName,
      domains,
      aliases,
      category,
      accent: monogramAccent,
      secondaryAccent: paleTint(monogramAccent, 0.88),
      iconStrategy: "neutral-local-mark",
      licenseStatus: "no-trademark-asset",
      status: "catalog-v1",
      visualIdentity: {
        iconSource: "monogram",
        iconSlug: null,
        iconPackage: null,
        iconSourceUrl: null,
        iconGuidelinesUrl: null,
        iconLicense: null,
        trademarkNotice: MONOGRAM_NOTICE,
      },
    };
  },
);

/**
 * Every catalog id that renders a real brand mark - either a `simple-icons`
 * SVG (hand-curated in `priorityVisuals` or auto-derived via
 * `registryVisual`/`iconRegistry`) or a hand-built local recognition mark
 * (Microsoft, LinkedIn) - as opposed to the generic neutral monogram.
 * Derived from `serviceCatalog` itself (rather than hand-maintained) so it
 * can't silently drift out of sync with `iconRegistry` the way the old
 * hardcoded 10-id list did, which is what caused the Phase 2 bug: PayPal
 * (and ~50 other services the bundled icon package already covers) fell
 * back to a monogram purely because this list forgot to mention them.
 */
export const priorityServiceIds = serviceCatalog
  .filter((service) => service.iconStrategy !== "neutral-local-mark")
  .map((service) => service.id);

export const genericIdentityCategories = [
  "Email",
  "Social",
  "Bank",
  "Finance",
  "University / Education",
  "Government",
  "Work",
  "Personal",
  "Shopping",
  "Healthcare",
  "Hosting",
  "Developer",
  "AI",
  "Gaming",
  "Streaming",
  "Telecom",
  "Router / Network",
  "Generic Website",
] as const;

export function normalizeServiceInput(value: string) {
  const trimmed = value.trim().toLowerCase();
  const emailDomain = trimmed.includes("@") ? trimmed.slice(trimmed.lastIndexOf("@") + 1) : trimmed;
  return emailDomain
    .replace(/^[a-z][a-z\d+.-]*:\/\//, "")
    .split(/[/?#]/)[0]
    .replace(/^www\./, "")
    .replace(/:\d+$/, "");
}

export function resolveCatalogService(serviceName: string, domain = "") {
  const input = normalizeServiceInput(domain || serviceName);
  const searchable = (serviceName + " " + domain).toLowerCase();
  return serviceCatalog.find(
    (service) =>
      service.domains.some((candidate) => input === candidate || input.endsWith("." + candidate))
      || service.aliases.some((alias) => searchable.includes(alias))
      || service.displayName.toLowerCase() === serviceName.trim().toLowerCase(),
  );
}
