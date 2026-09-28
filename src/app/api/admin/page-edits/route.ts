import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { GLOBAL_SCOPE, MAX_TEXT, isEditablePath, isOurImage, normPath, normText, type PageEdits, type PageRules } from "@/lib/page-edits";
import { readEditsNow, uploadEditImage, writeEdits } from "@/lib/page-edits.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * /api/admin/page-edits — the visual page editor's store.
 *
 *   GET                                                     every change, uncached
 *   POST { scope, kind: "text",  key, value }               set a text change (value null = reset)
 *   POST { scope, kind: "image", key, value }               set an image change (value null = reset)
 *   POST { action: "upload", dataUrl }                      store a WebP, returns { url }
 *   POST { action: "reset-page", scope }                    drop every change on one page
 *
 * scope is a page path ("/pricing") or "*" for every page. ?token= on every call.
 */

const MAX_UPLOAD = 3 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json(await readEditsNow());
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as {
    action?: string; scope?: string; kind?: string; key?: string; value?: string | null; dataUrl?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  if (body.action === "upload") {
    const m = /^data:image\/webp;base64,/.exec(body.dataUrl || "");
    if (!m) return NextResponse.json({ error: "Expected a WebP image." }, { status: 400 });
    const bytes = Buffer.from(body.dataUrl!.slice(m[0].length), "base64");
    if (!bytes.length) return NextResponse.json({ error: "That image was empty." }, { status: 400 });
    if (bytes.length > MAX_UPLOAD) return NextResponse.json({ error: "That image is over 3MB even after compressing. Try a smaller one." }, { status: 413 });
    const up = await uploadEditImage(bytes);
    return up.ok ? NextResponse.json({ url: up.url }) : NextResponse.json({ error: up.error }, { status: 502 });
  }

  const scope = body.scope === GLOBAL_SCOPE ? GLOBAL_SCOPE : normPath(String(body.scope || ""));
  if (scope !== GLOBAL_SCOPE && (!scope.startsWith("/") || !isEditablePath(scope))) {
    return NextResponse.json({ error: "That isn't a page that can be edited." }, { status: 400 });
  }

  const current = await readEditsNow();
  const next: PageEdits = { version: 1, updatedAt: new Date().toISOString(), pages: { ...current.pages } };

  if (body.action === "reset-page") {
    delete next.pages[scope];
  } else if (body.kind === "text" || body.kind === "image") {
    const rules: PageRules = { text: { ...(next.pages[scope]?.text || {}) }, images: { ...(next.pages[scope]?.images || {}) } };
    if (body.kind === "text") {
      const key = normText(String(body.key || ""));
      if (!key || key.length > MAX_TEXT) return NextResponse.json({ error: "Pick some text to change." }, { status: 400 });
      const value = body.value == null ? null : String(body.value).replace(/\r\n/g, "\n").trim().slice(0, MAX_TEXT);
      if (value === null || value === key) delete rules.text![key];
      else rules.text![key] = value;
    } else {
      const key = String(body.key || "");
      if (!/^https?:\/\//.test(key) || key.length > 1000) return NextResponse.json({ error: "Pick an image to change." }, { status: 400 });
      const value = body.value == null ? null : String(body.value);
      if (value !== null && !isOurImage(value)) return NextResponse.json({ error: "Upload the new image first." }, { status: 400 });
      if (value === null) delete rules.images![key];
      else rules.images![key] = value;
    }
    const empty = !Object.keys(rules.text!).length && !Object.keys(rules.images!).length;
    if (empty) delete next.pages[scope];
    else next.pages[scope] = {
      ...(Object.keys(rules.text!).length ? { text: rules.text } : {}),
      ...(Object.keys(rules.images!).length ? { images: rules.images } : {}),
    };
  } else {
    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  }

  const saved = await writeEdits(next);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 502 });
  return NextResponse.json({ ok: true, edits: next });
}
