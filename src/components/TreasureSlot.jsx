import React, { useState, useEffect, useRef } from 'react'
import { TH_ALPHA, EN_ALPHA, LEVELS, MATH_WORDS, COUNTABLES, shuffle } from '../config/gameConfig.js'
import { playSFX } from '../lib/audio.js'

const ITEMS = ['🍖','🎀','💧','⭐','🍎','🍪','🎲','💎','🌟']

// ── Gate question generators (level 1 only) ───────────────────────────────────

function genMathGateQ() {
  const lv = LEVELS.math.find(l => l.id === 1) || { id:1, op:'add', range:[1,5] }
  const mx = lv.range?.[1] || 5
  const a = Math.floor(Math.random() * mx) + 1
  const b = Math.floor(Math.random() * (mx - a + 1)) + 1
  const ans = a + b
  const w = new Set()
  while (w.size < 3) {
    const v = ans + (Math.floor(Math.random() * 5) - 2)
    if (v !== ans && v >= 0) w.add(v)
  }
  return { question: `${a} + ${b} = ?`, answer: ans, choices: shuffle([ans, ...w]) }
}

function genThaiGateQ() {
  const items = shuffle([...TH_ALPHA])
  const correct = items[0]
  const wrongs  = items.slice(1, 4)
  return {
    question: correct.word,
    answer:   correct.emoji,
    choices:  shuffle([correct.emoji, ...wrongs.map(w => w.emoji)]),
  }
}

function genEngGateQ() {
  const items = shuffle([...EN_ALPHA])
  const correct = items[0]
  const wrongs  = items.slice(1, 4)
  return {
    question: correct.letter,
    answer:   correct.emoji,
    choices:  shuffle([correct.emoji, ...wrongs.map(w => w.emoji)]),
  }
}

function genGateQuestion(subject) {
  if (subject === 'math') return genMathGateQ()
  if (subject === 'thai') return genThaiGateQ()
  return genEngGateQ()
}

// ── TreasureSlot ─────────────────────────────────────────────────────────────

export default function TreasureSlot({ onClose, onReward, subject = 'thai' }) {
  const [phase, setPhase]   = useState('question')
  const [question]          = useState(() => genGateQuestion(subject))
  const [wrongFlash, setWrongFlash] = useState(false)

  const [spinning, setSpinning] = useState(false)
  const [reels, setReels]       = useState(['?', '?', '?'])
  const [result, setResult]     = useState(null)
  const [rewardLabel, setRewardLabel] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  function handleGateAnswer(choice) {
    if (choice === question.answer) {
      playSFX('item_collect')
      setPhase('spin')
    } else {
      playSFX('attack_miss')
      setWrongFlash(true)
      setTimeout(() => onClose(), 700)
    }
  }

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
        frame < 15 ? ITEMS[frame % ITEMS.length]       : finalItems[0],
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

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 100,
    background: wrongFlash ? 'rgba(180,0,0,0.55)' : 'rgba(0,0,0,0.88)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, fontFamily: 'Mitr,sans-serif',
    transition: 'background 0.2s',
  }

  // ── Question phase ─────────────────────────────────────────────────────────
  if (phase === 'question') {
    return (
      <div style={overlayStyle}>
        <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 'bold', textAlign: 'center', fontFamily: 'var(--font-thai,Mitr,sans-serif)' }}>
          💰 ตอบให้ถูกเพื่อเปิดหีบ!
        </div>

        <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', fontFamily: 'var(--font-pixel,"Press Start 2P",monospace)', letterSpacing: 2 }}>
          {question.question}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 300 }}>
          {question.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleGateAnswer(choice)}
              style={{
                padding: '14px 8px',
                background: '#1a1a3a',
                border: '2px solid #5a5a9a',
                color: '#ffffff',
                fontSize: 24,
                cursor: 'pointer',
                borderRadius: 0,
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Spin phase ─────────────────────────────────────────────────────────────
  return (
    <div style={overlayStyle}>
      <div style={{ color: '#ffd700', fontSize: 28, fontWeight: 'bold', fontFamily: 'var(--font-thai,Mitr,sans-serif)' }}>
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
        <div style={{ color: '#ffd700', fontSize: 22, fontWeight: 'bold', textAlign: 'center', fontFamily: 'var(--font-thai,Mitr,sans-serif)' }}>
          {rewardLabel}
        </div>
      ) : null}

      {!spinning && !result && (
        <button onClick={spin} style={{
          background: 'linear-gradient(180deg, #ffd700, #ff8800)',
          border: 'none', borderRadius: 16,
          padding: '14px 40px', fontSize: 20, fontWeight: 'bold',
          color: '#1a1a00', cursor: 'pointer',
          fontFamily: 'var(--font-thai,Mitr,sans-serif)',
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
          fontFamily: 'var(--font-thai,Mitr,sans-serif)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}>
          ✅ รับของ!
        </button>
      )}
    </div>
  )
}
