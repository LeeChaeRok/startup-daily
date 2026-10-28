import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.css'
import App from './App.jsx'
import { loadData } from './lib/load.js'
import { watchForUpdates } from './lib/update.js'

const root = document.getElementById('root')

function showLoadError() {
  // the static shell from index.html is still on screen; swap its body for a retry
  const box = document.createElement('div')
  box.className = 'boot-error'
  box.innerHTML =
    '<p class="boot-error__title">불러오지 못했어요</p><p>인터넷 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="btn btn--primary">다시 시도</button>'
  box.querySelector('button').addEventListener('click', () => window.location.reload())
  root.querySelector('.boot__body')?.replaceChildren(box)
}

loadData().then(
  () => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    watchForUpdates()
  },
  showLoadError,
)
