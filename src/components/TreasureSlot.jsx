import React, { useState, useEffect, useRef } from 'react'
import { TH_ALPHA, EN_ALPHA, LEVELS, shuffle } from '../config/gameConfig.js'
import { playSFX, playTone } from '../lib/audio.js'
import { BATTLE_ITEMS, rollBattleItem } from '../config/itemConfig.js'

// ── Question generators ───────────────────────────────────────────────────────

function genMathGateQ() {
  const lv = LEVELS.math.find(l => l.id === 1) || { id:1, op:'add', range:[1,5] }
  const mx = lv.range?.[1] || 5
  const a = Math.floor(Math.random() * mx) + 1
  const b = Math.floor(Math.random() * (mx - a + 1)) + 1
  const ans = a + b
  const w = new Set()
  while (w.size < 3) { const v = ans + (Math.floor(Math.random()*5)-2); if (v!==ans&&v>=0) w.add(v) }
  return { question:`${a} + ${b} = ?`, answer:ans, choices:shuffle([ans,...w]) }
}
function genThaiGateQ() {
  const items = shuffle([...TH_ALPHA])
  const correct = items[0]; const wrongs = items.slice(1,4)
  return { question:correct.word, answer:correct.emoji, choices:shuffle([correct.emoji,...wrongs.map(w=>w.emoji)]) }
}
function genEngGateQ() {
  const items = shuffle([...EN_ALPHA])
  const correct = items[0]; const wrongs = items.slice(1,4)
  return { question:correct.letter, answer:correct.emoji, choices:shuffle([correct.emoji,...wrongs.map(w=>w.emoji)]) }
}
function genGateQuestion(subject) {
  if (subject==='math') return genMathGateQ()
  if (subject==='thai') return genThaiGateQ()
  return genEngGateQ()
}

// ── Reward roller ─────────────────────────────────────────────────────────────

const HOME_DROP = [
  { key:'food', weight:50 },
  { key:'ribbon', weight:25 },
  { key:'shoes', weight:15 },
  { key:'rainbow_star', weight:10 },
]
function rollHomeItem() {
  if (Math.random() > 0.55) return null
  const total = HOME_DROP.reduce((s,d)=>s+d.weight,0)
  let r = Math.random()*total
  for (const d of HOME_DROP) { r-=d.weight; if(r<=0) return d.key }
  return HOME_DROP[0].key
}

