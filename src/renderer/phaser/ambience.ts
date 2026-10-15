// Life in a room, from the scene's `ambience` (content): chimney smoke, birds pecking on the ground that fly
// off when the player comes near and come back later, ambient sounds. Procedural: no art files needed.
import Phaser from 'phaser'
import type { Scene as SceneData } from '../../shared/content-schema'
import { startAmbience, stopAmbience } from '../audio'

const SCARE_DISTANCE = 42 // px: closer than this, a bird flies away
const BIRD_DEPTH_BIAS = -1

interface Bird {
  sprite: Phaser.GameObjects.Image
  flying: boolean
}

function makeTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('amb-smoke')) {
    const g = scene.make.graphics({}, false)
    g.fillStyle(0xffffff).fillRect(0, 0, 3, 3)
    g.generateTexture('amb-smoke', 3, 3)
    g.destroy()
  }
  // a pigeon, 6x4 pixels: grey body, darker head, a wing-up frame for flight
  const bird = (key: string, wingUp: boolean) => {
    if (scene.textures.exists(key)) return
    const g = scene.make.graphics({}, false)
    g.fillStyle(0x6f6e74).fillRect(1, 1, 4, 2)
    g.fillStyle(0x45434a).fillRect(4, 0, 2, 2)
    g.fillStyle(0x8c8a90).fillRect(wingUp ? 1 : 2, wingUp ? 0 : 1, 2, 1)
    g.fillStyle(0xc29a5a).fillRect(1, 3, 1, 1).fillRect(3, 3, 1, 1)
    g.generateTexture(key, 6, 4)
    g.destroy()
  }
  bird('amb-bird', false)
  bird('amb-bird-fly', true)
}

// Returns the per-frame update (birds react to the player).
export function addAmbience(scene: Phaser.Scene, room: SceneData, player: () => Phaser.GameObjects.Sprite): (time: number) => void {
  const amb = room.ambience
  scene.events.once('shutdown', stopAmbience)
  if (!amb) { stopAmbience(); return () => undefined }
  makeTextures(scene)
  startAmbience(amb.sounds)

  for (const [x, y] of amb.smoke) {
    scene.add.particles(x, y, 'amb-smoke', {
      speedY: { min: -9, max: -15 },
      speedX: { min: -2, max: 6 },
      lifespan: 4200,
      frequency: 240,
      alpha: { start: 0.45, end: 0 },
      scale: { start: 0.8, end: 2.6 },
      tint: 0xb9b2aa,
    }).setDepth(1)
  }

  const birds: Bird[] = []
  if (amb.birds) {
    const { area, count } = amb.birds
    const spot = () => ({ x: area.x + Math.random() * area.w, y: area.y + Math.random() * area.h })
    for (let i = 0; i < count; i++) {
      const p = spot()
      const sprite = scene.add.image(p.x, p.y, 'amb-bird').setOrigin(0.5, 1).setDepth(p.y + BIRD_DEPTH_BIAS)
      sprite.setFlipX(Math.random() < 0.5)
      birds.push({ sprite, flying: false })
      // pecking: a 1-pixel bob now and then
      scene.time.addEvent({ delay: 700 + Math.random() * 900, loop: true, callback: () => {
        const b = birds[i]
        if (b.flying) return
        b.sprite.y += b.sprite.y % 2 ? -1 : 1
        if (Math.random() < 0.2) b.sprite.setFlipX(!b.sprite.flipX)
      } })
    }

    const flyOff = (b: Bird) => {
      b.flying = true
      const dir = b.sprite.x < player().x ? -1 : 1
      let flap = 0
      const wings = scene.time.addEvent({ delay: 90, loop: true, callback: () => b.sprite.setTexture(flap++ % 2 ? 'amb-bird' : 'amb-bird-fly') })
      b.sprite.setFlipX(dir < 0).setDepth(10_000)
      scene.tweens.add({
        targets: b.sprite,
        x: b.sprite.x + dir * (160 + Math.random() * 120),
        y: -10,
        duration: 1800 + Math.random() * 700,
        ease: 'Sine.easeIn',
        onComplete: () => {
          wings.remove()
          // back after a while, landing somewhere in the area
          scene.time.delayedCall(15_000 + Math.random() * 20_000, () => {
            const p = spot()
            b.sprite.setTexture('amb-bird-fly').setPosition(p.x - dir * 120, -10)
            const land = scene.time.addEvent({ delay: 90, loop: true, callback: () => b.sprite.setTexture(b.sprite.texture.key === 'amb-bird' ? 'amb-bird-fly' : 'amb-bird') })
            scene.tweens.add({ targets: b.sprite, x: p.x, y: p.y, duration: 1600, ease: 'Sine.easeOut', onComplete: () => {
              land.remove()
              b.sprite.setTexture('amb-bird').setDepth(p.y + BIRD_DEPTH_BIAS)
              b.flying = false
            } })
          })
        },
      })
    }

    return () => {
      const pl = player()
      for (const b of birds) if (!b.flying && Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, pl.x, pl.y) < SCARE_DISTANCE) flyOff(b)
    }
  }
  return () => undefined
}
