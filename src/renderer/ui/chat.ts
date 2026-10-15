// Free chat with an NPC through the LLM. The director decides what the reply may do;
// this panel only shows it. While the model works the panel shows phase, elapsed time and Stop.
import type { Npc } from '../../shared/content-schema'
import { npcTurn, type ChatTurn, type LlmProvider } from '../../game/npc/director'
import type { Session } from '../session'
import { h, modal, toast, ui } from './dom'
import { speakerName } from './story-panels'

// Provider that forwards to the main process (embedded model or Ollama, chosen there).
export const ipcProvider: LlmProvider = {
  name: 'ipc',
  generate: async (req) => {
    const { signal, ...rest } = req
    const id = crypto.randomUUID()
    const abort = () => void window.api.llm.cancel(id)
    signal?.addEventListener('abort', abort)
    try {
      return await window.api.llm.generate(id, rest)
    } finally {
      signal?.removeEventListener('abort', abort)
    }
  },
}

export function openChat(session: Session, npc: Npc): Promise<void> {
  return modal(
    () =>
      new Promise<void>((resolve) => {
        const history: ChatTurn[] = []
        const log = h('div', { class: 'chat-log' })
        const input = h('input', { class: 'chat-input', type: 'text', maxlength: '300', placeholder: `Scrivi a ${npc.name}…` })
        const send = h('button', {}, 'Parla')
        const close = h('button', {}, 'Congeda')
        const status = h('div', { class: 'chat-status' })
        const panel = h('div', { class: 'chat panel' },
          h('div', { class: 'chat-title' }, `Conversazione con ${npc.name}`),
          log, status,
          h('div', { class: 'chat-row' }, input, send, close),
        )
        ui().append(panel)
        input.focus()

        const add = (who: string, text: string, cls: string) => {
          log.append(h('p', { class: cls }, who ? h('b', {}, `${who}: `) : null, text))
          log.scrollTop = log.scrollHeight
        }
        let busy: AbortController | null = null
        const finish = () => {
          busy?.abort()
          session.log('chat', { npc: npc.id, turns: history })
          panel.remove()
          resolve()
        }

        const submit = async () => {
          const text = input.value.trim()
          if (!text || busy) return
          input.value = ''
          add(speakerName(session.content, session.state.player), text, 'chat-player')
          busy = new AbortController()
          const started = performance.now()
          const stop = h('button', { class: 'stop', onclick: () => busy?.abort() }, 'Stop')
          const timer = setInterval(() => {
            status.replaceChildren(`${npc.name} riflette… ${((performance.now() - started) / 1000).toFixed(0)} s `, stop)
          }, 250)
          status.replaceChildren(`${npc.name} riflette… 0 s `, stop)
          try {
            const reply = await npcTurn(
              { npc, state: session.state, content: session.content, history, playerText: text },
              ipcProvider,
              busy.signal,
            )
            if (busy.signal.aborted) {
              add('', '(interrotto)', 'chat-note')
            } else {
              history.push({ role: 'player', text }, { role: 'npc', text: reply.say })
              add(npc.name, reply.say, 'chat-npc')
              session.run(reply.effects)
              if (reply.hint) {
                session.nextHint()
                add('', `Suggerimento: ${reply.hint}`, 'chat-hint')
              }
              if (reply.end) {
                add('', `${npc.name} si congeda.`, 'chat-note')
                input.disabled = true
                send.disabled = true
              }
            }
          } catch (e) {
            toast(`Il modello non risponde: ${(e as Error).message}`)
          } finally {
            clearInterval(timer)
            status.replaceChildren()
            busy = null
          }
        }

        send.addEventListener('click', submit)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') finish()
        })
        close.addEventListener('click', finish)
      }),
  )
}
