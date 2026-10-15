// npm run shot [-- <scenario>]: builds the app, launches it with Playwright, plays a scripted sequence and
// saves screenshots in out/shots/<scenario>/. Lets an agent see the UI; Fabio's manual test stays the final check.
// Runs with a throwaway user data folder (out/shots/userdata), so Fabio's play history is never touched.
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { _electron as electron, type Page } from 'playwright-core'

const GAME_W = 480
const GAME_H = 270
const scenario = process.argv[2] ?? 'c1'
const outDir = resolve('out', 'shots', scenario)
const userData = resolve('out', 'shots', 'userdata')

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let n = 0
async function shot(page: Page, name: string): Promise<void> {
  const file = join(outDir, `${String(++n).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file })
  console.log(`shot ${file}`)
}

// Clicks a point given in game pixels (480x270), whatever the window size.
async function clickGame(page: Page, x: number, y: number, button: 'left' | 'right' = 'left'): Promise<void> {
  const box = await page.locator('#game canvas').boundingBox()
  if (!box) throw new Error('canvas not found')
  await page.mouse.click(box.x + (x * box.width) / GAME_W, box.y + (y * box.height) / GAME_H, { button })
}

// Presses Space until no narration or dialogue panel is open (or `max` presses).
async function advanceAll(page: Page, max = 60, stopAt?: string): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (stopAt && (await page.locator(stopAt).count())) return
    if (!(await page.locator('.narration, .dialogue, .chapter-card, .chapter-end').count())) return
    await page.keyboard.press('Space')
    await wait(150)
  }
}

const scenarios: Record<string, (page: Page) => Promise<void>> = {
  // chapter 1 from the menu to the first lines of Enfield's story
  c1: async (page) => {
    await page.waitForSelector('.menu-btn.new', { timeout: 30_000 })
    await wait(1500)
    await shot(page, 'menu')
    await page.click('.menu-btn.new')
    await page.waitForSelector('.chapter-card', { timeout: 10_000 })
    await wait(1500)
    await shot(page, 'intro')
    await advanceAll(page)
    await wait(1200)
    await shot(page, 'room')
    await clickGame(page, 259, 146) // the door
    await wait(400)
    await shot(page, 'verbs')
    await page.locator('.verb-menu button', { hasText: 'Osserva' }).click()
    await wait(2500)
    await shot(page, 'dialogue')
    for (let i = 0; i < 8; i++) { await page.keyboard.press('Space'); await wait(250) }
    await wait(1500)
    await shot(page, 'story')
    await advanceAll(page, 120)
    await page.keyboard.press('j')
    await wait(4500) // new notes are written one after the other
    await shot(page, 'journal')
    await page.keyboard.press('j')
    await wait(500)
    await page.keyboard.press('Escape')
    await wait(600)
    await shot(page, 'pause')
  },

  // chapter 1 played to the end: story, the three questions to Enfield, end page and teaser
  c1full: async (page) => {
    await page.waitForSelector('.menu-btn.new', { timeout: 30_000 })
    await page.click('.menu-btn.new')
    await page.waitForSelector('.chapter-card', { timeout: 10_000 }) // the cover opens first
    await advanceAll(page)
    await wait(800)
    await clickGame(page, 300, 230) // walk east: Enfield follows
    await wait(5000)
    await shot(page, 'walk')
    await clickGame(page, 259, 146) // the door
    await page.locator('.verb-menu button', { hasText: 'Osserva' }).click()
    await wait(2500)
    await advanceAll(page, 120)
    for (const pick of ['firmato', 'nome', 'chiave']) {
      await openTalk(page)
      await page.locator('.choice', { hasText: pick }).click()
      await wait(500)
      if (pick === 'chiave') {
        for (let i = 0; i < 40 && !(await page.locator('.choice').count()); i++) { await page.keyboard.press('Space'); await wait(150) }
        await shot(page, 'bargain-choice')
        await page.locator('.choice').first().click()
        await wait(1800)
        await shot(page, 'handshake')
      }
      await advanceAll(page, 120, '.chapter-end')
    }
    await wait(800)
    await shot(page, 'chapter-end')
    await page.keyboard.press('Space')
    await wait(2500)
    await shot(page, 'teaser')
  },
}

// Opens "Parla" on the companion, wherever it stands: its sprite position comes from the running game.
async function openTalk(page: Page): Promise<void> {
  const pos = await page.evaluate(() => (window as unknown as { __jhNpcs?: () => { x: number; y: number }[] }).__jhNpcs?.()[0])
  if (!pos) throw new Error('no npc position exposed (window.__jhNpcs)')
  await clickGame(page, pos.x, pos.y - 30)
  await wait(300)
  await page.locator('.verb-menu button', { hasText: 'Parla' }).click()
  await wait(400)
  for (let i = 0; i < 10 && !(await page.locator('.choice').count()); i++) { await page.keyboard.press('Space'); await wait(150) }
}

async function main(): Promise<void> {
  const run = scenarios[scenario]
  if (!run) throw new Error(`unknown scenario ${scenario}; known: ${Object.keys(scenarios).join(', ')}`)
  rmSync(outDir, { recursive: true, force: true })
  rmSync(userData, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  execSync('npx electron-vite build', { stdio: 'inherit' })
  const app = await electron.launch({
    args: ['.'],
    cwd: process.cwd(),
    env: { ...process.env, JH_USER_DATA: userData },
  })
  const page = await app.firstWindow()
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[renderer:error] ${m.text()}`) })
  page.on('pageerror', (e) => console.log(`[renderer:exception] ${e.message}`))
  await page.setViewportSize({ width: 1440, height: 810 })
  try {
    await run(page)
  } finally {
    await app.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
