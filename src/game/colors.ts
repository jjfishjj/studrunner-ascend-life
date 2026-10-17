/** 樂高經典配色（紅、黃、藍、綠、白、黑）＋少量中性色。 */
export const C = {
  red: '#C91A09',
  yellow: '#F2CD37',
  blue: '#0055BF',
  green: '#237841',
  white: '#F2F3F2',
  black: '#1B2A34',
  gray: '#A0A5A9',
  darkGray: '#6C6E68',
  orange: '#FE8A18',
  lime: '#A5CA18',
  sky: '#5ABFEA',
  darkGreen: '#184632',
  darkRed: '#720E0F',
  darkBlue: '#0A3463',
  brown: '#582A12',
} as const

export const CLASSIC = [C.red, C.yellow, C.blue, C.green, C.white, C.black] as const

/** 凸點尺寸 */
export const STUD_R = 0.3
export const STUD_H = 0.2

/** 可重現的亂數（mulberry32） */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
