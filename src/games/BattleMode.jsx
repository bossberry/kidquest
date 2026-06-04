import React, { useState, useEffect } from 'react'
import { playTone } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'

const ENEMIES = {
  math: [{ name:'หุ่นยนต์เลข', emoji:'🤖' }, { name:'ผีคณิต', emoji:'👻' }, { name:'ปีศาจจ้อน', emoji:'😈' }, { name:'มังกรเลข', emoji:'🐲' }],
  thai: [{ name:'โอครจ้อน', emoji:'👺' }, { name:'หมีดุ', emoji:'🐻' }, { name:'มังกรไทย', emoji:'🐉' }, { name:'เสือดุ', emoji:'🐯' }],
  eng:  [{ name:'Space Bug', emoji:'👾' }, { name:'Alien', emoji:'👽' }, { name:'Storm', emoji:'⛈️' }, { name:'Dark Bot', emoji:'🦾' }],
}

const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

function HPBar({ current, max, color }) {
  const pct = Math.max(0, (current/max)*100)
  const bg = color === 'player'
    ? (pct > 50 ? '#1D9E75' : pct > 20 ? '#EF9F27' : '#E24B4A')
    : '#E24B4A'
  return (
    <div style={{ flex:1, height:8, background:'rgba(255,255,255,.15)', borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:'100%', background:bg, width:`${pct}%`, transition:'width .35s ease', borderRadius:20 }} />
    </div>
  )
}

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
  // Math
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
      <div style={{ display:'flex', gap:6, justifyContent:'center', alignItems:'center', flexWrap:'wrap' }}>
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

