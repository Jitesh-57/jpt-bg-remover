import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which commit this deployment was built from.
 *
 * Exists so a deploy-triggered job can tell that *its own* build is live, not
 * merely that some build is answering. Checking whether a route exists is not
 * enough: after the first deploy that added it, the route answers from the
 * previous build too, so a job can start against the code it was meant to
 * replace — which is exactly what happened on the first two runs of the image
 * generator.
 */
export async function GET() {
  return NextResponse.json(
    {
      sha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
      ref: process.env.VERCEL_GIT_COMMIT_REF || "unknown",
      env: process.env.VERCEL_ENV || "development",
    },
    { headers: { "cache-control": "no-store" } }
  );
}
