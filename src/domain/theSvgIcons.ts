/*
 * theSVG-backed icon registry (UI Refinement Pass 2 follow-up: icon source
 * migration). Each import below is a real, individually-licensed asset from
 * the @thesvg/icons package (MIT-licensed code, each brand's own upstream
 * license tracked per-icon in the package itself) - a genuine multi-color
 * source, not a themed/tinted derivative of a single-color path the way the
 * old gradient-overlay technique in ServiceIdentity.tsx was.
 *
 * Statically imported per catalog id (not resolved at runtime) so Vite/
 * Rollup can tree-shake every icon this app doesn't use - verified in the
 * build output, not assumed (see the migration report).
 *
 * Every entry here was cross-checked against the installed package's own
 * exports, not guessed from the catalog id - a handful of catalog ids use
 * a different slug in theSVG (stackoverflow -> stack-overflow,
 * huggingface -> hugging-face, etc; see the mapping table in the report).
 */
import adobeIcon from "@thesvg/icons/adobe";
import aliexpressIcon from "@thesvg/icons/aliexpress";
import amazonIcon from "@thesvg/icons/amazon";
import anthropicIcon from "@thesvg/icons/anthropic";
import appleIcon from "@thesvg/icons/apple";
import asanaIcon from "@thesvg/icons/asana";
import awsIcon from "@thesvg/icons/aws";
import bitbucketIcon from "@thesvg/icons/bitbucket";
import canvaIcon from "@thesvg/icons/canva";
import chromeIcon from "@thesvg/icons/chrome";
import cloudflareIcon from "@thesvg/icons/cloudflare";
import coinbaseIcon from "@thesvg/icons/coinbase";
import courseraIcon from "@thesvg/icons/coursera";
import cursorIcon from "@thesvg/icons/cursor";
import digitaloceanIcon from "@thesvg/icons/digitalocean";
import discordIcon from "@thesvg/icons/discord";
import disneyIcon from "@thesvg/icons/disney";
import dockerIcon from "@thesvg/icons/docker";
import dropboxIcon from "@thesvg/icons/dropbox";
import ebayIcon from "@thesvg/icons/ebay";
import epicIcon from "@thesvg/icons/epic-games";
import etsyIcon from "@thesvg/icons/etsy";
import facebookIcon from "@thesvg/icons/facebook";
import fastmailIcon from "@thesvg/icons/fastmail-badge";
import figmaIcon from "@thesvg/icons/figma";
import firebaseIcon from "@thesvg/icons/firebase";
import githubIcon from "@thesvg/icons/github";
import gitlabIcon from "@thesvg/icons/gitlab";
import gmailIcon from "@thesvg/icons/gmail";
import googleIcon from "@thesvg/icons/google";
import huggingfaceIcon from "@thesvg/icons/hugging-face";
import instagramIcon from "@thesvg/icons/instagram";
import jiraIcon from "@thesvg/icons/jira";
import khanIcon from "@thesvg/icons/khan-academy";
import linearIcon from "@thesvg/icons/linear";
import linkedinIcon from "@thesvg/icons/linkedin";
import microsoftIcon from "@thesvg/icons/microsoft";
import midjourneyIcon from "@thesvg/icons/midjourney";
import moodleIcon from "@thesvg/icons/moodle";
import netflixIcon from "@thesvg/icons/netflix";
import netlifyIcon from "@thesvg/icons/netlify";
import nintendoIcon from "@thesvg/icons/nintendo";
import notionIcon from "@thesvg/icons/notion";
import npmIcon from "@thesvg/icons/npm";
import openaiIcon from "@thesvg/icons/openai";
import payoneerIcon from "@thesvg/icons/payoneer";
import paypalIcon from "@thesvg/icons/paypal";
import perplexityIcon from "@thesvg/icons/perplexity";
import pinterestIcon from "@thesvg/icons/pinterest";
import playstationIcon from "@thesvg/icons/playstation";
import primevideoIcon from "@thesvg/icons/prime-video";
import protonIcon from "@thesvg/icons/proton";
import pypiIcon from "@thesvg/icons/pypi";
import railwayIcon from "@thesvg/icons/railway";
import redditIcon from "@thesvg/icons/reddit";
import renderIcon from "@thesvg/icons/render";
import replitIcon from "@thesvg/icons/replit";
import revolutIcon from "@thesvg/icons/revolut";
import shopifyIcon from "@thesvg/icons/shopify";
import slackIcon from "@thesvg/icons/slack";
import snapchatIcon from "@thesvg/icons/snapchat";
import spotifyIcon from "@thesvg/icons/spotify";
import stackoverflowIcon from "@thesvg/icons/stack-overflow";
import steamIcon from "@thesvg/icons/steam";
import stripeIcon from "@thesvg/icons/stripe";
import supabaseIcon from "@thesvg/icons/supabase";
import telegramIcon from "@thesvg/icons/telegram";
import telenorIcon from "@thesvg/icons/telenor";
import threadsIcon from "@thesvg/icons/threads";
import tiktokIcon from "@thesvg/icons/tiktok";
import trelloIcon from "@thesvg/icons/trello";
import twitchIcon from "@thesvg/icons/twitch";
import udemyIcon from "@thesvg/icons/udemy";
import vercelIcon from "@thesvg/icons/vercel";
import whatsappIcon from "@thesvg/icons/whatsapp";
import wiseIcon from "@thesvg/icons/wise";
import xIcon from "@thesvg/icons/x";
import xboxIcon from "@thesvg/icons/xbox";
import yahooIcon from "@thesvg/icons/yahoo-badge";
import youtubeIcon from "@thesvg/icons/youtube";
import zohoIcon from "@thesvg/icons/zoho";
import zoomIcon from "@thesvg/icons/zoom";

