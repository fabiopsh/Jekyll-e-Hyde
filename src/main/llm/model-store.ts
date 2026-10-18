// Where the language model file is, and how it gets onto the player's computer (docs/DECISIONI.md D34).
// The game ships without the model (a light package). The model is looked for, in this order:
//   1. the copy the game downloaded:     <userData>/models/<file>
//   2. a copy shipped with a full build: <resources>/models/<file>
//   3. a model Ollama already downloaded (same file: no second download while testing)
// otherwise the main menu offers the download. Paths come from Node and Electron, so this works on Windows,
// macOS and Linux alike.
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, readFileSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { mkdir, statfs } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { ModelDownload, ModelInfo } from '../../shared/ipc'

// Qwen 3.5 4B, quantized Q4_K_M, GGUF: the model of the LLM spike (docs/spikes/2026-10-15-llm-embedded.md).
// Licence Apache 2.0 (the licence layer of the Ollama package). The sha256 is the Ollama digest of the file.
export const MODEL = {
  file: 'qwen3.5-4b-q4_k_m.gguf',
  sha256: 'a9d0a3e1d8c91732a3812becd31f8d4a8ff57414903f226306069f0437e2ac50',
  size: 2_648_593_216,
  // the Ollama registry serves the very same file (checked 2026-10-18: 200, Content-Length as above, ranges ok)
  urls: ['https://registry.ollama.ai/v2/library/qwen3.5/blobs/sha256:a9d0a3e1d8c91732a3812becd31f8d4a8ff57414903f226306069f0437e2ac50'],
  ollama: { name: 'qwen3.5', tag: '4b' },
  licence: 'Apache 2.0',
} as const

const FREE_MARGIN = 300 * 1024 * 1024 // bytes left free on the disk after the download

// Folders where Ollama keeps models: OLLAMA_MODELS if set, the user's ~/.ollama/models (all systems), and on
// Linux the folder of the system service installed by Ollama's script.
// JH_IGNORE_OLLAMA=1 (tests): behave as on a computer without Ollama, to see the download path.
export function ollamaDirs(): string[] {
  if (process.env.JH_IGNORE_OLLAMA === '1') return []
  const dirs = [process.env.OLLAMA_MODELS, join(homedir(), '.ollama', 'models')]
  if (process.platform === 'linux') dirs.push('/usr/share/ollama/.ollama/models', '/var/lib/ollama/.ollama/models')
  return dirs.filter((d): d is string => !!d)
}

// The model in an Ollama folder: through the manifest of name:tag (the model layer), or by the known digest.
// Blob names use "sha256-<hex>" (older Ollama on Linux/macOS used "sha256:<hex>").
export function findInOllama(): string | null {
  for (const dir of ollamaDirs()) {
    const digests = new Set<string>([MODEL.sha256])
    const manifest = join(dir, 'manifests', 'registry.ollama.ai', 'library', MODEL.ollama.name, MODEL.ollama.tag)
    try {
      const m = JSON.parse(readFileSync(manifest, 'utf8')) as { layers?: { mediaType: string; digest: string }[] }
      const layer = m.layers?.find((l) => l.mediaType === 'application/vnd.ollama.image.model')
      if (layer) digests.add(layer.digest.replace(/^sha256:/, ''))
    } catch {
      // no manifest here: try the known digest only
    }
    for (const hex of digests) {
      for (const name of [`sha256-${hex}`, `sha256:${hex}`]) {
        const p = join(dir, 'blobs', name)
        if (hex === MODEL.sha256 && sizeOf(p) === MODEL.size) return p
      }
    }
  }
  return null
}

function sizeOf(p: string): number {
  try { return statSync(p).size } catch { return -1 }
}

export class ModelStore {
  private job: { ctrl: AbortController; state: ModelDownload } | null = null

  constructor(private readonly userData: string, private readonly resourcesDir: string) {}

  get downloadedPath(): string { return join(this.userData, 'models', MODEL.file) }

  locate(): { path: string; source: ModelInfo['source'] } | null {
    if (sizeOf(this.downloadedPath) === MODEL.size) return { path: this.downloadedPath, source: 'downloaded' }
    const shipped = join(this.resourcesDir, 'models', MODEL.file)
    if (sizeOf(shipped) === MODEL.size) return { path: shipped, source: 'bundled' }
    const ollama = findInOllama()
    return ollama ? { path: ollama, source: 'ollama' } : null
  }

