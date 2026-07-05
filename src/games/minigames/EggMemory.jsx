import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS, dispatchAddCoins } from '../../context/StateContext.jsx'
import { shuffle } from '../../config/gameConfig.js'
import { playTone, playSFX } from '../../lib/audio.js'
import { showItemToast, spawnConfetti } from '../../components/Toasts.jsx'
import { livesRemaining, heartsStr, MINIGAMES } from '../../lib/minigameLives.js'
import { MinigameBg, InGameHUD, MinigameResult } from './minigameUI.jsx'

const ELEMENT_EMOJIS = ['🔥', '💧', '⚡', '🌿', '🌑', '✨']
const G = MINIGAMES.memory
const memoryCoins = (moves) => moves <= 12 ? 6 : moves <= 16 ? 4 : moves <= 22 ? 3 : 2

export default function EggMemory({ navigate }) {
  const { state, dispatch } = useAppState()
  const [phase, setPhase] = useState('ready') // 'ready'|'playing'|'done'
  const [cards, setCards] = useState(null)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)

  const lives = livesRemaining(state, 'memory')

  useEffect(() => {
    if (phase === 'ready' && lives <= 0) playSFX('lives_empty')
  }, [phase, lives])

  const deal = () => setCards(shuffle([
    ...ELEMENT_EMOJIS.map((sym, i) => ({ id: i, sym, key: i })),
    ...ELEMENT_EMOJIS.map((sym, i) => ({ id: i, sym, key: 6 + i })),
  ]))

  const startGame = () => {
    if (lives <= 0) return
    dispatch({ type: ACTIONS.MEMORY_DEDUCT_LIFE })
    setFlipped([]); setMatched(new Set()); setMoves(0); setLocked(false)
    deal()
    setPhase('playing')
  }

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
            const finalMoves = moves + 1
            const coins = memoryCoins(finalMoves)
            const xp = Math.max(5, Math.round(30 - moves))
            setCoinsEarned(coins)
            setPhase('done')
            dispatch({ type: ACTIONS.ADD_XP, payload: { world: 'thai', amount: xp } })
            dispatchAddCoins(dispatch, coins)
            dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: 0, score: 0.8 } })
            showItemToast('🎉 จับคู่ครบ! ' + finalMoves + ' ครั้ง · +' + xp + ' XP · 🪙 +' + coins)
          }
        } else { playTone('wrong') }
        setFlipped([]); setLocked(false)
      }, 700)
    }
  }

  if (phase === 'ready') return (
    <div style={{ width:'100%', maxWidth:480, padding:20, fontFamily:'Mitr,sans-serif' }}>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, textAlign:'center', marginBottom:16 }}>{G.title}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--muted)', marginBottom:16 }}>จับคู่ธาตุให้ครบทุกคู่ด้วยจำนวนครั้งน้อยที่สุด!</div>
      <div style={{ display:'flex', justifyContent:'center', padding:'10px 14px', background:'var(--purple-l)', borderRadius:12, marginBottom:16, fontSize:20 }}>
        {heartsStr(lives, G.max)}
      </div>
      {lives <= 0
        ? <div style={{ textAlign:'center', padding:20, color:'var(--muted)' }}>มาเล่นใหม่พรุ่งนี้นะ! 🌙</div>
        : <button onClick={startGame} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>🃏 เริ่มเล่น!</button>
      }
    </div>
  )

  if (phase === 'done') return (
    <MinigameResult
      gameKey="memory" emoji="🎉" title="จับคู่ครบแล้ว!"
      stats={[`${moves} ครั้ง`]}
      coins={coinsEarned} livesRemaining={lives} maxLives={G.max}
      onRetry={() => setPhase('ready')} onHome={() => navigate?.('home')}
    />
  )

  if (!cards) return <div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>กำลังโหลด...</div>

  return (
    <div style={{ position:'relative', width: '100%', maxWidth: 480, padding: 16, fontFamily: 'Mitr,sans-serif', borderRadius:16, overflow:'hidden' }}>
      <MinigameBg gameKey="memory" radius={16} />
      <InGameHUD gameKey="memory" hearts={lives} maxHearts={G.max}
        coins={memoryCoins(moves)}
        center={`✅ ${matched.size / 2}/${cards.length / 2}`} />
      <div style={{ position:'relative', zIndex:2, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
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
