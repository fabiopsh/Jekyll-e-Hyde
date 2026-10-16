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
    const open = () => page.locator('.narration, .dialogue, .chapter-card, .chapter-end').count()
    // a toast between two panels leaves a short gap: the panels are over only if none comes back
    if (!(await open())) { await wait(600); if (!(await open())) return }
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

  // HUD and notebook: the task card, the pen writing on the notebook, the pages and a leaf turning
  notebook: async (page) => {
    await page.waitForSelector('.menu-btn.new', { timeout: 30_000 })
    await page.click('.menu-btn.new')
    await page.waitForSelector('.chapter-card', { timeout: 10_000 })
    await advanceAll(page)
    await wait(1200)
    await shot(page, 'hud')
    await page.locator('.hud-bulb').click() // the card of the bulb, then a hint
    await page.locator('.hud-hint').click()
    await wait(400)
    await shot(page, 'bulb-card')
    await page.locator('.hud-bulb').click()
    await clickGame(page, 259, 146) // the door: Enfield's story adds notes
    await page.locator('.verb-menu button', { hasText: 'Osserva' }).click()
    await page.waitForSelector('.dialogue', { timeout: 15_000 })
    await advanceUntil(page, '.hud-notebook.writing', 200)
    await wait(500)
    await shot(page, 'pen')
    await advanceAll(page, 200)
    await playRestOfChapter1(page)
    await advanceUntil(page, '.chapter-card', 20)
    await advanceAll(page)
    await wait(1000)
    await page.locator('.hud-notebook').click()
    await wait(5000)
    await shot(page, 'notebook')
    await page.keyboard.press('ArrowRight')
    await wait(350)
    await shot(page, 'leaf')
    await wait(900)
    await shot(page, 'turned')
  },

  // talking to the companion moves nobody: positions before and after "Parla" are printed
  talkstill: async (page) => {
    await page.waitForSelector('.menu-btn.new', { timeout: 30_000 })
    await page.click('.menu-btn.new')
    await page.waitForSelector('.chapter-card', { timeout: 10_000 })
    await advanceAll(page)
    await wait(1500)
    const npcs = () => page.evaluate(() => (window as unknown as { __jhNpcs: () => { x: number; y: number }[] }).__jhNpcs())
    // the floor must reach the game canvas, not an overlay (the HUD once covered the whole screen)
    const box = (await page.locator('#game canvas').boundingBox())!
    const onFloor = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [box.x + box.width / 2, box.y + box.height * 0.85])
    console.log(`element on the floor: ${onFloor}`)
    if (onFloor !== 'CANVAS') throw new Error('the floor is covered: clicks do not reach the room')
    const before = await npcs()
    await openTalk(page)
    await wait(1500)
    await shot(page, 'talk')
    const after = await npcs()
    console.log(`npc before ${JSON.stringify(before)} after ${JSON.stringify(after)}`)
  },

  // chapter 1 played to the end: story, the three questions to Enfield, end page and teaser
  c1full: (page) => playChapter1(page, true),

  // chapter 1 played quickly, then chapter 2 to the end
  c2: async (page) => {
    await playChapter1(page, false)
    await advanceUntil(page, '.chapter-card', 20) // the end page, the teaser, then chapter 2's card
    await wait(1200)
    await shot(page, 'card')
    await advanceAll(page)
    await wait(1200)
    await shot(page, 'study')
    await verb(page, 351, 162, 'Usa') // the safe
    await advanceUntil(page, '.illustration img')
    await page.keyboard.press('Space'); await wait(400); await page.keyboard.press('Space'); await wait(1500)
    await shot(page, 'will')
    await advanceAll(page, 80)
    await verb(page, 426, 140, 'Usa') // the door
    await advanceUntil(page, '.line.thought')
    await wait(1500)
    await shot(page, 'thought')
    await advanceAll(page, 80)
    await wait(1200)
    await shot(page, 'lanyon-room')
    await openTalk(page)
    await page.locator('.choice', { hasText: 'Jekyll' }).click()
    await advanceUntil(page, '.choice')
    await page.locator('.choice', { hasText: 'Hyde' }).click()
    await advanceAll(page, 80)
    await verb(page, 41, 140, 'Usa') // Lanyon's door: the sleepless night
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await wait(300) }
    await wait(1500)
    await shot(page, 'sleepless')
    await advanceAll(page, 80)
    await wait(1200)
    await advanceAll(page, 20)
    await shot(page, 'watch-day')
    await verb(page, 309, 150, 'Usa') // the court: the watch
    for (const hour of ['mattina', 'mezzogiorno', 'nebbia', 'Tornare']) {
      await page.locator('.choice', { hasText: hour }).click()
      await advanceUntil(page, '.choice', 20)
    }
    await advanceAll(page, 80)
    await wait(1500)
    await shot(page, 'night')
    await verb(page, 309, 150, 'Usa') // hide in the court
    await advanceAll(page, 40)
    await wait(800)
    await shot(page, 'hyde-arrives')
    await openTalk(page)
    await advanceUntil(page, '.choice')
    await page.locator('.choice').first().click()
    await advanceUntil(page, '.line.thought')
    await wait(1500)
    await shot(page, 'hyde-dialogue')
    await advanceAll(page, 80)
    await wait(800)
    await shot(page, 'hyde-gone')
    await clickGame(page, 462, 220) // round the corner
    await wait(4000)
    await advanceAll(page, 40)
    await wait(1200)
    await shot(page, 'square')
    await verb(page, 173, 150, 'Usa') // knock
    await advanceAll(page, 60)
    await wait(1500)
    await advanceAll(page, 20)
    await shot(page, 'hall')
    await verb(page, 200, 150, 'Osserva') // the fire
    await advanceAll(page, 40)
    await wait(800)
    await shot(page, 'poole')
    await openTalk(page)
    for (const pick of ['porta', 'fiducia', 'incontrato', 'buonanotte']) {
      await page.locator('.choice', { hasText: pick }).click()
      await advanceUntil(page, '.choice, .chapter-end', 60)
    }
    await advanceAll(page, 80, '.chapter-end')
    await wait(800)
    await shot(page, 'chapter-end')
  },
}

