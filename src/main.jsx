import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.css'
import App from './App.jsx'
import { loadData } from './lib/load.js'
import { track } from './lib/analytics.js'
import { watchForUpdates } from './lib/update.js'
import { L } from './lib/i18n.js'

const root = document.getElementById('root')

function showLoadError() {
  // the static shell from index.html is still on screen; swap its body for a retry
  const box = document.createElement('div')
  box.className = 'boot-error'
  box.innerHTML = `<p class="boot-error__title">${L('불러오지 못했어요', 'Couldn’t load Startup Daily')}</p><p>${L(
    '인터넷 연결을 확인하고 다시 시도해 주세요.',
    'Check your connection and try again.',
  )}</p><button type="button" class="btn btn--primary">${L('다시 시도', 'Try again')}</button>`
  box.querySelector('button').addEventListener('click', () => window.location.reload())
  root.querySelector('.boot__body')?.replaceChildren(box)
  window.sdSplashDone?.()
}

loadData().then(
  () => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    // the launch splash (index.html) leaves once the first screen has painted
    // (the timer covers a page started in the background, where frames don't run)
    requestAnimationFrame(() => requestAnimationFrame(() => window.sdSplashDone?.()))
    setTimeout(() => window.sdSplashDone?.(), 150)
    watchForUpdates()
    track('app_open', { standalone: window.matchMedia('(display-mode: standalone)').matches })
  },
  showLoadError,
)
