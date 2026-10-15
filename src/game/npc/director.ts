// NpcDirector: turns one free player message into one NPC reply the game can trust.
// The LLM only fills a JSON object whose allowed values are computed here from the game state
// (docs/ARCHITETTURA.md §5). Pure logic: the provider is injected, so tests use a fake one.
import { z } from 'zod'
import type { Content, Effect, Npc } from '../../shared/content-schema'
import { chapterOf, check, currentObjective } from '../rules'
import type { GameState } from '../state'

export interface LlmRequest {
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  schema: Record<string, unknown> // JSON schema the output must follow
  maxTokens: number
  signal?: AbortSignal
}

export interface LlmProvider {
  readonly name: string
  generate(req: LlmRequest): Promise<string> // raw JSON text
}

export interface ChatTurn {
  role: 'player' | 'npc'
  text: string
}

export interface NpcReply {
  say: string
  emotion: string
  effects: Effect[] // to run through rules.apply
  hint: string | null // hand-written hint text to show, when the NPC gave one
  end: boolean
  source: 'llm' | 'fallback'
}

export const EMOTIONS = ['neutral', 'worried', 'grave', 'warm', 'irritated', 'afraid', 'evasive'] as const
const MAX_SAY = 400
export const MAX_TURNS = 12
export const STUCK_MS = 4 * 60_000 // minutes on the same objective before NPCs may volunteer a hint
export const STUCK_ATTEMPTS = 3

// Words that cannot exist in 1886 London: a reply containing one is replaced by a fallback line.
// Prefixes match any word starting with them; short acronyms must be whole words ("AI" is not "aiutarla").
const ANACHRONISMS = /\b(smartphone|telefon|cellular|internet|computer|e-?mail|social|televis|radio|aere[io]|automobil|elettronic|intelligenza artificiale|chatbot|modello linguistico|videogioc)|\b(IA|AI|LLM|app|web|online)\b/i

const HINT_REQUEST = /\b(aiut|suggeriment|indizi|cosa (devo|dovrei|posso) fare|dove (devo|dovrei) andare|non so (cosa|dove|come)|sono bloccat)/i

export interface TurnContext {
  npc: Npc
  state: GameState
  content: Content
  history: ChatTurn[]
  playerText: string
}

// Facts this NPC may reveal right now: they know it, it is already true in the book, the player lacks it.
export function revealableFacts({ npc, state, content }: Pick<TurnContext, 'npc' | 'state' | 'content'>): string[] {
  return Object.values(content.facts)
    .filter((f) => f.known_by.includes(npc.id) && f.chapter <= state.chapter && !state.facts.includes(f.id))
    .filter((f) => check(f.reveal_when, state))
    .map((f) => f.id)
}

export function hintAllowed({ state, content, playerText }: Pick<TurnContext, 'state' | 'content' | 'playerText'>): boolean {
  const obj = currentObjective(state, content)
  if (!obj || (state.hintLevel[obj.id] ?? 0) >= obj.hints.length) return false
  if (HINT_REQUEST.test(playerText)) return true
  const since = state.objectiveSince[obj.id] ?? state.playtimeMs
  return state.playtimeMs - since >= STUCK_MS || (state.failedAttempts[obj.id] ?? 0) >= STUCK_ATTEMPTS
}

export function replySchema(facts: string[], canHint: boolean): Record<string, unknown> {
  const actions = ['none', 'deflect', 'end_conversation', ...(facts.length ? ['reveal_fact'] : []), ...(canHint ? ['give_hint'] : [])]
  return {
    type: 'object',
    properties: {
      say: { type: 'string', maxLength: MAX_SAY },
      emotion: { enum: [...EMOTIONS] },
      action: { enum: actions },
      fact: { enum: [...facts, null] },
    },
    required: ['say', 'emotion', 'action', 'fact'],
    additionalProperties: false,
  }
}

