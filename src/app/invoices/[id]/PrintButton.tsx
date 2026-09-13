"use client";

/**
 * Print / save as PDF.
 *
 * A client component purely so the invoice page itself can stay a server
 * component — it reads the buyer's session, and that check belongs on the
 * server. The browser's print dialog is also how a PDF gets made, so there is
 * no PDF library here to keep in step with the layout.
 */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "10px 18px", borderRadius: 11, border: "none",
        background: "var(--grad-strong)", color: "#fff",
        fontWeight: 800, fontSize: 14.5, fontFamily: "inherit", cursor: "pointer",
      }}
    >
      ⬇ Print / save as PDF
    </button>
  );
}
