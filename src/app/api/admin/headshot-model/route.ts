import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { falKeyShape, falProbe, falGptImageEndpoints } from "@/lib/fal";
import { openaiKeyShape, openaiImageModel } from "@/lib/openai-image";

export const runtime = "nodejs";

/**
 * Says which engine a headshot would be generated on, and why.
 *
 * The tool asks for GPT Image through fal and quietly drops to Nano Banana
 * when it cannot have it. That is the right behaviour for a customer mid-
 * generation and a useless one for working out why the pictures look
 * unchanged — so the answer is available on demand.
 *
 *   GET /api/admin/headshot-model?token=<ADMIN_IMAGE_TOKEN>
 *
 * No keys are returned, only their length and shape, which is enough to spot
 * a truncated paste or an empty variable.
 *
 * What this CANNOT tell you: whether fal's BYOK endpoint has a working OpenAI
 * key behind it. fal only reveals that on a request that would actually cost
 * money, so it is not worth probing — generate one headshot and read the
 * notice on the page instead.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const fal = falKeyShape();
  const endpoints = falGptImageEndpoints();
  const openai = openaiKeyShape();

  const out: Record<string, unknown> = {
    primary: {
      route: "fal → GPT Image",
      key: fal,
      endpoint: endpoints.edit,
      endpointOverridden: endpoints.overridden,
      byok: /\/byok$/.test(endpoints.edit),
    },
    secondary: {
      route: "direct OpenAI",
      key: openai,
      model: openaiImageModel(),
      note: "Optional. Unset is fine — it exists only for input_fidelity:high.",
    },
    fallback: "Nano Banana, then Gemini. The gallery says so when this happens.",
  };

  if (!fal.configured) {
    return NextResponse.json({
      ...out,
      ok: false,
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

  const byok = /\/byok$/.test(endpoints.edit);
  return NextResponse.json({
    ...out,
    ok: true,
    falStatus: probe.status,
    verdict: "FAL_KEY is valid and accepted.",
    covers:
      "Authentication only. It does not prove GPT Image will run: billing state is invisible here, " +
      "and a BYOK endpoint additionally needs an OpenAI key on the fal account.",
    ...(byok
      ? {
          byokWarning:
            `${endpoints.edit} is a BYOK endpoint — fal calls OpenAI with a key stored on your fal ` +
            "account, not with fal credit alone. Set that key at fal.ai → Settings → Integrations, " +
            "or point FAL_GPT_IMAGE_EDIT at a GPT Image endpoint your fal account can serve directly.",
        }
      : {}),
    nextStep:
      "Generate one headshot. If the gallery shows the fallback notice, the server log for that " +
      "request names the exact reason.",
  });
}
