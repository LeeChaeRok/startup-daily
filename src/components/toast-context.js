import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})

/** show(message, action?) — action is { label, onClick }. */
export function useToast() {
  return useContext(ToastContext)
}
