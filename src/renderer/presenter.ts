// Executes rule commands in order on screen: scene changes, dialogues, narration, notifications.
// Commands are queued because dialogues and narration wait for the player.
import Phaser from 'phaser'
import type { Command } from '../game/rules'
import { chapterOf } from '../game/rules'
import type { Session } from './session'
import { RoomScene, type RoomCallbacks } from './phaser/RoomScene'
import { narrate, playDialogue } from './ui/story-panels'
import { openChat } from './ui/chat'
import { chapterCard, chapterEndPage, journal, pauseMenu } from './ui/screens'
import { isModal, toast } from './ui/dom'
import { closeVerbMenu, isVerbMenuOpen } from './ui/room-ui'
import { playMusic, stopMusic } from './audio'

export class Presenter {
  private queue: Command[] = []
  private busy = false
  private ended: (() => void) | null = null
  private cleanupKeydown: (() => void) | null = null

  constructor(private readonly game: Phaser.Game, private readonly session: Session) {
    session.onCommands((cmds) => this.enqueue(cmds))
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'j' || e.key === 'J') && !isModal()) {
        closeVerbMenu()
        void journal(session)
      } else if (e.key === 'Escape') {
        if (isVerbMenuOpen()) {
          closeVerbMenu()
        } else if (!isModal()) {
          void this.openPauseMenu()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    this.cleanupKeydown = () => window.removeEventListener('keydown', onKey)
  }

  private async openPauseMenu(): Promise<void> {
    closeVerbMenu()
    await pauseMenu(this.session, {
      onResume: () => {},
      onJournal: () => void journal(this.session),
      onMainMenu: async () => {
        await this.session.save()
        this.game.scene.stop('room')
        this.cleanupKeydown?.()
        this.ended?.()
      },
      onQuit: async () => {
        await this.session.save()
        if (window.api?.app?.quit) {
          await window.api.app.quit()
        } else {
          window.close()
        }
      },
    })
  }

  // Shows the current chapter intro (on a new game) and the current scene; resolves when the game ends.
  async start(withIntro: boolean): Promise<void> {
    const done = new Promise<void>((resolve) => (this.ended = resolve))
    if (withIntro) await this.chapterIntro(this.session.state.chapter)
    this.showScene(this.session.state.scene)
    return done
  }

  private enqueue(cmds: Command[]): void {
    this.queue.push(...cmds)
    void this.drain()
  }

  private async drain(): Promise<void> {
    if (this.busy) return
    this.busy = true
    try {
      while (this.queue.length) await this.exec(this.queue.shift()!)
    } finally {
      this.busy = false
    }
  }

  private async exec(c: Command): Promise<void> {
    closeVerbMenu()
    const { content } = this.session
    switch (c.kind) {
      case 'narrate': return narrate([{ text: c.text, image: c.image }])
      case 'dialogue': return playDialogue(this.session, content.dialogues[c.id])
      case 'learned': return toast(`Nel diario: ${content.facts[c.fact]?.text ?? c.fact}`, 'fact')
      case 'got': return toast(`Preso: ${content.items[c.item]?.name ?? c.item}`, 'item')
      case 'objective': return toast('Obiettivo completato', 'objective')
      case 'chapter':
        await this.chapterEnd(c.number - 1)
        return this.chapterIntro(c.number)
      case 'goto': return this.showScene(c.scene)
      case 'end':
        await this.chapterEnd(this.session.state.chapter)
        stopMusic()
        if (!this.session.content.chapters.some((ch) => ch.number === this.session.state.chapter + 1) && this.session.state.chapter < 10) {
          await narrate(['Il prossimo capitolo è ancora in lavorazione.\nLa partita resta nelle Cronache delle indagini.'])
        } else {
          await narrate(['Fine.'])
        }
        await this.session.save()
        this.game.scene.stop('room')
        this.cleanupKeydown?.()
        this.ended?.()
    }
  }

  // End-of-chapter page (summary from the journal), then the chapter's `ending` cards.
  private async chapterEnd(n: number): Promise<void> {
    const ch = this.session.content.chapters.find((c) => c.number === n)
    if (!ch) return
    closeVerbMenu()
    await this.session.save()
    await chapterEndPage(this.session, ch)
    if (ch.ending.length) await narrate(ch.ending)
  }

  private async chapterIntro(n: number): Promise<void> {
    const ch = chapterOf(this.session.content, n)
    await chapterCard(ch)
    if (ch.intro.length) await narrate(ch.intro)
  }

  private showScene(id: string): void {
    const scene = this.session.content.scenes[id]
    if (!scene) { toast(`Scena mancante: ${id}`); return }
    if (scene.music) playMusic(scene.music)
    const callbacks: RoomCallbacks = {
      run: (effects) => { this.session.run(effects) },
      talk: (npcId, dialogue, chat) => {
        closeVerbMenu()
        const npc = this.session.content.npcs[npcId]
        if (chat && npc) void openChat(this.session, npc)
        else if (dialogue) this.enqueue([{ kind: 'dialogue', id: dialogue }])
      },
      blocked: (text) => { this.session.failedAttempt(); this.enqueue([{ kind: 'narrate', text }]) },
      nothing: () => { this.session.failedAttempt(); this.enqueue([{ kind: 'narrate', text: 'Non serve a niente.' }]) },
    }
    const args = { scene, session: this.session, callbacks }
    if (this.game.scene.isActive('room')) this.game.scene.getScene('room').scene.restart(args)
    else this.game.scene.start('room', args)
  }
}

export { RoomScene }
