import { NextResponse } from "next/server";
import { PLAY_APPS } from "@/lib/play-billing";

/**
 * GET /.well-known/assetlinks.json (rewritten here in next.config.mjs).
 *
 * Digital Asset Links: the site's statement that the Play Store apps in
 * PLAY_APPS are its own. Android checks it when an app opens www.sjpt.io, and
 * only then shows the page full screen; without it the app shows Chrome's
 * address bar on top.
 *
 * Each app is trusted when signed by either key:
 *   - the upload key, which signs the APK installed straight onto a phone to
 *     test (android/<app>/twa-manifest.json, `fingerprints`);
 *   - Play's app signing key, which signs every copy installed from Google
 *     Play. Play Console shows it under Test and release → App integrity →
 *     App signing; it goes in PLAY_APP_SIGNING_SHA256 (comma-separated), so no
 *     code change is needed to add it.
 */

const UPLOAD_KEYS: Record<string, string[]> = {
  "age-progression": ["A0:34:A2:DE:9C:04:D0:28:B2:8C:18:43:FB:5D:18:DF:A4:49:95:E4:85:67:9C:A2:E0:E7:D2:3C:BE:04:B8:8C"],
};

const SHA256 = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** Play's signing keys, from the env var; anything not shaped like a SHA-256 is skipped. */
function playKeys(): string[] {
  return (process.env.PLAY_APP_SIGNING_SHA256 ?? "")
    .split(/[,\s]+/)
    .map((k) => k.trim().toUpperCase())
    .filter((k) => SHA256.test(k));
}

export function GET() {
  const statements = Object.entries(PLAY_APPS).map(([app, pkg]) => ({
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: pkg,
      sha256_cert_fingerprints: Array.from(new Set([...(UPLOAD_KEYS[app] ?? []), ...playKeys()])),
    },
  }));
  return NextResponse.json(statements, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
