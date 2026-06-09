import React, { useState, useEffect } from 'react'
import { playTone } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import EggCanvas from '../components/EggCanvas.jsx'

const ATTACKERS = {
  math: [{ name:'หุ่นร้าย', emoji:'🤖' }, { name:'ผีเลข', emoji:'👻' }, { name:'ปีศาจจ้อน', emoji:'😈' }],
  thai: [{ name:'โอครจ้อน', emoji:'👹' }, { name:'หมีร้าย', emoji:'🐻' }, { name:'ปีศาจ', emoji:'👿' }],
  eng:  [{ name:'Space Bug', emoji:'👾' }, { name:'Alien', emoji:'👽' }, { name:'Storm Bot', emoji:'🌪️' }],
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

export default function DefenseMode({ q, cur, total, streak, subject, onCorrect, onWrong, onNext, onSpeak, eggStats }) {
  const [attacker] = useState(() => {
    const pool = ATTACKERS[subject] || ATTACKERS.math
    return pool[Math.floor(Math.random() * pool.length)]
  })

  const maxShield = total
  const [shieldHP, setShieldHP]         = useState(maxShield)
  const [answered, setAnswered]         = useState(false)
  const [attempts, setAttempts]         = useState(0)
  const [defText, setDefText]           = useState(`${attacker.emoji} ปรากฏตัว!`)
  const [shieldPulse, setShieldPulse]   = useState(false)
  const [shieldHit, setShieldHit]       = useState(false)
  const [attackerPush, setAttackerPush] = useState(false)
  const [hitFlash, setHitFlash]         = useState(false)
  const [missIdx, setMissIdx]           = useState(-1)

  useEffect(() => {
    setAnswered(false); setAttempts(0); setMissIdx(-1)
    if (cur > 0) setDefText('⚔️ เลือกท่าป้องกัน!')
  }, [cur])

  const check = (val, idx) => {
    if (answered) return
    if (val === q.answer) {
      setAnswered(true)
      const { earned, isCrit } = onCorrect()
      setShieldPulse(true); setTimeout(() => setShieldPulse(false), 500)
      setAttackerPush(true); setTimeout(() => setAttackerPush(false), 450)
      setHitFlash(true); setTimeout(() => setHitFlash(false), 300)
      if (isCrit) { playTone('streak'); spawnConfetti(4); setDefText(`💥 คอมโบ! ป้องกันสำเร็จ! +${earned} XP`) }
      else         { playTone('block');                   setDefText(`🛡️ ป้องกันสำเร็จ! +${earned} XP`) }
      setTimeout(() => playTone('item'), 200)
    } else {
      const na = attempts + 1; setAttempts(na)
      setMissIdx(idx); setTimeout(() => setMissIdx(-1), 520)
      if (na === 1) { onWrong(); setDefText('💨 พลาดแล้ว! ลองอีกครั้ง') }
      else if (na === 2) setDefText('🤔 เกือบแล้ว!')
      else {
        setAnswered(true)
        setShieldHP(h => Math.max(0, h - 1))
        setShieldHit(true); setTimeout(() => setShieldHit(false), 400)
        setDefText(`💥 ${attacker.name} ทะลุเข้ามา!`)
      }
      playTone('wrong')
    }
  }

  return (
    <div style={{
      height:'100%', minHeight:'100%',
      background: BG[subject] || '#1a1040',
      display:'flex', flexDirection:'column',
      fontFamily:'Mitr,sans-serif',
      position:'relative', overflow:'hidden',
    }}>

      {/* Hit flash overlay */}
      {hitFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(127,119,221,.12)', pointerEvents:'none', zIndex:50, animation:'crit-flash .3s ease forwards' }} />
      )}

      {/* ── TOP: ENEMY → SHIELD → EGG ────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 16px 4px', gap:1, flexShrink:0 }}>

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

        {/* Attacker — large idle */}
        <div style={{
          fontSize: 120, lineHeight:1,
          animation: attackerPush ? 'battle-shake .4s ease' : 'enemy-idle 2.2s ease-in-out infinite',
          filter: attackerPush ? 'brightness(.4)' : 'none',
          transition: 'filter .2s',
        }}>
          {attacker.emoji}
        </div>

        {/* Arrow */}
        <div style={{ fontSize:12, color:'rgba(255,80,80,.55)', fontWeight:700, lineHeight:1, marginTop:1 }}>↓</div>

        {/* Shield + HP pips */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <div style={{
            fontSize:40, lineHeight:1,
            animation: shieldPulse ? 'adv-shield .5s ease' : shieldHit ? 'battle-shake .35s ease' : 'none',
            filter: shieldPulse ? 'drop-shadow(0 0 14px #7F77DD)' : 'none',
            transition: 'filter .2s',
          }}>🛡️</div>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({ length: maxShield }).map((_,i) => (
              <div key={i} style={{
                width:8, height:8, borderRadius:'50%',
                background: i < shieldHP ? '#7F77DD' : 'rgba(255,255,255,.12)',
                transition:'background .3s',
              }} />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ fontSize:12, color:'rgba(127,119,221,.45)', fontWeight:700, lineHeight:1, marginTop:1 }}>↓</div>

        {/* Egg — the hero being protected */}
        {eggStats ? (
          <EggCanvas stats={eggStats} width={56} height={66} style={{
            animation: shieldHit ? 'eggShake .4s ease' : shieldPulse ? 'eggBounce .45s ease' : 'egg-idle 3s ease-in-out infinite',
            filter: shieldPulse ? 'drop-shadow(0 0 10px gold)' : 'none',
            transition: 'filter .2s', display:'block',
          }} />
        ) : (
          <div style={{ fontSize:44, lineHeight:1, animation: shieldHit ? 'eggShake .4s ease' : 'egg-idle 3s ease-in-out infinite' }}>🥚</div>
        )}
      </div>

      {/* ── BATTLE LOG ─────────────────────────────────────────────────────── */}
      <div style={{ margin:'4px 12px', background:'rgba(0,0,0,.45)', borderRadius:8, padding:'5px 12px', borderLeft:'3px solid rgba(127,119,221,.6)', flexShrink:0 }}>
        <div style={{ fontSize:13, color:'#fff', lineHeight:1.4 }}>▷ {defText}</div>
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
            {cur+1>=total ? 'ดูผล ✨' : 'ปกป้องต่อ 🛡️'}
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
