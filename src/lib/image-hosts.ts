// Default import, then read the field. A named import from JSON type-checks
// and then fails at bundle time ("'hosts'.'some' is not exported"), because
// webpack treats JSON keys as named exports and cannot follow the property
// access through one.
import imageHosts from "../../config/image-hosts.json";

const HOSTS = imageHosts.hosts;

/**
 * Whether next/image is allowed to fetch this URL.
 *
 * An unconfigured host is not a soft failure. next/image throws during render
 * and takes the whole page with it — which is how one wrong character in
 * NEXT_PUBLIC_SUPABASE_URL turns a missing picture into a 500, with the
 * gradient placeholders that exist for exactly this case never getting a
 * chance to draw.
 *
 * So the check happens before a URL reaches the optimiser, inside the image
 * components rather than at one call site: they are the components whose whole
 * job is to degrade gracefully, and they should hold that guarantee for
 * whatever a caller hands them.
 *
 * Relative paths are ours and always fine. The host list is the same one
 * next.config.mjs builds remotePatterns from, so the two cannot drift.
 */
export function isRenderable(url: string | undefined | null): url is string {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return true;
  try {
    return HOSTS.some((h) => h.hostname === new URL(url).hostname);
  } catch {
    return false;
  }
}
