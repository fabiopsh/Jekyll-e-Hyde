// The whole game state: the only object written to a save file. Pure data, no engine types.

export interface JournalEntry {
  chapter: number
  text: string
}

export interface GameState {
  version: 1
  chapter: number
  scene: string
  entry: string | null // entry point in the scene, null = scene default
  player: string // character the player controls in this chapter
  flags: string[]
  inventory: string[]
  facts: string[]
  objectivesDone: string[]
  journal: JournalEntry[]
  playtimeMs: number
  // hint bookkeeping, per objective id
  hintLevel: Record<string, number> // how many hints already shown (0..3)
  objectiveSince: Record<string, number> // playtimeMs when the objective became current
  failedAttempts: Record<string, number>
  ended: boolean
}

export function newGameState(chapter: number, scene: string, player: string, entry: string | null = null): GameState {
  return {
    version: 1,
    chapter,
    scene,
    entry,
    player,
    flags: [],
    inventory: [],
    facts: [],
    objectivesDone: [],
    journal: [],
    playtimeMs: 0,
    hintLevel: {},
    objectiveSince: {},
    failedAttempts: {},
    ended: false,
  }
}

export function addUnique(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value]
}
