import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { C } from '../game/colors'
import type { GameWorld } from '../game/engine'
import { PLAYER_R } from '../game/engine'
import { plastic } from './brickKit'

const box = new THREE.BoxGeometry(1, 1, 1)
const cyl = new THREE.CylinderGeometry(1, 1, 1, 18)

function Part({ geo, color, p, s, r, shadow = true }: {
  geo: THREE.BufferGeometry; color: string; p: [number, number, number]; s: [number, number, number]; r?: [number, number, number]; shadow?: boolean
}) {
  return <mesh geometry={geo} material={plastic(color)} position={p} scale={s} rotation={r} castShadow={shadow} receiveShadow />
}

/** 樂高小人：頭、帽、軀幹、手臂、手、腿皆由方塊與圓柱（凸點）構成。面向 +Z。 */
export function Minifigure({ group, legL, legR, armL, armR, body }: {
  group: React.RefObject<THREE.Group | null>
  legL: React.RefObject<THREE.Group | null>
  legR: React.RefObject<THREE.Group | null>
  armL: React.RefObject<THREE.Group | null>
  armR: React.RefObject<THREE.Group | null>
  body: React.RefObject<THREE.Group | null>
}) {
  return (
    <group ref={group}>
      <group ref={body}>
        {/* 腿（髖關節為轉軸） */}
        <group ref={legL} position={[-0.2, 0.72, 0]}>
          <Part geo={box} color={C.blue} p={[0, -0.32, 0]} s={[0.38, 0.62, 0.42]} />
          <Part geo={box} color={C.black} p={[0, -0.66, 0.05]} s={[0.4, 0.12, 0.52]} />
        </group>
        <group ref={legR} position={[0.2, 0.72, 0]}>
          <Part geo={box} color={C.blue} p={[0, -0.32, 0]} s={[0.38, 0.62, 0.42]} />
          <Part geo={box} color={C.black} p={[0, -0.66, 0.05]} s={[0.4, 0.12, 0.52]} />
        </group>
        <Part geo={box} color={C.blue} p={[0, 0.8, 0]} s={[0.92, 0.2, 0.46]} />
        {/* 軀幹 */}
        <Part geo={box} color={C.red} p={[0, 1.3, 0]} s={[0.96, 0.82, 0.48]} />
        <Part geo={box} color={C.white} p={[0, 1.12, 0.245]} s={[0.96, 0.12, 0.02]} shadow={false} />
        <Part geo={box} color={C.yellow} p={[0, 1.48, 0.245]} s={[0.26, 0.26, 0.02]} shadow={false} />
        {/* 手臂 */}
        <group ref={armL} position={[-0.6, 1.6, 0]}>
          <Part geo={box} color={C.red} p={[0, -0.3, 0]} s={[0.24, 0.62, 0.3]} />
          <Part geo={cyl} color={C.yellow} p={[0, -0.68, 0]} s={[0.14, 0.18, 0.14]} r={[0, 0, Math.PI / 2]} />
        </group>
        <group ref={armR} position={[0.6, 1.6, 0]}>
          <Part geo={box} color={C.red} p={[0, -0.3, 0]} s={[0.24, 0.62, 0.3]} />
          <Part geo={cyl} color={C.yellow} p={[0, -0.68, 0]} s={[0.14, 0.18, 0.14]} r={[0, 0, Math.PI / 2]} />
        </group>
        {/* 頸部凸點 + 頭 */}
        <Part geo={cyl} color={C.yellow} p={[0, 1.76, 0]} s={[0.14, 0.1, 0.14]} />
        <Part geo={cyl} color={C.yellow} p={[0, 1.98, 0]} s={[0.33, 0.45, 0.33]} />
        <Part geo={box} color={C.black} p={[-0.12, 2.04, 0.325]} s={[0.07, 0.1, 0.02]} shadow={false} />
        <Part geo={box} color={C.black} p={[0.12, 2.04, 0.325]} s={[0.07, 0.1, 0.02]} shadow={false} />
        <Part geo={box} color={C.black} p={[0, 1.88, 0.325]} s={[0.2, 0.035, 0.02]} shadow={false} />
        <Part geo={box} color={C.black} p={[-0.12, 1.905, 0.325]} s={[0.045, 0.05, 0.02]} shadow={false} />
        <Part geo={box} color={C.black} p={[0.12, 1.905, 0.325]} s={[0.045, 0.05, 0.02]} shadow={false} />
        {/* 帽子（帶凸點） */}
        <Part geo={cyl} color={C.white} p={[0, 2.28, 0]} s={[0.37, 0.18, 0.37]} />
        <Part geo={box} color={C.white} p={[0, 2.2, 0.3]} s={[0.5, 0.05, 0.3]} />
        <Part geo={cyl} color={C.red} p={[0, 2.43, 0]} s={[0.13, 0.1, 0.13]} />
      </group>
    </group>
  )
}

