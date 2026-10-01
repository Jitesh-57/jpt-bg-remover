"use client";

import { useEffect, useState } from "react";

/**
 * What the result pane shows while an image is being made.
 *
 * The photo itself sits underneath as a dark, blurred ghost that slowly
 * sharpens, with an aurora glow, a light sweep and rising sparkles over it;
 * in the middle, a ring with an estimate, the step it is on, and the time so
 * far. The estimate eases towards 95% and stays there until the image comes
 * back, so it never claims to be finished before it is.
 */

const STEPS = (name: string) => [
  "Reading your photo…",
  "Finding the face and the light…",
  `Applying the ${name} look…`,
  "Painting fine details…",
  "Adding the finishing touches…",
];

/** Sparkles: fixed positions so server and client agree. */
const SPARKS = [8, 19, 27, 36, 44, 52, 61, 69, 77, 85, 92, 14, 58, 73].map((left, i) => ({
  left, delay: (i * 0.37) % 3.2, dur: 2.6 + ((i * 0.53) % 1.8), size: 3 + (i % 3),
}));

export default function GeneratingFx({ ghost, name }: { ghost?: string | null; name: string }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const h = setInterval(() => setT((Date.now() - start) / 1000), 250);
    return () => clearInterval(h);
  }, []);

  // ~63% at 20s, ~86% at 40s, never past 95 until the result arrives.
  const pct = Math.min(95, Math.round(100 * (1 - Math.exp(-t / 20))));
  const steps = STEPS(name.replace(/\s+(filter|maker|generator|editor)$/i, ""));
  const step = steps[Math.min(steps.length - 1, Math.floor(t / 6))];
  const R = 34, C = 2 * Math.PI * R;

  return (
    <div className="jpt-gen" role="status" aria-live="polite">
      {ghost && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ghost} alt="" className="jpt-gen-ghost" />
      )}
      <span className="jpt-gen-aurora" />
      <span className="jpt-gen-sweep" />
      {SPARKS.map((s, i) => (
        <span key={i} className="jpt-gen-spark" style={{ left: `${s.left}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
      ))}

      <div className="jpt-gen-core">
        <div className="jpt-gen-ring">
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
            <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5" />
            <circle cx="44" cy="44" r={R} fill="none" stroke="url(#jptGenGrad)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset .4s ease" }} />
            <defs>
              <linearGradient id="jptGenGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFB067" /><stop offset="100%" stopColor="#E11D74" />
              </linearGradient>
            </defs>
          </svg>
          <span className="jpt-gen-orbit"><i /></span>
          <span className="jpt-gen-pct">{pct}%</span>
        </div>
        <div key={step} className="jpt-gen-step">{step}</div>
        <div className="jpt-gen-time">{Math.floor(t)}s · usually 15–40s</div>
      </div>
    </div>
  );
}
