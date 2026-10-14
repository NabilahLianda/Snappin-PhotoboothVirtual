export const STRIP_W = 600
export const STRIP_H = 1800

export type Slot = { x: number; y: number; w: number; h: number }

export type StripFrame = {
  id: string
  name: string
  src: string
  width: number
  height: number
  slots: Slot[]
}

const ys = [40, 440, 840, 1240]
const makeSlots = (x: number, w: number): Slot[] => ys.map((y) => ({ x, y, w, h: 380 }))

export const stripFrames: StripFrame[] = [
  { id: 'classic', name: 'Klasik', src: '/frames/strip-classic.svg', width: STRIP_W, height: STRIP_H, slots: makeSlots(40, 520) },
  { id: 'midnight', name: 'Midnight', src: '/frames/strip-midnight.svg', width: STRIP_W, height: STRIP_H, slots: makeSlots(40, 520) },
  { id: 'pastel', name: 'Pastel', src: '/frames/strip-pastel.svg', width: STRIP_W, height: STRIP_H, slots: makeSlots(40, 520) },
  { id: 'film', name: 'Film', src: '/frames/strip-film.svg', width: STRIP_W, height: STRIP_H, slots: makeSlots(70, 460) },
]
