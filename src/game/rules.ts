// Interpreter of the content mini-language: conditions are evaluated against the state, effects
// produce a new state plus a list of commands for the presentation layer (dialogues, narration, scene changes).
import type { Chapter, Condition, Content, Effect } from '../shared/content-schema'
import { addUnique, type GameState } from './state'

export function check(cond: Condition | undefined, s: GameState): boolean {
  if (cond === undefined) return true
  if ('flag' in cond) return s.flags.includes(cond.flag)
  if ('has' in cond) return s.inventory.includes(cond.has)
  if ('knows' in cond) return s.facts.includes(cond.knows)
  if ('chapter' in cond) return s.chapter === cond.chapter
  if ('not' in cond) return !check(cond.not, s)
  if ('all' in cond) return cond.all.every((c) => check(c, s))
  return cond.any.some((c) => check(c, s))
}

// What the presentation layer must do after effects ran, in order.
export type Command =
  | { kind: 'goto'; scene: string; at: string | null }
  | { kind: 'dialogue'; id: string }
  | { kind: 'narrate'; text: string }
  | { kind: 'learned'; fact: string }
  | { kind: 'got'; item: string }
  | { kind: 'objective'; id: string }
  | { kind: 'chapter'; number: number }
  | { kind: 'end' }

export interface Outcome {
  state: GameState
  commands: Command[]
}

export function apply(effects: Effect[], state: GameState, content: Content): Outcome {
  let s = state
  const commands: Command[] = []
  for (const e of effects) {
    if ('set' in e) s = { ...s, flags: addUnique(s.flags, e.set) }
    else if ('unset' in e) s = { ...s, flags: s.flags.filter((f) => f !== e.unset) }
    else if ('give' in e) {
      if (!s.inventory.includes(e.give)) commands.push({ kind: 'got', item: e.give })
      s = { ...s, inventory: addUnique(s.inventory, e.give) }
    } else if ('take' in e) s = { ...s, inventory: s.inventory.filter((i) => i !== e.take) }
    else if ('learn' in e) {
      if (!s.facts.includes(e.learn)) {
        commands.push({ kind: 'learned', fact: e.learn })
        const fact = content.facts[e.learn]
        s = { ...s, facts: [...s.facts, e.learn], journal: [...s.journal, { chapter: s.chapter, text: fact?.text ?? e.learn }] }
      }
    } else if ('goto' in e) {
      s = { ...s, scene: e.goto, entry: e.at ?? null }
      commands.push({ kind: 'goto', scene: e.goto, at: e.at ?? null })
    } else if ('dialogue' in e) commands.push({ kind: 'dialogue', id: e.dialogue })
    else if ('narrate' in e) commands.push({ kind: 'narrate', text: e.narrate })
    else if ('journal' in e) s = { ...s, journal: [...s.journal, { chapter: s.chapter, text: e.journal }] }
    else if ('complete' in e) s = completeObjective(s, e.complete, commands)
    else if ('chapter' in e) s = startChapter(s, e.chapter, content, commands)
    else if ('end' in e) {
      s = { ...s, ended: true }
      commands.push({ kind: 'end' })
    }
  }
  return progress(s, content, commands)
}

function completeObjective(s: GameState, id: string, commands: Command[]): GameState {
  if (s.objectivesDone.includes(id)) return s
  commands.push({ kind: 'objective', id })
  return { ...s, objectivesDone: [...s.objectivesDone, id] }
}

export function chapterOf(content: Content, n: number): Chapter {
  const ch = content.chapters.find((c) => c.number === n)
  if (!ch) throw new Error(`chapter ${n} not in content`)
  return ch
}

function startChapter(s: GameState, n: number, content: Content, commands: Command[]): GameState {
  const ch = chapterOf(content, n)
  commands.push({ kind: 'chapter', number: n })
  commands.push({ kind: 'goto', scene: ch.start_scene, at: ch.start_at ?? null })
  return { ...s, chapter: n, player: ch.player, scene: ch.start_scene, entry: ch.start_at ?? null }
}

// After any change: mark objectives whose condition became true, start the next chapter when due.
// Objectives are completed in order: a later one never completes before the current one.
export function progress(state: GameState, content: Content, commands: Command[] = []): Outcome {
  let s = state
  for (;;) {
    const current = currentObjective(s, content)
    if (current && check(current.done_when, s)) {
      s = completeObjective(s, current.id, commands)
      continue
    }
    const ch = chapterOf(content, s.chapter)
    if (!current && check(ch.next_when, s) && !s.ended) {
      const next = content.chapters.find((c) => c.number === s.chapter + 1)
      if (!next) {
        s = { ...s, ended: true }
        commands.push({ kind: 'end' })
        break
      }
      s = startChapter(s, next.number, content, commands)
      continue
    }
    break
  }
  const current = currentObjective(s, content)
  if (current && s.objectiveSince[current.id] === undefined) {
    s = { ...s, objectiveSince: { ...s.objectiveSince, [current.id]: s.playtimeMs } }
  }
  return { state: s, commands }
}

export function currentObjective(s: GameState, content: Content) {
  return chapterOf(content, s.chapter).objectives.find((o) => !s.objectivesDone.includes(o.id))
}
