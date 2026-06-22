// Client-side: upload a base64 dataUrl blob directly to Supabase Storage.
// Requires bucket "landing" to have an anon INSERT policy in Supabase.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = "landing";

export async function uploadDataUrlToSupabase(dataUrl: string): Promise<string> {
  const fetchRes = await fetch(dataUrl);
  const blob = await fetchRes.blob();
  const mime = blob.type || "image/jpeg";
  const ext = mime.split("/")[1]?.split("+")[0] || "jpg";
  const path = `ai/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: blob,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed ${res.status}: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
