"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { label, input, chip, primary, danger, success } from "../creatives/AdminShell";
import { TRIAL_BATCHES, WORLDWIDE } from "@/lib/trial-batches";

/**
 * /admin/trials — country free trials.
 *
 * Add a country, set how many credits a new signup there gets, and switch it
 * live. Changes apply to the very next signup; nothing is cached. "Stop all"
 * switches every country off in one click, "Start all" every listed one on.
 * Below: a worldwide rule for every unlisted country, the country batches
 * (top payers first), and which countries actually buy.
 */

interface Rule { country: string; credits: number; live: boolean; updated_at: string }
interface Payload {
  rules?: Rule[];
  worldwide?: Rule | null;
  stats?: Record<string, { users: number; credits: number }>;
  recent?: { country: string; email: string | null; credits: number; granted_at: string }[];
  log?: { at: string; why: string; country: string; email: string; credits?: number; detail?: string }[];
  warnings?: string[];
  needsSetup?: boolean;
  error?: string;
  fix?: string;
}

interface InsightRow { country: string; signups: number; trials: number; buyers: number; trialBuyers: number; purchases: number; revenueInr: number }
interface Insights { rows?: InsightRow[]; since?: string | null; totals?: { accountsWithCountry: number; purchases: number; revenueInr: number }; needsSetup?: boolean; error?: string }

const batchOf = (c: string) => TRIAL_BATCHES.findIndex((b) => b.countries.includes(c));

// ISO 3166-1 alpha-2. Names come from the browser (Intl.DisplayNames).
const CODES = "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW".split(" ");


