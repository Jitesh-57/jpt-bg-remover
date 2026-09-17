import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { falKeyShape, falProbe, falEndpointTable } from "@/lib/fal";
import { gptCascade } from "@/lib/ai-image";

export const runtime = "nodejs";

/**
 * Says which models a headshot would be attempted on, in order, and whether
 * fal is reachable at all.
 *
 * The tool walks a cascade of OpenAI models on fal and falls back to Nano
 * Banana if none of them will serve the request. That fallback is deliberately
 * invisible to customers — being told you might have got something better,
 * after paying, helps nobody — so this is where an operator finds out.
 *
 *   GET /api/admin/headshot-model?token=<ADMIN_IMAGE_TOKEN>
 *
 * The key is never returned, only its length and shape, which is enough to
 * spot a truncated paste or an empty variable.
 *
 * What this CANNOT tell you: whether a given model will actually run. fal only
 * reveals entitlement on a request that would cost money. Generate one
 * headshot and read the log line — it names the engine that served it.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const key = falKeyShape();
  const endpoints = falEndpointTable();
  const cascade = gptCascade();

  const out: Record<string, unknown> = {
    key,
    cascade: cascade.map((m) => ({ model: m, endpoint: endpoints[m]?.edit, overridden: endpoints[m]?.overridden })),
    fallback: "nano-banana, then Gemini. Never announced to the customer; look for the engine in the log.",
    endpoints,
    overrides: {
      HEADSHOT_MODELS: "Comma-separated model ids to change the cascade or its order.",
      "FAL_ENDPOINT_<ID>_EDIT": "Repoint one model's edit endpoint if fal renames it.",
    },
  };

  if (!key.configured) {
    return NextResponse.json({
      ...out, ok: false,
      verdict: "FAL_KEY is not set on this deployment, so every headshot falls back to Gemini.",
      fix: "Add FAL_KEY in the Vercel project's environment variables, then redeploy.",
    });
  }

  let probe: { status: number; body: string };
  try {
    probe = await falProbe();
  } catch (e) {
    return NextResponse.json({
      ...out, ok: false,
      verdict: `Could not reach fal at all: ${(e as Error).message}`,
      fix: "This is a network problem from the deployment, not a key problem.",
    });
  }

  if (probe.status === 401 || probe.status === 403) {
    return NextResponse.json({
      ...out, ok: false, falStatus: probe.status,
      verdict: "fal rejected this key, so nothing runs on fal at all.",
      fix: "Generate a fresh key at fal.ai → Dashboard → Keys and replace FAL_KEY, then redeploy.",
    });
  }

  return NextResponse.json({
    ...out,
    ok: true,
    falStatus: probe.status,
    verdict: "FAL_KEY is valid and accepted.",
    covers:
      "Authentication only. It does not prove any of these models will run: billing state is " +
      "invisible here, and so is model entitlement.",
    nextStep:
      "Generate one headshot and read the server log — it names the engine that served each image, " +
      "and every model that refused before it.",
  });
}
