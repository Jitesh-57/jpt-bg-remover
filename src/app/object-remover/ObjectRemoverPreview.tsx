"use client";

import ObjectRemoverTool, { type SelectMethod } from "./ObjectRemoverTool";

/**
 * In review: the owner compares the ways to select before one is chosen.
 * The bar switches between them; it goes when the choice is made.
 */
const OPTIONS: { id: string; label: string; methods: SelectMethod[] }[] = [
  { id: "brush", label: "Option 1 · Brush", methods: ["brush"] },
  { id: "lasso", label: "Option 2 · Lasso", methods: ["lasso"] },
  { id: "box", label: "Option 3 · Box", methods: ["box"] },
  { id: "all", label: "All three together", methods: ["brush", "lasso", "box"] },
];

export default function ObjectRemoverPreview({ select }: { select: string }) {
  const chosen = OPTIONS.find((o) => o.id === select) ?? OPTIONS[3];
  return (
    <>
      <nav aria-label="Selection options" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 18 }}>
        {OPTIONS.map((o) => {
          const on = o.id === chosen.id;
          return (
            <a key={o.id} href={`/object-remover?select=${o.id}#tool`}
              style={{
                padding: "8px 14px", borderRadius: 999, fontSize: 13.5, fontWeight: 800, textDecoration: "none",
                color: on ? "#fff" : "var(--text)", background: on ? "var(--grad-strong)" : "var(--surface-2)", border: "1px solid var(--border-strong)",
              }}>
              {o.label}
            </a>
          );
        })}
      </nav>
      <ObjectRemoverTool key={chosen.id} methods={chosen.methods} />
    </>
  );
}
