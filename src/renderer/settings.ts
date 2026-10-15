// Player preferences: text speed, text size, full screen. Kept in this computer's browser storage (a
// per-player convenience: losing it only resets the defaults). Applied through CSS variables and dom.ts.

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type TextSize = 'normal' | 'large' | 'xlarge'

export interface Settings {
  textSpeed: TextSpeed
  textSize: TextSize
}

const KEY = 'jh-settings'
const DEFAULTS: Settings = { textSpeed: 'normal', textSize: 'normal' }

export const SPEED_LABEL: Record<TextSpeed, string> = { slow: 'Lenta', normal: 'Normale', fast: 'Veloce', instant: 'Immediata' }
export const SIZE_LABEL: Record<TextSize, string> = { normal: 'Normale', large: 'Grande', xlarge: 'Molto grande' }
const SPEED_FACTOR: Record<TextSpeed, number> = { slow: 1.7, normal: 1, fast: 0.45, instant: 0 }
const SIZE_FACTOR: Record<TextSize, number> = { normal: 1, large: 1.15, xlarge: 1.3 }

let current: Settings = load()

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export function settings(): Settings {
  return current
}

export function updateSettings(change: Partial<Settings>): void {
  current = { ...current, ...change }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* storage unavailable: keep for this session */ }
  applySettings()
}

// Multiplier for typewriter delays; 0 means "show the whole text at once".
export const speedFactor = () => SPEED_FACTOR[current.textSpeed]

export function applySettings(): void {
  document.documentElement.style.setProperty('--text-scale', String(SIZE_FACTOR[current.textSize]))
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch { /* not allowed: nothing to do */ }
}
