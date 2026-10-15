// npm run validate: checks every file in content/ against the schemas and all cross references,
// then lists the assets the content refers to that are not in assets/ yet (warnings: art may come later).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadContent } from '../src/shared/content-loader'

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

for (const k of missing) console.warn(`WARN  missing asset: assets/${k}`)
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`)
  console.error(`\n${errors.length} errors (${counts})`)
  process.exit(1)
}
console.log(`content OK: ${counts}; ${keys.size} assets referenced, ${missing.length} missing`)
