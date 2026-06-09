import React, { useState, useEffect } from 'react'
import { playTone } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import EggCanvas from '../components/EggCanvas.jsx'

const TARGETS = {
  math: [{ name:'เลขวิ่งหนี', emoji:'🔢' }, { name:'ผลลัพธ์หาย', emoji:'💰' }, { name:'คำตอบหนี', emoji:'📦' }],
  thai: [{ name:'ตัวอักษรหนี', emoji:'🎁' }, { name:'คำหนี', emoji:'🎀' }, { name:'ดอกไม้', emoji:'🌸' }],
  eng:  [{ name:'Star Letter', emoji:'⭐' }, { name:'Wild Rocket', emoji:'🚀' }, { name:'Word Gem', emoji:'💎' }],
}
const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

function QuestionHint({ q, subject, onSpeak }) {
  const btn = {
    background:'rgba(255,255,255,.12)', border:'none', borderRadius:8,
    padding:'4px 10px', fontSize:13, cursor:'pointer', color:'rgba(255,255,255,.85)',
    fontFamily:'Mitr,sans-serif', touchAction:'manipulation', flexShrink:0,
  }
  if (subject === 'thai') return (
    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
      <span style={{ fontSize:28, lineHeight:1 }}>{q.emoji}</span>
      <button onClick={onSpeak} style={btn}>🔊 ฟังอีกครั้ง</button>
    </div>
  )
  if (subject === 'eng') return (
    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
      <span style={{ fontSize:28, lineHeight:1 }}>{q.emoji}</span>
      <button onClick={onSpeak} style={btn}>🔊 Listen again</button>
    </div>
  )
  if (q.isCount) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:9, color:'rgba(255,255,255,.5)', marginBottom:2 }}>มีกี่อัน?</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:3, justifyContent:'center' }}>
        {q.objects.map((e,i) => <span key={i} style={{ fontSize:20, lineHeight:1 }}>{e}</span>)}
      </div>
    </div>
  )
  if (q.isPattern) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:9, color:'rgba(255,255,255,.5)', marginBottom:2 }}>อะไรต่อไป?</div>
      <div style={{ display:'flex', gap:3, justifyContent:'center', alignItems:'center', flexWrap:'wrap' }}>
        {q.seq.map((e,i) => <span key={i} style={{ fontSize:16 }}>{e}</span>)}
        <span style={{ fontSize:14, border:'2px dashed rgba(255,255,255,.35)', borderRadius:4, padding:'1px 5px', color:'rgba(255,255,255,.5)', fontWeight:700 }}>?</span>
      </div>
    </div>
  )
  if (q.isWord) return (
    <div style={{ fontSize:11, color:'rgba(255,255,255,.75)', lineHeight:1.4, textAlign:'center', maxWidth:240 }}>{q.story}</div>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:34, color:'#FFD700', lineHeight:1 }}>{q.a}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color:'rgba(255,255,255,.5)' }}>{q.op}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:34, color:'#FFD700', lineHeight:1 }}>{q.b}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color:'rgba(255,255,255,.3)' }}>=</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:34, color:'#fff', lineHeight:1 }}>?</span>
    </div>
  )
}

const START_DIST = 30
const GAIN = 14
const LOSE = 10

