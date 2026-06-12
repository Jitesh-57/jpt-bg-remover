import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiToken = process.env.PIXELBIN_API_TOKEN || "";
  const accessKey = process.env.PIXELBIN_ACCESS_KEY || "";

  const formats = [
    { label: "raw-apiToken", header: `Bearer ${apiToken}` },
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

  // Test assets endpoint (known to work via MCP)
  for (const fmt of formats) {
    const res = await fetch("https://api.pixelbin.io/service/platform/assets/v2/listFiles", {
      method: "GET",
      headers: { Authorization: fmt.header },
    });
    const body = await res.text();
    results[`assets_${fmt.label}`] = `${res.status}: ${body.slice(0, 100)}`;
  }

  return NextResponse.json(results);
}
