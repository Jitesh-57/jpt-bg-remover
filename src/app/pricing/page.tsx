"use client";

import { useState, useEffect } from "react";
import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";
import { PACKS, CREDIT_COST, type Pack } from "@/lib/plans";

/** The shape Razorpay hands to a "payment.failed" listener. */
interface RazorpayFailure {
  error?: { description?: string; reason?: string; step?: string; code?: string };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => {
      open(): void;
      /** Razorpay reports a rejected payment here, not through ondismiss. */
      on?(event: "payment.failed", cb: (resp: RazorpayFailure) => void): void;
    };
  }
}

const GRAD = "linear-gradient(135deg,var(--accent),var(--accent-2))";

const INCLUDED = [
  "Every AI tool — editor, headshots, background swap, 4× upscale",
  "Credits never expire — use them today or next year",
  "One-time payment. No subscription, no auto-renew",
  "Full-resolution downloads, no watermark",
];

const FAQS = [
  { q: "Do my credits expire?", a: "No. Credits are yours permanently — there is no monthly reset and no expiry date. Buy once, use them whenever you like." },
  { q: "How many credits does one image cost?", a: `Every AI generation costs ${CREDIT_COST} credits. A $2 pack is ${PACKS[0].generations} generations, $5 is ${PACKS[1].generations}, and $10 is ${PACKS[2].generations}.` },
  { q: "Is anything still free?", a: "Yes. Compress, convert, crop, resize, rotate, blur, watermark, meme text, image-to-PDF, the QR generator and normal upscaling all run in your browser and stay free and unlimited, with no account needed. Credits are only for the AI tools." },
  { q: "Is this a subscription?", a: "No. Each pack is a single one-time payment. Nothing auto-renews and no card is stored for future charges." },
  { q: "What if I run out mid-project?", a: "Buy another pack at any time — credits stack onto your existing balance." },
];

