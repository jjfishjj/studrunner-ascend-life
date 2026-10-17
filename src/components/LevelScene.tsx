import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { C } from '../game/colors'
import type { GameWorld } from '../game/engine'
import { motionPose } from '../game/motion'
import { NOTE_BY_ID, stageOf } from '../game/notes'
import { BRICK_H, type LevelDef } from '../game/types'
import { BrickField } from './BrickField'
import { LegoBrick } from './LegoBrick'
import { Nature } from './Nature'
import { plastic } from './brickKit'

const DT = 1 / 60
const cyl = new THREE.CylinderGeometry(1, 1, 1, 24)

/** 移動/旋轉/脈衝的機關積木 */
function Movers({ world, getAlpha }: { world: GameWorld; getAlpha: () => number }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const t = world.animTime - (1 - getAlpha()) * DT
    world.movers.forEach((m, i) => {
      const g = refs.current[i]
      if (!g) return
      const b = m.spec.brick
      const p = motionPose(m.spec.motion, Math.max(0, t))
      g.position.set(b.pos[0] + p.dx, b.pos[1] + p.dy + (p.warn ? Math.sin(t * 60) * 0.06 : 0), b.pos[2] + p.dz)
      g.rotation.y = p.angle
    })
  })
  return (
    <>
      {world.movers.map((m, i) => (
        <LegoBrick key={m.spec.id} ref={el => { refs.current[i] = el }} size={m.spec.brick.size} color={m.spec.brick.color}
          studs={m.spec.brick.studs !== false} emissive={m.spec.motion.type === 'pulse' ? 0.35 : 0} />
      ))}
    </>
  )
}

function Gate({ world }: { world: GameWorld }) {
  const ref = useRef<THREE.Group>(null)
  const g = world.level.gate
  useFrame(() => {
    if (!g || !ref.current) return
    ref.current.position.set(g.brick.pos[0], g.brick.pos[1] - world.gateAmount * g.sink, g.brick.pos[2])
  })
  if (!g) return null
  return <LegoBrick ref={ref} size={g.brick.size} color={g.brick.color} position={g.brick.pos} emissive={g.mode === 'switch' ? 0.2 : 0} />
}

