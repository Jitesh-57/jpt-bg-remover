import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { takeAiQuota } from "@/lib/launchpilot/store.server";
import { crawlSite, crawlToText } from "@/lib/launchpilot/crawl.server";
import { buildFactSheet, writeListing, suggestSites, launchPlan, type SiteInfo } from "@/lib/launchpilot/ai.server";

export const dynamic = "force-dynamic";
// A crawl plus the fact sheet can take a couple of minutes.
export const maxDuration = 300;

type Body = {
  action?: "crawl" | "factsheet" | "write" | "discover" | "plan";
  url?: string;
  maxPages?: number;
  pages?: { url?: string; text?: string }[];
  product?: Record<string, unknown>;
  site?: SiteInfo;
  sites?: SiteInfo[];
  formText?: string;
  existing?: string[];
};

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const quota = await takeAiQuota(session.userId).catch(() => ({ ok: true, used: 0, limit: 0 }));
  if (!quota.ok) return NextResponse.json({ error: `You've used today's ${quota.limit} AI requests. They reset at midnight UTC.` }, { status: 429 });

  try {
    switch (body.action) {
      case "crawl": {
        if (!body.url) return NextResponse.json({ error: "Enter your website URL first." }, { status: 400 });
        const maxPages = Math.min(Math.max(Number(body.maxPages) || 25, 5), 40);
        const { origin, pages } = await crawlSite(body.url, { maxPages, budgetMs: 80_000 });
        if (!pages.length) return NextResponse.json({ error: "No readable pages found. The site may block crawlers or render only in JavaScript; paste your pages' text instead." }, { status: 422 });
        const profile = await buildFactSheet(origin, crawlToText(pages), pages.length);
        return NextResponse.json({ ...profile, url: profile.url || origin, crawledPages: pages.map((p) => ({ url: p.url, title: p.title })), crawledAt: new Date().toISOString() });
      }
      case "factsheet": {
        const pages = (body.pages || []).filter((p) => p.text && p.text.trim()).slice(0, 30);
        if (!pages.length) return NextResponse.json({ error: "Paste the text of at least one page first." }, { status: 400 });
        const text = pages.map((p) => `### ${p.url || "Untitled page"}\n${String(p.text).slice(0, 40000)}`).join("\n\n").slice(0, 220000);
        return NextResponse.json(await buildFactSheet(pages[0].url || "", text, pages.length));
      }
      case "write":
        if (!body.product || !body.site) return NextResponse.json({ error: "Bad request" }, { status: 400 });
        return NextResponse.json(await writeListing(body.product, body.site, String(body.formText || "")));
      case "discover":
        if (!body.product) return NextResponse.json({ error: "Bad request" }, { status: 400 });
        return NextResponse.json(await suggestSites(body.product, (body.existing || []).map(String)));
      case "plan":
        if (!body.product || !body.sites) return NextResponse.json({ error: "Bad request" }, { status: 400 });
        return NextResponse.json(await launchPlan(body.product, body.sites));
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[launchpilot]", e);
    return NextResponse.json({ error: (e as Error).message || "Something went wrong. Try again." }, { status: 500 });
  }
}
