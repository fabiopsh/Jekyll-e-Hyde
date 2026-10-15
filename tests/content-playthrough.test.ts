// Plays the real content/ through the rules, without graphics: every chapter must be finishable
// by following its scripted dialogues. Add one walkthrough per chapter.
import { describe, expect, it } from 'vitest'
import { loadContent } from '../src/shared/content-loader'
import { apply, check, currentObjective, progress } from '../src/game/rules'
import { newGameState, type GameState } from '../src/game/state'
import type { Content, Effect } from '../src/shared/content-schema'

const { content, errors } = loadContent(process.cwd())

// Runs a dialogue picking, at each choice, the one whose text contains `pick` (or the first available).
function talk(s: GameState, c: Content, dialogueId: string, picks: string[] = []): GameState {
  const d = c.dialogues[dialogueId]
  let node: string | null = d.start
  while (node) {
    const n: Content['dialogues'][string]['nodes'][string] = d.nodes[node]
    s = apply(n.effects, s, c).state
    const choices = (n.choices ?? []).filter((ch) => check(ch.when, s))
    if (choices.length) {
      const want = picks.shift()
      const ch = choices.find((x) => want && x.text.includes(want)) ?? choices[0]
      s = apply(ch.effects, s, c).state
      node = ch.next
    } else node = n.next ?? null
  }
  return s
}

function hotspot(s: GameState, c: Content, scene: string, id: string, verb: 'look' | 'use' | 'take' | 'talk'): Effect[] {
  const hit = c.scenes[scene].hotspots.find((h) => h.id === id)?.verbs[verb]?.find((i) => check(i.when, s))
  return hit?.effects ?? []
}

describe('content', () => {
  it('validates', () => expect(errors).toEqual([]))

  it('chapter 1 can be finished in the book order', () => {
    const ch = content.chapters[0]
    let s = progress(newGameState(1, ch.start_scene, ch.player, ch.start_at ?? null), content).state
    expect(currentObjective(s, content)?.id).toBe('c1_hear_story')

    // looking at the door starts Enfield's story
    const look = hotspot(s, content, 'loc_by_street', 'door', 'look')
    expect(look).toEqual([{ dialogue: 'd01_door_story' }])
    s = talk(s, content, 'd01_door_story')
    expect(currentObjective(s, content)?.id).toBe('c1_learn_name')

    // the name cannot be asked before the question about the signer
    s = talk(s, content, 'd01_enfield', ['nome'])
    expect(s.facts).not.toContain('F01.15')
    expect(s.flags).toContain('c1_asked_signer')
    s = talk(s, content, 'd01_enfield', ['nome'])
    expect(s.facts).toContain('F01.15')
    s = talk(s, content, 'd01_enfield', ['chiave'])

    expect(s.flags).toContain('c1_bargain')
    expect(s.objectivesDone).toEqual(['c1_hear_story', 'c1_learn_name', 'c1_bargain'])
    expect(s.ended).toBe(true) // no chapter 2 yet
  })
})
