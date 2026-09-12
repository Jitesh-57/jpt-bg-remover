/**
 * brand.ts — the product's name, in one place.
 *
 * The rename from "JPT AI" to "Pixel Shine" touched 1700+ string literals, so
 * new code should read from here rather than hardcoding it again.
 *
 * Not renamed, deliberately:
 *   - the `jpt-` CSS class prefix and `jpt_` storage keys (internal ids; changing
 *     them would break styling and drop everyone's saved editor session)
 *   - the `JPT-` Google Drive filename prefix (would orphan users' saved files)
 *   - the sjpt.io domain (unchanged — this is a product rename, not a migration)
 */

export const BRAND = "Pixel Shine";
export const BRAND_SHORT = "Pixel Shine";
export const DOMAIN = "www.sjpt.io";
export const SITE_URL = "https://www.sjpt.io";
/** Wordmark split for two-tone rendering: "Pixel" + "Shine". */
export const BRAND_PARTS = ["Pixel", "Shine"] as const;
