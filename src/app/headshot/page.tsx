"use client";

import "./headshot.css";
import { useRef, useState, useCallback, useEffect } from "react";
import PricingModal from "@/app/_components/PricingModal";
import { WOMEN_STYLES, MEN_STYLES } from "@/lib/headshot-prompts";
import { headshotThumbUrl } from "@/lib/headshot-thumbs";

const PRESET_COLORS = [
  { label: "White", color: "#FFFFFF" },
  { label: "Light Gray", color: "#F0F0F0" },
  { label: "Cream", color: "#F5ECD7" },
  { label: "Beige", color: "#E8DCC8" },
  { label: "Sky Blue", color: "#B8D4E8" },
  { label: "Navy", color: "#1A2B4A" },
  { label: "Forest", color: "#2D5A3D" },
  { label: "Burgundy", color: "#722F37" },
  { label: "Dark Red", color: "#8B2500" },
  { label: "Terracotta", color: "#C04A1E" },
  { label: "Charcoal", color: "#2C2C2C" },
  { label: "Black", color: "#000000" },
];

interface GeneratedImage { id: number; name: string; tag: string; url: string; }
interface LibraryItem { id: string; url: string; name: string; tag: string; type: "generated" | "edited"; savedAt: number; }
interface LightboxItem { url: string; name: string; tag: string; onEdit?: () => void; onDelete?: () => void; }
interface PendingColor { color: string; label: string; }

type Step = "upload" | "styles" | "gallery" | "edit";
type Gender = "women" | "men";

const GENERATION_CREDITS = 2;
const EDIT_CREDITS = 2;

// ── Thumbnail helpers for My Generations ──────────────────────────────────────
function makeThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const MAX = 150;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}

