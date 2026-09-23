"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { label, input, chip, primary, danger, success } from "../creatives/AdminShell";

/**
 * /admin/trials — country free trials.
 *
 * Add a country, set how many credits a new signup there gets, and switch it
 * live. Changes apply to the very next signup; nothing is cached. "Stop all"
 * switches every country off in one click.
 */

interface Rule { country: string; credits: number; live: boolean; updated_at: string }
interface Payload {
  rules?: Rule[];
  stats?: Record<string, { users: number; credits: number }>;
  recent?: { country: string; email: string | null; credits: number; granted_at: string }[];
  needsSetup?: boolean;
  error?: string;
  fix?: string;
}

// ISO 3166-1 alpha-2. Names come from the browser (Intl.DisplayNames).
const CODES = "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW".split(" ");

function flag(code: string): string {
  return String.fromCodePoint(...code.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default function TrialsAdmin() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newCountry, setNewCountry] = useState("");
  const [newCredits, setNewCredits] = useState(2);
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const names = useMemo(() => {
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      return (c: string) => dn.of(c) || c;
    } catch {
      return (c: string) => c;
    }
  }, []);

  useEffect(() => {
    try { const t = localStorage.getItem("jpt-admin-token"); if (t) setToken(t); } catch {}
  }, []);

  const call = useCallback(async (method: string, body?: object, query = "") => {
    const r = await fetch(`/api/admin/trials?token=${encodeURIComponent(token.trim())}${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return (await r.json().catch(() => ({ error: `HTTP ${r.status}` }))) as Payload & { ok?: boolean };
  }, [token]);

  const load = useCallback(async () => {
    if (!token.trim()) return;
    setBusy(true);
    try {
      const d = await call("GET");
      setData(d);
      setDrafts({});
    } finally { setBusy(false); }
  }, [call, token]);

  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<Payload & { ok?: boolean }>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      if (r.error) setMsg({ ok: false, text: r.fix ? `${r.error} ${r.fix}` : r.error });
      else setMsg({ ok: true, text: done });
      await load();
    } finally { setBusy(false); }
  };

  const save = (country: string, credits: number, live: boolean, done: string) =>
    act(() => call("POST", { country, credits, live }), done);

  const setup = () => act(async () => {
    const r = await fetch(`/api/admin/migrate?token=${encodeURIComponent(token.trim())}&apply=1`);
    return r.json();
  }, "Database set up. The USA trial (2 credits) is live.");

  const rules = data?.rules ?? [];
  const liveCount = rules.filter((r) => r.live).length;
  const available = CODES.filter((c) => !rules.some((r) => r.country === c)).sort((a, b) => names(a).localeCompare(names(b)));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 20px 90px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "10px 0 6px" }}>🎁 Free trials by country</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 22px", maxWidth: 640 }}>
          A <strong>new account</strong> that signs up from a <strong>live</strong> country gets these credits once, and only once
          per email address. Existing users never get them. Changes apply to the next signup, straight away.
        </p>

        <label style={label}>Admin token</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_IMAGE_TOKEN" style={input} />
          <button style={chip} onClick={() => { try { localStorage.setItem("jpt-admin-token", token.trim()); } catch {} void load(); }}>Load</button>
        </div>

        {data?.needsSetup && (
          <div style={{ ...card, borderColor: "var(--accent-border)" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>One-time setup needed</div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 14 }}>
              The free-trial tables aren&apos;t in the database yet. This creates them and turns on the USA trial (2 credits).
            </div>
            <button style={primary} disabled={busy} onClick={setup}>Set up database</button>
          </div>
        )}

        {data && !data.needsSetup && !data.error && (
          <>
            {/* Master status */}
            <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)" }}>Status</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: liveCount ? "var(--success)" : "var(--text-muted)" }}>
                  {liveCount ? `● Live in ${liveCount} ${liveCount === 1 ? "country" : "countries"}` : "○ All trials stopped"}
                </div>
              </div>
              {liveCount > 0 && (
                <button disabled={busy} onClick={() => act(() => call("POST", { action: "stop-all" }), "Every trial stopped.")}
                  style={{ ...chip, background: "var(--danger)", color: "#fff", border: "none", padding: "11px 18px", fontSize: 14 }}>
                  ■ Stop all trials now
                </button>
              )}
            </div>

            {/* Countries */}
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              {rules.length === 0 && <div style={{ padding: 18, fontSize: 14, color: "var(--text-muted)" }}>No countries yet. Add one below.</div>}
              {rules.map((r) => {
                const credits = drafts[r.country] ?? r.credits;
                const changed = credits !== r.credits;
                const st = data.stats?.[r.country];
                return (
                  <div key={r.country} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 800 }}>{flag(r.country)} {names(r.country)} <span style={{ color: "var(--text-faint)", fontWeight: 600, fontSize: 12.5 }}>{r.country}</span></div>
                      <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 3 }}>
                        {st ? `${st.users} ${st.users === 1 ? "user" : "users"} got a trial · ${st.credits} credits given` : "No trials given yet"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" min={1} max={100} value={credits}
                        onChange={(e) => setDrafts((d) => ({ ...d, [r.country]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))}
                        style={{ ...input, width: 74, padding: "8px 10px" }} aria-label={`Credits for ${names(r.country)}`} />
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>credits</span>
                      {changed && <button style={{ ...chip, ...on }} disabled={busy} onClick={() => save(r.country, credits, r.live, `${names(r.country)}: ${credits} credits saved.`)}>Save</button>}
                    </div>
                    <button disabled={busy} onClick={() => save(r.country, credits, !r.live, `${names(r.country)} ${r.live ? "stopped" : "is live"}.`)}
                      style={{ ...chip, minWidth: 104, ...(r.live ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "transparent" } : {}) }}>
                      {r.live ? "● Live" : "○ Stopped"}
                    </button>
                    <button disabled={busy} title="Remove" onClick={() => { if (confirm(`Remove ${names(r.country)}?`)) void act(() => call("DELETE", undefined, `&country=${r.country}`), `${names(r.country)} removed.`); }}
                      style={{ ...chip, padding: "7px 10px", color: "var(--text-faint)" }}>✕</button>
                  </div>
                );
              })}

              {/* Add */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", background: "var(--surface-2)", flexWrap: "wrap" }}>
                <select value={newCountry} onChange={(e) => setNewCountry(e.target.value)} style={{ ...input, flex: "1 1 200px", width: "auto" }}>
                  <option value="">Add a country…</option>
                  {available.map((c) => <option key={c} value={c}>{flag(c)} {names(c)}</option>)}
                </select>
                <input type="number" min={1} max={100} value={newCredits} onChange={(e) => setNewCredits(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  style={{ ...input, width: 74, padding: "10px" }} aria-label="Credits" />
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>credits</span>
                <button style={{ ...chip, ...on }} disabled={busy || !newCountry}
                  onClick={() => { void save(newCountry, newCredits, true, `${names(newCountry)} is live with ${newCredits} credits.`); setNewCountry(""); }}>
                  Add &amp; go live
                </button>
                <button style={chip} disabled={busy || !newCountry}
                  onClick={() => { void save(newCountry, newCredits, false, `${names(newCountry)} added (stopped).`); setNewCountry(""); }}>
                  Add stopped
                </button>
              </div>
            </div>

            {/* Recent */}
            {!!data.recent?.length && (
              <div style={card}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 10 }}>Latest trials given</div>
                {data.recent.map((g, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "6px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                    <span>{flag(g.country)} {g.email ?? "—"}</span>
                    <span style={{ color: "var(--text-faint)" }}>+{g.credits} · {new Date(g.granted_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {data?.error && !data.needsSetup && <div style={danger}>{data.error}{data.fix ? ` ${data.fix}` : ""}</div>}
        {msg && <div style={msg.ok ? success : danger}>{msg.text}</div>}
        {busy && <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-faint)" }}>Working…</div>}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, marginBottom: 16 };
const on: React.CSSProperties = { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent-strong)" };
