import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function storageObjectFromUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/";
    const at = url.pathname.indexOf(marker);
    if (at < 0) return null;
    const tail = url.pathname.slice(at + marker.length);
    const parts = tail.split("/");
    if (parts.length < 2) return null;
    const visibility = parts.shift();
    const bucket = parts.shift();
    const path = decodeURIComponent(parts.join("/"));
    if (!bucket || !path || !["public", "sign", "authenticated"].includes(visibility || "")) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

async function imageLink(value: unknown, token: string) {
  if (typeof value !== "string" || !value) return null;
  const object = storageObjectFromUrl(value);
  if (!object) return value;
  return `/api/admin/user-activity/image?token=${encodeURIComponent(token)}&bucket=${encodeURIComponent(object.bucket)}&path=${encodeURIComponent(object.path)}`;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const userId = (req.nextUrl.searchParams.get("id") || "").trim();
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "Provide a valid user UUID in ?id=." }, { status: 400 });
  }

  const db = createAdminSupabase();
  const [
    authResult,
    profileResult,
    generationsResult,
    ledgerResult,
    purchasesResult,
    subscriptionsResult,
    eventsResult,
    acquisitionResult,
    countryResult,
    trialResult,
  ] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("profiles").select("*").eq("id", userId).maybeSingle(),
    db.from("generations").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    db.from("credit_ledger").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    db.from("purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    db.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    db.from("user_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
    db.from("user_acquisition").select("*").eq("user_id", userId).maybeSingle(),
    db.from("user_countries").select("*").eq("user_id", userId).maybeSingle(),
    db.from("trial_grants").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const authUser = authResult.data?.user;
  if (authResult.error || !authUser) {
    return NextResponse.json({ error: "Authentication user not found." }, { status: 404 });
  }
  if (profileResult.error) {
    return NextResponse.json({ error: `Could not read user profile: ${profileResult.error.message}` }, { status: 500 });
  }

  const generations = generationsResult.data ?? [];
  const images = await Promise.all(generations.map(async (generation) => ({
    ...generation,
    source_url: await imageLink(generation.source_url, token),
    result_url: await imageLink(generation.result_url, token),
    image_url: await imageLink(generation.image_url, token),
  })));

  // Also list files stored under the user's UID in the generations bucket.
  const { data: generatedFiles } = await db.storage.from("generations").list(userId, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  const files = await Promise.all((generatedFiles ?? []).map(async (file) => {
    const path = `${userId}/${file.name}`;
    const url = `/api/admin/user-activity/image?token=${encodeURIComponent(token)}&bucket=generations&path=${encodeURIComponent(path)}`;
    return { bucket: "generations", path, name: file.name, created_at: file.created_at, metadata: file.metadata, url };
  }));

  // Add signed links for any original source stored in a different bucket.
  const sourceObjects = new Map<string, { bucket: string; path: string }>();
  for (const generation of generations) {
    for (const key of ["source_url", "result_url", "image_url"] as const) {
      const object = storageObjectFromUrl(generation[key]);
      if (object) sourceObjects.set(`${object.bucket}/${object.path}`, object);
    }
  }
  const linkedObjects = await Promise.all(Array.from(sourceObjects.values()).map(async (object) => {
    const url = `/api/admin/user-activity/image?token=${encodeURIComponent(token)}&bucket=${encodeURIComponent(object.bucket)}&path=${encodeURIComponent(object.path)}`;
    return { ...object, url };
  }));

  const auth = {
    id: authUser.id,
    email: authUser.email ?? null,
    phone: authUser.phone ?? null,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at,
    last_sign_in_at: authUser.last_sign_in_at,
    email_confirmed_at: authUser.email_confirmed_at,
    phone_confirmed_at: authUser.phone_confirmed_at,
    providers: authUser.app_metadata?.providers ?? [],
    provider: authUser.app_metadata?.provider ?? null,
    user_metadata: {
      name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name ?? null,
      avatar_url: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
      email_verified: authUser.user_metadata?.email_verified ?? null,
    },
  };

  const timeline = [
    ...(eventsResult.data ?? []).map((event) => ({ type: "event", at: event.created_at, data: event })),
    ...images.map((generation) => ({ type: "generation", at: generation.created_at, data: generation })),
    ...(ledgerResult.data ?? []).map((entry) => ({ type: "credit", at: entry.created_at, data: entry })),
    ...(purchasesResult.data ?? []).map((purchase) => ({ type: "purchase", at: purchase.created_at, data: purchase })),
  ].filter((item) => item.at).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return NextResponse.json({
    auth,
    profile: profileResult.data,
    generations: images,
    creditLedger: ledgerResult.data ?? [],
    purchases: purchasesResult.data ?? [],
    subscriptions: subscriptionsResult.data ?? [],
    events: eventsResult.data ?? [],
    acquisition: acquisitionResult.data,
    countries: countryResult.data,
    trialGrant: trialResult.data,
    storageFiles: files,
    linkedStorageObjects: linkedObjects,
    timeline,
    limits: { generations: 200, events: 500, creditLedger: 200, purchases: 100 },
  }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
