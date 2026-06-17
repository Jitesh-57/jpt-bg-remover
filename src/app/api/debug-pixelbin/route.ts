import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function GET() {
  const t = process.env.PIXELBIN_API_TOKEN || "";
  const k = process.env.PIXELBIN_ACCESS_KEY || "";

  const authB64Token = `Bearer ${Buffer.from(t + ":").toString("base64")}`;
  const authB64Key   = `Bearer ${Buffer.from(k + ":").toString("base64")}`;
  const authBasic    = `Basic ${Buffer.from(k + ":" + t).toString("base64")}`;

  const results: Record<string, unknown> = {};

  // Try public endpoints with different auth
  const publicEndpoints = [
    "https://api.pixelbin.io/service/public/assets/v1.0/listFiles",
    "https://api.pixelbin.io/service/public/assets/v2.0/listFiles",
    "https://api.pixelbin.io/service/public/playground/v1.0/predict",
  ];

  for (const ep of publicEndpoints) {
    const short = ep.split("/").slice(-3).join("/");
    for (const [label, auth] of [["b64token", authB64Token], ["b64key", authB64Key], ["basic", authBasic]] as const) {
      const res = await fetch(ep, { headers: { Authorization: auth } });
      results[`${short}_${label}`] = `${res.status}: ${(await res.text()).slice(0, 120)}`;
    }
  }

  // Try uploading to public upload endpoint
  const match = TINY_PNG.match(/^data:([^;]+);base64,(.+)$/)!;
  const [, mimeType, b64] = match;
  const formData = new FormData();
  formData.append("file", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");

  for (const [label, auth] of [["b64token", authB64Token], ["b64key", authB64Key]] as const) {
    const uploadRes = await fetch("https://api.pixelbin.io/service/public/assets/v1.0/upload", {
      method: "POST",
      headers: { Authorization: auth },
      body: formData,
    });
    results[`upload_${label}`] = `${uploadRes.status}: ${(await uploadRes.text()).slice(0, 200)}`;
  }

  // Try the Playground prediction API via public
  const fd2 = new FormData();
  fd2.append("file", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");
  const predRes = await fetch("https://api.pixelbin.io/service/public/playground/v1.0/predict/erase/bg", {
    method: "POST",
    headers: { Authorization: authB64Token },
    body: fd2,
  });
  results["playground_predict_erase_bg"] = `${predRes.status}: ${(await predRes.text()).slice(0, 200)}`;

  return NextResponse.json(results);
}
