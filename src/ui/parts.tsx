import type { CSSProperties, ReactNode } from 'react'
import { useGame } from '../game/store'

export const COLORS = { red: '#C91A09', yellow: '#F2CD37', blue: '#0055BF', green: '#237841', white: '#F2F3F2', black: '#1B2A34' }

export function Brick({ color, studs = true, className = '', children, style }: { color: string; studs?: boolean; className?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`brick ${studs ? 'brick-studs' : ''} ${className}`} style={{ ['--c' as string]: color, ...style }}>
      {children}
    </div>
  )
}

export function Stars({ n, size = 40 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${n} 顆星`}>
      {[1, 2, 3].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= n ? 'drop-shadow-[0_3px_0_rgba(0,0,0,.35)]' : 'opacity-35'}>
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill={i <= n ? COLORS.yellow : '#9aa7b5'} stroke="#1B2A34" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}

export function Heart({ on }: { on: boolean }) {
  return (
    <svg width="30" height="28" viewBox="0 0 24 22" className={on ? '' : 'opacity-30'}>
      <path d="M12 21C5 15.5 1.5 12 1.5 7.6 1.5 4.4 4 2 7 2c2 0 3.8 1 5 2.8C13.2 3 15 2 17 2c3 0 5.5 2.4 5.5 5.6 0 4.4-3.5 7.9-10.5 13.4z" fill={on ? COLORS.red : '#6b7785'} stroke="#1B2A34" strokeWidth="1.6" strokeLinejoin="round" />
      {on && <path d="M6 6.2c.8-1 2-1.4 3-1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".7" />}
    </svg>
  )
}

export function CoinIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={COLORS.yellow} stroke="#1B2A34" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="6.6" fill="#E3B908" stroke="#B88F00" strokeWidth="1" />
      <circle cx="12" cy="12" r="2.6" fill={COLORS.yellow} stroke="#1B2A34" strokeWidth="1.2" />
    </svg>
  )
}

export function Key({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <span className={`inline-flex h-8 items-center justify-center rounded-md bg-white px-2 text-sm font-black text-[#1B2A34] shadow-[0_3px_0_rgba(0,0,0,.45)] ${wide ? 'min-w-20' : 'min-w-8'}`}>{children}</span>
  )
}

/** 筆記進度小圓點（凸點造型）：已收集的亮起，未收集的暗淡。 */
export function NotePips({ got, total = 4, color, size = 14 }: { got: number; total?: number; color: string; size?: number }) {
  return (
    <div className="flex gap-1" aria-label={`筆記 ${got} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="inline-block rounded-full border-2 border-black/40" style={{ width: size, height: size, background: i < got ? color : 'rgba(0,0,0,.25)', boxShadow: i < got ? 'inset 0 2px 0 rgba(255,255,255,.45)' : 'none' }} />
      ))}
    </div>
  )
}

/** 筆記圖示：一本小書（用於 HUD 與選單）。 */
export function NoteIcon({ size = 28, color = '#F2F3F2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={color} stroke="#1B2A34" strokeWidth="1.8" />
      <path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5.5" stroke="#1B2A34" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** 右下角的喇叭按鈕：一眼看出音效開關（也可按 M）。 */
export function SpeakerButton() {
  const muted = useGame(s => s.save.muted)
  const toggle = useGame(s => s.toggleMute)
  return (
    <button
      onClick={e => { toggle(); (e.currentTarget as HTMLButtonElement).blur() }}
      aria-label={muted ? '開啟音效' : '關閉音效'}
      title={muted ? '音效：關（按 M 開啟）' : '音效：開（按 M 關閉）'}
      data-testid="speaker"
      className="absolute bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black/30 bg-white/90 shadow-lg transition-transform hover:scale-105"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B2A34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="#1B2A34" />
        {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></>}
      </svg>
    </button>
  )
}
