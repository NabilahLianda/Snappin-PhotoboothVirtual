import type { StripFrame } from '@/lib/frames'

export type Shot = { host: string | null; guest: string | null }

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

type ComposeStripOptions = {
  frame: StripFrame
  shots: Shot[]
  filter: string
  /** Pengali resolusi. 2 berarti hasil 1200×3600 px. */
  scale?: number
  /** 'solo' = satu foto penuh per slot. 'duo' = kiri host, kanan guest. */
  mode?: 'solo' | 'duo'
}

// Gambar ala `object-cover`: isi kotak tujuan tanpa mengubah rasio, lalu dipotong tengah.
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  filter: string,
) {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / ratio
  const sh = h / ratio
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.filter = filter
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
  ctx.restore()
}

// Urutan gambar: latar putih → foto di tiap slot → frame di paling atas.
export async function composeStrip({ frame, shots, filter, scale = 2, mode = 'duo' }: ComposeStripOptions) {
  const canvas = document.createElement('canvas')
  canvas.width = frame.width * scale
  canvas.height = frame.height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const [frameImg, ...loaded] = await Promise.all([
    loadImage(frame.src),
    ...shots.map(async (s): Promise<{ host: HTMLImageElement | null; guest: HTMLImageElement | null }> => ({
      host: s.host ? await loadImage(s.host) : null,
      guest: s.guest ? await loadImage(s.guest) : null,
    })),
  ])

  frame.slots.forEach((slot, i) => {
    const pair = loaded[i]
    if (!pair) return

    if (mode === 'solo') {
      const img = pair.host ?? pair.guest
      if (!img) return
      drawCover(ctx, img, slot.x * scale, slot.y * scale, slot.w * scale, slot.h * scale, filter)
      return
    }

    // Duo: belah slot jadi kiri (host) dan kanan (guest).
    const half = (slot.w / 2) * scale
    ;[pair.host, pair.guest].forEach((img, j) => {
      if (!img) return
      drawCover(ctx, img, slot.x * scale + j * half, slot.y * scale, half, slot.h * scale, filter)
    })

    // Garis pemisah tipis di tengah.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(slot.x * scale + half - scale, slot.y * scale, 2 * scale, slot.h * scale)
  })

  ctx.filter = 'none'
  ctx.drawImage(frameImg as HTMLImageElement, 0, 0, canvas.width, canvas.height)
  return canvas
}
