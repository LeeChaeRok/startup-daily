import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AccordionSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      background: open ? '#fafbfc' : '#fff',
      border: '1px solid rgba(0,0,0,0.06)',
      transition: 'background 0.2s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1a1a2e', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 12, color: '#aaa' }}
        >▼</motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.25 }, opacity: { duration: 0.2 } }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '4px 14px 14px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
