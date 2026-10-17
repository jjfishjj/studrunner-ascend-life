import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CONFIG, DEFAULT_CONFIG } from '../game/config'
import { GameWorld, PLAYER_R } from '../game/engine'
import { buildLevel } from '../game/levels'
import { readInput, resetInput } from '../game/input'
import { ambienceSnapshot, audioState, setAmbience, sfx } from '../game/audio'
import { useGame } from '../game/store'
import type { Vec3 } from '../game/types'
import { stageOf, NOTE_BY_ID } from '../game/notes'
import { COIN_COLORS, DUST_COLORS, HURT_COLORS, PARTY_COLORS, BrickBurst, Particles } from './Particles'
import { LevelScene } from './LevelScene'
import { Player } from './Minifigure'

const DT = 1 / 60

/** 以程式生成的房間環境貼圖，讓塑膠有柔和反射（不需下載 HDR） */
function Env({ intensity = 0.55 }: { intensity?: number }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = intensity
    return () => { scene.environment = null; env.dispose(); pmrem.dispose() }
  }, [gl, scene, intensity])
  return null
}

const ATTRACT: Record<number, { focus: Vec3; dist: number; height: number; speed: number }> = {
  1: { focus: [0, 1, -12], dist: 20, height: 7, speed: 0.1 },
  2: { focus: [0, 0, -50], dist: 46, height: 14, speed: 0.07 },
  3: { focus: [0, 0, -60], dist: 52, height: 14, speed: 0.06 },
  4: { focus: [0, 12, 0], dist: 32, height: 8, speed: 0.12 },
  5: { focus: [4, 4, -4], dist: 78, height: 38, speed: 0.05 },
  6: { focus: [0, 3, -18], dist: 52, height: 20, speed: 0.045 },
}

type Mode = 'play' | 'attract'

