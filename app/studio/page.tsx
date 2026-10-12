'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Download, ImagePlus, Layers3, Sparkles, Sticker, Video } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { composePhoto } from '@/lib/compose-photo'

const filters = [
  { name: 'Original', value: 'none' },
  { name: 'B&W', value: 'grayscale(1)' },
  { name: 'Soft', value: 'brightness(1.08) saturate(.72) sepia(.12)' },
  { name: 'Cool', value: 'saturate(.9) hue-rotate(12deg) brightness(1.05)' },
  { name: 'Vintage', value: 'sepia(.45) contrast(.92) saturate(.8)' },
]

const emptyFrames = ['Frame 01', 'Frame 02', 'Frame 03']
const emptyStickers = ['Sticker 01', 'Sticker 02', 'Sticker 03']

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameBoxRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const stickerRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [filter, setFilter] = useState(filters[0].value)
  const [frame, setFrame] = useState<string | null>(null)
  const [sticker, setSticker] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [stickerPosition, setStickerPosition] = useState({ x: 78, y: 78 })

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
    void videoRef.current.play()
  }, [cameraOpen])

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    setImage(URL.createObjectURL(selected))
    setFileName(selected.name)
    event.target.value = ''
  }

  async function openCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Kamera tidak bisa diakses dari alamat ini. Buka lewat Chrome atau Edge di http://localhost:3000/studio.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
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

  function startDragSticker(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    dragOffset.current = {
      dx: event.clientX - (rect.left + rect.width / 2),
      dy: event.clientY - (rect.top + rect.height / 2),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveSticker(event: React.PointerEvent<HTMLDivElement>) {
    const offset = dragOffset.current
    const box = frameBoxRef.current?.getBoundingClientRect()
    const stickerEl = stickerRef.current
    if (!offset || !box || !stickerEl) return
    const halfW = stickerEl.offsetWidth / 2
    const halfH = stickerEl.offsetHeight / 2
    const x = Math.min(Math.max(event.clientX - offset.dx - box.left, halfW), box.width - halfW)
    const y = Math.min(Math.max(event.clientY - offset.dy - box.top, halfH), box.height - halfH)
    setStickerPosition({ x: (x / box.width) * 100, y: (y / box.height) * 100 })
  }

  function stopDragSticker() {
    dragOffset.current = null
  }

  function takePhoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    setImage(canvas.toDataURL('image/jpeg', 0.92))
    setFileName('snapin-camera.jpg')
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setCameraOpen(false)
  }

  function downloadPhoto() {
    if (!image) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = composePhoto({
        img,
        displayWidth: photoRef.current?.getBoundingClientRect().width ?? img.naturalWidth,
        filter,
        frame,
        sticker,
        stickerPosition,
        stickerSize: {
          width: stickerRef.current?.offsetWidth ?? 80,
          height: stickerRef.current?.offsetHeight ?? 26,
        },
      })
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'snapin-moment.jpg'
      link.href = canvas.toDataURL('image/jpeg', 0.94)
      link.click()
    }
    img.src = image
  }

  return (
    <main className="min-h-screen bg-sn-bg text-sn-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" aria-label="Kembali ke beranda"><Logo /></Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-sn-line-strong px-4 py-2 text-xs font-semibold text-sn-soft transition hover:bg-sn-hover hover:text-sn-ink"><ArrowLeft className="size-3.5" /> Beranda</Link>
          <ThemeToggle />
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-[.75fr_1.25fr] lg:px-10 lg:pt-16">
        <div className="flex flex-col justify-center"><div className="mb-5 flex items-center gap-2 text-sm font-medium text-sn-accent"><Sparkles className="size-4" /> Snapin studio</div><h1 className="max-w-lg text-5xl font-semibold leading-[.98] tracking-[-.06em] sm:text-7xl">Momenmu,<br /><span className="text-sn-accent">versi kamu.</span></h1><p className="mt-6 max-w-md leading-7 text-sn-muted">Ambil foto atau unggah dari galeri. Pilih filter, frame, dan stiker untuk bikin photobooth yang personal.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><label htmlFor="photo-input" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#8068ff] text-white px-5 py-3.5 font-semibold transition hover:bg-[#9886ff]"><ImagePlus className="size-4" /> Upload foto</label><button onClick={openCamera} className="inline-flex items-center justify-center gap-2 rounded-full border border-sn-line-strong px-5 py-3.5 font-semibold transition hover:bg-sn-hover"><Video className="size-4" /> Buka kamera</button></div><input id="photo-input" type="file" accept="image/*" className="sr-only" onChange={chooseFile} />{cameraError && <p className="mt-4 text-sm text-sn-error">{cameraError}</p>}</div>

        <div className="rounded-[2rem] border border-sn-line bg-sn-panel p-3 shadow-2xl shadow-black/30"><div className="flex items-center justify-between px-3 pb-3 text-xs text-sn-faint"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#8068ff] text-white" /> editor</span><span>{fileName || 'belum ada foto'}</span></div><div className="relative flex min-h-[390px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#d9e6ec] p-6 sm:min-h-[500px]">{image ? <div ref={frameBoxRef} className="relative max-h-full max-w-full overflow-hidden rounded-xl bg-white p-3 shadow-2xl"><img ref={photoRef} src={image} alt="Preview foto yang sedang diedit" style={{ filter }} className="block max-h-[430px] max-w-full object-contain" />{frame && <div className={`pointer-events-none absolute inset-0 m-3 rounded-lg ${frame === 'Frame 01' ? 'border-[14px] border-[#8068ff]/70' : frame === 'Frame 02' ? 'border-[10px] border-[#172333] shadow-[inset_0_0_0_5px_#d9e6ec]' : 'border-[18px] border-[#f0c8a8]/80 border-dashed'}`} />} {sticker && <div ref={stickerRef} onPointerDown={startDragSticker} onPointerMove={moveSticker} onPointerUp={stopDragSticker} onPointerCancel={stopDragSticker} className="absolute cursor-grab touch-none select-none rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] font-bold tracking-wider text-[#8068ff] active:cursor-grabbing" style={{ left: `${stickerPosition.x}%`, top: `${stickerPosition.y}%`, transform: 'translate(-50%, -50%)' }}>{sticker}</div>}</div> : <div className="text-center text-[#657985]"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-white/50"><Camera className="size-7" /></div><p className="font-medium">Preview fotomu akan muncul di sini</p><p className="mt-1 text-sm opacity-70">Upload atau buka kamera untuk mulai</p></div>}{cameraOpen && <div className="absolute inset-0 z-10 bg-black p-3"><video ref={videoRef} autoPlay playsInline className="size-full rounded-xl object-cover" /><div className="absolute bottom-7 left-0 right-0 flex justify-center gap-3"><button onClick={takePhoto} className="grid size-16 place-items-center rounded-full border-4 border-white bg-[#8068ff] text-white" aria-label="Ambil foto"><Camera /></button><button onClick={() => { streamRef.current?.getTracks().forEach((track) => track.stop()); setCameraOpen(false) }} className="rounded-full bg-black/50 px-4 py-2 text-sm text-white">Tutup</button></div></div>}</div><div className="flex items-center justify-between gap-3 px-2 pb-1 pt-4"><span className="truncate text-xs text-sn-faint">{image ? 'Edit fotomu di panel sebelah' : 'Your moment, your way.'}</span><button onClick={downloadPhoto} disabled={!image} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-sn-invert px-4 py-2 text-xs font-semibold text-sn-invert-ink transition hover:bg-sn-invert-hover disabled:cursor-not-allowed disabled:opacity-40"><Download className="size-3.5" /> Download</button></div></div>
      </section>

      <section className="border-t border-sn-line bg-sn-alt px-6 py-14 lg:px-10"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-sn-accent">Customize</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Isi sesukamu.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-sn-muted">Frame dan stiker di bawah masih berupa slot kosong, siap kamu isi dengan aset Snapin nanti.</p></div><div className="grid gap-4 sm:grid-cols-3"><EditorGroup icon={<Layers3 />} title="Frame" items={emptyFrames} selected={frame} onSelect={setFrame} /><EditorGroup icon={<Sparkles />} title="Filter" items={filters.map((item) => item.name)} selected={filters.find((item) => item.value === filter)?.name ?? 'Original'} onSelect={(name) => setFilter(filters.find((item) => item.name === name)?.value ?? 'none')} /><EditorGroup icon={<Sticker />} title="Stiker" items={emptyStickers} selected={sticker} onSelect={setSticker} /></div></div></section>

      <footer className="border-t border-sn-line px-6 py-8 text-center text-xs text-sn-dim">snapin. — buat momen yang lebih kamu.</footer>
    </main>
  )
}

function EditorGroup({ icon, title, items, selected, onSelect }: { icon: ReactNode; title: string; items: string[]; selected: string | null; onSelect: (value: string) => void }) {
  return <div className="rounded-2xl border border-sn-line bg-sn-card p-4"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="text-sn-accent">{icon}</span>{title}</div><div className="flex flex-col gap-2">{items.map((item) => <button key={item} onClick={() => onSelect(item)} className={`rounded-xl border px-3 py-3 text-left text-xs transition ${selected === item ? 'border-[#8068ff] bg-[#8068ff]/15 text-sn-ink' : 'border-sn-line text-sn-muted hover:border-sn-line-strong hover:text-sn-ink'}`}>{item}{title !== 'Filter' && <span className="float-right text-sn-dim">kosong</span>}</button>)}</div></div>
}
