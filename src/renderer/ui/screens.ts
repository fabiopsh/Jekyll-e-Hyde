// Full-screen panels: main menu, play history, journal.
import type { Chapter, Content } from '../../shared/content-schema'
import type { LogEvent, RunMeta } from '../../shared/ipc'
import { chapterOf } from '../../game/rules'
import type { Session } from '../session'
import { h, modal, ui } from './dom'
import { getVolume, playClickSound, playPenScratch, setSfxVolume, setVolume } from '../audio'
import { assetUrl } from '../assets'
import { SIZE_LABEL, SPEED_LABEL, settings, toggleFullscreen, updateSettings, type TextSize, type TextSpeed } from '../settings'

const fmtTime = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}
const fmtDate = (iso: string) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })

export type MenuChoice = { kind: 'new' } | { kind: 'resume'; id: string }

// Main menu: the animated title scene behind a book cover. "Comincia la lettura" opens the cover.
export function mainMenu(content: Content): Promise<MenuChoice> {
  return new Promise(async (resolve) => {
    const runs = await window.api.runs.list()
    const last = runs.find((r) => !r.endedAt)
    const cover = h('div', { class: 'book-cover' },
      h('div', { class: 'book-frame' },
        h('div', { class: 'book-author' }, 'ROBERT LOUIS STEVENSON'),
        h('div', { class: 'book-divider' }, '— • —'),
        h('h1', { class: 'book-title' },
          h('span', { class: 'title-small ink', style: '--d: 0.2s' }, 'LO STRANO CASO DEL'),
          h('span', { class: 'title-large ink', style: '--d: 0.6s' }, 'DOTTOR JEKYLL'),
          h('span', { class: 'title-small ink', style: '--d: 1.1s' }, 'E DEL'),
          h('span', { class: 'title-large ink', style: '--d: 1.5s' }, 'SIGNOR HYDE'),
        ),
        h('div', { class: 'book-ornament' }, '❦  ⚜  ❦'),
        h('p', { class: 'book-edition' }, 'Londra, 1886 · Avventura grafica dal romanzo'),
        h('div', { class: 'menu-buttons' },
          h('button', { class: 'menu-btn new', onclick: () => open({ kind: 'new' }) }, 'Comincia la lettura (Nuova partita)'),
          h('button', { class: 'menu-btn history', onclick: () => history(content, runs) }, `Cronache delle indagini (${runs.length} registrate)`),
          h('button', { class: 'menu-btn settings', onclick: () => settingsScreen() }, 'Impostazioni'),
        ),
        content.game.menu_quote ? h('div', { class: 'book-quote' }, content.game.menu_quote) : null,
      ),
      // the bookmark ribbon: resumes the last unfinished game
      last ? h('button', { class: 'bookmark', onclick: () => open({ kind: 'resume', id: last.id }) },
        h('span', { class: 'bookmark-label' }, 'Riprendi'),
        h('span', { class: 'bookmark-meta' }, `Cap. ${roman(last.chapter)} · ${fmtTime(last.playtimeMs)}`)) : null,
    )
    const screen = h('div', { class: 'screen menu-book' }, titleScene(content), h('div', { class: 'book-holder' }, cover))
    let leaving = false
    const open = (c: MenuChoice) => {
      if (leaving) return
      leaving = true
      cover.classList.add('opening') // the cover swings open (CSS), then the menu fades out
      setTimeout(() => screen.classList.add('closing'), 900)
      setTimeout(() => { screen.remove(); resolve(c) }, 1500)
    }
    ui().append(screen)
  })
}

