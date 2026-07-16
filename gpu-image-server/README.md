# JPT AI — Your Own GPU Image Generation & Editing Server

A self-hosted image **generation** and **editing** service that runs on *your*
RTX 3050 — no Gemini, no Google billing, no per-image cost, no quotas. It uses
open-source Stable Diffusion models plus **GitHub Models (free GPT-4o)** as a
"smart thinking" layer that turns short ideas into rich prompts.

> **Honest framing:** this does **not** train a model from scratch (that costs
> millions). It runs the best open-source models on your GPU — which *is* how
> real self-hosted AI image tools work. It's genuinely yours: private, offline,
> unlimited.

---

## Your hardware → what you get

Your PC: **RTX 3050 (6 GB VRAM)**, i5-8400, 24 GB RAM, Windows 11, ~380 GB free.

6 GB is a modest but capable card. The server defaults to **Stable Diffusion 1.5**
(via the excellent `DreamShaper 8` checkpoint) because it runs *fast and reliably*
in 6 GB. SDXL is supported too but is slow on this card.

### Capabilities on your RTX 3050

| Feature | Works? | Notes |
|---|---|---|
| **Text → image (Full HD)** | ✅ Yes | **1920×1080 by default** via the two-stage hi-res pipeline (~15–35 sec) |
| **Even bigger (2K/4K)** | ✅ Yes | Ask for `width/height` up to ~3840×2160; slower |
| **Image edit** (img2img) | ✅ Yes | Restyle, enhance, re-imagine an image |
| **Inpaint / background swap** | ✅ Yes | Paint a mask, replace that region |
| **Upscale to HD** (`/upscale`) | ✅ Yes | Turn any image into a sharp Full-HD/4K version |
| **Smart prompts** (GPT-4o) | ✅ Yes | Short idea → detailed prompt, free via GitHub |
| **SDXL** (higher base quality) | ⚠️ Slow | Optional; ~60–120 sec/HD image with CPU offload |
| **FLUX** (best quality) | ❌ No | Needs 12 GB+; skip on this card |
| **Many users at once** | ⚠️ Serial | One image at a time; fine for you, queues under load |

**How Full HD works on 6 GB:** the model renders at its native size (768px) then
the server upscales and runs a light detail pass to reach **1920×1080** (or 4K).
This is the standard "hi-res fix" — it gives sharp, detailed HD output without
running out of VRAM. Set `"hd": false` for a fast native-size draft.

**Realistic quality:** With a good SD 1.5 checkpoint, this is **more than enough
for your website creatives and blog hero images** — especially illustrated,
stylised, product, and background scenes. It is **not** Midjourney/FLUX-level
photorealism of faces. My honest recommendation:

- ✅ **Use it now for your own creatives & blog images** — great fit.
- 🟡 **For public user generation/editing:** works for low traffic, but one 6 GB
  GPU processes one image at a time. For real user volume you'd want a bigger
  GPU or a cloud GPU (see "Scaling up" below).

---

## Setup (Windows) — literally one double-click

1. **Install Python 3.10–3.11** from python.org (tick *"Add Python to PATH"*).
2. **Install the latest NVIDIA driver** for your RTX 3050.
3. **Double-click `start.bat`.**

That's it. On the first run it automatically creates the virtual environment,
installs PyTorch (CUDA) + all dependencies, generates a `.env` with a random
`API_TOKEN`, downloads the model once (~2–5 GB), and starts the server on
`http://localhost:7860`. Every run after that starts instantly.

*(Optional: to enable GPT-4o smart prompts, paste a token from
https://github.com/settings/tokens into the `GITHUB_TOKEN=` line of the `.env`
file that `start.bat` created.)*

### If Windows blocks `start.bat` ("Smart App Control blocked a file")

Windows 11 Smart App Control blocks `.bat` files downloaded from the internet —
even safe ones. Run the same steps through PowerShell instead (SAC allows this):

1. Install Python from the **Microsoft Store** (search "Python 3.12") — Store apps
   are trusted by SAC.
2. Open the `gpu-image-server` folder, click the address bar, type `powershell`, Enter.
3. Paste this one line and press Enter:
   ```
   python -m venv venv ; .\venv\Scripts\python.exe -m pip install --upgrade pip ; .\venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cu124 ; .\venv\Scripts\python.exe -m pip install -r requirements.txt ; .\venv\Scripts\python.exe server.py
   ```
