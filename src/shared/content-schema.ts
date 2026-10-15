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
  // `image`: illustration shown on the right while the text is read (docs/DECISIONI.md D20)
  z.strictObject({ narrate: z.string().min(1), image: z.string().optional() }),
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
  follow: z.boolean().default(false), // walks along with the player (a companion, e.g. Enfield on the walk)
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
  // life in the room, drawn and played by the engine: chimney smoke, birds on the ground, ambient sounds
  ambience: z.strictObject({
    smoke: z.array(Point).default([]), // chimney tops, game pixels
    birds: z.strictObject({ area: Rect, count: z.number().int().min(1).max(12) }).optional(), // they fly off when the player comes near
    sounds: z.array(z.enum(['wind', 'bells', 'footsteps'])).default([]),
  }).optional(),
})
export type Scene = z.infer<typeof Scene>

// ---- scripted dialogues ------------------------------------------------------------------------

const Line = z.strictObject({
  speaker: id, // npc id, the player character id, or "narrator"
  it: z.string().min(1),
  src: bookLineId.optional(), // the book line this comes from (story/chapters/)
  emotion: z.string().optional(),
  image: z.string().optional(), // illustration shown on the right from this line on (D20)
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
  music: z.string().optional(),
})
export type Dialogue = z.infer<typeof Dialogue>

// ---- chapters ----------------------------------------------------------------------------------

const NarrationCard = z.union([z.string(), z.strictObject({ text: z.string(), image: z.string().optional() })])

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
  // narration cards shown at chapter start; a card can carry an illustration
  intro: z.array(NarrationCard).default([]),
  // cards shown after the end-of-chapter page (e.g. the first line of the next chapter, as a teaser)
  ending: z.array(NarrationCard).default([]),
  objectives: z.array(Objective).min(1),
  next_when: Condition, // when true, the chapter ends
  // Words no NPC may say in this chapter (case-insensitive substrings): the LLM knows the novel and
  // could spoil it. A reply containing one is replaced by a fallback line.
  banned_words: z.array(z.string().min(3)).default([]),
})
export type Chapter = z.infer<typeof Chapter>

// ---- characters: how every speaker looks and sounds (content/characters.yaml) -------------------

// Sound played while a character's text is typed (no voices: docs/DECISIONI.md D19).
export const Blip = z.union([
  z.literal('typewriter'), // key strike, used by the narrator
  z.strictObject({
    freq: z.number().min(40).max(2000), // base pitch in Hz
    wave: z.enum(['sine', 'triangle', 'sawtooth', 'square']),
    cutoff: z.number().min(100).max(8000), // low-pass filter in Hz
  }),
])
export type Blip = z.infer<typeof Blip>

export const Character = z.strictObject({
  id,
  name: z.string(), // shown above the line; empty for the narrator
  sprite: z.string().optional(), // asset key, e.g. characters/poole (spritesheet + atlas)
  portrait: z.string().optional(), // asset key, e.g. portraits/poole_neutral
  blip: Blip.optional(),
})
export type Character = z.infer<typeof Character>

// ---- npc cards for the LLM (content/npcs/<id>.yaml; the id must be a character) -----------------

export const Npc = z.strictObject({
  id,
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
  characters: Record<string, Character>
  npcs: Record<string, Npc>
  items: Record<string, Item>
  facts: Record<string, Fact>
  bookLines: Set<string> // every D-id found in story/chapters, for src checks
  bookLineText: Record<string, string> // D-id -> Italian text, used as style examples for NPCs
  game: GameSettings
}

// content/game.yaml: settings of the whole game that are content, not code.
export const GameSettings = z.strictObject({
  menu_music: z.string().optional(),
  // animated title behind the menu: a background, its lamp (flickers) and its door (a shadow appears there)
  menu_scene: z.strictObject({
    background: z.string(), // asset key of a 480x270 background
    fallback: z.string().optional(), // shown darkened while `background` does not exist yet
    lamp: Point.optional(), // game pixels of the lamp light
    door: Point.optional(), // game pixels where the shadow's feet stand
    figure: z.string().optional(), // character sprite whose silhouette (black, smaller) is the shadow
  }).optional(),
  menu_quote: z.string().optional(), // line under the menu buttons
})
export type GameSettings = z.infer<typeof GameSettings>
