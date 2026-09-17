import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { openaiKeyShape, openaiImageModel, openaiProbe } from "@/lib/openai-image";

export const runtime = "nodejs";

/**
 * Tells you whether OPENAI_API_KEY works, without spending anything.
 *
 * The headshot tool asks for OpenAI's image model first and quietly drops to
 * the standard model when it cannot have it. That is the right behaviour for a
 * customer mid-generation and a terrible one for an operator trying to work
 * out why the pictures look unchanged — so the answer is available on demand.
 *
 *   GET /api/admin/openai-check?token=<ADMIN_IMAGE_TOKEN>
 *
 * The key is never returned, only its length and first few characters, which
 * is enough to spot a truncated paste or an empty variable.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const key = openaiKeyShape();
  const model = openaiImageModel();

  if (!key.configured) {
    return NextResponse.json({
      ok: false,
      key,
      model,
      verdict: "OPENAI_API_KEY is not set on this deployment.",
      effect: "Headshots fall back to the standard model, and the page says so.",
      fix: "Add OPENAI_API_KEY in the Vercel project's environment variables (platform.openai.com → API keys), then redeploy — environment changes only reach a new deployment.",
    });
  }

  let probe: Awaited<ReturnType<typeof openaiProbe>>;
  try {
    probe = await openaiProbe();
  } catch (e) {
    return NextResponse.json({
      ok: false,
      key,
      model,
      verdict: `Could not reach OpenAI at all: ${(e as Error).message}`,
      fix: "This is a network problem from the deployment, not a key problem.",
    });
  }

  if (probe.status === 200) {
    return NextResponse.json({
      ok: probe.hasModel !== false,
      key,
      model,
      modelAvailable: probe.hasModel,
      verdict:
        probe.hasModel === false
          ? `The key is valid, but "${model}" is not in this account's model list.`
          : "OPENAI_API_KEY is valid and accepted.",
      // Same caveat as the fal check: listing models authenticates without
      // touching billing, so an account with no credit still passes here.
      covers:
        "Authentication only. Billing is not visible here — an account with an exhausted quota still passes this check, and only fails on a request that would cost money.",
      ...(probe.hasModel === false
        ? { fix: `Set OPENAI_IMAGE_MODEL to a model this account can use, or enable "${model}" for the organisation.` }
        : {}),
    });
  }

  if (probe.status === 401 || probe.status === 403) {
    return NextResponse.json({
      ok: false, key, model, status: probe.status, body: probe.body,
      verdict: "OpenAI rejected this key.",
      fix: "Generate a fresh key at platform.openai.com → API keys and replace OPENAI_API_KEY, then redeploy. Paste the key alone — no quotes, no 'Bearer ' prefix, no trailing newline.",
    });
  }

  return NextResponse.json({
    ok: false, key, model, status: probe.status, body: probe.body,
    verdict: "Unexpected response from OpenAI.",
  });
}