It installs everything and starts the server on `http://localhost:7860`.

**Quick test** (new PowerShell window):
```powershell
curl http://localhost:7860/health
```
You should see your model, `device: cuda`, and `vram_gb: 6.0`.

Generate your first image:
```powershell
curl -X POST http://localhost:7860/generate -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_API_TOKEN" ^
  -d "{\"prompt\":\"a cozy diwali sale banner, warm lights, marigold flowers\",\"enhance\":true}"
```
The response contains a `dataUrl` (base64 PNG) you can paste into a browser.

---

## Connect it to your website

Your Vercel site can't reach `localhost`, so expose the server with a free tunnel:

1. Install **cloudflared**: https://developers.cloudflare.com/cloudflare-tunnel/
2. Run:
   ```
   cloudflared tunnel --url http://localhost:7860
   ```
   It prints a public `https://something.trycloudflare.com` URL.
3. In **Vercel → Project → Settings → Environment Variables**, add:
   - `GPU_SERVER_URL` = that https URL (no trailing slash)
   - `GPU_SERVER_TOKEN` = the same `API_TOKEN` from your `.env`
4. Redeploy. Your site's `/api/studio` route now calls your GPU.

> Your PC must be **on and running** `run.bat` + the tunnel for the site to use it.
> For always-on, keep the PC awake or move to a cloud GPU (below).

---

## API reference (`/api/studio` on your site, or direct to the server)

All requests are JSON. Direct-to-server requests need `Authorization: Bearer <API_TOKEN>`.

**Generate** — `{"action":"generate", ...}`
```json
{ "prompt": "mountain sunset, cinematic", "width": 768, "height": 768,
  "steps": 30, "guidance": 7, "seed": 123, "enhance": true }
```
**Edit (img2img)** — `{"action":"edit", ...}`
```json
{ "image": "data:image/png;base64,...", "prompt": "make it a watercolor painting",
  "strength": 0.55, "enhance": true }
```
**Inpaint / background swap** — `{"action":"inpaint", ...}`
```json
{ "image": "data:image/png;base64,...", "mask": "data:image/png;base64,...",
  "prompt": "a clean studio background" }
```
`mask`: white = area to change, black = keep.

**Upscale any image to HD/4K** — `{"action":"upscale", ...}`
```json
{ "image": "data:image/png;base64,...", "width": 1920, "height": 1080 }
```
All return `{ "dataUrl": "...", "size": "1920x1080", "seconds": n }`.

---

## Use it for your own creatives (no website needed)

`make-creative.py` example:
```python
import requests, base64
r = requests.post("http://localhost:7860/generate",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={"prompt": "hero image for a photo-upscaling blog, editorial, 16:9",
          "width": 1024, "height": 576, "enhance": True}, timeout=300)
data = r.json()["dataUrl"].split(",", 1)[1]
open("creative.png", "wb").write(base64.b64decode(data))
print("saved creative.png")
```

---

## Tuning for your 6 GB card

- **Speed vs quality:** keep SD 1.5 for fast blog/creative images. Try SDXL
  (`MODEL_ID` in `.env`) only when you can wait ~1 min for higher fidelity.
- **Bigger images:** 512–768px is the sweet spot; 1024px works but is slower.
- **Better checkpoints:** swap `MODEL_ID` for any SD 1.5 checkpoint you like
  (e.g. `SG161222/Realistic_Vision_V6.0_B1_noVAE` for photoreal). Mind each
  model's licence for commercial use.

## Scaling up (when you're ready for user traffic)

- A **cloud GPU** (RunPod, Vast.ai — ~₹25–60/hr for a 24 GB card) lets you run
  **FLUX.1-schnell** (near-commercial quality, Apache-2.0 licence) and serve many
  users. The same `server.py` runs there unchanged — just set `MODEL_ID` and point
  `GPU_SERVER_URL` at it.
- Add a queue (one job at a time) if you open generation to the public.

---

## Files

| File | Purpose |
|---|---|
| `server.py` | FastAPI server: `/generate`, `/edit`, `/inpaint`, `/health` |
| `prompt_brain.py` | GPT-4o (GitHub Models) prompt enhancement |
| `requirements.txt` | Python dependencies |
| `start.bat` | Windows one-click: auto-setup on first run, then launches |
| `.env.example` | Configuration template |
| `../src/app/api/studio/route.ts` | Next.js route that proxies to this server |
