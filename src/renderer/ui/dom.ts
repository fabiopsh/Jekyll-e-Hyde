// Tiny DOM helpers shared by every UI panel. No framework on purpose (docs/DECISIONI.md D7).

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
