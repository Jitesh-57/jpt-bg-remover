import React from "react";

// Custom gradient tool icons (replaces emoji in the editor sidebar).
// Each glyph is a stroke-based 24×24 SVG rendered inside a rounded tile:
// a light indigo tile with a gradient glyph by default, a gradient-filled
// tile with a white glyph when active — a cohesive, brand-styled set.

const GLYPHS: Record<string, React.ReactNode> = {
  upscale: (<>
    <rect x="3" y="3" width="12" height="12" rx="2" />
    <path d="M9 15v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-3" />
    <path d="M13 11l6-6M19 5v4M19 5h-4" />
  </>),
  resize: (<>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M14 8l2-2M16 6h-3M16 6v3M10 16l-2 2M8 18h3M8 18v-3" />
  </>),
  crop: (<>
    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
    <path d="M2 6h14a2 2 0 0 1 2 2v14" />
  </>),
  rotate: (<>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 4v4h-4" />
  </>),
  adjust: (<>
    <path d="M4 7h8M16 7h4M4 12h4M12 12h8M4 17h11M19 17h1" />
    <circle cx="14" cy="7" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="17" cy="17" r="2" />
  </>),
  watermark: (<>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 15l2-6 2 4 2-4 2 6" />
  </>),
  meme: (<>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 7h4M7 17h10" />
    <path d="M8 11.5a4 4 0 0 0 8 0" />
  </>),
  stickers: (<>
    <path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8l6-6V6" />
    <path d="M14 21v-4a1 1 0 0 1 1-1h4" />
    <circle cx="9" cy="9" r="1.2" /><circle cx="14" cy="9" r="1.2" />
  </>),
  compress: (<>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 8v3H6M15 8v3h3M9 16v-3H6M15 16v-3h3" />
  </>),
  convert: (<>
    <path d="M4 8h12l-3-3M4 8l3 3" />
    <path d="M20 16H8l3 3M20 16l-3-3" />
  </>),
  pdf: (<>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h1.2a1.3 1.3 0 0 1 0 2.6H9V13v4" />
  </>),
  "ai-edit": (<>
    <path d="M12 3l1.7 4L18 8.7l-4.3 1.7L12 15l-1.7-4.3L6 8.7 10.3 7z" />
    <path d="M18 14l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z" />
  </>),
  "generate-bg": (<>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8" cy="9" r="1.6" />
    <path d="M3 16l5-4 4 3 3-2 6 5" />
  </>),
  "remove-bg": (<>
    <circle cx="9" cy="8" r="3" />
    <path d="M4 20a5 5 0 0 1 10 0" />
    <path d="M15 5l5 5M20 5l-5 5" />
  </>),
  tiktok: (<>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M8 6l1.5 4M13 6l1.5 4" />
  </>),
  batch: (<>
    <rect x="8" y="3" width="12" height="12" rx="2" />
    <path d="M4 8v11a2 2 0 0 0 2 2h11" />
  </>),
  editor: (<>
    <path d="M4 20l1-4L15 6l3 3L8 19z" />
    <path d="M13.5 7.5l3 3" />
  </>),
  blur: (<>
    <circle cx="12" cy="12" r="8" />
    <circle cx="9" cy="10" r=".9" fill="currentColor" /><circle cx="14.5" cy="9" r=".9" fill="currentColor" />
    <circle cx="12" cy="14" r=".9" fill="currentColor" /><circle cx="15.5" cy="13.5" r=".9" fill="currentColor" /><circle cx="8.5" cy="14.5" r=".9" fill="currentColor" />
  </>),
  qr: (<>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <path d="M14 14h2.5v2.5M20 14v.01M14 20h.01M17.5 17.5H20V20h-2.5" />
  </>),
  headshot: (<>
    <circle cx="12" cy="9" r="3.6" />
    <path d="M5 20.5c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    <path d="M3.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2M20.5 7V5A1.5 1.5 0 0 0 19 3.5h-2" />
  </>),
  "upscale-ai": (<>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20.5 20.5l-5.4-5.4" />
    <path d="M10.5 7.5v6M7.5 10.5h6" />
  </>),
  apps: (<>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    <path d="M17 3.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </>),
  eraser: (<>
    <path d="M16 3.5l4.5 4.5L10 18.5H5.5L3.5 16.5 16 3.5z" />
    <path d="M9.5 10l4.5 4.5M10 18.5h10.5" />
  </>),
  generations: (<>
    <rect x="3.5" y="5.5" width="13" height="13" rx="2" />
    <path d="M7.5 2.5h11a3 3 0 0 1 3 3v11" />
    <path d="M3.5 15l3.5-3 3 2.5 2-1.5 4.5 3.5" />
  </>),
  dashboard: (<>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </>),
  tools: (<>
    <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5z" />
  </>),
  blog: (<>
    <path d="M5 3.5h10l4 4v13H5z" /><path d="M15 3.5v4h4" /><path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3" />
  </>),
  prompts: (<>
    <path d="M4 5.5A2 2 0 0 1 6 3.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-4.5 4v-4H6a2 2 0 0 1-2-2z" />
    <path d="M12 7l.9 2.1L15 10l-2.1.9L12 13l-.9-2.1L9 10l2.1-.9z" />
  </>),
  video: (<>
    <rect x="3" y="5.5" width="13" height="13" rx="2.5" /><path d="M16 10.5l5-3v9l-5-3" />
  </>),
  pricing: (<>
    <path d="M6.5 3.5h11l3 5-8.5 12-8.5-12z" /><path d="M3.5 8.5h17M9.5 8.5l2.5 12 2.5-12M9 3.5l.5 5M15 3.5l-.5 5" />
  </>),
  default: (<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12h8" /></>),
};

// Map a tool page href to an icon key (for the nav, homepage and /tools hub).
export function iconKeyForHref(href: string): string {
  const map: Record<string, string> = {
    "/upscale": "upscale",
    "/compress-image": "compress",
    "/convert-image": "convert",
    "/crop-image": "crop",
    "/resize-image": "resize",
    "/rotate-image": "rotate",
    "/blur-image": "blur",
    "/qr-code-generator": "qr",
    "/watermark-image": "watermark",
    "/meme-generator": "meme",
    "/image-to-pdf": "pdf",
    "/tiktok-watermark-remover": "tiktok",
    "/watermark-remover": "eraser",
    "/editor": "editor",
    "/batch-editor": "batch",
    "/ai-editor": "ai-edit",
    "/remove-bg": "remove-bg",
    "/ai-headshot": "headshot",
    "/editor?tool=generate-bg": "generate-bg",
    "/editor?tool=upscale": "upscale-ai",
    "/creative": "apps",
    "/generations": "generations",
    "/app": "dashboard",
    "/tools": "tools",
    "/blog": "blog",
    "/prompts": "prompts",
    "/prompts/video": "video",
    "/pricing": "pricing",
  };
  return map[href] || map[href.split("?")[0]] || "default";
}

/*
  One gradient per tool, all drawn from the brand's warm range (amber, orange,
  coral, rose, magenta, violet) so the set reads as one family while each tool
  is still recognisable at a glance.
*/
const PALETTE: [string, string][] = [
  ["#FF9F43", "#FF5A1F"], // amber → orange
  ["#FF7A45", "#E11D48"], // orange → rose
  ["#FB7185", "#DB2777"], // coral → pink
  ["#F472B6", "#C026D3"], // pink → magenta
  ["#C084FC", "#9333EA"], // lilac → violet
  ["#F97316", "#BE123C"], // orange → crimson
];
const TONE: Record<string, number> = {
  upscale: 0, "upscale-ai": 4, compress: 2, convert: 3, crop: 1, resize: 5, rotate: 4, blur: 3,
  qr: 5, watermark: 1, meme: 0, pdf: 2, tiktok: 3, eraser: 4, editor: 1, batch: 0, "ai-edit": 4,
  "remove-bg": 1, headshot: 2, "generate-bg": 0, apps: 3, generations: 5, adjust: 2, stickers: 3,
  dashboard: 1, tools: 0, blog: 2, prompts: 4, video: 3, pricing: 5,
};

/**
 * A tool's icon: a white line glyph on its own gradient tile.
 *
 * Pass `active` only where the icon sits in a picker (the editor sidebars):
 * there an unselected tool shows a quiet tinted tile and the selected one
 * lights up. Everywhere else the full gradient tile is the default.
 */
export default function ToolIcon({ id, active, size = 40 }: { id: string; active?: boolean; size?: number }) {
  const glyph = GLYPHS[id] || GLYPHS.default;
  const [from, to] = PALETTE[TONE[id] ?? 1];
  const solid = active === undefined || active;
  const inner = Math.round(size * 0.54);
  const radius = Math.round(size * 0.3);
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        width: size, height: size, borderRadius: radius,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: solid ? "#fff" : from,
        background: solid
          ? `linear-gradient(180deg, rgba(255,255,255,.26), rgba(255,255,255,0) 55%), linear-gradient(135deg, ${from}, ${to})`
          : `linear-gradient(135deg, ${from}22, ${to}22)`,
        boxShadow: solid
          ? `inset 0 0 0 1px rgba(255,255,255,.18), 0 ${Math.round(size * 0.12)}px ${Math.round(size * 0.35)}px -${Math.round(size * 0.12)}px ${to}AA`
          : `inset 0 0 0 1px ${from}33`,
        transition: "background .15s, box-shadow .15s",
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: solid ? "drop-shadow(0 1px 1px rgba(0,0,0,.18))" : undefined }}>
        {glyph}
      </svg>
    </span>
  );
}
