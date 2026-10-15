// Zod schemas for everything under content/. Types are inferred from here: this file is the single
// definition of the content format (described in docs/ARCHITETTURA.md §4).
import { z } from 'zod'

const id = z.string().regex(/^[a-z0-9_]+$/, 'ids are lowercase ascii, digits and _')
const factId = z.string().regex(/^F\d{2}\.\d+$/, 'fact ids look like F02.3')
const bookLineId = z.string().regex(/^D\d{2}\.\d+\.\d+$/, 'book line ids look like D02.3.4')

// ---- conditions and effects (the content mini-language) -------------------------------------

export type Condition =
  | { flag: string }
  | { has: string }
  | { knows: string }
  | { chapter: number }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] }

export const Condition: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({ flag: id }),
    z.strictObject({ has: id }),
    z.strictObject({ knows: factId }),
    z.strictObject({ chapter: z.number().int().min(1).max(10) }),
    z.strictObject({ not: Condition }),
    z.strictObject({ all: z.array(Condition).min(1) }),
    z.strictObject({ any: z.array(Condition).min(1) }),
  ]),
)

export const Effect = z.union([
  z.strictObject({ set: id }),
  z.strictObject({ unset: id }),
  z.strictObject({ give: id }),
  z.strictObject({ take: id }),
  z.strictObject({ learn: factId }),
  z.strictObject({ goto: id, at: id.optional() }),
  z.strictObject({ dialogue: id }),
  z.strictObject({ narrate: z.string().min(1) }),
  z.strictObject({ journal: z.string().min(1) }),
  z.strictObject({ complete: id }),
  z.strictObject({ chapter: z.number().int().min(1).max(10) }),
  z.strictObject({ end: z.literal(true) }),
])
export type Effect = z.infer<typeof Effect>

const Effects = z.array(Effect).default([])
const When = Condition.optional()

// ---- geometry ----------------------------------------------------------------------------------

const Point = z.tuple([z.number(), z.number()])
const Polygon = z.array(Point).min(3)
const Rect = z.strictObject({ x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive() })

// ---- items and facts ---------------------------------------------------------------------------

export const Item = z.strictObject({
  id,
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(), // asset key, e.g. items/obj_cheque
})
export type Item = z.infer<typeof Item>

export const Fact = z.strictObject({
  id: factId,
  text: z.string(), // what the fact says, in Italian, as the player's journal shows it
  chapter: z.number().int().min(1).max(10), // chapter where it becomes true in the book
  known_by: z.array(id).default([]), // npcs that may reveal it (from that chapter on)
  reveal_when: Condition.optional(), // extra gate, keeps the book's order in free chat
})
export type Fact = z.infer<typeof Fact>

// ---- scenes ------------------------------------------------------------------------------------

const Verb = z.enum(['look', 'use', 'talk', 'take'])

const Interaction = z.strictObject({
  when: When,
  effects: Effects,
})

export const Hotspot = z.strictObject({
  id,
  name: z.string(),
  shape: z.union([Rect, z.strictObject({ polygon: Polygon })]),
  when: When, // hotspot exists only while true
  walk_to: Point.optional(),
  verbs: z.partialRecord(Verb, z.array(Interaction).min(1)), // first matching interaction runs
})

export const Exit = z.strictObject({
  id,
  name: z.string(),
  shape: Rect,
  to: id,
  at: id.optional(), // entry point in the target scene
  when: When,
  blocked: z.string().optional(), // narration shown when `when` is false
})

export const NpcPlacement = z.strictObject({
  npc: id,
  at: Point,
  facing: z.enum(['left', 'right']).default('left'),
  when: When,
  talk: id.optional(), // scripted dialogue started by "talk"
  chat: z.boolean().default(true), // free LLM chat allowed
})

export const Scene = z.strictObject({
  id,
  name: z.string(),
  background: z.string(), // asset key, e.g. backgrounds/loc_door
  foreground: z.array(z.string()).default([]),
  walkable: Polygon,
  scale: z.strictObject({ far_y: z.number(), far: z.number(), near_y: z.number(), near: z.number() }).optional(),
  entries: z.record(id, Point),
  hotspots: z.array(Hotspot).default([]),
  exits: z.array(Exit).default([]),
  npcs: z.array(NpcPlacement).default([]),
  on_enter: z.array(Interaction).default([]),
  music: z.string().optional(),
})
export type Scene = z.infer<typeof Scene>

// ---- scripted dialogues ------------------------------------------------------------------------

const Line = z.strictObject({
  speaker: id, // npc id, the player character id, or "narrator"
  it: z.string().min(1),
  src: bookLineId.optional(), // the book line this comes from (story/chapters/)
  emotion: z.string().optional(),
})

const Choice = z.strictObject({
  text: z.string(),
  when: When,
  effects: Effects,
  next: id.nullable(), // null ends the dialogue
})

const DialogueNode = z.strictObject({
  lines: z.array(Line).default([]),
  effects: Effects,
  choices: z.array(Choice).optional(),
  next: id.nullable().optional(), // used when there are no choices
})

export const Dialogue = z.strictObject({
  id,
  start: id,
  nodes: z.record(id, DialogueNode),
})
export type Dialogue = z.infer<typeof Dialogue>

// ---- chapters ----------------------------------------------------------------------------------

export const Objective = z.strictObject({
  id,
  text: z.string(), // shown in the journal
  done_when: Condition,
  hints: z.array(z.string()).length(3), // vague -> precise, written by hand
})

export const Chapter = z.strictObject({
  number: z.number().int().min(1).max(10),
  title: z.string(),
  player: id, // utterson, lanyon, jekyll, hyde
  start_scene: id,
  start_at: id.optional(),
  intro: z.array(z.string()).default([]), // narration cards shown at chapter start
  objectives: z.array(Objective).min(1),
  next_when: Condition, // when true, the chapter ends
  // Words no NPC may say in this chapter (case-insensitive substrings): the LLM knows the novel and
  // could spoil it. A reply containing one is replaced by a fallback line.
  banned_words: z.array(z.string().min(3)).default([]),
})
export type Chapter = z.infer<typeof Chapter>

// ---- npc cards for the LLM ---------------------------------------------------------------------

export const Npc = z.strictObject({
  id,
  name: z.string(),
  sprite: z.string(), // asset key prefix, e.g. characters/poole
  portrait: z.string().optional(),
  persona: z.string(), // who they are, in Italian, second person ("Sei Poole, ...")
  voice: z.string(), // how they talk
  never: z.array(z.string()).default([]), // things this character must never say or do
  canonical_lines: z.array(bookLineId).default([]), // book lines used as style examples
  per_chapter: z
    .record(
      z.string().regex(/^\d+$/),
      z.strictObject({
        situation: z.string(), // what is going on for them in this chapter
        mood: z.string().optional(),
      }),
    )
    .default({}),
  fallback: z.array(z.string()).min(1), // in-character lines used when the LLM fails
})
export type Npc = z.infer<typeof Npc>

// ---- the whole content bundle ------------------------------------------------------------------

export interface Content {
  chapters: Chapter[]
  scenes: Record<string, Scene>
  dialogues: Record<string, Dialogue>
  npcs: Record<string, Npc>
  items: Record<string, Item>
  facts: Record<string, Fact>
  bookLines: Set<string> // every D-id found in story/chapters, for src checks
  bookLineText: Record<string, string> // D-id -> Italian text, used as style examples for NPCs
}
