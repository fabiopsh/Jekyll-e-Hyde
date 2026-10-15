// Background music & classic adventure game procedural sound manager (LucasArts / Monkey Island style).
// Provides seamless music crossfading, tactile UI click SFX, and per-character text blips (no voices: D19).
import type { Blip } from '../shared/content-schema'
import { assetUrl } from './assets'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// Ensure audio context resumes on first user gesture
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
  }
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })
}

// ---------------------------------------------------------------------------
// Music Manager (Seamless crossfading)
// ---------------------------------------------------------------------------

let currentTrack: { audio: HTMLAudioElement; url: string } | null = null
let fadeInterval: number | null = null
let masterMusicVolume = 0.35
let masterSfxVolume = 0.50

export function getVolume(): { music: number; sfx: number } {
  return { music: masterMusicVolume, sfx: masterSfxVolume }
}

export function setVolume(vol: number): void {
  masterMusicVolume = Math.max(0, Math.min(1, vol))
  if (currentTrack) currentTrack.audio.volume = masterMusicVolume
}

export function setSfxVolume(vol: number): void {
  masterSfxVolume = Math.max(0, Math.min(1, vol))
}

export function playMusic(url: string | undefined | null, loop = true): void {
  if (!url) return
  const fullUrl = assetUrl(url)
  if (currentTrack && currentTrack.url === fullUrl) return

  if (fadeInterval) {
    clearInterval(fadeInterval)
    fadeInterval = null
  }

  const oldTrack = currentTrack
  const newAudio = new Audio(fullUrl)
  newAudio.loop = loop
  newAudio.volume = 0

  const startNew = () => {
    newAudio.play().then(() => {
      currentTrack = { audio: newAudio, url: fullUrl }
      let vol = 0
      fadeInterval = window.setInterval(() => {
        vol += 0.04
        if (vol >= masterMusicVolume) {
          vol = masterMusicVolume
          clearInterval(fadeInterval!)
          fadeInterval = null
        }
        newAudio.volume = vol
      }, 50)
    }).catch(() => {
      const resume = () => {
        window.removeEventListener('pointerdown', resume)
        window.removeEventListener('keydown', resume)
        playMusic(url, loop)
      }
      window.addEventListener('pointerdown', resume, { once: true })
      window.addEventListener('keydown', resume, { once: true })
    })
  }

  if (oldTrack) {
    let vol = oldTrack.audio.volume
    const fadeOut = window.setInterval(() => {
      vol -= 0.08
      if (vol <= 0) {
        clearInterval(fadeOut)
        oldTrack.audio.pause()
        oldTrack.audio.remove()
      } else {
        oldTrack.audio.volume = vol
      }
    }, 40)
  }

  startNew()
}

export function stopMusic(fadeMs = 800): void {
  if (!currentTrack) return
  if (fadeInterval) {
    clearInterval(fadeInterval)
    fadeInterval = null
  }
  const track = currentTrack
  currentTrack = null
  let vol = track.audio.volume
  const step = vol / (fadeMs / 40)
  const fadeOut = window.setInterval(() => {
    vol -= step
    if (vol <= 0) {
      clearInterval(fadeOut)
      track.audio.pause()
      track.audio.remove()
    } else {
      track.audio.volume = Math.max(0, vol)
    }
  }, 40)
}

// ---------------------------------------------------------------------------
// Procedural Sound Effects & Character Voice Blips (LucasArts / Monkey Island style)
// ---------------------------------------------------------------------------

let lastBlipTime = 0

/** Pen nib scratching paper: a short band-passed noise with a little tremolo (notebook notes). */
export function playPenScratch(): void {
  if (masterSfxVolume <= 0) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const length = 0.32
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate
      data[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 22))
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(4200, now)
    filter.Q.setValueAtTime(2.2, now)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.12 * masterSfxVolume, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + length)
  } catch {
    // audio context not ready
  }
}

/**
 * Tactile, crisp mechanical click sound for UI buttons, choices and switches.
 */
export function playClickSound(): void {
  if (masterSfxVolume <= 0) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Two-tone micro-transient simulating an antique brass/wood switch
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1600, now)
    filter.Q.setValueAtTime(3.0, now)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.025)

    gain.gain.setValueAtTime(0.35 * masterSfxVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.030)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.035)
  } catch {
    // Audio context not ready
  }
}

