import React, { useState, useEffect, useRef } from 'react'
import { playTone, playSFX } from '../../lib/audio.js'

/**
 * MemoryCardInput — flip-and-match mini-game. 6 cards (3 pairs of emoji+letter).
 * Each successfully matched pair calls onPairFound(). Mismatched flips
 * have no penalty — they just flip back after a short delay.
 * Calls onAllPairsFound() once all pairs are matched.
 */
export default function MemoryCardInput({ cards, pairCount, onPairFound, onAllPairsFound, disabled, resetKey }) {
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [busy, setBusy]       = useState(false)
  const cardListRef           = useRef(cards)

  useEffect(() => {
    setFlipped([]); setMatched([]); setBusy(false)
    cardListRef.current = cards
  }, [resetKey]) // eslint-disable-line

  useEffect(() => {
    if (matched.length === pairCount && pairCount > 0) {
      const t = setTimeout(() => onAllPairsFound?.(), 500)
      return () => clearTimeout(t)
    }
  }, [matched.length, pairCount]) // eslint-disable-line

  const handleCardTap = (card) => {
    if (disabled || busy) return
    if (flipped.includes(card.id)) return
    if (matched.includes(card.pairId)) return
    if (flipped.length >= 2) return

    playTone('tap')
    const newFlipped = [...flipped, card.id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped
      const firstCard  = cardListRef.current.find(c => c.id === firstId)
      const secondCard = cardListRef.current.find(c => c.id === secondId)
      setBusy(true)
      if (firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          playSFX('item_collect')
          setMatched(prev => [...prev, firstCard.pairId])
          setFlipped([])
          setBusy(false)
          onPairFound?.()
        }, 500)
      } else {
        setTimeout(() => {
          playTone('click')
          setFlipped([])
          setBusy(false)
        }, 700)
      }
    }
  }

  const cardStyle = (card, isFaceUp) => ({
    width: 52, height: 52,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: card.type === 'emoji' ? 26 : 22,
    fontFamily: card.type === 'char' ? 'var(--font-thai)' : 'inherit',
    background: isFaceUp
      ? (matched.includes(card.pairId) ? 'rgba(74,205,74,0.2)' : 'rgba(255,215,0,0.15)')
      : 'rgba(255,255,255,0.08)',
    border: isFaceUp
      ? (matched.includes(card.pairId) ? '2px solid #4acd4a' : '2px solid #FFD700')
      : '2px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: 'transform 0.15s ease',
  })

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      width:'100%', maxHeight:'100%', overflow:'hidden',
      padding:'4px 8px', boxSizing:'border-box',
    }}>
      <div style={{
        fontFamily:'var(--font-pixel)', fontSize:8,
        color:'rgba(255,255,255,0.4)', letterSpacing:1,
      }}>
        จับคู่ให้ครบ {pairCount} คู่
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 52px)', gap:6 }}>
        {cards.map(card => {
          const isFaceUp = flipped.includes(card.id) || matched.includes(card.pairId)
          return (
            <button
              key={card.id}
              onClick={() => handleCardTap(card)}
              disabled={disabled || matched.includes(card.pairId)}
              style={cardStyle(card, isFaceUp)}
            >
              {isFaceUp ? card.display : '?'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
