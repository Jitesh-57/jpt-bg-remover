"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GA_ID, GOOGLE_ADS_ID, analyticsEnabled, captureUtm } from "@/lib/analytics";

/**
 * Loads GA4 + Google Ads gtag.js and captures UTM params on first load.
 * Renders nothing (and loads no scripts) until at least one ID env var is set.
 */
export default function Analytics() {
  useEffect(() => {
    captureUtm();
  }, []);

  if (!analyticsEnabled) return null;

  // gtag.js is loaded once; configure each enabled product.
  const primaryId = GA_ID || GOOGLE_ADS_ID;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_ID ? `gtag('config', '${GA_ID}');` : ""}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
        `}
      </Script>
    </>
  );
}
