import React, { useState, useEffect } from 'react'
import { playTone } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'

const ATTACKERS = {
  math: [{ name:'หุ่นร้าย', emoji:'🤖' }, { name:'ผีเลข', emoji:'👻' }, { name:'ปีศาจจ้อน', emoji:'😈' }],
  thai: [{ name:'โอครจ้อน', emoji:'👹' }, { name:'หมีร้าย', emoji:'🐻' }, { name:'ปีศาจ', emoji:'👿' }],
  eng:  [{ name:'Space Bug', emoji:'👾' }, { name:'Alien', emoji:'👽' }, { name:'Storm Bot', emoji:'🌪️' }],
}
const BABIES = { math:'🥚', thai:'🐣', eng:'🌟' }
const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

function QuestionDisplay({ q, subject, onSpeak }) {
  if (subject === 'thai') return (
    <div style={{ textAlign:'center', marginBottom:12 }}>
      <div style={{ fontSize:56, lineHeight:1, marginBottom:4 }}>{q.emoji}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'#FFD700' }}>{q.word}</div>
        <button onClick={onSpeak} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, padding:'4px 8px', fontSize:16, cursor:'pointer', touchAction:'manipulation' }}>🔊</button>
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:4 }}>ขึ้นต้นด้วยตัวไหน?</div>
    </div>
  )
  if (subject === 'eng') return (
    <div style={{ textAlign:'center', marginBottom:12 }}>
      <div style={{ fontSize:56, lineHeight:1, marginBottom:4 }}>{q.emoji}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'#FFD700' }}>{q.word}</div>
        <button onClick={onSpeak} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, padding:'4px 8px', fontSize:16, cursor:'pointer', touchAction:'manipulation' }}>🔊</button>
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:4 }}>starts with?</div>
    </div>
  )
  if (q.isCount) return (
    <div style={{ textAlign:'center', marginBottom:12 }}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginBottom:6 }}>มีกี่อัน?</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' }}>
        {q.objects.map((e,i) => <span key={i} style={{ fontSize:38, lineHeight:1 }}>{e}</span>)}
      </div>
    </div>
  )
  if (q.isPattern) return (
    <div style={{ textAlign:'center', marginBottom:12 }}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginBottom:6 }}>อะไรต่อไป?</div>
      <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
        {q.seq.map((e,i) => <span key={i} style={{ fontSize:30 }}>{e}</span>)}
        <span style={{ fontSize:24, border:'2px dashed rgba(255,255,255,.4)', borderRadius:8, padding:'4px 10px', color:'rgba(255,255,255,.6)', fontWeight:700 }}>?</span>
      </div>
    </div>
  )
  if (q.isWord) return (
    <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', lineHeight:1.7, marginBottom:8 }}>{q.story}</div>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:12 }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:52, color:'#FFD700', lineHeight:1 }}>{q.a}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'rgba(255,255,255,.6)' }}>{q.op}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:52, color:'#FFD700', lineHeight:1 }}>{q.b}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'rgba(255,255,255,.35)' }}>=</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:52, color:'#fff', lineHeight:1 }}>?</span>
    </div>
  )
}

