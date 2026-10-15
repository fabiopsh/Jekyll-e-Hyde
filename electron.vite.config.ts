import { defineConfig } from 'electron-vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: resolve('src/renderer'),
    base: './', // relative URLs: the built app is opened from disk (file://)
    publicDir: resolve('assets'), // final game assets, served as /backgrounds/..., /characters/...
    build: { rollupOptions: { input: resolve('src/renderer/index.html') } },
  },
})