// Chapter 1 from the menu to its end page (`shots`: also take the chapter 1 screenshots).
async function playChapter1(page: Page, shots: boolean): Promise<void> {
  {
    await page.waitForSelector('.menu-btn.new', { timeout: 30_000 })
    await page.click('.menu-btn.new')
    await page.waitForSelector('.chapter-card', { timeout: 10_000 }) // the cover opens first
    await advanceAll(page)
    await wait(800)
    await clickGame(page, 300, 230) // walk east: Enfield follows
    await wait(5000)
    if (shots) await shot(page, 'walk')
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
        if (shots) await shot(page, 'bargain-choice')
        await page.locator('.choice').first().click()
        await wait(1800)
        if (shots) await shot(page, 'handshake')
      }
      await advanceAll(page, 120, '.chapter-end')
    }
    await wait(800)
    if (!shots) return
    await shot(page, 'chapter-end')
    await page.keyboard.press('Space')
    await wait(2500)
    await shot(page, 'teaser')
  }
}

// The three questions to Enfield, up to the end page of chapter 1.
async function playRestOfChapter1(page: Page): Promise<void> {
  for (const pick of ['firmato', 'nome', 'chiave']) {
    await openTalk(page)
    await page.locator('.choice', { hasText: pick }).click()
    await wait(500)
    if (pick === 'chiave') {
      await advanceUntil(page, '.choice', 40)
      await page.locator('.choice').first().click()
    }
    await advanceAll(page, 120, '.chapter-end')
  }
}

// Clicks a hotspot (game pixels) and picks a verb from its menu.
async function verb(page: Page, x: number, y: number, label: string): Promise<void> {
  await clickGame(page, x, y)
  await wait(400)
  const button = page.locator('.verb-menu button', { hasText: label })
  if (await button.count()) await button.click() // a hotspot with a single verb runs it at once
  // the player walks there first: wait for the panel the action opens
  await page.waitForSelector('.narration, .dialogue', { timeout: 15_000 })
}

// Presses Space until `selector` is on screen (or `max` presses).
async function advanceUntil(page: Page, selector: string, max = 60): Promise<void> {
  for (let i = 0; i < max && !(await page.locator(selector).count()); i++) { await page.keyboard.press('Space'); await wait(200) }
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
  } catch (e) {
    await shot(page, 'failed') // what the screen showed when the scenario broke
    throw e
  } finally {
    await app.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
