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

export function isVerbMenuOpen(): boolean {
  return open !== null
}

export function closeVerbMenu(): void {
  if (dismissListener) {
    window.removeEventListener('pointerdown', dismissListener, true)
    dismissListener = null
  }
  if (keyListener) {
    window.removeEventListener('keydown', keyListener, true)
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
    ...options.map((o) =>
      h('button', {
        onclick: (e: Event) => {
          e.stopPropagation()
          closeVerbMenu()
          o.run()
        },

      }, o.label)
    ),
  )

  // Prevent clicks and pointer events inside the menu from propagating to Phaser canvas underneath
  menu.addEventListener('pointerdown', (e) => e.stopPropagation())
  menu.addEventListener('mousedown', (e) => e.stopPropagation())
  menu.addEventListener('mouseup', (e) => e.stopPropagation())
  menu.addEventListener('click', (e) => e.stopPropagation())

  // Position near cursor, ensuring it stays fully within window viewport
  const left = Math.max(10, Math.min(at.clientX, window.innerWidth - 230))
  const top = Math.max(10, Math.min(at.clientY, window.innerHeight - 60 - options.length * 52))
  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
  ui().append(menu)
  open = menu

  dismissListener = (e: PointerEvent) => {
    if (!menu.contains(e.target as Node)) {
      closeVerbMenu()
    }
  }
  keyListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      closeVerbMenu()
    }
  }

  // Defer attaching dismiss listener to next frame so the opening click doesn't dismiss it
  setTimeout(() => {
    if (open === menu) {
      if (dismissListener) window.addEventListener('pointerdown', dismissListener, true)
      if (keyListener) window.addEventListener('keydown', keyListener, true)
    }
  }, 10)
}
