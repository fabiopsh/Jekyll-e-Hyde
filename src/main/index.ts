import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { loadContent } from '../shared/content-loader'
import { CHANNELS } from '../shared/ipc'
import { RunStore } from './saves/runs'
import { LlmService } from './llm'


// In dev the project root holds content/ and story/; in a packaged build they are copied to resources/.
const root = app.isPackaged ? process.resourcesPath : process.cwd()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 810,
    useContentSize: true,
    backgroundColor: '#0b0b10',
    title: 'Lo strano caso del dottor Jekyll e del signor Hyde',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      sandbox: false,
    },
  })
  win.setMenuBarVisibility(false)
  // In development, renderer console output goes to the terminal: agents can see runtime errors there.
  if (!app.isPackaged) {
    win.webContents.on('console-message', (e) => console.log(`[renderer:${e.level}] ${e.message}`))
  }
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  const runs = new RunStore(join(app.getPath('userData'), 'runs'), app.getVersion())

  ipcMain.handle(CHANNELS.content, () => {
    const { content, errors } = loadContent(root)
    return { json: JSON.stringify({ ...content, bookLines: [...content.bookLines] }), errors }
  })
  ipcMain.handle(CHANNELS.runsList, () => runs.list())
  ipcMain.handle(CHANNELS.runsCreate, (_e, state) => runs.create(state))
  ipcMain.handle(CHANNELS.runsLoad, (_e, id) => runs.load(id))
  ipcMain.handle(CHANNELS.runsSave, (_e, id, state) => runs.save(id, state))
  ipcMain.handle(CHANNELS.runsLog, (_e, id, events) => runs.log(id, events))
  ipcMain.handle(CHANNELS.runsReadLog, (_e, id) => runs.readLog(id))

  const llm = new LlmService(join(app.getPath('userData'), 'llm.json'), root)
  ipcMain.handle(CHANNELS.llmStatus, () => llm.status())
  ipcMain.handle(CHANNELS.llmGenerate, (_e, id, job) => llm.generate(id, job))
  ipcMain.handle(CHANNELS.llmCancel, (_e, id) => llm.cancel(id))
  ipcMain.handle(CHANNELS.appQuit, () => {
    app.quit()
  })

  createWindow()

  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
