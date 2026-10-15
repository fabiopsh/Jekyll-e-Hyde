// Embedded LLM: node-llama-cpp running a GGUF model inside the Electron main process.
// Settings come from the spike docs/spikes/2026-10-15-llm-embedded.md:
//   - getLlama({ gpu: 'auto', build: 'never' }): CUDA/Vulkan/CPU prebuilt binaries, never compile llama.cpp
//   - QwenChatWrapper with thoughts 'discourage': no <think> block, required together with a grammar
//   - one JSON-schema grammar per request (1-2 ms to build)
import type { LlmRequest } from '../../game/npc/director'
import type { LlmStatus } from '../../shared/ipc'
import type { MainProvider } from './index'

type Nlc = typeof import('node-llama-cpp')

export class EmbeddedProvider implements MainProvider {
  private phase: LlmStatus['phase'] = 'loading'
  private detail = 'caricamento del modello'
  private ready: Promise<{
    nlc: Nlc
    llama: import('node-llama-cpp').Llama
    context: import('node-llama-cpp').LlamaContext
  }>

  constructor(private readonly modelPath: string) {
    this.ready = this.load()
    this.ready.catch((e) => {
      this.phase = 'error'
      this.detail = (e as Error).message
    })
  }

  status(): LlmStatus {
    return { provider: 'embedded', model: this.modelPath, phase: this.phase, detail: this.detail }
  }

  private async load() {
    const started = Date.now()
    const nlc = await import('node-llama-cpp') // loaded lazily: native binaries, keep app start fast
    const llama = await nlc.getLlama({ gpu: 'auto', build: 'never' })
    const model = await llama.loadModel({ modelPath: this.modelPath, gpuLayers: 'max' })
    const context = await model.createContext({ contextSize: 4096 })
    this.phase = 'ready'
    this.detail = `pronto in ${((Date.now() - started) / 1000).toFixed(1)} s (${llama.gpu || 'cpu'})`
    return { nlc, llama, context }
  }

  async generate(req: LlmRequest): Promise<string> {
    const { nlc, llama, context } = await this.ready
    const sequence = context.getSequence()
    try {
      const session = new nlc.LlamaChatSession({
        contextSequence: sequence,
        chatWrapper: new nlc.QwenChatWrapper({ variation: '3.5', thoughts: 'discourage' }),
      })
      const history = req.messages.slice(0, -1)
      session.setChatHistory([
        { type: 'system', text: req.system },
        ...history.map((m) =>
          m.role === 'user' ? { type: 'user' as const, text: m.content } : { type: 'model' as const, response: [m.content] },
        ),
      ])
      const grammar = await llama.createGrammarForJsonSchema(req.schema as never)
      const last = req.messages[req.messages.length - 1]
      return await session.prompt(last.content, {
        grammar,
        maxTokens: req.maxTokens,
        temperature: 0.7,
        signal: req.signal,
        stopOnAbortSignal: false,
      })
    } finally {
      sequence.dispose()
    }
  }
}