function Coins({ world }: { world: GameWorld }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(state => {
    const t = state.clock.elapsedTime
    world.level.coins.forEach((c, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = !world.collected[i]
      g.position.set(c[0], c[1] + Math.sin(t * 2.6 + i) * 0.14, c[2])
      g.rotation.y = t * 2.4 + i
    })
  })
  const mat = plastic(C.yellow, 0.3)
  const rim = plastic(C.orange, 0.15)
  return (
    <>
      {world.level.coins.map((c, i) => (
        <group key={i} ref={el => { refs.current[i] = el }} position={c}>
          {/* 圓形薄片磚（立起）+ 兩面中央凸點 */}
          <mesh geometry={cyl} material={mat} scale={[0.52, 0.12, 0.52]} rotation={[Math.PI / 2, 0, 0]} castShadow />
          <mesh geometry={cyl} material={rim} scale={[0.4, 0.14, 0.4]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={cyl} material={mat} scale={[0.16, 0.12, 0.16]} position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={cyl} material={mat} scale={[0.16, 0.12, 0.16]} position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
    </>
  )
}

/** 筆記磚：發光的彩色大積木 + 白色書頁，頭上有一道彩色光柱，遠遠就看得到。 */
function Notes({ world }: { world: GameWorld }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(state => {
    const t = state.clock.elapsedTime
    world.level.notes.forEach((n, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = !world.noteCollected[i]
      g.position.set(n.pos[0], n.pos[1] + Math.sin(t * 2.2 + i * 1.7) * 0.18, n.pos[2])
      g.rotation.y = t * 1.6 + i
    })
  })
  return (
    <>
      {world.level.notes.map((n, i) => {
        const def = NOTE_BY_ID[n.id]
        const color = def ? stageOf(def.stage).color : C.yellow
        return (
          <group key={n.id} ref={el => { refs.current[i] = el }} position={n.pos}>
            <LegoBrick size={[1.5, 0.7, 1.1]} color={color} emissive={0.5} position={[0, -0.35, 0]} />
            <LegoBrick size={[1.15, 0.14, 0.8]} color={C.white} studs={false} emissive={0.6} position={[0, 0.5, 0]} />
            <mesh position={[0, 3.2, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 6, 14, 1, true]} />
              <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}
function Checkpoints({ world }: { world: GameWorld }) {
  const flags = useRef<(THREE.Mesh | null)[]>([])
  useFrame(state => {
    const t = state.clock.elapsedTime
    flags.current.forEach((f, i) => {
      if (!f) return
      const active = world.checkpointActive[i]
      f.material = plastic(active ? C.green : C.red, active ? 0.3 : 0)
      f.rotation.y = Math.sin(t * 3 + i) * 0.12
    })
  })
  return (
    <>
      {world.level.checkpoints.map((c, i) => (
        <group key={i} position={c.pos}>
          <LegoBrick size={[1.6, 0.3, 1.6]} color={C.white} />
          <LegoBrick size={[0.3, 2.6, 0.3]} color={C.white} studs={false} position={[-0.5, 0.3, 0]} />
          <mesh ref={el => { flags.current[i] = el }} position={[0.1, 2.35, 0]} castShadow>
            <boxGeometry args={[1.2, 0.8, 0.15]} />
            <meshStandardMaterial color={C.red} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Switches({ world }: { world: GameWorld }) {
  const btn = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  useFrame(state => {
    if (btn.current) btn.current.position.y = THREE.MathUtils.lerp(btn.current.position.y, world.gateTimer > 0 ? 0.04 : 0.24, 0.3)
    if (ring.current) ring.current.rotation.y = state.clock.elapsedTime
  })
  return (
    <>
      {world.level.switches.map((s, i) => (
        <group key={i} position={s.pos}>
          <LegoBrick size={[2.4, 0.2, 2.4]} color={C.black} studs={false} />
          <group ref={btn} position={[0, 0.24, 0]}>
            <LegoBrick size={[1.7, 0.3, 1.7]} color={C.blue} emissive={0.45} />
          </group>
          <mesh ref={ring} geometry={cyl} material={plastic(C.blue, 0.6)} scale={[1.4, 0.04, 1.4]} position={[0, 0.02, 0]} />
        </group>
      ))}
    </>
  )
}

function Goal({ world }: { world: GameWorld }) {
  const cup = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Mesh>(null)
  const beamMat = useRef<THREE.MeshBasicMaterial>(null)
  const g = world.level.goal
  useFrame(state => {
    const t = state.clock.elapsedTime
    if (cup.current) { cup.current.rotation.y = t * 1.2; cup.current.position.y = 0.6 + Math.sin(t * 2) * 0.12 }
    if (beam.current) beam.current.rotation.y = -t * 0.8
    if (beamMat.current) {
      const locked = world.level.goalNeedsNotes && world.notesGot < world.level.notes.length
      beamMat.current.color.set(locked ? C.red : C.yellow)
      beamMat.current.opacity = locked ? 0.1 : 0.2
    }
  })
  return (
    <group position={g}>
      <LegoBrick size={[3, BRICK_H * 0.5, 3]} color={C.black} />
      <LegoBrick size={[1, BRICK_H, 1]} color={C.yellow} studs={false} position={[0, 0.6, 0]} />
      <group ref={cup} position={[0, 0.6, 0]}>
        <LegoBrick size={[1.1, BRICK_H, 1.1]} color={C.yellow} studs={false} position={[0, 1.0, 0]} emissive={0.4} />
        <LegoBrick size={[2, BRICK_H, 2]} color={C.yellow} position={[0, 2.2, 0]} emissive={0.4} />
        <LegoBrick size={[1, BRICK_H * 0.6, 0.4]} color={C.red} studs={false} position={[0, 2.9, 1.05]} />
      </group>
      {[[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].map(([x, z], i) => (
        <LegoBrick key={i} size={[0.4, 2.4, 0.4]} color={i % 2 ? C.red : C.blue} position={[x, 0.6, z]} />
      ))}
      <mesh ref={beam} position={[0, 20, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 40, 20, 1, true]} />
        <meshBasicMaterial ref={beamMat} color={C.yellow} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** 星空之門的非碰撞視覺：雙層發光環與微幅呼吸的傳送門核心。 */
function FinalePortal({ position }: { position: [number, number, number] }) {
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const core = useRef<THREE.Mesh>(null)
  useFrame(state => {
    const t = state.clock.elapsedTime
    if (outer.current) outer.current.rotation.z = Math.sin(t * 0.45) * 0.035
    if (inner.current) inner.current.rotation.z = -t * 0.12
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.025)
  })
  return (
    <group position={[position[0], position[1] + 3.1, position[2] + 0.65]}>
      <mesh ref={core}>
        <circleGeometry args={[2.55, 48]} />
        <meshBasicMaterial color="#18245B" transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={outer}>
        <torusGeometry args={[2.9, 0.2, 12, 48]} />
        <meshStandardMaterial color="#8A6CFF" emissive="#6649D8" emissiveIntensity={0.8} metalness={0.35} roughness={0.32} />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[2.48, 0.08, 8, 48]} />
        <meshStandardMaterial color="#51D8EE" emissive="#51D8EE" emissiveIntensity={1.15} />
      </mesh>
    </group>
  )
}

export function LevelScene({ world, getAlpha }: { world: GameWorld; getAlpha: () => number }) {
  const level: LevelDef = world.level
  return (
    <>
      <BrickField bricks={level.statics} castShadow />
      <BrickField bricks={level.decor} castShadow={false} />
      <Movers world={world} getAlpha={getAlpha} />
      <Gate world={world} />
      <Coins world={world} />
      <Notes world={world} />
      <Checkpoints world={world} />
      <Switches world={world} />
      <Goal world={world} />
      {level.id === 6 && level.gate && <FinalePortal position={level.gate.brick.pos} />}
      <Nature level={level} />
    </>
  )
}
