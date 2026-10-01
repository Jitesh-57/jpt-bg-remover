"use client";

import { useCallback, useEffect, useState } from "react";
import { label, input, chip, chipOn, primary, danger, success } from "../creatives/AdminShell";

/**
 * /admin/users — find an account by email and add or remove credits.
 *
 * Lists paying accounts by default (anyone who bought a pack, holds credits or
 * is on a paid plan), newest first. Every change is written to the credit
 * history with a note, so a balance can always be explained.
 */

type User = {
  id: string; email: string | null; name: string | null; credits: number; plan: string; created_at: string;
  purchases: { count: number; paise: number; last: string } | null;
};
type Detail = {
  profile: User;
  purchases: { id: number; plan: string; credits_added: number; amount_paise: number; invoice_no: string | null; created_at: string }[];
  ledger: { id: number; delta: number; balance_after: number; reason: string; tool: string | null; note: string | null; created_at: string }[];
};
type Filter = "paid" | "credits" | "all";

const TOKEN_KEY = "jpt-admin-token";
const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const date = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const REASON: Record<string, string> = { purchase: "Bought", generation: "Used", signup_grant: "Free trial", admin_adjust: "Admin", refund: "Refund" };

export default function UsersAdmin() {
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState<Filter>("paid");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<User[] | null>(null);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ payingUsers: number; revenueInr: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Detail | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => { try { const t = localStorage.getItem(TOKEN_KEY); if (t) setToken(t); } catch {} }, []);
  const t = token.trim();
  const api = (qs: string) => `/api/admin/users?token=${encodeURIComponent(t)}${qs}`;

  const load = useCallback(async (offset = 0) => {
    if (!t) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(api(`&filter=${filter}&q=${encodeURIComponent(q.trim())}&offset=${offset}`), { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) { setErr(d.error ? `${d.error}${d.fix ? ` ${d.fix}` : ""}` : `HTTP ${r.status}`); return; }
      try { localStorage.setItem(TOKEN_KEY, t); } catch {}
      setUsers((cur) => (offset ? [...(cur ?? []), ...d.users] : d.users));
      setTotal(d.total); setStats(d.stats);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, filter, q]);

  // Search as you type, a moment after the last key.
  useEffect(() => { const h = setTimeout(() => void load(0), 300); return () => clearTimeout(h); }, [load]);

  const openUser = async (id: string) => {
    setErr(""); setOk(""); setAmount(""); setNote("");
    const r = await fetch(api(`&id=${id}`), { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) { setErr(d.error || `HTTP ${r.status}`); return; }
    setOpen({ ...d, profile: { ...d.profile, purchases: users?.find((u) => u.id === id)?.purchases ?? null } });
  };

  const adjust = async (delta: number) => {
    if (!open || !delta) return;
    const verb = delta > 0 ? `Add ${delta}` : `Remove ${-delta}`;
    if (!confirm(`${verb} credits ${delta > 0 ? "to" : "from"} ${open.profile.email}?`)) return;
    setBusy(true); setErr(""); setOk("");
    const r = await fetch(api(""), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: open.profile.id, delta, note }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || d.error) { setErr(d.error || `HTTP ${r.status}`); return; }
    setOk(`Done. ${open.profile.email} now has ${d.credits} credits${d.applied !== delta ? ` (balance can't go below 0, so ${Math.abs(d.applied)} were removed)` : ""}.`);
    setAmount(""); setNote("");
    setUsers((list) => list?.map((u) => (u.id === open.profile.id ? { ...u, credits: d.credits } : u)) ?? null);
    await openUser(open.profile.id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 16px 90px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "10px 0 6px" }}>👥 Users & credits</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 20px", maxWidth: 700 }}>
          Search by email, open an account, and add or remove credits. Every change is saved in that account&apos;s credit history with your note.
        </p>

        {!users && !loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 520 }}>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token (ADMIN_IMAGE_TOKEN)" style={input} />
            <button style={chip} onClick={() => void load(0)}>Load</button>
          </div>
        )}
        {err && <div style={{ ...danger, marginTop: 0, marginBottom: 16 }}>{err}</div>}

        {users && (
          <>
            {stats && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ ...card, padding: "12px 16px" }}><div style={label}>Paying users</div><div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{stats.payingUsers}</div></div>
                <div style={{ ...card, padding: "12px 16px" }}><div style={label}>Total revenue</div><div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>₹{stats.revenueInr.toLocaleString("en-IN")}</div></div>
                <div style={{ ...card, padding: "12px 16px" }}><div style={label}>Showing</div><div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{total}</div></div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email…" style={{ ...input, flex: "1 1 280px", maxWidth: 420 }} autoFocus />
              {([["paid", "Paying or with credits"], ["credits", "Has credits"], ["all", "Everyone"]] as [Filter, string][]).map(([id, l]) => (
                <button key={id} style={{ ...chip, ...(filter === id ? chipOn : {}) }} onClick={() => setFilter(id)}>{l}</button>
              ))}
              {loading && <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>Loading…</span>}
            </div>

            <div className="jpt-blog-admin" style={{ display: "grid", gap: 16, alignItems: "start", gridTemplateColumns: open ? undefined : "1fr" }}>
              <div style={{ ...card, padding: 0, overflow: "hidden", minWidth: 0 }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "var(--text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
                        <th style={{ padding: "10px 14px" }}>Account</th>
                        <th style={{ padding: "10px 8px", textAlign: "right" }}>Credits</th>
                        {!open && <th style={{ padding: "10px 8px", textAlign: "right" }}>Paid</th>}
                        {!open && <th style={{ padding: "10px 14px" }}>Joined</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} onClick={() => void openUser(u.id)} style={{ borderTop: "1px solid var(--border)", cursor: "pointer", background: open?.profile.id === u.id ? "var(--accent-soft)" : undefined }}>
                          <td style={{ padding: "10px 14px", minWidth: 0 }}>
                            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>{u.email || "(no email)"}</div>
                            <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{u.name || "—"}{u.plan !== "free" ? ` · ${u.plan}` : ""}</div>
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: u.credits > 0 ? "var(--text)" : "var(--text-faint)" }}>{u.credits}</td>
                          {!open && <td style={{ padding: "10px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{u.purchases ? `₹${Math.round(u.purchases.paise / 100)} · ${u.purchases.count}×` : "—"}</td>}
                          {!open && <td style={{ padding: "10px 14px", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{date(u.created_at)}</td>}
                        </tr>
                      ))}
                      {!users.length && <tr><td colSpan={4} style={{ padding: 18, color: "var(--text-faint)" }}>No accounts match.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {users.length < total && (
                  <button style={{ ...chip, display: "block", margin: "12px auto" }} disabled={loading} onClick={() => void load(users.length)}>
                    Show more ({total - users.length} more)
                  </button>
                )}
              </div>

              {open && (
                <aside style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, order: -1 }}>
                  <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{open.profile.email}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 2 }}>{open.profile.name || "—"} · joined {date(open.profile.created_at)}{open.profile.plan !== "free" ? ` · ${open.profile.plan}` : ""}</div>
                      </div>
                      <button style={{ ...chip, padding: "4px 10px" }} onClick={() => setOpen(null)}>✕</button>
                    </div>
                    <div style={{ fontSize: 34, fontWeight: 700, margin: "12px 0 4px", fontVariantNumeric: "tabular-nums" }}>{open.profile.credits} <span style={{ fontSize: 14, color: "var(--text-faint)", fontWeight: 500 }}>credits</span></div>

                    <label style={{ ...label, marginTop: 12 }}>Add or remove credits</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {[2, 5, 10, 20, 50].map((n) => <button key={n} style={chip} disabled={busy} onClick={() => void adjust(n)}>+{n}</button>)}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Amount" style={{ ...input, width: 110 }} />
                      <button style={{ ...primary, padding: "9px 14px", fontSize: 13.5 }} disabled={busy || !amount} onClick={() => void adjust(Number(amount))}>Add</button>
                      <button style={{ ...chip, color: "var(--danger)" }} disabled={busy || !amount} onClick={() => void adjust(-Number(amount))}>Remove</button>
                    </div>
                    <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Note (optional), e.g. refund for failed generation" style={{ ...input, marginTop: 8 }} />
                    {ok && <div style={{ ...success, marginTop: 10, fontSize: 13 }}>{ok}</div>}
                  </div>

                  <div style={card}>
                    <div style={label}>Purchases</div>
                    {open.purchases.length ? open.purchases.map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                        <span>{date(p.created_at)} · {p.plan} · +{p.credits_added}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>₹{Math.round(p.amount_paise / 100)}{p.invoice_no ? ` · ${p.invoice_no}` : ""}</span>
                      </div>
                    )) : <div style={{ fontSize: 13, color: "var(--text-faint)" }}>No purchases.</div>}
                  </div>

                  <div style={card}>
                    <div style={label}>Credit history</div>
                    <div className="jpt-scroll-thin" style={{ maxHeight: 340, overflowY: "auto" }}>
                      {open.ledger.length ? open.ledger.map((l) => (
                        <div key={l.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, fontSize: 12.5, padding: "6px 0", borderTop: "1px solid var(--border)", alignItems: "baseline" }}>
                          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: l.delta > 0 ? "var(--success)" : "var(--danger)", minWidth: 36 }}>{l.delta > 0 ? "+" : ""}{l.delta}</span>
                          <span style={{ minWidth: 0, color: "var(--text-muted)" }}>{REASON[l.reason] ?? l.reason}{l.tool ? ` · ${l.tool}` : ""}{l.note ? ` · ${l.note}` : ""}</span>
                          <span style={{ color: "var(--text-faint)", whiteSpace: "nowrap" }}>{date(l.created_at)} · {l.balance_after}</span>
                        </div>
                      )) : <div style={{ fontSize: 13, color: "var(--text-faint)" }}>No credit movements yet.</div>}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
