// Logo Snapin dipakai bersama oleh landing page dan halaman studio.
// File logonya disimpan lokal di public/snapin-logo.png (hasil crop dari logo asli
// supaya padding transparannya hilang). Kalau file logo diganti, cukup ganti src-nya.
export const logoUrl = '/snapin-logo.png'

export function Logo() {
  return (
    <span className="inline-flex items-center rounded-xl bg-sn-chip px-3 py-2">
      <img src={logoUrl} alt="Snapin" className="h-8 w-auto" />
    </span>
  )
}