export default function PricingPage() {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [prefillUser, setPrefillUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; name?: string; email?: string; credits?: number }) => {
        if (d.authenticated) {
          setLoggedIn(true);
          setPrefillUser({ name: d.name, email: d.email });
          if (typeof d.credits === "number") setCredits(d.credits);
        }
      })
      .catch(() => {});
  }, []);

  function signInWithGoogle() {
    window.location.href = `/api/auth/google?next=${encodeURIComponent("/pricing")}`;
  }

  async function handleBuy(p: Pack) {
    setLoadingPack(p.id);
    setStatusMsg(null);
    trackBuyButtonClicked(p.id, p.usd);
    trackBeginCheckout(p.id, p.usd);

    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p.id }),
      });
      const orderData = (await orderRes.json()) as { order_id?: string; amount?: number; currency?: string; error?: string };

      if (!orderRes.ok || !orderData.order_id) {
        trackPaymentFailed(p.id, orderData.error || "order_creation_failed");
        setStatusMsg({ text: orderData.error || "Failed to start checkout", ok: false });
        setLoadingPack(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Pixel Shine",
        description: `${p.credits} credits — ${p.label} pack`,
        // A literal hex, not var(--accent): Razorpay's checkout renders in its
        // own document and cannot resolve our CSS custom properties, so the
        // variable was silently ignored and checkout fell back to its default
        // blue.
        theme: { color: "#FF7A2F" },
        modal: {
          ondismiss() {
            trackPaymentFailed(p.id, "cancelled_by_user");
            // Only if nothing more specific has already been reported —
            // payment.failed fires first and its reason is the useful one.
            setStatusMsg((prev) => prev && !prev.ok ? prev : { text: "Payment cancelled", ok: false });
            setLoadingPack(null);
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, plan: p.id }),
            });
            const data = (await verifyRes.json()) as { success?: boolean; error?: string; credits?: number };
            if (data.success) {
              if (typeof data.credits === "number") setCredits(data.credits);
              setStatusMsg({ text: `🎉 ${p.credits} credits added. They're yours for good.`, ok: true });
              trackPurchase(p.id, p.usd, 0);
            } else {
              trackPaymentFailed(p.id, data.error || "verification_failed");
              setStatusMsg({ text: data.error || "Verification failed", ok: false });
            }
          } catch {
            setStatusMsg({ text: "Verification request failed", ok: false });
          }
          setLoadingPack(null);
        },
        prefill: { name: prefillUser?.name || "", email: prefillUser?.email || "" },
      });

      /*
        Razorpay reports a rejected payment through this event, not through
        the dismiss handler. Without it, "Payment blocked as website does not
        match registered website(s)" was shown by Razorpay's own modal and
        then replaced by our "Payment cancelled" the moment it closed — so the
        reason never reached the page, the analytics, or anyone reading them.
      */
      rzp.on?.("payment.failed", (resp: { error?: { description?: string; reason?: string; step?: string } }) => {
        const why = resp?.error?.description || resp?.error?.reason || "Payment failed";
        trackPaymentFailed(p.id, resp?.error?.reason || "payment_failed");
        console.error("[pricing] razorpay payment.failed:", JSON.stringify(resp?.error || {}));
        setStatusMsg({ text: why, ok: false });
        setLoadingPack(null);
      });

      rzp.open();
    } catch (e) {
      trackPaymentFailed(p.id, String(e));
      setStatusMsg({ text: String(e), ok: false });
      setLoadingPack(null);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "56px 20px 80px" }}>
      {/* HERO */}
      <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 14px" }}>
        <div className="jpt-pill" style={{ marginBottom: 18 }}>💎 One-time packs · never expire</div>
        <h1 className="jpt-h1">
          Simple <span className="jpt-grad-text">credit packs</span>
        </h1>
        <p className="jpt-lead" style={{ maxWidth: 560, margin: "0 auto" }}>
          Pay once for the AI tools. {CREDIT_COST} credits per generation, no subscription, and
          your credits never expire. The browser-based tools stay free forever.
        </p>
      </div>

      {credits !== null && (
        <p style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--accent-strong)", margin: "0 0 8px" }}>
          You have {credits} credit{credits === 1 ? "" : "s"} · {Math.floor(credits / CREDIT_COST)} generation
          {Math.floor(credits / CREDIT_COST) === 1 ? "" : "s"} left
        </p>
      )}

      {statusMsg && (
        <div
          style={{
            margin: "22px auto 0", maxWidth: 480, padding: "14px 24px", borderRadius: 12,
            background: statusMsg.ok ? "var(--success-soft)" : "var(--danger-soft)",
            color: statusMsg.ok ? "var(--accent-strong)" : "var(--danger)",
            fontSize: 15, fontWeight: 600, textAlign: "center",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* PACKS */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(270px, 100%), 1fr))",
          gap: 20, maxWidth: 940, margin: "38px auto 0", alignItems: "stretch",
        }}
      >
        {PACKS.map((p) => (
          <div
            key={p.id}
            className="jpt-hover"
            style={{
              position: "relative", display: "flex", flexDirection: "column",
              background: "var(--surface)",
              border: `${p.popular ? 2 : 1}px solid ${p.popular ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 20, padding: "32px 26px 26px",
              boxShadow: p.popular ? "0 20px 60px var(--accent-soft)" : "var(--shadow-sm)",
            }}
          >
            {p.popular && (
              <div
                style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 11.5,
                  borderRadius: 20, padding: "5px 14px", letterSpacing: "0.06em",
                  textTransform: "uppercase", whiteSpace: "nowrap",
                }}
              >
                Most popular
              </div>
            )}

            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              {p.label}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1 }}>₹{p.inr}</span>
              <span style={{ fontSize: 14.5, color: "var(--text-faint)", fontWeight: 600 }}>one time</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 5 }}>≈ ${p.usd} · charged in INR via Razorpay</div>

            <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{p.credits} credits</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 2 }}>
              ≈ {p.generations} AI generations
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "12px 0 0", lineHeight: 1.6 }}>{p.blurb}</p>

            <div style={{ marginTop: "auto", paddingTop: 22 }}>
              {loggedIn ? (
                <button
                  onClick={() => handleBuy(p)}
                  disabled={loadingPack !== null}
                  style={{
                    width: "100%", padding: "14px", border: "none", borderRadius: 12,
                    background: loadingPack === p.id ? "var(--text-faint)" : p.popular ? GRAD : "var(--surface-3)",
                    color: loadingPack === p.id ? "#fff" : p.popular ? "#fff" : "var(--accent-strong)",
                    fontWeight: 800, fontSize: 15.5, fontFamily: "inherit",
                    cursor: loadingPack !== null ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingPack === p.id ? "Processing…" : `Get ${p.credits} credits`}
                </button>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12,
                    background: "var(--surface)", color: "var(--text-muted)",
                    border: "1.5px solid var(--border)", fontWeight: 800, fontSize: 15,
                    fontFamily: "inherit", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
                  Sign in to buy
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* WHAT'S INCLUDED */}
      <div style={{ maxWidth: 700, margin: "46px auto 0", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>Every pack includes</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
          {INCLUDED.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 11, fontSize: 15, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.55 }}>
              <span style={{ width: 21, height: 21, borderRadius: "50%", background: "var(--success-soft)", color: "var(--accent-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 700, margin: "38px auto 0" }}>
        <h2 style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 800, color: "var(--text)", textAlign: "center", letterSpacing: "-0.02em" }}>
          Questions
        </h2>
        {FAQS.map((f) => (
          <details key={f.q} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
            <summary style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
          </details>
        ))}
      </div>

      <div style={{ marginTop: 36, textAlign: "center", color: "var(--text-faint)", fontSize: 14 }}>
        Questions?{" "}
        <a href="mailto:patil.jitesh866@gmail.com" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          Contact us
        </a>
      </div>
    </main>
  );
}
