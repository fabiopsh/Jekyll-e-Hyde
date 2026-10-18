// Full-screen panels: main menu, play history, journal.
import type { Chapter, Content } from '../../shared/content-schema'
import type { LogEvent, ModelDownload, RunMeta } from '../../shared/ipc'
import { chatAvailable, refreshLlm } from '../llm-state'
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

export type MenuChoice = { kind: 'new'; chapter?: number } | { kind: 'resume'; id: string }

// Main menu: the animated title scene behind a book cover. "Comincia la lettura" opens the cover.
export function mainMenu(content: Content): Promise<MenuChoice> {
  return new Promise(async (resolve) => {
    const runs = await window.api.runs.list()
    const last = runs.find((r) => !r.endedAt)
    // free chat: the button says whether the model is here; the screen offers the download (D34)
    const chatButton = h('button', { class: 'menu-btn chatmodel', onclick: () => modelScreen(() => void label()) })
    const label = async () => {
      await refreshLlm()
      chatButton.replaceChildren(h('span', { class: 'chatmodel-title' }, 'Chat libera (IA)'),
        h('span', { class: 'chatmodel-state' }, chatAvailable() ? 'pronta' : 'da scaricare'))
      chatButton.classList.toggle('missing', !chatAvailable())
    }
    void label()
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
          h('button', { class: 'menu-btn history', onclick: () => history(content, runs, (id) => open({ kind: 'resume', id })) }, `Cronache delle indagini (${runs.length})`),
          h('div', { class: 'menu-row' },
            h('button', { class: 'menu-btn chapters', onclick: () => chapterSelect(content, (n) => open({ kind: 'new', chapter: n })) }, 'Scegli un capitolo'),
            chatButton),
          h('div', { class: 'menu-row' },
            h('button', { class: 'menu-btn settings', onclick: () => settingsScreen() }, 'Impostazioni'),
            h('button', { class: 'menu-btn quit', onclick: () => void (window.api?.app?.quit ? window.api.app.quit() : window.close()) }, 'Esci dal gioco')),
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

// "Cronache delle indagini" (D33): every game is an investigation. Left: one file per game (when it began, how
// far it went, how long, hints used; "Riprendi" if still open). Right: the report of the chosen one, chapter by
// chapter: what was discovered, the choices made, the deductions, the free conversations word by word.
async function history(content: Content, runs: RunMeta[], resume: (id: string) => void): Promise<void> {
  const detail = h('div', { class: 'history-detail paper' },
    h('p', { class: 'history-empty' }, 'Scegli un\'indagine a sinistra per rileggerne il resoconto.'))
  const list = h('div', { class: 'history-list' })
  const screen = h('div', { class: 'screen history' },
    h('div', { class: 'history-head' },
      h('h2', {}, 'Cronache delle indagini'),
      h('p', { class: 'history-intro' }, 'Ogni partita è un\'indagine. Qui rileggi che cosa hai scoperto, le scelte fatte e le conversazioni.')),
    h('div', { class: 'history-body' }, list, detail),
    h('button', { class: 'history-back', onclick: () => screen.remove() }, 'Indietro'),
  )
  const sorted = [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  sorted.forEach((r, k) => {
    const ch = content.chapters.find((c) => c.number === r.chapter)
    const open = !r.endedAt
    const card = h('div', { class: 'history-card leather' },
      h('div', { class: 'history-card-top' },
        h('span', { class: 'history-card-num' }, `Indagine n. ${sorted.length - k}`),
        h('span', { class: `history-status ${open ? 'open' : 'closed'}` }, open ? 'In corso' : 'Conclusa')),
      h('div', { class: 'history-card-chapter' }, `Capitolo ${roman(r.chapter)}${ch ? ` · ${ch.title}` : ''}`),
      h('div', { class: 'history-card-meta' }, `Iniziata il ${fmtDate(r.startedAt)}`),
      h('div', { class: 'history-card-meta' }, `Tempo di gioco ${fmtTime(r.playtimeMs)} · suggerimenti ${r.hintsUsed}`),
      h('div', { class: 'history-card-bar' },
        h('button', { onclick: () => { for (const c of list.children) c.classList.remove('selected'); card.classList.add('selected'); void showRun(content, r, detail) } }, 'Leggi il resoconto'),
        open ? h('button', { onclick: () => { screen.remove(); resume(r.id) } }, 'Riprendi') : null))
    list.append(card)
  })
  if (!runs.length) list.append(h('p', { class: 'history-empty' }, 'Nessuna indagine ancora: comincia la lettura.'))
  ui().append(screen)
}

interface ChapterReport { number: number; facts: string[]; choices: string[]; deductions: number; hints: number; chats: { who: string; turns: { role: string; text: string }[] }[]; ended: boolean }

async function showRun(content: Content, run: RunMeta, into: HTMLElement): Promise<void> {
  const events = await window.api.runs.readLog(run.id)
  const chapters: ChapterReport[] = []
  const current = () => {
    if (!chapters.length) chapters.push({ number: 1, facts: [], choices: [], deductions: 0, hints: 0, chats: [], ended: false })
    return chapters[chapters.length - 1]
  }
  for (const e of events) {
    const d = e.data as Record<string, any>
    if (e.kind === 'chapter') chapters.push({ number: d.number, facts: [], choices: [], deductions: 0, hints: 0, chats: [], ended: false })
    else if (e.kind === 'fact') current().facts.push(content.facts[d.id]?.text ?? d.id)
    else if (e.kind === 'choice') current().choices.push(d.text)
    else if (e.kind === 'hint') current().hints++
    else if (e.kind === 'deduction' && d.ok) current().deductions++
    else if (e.kind === 'chat') current().chats.push({ who: content.characters[d.npc]?.name ?? d.npc, turns: d.turns })
    else if (e.kind === 'end') current().ended = true
  }
  const player = content.characters[content.chapters[0]?.player ?? '']?.name ?? 'Tu'
  const section = (title: string, body: (HTMLElement | null)[]) => body.length ? h('div', { class: 'report-section' }, h('h4', {}, title), ...body) : null
  const report = chapters.map((c) => {
    const ch = content.chapters.find((x) => x.number === c.number)
    return h('div', { class: 'report-chapter' },
      h('h3', {}, `Capitolo ${roman(c.number)}${ch ? ` · ${ch.title}` : ''}`),
      section('Scoperte', c.facts.length ? [h('ul', {}, ...c.facts.map((f) => h('li', {}, f)))] : []),
      section('Scelte', c.choices.length ? [h('ul', {}, ...c.choices.map((t) => h('li', {}, t)))] : []),
      section('Conversazioni libere', c.chats.map((chat) => h('div', { class: 'report-chat' },
        h('div', { class: 'report-chat-who' }, `Con ${chat.who}`),
        ...chat.turns.map((t) => h('p', { class: `report-turn ${t.role === 'player' ? 'me' : 'them'}` },
          h('b', {}, `${t.role === 'player' ? player : chat.who}: `), t.text))))),
      h('p', { class: 'report-meta' }, [
        c.deductions ? `Ragionamenti risolti: ${c.deductions}` : '',
        `Suggerimenti usati: ${c.hints}`,
        c.ended ? 'Capitolo concluso.' : '',
      ].filter(Boolean).join(' · ')))
  })
  into.replaceChildren(...(report.length ? report : [h('p', { class: 'history-empty' }, 'Nessun evento registrato.')]))
  into.scrollTop = 0
}

// The lawyer's notebook (tasto J, or the notebook in the corner): only the notes, written on the ruled lines of
// two facing pages. A note that does not fit goes on the next page; the arrows turn a leaf. Notes written since
// the last opening appear one after the other, as if written now, with a pen sound. What to do now, the hint
// and the pockets are on screen in the HUD (ui/hud.ts, D30).
export function journal(session: Session): Promise<void> {
  return modal(() => new Promise<void>((resolve) => {
    const { state, content } = session
    const owner = content.characters[state.player]?.name ?? state.player
    const notes = state.journal
    const firstNew = Math.min(session.journalSeen, notes.length)
    session.journalSeen = notes.length

    // every line-sized piece in order: the owner, a heading when the chapter changes, the notes
    const items: HTMLElement[] = [h('div', { class: 'notebook-owner' }, `Taccuino di ${owner}`)]
    let chapter = 0
    let delay = 0
    notes.forEach((n, i) => {
      if (n.chapter !== chapter) {
        chapter = n.chapter
        const ch = content.chapters.find((c) => c.number === n.chapter)
        items.push(h('div', { class: 'note-heading' }, `Capitolo ${roman(n.chapter)}${ch ? ` · ${ch.title}` : ''}`))
      }
      const li = h('div', { class: 'note' }, h('span', { class: 'note-mark' }, '—'), ' ', n.text)
      if (i >= firstNew) {
        li.classList.add('new')
        li.style.setProperty('--w', `${delay}s`)
        li.dataset.delay = String(delay)
        delay += 0.9
      }
      items.push(li)
    })
    if (!notes.length) items.push(h('p', { class: 'note' }, 'Ancora nessun appunto.'))

    const pageEl = (lines: HTMLElement[], index: number) =>
      h('div', { class: `notebook-page ${index % 2 ? 'right' : 'left'}` },
        h('div', { class: 'page-lines' }, ...lines),
        h('div', { class: 'page-number' }, String(index + 1)))

    const leftSlot = h('div', { class: 'page-slot left' })
    const rightSlot = h('div', { class: 'page-slot right' })
    const book = h('div', { class: 'notebook' }, leftSlot, rightSlot)
    const prev = h('button', { class: 'notebook-nav', onclick: () => turn(-1) }, '◂ Pagina prima')
    const next = h('button', { class: 'notebook-nav', onclick: () => turn(1) }, 'Pagina dopo ▸')
    const counter = h('span', { class: 'notebook-counter' })
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
    const screen = h('div', { class: 'screen notebook-screen' }, book,
      h('div', { class: 'notebook-bar' }, prev, counter, next, h('button', { onclick: close }, 'Chiudi (J)')))
    ui().append(screen)

    // pagination: fill a hidden page with the same size until it overflows, then start the next one
    const probe = pageEl([], 0)
    probe.classList.add('probe')
    leftSlot.append(probe)
    const box = probe.querySelector<HTMLElement>('.page-lines')!
    const pages: HTMLElement[][] = [[]]
    for (const it of items) {
      box.append(it)
      if (box.scrollHeight > box.clientHeight + 1 && pages[pages.length - 1].length) {
        pages.push([])
        box.replaceChildren(it)
      }
      pages[pages.length - 1].push(it)
    }
    probe.remove()
    if (pages.length % 2) pages.push([]) // a spread has two pages
    const spreads = pages.length / 2
    const newSpread = notes.length > firstNew ? Math.floor(pages.findIndex((p) => p.some((x) => x.classList.contains('new'))) / 2) : spreads - 1
    let spread = Math.max(0, newSpread)
    let turning = false

    const show = (i: number) => pageEl(pages[i].map((x) => x.cloneNode(true) as HTMLElement), i)
    const draw = () => {
      leftSlot.replaceChildren(show(spread * 2))
      rightSlot.replaceChildren(show(spread * 2 + 1))
      counter.textContent = `pagine ${spread * 2 + 1}-${spread * 2 + 2} di ${pages.length}`
      prev.toggleAttribute('disabled', spread === 0)
      next.toggleAttribute('disabled', spread === spreads - 1)
    }
    // a leaf turns on the spine: its front is the page being turned, its back the page that comes next
    const turn = (d: 1 | -1) => {
      const to = spread + d
      if (turning || to < 0 || to >= spreads) return
      turning = true
      const front = (d > 0 ? rightSlot : leftSlot).firstElementChild!.cloneNode(true) as HTMLElement
      const back = show(d > 0 ? to * 2 : to * 2 + 1)
      const leaf = h('div', { class: `leaf ${d > 0 ? 'leaf-next' : 'leaf-prev'}` },
        h('div', { class: 'leaf-face front' }, front), h('div', { class: 'leaf-face back' }, back))
      ;(d > 0 ? rightSlot : leftSlot).replaceChildren(show(d > 0 ? to * 2 + 1 : to * 2)) // revealed underneath
      book.append(leaf)
      playPenScratch()
      leaf.addEventListener('animationend', () => {
        leaf.remove()
        spread = to
        draw()
        turning = false
      }, { once: true })
    }

    draw()
    // the new notes are written once: the copies on screen animate, the originals do not any more
    for (const el of rightSlot.querySelectorAll<HTMLElement>('.note.new')) setTimeout(() => { if (el.isConnected) playPenScratch() }, Number(el.dataset.delay) * 1000 + 100)
    for (const el of leftSlot.querySelectorAll<HTMLElement>('.note.new')) setTimeout(() => { if (el.isConnected) playPenScratch() }, Number(el.dataset.delay) * 1000 + 100)
    for (const it of items) it.classList.remove('new')
    setTimeout(() => window.addEventListener('keydown', key), 0)
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
          }, 'Taccuino (J)'),
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

// A new game from any chapter of the content (D32). The bookmark of the menu still resumes the last game.
function chapterSelect(content: Content, pick: (n: number) => void): void {
  const screen = h('div', { class: 'screen settings-screen chapter-select' },
    h('div', { class: 'chapter-select-card leather' },
      h('h2', { class: 'pause-title' }, 'Scegli un capitolo'),
      h('p', { class: 'chapter-select-note' }, 'Una nuova partita comincia dal capitolo scelto; Utterson sa già quello che ha scoperto nei capitoli precedenti.'),
      h('div', { class: 'chapter-select-list' },
        ...content.chapters.map((ch) => h('button', { class: 'chapter-select-item', onclick: () => { screen.remove(); pick(ch.number) } },
          ch.cover ? h('img', { class: 'chapter-select-plate', src: assetUrl(`${ch.cover}.png`), alt: '' }) : h('div', { class: 'chapter-select-plate empty' }),
          h('span', { class: 'chapter-select-num' }, `Capitolo ${roman(ch.number)}`),
          h('span', { class: 'chapter-select-title' }, ch.title)))),
      h('button', { class: 'chapter-select-back', onclick: () => screen.remove() }, 'Indietro'),
    ),
  )
  ui().append(screen)
}

// "Chat libera (IA)" in the main menu (D34): what free chat is, whether the model is on this computer and where,
// and the download: phase, bytes, speed, elapsed time, time left and a visible Stop. A stopped or broken
// download resumes from where it stopped. The game is complete without it: only "Conversa" needs the model.
function modelScreen(onChange: () => void): void {
  const status = h('div', { class: 'model-status' })
  const phase = h('div', { class: 'model-phase' })
  const bar = h('div', { class: 'model-bar-fill' })
  const numbers = h('div', { class: 'model-numbers' })
  const progress = h('div', { class: 'model-progress' }, phase, h('div', { class: 'model-bar' }, bar), numbers)
  progress.hidden = true
  const actions = h('div', { class: 'model-actions' })
  let unsubscribe: (() => void) | null = null
  let timer = 0
  let last: ModelDownload | null = null

  const mb = (b: number) => b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(2)} GB` : `${Math.round(b / 1024 ** 2)} MB`
  const clock = (s: number) => { const m = Math.floor(s / 60); return m ? `${m} min ${Math.round(s % 60)} s` : `${Math.round(s)} s` }
  const PHASES: Record<ModelDownload['phase'], string> = {
    checking: 'Controllo dello spazio su disco…',
    resuming: 'Ripresa: rilettura della parte già scaricata…',
    downloading: 'Download del modello…',
    verifying: 'Verifica del file scaricato (sha256)…',
    done: 'Fatto: il modello è pronto.',
    stopped: 'Download fermato. Riprendendolo, riparte da dove si era fermato.',
    error: 'Il download non è riuscito.',
  }

  const drawProgress = () => {
    const d = last
    if (!d) { progress.hidden = true; return }
    progress.hidden = false
    phase.textContent = d.error ? `${PHASES[d.phase]} ${d.error}` : PHASES[d.phase]
    bar.style.width = `${Math.min(100, (d.received / d.total) * 100).toFixed(1)}%`
    const elapsed = (Date.now() - d.startedAt) / 1000
    const left = d.speed > 0 ? (d.total - d.received) / d.speed : 0
    numbers.textContent = [
      `${mb(d.received)} di ${mb(d.total)}`,
      d.phase === 'downloading' && d.speed ? `${mb(d.speed)}/s` : '',
      `tempo trascorso ${clock(elapsed)}`,
      d.phase === 'downloading' && left ? `mancano circa ${clock(left)}` : '',
    ].filter(Boolean).join(' · ')
  }

  const draw = async () => {
    const info = await window.api.llm.modelInfo()
    const running = !!info.download && ['checking', 'resuming', 'downloading', 'verifying'].includes(info.download.phase)
    if (info.download) last = info.download
    const where = { downloaded: 'scaricato dal gioco', bundled: 'incluso nel gioco', ollama: 'già presente in Ollama: il gioco usa quello, senza scaricarlo di nuovo' }
    status.replaceChildren(
      h('p', { class: `model-state ${info.found ? 'ok' : 'missing'}` }, info.found ? `Modello presente (${where[info.source!]}).` : 'Modello non presente: «Conversa» è disattivata.'),
      info.path ? h('p', { class: 'model-path' }, `File: ${info.path}`) : h('p', { class: 'model-path' }, `Verrà salvato in: ${info.downloadTo}`),
    )
    const buttons: HTMLElement[] = []
    if (running) {
      buttons.push(h('button', { class: 'model-stop', onclick: () => void window.api.llm.stopDownload() }, 'Stop'))
    } else if (!info.found) {
      buttons.push(h('button', { class: 'model-download', onclick: () => start() }, `${last?.phase === 'stopped' || last?.phase === 'error' ? 'Riprendi il download' : 'Scarica il modello'} (${mb(info.size)})`))
    } else if (info.source === 'downloaded') {
      buttons.push(h('button', { class: 'model-remove', onclick: () => {
        if (!confirm('Eliminare il modello scaricato? «Conversa» sarà disattivata finché non lo scarichi di nuovo.')) return
        void window.api.llm.removeModel().then(() => { last = null; onChange(); void draw() })
      } }, 'Elimina il modello scaricato'))
    }
    buttons.push(h('button', { onclick: () => close() }, running ? 'Chiudi (il download continua)' : 'Indietro'))
    actions.replaceChildren(...buttons)
    drawProgress()
  }

  const start = () => {
    last = { phase: 'checking', received: 0, total: 0, startedAt: Date.now(), speed: 0, error: null }
    void window.api.llm.downloadModel().then(() => { onChange(); void draw() })
    setTimeout(() => void draw(), 200)
  }

  const close = () => {
    unsubscribe?.()
    clearInterval(timer)
    screen.remove()
  }

  const screen = h('div', { class: 'screen settings-screen model-screen' },
    h('div', { class: 'pause-card model-card' },
      h('h2', { class: 'pause-title' }, 'Chat libera (IA)'),
      h('p', { class: 'model-about' }, '«Conversa» permette di parlare liberamente con i personaggi: scrivi tu le domande e un modello di linguaggio, che gira su questo computer senza internet, risponde nei panni del personaggio. È facoltativa: i dialoghi del libro, i suggerimenti e tutta la storia funzionano anche senza.'),
      h('p', { class: 'model-about' }, `Modello: Qwen 3.5 4B (licenza ${'Apache 2.0'}), un file da 2,5 GB scaricato una volta sola.`),
      status, progress, actions))
  unsubscribe = window.api.llm.onDownload((d) => {
    last = d
    drawProgress()
    if (['done', 'stopped', 'error'].includes(d.phase)) void draw()
  })
  timer = window.setInterval(drawProgress, 1000) // the elapsed time moves also between two progress events
  ui().append(screen)
  void draw()
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
