// One running game: owns the state, runs effects through the rules, logs events, autosaves.
// Phaser scenes and UI panels talk to the game only through this object.
import type { Content, Effect } from '../shared/content-schema'
import type { LogEvent, RunMeta } from '../shared/ipc'
import { apply, chapterOf, currentObjective, progress, type Command } from '../game/rules'
import { newGameState, type GameState } from '../game/state'

type Listener = (commands: Command[]) => void

export class Session {
  private pending: LogEvent[] = []
  private listeners: Listener[] = []
  private clockStart = performance.now()

  private constructor(readonly content: Content, public meta: RunMeta, public state: GameState) {}

  static async create(content: Content, chapter = 1): Promise<Session> {
    const ch = chapterOf(content, chapter)
    const first = progress(newGameState(ch.number, ch.start_scene, ch.player, ch.start_at ?? null), content).state
    const meta = await window.api.runs.create(first)
    const s = new Session(content, meta, first)
    s.log('chapter', { number: ch.number })
    return s
  }

  static async resume(content: Content, id: string): Promise<Session> {
    const { meta, state } = await window.api.runs.load(id)
    return new Session(content, meta, state)
  }

  onCommands(fn: Listener): () => void {
    this.listeners.push(fn)
    return () => (this.listeners = this.listeners.filter((l) => l !== fn))
  }

  // Runs effects, records what happened, notifies listeners (scene changes, dialogues, narration...).
  run(effects: Effect[]): Command[] {
    if (!effects.length) return []
    const { state, commands } = apply(effects, this.tick(), this.content)
    this.state = state
    for (const c of commands) {
      if (c.kind === 'learned') this.log('fact', { id: c.fact })
      else if (c.kind === 'got') this.log('item', { id: c.item })
      else if (c.kind === 'objective') this.log('objective', { id: c.id })
      else if (c.kind === 'chapter') this.log('chapter', { number: c.number })
      else if (c.kind === 'goto') this.log('scene', { id: c.scene })
      else if (c.kind === 'end') this.log('end', {})
    }
    if (commands.some((c) => c.kind === 'goto' || c.kind === 'chapter' || c.kind === 'end')) void this.save()
    for (const l of this.listeners) l(commands)
    return commands
  }

  objective() {
    return currentObjective(this.state, this.content)
  }

  // Shows the next hand-written hint of the current objective and counts it.
  nextHint(): string | null {
    const obj = this.objective()
    if (!obj) return null
    const level = this.state.hintLevel[obj.id] ?? 0
    const text = obj.hints[Math.min(level, obj.hints.length - 1)]
    this.state = { ...this.tick(), hintLevel: { ...this.state.hintLevel, [obj.id]: Math.min(level + 1, obj.hints.length) } }
    this.log('hint', { objective: obj.id, level: level + 1 })
    return text
  }

  failedAttempt(): void {
    const obj = this.objective()
    if (!obj) return
    this.state = { ...this.state, failedAttempts: { ...this.state.failedAttempts, [obj.id]: (this.state.failedAttempts[obj.id] ?? 0) + 1 } }
  }

  log(kind: LogEvent['kind'], data: Record<string, unknown>): void {
    this.pending.push({ t: new Date().toISOString(), playtimeMs: this.state.playtimeMs, kind, data })
    if (this.pending.length >= 20) void this.flush()
  }

  async save(): Promise<void> {
    this.state = this.tick()
    await this.flush()
    this.meta = await window.api.runs.save(this.meta.id, this.state)
  }

  private async flush(): Promise<void> {
    const events = this.pending
    this.pending = []
    await window.api.runs.log(this.meta.id, events)
  }

  // Adds real time elapsed since the last tick to the play time.
  private tick(): GameState {
    const now = performance.now()
    const s = { ...this.state, playtimeMs: this.state.playtimeMs + Math.round(now - this.clockStart) }
    this.clockStart = now
    return s
  }
}
