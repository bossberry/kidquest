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

export const DEFAULT_THAI_DISTRACTORS = ['ก','ข','ค','ง','จ','ด','ต','บ','ป','ม','ย','ร','ล','ว','ส','ห','อ','า','ิ','ี','ู','ะ','เ']
export const DEFAULT_ENG_DISTRACTORS  = ['a','e','i','o','u','b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w']

/**
 * WordBuildInput — tap-to-place word spelling. Player taps character tiles
 * from the tray to fill ordered slots and reconstruct the target word.
 * Tap a tray tile → fills next empty slot. Tap a filled slot → returns tile to tray.
 * Calls onSubmit(true|false) once all slots are filled.
 * No emoji prop — emoji is already shown in the question zone above.
 */
export default function WordBuildInput({ chars, onSubmit, disabled, resetKey, distractorPool, showHint }) {
  const targetChars = chars || []

  // Thai Unicode block starts at 0x0E00 — use pixel font for Latin, Thai font otherwise
  const isLatinChars = (targetChars[0] || '').charCodeAt(0) < 0x0E00

  const trayChars = useMemo(() => {
    const pool = (distractorPool || DEFAULT_THAI_DISTRACTORS).filter(c => !targetChars.includes(c))
    const extra = []
    const distractorCount = targetChars.length <= 2 ? 1 : 2
    const poolCopy = [...pool]
    for (let i = 0; i < distractorCount && poolCopy.length; i++) {
      const idx = Math.floor(Math.random() * poolCopy.length)
      extra.push(poolCopy.splice(idx, 1)[0])
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

  // Next character needed = target char at the first empty slot
  const nextNeededChar = useMemo(() => {
    const nextEmptyIdx = slots.findIndex(s => s === null)
    if (nextEmptyIdx === -1) return null
    return targetChars[nextEmptyIdx]
  }, [slots, targetChars]) // eslint-disable-line

  // Tray tile to highlight: first unused tile whose char matches what's needed next
  const hintTileId = useMemo(() => {
    if (!showHint || nextNeededChar === null) return null
    const candidate = trayChars.find(t => t.char === nextNeededChar && !trayUsed[t.id])
    return candidate?.id ?? null
  }, [showHint, nextNeededChar, trayChars, trayUsed]) // eslint-disable-line

  const tileStyle = (filled, isSlot) => ({ // eslint-disable-line no-unused-vars
    width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
    fontFamily: isLatinChars ? 'var(--font-pixel)' : 'var(--font-thai)',
    textTransform: isLatinChars ? 'lowercase' : 'none',
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

      {/* Hint prompt — only shown while player is still learning */}
      {showHint && hintTileId && (
        <div style={{ fontFamily:'var(--font-thai)', fontSize:11, color:'#FFD700', marginBottom:2 }}>
          👆 ตัวที่กระพริบ ไปวางในช่องว่างนะ
        </div>
      )}

      {/* Tray of tappable tiles — smaller, wraps cleanly, no overflow */}
      <div style={{
        display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center',
        width:'100%', maxWidth: 320,
      }}>
        {trayChars.map(tile => {
          const isHinted = tile.id === hintTileId
          return (
            <button
              key={tile.id}
              onClick={() => handleTileTap(tile)}
              disabled={disabled || trayUsed[tile.id]}
              style={{
                ...tileStyle(false, false),
                opacity: trayUsed[tile.id] ? 0.25 : 1,
                cursor: (disabled || trayUsed[tile.id]) ? 'default' : 'pointer',
                ...(isHinted ? {
                  border: '2px solid #FFD700',
                  boxShadow: '0 0 12px rgba(255,215,0,0.7)',
                  animation: 'hint-pulse 0.8s ease infinite',
                } : {}),
              }}
            >
              {tile.char}
            </button>
          )
        })}
      </div>
    </div>
  )
}
