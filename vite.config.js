import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { liteRecord } from './src/lib/lite.js'

/* The daily data stays in src/data (the generator, the API and the workflow write and
   read it there) but ships as /data/*.json fetched at start-up, not inside the bundle:
   a new issue then only changes a JSON file, and the code bundle keeps its hash. */
const DATA_DIR = path.resolve(import.meta.dirname, 'src/data')
const DATA_FILES = ['startups.json', 'corrections.json', 'korea-lens-index.json', 'korea-lens.json', 'meta.json']
// index.json: list fields only, for the first paint (see src/lib/lite.js)
const indexJson = () =>
  JSON.stringify(JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'startups.json'), 'utf8')).map(liteRecord))

function dataFiles() {
  return {
    name: 'startup-daily-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].match(/^\/data\/([\w.-]+\.json)$/)?.[1]
        if (!name || (name !== 'index.json' && !DATA_FILES.includes(name))) return next()
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(name === 'index.json' ? indexJson() : fs.readFileSync(path.join(DATA_DIR, name)))
      })
    },
    generateBundle() {
      for (const name of DATA_FILES) {
        this.emitFile({ type: 'asset', fileName: `data/${name}`, source: fs.readFileSync(path.join(DATA_DIR, name)) })
      }
      this.emitFile({ type: 'asset', fileName: 'data/index.json', source: indexJson() })
    },
  }
}

/* sw.js with this build's files injected, so the first visit can already open offline. */
function serviceWorker() {
  return {
    name: 'startup-daily-sw',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css)$/.test(f) || f.startsWith('data/'))
        .filter((f) => f !== 'data/korea-lens.json') // large and only needed for a few pages
        .map((f) => `/${f}`)
      const precache = ['/', '/manifest.json', '/icons/icon-192.png', ...files]
      const version = crypto.createHash('sha1').update(files.join('|')).digest('hex').slice(0, 10)
      const source = fs
        .readFileSync(path.resolve(import.meta.dirname, 'src/sw.js'), 'utf8')
        .replace('= __PRECACHE__', `= ${JSON.stringify(precache)}`)
        .replace('${__VERSION__}', version)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dataFiles(), serviceWorker()],
})
