import type { Metadata, Viewport } from "next";
import "./m.css";

/**
 * /m/* — the standalone mobile apps (one AI tool each), built web-first so the
 * screens can be reviewed on a phone before being wrapped for the Play Store.
 *
 * The site's nav, footer, trial bar, gallery and chat bubble all hide on these
 * paths (see NavBar, Footer, TrialOffer, PageGallery, SupportChat), so each
 * reads as its own app. Not indexed: they are app shells, not landing pages.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function MobileAppsLayout({ children }: { children: React.ReactNode }) {
  return <div className="mapp-root">{children}</div>;
}
