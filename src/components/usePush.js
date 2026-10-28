import { useCallback, useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, syncPushPrefs } from '../lib/push.js'
import { getInterests } from '../lib/hooks.js'
import { load, save } from '../lib/storage.js'

const ONLY_KEY = 'sd_push_only_interests'

/** Alert setting state for the UI: status from push.js, plus the "관심 분야만" option. */
export function usePush() {
  const [status, setStatus] = useState('loading')
  const [onlyInterests, setOnly] = useState(() => load(ONLY_KEY, false))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    pushState().then((s) => live && setStatus(s), () => live && setStatus('unsupported'))
    return () => {
      live = false
    }
  }, [])

  const prefs = (only = onlyInterests) => ({ sectors: getInterests(), onlyInterests: only })

  const enable = useCallback(async () => {
    setBusy(true)
    try {
      setStatus(await enablePush(prefs()))
    } catch {
      setStatus('off')
      return false
    } finally {
      setBusy(false)
    }
    return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyInterests])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      setStatus(await disablePush())
    } finally {
      setBusy(false)
    }
  }, [])

  const setOnlyInterests = useCallback(
    (v) => {
      setOnly(v)
      save(ONLY_KEY, v)
      if (status === 'on') syncPushPrefs(prefs(v))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status],
  )

  return { status, busy, enable, disable, onlyInterests, setOnlyInterests }
}
