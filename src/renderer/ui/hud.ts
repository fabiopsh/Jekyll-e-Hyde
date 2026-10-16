// On screen while playing (docs/DECISIONI.md D30). Top left: a light bulb, lit while there is a hint left for
// the current objective; a click opens the card with the chapter, what to do, the hint button and the pockets.
// Top right: the lawyer's notebook (click it or press J): a pen writes on it when a note is added, and while
// there are notes not read yet it shakes a little now and then. Both stay small and out of the way.
import type { Session } from '../session'
import { roman } from './screens'
import { h, ui } from './dom'
import { playClickSound, playPenScratch } from '../audio'
import { chapterOf } from '../../game/rules'

const PEN_MS = 1600

const NOTEBOOK_SVG = `<svg viewBox="0 0 64 72" aria-hidden="true" shape-rendering="crispEdges">
<rect x="10" y="4" width="46" height="62" fill="#4a2c18"/><rect x="12" y="6" width="42" height="58" fill="#6b3f22"/>
<rect x="8" y="4" width="6" height="62" fill="#3a2010"/><rect x="18" y="14" width="30" height="16" fill="#8a5a32"/>
<rect x="20" y="16" width="26" height="12" fill="#d8c49a"/><rect x="23" y="20" width="20" height="2" fill="#6a4a2a"/>
<rect x="23" y="24" width="14" height="2" fill="#6a4a2a"/><rect x="50" y="30" width="10" height="8" fill="#2a1a0e"/>
<rect x="56" y="31" width="4" height="6" fill="#b8892e"/><rect x="12" y="62" width="42" height="4" fill="#e8dcc0"/>
</svg>`
const PEN_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true" shape-rendering="crispEdges">
<rect x="20" y="2" width="4" height="4" fill="#2a1a10"/><rect x="18" y="6" width="4" height="4" fill="#3a2414"/>
<rect x="16" y="10" width="4" height="4" fill="#4a2c18"/><rect x="14" y="14" width="4" height="4" fill="#5a3a20"/>
<rect x="12" y="18" width="4" height="4" fill="#b8892e"/><rect x="10" y="22" width="4" height="4" fill="#d8b050"/>
<rect x="8" y="26" width="4" height="4" fill="#c0c0c8"/><rect x="6" y="30" width="2" height="4" fill="#202028"/>
</svg>`
// glass (grey when off, warm when lit: CSS classes), brass screw base
const BULB_SVG = `<svg viewBox="0 0 32 40" aria-hidden="true" shape-rendering="crispEdges">
<rect x="10" y="2" width="12" height="2" class="glass-edge"/><rect x="6" y="4" width="20" height="4" class="glass-edge"/>
<rect x="4" y="8" width="24" height="12" class="glass-edge"/><rect x="8" y="4" width="16" height="4" class="glass"/>
<rect x="6" y="8" width="20" height="12" class="glass"/><rect x="8" y="20" width="16" height="4" class="glass"/>
<rect x="6" y="20" width="2" height="4" class="glass-edge"/><rect x="24" y="20" width="2" height="4" class="glass-edge"/>
<rect x="10" y="24" width="12" height="2" class="glass"/><rect x="8" y="24" width="2" height="2" class="glass-edge"/>
<rect x="22" y="24" width="2" height="2" class="glass-edge"/><rect x="10" y="8" width="4" height="4" class="shine"/>
<rect x="14" y="12" width="4" height="10" class="filament"/>
<rect x="10" y="26" width="12" height="2" fill="#8a6a2e"/><rect x="10" y="28" width="12" height="2" fill="#c8a050"/>
<rect x="10" y="30" width="12" height="2" fill="#8a6a2e"/><rect x="10" y="32" width="12" height="2" fill="#c8a050"/>
<rect x="12" y="34" width="8" height="2" fill="#5a4420"/>
</svg>`

export class Hud {
  private readonly root: HTMLElement
  private readonly kicker = h('div', { class: 'hud-kicker' })
  private readonly task = h('p', { class: 'hud-task-text' })
  private readonly hintText = h('p', { class: 'hud-hint-text' })
  private readonly hintBtn: HTMLButtonElement
  private readonly pockets = h('p', { class: 'hud-pockets' })
  private readonly card: HTMLElement
  private readonly bulb: HTMLButtonElement
  private readonly book: HTMLElement
  private penTimer = 0
  private shownObjective: string | null = null
  private holding = 0 // objectives completed but not yet crossed out on screen: keep showing the old one
  private readonly outside = (e: MouseEvent) => {
    if (!this.card.contains(e.target as Node) && !this.bulb.contains(e.target as Node)) this.toggleCard(false)
  }

  constructor(private readonly session: Session, openJournal: () => void) {
    this.hintBtn = h('button', { class: 'hud-hint', onclick: () => {
      const t = this.session.nextHint()
      if (t) this.hintText.textContent = t
      this.update()
    } }, 'Rifletti (un suggerimento)')
    this.card = h('div', { class: 'hud-task' }, this.kicker, this.task, this.hintBtn, this.hintText, this.pockets)
    this.card.hidden = true
    this.bulb = h('button', { class: 'hud-bulb', onclick: () => this.toggleCard(this.card.hidden) })
    this.bulb.innerHTML = BULB_SVG
    const icon = h('div', { class: 'hud-notebook-icon' })
    icon.innerHTML = NOTEBOOK_SVG
    const pen = h('div', { class: 'hud-pen' })
    pen.innerHTML = PEN_SVG
    this.book = h('button', { class: 'hud-notebook', title: 'Apri il taccuino (J)', onclick: openJournal },
      icon, pen, h('span', { class: 'hud-notebook-label' }, 'J'))
    // clicks on the HUD stay here: the room underneath would take them as a walk (like the verb menu)
    for (const el of [this.bulb, this.card, this.book]) {
      for (const type of ['pointerdown', 'mousedown', 'mouseup']) el.addEventListener(type, (e) => e.stopPropagation())
      el.addEventListener('click', (e) => { e.stopPropagation(); if ((e.target as HTMLElement).closest('button')) playClickSound() })
    }
    this.root = h('div', { class: 'hud' }, this.bulb, this.card, this.book)
    ui().prepend(this.root) // first child: every panel opened later covers it
    window.addEventListener('mousedown', this.outside)
    this.update()
  }

  private toggleCard(open: boolean): void {
    this.card.hidden = !open
    this.bulb.classList.toggle('open', open)
  }

  // Bulb, card and notebook from the current state. `completed`: objectives just done, whose crossing out
  // comes later in the queue (objectiveDone), so the old text stays until then.
  update(completed = 0): void {
    this.holding += completed
    const { state, content } = this.session
    const ch = chapterOf(content, state.chapter)
    const obj = this.session.objective()
    this.kicker.textContent = `Capitolo ${roman(ch.number)} · Da fare`
    if (!this.holding && (obj?.id ?? null) !== this.shownObjective) {
      this.shownObjective = obj?.id ?? null
      this.task.textContent = obj ? obj.text : 'Nulla, per ora.'
      this.hintText.textContent = ''
    }
    // lit while the current objective still has a hint not read (three per objective, vague to precise)
    const hintsLeft = !!obj && (state.hintLevel[obj.id] ?? 0) < obj.hints.length
    this.bulb.classList.toggle('lit', hintsLeft)
    this.bulb.title = hintsLeft ? 'Un suggerimento (clic)' : 'Nessun altro suggerimento (clic: cosa fare)'
    this.hintBtn.hidden = !hintsLeft
    const items = state.inventory.map((i) => content.items[i]?.name ?? i)
    this.pockets.textContent = items.length ? `In tasca: ${items.join(', ')}` : ''
    this.pockets.hidden = !items.length
    // notes not read yet: the notebook shakes a little every few seconds (CSS), until it is opened
    this.book.classList.toggle('unread', state.journal.length > this.session.journalSeen)
  }

  // A note was written: the pen moves on the notebook for a moment, with the sound of the nib.
  noteWritten(): void {
    this.update()
    this.book.classList.remove('writing')
    void this.book.offsetWidth // restart the animation when notes come one after the other
    this.book.classList.add('writing')
    playPenScratch()
    clearTimeout(this.penTimer)
    this.penTimer = window.setTimeout(() => this.book.classList.remove('writing'), PEN_MS)
  }

  // The current objective is done: the bulb flashes and, if the card is open, the task is crossed out.
  objectiveDone(): void {
    this.card.classList.add('done')
    this.bulb.classList.add('flash')
    setTimeout(() => {
      this.card.classList.remove('done')
      this.bulb.classList.remove('flash')
      this.holding = Math.max(0, this.holding - 1)
      this.update()
    }, 1400)
  }

  destroy(): void {
    clearTimeout(this.penTimer)
    window.removeEventListener('mousedown', this.outside)
    this.root.remove()
  }
}
