import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CLOUD_NAME = "misty-band-06f445";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test public image to transform
  const testImageUrl = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80";

  // URL-safe base64 (no +/= issues in URLs)
  const urlSafeB64 = Buffer.from(testImageUrl).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  // Regular base64
  const regularB64 = Buffer.from(testImageUrl).toString("base64");

  // Test various CDN external URL formats
  const cdnFormats = [
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/erase.bg()/__ext/${urlSafeB64}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/erase.bg()/__ext/${regularB64}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/t-erase.bg()/__ext/${urlSafeB64}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/erase.bg()/fetch/${encodeURIComponent(testImageUrl)}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/erase.bg()/${testImageUrl}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/original/erase.bg()/__ext/${urlSafeB64}`,
  ];

  for (const url of cdnFormats) {
    const key = url.replace(`https://cdn.pixelbin.io/v2/${CLOUD_NAME}/`, "").slice(0, 60);
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      const ct = res.headers.get("content-type") || "";
      const body = ct.startsWith("image") ? "[IMAGE DATA]" : (await res.text()).slice(0, 150);
      results[key] = `${res.status} ${ct} ${body}`;
    } catch (e) { results[key] = `ERR: ${String(e).slice(0, 100)}`; }
  }

  return NextResponse.json(results);
}
