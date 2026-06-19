import React, { useState, useEffect } from 'react'
import { playTone } from '../../lib/audio.js'

/**
 * NumpadInput — big-button 0-9 numeric entry for math battle questions.
 * Player builds a number digit-by-digit, then confirms. Calls onSubmit(value)
 * with the parsed integer when confirmed, or onSubmit(null) is never called —
 * confirm is disabled until at least one digit is entered.
 */
export default function NumpadInput({ onSubmit, disabled, resetKey, revealDigit }) {
  const [digits, setDigits] = useState('')

  // Reset entered digits whenever a new question loads
  useEffect(() => { setDigits('') }, [resetKey])

  const handleDigit = (d) => {
    if (disabled) return
    if (digits.length >= 2) return // cap at 2 digits — matches game's number range
    playTone('tap')
    setDigits(prev => prev + d)
  }

  const handleBackspace = () => {
    if (disabled) return
    playTone('click')
    setDigits(prev => prev.slice(0, -1))
  }

  const handleConfirm = () => {
    if (disabled || digits === '') return
    onSubmit(parseInt(digits, 10))
  }

  const btnStyle = {
    width: 56, height: 56,
    fontSize: 22, fontFamily: 'var(--font-pixel)',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      {/* Display */}
      <div style={{
        minWidth: 100, height: 48,
        background: 'rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-pixel)', fontSize: 26,
        color: digits ? '#FFD700' : 'rgba(255,255,255,0.25)',
      }}>
        {digits || '?'}
      </div>
      {revealDigit != null && (
        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 11,
          color: '#FFD700', marginTop: 4,
        }}>
          💡 ตัวแรกคือ {revealDigit}
        </div>
      )}

      {/* Numpad grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 56px)', gap:8 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleDigit(String(n))} style={btnStyle} disabled={disabled}>
            {n}
          </button>
        ))}
        <button onClick={handleBackspace} style={{ ...btnStyle, fontSize: 16, color:'#ff8888' }} disabled={disabled}>
          ⌫
        </button>
        <button onClick={() => handleDigit('0')} style={btnStyle} disabled={disabled}>
          0
        </button>
        <button
          onClick={handleConfirm}
          style={{
            ...btnStyle,
            background: digits ? 'rgba(74,205,74,0.25)' : btnStyle.background,
            border: digits ? '2px solid #4acd4a' : btnStyle.border,
            color: digits ? '#4acd4a' : btnStyle.color,
          }}
          disabled={disabled || digits === ''}
        >
          ✓
        </button>
      </div>
    </div>
  )
}
