import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiToken = process.env.PIXELBIN_API_TOKEN || "";
  const accessKey = process.env.PIXELBIN_ACCESS_KEY || "";

  const formats = [
    { label: "raw-apiToken", header: `Bearer ${apiToken}` },
    { label: "raw-accessKey", header: `Bearer ${accessKey}` },
    { label: "b64-apiToken-colon", header: `Bearer ${Buffer.from(apiToken + ":").toString("base64")}` },
    { label: "b64-accessKey-colon", header: `Bearer ${Buffer.from(accessKey + ":").toString("base64")}` },
    { label: "b64-accessKey-apiToken", header: `Bearer ${Buffer.from(accessKey + ":" + apiToken).toString("base64")}` },
  ];

  const results: Record<string, unknown> = {
    apiTokenLen: apiToken.length,
    apiTokenPrefix: apiToken.slice(0, 8),
    accessKeyLen: accessKey.length,
    accessKeyPrefix: accessKey.slice(0, 8),
  };

  // Test each format against the inference list endpoint
  for (const fmt of formats) {
    const res = await fetch("https://api.pixelbin.io/service/platform/predict/v1/inference", {
      method: "GET",
      headers: { Authorization: fmt.header },
    });
    results[fmt.label] = res.status;
  }

  return NextResponse.json(results);
}
