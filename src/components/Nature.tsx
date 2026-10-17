import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { C } from '../game/colors'
import type { LevelDef, NatureDef } from '../game/types'

/** 會動的樂高自然景物：瀑布、海浪、螃蟹、帆船、蝴蝶與小鳥。全部由方塊組成。 */
const box = new THREE.BoxGeometry(1, 1, 1)
const dummy = new THREE.Object3D()

function useMat(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0, ...opts }), [color]) // eslint-disable-line react-hooks/exhaustive-deps
}

function Fall({ f }: { f: NatureDef['falls'][number] }) {
  const h = f.y1 - f.y0
  const cols = Math.max(2, Math.floor(f.w / 1.5))
  const rows = Math.max(2, Math.ceil(h / 2.4))
  const foamN = cols * rows
  const foam = useRef<THREE.InstancedMesh>(null)
  const splash = useRef<THREE.InstancedMesh>(null)
  const mist = useRef<THREE.InstancedMesh>(null)
  const sheetMat = useMat('#3FA9EE', { transparent: true, opacity: 0.7, emissive: '#1B6FB8', emissiveIntensity: 0.35 })
  const foamMat = useMat('#F2F3F2', { transparent: true, opacity: 0.88, emissive: '#FFFFFF', emissiveIntensity: 0.2 })
  const mistMat = useMat('#FFFFFF', { transparent: true, opacity: 0.28, depthWrite: false })
  const SPLASH = Math.max(6, Math.round(f.w * 1.4))
  const MIST = 6
  useLayoutEffect(() => {
    if (foam.current) foam.current.frustumCulled = false
    if (splash.current) splash.current.frustumCulled = false
    if (mist.current) mist.current.frustumCulled = false
  }, [])
  useFrame(state => {
    const t = state.clock.elapsedTime
    if (foam.current) {
      for (let i = 0; i < foamN; i++) {
        const col = i % cols, row = Math.floor(i / cols)
        const y = f.y1 - ((t * 3.4 + row * (h / rows) + col * 0.9) % h)
        dummy.position.set(f.x - f.w / 2 + (col + 0.5) * (f.w / cols) + Math.sin(t * 2 + i) * 0.12, y, f.z + 0.45)
        dummy.scale.set(f.w / cols - 0.25, 0.8 + (i % 3) * 0.25, 0.4)
        dummy.updateMatrix()
        foam.current.setMatrixAt(i, dummy.matrix)
      }
      foam.current.instanceMatrix.needsUpdate = true
    }
    if (splash.current) {
      for (let i = 0; i < SPLASH; i++) {
        const k = i / SPLASH
        const bob = Math.abs(Math.sin(t * 3.2 + i * 1.7)) * 0.8
        dummy.position.set(f.x - f.w / 2 + 0.3 + k * (f.w - 0.6), f.y0 + 0.15 + bob, f.z + 1.1 + (i % 3) * 0.5)
        dummy.scale.set(0.8, 0.5, 0.8)
        dummy.updateMatrix()
        splash.current.setMatrixAt(i, dummy.matrix)
      }
      splash.current.instanceMatrix.needsUpdate = true
    }
    if (mist.current) {
      for (let i = 0; i < MIST; i++) {
        const u = (t * 0.28 + i / MIST) % 1
        dummy.position.set(f.x + Math.sin(i * 2.1 + t * 0.4) * f.w * 0.45, f.y0 + 0.5 + u * 3.4, f.z + 1.6 + Math.cos(i * 1.3) * 0.6)
        const sc = 1.2 + u * 1.6
        dummy.scale.set(sc, sc, sc)
        dummy.updateMatrix()
        mist.current.setMatrixAt(i, dummy.matrix)
      }
      mist.current.instanceMatrix.needsUpdate = true
    }
  })
  return (
    <group>
      <mesh geometry={box} material={sheetMat} position={[f.x, (f.y0 + f.y1) / 2, f.z]} scale={[f.w, h, 0.8]} />
      <instancedMesh ref={foam} args={[box, foamMat, foamN]} />
      <instancedMesh ref={splash} args={[box, foamMat, SPLASH]} />
      <instancedMesh ref={mist} args={[box, mistMat, MIST]} />
    </group>
  )
}

