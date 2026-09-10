#!/usr/bin/env node
/*
 * ============================================================================
 *  DEV / TEST FIXTURE GENERATOR  --  scripts/dev-seed-vault.mjs
 * ============================================================================
 *
 *  WHAT THIS IS
 *    Generates a synthetic Account OS vault snapshot so the app can be
 *    reviewed and demoed as if it were "in use" -- 18 fake accounts across
 *    every category and auth method, plus 12 relationships (recovery-for,
 *    depends-on, SSO, 2FA-device, owns, linked).
 *
 *  WHAT THIS IS NOT
 *    - It NEVER reads, writes, decrypts, or deletes a real Account OS vault.
 *    - It does not touch Tauri app-data, the encrypted envelope, or backups.
 *    - It only writes ONE plain JSON file: src/data/devSeedVault.json
 *    - Every credential here is an obvious non-secret placeholder of the form
 *      "demo-not-a-real-password-<n>". No real emails, no real passwords.
 *
 *  HOW IT REACHES THE APP
 *    src/data/devSeedVault.ts imports the JSON and the renderer loads it ONLY
 *    when BOTH are true:
 *        import.meta.env.DEV === true      (never in a production build)
 *        location.search contains ?seed=1
 *    It is passed as <App previewVault={...}> -- renderer state only. In the
 *    browser dev server the app is not a Tauri runtime, so persistVault() is
 *    a no-op and nothing is saved anywhere.
 *
 *  USAGE
 *    node scripts/dev-seed-vault.mjs            # regenerate the JSON file
 *    node scripts/dev-seed-vault.mjs --stdout   # print JSON, write nothing
 *    npm run dev  then open  http://localhost:1420/?seed=1
 * ============================================================================
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(HERE, "../src/data/devSeedVault.json");

// Fixed timestamps so re-running produces a clean, stable diff.
const T0 = "2026-01-04T09:15:00.000Z";
const fakePw = (n) => `demo-not-a-real-password-${n}`;

/** @type {Array<Omit<import("../src/domain/types").Account, "createdAt"|"updatedAt"> & {ageDays?: number, updatedDaysAgo?: number}>} */
const ACCOUNTS = [
  { id: "seed-google-personal", serviceName: "Google", accountName: "Google (personal)", category: "Personal",
    username: "", email: "alex.demo@example.test", website: "https://accounts.google.com", password: fakePw(1),
    authenticationMethod: "Password", recoveryInformation: "Recovery phone on file; backup codes in the notes app.",
    twoFactorInformation: "Authenticator app + printed backup codes", notes: "Primary identity hub. Gmail, Drive, YouTube, Android all hang off this.",
    ageDays: 1400, updatedDaysAgo: 12 },

  { id: "seed-gmail", serviceName: "Gmail", accountName: "Gmail", category: "Personal",
    username: "", email: "alex.demo@example.test", website: "https://mail.google.com", password: fakePw(1),
    authenticationMethod: "Google SSO", recoveryInformation: "Same as Google personal.", twoFactorInformation: "Inherited from Google account",
    notes: "Same credentials as Google personal; listed separately because so many things use it as the recovery address.",
    ageDays: 1400, updatedDaysAgo: 12 },

  { id: "seed-android", serviceName: "Android Device", accountName: "Pixel phone", category: "Personal",
    username: "", email: "alex.demo@example.test", website: "", password: fakePw(2),
    authenticationMethod: "Google SSO", recoveryInformation: "Device PIN; Find My Device via Google.", twoFactorInformation: "Device unlock + Google account",
    notes: "This phone is the authenticator for several other accounts.", ageDays: 520, updatedDaysAgo: 3 },

  { id: "seed-github", serviceName: "GitHub", accountName: "GitHub", category: "Development",
    username: "alex-demo-dev", email: "alex.dev@example.test", website: "https://github.com", password: fakePw(3),
    authenticationMethod: "Passkey", recoveryInformation: "Recovery codes stored offline.", twoFactorInformation: "Passkey (hardware key) + TOTP fallback",
    notes: "Dev identity hub. SSO source for CI and hosting tools.", ageDays: 2100, updatedDaysAgo: 8 },

  { id: "seed-vercel", serviceName: "Vercel", accountName: "Vercel", category: "Development",
    username: "", email: "alex.dev@example.test", website: "https://vercel.com", password: fakePw(4),
    authenticationMethod: "GitHub OAuth", recoveryInformation: "Via GitHub.", twoFactorInformation: "Inherited from GitHub",
    notes: "Logs in with GitHub. Deploys the side projects.", ageDays: 600, updatedDaysAgo: 25 },

  { id: "seed-supabase", serviceName: "Supabase", accountName: "Supabase", category: "Development",
    username: "", email: "alex.dev@example.test", website: "https://supabase.com", password: fakePw(5),
    authenticationMethod: "GitHub OAuth", recoveryInformation: "Via GitHub.", twoFactorInformation: "Inherited from GitHub",
    notes: "Database + auth for the demo app. GitHub SSO.", ageDays: 430, updatedDaysAgo: 25 },

  { id: "seed-npm", serviceName: "npm", accountName: "npm registry", category: "Development",
    username: "alex-demo-dev", email: "alex.dev@example.test", website: "https://npmjs.com", password: fakePw(6),
    authenticationMethod: "Password", recoveryInformation: "Email reset via dev Gmail.", twoFactorInformation: "TOTP required for publish",
    notes: "Publishes two small packages. 2FA enforced.", ageDays: 900, updatedDaysAgo: 110 },

  { id: "seed-linkedin", serviceName: "LinkedIn", accountName: "LinkedIn", category: "Work",
    username: "", email: "alex.demo@example.test", website: "https://linkedin.com", password: fakePw(7),
    authenticationMethod: "Password", recoveryInformation: "Recovery email = personal Gmail.", twoFactorInformation: "SMS code",
    notes: "Job hunt + networking.", ageDays: 1800, updatedDaysAgo: 60 },

  { id: "seed-slack-work", serviceName: "Slack", accountName: "Slack (work)", category: "Work",
    username: "", email: "alex.builder@company.example", website: "https://company.slack.com", password: fakePw(8),
    authenticationMethod: "Microsoft SSO", recoveryInformation: "Handled by workplace IT.", twoFactorInformation: "Inherited from Microsoft work account",
    notes: "Work workspace. SSO through the Microsoft work tenant.", ageDays: 300, updatedDaysAgo: 5 },

  { id: "seed-microsoft-work", serviceName: "Microsoft", accountName: "Microsoft 365 (work)", category: "Work",
    username: "", email: "alex.builder@company.example", website: "https://office.com", password: fakePw(9),
    authenticationMethod: "Microsoft SSO", recoveryInformation: "Workplace IT self-service reset.", twoFactorInformation: "Microsoft Authenticator (push)",
    notes: "Employer-managed. Source of truth for work SSO.", ageDays: 300, updatedDaysAgo: 5 },

  { id: "seed-notion", serviceName: "Notion", accountName: "Notion", category: "Work",
    username: "", email: "alex.demo@example.test", website: "https://notion.so", password: fakePw(10),
    authenticationMethod: "Google SSO", recoveryInformation: "Via Google personal.", twoFactorInformation: "Inherited from Google account",
    notes: "Personal notes + a shared team space.", ageDays: 700, updatedDaysAgo: 30 },

  { id: "seed-instagram", serviceName: "Instagram", accountName: "Instagram", category: "Social",
    username: "alex.demo", email: "alex.social@example.test", website: "https://instagram.com", password: fakePw(11),
    authenticationMethod: "Meta", recoveryInformation: "Linked to Facebook for recovery.", twoFactorInformation: "Authenticator app",
    notes: "Managed under the Meta account with Facebook.", ageDays: 1500, updatedDaysAgo: 20 },

  { id: "seed-facebook", serviceName: "Facebook", accountName: "Facebook", category: "Social",
    username: "", email: "alex.social@example.test", website: "https://facebook.com", password: fakePw(12),
    authenticationMethod: "Meta", recoveryInformation: "Trusted contacts + personal Gmail.", twoFactorInformation: "Authenticator app",
    notes: "Owns the Instagram account. Rarely used directly.", ageDays: 2400, updatedDaysAgo: 200 },

  { id: "seed-icloud", serviceName: "Apple", accountName: "Apple ID / iCloud", category: "Personal",
    username: "", email: "alex.demo@example.test", website: "https://appleid.apple.com", password: fakePw(13),
    authenticationMethod: "Apple SSO", recoveryInformation: "Recovery key printed and stored in the document safe; trusted phone number set.",
    twoFactorInformation: "Trusted-device approval", notes: "Used for one iPad and 'Sign in with Apple' on a couple of apps.",
    ageDays: 1600, updatedDaysAgo: 48 },

  { id: "seed-university", serviceName: "University Portal", accountName: "University portal", category: "University",
    username: "ad1234", email: "ad1234@uni.example", website: "https://portal.uni.example", password: fakePw(14),
    authenticationMethod: "Microsoft SSO", recoveryInformation: "Campus IT desk; recovery email = personal Gmail.", twoFactorInformation: "Microsoft Authenticator (push)",
    notes: "Grades, enrolment, campus wifi. Microsoft tenant run by the university.", ageDays: 800, updatedDaysAgo: 18 },

  { id: "seed-university-email", serviceName: "Outlook", accountName: "University email", category: "University",
    username: "ad1234", email: "ad1234@uni.example", website: "https://outlook.office.com", password: fakePw(14),
    authenticationMethod: "Microsoft SSO", recoveryInformation: "Via university portal / campus IT.", twoFactorInformation: "Inherited from university Microsoft tenant",
    notes: "Same login as the portal. Used for course comms.", ageDays: 800, updatedDaysAgo: 18 },

  { id: "seed-bank", serviceName: "Monzo", accountName: "Everyday bank", category: "Finance",
    username: "", email: "alex.demo@example.test", website: "https://monzo.example", password: fakePw(15),
    authenticationMethod: "Password", recoveryInformation: "In-app identity check + support call. Magic link to personal Gmail.",
    twoFactorInformation: "App approval on the Pixel phone", notes: "Primary current account. App login is on the phone.",
    ageDays: 950, updatedDaysAgo: 2 },

  { id: "seed-paypal", serviceName: "PayPal", accountName: "PayPal", category: "Finance",
    username: "", email: "alex.demo@example.test", website: "https://paypal.com", password: fakePw(16),
    authenticationMethod: "Password", recoveryInformation: "SMS + security questions. Recovery email = personal Gmail.",
    twoFactorInformation: "SMS one-time code", notes: "Linked to the everyday bank account.", ageDays: 1700, updatedDaysAgo: 75 },

  { id: "seed-steam", serviceName: "Steam", accountName: "Steam", category: "Other",
    username: "alex_demo_plays", email: "alex.demo@example.test", website: "https://store.steampowered.com", password: fakePw(17),
    authenticationMethod: "Password", recoveryInformation: "Steam Guard + support ticket.", twoFactorInformation: "Steam Guard mobile authenticator",
    notes: "Game library. Steam Guard runs on the Pixel phone.", ageDays: 2600, updatedDaysAgo: 22 },

  { id: "seed-archive", serviceName: "Fastmail", accountName: "Old catch-all mailbox", category: "Other",
    username: "alex.legacy", email: "alex.legacy@fastmail.example", website: "https://fastmail.example", password: fakePw(18),
    authenticationMethod: "Password", recoveryInformation: "Printed recovery code in the document safe.", twoFactorInformation: "TOTP",
    notes: "Legacy address kept only because a couple of old accounts still point at it.", ageDays: 3200, updatedDaysAgo: 300 },
];

