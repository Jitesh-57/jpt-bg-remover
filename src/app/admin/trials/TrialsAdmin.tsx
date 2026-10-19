"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { label, input, chip, primary, danger } from "../creatives/AdminShell";
import { TRIAL_BATCHES, WORLDWIDE } from "@/lib/trial-batches";

/**
 * /admin/trials — country free trials.
 *
 * Add a country, set how many credits a new signup there gets, and switch it
 * live. Changes apply to the very next signup; nothing is cached. "Stop all"
 * switches every country off in one click, "Start all" every listed one on.
 *
 * A sticky bar picks the period (today, yesterday, the last 2 / 7 / 30 days,
 * all time, or any dates on the calendar) and every dated number follows it.
 * Each section folds down to its header, which keeps a one-line summary, and
 * the choice is remembered; long lists scroll inside their own box. So the
 * page stays about a screen long however much data there is.
 */

interface Rule { country: string; credits: number; live: boolean; updated_at: string }
type Counts = Record<string, { users: number; credits: number }>;
interface LogLine { at: string; why: string; country: string; email: string; credits?: number; detail?: string; rule?: "own" | "worldwide"; since?: string }
interface Payload {
  rules?: Rule[];
  worldwide?: Rule | null;
  stats?: Counts;
  periodStats?: Counts;
  recent?: { country: string; email: string | null; credits: number; granted_at: string }[];
  recentTotal?: number;
  log?: LogLine[];
  logOldest?: string | null;
  logFull?: boolean;
  logKeep?: number;
  warnings?: string[];
  needsSetup?: boolean;
  error?: string;
  fix?: string;
}

interface InsightRow { country: string; signups: number; signupsPaid: number; trials: number; trialsPaid: number; buyers: number; purchases: number; revenueInr: number }
interface Day { accounts: number; trials: number; purchases: number; revenueInr: number }
interface Insights {
  rows?: InsightRow[];
  since?: string | null;
  daily?: Record<string, Day>;
  totals?: { accountsWithCountry: number; accountsPaid: number; trials: number; trialsPaid: number; buyers: number; purchases: number; revenueInr: number };
  needsSetup?: boolean;
  error?: string;
}

const batchOf = (c: string) => TRIAL_BATCHES.findIndex((b) => b.countries.includes(c));

// ISO 3166-1 alpha-2. Names come from the browser (Intl.DisplayNames).
const CODES = "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW".split(" ");

/* ── The period ───────────────────────────────────────────────────────────── */

type Preset = "today" | "yesterday" | "2d" | "7d" | "30d" | "all" | "custom";
/** A custom period is two local calendar days, both included. */
interface Period { preset: Preset; from?: string; to?: string }

const PRESETS: [Preset, string][] = [
  ["today", "Today"], ["yesterday", "Yesterday"], ["2d", "Last 2 days"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["all", "All time"],
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromYmd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const midnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/** The period as [from, to) in the admin's own time zone; an open end is undefined. */
function bounds(p: Period): { from?: Date; to?: Date } {
  const t = midnight();
  switch (p.preset) {
    case "today": return { from: t };
    case "yesterday": return { from: addDays(t, -1), to: t };
    case "2d": return { from: addDays(t, -1) };
    case "7d": return { from: addDays(t, -6) };
    case "30d": return { from: addDays(t, -29) };
    case "custom": return p.from ? { from: fromYmd(p.from), to: addDays(fromYmd(p.to || p.from), 1) } : {};
    default: return {};
  }
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) });
}

