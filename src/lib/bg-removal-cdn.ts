// Loads @imgly/background-removal from CDN to avoid webpack/WASM bundling issues.
// The library is cached on window after first load.

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/background-removal.js'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BackgroundRemoval?: any
  }
}

let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    if (window.BackgroundRemoval) { resolve(); return }
    const script = document.createElement('script')
    script.src = CDN_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load background-removal library'))
    document.head.appendChild(script)
  })
  return loadPromise
}

export async function removeBg(
  input: Blob | File,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  await loadScript()
  const lib = window.BackgroundRemoval
  if (!lib?.removeBackground) throw new Error('Background removal library not available')

  return lib.removeBackground(input, {
    progress: (_key: string, current: number, total: number) => {
      if (total > 0 && onProgress) onProgress(Math.round((current / total) * 85) + 10)
    },
    publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/',
  })
}
