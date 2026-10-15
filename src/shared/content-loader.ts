// Loads content/ from disk (Node only: used by the Electron main process and by scripts/validate-content.ts).
// Returns the parsed bundle plus every problem found: schema errors and broken cross references.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { parse, parseAllDocuments } from 'yaml'
import { z } from 'zod'
import {
  Chapter, Condition, Content, Dialogue, Effect, Fact, Item, Npc, Scene,
} from './content-schema'

export interface LoadResult {
  content: Content
  errors: string[]
}

function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((f) => join(dir, f))
}

function read<T>(file: string, schema: z.ZodType<T>, errors: string[]): T | undefined {
  let raw: unknown
  try {
    raw = parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`${file}: invalid YAML: ${(e as Error).message}`)
    return undefined
  }
  const r = schema.safeParse(raw)
  if (!r.success) {
    for (const issue of r.error.issues) errors.push(`${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    return undefined
  }
  return r.data
}

function byId<T extends { id: string }>(list: T[], what: string, errors: string[]): Record<string, T> {
  const out: Record<string, T> = {}
  for (const x of list) {
    if (out[x.id]) errors.push(`duplicate ${what} id: ${x.id}`)
    out[x.id] = x
  }
  return out
}

// Every book line (D-id -> Italian text) from the YAML blocks of the story chapter sheets.
function bookLines(storyDir: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of existsSync(storyDir) ? readdirSync(storyDir) : []) {
    if (!f.endsWith('.md')) continue
    const md = readFileSync(join(storyDir, f), 'utf8').split('\r\n').join('\n')
    for (const block of md.matchAll(/```yaml\n([\s\S]*?)```/g)) {
      for (const doc of parseAllDocuments(block[1])) {
        const lines = doc.toJSON() as { id?: string; it?: string }[] | null
        if (Array.isArray(lines)) for (const l of lines) if (l?.id && l.it) out[l.id] = l.it
      }
    }
  }
  return out
}

export function loadContent(root: string): LoadResult {
  const errors: string[] = []
  const dir = join(root, 'content')

  const chapters = yamlFiles(join(dir, 'chapters')).map((f) => read(f, Chapter, errors)).filter((x) => x !== undefined)
  const scenes = yamlFiles(join(dir, 'scenes')).map((f) => read(f, Scene, errors)).filter((x) => x !== undefined)
  const dialogues = yamlFiles(join(dir, 'dialogues')).map((f) => read(f, Dialogue, errors)).filter((x) => x !== undefined)
  const npcs = yamlFiles(join(dir, 'npcs')).map((f) => read(f, Npc, errors)).filter((x) => x !== undefined)
  const itemsFile = join(dir, 'items.yaml')
  const factsFile = join(dir, 'facts.yaml')
  const items = existsSync(itemsFile) ? read(itemsFile, z.array(Item), errors) ?? [] : []
  const facts = existsSync(factsFile) ? read(factsFile, z.array(Fact), errors) ?? [] : []

  // file name must match id, so agents find things by name
  for (const [list, sub] of [[scenes, 'scenes'], [dialogues, 'dialogues'], [npcs, 'npcs']] as const) {
    for (const x of list) {
      const f = yamlFiles(join(dir, sub)).find((p) => basename(p, '.yaml') === x.id)
      if (!f) errors.push(`content/${sub}: id "${x.id}" must live in ${x.id}.yaml`)
    }
  }

  const lineText = bookLines(join(root, 'story', 'chapters'))
  const content: Content = {
    chapters: [...chapters].sort((a, b) => a.number - b.number),
    scenes: byId(scenes, 'scene', errors),
    dialogues: byId(dialogues, 'dialogue', errors),
    npcs: byId(npcs, 'npc', errors),
    items: byId(items, 'item', errors),
    facts: byId(facts, 'fact', errors),
    bookLines: new Set(Object.keys(lineText)),
    bookLineText: lineText,
  }
  checkReferences(content, errors)
  return { content, errors }
}

// ---- cross references --------------------------------------------------------------------------

function checkReferences(c: Content, errors: string[]): void {
  const characters = new Set([...Object.keys(c.npcs), 'narrator', 'utterson', 'lanyon', 'jekyll', 'hyde'])
  const objectiveIds = new Set(c.chapters.flatMap((ch) => ch.objectives.map((o) => o.id)))

  const cond = (where: string, x: Condition | undefined): void => {
    if (!x) return
    if ('has' in x && !c.items[x.has]) errors.push(`${where}: unknown item ${x.has}`)
    if ('knows' in x && !c.facts[x.knows]) errors.push(`${where}: unknown fact ${x.knows}`)
    if ('not' in x) cond(where, x.not)
    if ('all' in x) x.all.forEach((y) => cond(where, y))
    if ('any' in x) x.any.forEach((y) => cond(where, y))
  }
  const effects = (where: string, list: Effect[]): void => {
    for (const e of list) {
      if (('give' in e && !c.items[e.give]) || ('take' in e && !c.items[e.take])) errors.push(`${where}: unknown item in ${JSON.stringify(e)}`)
      if ('learn' in e && !c.facts[e.learn]) errors.push(`${where}: unknown fact ${e.learn}`)
      if ('goto' in e) {
        const target = c.scenes[e.goto]
        if (!target) errors.push(`${where}: unknown scene ${e.goto}`)
        else if (e.at && !target.entries[e.at]) errors.push(`${where}: scene ${e.goto} has no entry ${e.at}`)
      }
      if ('dialogue' in e && !c.dialogues[e.dialogue]) errors.push(`${where}: unknown dialogue ${e.dialogue}`)
      if ('complete' in e && !objectiveIds.has(e.complete)) errors.push(`${where}: unknown objective ${e.complete}`)
      if ('chapter' in e && !c.chapters.some((ch) => ch.number === e.chapter)) errors.push(`${where}: unknown chapter ${e.chapter}`)
    }
  }

  for (const ch of c.chapters) {
    const where = `chapter ${ch.number}`
    const start = c.scenes[ch.start_scene]
    if (!start) errors.push(`${where}: unknown start_scene ${ch.start_scene}`)
    else if (ch.start_at && !start.entries[ch.start_at]) errors.push(`${where}: no entry ${ch.start_at} in ${ch.start_scene}`)
    ch.objectives.forEach((o) => cond(`${where} objective ${o.id}`, o.done_when))
    cond(`${where} next_when`, ch.next_when)
  }

  for (const s of Object.values(c.scenes)) {
    const where = `scene ${s.id}`
    s.on_enter.forEach((i) => { cond(where, i.when); effects(`${where} on_enter`, i.effects) })
    for (const h of s.hotspots) {
      cond(`${where} hotspot ${h.id}`, h.when)
      for (const list of Object.values(h.verbs)) list?.forEach((i) => { cond(`${where} hotspot ${h.id}`, i.when); effects(`${where} hotspot ${h.id}`, i.effects) })
    }
    for (const x of s.exits) {
      const target = c.scenes[x.to]
      if (!target) errors.push(`${where} exit ${x.id}: unknown scene ${x.to}`)
      else if (x.at && !target.entries[x.at]) errors.push(`${where} exit ${x.id}: scene ${x.to} has no entry ${x.at}`)
      cond(`${where} exit ${x.id}`, x.when)
    }
    for (const n of s.npcs) {
      if (!c.npcs[n.npc]) errors.push(`${where}: unknown npc ${n.npc}`)
      if (n.talk && !c.dialogues[n.talk]) errors.push(`${where}: npc ${n.npc} unknown dialogue ${n.talk}`)
      cond(`${where} npc ${n.npc}`, n.when)
    }
  }

  for (const d of Object.values(c.dialogues)) {
    const where = `dialogue ${d.id}`
    if (!d.nodes[d.start]) errors.push(`${where}: start node ${d.start} missing`)
    for (const [nid, node] of Object.entries(d.nodes)) {
      const w = `${where} node ${nid}`
      for (const l of node.lines) {
        if (!characters.has(l.speaker)) errors.push(`${w}: unknown speaker ${l.speaker}`)
        if (l.src && !c.bookLines.has(l.src)) errors.push(`${w}: src ${l.src} not found in story/chapters`)
      }
      effects(w, node.effects)
      if (node.next && !d.nodes[node.next]) errors.push(`${w}: next ${node.next} missing`)
      for (const ch of node.choices ?? []) {
        cond(w, ch.when)
        effects(w, ch.effects)
        if (ch.next && !d.nodes[ch.next]) errors.push(`${w}: choice next ${ch.next} missing`)
      }
    }
  }

  for (const f of Object.values(c.facts)) {
    for (const who of f.known_by) if (!c.npcs[who]) errors.push(`fact ${f.id}: unknown npc ${who}`)
    cond(`fact ${f.id} reveal_when`, f.reveal_when)
  }
  for (const n of Object.values(c.npcs)) {
    for (const l of n.canonical_lines) if (!c.bookLines.has(l)) errors.push(`npc ${n.id}: canonical line ${l} not found`)
  }
}
