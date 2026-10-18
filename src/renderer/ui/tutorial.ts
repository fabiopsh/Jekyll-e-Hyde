// The first-game tutorial (D32): a card at the top of the screen, one step at a time, and a ring that pulses
// on what to click. Steps come from content/game.yaml (`tutorial`); a step ends by itself when the player does
// what it says (walks, opens the menu of a thing) or with "Avanti"; "Salta il tutorial" ends it all.
// While a panel is open (a dialogue, the notebook) the card and the ring hide and wait.
import type { GameSettings } from '../../shared/content-schema'
import { h, ui } from './dom'

type Step = NonNullable<GameSettings['tutorial']>['steps'][number]
export type Pt = { x: number; y: number } // screen pixels

export interface TutorialHooks {
  npcPoint: () => Pt | null // where the first person of the room stands now (they move)
  gamePoint: (x: number, y: number) => Pt // game pixels (480x270) to screen pixels
}

export function runTutorial(steps: Step[], hooks: TutorialHooks): Promise<void> {
  return new Promise((resolve) => {
    let i = -1
    let raf = 0
    const text = h('p', { class: 'tutorial-text' })
    const count = h('span', { class: 'tutorial-count' })
    const next = h('button', { class: 'tutorial-next', onclick: () => go() }, 'Avanti')
    const card = h('div', { class: 'tutorial-card' },
      h('div', { class: 'tutorial-head' }, h('span', { class: 'tutorial-kicker' }, 'Come si gioca'), count),
      text,
      h('div', { class: 'tutorial-bar' }, next, h('button', { class: 'tutorial-skip', onclick: () => finish() }, 'Salta il tutorial')))
    const ring = h('div', { class: 'tutorial-ring' })
    for (const type of ['pointerdown', 'mousedown', 'mouseup']) card.addEventListener(type, (e) => e.stopPropagation()) // not a walk
    ui().append(card, ring)

    const target = (s: Step): Pt | null => {
      const t = s.target
      if (!t) return null
      if ('point' in t) return hooks.gamePoint(t.point[0], t.point[1])
      if ('npc' in t) return hooks.npcPoint()
      const el = document.querySelector<HTMLElement>(t.ui === 'bulb' ? '.hud-bulb' : '.hud-notebook')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    const follow = () => {
      const p = i >= 0 && i < steps.length ? target(steps[i]) : null
      ring.hidden = !p
      if (p) { ring.style.left = `${p.x}px`; ring.style.top = `${p.y}px` }
      raf = requestAnimationFrame(follow)
    }
    const onWalk = () => { if (steps[i]?.until === 'walk') go() }
    const onMenu = () => { if (steps[i]?.until === 'menu') setTimeout(go, 600) }
    window.addEventListener('jh:walk', onWalk)
    window.addEventListener('jh:verbmenu', onMenu)

    const go = () => {
      i++
      if (i >= steps.length) return finish()
      const s = steps[i]
      text.textContent = s.text
      count.textContent = `${i + 1} di ${steps.length}`
      next.hidden = s.until !== 'next'
      next.textContent = i === steps.length - 1 ? 'Ho capito' : 'Avanti'
      card.classList.remove('enter')
      void card.offsetWidth
      card.classList.add('enter')
    }
    const finish = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('jh:walk', onWalk)
      window.removeEventListener('jh:verbmenu', onMenu)
      card.remove()
      ring.remove()
      resolve()
    }
    go()
    follow()
  })
}
