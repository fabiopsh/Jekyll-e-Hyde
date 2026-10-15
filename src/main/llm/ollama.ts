// Ollama over HTTP (fallback provider). Uses /api/chat with a JSON schema in `format`
// (grammar-constrained output) and thinking disabled for fast replies.
import type { LlmRequest } from '../../game/npc/director'
import type { LlmStatus } from '../../shared/ipc'
import type { MainProvider } from './index'

export class OllamaProvider implements MainProvider {
  private lastError = ''

  constructor(private readonly url: string, private readonly model: string) {}

  status(): LlmStatus {
    return { provider: 'ollama', model: this.model, phase: this.lastError ? 'error' : 'ready', detail: this.lastError }
  }

  async generate(req: LlmRequest): Promise<string> {
    try {
      const res = await fetch(`${this.url}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: req.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          think: false,
          format: req.schema,
          options: { num_predict: req.maxTokens, temperature: 0.7 },
          messages: [{ role: 'system', content: req.system }, ...req.messages],
        }),
      })
      if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`)
      const data = (await res.json()) as { message?: { content?: string } }
      this.lastError = ''
      return data.message?.content ?? ''
    } catch (e) {
      if ((e as Error).name !== 'AbortError') this.lastError = (e as Error).message
      throw e
    }
  }
}
