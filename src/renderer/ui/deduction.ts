// A deduction (docs/DECISIONI.md D31): on a sheet of the notebook, questions on the left with an empty line each,
// the player's notes on the right as slips. Pick a question, then the note that answers it. "Verifica" checks
// every answer: when all hold, the deduction's effects run; otherwise the wrong lines turn red and a sentence
// says that something does not hold. "Più tardi" closes the sheet without effects.
import type { Deduction } from '../../shared/content-schema'
import type { Session } from '../session'
import { h, modal, ui } from './dom'
import { playPenScratch } from '../audio'

export function deduction(session: Session, d: Deduction): Promise<boolean> {
  return modal(() => new Promise<boolean>((resolve) => {
    const known = d.options.filter((f) => session.state.facts.includes(f))
    const answers: (string | null)[] = d.slots.map(() => null)
    let active = 0

    const message = h('p', { class: 'deduction-message' })
    const slotEls = d.slots.map((s, i) => {
      const answer = h('div', { class: 'deduction-answer' })
      const el = h('button', { class: 'deduction-slot', onclick: () => { active = i; draw() } },
        h('div', { class: 'deduction-question' }, `${i + 1}. ${s.question}`), answer)
      return { el, answer }
    })
    const slips = known.map((f) => h('button', { class: 'deduction-slip', onclick: () => pick(f) }, session.content.facts[f]?.text ?? f))
    const check = h('button', { class: 'deduction-check', onclick: () => verify() }, 'Verifica')

    const draw = () => {
      slotEls.forEach(({ el, answer }, i) => {
        el.classList.toggle('active', i === active)
        el.classList.remove('wrong')
        const a = answers[i]
        answer.textContent = a ? session.content.facts[a]?.text ?? a : 'Scegli un appunto a destra.'
        answer.classList.toggle('empty', !a)
      })
      slips.forEach((s, k) => s.classList.toggle('used', answers.includes(known[k])))
      check.toggleAttribute('disabled', answers.some((a) => !a))
    }
    const pick = (f: string) => {
      const before = answers.indexOf(f)
      if (before >= 0) answers[before] = null // a note answers one question only
      answers[active] = f
      playPenScratch()
      const next = answers.findIndex((a) => !a)
      if (next >= 0) active = next
      message.textContent = ''
      draw()
    }
    const close = (ok: boolean) => {
      window.removeEventListener('keydown', key)
      screen.remove()
      resolve(ok)
    }
    const verify = () => {
      const wrong = d.slots.map((s, i) => !answers[i] || !s.accept.includes(answers[i]!))
      session.log('deduction', { id: d.id, answers, ok: !wrong.some(Boolean) })
      if (!wrong.some(Boolean)) {
        close(true)
        session.run(d.done)
        return
      }
      session.failedAttempt()
      wrong.forEach((w, i) => slotEls[i].el.classList.toggle('wrong', w))
      message.textContent = d.wrong
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(false) } }

    const screen = h('div', { class: 'screen deduction-screen' },
      h('div', { class: 'deduction-sheet' },
        h('div', { class: 'deduction-kicker' }, 'Mettere in ordine i pensieri'),
        h('h2', { class: 'deduction-title' }, d.title),
        h('p', { class: 'deduction-intro' }, d.intro),
        h('div', { class: 'deduction-body' },
          h('div', { class: 'deduction-slots' }, ...slotEls.map((s) => s.el)),
          h('div', { class: 'deduction-notes' }, h('div', { class: 'deduction-notes-head' }, 'Dal taccuino'), ...slips)),
        message,
        h('div', { class: 'deduction-bar' }, check, h('button', { onclick: () => close(false) }, 'Più tardi (Esc)'))))
    draw()
    setTimeout(() => window.addEventListener('keydown', key), 0)
    ui().append(screen)
  }))
}
