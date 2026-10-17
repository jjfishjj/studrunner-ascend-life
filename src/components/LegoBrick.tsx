import { forwardRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../game/types'
import { plastic, studGeo, studGrid, unitBox } from './brickKit'

export interface LegoBrickProps {
  /** 寬(x)、高(y)、深(z)；原點在底面中心 */
  size: Vec3
  color: string
  studs?: boolean
  emissive?: number
  position?: Vec3
  rotation?: Vec3
  castShadow?: boolean
  receiveShadow?: boolean
  visible?: boolean
}

/**
 * 單塊樂高積木：BoxGeometry 主體 + 以 InstancedMesh 繪製的 CylinderGeometry 凸點。
 * 原點位於底面中心，方便疊放。
 */
export const LegoBrick = forwardRef<THREE.Group, LegoBrickProps>(function LegoBrick(
  { size, color, studs = true, emissive = 0, position, rotation, castShadow = true, receiveShadow = true, visible = true },
  ref,
) {
  const [w, h, d] = size
  const material = useMemo(() => plastic(color, emissive), [color, emissive])
  const studMesh = useMemo(() => {
    if (!studs) return null
    const grid = studGrid(w, d)
    const mesh = new THREE.InstancedMesh(studGeo, material, grid.length)
    const m = new THREE.Matrix4()
    grid.forEach(([x, z], i) => { m.makeTranslation(x, h, z); mesh.setMatrixAt(i, m) })
    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = false
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    return mesh
  }, [studs, w, d, h, material])
  useEffect(() => () => { studMesh?.dispose() }, [studMesh])
  return (
    <group ref={ref} position={position} rotation={rotation} visible={visible}>
      <mesh geometry={unitBox} material={material} scale={[Math.max(0.01, w - 0.02), h, Math.max(0.01, d - 0.02)]} castShadow={castShadow} receiveShadow={receiveShadow} />
      {studMesh && <primitive object={studMesh} />}
    </group>
  )
})
