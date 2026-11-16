import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { isSheetEntry, pushSheetEntry, sheetBack, whenSettled } from '../lib/nav.js'
import { L } from '../lib/i18n.js'

const CLOSE_MS = 220

/**
 * Bottom sheet on phones, centred dialog on desktop (spec v2 §3.17). The native <dialog>
 * traps focus, handles Esc and makes the page inert. Opening adds a history entry, so the
 * back gesture closes the sheet and leaves the screen where it was (§8-2).
 * Links inside a sheet should go through leaveSheetTo (nav.js).
 */
export default function Sheet({ open, onClose, title, children, footer, className = '', wide = false }) {
  const ref = useRef(null)
  const panel = useRef(null)
  const opener = useRef(null)
  const titleId = useId()
  const close = useRef(onClose)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    close.current = onClose
  })

  // open / close the dialog with an enter and exit transition
  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    let t
    if (open && !dlg.open) {
      opener.current = document.activeElement
      dlg.showModal()
      dlg.querySelector('.sheet__title')?.focus({ preventScroll: true })
      requestAnimationFrame(() => setShown(true))
    } else if (!open && dlg.open) {
      requestAnimationFrame(() => setShown(false))
      t = setTimeout(() => {
        dlg.close()
        opener.current?.focus?.({ preventScroll: true })
      }, CLOSE_MS)
    }
    return () => clearTimeout(t)
  }, [open])

  // a history entry while open: back closes the sheet. Filters picked inside the sheet change
  // the hash of the sheet's entry, so the screen's entry gets that hash when the sheet goes.
  useEffect(() => {
    if (!open) return
    let token = null
    let alive = true
    let sheetHash = null
    const path = (h) => h.split('?')[0]
    const keepHash = () => {
      if (sheetHash && window.location.hash !== sheetHash && path(window.location.hash) === path(sheetHash)) {
        history.replaceState(history.state, '', sheetHash)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
    }
    const onHash = () => {
      if (token && isSheetEntry(token)) sheetHash = window.location.hash
    }
    const onPop = () => {
      if (token && !isSheetEntry(token)) {
        keepHash()
        close.current()
      }
    }
    whenSettled(() => {
      if (!alive) return
      token = pushSheetEntry()
      sheetHash = window.location.hash
      window.addEventListener('popstate', onPop)
      window.addEventListener('hashchange', onHash)
    })
    return () => {
      alive = false
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onHash)
      if (token && isSheetEntry(token)) sheetBack().then(keepHash)
    }
  }, [open])

  // drag the grip down to close (touch and pen)
  const drag = useRef(null)
  const onPointerDown = (e) => {
    // the close button sits in the draggable head: leave its taps alone
    if (e.pointerType === 'mouse' || e.target.closest('button, a, input, select, textarea')) return
    drag.current = { y: e.clientY, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    drag.current.dy = Math.max(0, e.clientY - drag.current.y)
    if (panel.current) panel.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const onPointerUp = () => {
    if (!drag.current) return
    const { dy } = drag.current
    drag.current = null
    if (panel.current) panel.current.style.transform = ''
    if (dy > 80) onClose()
  }

  return (
    <dialog
      ref={ref}
      className={`sheet ${shown ? 'is-shown' : ''} ${wide ? 'sheet--wide' : ''} ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="sheet__panel" ref={panel}>
        <div className="sheet__grip" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <span aria-hidden="true" />
        </div>
        <div className="sheet__head" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <h2 id={titleId} className="sheet__title" tabIndex={-1}>
            {title}
          </h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={L('닫기', 'Close')}>
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </dialog>
  )
}
