"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { label, input, chip, chipOn, danger } from "../creatives/AdminShell";

type AnyRow = Record<string, any>;
type Payload = {
  auth: AnyRow;
  profile: AnyRow | null;
  generations: AnyRow[];
  creditLedger: AnyRow[];
  purchases: AnyRow[];
  subscriptions: AnyRow[];
  events: AnyRow[];
  acquisition: AnyRow | null;
  countries: AnyRow | null;
  trialGrant: AnyRow | null;
  storageFiles: AnyRow[];
  linkedStorageObjects: AnyRow[];
  timeline: { type: string; at: string; data: AnyRow }[];
  limits: AnyRow;
};

const TOKEN_KEY = "jpt-admin-token";
const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, minWidth: 0 };
const muted: React.CSSProperties = { color: "var(--text-muted)" };
const smallLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-faint)" };
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const bytes = (value?: number) => typeof value === "number" ? value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(2)} MB` : `${(value / 1024).toFixed(1)} KB` : "—";
const pretty = (value: unknown) => value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

function Field({ name, value }: { name: string; value: unknown }) {
  return <div style={{ minWidth: 0, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
    <div style={smallLabel}>{name.replaceAll("_", " ")}</div>
    <div style={{ fontSize: 13, marginTop: 4, overflowWrap: "anywhere" }}>{pretty(value)}</div>
  </div>;
}

function ImagePanel({ title, url, name }: { title: string; url?: string | null; name?: string | null }) {
  return <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", minWidth: 0, background: "var(--surface-2)" }}>
    <div style={{ padding: "9px 11px", fontSize: 12, fontWeight: 800 }}>{title}</div>
    {url ? <a href={url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
      <img src={url} alt={title} style={{ display: "block", width: "100%", height: 250, objectFit: "contain", background: "var(--surface-2)" }} />
    </a> : <div style={{ height: 180, display: "grid", placeItems: "center", ...muted, fontSize: 12 }}>No image URL recorded</div>}
    <div style={{ padding: "8px 11px", fontSize: 11, ...muted, overflowWrap: "anywhere" }}>{name || (url ? "Open image in new tab" : "Not available")}</div>
    {url && <div style={{ padding: "0 11px 10px" }}><a href={url} download style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-strong)" }}>Download image ↓</a></div>}
  </div>;
}

export default function UserActivityInspector() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [lookup, setLookup] = useState(searchParams.get("id") || "");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"generations" | "timeline" | "billing" | "events">("generations");

  useEffect(() => { try { setToken(localStorage.getItem(TOKEN_KEY) || ""); } catch {} }, []);

  const loadId = useCallback(async (id: string, currentToken: string) => {
    const response = await fetch(`/api/admin/user-activity?token=${encodeURIComponent(currentToken)}&id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) throw new Error(result.error || `Request failed (${response.status})`);
    setData(result as Payload);
  }, []);

  const search = async () => {
    const q = lookup.trim();
    if (!q || !token.trim()) { setError("Enter an email or user UUID and your admin token."); return; }
    setLoading(true); setError(""); setData(null);
    try {
      try { localStorage.setItem(TOKEN_KEY, token.trim()); } catch {}
      if (/^[0-9a-f-]{36}$/i.test(q)) {
        await loadId(q, token.trim());
      } else {
        const response = await fetch(`/api/admin/users?token=${encodeURIComponent(token.trim())}&filter=all&q=${encodeURIComponent(q)}&offset=0`, { cache: "no-store" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.error) throw new Error(result.error || "Could not search users.");
        const exact = (result.users || []).find((user: AnyRow) => (user.email || "").toLowerCase() === q.toLowerCase());
        const user = exact || (result.users || [])[0];
        if (!user) throw new Error("No user found. Try the exact email address or paste the user's UUID.");
        setLookup(user.id);
        await loadId(user.id, token.trim());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load user activity.");
    } finally { setLoading(false); }
  };

  const profile = data?.profile;
  const auth = data?.auth;
  const generations = data?.generations ?? [];
  const totalSpent = (data?.creditLedger ?? []).reduce((sum, row) => sum + (Number(row.delta) < 0 ? Math.abs(Number(row.delta)) : 0), 0);

  return <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "28px 16px 80px" }}>
    <div style={{ maxWidth: 1240, margin: "0 auto" }}>
      <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", margin: "12px 0 20px" }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 850, letterSpacing: "-.03em", margin: 0 }}>User activity inspector</h1>
          <p style={{ ...muted, fontSize: 13.5, margin: "7px 0 0" }}>Inspect account details, image generations, credits, purchases and the user's activity timeline.</p>
        </div>
        <a href="/admin/users" style={{ ...chip, textDecoration: "none" }}>Users & credits ↗</a>
      </div>

      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr) auto", gap: 10, alignItems: "end" }}>
          <div><label style={smallLabel}>User email or UUID</label><input value={lookup} onChange={(e) => setLookup(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void search(); }} placeholder="name@example.com or user UUID" style={{ ...input, marginTop: 6 }} /></div>
          <div><label style={smallLabel}>Admin token</label><input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_IMAGE_TOKEN" style={{ ...input, marginTop: 6 }} /></div>
          <button onClick={() => void search()} disabled={loading} style={{ ...chip, ...chipOn, borderRadius: 10, padding: "11px 18px", opacity: loading ? .6 : 1 }}>{loading ? "Loading…" : "Inspect user"}</button>
        </div>
        {error && <div style={{ ...danger, marginTop: 12 }}>{error}</div>}
      </section>

      {data && auth && <>
        <section style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {auth.user_metadata?.avatar_url && <img src={auth.user_metadata.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: 50, objectFit: "cover" }} />}
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800 }}>{profile?.name || auth.user_metadata?.name || auth.email || "User"}</div>
              <div style={{ ...muted, fontSize: 13 }}>{auth.email || "No email"} · {auth.provider || "unknown provider"}</div>
              <div style={{ ...muted, fontSize: 11, marginTop: 3, overflowWrap: "anywhere" }}>UID: {auth.id}</div>
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div><div style={smallLabel}>Credits</div><div style={{ fontSize: 22, fontWeight: 800 }}>{profile?.credits ?? "—"}</div></div>
              <div><div style={smallLabel}>Plan</div><div style={{ fontSize: 16, fontWeight: 800 }}>{profile?.plan || "—"}</div></div>
              <div><div style={smallLabel}>Generations</div><div style={{ fontSize: 22, fontWeight: 800 }}>{generations.length}</div></div>
              <div><div style={smallLabel}>Credits spent</div><div style={{ fontSize: 22, fontWeight: 800 }}>{totalSpent}</div></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0 18px", marginTop: 16 }}>
            <Field name="Created" value={dateTime(auth.created_at)} />
            <Field name="Last signed in" value={dateTime(auth.last_sign_in_at)} />
            <Field name="Email confirmed" value={dateTime(auth.email_confirmed_at)} />
            <Field name="Providers" value={auth.providers} />
            <Field name="Profile created" value={dateTime(profile?.created_at)} />
            <Field name="Phone" value={auth.phone} />
          </div>
        </section>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {([["generations", `Generations (${generations.length})`], ["timeline", `Timeline (${data.timeline.length})`], ["billing", "Credits & billing"], ["events", `Events (${data.events.length})`]] as const).map(([id, title]) =>
            <button key={id} onClick={() => setTab(id)} style={{ ...chip, ...(tab === id ? chipOn : {}) }}>{title}</button>
          )}
        </nav>

        {tab === "generations" && <section style={{ display: "grid", gap: 14 }}>
          {!generations.length && <div style={card}>No generation records found for this account.</div>}
          {generations.map((generation) => <article key={generation.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div><div style={{ fontSize: 16, fontWeight: 800 }}>{generation.label || generation.tool || "Generation"}</div><div style={{ ...muted, fontSize: 12, marginTop: 4 }}>{dateTime(generation.created_at)} · {generation.category || "—"} · {generation.status || "unknown"}</div></div>
              <div style={{ textAlign: "right", fontSize: 12, ...muted }}>{generation.credits_spent ?? 0} credits · {generation.duration_ms ? `${(generation.duration_ms / 1000).toFixed(1)} sec` : "duration n/a"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              <ImagePanel title="Original / input" url={generation.source_url || generation.image_url} name={generation.original_name} />
              <ImagePanel title="Generated / output" url={generation.result_url || generation.image_url} name={generation.original_name ? `Output for ${generation.original_name}` : generation.id} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "0 16px", marginTop: 12 }}>
              <Field name="Tool" value={generation.tool} /><Field name="App slug" value={generation.app_slug} />
              <Field name="Model" value={generation.model} /><Field name="Provider" value={generation.provider} />
              <Field name="Preset" value={generation.preset} /><Field name="Aspect ratio" value={generation.aspect_ratio} />
              <Field name="Status" value={generation.status} /><Field name="Error" value={generation.error} />
            </div>
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 800 }}>View full prompt and generation metadata</summary>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "var(--surface-2)", borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.6 }}>{generation.prompt || "No prompt stored."}</pre>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "var(--surface-2)", borderRadius: 10, padding: 12, fontSize: 11 }}>{JSON.stringify(generation, null, 2)}</pre>
            </details>
          </article>)}
          {!!data.storageFiles.length && <section style={card}><h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Files in user's generations folder</h2>
            {data.storageFiles.map((file) => <div key={file.path} style={{ padding: "9px 0", borderTop: "1px solid var(--border)", display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ overflowWrap: "anywhere" }}>{file.name} · {bytes(file.metadata?.size)}</span>
              {file.url ? <a href={file.url} download style={{ color: "var(--accent-strong)", fontWeight: 700 }}>Download ↧</a> : <span style={muted}>No signed URL</span>}
            </div>)}
          </section>}
        </section>}

        {tab === "timeline" && <section style={card}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Chronological activity</h2>
          {data.timeline.map((item, index) => <div key={`${item.type}-${item.data.id ?? index}`} style={{ display: "grid", gridTemplateColumns: "150px 110px minmax(0,1fr)", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
            <span style={muted}>{dateTime(item.at)}</span><strong>{item.type}</strong><span style={{ overflowWrap: "anywhere" }}>{item.data.name || item.data.tool || item.data.reason || item.data.plan || item.data.path || item.data.status || item.data.id}</span>
          </div>)}
          {!data.timeline.length && <p style={muted}>No timeline entries.</p>}
        </section>}

        {tab === "billing" && <div style={{ display: "grid", gap: 14 }}>
          <section style={card}><h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Credit ledger</h2>
            {data.creditLedger.map((row) => <div key={row.id} style={{ display: "grid", gridTemplateColumns: "90px minmax(0,1fr) 160px", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
              <strong style={{ color: row.delta > 0 ? "var(--success)" : "var(--danger)" }}>{row.delta > 0 ? "+" : ""}{row.delta}</strong><span>{row.reason} · {row.tool || row.note || "—"}</span><span style={muted}>{dateTime(row.created_at)} · balance {row.balance_after}</span>
            </div>)}
            {!data.creditLedger.length && <p style={muted}>No credit ledger entries.</p>}
          </section>
          <section style={card}><h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Purchases</h2>
            {data.purchases.map((row) => <div key={row.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
              <span>{row.plan || "Purchase"} · {row.credits_added ?? 0} credits · {dateTime(row.created_at)}</span><strong>₹{((row.amount_paise || 0) / 100).toLocaleString("en-IN")}</strong>
            </div>)}
            {!data.purchases.length && <p style={muted}>No purchases found.</p>}
          </section>
          <section style={card}><h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Subscriptions</h2>
            {data.subscriptions.map((row) => <div key={row.id} style={{ padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>{row.plan} · {row.status} · {row.credits_remaining} credits remaining · {dateTime(row.current_start)} – {dateTime(row.current_end)}</div>)}
            {!data.subscriptions.length && <p style={muted}>No subscriptions found.</p>}
          </section>
        </div>}

        {tab === "events" && <section style={card}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Tracked events (latest {data.events.length})</h2>
          {data.events.map((event) => <details key={event.id} style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
            <summary style={{ cursor: "pointer", fontSize: 12.5 }}><strong>{event.name}</strong> · {event.path || "—"} <span style={muted}>· {dateTime(event.created_at)}</span></summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "var(--surface-2)", borderRadius: 8, padding: 10, fontSize: 11 }}>{JSON.stringify(event, null, 2)}</pre>
          </details>)}
          {!data.events.length && <p style={muted}>No tracked events.</p>}
        </section>}

        <section style={{ ...card, marginTop: 14 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Acquisition and account context</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "0 16px" }}>
            <Field name="First landing path" value={data.acquisition?.landing_path} />
            <Field name="Referrer" value={data.acquisition?.referrer} />
            <Field name="UTM source / medium / campaign" value={[data.acquisition?.utm_source, data.acquisition?.utm_medium, data.acquisition?.utm_campaign].filter(Boolean).join(" / ")} />
            <Field name="Device / browser / OS" value={[data.acquisition?.device, data.acquisition?.browser, data.acquisition?.os].filter(Boolean).join(" / ")} />
            <Field name="Country / city" value={[data.acquisition?.country || data.countries?.signup_country, data.acquisition?.city].filter(Boolean).join(" / ")} />
            <Field name="Trial grant" value={data.trialGrant ? `${data.trialGrant.credits} credits · ${data.trialGrant.country} · ${dateTime(data.trialGrant.granted_at)}` : "—"} />
          </div>
          <p style={{ ...muted, fontSize: 11, marginBottom: 0 }}>Image links are temporary signed URLs (valid for 1 hour). Results are capped at {data.limits.generations} generations and {data.limits.events} events.</p>
        </section>
      </>}
    </div>
  </main>;
}
