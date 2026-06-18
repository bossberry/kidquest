import React, { useState, useEffect, useMemo } from 'react'
import { playTone } from '../../lib/audio.js'

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Distractor pool — common Thai consonants/vowels not likely to already be in chars
const DISTRACTOR_POOL = ['ก','ข','ค','ง','จ','ด','ต','บ','ป','ม','ย','ร','ล','ว','ส','ห','อ','า','ิ','ี','ู','ะ','เ']

/**
 * WordBuildInput — tap-to-place word spelling. Player taps character tiles
 * from the tray to fill ordered slots and reconstruct the target word.
 * Tap a tray tile → fills next empty slot. Tap a filled slot → returns tile to tray.
 * Calls onSubmit(true|false) once all slots are filled.
 * No emoji prop — emoji is already shown in the question zone above.
 */
export default function WordBuildInput({ chars, onSubmit, disabled, resetKey }) {
  const targetChars = chars || []

  const trayChars = useMemo(() => {
    // Add 1-2 distractor chars not already in the target, for difficulty
    const extra = []
    const distractorCount = targetChars.length <= 2 ? 1 : 2
    const pool = DISTRACTOR_POOL.filter(c => !targetChars.includes(c))
    for (let i = 0; i < distractorCount && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      extra.push(pool.splice(idx, 1)[0])
    }
    return shuffleArr([...targetChars, ...extra]).map((c, i) => ({ id: `tile_${i}`, char: c }))
  }, [resetKey]) // eslint-disable-line

  const [slots, setSlots] = useState(() => Array(targetChars.length).fill(null))
  const [trayUsed, setTrayUsed] = useState({})

  useEffect(() => {
    setSlots(Array(targetChars.length).fill(null))
    setTrayUsed({})
  }, [resetKey]) // eslint-disable-line

  const handleTileTap = (tile) => {
    if (disabled || trayUsed[tile.id]) return
    const nextEmptyIdx = slots.findIndex(s => s === null)
    if (nextEmptyIdx === -1) return
    const newSlots = [...slots]
    newSlots[nextEmptyIdx] = tile
    setSlots(newSlots)
    setTrayUsed(prev => ({ ...prev, [tile.id]: true }))
    playTone('tap')

    // Auto-submit when all slots filled
    if (newSlots.every(s => s !== null)) {
      const built = newSlots.map(s => s.char).join('')
      const target = targetChars.join('')
      setTimeout(() => onSubmit(built === target), 300)
    }
  }

  const handleSlotTap = (idx) => {
    if (disabled || slots[idx] === null) return
    const tile = slots[idx]
    const newSlots = [...slots]
    newSlots[idx] = null
    setSlots(newSlots)
    setTrayUsed(prev => { const next = { ...prev }; delete next[tile.id]; return next })
    playTone('click')
  }

  const tileStyle = (filled, isSlot) => ({ // eslint-disable-line no-unused-vars
    width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontFamily: 'var(--font-thai)',
    background: filled ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
    border: filled ? '2px solid #FFD700' : '2px dashed rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    flexShrink: 0,
  })

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      width:'100%', maxHeight:'100%', overflow:'hidden',
      padding:'4px 8px',
      boxSizing:'border-box',
    }}>
      {/* Answer slots — smaller, tighter gap */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center' }}>
        {slots.map((tile, i) => (
          <button key={i} onClick={() => handleSlotTap(i)} style={tileStyle(!!tile, true)} disabled={disabled}>
            {tile?.char ?? ''}
          </button>
        ))}
      </div>

      {/* Tray of tappable tiles — smaller, wraps cleanly, no overflow */}
      <div style={{
        display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center',
        width:'100%', maxWidth: 320,
      }}>
        {trayChars.map(tile => (
          <button
            key={tile.id}
            onClick={() => handleTileTap(tile)}
            disabled={disabled || trayUsed[tile.id]}
            style={{
              ...tileStyle(false, false),
              opacity: trayUsed[tile.id] ? 0.25 : 1,
              cursor: (disabled || trayUsed[tile.id]) ? 'default' : 'pointer',
            }}
          >
            {tile.char}
          </button>
        ))}
      </div>
    </div>
  )
}
