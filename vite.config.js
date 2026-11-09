import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { liteRecord } from './src/lib/lite.js'
import { englishRecord } from './src/lib/merge-en.js'
import { groupByDate, readAll, readEn } from './scripts/lib/store.mjs'

/* The daily data stays in src/data (the generator, the API and the workflow write and
   read it there) but ships as /data/*.json fetched at start-up, not inside the bundle:
   a new issue then only changes JSON files, and the code bundle keeps its hash.

   Company records live one file per day (src/data/days, see scripts/lib/store.mjs):
     data/index.json            list fields of every public company (first paint, explore, search)
     data/days/<date>.json      full records of that day (the detail page, the API)
     data/en/…                  the same for the English edition
     data/pool/…                the same over the whole sector pool, for ?preview=pool while the
                                pool is not public yet (src/data/pool-config.json, _workspace/14 §1-5) */
const DATA_DIR = path.resolve(import.meta.dirname, 'src/data')
const DATA_FILES = ['contests.json', 'corrections.json', 'korea-lens-index.json', 'korea-lens.json', 'meta.json', 'updates.json']
const readData = (name, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'))
  } catch {
    return fallback
  }
}

function companyFiles() {
  const all = readAll()
  const en = readEn()
  const poolPublic = readData('pool-config.json', {}).public === true
  const isPublic = (s) => poolPublic || s.featured !== false
  const files = {}
  const set = (prefix, records) => {
    const english = records.map((s) => englishRecord(s, en[s.id]))
    files[`${prefix}index.json`] = records.map(liteRecord)
    files[`en/${prefix}index.json`] = english.map((s) => ({ ...liteRecord(s), _ko: s._ko }))
    for (const [date, list] of groupByDate(records)) files[`${prefix}days/${date}.json`] = list
    for (const [date, list] of groupByDate(english)) files[`en/${prefix}days/${date}.json`] = list
  }
  set('', all.filter(isPublic))
  if (!poolPublic) set('pool/', all)
  return files
}

function dataFiles() {
  return {
    name: 'startup-daily-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].match(/^\/data\/([\w./-]+\.json)$/)?.[1]
        if (!name || name.includes('..')) return next()
        const value = DATA_FILES.includes(name) ? null : companyFiles()[name]
        const body = value ? JSON.stringify(value) : DATA_FILES.includes(name) && fs.readFileSync(path.join(DATA_DIR, name))
        if (!body) return next()
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(body)
      })
    },
    generateBundle() {
      for (const name of DATA_FILES) {
        this.emitFile({ type: 'asset', fileName: `data/${name}`, source: fs.readFileSync(path.join(DATA_DIR, name)) })
      }
      for (const [name, value] of Object.entries(companyFiles())) this.emitFile({ type: 'asset', fileName: `data/${name}`, source: JSON.stringify(value) })
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
      const poolPublic = readData('pool-config.json', {}).public === true
      const all = readAll().filter((s) => poolPublic || s.featured !== false)
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
      const recentDays = Object.keys(bundle)
        .filter((f) => /^data\/days\/[\d-]+\.json$/.test(f))
        .sort()
        .slice(-3)
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css)$/.test(f) || f.startsWith('data/'))
        .filter((f) => !f.startsWith('s/'))
        .filter((f) => f !== 'data/korea-lens.json') // large and only needed for a few pages
        .filter((f) => !f.startsWith('data/en/')) // the other edition is cached when it is used
        .filter((f) => !f.startsWith('data/pool/')) // internal preview
        // day files: only the newest three, the rest are cached when opened
        .filter((f) => !f.startsWith('data/days/') || recentDays.includes(f))
        .map((f) => `/${f}`)
      const precache = ['/', '/manifest.json', '/icons/icon-192.png', '/splash/mark.png', ...files]
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