/** "13 Oct – 19 Oct", or one day; "" for all time. */
function spanLabel(p: Period): string {
  const { from, to } = bounds(p);
  if (!from) return "";
  const last = to ? addDays(to, -1) : midnight();
  return ymd(from) === ymd(last) ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(last)}`;
}

/* ── Sections ─────────────────────────────────────────────────────────────── */

const SECTIONS = [
  ["overview", "Overview"],
  ["countries", "Countries"],
  ["batches", "Batches"],
  ["buy", "Who buys"],
  ["checks", "Sign-up checks"],
  ["given", "Trials given"],
  ["worldwide", "Worldwide"],
] as const;
type SectionId = (typeof SECTIONS)[number][0];

// Worldwide must stay off, so it starts folded away.
const FOLDED_AT_FIRST: Partial<Record<SectionId, boolean>> = { worldwide: true };

const PERIOD_KEY = "jpt-admin-trials-period";
const FOLD_KEY = "jpt-admin-trials-folded";

function readStored<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function store(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private window */ }
}

export default function TrialsAdmin() {
  const [tokenDraft, setTokenDraft] = useState("");
  const [token, setToken] = useState("");
  const [editToken, setEditToken] = useState(false);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [ins, setIns] = useState<Insights | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [period, setPeriod] = useState<Period>({ preset: "30d" });
  const [calOpen, setCalOpen] = useState(false);
  const [folded, setFolded] = useState<Partial<Record<SectionId, boolean>>>(FOLDED_AT_FIRST);
  const presetRow = useRef<HTMLDivElement>(null);

  const [newCountry, setNewCountry] = useState("");
  const [newCredits, setNewCredits] = useState(2);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [worldCredits, setWorldCredits] = useState<number | null>(null);
  const [batchCredits, setBatchCredits] = useState<Record<string, number>>({});

  const [ruleFilter, setRuleFilter] = useState("");
  const [ruleShow, setRuleShow] = useState<"all" | "live" | "stopped">("all");
  const [ruleSort, setRuleSort] = useState<"name" | "trials">("name");
  const [buySort, setBuySort] = useState<keyof InsightRow | "convert" | "trialPaid">("revenueInr");
  const [buyersOnly, setBuyersOnly] = useState(false);
  const [checkShow, setCheckShow] = useState<"all" | "given" | "not" | "problem">("all");
  const [checkFilter, setCheckFilter] = useState("");

  const names = useMemo(() => {
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      return (c: string) => dn.of(c) || c;
    } catch {
      return (c: string) => c;
    }
  }, []);

  // Everything remembered is read once, before the first load, so a saved period doesn't load twice.
  useEffect(() => {
    try { const t = localStorage.getItem("jpt-admin-token"); if (t) { setToken(t); setTokenDraft(t); } } catch {}
    const p = readStored<Period>(PERIOD_KEY);
    const day = /^\d{4}-\d{2}-\d{2}$/;
    if (p && (PRESETS.some(([k]) => k === p.preset) || (p.preset === "custom" && day.test(p.from ?? "") && day.test(p.to ?? p.from ?? "")))) setPeriod(p);
    const f = readStored<Partial<Record<SectionId, boolean>>>(FOLD_KEY);
    if (f) setFolded({ ...FOLDED_AT_FIRST, ...f });
    setReady(true);
  }, []);

  useEffect(() => { if (ready) store(PERIOD_KEY, period); }, [ready, period]);
  // On a phone the period chips scroll sideways; keep the chosen one in view.
  useEffect(() => {
    const row = presetRow.current;
    const el = row?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (row && el) row.scrollLeft = Math.max(0, el.offsetLeft - row.offsetLeft - (row.clientWidth - el.offsetWidth) / 2);
  }, [period, data]);
  useEffect(() => { if (ready) store(FOLD_KEY, folded); }, [ready, folded]);

  // A saved change says so for a few seconds; a failure stays until the next action.
  useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

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
    // Worked out on every load, so "Today" moves on at midnight with a reload.
    const { from, to } = bounds(period);
    const range = `${from ? `&from=${encodeURIComponent(from.toISOString())}` : ""}${to ? `&to=${encodeURIComponent(to.toISOString())}` : ""}&tzo=${new Date().getTimezoneOffset()}`;
    setBusy(true);
    try {
      const [d, i] = await Promise.all([call("GET", undefined, range), call("GET", undefined, `&view=insights${range}`) as Promise<Insights>]);
      setData(d);
      setIns(i);
      setDrafts({});
      setWorldCredits(null);
    } finally { setBusy(false); }
  }, [call, token, period]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

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

  const migrate = (done: string) => act(async () => {
    const r = await fetch(`/api/admin/migrate?token=${encodeURIComponent(token.trim())}&apply=1`);
    return r.json();
  }, done);

  const applyToken = () => {
    try { localStorage.setItem("jpt-admin-token", tokenDraft.trim()); } catch {}
    setEditToken(false);
    if (tokenDraft.trim() === token.trim()) void load();
    else setToken(tokenDraft.trim());
  };

  const fold = (id: SectionId) => setFolded((f) => ({ ...f, [id]: !f[id] }));
  const allFolded = SECTIONS.every(([id]) => folded[id]);
  const foldAll = (v: boolean) => setFolded(Object.fromEntries(SECTIONS.map(([id]) => [id, v])));
  const jump = (id: SectionId) => {
    setFolded((f) => ({ ...f, [id]: false }));
    requestAnimationFrame(() => document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

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

  const allTime = period.preset === "all";
  // Reads after a count: "3 trials today", "… in the last 7 days", "… on 12 Oct".
  const inPeriod = allTime ? "all time"
    : period.preset === "today" || period.preset === "yesterday" ? period.preset
    : period.preset === "custom" ? `${period.to && period.to !== period.from ? "in" : "on"} ${spanLabel(period)}`
    : `in the ${(PRESETS.find(([k]) => k === period.preset)?.[1] ?? "").toLowerCase()}`;

  // Countries: filter, then sort.
  const rf = ruleFilter.trim().toLowerCase();
  const shownRules = rules
    .filter((r) => ruleShow === "all" || (ruleShow === "live") === r.live)
    .filter((r) => !rf || names(r.country).toLowerCase().includes(rf) || r.country.toLowerCase() === rf)
    .sort((a, b) => ruleSort === "trials"
      ? (data?.periodStats?.[b.country]?.users ?? 0) - (data?.periodStats?.[a.country]?.users ?? 0) || names(a.country).localeCompare(names(b.country))
      : names(a.country).localeCompare(names(b.country)));

  // Who buys: sortable, optionally only countries that paid.
  const rate = (a: number, b: number) => (b ? a / b : -1);
  const buyRows = (ins?.rows ?? [])
    .filter((r) => !buyersOnly || r.buyers > 0)
    .slice()
    .sort((a, b) => {
      const v = (r: InsightRow) => buySort === "convert" ? rate(r.signupsPaid, r.signups) : buySort === "trialPaid" ? rate(r.trialsPaid, r.trials) : buySort === "country" ? 0 : (r[buySort] as number);
      return buySort === "country" ? names(a.country).localeCompare(names(b.country)) : v(b) - v(a) || b.revenueInr - a.revenueInr || b.signups - a.signups;
    });

  // Sign-up checks: by outcome and by text.
  const PROBLEM = new Set(["no-country", "error"]);
  const log = data?.log ?? [];
  const cf = checkFilter.trim().toLowerCase();
  const checkCounts = {
    all: log.length,
    given: log.filter((l) => l.why === "granted").length,
    not: log.filter((l) => l.why !== "granted").length,
    problem: log.filter((l) => PROBLEM.has(l.why)).length,
  };
  const shownLog = log
    .filter((l) => checkShow === "all" || (checkShow === "given" ? l.why === "granted" : checkShow === "not" ? l.why !== "granted" : PROBLEM.has(l.why)))
    .filter((l) => !cf || l.email.toLowerCase().includes(cf) || names(l.country).toLowerCase().includes(cf) || l.country.toLowerCase() === cf);
  const { from: periodFrom } = bounds(period);
  const logShort = !!data?.logFull && !!data.logOldest && (!periodFrom || Date.parse(data.logOldest) > periodFrom.getTime());

  const recent = data?.recent ?? [];
  const recentCredits = recent.reduce((n, g) => n + g.credits, 0);
  const t = ins?.totals;

  const summary: Record<SectionId, string> = {
    overview: t ? `${t.accountsWithCountry} new accounts · ${t.trials} trials · ${t.buyers} buyers · ₹${t.revenueInr.toLocaleString("en-IN")}` : "",
    countries: `${liveCount} live · ${stoppedCount} stopped`,
    batches: TRIAL_BATCHES.map((b, i) => `B${i + 1} ${b.countries.filter((c) => ruleOf(c)?.live).length}/${b.countries.length}`).join(" · "),
    buy: t ? `₹${t.revenueInr.toLocaleString("en-IN")} from ${t.buyers} ${t.buyers === 1 ? "buyer" : "buyers"} · ${(ins?.rows ?? []).filter((r) => r.buyers).length} paying countries` : "",
    checks: `${checkCounts.all} checked · ${checkCounts.given} given${checkCounts.problem ? ` · ${checkCounts.problem} ${checkCounts.problem === 1 ? "problem" : "problems"}` : ""}`,
    given: `${data?.recentTotal ?? recent.length} trials · ${recentCredits} credits`,
    worldwide: world?.live ? `● Live · ${world.credits} credits for every unlisted country` : "○ Off",
  };
  const badge: Partial<Record<SectionId, number>> = {
    countries: liveCount,
    checks: checkCounts.all,
    given: data?.recentTotal ?? recent.length,
  };

  const loaded = !!data && !data.needsSetup && !data.error;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "22px 16px 90px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "6px 0 4px" }}>🎁 Free trials by country</h1>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, margin: 0, maxWidth: 640 }}>
              A <strong>new account</strong> from a <strong>live</strong> country gets these credits once per email address. Existing users never do. Changes apply to the next signup.
            </p>
          </div>
          {token && !editToken && loaded && (
            <button onClick={() => setEditToken(true)} style={{ ...chip, fontSize: 12, padding: "6px 11px", color: "var(--text-muted)" }}>🔑 Token saved · Change</button>
          )}
        </div>

        {(!token || editToken || !loaded) && (
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Admin token</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="password" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") applyToken(); }}
                placeholder="ADMIN_IMAGE_TOKEN" style={input} />
              <button style={chip} onClick={applyToken}>Load</button>
            </div>
          </div>
        )}

        {data?.needsSetup && (
          <div style={{ ...card, borderColor: "var(--accent-border)", padding: 18 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>One-time setup needed</div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 14 }}>
              The free-trial tables aren&apos;t in the database yet. This creates them and turns on the USA trial (2 credits).
            </div>
            <button style={primary} disabled={busy} onClick={() => migrate("Database set up. The USA trial (2 credits) is live.")}>Set up database</button>
          </div>
        )}

        {data?.error && !data.needsSetup && <div style={{ ...danger, marginTop: 0, marginBottom: 16 }}>{data.error}{data.fix ? ` ${data.fix}` : ""}</div>}

        {loaded && (
          <>
            {/* The period, and a way to every section, always in reach. */}
            <div style={{ position: "sticky", top: 56, zIndex: 30, background: "var(--bg)", margin: "0 -16px 14px", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                <div ref={presetRow} style={{ display: "flex", gap: 6, overflowX: "auto", flex: "1 1 auto", minWidth: 0, scrollbarWidth: "none" }}>
                  {PRESETS.map(([k, name]) => (
                    <button key={k} onClick={() => { setPeriod({ preset: k }); setCalOpen(false); }} aria-pressed={period.preset === k}
                      style={{ ...pill, ...(period.preset === k ? on : {}) }}>
                      {name}
                    </button>
                  ))}
                  <button onClick={() => setCalOpen((v) => !v)} aria-expanded={calOpen} aria-pressed={period.preset === "custom"}
                    style={{ ...pill, ...(period.preset === "custom" || calOpen ? on : {}) }}>
                    📅 {period.preset === "custom" ? spanLabel(period) : "Pick dates"}
                  </button>
                </div>
                <button onClick={() => void load()} disabled={busy} title="Reload" aria-label="Reload" style={{ ...pill, flexShrink: 0, minWidth: 36 }}>
                  <span style={{ display: "inline-block", animation: busy ? "jpt-spin 0.9s linear infinite" : "none" }}>↻</span>
                </button>
                {calOpen && (
                  <Calendar from={period.preset === "custom" ? period.from : undefined} to={period.preset === "custom" ? period.to : undefined}
                    onClose={() => setCalOpen(false)}
                    onPick={(from, to) => { setPeriod({ preset: "custom", from, to }); setCalOpen(false); }} />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, overflowX: "auto", flex: "1 1 auto", minWidth: 0, scrollbarWidth: "none" }}>
                  {SECTIONS.map(([id, name]) => (
                    <button key={id} onClick={() => jump(id)}
                      style={{ ...pill, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: folded[id] ? "var(--text-faint)" : "var(--text-muted)", background: "transparent" }}>
                      {name}{badge[id] !== undefined ? <span style={{ marginLeft: 5, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{badge[id]}</span> : null}
                    </button>
                  ))}
                </div>
                <button onClick={() => foldAll(!allFolded)} style={{ ...pill, padding: "4px 10px", fontSize: 12, flexShrink: 0 }}>
                  {allFolded ? "▾ Open all" : "▴ Fold all"}
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
                {allTime ? "Showing all time" : `Showing ${spanLabel(period)}`}{busy ? " · loading…" : ""}
              </div>
            </div>

            {/* Master status */}
            <div style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: "1 1 300px" }}>
                <div style={{ fontSize: 16.5, fontWeight: 900, color: liveCount || world?.live ? "var(--success)" : "var(--text-muted)" }}>
                  {world?.live
                    ? `● Live worldwide${liveCount ? ` · ${liveCount} listed` : ""}`
                    : liveCount ? `● Live in ${liveCount} ${liveCount === 1 ? "country" : "countries"}` : "○ All trials stopped"}
                </div>
                {/* Named, so a country switched on by mistake can't hide behind a count. */}
                {liveCount > 0 && (
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5, maxHeight: 57, overflowY: "auto" }}>
                    {rules.filter((r) => r.live).map((r) => names(r.country)).sort().join(", ")}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {stoppedCount > 0 && (
                  <button disabled={busy} onClick={() => {
                    // Every stopped country comes back on, including ones stopped on purpose — so name them first.
                    const stopped = rules.filter((r) => !r.live).map((r) => names(r.country)).sort();
                    if (confirm(`This switches free trials on in ${stopped.length} ${stopped.length === 1 ? "country" : "countries"}:\n\n${stopped.join(", ")}\n\nContinue?`)) {
                      void act(() => call("POST", { action: "start-all" }), `All ${rules.length} listed countries are live.`);
                    }
                  }}
                    style={{ ...chip, background: "var(--success)", color: "#fff", border: "none", padding: "10px 16px" }}>
                    ▶ Start all listed ({stoppedCount})
                  </button>
                )}
                {(liveCount > 0 || world?.live) && (
                  <button disabled={busy} onClick={() => act(() => call("POST", { action: "stop-all" }), "Every trial stopped, worldwide included.")}
                    style={{ ...chip, background: "var(--danger)", color: "#fff", border: "none", padding: "10px 16px" }}>
                    ■ Stop all trials now
                  </button>
                )}
              </div>
            </div>

            {/* Setup problems that would stop every grant */}
            {!!data.warnings?.length && (
              <div style={{ ...card, padding: 16, borderColor: "var(--danger)" }}>
                <div style={{ fontWeight: 800, color: "var(--danger)", marginBottom: 6 }}>Trials can&apos;t be given right now</div>
                {data.warnings.map((w, i) => <div key={i} style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>• {w}</div>)}
              </div>
            )}

            {/* Overview */}
            <Section id="overview" title="📈 Overview" summary={summary.overview} folded={!!folded.overview} onFold={fold}>
              {ins?.error && <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>{ins.error}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                <Kpi name="New accounts" value={t?.accountsWithCountry ?? 0} note={t ? `${t.accountsPaid} have bought` : ""} />
                <Kpi name="Trials given" value={t?.trials ?? 0} note={t ? `${recentCredits} credits` : ""} />
                <Kpi name="Trial → paid" value={t?.trials ? `${Math.round((100 * t.trialsPaid) / t.trials)}%` : "—"} note={t ? `${t.trialsPaid} of ${t.trials} trial users` : ""} />
                <Kpi name="Buyers" value={t?.buyers ?? 0} note={t ? `${t.purchases} ${t.purchases === 1 ? "purchase" : "purchases"}` : ""} />
                <Kpi name="Revenue" value={`₹${(t?.revenueInr ?? 0).toLocaleString("en-IN")}`} note={t?.buyers ? `₹${Math.round(t.revenueInr / t.buyers).toLocaleString("en-IN")} per buyer` : ""} strong />
              </div>
              <DailyChart daily={ins?.daily ?? {}} period={period} />
            </Section>

            {/* Countries */}
            <Section id="countries" title="🗺️ Countries" summary={summary.countries} folded={!!folded.countries} onFold={fold}>
              {/* Add — first, so it never needs a scroll to the bottom of a long list. */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: "var(--surface-2)", flexWrap: "wrap", borderRadius: 12, marginBottom: 12 }}>
                <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
                  <input
                    value={newCountry ? names(newCountry) : query}
                    onChange={(e) => { setNewCountry(""); setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) { e.preventDefault(); setNewCountry(matches[0]); setQuery(""); setOpen(false); } }}
                    placeholder="➕ Add a country…"
                    style={{ ...input, width: "100%", padding: "9px 12px" }}
                    aria-label="Search a country to add"
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
                  style={{ ...input, width: 70, padding: "9px 10px" }} aria-label="Credits" />
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

              {rules.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <input value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value)} placeholder="🔍 Find a listed country" aria-label="Find a listed country"
                    style={{ ...input, flex: "1 1 180px", width: "auto", minWidth: 0, padding: "7px 11px", fontSize: 13 }} />
                  {([["all", `All ${rules.length}`], ["live", `Live ${liveCount}`], ["stopped", `Stopped ${stoppedCount}`]] as const).map(([k, n]) => (
                    <button key={k} onClick={() => setRuleShow(k)} style={{ ...pill, ...(ruleShow === k ? on : {}) }}>{n}</button>
                  ))}
                  <button onClick={() => setRuleSort((s) => (s === "name" ? "trials" : "name"))} style={pill} title="Change the order">
                    ⇅ {ruleSort === "name" ? "A–Z" : "Most trials"}
                  </button>
                </div>
              )}

              <div style={{ ...scrollBox, maxHeight: 420 }}>
                {rules.length === 0 && <div style={{ padding: 16, fontSize: 14, color: "var(--text-muted)" }}>No countries yet. Add one above.</div>}
                {rules.length > 0 && shownRules.length === 0 && <div style={{ padding: 16, fontSize: 13.5, color: "var(--text-muted)" }}>No listed country matches.</div>}
                {shownRules.map((r, i) => {
                  const credits = drafts[r.country] ?? r.credits;
                  const changed = credits !== r.credits;
                  const st = data.stats?.[r.country];
                  const ps = data.periodStats?.[r.country];
                  return (
                    <div key={r.country} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: i ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 800 }}>{names(r.country)} <span style={{ color: "var(--text-faint)", fontWeight: 600, fontSize: 12 }}>{r.country}</span></div>
                        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                          {allTime
                            ? (st ? `${st.users} ${st.users === 1 ? "trial" : "trials"} · ${st.credits} credits given` : "No trials given yet")
                            : `${ps?.users ?? 0} ${ps?.users === 1 ? "trial" : "trials"} ${inPeriod} · ${st?.users ?? 0} all time`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="number" min={1} max={100} value={credits}
                          onChange={(e) => setDrafts((d) => ({ ...d, [r.country]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))}
                          style={{ ...input, width: 66, padding: "6px 9px" }} aria-label={`Credits for ${names(r.country)}`} />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>credits</span>
                        {changed && <button style={{ ...chip, ...on }} disabled={busy} onClick={() => save(r.country, credits, r.live, `${names(r.country)}: ${credits} credits saved.`)}>Save</button>}
                      </div>
                      <button disabled={busy} onClick={() => save(r.country, credits, !r.live, `${names(r.country)} ${r.live ? "stopped" : "is live"}.`)}
                        style={{ ...chip, minWidth: 96, padding: "6px 12px", ...(r.live ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "transparent" } : {}) }}>
                        {r.live ? "● Live" : "○ Stopped"}
                      </button>
                      <button disabled={busy} title="Remove" aria-label={`Remove ${names(r.country)}`} onClick={() => { if (confirm(`Remove ${names(r.country)}?`)) void act(() => call("DELETE", undefined, `&country=${r.country}`), `${names(r.country)} removed.`); }}
                        style={{ ...chip, padding: "6px 10px", color: "var(--text-faint)" }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Batches */}
            <Section id="batches" title="🧩 Country batches" summary={summary.batches} folded={!!folded.batches} onFold={fold}>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.55 }}>
                Grouped by how likely people there are to pay for AI image editing, top payers first. Turn a batch on, watch &ldquo;Who buys&rdquo;, then open the next one.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(1040 / TRIAL_BATCHES.length) - 10}px), 1fr))`, gap: 10 }}>
                {TRIAL_BATCHES.map((b) => {
                  const live = b.countries.filter((c) => ruleOf(c)?.live).length;
                  const all = live === b.countries.length;
                  const credits = batchCredits[b.id] ?? b.credits;
                  return (
                    <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, ...(all ? { borderColor: "var(--success)" } : {}) }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{b.name}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: live ? "var(--success)" : "var(--text-faint)", whiteSpace: "nowrap" }}>{live}/{b.countries.length} live</div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.45 }}>{b.why}</div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {b.countries.map((c) => {
                          const r = ruleOf(c);
                          return (
                            <span key={c} title={`${names(c)}: ${r ? (r.live ? `live, ${r.credits} credits` : "listed, stopped") : "not listed"}`}
                              style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 999, border: "1px solid var(--border)",
                                ...(r?.live ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "transparent" } : r ? { color: "var(--text-muted)" } : { color: "var(--text-faint)", opacity: 0.7 }) }}>
                              {c}
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                        <input type="number" min={1} max={100} value={credits}
                          onChange={(e) => setBatchCredits((d) => ({ ...d, [b.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))}
                          style={{ ...input, width: 60, padding: "6px 8px" }} aria-label={`Credits for ${b.name}`} title="Credits for countries this adds. Listed countries keep their own." />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>credits</span>
                        <span style={{ flex: 1 }} />
                        {!all && (
                          <button style={{ ...chip, ...on, padding: "6px 11px" }} disabled={busy}
                            onClick={() => act(() => call("POST", { action: "batch", countries: b.countries, credits, live: true }), `${b.name} is live in ${b.countries.length} countries.`)}>
                            ▶ Go live
                          </button>
                        )}
                        {live > 0 && (
                          <button style={{ ...chip, padding: "6px 11px" }} disabled={busy}
                            onClick={() => act(() => call("POST", { action: "batch", countries: b.countries, live: false }), `${b.name} stopped.`)}>
                            ■ Stop
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Who buys */}
            <Section id="buy" title="📊 Which countries buy" summary={summary.buy} folded={!!folded.buy} onFold={fold}>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 10, lineHeight: 1.55 }}>
                Accounts, buyers and revenue {inPeriod}. <strong>Converts</strong> = those new accounts that have bought since. <strong>Trial → paid</strong> = those trial users that have bought since. Tap a heading to sort.
                {ins?.since ? ` Signup countries are recorded since ${new Date(ins.since).toLocaleDateString()}; older purchases count for the buyer's trial country, or "Unknown".` : ""}
              </div>
              {ins?.needsSetup && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                  Country tracking needs a one-time database update.
                  <button style={primary} disabled={busy} onClick={() => migrate("Database updated. Countries are now recorded on every signup and purchase.")}>Update database</button>
                </div>
              )}
              {!!ins?.rows?.length && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <button onClick={() => setBuyersOnly((v) => !v)} aria-pressed={buyersOnly} style={{ ...pill, ...(buyersOnly ? on : {}) }}>
                    {buyersOnly ? "✓ " : ""}Only countries that paid
                  </button>
                </div>
              )}
              {!buyRows.length ? (
                <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{ins?.rows?.length ? "No purchases in this period." : `No data ${inPeriod}.`}</div>
              ) : (
                <div style={{ ...scrollBox, maxHeight: 440 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                    <thead>
                      <tr>
                        {([["country", "Country"], ["signups", "Accounts"], ["trials", "Trials"], ["buyers", "Buyers"], ["convert", "Converts"], ["trialPaid", "Trial → paid"], ["revenueInr", "Revenue"]] as const).map(([k, h], i) => (
                          <th key={k} style={{ position: "sticky", top: 0, background: "var(--surface)", padding: 0, textAlign: i === 0 ? "left" : "right", borderBottom: "1px solid var(--border)", zIndex: 1 }}>
                            <button onClick={() => setBuySort(k)}
                              style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", padding: "8px", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", color: buySort === k ? "var(--accent-strong)" : "var(--text-faint)", textAlign: i === 0 ? "left" : "right" }}>
                              {h}{buySort === k ? " ↓" : ""}
                            </button>
                          </th>
                        ))}
                        <th style={{ position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)", zIndex: 1 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {buyRows.map((r, idx) => {
                        const known = r.country !== "??";
                        const rule = known ? ruleOf(r.country) : undefined;
                        const bi = known ? batchOf(r.country) : -1;
                        const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—");
                        return (
                          <tr key={r.country} style={{ borderTop: idx ? "1px solid var(--border)" : "none", textAlign: "right" }}>
                            <td style={{ padding: "7px 8px", textAlign: "left", whiteSpace: "nowrap" }}>
                              <strong>{known ? names(r.country) : "Unknown"}</strong>
                              {known && <span style={{ color: "var(--text-faint)", fontSize: 11.5 }}> {r.country}{bi >= 0 ? ` · B${bi + 1}` : ""}</span>}
                            </td>
                            <td style={{ padding: "7px 8px" }}>{r.signups}</td>
                            <td style={{ padding: "7px 8px" }}>{r.trials}</td>
                            <td style={{ padding: "7px 8px", fontWeight: r.buyers ? 800 : 400 }}>{r.buyers}</td>
                            <td style={{ padding: "7px 8px" }}>{pct(r.signupsPaid, r.signups)}</td>
                            <td style={{ padding: "7px 8px" }}>{pct(r.trialsPaid, r.trials)}</td>
                            <td style={{ padding: "7px 8px", fontWeight: 700 }}>₹{r.revenueInr.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "7px 8px", whiteSpace: "nowrap" }}>
                              {known && !rule?.live && (
                                <button style={{ ...chip, padding: "3px 9px", fontSize: 12 }} disabled={busy}
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
            </Section>

            {/* Side by side when there's room: why each signup did or didn't get a trial, and who did. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 14, alignItems: "start", marginBottom: 14 }}>
              <Section id="checks" title="🧾 Sign-up checks" summary={summary.checks} folded={!!folded.checks} onFold={fold} flush>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8, lineHeight: 1.5 }}>
                  Every new account is checked once when it signs in, so a missing trial always has a reason.
                  {logShort && data.logOldest ? ` The log keeps the latest ${data.logKeep ?? "few hundred"} checks, so it reaches back to ${when(data.logOldest)}.` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {([["all", "All"], ["given", "✓ Given"], ["not", "Not given"], ["problem", "⚠ Problems"]] as const).map(([k, n]) => (
                    <button key={k} onClick={() => setCheckShow(k)} style={{ ...pill, ...(checkShow === k ? on : {}) }}>
                      {n} <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{checkCounts[k]}</span>
                    </button>
                  ))}
                  <input value={checkFilter} onChange={(e) => setCheckFilter(e.target.value)} placeholder="🔍 Email or country" aria-label="Filter checks by email or country"
                    style={{ ...input, flex: "1 1 140px", width: "auto", minWidth: 0, padding: "6px 10px", fontSize: 12.5 }} />
                </div>
                <div style={{ ...scrollBox, maxHeight: 380 }}>
                  {!shownLog.length && (
                    <div style={{ padding: 14, fontSize: 13.5, color: "var(--text-muted)" }}>
                      {log.length ? "Nothing matches." : `No sign-ups checked ${inPeriod}.`}
                    </div>
                  )}
                  {shownLog.map((l, i) => {
                    const [why, color] = WHY[l.why] ?? [l.why, "var(--text-muted)"];
                    return (
                      <div key={`${l.at}-${i}`} style={{ padding: "8px 12px", fontSize: 12.5, lineHeight: 1.5, borderTop: i ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <strong style={{ color }}>{why}</strong>
                          <span style={{ color: "var(--text-faint)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{when(l.at)}</span>
                        </div>
                        <div style={{ color: "var(--text-muted)", overflowWrap: "anywhere" }}>
                          {l.email} · {l.country === "?" ? "country unknown" : names(l.country)}
                          {l.detail ? <span style={{ color: "var(--text-faint)" }}> · {l.detail}</span> : null}
                          {/* Which switch gave it, so an unexpected trial can be traced to its rule. */}
                          {l.why === "granted" && l.rule && (
                            <span style={{ color: "var(--text-faint)" }}>
                              {" · "}by {l.rule === "worldwide" ? "the Worldwide trial" : `${names(l.country)}'s own trial`}
                              {l.since ? `, last changed ${new Date(l.since).toLocaleString()}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section id="given" title="🎁 Trials given" summary={summary.given} folded={!!folded.given} onFold={fold} flush>
                {(data.recentTotal ?? 0) > recent.length && (
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8 }}>Showing the latest {recent.length} of {data.recentTotal}.</div>
                )}
                <div style={{ ...scrollBox, maxHeight: 440 }}>
                  {!recent.length && <div style={{ padding: 14, fontSize: 13.5, color: "var(--text-muted)" }}>No trials given {inPeriod}.</div>}
                  {recent.map((g, i) => (
                    <div key={`${g.granted_at}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "8px 12px", borderTop: i ? "1px solid var(--border)" : "none" }}>
                      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><strong>{names(g.country)}</strong> <span style={{ color: "var(--text-muted)" }}>· {g.email ?? "—"}</span></span>
                      <span style={{ color: "var(--text-faint)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>+{g.credits} · {when(g.granted_at)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Worldwide */}
            <Section id="worldwide" title="🌍 Worldwide trial" summary={summary.worldwide} folded={!!folded.worldwide} onFold={fold}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 260px", minWidth: 0, fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.5 }}>
                  Gives a trial in <strong>every</strong> country that isn&apos;t listed. A listed country keeps its own setting, so a stopped one stays stopped. Keep this off unless you mean it.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" min={1} max={100} value={wCredits}
                    onChange={(e) => setWorldCredits(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    style={{ ...input, width: 70, padding: "7px 10px" }} aria-label="Worldwide credits" />
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>credits</span>
                  {world && worldCredits !== null && worldCredits !== world.credits && (
                    <button style={{ ...chip, ...on }} disabled={busy} onClick={() => save(WORLDWIDE, wCredits, world.live, `Worldwide: ${wCredits} credits saved.`)}>Save</button>
                  )}
                </div>
                <button disabled={busy}
                  onClick={() => save(WORLDWIDE, wCredits, !world?.live, world?.live ? "Worldwide trial stopped." : `Worldwide trial is live: ${wCredits} credits for every unlisted country.`)}
                  style={{ ...chip, minWidth: 96, ...(world?.live ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "transparent" } : {}) }}>
                  {world?.live ? "● Live" : "○ Off"}
                </button>
              </div>
            </Section>
          </>
        )}

        {busy && !loaded && <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-faint)" }}>Loading…</div>}
      </div>

      {/* Results of an action, where they can be seen without scrolling. */}
      {msg && (
        <div role="status" onClick={() => setMsg(null)}
          style={{ position: "fixed", left: 16, right: 16, bottom: "calc(20px + env(safe-area-inset-bottom, 0px))", zIndex: 60, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto", cursor: "pointer", maxWidth: 560, padding: "11px 16px", borderRadius: 12, fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, boxShadow: "var(--shadow-lg)",
            background: "var(--surface)", border: `1px solid ${msg.ok ? "var(--success)" : "var(--danger)"}`, color: msg.ok ? "var(--success)" : "var(--danger)" }}>
            {msg.ok ? "✓ " : "⚠ "}{msg.text}
          </div>
        </div>
      )}
      <style>{"@keyframes jpt-spin { to { transform: rotate(360deg) } }"}</style>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

/** A section that folds down to its header; the header keeps a one-line summary. */
function Section({ id, title, summary, folded, onFold, flush, children }: {
  id: SectionId; title: string; summary: string; folded: boolean; onFold: (id: SectionId) => void; flush?: boolean; children: React.ReactNode;
}) {
  return (
    <section id={`s-${id}`} style={{ ...card, marginBottom: flush ? 0 : 14, scrollMarginTop: 170 }}>
      <button onClick={() => onFold(id)} aria-expanded={!folded} aria-controls={`b-${id}`}
        style={{ all: "unset", boxSizing: "border-box", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px" }}>
        <span aria-hidden style={{ fontSize: 11, color: "var(--text-faint)", transition: "transform .15s", transform: folded ? "rotate(-90deg)" : "none", width: 10 }}>▼</span>
        <span style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap" }}>{title}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>{summary}</span>
      </button>
      {!folded && <div id={`b-${id}`} style={{ padding: "0 16px 16px" }}>{children}</div>}
    </section>
  );
}

function Kpi({ name, value, note, strong }: { name: string; value: number | string; note?: string; strong?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "11px 13px", minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-faint)" }}>{name}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 3, fontVariantNumeric: "tabular-nums", color: strong ? "var(--accent-strong)" : "var(--text)" }}>
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
      {note && <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>{note}</div>}
    </div>
  );
}

/** New accounts and trials per day, with the days money came in marked. Hidden for a single day. */
function DailyChart({ daily, period }: { daily: Record<string, Day>; period: Period }) {
  const keys = Object.keys(daily).sort();
  const { from, to } = bounds(period);
  const first = from ?? (keys[0] ? fromYmd(keys[0]) : undefined);
  const last = to ? addDays(to, -1) : midnight();
  if (!first) return null;
  const days: string[] = [];
  for (let d = new Date(first); d <= last; d = addDays(d, 1)) days.push(ymd(d));
  const shown = days.slice(-92);
  if (shown.length < 2) return null;
  const empty: Day = { accounts: 0, trials: 0, purchases: 0, revenueInr: 0 };
  const max = Math.max(1, ...shown.map((k) => Math.max(daily[k]?.accounts ?? 0, daily[k]?.trials ?? 0)));
  const tick = (k: string) => dayLabel(fromYmd(k));
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>
        <span><span style={{ ...dot, background: "var(--accent)" }} /> New accounts</span>
        <span><span style={{ ...dot, background: "var(--success)" }} /> Trials</span>
        <span><span style={{ ...dot, background: "var(--text)", borderRadius: 2 }} /> Day with a purchase</span>
        {days.length > shown.length && <span style={{ color: "var(--text-faint)" }}>Last {shown.length} days</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 96, fontSize: 10.5, color: "var(--text-faint)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          <span>{max}</span><span>0</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: 96, display: "flex", alignItems: "flex-end", gap: shown.length > 40 ? 1 : 3, borderBottom: "1px solid var(--border-strong)" }}>
            {shown.map((k) => {
              const d = daily[k] ?? empty;
              return (
                <div key={k} title={`${tick(k)}: ${d.accounts} new ${d.accounts === 1 ? "account" : "accounts"} · ${d.trials} ${d.trials === 1 ? "trial" : "trials"}${d.purchases ? ` · ${d.purchases} ${d.purchases === 1 ? "purchase" : "purchases"} ₹${d.revenueInr.toLocaleString("en-IN")}` : ""}`}
                  style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1 }}>
                  <div style={{ flex: 1, maxWidth: 14, height: `${(100 * d.accounts) / max}%`, background: "var(--accent)", borderRadius: "2px 2px 0 0" }} />
                  <div style={{ flex: 1, maxWidth: 14, height: `${(100 * d.trials) / max}%`, background: "var(--success)", borderRadius: "2px 2px 0 0" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: shown.length > 40 ? 1 : 3, height: 8, marginTop: 3 }}>
            {shown.map((k) => (
              <div key={k} style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
                {daily[k]?.purchases ? <div style={{ width: 6, height: 6, borderRadius: 2, background: "var(--text)" }} /> : null}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--text-faint)", marginTop: 2 }}>
            <span>{tick(shown[0])}</span>
            {shown.length > 6 && <span>{tick(shown[Math.floor(shown.length / 2)])}</span>}
            <span>{tick(shown[shown.length - 1])}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pick one day, or two for a range. Future days can't be picked. Opens on the
 * current choice; the shortcuts cover the periods a preset doesn't.
 */
function Calendar({ from, to, onPick, onClose }: { from?: string; to?: string; onPick: (from: string, to: string) => void; onClose: () => void }) {
  const today = ymd(midnight());
  const [month, setMonth] = useState(() => { const d = from ? fromYmd(from) : midnight(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [a, setA] = useState<string | undefined>(from);
  const [b, setB] = useState<string | undefined>(to);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const lead = month.getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => ymd(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const end = b ?? (a && hover && hover > a ? hover : a);
  const atCurrent = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  const pick = (k: string) => {
    if (!a || b) { setA(k); setB(undefined); return; }
    if (k < a) { setB(a); setA(k); } else setB(k);
  };
  const shortcut = (f: Date, t: Date) => onPick(ymd(f), ymd(t > midnight() ? midnight() : t));
  const now = new Date();
  const span = a ? (end && end !== a ? `${dayLabel(fromYmd(a))} – ${dayLabel(fromYmd(end))}` : dayLabel(fromYmd(a))) : "Pick a day, or two for a range";
  const nDays = a && end ? Math.round((fromYmd(end).getTime() - fromYmd(a).getTime()) / 86_400_000) + 1 : 0;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
      <div role="dialog" aria-label="Pick dates"
        style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 40, width: 304, maxWidth: "calc(100vw - 32px)", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 14, boxShadow: "var(--shadow-lg)", padding: 12 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          <button style={{ ...pill, padding: "4px 9px", fontSize: 11.5 }} onClick={() => shortcut(new Date(now.getFullYear(), now.getMonth(), 1), midnight())}>This month</button>
          <button style={{ ...pill, padding: "4px 9px", fontSize: 11.5 }} onClick={() => shortcut(new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0))}>Last month</button>
          <button style={{ ...pill, padding: "4px 9px", fontSize: 11.5 }} onClick={() => shortcut(addDays(midnight(), -89), midnight())}>Last 90 days</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={navBtn}>‹</button>
          <div style={{ fontSize: 13.5, fontWeight: 800 }}>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
          <button aria-label="Next month" disabled={atCurrent} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={{ ...navBtn, opacity: atCurrent ? 0.3 : 1 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, fontVariantNumeric: "tabular-nums" }} onMouseLeave={() => setHover(null)}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 800, color: "var(--text-faint)", padding: "2px 0 4px" }}>{d}</div>)}
          {cells.map((k, i) => {
            if (!k) return <div key={`x${i}`} />;
            const future = k > today;
            const edge = k === a || k === end;
            const inside = !!a && !!end && k > a && k < end;
            return (
              <button key={k} disabled={future} onClick={() => pick(k)} onMouseEnter={() => setHover(k)}
                style={{ all: "unset", boxSizing: "border-box", textAlign: "center", padding: "7px 0", fontSize: 12.5, borderRadius: 8, cursor: future ? "default" : "pointer",
                  color: future ? "var(--text-faint)" : edge ? "#fff" : "var(--text)", opacity: future ? 0.4 : 1,
                  background: edge ? "var(--accent)" : inside ? "var(--accent-soft)" : "transparent",
                  fontWeight: k === today || edge ? 800 : 500, outline: k === today && !edge ? "1px solid var(--border-strong)" : "none" }}>
                {Number(k.slice(8))}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: a ? "var(--text)" : "var(--text-faint)", fontWeight: a ? 700 : 500 }}>
            {span}{nDays > 1 ? <span style={{ color: "var(--text-faint)", fontWeight: 500 }}> · {nDays} days</span> : null}
          </div>
          <button style={{ ...pill, padding: "5px 10px" }} onClick={onClose}>Cancel</button>
          <button style={{ ...pill, ...on, padding: "5px 12px" }} disabled={!a} onClick={() => a && onPick(a, b ?? a)}>Apply</button>
        </div>
      </div>
    </>
  );
}

/** Today's times as just the time; older ones with the day. */
function when(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return ymd(d) === ymd(new Date()) ? `Today ${time}` : `${dayLabel(d)}, ${time}`;
}

const WHY: Record<string, [string, string]> = {
  granted: ["✓ Trial given", "var(--success)"],
  "no-live-rule": ["No live trial for this country", "var(--text-muted)"],
  "email-provider": ["Email not eligible for a trial", "var(--text-muted)"],
  "already-claimed": ["Already had a trial", "var(--text-muted)"],
  "no-country": ["Country not detected", "var(--danger)"],
  "email-unconfirmed": ["Email not confirmed yet", "var(--text-muted)"],
  "no-email": ["Account has no email", "var(--text-muted)"],
  error: ["Failed", "var(--danger)"],
};

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 14 };
const on: React.CSSProperties = { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent-strong)" };
const pill: React.CSSProperties = { ...chip, padding: "6px 12px", fontSize: 12.5, whiteSpace: "nowrap" };
const scrollBox: React.CSSProperties = { overflow: "auto", border: "1px solid var(--border)", borderRadius: 12, overscrollBehavior: "contain" };
const navBtn: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", width: 30, height: 28, fontSize: 16, lineHeight: 1 };
const dot: React.CSSProperties = { display: "inline-block", width: 8, height: 8, borderRadius: 999, marginRight: 5, verticalAlign: "middle" };
