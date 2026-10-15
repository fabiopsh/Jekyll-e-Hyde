// Background music & classic adventure game procedural sound manager (LucasArts / Monkey Island style).
// Provides seamless music crossfading, tactile UI click SFX, and distinct character voice blips.

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
  const fullUrl = url.startsWith('/') ? url : `/${url}`
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

/**
 * Character-specific voice talk-blip emitted as text streams (Monkey Island / Pentiment style).
 * - Utterson: deep, warm, solemn barrister baritone blip (~125 Hz)
 * - Enfield: bright, lively gentleman tenor blip (~260 Hz)
 * - Narrator: vintage typewriter mechanical clack
 */
export function playTalkBlip(speaker = 'narrator'): void {
  if (masterSfxVolume <= 0) return
  const nowMs = performance.now()
  // Throttle blips so they sound rhythmic and don't muddy together
  if (nowMs - lastBlipTime < 45) return
  lastBlipTime = nowMs

  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    if (speaker === 'narrator') {
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

    let baseFreq = 180
    let wave: OscillatorType = 'triangle'

    if (speaker === 'utterson') {
      // Gabriel John Utterson: Grave, resonant Victorian lawyer
      baseFreq = 118 + Math.random() * 18
      wave = 'sawtooth'
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(380, now)
    } else if (speaker === 'enfield') {
      // Richard Enfield: Lighter, animated young gentleman
      baseFreq = 245 + Math.random() * 30
      wave = 'triangle'
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(800, now)
    } else {
      // General NPC
      baseFreq = 175 + Math.random() * 25
      wave = 'sine'
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, now)
    }

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