export function systemPrompt(ctx: TurnContext, facts: string[], canHint: boolean): string {
  const { npc, state, content } = ctx
  const chapter = npc.per_chapter[String(state.chapter)]
  const lines = npc.canonical_lines.map((id) => bookLineText(content, id)).filter(Boolean)
  const player = content.characters[state.player]?.name ?? state.player
  const known = state.facts.map((id) => `- ${content.facts[id]?.text}`).join('\n') || '- (niente di rilevante)'
  const revealable = facts.map((id) => `- ${id}: ${content.facts[id].text}`).join('\n')
  const obj = currentObjective(state, content)

  return [
    npc.persona,
    `Modo di parlare: ${npc.voice}`,
    `Siamo a Londra, nell'Ottocento. Parli con ${player}.`,
    chapter ? `In questo momento: ${chapter.situation}${chapter.mood ? ` Umore: ${chapter.mood}` : ''}` : '',
    lines.length ? `Esempi di come parli (dal libro):\n${lines.map((l) => `"${l}"`).join('\n')}` : '',
    `Cosa sa già ${player}:\n${known}`,
    facts.length
      ? `Cose che puoi rivelare se ${player} chiede in modo pertinente (action "reveal_fact", fact = l'ID; dillo con parole tue):\n${revealable}`
      : 'Non hai nulla di nuovo da rivelare: non inventare fatti.',
    canHint && obj
      ? `${player} sembra non sapere come procedere. Se lo chiede o se è utile, usa action "give_hint": il gioco mostrerà il suggerimento; tu introducilo in una frase senza dettagli.`
      : '',
    'Regole:',
    '- Rispondi sempre in italiano, in prima persona, restando nel personaggio, in 1-3 frasi.',
    '- Non conosci nulla del futuro né oggetti, idee o parole posteriori al 1886.',
    '- Non sai come andrà a finire questa vicenda: parli solo di ciò che il tuo personaggio sa adesso.',
    '- Non inventare eventi, persone o luoghi. Se non sai, dillo come lo direbbe il personaggio.',
    '- Se ti chiedono cose estranee alla tua vita o al tuo tempo, usa action "deflect" e riporta il discorso alla situazione.',
    '- Non dire mai di essere un personaggio, un gioco o un programma.',
    ...npc.never.map((n) => `- ${n}`),
    'Rispondi solo con il JSON richiesto.',
  ].filter(Boolean).join('\n\n')
}

function bookLineText(content: Content, id: string): string | undefined {
  return content.bookLineText[id]
}

const Raw = z.object({
  say: z.string().min(1),
  emotion: z.enum(EMOTIONS),
  action: z.enum(['none', 'deflect', 'end_conversation', 'reveal_fact', 'give_hint']),
  fact: z.string().nullable(),
})

export function spoils(say: string, { state, content }: Pick<TurnContext, 'state' | 'content'>): boolean {
  const lower = say.toLowerCase()
  return chapterOf(content, state.chapter).banned_words.some((w) => lower.includes(w.toLowerCase()))
}

export function fallback(npc: Npc, turn: number): NpcReply {
  return { say: npc.fallback[turn % npc.fallback.length], emotion: 'neutral', effects: [], hint: null, end: false, source: 'fallback' }
}

// Validates the raw LLM output against what was allowed in this turn and maps it to game effects.
export function interpret(raw: string, ctx: TurnContext, facts: string[], canHint: boolean): NpcReply {
  const turn = ctx.history.filter((t) => t.role === 'npc').length
  let parsed: z.infer<typeof Raw>
  try {
    parsed = Raw.parse(JSON.parse(raw))
  } catch {
    return fallback(ctx.npc, turn)
  }
  const say = parsed.say.trim().slice(0, MAX_SAY)
  if (ANACHRONISMS.test(say) || spoils(say, ctx)) return fallback(ctx.npc, turn)

  const reply: NpcReply = { say, emotion: parsed.emotion, effects: [], hint: null, end: false, source: 'llm' }
  if (parsed.action === 'reveal_fact' && parsed.fact && facts.includes(parsed.fact)) {
    reply.effects.push({ learn: parsed.fact })
  }
  if (parsed.action === 'give_hint' && canHint) {
    const obj = currentObjective(ctx.state, ctx.content)
    if (obj) reply.hint = obj.hints[Math.min(ctx.state.hintLevel[obj.id] ?? 0, obj.hints.length - 1)]
  }
  if (parsed.action === 'end_conversation' || turn + 1 >= MAX_TURNS) reply.end = true
  return reply
}

export async function npcTurn(ctx: TurnContext, provider: LlmProvider, signal?: AbortSignal): Promise<NpcReply> {
  const facts = revealableFacts(ctx)
  const canHint = hintAllowed(ctx)
  const messages = [
    ...ctx.history.slice(-8).map((t) => ({ role: t.role === 'player' ? ('user' as const) : ('assistant' as const), content: t.text })),
    { role: 'user' as const, content: ctx.playerText.slice(0, 500) },
  ]
  try {
    const raw = await provider.generate({
      system: systemPrompt(ctx, facts, canHint),
      messages,
      schema: replySchema(facts, canHint),
      maxTokens: 220,
      signal,
    })
    return interpret(raw, ctx, facts, canHint)
  } catch {
    return fallback(ctx.npc, ctx.history.length)
  }
}
