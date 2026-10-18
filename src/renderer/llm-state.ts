// What the renderer knows about free chat (D34): is the language model on this computer? The room greys out
// "Conversa" when it is not; the main menu offers the download. Refreshed at start and after a download.
import type { LlmStatus } from '../shared/ipc'

let status: LlmStatus | null = null

export async function refreshLlm(): Promise<LlmStatus | null> {
  try { status = await window.api.llm.status() } catch { status = null }
  return status
}

// Free chat can be offered: a model was found (loaded or not yet) or Ollama is configured and answering.
export function chatAvailable(): boolean {
  return !!status && status.phase !== 'missing' && status.phase !== 'error'
}

export function llmStatus(): LlmStatus | null {
  return status
}
