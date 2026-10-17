import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { C } from '../game/colors'
import type { Vec3 } from '../game/types'
import { instancedPlastic, miniBrickGeo } from './brickKit'

interface P { life: number; max: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number; size: number; floor: number }

/** 磚塊爆裂：迷你積木向外噴射、旋轉、彈跳後縮小消失。以單一 InstancedMesh 繪製。 */
export class BrickBurst {
  readonly mesh: THREE.InstancedMesh
  private items: P[]
  private cursor = 0
  private dummy = new THREE.Object3D()
  private color = new THREE.Color()
  constructor(readonly capacity = 260) {
    this.mesh = new THREE.InstancedMesh(miniBrickGeo, instancedPlastic, capacity)
    this.mesh.frustumCulled = false
    this.mesh.castShadow = false
    this.items = Array.from({ length: capacity }, () => ({ life: 0, max: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, size: 0, floor: 0 }))
    const zero = new THREE.Matrix4().makeScale(0, 0, 0)
    for (let i = 0; i < capacity; i++) { this.mesh.setMatrixAt(i, zero); this.mesh.setColorAt(i, this.color.set(C.white)) }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  burst(pos: Vec3, colors: string[], count = 14, power = 7, size = 0.32) {
    for (let k = 0; k < count; k++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % this.capacity
      const it = this.items[i]
      const a = Math.random() * Math.PI * 2
      const up = 0.35 + Math.random() * 0.65
      const sp = power * (0.45 + Math.random() * 0.75)
      it.x = pos[0]; it.y = pos[1]; it.z = pos[2]
      it.vx = Math.cos(a) * sp * (1 - up * 0.4); it.vz = Math.sin(a) * sp * (1 - up * 0.4); it.vy = sp * up * 1.15
      it.rx = Math.random() * 6; it.ry = Math.random() * 6; it.rz = Math.random() * 6
      it.sx = (Math.random() - 0.5) * 14; it.sy = (Math.random() - 0.5) * 14; it.sz = (Math.random() - 0.5) * 14
      it.max = it.life = 0.9 + Math.random() * 0.7
      it.size = size * (0.7 + Math.random() * 0.6)
      it.floor = pos[1] - 0.3
      this.mesh.setColorAt(i, this.color.set(colors[Math.floor(Math.random() * colors.length)]))
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  update(dt: number) {
    const d = this.dummy
    for (let i = 0; i < this.capacity; i++) {
      const it = this.items[i]
      if (it.life <= 0) continue
      it.life -= dt
      if (it.life <= 0) { d.scale.setScalar(0); d.updateMatrix(); this.mesh.setMatrixAt(i, d.matrix); continue }
      it.vy -= 26 * dt
      it.x += it.vx * dt; it.y += it.vy * dt; it.z += it.vz * dt
      if (it.y < it.floor && it.vy < 0) { it.y = it.floor; it.vy *= -0.38; it.vx *= 0.7; it.vz *= 0.7; it.sx *= 0.6; it.sy *= 0.6; it.sz *= 0.6 }
      it.rx += it.sx * dt; it.ry += it.sy * dt; it.rz += it.sz * dt
      d.position.set(it.x, it.y, it.z)
      d.rotation.set(it.rx, it.ry, it.rz)
      d.scale.setScalar(it.size * Math.min(1, (it.life / it.max) * 3))
      d.updateMatrix()
      this.mesh.setMatrixAt(i, d.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose() { this.mesh.dispose() }
}

export function Particles({ fx }: { fx: BrickBurst }) {
  useEffect(() => () => fx.dispose(), [fx])
  return useMemo(() => <primitive object={fx.mesh} />, [fx])
}

export const COIN_COLORS = [C.yellow, C.yellow, C.orange, C.white]
export const HURT_COLORS = [C.red, C.red, C.white, C.black]
export const DUST_COLORS = [C.white, C.gray]
export const PARTY_COLORS = [C.red, C.yellow, C.blue, C.green, C.white]
