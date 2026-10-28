import {
  BUILTIN_POPUPS, EMPTY_POPUPS, MAX_CUSTOM_POPUPS, MAX_POPUP_TEXT, POPUPS_BUCKET, POPUPS_PATH, POPUP_DESIGNS, safeLink,
  type BuiltinSettings, type CustomPopup, type PopupsDoc,
} from "@/lib/popups";

/**
 * Reading and writing the pop-up settings document (lib/popups.ts). Server-only:
 * writing needs the service key.
 */

export async function readPopupsNow(): Promise<PopupsDoc> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return EMPTY_POPUPS;
  try {
    const res = await fetch(`${base}/storage/v1/object/public/${POPUPS_BUCKET}/${POPUPS_PATH}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return EMPTY_POPUPS;
    const json = (await res.json()) as PopupsDoc;
    return json && typeof json === "object" && json.builtin && Array.isArray(json.custom) ? json : EMPTY_POPUPS;
  } catch {
    return EMPTY_POPUPS;
  }
}

export async function writePopups(next: PopupsDoc): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };
  try {
    const res = await fetch(`${base}/storage/v1/object/${POPUPS_BUCKET}/${POPUPS_PATH}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
        // Short, so visitors pick a change up within a minute.
        "Cache-Control": "public, max-age=30",
      },
      body: JSON.stringify(next),
    });
    if (!res.ok) return { ok: false, error: `Storage refused the write (${res.status}).` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Storage could not be reached: ${(e as Error).message}` };
  }
}

const str = (v: unknown, max = MAX_POPUP_TEXT) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt;
};
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], dflt: T): T => (allowed.includes(v as T) ? (v as T) : dflt);

/**
 * What admin sent, cut down to what the site understands: known pop-ups and
 * fields only, text trimmed to length, links that are a page or an http(s)
 * address, numbers in range. Whatever else arrives is dropped.
 */
export function cleanPopups(input: unknown): PopupsDoc {
  const src = (input && typeof input === "object" ? input : {}) as Partial<PopupsDoc>;
  const builtin: Record<string, BuiltinSettings> = {};
  for (const def of BUILTIN_POPUPS) {
    const given = (src.builtin as Record<string, BuiltinSettings> | undefined)?.[def.id];
    if (!given || typeof given !== "object") continue;
    const text: Record<string, string> = {};
    for (const f of def.fields) {
      const v = given.text?.[f.key];
      if (typeof v !== "string" || !v.trim()) continue;
      if (f.kind === "url" || f.kind === "image") { const l = safeLink(v); if (l) text[f.key] = l; continue; }
      if (f.kind === "select" && !f.options?.some(([k]) => k === v)) continue;
      if (f.kind === "number") { text[f.key] = String(num(v, 0, 3650, Number(f.default) || 0)); continue; }
      text[f.key] = str(v);
    }
    builtin[def.id] = { enabled: def.canTurnOff ? given.enabled !== false : true, text };
  }

  const designs = POPUP_DESIGNS.map(([d]) => d);
  const seen = new Set<string>();
  const custom: CustomPopup[] = (Array.isArray(src.custom) ? src.custom : []).slice(0, MAX_CUSTOM_POPUPS).flatMap((raw) => {
    const p = (raw && typeof raw === "object" ? raw : {}) as Partial<CustomPopup>;
    const id = str(p.id, 40).replace(/[^a-z0-9-]/gi, "");
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [{
      id,
      name: str(p.name, 120) || "Popup",
      enabled: p.enabled === true,
      design: oneOf(p.design, designs, "split"),
      badge: str(p.badge, 80),
      title: str(p.title, 200),
      text: str(p.text),
      bullets: str(p.bullets),
      button: str(p.button, 80),
      action: oneOf(p.action, ["link", "signup"] as const, "link"),
      link: safeLink(str(p.link, 600)),
      secondary: str(p.secondary, 80),
      secondaryLink: safeLink(str(p.secondaryLink, 600)),
      dismiss: str(p.dismiss, 80),
      image: safeLink(str(p.image, 600)),
      caption: str(p.caption, 120),
      beforeAfter: p.beforeAfter === true,
      audience: oneOf(p.audience, ["everyone", "signed-out", "signed-in"] as const, "everyone"),
      pages: str(p.pages, 2000),
      delay: num(p.delay, 0, 600, 8),
      repeatDays: num(p.repeatDays, 0, 365, 3),
    }];
  });

  return { version: 1, updatedAt: new Date().toISOString(), builtin, custom };
}
