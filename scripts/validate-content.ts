// npm run validate: checks every file in content/ against the schemas and all cross references.
import { loadContent } from '../src/shared/content-loader'

const { content, errors } = loadContent(process.cwd())
const counts = `${content.chapters.length} chapters, ${Object.keys(content.scenes).length} scenes, ` +
  `${Object.keys(content.dialogues).length} dialogues, ${Object.keys(content.npcs).length} npcs, ` +
  `${Object.keys(content.items).length} items, ${Object.keys(content.facts).length} facts, ` +
  `${content.bookLines.size} book lines in story/`
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`)
  console.error(`\n${errors.length} errors (${counts})`)
  process.exit(1)
}
console.log(`content OK: ${counts}`)
