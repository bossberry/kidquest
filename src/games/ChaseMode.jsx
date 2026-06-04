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

// Distance: 0 = target escaped, 100 = caught
const START_DIST = 30   // start 30% behind
const GAIN = 14         // close by 14% per correct
const LOSE = 10         // widen by 10% per wrong

export default function ChaseMode({ q, cur, total, streak, subject, onCorrect, onWrong, onNext, onSpeak, eggStats }) {
  const [target] = useState(() => {
    const pool = TARGETS[subject] || TARGETS.math
    return pool[Math.floor(Math.random() * pool.length)]
  })

  const [dist, setDist]         = useState(START_DIST)
  const [answered, setAnswered] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [chaseText, setChaseText] = useState(`${target.emoji} ${target.name} กำลังหนี!`)
  const [dashPlayer, setDashPlayer] = useState(false)
  const [targetFlee, setTargetFlee] = useState(false)

  useEffect(() => {
    setAnswered(false); setAttempts(0)
    if (cur > 0) setChaseText('❓ ตอบให้เร็ว!')
  }, [cur])

  const check = (val) => {
    if (answered) return
    if (val === q.answer) {
      setAnswered(true)
      const { earned, isCrit } = onCorrect()
      const gain = isCrit ? GAIN * 1.5 : GAIN
      setDist(d => Math.min(100, d + gain))
      setDashPlayer(true); setTimeout(() => setDashPlayer(false), 450)
      if (isCrit) { playTone('streak'); spawnConfetti(4); setChaseText(`💨 เร็วมาก! Combo! +${earned} XP`) }
      else         { playTone('dash');                     setChaseText(`🏃 ตามทัน! +${earned} XP`) }
      setTimeout(() => playTone('item'), 200) // egg sparkle growth sound
    } else {
      const na = attempts + 1; setAttempts(na)
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
  if (caught && !answered) {
    // auto-advance briefly for celebration
  }

  return (
    <div style={{ minHeight:'100%', background:BG[subject]||'#1a1040', display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif' }}>

      {/* Chase track */}
      <div style={{ padding:'14px 18px 8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>🏃 วิ่งไล่จับ!</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:13, color:'rgba(255,255,255,.5)' }}>{cur+1}/{total}</div>
        </div>

        {/* Track with player + target emojis */}
        <div style={{ position:'relative', height:56, background:'rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden', marginBottom:6 }}>
          {/* Progress fill */}
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${dist}%`, background:'rgba(127,119,221,.35)', transition:'width .4s ease', borderRadius:14 }} />
          {/* Egg — the chasing hero */}
          {eggStats ? (
            <EggCanvas stats={eggStats} width={34} height={40} style={{
              position:'absolute', left:`${Math.max(2, dist - 10)}%`, top:'50%', transform:'translateY(-50%)',
              transition:'left .4s ease',
              animation: dashPlayer ? 'adv-dash .4s ease' : 'none',
              display:'block',
            }} />
          ) : (
            <div style={{
              position:'absolute', left:`${Math.max(2, dist - 12)}%`, top:'50%', transform:'translateY(-50%)',
              fontSize:28, transition:'left .4s ease',
              animation: dashPlayer ? 'adv-dash .4s ease' : 'none',
            }}>🦸</div>
          )}
          {/* Target emoji */}
          <div style={{
            position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
            fontSize:30,
            animation: targetFlee ? 'battle-shake .4s ease' : caught ? 'victory-bounce .55s ease' : 'none',
          }}>{caught ? '🎉' : target.emoji}</div>
        </div>

        {/* Distance label */}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,.4)' }}>
          <span>เริ่ม</span>
          <span style={{ color: dist >= 80 ? '#FFD700' : 'rgba(255,255,255,.4)' }}>{Math.round(dist)}% ใกล้แล้ว!</span>
          <span>จับได้!</span>
        </div>
      </div>

      {/* Chase text */}
      <div style={{ margin:'0 16px 6px', background:'rgba(255,255,255,.92)', borderRadius:12, padding:'10px 16px' }}>
        <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.5 }}>▷ {chaseText}</div>
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
            {cur+1>=total ? 'ดูผล ✨' : 'วิ่งต่อ 🏃'}
          </button>
        )}
        {!answered && attempts >= 3 && (
          <button onClick={onNext} style={{ width:'100%', marginTop:8, background:'rgba(255,255,255,.18)', color:'rgba(255,255,255,.8)', border:'none', borderRadius:10, padding:12, fontFamily:'Mitr,sans-serif', fontSize:14, cursor:'pointer' }}>
            {cur+1>=total ? 'ดูผล ✨' : 'ต่อไป →'}
          </button>
        )}
        <div style={{ textAlign:'right', marginTop:6, fontSize:10, color:'rgba(255,255,255,.4)' }}>🏃 โหมดวิ่งไล่จับ</div>
      </div>
    </div>
  )
}