function Waves({ w }: { w: NatureDef['waves'][number] }) {
  const rows = 4
  const cols = Math.max(4, Math.floor((w.x1 - w.x0) / 14))
  const N = rows * cols
  const range = w.z1 - w.z0
  const mesh = useRef<THREE.InstancedMesh>(null)
  const foamStrip = useRef<THREE.Mesh>(null)
  const mat = useMat('#F2F3F2', { transparent: true, opacity: 0.8, emissive: '#FFFFFF', emissiveIntensity: 0.15 })
  const stripMat = useMat('#FFFFFF', { transparent: true, opacity: 0.55, depthWrite: false })
  useLayoutEffect(() => { if (mesh.current) mesh.current.frustumCulled = false }, [])
  useFrame(state => {
    const t = state.clock.elapsedTime
    if (mesh.current) {
      for (let i = 0; i < N; i++) {
        const col = i % cols, row = Math.floor(i / cols)
        const u = ((t * 0.07 + row / rows + (col % 3) * 0.11) % 1)
        const z = w.z1 - u * range
        const x = w.x0 + (col + 0.5) * ((w.x1 - w.x0) / cols) + Math.sin(t * 0.5 + col) * 1.5
        const grow = Math.sin(Math.min(1, u) * Math.PI)
        dummy.position.set(x, w.y + 0.04, z)
        dummy.scale.set(2 + 9 * grow, 0.3, 0.5 + 0.9 * grow)
        dummy.updateMatrix()
        mesh.current.setMatrixAt(i, dummy.matrix)
      }
      mesh.current.instanceMatrix.needsUpdate = true
    }
    if (foamStrip.current) foamStrip.current.position.z = w.z0 + 0.4 + (Math.sin(t * 0.55) * 0.5 + 0.5) * 2.4
  })
  return (
    <group>
      <instancedMesh ref={mesh} args={[box, mat, N]} />
      <mesh ref={foamStrip} geometry={box} material={stripMat} position={[(w.x0 + w.x1) / 2, w.y + 0.02, w.z0 + 1]} scale={[w.x1 - w.x0, 0.12, 1.6]} />
    </group>
  )
}

function Crab({ c, i }: { c: NatureDef['crabs'][number]; i: number }) {
  const g = useRef<THREE.Group>(null)
  const clawL = useRef<THREE.Mesh>(null)
  const clawR = useRef<THREE.Mesh>(null)
  const red = useMat(C.red)
  const black = useMat(C.black)
  const white = useMat(C.white)
  useFrame(state => {
    const t = state.clock.elapsedTime + i * 2.3
    if (g.current) {
      g.current.position.x = c.x + Math.sin(t * 0.45) * c.range
      g.current.position.y = c.y + Math.abs(Math.sin(t * 7)) * 0.06
      g.current.rotation.y = Math.cos(t * 0.45) > 0 ? 0 : 0.15
    }
    const snap = Math.sin(t * 3.2) * 0.4
    if (clawL.current) clawL.current.rotation.z = snap
    if (clawR.current) clawR.current.rotation.z = -snap
  })
  return (
    <group ref={g} position={[c.x, c.y, c.z]}>
      <mesh geometry={box} material={red} position={[0, 0.3, 0]} scale={[1.1, 0.5, 0.8]} castShadow />
      <mesh geometry={box} material={red} position={[0, 0.62, 0]} scale={[0.8, 0.18, 0.6]} />
      <mesh ref={clawL} geometry={box} material={red} position={[-0.85, 0.55, 0.3]} scale={[0.45, 0.35, 0.55]} />
      <mesh ref={clawR} geometry={box} material={red} position={[0.85, 0.55, 0.3]} scale={[0.45, 0.35, 0.55]} />
      {[-0.3, 0.3].map(x => (
        <group key={x}>
          <mesh geometry={box} material={black} position={[x, 0.78, 0.2]} scale={[0.1, 0.3, 0.1]} />
          <mesh geometry={box} material={white} position={[x, 1.0, 0.2]} scale={[0.2, 0.18, 0.2]} />
        </group>
      ))}
      {[-1, 1].flatMap(s => [-0.25, 0.05, 0.3].map((z, k) => (
        <mesh key={`${s}${k}`} geometry={box} material={black} position={[s * 0.75, 0.1, z - 0.05]} scale={[0.5, 0.08, 0.1]} />
      )))}
    </group>
  )
}

