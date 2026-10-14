'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Download, ImagePlus, Layers3, RotateCcw, Sparkles, Video } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { composeStrip } from '@/lib/compose-photo'
import { stripFrames, STRIP_W, STRIP_H } from '@/lib/frames'

const filters = [
  { name: 'Original', value: 'none' },
  { name: 'B&W', value: 'grayscale(1)' },
  { name: 'Soft', value: 'brightness(1.08) saturate(.72) sepia(.12)' },
  { name: 'Cool', value: 'saturate(.9) hue-rotate(12deg) brightness(1.05)' },
  { name: 'Vintage', value: 'sepia(.45) contrast(.92) saturate(.8)' },
]

const SLOT_COUNT = 4

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [photos, setPhotos] = useState<(string | null)[]>(Array(SLOT_COUNT).fill(null))
  const [activeSlot, setActiveSlot] = useState(0)
  const [frameId, setFrameId] = useState(stripFrames[0].id)
  const [filter, setFilter] = useState(filters[0].value)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const frame = stripFrames.find((f) => f.id === frameId) ?? stripFrames[0]
  const filledCount = photos.filter(Boolean).length
  const allFilled = filledCount === SLOT_COUNT

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
    void videoRef.current.play()
  }, [cameraOpen])

  function release(url: string | null | undefined) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  // Isi slot aktif, lalu pindah ke slot kosong berikutnya.
  function putPhoto(url: string) {
    const next = [...photos]
    release(next[activeSlot])
    next[activeSlot] = url
    setPhotos(next)
    const nextEmpty = next.findIndex((p) => !p)
    if (nextEmpty !== -1) setActiveSlot(nextEmpty)
    return next
  }

  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, SLOT_COUNT)
    if (files.length === 0) return
    const next = [...photos]
    let slot = activeSlot
    for (const file of files) {
      release(next[slot])
      next[slot] = URL.createObjectURL(file)
      slot = (slot + 1) % SLOT_COUNT
    }
    setPhotos(next)
    const nextEmpty = next.findIndex((p) => !p)
    setActiveSlot(nextEmpty === -1 ? 0 : nextEmpty)
    event.target.value = ''
  }

  async function openCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Kamera tidak bisa diakses dari alamat ini. Buka lewat Chrome atau Edge di http://localhost:3000/studio.')
      return
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setCameraOpen(true)
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraError('Izin kamera ditolak. Klik ikon gembok di address bar, ubah Camera menjadi Allow, lalu refresh halaman.')
      } else if (name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan di perangkat ini. Kamu tetap bisa unggah foto dari galeri.')
      } else if (name === 'NotReadableError') {
        setCameraError('Kamera sedang dipakai aplikasi lain (Zoom, Meet, dll). Tutup aplikasinya lalu coba lagi.')
      } else {
        setCameraError('Kamera tidak bisa dibuka. Izinkan akses kamera atau unggah foto dari galeri.')
      }
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  function takePhoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Video dicerminkan di layar, jadi hasil foto ikut dicerminkan.
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const next = putPhoto(canvas.toDataURL('image/jpeg', 0.92))
    if (next.every(Boolean)) closeCamera()
  }

  function resetAll() {
    photos.forEach(release)
    setPhotos(Array(SLOT_COUNT).fill(null))
    setActiveSlot(0)
  }

  async function downloadStrip() {
    if (!allFilled) return
    const shots = photos.map((p) => ({ host: p, guest: null }))
    const canvas = await composeStrip({ frame, shots, filter, mode: 'solo' })
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'snapin-strip.jpg'
    link.href = canvas.toDataURL('image/jpeg', 0.94)
    link.click()
  }

  return (
    <main className="min-h-screen bg-sn-bg text-sn-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" aria-label="Kembali ke beranda"><Logo /></Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-sn-line-strong px-4 py-2 text-xs font-semibold text-sn-soft transition hover:bg-sn-hover hover:text-sn-ink">
            <ArrowLeft className="size-3.5" /> Beranda
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-[.75fr_1.25fr] lg:px-10 lg:pt-16">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-sn-accent"><Sparkles className="size-4" /> Snapin studio</div>
          <h1 className="max-w-lg text-5xl font-semibold leading-[.98] tracking-[-.06em] sm:text-7xl">
            Momenmu,<br /><span className="text-sn-accent">versi kamu.</span>
          </h1>
          <p className="mt-6 max-w-md leading-7 text-sn-muted">
            Ambil 4 foto atau unggah dari galeri, pilih frame strip dan filter, lalu unduh hasilnya.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="photo-input" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#8068ff] px-5 py-3.5 font-semibold text-white transition hover:bg-[#9886ff]">
              <ImagePlus className="size-4" /> Upload foto
            </label>
            <button onClick={openCamera} className="inline-flex items-center justify-center gap-2 rounded-full border border-sn-line-strong px-5 py-3.5 font-semibold transition hover:bg-sn-hover">
              <Video className="size-4" /> Buka kamera
            </button>
          </div>
          <input id="photo-input" type="file" accept="image/*" multiple className="sr-only" onChange={chooseFiles} />
          {cameraError && <p className="mt-4 text-sm text-sn-error">{cameraError}</p>}
        </div>

        <div className="rounded-[2rem] border border-sn-line bg-sn-panel p-3 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between px-3 pb-3 text-xs text-sn-faint">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#8068ff]" /> editor</span>
            <span>{filledCount}/{SLOT_COUNT} foto</span>
          </div>

          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#d9e6ec] p-6 sm:min-h-[640px]">
            {/* Strip: slot di bawah, frame di atas (frame bolong di area slot) */}
            <div className="relative h-[540px] shrink-0 shadow-2xl sm:h-[600px]" style={{ aspectRatio: `${STRIP_W} / ${STRIP_H}` }}>
              {frame.slots.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlot(i)}
                  aria-label={`Slot foto ${i + 1}`}
                  className={`absolute overflow-hidden bg-white/70 ring-inset transition ${activeSlot === i ? 'ring-4 ring-[#8068ff]' : ''}`}
                  style={{
                    left: `${(s.x / STRIP_W) * 100}%`,
                    top: `${(s.y / STRIP_H) * 100}%`,
                    width: `${(s.w / STRIP_W) * 100}%`,
                    height: `${(s.h / STRIP_H) * 100}%`,
                  }}
                >
                  {photos[i] ? (
                    <img src={photos[i]!} alt={`Foto ${i + 1}`} style={{ filter }} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-2xl font-semibold text-[#657985]">{i + 1}</span>
                  )}
                </button>
              ))}
              <img src={frame.src} alt="" className="pointer-events-none absolute inset-0 size-full" />
            </div>

            {cameraOpen && (
              <div className="absolute inset-0 z-10 bg-black p-3">
                <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 rounded-xl object-cover" />
                <span className="absolute left-6 top-6 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  Foto untuk slot {activeSlot + 1} · {filledCount}/{SLOT_COUNT}
                </span>
                <div className="absolute bottom-7 left-0 right-0 flex justify-center gap-3">
                  <button onClick={takePhoto} className="grid size-16 place-items-center rounded-full border-4 border-white bg-[#8068ff] text-white" aria-label="Ambil foto">
                    <Camera />
                  </button>
                  <button onClick={closeCamera} className="rounded-full bg-black/50 px-4 py-2 text-sm text-white">Tutup</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-4">
            <span className="truncate text-xs text-sn-faint">
              {allFilled ? 'Strip siap diunduh' : `Pilih slot lalu isi foto (${filledCount}/${SLOT_COUNT})`}
            </span>
            <div className="flex shrink-0 gap-2">
              <button onClick={resetAll} disabled={filledCount === 0} className="inline-flex items-center gap-2 rounded-full border border-sn-line-strong px-4 py-2 text-xs font-semibold transition hover:bg-sn-hover disabled:cursor-not-allowed disabled:opacity-40">
                <RotateCcw className="size-3.5" /> Ulang
              </button>
              <button onClick={downloadStrip} disabled={!allFilled} className="inline-flex items-center gap-2 rounded-full bg-sn-invert px-4 py-2 text-xs font-semibold text-sn-invert-ink transition hover:bg-sn-invert-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="size-3.5" /> Download
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-sn-line bg-sn-alt px-6 py-14 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-sn-accent">Customize</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Isi sesukamu.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-sn-muted">Pilih frame strip dan filter. Perubahan langsung terlihat di preview.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <EditorGroup
              icon={<Layers3 />}
              title="Frame"
              items={stripFrames.map((f) => f.name)}
              selected={frame.name}
              onSelect={(name) => setFrameId(stripFrames.find((f) => f.name === name)?.id ?? stripFrames[0].id)}
            />
            <EditorGroup
              icon={<Sparkles />}
              title="Filter"
              items={filters.map((f) => f.name)}
              selected={filters.find((f) => f.value === filter)?.name ?? 'Original'}
              onSelect={(name) => setFilter(filters.find((f) => f.name === name)?.value ?? 'none')}
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-sn-line px-6 py-8 text-center text-xs text-sn-dim">Buat momen yang lebih kamu.</footer>
    </main>
  )
}

function EditorGroup({ icon, title, items, selected, onSelect }: { icon: ReactNode; title: string; items: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <div className="rounded-2xl border border-sn-line bg-sn-card p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="text-sn-accent">{icon}</span>{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`rounded-xl border px-3 py-3 text-left text-xs transition ${selected === item ? 'border-[#8068ff] bg-[#8068ff]/15 text-sn-ink' : 'border-sn-line text-sn-muted hover:border-sn-line-strong hover:text-sn-ink'}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
