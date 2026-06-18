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

/**
 * SequenceInput — tap-to-place letter ordering. Player taps shuffled letter
 * tiles to fill ordered slots, reconstructing the correct alphabetical sequence.
 * Calls onSubmit(true|false) once all slots are filled.
 */
export default function SequenceInput({ correctOrder, onSubmit, disabled, resetKey, showHint }) {
  const target = correctOrder || []

  const trayTiles = useMemo(() => {
    return shuffleArr(target).map((c, i) => ({ id: `seq_tile_${i}`, char: c }))
  }, [resetKey]) // eslint-disable-line

  const [slots, setSlots] = useState(() => Array(target.length).fill(null))
  const [trayUsed, setTrayUsed] = useState({})

  useEffect(() => {
    setSlots(Array(target.length).fill(null))
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

    if (newSlots.every(s => s !== null)) {
      const built = newSlots.map(s => s.char).join('')
      const correct = target.join('')
      setTimeout(() => onSubmit(built === correct), 300)
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

  // Next character needed = correct letter at the first empty slot
  const nextNeededChar = useMemo(() => {
    const nextEmptyIdx = slots.findIndex(s => s === null)
    if (nextEmptyIdx === -1) return null
    return target[nextEmptyIdx]
  }, [slots, target]) // eslint-disable-line

  // Tray tile to highlight: first unused tile whose char matches what's needed next
  const hintTileId = useMemo(() => {
    if (!showHint || nextNeededChar === null) return null
    const candidate = trayTiles.find(t => t.char === nextNeededChar && !trayUsed[t.id])
    return candidate?.id ?? null
  }, [showHint, nextNeededChar, trayTiles, trayUsed]) // eslint-disable-line

  const tileStyle = (filled) => ({
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
      display:'flex', flexDirection:'column', alignItems:'center', gap:10,
      width:'100%', maxHeight:'100%', overflow:'hidden',
      padding:'4px 8px', boxSizing:'border-box',
    }}>
      {/* Instruction label */}
      <div style={{
        fontFamily:'var(--font-pixel)', fontSize:8,
        color:'rgba(255,255,255,0.4)', letterSpacing:1,
      }}>
        เรียงตามลำดับ
      </div>

      {/* Answer slots */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center' }}>
        {slots.map((tile, i) => (
          <button key={i} onClick={() => handleSlotTap(i)} style={tileStyle(!!tile)} disabled={disabled}>
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

      {/* Tray of shuffled tiles */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center', width:'100%', maxWidth:320 }}>
        {trayTiles.map(tile => {
          const isHinted = tile.id === hintTileId
          return (
            <button
              key={tile.id}
              onClick={() => handleTileTap(tile)}
              disabled={disabled || trayUsed[tile.id]}
              style={{
                ...tileStyle(false),
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
