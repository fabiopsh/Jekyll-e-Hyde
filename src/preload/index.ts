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
    warmup: () => ipcRenderer.invoke(CHANNELS.llmWarmup),
    modelInfo: () => ipcRenderer.invoke(CHANNELS.llmModelInfo),
    downloadModel: () => ipcRenderer.invoke(CHANNELS.llmDownload),
    stopDownload: () => ipcRenderer.invoke(CHANNELS.llmStopDownload),
    removeModel: () => ipcRenderer.invoke(CHANNELS.llmRemoveModel),
    onDownload: (fn) => {
      const listener = (_e: unknown, d: Parameters<typeof fn>[0]) => fn(d)
      ipcRenderer.on(CHANNELS.llmDownloadProgress, listener)
      return () => { ipcRenderer.removeListener(CHANNELS.llmDownloadProgress, listener) }
    },
  },
  app: {
    quit: () => ipcRenderer.invoke(CHANNELS.appQuit),
  },
}

contextBridge.exposeInMainWorld('api', api)


