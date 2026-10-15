// LLM service in the main process: picks the provider from config, runs one job at a time, supports cancel.
// Config: <userData>/llm.json, e.g. {"provider": "ollama", "model": "qwen3.5:4b"}. Missing file = defaults.
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { LlmRequest } from '../../game/npc/director'
import type { LlmJob, LlmStatus } from '../../shared/ipc'
import { OllamaProvider } from './ollama'
import { EmbeddedProvider } from './embedded'

export interface LlmConfig {
  provider: 'embedded' | 'ollama'
  model: string // embedded: path to a .gguf file; ollama: model tag
  ollamaUrl: string
}

// Qwen 3.5 4B Q4_K_M. Shipped builds put it in resources/models/; in development the copy Ollama already
// downloaded is used directly (same GGUF file, see the spike report).
export const MODEL_FILE = 'qwen3.5-4b-q4_k_m.gguf'
const OLLAMA_BLOB = join(homedir(), '.ollama', 'models', 'blobs', 'sha256-a9d0a3e1d8c91732a3812becd31f8d4a8ff57414903f226306069f0437e2ac50')

function defaultModelPath(resourcesDir: string): string {
  const shipped = join(resourcesDir, 'models', MODEL_FILE)
  return existsSync(shipped) ? shipped : OLLAMA_BLOB
}

export interface MainProvider {
  status(): LlmStatus
  generate(req: LlmRequest): Promise<string>
}

export class LlmService {
  private provider: MainProvider
  private running = new Map<string, AbortController>()
  private queue: Promise<unknown> = Promise.resolve()

  constructor(configFile: string, resourcesDir: string) {
    const user: Partial<LlmConfig> = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')) : {}
    const provider = user.provider ?? 'embedded'
    const model = user.model ?? (provider === 'embedded' ? defaultModelPath(resourcesDir) : 'qwen3.5:4b')
    this.provider = provider === 'embedded'
      ? new EmbeddedProvider(model)
      : new OllamaProvider(user.ollamaUrl ?? 'http://127.0.0.1:11434', model)
  }

  status(): LlmStatus {
    return this.provider.status()
  }

  // Jobs run one after the other: a small local model on one GPU gains nothing from parallel requests.
  generate(id: string, job: LlmJob): Promise<string> {
    const ctrl = new AbortController()
    this.running.set(id, ctrl)
    const run = this.queue.then(() => {
      if (ctrl.signal.aborted) throw new Error('cancelled')
      return this.provider.generate({ ...job, signal: ctrl.signal })
    })
    this.queue = run.catch(() => undefined)
    return run.finally(() => this.running.delete(id))
  }

  cancel(id: string): void {
    this.running.get(id)?.abort()
  }
}
