// npm run validate: checks every file in content/ against the schemas and all cross references,
// then lists the assets the content refers to that are not in assets/ yet (warnings: art may come later).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadContent } from '../src/shared/content-loader'
import { typographyProblems } from '../src/shared/typography'

const { content, errors } = loadContent(process.cwd())
const counts = `${content.chapters.length} chapters, ${Object.keys(content.scenes).length} scenes, ` +
  `${Object.keys(content.dialogues).length} dialogues, ${Object.keys(content.npcs).length} npcs, ` +
  `${Object.keys(content.items).length} items, ${Object.keys(content.facts).length} facts, ` +
  `${content.bookLines.size} book lines in story/`

// Any string that looks like an asset key (backgrounds/x, illustrations/x, audio/music/x.mp3, ...).
const ASSET = /^(backgrounds|characters|portraits|illustrations|items|ui|audio)\//
const keys = new Set<string>()
const walk = (v: unknown): void => {
  if (typeof v === 'string') { if (ASSET.test(v)) keys.add(v) }
  else if (Array.isArray(v)) v.forEach(walk)
  else if (v && typeof v === 'object') Object.values(v).forEach(walk)
}
walk({ ...content, bookLines: [], bookLineText: {} })
const missing = [...keys].sort().filter((k) => {
  const files = /\.\w+$/.test(k) ? [k] : k.startsWith('characters/') ? [`${k}.png`, `${k}.json`] : [`${k}.png`]
  return files.some((f) => !existsSync(join('assets', f)))
})

// Spacing and punctuation of every text the player reads (book lines in story/ are checked by check:story).
const walkText = (v: unknown, path: string): void => {
  if (typeof v === 'string') {
    if (!ASSET.test(v)) for (const p of typographyProblems(v)) errors.push(`${path}: ${p}: "${v.slice(0, 70)}"`)
  } else if (Array.isArray(v)) v.forEach((x, i) => walkText(x, `${path}[${i}]`))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walkText(x, path ? `${path}.${k}` : k)
}
walkText({ ...content, bookLines: undefined, bookLineText: undefined }, '')

for (const k of missing) console.warn(`WARN  missing asset: assets/${k}`)
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`)
  console.error(`\n${errors.length} errors (${counts})`)
  process.exit(1)
}
console.log(`content OK: ${counts}; ${keys.size} assets referenced, ${missing.length} missing`)
