// LLM service in the main process: picks the provider from config, runs one job at a time, supports cancel.
// Config: <userData>/llm.json, e.g. {"provider": "ollama", "model": "qwen3.5:4b"}. Missing file = defaults:
// the embedded model that ModelStore finds (downloaded by the game, shipped, or Ollama's copy; D34).
import { existsSync, readFileSync } from 'node:fs'
import type { LlmRequest } from '../../game/npc/director'
import type { LlmJob, LlmStatus } from '../../shared/ipc'
import { OllamaProvider } from './ollama'
import { EmbeddedProvider } from './embedded'
import type { ModelStore } from './model-store'

export interface LlmConfig {
  provider: 'embedded' | 'ollama'
  model: string // embedded: path to a .gguf file (default: the one ModelStore finds); ollama: model tag
  ollamaUrl: string
}

export interface MainProvider {
  status(): LlmStatus
  generate(req: LlmRequest): Promise<string>
  dispose?(): Promise<void>
}

export class LlmService {
  private provider: MainProvider | null = null
  private running = new Map<string, AbortController>()
  private queue: Promise<unknown> = Promise.resolve()
  private readonly config: Partial<LlmConfig>

  constructor(configFile: string, private readonly store: ModelStore) {
    this.config = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')) : {}
    if (this.config.provider === 'ollama') {
      this.provider = new OllamaProvider(this.config.ollamaUrl ?? 'http://127.0.0.1:11434', this.config.model ?? 'qwen3.5:4b')
    }
  }

  // The embedded model, loaded the first time it is needed (a game starts, or a chat). Null: no model found.
  private ensure(): MainProvider | null {
    if (this.provider) return this.provider
    const path = this.config.model ?? this.store.locate()?.path
    if (!path) return null
    this.provider = new EmbeddedProvider(path)
    return this.provider
  }

  status(): LlmStatus {
    if (this.provider) return this.provider.status()
    const found = this.config.model ?? this.store.locate()?.path
    return found
      ? { provider: 'embedded', model: found, phase: 'idle', detail: 'modello trovato, si carica quando inizia la partita' }
      : { provider: 'embedded', model: '', phase: 'missing', detail: 'modello non presente: si scarica dal menu principale' }
  }

  warmup(): void {
    this.ensure()
  }

  // Before deleting the downloaded file: a loaded model keeps it open (on Windows a file in use cannot go).
  async unload(): Promise<void> {
    if (this.provider?.dispose) await this.provider.dispose()
    if (this.config.provider !== 'ollama') this.provider = null
  }

  // Jobs run one after the other: a small local model on one GPU gains nothing from parallel requests.
  generate(id: string, job: LlmJob): Promise<string> {
    const provider = this.ensure()
    if (!provider) return Promise.reject(new Error('modello non presente: scaricalo dal menu principale'))
    const ctrl = new AbortController()
    this.running.set(id, ctrl)
    const run = this.queue.then(() => {
      if (ctrl.signal.aborted) throw new Error('cancelled')
      return provider.generate({ ...job, signal: ctrl.signal })
    })
    this.queue = run.catch(() => undefined)
    return run.finally(() => this.running.delete(id))
  }

  cancel(id: string): void {
    this.running.get(id)?.abort()
  }
}
