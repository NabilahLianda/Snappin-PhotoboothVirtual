'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  ImagePlus,
  Layers3,
  Menu,
  Sparkles,
  Upload,
  Users,
  WandSparkles,
  X,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

const features = [
  { icon: Camera, title: 'Foto sesukamu', text: 'Pakai webcam atau unggah foto dari galeri. Tanpa timer yang bikin panik.' },
  { icon: Layers3, title: 'Edit lebih bebas', text: 'Pilih layout, frame, filter, stiker, dan teks untuk bikin hasil yang personal.' },
  { icon: Download, title: 'Simpan kualitas HD', text: 'Preview dengan watermark, lalu unduh hasil final tanpa watermark.' },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-sn-bg text-sn-ink">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 sn-hero-bg" />
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <a href="#top" aria-label="Snapin"><Logo /></a>
          <div className="flex items-center gap-3 md:gap-8">
          <nav className={`${menuOpen ? 'flex' : 'hidden'} absolute left-6 right-6 top-20 z-20 flex-col gap-4 rounded-2xl border border-sn-line bg-sn-panel/95 p-5 text-sm text-sn-soft shadow-2xl md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
            <a href="#cara-kerja" className="transition hover:text-sn-ink">Cara kerja</a>
            <a href="#fitur" className="transition hover:text-sn-ink">Fitur</a>
            <a href="#tentang" className="transition hover:text-sn-ink">Tentang Snapin</a>
            <Link href="/room" className="transition hover:text-sn-ink">Berfoto berdua</Link>
            <Link href="/studio" className="rounded-full bg-sn-invert px-5 py-2.5 text-center font-semibold text-sn-invert-ink transition hover:bg-sn-invert-hover">Mulai gratis <ArrowRight className="ml-1 inline size-4" /></Link>
          </nav>
          <ThemeToggle />
          <button aria-label="Buka menu" className="rounded-lg border border-sn-line p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </header>

        <section id="top" className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-32 lg:pt-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#8373ff]/30 bg-[#8373ff]/10 px-3 py-1.5 text-xs font-medium text-sn-accent-soft"><Sparkles className="size-3.5" /> Photobooth digital untuk momen kamu</div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">Bikin momenmu <span className="text-sn-accent">lebih kamu.</span></h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-sn-muted sm:text-lg">Photobooth online yang bikin kamu bebas berfoto, berekspresi, dan mengedit tanpa antrean atau batas waktu.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8068ff] text-white px-6 py-3.5 font-semibold shadow-[0_10px_30px_rgba(128,104,255,0.27)] transition hover:bg-[#937fff]">Coba Snapin <ArrowRight className="size-4" /></Link>
              <Link href="/room" className="inline-flex items-center justify-center gap-2 rounded-full border border-sn-line-strong px-6 py-3.5 font-semibold text-sn-soft transition hover:bg-sn-hover"><Users className="size-4" /> Berfoto berdua</Link>
              <a href="#cara-kerja" className="inline-flex items-center justify-center rounded-full px-6 py-3.5 font-semibold text-sn-muted transition hover:text-sn-ink">Lihat cara kerja</a>
            </div>
            <div className="mt-12 flex items-center gap-8 text-sm text-sn-muted"><div><strong className="text-xl text-sn-ink">∞</strong><span className="ml-2">waktu berkreasi</span></div><div><strong className="text-xl text-sn-ink">HD</strong><span className="ml-2">download</span></div></div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-10 rounded-full bg-[#7561ff]/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-sn-line-strong bg-sn-panel/80 p-3 shadow-2xl backdrop-blur">
              <div className="mb-3 flex items-center justify-between px-3 pt-1 text-xs text-sn-muted"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#8068ff] text-white" /> snapin studio</span><span>preview mode</span></div>
              <div className="grid min-h-[420px] place-items-center overflow-hidden rounded-[1.5rem] bg-[#d9e5ec] p-8">
                <div className="relative w-56 rotate-[-3deg] bg-white p-3 pb-14 shadow-[0_20px_50px_rgba(17,29,42,0.3)]">
                  <div className="grid aspect-[4/5] grid-cols-2 gap-1 overflow-hidden bg-[#b8cddd] p-1"><div className="bg-[#a8c4d7]" /><div className="bg-[#cbd9e3]" /><div className="col-span-2 bg-[#91b3cc]" /></div>
                  <span className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold tracking-[0.3em] text-[#738a9a]">SNAPIN</span>
                  <span className="absolute right-3 top-3 rounded-full bg-black/10 px-2 py-1 text-[9px] text-slate-600">watermark</span>
                </div>
                <div className="absolute bottom-7 right-7 rounded-2xl border border-white/60 bg-white/70 p-3 text-[#334352] shadow-lg backdrop-blur"><WandSparkles className="size-5 text-[#8068ff]" /></div>
              </div>
              <div className="flex items-center justify-between px-3 pb-1 pt-4"><span className="text-xs text-sn-faint">Your moment, your way.</span><span className="rounded-full bg-[#8068ff] text-white px-3 py-1.5 text-xs font-semibold">edit frame</span></div>
            </div>
          </div>
        </section>
      </div>

      <section id="fitur" className="border-y border-sn-line bg-sn-alt px-6 py-20 lg:px-10"><div className="mx-auto max-w-7xl"><div className="mb-12 max-w-xl"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sn-accent">Kenapa Snapin?</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Lebih santai. Lebih kreatif. Lebih kamu.</h2></div><div className="grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-3xl border border-sn-line bg-sn-card p-7 transition hover:-translate-y-1 hover:border-[#8068ff]/50"><div className="mb-10 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#8068ff]/15 text-sn-accent"><Icon className="size-5" /></span><span className="text-sm text-sn-dim">0{index + 1}</span></div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-6 text-sn-muted">{text}</p></article>)}</div></div></section>

      <section id="cara-kerja" className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10"><div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sn-accent">Cara kerja</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Dari foto biasa jadi cerita yang seru.</h2><p className="mt-5 leading-7 text-sn-muted">Semua proses ada di satu tempat. Kamu punya waktu untuk menemukan pose dan style terbaikmu.</p></div><div className="grid gap-4 sm:grid-cols-3">{['Ambil atau unggah foto', 'Edit dengan style kamu', 'Download hasil HD'].map((step, i) => <div key={step} className="relative rounded-3xl border border-sn-line p-6"><span className="mb-12 grid size-9 place-items-center rounded-full bg-[#d8e7ef] text-sm font-bold text-[#182532]">{i + 1}</span><p className="font-medium leading-6">{step}</p>{i < 2 && <ArrowRight className="absolute right-4 top-9 hidden size-4 text-[#8068ff] sm:block" />}</div>)}</div></section>

      <section id="mulai" className="px-6 pb-20 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] border border-[#8068ff]/25 bg-sn-cta p-8 sm:p-12 lg:flex-row lg:items-center"><div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sn-accent">Siap bikin momen?</p><h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Mulai dari satu foto, buat jadi kenangan.</h2><div className="mt-6 flex flex-wrap gap-3 text-sm text-sn-soft"><span className="flex items-center gap-2"><Check className="size-4 text-sn-accent" /> Gratis untuk mulai</span><span className="flex items-center gap-2"><Check className="size-4 text-sn-accent" /> Tanpa antre</span></div></div><div className="w-full max-w-sm"><Link href="/studio" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#8068ff] text-white px-6 py-4 font-semibold shadow-[0_12px_32px_rgba(128,104,255,0.25)] transition hover:bg-[#9584ff]"><ImagePlus className="size-5" /> Upload foto pertama</Link><Link href="/room" className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-sn-line-strong px-6 py-4 font-semibold text-sn-soft transition hover:bg-sn-hover"><Users className="size-5" /> Berfoto berdua</Link><p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-sn-faint"><Upload className="size-3" /> JPG, PNG hingga 10MB</p></div></div></section>

      <footer id="tentang" className="border-t border-sn-line px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-sn-faint sm:flex-row sm:items-center sm:justify-between"><span>Photobooth digital untuk generasi yang bebas berekspresi.</span><span>© 2026 Snapin</span></div></footer>
    </main>
  )
}
