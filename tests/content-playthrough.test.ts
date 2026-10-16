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
    expect(s.chapter).toBe(2)
    expect(s.scene).toBe('loc_utterson_study')
  })

  it('chapter 2 can be finished in the book order', () => {
    const ch = content.chapters.find((x) => x.number === 2)!
    let s = progress(newGameState(2, ch.start_scene, ch.player, ch.start_at ?? null), content).state
    // runs effects as the presenter does: a `dialogue` effect plays the whole dialogue (first choice each time)
    const act = (effects: Effect[], picks: string[] = []) => {
      for (const e of effects) s = 'dialogue' in e ? talk(s, content, e.dialogue, picks) : apply([e], s, content).state
    }
    const npcHere = (id: string) => content.scenes[s.scene].npcs.find((n) => n.npc === id && check(n.when, s))
    expect(currentObjective(s, content)?.id).toBe('c2_read_will')

    // the door is shut until the will is read
    act(hotspot(s, content, 'loc_utterson_study', 'study_door', 'use'))
    expect(s.scene).toBe('loc_utterson_study')
    act(hotspot(s, content, 'loc_utterson_study', 'safe', 'use'))
    expect(s.facts).toEqual(expect.arrayContaining(['F02.1', 'F02.2', 'F02.3', 'F02.4']))
    act(hotspot(s, content, 'loc_utterson_study', 'study_door', 'use'))
    expect(s.scene).toBe('loc_lanyon_dining_room')

    // Lanyon: Hyde only after the talk about Jekyll
    act(content.scenes[s.scene].on_enter.filter((i) => check(i.when, s)).flatMap((i) => i.effects))
    s = talk(s, content, 'd02_lanyon', ['Hyde', 'Per ora'])
    expect(s.facts).not.toContain('F02.7')
    s = talk(s, content, 'd02_lanyon', ['Hyde'])
    expect(s.facts).toContain('F02.7')
    act(hotspot(s, content, 'loc_lanyon_dining_room', 'lanyon_door', 'use'))
    expect(s.scene).toBe('loc_by_street')
    expect(npcHere('enfield')).toBeUndefined()

    // the watch: every hour is tried before the frosty night
    for (const hour of ['mattina', 'mezzogiorno', 'nebbia']) act(hotspot(s, content, 'loc_by_street', 'court', 'use'), [hour, 'Non ora'])
    expect(s.scene).toBe('loc_by_street')
    act(hotspot(s, content, 'loc_by_street', 'court', 'use'), ['Tornare'])
    expect(s.scene).toBe('loc_by_street_night')

    // Hyde comes only when Utterson hides in the court, and leaves after the dialogue
    expect(npcHere('hyde')).toBeUndefined()
    act(hotspot(s, content, 'loc_by_street_night', 'court', 'use'))
    expect(npcHere('hyde')?.talk).toBe('d02_hyde')
    s = talk(s, content, 'd02_hyde')
    expect(s.facts).toContain('F02.14')
    expect(npcHere('hyde')).toBeUndefined()
    expect(check(content.scenes[s.scene].exits[0].when, s)).toBe(true)

    // the square, the knock, the hall: Poole comes back after the wait by the fire
    s = apply([{ goto: 'loc_jekyll_square', at: 'corner' }], s, content).state
    act(hotspot(s, content, 'loc_jekyll_square', 'jekyll_door', 'use'))
    expect(s.scene).toBe('loc_jekyll_hall')
    expect(npcHere('poole')).toBeUndefined()
    act(hotspot(s, content, 'loc_jekyll_hall', 'hearth', 'look'))
    expect(npcHere('poole')?.talk).toBe('d02_poole')
    for (let i = 0; i < 4; i++) s = talk(s, content, 'd02_poole')

    expect(s.objectivesDone).toEqual(['c2_read_will', 'c2_ask_lanyon', 'c2_see_hyde', 'c2_find_jekyll'])
    expect(s.ended).toBe(true) // no chapter 3 yet
  })
})