/** @type {Array<Omit<import("../src/domain/types").AccountRelationship,"id">>} */
const RELATIONSHIPS = [
  { sourceAccountId: "seed-gmail", targetAccountId: "seed-google-personal", relationshipType: "LINKED_ACCOUNT", notes: "Gmail is the mailbox of the Google personal account." },
  { sourceAccountId: "seed-notion", targetAccountId: "seed-google-personal", relationshipType: "GOOGLE_SSO", notes: "Notion signs in with Google." },
  { sourceAccountId: "seed-icloud", targetAccountId: "seed-gmail", relationshipType: "RECOVERY_EMAIL", notes: "Apple ID rescue email is the personal Gmail." },
  { sourceAccountId: "seed-google-personal", targetAccountId: "seed-android", relationshipType: "2FA_DEVICE", notes: "Pixel phone approves Google sign-ins." },
  { sourceAccountId: "seed-vercel", targetAccountId: "seed-github", relationshipType: "GITHUB_SSO", notes: "Vercel logs in with GitHub." },
  { sourceAccountId: "seed-supabase", targetAccountId: "seed-github", relationshipType: "GITHUB_SSO", notes: "Supabase logs in with GitHub." },
  { sourceAccountId: "seed-npm", targetAccountId: "seed-gmail", relationshipType: "RECOVERY_EMAIL", notes: "npm password resets go to Gmail." },
  { sourceAccountId: "seed-slack-work", targetAccountId: "seed-microsoft-work", relationshipType: "LOGIN_WITH", notes: "Work Slack uses Microsoft work SSO." },
  { sourceAccountId: "seed-facebook", targetAccountId: "seed-instagram", relationshipType: "OWNS", notes: "Facebook / Meta account owns the Instagram account." },
  { sourceAccountId: "seed-instagram", targetAccountId: "seed-facebook", relationshipType: "RECOVERY_EMAIL", notes: "Instagram recovery runs through Facebook." },
  { sourceAccountId: "seed-university-email", targetAccountId: "seed-university", relationshipType: "DEPENDS_ON", notes: "University email and portal are one Microsoft login." },
  { sourceAccountId: "seed-paypal", targetAccountId: "seed-bank", relationshipType: "CONNECTED_TO", notes: "PayPal draws from the everyday bank account." },
  { sourceAccountId: "seed-steam", targetAccountId: "seed-android", relationshipType: "2FA_DEVICE", notes: "Steam Guard authenticator lives on the Pixel phone." },
  { sourceAccountId: "seed-bank", targetAccountId: "seed-android", relationshipType: "2FA_DEVICE", notes: "Bank login is approved from the phone app." },
  { sourceAccountId: "seed-archive", targetAccountId: "seed-paypal", relationshipType: "RECOVERY_EMAIL", notes: "PayPal still lists the old catch-all mailbox as a backup address." },
];

