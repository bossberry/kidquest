import React, { useState, useEffect, useRef } from 'react'
import { onSaveStatusChange } from '../lib/state.js'

const STATUS_CONFIG = {
  saving:  { icon: '⏳', label: 'กำลังบันทึก...', color: 'rgba(255,255,255,0.5)' },
  saved:   { icon: '✓',  label: 'บันทึกแล้ว',     color: '#4acd4a' },
  error:   { icon: '⚠',  label: 'บันทึกไม่สำเร็จ', color: '#e04020' },
  offline: { icon: '○',  label: 'ออฟไลน์',        color: 'rgba(255,255,255,0.3)' },
}

export default function SaveStatusIndicator() {
  const [status, setStatus] = useState(null)
  const fadeTimerRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onSaveStatusChange((newStatus) => {
      setStatus(newStatus)
      clearTimeout(fadeTimerRef.current)
      if (newStatus === 'saved') {
        fadeTimerRef.current = setTimeout(() => setStatus(null), 2500)
      }
    })
    return () => { unsubscribe(); clearTimeout(fadeTimerRef.current) }
  }, [])

  if (!status) return null
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null

  return (
    <div style={{
      position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'rgba(0,0,0,0.6)', borderRadius: 8,
      padding: '4px 8px', pointerEvents: 'none',
      fontFamily: 'var(--font-pixel)', fontSize: 9,
      color: cfg.color, transition: 'opacity 0.3s ease',
    }}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  )
}
