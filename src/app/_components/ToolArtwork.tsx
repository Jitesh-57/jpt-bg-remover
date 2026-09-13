/**
 * ToolArtwork — the artwork a slot shows when its photo is not there.
 *
 * The slots that have no generated creative yet were falling back to a flat
 * two-stop gradient, so a whole gallery read as coloured rectangles. This
 * draws something instead: the app's own palette, a motif chosen from what the
 * tool actually does, its emoji and its name.
 *
 * Vector, not photography. A stock photo would be the wrong promise — it shows
 * a picture the tool did not make — and hotlinking one adds a licence and a
 * third-party request to every card. An SVG costs about a kilobyte, scales to
 * any card size, and is honest about being a placeholder while still looking
 * deliberate.
 *
 * The motif is picked from the slug, so a portrait tool gets a face, a product
 * tool gets a product, a restore tool gets a damaged print. Same input, same
 * artwork, every render.
 */

type Motif =
  | "portrait" | "body" | "group" | "pet" | "product"
  | "vehicle" | "place" | "restore" | "sharpen" | "art" | "text";

const MOTIF_RULES: [RegExp, Motif][] = [
  [/unpixelate|unblur|upscal|enlarge|sharpen|denoise|hd-photo|4k|resolution/, "sharpen"],
  [/old-photo|restor|colou?ri[sz]e|black-and-white|yearbook|ancestor|repair/, "restore"],
  [/logo|icon|banner|poster|cover|thumbnail|text|emoji|caption|signature/, "text"],
  [/couple|wedding|family|group|anniversary|reunion/, "group"],
  [/\bpet|dog|cat\b|puppy|kitten|animal/, "pet"],
  [/\bcar\b|bike|motorcycle|truck|vehicle|automotive|plate/, "vehicle"],
  [/real-estate|house|property|interior|room|home-decor|hotel|architect|airbnb|food|restaurant/, "place"],
  [/product|amazon|ecommerce|shopify|ebay|jewel|ring|watch|shoe|bottle|furniture|electronics|beauty|background-remover|png-maker/, "product"],
  [/outfit|dress|saree|suit|fashion|apparel|body|muscle|fitness|gym|figurine|action-figure|tattoo/, "body"],
  [/anime|ghibli|cartoon|pixar|comic|claymation|pixel-art|illustration|painting|art|sketch|caricature/, "art"],
];

function motifFor(slug: string, name: string): Motif {
  const hay = `${slug} ${name}`.toLowerCase();
  for (const [re, m] of MOTIF_RULES) if (re.test(hay)) return m;
  return "portrait";
}

/**
 * Each motif as a path set drawn on a 0 0 120 150 canvas (the 4:5 cards).
 * Deliberately simple: at card size these read as a silhouette, and a
 * silhouette says "a photo of a person goes here" better than detail would.
 */