const ITEM_LABELS = {
  food:'น่องไก่', ribbon:'ริบบิ้น', shoes:'รองเท้า', rainbow_star:'ดาวสีรุ้ง',
  scroll:'ม้วนใบ', thunder:'สายฟ้า', gem:'อัญมณี', mirror:'กระจก', clover:'โคลเวอร์',
}
const ITEM_COLORS = {
  food:'#8B4513', ribbon:'#FF1493', shoes:'#EF9F27', rainbow_star:'#FF88FF',
  scroll:'#e8c040', thunder:'#66aaff', gem:'#cc44cc', mirror:'#44cccc', clover:'#44cc44',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TreasureSlot({ onClose, onReward, subject='thai' }) {
  const [phase, setPhase]   = useState('question')  // question | chest | reveal
  const [question]          = useState(() => genGateQuestion(subject))
  const [wrongFlash, setWrongFlash] = useState(false)
  const [rewards, setRewards]       = useState([])
  const [floatIn, setFloatIn]       = useState(false)

  function handleGateAnswer(choice) {
    if (choice === question.answer) {
      playSFX('item_collect')
      const items = []
      const home = rollHomeItem()
      if (home) items.push({ type:'home', key:home })
      const battle = rollBattleItem()
      if (battle) items.push({ type:'battle', key:battle })
      setRewards(items)
      setPhase('chest')
    } else {
      playSFX('attack_miss')
      setWrongFlash(true)
      setTimeout(() => onClose(), 600)
    }
  }

  function handleChestTap() {
    if (phase !== 'chest') return
    playTone('celebrate')
    setPhase('reveal')
    setTimeout(() => setFloatIn(true), 50)
  }

  function handleCollect() {
    playSFX('item_collect')
    onReward({ rewards })
    onClose()
  }

  // ── QUESTION PHASE ──────────────────────────────────────────────────────────

  if (phase === 'question') {
    return (
      <div style={{
        position:'fixed', inset:0, zIndex:100,
        background: wrongFlash ? 'rgba(200,0,0,0.6)' : 'rgba(0,0,0,0.92)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        gap:20, transition:'background 0.2s',
      }}>
        <div style={{
          fontFamily:'var(--font-pixel)', fontSize:9,
          color:'#FFD700', letterSpacing:2, marginBottom:8,
        }}>
          ตอบถูก = เปิดหีบ!
        </div>

        <div style={{ fontSize:48, filter:'drop-shadow(0 0 12px #FFD700)' }}>🗝️</div>

        <div style={{
          fontFamily: subject==='math' ? 'var(--font-pixel)' : 'var(--font-thai)',
          fontSize: subject==='math' ? 24 : 32,
          color:'#fff', textAlign:'center',
          padding:'12px 24px',
          background:'rgba(255,255,255,0.06)',
          border:'1px solid rgba(255,255,255,0.15)',
        }}>
          {question.question}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%', maxWidth:280 }}>
          {question.choices.map((choice,i) => (
            <button key={i} onClick={() => handleGateAnswer(choice)} style={{
              padding:'16px 8px',
              background:'rgba(255,255,255,0.06)',
              border:'2px solid rgba(255,255,255,0.2)',
              color:'#fff', fontSize:28,
              cursor:'pointer', borderRadius:0,
              fontFamily:'inherit',
              WebkitTapHighlightColor:'transparent',
              touchAction:'manipulation',
            }}>
              {choice}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── CHEST PHASE ─────────────────────────────────────────────────────────────

  if (phase === 'chest') {
    return (
      <div
        onClick={handleChestTap}
        style={{
          position:'fixed', inset:0, zIndex:100,
          background:'rgba(0,0,0,0.92)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          gap:24, cursor:'pointer',
        }}
      >
        <div style={{
          fontFamily:'var(--font-pixel)', fontSize:9,
          color:'#FFD700', letterSpacing:2,
        }}>
          แตะเพื่อเปิด!
        </div>

        <div style={{ position:'relative', animation:'chest-shake 0.3s ease infinite' }}>
          {/* Lid */}
          <div style={{
            width:96, height:40,
            background:'#8B6914',
            border:'3px solid #DAA520',
            borderBottom:'none',
            borderRadius:'4px 4px 0 0',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              width:20, height:16,
              background:'#FFD700',
              border:'2px solid #B8860B',
              borderRadius:2,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-pixel)', fontSize:8, color:'#412402',
            }}>★</div>
          </div>
          {/* Body */}
          <div style={{
            width:96, height:56,
            background:'#6B4F10',
            border:'3px solid #DAA520',
            borderTop:'2px solid #DAA520',
            borderRadius:'0 0 4px 4px',
          }} />
          {/* Glow */}
          <div style={{
            position:'absolute', inset:-8, borderRadius:8,
            boxShadow:'0 0 20px #FFD700, 0 0 40px #FF8800',
            pointerEvents:'none',
          }} />
        </div>

        <div style={{
          fontFamily:'var(--font-thai)', fontSize:13,
          color:'rgba(255,255,255,0.5)',
          animation:'blink 1s ease infinite',
        }}>
          แตะเพื่อเปิด!
        </div>
      </div>
    )
  }

  // ── REVEAL PHASE ────────────────────────────────────────────────────────────

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(0,0,0,0.92)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:24,
    }}>
      {/* Open chest */}
      <div style={{ position:'relative', marginBottom:8 }}>
        <div style={{
          width:96, height:40,
          background:'#8B6914',
          border:'3px solid #FFD700',
          borderRadius:'4px 4px 0 0',
          transform:'rotateX(-150deg)',
          transformOrigin:'bottom center',
          display:'flex', alignItems:'center', justifyContent:'center',
          opacity:0.6,
        }}>
          <div style={{ width:20, height:16, background:'#FFD700', border:'2px solid #B8860B', borderRadius:2 }} />
        </div>
        <div style={{
          width:96, height:56,
          background:'#6B4F10',
          border:'3px solid #FFD700',
          borderTop:'none',
          borderRadius:'0 0 4px 4px',
        }} />
        <div style={{
          position:'absolute', top:40, left:8, right:8, height:30,
          background:'radial-gradient(ellipse, rgba(255,215,0,0.4) 0%, transparent 70%)',
        }} />
      </div>

      {/* Items floating up */}
      <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
        {rewards.length === 0 ? (
          <div style={{
            fontFamily:'var(--font-thai)', fontSize:14,
            color:'rgba(255,255,255,0.4)',
          }}>ไม่มีของรางวัลครั้งนี้</div>
        ) : rewards.map((r, i) => (
          <div key={i} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            transform: floatIn ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.5)',
            opacity: floatIn ? 1 : 0,
            transition: `transform 0.5s ease ${i*0.15}s, opacity 0.5s ease ${i*0.15}s`,
          }}>
            <div style={{ filter:`drop-shadow(0 0 12px ${ITEM_COLORS[r.key] ?? '#fff'})` }}>
              <canvas
                ref={ref => { if(ref) import('../lib/itemArt.js').then(({drawItem})=>drawItem(ref,r.key)) }}
                width={64} height={64}
                style={{ imageRendering:'pixelated', display:'block' }}
              />
            </div>
            <div style={{
              fontFamily:'var(--font-thai)', fontSize:13,
              color: ITEM_COLORS[r.key] ?? '#fff',
              textShadow:`0 0 8px ${ITEM_COLORS[r.key] ?? '#fff'}`,
            }}>
              {ITEM_LABELS[r.key] ?? r.key}
            </div>
            <div style={{
              fontFamily:'var(--font-pixel)', fontSize:7,
              color:'rgba(255,255,255,0.35)',
              background:'rgba(255,255,255,0.05)',
              padding:'2px 6px',
            }}>
              {r.type==='battle' ? 'สู้' : 'บ้าน'}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkles */}
      {floatIn && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          {['⭐','✨','💫','⭐','✨','💫'].map((s,i) => (
            <div key={i} style={{
              position:'absolute',
              left:`${10+i*15}%`,
              bottom:'40%',
              fontSize:14,
              animation:`sparkle-rise ${0.8+i*0.1}s ease ${i*0.1}s both`,
            }}>{s}</div>
          ))}
        </div>
      )}

      {/* Collect button */}
      {floatIn && (
        <button
          onClick={handleCollect}
          style={{
            background:'transparent',
            border:'2px solid #FFD700',
            color:'#FFD700',
            fontFamily:'var(--font-thai)', fontSize:14,
            padding:'10px 32px',
            cursor:'pointer',
            marginTop:8,
            animation:'fadeInUp 0.4s ease 0.6s both',
          }}
        >
          รับของ!
        </button>
      )}
    </div>
  )
}
