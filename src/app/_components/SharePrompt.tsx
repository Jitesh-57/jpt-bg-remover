"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Post-download share prompt — the site's viral loop.
 *
 * After a user downloads a result we invite them to share sjpt.io. Every share
 * is a potential backlink / referral and a fresh visitor, so this is shown once
 * per browser session (gated by sessionStorage) to stay helpful, not naggy.
 *
 * Desktop shows one-tap buttons for the big networks plus a copy-link button;
 * mobile additionally surfaces the native share sheet via `navigator.share`.
 */

const SHARE_URL = "https://www.sjpt.io/?ref=share";
const SHARE_TEXT =
  "I just edited my photo for free at sjpt.io — remove backgrounds, upscale, convert & more. No watermark, no sign-up. 🎨";
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

type Net = { key: string; label: string; icon: string; color: string; href: string };

const NETWORKS: Net[] = [
  {
    key: "twitter",
    label: "X",
    icon: "𝕏",
    color: "#000000",
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "🟢",
    color: "#25D366",
    href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "f",
    color: "#1877F2",
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: "🅡",
    color: "#FF4500",
    href: `https://www.reddit.com/submit?url=${encodeURIComponent(SHARE_URL)}&title=${encodeURIComponent("Free image editor — no watermark, no sign-up")}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "in",
    color: "#0A66C2",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
  },
];

export const SHARE_SESSION_KEY = "jpt_share_prompt_shown";

/** Returns true and marks the session if the prompt hasn't been shown yet. */
export function shouldShowSharePrompt(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(SHARE_SESSION_KEY)) return false;
    sessionStorage.setItem(SHARE_SESSION_KEY, "1");
    return true;
  } catch {
    return false; // storage blocked → don't risk showing on every download
  }
}

export default function SharePrompt({
  open,
  onClose,
  tool,
}: {
  open: boolean;
  onClose: () => void;
  tool?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    trackEvent("share_prompt_shown", { tool: tool || "editor" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, tool, onClose]);

  if (!open) return null;

  const openShare = (n: Net) => {
    trackEvent("share_clicked", { network: n.key, tool: tool || "editor" });
    window.open(n.href, "_blank", "noopener,noreferrer,width=620,height=560");
  };

  const nativeShare = async () => {
    trackEvent("share_clicked", { network: "native", tool: tool || "editor" });
    try {
      await navigator.share({ title: "sjpt.io", text: SHARE_TEXT, url: SHARE_URL });
    } catch {
      /* user cancelled the share sheet — nothing to do */
    }
  };

  const copyLink = async () => {
    trackEvent("share_clicked", { network: "copy", tool: tool || "editor" });
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share sjpt.io"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 20,
          padding: "28px 24px 24px",
          boxShadow: "0 24px 60px rgba(15,23,42,0.28)",
          textAlign: "center",
          fontFamily: "system-ui,-apple-system,sans-serif",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            border: "none",
            background: "transparent",
            fontSize: 22,
            lineHeight: 1,
            color: "#9CA3AF",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Download started!
        </h2>
        <p style={{ fontSize: 14.5, color: "#6B7280", lineHeight: 1.6, margin: "0 0 20px" }}>
          Loved it? Help a friend find sjpt.io — it&apos;s free, no watermark, no sign-up.
        </p>

        {canNativeShare && (
          <button
            onClick={nativeShare}
            className="jpt-hover"
            style={{
              width: "100%",
              background: GRAD,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "13px 20px",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              marginBottom: 14,
              boxShadow: "0 8px 22px rgba(99,102,241,0.32)",
            }}
          >
            Share ↗
          </button>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {NETWORKS.map((n) => (
            <button
              key={n.key}
              onClick={() => openShare(n)}
              aria-label={`Share on ${n.label}`}
              title={`Share on ${n.label}`}
              className="jpt-hover"
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                border: "none",
                background: n.color,
                color: "#fff",
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {n.icon}
            </button>
          ))}
        </div>

        <button
          onClick={copyLink}
          style={{
            width: "100%",
            background: copied ? "#F0FDF4" : "#F5F6FB",
            color: copied ? "#16A34A" : "#334155",
            border: `1px solid ${copied ? "#BBF7D0" : "#E5E7EB"}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {copied ? "✓ Link copied!" : "🔗 Copy link"}
        </button>

        <button
          onClick={onClose}
          style={{
            marginTop: 14,
            border: "none",
            background: "transparent",
            color: "#9CA3AF",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
