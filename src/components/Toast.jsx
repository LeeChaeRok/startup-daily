import { useCallback, useEffect, useRef, useState } from 'react'
import { ToastContext } from './toast-context.js'

/** One toast at a time; a toast with an action stays while hovered or focused. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const held = useRef(false)

  const dismiss = useCallback(() => setToast(null), [])

  const schedule = useCallback(
    (ms) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        if (!held.current) dismiss()
      }, ms)
    },
    [dismiss],
  )

  const show = useCallback(
    (message, action) => {
      setToast({ id: Date.now(), message, action })
      schedule(action ? 5000 : 3000)
    },
    [schedule],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const hold = (on) => {
    held.current = on
    if (!on) schedule(1500)
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className="toast"
            onMouseEnter={() => hold(true)}
            onMouseLeave={() => hold(false)}
            onFocus={() => hold(true)}
            onBlur={() => hold(false)}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action.onClick()
                  dismiss()
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