function makePreview(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const MAX = 900;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function downloadImage(url: string, filename: string) {
  try {
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
  } catch { window.open(url, "_blank"); }
}

export default function HeadshotPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeFileRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [gender, setGender] = useState<Gender>("women");

  // One-time: drive generation of any missing style thumbnails (idempotent, self-terminating).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 24 && !cancelled; i++) {
        try {
          const r = await fetch("/api/cron/headshot-thumbs?token=jptblog2026", { cache: "no-store" });
          const d = (await r.json()) as { done?: boolean; remaining?: number };
          if (d.done || (d.remaining ?? 0) <= 0) break;
        } catch {
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);
  const [editingBg, setEditingBg] = useState(false);
  const [customColor, setCustomColor] = useState("#4A90D9");
  const [pendingColor, setPendingColor] = useState<PendingColor | null>(null);
  const [pendingBgFile, setPendingBgFile] = useState<File | null>(null);
  const [pendingBgFileName, setPendingBgFileName] = useState("");
  const [promptInput, setPromptInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libFilter, setLibFilter] = useState<"all" | "generated" | "edited">("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; credits: number; plan?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then(r => r.json())
      .then((d: { authenticated: boolean; email?: string; name?: string; credits?: number; plan?: string }) => {
        if (d.authenticated && d.email) setUser({ email: d.email, name: d.name ?? "", credits: d.credits ?? 0, plan: d.plan });
      }).catch(() => null);
  }, []);

  // Restore the uploaded photo + styles step after a refresh (no bounce to upload).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jpt_hs_session");
      if (!raw) return;
      const saved = JSON.parse(raw) as { sourceUrl?: string; gender?: Gender };
      if (saved.sourceUrl) {
        setSourceUrl(saved.sourceUrl);
        setSourcePreview(saved.sourceUrl);
        if (saved.gender) setGender(saved.gender);
        setStep("styles");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!showLightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLightbox(false);
      if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(i + 1, lightboxItems.length - 1));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showLightbox, lightboxItems.length]);

  const openLightbox = (items: LightboxItem[], index = 0) => { setLightboxItems(items); setLightboxIndex(index); setShowLightbox(true); };
  const closeLightbox = () => setShowLightbox(false);

  const addToLibrary = (items: LibraryItem[]) => setLibrary((prev) => [...items, ...prev]);
  const removeFromLibrary = (predicate: (item: LibraryItem) => boolean) =>
    setLibrary((prev) => prev.filter((item) => !predicate(item)));

  const clearPending = () => { setPendingColor(null); setPendingBgFile(null); setPendingBgFileName(""); };

  // Save to My Generations (non-blocking — localStorage primary, EC best-effort)
  const saveToGenerations = async (url: string, localId: string, tool: string, category: "generation" | "edit", label: string) => {
    try {
      const [thumb, preview] = await Promise.all([makeThumbnail(url), makePreview(url)]);
      if (!thumb) return;

      const id = localId || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item = { id, tool, category, label, thumb, timestamp: Date.now() };

      // 1. Save to localStorage immediately
      try {
        const raw = localStorage.getItem("jpt_gens_v1");
        const existing = raw ? JSON.parse(raw) as typeof item[] : [];
        const updated = [item, ...existing.filter(i => i.id !== id)].slice(0, 30);
        localStorage.setItem("jpt_gens_v1", JSON.stringify(updated));
      } catch { /* storage full */ }

      // 2. Save 900px preview
      if (preview) {
        try { localStorage.setItem(`jpt_img_${id}`, preview); } catch { /* storage full */ }
      }

      // 3. Also try EC (best-effort)
      fetch("/api/generations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, category, label, thumb }),
      }).catch(() => {});
    } catch { /* non-critical */ }
  };

  const activeStyles = gender === "women" ? WOMEN_STYLES : MEN_STYLES;
  const switchGender = (g: Gender) => { setGender(g); setSelectedStyleIds([]); };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSourcePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/headshot/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || `Upload failed (${res.status})`);
      setSourceUrl(data.url);
      setStep("styles");
      // Persist so a refresh keeps the user on the styles step with their photo.
      try { localStorage.setItem("jpt_hs_session", JSON.stringify({ sourceUrl: data.url, gender })); } catch {}
    } catch (e) { setError((e as Error).message); setSourcePreview(null); }
    finally { setUploading(false); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const toggleStyle = (id: number) =>
    setSelectedStyleIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleGenerate = async () => {
    if (!sourceUrl || selectedStyleIds.length === 0) return;
    // Check credits immediately before making any API call
    const creditsRequired = selectedStyleIds.length * GENERATION_CREDITS;
    if (!user || user.credits < creditsRequired) {
      setShowPricingModal(true);
      return;
    }
    setGenerating(true);
    setError(null);
    setImages([]);
    setProgress(`Generating ${selectedStyleIds.length} headshot${selectedStyleIds.length > 1 ? "s" : ""}…`);
    try {
      const res = await fetch("/api/headshot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: sourceUrl, styleIds: selectedStyleIds, gender }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || res.status === 403) { setShowPricingModal(true); return; }
        throw new Error(data.error || "Generation failed");
      }
      if (!data.images || data.images.length === 0) throw new Error(data.errors?.[0] || "No images generated");
      setImages(data.images);
      setStep("gallery");
      const now = Date.now();
      addToLibrary(data.images.map((img: GeneratedImage, i: number) => ({
        id: `gen-${img.id}-${now + i}`, url: img.url, name: img.name, tag: img.tag, type: "generated" as const, savedAt: now + i,
      })));
      // Save every generated headshot to My Generations
      data.images.forEach((img: GeneratedImage) => {
        saveToGenerations(img.url, String(img.id), "headshot", "generation", img.name || "Headshot");
      });
    } catch (e) { setError((e as Error).message); }
    finally { setGenerating(false); setProgress(""); }
  };

  const handleSelectImage = (img: GeneratedImage) => {
    setSelectedImage(img);
    setEditedUrl(null);
    setPromptInput("");
    clearPending();
    setStep("edit");
  };

  const handleEditFromLibrary = (item: LibraryItem) => {
    const img: GeneratedImage = { id: 0, url: item.url, name: item.name, tag: item.tag };
    setImages([img]);
    setSelectedImage(img);
    setEditedUrl(null);
    setPromptInput("");
    clearPending();
    setShowLibrary(false);
    setShowLightbox(false);
    setStep("edit");
  };

  const persistEdit = (url: string, name: string, tag: string) => {
    const editId = `edit-${Date.now()}`;
    addToLibrary([{ id: editId, url, name, tag, type: "edited", savedAt: Date.now() }]);
    saveToGenerations(url, editId, "headshot-edit", "edit", name);
  };

  const handleApplyBackground = async () => {
    if (!selectedImage || editingBg) return;
    if (!user || user.credits < EDIT_CREDITS) { setShowPricingModal(true); return; }
    setEditingBg(true);
    setEditedUrl(null);
    setError(null);

    if (pendingColor) {
      const { color, label } = pendingColor;
      setPendingColor(null);
      try {
        const res = await fetch("/api/headshot/edit-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: selectedImage.url, bgType: "color", bgColor: color, bgLabel: label }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 402 || res.status === 403) { setShowPricingModal(true); return; }
          throw new Error(data.error || "Edit failed");
        }
        setEditedUrl(data.url);
        persistEdit(data.url, `${selectedImage.name} · ${label}`, "Color Edit");
      } catch (e) { setError((e as Error).message); }
    } else if (pendingBgFile) {
      const file = pendingBgFile;
      setPendingBgFile(null);
      setPendingBgFileName("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const upRes = await fetch("/api/headshot/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.url) throw new Error(upData.error || "Background upload failed");
        const res = await fetch("/api/headshot/edit-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: selectedImage.url, bgType: "image", bgImageUrl: upData.url }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 402 || res.status === 403) { setShowPricingModal(true); return; }
          throw new Error(data.error || "Edit failed");
        }
        setEditedUrl(data.url);
        persistEdit(data.url, `${selectedImage.name} · Custom BG`, "Image Edit");
      } catch (e) { setError((e as Error).message); }
    }
    setEditingBg(false);
  };

  const handleEditByPrompt = async () => {
    if (!selectedImage || !promptInput.trim()) return;
    if (!user || user.credits < EDIT_CREDITS) { setShowPricingModal(true); return; }
    setEditingBg(true);
    setEditedUrl(null);
    clearPending();
    setError(null);
    try {
      const res = await fetch("/api/headshot/edit-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selectedImage.url, bgType: "prompt", customPrompt: promptInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || res.status === 403) { setShowPricingModal(true); return; }
        throw new Error(data.error || "Edit failed");
      }
      setEditedUrl(data.url);
      persistEdit(data.url, `${selectedImage.name} · AI Edit`, "Prompt Edit");
    } catch (e) { setError((e as Error).message); }
    finally { setEditingBg(false); }
  };

  const handleDownload = async (url: string, name: string, id: string) => {
    setDownloading(id);
    await downloadImage(url, `${name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.jpg`);
    setDownloading(null);
  };

  const handleDeleteLibraryItem = (item: LibraryItem) => {
    if (!window.confirm("Delete this image from My Library?")) return;
    removeFromLibrary((entry) => entry.id === item.id);
    setShowLightbox(false);
    if (editedUrl === item.url) setEditedUrl(null);
    if (selectedImage?.url === item.url && step === "edit") {
      setSelectedImage(null);
      setEditedUrl(null);
      clearPending();
      setStep(images.length > 0 ? "gallery" : "upload");
    }
  };

  const handleDeleteGalleryImage = (img: GeneratedImage) => {
    if (!window.confirm("Delete this image from this session and My Library?")) return;
    const remainingImages = images.filter((image) => image.url !== img.url);
    setImages(remainingImages);
    removeFromLibrary((entry) => entry.type === "generated" && entry.url === img.url);
    setShowLightbox(false);
    if (selectedImage?.url === img.url) {
      setSelectedImage(null);
      setEditedUrl(null);
      clearPending();
      setStep(remainingImages.length > 0 ? "gallery" : "upload");
    } else if (step === "gallery" && remainingImages.length === 0) {
      setStep("upload");
    }
  };

  const reset = () => {
    try { localStorage.removeItem("jpt_hs_session"); } catch {}
    setStep("upload");
    setSourcePreview(null);
    setSourceUrl(null);
    setImages([]);
    setSelectedImage(null);
    setEditedUrl(null);
    setError(null);
    setSelectedStyleIds([1, 2, 3, 4]);
    setShowLibrary(false);
    setShowLightbox(false);
    clearPending();
  };

  const displayUrl = editedUrl || selectedImage?.url || null;
  const filteredLibrary = libFilter === "all" ? library : library.filter((i) => i.type === libFilter);
  const sortedLibrary = [...filteredLibrary].sort((a, b) => b.savedAt - a.savedAt);
  const galleryLbItems: LightboxItem[] = images.map((img) => ({ url: img.url, name: img.name, tag: img.tag, onEdit: () => handleSelectImage(img), onDelete: () => handleDeleteGalleryImage(img) }));
  const libraryLbItems: LightboxItem[] = sortedLibrary.map((item) => ({ url: item.url, name: item.name, tag: item.tag, onEdit: () => handleEditFromLibrary(item), onDelete: () => handleDeleteLibraryItem(item) }));
  const lbCurrent = lightboxItems[lightboxIndex];

  const hasPending = !!pendingColor || !!pendingBgFile;
  const generationCreditCost = selectedStyleIds.length * GENERATION_CREDITS;

  return (
    <div style={s.root}>
      {showPricingModal && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          onPurchaseSuccess={(_, newCredits) => {
            setUser(u => u ? { ...u, credits: newCredits, plan: "paid" } : u);
            setShowPricingModal(false);
          }}
          prefillUser={user ? { name: user.name, email: user.email } : undefined}
        />
      )}

      {/* ── LIGHTBOX ── */}
      {showLightbox && lbCurrent && (
        <div className="hs-lightbox" style={s.lbOverlay} onClick={closeLightbox}>
          <div style={s.lbModal} onClick={(e) => e.stopPropagation()}>
            <div style={s.lbTopBar}>
              {lightboxItems.length > 1 && <span style={s.lbCounter}>{lightboxIndex + 1} / {lightboxItems.length}</span>}
              <div style={{ flex: 1 }} />
              <button style={s.lbClose} onClick={closeLightbox}>✕</button>
            </div>
            <div style={s.lbImgRow}>
              <button style={{ ...s.lbNav, opacity: lightboxIndex === 0 ? 0.2 : 1, pointerEvents: lightboxIndex === 0 ? "none" : "auto" }} onClick={() => setLightboxIndex((i) => Math.max(i - 1, 0))}>‹</button>
              <img key={lightboxIndex} className="hs-lightbox-img" src={lbCurrent.url} alt={lbCurrent.name} style={s.lbImg} />
              <button style={{ ...s.lbNav, opacity: lightboxIndex === lightboxItems.length - 1 ? 0.2 : 1, pointerEvents: lightboxIndex === lightboxItems.length - 1 ? "none" : "auto" }} onClick={() => setLightboxIndex((i) => Math.min(i + 1, lightboxItems.length - 1))}>›</button>
            </div>
            <div style={s.lbFooter}>
              <div>
                <div style={s.lbName}>{lbCurrent.name}</div>
                <div style={s.lbTag}>{lbCurrent.tag}</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                {lbCurrent.onEdit && (
                  <button style={s.lbEditBtn} onClick={() => { closeLightbox(); lbCurrent.onEdit?.(); }}>✏️ Edit Background</button>
                )}
                {lbCurrent.onDelete && (
                  <button style={s.lbDeleteBtn} onClick={() => lbCurrent.onDelete?.()}>Delete</button>
                )}
                <button style={{ ...s.lbDlBtn, ...(downloading === "lb" ? { opacity: 0.6 } : {}) }} disabled={downloading === "lb"} onClick={() => handleDownload(lbCurrent.url, lbCurrent.name, "lb")}>
                  {downloading === "lb" ? "Saving…" : "⬇ Download"}
                </button>
              </div>
            </div>
            {lightboxItems.length > 1 && (
              <div style={s.lbStrip}>
                {lightboxItems.map((item, i) => (
                  <img key={i} src={item.url} alt={item.name} onClick={() => setLightboxIndex(i)}
                    style={{ ...s.lbThumb, outline: i === lightboxIndex ? "2px solid #6366F1" : "2px solid transparent", opacity: i === lightboxIndex ? 1 : 0.55 }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo} onClick={reset}><span>⚡</span><span style={s.logoText}>Headshot AI</span></div>
          {!showLibrary && (
            <div style={s.stepBar}>
              {(["upload", "styles", "gallery", "edit"] as Step[]).map((st, i) => (
                <div key={st} style={s.stepItem}>
                  <div style={{ ...s.stepDot, ...(step === st ? s.stepDotActive : steps.indexOf(step) > i ? s.stepDotDone : {}) }}>{steps.indexOf(step) > i ? "✓" : i + 1}</div>
                  <span style={{ ...s.stepLabel, ...(step === st ? { color: "#6366F1", fontWeight: 700 } : {}) }}>{["Upload", "Choose Styles", "Gallery", "Edit"][i]}</span>
                  {i < 3 && <div style={s.stepLine} />}
                </div>
              ))}
            </div>
          )}
          <div style={s.headerActions}>
            <button style={{ ...s.ghostBtn, ...(showLibrary ? { background: "#EEEEFF", borderColor: "#6366F1", color: "#6366F1" } : {}) }} onClick={() => setShowLibrary((v) => !v)}>
              📁 My Library {library.length > 0 && <span style={s.libBadge}>{library.length}</span>}
            </button>
            {!showLibrary && step !== "upload" && <button style={s.ghostBtn} onClick={reset}>New Session</button>}
            {!showLibrary && step === "edit" && <button style={s.ghostBtn} onClick={() => setStep("gallery")}>← Gallery</button>}
          </div>
        </div>
      </header>

      <main style={s.canvas}>
        <div style={s.dots} />

        {/* ── LIBRARY ── */}
        {showLibrary && (
          <div style={s.galleryLayout}>
            <div style={s.galleryHeader}>
              <div><h2 style={s.h2}>My Library</h2><p style={s.sub2}>All generated and edited headshots from this session</p></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {(["all", "generated", "edited"] as const).map((f) => (
                  <button key={f} style={{ ...s.tinyBtn, ...(libFilter === f ? { background: "#EEEEFF", borderColor: "#6366F1", color: "#6366F1", fontWeight: 700 } : {}) }} onClick={() => setLibFilter(f)}>
                    {f === "all" ? `All (${library.length})` : f === "generated" ? `Generated (${library.filter(i => i.type === "generated").length})` : `Edited (${library.filter(i => i.type === "edited").length})`}
                  </button>
                ))}
              </div>
            </div>
            {filteredLibrary.length === 0 ? (
              <div style={s.emptyLib}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>No headshots yet</p>
                <p style={{ margin: "6px 0 0", color: "#888", fontSize: 13 }}>Generate headshots and they&apos;ll appear here automatically</p>
                <button style={{ ...s.primaryBtn, marginTop: 20, width: "auto", padding: "12px 24px" }} onClick={() => setShowLibrary(false)}>✨ Generate Headshots</button>
              </div>
            ) : (
              <div style={s.imageGrid}>
                {sortedLibrary.map((item, idx) => (
                  <div key={item.id} style={s.imgCard} className="hs-card">
                    <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => openLightbox(libraryLbItems, idx)}>
                      <img src={item.url} alt={item.name} style={s.cardImg} />
                      <div className="hs-hover" style={s.cardHover}>🔍 Preview</div>
                    </div>
                    <div style={s.cardMeta}>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 2, minWidth: 0 }}>
                        <span style={{ ...s.cardName, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.name}</span>
                        <span style={{ ...s.cardTag, alignSelf: "flex-start", background: item.type === "edited" ? "#FFF0E8" : "#EEEEF8", color: item.type === "edited" ? "#C05A00" : "#6366F1" }}>{item.tag}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button style={{ ...s.dlIconBtn, background: "#EEEEFF", borderColor: "#C4C4F0", color: "#6366F1" }} title="Edit" onClick={() => handleEditFromLibrary(item)}>✏️</button>
                        <button style={s.dlIconBtn} title="Download" onClick={() => handleDownload(item.url, item.name, item.id)} disabled={downloading === item.id}>
                          {downloading === item.id ? <span style={{ ...s.spin, width: 14, height: 14 }} /> : "⬇"}
                        </button>
                        <button style={s.dangerIconBtn} title="Delete" onClick={() => handleDeleteLibraryItem(item)}>×</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Upload ── */}
        {!showLibrary && step === "upload" && (
          <div style={s.card}>
            <h1 style={s.h1}>Generate Professional Headshots</h1>
            <p style={s.sub}>Upload your photo — AI will create stunning headshot variants in your chosen styles</p>
            <div style={{ ...s.dropzone, ...(dragOver ? s.dropActive : {}) }} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {sourcePreview ? (
                <div style={s.previewBox}>
                  <img src={sourcePreview} alt="preview" style={s.previewImg} />
                  {uploading && <div style={s.overlay}><span style={s.spin} /><span style={{ color: "#fff", fontSize: 13, marginTop: 8 }}>Uploading…</span></div>}
                </div>
              ) : (
                <div style={s.dropContent}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                  <p style={s.dropTitle}>Drop your photo here or click to browse</p>
                  <p style={s.dropHint}>JPG, PNG, WEBP — best results with a clear face photo</p>
                </div>
              )}
            </div>
            {error && <div style={s.err}>{error}</div>}
          </div>
        )}

        {/* ── STEP 2: Choose Styles ── */}
        {!showLibrary && step === "styles" && (
          <div style={s.stylesLayout}>
            <div style={s.sourceThumb}>
              {sourcePreview && <img src={sourcePreview} alt="source" style={s.srcImg} />}
              <p style={s.srcLabel}>Your photo</p>
              <input ref={changeFileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <button
                onClick={() => changeFileRef.current?.click()}
                disabled={uploading}
                style={{ marginTop: 8, width: "100%", padding: "8px 12px", background: "#fff", color: "#6366F1", border: "1.5px solid #C7D2FE", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: uploading ? "default" : "pointer" }}>
                {uploading ? "Uploading…" : "🔄 Change Photo"}
              </button>
            </div>
            <div style={s.stylesPanel}>
              <div style={s.stylesPanelHeader}>
                <div>
                  <h2 style={s.h2}>Choose Headshot Styles</h2>
                  <p style={s.sub2}>Select the styles you want to generate ({selectedStyleIds.length} selected)</p>
                </div>
                <div style={s.quickBtns}>
                  <button style={s.tinyBtn} onClick={() => setSelectedStyleIds(activeStyles.map(st => st.id))}>All</button>
                  <button style={s.tinyBtn} onClick={() => setSelectedStyleIds([])}>None</button>
                </div>
              </div>
              <div style={s.genderRow}>
                <button style={{ ...s.genderBtn, ...(gender === "women" ? s.genderBtnActive : {}) }} onClick={() => switchGender("women")}>👩 Women</button>
                <button style={{ ...s.genderBtn, ...(gender === "men" ? s.genderBtnActive : {}) }} onClick={() => switchGender("men")}>👨 Men</button>
              </div>
              <div style={s.styleGrid}>
                {activeStyles.map((style) => {
                  const sel = selectedStyleIds.includes(style.id);
                  return (
                    <button key={style.id} style={{ ...s.styleCard, ...(sel ? s.styleCardSel : {}) }} onClick={() => toggleStyle(style.id)}>
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", marginBottom: 8, background: "#EEF0F6" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={headshotThumbUrl(gender, style.id)}
                          alt={`${style.name} headshot style`}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                        />
                        <div style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: "50%", background: sel ? "#6366F1" : "rgba(255,255,255,0.9)", color: sel ? "#fff" : "#6366F1", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{sel ? "✓" : style.id}</div>
                      </div>
                      <div style={s.styleName}>{style.name}</div>
                      <div style={s.styleTag}>{style.tag}</div>
                    </button>
                  );
                })}
              </div>
              {error && <div style={s.err}>{error}</div>}
              <button
                style={{ ...s.primaryBtn, ...(selectedStyleIds.length === 0 || generating ? s.btnOff : {}) }}
                onClick={handleGenerate}
                disabled={selectedStyleIds.length === 0 || generating}
              >
                {generating ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                    <span style={s.spin} />{progress || "Generating…"}
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span>✨ Generate {selectedStyleIds.length} Headshot{selectedStyleIds.length !== 1 ? "s" : ""}</span>
                    <span style={s.costBadge}>
                      {generationCreditCost} credits{selectedStyleIds.length > 1 ? ` · ${GENERATION_CREDITS} each` : ""}
                    </span>
                  </span>
                )}
              </button>
              {generating && <p style={s.progressNote}>This takes 1–2 min per style. Please keep the tab open.</p>}
            </div>
          </div>
        )}

        {/* ── STEP 3: Gallery ── */}
        {!showLibrary && step === "gallery" && (
          <div style={s.galleryLayout}>
            <div style={s.galleryHeader}>
              <div><h2 style={s.h2}>Your Headshots</h2><p style={s.sub2}>Click any image to preview · use ✏️ to edit background</p></div>
              {sourcePreview && <img src={sourcePreview} alt="source" style={s.galleryThumb} />}
            </div>
            <div style={s.imageGrid}>
              {images.map((img, idx) => (
                <div key={img.id} className="hs-card" style={s.imgCard}>
                  <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => openLightbox(galleryLbItems, idx)}>
                    <img src={img.url} alt={img.name} style={s.cardImg} />
                    <div className="hs-hover" style={s.cardHover}>🔍 Preview</div>
                  </div>
                  <div style={s.cardMeta}>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
                      <span style={s.cardName}>{img.name}</span>
                      <span style={{ ...s.cardTag, alignSelf: "flex-start" }}>{img.tag}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button style={{ ...s.dlIconBtn, background: "#EEEEFF", borderColor: "#C4C4F0", color: "#6366F1" }} title="Edit Background" onClick={() => handleSelectImage(img)}>✏️</button>
                      <button style={s.dlIconBtn} title="Download" onClick={() => handleDownload(img.url, img.name, String(img.id))} disabled={downloading === String(img.id)}>
                        {downloading === String(img.id) ? <span style={{ ...s.spin, width: 14, height: 14 }} /> : "⬇"}
                      </button>
                      <button style={s.dangerIconBtn} title="Delete" onClick={() => handleDeleteGalleryImage(img)}>×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Edit ── */}
        {!showLibrary && step === "edit" && selectedImage && (
          <div style={s.editLayout}>
            <div style={s.previewCol}>
              <p style={s.colLabel}>{editedUrl ? "Result" : "Selected"}</p>
              <div style={{ ...s.previewFrame, cursor: "zoom-in" }} onClick={() => openLightbox([{ url: displayUrl!, name: selectedImage.name + (editedUrl ? " (edited)" : ""), tag: editedUrl ? "Result" : selectedImage.tag }])}>
                <img src={displayUrl!} alt="headshot" style={s.bigImg} />
                {editingBg && <div style={s.overlay}><span style={s.spin} /><span style={{ color: "#fff", fontSize: 13, marginTop: 10 }}>Applying…</span></div>}
                {!editingBg && <div style={s.zoomHint}>🔍</div>}
              </div>
              <button style={{ ...s.dlBtn, ...(downloading === "preview" ? { opacity: 0.6 } : {}) }} disabled={downloading === "preview"} onClick={() => handleDownload(displayUrl!, selectedImage.name + (editedUrl ? "-edited" : ""), "preview")}>
                {downloading === "preview" ? "Downloading…" : "⬇ Download"}
              </button>
              {editedUrl && <button style={s.ghostBtn2} onClick={() => setEditedUrl(null)}>↺ Reset to Original</button>}
            </div>

            <div style={s.editPanel}>
              <h2 style={s.h2}>Edit with AI</h2>
              <p style={s.sub2}>{selectedImage.name} · {selectedImage.tag}</p>

              <div style={s.section}>
                <p style={s.sLabel}>AI Prompt</p>
                <textarea value={promptInput} onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Describe what you want… e.g. 'Place me in front of a modern office', 'Sunset rooftop background'"
                  className="hs-prompt-box" style={s.promptBox} rows={3} disabled={editingBg} />
                <button
                  style={{ ...s.primaryBtn, ...(editingBg || !promptInput.trim() ? s.btnOff : {}), fontSize: 13, padding: "10px 18px" }}
                  onClick={handleEditByPrompt}
                  disabled={editingBg || !promptInput.trim()}
                >
                  {editingBg ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><span style={s.spin} />Generating…</span>
                    : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span>✨ Generate with Prompt</span><span style={s.costBadge}>{EDIT_CREDITS} credits</span></span>}
                </button>
              </div>

              <div className="hs-divider" style={{ fontSize: 11, color: "#BBB", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>or choose background</div>

              <div style={s.section}>
                <p style={s.sLabel}>Preset Colors</p>
                <div style={s.colorGrid}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.label}
                      title={c.label}
                      className="cb"
                      disabled={editingBg}
                      style={{
                        ...s.colorBtn,
                        background: c.color,
                        border: c.color === "#FFFFFF" ? "2px solid #DDD" : `2px solid ${c.color}`,
                        outline: pendingColor?.color === c.color ? "3px solid #6366F1" : "none",
                        outlineOffset: 2,
                      }}
                      onClick={() => { setPendingColor({ color: c.color, label: c.label }); setPendingBgFile(null); setPendingBgFileName(""); }}
                    />
                  ))}
                </div>
              </div>

              <div style={s.section}>
                <p style={s.sLabel}>Custom Color</p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} style={s.colorPicker} />
                  <span style={{ fontSize: 13, color: "#666" }}>{customColor}</span>
                  <button
                    style={{ ...s.applyBtn, ...(editingBg ? s.btnOff : {}), background: pendingColor?.color === customColor ? "#10B981" : "#6366F1" }}
                    onClick={() => { setPendingColor({ color: customColor, label: "Custom" }); setPendingBgFile(null); setPendingBgFileName(""); }}
                    disabled={editingBg}
                  >
                    {pendingColor?.color === customColor ? "✓ Selected" : "Select"}
                  </button>
                </div>
              </div>

              <div style={s.section}>
                <p style={s.sLabel}>Background Image</p>
                <input ref={bgFileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setPendingBgFile(f); setPendingBgFileName(f.name); setPendingColor(null); }
                  }} />
                <button style={{ ...s.uploadBgBtn, ...(editingBg ? s.btnOff : {}), ...(pendingBgFile ? { borderColor: "#6366F1", background: "#EEEEFF", color: "#6366F1" } : {}) }}
                  onClick={() => bgFileInputRef.current?.click()} disabled={editingBg}>
                  {pendingBgFile ? `✓ ${pendingBgFileName}` : "🖼 Upload Background Image"}
                </button>
                <p style={s.bgLockNote}>Uploaded backgrounds are locked. The edit only places the headshot onto your image and will not add shadows.</p>
              </div>

              {hasPending && (
                <div style={s.pendingRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    {pendingColor && <div style={{ width: 22, height: 22, borderRadius: 5, background: pendingColor.color, border: "2px solid #E0E0EE", flexShrink: 0 }} />}
                    {pendingBgFile && <span style={{ fontSize: 18 }}>🖼</span>}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {pendingColor ? pendingColor.label : pendingBgFileName}
                    </span>
                  </div>
                  <button style={s.clearBtn} onClick={clearPending}>✕</button>
                </div>
              )}

              <button
                style={{ ...s.primaryBtn, ...(!hasPending || editingBg ? s.btnOff : {}), fontSize: 13, padding: "12px 18px" }}
                onClick={handleApplyBackground}
                disabled={!hasPending || editingBg}
              >
                {editingBg
                  ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><span style={s.spin} />Applying…</span>
                  : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span>Apply Background</span><span style={s.costBadge}>{EDIT_CREDITS} credits</span></span>}
              </button>

              {error && <div style={s.err}>{error}</div>}

              <div style={s.section}>
                <p style={s.sLabel}>Switch Headshot</p>
                <div style={s.thumbRow}>
                  {images.map((img) => (
                    <img key={img.id} src={img.url} alt={img.name} title={img.name}
                      style={{ ...s.thumb, border: selectedImage.id === img.id ? "2px solid #6366F1" : "2px solid transparent" }}
                      onClick={() => { setSelectedImage(img); setEditedUrl(null); setPromptInput(""); clearPending(); }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const steps: Step[] = ["upload", "styles", "gallery", "edit"];

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#F7F8FC", fontFamily: "system-ui, -apple-system, sans-serif", color: "#111" },
  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EAECF0" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 },
  logoText: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px" },
  stepBar: { display: "flex", alignItems: "center", gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 6 },
  stepDot: { width: 26, height: 26, borderRadius: "50%", background: "#E8E8F0", color: "#888", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepDotActive: { background: "#6366F1", color: "#fff" },
  stepDotDone: { background: "#10B981", color: "#fff" },
  stepLabel: { fontSize: 12, color: "#999", whiteSpace: "nowrap" as const },
  stepLine: { width: 32, height: 1, background: "#E0E0E8", margin: "0 4px" },
  headerActions: { display: "flex", gap: 8, alignItems: "center", flexShrink: 0 },
  ghostBtn: { background: "none", border: "1px solid #E0E0E8", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 },
  libBadge: { background: "#6366F1", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 },
  costBadge: { background: "rgba(255,255,255,0.22)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 },

  canvas: { position: "relative", minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px" },
  dots: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #CACAD8 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.4, pointerEvents: "none" as const },

  card: { position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, padding: "40px 48px", maxWidth: 520, width: "100%", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" as const, gap: 20 },
  h1: { margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px" },
  sub: { margin: 0, fontSize: 15, color: "#666", lineHeight: 1.5 },
  dropzone: { border: "2px dashed #D0D0E0", borderRadius: 14, minHeight: 220, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "all 0.2s" },
  dropActive: { borderColor: "#6366F1", background: "#F0F0FF" },
  previewBox: { position: "relative", width: "100%", height: "100%" },
  previewImg: { width: "100%", maxHeight: 300, objectFit: "cover" as const, display: "block" },
  overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" },
  spin: { display: "inline-block", width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  dropContent: { textAlign: "center" as const, padding: 32 },
  dropTitle: { margin: "0 0 6px", fontWeight: 700, fontSize: 15 },
  dropHint: { margin: 0, fontSize: 13, color: "#999" },
  err: { background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C00" },
  primaryBtn: { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
  btnOff: { opacity: 0.45, cursor: "not-allowed" as const },
  progressNote: { margin: 0, fontSize: 12, color: "#888", textAlign: "center" as const },

  stylesLayout: { position: "relative", zIndex: 1, display: "flex", gap: 28, alignItems: "flex-start", maxWidth: 1100, width: "100%" },
  sourceThumb: { flexShrink: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8 },
  srcImg: { width: 120, borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.14)", objectFit: "cover" as const },
  srcLabel: { margin: 0, fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  stylesPanel: { flex: 1, background: "#fff", borderRadius: 20, padding: "28px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" as const, gap: 20 },
  stylesPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  h2: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" },
  sub2: { margin: "4px 0 0", fontSize: 13, color: "#777" },
  quickBtns: { display: "flex", gap: 6, flexShrink: 0 },
  tinyBtn: { background: "#F0F0F8", border: "1px solid #E0E0EE", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", color: "#555" },
  genderRow: { display: "flex", gap: 10 },
  genderBtn: { flex: 1, padding: "10px 16px", borderRadius: 10, border: "2px solid #E0E0EE", background: "#F7F8FC", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#666", transition: "all 0.15s" },
  genderBtnActive: { background: "#EEEEFF", borderColor: "#6366F1", color: "#6366F1" },
  styleGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
  styleCard: { background: "#F7F8FC", border: "2px solid transparent", borderRadius: 12, padding: "14px 10px", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, transition: "all 0.15s", textAlign: "center" as const },
  styleCardSel: { background: "#EEEEFF", border: "2px solid #6366F1" },
  styleNum: { width: 28, height: 28, borderRadius: "50%", background: "#E8E8F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#6366F1" },
  styleName: { fontSize: 12, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3 },
  styleTag: { fontSize: 10, color: "#888", background: "#EEEEF8", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" as const, letterSpacing: 0.5 },

  galleryLayout: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column" as const, gap: 20, maxWidth: 1100, width: "100%" },
  galleryHeader: { background: "#fff", borderRadius: 16, padding: "20px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 },
  galleryThumb: { width: 56, height: 72, objectFit: "cover" as const, borderRadius: 8, border: "2px solid #E8E8F0" },
  imageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 },
  imgCard: { position: "relative", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.09)", transition: "all 0.15s" },
  cardImg: { width: "100%", aspectRatio: "3/4", objectFit: "cover" as const, display: "block" },
  cardMeta: { padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardName: { fontSize: 12, fontWeight: 700, color: "#222" },
  cardTag: { fontSize: 10, background: "#EEEEF8", color: "#6366F1", borderRadius: 4, padding: "2px 6px", fontWeight: 600 },
  cardHover: { position: "absolute", inset: 0, background: "rgba(99,102,241,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", opacity: 0, transition: "opacity 0.15s", backdropFilter: "blur(2px)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" },
  dlIconBtn: { flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E0EE", background: "#F7F8FC", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" },
  dangerIconBtn: { flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "1px solid #FFD0D0", background: "#FFF1F1", cursor: "pointer", fontSize: 20, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#C62828" },
  emptyLib: { background: "#fff", borderRadius: 20, padding: "60px 40px", textAlign: "center" as const, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" as const, alignItems: "center" },

  editLayout: { position: "relative", zIndex: 1, display: "flex", gap: 28, alignItems: "flex-start", maxWidth: 1000, width: "100%" },
  previewCol: { flexShrink: 0, width: 240, display: "flex", flexDirection: "column" as const, gap: 12 },
  colLabel: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1, color: "#888" },
  previewFrame: { position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 28px rgba(0,0,0,0.16)" },
  bigImg: { width: "100%", display: "block" },
  zoomHint: { position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.45)", color: "#fff", borderRadius: 8, padding: "4px 8px", fontSize: 16, pointerEvents: "none" as const },
  dlBtn: { display: "block", textAlign: "center" as const, padding: "11px 16px", background: "#111", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", width: "100%" },
  ghostBtn2: { background: "none", border: "1px solid #E0E0E8", borderRadius: 10, padding: "9px 16px", fontSize: 13, cursor: "pointer", color: "#555", width: "100%" },
  editPanel: { flex: 1, background: "#fff", borderRadius: 20, padding: "28px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" as const, gap: 20 },
  section: { display: "flex", flexDirection: "column" as const, gap: 10 },
  sLabel: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1, color: "#888" },
  promptBox: { width: "100%", borderRadius: 10, border: "1.5px solid #E0E0EE", padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, lineHeight: 1.5, color: "#222", background: "#FAFAFA" },
  colorGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8 },
  colorBtn: { width: 34, height: 34, borderRadius: 8, cursor: "pointer", transition: "transform 0.1s" },
  colorPicker: { width: 42, height: 42, border: "2px solid #E0E0E8", borderRadius: 8, cursor: "pointer", padding: 2 },
  applyBtn: { background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto", transition: "background 0.2s" },
  uploadBgBtn: { background: "#F4F4FA", border: "1px solid #E0E0EE", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#333", textAlign: "left" as const, transition: "all 0.15s" },
  bgLockNote: { margin: "-2px 0 0", fontSize: 12, color: "#666", lineHeight: 1.45 },
  pendingRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0F0FF", border: "1.5px solid #C4C4F0", borderRadius: 10, padding: "10px 14px", gap: 10 },
  clearBtn: { background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 14, padding: 4, flexShrink: 0 },
  thumbRow: { display: "flex", flexWrap: "wrap" as const, gap: 8 },
  thumb: { width: 60, height: 76, objectFit: "cover" as const, borderRadius: 8, cursor: "pointer", transition: "border-color 0.15s" },

  lbOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  lbModal: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 16, maxWidth: "90vw", maxHeight: "95vh" },
  lbTopBar: { width: "100%", display: "flex", alignItems: "center", gap: 12 },
  lbCounter: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 },
  lbClose: { width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  lbImgRow: { display: "flex", alignItems: "center", gap: 20 },
  lbImg: { maxHeight: "68vh", maxWidth: "75vw", objectFit: "contain" as const, borderRadius: 14, display: "block", boxShadow: "0 8px 60px rgba(0,0,0,0.6)" },
  lbNav: { width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(4px)", transition: "background 0.15s" },
  lbFooter: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  lbName: { color: "#fff", fontWeight: 700, fontSize: 15 },
  lbTag: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 3 },
  lbEditBtn: { background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  lbDeleteBtn: { background: "rgba(220,38,38,0.16)", color: "#FCA5A5", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  lbDlBtn: { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  lbStrip: { display: "flex", gap: 8, overflowX: "auto" as const, maxWidth: "80vw", paddingBottom: 4 },
  lbThumb: { width: 52, height: 66, objectFit: "cover" as const, borderRadius: 6, cursor: "pointer", flexShrink: 0, transition: "opacity 0.15s, outline 0.1s" },
};
