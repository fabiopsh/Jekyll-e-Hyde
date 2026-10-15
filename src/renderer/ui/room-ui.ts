// Room overlay: the name of what is under the mouse, and the verb menu opened by clicking a thing.
import { h, ui } from './dom'

export interface VerbOption {
  label: string
  run: () => void
}

let label: HTMLElement | null = null

export function hoverLabel(text: string | null): void {
  if (!label) {
    label = h('div', { class: 'hover-label' })
    ui().append(label)
  }
  label.textContent = text ?? ''
  label.style.visibility = text ? 'visible' : 'hidden'
}

let open: HTMLElement | null = null
let dismissListener: ((e: PointerEvent) => void) | null = null
let keyListener: ((e: KeyboardEvent) => void) | null = null

export function closeVerbMenu(): void {
  if (dismissListener) {
    window.removeEventListener('pointerdown', dismissListener)
    dismissListener = null
  }
  if (keyListener) {
    window.removeEventListener('keydown', keyListener)
    keyListener = null
  }
  if (open) {
    open.remove()
    open = null
  }
}

export function verbMenu(title: string, at: MouseEvent, options: VerbOption[]): void {
  closeVerbMenu()
  const menu = h('div', { class: 'verb-menu panel' },
    h('div', { class: 'verb-title' }, title),
    ...options.map((o) => h('button', { onclick: () => { closeVerbMenu(); o.run() } }, o.label)),
  )
  menu.style.left = `${Math.min(at.clientX, window.innerWidth - 220)}px`
  menu.style.top = `${Math.min(at.clientY, window.innerHeight - 60 - options.length * 52)}px`
  ui().append(menu)
  open = menu

  dismissListener = (e: PointerEvent) => {
    if (!menu.contains(e.target as Node)) {
      closeVerbMenu()
    }
  }
  keyListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeVerbMenu()
    }
  }

  setTimeout(() => {
    if (open === menu) {
      if (dismissListener) window.addEventListener('pointerdown', dismissListener)
      if (keyListener) window.addEventListener('keydown', keyListener)
    }
  }, 0)
}
