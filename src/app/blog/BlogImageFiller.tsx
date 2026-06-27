"use client";

import { useEffect } from "react";

/**
 * Drives the one-time blog-image generation from the browser: loops the
 * generator endpoint (4 images/call) until every post has a Supabase image.
 * Idempotent and self-terminating — once all images exist the first call
 * returns done:true and the loop stops (negligible cost on later visits).
 */
export default function BlogImageFiller() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Keep going through timeouts/errors — missing images are retried until done.
      for (let i = 0; i < 60 && !cancelled; i++) {
        try {
          const r = await fetch("/api/cron/blog-images?token=jptblog2026", { cache: "no-store" });
          const d = (await r.json()) as { done?: boolean; remaining?: number };
          if (d.done || (d.remaining ?? 0) <= 0) break;
        } catch {
          // a batch may 504 on Hobby's 60s limit — pause briefly and continue
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}
