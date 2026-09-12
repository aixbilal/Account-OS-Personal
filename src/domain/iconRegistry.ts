/*
 * Local, bundled brand icon registry (Phase 2 of the V3 UI correction pass).
 *
 * Root cause of the "PayPal renders as a monogram" bug: `ServiceIdentity`
 * used to hardcode a mark for exactly the 10 `priorityServiceIds`, so every
 * other catalog service fell back to a generic monogram even when the
 * `simple-icons` package already ships its real logo. This registry is the
 * fix: it names, once, every catalog service id that the *installed*
 * `simple-icons@16.30.0` package actually exports a real icon for, using
 * static named imports (so Vite/Rollup can still tree-shake unused icons).
 *
 * This is not an attempt at 94/94 coverage (see Section 3.2 of the plan) -
 * some real, major brands (Microsoft, LinkedIn, Amazon, Adobe, AWS, Slack,
 * OpenAI, Canva, Disney, Xbox, Nintendo, ...) are not exported by this
 * package version at all (verified: `Object.keys(require('simple-icons'))`
 * has no `siMicrosoft`/`siAmazon`/`siAdobe`/`siLinkedin`/`siSlack`/`siAws`
 * entry - several were removed from the project over the years after
 * trademark takedown requests). Those keep whatever local recognition mark
 * or monogram they already had; adding new hand-drawn marks for them is out
 * of scope for this fix (that would be inventing a new asset, not fixing a
 * matching failure against an icon that was already available).
 */
import {
  siAliexpress, siAnthropic, siApple, siAsana, siBitbucket, siCloudflare, siCoinbase, siCoursera,
  siCursor, siDigitalocean, siDiscord, siDocker, siDropbox, siEbay, siEpicgames, siEtsy, siFacebook,
  siFigma, siFirebase, siGithub, siGitlab, siGmail, siGoogle, siHuggingface, siInstagram, siJira,
  siKhanacademy, siLinear, siMoodle, siNetflix, siNetlify, siNotion, siNpm, siPayoneer, siPaypal,
  siPerplexity, siPinterest, siPlaystation, siProton, siPypi, siRailway, siReddit, siRender,
  siReplit, siRevolut, siShopify, siSnapchat, siSpotify, siStackoverflow, siSteam, siStripe,
  siSupabase, siTelegram, siTelenor, siThreads, siTiktok, siTrello, siTwitch, siUdemy, siVercel,
  siWhatsapp, siWise, siX, siYoutube, siZoho, siZoom,
} from "simple-icons";

export interface RegisteredIcon {
  /** SVG path data for the mark. */
  path: string;
  /** Human-readable brand name, as reported by the package. */
  title: string;
  /** Official brand hex color (no `#`), as reported by the package. */
  hex: string;
  /** The package's own slug for this icon (used for attribution/notices). */
  slug: string;
  /** Official brand guideline URL, when the package records one. */
  guidelines?: string;
}

/**
 * Catalog service id -> real bundled icon, for every `serviceCatalog` entry
 * where `simple-icons@16.30.0` exports a usable mark. Keyed by catalog id,
 * not by the package's own slug, since a few ids (`epic`, `khan`) map to a
 * differently-named export (`siEpicgames`, `siKhanacademy`).
 */
export const iconRegistry: Record<string, RegisteredIcon> = {
  google: siGoogle,
  gmail: siGmail,
  apple: siApple,
  proton: siProton,
  zoho: siZoho,
  instagram: siInstagram,
  facebook: siFacebook,
  threads: siThreads,
  x: siX,
  tiktok: siTiktok,
  snapchat: siSnapchat,
  pinterest: siPinterest,
  reddit: siReddit,
  discord: siDiscord,
  telegram: siTelegram,
  whatsapp: siWhatsapp,
  github: siGithub,
  gitlab: siGitlab,
  bitbucket: siBitbucket,
  stackoverflow: siStackoverflow,
  docker: siDocker,
  npm: siNpm,
  pypi: siPypi,
  vercel: siVercel,
  netlify: siNetlify,
  cloudflare: siCloudflare,
  supabase: siSupabase,
  firebase: siFirebase,
  digitalocean: siDigitalocean,
  render: siRender,
  railway: siRailway,
  anthropic: siAnthropic,
  perplexity: siPerplexity,
  huggingface: siHuggingface,
  cursor: siCursor,
  replit: siReplit,
  notion: siNotion,
  zoom: siZoom,
  trello: siTrello,
  asana: siAsana,
  jira: siJira,
  linear: siLinear,
  dropbox: siDropbox,
  figma: siFigma,
  ebay: siEbay,
  aliexpress: siAliexpress,
  shopify: siShopify,
  etsy: siEtsy,
  paypal: siPaypal,
  stripe: siStripe,
  wise: siWise,
  payoneer: siPayoneer,
  revolut: siRevolut,
  coinbase: siCoinbase,
  youtube: siYoutube,
  netflix: siNetflix,
  spotify: siSpotify,
  twitch: siTwitch,
  steam: siSteam,
  playstation: siPlaystation,
  coursera: siCoursera,
  udemy: siUdemy,
  moodle: siMoodle,
  telenor: siTelenor,
  epic: siEpicgames,
  khan: siKhanacademy,
};
