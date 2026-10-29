/**
 * A visible "TODO (owner)" note for words only the site owner can supply —
 * the [ADD: …] items in an SEO change request: test results, names, dates.
 *
 * Shown in local and preview builds so the owner sees what's missing; renders
 * nothing in production (VERCEL_ENV is read at build time), so an unfilled
 * note can never reach visitors. Sections made only of owner content check
 * SHOW_TODOS and stay out of production until they're filled in.
 */
export const SHOW_TODOS = process.env.VERCEL_ENV !== "production";

export default function OwnerTodo({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
  if (!SHOW_TODOS) return null;
  const style: React.CSSProperties = {
    border: "1.5px dashed #D97706", background: "rgba(245,158,11,.12)", color: "#B45309",
    borderRadius: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.5,
  };
  if (inline) return <span style={{ ...style, padding: "1px 6px", display: "inline" }}>TODO (owner): {children}</span>;
  return <div role="note" style={{ ...style, padding: "10px 14px", margin: "10px 0", textAlign: "left" }}>TODO (owner): {children}</div>;
}