  info(): ModelInfo {
    const found = this.locate()
    return {
      found: !!found,
      source: found?.source ?? null,
      path: found?.path ?? null,
      size: MODEL.size,
      licence: MODEL.licence,
      downloadTo: this.downloadedPath,
      download: this.job?.state ?? null,
    }
  }

  // Downloads into <file>.part, resuming an interrupted download, then checks the sha256 and renames.
  // `report` gets every state change (phase, bytes, speed); resolves when done, failed or stopped.
  async download(report: (d: ModelDownload) => void): Promise<void> {
    if (this.job) return
    const ctrl = new AbortController()
    const state: ModelDownload = { phase: 'checking', received: 0, total: MODEL.size, startedAt: Date.now(), speed: 0, error: null }
    this.job = { ctrl, state }
    const set = (patch: Partial<ModelDownload>) => { Object.assign(state, patch); report({ ...state }) }
    const part = `${this.downloadedPath}.part`
    try {
      await mkdir(dirname(part), { recursive: true })
      let have = Math.max(0, sizeOf(part))
      if (have > MODEL.size) { unlinkSync(part); have = 0 }
      const fs = await statfs(dirname(part))
      const free = fs.bavail * fs.bsize
      if (free < MODEL.size - have + FREE_MARGIN) {
        throw new Error(`spazio libero insufficiente: servono ${gb(MODEL.size - have + FREE_MARGIN)}, liberi ${gb(free)}`)
      }
      // the hash covers the whole file: when resuming, the part already on disk is read again first
      const hash = createHash('sha256')
      if (have > 0) {
        set({ phase: 'resuming', received: 0 })
        await new Promise<void>((resolve, reject) => {
          const rs = createReadStream(part, { end: have - 1 })
          rs.on('data', (c) => { hash.update(c); state.received += c.length })
          rs.on('end', resolve)
          rs.on('error', reject)
          ctrl.signal.addEventListener('abort', () => { rs.destroy(); reject(new Error('stopped')) })
        })
      }
      set({ phase: 'downloading', received: have })
      let res: Response | null = null
      let lastError = ''
      for (const url of MODEL.urls) {
        try {
          res = await fetch(url, { headers: have ? { Range: `bytes=${have}-` } : {}, signal: ctrl.signal, redirect: 'follow' })
          if (res.ok) break
          lastError = `HTTP ${res.status}`
        } catch (e) {
          if (ctrl.signal.aborted) throw e
          lastError = (e as Error).message
        }
        res = null
      }
      if (!res || !res.body) throw new Error(`download non riuscito (${lastError})`)
      if (have && res.status !== 206) throw new Error('il server non permette di riprendere il download')
      const out = createWriteStream(part, { flags: have ? 'a' : 'w' })
      let windowStart = Date.now()
      let windowBytes = 0
      try {
        for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
          hash.update(chunk)
          if (!out.write(chunk)) await new Promise<void>((r) => out.once('drain', () => r()))
          state.received += chunk.length
          windowBytes += chunk.length
          const now = Date.now()
          if (now - windowStart >= 500) {
            set({ speed: (windowBytes * 1000) / (now - windowStart) })
            windowStart = now
            windowBytes = 0
          }
        }
      } finally {
        await new Promise<void>((r) => out.end(() => r()))
      }
      if (state.received !== MODEL.size) throw new Error(`file incompleto: ${state.received} byte su ${MODEL.size}`)
      set({ phase: 'verifying' })
      const digest = hash.digest('hex')
      if (digest !== MODEL.sha256) {
        unlinkSync(part) // corrupted: the next attempt starts from zero
        throw new Error('il file scaricato non corrisponde (sha256 diverso): riprova')
      }
      renameSync(part, this.downloadedPath)
      set({ phase: 'done', speed: 0 })
    } catch (e) {
      // the .part file stays on disk after a stop or a network error, so the next attempt resumes
      set(ctrl.signal.aborted ? { phase: 'stopped', speed: 0 } : { phase: 'error', speed: 0, error: (e as Error).message })
    } finally {
      this.job = null
    }
  }

  stop(): void {
    this.job?.ctrl.abort()
  }

  // Removes the copy the game downloaded (and any partial one). A model of Ollama or of the package is not touched.
  remove(): void {
    for (const p of [this.downloadedPath, `${this.downloadedPath}.part`]) if (existsSync(p)) unlinkSync(p)
  }
}

const gb = (b: number) => `${(b / 1024 ** 3).toFixed(1)} GB`
