// npm run check:story: every `en:` line in story/chapters/*.md must come from the original chapter text.
// Lines joined across a narrator tag ("said he") are checked piece by piece: each run of 3+ words
// between punctuation marks must appear in the chapter, after normalizing case, quotes and spaces.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAllDocuments } from 'yaml'

const norm = (s: string) =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(/_/g, '').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()
const unix = (s: string) => s.split('\r\n').join('\n')

let bad = 0
let total = 0
for (const f of readdirSync('story/chapters').filter((f) => f.endsWith('.md')).sort()) {
  const md = unix(readFileSync(join('story/chapters', f), 'utf8'))
  const book = norm(readFileSync(join('book/chapters', f.replace(/\.md$/, '.txt')), 'utf8'))
  const blocks = [...md.matchAll(/```yaml\n([\s\S]*?)```/g)].map((m) => m[1])
  const ids = new Set<string>()
  for (const block of blocks) {
    for (const doc of parseAllDocuments(block)) {
      if (doc.errors.length) { console.log(`${f}: YAML error: ${doc.errors[0].message.split('\n')[0]}`); bad++ }
      const lines = doc.toJSON() as { id: string; en?: string; it?: string }[] | null
      if (!Array.isArray(lines)) continue
      for (const l of lines) {
        total++
        if (ids.has(l.id)) { console.log(`${f} ${l.id}: duplicate id`); bad++ }
        ids.add(l.id)
        if (!l.it) { console.log(`${f} ${l.id}: missing it`); bad++ }
        const pieces = (l.en ?? '').split(/[.,;:!?—–()"“”…]+/).map(norm).filter((p) => p.split(' ').length >= 3)
        const missing = pieces.filter((p) => !book.includes(p))
        if (!l.en || missing.length) { console.log(`${f} ${l.id}: not in book: "${missing[0] ?? '(no en)'}"`); bad++ }
      }
    }
  }
}
console.log(`${total} lines checked, ${bad} problems`)
process.exit(bad ? 1 : 0)
