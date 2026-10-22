/* History-entry bookkeeping shared by the router effects and screens.
   Each entry gets an id in history.state so back/forward can restore its
   scroll position, and a depth so the in-app back button knows whether
   there is an in-app page behind it.                                     */

let current = null // { key, depth } of the entry on screen; null before first commit

export const scrollMemory = new Map()

export function currentEntry() {
  return current
}

/** True until the first screen has been committed — i.e. a cold start. */
export function isColdStart() {
  return current === null || current.depth === 0
}

export function claimEntry() {
  const st = history.state
  let entry
  if (st?.sdKey) {
    entry = { key: st.sdKey, depth: st.sdDepth || 0, fresh: false }
  } else {
    entry = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      depth: current ? current.depth + 1 : 0,
      fresh: true,
    }
    history.replaceState({ ...(st || {}), sdKey: entry.key, sdDepth: entry.depth }, '')
  }
  const first = current === null
  current = entry
  return { ...entry, first }
}
