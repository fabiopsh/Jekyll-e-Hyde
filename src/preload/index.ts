import { contextBridge, ipcRenderer } from 'electron'
import { CHANNELS, type Api } from '../shared/ipc'

const api: Api = {
  content: () => ipcRenderer.invoke(CHANNELS.content),
  runs: {
    list: () => ipcRenderer.invoke(CHANNELS.runsList),
    create: (state) => ipcRenderer.invoke(CHANNELS.runsCreate, state),
    load: (id) => ipcRenderer.invoke(CHANNELS.runsLoad, id),
    save: (id, state) => ipcRenderer.invoke(CHANNELS.runsSave, id, state),
    log: (id, events) => ipcRenderer.invoke(CHANNELS.runsLog, id, events),
    readLog: (id) => ipcRenderer.invoke(CHANNELS.runsReadLog, id),
  },
  llm: {
    status: () => ipcRenderer.invoke(CHANNELS.llmStatus),
    generate: (id, job) => ipcRenderer.invoke(CHANNELS.llmGenerate, id, job),
    cancel: (id) => ipcRenderer.invoke(CHANNELS.llmCancel, id),
  },
  app: {
    quit: () => ipcRenderer.invoke(CHANNELS.appQuit),
  },
}

contextBridge.exposeInMainWorld('api', api)