// Night street behind the menu: fog layers, a flickering lamp, and now and then a small black figure at the
// door while the lamp dims. Positions come from content/game.yaml (menu_scene), in game pixels (480x270).
function titleScene(content: Content): HTMLElement {
  const cfg = content.game.menu_scene
  const stage = h('div', { class: 'title-stage' })
  const scene = h('div', { class: 'title-scene' }, stage)
  if (!cfg) return scene
  const at = (p: [number, number]) => ({ left: `${(p[0] / 480) * 100}%`, top: `${(p[1] / 270) * 100}%` })

  const bg = h('img', { class: 'title-bg', src: assetUrl(`${cfg.background}.png`), alt: '' })
  if (cfg.darken) stage.classList.add('fake-night') // a day picture under a night filter
  bg.onerror = () => {
    if (!cfg.fallback || bg.dataset.fallback) return
    bg.dataset.fallback = '1'
    stage.classList.add('fake-night') // the day picture, darkened, until the night one exists
    bg.src = assetUrl(`${cfg.fallback}.png`)
  }
  stage.append(bg, h('div', { class: 'title-fog fog-1' }), h('div', { class: 'title-fog fog-2' }), h('div', { class: 'title-fog fog-3' }))

  let lamp: HTMLElement | null = null
  if (cfg.lamp) {
    lamp = h('div', { class: 'title-lamp' })
    Object.assign(lamp.style, at(cfg.lamp))
    stage.append(lamp)
  }
  if (cfg.door && cfg.figure) {
    const fig = h('canvas', { class: 'title-figure' })
    Object.assign(fig.style, { left: `${(cfg.door[0] / 480) * 100}%`, bottom: `${100 - (cfg.door[1] / 270) * 100}%` })
    stage.append(fig)
    void drawSilhouette(fig, cfg.figure)
  }

  // lamp flicker and the apparition run until the menu is removed from the page
  let started = false
  const flicker = () => {
    if (started && !scene.isConnected) return
    started = true
    if (lamp) lamp.style.opacity = String(0.78 + Math.random() * 0.22)
    setTimeout(flicker, 70 + Math.random() * 180)
  }
  const apparition = () => {
    if (!scene.isConnected) return
    stage.classList.add('apparition')
    setTimeout(() => stage.classList.remove('apparition'), 2600)
    setTimeout(apparition, 18_000 + Math.random() * 12_000)
  }
  flicker()
  setTimeout(apparition, 6000)
  return scene
}

// Black, slightly smaller silhouette of the first idle frame of a character sprite: a figure without a face.
async function drawSilhouette(canvas: HTMLCanvasElement, sprite: string): Promise<void> {
  try {
    const atlas = await (await fetch(assetUrl(`${sprite}.json`))).json()
    const f = (atlas.frames.idle_0 ?? Object.values(atlas.frames)[0]).frame as { x: number; y: number; w: number; h: number }
    const img = new Image()
    img.src = assetUrl(`${sprite}.png`)
    await img.decode()
    canvas.width = f.w
    canvas.height = f.h
    const g = canvas.getContext('2d')!
    g.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h)
    g.globalCompositeOperation = 'source-in'
    g.fillStyle = '#050307'
    g.fillRect(0, 0, f.w, f.h)
    canvas.style.height = `${((f.h * 0.82) / 270) * 100}%` // "a little man" (ch. 1)
  } catch {
    canvas.remove()
  }
}

// Chapter title page: "Capitolo I", the title, an ornament. Click or Space closes it with an ink fade.
export function chapterCard(ch: Chapter): Promise<void> {
  return modal(() => new Promise<void>((resolve) => {
    let closed = false
    const close = () => {
      if (closed) return
      closed = true
      window.removeEventListener('keydown', key)
      card.classList.add('closing')
      setTimeout(() => { card.remove(); resolve() }, 700)
    }
    const key = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); close() } }
    const card = h('div', { class: 'screen chapter-card', onclick: close },
      h('div', { class: 'chapter-card-page' },
        h('div', { class: 'chapter-card-kicker ink', style: '--d: 0.2s' }, `Capitolo ${roman(ch.number)}`),
        h('h2', { class: 'chapter-card-title ink', style: '--d: 0.7s' }, ch.title),
        h('div', { class: 'ornament ink', style: '--d: 1.2s' }, '❦'),
        h('div', { class: 'advance' }, 'clic o Spazio per continuare'),
      ),
    )
    setTimeout(() => window.addEventListener('keydown', key), 400)
    ui().append(card)
  }))
}

