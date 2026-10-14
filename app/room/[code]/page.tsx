'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Camera, Check, Copy, Download, Layers3, Loader2, RotateCcw, Sparkles, Wifi, WifiOff } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { composeStrip, type Shot } from '@/lib/compose-photo'
import { stripFrames, STRIP_W, STRIP_H } from '@/lib/frames'
import { useRoom, type Msg, type Role } from '@/hooks/use-room'

const filters = [
  { name: 'Original', value: 'none' },
  { name: 'B&W', value: 'grayscale(1)' },
  { name: 'Soft', value: 'brightness(1.08) saturate(.72) sepia(.12)' },
  { name: 'Cool', value: 'saturate(.9) hue-rotate(12deg) brightness(1.05)' },
  { name: 'Vintage', value: 'sepia(.45) contrast(.92) saturate(.8)' },
]

const SLOT_COUNT = 4
const emptyShots = (): Shot[] => Array.from({ length: SLOT_COUNT }, () => ({ host: null, guest: null }))

// Ambil frame dari video lokal (dicerminkan seperti selfie), lalu kecilkan biar hemat bandwidth.
function captureLocal(video: HTMLVideoElement, maxW = 960) {
  const ratio = Math.min(1, maxW / (video.videoWidth || maxW))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * ratio)
  canvas.height = Math.round(video.videoHeight * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.translate(canvas.width, 0) // mirror seperti selfie
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export default function Page() {
  const params = useParams<{ code: string }>()
  const code = (typeof params.code === 'string' ? params.code : '').toUpperCase()

  const [role, setRole] = useState<Role | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState('')
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  const [shots, setShots] = useState<Shot[]>(emptyShots)
  const [frameId, setFrameId] = useState(stripFrames[0].id)
  const [filter, setFilter] = useState(filters[0].value)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [activeShot, setActiveShot] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const frame = stripFrames.find((f) => f.id === frameId) ?? stripFrames[0]
  const filledCount = shots.filter((s) => s.host && s.guest).length
  const allFilled = filledCount === SLOT_COUNT

  const isHost = role === 'host'

  // Tentukan role dari query string (?host=1) setelah mount untuk menghindari hydration mismatch.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('host')
    setRole(q === '1' ? 'host' : 'guest')
  }, [])

  // Nyalakan kamera.
  useEffect(() => {
    let active = true
    let stream: MediaStream | null = null
    const md = navigator.mediaDevices
    if (!md?.getUserMedia) {
      setCameraError('Kamera tidak bisa diakses dari alamat ini. Buka lewat Chrome atau Edge di http://localhost:3000.')
      return
    }
    md.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (!active) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        setLocalStream(s)
      })
      .catch((error) => {
        if (!active) return
        const name = error instanceof DOMException ? error.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setCameraError('Izin kamera ditolak. Klik ikon gembok di address bar, ubah Camera menjadi Allow, lalu refresh halaman.')
        } else if (name === 'NotFoundError') {
          setCameraError('Kamera tidak ditemukan di perangkat ini.')
        } else if (name === 'NotReadableError') {
          setCameraError('Kamera sedang dipakai aplikasi lain (Zoom, Meet, dll). Tutup aplikasinya lalu coba lagi.')
        } else {
          setCameraError('Kamera tidak bisa dibuka. Izinkan akses kamera lalu refresh halaman.')
        }
      })
    return () => { active = false; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  // Pasang stream ke elemen video (pakai callback ref supaya aman saat elemen baru dipasang).
  const bindLocal = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el
    if (el && localStream) { el.srcObject = localStream; el.play().catch(() => {}) }
  }, [localStream])

  // remoteStream dipasang lewat effect di bawah (dipicu saat remoteStream berubah).
  const bindRemote = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el
  }, [])

  // ---- Helper aksi ----

  function captureAndSend(shot: number) {
    const video = localVideoRef.current
    if (!video || !video.videoWidth) return
    const data = captureLocal(video)
    if (!data) return
    const side = isHost ? 'host' : 'guest'
    setShots((prev) => {
      const next = [...prev]
      next[shot] = { ...next[shot], [side]: data }
      return next
    })
    send({ type: 'photo', shot, data })
  }

  // Jalankan countdown 3-2-1 lokal lalu jepret. Dipakai host dan guest.
  function runCountdown(shot: number) {
    return new Promise<void>((resolve) => {
      setActiveShot(shot)
      let n = 3
      setCountdown(n)
      const tick = () => {
        n -= 1
        if (n > 0) {
          setCountdown(n)
          window.setTimeout(tick, 1000)
        } else {
          setCountdown(null)
          captureAndSend(shot)
          resolve()
        }
      }
      window.setTimeout(tick, 1000)
    })
  }

  async function startSequence() {
    if (busy) return
    setBusy(true)
    for (let shot = 0; shot < SLOT_COUNT; shot++) {
      send({ type: 'countdown', shot })
      await runCountdown(shot)
      await new Promise((r) => window.setTimeout(r, 500))
    }
    setBusy(false)
  }

  function handleMessage(msg: Msg) {
    if (msg.type === 'settings') {
      setFrameId(msg.frameId)
      setFilter(msg.filter)
    } else if (msg.type === 'countdown') {
      void runCountdown(msg.shot)
    } else if (msg.type === 'photo') {
      const side = isHost ? 'guest' : 'host'
      setShots((prev) => {
        const next = [...prev]
        next[msg.shot] = { ...next[msg.shot], [side]: msg.data }
        return next
      })
    } else if (msg.type === 'retake') {
      setShots((prev) => {
        const next = [...prev]
        next[msg.shot] = { host: null, guest: null }
        return next
      })
    }
  }

  const { remoteStream, status, iceState, lastError, myId, turnReady, send } = useRoom({
    code,
    role: role ?? 'guest',
    localStream,
    onMessage: handleMessage,
  })

  useEffect(() => {
    const el = remoteVideoRef.current
    if (el && remoteStream) { el.srcObject = remoteStream; el.play().catch(() => {}) }
  }, [remoteStream])

  function changeFrame(id: string) {
    setFrameId(id)
    send({ type: 'settings', frameId: id, filter })
  }

  function changeFilter(value: string) {
    setFilter(value)
    send({ type: 'settings', frameId, filter: value })
  }

  function retake(shot: number) {
    setShots((prev) => {
      const next = [...prev]
      next[shot] = { host: null, guest: null }
      return next
    })
    send({ type: 'retake', shot })
  }

  function resetAll() {
    setShots(emptyShots())
    setActiveShot(null)
  }

  async function downloadStrip() {
    if (!allFilled || busy) return
    setBusy(true)
    try {
      const canvas = await composeStrip({ frame, shots, filter, mode: 'duo' })
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'snapin-strip.jpg'
      link.href = canvas.toDataURL('image/jpeg', 0.94)
      link.click()
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  if (!role) {
    return (
      <main className="grid min-h-screen place-items-center bg-sn-bg text-sn-ink">
        <span className="flex items-center gap-3 text-sn-muted"><Loader2 className="size-5 animate-spin" /> Menyiapkan ruangan…</span>
      </main>
    )
  }

  const statusLabel: Record<typeof status, string> = {
    connecting: 'Menghubungkan…',
    waiting: isHost ? 'Menunggu pasangan masuk…' : 'Menghubungkan ke host…',
    connected: 'Terhubung',
    error: 'Gagal terhubung',
  }

  return (
    <main className="min-h-screen bg-sn-bg text-sn-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/room" aria-label="Kembali"><Logo /></Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-sn-line-strong px-4 py-2 text-xs font-semibold text-sn-soft sm:inline-flex">
            {status === 'connected' ? <Wifi className="size-3.5 text-[#8068ff]" /> : <WifiOff className="size-3.5" />}
            {statusLabel[status]}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 pt-4 lg:grid-cols-[1fr_1fr] lg:px-10">
        {/* Kolom kiri: info + kontrol */}
        <div className="flex flex-col">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-sn-accent">
            <Sparkles className="size-4" /> Ruangan {code}
          </div>
          <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">
            Pose dulu,<br /><span className="text-sn-accent">baru jepret berdua.</span>
          </h1>
          <p className="mt-5 max-w-md leading-7 text-sn-muted">
            {isHost
              ? 'Bagikan link ini ke pasanganmu. Setelah dia masuk, tekan Mulai untuk jepret 4 foto bergantian.'
              : 'Tunggu host menekan Mulai. Pastikan wajahmu terlihat di kolom sisi kamu.'}
          </p>

          {isHost && (
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-sn-line bg-sn-panel p-2 pl-4">
              <span className="flex-1 truncate text-sm text-sn-soft">/room/{code}</span>
              <button onClick={copyLink} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sn-invert px-4 py-2 text-xs font-semibold text-sn-invert-ink transition hover:bg-sn-invert-hover">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Tersalin' : 'Salin link'}
              </button>
            </div>
          )}

          {cameraError && <p className="mt-5 text-sm text-sn-error">{cameraError}</p>}

          <div className="mt-7 flex flex-wrap gap-3">
            {isHost ? (
              <button
                onClick={startSequence}
                disabled={status !== 'connected' || busy || !!cameraError}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8068ff] px-6 py-3.5 font-semibold text-white transition hover:bg-[#9886ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Camera className="size-4" /> {busy ? 'Mengambil foto…' : 'Mulai'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-sn-line-strong px-5 py-3.5 text-sm font-semibold text-sn-soft">
                <Loader2 className="size-4 animate-spin" /> Menunggu host memulai
              </span>
            )}
            <button
              onClick={resetAll}
              disabled={filledCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sn-line-strong px-5 py-3.5 font-semibold transition hover:bg-sn-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-4" /> Ulang
            </button>
            <button
              onClick={downloadStrip}
              disabled={!allFilled || busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sn-invert px-5 py-3.5 font-semibold text-sn-invert-ink transition hover:bg-sn-invert-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="size-4" /> Download
            </button>
          </div>
        </div>

        {/* Kolom kanan: video live */}
        <div className="rounded-[2rem] border border-sn-line bg-sn-panel p-3 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between px-3 pb-3 text-xs text-sn-faint">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#8068ff]" /> live</span>
            <span>{filledCount}/{SLOT_COUNT} foto</span>
          </div>
          <div className="relative grid min-h-[380px] grid-cols-2 gap-1 overflow-hidden rounded-[1.5rem] bg-[#0b111a] sm:min-h-[460px]">
            {(isHost ? [bindLocal, bindRemote] : [bindRemote, bindLocal]).map((bind, i) => {
              const isLocal = (isHost && i === 0) || (!isHost && i === 1)
              return (
                <div key={i} className="relative overflow-hidden bg-black/40">
                  <video
                    ref={bind}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`size-full object-cover ${isLocal ? '-scale-x-100' : ''}`}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white">
                    {isLocal ? 'Kamu' : 'Pasangan'}
                  </span>
                  {!isLocal && !remoteStream && (
                    <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-sn-faint">
                      {status === 'connected' ? (
                        <>Menyambungkan<br />video…</>
                      ) : status === 'error' ? (
                        <>Koneksi<br />gagal</>
                      ) : (
                        <>Menunggu<br />pasangan…</>
                      )}
                    </span>
                  )}
                </div>
              )
            })}
            {countdown !== null && (
              <div className="absolute inset-0 grid place-items-center bg-black/40">
                <span className="text-8xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
          </div>

          {/* Diagnostik koneksi: membantu melacak masalah NAT/TURN atau kode salah. */}
          <p className="px-3 pt-3 text-[11px] leading-5 text-sn-faint">
            {myId && <>ID: <span className="text-sn-muted">{myId}</span> · </>}
            ICE: <span className="text-sn-muted">{iceState || '—'}</span> · TURN:{' '}
            <span className={turnReady ? 'text-sn-muted' : 'text-sn-error'}>{turnReady ? 'aktif' : 'tidak'}</span>
            {lastError && <> · <span className="text-sn-error">{lastError}</span></>}
          </p>
        </div>
      </section>

      {/* Preview strip + pengaturan */}
      <section className="border-t border-sn-line bg-sn-alt px-6 py-14 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-sn-accent">Hasil</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Strip kalian.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-sn-muted">
              Kiri untuk host, kanan untuk guest — sama urutannya di kedua device.
            </p>
            <div className="mt-6 flex justify-center lg:justify-start">
              <div className="relative h-[480px] shrink-0 shadow-2xl" style={{ aspectRatio: `${STRIP_W} / ${STRIP_H}` }}>
                {frame.slots.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => retake(i)}
                    disabled={busy}
                    title="Klik untuk ulangi foto ini"
                    aria-label={`Slot foto ${i + 1}`}
                    className={`absolute overflow-hidden bg-white/70 transition ${activeShot === i ? 'ring-4 ring-[#8068ff]' : ''}`}
                    style={{
                      left: `${(s.x / STRIP_W) * 100}%`,
                      top: `${(s.y / STRIP_H) * 100}%`,
                      width: `${(s.w / STRIP_W) * 100}%`,
                      height: `${(s.h / STRIP_H) * 100}%`,
                    }}
                  >
                    <span className="grid size-full grid-cols-2">
                      {shots[i].host ? <img src={shots[i].host!} alt="" style={{ filter }} className="size-full object-cover" /> : <span className="bg-white/70" />}
                      {shots[i].guest ? <img src={shots[i].guest!} alt="" style={{ filter }} className="size-full object-cover" /> : <span className="bg-white/70" />}
                    </span>
                    {!shots[i].host && !shots[i].guest && (
                      <span className="pointer-events-none absolute inset-0 grid place-items-center text-2xl font-semibold text-[#657985]">{i + 1}</span>
                    )}
                  </button>
                ))}
                <img src={frame.src} alt="" className="pointer-events-none absolute inset-0 size-full" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-sn-accent">Customize</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Isi sesukamu.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-sn-muted">Frame dan filter tersinkron otomatis di dua device.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <EditorGroup icon={<Layers3 />} title="Frame" items={stripFrames.map((f) => f.name)} selected={frame.name} onSelect={(name) => changeFrame(stripFrames.find((f) => f.name === name)?.id ?? stripFrames[0].id)} />
              <EditorGroup icon={<Sparkles />} title="Filter" items={filters.map((f) => f.name)} selected={filters.find((f) => f.value === filter)?.name ?? 'Original'} onSelect={(name) => changeFilter(filters.find((f) => f.name === name)?.value ?? 'none')} />
            </div>
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
