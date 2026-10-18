// The typed contract between renderer and main. Every channel is listed here once;
// main implements it (src/main/index.ts), preload exposes it as window.api.
import type { GameState } from '../game/state'
import type { LlmRequest } from '../game/npc/director'

export type LlmJob = Omit<LlmRequest, 'signal'>

export interface LlmStatus {
  provider: string // 'embedded' | 'ollama'
  model: string
  // missing: no model on this computer (free chat disabled, the menu offers the download); idle: found, not
  // loaded yet (it loads when a game starts); loading; ready; error
  phase: 'missing' | 'idle' | 'loading' | 'ready' | 'error'
  detail: string // human readable, e.g. the error
}

// The model file (src/main/llm/model-store.ts, D34).
export interface ModelInfo {
  found: boolean
  source: 'downloaded' | 'bundled' | 'ollama' | null // where it was found
  path: string | null
  size: number // bytes of the file
  licence: string
  downloadTo: string // where a download goes
  download: ModelDownload | null // a download in progress
}

export interface ModelDownload {
  // checking: free space; resuming: re-reading the part already downloaded; downloading; verifying: sha256
  phase: 'checking' | 'resuming' | 'downloading' | 'verifying' | 'done' | 'stopped' | 'error'
  received: number // bytes
  total: number
  startedAt: number // ms since epoch
  speed: number // bytes per second, last half second
  error: string | null
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
  kind: 'scene' | 'dialogue' | 'choice' | 'fact' | 'item' | 'objective' | 'chapter' | 'hint' | 'chat' | 'deduction' | 'end'
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
    warmup(): Promise<void> // loads the model in memory, when a game starts
    modelInfo(): Promise<ModelInfo>
    downloadModel(): Promise<void> // resolves when the download ends (done, stopped or failed)
    stopDownload(): Promise<void>
    removeModel(): Promise<void> // deletes the copy the game downloaded
    onDownload(fn: (d: ModelDownload) => void): () => void // progress; returns unsubscribe
  }
  app: {
    quit(): Promise<void>
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
  llmWarmup: 'llm:warmup',
  llmModelInfo: 'llm:modelInfo',
  llmDownload: 'llm:download',
  llmStopDownload: 'llm:stopDownload',
  llmRemoveModel: 'llm:removeModel',
  llmDownloadProgress: 'llm:downloadProgress', // main -> renderer event
  appQuit: 'app:quit',
} as const