function Sim({ world, fx, mode, alphaRef, sun }: { world: GameWorld; fx: BrickBurst; mode: Mode; alphaRef: React.MutableRefObject<number>; sun: THREE.DirectionalLight }) {
  const gl = useThree(s => s.gl)
  const acc = useRef(0)
  const focus = useRef(new THREE.Vector3(world.player.position.x, world.player.position.y, world.player.position.z))
  const ended = useRef(false)
  const lastSig = useRef('')
  const timers = useRef<number[]>([])
  const p = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    resetInput()
    const dbg = import.meta.env.DEV || new URLSearchParams(location.search).has('debug')
    if (dbg) (window as unknown as { __studrunner: unknown }).__studrunner = { world, store: useGame, gl, audioState, ambienceSnapshot }
    const ts = timers.current
    return () => { ts.forEach(clearTimeout) }
  }, [world, gl])

  const handleEvents = () => {
    const st = useGame.getState()
    for (const e of world.drainEvents()) {
      switch (e.type) {
        case 'coin':
          fx.burst(e.pos, COIN_COLORS, 16, 6.5); world.level.id === 6 ? sfx.star() : sfx.coin()
          break
        case 'note': {
          const def = NOTE_BY_ID[e.id]
          const color = def ? stageOf(def.stage).color : '#F2CD37'
          fx.burst(e.pos, [color, '#F2F3F2', '#F2CD37', color], 30, 7.5, 0.35); sfx.note()
          st.collectNote(e.id)
          break
        }
        case 'hurt':
          fx.burst([e.pos[0], e.pos[1] + 1, e.pos[2]], HURT_COLORS, 22, 8.5); sfx.hurt(); st.hurtFlash()
          st.showToast('哎呀！被撞到了', 'bad')
          break
        case 'fall':
          sfx.fall(); st.hurtFlash(); st.showToast('掉下去了！回到檢查點', 'bad')
          break
        case 'respawn':
          fx.burst([e.pos[0], e.pos[1] + 0.5, e.pos[2]], PARTY_COLORS, 12, 5)
          break
        case 'jump':
          fx.burst(e.pos, DUST_COLORS, 4, 2.5, 0.2); sfx.jump()
          break
        case 'land':
          fx.burst(e.pos, DUST_COLORS, e.hard ? 9 : 4, e.hard ? 4 : 2.5, 0.22); sfx.land()
          break
        case 'checkpoint':
          fx.burst([e.pos[0], e.pos[1] + 1, e.pos[2]], PARTY_COLORS, 18, 6); sfx.checkpoint()
          st.showToast('檢查點已記錄！', 'good')
          break
        case 'switch':
          sfx.switch(); fx.burst([e.pos[0], e.pos[1] + 0.4, e.pos[2]], [ '#0055BF', '#F2F3F2' ], 10, 4)
          st.showToast(`閘門開啟！${world.level.gate?.openSeconds ?? 10} 秒內通過`, 'good')
          break
        case 'gate':
          if (e.open) world.level.id === 6 ? sfx.portal() : sfx.gateOpen()
          else { sfx.gateClose(); if (world.level.gate?.mode === 'switch') st.showToast('閘門關閉了！回頭再踩一次按鈕', 'bad') }
          if (e.open && world.level.gate?.mode !== 'switch') st.showToast('終點閘門打開了！', 'good')
          break
        case 'goalLocked':
          sfx.locked(); st.showToast(`還差 ${e.need} 張筆記磚才能通過終點`, 'bad')
          break
        case 'win':
          fx.burst([e.pos[0], e.pos[1] + 1.5, e.pos[2]], PARTY_COLORS, 80, 9, 0.4); world.level.id === 6 ? sfx.finale() : sfx.win()
          break
        case 'lose':
          sfx.lose()
          break
      }
    }
  }

  const syncHud = () => {
    const st = useGame.getState()
    const left = world.timeLeft
    const time = left ?? world.time
    const gate = Math.ceil(world.gateTimer * 10) / 10
    const sig = `${world.lives}|${world.coins}|${world.notesGot}|${Math.floor(time * 10)}|${gate}|${world.invul > 0}`
    if (sig === lastSig.current) return
    lastSig.current = sig
    st.setHud({ lives: world.lives, livesMax: world.livesMax, coins: world.coins, coinsTotal: world.level.coins.length, notes: world.notesGot, notesTotal: world.level.notes.length, time, countdown: left !== null, gate, invul: world.invul > 0 })
  }

  const checkEnd = () => {
    if (ended.current || world.status === 'playing') return
    ended.current = true
    const lvl = world.level
    const won = world.status === 'won'
    const t = window.setTimeout(() => {
      useGame.getState().finish({
        levelId: lvl.id, won, reason: world.loseReason,
        time: world.loseReason === 'time' ? (lvl.timeLimit ?? world.time) : world.time,
        coins: world.coins, coinsTotal: lvl.coins.length, notes: world.notesGot, notesTotal: lvl.notes.length, lives: world.lives, livesMax: world.livesMax, parTime: lvl.parTime,
      })
    }, won ? 1600 : 1100)
    timers.current.push(t)
  }

  // 環境音：依玩家與各自然區的距離調整海浪／瀑布／鳥鳴音量
  const ambT = useRef(0)
  const ambienceLevel = useRef<number | null>(null)
  const updateAmbience = () => {
    const nat = world.level.nature
    const now = performance.now()
    if (ambienceLevel.current !== world.level.id) {
      ambienceLevel.current = world.level.id
      ambT.current = 0
      if (!nat) setAmbience({})
    }
    if (now - ambT.current < 140) return
    ambT.current = now
    if (!nat) { setAmbience({}); return }
    const px = world.player.position.x, py = world.player.position.y, pz = world.player.position.z
    const lv = { sea: 0, falls: 0, jungle: 0, forest: 0, river: 0, wind: 0, cosmos: 0, night: 0, meadow: 0, birds: 0, insects: 0 }
    for (const z of nat.zones) {
      const dist = Math.hypot(px - z.pos[0], pz - z.pos[1], py - (z.y ?? 0))
      const v = Math.max(0, 1 - dist / z.radius)
      if (v > lv[z.kind]) lv[z.kind] = v
    }
    for (const k of Object.keys(lv) as (keyof typeof lv)[]) {
      const curve = k === 'sea' || k === 'falls' || k === 'river' ? 1.15 : 1.3
      lv[k] = lv[k] ** curve
    }
    setAmbience(lv)
  }
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const camera = state.camera as THREE.PerspectiveCamera
    const lvl = world.level

    if (mode === 'play') {
      const st = useGame.getState()
      if (!st.paused && world.status === 'playing') {
        acc.current += dt
        let n = 0
        while (acc.current >= DT && n < 5 && world.status === 'playing') { world.step(DT, readInput()); acc.current -= DT; n++ }
        if (n >= 5) acc.current = 0
      }
      alphaRef.current = world.status === 'playing' ? Math.min(1, acc.current / DT) : 1
      handleEvents()
      updateAmbience()
      syncHud()
      checkEnd()
    } else {
      alphaRef.current = 1
    }
    fx.update(dt)

    // 攝影機
    if (mode === 'attract') {
      const a = ATTRACT[lvl.id] ?? ATTRACT[1]
      const ang = 0.6 + state.clock.elapsedTime * a.speed
      camera.position.set(a.focus[0] + Math.sin(ang) * a.dist, a.focus[1] + a.height, a.focus[2] + Math.cos(ang) * a.dist)
      focus.current.set(a.focus[0], a.focus[1], a.focus[2])
      camera.lookAt(focus.current)
    } else {
      const al = alphaRef.current
      const prev = world.prevPos, cur = world.player.position
      p.set(prev.x + (cur.x - prev.x) * al, prev.y + (cur.y - prev.y) * al - PLAYER_R, prev.z + (cur.z - prev.z) * al)
      const k = 1 - Math.exp(-CONFIG.camera.follow * dt)
      focus.current.x += (p.x - focus.current.x) * Math.min(1, k * 1.6)
      focus.current.z += (p.z - focus.current.z) * Math.min(1, k * 1.6)
      focus.current.y += (p.y - focus.current.y) * k * 0.7
      const scale = CONFIG.camera.distance / DEFAULT_CONFIG.camera.distance
      const dist = lvl.camera.distance * scale
      const height = lvl.camera.height * scale
      const yaw = world.camYaw
      camera.position.set(focus.current.x + Math.sin(yaw) * dist, focus.current.y + height, focus.current.z + Math.cos(yaw) * dist)
      camera.lookAt(focus.current.x, focus.current.y + 1.1, focus.current.z)
    }

    if (import.meta.env.DEV) {
      const o = (window as unknown as { __cam?: { pos: Vec3; look: Vec3 } }).__cam
      if (o) { camera.position.set(...o.pos); camera.lookAt(...o.look) }
    }
    // 太陽跟隨焦點（以 2 單位吸附，避免陰影閃爍）
    const sx = Math.round(focus.current.x / 2) * 2, sy = Math.round(focus.current.y / 2) * 2, sz = Math.round(focus.current.z / 2) * 2
    sun.position.set(sx + 16, sy + 36, sz + 12)
    sun.target.position.set(sx, sy, sz)
    sun.target.updateMatrixWorld()
  })
  return null
}

