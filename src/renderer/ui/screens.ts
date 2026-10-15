// Full-screen panels: main menu, play history, journal.
import type { Content } from '../../shared/content-schema'
import type { LogEvent, RunMeta } from '../../shared/ipc'
import { chapterOf } from '../../game/rules'
import type { Session } from '../session'
import { h, modal, ui } from './dom'
import { getVolume, playClickSound, setSfxVolume, setVolume } from '../audio'

const fmtTime = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}
const fmtDate = (iso: string) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })

export type MenuChoice = { kind: 'new' } | { kind: 'resume'; id: string }

export function mainMenu(content: Content): Promise<MenuChoice> {
  return new Promise(async (resolve) => {
    const runs = await window.api.runs.list()
    const last = runs.find((r) => !r.endedAt)
    const screen = h('div', { class: 'screen menu-book' },
      h('div', { class: 'book-cover' },
        h('div', { class: 'book-frame' },
          h('div', { class: 'book-author' }, 'ROBERT LOUIS STEVENSON'),
          h('div', { class: 'book-divider' }, '— • —'),
          h('h1', { class: 'book-title' },
            h('span', { class: 'title-small' }, 'LO STRANO CASO DEL'),
            h('span', { class: 'title-large' }, 'DOTTOR JEKYLL'),
            h('span', { class: 'title-small' }, 'E DEL'),
            h('span', { class: 'title-large' }, 'SIGNOR HYDE'),
          ),
          h('div', { class: 'book-ornament' }, '❦  ⚜  ❦'),
          h('p', { class: 'book-edition' }, 'Londra, 1886 · Traduzione fedele e avventura grafica in pixel art'),
          h('div', { class: 'menu-buttons' },
            last ? h('button', { class: 'menu-btn resume', onclick: () => done({ kind: 'resume', id: last.id }) },
              `Riprendi la lettura (Cap. ${last.chapter} · ${fmtTime(last.playtimeMs)})`) : null,
            h('button', { class: 'menu-btn new', onclick: () => done({ kind: 'new' }) }, 'Comincia la lettura (Nuova partita)'),
            h('button', { class: 'menu-btn history', onclick: () => history(content, runs) }, `Cronache delle indagini (${runs.length} registrate)`),
          ),
          h('div', { class: 'book-quote' },
            '«Tutti gli esseri umani, quali noi li conosciamo, sono un miscuglio di bene e di male…»',
          ),
        ),
      ),
    )
    const done = (c: MenuChoice) => { screen.remove(); resolve(c) }
    ui().append(screen)
  })
}

async function history(content: Content, runs: RunMeta[]): Promise<void> {
  const list = h('div', { class: 'history-list' })
  const detail = h('div', { class: 'history-detail' }, h('p', {}, 'Scegli una partita per rileggerla.'))
  const screen = h('div', { class: 'screen history' },
    h('h2', {}, 'Storico partite'),
    h('div', { class: 'history-body' }, list, detail),
    h('button', { onclick: () => screen.remove() }, 'Indietro'),
  )
  for (const r of runs) {
    const status = r.endedAt ? `conclusa il ${fmtDate(r.endedAt)}` : 'in corso'
    list.append(h('button', { class: 'history-item', onclick: () => showRun(content, r, detail) },
      h('b', {}, fmtDate(r.startedAt)), h('br'), `Cap. ${r.chapter} · ${fmtTime(r.playtimeMs)} · ${r.hintsUsed} suggerimenti · ${status}`))
  }
  if (!runs.length) list.append(h('p', {}, 'Nessuna partita ancora.'))
  ui().append(screen)
}

function describe(content: Content, e: LogEvent): string | null {
  const d = e.data as Record<string, any>
  switch (e.kind) {
    case 'chapter': return `— Capitolo ${d.number}: ${content.chapters.find((c) => c.number === d.number)?.title ?? ''}`
    case 'scene': return `Luogo: ${content.scenes[d.id]?.name ?? d.id}`
    case 'fact': return `Scoperto: ${content.facts[d.id]?.text ?? d.id}`
    case 'item': return `Ottenuto: ${content.items[d.id]?.name ?? d.id}`
    case 'choice': return `Scelta: «${d.text}»`
    case 'hint': return `Suggerimento usato (livello ${d.level})`
    case 'chat': return `Conversazione con ${content.characters[d.npc]?.name ?? d.npc}:\n` +
      (d.turns as { role: string; text: string }[]).map((t) => `  ${t.role === 'player' ? '›' : '‹'} ${t.text}`).join('\n')
    case 'end': return '— Fine'
    default: return null
  }
}

async function showRun(content: Content, run: RunMeta, into: HTMLElement): Promise<void> {
  const events = await window.api.runs.readLog(run.id)
  const lines = events.map((e) => describe(content, e)).filter((x): x is string => !!x)
  into.replaceChildren(h('pre', { class: 'history-log' }, lines.join('\n') || 'Nessun evento registrato.'))
}

