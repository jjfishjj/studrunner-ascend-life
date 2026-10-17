import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { BrickSpec } from '../game/types'
import { STUD_H } from '../game/colors'
import { instancedPlastic, studGeo, studGrid, unitBox } from './brickKit'

function buildField(bricks: BrickSpec[], castShadow: boolean) {
  const visible = bricks.filter(b => b.visible !== false)
  const studList: Array<{ x: number; y: number; z: number; color: string }> = []
  for (const b of visible) {
    if (b.studs === false) continue
    const top = b.pos[1] + b.size[1]
    for (const [sx, sz] of studGrid(b.size[0], b.size[2])) studList.push({ x: b.pos[0] + sx, y: top, z: b.pos[2] + sz, color: b.color })
  }
  const bodies = new THREE.InstancedMesh(unitBox, instancedPlastic, Math.max(1, visible.length))
  const studs = new THREE.InstancedMesh(studGeo, instancedPlastic, Math.max(1, studList.length))
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const s = new THREE.Vector3()
  const p = new THREE.Vector3()
  const col = new THREE.Color()
  visible.forEach((b, i) => {
    p.set(b.pos[0], b.pos[1], b.pos[2])
    s.set(Math.max(0.01, b.size[0] - 0.02), b.size[1], Math.max(0.01, b.size[2] - 0.02))
    m.compose(p, q, s)
    bodies.setMatrixAt(i, m)
    bodies.setColorAt(i, col.set(b.color))
  })
  bodies.count = visible.length
  studList.forEach((st, i) => {
    p.set(st.x, st.y, st.z)
    s.set(1, 1, 1)
    m.compose(p, q, s)
    studs.setMatrixAt(i, m)
    studs.setColorAt(i, col.set(st.color))
  })
  studs.count = studList.length
  for (const mesh of [bodies, studs]) {
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    mesh.receiveShadow = true
  }
  bodies.castShadow = castShadow
  studs.castShadow = false
  void STUD_H
  return { bodies, studs }
}

/** 大量靜態積木：兩個 InstancedMesh（主體 + 凸點）一次畫完。 */
export function BrickField({ bricks, castShadow = true }: { bricks: BrickSpec[]; castShadow?: boolean }) {
  const field = useMemo(() => buildField(bricks, castShadow), [bricks, castShadow])
  useEffect(() => () => { field.bodies.dispose(); field.studs.dispose() }, [field])
  return (
    <group>
      <primitive object={field.bodies} />
      <primitive object={field.studs} />
    </group>
  )
}
