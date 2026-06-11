import React, { useState, useEffect, useRef } from 'react'

const ITEMS = ['🍖','🎀','💧','⭐','🍎','🍪','🎲','💎','🌟']

export default function TreasureSlot({ onClose, onReward }) {
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState(['?', '?', '?'])
  const [result, setResult] = useState(null)
  const [rewardLabel, setRewardLabel] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  function spin() {
    setSpinning(true)
    setResult(null)
    setRewardLabel('')

    const finalItems = [
      ITEMS[Math.floor(Math.random() * ITEMS.length)],
      ITEMS[Math.floor(Math.random() * ITEMS.length)],
      ITEMS[Math.floor(Math.random() * ITEMS.length)],
    ]

    let frame = 0
    intervalRef.current = setInterval(() => {
      frame++
      setReels([
        frame < 15 ? ITEMS[frame % ITEMS.length] : finalItems[0],
        frame < 22 ? ITEMS[(frame + 3) % ITEMS.length] : finalItems[1],
        frame < 30 ? ITEMS[(frame + 6) % ITEMS.length] : finalItems[2],
      ])
      if (frame >= 30) {
        clearInterval(intervalRef.current)
        setSpinning(false)
        setResult(finalItems)
        resolveReward(finalItems)
      }
    }, 80)
  }

  function resolveReward(items) {
    const counts = {}
    items.forEach(i => { counts[i] = (counts[i] || 0) + 1 })
    const max = Math.max(...Object.values(counts))

    let reward
    if (max === 3)      reward = { type: 'star',   qty: 3, label: '🌟 แจ็คพอต!' }
    else if (max === 2) reward = { type: 'ribbon',  qty: 1, label: '🎀 เยี่ยม!' }
    else                reward = { type: 'food',    qty: 1, label: '🍖 ได้ของแล้ว!' }

    setRewardLabel(reward.label)
    setTimeout(() => { onReward(reward) }, 800)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24, fontFamily: 'Mitr,sans-serif',
    }}>
      <div style={{ color: '#ffd700', fontSize: 28, fontWeight: 'bold' }}>
        💰 หีบสมบัติ! 💰
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {reels.map((item, i) => (
          <div key={i} style={{
            width: 72, height: 72,
            background: '#1a1a3a',
            border: `3px solid ${result ? '#ffd700' : '#555577'}`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
            transition: spinning ? 'none' : 'border-color 0.3s, transform 0.3s',
            transform: result && !spinning ? 'scale(1.08)' : 'scale(1)',
          }}>
            {item}
          </div>
        ))}
      </div>

      {rewardLabel ? (
        <div style={{ color: '#ffd700', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>
          {rewardLabel}
        </div>
      ) : null}

      {!spinning && !result && (
        <button onClick={spin} style={{
          background: 'linear-gradient(180deg, #ffd700, #ff8800)',
          border: 'none', borderRadius: 16,
          padding: '14px 40px', fontSize: 20, fontWeight: 'bold',
          color: '#1a1a00', cursor: 'pointer',
          fontFamily: 'Mitr,sans-serif',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}>
          🎰 หมุน!
        </button>
      )}

      {result && (
        <button onClick={onClose} style={{
          background: 'linear-gradient(180deg, #44cc44, #228822)',
          border: 'none', borderRadius: 16,
          padding: '14px 40px', fontSize: 18, fontWeight: 'bold',
          color: '#ffffff', cursor: 'pointer',
          fontFamily: 'Mitr,sans-serif',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}>
          ✅ รับของ!
        </button>
      )}
    </div>
  )
}