export default function DefenseMode({ q, cur, total, streak, subject, onCorrect, onWrong, onNext, onSpeak }) {
  const [attacker] = useState(() => {
    const pool = ATTACKERS[subject] || ATTACKERS.math
    return pool[Math.floor(Math.random() * pool.length)]
  })

  const maxShield = total
  const [shieldHP, setShieldHP]       = useState(maxShield)
  const [answered, setAnswered]       = useState(false)
  const [attempts, setAttempts]       = useState(false)
  const [defText, setDefText]         = useState('🛡️ ปกป้องด้วยความรู้!')
  const [shieldPulse, setShieldPulse] = useState(false)
  const [shieldHit, setShieldHit]     = useState(false)
  const [attackerPush, setAttackerPush] = useState(false)
  const babyEmoji = BABIES[subject] || '🥚'

  useEffect(() => {
    setAnswered(false); setAttempts(0)
    if (cur > 0) setDefText('❓ ปกป้องด้วยความรู้!')
  }, [cur])

  const check = (val) => {
    if (answered) return
    if (val === q.answer) {
      setAnswered(true)
      const { earned, isCrit } = onCorrect()
      setShieldPulse(true); setTimeout(() => setShieldPulse(false), 500)
      setAttackerPush(true); setTimeout(() => setAttackerPush(false), 450)
      if (isCrit) { playTone('streak'); spawnConfetti(4); setDefText(`💥 คอมโบ! ป้องกันสำเร็จ! +${earned} XP`) }
      else         { playTone('block');                   setDefText(`🛡️ ป้องกันสำเร็จ! +${earned} XP`) }
    } else {
      const na = (attempts || 0) + 1; setAttempts(na)
      if (na === 1) { onWrong(); setDefText('💨 พลาดแล้ว! ลองอีกครั้ง') }
      else if (na === 2) setDefText('🤔 เกือบแล้ว!')
      else {
        setAnswered(true)
        setShieldHP(h => Math.max(0, h - 1))
        setShieldHit(true); setTimeout(() => setShieldHit(false), 400)
        setDefText(`💥 ${attacker.name} ทะลุเข้ามา! -1 โล่`)
      }
      playTone('wrong')
    }
  }

  return (
    <div style={{ minHeight:'100%', background:BG[subject]||'#1a1040', display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif' }}>

      {/* Defense arena */}
      <div style={{ padding:'14px 18px 8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>🛡️ ปกป้องให้ได้!</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:13, color:'rgba(255,255,255,.5)' }}>{cur+1}/{total}</div>
        </div>

        {/* Arena: attacker → shield ← baby */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 4px' }}>
          {/* Attacker */}
          <div style={{ fontSize:42, lineHeight:1,
            animation: attackerPush ? 'battle-shake .4s ease' : 'none',
            filter: attackerPush ? 'brightness(.5)' : 'none',
            transition:'filter .2s' }}>
            {attacker.emoji}
          </div>

          {/* Arrow */}
          <div style={{ fontSize:18, color:'rgba(255,100,100,.7)', fontWeight:700 }}>→→</div>

          {/* Shield */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:36, lineHeight:1,
              animation: shieldPulse ? 'adv-shield .5s ease' : shieldHit ? 'battle-shake .35s ease' : 'none',
              filter: shieldPulse ? 'drop-shadow(0 0 12px #7F77DD)' : 'none',
              transition:'filter .2s' }}>🛡️</div>
            {/* Shield HP pips */}
            <div style={{ display:'flex', gap:3 }}>
              {Array.from({ length: maxShield }).map((_,i) => (
                <div key={i} style={{
                  width:8, height:8, borderRadius:'50%',
                  background: i < shieldHP ? '#7F77DD' : 'rgba(255,255,255,.15)',
                  transition:'background .3s',
                }} />
              ))}
            </div>
          </div>

          {/* Baby */}
          <div style={{ fontSize:36, lineHeight:1,
            animation: shieldHit && shieldHP <= 1 ? 'battle-shake .4s ease' : 'none' }}>
            {babyEmoji}
          </div>
        </div>
      </div>

      {/* Defense text */}
      <div style={{ margin:'0 16px 6px', background:'rgba(255,255,255,.92)', borderRadius:12, padding:'10px 16px' }}>
        <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.5 }}>▷ {defText}</div>
      </div>

      {/* Streak */}
      {streak >= 3 && (
        <div style={{ textAlign:'center', marginBottom:4 }}>
          <span style={{ background:'var(--amber)', color:'var(--amber-d)', borderRadius:12, padding:'2px 12px', fontSize:12, fontWeight:700, animation:'streak-bounce .55s ease' }}>
            🔥 {streak} Combo!
          </span>
        </div>
      )}

      {/* Question card */}
      <div style={{ margin:'4px 16px 8px', background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.2)', borderRadius:16, padding:'14px 14px' }}>
        <QuestionDisplay q={q} subject={subject} onSpeak={onSpeak} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {q.choices.map((c,i) => (
            <button key={i} onClick={() => check(c)} disabled={answered}
              style={{
                background: answered && c===q.answer ? 'rgba(29,158,117,.35)' : 'rgba(255,255,255,.12)',
                color:'#fff',
                border: answered && c===q.answer ? '2px solid #1D9E75' : '1.5px solid rgba(255,255,255,.25)',
                borderRadius:12, padding:'13px 8px',
                fontFamily:"'Fredoka One',cursive", fontSize:24,
                cursor:answered?'default':'pointer', fontWeight:700, touchAction:'manipulation', transition:'all .12s',
              }}>{c}</button>
          ))}
        </div>
        {answered && (
          <button onClick={onNext} style={{ width:'100%', marginTop:8, background:'#7F77DD', color:'#fff', border:'none', borderRadius:10, padding:12, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>
            {cur+1>=total ? 'ดูผล ✨' : 'ปกป้องต่อ 🛡️'}
          </button>
        )}
        {!answered && (attempts||0) >= 3 && (
          <button onClick={onNext} style={{ width:'100%', marginTop:8, background:'rgba(255,255,255,.18)', color:'rgba(255,255,255,.8)', border:'none', borderRadius:10, padding:12, fontFamily:'Mitr,sans-serif', fontSize:14, cursor:'pointer' }}>
            {cur+1>=total ? 'ดูผล ✨' : 'ต่อไป →'}
          </button>
        )}
        <div style={{ textAlign:'right', marginTop:6, fontSize:10, color:'rgba(255,255,255,.4)' }}>🛡️ โหมดป้องกัน</div>
      </div>
    </div>
  )
}
