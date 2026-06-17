import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const ORG_ID = "318452";

export async function GET() {
  const t = process.env.PIXELBIN_API_TOKEN || "";
  const k = process.env.PIXELBIN_ACCESS_KEY || "";
  const results: Record<string, unknown> = { orgId: ORG_ID };

  const match = TINY_PNG.match(/^data:([^;]+);base64,(.+)$/)!;
  const [, mimeType, b64] = match;

  const authFormats = [
    ["b64(key:)",       `Bearer ${Buffer.from(k + ":").toString("base64")}`],
    ["b64(token:)",     `Bearer ${Buffer.from(t + ":").toString("base64")}`],
    ["b64(key:token)",  `Bearer ${Buffer.from(k + ":" + t).toString("base64")}`],
    ["raw-token",       `Bearer ${t}`],
  ] as const;

  // Test platform API with org ID in URL
  const platformEndpoints = [
    `https://api.pixelbin.io/service/platform/playground/v1.0/${ORG_ID}/predict/erase/bg`,
    `https://api.pixelbin.io/service/platform/predict/v1/${ORG_ID}/inference`,
    `https://api.pixelbin.io/service/platform/assets/v2.0/`,  // list files
  ];

  for (const ep of platformEndpoints) {
    const short = ep.split("/").slice(-3).join("/");
    for (const [label, auth] of authFormats) {
      const fd = new FormData();
      fd.append("image", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");
      fd.append("prompt", "test");
      const res = await fetch(ep, {
        method: ep.includes("assets") ? "GET" : "POST",
        headers: { Authorization: auth },
        body: ep.includes("assets") ? undefined : fd,
      });
      results[`${short}__${label}`] = `${res.status}: ${(await res.text()).slice(0, 150)}`;
    }
  }

  // Also test nanoBananaPro with images field (not image)
  const nbEp = `https://api.pixelbin.io/service/platform/playground/v1.0/${ORG_ID}/predict/nanoBananaPro/generate`;
  const fd2 = new FormData();
  fd2.append("images", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");
  fd2.append("prompt", "make it brighter");
  const nbRes = await fetch(nbEp, {
    method: "POST",
    headers: { Authorization: `Bearer ${Buffer.from(k + ":").toString("base64")}` },
    body: fd2,
  });
  results["nanoBananaPro_images_field"] = `${nbRes.status}: ${(await nbRes.text()).slice(0, 200)}`;

  return NextResponse.json(results);
}