export default function TrialsAdmin() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newCountry, setNewCountry] = useState("");
  const [newCredits, setNewCredits] = useState(2);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [worldCredits, setWorldCredits] = useState<number | null>(null);
  const [batchCredits, setBatchCredits] = useState<Record<string, number>>({});
  const [ins, setIns] = useState<Insights | null>(null);

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
      const [d, i] = await Promise.all([call("GET"), call("GET", undefined, "&view=insights") as Promise<Insights>]);
      setData(d);
      setIns(i);
      setDrafts({});
      setWorldCredits(null);
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
  const stoppedCount = rules.length - liveCount;
  const world = data?.worldwide ?? null;
  const wCredits = worldCredits ?? world?.credits ?? 2;
  const ruleOf = (c: string) => rules.find((r) => r.country === c);
  const available = CODES.filter((c) => !rules.some((r) => r.country === c)).sort((a, b) => names(a).localeCompare(names(b)));
  // Matches the country's name or its code: "united", "ger", "us" all work.
  const q = query.trim().toLowerCase();
  const matches = (q ? available.filter((c) => names(c).toLowerCase().includes(q) || c.toLowerCase() === q) : available)
    .sort((a, b) => Number(names(b).toLowerCase().startsWith(q)) - Number(names(a).toLowerCase().startsWith(q)) || Number(b.toLowerCase() === q) - Number(a.toLowerCase() === q));

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
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: liveCount || world?.live ? "var(--success)" : "var(--text-muted)" }}>
                  {world?.live
                    ? `● Live worldwide${liveCount ? ` · ${liveCount} listed` : ""}`
                    : liveCount ? `● Live in ${liveCount} ${liveCount === 1 ? "country" : "countries"}` : "○ All trials stopped"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {stoppedCount > 0 && (
                  <button disabled={busy} onClick={() => act(() => call("POST", { action: "start-all" }), `All ${rules.length} listed countries are live.`)}
                    style={{ ...chip, background: "var(--success)", color: "#fff", border: "none", padding: "11px 18px", fontSize: 14 }}>
                    ▶ Start all listed ({stoppedCount})
                  </button>
                )}
                {(liveCount > 0 || world?.live) && (
                  <button disabled={busy} onClick={() => act(() => call("POST", { action: "stop-all" }), "Every trial stopped, worldwide included.")}
                    style={{ ...chip, background: "var(--danger)", color: "#fff", border: "none", padding: "11px 18px", fontSize: 14 }}>
                    ■ Stop all trials now
                  </button>
                )}
              </div>
            </div>

            {/* Worldwide */}
            <div style={{ ...card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", ...(world?.live ? { borderColor: "var(--success)" } : {}) }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800 }}>🌍 All countries (worldwide)</div>
                <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.5 }}>
                  Gives a trial in <strong>every</strong> country that isn&apos;t listed below. A listed country keeps its own setting, so a stopped one stays stopped.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" min={1} max={100} value={wCredits}
                  onChange={(e) => setWorldCredits(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  style={{ ...input, width: 74, padding: "8px 10px" }} aria-label="Worldwide credits" />
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>credits</span>
                {world && worldCredits !== null && worldCredits !== world.credits && (
                  <button style={{ ...chip, ...on }} disabled={busy} onClick={() => save(WORLDWIDE, wCredits, world.live, `Worldwide: ${wCredits} credits saved.`)}>Save</button>
                )}
              </div>
              <button disabled={busy}
                onClick={() => save(WORLDWIDE, wCredits, !world?.live, world?.live ? "Worldwide trial stopped." : `Worldwide trial is live: ${wCredits} credits for every unlisted country.`)}
                style={{ ...chip, minWidth: 104, ...(world?.live ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "transparent" } : {}) }}>
                {world?.live ? "● Live" : "○ Off"}
              </button>
            </div>

            {/* Batches */}
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", margin: "26px 0 4px" }}>Country batches</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.55 }}>
              Grouped by how likely people there are to pay for AI image editing, top payers first. Turn a batch on, watch &ldquo;Which countries buy&rdquo; below, then open the next one.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 16 }}>
              {TRIAL_BATCHES.map((b) => {
                const live = b.countries.filter((c) => ruleOf(c)?.live).length;
                const all = live === b.countries.length;
                const credits = batchCredits[b.id] ?? b.credits;
                return (
                  <div key={b.id} style={{ ...card, marginBottom: 0, display: "flex", flexDirection: "column", gap: 10, ...(all ? { borderColor: "var(--success)" } : {}) }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{b.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: live ? "var(--success)" : "var(--text-faint)", whiteSpace: "nowrap" }}>{live}/{b.countries.length} live</div>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 4, lineHeight: 1.5 }}>{b.why}</div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {b.countries.map((c) => {
                        const r = ruleOf(c);
                        return (
                          <span key={c} title={`${names(c)}: ${r ? (r.live ? `live, ${r.credits} credits` : "listed, stopped") : "not listed"}`}
                            style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 7px", borderRadius: 999, border: "1px solid var(--border)",
                              ...(r?.live ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "transparent" } : r ? { color: "var(--text-muted)" } : { color: "var(--text-faint)", opacity: 0.7 }) }}>
                            {c}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                      <input type="number" min={1} max={100} value={credits}
                        onChange={(e) => setBatchCredits((d) => ({ ...d, [b.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))}
                        style={{ ...input, width: 64, padding: "7px 9px" }} aria-label={`Credits for ${b.name}`} title="Credits for countries this adds. Listed countries keep their own." />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>credits</span>
                      <span style={{ flex: 1 }} />
                      {!all && (
                        <button style={{ ...chip, ...on }} disabled={busy}
                          onClick={() => act(() => call("POST", { action: "batch", countries: b.countries, credits, live: true }), `${b.name} is live in ${b.countries.length} countries.`)}>
                          ▶ Go live
                        </button>
                      )}
                      {live > 0 && (
                        <button style={chip} disabled={busy}
                          onClick={() => act(() => call("POST", { action: "batch", countries: b.countries, live: false }), `${b.name} stopped.`)}>
                          ■ Stop
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Countries */}
            <div style={{ ...card, padding: 0 }}>
              {rules.length === 0 && <div style={{ padding: 18, fontSize: 14, color: "var(--text-muted)" }}>No countries yet. Add one below.</div>}
              {rules.map((r) => {
                const credits = drafts[r.country] ?? r.credits;
                const changed = credits !== r.credits;
                const st = data.stats?.[r.country];
                return (
                  <div key={r.country} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 800 }}>{names(r.country)} <span style={{ color: "var(--text-faint)", fontWeight: 600, fontSize: 12.5 }}>{r.country}</span></div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", background: "var(--surface-2)", flexWrap: "wrap", borderRadius: rules.length ? "0 0 16px 16px" : 16 }}>
                <div style={{ position: "relative", flex: "1 1 220px" }}>
                  <input
                    value={newCountry ? names(newCountry) : query}
                    onChange={(e) => { setNewCountry(""); setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) { e.preventDefault(); setNewCountry(matches[0]); setQuery(""); setOpen(false); } }}
                    placeholder="🔍 Search a country…"
                    style={{ ...input, width: "100%" }}
                    aria-label="Search a country"
                  />
                  {open && !newCountry && (
                    <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 20, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, boxShadow: "var(--shadow-lg)", maxHeight: 260, overflowY: "auto" }}>
                      {matches.length === 0 && <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-muted)" }}>No country matches “{query}”.</div>}
                      {matches.map((c) => (
                        <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setNewCountry(c); setQuery(""); setOpen(false); }}
                          style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "9px 12px", background: "none", border: "none", color: "var(--text)", fontSize: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                          <span style={{ flex: 1 }}>{names(c)}</span><span style={{ color: "var(--text-faint)", fontSize: 12 }}>{c}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" min={1} max={100} value={newCredits} onChange={(e) => setNewCredits(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  style={{ ...input, width: 74, padding: "10px" }} aria-label="Credits" />
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>credits</span>
                <button style={{ ...chip, ...on }} disabled={busy || !newCountry}
                  onClick={() => { void save(newCountry, newCredits, true, `${names(newCountry)} is live with ${newCredits} credits.`); setNewCountry(""); setQuery(""); }}>
                  Add &amp; go live
                </button>
                <button style={chip} disabled={busy || !newCountry}
                  onClick={() => { void save(newCountry, newCredits, false, `${names(newCountry)} added (stopped).`); setNewCountry(""); setQuery(""); }}>
                  Add stopped
                </button>
              </div>
            </div>

            {/* Which countries buy */}
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 4 }}>📊 Which countries buy</div>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 12, lineHeight: 1.55 }}>
                Accounts and purchases by country, most revenue first. <strong>Converts</strong> = paying accounts ÷ accounts. <strong>Trial → paid</strong> = trial users who later bought.
                {ins?.since ? ` Signup countries recorded since ${new Date(ins.since).toLocaleDateString()}; older purchases count for the buyer's trial country, or "Unknown".` : " Signup and purchase countries are recorded from now on; older purchases count for the buyer's trial country, or \"Unknown\"."}
              </div>
              {ins?.needsSetup && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                  Country tracking needs a one-time database update.
                  <button style={primary} disabled={busy} onClick={() => act(async () => (await fetch(`/api/admin/migrate?token=${encodeURIComponent(token.trim())}&apply=1`)).json(), "Database updated. Countries are now recorded on every signup and purchase.")}>Update database</button>
                </div>
              )}
              {ins?.error && <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>{ins.error}</div>}
              {ins?.totals && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                  {ins.totals.purchases} purchases · ₹{ins.totals.revenueInr.toLocaleString("en-IN")} · {ins.totals.accountsWithCountry} accounts with a known country
                </div>
              )}
              {!ins?.rows?.length ? (
                <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>No data yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                    <thead>
                      <tr style={{ color: "var(--text-faint)", textAlign: "right" }}>
                        {["Country", "Accounts", "Trials", "Buyers", "Converts", "Trial → paid", "Revenue", ""].map((h, i) => (
                          <th key={h + i} style={{ padding: "6px 8px", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: i === 0 ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ins.rows.map((r) => {
                        const known = r.country !== "??";
                        const rule = known ? ruleOf(r.country) : undefined;
                        const bi = known ? batchOf(r.country) : -1;
                        const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—");
                        return (
                          <tr key={r.country} style={{ borderTop: "1px solid var(--border)", textAlign: "right" }}>
                            <td style={{ padding: "8px", textAlign: "left", whiteSpace: "nowrap" }}>
                              <strong>{known ? names(r.country) : "Unknown"}</strong>
                              {known && <span style={{ color: "var(--text-faint)", fontSize: 11.5 }}> {r.country}{bi >= 0 ? ` · B${bi + 1}` : ""}</span>}
                            </td>
                            <td style={{ padding: "8px" }}>{r.signups}</td>
                            <td style={{ padding: "8px" }}>{r.trials}</td>
                            <td style={{ padding: "8px", fontWeight: r.buyers ? 800 : 400 }}>{r.buyers}</td>
                            <td style={{ padding: "8px" }}>{pct(r.buyers, r.signups)}</td>
                            <td style={{ padding: "8px" }}>{pct(r.trialBuyers, r.trials)}</td>
                            <td style={{ padding: "8px", fontWeight: 700 }}>₹{r.revenueInr.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "8px" }}>
                              {known && !rule?.live && (
                                <button style={{ ...chip, padding: "4px 9px", fontSize: 12 }} disabled={busy}
                                  onClick={() => save(r.country, rule?.credits ?? 2, true, `${names(r.country)} is live with ${rule?.credits ?? 2} credits.`)}>
                                  + Trial
                                </button>
                              )}
                              {rule?.live && <span style={{ fontSize: 12, color: "var(--success)" }}>● trial</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Setup problems that would stop every grant */}
            {!!data.warnings?.length && (
              <div style={{ ...card, borderColor: "var(--danger)" }}>
                <div style={{ fontWeight: 800, color: "var(--danger)", marginBottom: 6 }}>Trials can't be given right now</div>
                {data.warnings.map((w, i) => <div key={i} style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>• {w}</div>)}
              </div>
            )}

            {/* Why each new sign-up did or didn't get a trial */}
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 4 }}>Recent sign-up checks</div>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 10 }}>Every new account is checked once when it signs in. This shows the result, so a missing trial always has a reason.</div>
              {!data.log?.length && <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>No new sign-ups checked yet. Sign up with a brand-new account to test.</div>}
              {data.log?.map((l, i) => {
                const [label, color] = WHY[l.why] ?? [l.why, "var(--text-muted)"];
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 13, padding: "7px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                    <span><strong style={{ color }}>{label}</strong> · {l.email} · {l.country === "?" ? "country unknown" : names(l.country)}{l.detail ? <span style={{ color: "var(--text-faint)" }}> · {l.detail}</span> : null}</span>
                    <span style={{ color: "var(--text-faint)" }}>{new Date(l.at).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            {/* Recent */}
            {!!data.recent?.length && (
              <div style={card}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 10 }}>Latest trials given</div>
                {data.recent.map((g, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "6px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                    <span>{names(g.country)} · {g.email ?? "—"}</span>
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

const WHY: Record<string, [string, string]> = {
  granted: ["✓ Trial given", "var(--success)"],
  "no-live-rule": ["No live trial for this country", "var(--text-muted)"],
  "already-claimed": ["Already had a trial", "var(--text-muted)"],
  "no-country": ["Country not detected", "var(--danger)"],
  "email-unconfirmed": ["Email not confirmed yet", "var(--text-muted)"],
  "no-email": ["Account has no email", "var(--text-muted)"],
  error: ["Failed", "var(--danger)"],
};

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, marginBottom: 16 };
const on: React.CSSProperties = { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent-strong)" };