// Used when a speaker has no `blip` in content/characters.yaml.
const DEFAULT_BLIP: Blip = { freq: 175, wave: 'sine', cutoff: 600 }

/**
 * Blip played while a character's text is typed (Monkey Island / Pentiment style).
 * The timbre comes from the character's `blip` in content/characters.yaml; 'typewriter' is a key strike.
 */
export function playTalkBlip(blip?: Blip): void {
  const voice = blip ?? DEFAULT_BLIP
  if (masterSfxVolume <= 0) return
  const nowMs = performance.now()
  // Throttle blips so they sound rhythmic and don't muddy together
  if (nowMs - lastBlipTime < 45) return
  lastBlipTime = nowMs

  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    if (voice === 'typewriter') {
      // Typewriter key strike / paper ribbon tap
      const bufferSize = ctx.sampleRate * 0.02
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(2400 + Math.random() * 400, now)
      filter.Q.setValueAtTime(4.0, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.18 * masterSfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start(now)
      noise.stop(now + 0.025)
      return
    }

    // Character tonal voice blip
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    // a little random spread keeps a long line from sounding mechanical
    const baseFreq = voice.freq * (1 + Math.random() * 0.15)
    const wave: OscillatorType = voice.wave
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(voice.cutoff, now)

    osc.type = wave
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.038)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.28 * masterSfxVolume, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.040)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.042)
  } catch {
    // Audio context not ready
  }
}

// ---- room ambience (scene `ambience.sounds`): wind, distant church bells, footsteps ---------------------

type AmbientSound = 'wind' | 'bells' | 'footsteps'
let ambienceStop: (() => void) | null = null
let footstepsOn = false

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

// One stroke of a far bell: a few inharmonic partials, long decay, muffled by distance.
function bellStroke(ctx: AudioContext, at: number, f0: number): void {
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(1600, at)
  lp.connect(ctx.destination)
  for (const [ratio, level] of [[1, 1], [2, 0.5], [2.76, 0.35], [5.4, 0.15]] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(f0 * ratio, at)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(0.035 * level * masterSfxVolume, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.2)
    osc.connect(gain)
    gain.connect(lp)
    osc.start(at)
    osc.stop(at + 3.3)
  }
}

export function startAmbience(sounds: AmbientSound[]): void {
  stopAmbience()
  footstepsOn = sounds.includes('footsteps')
  const stops: (() => void)[] = []
  try {
    const ctx = getAudioContext()
    if (sounds.includes('wind')) {
      const src = ctx.createBufferSource()
      src.buffer = noiseBuffer(ctx, 3)
      src.loop = true
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(380, ctx.currentTime)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.035 * masterSfxVolume, ctx.currentTime)
      const lfo = ctx.createOscillator() // slow gusts
      const lfoGain = ctx.createGain()
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime)
      lfoGain.gain.setValueAtTime(0.025 * masterSfxVolume, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      src.connect(lp)
      lp.connect(gain)
      gain.connect(ctx.destination)
      src.start()
      lfo.start()
      stops.push(() => { src.stop(); lfo.stop() })
    }
    if (sounds.includes('bells')) {
      let timer = 0
      const ring = () => {
        const now = ctx.currentTime + 0.05
        for (let i = 0; i < 4; i++) bellStroke(ctx, now + i * 1.5, 392)
        timer = window.setTimeout(ring, 50_000 + Math.random() * 40_000)
      }
      timer = window.setTimeout(ring, 8000 + Math.random() * 8000)
      stops.push(() => clearTimeout(timer))
    }
  } catch {
    // audio context not ready: the room stays silent
  }
  ambienceStop = () => stops.forEach((s) => s())
}

export function stopAmbience(): void {
  ambienceStop?.()
  ambienceStop = null
  footstepsOn = false
}

// One step on cobblestones (only when the room has `footsteps` in its ambience).
export function playFootstep(): void {
  if (!footstepsOn || masterSfxVolume <= 0) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, 0.06)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(700 + Math.random() * 300, now)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.09 * masterSfxVolume, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
    src.connect(lp)
    lp.connect(gain)
    gain.connect(ctx.destination)
    src.start(now)
    src.stop(now + 0.07)
  } catch {
    // audio context not ready
  }
}
