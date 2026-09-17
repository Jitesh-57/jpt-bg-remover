import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { falConfigured, falEndpoint, falEndpointProbe, falModelIds, falPathVariants } from "@/lib/fal";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Finds out which image endpoints this fal account can actually reach.
 *
 *   GET /api/admin/model-probe?token=<ADMIN_IMAGE_TOKEN>
 *
 * Generates nothing and costs nothing: each request carries an empty body, and
 * every image endpoint requires a prompt, so fal rejects it before queueing any
 * work. What comes back is the status, which is the diagnosis — see
 * falEndpointProbe.
 *
 * It also probes the alternative spellings the runtime itself falls back to
 * (falPathVariants), so the report and the behaviour cannot drift apart. If a
 * variant answers and the configured one does not, generations already work —
 * pinning it with the named environment variable just skips the extra round
 * trip on every request.
 */

/** What a status means for this endpoint, in one line. */
function read(status: number): { reachable: boolean; meaning: string } {
  if (status === 422 || status === 400)
    return { reachable: true, meaning: "Reachable — fal validated the input, so the path and the entitlement are fine." };
  if (status === 404)
    return { reachable: false, meaning: "No model at this path." };
  if (status === 403)
    return { reachable: false, meaning: "Path exists, but this account may not use it. Enable it on fal, or add billing." };
  if (status === 401)
    return { reachable: false, meaning: "FAL_KEY rejected — nothing on fal will work." };
  if (status === 402)
    return { reachable: false, meaning: "Out of credit on fal." };
  if (status === 200 || status === 201)
    return { reachable: true, meaning: "Accepted a request with no prompt, which is unexpected but means the path is live." };
  return { reachable: false, meaning: `Unexpected status ${status}.` };
}

function envVarFor(model: string): string {
  return `FAL_ENDPOINT_${model.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_EDIT`;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  if (!falConfigured()) {
    return NextResponse.json({
      ok: false,
      verdict: "FAL_KEY is not set on this deployment.",
      fix: "Add FAL_KEY in the Vercel project's environment variables, then redeploy.",
    });
  }

  const models = falModelIds();
  const results = await Promise.all(
    models.map(async (model) => {
      const configured = falEndpoint(model, "edit");
      // Exactly what the runtime would try, in the same order.
      const paths = falPathVariants(model, "edit");
      const probes = await Promise.all(
        paths.map(async (path) => {
          try {
            const { status, body } = await falEndpointProbe(path);
            return { path, status, ...read(status), detail: body.slice(0, 160) };
          } catch (e) {
            return { path, status: 0, reachable: false, meaning: `Could not reach fal: ${(e as Error).message}`, detail: "" };
          }
        })
      );
      const working = probes.find((p) => p.reachable);
      return {
        model,
        configured,
        working: working?.path ?? null,
        needsChange: !!working && working.path !== configured,
        ...(working && working.path !== configured
          ? { fix: `Works already via fallback. Set ${envVarFor(model)}=${working.path} in Vercel to skip the extra round trip.` }
          : {}),
        probes,
      };
    })
  );

  const gpt = results.filter((r) => r.model.startsWith("gpt-image"));
  const anyGpt = gpt.some((r) => r.working);

  return NextResponse.json({
    ok: anyGpt,
    verdict: anyGpt
      ? "At least one GPT Image endpoint is reachable — headshots should be served by it."
      : "No GPT Image endpoint is reachable from this account, which is why headshots come out on Nano Banana.",
    changes: results.filter((r) => r.needsChange).map((r) => r.fix),
    results,
    note:
      "Nothing was generated and nothing was charged: each probe sends an empty body, which every " +
      "image endpoint rejects before queueing work.",
  });
}
