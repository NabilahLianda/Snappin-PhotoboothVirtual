// Menggambar ulang hasil editor (foto + filter + frame + stiker) ke canvas
// supaya file yang diunduh sama dengan tampilan preview di layar.

export type ComposeOptions = {
  img: HTMLImageElement
  /** Lebar foto di layar (px). Dipakai untuk menyamakan skala frame dan stiker. */
  displayWidth: number
  filter: string
  frame: string | null
  sticker: string | null
  /** Posisi pusat stiker dalam persen terhadap seluruh bingkai. */
  stickerPosition: { x: number; y: number }
  /** Ukuran stiker di layar (px). */
  stickerSize: { width: number; height: number }
}

function addRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function composePhoto(options: ComposeOptions): HTMLCanvasElement | null {
  const { img, filter, frame, sticker, stickerPosition, stickerSize } = options
  const naturalW = img.naturalWidth
  const naturalH = img.naturalHeight
  const s = naturalW / (options.displayWidth || naturalW)
  const pad = 12 * s

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(naturalW + pad * 2)
  canvas.height = Math.round(naturalH + pad * 2)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Latar putih (sama seperti bingkai di preview). Tanpa ini, area transparan jadi hitam di JPG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Foto + filter
  ctx.filter = filter
  ctx.drawImage(img, pad, pad, naturalW, naturalH)
  ctx.filter = 'none'

  // Frame (digambar di atas foto, di dalam area foto)
  if (frame) {
    const radius = 8 * s
    const ring = (offset: number, width: number, color: string) => {
      ctx.beginPath()
      addRoundedRect(ctx, pad + offset, pad + offset, naturalW - offset * 2, naturalH - offset * 2, radius - offset)
      addRoundedRect(
        ctx,
        pad + offset + width,
        pad + offset + width,
        naturalW - (offset + width) * 2,
        naturalH - (offset + width) * 2,
        radius - offset - width,
      )
      ctx.fillStyle = color
      ctx.fill('evenodd')
    }

    if (frame === 'Frame 01') {
      ring(0, 14 * s, 'rgba(128, 104, 255, 0.7)')
    } else if (frame === 'Frame 02') {
      ring(0, 10 * s, '#172333')
      ring(10 * s, 5 * s, '#d9e6ec')
    } else {
      const width = 18 * s
      ctx.save()
      ctx.beginPath()
      addRoundedRect(ctx, pad + width / 2, pad + width / 2, naturalW - width, naturalH - width, 0)
      ctx.lineWidth = width
      ctx.strokeStyle = 'rgba(240, 200, 168, 0.8)'
      ctx.setLineDash([width * 1.2, width])
      ctx.stroke()
      ctx.restore()
    }
  }

  // Stiker (di atas frame)
  if (sticker) {
    const w = stickerSize.width * s
    const h = stickerSize.height * s
    const cx = (stickerPosition.x / 100) * canvas.width
    const cy = (stickerPosition.y / 100) * canvas.height
    ctx.save()
    ctx.beginPath()
    addRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fill()
    ctx.lineWidth = Math.max(1, s)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.stroke()
    ctx.fillStyle = '#8068ff'
    ctx.font = `700 ${10 * s}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${s}px`
    ctx.fillText(sticker, cx, cy + s * 0.5)
    ctx.restore()
  }

  return canvas
}
