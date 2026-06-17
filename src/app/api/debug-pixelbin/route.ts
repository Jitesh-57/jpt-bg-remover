import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testUpload(label: string, authHeader: string) {
  const match = TINY_PNG.match(/^data:([^;]+);base64,(.+)$/)!;
  const [, mimeType, b64] = match;
  const formData = new FormData();
  formData.append("file", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");

  const endpoints = [
    "https://api.pixelbin.io/service/public/assets/v1.0/upload",
    "https://api.pixelbin.io/service/platform/assets/v2.0/upload",
  ];
  const out: Record<string, string> = {};
  for (const ep of endpoints) {
    const res = await fetch(ep, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: formData,
    });
    const body = await res.text();
    out[ep.split("/").slice(-3).join("/")] = `${res.status}: ${body.slice(0, 150)}`;
  }
  return out;
}

export async function GET() {
  const t = process.env.PIXELBIN_API_TOKEN || "";
  const k = process.env.PIXELBIN_ACCESS_KEY || "";

  const formats: Record<string, string> = {
    "Bearer raw-token":         `Bearer ${t}`,
    "Bearer raw-key":           `Bearer ${k}`,
    "Bearer b64(token:)":       `Bearer ${Buffer.from(t + ":").toString("base64")}`,
    "Bearer b64(key:)":         `Bearer ${Buffer.from(k + ":").toString("base64")}`,
    "Basic b64(key:token)":     `Basic ${Buffer.from(k + ":" + t).toString("base64")}`,
    "Basic b64(token:key)":     `Basic ${Buffer.from(t + ":" + k).toString("base64")}`,
    "Basic b64(key:)":          `Basic ${Buffer.from(k + ":").toString("base64")}`,
    "Basic b64(token:)":        `Basic ${Buffer.from(t + ":").toString("base64")}`,
    "x-api-key token (no Bearer)": t,
  };

  const results: Record<string, unknown> = {
    tokenLen: t.length, keyLen: k.length,
    tokenPrefix: t.slice(0, 8), keyPrefix: k.slice(0, 8),
  };

  for (const [label, header] of Object.entries(formats)) {
    // Test assets list
    const res = await fetch("https://api.pixelbin.io/service/platform/assets/v2/listFiles", {
      headers: { Authorization: header },
    });
    const body = await res.text();
    results[`list_${label}`] = `${res.status}: ${body.slice(0, 80)}`;
  }

  // Also try x-api-key header
  const xRes = await fetch("https://api.pixelbin.io/service/platform/assets/v2/listFiles", {
    headers: { "x-api-key": t },
  });
  results["list_x-api-key"] = `${xRes.status}: ${(await xRes.text()).slice(0, 80)}`;

  const xRes2 = await fetch("https://api.pixelbin.io/service/platform/assets/v2/listFiles", {
    headers: { "x-api-key": k },
  });
  results["list_x-api-key-accesskey"] = `${xRes2.status}: ${(await xRes2.text()).slice(0, 80)}`;

  return NextResponse.json(results, { status: 200 });
}
