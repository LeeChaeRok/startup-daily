/** Canonical, query-free URL for a route — safe to paste anywhere. */
export function canonicalUrl(path) {
  return `${window.location.origin}${window.location.pathname}#${path}`
}

export const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/**
 * Web Share → clipboard → caller-provided manual fallback.
 * Returns 'shared' | 'copied' | 'cancelled' | 'manual'.
 */
export async function shareOrCopy({ title, text, url }) {
  if (canNativeShare() && (!navigator.canShare || navigator.canShare({ url }))) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  return (await copyText(url)) ? 'copied' : 'manual'
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
