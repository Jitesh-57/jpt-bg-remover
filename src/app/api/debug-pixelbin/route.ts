import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function GET() {
  const t = process.env.PIXELBIN_API_TOKEN || "";
  const k = process.env.PIXELBIN_ACCESS_KEY || "";
  const results: Record<string, unknown> = {};

  // 1. Discover OAuth endpoints
  try {
    const disc = await fetch("https://mcp.pixelbin.io/.well-known/oauth-authorization-server");
    results["oauth_discovery"] = await disc.json();
  } catch (e) { results["oauth_discovery_err"] = String(e); }

  // 2. Try client_credentials OAuth flow (access_key = client_id, api_token = client_secret)
  try {
    const tokenRes = await fetch("https://mcp.pixelbin.io/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "client_credentials", client_id: k, client_secret: t }),
    });
    const body = await tokenRes.text();
    results["oauth_client_creds"] = `${tokenRes.status}: ${body.slice(0, 300)}`;
  } catch (e) { results["oauth_client_creds_err"] = String(e); }

  // 3. Try client_credentials with form encoding
  try {
    const tokenRes = await fetch("https://mcp.pixelbin.io/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: k, client_secret: t }),
    });
    const body = await tokenRes.text();
    results["oauth_client_creds_form"] = `${tokenRes.status}: ${body.slice(0, 300)}`;
  } catch (e) { results["oauth_client_creds_form_err"] = String(e); }

  // 4. Try PixelBin API token endpoint
  try {
    const tokenRes = await fetch("https://api.pixelbin.io/service/public/auth/v1.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey: k, apiToken: t }),
    });
    const body = await tokenRes.text();
    results["api_token_exchange"] = `${tokenRes.status}: ${body.slice(0, 300)}`;
  } catch (e) { results["api_token_exchange_err"] = String(e); }

  // 5. Try inference with token used as API key directly in URL
  try {
    const match = TINY_PNG.match(/^data:([^;]+);base64,(.+)$/)!;
    const [, mimeType, b64] = match;
    const fd = new FormData();
    fd.append("file", new Blob([Buffer.from(b64, "base64")], { type: mimeType }), "test.png");
    const res = await fetch(`https://api.pixelbin.io/service/public/playground/v1.0/predict/erase/bg?token=${t}`, {
      method: "POST", body: fd,
    });
    results["playground_token_param"] = `${res.status}: ${(await res.text()).slice(0, 200)}`;
  } catch (e) { results["playground_token_param_err"] = String(e); }

  // 6. Check what the MCP token endpoint looks like
  try {
    const res = await fetch("https://mcp.pixelbin.io/");
    results["mcp_root"] = `${res.status}: ${(await res.text()).slice(0, 200)}`;
  } catch (e) { results["mcp_root_err"] = String(e); }

  return NextResponse.json(results);
}
