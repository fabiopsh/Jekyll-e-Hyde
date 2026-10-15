// Cursors that show the action under the mouse: magnifier (look), speech bubble (talk), hand (take/use),
// arrow (exit). Drawn here as 16x16 pixel maps, doubled, so they match the pixel art without extra files.
import { cursor as fileCursor } from './assets'

export type CursorIcon = 'look' | 'talk' | 'hand' | 'exit'

const COLORS: Record<string, string> = { k: '#1a120a', l: '#f3e2b0', g: '#d8af56', w: '#8fa9bd' }

const MAPS: Record<CursorIcon, { rows: string[]; hot: [number, number] }> = {
  look: {
    hot: [6, 6],
    rows: [
      '................',
      '....kkkkk.......',
      '...kllllllk.....',
      '..klwwwwwwlk....',
      '.klwwwwwwwwlk...',
      '.klwwwwwwwwlk...',
      '.klwwwwwwwwlk...',
      '.klwwwwwwwwlk...',
      '..klwwwwwwlk....',
      '...klllllllkk...',
      '....kkkkk.kggk..',
      '..........kgggk.',
      '...........kgggk',
      '............kggk',
      '.............kk.',
    ],
  },
  talk: {
    hot: [2, 2],
    rows: [
      '................',
      '..kkkkkkkkkkkk..',
      '.kllllllllllllk.',
      '.kllllllllllllk.',
      '.kllkklkklkkllk.',
      '.kllkklkklkkllk.',
      '.kllllllllllllk.',
      '.kllllllllllllk.',
      '..kkkllkkkkkkk..',
      '....kllk........',
      '....klk.........',
      '....kk..........',
    ],
  },
  hand: {
    hot: [7, 1],
    rows: [
      '......kk........',
      '.....kllk.kk....',
      '.....kllkkllk...',
      '.kk..kllkkllkkk.',
      'kllk.kllkkllkllk',
      'kllk.kllkkllkllk',
      '.kllkkllllllllk.',
      '.kllllllllllllk.',
      '..klllllllllllk.',
      '..klllllllllllk.',
      '...kllllllllllk.',
      '...kllllllllllk.',
      '....kllllllllk..',
      '.....kllllllk...',
      '.....kggggggk...',
      '.....kkkkkkkk...',
    ],
  },
  exit: {
    hot: [13, 7],
    rows: [
      '................',
      '................',
      '........k.......',
      '........kk......',
      '........kgk.....',
      'kkkkkkkkkggk....',
      'kgggggggggggk...',
      'kggggggggggggk..',
      'kgggggggggggk...',
      'kkkkkkkkkggk....',
      '........kgk.....',
      '........kk......',
      '........k.......',
    ],
  },
}

const SCALE = 2
const cache = new Map<CursorIcon, string>()

// CSS cursor value for an action icon; falls back to the pointer glove if the canvas is unavailable.
export function actionCursor(icon: CursorIcon): string {
  const hit = cache.get(icon)
  if (hit) return hit
  const { rows, hot } = MAPS[icon]
  const canvas = document.createElement('canvas')
  canvas.width = 16 * SCALE
  canvas.height = 16 * SCALE
  const g = canvas.getContext('2d')
  if (!g) return fileCursor('pointer')
  rows.forEach((row, y) => [...row.padEnd(16, '.').slice(0, 16)].forEach((c, x) => {
    if (!COLORS[c]) return
    g.fillStyle = COLORS[c]
    g.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
  }))
  const value = `url('${canvas.toDataURL()}') ${hot[0] * SCALE} ${hot[1] * SCALE}, pointer`
  cache.set(icon, value)
  return value
}
