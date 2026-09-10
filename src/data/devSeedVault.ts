/*
 * DEV / TEST FIXTURE -- NOT PRODUCTION DATA.
 *
 * `devSeedVault` is a synthetic Account OS snapshot (20 fake accounts + 15
 * relationships) used only to review the UI as if it were "in use". Every
 * credential is an obvious placeholder ("demo-not-a-real-password-*"); there
 * are no real emails or secrets.
 *
 * Regenerate with:  node scripts/dev-seed-vault.mjs
 *
 * This module is loaded by src/main.tsx ONLY when BOTH:
 *   - import.meta.env.DEV === true   (never present in a production build)
 *   - the page URL contains ?seed=1
 * It is passed as <App previewVault={...}> -- renderer state only. It is never
 * written to disk, never sent to the Rust vault service, and never touches a
 * real encrypted vault or backup.
 */
import type { VaultData } from "../domain/types";
import seed from "./devSeedVault.json";

export const devSeedVault: VaultData = seed as VaultData;
