import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS } from '../../context/StateContext.jsx'
import { shuffle } from '../../config/gameConfig.js'
import { playTone } from '../../lib/audio.js'
import { showItemToast, spawnConfetti } from '../../components/Toasts.jsx'

const ELEMENT_EMOJIS = ['🔥', '💧', '⚡', '🌿', '🌑', '✨']

export default function EggMemory() {
  const { dispatch } = useAppState()
  const [cards, setCards] = useState(null)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const pairs = ELEMENT_EMOJIS.map((sym, i) => ({ id: i, sym }))
    setCards(shuffle([...pairs.map((p, i) => ({ ...p, key: i })), ...pairs.map((p, i) => ({ ...p, key: 6 + i }))]))
  }, []) // eslint-disable-line

  const flip = (idx) => {
    if (locked || flipped.includes(idx) || matched.has(idx)) return
    const newFlipped = [...flipped, idx]
    setFlipped(newFlipped)
    if (newFlipped.length === 2) {
      setMoves(m => m + 1); setLocked(true)
      const c1 = cards[newFlipped[0]], c2 = cards[newFlipped[1]]
      setTimeout(() => {
        if (c1.id === c2.id && newFlipped[0] !== newFlipped[1]) {
          const newMatched = new Set(matched); newMatched.add(newFlipped[0]); newMatched.add(newFlipped[1])
          setMatched(newMatched); playTone('correct'); spawnConfetti(4)
          if (newMatched.size === cards.length) {
            setDone(true)
            const xp = Math.max(5, Math.round(30 - moves))
            dispatch({ type: ACTIONS.ADD_XP, payload: { world: 'thai', amount: xp } })
            dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: 0, score: 0.8 } })
            showItemToast('🎉 จับคู่ครบ! ' + (moves + 1) + ' ครั้ง · +' + xp + ' XP')
          }
        } else { playTone('wrong') }
        setFlipped([]); setLocked(false)
      }, 700)
    }
  }

  if (!cards) return <div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>กำลังโหลด...</div>

  if (done) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 10 }}>🎉</div>
      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 24, marginBottom: 8 }}>จับคู่ครบแล้ว!</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>{moves} ครั้ง</div>
      <button
        onClick={() => { setDone(false); setFlipped([]); setMatched(new Set()); setMoves(0); setCards(shuffle([...cards])) }}
        style={{ width: '100%', background: 'var(--purple)', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontFamily: 'Mitr,sans-serif', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >🔄 เล่นอีกครั้ง</button>
    </div>
  )

  return (
    <div style={{ width: '100%', maxWidth: 480, padding: 16, fontFamily: 'Mitr,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>💡 {moves} ครั้ง</span>
        <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: 16 }}>Egg Memory</span>
        <span style={{ fontSize: 14 }}>✅ {matched.size / 2}/{cards.length / 2}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx)
          const isMatched = matched.has(idx)
          return (
            <div
              key={idx}
              onClick={() => flip(idx)}
              style={{
                borderRadius: 12,
                background: isMatched ? 'var(--green-l)' : 'var(--purple-l)',
                border: `2px solid ${isMatched ? 'var(--green)' : 'var(--purple)'}`,
                height: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isMatched ? 'default' : 'pointer',
                transition: 'all .2s',
              }}
            >
              {isFlipped || isMatched
                ? <span style={{ fontSize: 36 }}>{card.sym}</span>
                : <span style={{ fontSize: 28 }}>🥚</span>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
