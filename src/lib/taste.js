/* Open/close state of the taste sheet (C1, components/Onboarding.jsx), which several
   places open: the issue screen once on its own, the "내 관심 순 ▾" menu, the one-line
   card at the end of the list, and 설정.
     mode 'ask'  — two steps, role then sectors (role taps move on by themselves)
     mode 'edit' — both on one screen with a 저장 button                            */
import { useSyncExternalStore } from 'react'
import { load } from './storage.js'
import { localDate } from './hooks.js'

let state = { open: false, mode: 'edit', id: 0 }
const listeners = new Set()
const set = (next) => {
  state = next
  listeners.forEach((l) => l())
}

// a new id per opening starts the sheet from the reader's saved choices
export const openTaste = (mode = 'edit') => set({ open: true, mode, id: state.id + 1 })
export const closeTaste = () => set({ ...state, open: false })

export function useTasteSheet() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state,
  )
}

// a reader who arrived on a shared company link came for that page: don't ask them
const enteredOnDetail = typeof window !== 'undefined' && window.location.hash.startsWith('#/s/')

/**
 * Ask once, on its own: after the first company was read or the hero scrolled away
 * (IssueMobile decides when). Never for a reader who already answered or skipped,
 * or who set a role or sectors elsewhere.
 */
export function maybeAskTaste({ prompt, setPrompt, role, interests }) {
  if (state.open || enteredOnDetail) return
  if (load('sd_onboarded', false) || prompt.shown || prompt.dismissed) return
  if (role || interests.length) return
  if (document.querySelector('dialog[open]')) return // never on top of another sheet
  setPrompt({ shown: localDate() })
  openTaste('ask')
}
