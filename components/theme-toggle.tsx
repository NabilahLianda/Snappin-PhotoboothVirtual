'use client'

import { Moon, Sun } from 'lucide-react'

// Tombol ganti tema. Pilihan disimpan di localStorage dan dibaca lagi oleh
// skrip kecil di app/layout.tsx supaya tidak berkedip saat halaman dimuat.
export function ThemeToggle() {
  function toggle() {
    const isLight = document.documentElement.classList.toggle('light')
    try {
      localStorage.setItem('snapin-theme', isLight ? 'light' : 'dark')
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-sn-line-strong text-sn-soft transition hover:bg-sn-hover hover:text-sn-ink"
    >
      <Moon className="size-4 light:hidden" />
      <Sun className="hidden size-4 light:block" />
    </button>
  )
}
