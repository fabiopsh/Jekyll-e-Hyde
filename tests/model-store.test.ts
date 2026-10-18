// Where the game looks for the language model (src/main/llm/model-store.ts, D34): the copy it downloaded first,
// then one shipped with the package, then Ollama's. Files are sparse: the real size, no 2.6 GB written.
import { mkdirSync, mkdtempSync, openSync, closeSync, ftruncateSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MODEL, ModelStore, findInOllama } from '../src/main/llm/model-store'

const dirs: string[] = []
const temp = () => { const d = mkdtempSync(join(tmpdir(), 'jh-model-')); dirs.push(d); return d }
const fakeFile = (p: string, size: number) => {
  mkdirSync(join(p, '..'), { recursive: true })
  const fd = openSync(p, 'w')
  ftruncateSync(fd, size)
  closeSync(fd)
}
const oldEnv = process.env.OLLAMA_MODELS

afterEach(() => {
  process.env.OLLAMA_MODELS = oldEnv
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('model store', () => {
  it('finds the model in an Ollama folder through its manifest', () => {
    const ollama = temp()
    process.env.OLLAMA_MODELS = ollama
    const manifest = join(ollama, 'manifests', 'registry.ollama.ai', 'library', MODEL.ollama.name, MODEL.ollama.tag)
    mkdirSync(join(manifest, '..'), { recursive: true })
    writeFileSync(manifest, JSON.stringify({ layers: [{ mediaType: 'application/vnd.ollama.image.model', digest: `sha256:${MODEL.sha256}` }] }))
    fakeFile(join(ollama, 'blobs', `sha256-${MODEL.sha256}`), MODEL.size)
    expect(findInOllama()).toBe(join(ollama, 'blobs', `sha256-${MODEL.sha256}`))
  })

  it('ignores a file of the wrong size, and prefers the downloaded copy', () => {
    const ollama = temp()
    process.env.OLLAMA_MODELS = ollama
    fakeFile(join(ollama, 'blobs', `sha256-${MODEL.sha256}`), 1000)
    const userData = temp()
    const store = new ModelStore(userData, temp())
    // only a truncated Ollama blob, and a real Ollama install may exist on this PC: check what the store says
    const before = store.locate()
    expect(before?.path).not.toBe(join(ollama, 'blobs', `sha256-${MODEL.sha256}`))
    fakeFile(store.downloadedPath, MODEL.size)
    expect(store.locate()).toEqual({ path: store.downloadedPath, source: 'downloaded' })
    store.remove()
    expect(store.locate()?.source).not.toBe('downloaded')
  })
})
