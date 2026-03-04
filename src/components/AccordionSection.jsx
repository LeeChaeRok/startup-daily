import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AccordionSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ border: '1px solid #e5e5ea', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: open ? '#fafafa' : '#fff', border: 'none',
          cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#1a1a2e', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ fontSize: 14, color: '#999' }}>
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.3 }, opacity: { duration: 0.2 } }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