function Boat({ pos, i }: { pos: [number, number, number]; i: number }) {
  const g = useRef<THREE.Group>(null)
  const hull = useMat(i % 2 ? C.blue : C.red)
  const white = useMat(C.white)
  const yellow = useMat(C.yellow)
  const wood = useMat(C.brown)
  const flag = useMat(C.red)
  useFrame(state => {
    const t = state.clock.elapsedTime + i * 1.7
    if (!g.current) return
    g.current.position.y = pos[1] + 0.25 + Math.sin(t * 1.2) * 0.22
    g.current.rotation.z = Math.sin(t * 0.9) * 0.07
    g.current.rotation.x = Math.sin(t * 0.7) * 0.04
    g.current.position.x = pos[0] + Math.sin(t * 0.15) * 3
  })
  return (
    <group ref={g} position={pos}>
      <mesh geometry={box} material={hull} position={[0, 0.2, 0]} scale={[5, 0.9, 2.2]} castShadow />
      <mesh geometry={box} material={white} position={[0, 0.8, 0]} scale={[5.4, 0.35, 2.6]} />
      <mesh geometry={box} material={hull} position={[3, 0.6, 0]} scale={[1.2, 0.6, 1.4]} />
      <mesh geometry={box} material={yellow} position={[-1.2, 1.5, 0]} scale={[1.6, 1.2, 1.6]} />
      <mesh geometry={box} material={wood} position={[0.6, 3, 0]} scale={[0.18, 4.2, 0.18]} />
      <mesh geometry={box} material={white} position={[1.3, 3.1, 0]} scale={[1.3, 3, 0.1]} />
      <mesh geometry={box} material={white} position={[0.1, 2.7, 0]} scale={[0.1, 2.2, 0.1]} />
      <mesh geometry={box} material={flag} position={[0.9, 5.1, 0]} scale={[0.9, 0.5, 0.1]} />
    </group>
  )
}

function Flyer({ f, i }: { f: NatureDef['flyers'][number]; i: number }) {
  const g = useRef<THREE.Group>(null)
  const wingL = useRef<THREE.Mesh>(null)
  const wingR = useRef<THREE.Mesh>(null)
  const bird = f.kind === 'bird'
  const body = useMat(bird ? f.color : C.black)
  const wing = useMat(bird ? f.color : f.color, { emissive: bird ? '#000000' : f.color, emissiveIntensity: bird ? 0 : 0.25 })
  const beak = useMat(C.orange)
  useFrame(state => {
    const t = state.clock.elapsedTime
    const sp = bird ? 0.22 : 0.5
    const a = t * sp * (i % 2 ? 1 : -1) + i * 1.9
    if (g.current) {
      g.current.position.set(f.center[0] + Math.cos(a) * f.radius, f.center[1] + Math.sin(t * (bird ? 0.8 : 2) + i) * (bird ? 0.8 : 0.5), f.center[2] + Math.sin(a) * f.radius)
      g.current.rotation.y = -a + (i % 2 ? 0 : Math.PI)
    }
    const flap = Math.sin(t * (bird ? 5 : 14) + i) * (bird ? 0.55 : 0.9)
    if (wingL.current) wingL.current.rotation.z = flap
    if (wingR.current) wingR.current.rotation.z = -flap
  })
  const ws = bird ? 1.5 : 0.55
  return (
    <group ref={g} position={f.center}>
      <mesh geometry={box} material={body} scale={bird ? [0.5, 0.4, 1] : [0.12, 0.12, 0.45]} />
      {bird && <mesh geometry={box} material={beak} position={[0, 0, 0.62]} scale={[0.15, 0.15, 0.3]} />}
      <group position={[0.1, 0.05, 0]}><mesh ref={wingR} geometry={box} material={wing} position={[ws / 2, 0, 0]} scale={[ws, 0.06, bird ? 0.55 : 0.45]} /></group>
      <group position={[-0.1, 0.05, 0]}><mesh ref={wingL} geometry={box} material={wing} position={[-ws / 2, 0, 0]} scale={[ws, 0.06, bird ? 0.55 : 0.45]} /></group>
    </group>
  )
}

export function Nature({ level }: { level: LevelDef }) {
  const n = level.nature
  if (!n) return null
  return (
    <>
      {n.falls.map((f, i) => <Fall key={`f${i}`} f={f} />)}
      {n.waves.map((w, i) => <Waves key={`w${i}`} w={w} />)}
      {n.crabs.map((c, i) => <Crab key={`c${i}`} c={c} i={i} />)}
      {n.boats.map((b, i) => <Boat key={`b${i}`} pos={b.pos} i={i} />)}
      {n.flyers.map((f, i) => <Flyer key={`y${i}`} f={f} i={i} />)}
    </>
  )
}