const CATEGORIES = ["Personal", "Development", "Social", "University", "Finance", "Work", "Other"];

function build() {
  const dayMs = 86_400_000;
  const base = Date.parse(T0);
  const accounts = ACCOUNTS.map(({ ageDays = 365, updatedDaysAgo = 30, ...rest }) => ({
    ...rest,
    createdAt: new Date(base - ageDays * dayMs).toISOString(),
    updatedAt: new Date(base - updatedDaysAgo * dayMs).toISOString(),
  }));
  const ids = new Set(accounts.map((a) => a.id));
  const relationships = RELATIONSHIPS.map((r, i) => {
    if (!ids.has(r.sourceAccountId) || !ids.has(r.targetAccountId)) {
      throw new Error(`relationship ${i} references a missing account`);
    }
    return { id: `seed-rel-${String(i + 1).padStart(2, "0")}`, ...r };
  });
  return { formatVersion: 1, categories: CATEGORIES, accounts, relationships };
}

const vault = build();
const json = JSON.stringify(vault, null, 2) + "\n";

if (process.argv.includes("--stdout")) {
  process.stdout.write(json);
} else {
  writeFileSync(OUT_FILE, json);
  console.log(
    `dev-seed-vault: wrote ${OUT_FILE}\n` +
      `  ${vault.accounts.length} synthetic accounts across ${new Set(vault.accounts.map((a) => a.category)).size} categories\n` +
      `  ${new Set(vault.accounts.map((a) => a.authenticationMethod)).size} auth methods, ${vault.relationships.length} relationships\n` +
      `  open  http://localhost:1420/?seed=1  with the dev server running`,
  );
}
