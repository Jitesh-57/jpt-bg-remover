/**
 * Pixel Shine brand logo: the orange ✦ and the typeset "Pixel Shine" name.
 *
 * Typeset rather than an uploaded image, so it is identical everywhere, crisp
 * at any size and never waits on a file to load.
 */
type Variant = "wordmark" | "full" | "mark";

export default function BrandLogo({
  height = 30,
  variant = "wordmark",
  dark = false,
}: {
  height?: number;
  /** "mark" is the ✦ alone; the others add the name. */
  variant?: Variant;
  /** True when the logo sits on a light surface. */
  dark?: boolean;
}) {
  return (
    <span aria-label="Pixel Shine" role="img" style={{ display: "inline-flex", alignItems: "center", gap: Math.round(height * 0.24), lineHeight: 1 }}>
      <span aria-hidden style={{ fontSize: Math.round(height * 0.62), fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>✦</span>
      {variant !== "mark" && (
        <span aria-hidden style={{ fontSize: Math.round(height * 0.54), fontWeight: 900, letterSpacing: "-0.03em", whiteSpace: "nowrap", lineHeight: 1 }}>
          <span style={{ color: dark ? "#0B0B0E" : "var(--text)" }}>Pixel</span>{" "}
          <span className="jpt-grad-text">Shine</span>
        </span>
      )}
    </span>
  );
}
