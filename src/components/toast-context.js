import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})

/** show(message, action?, ms?) — action is { label, onClick }; ms overrides how long it stays. */
export function useToast() {
  return useContext(ToastContext)
}
