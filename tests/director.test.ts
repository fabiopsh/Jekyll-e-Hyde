import { describe, expect, it } from 'vitest'
import type { Content, Npc } from '../src/shared/content-schema'
import { newGameState } from '../src/game/state'
import { npcTurn, replySchema, revealableFacts, hintAllowed, STUCK_MS, type LlmProvider, type TurnContext } from '../src/game/npc/director'

const poole: Npc = {
  id: 'poole', persona: 'Sei Poole, maggiordomo.', voice: 'formale',
  never: [], canonical_lines: [], per_chapter: { '2': { situation: 'Il padrone è fuori.' } },
  fallback: ['Mi perdoni, signore.', 'Non saprei, signore.'],
}

const content: Content = {
  chapters: [{
    number: 2, title: 'due', player: 'utterson', start_scene: 'hall', intro: [], ending: [],
    objectives: [{ id: 'ask_poole', text: 'parla con Poole', done_when: { knows: 'F02.1' }, hints: ['vago', 'medio', 'preciso'] }],
    next_when: { knows: 'F02.1' },
    banned_words: ['pozione'],
  }],
  scenes: {}, dialogues: {}, items: {},
  npcs: { poole },
  facts: {
    'F02.1': { id: 'F02.1', text: 'Hyde ha una chiave del laboratorio', chapter: 2, known_by: ['poole'] },
    'F08.1': { id: 'F08.1', text: 'un fatto del futuro', chapter: 8, known_by: ['poole'] },
    'F02.2': { id: 'F02.2', text: 'un fatto di Lanyon', chapter: 2, known_by: [] },
  },
  bookLines: new Set(),
  bookLineText: {},
  characters: {},
  game: {},
}

const fake = (out: unknown): LlmProvider => ({ name: 'fake', generate: async () => (typeof out === 'string' ? out : JSON.stringify(out)) })
const ctx = (playerText: string, playtimeMs = 0): TurnContext => ({
  npc: poole, content, history: [], playerText,
  state: { ...newGameState(2, 'hall', 'utterson'), playtimeMs, objectiveSince: { ask_poole: 0 } },
})

describe('npc director', () => {
  it('only offers facts the npc knows, already true in the book, not yet known', () => {
    expect(revealableFacts(ctx('ciao'))).toEqual(['F02.1'])
  })

  it('schema enums follow the state', () => {
    const s = replySchema(['F02.1'], false) as { properties: { action: { enum: string[] }; fact: { enum: unknown[] } } }
    expect(s.properties.action.enum).toContain('reveal_fact')
    expect(s.properties.action.enum).not.toContain('give_hint')
    expect(s.properties.fact.enum).toEqual(['F02.1', null])
  })

  it('hints only when asked or stuck', () => {
    expect(hintAllowed(ctx('come sta il dottore?'))).toBe(false)
    expect(hintAllowed(ctx('non so cosa fare'))).toBe(true)
    expect(hintAllowed(ctx('come sta?', STUCK_MS))).toBe(true)
  })

  it('a revealed fact becomes a learn effect', async () => {
    const r = await npcTurn(ctx('Hyde viene qui?'), fake({ say: 'Ha una chiave, signore.', emotion: 'worried', action: 'reveal_fact', fact: 'F02.1' }))
    expect(r.effects).toEqual([{ learn: 'F02.1' }])
    expect(r.source).toBe('llm')
  })

  it('a fact outside the allowed set is ignored', async () => {
    const r = await npcTurn(ctx('dimmi tutto'), fake({ say: 'Ecco.', emotion: 'neutral', action: 'reveal_fact', fact: 'F08.1' }))
    expect(r.effects).toEqual([])
  })

  it('hint text comes from the content, not from the model', async () => {
    const r = await npcTurn(ctx('aiutami'), fake({ say: 'Forse posso aiutarla.', emotion: 'warm', action: 'give_hint', fact: null }))
    expect(r.hint).toBe('vago')
  })

  it('broken JSON or anachronisms fall back to hand-written lines', async () => {
    expect((await npcTurn(ctx('?'), fake('not json'))).source).toBe('fallback')
    const r = await npcTurn(ctx('?'), fake({ say: 'Mandi una email al dottore.', emotion: 'neutral', action: 'none', fact: null }))
    expect(r.source).toBe('fallback')
    expect(poole.fallback).toContain(r.say)
  })

  it('facts stay hidden until their reveal_when is true', () => {
    const gated = { ...content, facts: { ...content.facts, 'F02.1': { ...content.facts['F02.1'], reveal_when: { flag: 'asked' } } } }
    expect(revealableFacts({ ...ctx('x'), content: gated })).toEqual([])
    const s = { ...ctx('x').state, flags: ['asked'] }
    expect(revealableFacts({ ...ctx('x'), content: gated, state: s })).toEqual(['F02.1'])
  })

  it('banned words of the chapter fall back', async () => {
    const r = await npcTurn(ctx('?'), fake({ say: 'Il dottore beve una Pozione.', emotion: 'neutral', action: 'none', fact: null }))
    expect(r.source).toBe('fallback')
  })

  it('provider errors fall back', async () => {
    const broken: LlmProvider = { name: 'x', generate: async () => { throw new Error('down') } }
    expect((await npcTurn(ctx('?'), broken)).source).toBe('fallback')
  })
})
