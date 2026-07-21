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
  default: (<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12h8" /></>),
};

// Map a tool page href to an icon key (for the nav + /tools hub).
export function iconKeyForHref(href: string): string {
  const map: Record<string, string> = {
    "/upscale": "upscale",
    "/compress-image": "compress",
    "/convert-image": "convert",
    "/crop-image": "crop",
    "/rotate-image": "rotate",
    "/watermark-image": "watermark",
    "/meme-generator": "meme",
    "/image-to-pdf": "pdf",
    "/tiktok-watermark-remover": "tiktok",
    "/editor": "editor",
    "/batch-editor": "batch",
  };
  return map[href] || "default";
}

export default function ToolIcon({ id, active, size = 40 }: { id: string; active?: boolean; size?: number }) {
  const gid = `tgrad-${id}`;
  const glyph = GLYPHS[id] || GLYPHS.default;
  const inner = Math.round(size * 0.56);
  return (
    <span
      aria-hidden
      style={{
        width: size, height: size, borderRadius: size * 0.28,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        background: active ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#EEF2FF",
        boxShadow: active ? "0 6px 16px rgba(99,102,241,0.35)" : "none",
        transition: "background .15s",
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none"
        stroke={active ? "#fff" : `url(#${gid})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {glyph}
      </svg>
    </span>
  );
}