async function history(content: Content, runs: RunMeta[]): Promise<void> {
  const list = h('div', { class: 'history-list' })
  const detail = h('div', { class: 'history-detail' }, h('p', {}, 'Scegli una partita per rileggerla.'))
  const screen = h('div', { class: 'screen history' },
    h('h2', {}, 'Cronache delle indagini'),
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

// The lawyer's notebook (tasto J): left page = chapter, what to do, a hint, pockets; right page = notes in
// order, 6 per page, turned with the arrows. Notes written since the last opening appear one after the other,
// as if written now, with a pen sound.
const NOTES_PER_PAGE = 6

export function journal(session: Session): Promise<void> {
  return modal(() => new Promise<void>((resolve) => {
    const { state, content } = session
    const ch = chapterOf(content, state.chapter)
    const obj = session.objective()
    const owner = content.characters[state.player]?.name ?? state.player
    const notes = state.journal
    const firstNew = Math.min(session.journalSeen, notes.length)
    session.journalSeen = notes.length
    const pages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE))
    let page = pages - 1 // open where the newest notes are

    const hintBox = h('p', { class: 'notebook-hint' })
    const left = h('div', { class: 'notebook-page left' },
      h('div', { class: 'notebook-owner' }, `Taccuino di ${owner}`),
      h('div', { class: 'notebook-chapter' }, `Capitolo ${roman(ch.number)} · ${ch.title}`),
      h('h3', {}, 'Da fare'),
      h('p', { class: 'notebook-task' }, obj ? obj.text : 'Nulla, per ora.'),
      obj ? h('button', { class: 'notebook-btn', onclick: () => { const t = session.nextHint(); if (t) hintBox.textContent = t } }, 'Rifletti (un suggerimento)') : null,
      hintBox,
      h('h3', {}, 'In tasca'),
      state.inventory.length
        ? h('ul', { class: 'notebook-items' }, ...state.inventory.map((i) => h('li', {}, `${content.items[i]?.name ?? i}: ${content.items[i]?.description ?? ''}`)))
        : h('p', { class: 'notebook-task' }, 'Niente di particolare.'),
    )
    const right = h('div', { class: 'notebook-page right' })
    const prev = h('button', { class: 'notebook-nav', onclick: () => turn(-1) }, '◂')
    const next = h('button', { class: 'notebook-nav', onclick: () => turn(1) }, '▸')
    const counter = h('span', { class: 'notebook-counter' })

    const draw = () => {
      const start = page * NOTES_PER_PAGE
      const items = notes.slice(start, start + NOTES_PER_PAGE).map((n, k) => {
        const index = start + k
        const li = h('li', { class: index >= firstNew ? 'note new' : 'note' }, h('span', { class: 'note-chapter' }, `${roman(n.chapter)}.`), ' ', n.text)
        if (index >= firstNew) {
          const delay = (index - Math.max(firstNew, start)) * 0.9
          li.style.setProperty('--w', `${delay}s`)
          setTimeout(() => { if (li.isConnected) playPenScratch() }, delay * 1000 + 100)
        }
        return li
      })
      right.replaceChildren(
        h('h3', {}, 'Appunti'),
        notes.length ? h('ol', { class: 'notebook-notes' }, ...items) : h('p', { class: 'notebook-task' }, 'Ancora nessun appunto.'),
      )
      counter.textContent = `pagina ${page + 1} di ${pages}`
      prev.toggleAttribute('disabled', page === 0)
      next.toggleAttribute('disabled', page === pages - 1)
    }
    const turn = (d: number) => {
      const to = page + d
      if (to < 0 || to >= pages) return
      right.classList.remove('turn-next', 'turn-prev')
      void right.offsetWidth // restart the page-turn animation
      right.classList.add(d > 0 ? 'turn-next' : 'turn-prev')
      page = to
      setTimeout(draw, 180)
    }

    const close = () => {
      window.removeEventListener('keydown', key)
      screen.classList.add('closing')
      setTimeout(() => { screen.remove(); resolve() }, 300)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'j' || e.key === 'J' || e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') turn(1)
      else if (e.key === 'ArrowLeft') turn(-1)
    }
    const screen = h('div', { class: 'screen notebook-screen' },
      h('div', { class: 'notebook' }, left, right),
      h('div', { class: 'notebook-bar' }, prev, counter, next, h('button', { onclick: close }, 'Chiudi (J)')),
    )
    draw()
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
          h('div', { class: 'pause-info' }, `Capitolo ${roman(ch.number)} · ${ch.title}`),
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
        settingsBlock(),
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


const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
export const roman = (n: number) => ROMAN[n] ?? String(n)

// Shown when a chapter ends: what Utterson (or the chapter's narrator) learned, time and hints. Modal.
export function chapterEndPage(session: Session, ch: Chapter): Promise<void> {
  return modal(() => new Promise<void>((resolve) => {
    const learned = session.state.journal.filter((j) => j.chapter === ch.number)
    const hints = ch.objectives.reduce((a, o) => a + (session.state.hintLevel[o.id] ?? 0), 0)
    const close = () => { window.removeEventListener('keydown', key); screen.classList.add('closing'); setTimeout(() => { screen.remove(); resolve() }, 500) }
    const key = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); close() } }
    const screen = h('div', { class: 'screen chapter-end' },
      h('div', { class: 'chapter-end-page' },
        h('div', { class: 'chapter-end-kicker' }, `Fine del capitolo ${roman(ch.number)}`),
        h('h2', {}, ch.title),
        h('div', { class: 'ornament' }, '❦'),
        h('h3', {}, 'Annotato nel taccuino'),
        h('ul', { class: 'chapter-end-facts' }, ...learned.map((j) => h('li', {}, j.text))),
        h('p', { class: 'chapter-end-meta' },
          `Tempo di gioco: ${fmtTime(session.state.playtimeMs)} · Suggerimenti usati: ${hints}`),
        h('button', { class: 'menu-btn', onclick: close }, 'Continua (Spazio)'),
      ),
    )
    setTimeout(() => window.addEventListener('keydown', key), 300)
    ui().append(screen)
  }))
}

// Reading settings: text speed, text size, full screen. Used in the pause menu and in the main menu.
export function settingsBlock(): HTMLElement {
  const row = <T extends string>(labels: Record<T, string>, get: () => T, set: (v: T) => void) => {
    const box = h('div', { class: 'settings-options' })
    const draw = () => box.replaceChildren(...(Object.keys(labels) as T[]).map((v) =>
      h('button', { class: v === get() ? 'selected' : '', onclick: () => { set(v); draw() } }, labels[v])))
    draw()
    return box
  }
  return h('div', { class: 'settings-block' },
    h('label', {}, 'Velocità del testo'),
    row<TextSpeed>(SPEED_LABEL, () => settings().textSpeed, (v) => updateSettings({ textSpeed: v })),
    h('label', {}, 'Dimensione del testo'),
    row<TextSize>(SIZE_LABEL, () => settings().textSize, (v) => updateSettings({ textSize: v })),
    h('label', {}, 'Schermo'),
    h('div', { class: 'settings-options' }, h('button', { onclick: () => void toggleFullscreen() }, 'Schermo intero / finestra')),
  )
}

function settingsScreen(): void {
  const screen = h('div', { class: 'screen settings-screen' },
    h('div', { class: 'pause-card panel' },
      h('h2', { class: 'pause-title' }, 'Impostazioni'),
      settingsBlock(),
      h('button', { onclick: () => screen.remove() }, 'Indietro'),
    ),
  )
  ui().append(screen)
}
