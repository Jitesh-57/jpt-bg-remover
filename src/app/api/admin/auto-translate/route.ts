import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 120;

const LOCALES = ["hi", "es", "fr", "pt", "de", "ar", "ja", "zh", "ko"] as const;

const LOCALE_NAMES: Record<string, string> = {
  hi: "Hindi", es: "Spanish", fr: "French", pt: "Portuguese",
  de: "German", ar: "Arabic", ja: "Japanese", zh: "Chinese Simplified", ko: "Korean",
};

function auth(req: NextRequest): boolean {
  const token = req.nextUrl.searchParams.get("token")
    || req.headers.get("x-admin-token");
  return token === process.env.ADMIN_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, id } = body; // type: "blog" | "creative"
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let sourceContent: Record<string, string> = {};
  let table = "";
  let idField = "";

  if (type === "blog") {
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, content")
      .eq("slug", id)
      .single();
    if (!data) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    sourceContent = { title: data.title, excerpt: data.excerpt, content: data.content };
    table = "blog_post_translations";
    idField = "post_slug";
  } else if (type === "creative") {
    const { data } = await supabase
      .from("creative_apps")
      .select("slug, title, tagline, intro")
      .eq("slug", id)
      .single();
    if (!data) return NextResponse.json({ error: "Creative app not found" }, { status: 404 });
    sourceContent = { title: data.title, tagline: data.tagline, intro: data.intro };
    table = "creative_app_translations";
    idField = "app_slug";
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const results: Record<string, "ok" | "error"> = {};

  for (const locale of LOCALES) {
    try {
      const langName = LOCALE_NAMES[locale];
      const fieldsJson = JSON.stringify(sourceContent, null, 2);

      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `Translate the following JSON fields from English to ${langName}. Return ONLY valid JSON with the same keys. Do not add commentary.

${fieldsJson}`,
        }],
      });

      const raw = (msg.content[0] as { text: string }).text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const translated = JSON.parse(jsonMatch[0]);

      await supabase.from(table).upsert({
        [idField]: id,
        locale,
        ...translated,
        updated_at: new Date().toISOString(),
      }, { onConflict: `${idField},locale` });

      results[locale] = "ok";
    } catch (e) {
      console.error(`[auto-translate] ${locale}:`, e);
      results[locale] = "error";
    }
  }

  return NextResponse.json({ id, type, results });
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    usage: "POST /api/admin/auto-translate?token=<ADMIN_TOKEN>",
    body: { type: "blog | creative", id: "slug" },
    locales: LOCALES,
  });
}
