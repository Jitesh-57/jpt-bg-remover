"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { adsAllowed } from "@/lib/ad-policy";

const SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6299138657923728";

/**
 * Loads the AdSense (Auto ads) script only on pages allowed by ad-policy.ts.
 * Site ownership stays verified through the google-adsense-account meta tag
 * in the root layout, which is on every page.
 */
export default function AdSenseLoader() {
  const pathname = usePathname();

  useEffect(() => {
    if (!adsAllowed(pathname)) return;
    if (document.querySelector(`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`)) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = SRC;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, [pathname]);

  return null;
}