export default function ChaseMode({ q, cur, total, streak, subject, onCorrect, onWrong, onNext, onSpeak, eggStats }) {
  const [target] = useState(() => {
    const pool = TARGETS[subject] || TARGETS.math
    return pool[Math.floor(Math.random() * pool.length)]
  })

  const [dist, setDist]             = useState(START_DIST)
  const [answered, setAnswered]     = useState(false)
  const [attempts, setAttempts]     = useState(0)
  const [chaseText, setChaseText]   = useState('🏃 ตามจับให้ได้!')
  const [dashPlayer, setDashPlayer] = useState(false)
  const [targetFlee, setTargetFlee] = useState(false)
  const [hitFlash, setHitFlash]     = useState(false)
  const [missIdx, setMissIdx]       = useState(-1)

  useEffect(() => {
    setAnswered(false); setAttempts(0); setMissIdx(-1)
    if (cur > 0) setChaseText('⚔️ ตอบให้เร็ว!')
  }, [cur])

  const check = (val, idx) => {
    if (answered) return
    if (val === q.answer) {
      setAnswered(true)
      const { earned, isCrit } = onCorrect()
      const gain = isCrit ? GAIN * 1.5 : GAIN
      setDist(d => Math.min(100, d + gain))
      setDashPlayer(true); setTimeout(() => setDashPlayer(false), 450)
      setHitFlash(true); setTimeout(() => setHitFlash(false), 280)
      if (isCrit) { playTone('streak'); spawnConfetti(4); setChaseText(`💨 เร็วมาก! Combo! +${earned} XP`) }
      else         { playTone('dash');                    setChaseText(`🏃 ตามทัน! +${earned} XP`) }
      setTimeout(() => playTone('item'), 200)
    } else {
      const na = attempts + 1; setAttempts(na)
      setMissIdx(idx); setTimeout(() => setMissIdx(-1), 520)
      if (na === 1) { onWrong(); setChaseText('💨 พลาดแล้ว! หนีไปอีก') }
      else if (na === 2) setChaseText('🤔 เกือบแล้ว!')
      else {
        setAnswered(true)
        setDist(d => Math.max(0, d - LOSE))
        setTargetFlee(true); setTimeout(() => setTargetFlee(false), 450)
        setChaseText(`😅 ${target.name} หนีไปอีก...`)
      }
      playTone('wrong')
    }
  }

  const caught = dist >= 100

  return (
    <div style={{
      flex:1, minHeight:0,
      background: BG[subject] || '#1a1040',
      display:'flex', flexDirection:'column',
      fontFamily:'Mitr,sans-serif',
      position:'relative', overflow:'hidden',
    }}>

      {/* Hit flash overlay */}
      {hitFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(127,119,221,.12)', pointerEvents:'none', zIndex:50, animation:'crit-flash .28s ease forwards' }} />
      )}

      {/* ── TOP: ENEMY + CHASE TRACK ─────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 16px 4px', gap:2, flexShrink:0 }}>

        {/* Counter + combo row */}
        <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
          {streak >= 2
            ? <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:11, color:'#FFD700', animation:'streak-bounce .55s ease' }}>
                {streak >= 4 ? '💥' : streak >= 3 ? '🔥' : '✨'} {streak}x
              </span>
            : <span />
          }
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:11, color:'rgba(255,255,255,.3)' }}>{cur+1}/{total}</div>
        </div>

        {/* Target — large, centered, idle or flee/caught animation */}
        <div style={{
          fontSize: 120, lineHeight:1, textAlign:'center',
          animation: caught
            ? 'victory-bounce .55s ease'
            : targetFlee
            ? 'battle-shake .4s ease'
            : 'enemy-idle 2s ease-in-out infinite',
          filter: caught ? 'drop-shadow(0 0 18px gold)' : 'none',
          transition: 'filter .2s',
        }}>
          {caught ? '🎉' : target.emoji}
        </div>

        {/* Target name */}
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:11, color:'rgba(255,255,255,.4)', marginTop:-2 }}>
          {caught ? 'จับได้แล้ว!' : target.name}
        </div>

        {/* Chase track — slim, egg slides along it */}
        <div style={{ width:'100%', position:'relative', height:32, background:'rgba(255,255,255,.07)', borderRadius:16, overflow:'hidden', marginTop:6 }}>
          {/* Progress fill */}
          <div style={{
            position:'absolute', left:0, top:0, bottom:0,
            width:`${dist}%`,
            background: dist >= 80 ? 'rgba(255,215,0,.35)' : 'rgba(127,119,221,.3)',
            transition:'width .4s ease', borderRadius:16,
          }} />

          {/* Egg on track */}
          {eggStats ? (
            <EggCanvas stats={eggStats} width={28} height={32} style={{
              position:'absolute',
              left:`${Math.max(1, Math.min(dist - 9, 88))}%`,
              top:0, bottom:0,
              transition:'left .4s ease',
              animation: dashPlayer ? 'adv-dash .4s ease' : 'none',
              display:'block',
            }} />
          ) : (
            <div style={{
              position:'absolute',
              left:`${Math.max(2, Math.min(dist - 10, 86))}%`,
              top:'50%', transform:'translateY(-50%)',
              fontSize:22, lineHeight:1,
              transition:'left .4s ease',
              animation: dashPlayer ? 'adv-dash .4s ease' : 'none',
            }}>🏃</div>
          )}

          {/* Finish flag */}
          <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontSize:16, lineHeight:1 }}>🏁</div>

          {/* Near label */}
          {dist >= 75 && !caught && (
            <div style={{
              position:'absolute', left:'50%', top:'50%',
              transform:'translate(-50%,-50%)',
              fontFamily:"'Fredoka One',cursive", fontSize:9,
              color:'#FFD700', pointerEvents:'none',
            }}>⚡ ใกล้แล้ว!</div>
          )}
        </div>
      </div>

      {/* ── BATTLE LOG ─────────────────────────────────────────────────────── */}
      <div style={{ margin:'4px 12px', background:'rgba(0,0,0,.45)', borderRadius:8, padding:'5px 12px', borderLeft:'3px solid rgba(127,119,221,.6)', flexShrink:0 }}>
        <div style={{ fontSize:13, color:'#fff', lineHeight:1.4 }}>▷ {chaseText}</div>
      </div>

      {/* ── QUESTION HINT (tiny, no card) ─────────────────────────────────── */}
      {!answered && (
        <div style={{ padding:'3px 12px 2px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:36, flexShrink:0 }}>
          <QuestionHint q={q} subject={subject} onSpeak={onSpeak} />
        </div>
      )}

      {/* ── MOVE PANEL (bottom flex:1, 2×2 grid) ─────────────────────────── */}
      <div style={{ flex:1, padding:'2px 12px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:0 }}>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flex:1, minHeight:0 }}>
          {q.choices.map((c, i) => {
            const isCorrect = answered && c === q.answer
            const isMiss    = missIdx === i
            const large     = typeof c === 'string' && c.length <= 2
            return (
              <button key={i} onClick={() => check(c, i)} disabled={answered}
                style={{
                  background: isCorrect ? 'rgba(29,158,117,.35)' : isMiss ? 'rgba(255,60,60,.14)' : 'rgba(255,255,255,.11)',
                  color: '#fff',
                  border: isCorrect ? '2px solid #1D9E75' : isMiss ? '1.5px solid rgba(255,60,60,.45)' : '1.5px solid rgba(255,255,255,.2)',
                  borderRadius: 16,
                  fontFamily: "'Fredoka One',cursive",
                  fontSize: large ? 44 : 36,
                  cursor: answered ? 'default' : 'pointer',
                  fontWeight: 700,
                  touchAction: 'manipulation',
                  transition: 'all .12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: isMiss ? 'miss-fizzle .5s ease forwards' : 'none',
                  userSelect: 'none', WebkitUserSelect: 'none',
                }}
              >{c}</button>
            )
          })}
        </div>

        {answered && (
          <button onClick={onNext} style={{
            background:'#7F77DD', color:'#fff', border:'none',
            borderRadius:12, padding:'13px 0',
            fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', flexShrink:0,
          }}>
            {cur+1>=total ? 'ดูผล ✨' : 'วิ่งต่อ 🏃'}
          </button>
        )}
        {!answered && attempts >= 3 && (
          <button onClick={onNext} style={{
            background:'rgba(255,255,255,.14)', color:'rgba(255,255,255,.7)',
            border:'none', borderRadius:12, padding:'12px 0',
            fontFamily:'Mitr,sans-serif', fontSize:14, cursor:'pointer', flexShrink:0,
          }}>
            {cur+1>=total ? 'ดูผล ✨' : 'ต่อไป →'}
          </button>
        )}
      </div>
    </div>
  )
}
