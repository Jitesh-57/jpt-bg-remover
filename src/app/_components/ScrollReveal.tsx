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
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
