// Night and lamp light on a room painted by day (scene field `lighting`, content). Phaser's Light2D pipeline
// multiplies the background and every sprite by the ambient colour and lights them again near each light,
// so a night scene reuses the day background and the characters darken with it (docs/DECISIONI.md D28).
import Phaser from 'phaser'
import type { Scene as SceneData } from '../../shared/content-schema'

const hex = (c: string): number => parseInt(c.slice(1), 16)

function haloTexture(scene: Phaser.Scene): string {
  const key = 'light-halo'
  if (scene.textures.exists(key)) return key
  const size = 64
  const tex = scene.textures.createCanvas(key, size, size)!
  const ctx = tex.getContext()
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  tex.refresh()
  return key
}

export function addLighting(scene: Phaser.Scene, room: SceneData): void {
  const lit = room.lighting
  if (!lit || scene.renderer.type !== Phaser.WEBGL) return
  scene.lights.enable().setAmbientColor(hex(lit.ambient))
  const lightUp = (o: Phaser.GameObjects.GameObject) => {
    if ((o instanceof Phaser.GameObjects.Image || o instanceof Phaser.GameObjects.Sprite) && o.blendMode !== Phaser.BlendModes.ADD) o.setPipeline('Light2D')
  }
  for (const l of lit.lights) {
    const light = scene.lights.addLight(l.at[0], l.at[1], l.radius, hex(l.color), l.intensity)
    let halo: Phaser.GameObjects.Image | null = null
    if (l.halo > 0) {
      halo = scene.add.image(l.at[0], l.at[1], haloTexture(scene)).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(hex(l.color)).setScale((l.halo * 2) / 64).setAlpha(0.55).setDepth(9_000)
    }
    if (l.flicker) {
      scene.time.addEvent({ delay: 110, loop: true, callback: () => {
        const k = 0.9 + Math.random() * 0.14
        light.intensity = l.intensity * k
        halo?.setAlpha(0.55 * k)
      } })
    }
  }
  scene.children.list.forEach(lightUp)
  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, lightUp) // sprites made later
}