export function journal(session: Session): Promise<void> {
  return modal(() => new Promise<void>((resolve) => {
    const { state, content } = session
    const ch = chapterOf(content, state.chapter)
    const obj = session.objective()
    const hintBox = h('p', { class: 'hint' })
    const screen = h('div', { class: 'screen journal' },
      h('h2', {}, `Diario — Capitolo ${ch.number}: ${ch.title}`),
      h('h3', {}, 'Obiettivo'),
      h('p', {}, obj ? obj.text : 'Nessun obiettivo aperto.'),
      obj ? h('button', { onclick: () => { const t = session.nextHint(); if (t) hintBox.textContent = `Pensieri: ${t}` } }, 'Un suggerimento') : null,
      hintBox,
      h('h3', {}, 'Cosa so'),
      h('ul', {}, ...state.journal.slice().reverse().map((j) => h('li', {}, `Cap. ${j.chapter} — ${j.text}`))),
      h('h3', {}, 'Con me'),
      h('ul', {}, ...state.inventory.map((i) => h('li', {}, `${content.items[i]?.name ?? i}: ${content.items[i]?.description ?? ''}`))),
      h('button', { onclick: () => { screen.remove(); window.removeEventListener('keydown', key); resolve() } }, 'Chiudi (J)'),
    )
    const key = (e: KeyboardEvent) => {
      if (e.key === 'j' || e.key === 'J' || e.key === 'Escape') { screen.remove(); window.removeEventListener('keydown', key); resolve() }
    }
    setTimeout(() => window.addEventListener('keydown', key), 0)
    ui().append(screen)
  }))
}

export interface PauseActions {
  onResume: () => void
  onJournal: () => void
  onMainMenu: () => void | Promise<void>
  onQuit: () => void | Promise<void>
}

export function pauseMenu(session: Session, actions: PauseActions): Promise<void> {
  return modal(() => new Promise<void>((resolve) => {
    const { state, content } = session
    const ch = chapterOf(content, state.chapter)
    const currentScene = content.scenes[state.scene]
    const sceneName = currentScene ? currentScene.name : state.scene

    const vol = getVolume()
    let musicPct = Math.round(vol.music * 100)
    let sfxPct = Math.round(vol.sfx * 100)

    const musicLabel = h('span', { class: 'volume-val' }, `${musicPct}%`)
    const sfxLabel = h('span', { class: 'volume-val' }, `${sfxPct}%`)

    const musicSlider = h('input', {
      type: 'range',
      min: '0',
      max: '100',
      step: '5',
      value: String(musicPct),
      class: 'volume-slider',
      oninput: (e: Event) => {
        const val = Number((e.target as HTMLInputElement).value)
        musicPct = val
        musicLabel.textContent = `${val}%`
        setVolume(val / 100)
      },
    })

    const sfxSlider = h('input', {
      type: 'range',
      min: '0',
      max: '100',
      step: '5',
      value: String(sfxPct),
      class: 'volume-slider',
      oninput: (e: Event) => {
        const val = Number((e.target as HTMLInputElement).value)
        sfxPct = val
        sfxLabel.textContent = `${val}%`
        setSfxVolume(val / 100)
        playClickSound()
      },
    })

    let closed = false
    const close = () => {
      if (closed) return
      closed = true
      screen.remove()
      window.removeEventListener('keydown', key)
      resolve()
    }

    const screen = h('div', { class: 'screen pause-overlay' },
      h('div', { class: 'pause-card panel' },
        h('div', { class: 'pause-header' },
          h('div', { class: 'pause-subtitle' }, '— • —'),
          h('h2', { class: 'pause-title' }, 'PAUSA'),
          h('div', { class: 'pause-info' }, `Capitolo ${ch.number}: ${ch.title}`),
          h('div', { class: 'pause-loc' }, `Luogo: ${sceneName}`),
        ),
        h('div', { class: 'pause-audio-section' },
          h('div', { class: 'audio-control' },
            h('label', {}, 'Musica:'),
            musicSlider,
            musicLabel,
          ),
          h('div', { class: 'audio-control' },
            h('label', {}, 'Effetti sonori:'),
            sfxSlider,
            sfxLabel,
          ),
        ),
        h('div', { class: 'pause-buttons' },
          h('button', {
            class: 'pause-btn resume-btn',
            onclick: () => { close(); actions.onResume() },
          }, 'Riprendi l\'esplorazione (Esc)'),
          h('button', {
            class: 'pause-btn journal-btn',
            onclick: () => { close(); actions.onJournal() },
          }, 'Diario delle indagini (J)'),
          h('button', {
            class: 'pause-btn mainmenu-btn',
            onclick: async () => { close(); await actions.onMainMenu() },
          }, 'Menu Principale'),
          h('button', {
            class: 'pause-btn quit-btn',
            onclick: async () => { close(); await actions.onQuit() },
          }, 'Esci dal gioco'),
        ),
      ),
    )

    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
        actions.onResume()
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        e.stopPropagation()
        close()
        actions.onJournal()
      }
    }

    setTimeout(() => window.addEventListener('keydown', key), 0)
    ui().append(screen)
  }))
}

