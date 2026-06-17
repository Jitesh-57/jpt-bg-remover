import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Tiny 1×1 transparent PNG as base64
const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testInference(label: string, authHeader: string, endpoint: string) {
  const match = TINY_PNG.match(/^data:([^;]+);base64,(.+)$/)!;
  const [, mimeType, b64] = match;
  const formData = new FormData();
  formData.append("plugin", "erase");
  formData.append("operation", "bg");
  formData.append("image", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: formData,
  });
  const body = await res.text();
  return `${res.status}: ${body.slice(0, 200)}`;
}

export async function GET() {
  const apiToken = process.env.PIXELBIN_API_TOKEN || "";
  const accessKey = process.env.PIXELBIN_ACCESS_KEY || "";

  const authFormats = [
    { label: "raw-apiToken", header: `Bearer ${apiToken}` },
    { label: "b64-apiToken-colon", header: `Bearer ${Buffer.from(apiToken + ":").toString("base64")}` },
    { label: "b64-accessKey-colon", header: `Bearer ${Buffer.from(accessKey + ":").toString("base64")}` },
    { label: "Token-apiToken", header: `Token ${apiToken}` },
  ];

  const endpoints = [
    "https://api.pixelbin.io/service/platform/predict/v1/inference",
    "https://api.pixelbin.io/service/platform/playground/v1.0/predict/erase/bg",
  ];

  const results: Record<string, unknown> = {
    apiTokenLen: apiToken.length,
    accessKeyLen: accessKey.length,
  };

  // Test assets list (basic auth check)
  for (const fmt of authFormats) {
    const res = await fetch("https://api.pixelbin.io/service/platform/assets/v2/listFiles", {
      headers: { Authorization: fmt.header },
    });
    const body = await res.text();
    results[`assets_${fmt.label}`] = `${res.status}: ${body.slice(0, 80)}`;
  }

  // Test inference endpoint with best-guess auth
  for (const endpoint of endpoints) {
    results[`inference_b64apiToken_${endpoint.split("/").pop()}`] = await testInference(
      "b64-apiToken",
      `Bearer ${Buffer.from(apiToken + ":").toString("base64")}`,
      endpoint
    );
    results[`inference_b64accessKey_${endpoint.split("/").pop()}`] = await testInference(
      "b64-accessKey",
      `Bearer ${Buffer.from(accessKey + ":").toString("base64")}`,
      endpoint
    );
  }

  return NextResponse.json(results);
}
