import { describe, expect, it } from 'vitest'
import type { Content } from '../src/shared/content-schema'
import { apply, check, currentObjective } from '../src/game/rules'
import { newGameState } from '../src/game/state'

const content: Content = {
  chapters: [
    {
      number: 1, title: 'one', player: 'utterson', start_scene: 'a', intro: [],
      objectives: [
        { id: 'o1', text: 'hear the story', done_when: { knows: 'F01.1' }, hints: ['h1', 'h2', 'h3'] },
        { id: 'o2', text: 'go home', done_when: { flag: 'home' }, hints: ['h1', 'h2', 'h3'] },
      ],
      next_when: { flag: 'home' },
      banned_words: [],
    },
    {
      number: 2, title: 'two', player: 'utterson', start_scene: 'b', intro: [],
      objectives: [{ id: 'o3', text: 'x', done_when: { flag: 'never' }, hints: ['h1', 'h2', 'h3'] }],
      next_when: { flag: 'never' },
      banned_words: [],
    },
  ],
  scenes: {},
  dialogues: {},
  npcs: {},
  items: { obj_key: { id: 'obj_key', name: 'chiave', description: 'una chiave' } },
  facts: { 'F01.1': { id: 'F01.1', text: 'Hyde ha la chiave', chapter: 1, known_by: [] } },
  bookLines: new Set(),
  bookLineText: {},
}

describe('conditions', () => {
  const s = { ...newGameState(1, 'a', 'utterson'), flags: ['f'], inventory: ['obj_key'] }
  it('evaluates leaves and combinators', () => {
    expect(check({ flag: 'f' }, s)).toBe(true)
    expect(check({ has: 'obj_key' }, s)).toBe(true)
    expect(check({ knows: 'F01.1' }, s)).toBe(false)
    expect(check({ all: [{ flag: 'f' }, { not: { knows: 'F01.1' } }] }, s)).toBe(true)
    expect(check({ any: [{ flag: 'x' }, { chapter: 2 }] }, s)).toBe(false)
    expect(check(undefined, s)).toBe(true)
  })
})

describe('effects', () => {
  it('learning a fact writes the journal and completes the objective', () => {
    const { state, commands } = apply([{ learn: 'F01.1' }], newGameState(1, 'a', 'utterson'), content)
    expect(state.facts).toEqual(['F01.1'])
    expect(state.journal[0].text).toBe('Hyde ha la chiave')
    expect(state.objectivesDone).toEqual(['o1'])
    expect(commands.map((c) => c.kind)).toEqual(['learned', 'objective'])
    expect(currentObjective(state, content)?.id).toBe('o2')
  })

  it('objectives complete in order only', () => {
    const { state } = apply([{ set: 'home' }], newGameState(1, 'a', 'utterson'), content)
    expect(state.objectivesDone).toEqual([])
    expect(state.chapter).toBe(1)
  })

  it('finishing the last objective starts the next chapter', () => {
    const { state, commands } = apply([{ learn: 'F01.1' }, { set: 'home' }], newGameState(1, 'a', 'utterson'), content)
    expect(state.chapter).toBe(2)
    expect(state.scene).toBe('b')
    expect(commands).toContainEqual({ kind: 'goto', scene: 'b', at: null })
  })

  it('give is idempotent and reported once', () => {
    const first = apply([{ give: 'obj_key' }], newGameState(1, 'a', 'utterson'), content)
    const second = apply([{ give: 'obj_key' }], first.state, content)
    expect(second.state.inventory).toEqual(['obj_key'])
    expect(second.commands).toEqual([])
  })
})