const tmp = new THREE.Vector3()

/** 玩家：讀取 GameWorld 狀態並做補間與動畫。 */
export function Player({ world, getAlpha, celebrate }: { world: GameWorld; getAlpha: () => number; celebrate?: boolean }) {
  const root = useRef<THREE.Group>(null)
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const phase = useRef(0)
  const squash = useRef(0)
  const wasGrounded = useRef(true)
  const scale = 0.8
  const initial = useMemo<[number, number, number]>(() => [world.player.position.x, world.player.position.y, world.player.position.z], [world])

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    const a = getAlpha()
    const prev = world.prevPos
    const cur = world.player.position
    tmp.set(prev.x + (cur.x - prev.x) * a, prev.y + (cur.y - prev.y) * a, prev.z + (cur.z - prev.z) * a)
    g.position.set(tmp.x, tmp.y - PLAYER_R + 0.12, tmp.z)
    g.rotation.y = world.facing
    const t = state.clock.elapsedTime
    const speed = world.speedXZ
    const grounded = world.grounded
    const vy = world.player.velocity.y
    phase.current += delta * (4 + speed * 1.15)
    const run = grounded ? Math.min(1, speed / 5) : 0
    const swing = Math.sin(phase.current) * 0.95 * run
    if (grounded && !wasGrounded.current) squash.current = 0.22
    wasGrounded.current = grounded
    squash.current *= Math.exp(-delta * 12)
    let lL = swing, lR = -swing, aL = -swing * 0.9, aR = swing * 0.9
    if (!grounded) {
      lL = 0.55; lR = -0.35
      aL = aR = vy > 0 ? -2.6 : -1.3
    } else if (run < 0.05) {
      aL = Math.sin(t * 2) * 0.05; aR = -Math.sin(t * 2) * 0.05
    }
    if (celebrate) { aL = aR = -2.8 + Math.sin(t * 12) * 0.4; lL = Math.sin(t * 12) * 0.5; lR = -lL }
    if (legL.current) legL.current.rotation.x = lL
    if (legR.current) legR.current.rotation.x = lR
    if (armL.current) { armL.current.rotation.x = aL; armL.current.rotation.z = 0.08 }
    if (armR.current) { armR.current.rotation.x = aR; armR.current.rotation.z = -0.08 }
    if (body.current) {
      body.current.position.y = grounded ? Math.abs(Math.sin(phase.current)) * 0.08 * run : 0
      const stretch = !grounded ? THREE.MathUtils.clamp(vy * 0.012, -0.12, 0.16) : 0
      body.current.scale.set(1 + squash.current * 0.6 - stretch * 0.5, 1 - squash.current + stretch, 1 + squash.current * 0.6 - stretch * 0.5)
      body.current.rotation.x = grounded ? run * 0.12 : 0
    }
    if (celebrate) g.rotation.y += t * 4
    g.visible = world.invul <= 0 || Math.floor(t * 16) % 2 === 0
  })

  return (
    <group ref={root} position={initial} scale={scale}>
      <Minifigure group={group} legL={legL} legR={legR} armL={armL} armR={armR} body={body} />
    </group>
  )
}
