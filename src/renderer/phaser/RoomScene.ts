// A playable room: background, walkable polygon, player, NPCs, hotspots and exits, all from a content scene.
// Missing art is replaced by placeholders, so content can be tested before assets exist.
import Phaser from 'phaser'
import { assetUrl, cursor } from '../assets'
import { actionCursor, type CursorIcon } from '../cursors'
import { addAmbience } from './ambience'
import { addLighting } from './lighting'
import { playFootstep } from '../audio'
import type { Condition, Effect, Scene as SceneData } from '../../shared/content-schema'
import { check } from '../../game/rules'
import type { Session } from '../session'
import { isModal } from '../ui/dom'
import { closeVerbMenu, hoverLabel, isVerbMenuOpen, verbMenu, type VerbOption } from '../ui/room-ui'
import { playClickSound } from '../audio'


export const GAME_WIDTH = 480
export const GAME_HEIGHT = 270
const WALK_SPEED = 70 // px per second at scale 1
const FOLLOW_GAP = 26 // px between a companion and the player
const TALK_DISTANCE = 80 // px: nearer than this, talking needs no walk
const STEP_MS = 330

type Pt = { x: number; y: number }

export interface RoomCallbacks {
  run(effects: Effect[]): void
  talk(npc: string, dialogue: string | undefined, chat: boolean): void
  blocked(text: string): void
  nothing(): void
}

export class RoomScene extends Phaser.Scene {
  private room!: SceneData
  private session!: Session
  private cb!: RoomCallbacks
  private player!: Phaser.GameObjects.Sprite
  private followers: Phaser.GameObjects.Sprite[] = []
  private followSide = -1 // followers keep this side of the player: -1 left (walking right), 1 right
  private conditional: { when: Condition | undefined; obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Zone }[] = []
  private ambience: (time: number) => void = () => undefined
  private lastStep = 0
  private walkable!: Phaser.Geom.Polygon
  private walkTween: Phaser.Tweens.Tween | null = null

  constructor() { super('room') }

  init(args: { scene: SceneData; session: Session; callbacks: RoomCallbacks }): void {
    this.room = args.scene
    this.session = args.session
    this.cb = args.callbacks
    this.followers = []
  }

  preload(): void {
    const keys = [this.room.background, ...this.room.foreground, ...this.room.props.map((p) => p.image)]
    for (const k of keys) if (!this.textures.exists(k)) this.load.image(k, assetUrl(`${k}.png`))
    for (const id of [this.session.state.player, ...this.room.npcs.map((n) => n.npc)]) {
      const key = this.spriteKey(id)
      if (!this.textures.exists(key)) this.load.atlas(key, assetUrl(`${key}.png`), assetUrl(`${key}.json`))
    }
    this.load.on('loaderror', () => undefined) // placeholders are drawn in create()
  }

