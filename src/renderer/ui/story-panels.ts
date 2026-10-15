// Narration cards and scripted dialogues (the book's lines). Both are modal and await the player.
// Uses classic procedural character speech blips for dialog progression.
import type { Content, Dialogue } from '../../shared/content-schema'
import { check } from '../../game/rules'
import type { Session } from '../session'
import { h, modal, typeText, ui, waitAdvance } from './dom'
import { playMusic } from '../audio'

export function speakerName(content: Content, id: string): string {
  return content.characters[id]?.name ?? id
}

export function narrate(texts: string[]): Promise<void> {
  return modal(async () => {
    const box = h('div', { class: 'narration' })
    ui().append(box)
    for (const t of texts) {
      const p = h('p', { class: 'narration-text' })
      const advance = h('div', { class: 'advance' }, 'clic o Spazio per continuare')
      box.replaceChildren(p, advance)
      await typeText(p, t, box, advance, 'typewriter')
    }
    box.remove()
  })
}

function portraitFor(content: Content, speaker: string): HTMLElement | null {
  const key = content.characters[speaker]?.portrait
  if (!key) return null
  const img = h('img', { class: 'portrait', src: `/${key}.png`, alt: '' })
  img.onerror = () => img.remove() // portrait not generated yet
  return img
}

// Plays a scripted dialogue node by node. Choices run their effects through the session.
export function playDialogue(session: Session, dialogue: Dialogue): Promise<void> {
  return modal(async () => {
    if (dialogue.music) playMusic(dialogue.music)
    session.log('dialogue', { id: dialogue.id })
    const box = h('div', { class: 'dialogue panel' })
    ui().append(box)
    try {
      let nodeId: string | null = dialogue.start
      while (nodeId) {
        const node: Dialogue['nodes'][string] = dialogue.nodes[nodeId]
        for (const line of node.lines) {
          const name = speakerName(session.content, line.speaker)
          const p = h('p', { class: line.speaker === 'narrator' ? 'line narrator' : 'line' })
          const advance = h('div', { class: 'advance' }, '▸')
          box.replaceChildren(
            ...[portraitFor(session.content, line.speaker)].filter((x): x is HTMLElement => !!x),
            h('div', { class: 'dialogue-body' },
              name ? h('div', { class: 'speaker' }, name) : null,
              p,
              advance,
            ),
          )
          await typeText(p, line.it, box, advance, session.content.characters[line.speaker]?.blip)
        }
        session.run(node.effects)
        const choices = (node.choices ?? []).filter((c) => check(c.when, session.state))
        if (choices.length) {
          const picked = await new Promise<(typeof choices)[number]>((resolve) => {
            box.replaceChildren(
              h('div', { class: 'choices' },
                ...choices.map((c, i) => h('button', { class: 'choice', onclick: () => resolve(c) }, `${i + 1}. ${c.text}`)),
              ),
            )
            const key = (e: KeyboardEvent) => {
              const i = Number(e.key) - 1
              if (choices[i]) { window.removeEventListener('keydown', key); resolve(choices[i]) }
            }
            window.addEventListener('keydown', key)
          })
          session.log('choice', { dialogue: dialogue.id, node: nodeId, text: picked.text })
          session.run(picked.effects)
          nodeId = picked.next
        } else {
          nodeId = node.next ?? null
        }
      }
    } finally {
      box.remove()
      if (dialogue.music) {
        const sceneMusic = session.content.scenes[session.state.scene]?.music
        if (sceneMusic) playMusic(sceneMusic)
      }
    }
  })
}
