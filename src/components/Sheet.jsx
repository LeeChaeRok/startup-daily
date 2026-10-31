import { useEffect, useId, useRef } from 'react'
import Icon from './Icon.jsx'
import { L } from '../lib/i18n.js'

/**
 * Bottom sheet on mobile, centered dialog on desktop. Uses the native
 * <dialog> for focus trapping, Esc handling and inert background.
 * head — replaces the close button in the top bar (the title then opens the body)
 */
export default function Sheet({ open, onClose, title, children, footer, head, className = '' }) {
  const ref = useRef(null)
  const opener = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      opener.current = document.activeElement
      dlg.showModal()
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    const onClose = () => opener.current?.focus?.()
    dlg.addEventListener('close', onClose)
    return () => dlg.removeEventListener('close', onClose)
  }, [])

  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="sheet__panel">
        <div className="sheet__handle" aria-hidden="true" />
        {head ? (
          <>
            <div className="sheet__head sheet__head--bar">{head}</div>
            <div className="sheet__body">
              <h2 id={titleId} className="sheet__title sheet__title--lg">
                {title}
              </h2>
              {children}
            </div>
          </>
        ) : (
          <>
            <div className="sheet__head">
              <h2 id={titleId} className="sheet__title">
                {title}
              </h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label={L('닫기', 'Close')}>
                <Icon name="close" />
              </button>
            </div>
            <div className="sheet__body">{children}</div>
          </>
        )}
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </dialog>
  )
}
