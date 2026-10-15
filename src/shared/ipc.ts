// The typed contract between renderer and main. Every channel is listed here once;
// main implements it (src/main/index.ts), preload exposes it as window.api.
import type { GameState } from '../game/state'
import type { LlmRequest } from '../game/npc/director'

export type LlmJob = Omit<LlmRequest, 'signal'>

export interface LlmStatus {
  provider: string // 'embedded' | 'ollama'
  model: string
  phase: 'loading' | 'ready' | 'error'
  detail: string // human readable, e.g. the error
}

export interface RunMeta {
  id: string
  startedAt: string // ISO date
  updatedAt: string
  endedAt: string | null
  chapter: number
  playtimeMs: number
  hintsUsed: number
  gameVersion: string
}

export interface LogEvent {
  t: string // ISO date
  playtimeMs: number
  kind: 'scene' | 'dialogue' | 'choice' | 'fact' | 'item' | 'objective' | 'chapter' | 'hint' | 'chat' | 'end'
  data: Record<string, unknown>
}

// Serialized content bundle (Sets become arrays over IPC).
export interface ContentPayload {
  json: string
  errors: string[]
}

export interface Api {
  content(): Promise<ContentPayload>
  runs: {
    list(): Promise<RunMeta[]>
    create(state: GameState): Promise<RunMeta>
    load(id: string): Promise<{ meta: RunMeta; state: GameState }>
    save(id: string, state: GameState): Promise<RunMeta>
    log(id: string, events: LogEvent[]): Promise<void>
    readLog(id: string): Promise<LogEvent[]>
  }
  llm: {
    status(): Promise<LlmStatus>
    generate(id: string, job: LlmJob): Promise<string>
    cancel(id: string): Promise<void>
  }
}

export const CHANNELS = {
  content: 'content:get',
  runsList: 'runs:list',
  runsCreate: 'runs:create',
  runsLoad: 'runs:load',
  runsSave: 'runs:save',
  runsLog: 'runs:log',
  runsReadLog: 'runs:readLog',
  llmStatus: 'llm:status',
  llmGenerate: 'llm:generate',
  llmCancel: 'llm:cancel',
} as const
