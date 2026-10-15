// The illustration frame on the right (docs/DECISIONI.md D20): shows a picture of what the text describes.
// One frame for the whole UI; a new picture appears with an ink-blot reveal, null fades the frame out.
// While a picture is shown, <body> has the class `has-illustration` so text panels leave room for it.
import { assetUrl } from '../assets'
import { h, ui } from './dom'

const NATIVE_W = 160
const NATIVE_H = 200

let frame: HTMLElement | null = null
let current: string | null = null

// Largest whole-number zoom that fits a third of the width and most of the height: pixel art stays sharp.
function zoom(): number {
  return Math.max(1, Math.floor(Math.min((window.innerWidth * 0.34) / NATIVE_W, (window.innerHeight * 0.8) / NATIVE_H)))
}

function layout(): void {
  if (!frame) return
  const z = zoom()
  frame.style.setProperty('--ill-w', `${NATIVE_W * z}px`)
  frame.style.setProperty('--ill-h', `${NATIVE_H * z}px`)
  document.body.style.setProperty('--ill-space', `${NATIVE_W * z + 56}px`)
}
window.addEventListener('resize', layout)

export function showIllustration(key: string | null | undefined): void {
  if (!key) return hideIllustration()
  if (key === current) return
  current = key
  if (!frame) {
    frame = h('div', { class: 'illustration' })
    ui().append(frame)
  }
  layout()
  const img = h('img', { class: 'illustration-img', src: assetUrl(`${key}.png`), alt: '' })
  img.onerror = () => { if (current === key) hideIllustration() } // not generated yet: no empty frame
  img.onload = () => {
    if (current !== key || !frame) return
    for (const old of frame.querySelectorAll('.illustration-img')) if (old !== img) old.classList.add('leaving')
    setTimeout(() => frame?.querySelectorAll('.illustration-img.leaving').forEach((o) => o.remove()), 900)
    frame.classList.add('visible')
    document.body.classList.add('has-illustration')
  }
  frame.append(img)
}

export function hideIllustration(): void {
  current = null
  document.body.classList.remove('has-illustration')
  if (!frame) return
  frame.classList.remove('visible')
  const f = frame
  setTimeout(() => { if (!current) f.querySelectorAll('.illustration-img').forEach((o) => o.remove()) }, 700)
}
