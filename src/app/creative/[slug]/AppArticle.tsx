import type { AppSection } from "@/lib/app-pages/types";

/**
 * The written part of an app that has its own page (lib/app-pages): one
 * readable column of question-led sections, with a contents list at the top
 * so a reader can jump to the one question they came with. Server-rendered,
 * so every word is in the HTML.
 */

/** **bold** and [words](/path) inside one line. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text)", fontWeight: 750 }}>{part.slice(2, -2)}</strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      return <a key={i} href={link[2]} style={{ color: "var(--accent)", fontWeight: 700, textUnderlineOffset: 3 }}>{link[1]}</a>;
    }
    return part;
  });
}

/** "Which Ghibli looks can I pick?" → "which-ghibli-looks-can-i-pick" */
function anchor(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const h2: React.CSSProperties = { fontSize: "clamp(1.45rem,2.6vw,1.9rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 18px", letterSpacing: "-0.02em", lineHeight: 1.25, scrollMarginTop: 90 };
const h3: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "26px 0 6px", lineHeight: 1.35 };
const p: React.CSSProperties = { margin: "0 0 16px" };

export default function AppArticle({ sections }: { sections: AppSection[] }) {
  return (
    <section style={{ padding: "76px 24px", background: "var(--bg)" }}>
      <article style={{ maxWidth: 760, margin: "0 auto", fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.8 }}>
        {/* role, not <nav>: the phone stylesheet keeps every link in a <nav> on one line. */}
        <div role="navigation" aria-label="On this page" style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface)", padding: "18px 22px", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 10 }}>On this page</div>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 15, lineHeight: 1.5 }}>
            {sections.map((s) => (
              <li key={s.heading}>
                <a href={`#${anchor(s.heading)}`} style={{ color: "var(--text)", textDecoration: "none" }}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </div>

        {sections.map((s, i) => (
          <section key={s.heading} style={{ marginTop: i ? 56 : 0 }}>
            <h2 id={anchor(s.heading)} style={h2}>{s.heading}</h2>
            {s.paragraphs?.map((text, j) => <p key={j} style={p}>{inline(text)}</p>)}
            {s.items?.map((item) => (
              <div key={item.t}>
                <h3 style={h3}>{item.t}</h3>
                <p style={p}>{inline(item.d)}</p>
              </div>
            ))}
            {s.list && (
              <ul style={{ margin: "0 0 16px", paddingLeft: 22, display: "grid", gap: 8 }}>
                {s.list.map((text, j) => <li key={j}>{inline(text)}</li>)}
              </ul>
            )}
            {s.after?.map((text, j) => <p key={j} style={p}>{inline(text)}</p>)}
          </section>
        ))}
      </article>
    </section>
  );
}