  create(): void {
    this.input.setDefaultCursor(cursor('default'))
    const s = this.session.state
    this.cameras.main.fadeIn(250)
    this.addImageOrPlaceholder(this.room.background, 0)
    for (const p of this.room.props) {
      if (!this.textures.exists(p.image) || this.textures.get(p.image).key === '__MISSING') continue // npm run validate lists it
      const img = this.add.image(p.at[0], p.at[1], p.image).setOrigin(0)
      img.setDepth(p.depth ?? p.at[1] + img.height)
    }
    this.walkable = new Phaser.Geom.Polygon(this.room.walkable.flat())

    // player
    const entry = this.room.entries[s.entry ?? ''] ?? Object.values(this.room.entries)[0] ?? [GAME_WIDTH / 2, GAME_HEIGHT - 20]
    this.player = this.makeCharacter(s.player, entry[0], entry[1])

    // npcs (all are made; refresh() shows those whose `when` holds now)
    this.conditional = []
    for (const n of this.room.npcs) {
      const npc = this.makeCharacter(n.npc, n.at[0], n.at[1])
      this.conditional.push({ when: n.when, obj: npc })
      npc.setFlipX(n.facing === 'left')
      if (n.follow) {
        this.followers.push(npc)
        this.followSide = npc.x >= this.player.x ? 1 : -1 // a companion stays on the side where it starts
      }
      const name = this.session.content.characters[n.npc]?.name ?? n.npc
      this.interactive(npc, name, () => {
        const opts: VerbOption[] = [{ label: 'Osserva', run: () => this.cb.run([{ narrate: `È ${name}.` }]) }]
        if (n.talk) opts.unshift({ label: 'Parla', run: () => this.cb.talk(n.npc, n.talk, false) })
        if (n.chat) opts.splice(n.talk ? 1 : 0, 0, { label: 'Conversa', run: () => this.cb.talk(n.npc, undefined, true) })
        // close enough: the two just turn to each other (walking would move a follower too)
        if (Phaser.Math.Distance.Between(npc.x, npc.y, this.player.x, this.player.y) < TALK_DISTANCE) {
          this.player.setFlipX(npc.x < this.player.x)
          npc.setFlipX(this.player.x < npc.x)
          return { at: { x: this.player.x, y: this.player.y }, options: opts }
        }
        // otherwise walk next to where the npc is now (a follower is not at its start point any more)
        const side = npc.x >= this.player.x ? -18 : 18
        return { at: this.nearestWalkable({ x: npc.x + side, y: npc.y }), options: opts }
      }, 'talk')
    }

    // hotspots
    for (const hs of this.room.hotspots) {
      const zone = 'polygon' in hs.shape
        ? this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive(new Phaser.Geom.Polygon(hs.shape.polygon.flat()), Phaser.Geom.Polygon.Contains)
        : this.add.zone(hs.shape.x, hs.shape.y, hs.shape.w, hs.shape.h).setOrigin(0).setInteractive()
      const center = 'polygon' in hs.shape
        ? Phaser.Geom.Polygon.GetAABB(new Phaser.Geom.Polygon(hs.shape.polygon.flat()))
        : new Phaser.Geom.Rectangle(hs.shape.x, hs.shape.y, hs.shape.w, hs.shape.h)
      const at = hs.walk_to ? { x: hs.walk_to[0], y: hs.walk_to[1] } : this.nearestWalkable({ x: center.centerX, y: center.bottom })
      const labels = { look: 'Osserva', use: 'Usa', take: 'Prendi', talk: 'Parla' } as const
      this.interactive(zone, hs.name, () => ({
        at,
        options: (Object.keys(hs.verbs) as (keyof typeof labels)[]).map((verb) => ({
          label: labels[verb],
          run: () => {
            const hit = hs.verbs[verb]?.find((i) => check(i.when, this.session.state))
            if (hit) this.cb.run(hit.effects)
            else this.cb.nothing()
          },
        })),
      }), hs.verbs.talk ? 'talk' : hs.verbs.take || hs.verbs.use ? 'hand' : 'look')
      this.conditional.push({ when: hs.when, obj: zone })
    }
    this.refresh()

    // exits
    for (const ex of this.room.exits) {
      const zone = this.add.zone(ex.shape.x, ex.shape.y, ex.shape.w, ex.shape.h).setOrigin(0).setInteractive({ cursor: actionCursor('exit') })
      zone.on('pointerover', () => hoverLabel(`→ ${ex.name}`))
      zone.on('pointerout', () => hoverLabel(null))
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (isModal() || p.rightButtonDown()) return
        playClickSound()
        closeVerbMenu()
        const target = this.nearestWalkable({ x: ex.shape.x + ex.shape.w / 2, y: ex.shape.y + ex.shape.h })
        this.walkTo(target, () => {
          if (check(ex.when, this.session.state)) this.cb.run([{ goto: ex.to, ...(ex.at ? { at: ex.at } : {}) }])
          else this.cb.blocked(ex.blocked ?? 'Non è il momento di andare.')
        })
      })
    }

    // read-only hook for scripts/shot.ts: where the NPCs stand now (followers move). Harmless in the game.
    ;(window as unknown as { __jhNpcs: () => { x: number; y: number }[] }).__jhNpcs = () =>
      this.children.list.filter((o): o is Phaser.GameObjects.Sprite => o instanceof Phaser.GameObjects.Sprite && o !== this.player && o.visible).map((o) => ({ x: o.x, y: o.y }))

    this.ambience = addAmbience(this, this.room, () => this.player)

    for (const fg of this.room.foreground) this.addImageOrPlaceholder(fg, 10_000, true)
    addLighting(this, this.room)

    // click on empty floor: walk
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (isModal() || over.length || p.rightButtonDown()) return
      closeVerbMenu()
      this.walkTo(this.nearestWalkable({ x: p.worldX, y: p.worldY }))
    })
    this.input.mouse?.disableContextMenu()

    this.events.once('shutdown', () => {
      closeVerbMenu()
      hoverLabel(null)
    })

    // on_enter: every matching interaction runs once per visit
    const enter = this.room.on_enter.filter((i) => check(i.when, s)).flatMap((i) => i.effects)
    if (enter.length) this.time.delayedCall(300, () => this.cb.run(enter))
  }

  // Shows or hides npcs and hotspots with a `when`, after the state changed (e.g. someone arrives).
  refresh(): void {
    if (!this.conditional || !this.sys.isActive()) return
    for (const { when, obj } of this.conditional) {
      const on = check(when, this.session.state)
      if (on === obj.visible && obj.input?.enabled === on) continue
      obj.setVisible(on)
      if (obj.input) obj.input.enabled = on
    }
  }

  update(_time: number, delta: number): void {
    this.player.setDepth(this.player.y)
    this.player.setScale(this.scaleAt(this.player.y))
    for (const f of this.followers) if (f.visible) this.follow(f, delta)
    this.ambience(_time)
    // a step every STEP_MS while the player walks (the room decides if steps make a sound)
    if (this.walkTween && _time - this.lastStep > STEP_MS) { this.lastStep = _time; playFootstep() }
  }

  // A companion keeps FOLLOW_GAP px behind the player, on the side the player comes from.
  private follow(f: Phaser.GameObjects.Sprite, delta: number): void {
    // the side is set by the last walk, not by where the player looks: turning to talk moves nobody
    const behind = this.followSide * FOLLOW_GAP
    const target = this.nearestWalkable({ x: this.player.x + behind, y: this.player.y + 3 })
    const dx = target.x - f.x
    const dy = target.y - f.y
    const dist = Math.hypot(dx, dy)
    const key = f.texture.key
    if (dist > 3) {
      const step = Math.min(dist, (WALK_SPEED * this.scaleAt(f.y) * delta) / 1000)
      f.x += (dx / dist) * step
      f.y += (dy / dist) * step
      if (Math.abs(dx) > 1) f.setFlipX(dx < 0)
      if (this.anims.exists(`${key}:walk`) && f.anims.currentAnim?.key !== `${key}:walk`) f.play(`${key}:walk`)
    } else {
      f.setFlipX(this.player.x < f.x) // face Utterson when standing
      if (this.anims.exists(`${key}:idle`) && f.anims.currentAnim?.key !== `${key}:idle`) f.play(`${key}:idle`)
    }
    f.setDepth(f.y)
    f.setScale(this.scaleAt(f.y))
  }

  // ---- helpers -------------------------------------------------------------------------------

  private spriteKey(id: string): string {
    return this.session.content.characters[id]?.sprite ?? `characters/${id}`
  }

  private addImageOrPlaceholder(key: string, depth: number, optional = false): void {
    if (this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') {
      this.add.image(0, 0, key).setOrigin(0).setDepth(depth)
      return
    }
    if (optional) return
    const g = this.add.graphics().setDepth(depth)
    g.fillGradientStyle(0x2a2a38, 0x2a2a38, 0x14121a, 0x14121a, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    g.lineStyle(1, 0x4a4436).strokePoints(this.room.walkable.map(([x, y]) => ({ x, y })), true)
    this.add.text(8, 6, `[sfondo mancante: ${key}]`, { fontFamily: 'monospace', fontSize: '8px', color: '#8a8070' }).setDepth(depth)
  }

  private makeCharacter(id: string, x: number, y: number): Phaser.GameObjects.Sprite {
    const key = this.spriteKey(id)
    let sprite: Phaser.GameObjects.Sprite
    if (this.textures.exists(key) && this.textures.get(key).frameTotal > 1) {
      sprite = this.add.sprite(x, y, key).setOrigin(0.5, 1)
      for (const anim of ['idle', 'walk']) {
        const frames = this.anims.generateFrameNames(key, { prefix: `${anim}_`, start: 0, end: 7 }).filter((f) => this.textures.get(key).has(String(f.frame)))
        if (frames.length && !this.anims.exists(`${key}:${anim}`)) {
          this.anims.create({ key: `${key}:${anim}`, frames, frameRate: anim === 'walk' ? 8 : 2, repeat: -1 })
        }
      }
      if (this.anims.exists(`${key}:idle`)) sprite.play(`${key}:idle`)
    } else {
      const ph = `ph:${id}`
      if (!this.textures.exists(ph)) {
        const g = this.make.graphics({}, false)
        const tint = [0x7a6a50, 0x50607a, 0x6a3a3a, 0x4a6a4a, 0x6a5a7a][id.length % 5]
        g.fillStyle(tint).fillRect(4, 14, 16, 34).fillStyle(0xd8c8a8).fillCircle(12, 8, 7)
        g.fillStyle(0x1a1a1a).fillRect(6, 48, 5, 16).fillRect(13, 48, 5, 16)
        g.generateTexture(ph, 24, 64)
        g.destroy()
      }
      sprite = this.add.sprite(x, y, ph).setOrigin(0.5, 1)
    }
    sprite.setScale(this.scaleAt(y)).setDepth(y)
    return sprite
  }

  private scaleAt(y: number): number {
    const sc = this.room.scale
    if (!sc) return 1
    const t = Phaser.Math.Clamp((y - sc.far_y) / (sc.near_y - sc.far_y), 0, 1)
    return sc.far + (sc.near - sc.far) * t
  }

  private interactive(
    obj: Phaser.GameObjects.Zone | Phaser.GameObjects.Sprite,
    name: string,
    menu: () => { at: Pt; options: VerbOption[] },
    icon: CursorIcon,
  ): void {
    obj.setInteractive({ cursor: actionCursor(icon) })
    obj.on('pointerover', () => hoverLabel(name))
    obj.on('pointerout', () => hoverLabel(null))
    obj.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (isModal()) return
      playClickSound()
      if (isVerbMenuOpen()) {
        closeVerbMenu()
        return
      }
      const { at, options } = menu()
      const look = options.find((o) => o.label === 'Osserva')
      if (p.rightButtonDown()) { if (look) { closeVerbMenu(); this.walkTo(at, look.run); } return }
      if (options.length === 1) { closeVerbMenu(); this.walkTo(at, options[0].run); }
      else verbMenu(name, p.event as MouseEvent, options.map((o) => ({ ...o, run: () => this.walkTo(at, o.run) })))
    })
  }

  private walkTo(target: Pt, then?: () => void): void {
    this.walkTween?.stop()
    const from = { x: this.player.x, y: this.player.y }
    const dist = Phaser.Math.Distance.BetweenPoints(from, target)
    if (dist < 2) { then?.(); return }
    this.player.setFlipX(target.x < from.x)
    if (Math.abs(target.x - from.x) > 2) this.followSide = target.x < from.x ? 1 : -1
    const key = this.player.texture.key
    if (this.anims.exists(`${key}:walk`)) this.player.play(`${key}:walk`)
    this.walkTween = this.tweens.add({
      targets: this.player,
      x: target.x,
      y: target.y,
      duration: (dist / (WALK_SPEED * this.scaleAt((from.y + target.y) / 2))) * 1000,
      onComplete: () => {
        if (this.anims.exists(`${key}:idle`)) this.player.play(`${key}:idle`)
        this.walkTween = null
        then?.()
      },
    })
  }

  // Point inside the walkable polygon closest to p (p itself when already inside).
  private nearestWalkable(p: Pt): Pt {
    if (this.walkable.contains(p.x, p.y)) return p
    let best = p
    let bestD = Infinity
    const pts = this.walkable.points
    for (let i = 0; i < pts.length; i++) {
      const line = new Phaser.Geom.Line(pts[i].x, pts[i].y, pts[(i + 1) % pts.length].x, pts[(i + 1) % pts.length].y)
      const q = Phaser.Geom.Line.GetNearestPoint(line, new Phaser.Geom.Point(p.x, p.y))
      // clamp to the segment
      const minX = Math.min(line.x1, line.x2), maxX = Math.max(line.x1, line.x2)
      const minY = Math.min(line.y1, line.y2), maxY = Math.max(line.y1, line.y2)
      const c = { x: Phaser.Math.Clamp(q.x, minX, maxX), y: Phaser.Math.Clamp(q.y, minY, maxY) }
      const d = Phaser.Math.Distance.BetweenPoints(p, c)
      if (d < bestD) { bestD = d; best = c }
    }
    return best
  }
}