export default function BattleMode({ q, cur, total, streak, subject, onCorrect, onWrong, onNext, onSpeak }) {
  const [enemy] = useState(() => {
    const pool = ENEMIES[subject] || ENEMIES.math
    return pool[Math.floor(Math.random() * pool.length)]
  })
  const maxHP = total * 8
  const pMaxHP = Math.ceil(maxHP * 0.75)
  const dmgPerHit   = Math.ceil(maxHP / total)
  const enemyDmgVal = Math.ceil(pMaxHP / (total * 0.7))

  const [enemyHP, setEnemyHP]     = useState(maxHP)
  const [playerHP, setPlayerHP]   = useState(pMaxHP)
  const [answered, setAnswered]   = useState(false)
  const [attempts, setAttempts]   = useState(0)
  const [hitFlash, setHitFlash]   = useState(false)
  const [playerShake, setPlayerShake] = useState(false)
  const [battleText, setBattleText]   = useState(`${enemy.emoji} ${enemy.name} ปรากฏตัว!`)
  const [dmgFloat, setDmgFloat]       = useState(null)
  const [jumpPlayer, setJumpPlayer]   = useState(false)

  useEffect(() => {
    setAnswered(false); setAttempts(0)
    if (cur > 0) setBattleText('❓ โจมตีด้วยความรู้!')
  }, [cur])

  const check = (val) => {
    if (answered) return
    if (val === q.answer) {
      setAnswered(true)
      const { earned, isCrit } = onCorrect()
      const dmg = isCrit ? Math.ceil(dmgPerHit * 1.5) : dmgPerHit
      setEnemyHP(h => Math.max(0, h - dmg))
      setHitFlash(true); setTimeout(() => setHitFlash(false), 350)
      setJumpPlayer(true); setTimeout(() => setJumpPlayer(false), 500)
      setDmgFloat({ side:'enemy', val:dmg, crit:isCrit }); setTimeout(() => setDmgFloat(null), 900)
      if (isCrit) { playTone('streak'); spawnConfetti(5); setBattleText(`💥 คริติคอล! -${dmg} HP! +${earned} XP`) }
      else         { playTone('correct');                  setBattleText(`⚔️ โจมตี! -${dmg} HP! +${earned} XP`) }
    } else {
      const na = attempts + 1; setAttempts(na)
      if (na === 1) { onWrong(); setBattleText('💨 พลาด! ลองอีกครั้ง') }
      else if (na === 2) setBattleText('🤔 เกือบแล้ว! ดูดีๆ')
      else {
        setAnswered(true)
        setPlayerHP(h => Math.max(0, h - enemyDmgVal))
        setPlayerShake(true); setTimeout(() => setPlayerShake(false), 400)
        setDmgFloat({ side:'player', val:enemyDmgVal, crit:false }); setTimeout(() => setDmgFloat(null), 900)
        setBattleText(`👊 ${enemy.name} โจมตีกลับ! -${enemyDmgVal} HP`)
      }
      playTone('wrong')
    }
  }

  return (
    <div style={{ minHeight:'100%', background:BG[subject]||'#1a1040', display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif' }}>

      {/* Enemy row */}
      <div style={{ padding:'14px 18px 6px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ fontSize:52, lineHeight:1, position:'relative',
          filter: hitFlash ? 'brightness(3) sepia(1) saturate(5) hue-rotate(-20deg)' : 'none',
          transition:'filter .15s' }}>
          {enemy.emoji}
          {dmgFloat?.side==='enemy' && (
            <div style={{ position:'absolute', top:'-18px', left:'50%', transform:'translateX(-50%)',
              fontFamily:"'Fredoka One',cursive", fontSize:dmgFloat.crit?22:17,
              color:dmgFloat.crit?'#FFD700':'#ff6b6b',
              animation:'dmg-float 1s ease-out forwards', pointerEvents:'none', fontWeight:900, whiteSpace:'nowrap' }}>
              -{dmgFloat.val}{dmgFloat.crit?'💥':''}
            </div>
          )}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:13, color:'#fff', marginBottom:4 }}>{enemy.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <HPBar current={enemyHP} max={maxHP} color="enemy" />
            <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', whiteSpace:'nowrap' }}>{Math.max(0,enemyHP)}/{maxHP}</div>
          </div>
        </div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:14, color:'rgba(255,255,255,.5)', flexShrink:0 }}>{cur+1}/{total}</div>
      </div>

      {/* Player row */}
      <div style={{ padding:'0 18px 6px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:28, position:'relative',
          animation: playerShake ? 'battle-shake .35s ease' : jumpPlayer ? 'adv-jump .45s ease' : 'none' }}>
          🦸
          {dmgFloat?.side==='player' && (
            <div style={{ position:'absolute', top:'-16px', left:'50%', transform:'translateX(-50%)',
              fontFamily:"'Fredoka One',cursive", fontSize:16, color:'#ff6b6b',
              animation:'dmg-float 1s ease-out forwards', pointerEvents:'none' }}>
              -{dmgFloat.val}
            </div>
          )}
        </div>
        <HPBar current={playerHP} max={pMaxHP} color="player" />
        <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', whiteSpace:'nowrap' }}>{Math.max(0,playerHP)}/{pMaxHP}</div>
      </div>

      {/* Battle text */}
      <div style={{ margin:'0 16px 6px', background:'rgba(255,255,255,.92)', borderRadius:12, padding:'10px 16px' }}>
        <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.5 }}>▷ {battleText}</div>
      </div>

      {/* Streak badge */}
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
            {cur+1>=total ? 'ดูผล ✨' : 'โจมตีต่อ ⚔️'}
          </button>
        )}
        {!answered && attempts >= 3 && (
          <button onClick={onNext} style={{ width:'100%', marginTop:8, background:'rgba(255,255,255,.18)', color:'rgba(255,255,255,.8)', border:'none', borderRadius:10, padding:12, fontFamily:'Mitr,sans-serif', fontSize:14, cursor:'pointer' }}>
            {cur+1>=total ? 'ดูผล ✨' : 'ต่อไป →'}
          </button>
        )}
        <div style={{ textAlign:'right', marginTop:6, fontSize:10, color:'rgba(255,255,255,.4)' }}>⚔️ โหมดต่อสู้</div>
      </div>
    </div>
  )
}