function World3D({ levelId, mode }: { levelId: number; mode: Mode }) {
  const world = useMemo(() => new GameWorld(buildLevel(levelId)), [levelId])
  const fx = useMemo(() => new BrickBurst(), [])
  const alphaRef = useRef(1)
  const won = useGame(s => s.screen === 'victory')
  const sun = useMemo(() => {
    const l = new THREE.DirectionalLight(world.level.light?.sun ?? '#fff4e0', world.level.light?.sunIntensity ?? 2.6)
    l.castShadow = true
    l.shadow.mapSize.set(2048, 2048)
    const c = l.shadow.camera
    c.left = -26; c.right = 26; c.top = 26; c.bottom = -26; c.near = 1; c.far = 120
    l.shadow.bias = -0.0004
    l.shadow.normalBias = 0.05
    return l
  }, [world])
  useEffect(() => () => world.dispose(), [world])
  const lvl = world.level
  return (
    <>
      <color attach="background" args={[lvl.sky]} />
      <fog attach="fog" args={[lvl.fog[0], lvl.fog[1], lvl.fog[2]]} />
      <Env intensity={lvl.light?.env ?? 0.55} />
      <hemisphereLight args={[lvl.light?.hemiSky ?? '#ffffff', lvl.light?.hemiGround ?? '#8fa3b8', lvl.light?.hemiIntensity ?? 0.9]} />
      <primitive object={sun} />
      <primitive object={sun.target} />
      <LevelScene world={world} getAlpha={() => alphaRef.current} />
      <Player world={world} getAlpha={() => alphaRef.current} celebrate={won} />
      <Particles fx={fx} />
      <Sim world={world} fx={fx} mode={mode} alphaRef={alphaRef} sun={sun} />
    </>
  )
}

/** 常駐的 3D 畫布：遊玩時顯示當前關卡，選單時顯示展示用的關卡。 */
export function GameView() {
  const screen = useGame(s => s.screen)
  const levelId = useGame(s => s.levelId)
  const runId = useGame(s => s.runId)
  const attract = useGame(s => s.attract)
  const [dpr, setDpr] = useState(1.5)
  const playing = screen === 'playing' || screen === 'gameover' || screen === 'victory'
  const mode: Mode = playing ? 'play' : 'attract'
  const id = playing ? levelId : attract
  return (
    <Canvas
      className="!absolute inset-0"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={dpr}
      flat
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 55, near: 0.1, far: 400, position: [0, 8, 14] }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <World3D key={`${mode}-${id}-${mode === 'play' ? runId : 0}`} levelId={id} mode={mode} />
    </Canvas>
  )
}
