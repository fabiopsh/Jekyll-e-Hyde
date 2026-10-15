// Play history on disk: one folder per run with meta.json, save.json and an append-only log.jsonl.
// See docs/ARCHITETTURA.md §6.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { GameState } from '../../game/state'
import type { LogEvent, RunMeta } from '../../shared/ipc'

export class RunStore {
  constructor(private readonly dir: string, private readonly gameVersion: string) {
    mkdirSync(dir, { recursive: true })
  }

  list(): RunMeta[] {
    return readdirSync(this.dir)
      .filter((id) => existsSync(this.file(id, 'meta.json')))
      .map((id) => JSON.parse(readFileSync(this.file(id, 'meta.json'), 'utf8')) as RunMeta)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  create(state: GameState): RunMeta {
    const now = new Date().toISOString()
    const id = `${now.slice(0, 10)}_${randomUUID().slice(0, 8)}`
    mkdirSync(join(this.dir, id))
    const meta: RunMeta = {
      id, startedAt: now, updatedAt: now, endedAt: null, chapter: state.chapter,
      playtimeMs: state.playtimeMs, hintsUsed: 0, gameVersion: this.gameVersion,
    }
    this.writeAtomic(id, 'meta.json', meta)
    this.writeAtomic(id, 'save.json', state)
    return meta
  }

  load(id: string): { meta: RunMeta; state: GameState } {
    return {
      meta: JSON.parse(readFileSync(this.file(id, 'meta.json'), 'utf8')),
      state: JSON.parse(readFileSync(this.file(id, 'save.json'), 'utf8')),
    }
  }

  save(id: string, state: GameState): RunMeta {
    const old = this.load(id).meta
    const now = new Date().toISOString()
    const meta: RunMeta = {
      ...old,
      updatedAt: now,
      endedAt: state.ended ? old.endedAt ?? now : null,
      chapter: state.chapter,
      playtimeMs: state.playtimeMs,
      hintsUsed: Object.values(state.hintLevel).reduce((a, b) => a + b, 0),
    }
    this.writeAtomic(id, 'save.json', state)
    this.writeAtomic(id, 'meta.json', meta)
    return meta
  }

  log(id: string, events: LogEvent[]): void {
    if (events.length) appendFileSync(this.file(id, 'log.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n')
  }

  readLog(id: string): LogEvent[] {
    const f = this.file(id, 'log.jsonl')
    if (!existsSync(f)) return []
    return readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  }

  private file(id: string, name: string): string {
    if (!/^[\w-]+$/.test(id)) throw new Error(`bad run id ${id}`)
    return join(this.dir, id, name)
  }

  // write to a temp file then rename, so a crash never leaves a half-written save
  private writeAtomic(id: string, name: string, data: unknown): void {
    const target = this.file(id, name)
    writeFileSync(`${target}.tmp`, JSON.stringify(data, null, 2))
    renameSync(`${target}.tmp`, target)
  }
}
