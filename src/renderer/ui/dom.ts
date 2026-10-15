// Tiny DOM helpers shared by every UI panel. No framework on purpose (docs/DECISIONI.md D7).
import { playTalkBlip } from '../audio'

export const ui = (): HTMLElement => document.getElementById('ui')!


type Child = Node | string | null | undefined | false

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string | ((e: Event) => void)>> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v)
    else if (v !== undefined) el.setAttribute(k, v)
  }
  for (const c of children) if (c) el.append(c)
  return el
}

// Resolves on the next click, Space or Enter anywhere (used to advance text).
export function waitAdvance(target: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      target.removeEventListener('click', done)
      window.removeEventListener('keydown', key)
      resolve()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); done() }
    }
    // defer so the click that opened the panel does not close it
    setTimeout(() => {
      target.addEventListener('click', done)
      window.addEventListener('keydown', key)
    }, 0)
  })
}

// Typewriter effect: reveals characters progressively with character voice blips.
// A click, Space or Enter while typing instantly reveals the entire text.
// Once full text is revealed, the next click, Space or Enter resolves to advance.
export function typeText(
  target: HTMLElement,
  text: string,
  container: HTMLElement,
  advanceIndicator?: HTMLElement,
  speaker = 'narrator'
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0
    let typing = true
    let timer: number | null = null

    if (advanceIndicator) advanceIndicator.classList.add('waiting')
    target.textContent = ''

    const complete = () => {
      if (timer) clearTimeout(timer)
      timer = null
      typing = false
      target.textContent = text
      target.classList.remove('typing')
      if (advanceIndicator) advanceIndicator.classList.remove('waiting')
    }

    const nextChar = () => {
      if (!typing) return
      if (index < text.length) {
        index++
        target.textContent = text.slice(0, index)
        const char = text[index - 1]
        if (char !== ' ' && index % 2 === 0) {
          playTalkBlip(speaker)
        }
        let delay = 20
        if (char === '.' || char === '!' || char === '?') delay = 180
        else if (char === ',' || char === ';' || char === ':') delay = 85
        timer = window.setTimeout(nextChar, delay)
      } else {
        complete()
      }
    }

    const onAdvance = () => {
      if (typing) {
        complete()
      } else {
        cleanup()
        resolve()
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onAdvance()
      }
    }

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      container.removeEventListener('click', onAdvance)
      window.removeEventListener('keydown', onKey)
    }

    setTimeout(() => {
      target.classList.add('typing')
      container.addEventListener('click', onAdvance)
      window.addEventListener('keydown', onKey)
      nextChar()
    }, 0)
  })
}

// Progressive typewriter stream for chat logs with character speech blips.
// Automatically completes and resolves when typing finishes.
// Clicking container immediately reveals full text and resolves.
export function streamText(
  target: HTMLElement,
  text: string,
  container?: HTMLElement,
  speaker = 'enfield'
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0
    let typing = true
    let timer: number | null = null

    target.textContent = ''
    target.classList.add('typing')

    const complete = () => {
      if (timer) clearTimeout(timer)
      timer = null
      typing = false
      target.textContent = text
      target.classList.remove('typing')
      cleanup()
      resolve()
    }

    const nextChar = () => {
      if (!typing) return
      if (index < text.length) {
        index++
        target.textContent = text.slice(0, index)
        const char = text[index - 1]
        if (char !== ' ' && index % 2 === 0) {
          playTalkBlip(speaker)
        }
        let delay = 18
        if (char === '.' || char === '!' || char === '?') delay = 150
        else if (char === ',' || char === ';' || char === ':') delay = 60
        timer = window.setTimeout(nextChar, delay)
      } else {
        complete()
      }
    }

    const onClick = () => {
      if (typing) complete()
    }

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      if (container) container.removeEventListener('click', onClick)
    }

    if (container) container.addEventListener('click', onClick)
    nextChar()
  })
}



// True while a modal panel (dialogue, narration, chat, journal, menu) is open: the room ignores clicks.
let modalCount = 0
export const isModal = () => modalCount > 0
export async function modal<T>(fn: () => Promise<T>): Promise<T> {
  modalCount++
  try {
    return await fn()
  } finally {
    modalCount--
  }
}

export function toast(text: string, kind: 'fact' | 'item' | 'objective' | 'info' = 'info'): void {
  const el = h('div', { class: `toast toast-${kind}` }, text)
  ui().append(el)
  setTimeout(() => el.classList.add('out'), 3500)
  setTimeout(() => el.remove(), 4200)
}
