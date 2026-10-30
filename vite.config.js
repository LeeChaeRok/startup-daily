import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { liteRecord } from './src/lib/lite.js'
import { englishRecord } from './src/lib/merge-en.js'

/* The daily data stays in src/data (the generator, the API and the workflow write and
   read it there) but ships as /data/*.json fetched at start-up, not inside the bundle:
   a new issue then only changes a JSON file, and the code bundle keeps its hash. */
const DATA_DIR = path.resolve(import.meta.dirname, 'src/data')
const DATA_FILES = ['startups.json', 'corrections.json', 'korea-lens-index.json', 'korea-lens.json', 'meta.json', 'updates.json']
// index.json: list fields only, for the first paint (see src/lib/lite.js)
const readData = (name, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'))
  } catch {
    return fallback
  }
}
const indexJson = () => JSON.stringify(readData('startups.json', []).map(liteRecord))
// English edition: data/en/startups.json and data/en/index.json (see src/lib/merge-en.js)
const englishAll = () => {
  const tr = readData('startups.en.json', {})
  return readData('startups.json', []).map((s) => englishRecord(s, tr[s.id]))
}
const EN_FILES = {
  'en/startups.json': () => JSON.stringify(englishAll()),
  'en/index.json': () => JSON.stringify(englishAll().map((s) => ({ ...liteRecord(s), _ko: s._ko }))),
}

function dataFiles() {
  return {
    name: 'startup-daily-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].match(/^\/data\/((?:en\/)?[\w.-]+\.json)$/)?.[1]
        if (!name || (name !== 'index.json' && !EN_FILES[name] && !DATA_FILES.includes(name))) return next()
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(name === 'index.json' ? indexJson() : EN_FILES[name] ? EN_FILES[name]() : fs.readFileSync(path.join(DATA_DIR, name)))
      })
    },
    generateBundle() {
      for (const name of DATA_FILES) {
        this.emitFile({ type: 'asset', fileName: `data/${name}`, source: fs.readFileSync(path.join(DATA_DIR, name)) })
      }
      this.emitFile({ type: 'asset', fileName: 'data/index.json', source: indexJson() })
      for (const [name, make] of Object.entries(EN_FILES)) this.emitFile({ type: 'asset', fileName: `data/${name}`, source: make() })
    },
  }
}

/* /s/:id — one tiny page per company so a shared link previews that company (title,
   summary) in KakaoTalk, Slack and the like, then forwards to the app's #/s/:id. */
const SITE = 'https://startup-daily.vercel.app'
const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function companyPages() {
  return {
    name: 'startup-daily-company-pages',
    generateBundle() {
      const all = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'startups.json'), 'utf8'))
      const dates = [...new Set(all.map((s) => s.date))].sort()
      for (const s of all) {
        if (!/^[\w-]+$/.test(s.id || '')) continue
        const no = dates.indexOf(s.date) + 1
        const name = s.name_ko || s.name_en
        const why = (s.trending_reason?.summary || s.tagline || '').slice(0, 140)
        const app = `/#/s/${s.id}`
        const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(name)} — Startup Daily</title>
<meta name="description" content="${esc(s.tagline)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Startup Daily" />
<meta property="og:title" content="${esc(name)} — ${esc(s.tagline)}" />
<meta property="og:description" content="제${no}호 · ${esc(why)} (AI가 공개 자료로 작성)" />
<meta property="og:url" content="${SITE}/s/${s.id}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="${SITE}${app}" />
<meta http-equiv="refresh" content="0;url=${app}" />
<script>location.replace(${JSON.stringify(app)})</script>
</head>
<body><a href="${app}">${esc(name)} 보러 가기</a></body>
</html>
`
        this.emitFile({ type: 'asset', fileName: `s/${s.id}/index.html`, source: html })
      }
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
        .filter((f) => !f.startsWith('s/'))
        .filter((f) => f !== 'data/korea-lens.json') // large and only needed for a few pages
        .filter((f) => !f.startsWith('data/en/')) // the other edition is cached when it is used
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
  plugins: [react(), tailwindcss(), dataFiles(), companyPages(), serviceWorker()],
})
