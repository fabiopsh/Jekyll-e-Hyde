import Phaser from 'phaser'
import type { Api } from '../shared/ipc'
import type { Content } from '../shared/content-schema'
import { GAME_HEIGHT, GAME_WIDTH, RoomScene } from './phaser/RoomScene'
import { Presenter } from './presenter'
import { Session } from './session'
import { h, toast, ui } from './ui/dom'
import { mainMenu } from './ui/screens'
import { playClickSound, playMusic } from './audio'

declare global {
  interface Window { api: Api }
}

// Global tactile click SFX on interactive UI elements
window.addEventListener(
  'click',
  (e) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const interactive = target.closest(
      'button, .choice, .tab, .menu-btn, .menu-item, .history-item, .pause-btn, a, select',
    )
    if (interactive) {
      playClickSound()
    }
  },
  { capture: true },
)

async function loadContent(): Promise<Content> {
  const { json, errors } = await window.api.content()
  if (errors.length) {
    console.warn(`content has ${errors.length} errors`, errors)
    ui().append(h('div', { class: 'content-errors panel' },
      h('b', {}, `Contenuti con ${errors.length} errori (npm run validate):`), h('pre', {}, errors.slice(0, 12).join('\n'))))
  }
  const raw = JSON.parse(json)
  return { ...raw, bookLines: new Set(raw.bookLines) }
}

async function main(): Promise<void> {
  const content = await loadContent()
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    backgroundColor: '#0b0b10',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    autoFocus: true,
  })
  // The room is added after boot, not in the config: Phaser auto-starts the first configured scene,
  // and a room needs its scene data, which only the presenter has.
  await new Promise<void>((resolve) => game.events.once('ready', () => resolve()))
  game.scene.add('room', RoomScene, false)

  // LLM status: shown once, so the player knows whether free chat is available
  window.api.llm.status().then((s) => { if (s.phase === 'error') toast(`Chat libera non disponibile: ${s.detail}`) })

  for (;;) {
    if (!content.chapters.length) {
      ui().append(h('div', { class: 'screen' }, h('p', {}, 'Nessun capitolo in content/chapters.')))
      return
    }
    playMusic('audio/music/mus_menu_theme.mp3')
    const choice = await mainMenu(content)
    const session = choice.kind === 'new' ? await Session.create(content) : await Session.resume(content, choice.id)
    window.addEventListener('beforeunload', () => void session.save())
    await new Presenter(game, session).start(choice.kind === 'new')
  }
}

main()
