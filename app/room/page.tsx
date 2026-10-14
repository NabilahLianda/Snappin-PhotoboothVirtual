'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Copy, Sparkles, Users } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

// Tanpa huruf/angka yang mudah tertukar (I, O, 0, 1).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LEN = 6

function makeCode() {
  let out = ''
  for (let i = 0; i < CODE_LEN; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return out
}

export default function Page() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function createRoom() {
    router.push(`/room/${makeCode()}?host=1`)
  }

  function joinRoom(event: React.FormEvent) {
    event.preventDefault()
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length !== CODE_LEN) {
      setError(`Kode ruangan harus ${CODE_LEN} karakter.`)
      return
    }
    setError('')
    router.push(`/room/${clean}`)
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

      <section className="mx-auto grid max-w-5xl gap-10 px-6 pb-20 pt-8 lg:px-10 lg:pt-16">
        <div className="max-w-xl">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-sn-accent"><Sparkles className="size-4" /> Photobooth berdua</div>
          <h1 className="text-5xl font-semibold leading-[.98] tracking-[-.06em] sm:text-6xl">
            Berfoto bareng,<br /><span className="text-sn-accent">walau beda tempat.</span>
          </h1>
          <p className="mt-6 max-w-md leading-7 text-sn-muted">
            Buat ruangan, kirim linknya ke pasanganmu, lalu jepret berdua dalam satu strip.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-[2rem] border border-sn-line bg-sn-panel p-7 shadow-2xl shadow-black/20">
            <span className="mb-6 grid size-11 place-items-center rounded-2xl bg-[#8068ff]/15 text-sn-accent"><Users className="size-5" /></span>
            <h2 className="text-xl font-semibold">Buat ruangan</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-sn-muted">
              Kamu jadi host. Bagikan link ke pasanganmu supaya dia bisa masuk.
            </p>
            <button onClick={createRoom} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#8068ff] px-5 py-3.5 font-semibold text-white transition hover:bg-[#9886ff]">
              Buat ruangan <ArrowRight className="size-4" />
            </button>
          </div>

          <form onSubmit={joinRoom} className="flex flex-col rounded-[2rem] border border-sn-line bg-sn-panel p-7 shadow-2xl shadow-black/20">
            <span className="mb-6 grid size-11 place-items-center rounded-2xl bg-sn-card text-sn-soft"><Copy className="size-5" /></span>
            <h2 className="text-xl font-semibold">Gabung ruangan</h2>
            <p className="mt-3 text-sm leading-6 text-sn-muted">Punya kode dari pasangan? Masukkan {CODE_LEN} karakternya di sini.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="K7P2QX"
              maxLength={CODE_LEN}
              autoComplete="off"
              className="mt-5 w-full rounded-xl border border-sn-line-strong bg-sn-bg px-4 py-3 text-center text-lg font-semibold tracking-[.4em] text-sn-ink uppercase outline-none placeholder:text-sn-dim focus:border-[#8068ff]"
            />
            {error && <p className="mt-3 text-sm text-sn-error">{error}</p>}
            <button type="submit" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-sn-line-strong px-5 py-3.5 font-semibold transition hover:bg-sn-hover">
              Gabung <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-sn-line px-6 py-8 text-center text-xs text-sn-dim">Buat momen yang lebih kamu.</footer>
    </main>
  )
}
