import React, { useEffect, useRef, useState } from 'react'

// Global toast state — managed via a simple pub/sub
let _showXpToast = null
let _showItemToast = null
let _spawnConfetti = null

export function showToast(msg) { _showXpToast?.(msg) }
export function showItemToast(msg) { _showItemToast?.(msg) }
export function spawnConfetti(n) { _spawnConfetti?.(n) }

export function XPToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    _showXpToast = (m) => {
      setMsg(m); setVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 1800)
    }
    return () => { _showXpToast = null }
  }, [])

  return (
    <div className={`xp-toast${visible ? ' show' : ''}`}>{msg}</div>
  )
}

export function ItemToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    _showItemToast = (m) => {
      setMsg(m); setVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 2000)
    }
    return () => { _showItemToast = null }
  }, [])

  return (
    <div className={`item-toast${visible ? ' show' : ''}`}>{msg}</div>
  )
}

export function ConfettiLayer() {
  const [pieces, setPieces] = useState([])
  const colors = ['#7F77DD','#EF9F27','#1D9E75','#E24B4A','#378ADD']

  useEffect(() => {
    _spawnConfetti = (n) => {
      const newPieces = Array.from({ length: n }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100,
        bg: colors[Math.floor(Math.random() * colors.length)],
        dur: 0.6 + Math.random(),
        size: 6 + Math.random() * 7,
        round: Math.random() > 0.5,
      }))
      setPieces(p => [...p, ...newPieces])
      setTimeout(() => setPieces(p => p.filter(pc => !newPieces.find(np => np.id === pc.id))), 2000)
    }
    return () => { _spawnConfetti = null }
  }, [])

  return (
    <div className="confetti-wrap">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left + 'vw',
            background: p.bg,
            animationDuration: p.dur + 's',
            width: p.size + 'px',
            height: p.size + 'px',
            borderRadius: p.round ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
