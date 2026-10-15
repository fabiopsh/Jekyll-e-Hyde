// URL of a file in assets/ (copied next to index.html at build time). Always relative: an absolute "/x.png"
// works on the dev server but points to the drive root once the built app is opened from disk.
export function assetUrl(path: string): string {
  return `./${path.replace(/^\.?\//, '')}`
}

export const cursor = (name: 'default' | 'pointer') =>
  `url('${assetUrl(`ui/cursor_${name}.png`)}') 2 2, ${name}`
