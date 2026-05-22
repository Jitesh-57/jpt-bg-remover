import { PixelbinConfig, PixelbinClient } from "@pixelbin/admin";
import type { NextRequest } from "next/server";

export const PIXELBIN_TOKEN_COOKIE = "headshot_pixelbin_token";
export const PIXELBIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function normalizePixelbinToken(token: string) {
  return token.trim();
}

export function encodePixelbinToken(token: string) {
  return Buffer.from(token, "utf8").toString("base64url");
}

export function decodePixelbinToken(value?: string) {
  if (!value) return null;
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function getPixelbinToken(req: NextRequest) {
  return decodePixelbinToken(req.cookies.get(PIXELBIN_TOKEN_COOKIE)?.value);
}

export function getPixelbinAuthHeader(apiToken: string) {
  return `Bearer ${Buffer.from(apiToken).toString("base64")}`;
}

export function createUserPixelbinClient(apiToken: string) {
  return new PixelbinClient(
    new PixelbinConfig({
      domain: "https://api.pixelbin.io",
      apiSecret: apiToken,
    })
  );
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getPixelbinAccountSession(apiToken: string) {
  const client = createUserPixelbinClient(apiToken);
  const details = (await client.organization.getAppOrgDetails()) as {
    org?: { name?: string; cloudName?: string };
  };

  const usage = (await client.billing.getUsageV2().catch(() => null)) as
    | { credits?: { total?: number; used?: number } }
    | null;

  const total = readNumber(usage?.credits?.total);
  const used = readNumber(usage?.credits?.used);
  const remaining = total !== null && used !== null ? Math.max(0, total - used) : null;

  return {
    connected: true,
    accountName: details.org?.name || details.org?.cloudName || "PixelBin account",
    cloudName: details.org?.cloudName || null,
    credits:
      total === null || used === null || remaining === null
        ? null
        : {
            total,
            used,
            remaining,
          },
  };
}

export function maskPixelbinToken(apiToken: string) {
  if (apiToken.length <= 10) return "connected";
  return `${apiToken.slice(0, 4)}...${apiToken.slice(-4)}`;
}

export function pixelbinCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PIXELBIN_COOKIE_MAX_AGE,
  };
}
