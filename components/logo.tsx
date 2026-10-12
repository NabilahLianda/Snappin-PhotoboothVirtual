// Logo Snapin dipakai bersama oleh landing page dan halaman studio.
// Kalau nanti file logo sudah disimpan lokal di folder public (misalnya public/logo.png),
// cukup ganti nilai logoUrl menjadi '/logo.png'.
export const logoUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snapin%20BG-aTaJLQJ7hqZ1r1lpwFRMVx465XwgRC.png'

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-10 overflow-hidden rounded-xl bg-sn-logo">
        <img
          src={logoUrl}
          alt="Snapin"
          className="absolute h-full w-auto max-w-none object-cover object-left"
        />
      </span>
      <span className="text-xl font-semibold tracking-tight">
        snapin<span className="text-sn-accent">.</span>
      </span>
    </span>
  )
}
