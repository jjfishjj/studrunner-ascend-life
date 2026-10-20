// End-to-end smoke test: `pnpm build` must have produced dist/ first.
// Serves dist/, boots the game in headless Chromium (software WebGL), walks the menus,
// enters all three levels, forces a game-over and a victory, fails on any console error
// and writes screenshots to ./shots/ (override with SHOTS_DIR).
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const port = 4300 + Math.floor(Math.random() * 500)
const url = `http://127.0.0.1:${port}/?debug`
const out = process.env.SHOTS_DIR ?? 'shots'
mkdirSync(out, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
let browser
const guard = setTimeout(() => fail('timed out'), 240_000)
const cleanup = () => { clearTimeout(guard); try { server.kill('SIGTERM') } catch { /* ignore */ } }
async function fail(msg) {
  console.error(`smoke: FAIL — ${msg}`)
  await browser?.close().catch(() => {})
  cleanup()
  process.exit(1)
}
async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('preview server did not start')
}

try {
  await waitForServer()
  const args = ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args })
    .catch(() => chromium.launch({ args, channel: 'chrome' }))
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const errors = []
  page.on('console', m => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', e => errors.push(String(e)))
  const world = '(() => window.__studrunner.world)()'
  const sel = id => `[data-testid=${id}]`

  await page.goto(url)
  await page.waitForSelector(sel('start'), { timeout: 60_000 })
  await page.screenshot({ path: `${out}/smoke-menu.png` })
  await page.click(sel('select'))
  await page.waitForSelector(sel('level-5'))
  await page.screenshot({ path: `${out}/smoke-select.png` })

  for (const id of [1, 2, 3, 4, 5]) {
    if (id > 1) { await page.keyboard.press('Escape'); await page.click('text=階段選擇') }
    await page.click(sel(`level-${id}`))
    await page.waitForSelector(sel('hud-level'))
    await page.waitForTimeout(2500)
    const level = await page.evaluate(`${world}.level.id`)
    if (level !== id) throw new Error(`expected level ${id}, got ${level}`)
    const audio = await page.evaluate(`(() => { const d = window.__studrunner; return { state: d.audioState(), mix: d.ambienceSnapshot() } })()`)
    if (audio.state !== 'running') throw new Error(`audio context not running in level ${id}: ${audio.state}`)
    if (!Object.values(audio.mix).some(value => value > 0.03)) throw new Error(`no ambient mix in level ${id}: ${JSON.stringify(audio.mix)}`)
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(1500)
    await page.keyboard.press('Space')
    await page.waitForTimeout(800)
    await page.keyboard.up('KeyW')
    await page.screenshot({ path: `${out}/smoke-level-${id}.png` })
  }

  // 遊戲結束：把生命壓到 1 後撞上機關
  await page.keyboard.press('KeyR')
  await page.waitForTimeout(1500)
  await page.evaluate(`(() => { const w = ${world}; w.lives = 1; const m = w.movers.find(m => m.spec.hazard); w.player.position.set(m.center.x + 1.6, m.center.y + 0.5, m.center.z); })()`)
  await page.waitForSelector(sel('gameover-title'), { timeout: 60_000 })
  await page.screenshot({ path: `${out}/smoke-gameover.png` })

  // 筆記磚：傳送到第一張筆記磚上，應立即計數並跳出筆記卡
  await page.click(sel('retry'))
  await page.waitForSelector(sel('hud-level'))
  await page.waitForTimeout(1500)
  await page.evaluate(`(() => { const w = ${world}; const n = w.level.notes[0].pos; w.player.position.set(n[0], 0.5, n[2]); w.player.velocity.set(0, 0, 0); })()`)
  await page.waitForSelector(sel('note-card'), { timeout: 20_000 })
  const got = await page.evaluate(`${world}.notesGot`)
  if (got !== 1) throw new Error(`expected 1 note, got ${got}`)
  // 通關：傳送到終點
  await page.evaluate(`(() => { const w = ${world}; const g = w.level.goal; w.noteCollected.fill(true); w.notesGot = w.level.notes.length; w.player.position.set(g[0], g[1] + 0.6, g[2]); w.player.velocity.set(0, 0, 0); })()`)
  await page.waitForSelector(sel('victory-title'), { timeout: 60_000 })
  await page.screenshot({ path: `${out}/smoke-victory.png` })

  // 學習筆記本：從結算畫面進入，應顯示已收集的筆記
  await page.click(sel('open-notes'))
  await page.waitForSelector(sel('notebook'))
  await page.waitForSelector(sel('note-detail'))
  await page.screenshot({ path: `${out}/smoke-notebook.png` })
  if (errors.length) throw new Error(`console errors:\n${errors.join('\n')}`)
  await browser.close()
  cleanup()
  console.log('smoke: OK — menus, 5 levels, note pickup, game over, victory and notebook all reached with no console errors')
} catch (e) {
  await fail(e instanceof Error ? e.message : String(e))
}
