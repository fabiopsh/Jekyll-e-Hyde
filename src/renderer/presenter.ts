// Executes rule commands in order on screen: scene changes, dialogues, narration, notifications.
// Commands are queued because dialogues and narration wait for the player.
import Phaser from 'phaser'
import type { Command } from '../game/rules'
import { chapterOf } from '../game/rules'
import type { Session } from './session'
import { RoomScene, type RoomCallbacks } from './phaser/RoomScene'
import { narrate, playDialogue } from './ui/story-panels'
import { openChat } from './ui/chat'
import { journal } from './ui/screens'
import { isModal, toast } from './ui/dom'

export class Presenter {
  private queue: Command[] = []
  private busy = false
  private ended: (() => void) | null = null

  constructor(private readonly game: Phaser.Game, private readonly session: Session) {
    session.onCommands((cmds) => this.enqueue(cmds))
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'j' || e.key === 'J') && !isModal()) void journal(session)
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
    const { content } = this.session
    switch (c.kind) {
      case 'narrate': return narrate([c.text])
      case 'dialogue': return playDialogue(this.session, content.dialogues[c.id])
      case 'learned': return toast(`Nel diario: ${content.facts[c.fact]?.text ?? c.fact}`, 'fact')
      case 'got': return toast(`Preso: ${content.items[c.item]?.name ?? c.item}`, 'item')
      case 'objective': return toast('Obiettivo completato', 'objective')
      case 'chapter': return this.chapterIntro(c.number)
      case 'goto': return this.showScene(c.scene)
      case 'end':
        await narrate(['Fine.'])
        await this.session.save()
        this.game.scene.stop('room')
        this.ended?.()
    }
  }

  private async chapterIntro(n: number): Promise<void> {
    const ch = chapterOf(this.session.content, n)
    await narrate([`Capitolo ${ch.number}\n${ch.title}`, ...ch.intro])
  }

  private showScene(id: string): void {
    const scene = this.session.content.scenes[id]
    if (!scene) { toast(`Scena mancante: ${id}`); return }
    const callbacks: RoomCallbacks = {
      run: (effects) => { this.session.run(effects) },
      talk: (npcId, dialogue, chat) => {
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
