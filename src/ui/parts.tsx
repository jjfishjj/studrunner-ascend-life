import type { CSSProperties, ReactNode } from 'react'

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
