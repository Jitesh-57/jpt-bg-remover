"use client";

import { useEffect, useState } from "react";

interface HistoryItem {
  id: string;
  name: string;
  createdTime: string;
  downloadUrl: string;
  viewUrl: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history/list");
      if (res.status === 401) {
        setError("Please sign in to view history");
        return;
      }
      const data = (await res.json()) as { history: HistoryItem[] };
      setHistory(data.history || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (fileId: string) => {
    if (!confirm("Delete this image from history?")) return;
    setDeleting(fileId);
    try {
      const res = await fetch("/api/history/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (res.ok) {
        setHistory(history.filter(item => item.id !== fileId));
      } else {
        setError("Failed to delete");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const getToolName = (name: string) => {
    if (name.includes("remove-bg")) return "🗑️ Background Removed";
    if (name.includes("upscale")) return "🔍 Upscaled";
    if (name.includes("ai-edit")) return "✨ AI Edited";
    if (name.includes("ai-background")) return "🌅 Background Added";
    return "📝 Edited";
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px", minHeight: "100vh", background: "#F9FAFB" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, marginBottom: 8 }}>📊 Transformation History</h1>
        <p style={{ margin: 0, color: "#666", fontSize: 14 }}>All your edits are automatically saved to Google Drive</p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <p>Loading history...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: 20, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, color: "#DC2626", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!loading && history.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, border: "2px dashed #E5E7EB" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <p style={{ fontSize: 16, color: "#666", marginBottom: 16 }}>No transformations yet</p>
          <a href="/editor" style={{ display: "inline-block", padding: "10px 20px", background: "#6366F1", color: "#fff", textDecoration: "none", borderRadius: 6, fontWeight: 600 }}>
            Start Editing →
          </a>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {history.map(item => (
            <div key={item.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "all 0.2s" }}>
              {/* Thumbnail preview */}
              <div style={{ width: "100%", height: 200, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img
                  src={item.downloadUrl}
                  alt={item.name}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) parent.innerHTML = '<div style="color:#999;fontSize:14px">Image unavailable</div>';
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#6366F1", marginBottom: 4 }}>
                  {getToolName(item.name)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                  {formatTime(item.createdTime)}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={item.downloadUrl}
                    download
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#6366F1",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    ⬇️ Download
                  </a>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deleting === item.id}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#FEE2E2",
                      color: "#DC2626",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: deleting === item.id ? 0.6 : 1,
                    }}
                  >
                    {deleting === item.id ? "🗑️ Deleting..." : "🗑️ Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <a href="/editor" style={{ color: "#6366F1", textDecoration: "none", fontWeight: 600 }}>
          ← Back to Editor
        </a>
      </div>
    </div>
  );
}