export interface TheSvgEntry {
  /** Official brand hex color (no "#"), as reported by the package. */
  hex: string;
  /** The brand's real look - full color where the brand has one, a single
   * flat brand color otherwise (Slack/Chrome/etc. all ship real color here). */
  color: string;
  /** A single-color silhouette variant, when the package ships one - used
   * where a flat, tintable mark is more appropriate than the full-color one. */
  mono: string | null;
  /** Theme-adapted monochrome pair (black-ish / white-ish), when the brand's
   * canonical mark is itself black-or-white rather than colored (Apple,
   * GitHub, OpenAI, Anthropic, Vercel, ...). Only present where the package
   * actually ships both. */
  themeAdaptive: { light: string; dark: string } | null;
}

function toEntry(mod: { hex: string; variants: Record<string, string> }): TheSvgEntry {
  return {
    hex: mod.hex,
    color: mod.variants.default,
    mono: mod.variants.mono ?? null,
    themeAdaptive: mod.variants.light && mod.variants.dark ? { light: mod.variants.light, dark: mod.variants.dark } : null,
  };
}

/** Catalog id -> theSVG-backed entry, for every catalog service theSVG
 * genuinely covers (82 of 96 catalog ids; the rest - Pakistani regional
 * banks/telecoms mostly - are confirmed absent from theSVG too, same gap
 * the previously-installed package had). */
export const theSvgIcons: Record<string, TheSvgEntry> = {
  adobe: toEntry(adobeIcon),
  aliexpress: toEntry(aliexpressIcon),
  amazon: toEntry(amazonIcon),
  anthropic: toEntry(anthropicIcon),
  apple: toEntry(appleIcon),
  asana: toEntry(asanaIcon),
  aws: toEntry(awsIcon),
  bitbucket: toEntry(bitbucketIcon),
  canva: toEntry(canvaIcon),
  chrome: toEntry(chromeIcon),
  cloudflare: toEntry(cloudflareIcon),
  coinbase: toEntry(coinbaseIcon),
  coursera: toEntry(courseraIcon),
  cursor: toEntry(cursorIcon),
  digitalocean: toEntry(digitaloceanIcon),
  discord: toEntry(discordIcon),
  disney: toEntry(disneyIcon),
  docker: toEntry(dockerIcon),
  dropbox: toEntry(dropboxIcon),
  ebay: toEntry(ebayIcon),
  epic: toEntry(epicIcon),
  etsy: toEntry(etsyIcon),
  facebook: toEntry(facebookIcon),
  fastmail: toEntry(fastmailIcon),
  figma: toEntry(figmaIcon),
  firebase: toEntry(firebaseIcon),
  github: toEntry(githubIcon),
  gitlab: toEntry(gitlabIcon),
  gmail: toEntry(gmailIcon),
  google: toEntry(googleIcon),
  huggingface: toEntry(huggingfaceIcon),
  instagram: toEntry(instagramIcon),
  jira: toEntry(jiraIcon),
  khan: toEntry(khanIcon),
  linear: toEntry(linearIcon),
  linkedin: toEntry(linkedinIcon),
  microsoft: toEntry(microsoftIcon),
  midjourney: toEntry(midjourneyIcon),
  moodle: toEntry(moodleIcon),
  netflix: toEntry(netflixIcon),
  netlify: toEntry(netlifyIcon),
  nintendo: toEntry(nintendoIcon),
  notion: toEntry(notionIcon),
  npm: toEntry(npmIcon),
  openai: toEntry(openaiIcon),
  payoneer: toEntry(payoneerIcon),
  paypal: toEntry(paypalIcon),
  perplexity: toEntry(perplexityIcon),
  pinterest: toEntry(pinterestIcon),
  playstation: toEntry(playstationIcon),
  primevideo: toEntry(primevideoIcon),
  proton: toEntry(protonIcon),
  pypi: toEntry(pypiIcon),
  railway: toEntry(railwayIcon),
  reddit: toEntry(redditIcon),
  render: toEntry(renderIcon),
  replit: toEntry(replitIcon),
  revolut: toEntry(revolutIcon),
  shopify: toEntry(shopifyIcon),
  slack: toEntry(slackIcon),
  snapchat: toEntry(snapchatIcon),
  spotify: toEntry(spotifyIcon),
  stackoverflow: toEntry(stackoverflowIcon),
  steam: toEntry(steamIcon),
  stripe: toEntry(stripeIcon),
  supabase: toEntry(supabaseIcon),
  telegram: toEntry(telegramIcon),
  telenor: toEntry(telenorIcon),
  threads: toEntry(threadsIcon),
  tiktok: toEntry(tiktokIcon),
  trello: toEntry(trelloIcon),
  twitch: toEntry(twitchIcon),
  udemy: toEntry(udemyIcon),
  vercel: toEntry(vercelIcon),
  whatsapp: toEntry(whatsappIcon),
  wise: toEntry(wiseIcon),
  x: toEntry(xIcon),
  xbox: toEntry(xboxIcon),
  yahoo: toEntry(yahooIcon),
  youtube: toEntry(youtubeIcon),
  zoho: toEntry(zohoIcon),
  zoom: toEntry(zoomIcon),
};
