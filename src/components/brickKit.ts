import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { STUD_H, STUD_R } from '../game/colors'

/** 底面中心為原點、單位大小的盒（以 scale 變成任意尺寸積木） */
export const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
/** 圓柱凸點：底面在原點 */
export const studGeo = (() => {
  const g = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 10, 1, false).translate(0, STUD_H / 2, 0)
  // 底蓋永遠被積木蓋住：只保留側面與頂面，三角形數減半
  const index = g.getIndex()!
  const keep = g.groups[0].count + g.groups[1].count
  g.setIndex(Array.from(index.array).slice(0, keep))
  g.clearGroups()
  return g
})()

/** 1x1 積木（含凸點）合併幾何，給粒子與小零件使用 */
export const miniBrickGeo = (() => {
  const body = new THREE.BoxGeometry(1, 0.7, 1).translate(0, 0.35, 0)
  const stud = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 10).translate(0, 0.7 + 0.11, 0)
  return mergeGeometries([body, stud])!
})()

/** 依積木平面尺寸排列凸點（每 1 單位 1 顆） */
export function studGrid(w: number, d: number): Array<[number, number]> {
  const nx = Math.max(1, Math.round(w))
  const nz = Math.max(1, Math.round(d))
  const px = w / nx, pz = d / nz
  const out: Array<[number, number]> = []
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) out.push([(i - (nx - 1) / 2) * px, (j - (nz - 1) / 2) * pz])
  }
  return out
}

const materials = new Map<string, THREE.MeshStandardMaterial>()
/** 依顏色快取的塑膠材質 */
export function plastic(color: string, emissive = 0): THREE.MeshStandardMaterial {
  const key = `${color}|${emissive}`
  let m = materials.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0, envMapIntensity: 0.9 })
    if (emissive > 0) { m.emissive = new THREE.Color(color); m.emissiveIntensity = emissive }
    materials.set(key, m)
  }
  return m
}

/** 實例化用（顏色來自 instanceColor）的白色塑膠材質 */
export const instancedPlastic = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.36, metalness: 0, envMapIntensity: 0.9 })
