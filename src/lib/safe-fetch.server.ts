import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";

/**
 * Fetches a user-supplied URL without letting it reach our own network.
 *
 * The address check runs inside the socket's `lookup`, so it applies to the IP
 * actually connected to — a hostname that resolves publicly for a pre-check and
 * privately for the connection (DNS rebinding) is still refused. Redirects are
 * followed by hand so every hop goes through the same check.
 */

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 12_000;

export class SafeFetchError extends Error {}

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateV4(ip);
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff");
}

const BLOCKED = "That link points somewhere we can't open.";

// Node calls this with `all: true` when it races IPv4/IPv6 and then expects an
// array back; otherwise a single address. Both shapes are checked.
const guardedLookup = ((hostname: string, options: dns.LookupOptions, callback: (...args: unknown[]) => void) => {
  if (options?.all) {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err);
      if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) return callback(new SafeFetchError(BLOCKED));
      callback(null, addresses);
    });
    return;
  }
  dns.lookup(hostname, { ...options, all: false }, (err, address, family) => {
    if (err) return callback(err);
    if (typeof address !== "string" || isPrivateAddress(address)) return callback(new SafeFetchError(BLOCKED));
    callback(null, address, family);
  });
}) as unknown as net.LookupFunction;

function checkUrl(raw: string): URL {
  let u: URL;
  try { u = new URL(raw); } catch { throw new SafeFetchError("That doesn't look like a valid link."); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new SafeFetchError("Only http and https links are supported.");
  if (u.username || u.password) throw new SafeFetchError("Links with a username or password aren't supported.");
  if (u.port && !["80", "443"].includes(u.port)) throw new SafeFetchError("That link uses a port we can't open.");
  if (net.isIP(u.hostname.replace(/^\[|\]$/g, "")) && isPrivateAddress(u.hostname.replace(/^\[|\]$/g, ""))) {
    throw new SafeFetchError(BLOCKED);
  }
  return u;
}

export interface SafeResponse { url: string; status: number; contentType: string; body: Buffer }

function requestOnce(u: URL, maxBytes: number): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  const mod = u.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(u, {
      method: "GET",
      lookup: guardedLookup,
      timeout: TIMEOUT_MS,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PixelShineBot/1.0; +https://www.sjpt.io)",
        Accept: "text/html,image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
        "Accept-Language": "en",
      },
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400) { res.resume(); resolve({ status, headers: res.headers, body: Buffer.alloc(0) }); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length;
        if (size > maxBytes) { req.destroy(new SafeFetchError("That image is too large (over 15 MB).")); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new SafeFetchError("That link took too long to respond.")));
    req.on("error", reject);
    req.end();
  });
}

export async function safeFetch(raw: string, maxBytes: number): Promise<SafeResponse> {
  let u = checkUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const r = await requestOnce(u, maxBytes);
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.location;
      if (!loc) throw new SafeFetchError("That link redirected nowhere.");
      u = checkUrl(new URL(loc, u).toString());
      continue;
    }
    return { url: u.toString(), status: r.status, contentType: String(r.headers["content-type"] || "").toLowerCase(), body: r.body };
  }
  throw new SafeFetchError("That link redirected too many times.");
}
