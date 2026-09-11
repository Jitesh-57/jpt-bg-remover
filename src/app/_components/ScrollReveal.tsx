"use client";

import { useEffect } from "react";

/**
 * Drop-in scroll-reveal for server-rendered pages: on mount it finds every
 * <section> on the page and fades/rises it into view as it scrolls in. The
 * reveal class is added by JS, so content stays visible with JS disabled.
 * Respects prefers-reduced-motion. Pair with the .jpt-reveal CSS in globals.
 */
export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(document.querySelectorAll("section")) as HTMLElement[];
    if (!sections.length) return;
    sections.forEach((el) => el.classList.add("jpt-reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("jpt-in"); io.unobserve(e.target); }
        });
      },
      // threshold must stay 0: a percentage threshold can never be met by a
      // section taller than the viewport (e.g. the 80s prompt list), leaving it
      // stuck at opacity 0.
      // The huge top rootMargin makes anything already scrolled past count as
      // intersecting. Without it, a section jumped over (anchor link, restored
      // scroll position, fast flick) never transitions to intersecting and so
      // stays at opacity 0 permanently. The -8% bottom keeps the reveal slightly early.
      { threshold: 0, rootMargin: "100000px 0px -8% 0px" }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