function MotifShapes({ motif }: { motif: Motif }) {
  const stroke = "rgba(255,255,255,0.42)";
  const fill = "rgba(255,255,255,0.11)";
  const common = { fill, stroke, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  switch (motif) {
    case "portrait":
      return (
        <g {...common}>
          <circle cx="60" cy="58" r="20" />
          <path d="M28 104c0-17 14-28 32-28s32 11 32 28" />
        </g>
      );
    case "body":
      return (
        <g {...common}>
          <circle cx="60" cy="40" r="13" />
          <path d="M42 62h36l-5 30H47z" />
          <path d="M47 92l-4 26M73 92l4 26" fill="none" />
        </g>
      );
    case "group":
      return (
        <g {...common}>
          <circle cx="42" cy="58" r="15" />
          <circle cx="80" cy="58" r="15" />
          <path d="M18 104c0-13 11-22 24-22s24 9 24 22" />
          <path d="M56 104c0-13 11-22 24-22s24 9 24 22" />
        </g>
      );
    case "pet":
      return (
        <g {...common}>
          <circle cx="60" cy="72" r="22" />
          <path d="M40 52l-4-18 16 8M80 52l4-18-16 8" />
          <circle cx="52" cy="70" r="2.5" stroke="none" fill={stroke} />
          <circle cx="68" cy="70" r="2.5" stroke="none" fill={stroke} />
        </g>
      );
    case "product":
      return (
        <g {...common}>
          <path d="M34 58l26-14 26 14v34L60 106 34 92z" />
          <path d="M34 58l26 14 26-14M60 72v34" fill="none" />
        </g>
      );
    case "vehicle":
      return (
        <g {...common}>
          <path d="M26 82l8-20h52l8 20v14H26z" />
          <circle cx="42" cy="98" r="8" />
          <circle cx="78" cy="98" r="8" />
        </g>
      );
    case "place":
      return (
        <g {...common}>
          <path d="M26 74L60 46l34 28v32H26z" />
          <path d="M50 106V84h20v22" fill="none" />
        </g>
      );
    case "restore":
      return (
        <g {...common}>
          <rect x="28" y="42" width="64" height="66" rx="4" />
          <path d="M36 92l16-18 12 12 10-10 14 16" fill="none" />
          <path d="M76 42l-14 66" fill="none" strokeDasharray="5 6" />
        </g>
      );
    case "sharpen":
      return (
        <g {...common}>
          <rect x="28" y="46" width="42" height="42" rx="3" />
          <rect x="62" y="66" width="30" height="30" rx="3" />
          <path d="M70 46l22 20" fill="none" strokeDasharray="4 5" />
        </g>
      );
    case "art":
      return (
        <g {...common}>
          <path d="M60 40c18 0 32 13 32 29 0 11-9 15-16 15-6 0-9 3-9 8 0 6-4 10-11 10-17 0-28-13-28-30 0-18 15-32 32-32z" />
          <circle cx="48" cy="62" r="4" stroke="none" fill={stroke} />
          <circle cx="70" cy="58" r="4" stroke="none" fill={stroke} />
        </g>
      );
    case "text":
      return (
        <g {...common}>
          <rect x="26" y="46" width="68" height="56" rx="5" />
          <path d="M38 68h44M38 82h30" fill="none" />
        </g>
      );
  }
}

export default function ToolArtwork({
  slug,
  name,
  emoji,
  gradient,
  note,
}: {
  slug: string;
  name: string;
  emoji?: string;
  /** The app's own two-stop palette. */
  gradient: [string, string];
  /** Optional line under the name, e.g. "Example coming soon". */
  note?: string;
}) {
  const motif = motifFor(slug, name);
  const id = `ta-${slug.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox="0 0 120 150"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${name} — example image coming soon`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <rect width="120" height="150" fill={`url(#${id})`} />
      {/* A soft wash at the foot, so the note reads on a pale palette. */}
      <rect y="108" width="120" height="42" fill="rgba(11,11,14,0.30)" />
      {/* Scaled down and lifted: at hero size a full-bleed silhouette reads as
          a mistake rather than as artwork, and the name needs room below. */}
      <g transform="translate(60,66) scale(0.74) translate(-60,-72)">
        <MotifShapes motif={motif} />
      </g>
      {emoji && (
        <text x="60" y="30" textAnchor="middle" fontSize="13">{emoji}</text>
      )}
      {/*
        The name is deliberately not drawn here. Every place this appears — the
        homepage panels, the gallery cards, the hub, the related grid — already
        prints the app's name beside or beneath the image, and having it twice
        looked like a mistake. The accessible name is on the <svg> itself.
      */}
      {note && (
        <text
          x="60" y="133" textAnchor="middle"
          fontSize="6" fontWeight="600" fill="rgba(255,255,255,0.78)"
          style={{ fontFamily: "inherit" }}
        >
          {note}
        </text>
      )}
    </svg>
  );
}
