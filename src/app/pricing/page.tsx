"use client";

import { useState, useEffect } from "react";
import { PACKS, MONTHLY_PLANS, CREDIT_COST, formatInr } from "@/lib/plans";
import PlanPurchase, { MONTHLY_SAVING } from "@/app/_components/PlanPurchase";
import BeforeAfterWipe from "@/app/_components/BeforeAfterWipe";
import { onCreditsChanged } from "@/lib/credits";

const INCLUDED = [
  "Every AI tool — editor, headshots, background swap, creative apps, 4× upscale",
  "Full-resolution downloads, no watermark, yours to use commercially",
  "Monthly plans: fresh credits every month, cancel any time from Settings",
  "Add-on packs: a one-time payment, and the credits never expire",
];

const lowest = (list: typeof PACKS) => list.reduce((a, b) => (a.inr / a.credits <= b.inr / b.credits ? a : b));

const FAQS = [
  { q: "What's the difference between a monthly plan and an add-on pack?", a: `A monthly plan renews every month and gives you a fresh set of credits each time — up to ${MONTHLY_SAVING}% less per credit than a pack. An add-on pack is a single payment whose credits never expire. You can have both, and even several monthly plans at once.` },
  { q: "How do I cancel a monthly plan?", a: "Open Settings → Your plans and press Cancel plan. Razorpay stops the subscription, so you are not charged again, and the credits for the month you already paid for stay usable until it ends." },
  { q: "Do unused monthly credits carry over?", a: "No — each renewal resets the plan's monthly credits to the full amount, and any left from the month before expire. Add-on credits never expire, and the app always spends monthly credits first so the ones that would expire are used up before your add-ons." },
  { q: "How many credits does one image cost?", a: `Every AI generation costs ${CREDIT_COST} credits. The ${lowest(MONTHLY_PLANS).label} plan's ${lowest(MONTHLY_PLANS).credits} monthly credits make ${lowest(MONTHLY_PLANS).generations} generations; a ₹${formatInr(PACKS[0].inr)} add-on is ${PACKS[0].generations}.` },
  { q: "Is anything still free?", a: "Yes. Compress, convert, crop, resize, rotate, blur, watermark, meme text, image-to-PDF, the QR generator and normal upscaling all stay free and unlimited, with no account needed. Credits are only for the AI tools." },
  { q: "How am I charged?", a: "In Indian rupees, through Razorpay — UPI, cards and netbanking. The dollar figures are approximate. Monthly plans save your card or UPI mandate with Razorpay for the renewals; add-on packs store nothing." },
];

export default function PricingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [prefillUser, setPrefillUser] = useState<{ name?: string; email?: string } | undefined>();

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
  useEffect(() => onCreditsChanged(setCredits), []);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "56px 20px 80px" }}>
      {/* HERO */}
      <div className="jpt-pricing-hero">
        <div style={{ minWidth: 0 }}>
          <div className="jpt-pill" style={{ marginBottom: 18 }}>Monthly plans · one-time add-ons</div>
          <h1 className="jpt-h1" style={{ textAlign: "left" }}>
            Pricing that <span className="jpt-grad-text">fits how you create</span>
          </h1>
          <p className="jpt-lead" style={{ maxWidth: 520, margin: 0, textAlign: "left" }}>
            Go monthly for fresh credits every month at the lowest price per credit, or top up once with
            an add-on that never expires. {CREDIT_COST} credits per AI generation. The free tools stay free forever.
          </p>
          {credits !== null && (
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-strong)", margin: "16px 0 0" }}>
              You have {credits} credit{credits === 1 ? "" : "s"} · {Math.floor(credits / CREDIT_COST)} generation
              {Math.floor(credits / CREDIT_COST) === 1 ? "" : "s"} left
            </p>
          )}
        </div>
        <BeforeAfterWipe
          before="/pricing/before.webp"
          after="/pricing/after.webp"
          alt="Before: an office selfie. After: the same person in a styled outdoor fashion shoot."
          className="jpt-pricing-hero-wipe"
        />
      </div>

      {/* PLANS */}
      <div style={{ maxWidth: 1080, margin: "40px auto 0" }}>
        <PlanPurchase layout="grid" loggedIn={loggedIn} prefillUser={prefillUser} />
      </div>

      {/* WHAT'S INCLUDED */}
      <div style={{ maxWidth: 700, margin: "46px auto 0", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>Every plan and pack includes</h2>
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
