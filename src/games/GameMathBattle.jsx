import React, { useState, useRef, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { MATH_WORDS, PATTERN_SETS, LEVELS, shuffle } from '../config/gameConfig.js'
import { playTone } from '../lib/audio.js'
import { showToast, spawnConfetti } from '../components/Toasts.jsx'

// ── Enemies ──────────────────────────────────────────────────────────────────
const MATH_ENEMIES = [
  { name: 'หุ่นยนต์เลข', emoji: '🤖', maxHP: 64 },
  { name: 'ผีตัวเลข',     emoji: '👻', maxHP: 64 },
  { name: 'ปีศาจคณิต',    emoji: '😈', maxHP: 64 },
  { name: 'มังกรจ้อน',    emoji: '🐲', maxHP: 64 },
]

// ── Question generator (mirrors GameMath.genQ) ───────────────────────────────
const COUNTABLES = ['🥚','⭐','🍎','🐟','🌸','🏀','🍬','💎']

function genQ(lv) {
  if (lv?.op === 'count') {
    const emoji = COUNTABLES[Math.floor(Math.random() * COUNTABLES.length)]
    const n = Math.floor(Math.random() * 5) + 1
    const w = new Set()
    while (w.size < 3) { const v = Math.floor(Math.random()*5)+1; if(v!==n) w.add(v) }
    return { objects: Array(n).fill(emoji), answer: n, choices: shuffle([n,...w]), isCount: true }
  }
  if (lv?.op === 'pattern') {
    const set = PATTERN_SETS.AB[Math.floor(Math.random() * PATTERN_SETS.AB.length)]
    const si = Math.random() < 0.5 ? 0 : 1
    const seq = Array.from({ length: 5 }, (_, i) => set[(si+i)%2])
    const answer = set[(si+5)%2]
    const others = PATTERN_SETS.AB.filter(s => s[0] !== set[0])
    const distractors = shuffle([set[(si+1)%2], ...others.flatMap(s=>s)].filter(e=>e!==answer)).slice(0,3)
    return { seq, answer, choices: shuffle([answer,...distractors]), isPattern: true }
  }
  if (lv?.op === 'word') {
    const pool = shuffle([...MATH_WORDS.filter(q => lv?.subtype==='comparison' ? q.comparison : !q.comparison)])
    const q = pool[0]
    const w = new Set(); while(w.size<3){const v=q.ans+(Math.floor(Math.random()*5)-2);if(v!==q.ans&&v>=0)w.add(v)}
    return { a:q.a,b:q.b,op:q.op, answer:q.ans, choices:shuffle([q.ans,...w]), story:q.story, isWord:true }
  }
  const mx = lv?.range?.[1] || 10
  let a, b, ans, op = '+'
  if (lv?.op === 'sub' || (lv?.op === 'mixed' && Math.random() > 0.5)) {
    op='-'; a=Math.floor(Math.random()*mx)+2; b=Math.floor(Math.random()*a)+1; ans=a-b
  } else {
    a=Math.floor(Math.random()*mx)+1; b=Math.floor(Math.random()*(mx-a+1))+1; ans=a+b
  }
  const w = new Set(); while(w.size<3){const v=ans+(Math.floor(Math.random()*5)-2);if(v!==ans&&v>=0)w.add(v)}
  return { a, b, op, answer: ans, choices: shuffle([ans,...w]) }
}

// ── HP bar ────────────────────────────────────────────────────────────────────
function HPBar({ current, max }) {
  const pct = Math.max(0, (current / max) * 100)
  const color = pct > 50 ? '#1D9E75' : pct > 20 ? '#EF9F27' : '#E24B4A'
  return (
    <div style={{ flex:1, height:10, background:'rgba(255,255,255,.18)', borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:'100%', background:color, width:`${pct}%`, transition:'width .4s ease', borderRadius:20 }} />
    </div>
  )
}

// ── Visual model (mirrors GameMath) ──────────────────────────────────────────
function QuestionVisual({ q }) {
  if (q.isCount) {
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', padding:'8px 0', marginBottom:8 }}>
        {q.objects.map((e,i) => <span key={i} style={{ fontSize:40, lineHeight:1 }}>{e}</span>)}
      </div>
    )
  }
  if (q.isPattern) {
    return (
      <div style={{ display:'flex', gap:6, justifyContent:'center', alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
        {q.seq.map((e,i) => <span key={i} style={{ fontSize:32, lineHeight:1, padding:4, borderRadius:6, background:'rgba(255,255,255,.1)' }}>{e}</span>)}
        <span style={{ fontSize:26, border:'2px dashed rgba(255,255,255,.4)', borderRadius:8, padding:'4px 10px', color:'rgba(255,255,255,.6)', fontWeight:700 }}>?</span>
      </div>
    )
  }
  if (q.isWord) {
    return <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', lineHeight:1.7, marginBottom:8, padding:'0 4px', textAlign:'left' }}>{q.story}</div>
  }
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:52, color:'#FFD700', lineHeight:1 }}>{q.a}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'rgba(255,255,255,.7)' }}>{q.op}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:52, color:'#FFD700', lineHeight:1 }}>{q.b}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'rgba(255,255,255,.4)' }}>=</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:52, color:'#fff', lineHeight:1 }}>?</span>
    </div>
  )
}

// ── Total questions per battle ────────────────────────────────────────────────
const TOTAL_QS = 8

// ── Main component ────────────────────────────────────────────────────────────
export default function GameMathBattle({ navigate }) {
  const { state, dispatch } = useAppState()

  const [enemy] = useState(() => MATH_ENEMIES[Math.floor(Math.random() * MATH_ENEMIES.length)])

  // Pick the player's current math level, skip Foundation
  const lv = useMemo(() => {
    const lvId = state.subjectLevels?.math || 1
    return LEVELS.math.find(l => l.id === lvId && !l.isFoundation)
        || LEVELS.math.find(l => l.id === 1 && !l.isFoundation)
        || LEVELS.math[1]
  }, []) // eslint-disable-line

  const [qs] = useState(() => Array.from({ length: TOTAL_QS }, () => genQ(lv)))
  const [cur, setCur]           = useState(0)
  const [enemyHP, setEnemyHP]   = useState(enemy.maxHP)
  const [score, setScore]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [xp, setXp]             = useState(0)
  const [answered, setAnswered] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [battleText, setBattleText] = useState(`${enemy.emoji} ${enemy.name} ปรากฏตัว!`)
  const [hitFlash, setHitFlash]   = useState(false)
  const [missShake, setMissShake] = useState(false)
  const [done, setDone]           = useState(false)
  const sessionStart = useRef(Date.now())

  const q = qs[cur]
  const dmgPerHit = Math.ceil(enemy.maxHP / TOTAL_QS)

  const check = (val) => {
    if (answered) return
    const ok = val === q.answer
    if (ok) {
      setAnswered(true)
      const newStreak = streak + 1; setStreak(newStreak)
      const isCrit = newStreak >= 3
      const diff = lv?.diff || 1
      const prevM = (state.levelMastery?.math?.[lv?.id||1]) || 0
      const earned = Math.max(2, Math.round(10 * diff * (1 - prevM))) + (isCrit ? 5 : 0)
      setXp(x => x + earned); setScore(s => s + 1)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world:'math', amount:earned, accDelta:100 } })

      const dmg = isCrit ? Math.ceil(dmgPerHit * 1.5) : dmgPerHit
      setEnemyHP(h => Math.max(0, h - dmg))
      setHitFlash(true); setTimeout(() => setHitFlash(false), 350)

      if (isCrit) {
        playTone('streak'); spawnConfetti(5)
        setBattleText(`💥 Critical Hit! -${dmg} HP! +${earned} XP`)
      } else {
        playTone('correct')
        setBattleText(`⚔️ โจมตี! -${dmg} HP · +${earned} XP`)
      }
    } else {
      const na = attempts + 1; setAttempts(na)
      setStreak(0); playTone('wrong')
      setMissShake(true); setTimeout(() => setMissShake(false), 400)
      if (na === 1) setBattleText('💨 พลาดแล้ว! ลองอีกครั้ง')
      else if (na === 2) setBattleText('🤔 เกือบแล้ว! ดูตัวเลขอีกที')
      else { setAnswered(true); setBattleText(`👁️ คำตอบคือ ${q.answer}`) }
    }
  }

  const next = () => {
    playTone('next')
    if (cur + 1 >= TOTAL_QS) {
      setDone(true)
      const p = score / TOTAL_QS
      dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak, score: p } })
      dispatch({ type: ACTIONS.UPDATE_LEVEL_MASTERY, payload: {
        world:'math', levelId:lv?.id||1,
        value: p*0.4 + ((state.levelMastery?.math?.[lv?.id||1])||0)*0.6,
      }})
      if (!lv?.isFoundation && p >= 0.8) {
        const cur2 = state.subjectLevels?.math || 1
        if (cur2 < 8) {
          dispatch({ type: ACTIONS.UNLOCK_LEVEL, payload: { world:'math', newLevel:cur2+1 } })
          showToast(`✨ ปลดล็อก Level ${cur2+1}!`); spawnConfetti(15); playTone('unlock')
        }
      }
      if (p >= 0.9) { playTone('fanfare'); spawnConfetti(30) } else if (p >= 0.8) { playTone('complete') }
      dispatch({ type: ACTIONS.LOG_SESSION, payload: {
        ts: sessionStart.current, world:'math', missionId:null, level:lv?.id||1,
        dur: Date.now()-sessionStart.current, score:p, wrong:TOTAL_QS-score,
        hints:0, completed:p>=0.8, nextAction:null, phaseStats:null,
      }})
    } else {
      setAnswered(false); setAttempts(0)
      setBattleText(`❓ คำถามต่อไป!`)
      setCur(c => c + 1)
    }
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (done) {
    const p = score / TOTAL_QS
    const won = p >= 0.5
    return (
      <div style={{ minHeight:'100%', background:'#1a1040', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Mitr,sans-serif', textAlign:'center' }}>
        <div style={{ fontSize:80, marginBottom:8, animation:'victory-bounce .6s ease' }}>{won ? enemy.emoji : '😤'}</div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color: won ? '#FFD700' : '#fff', marginBottom:8 }}>
          {won ? `ชนะ ${enemy.name} แล้ว! 🎉` : 'สู้ต่อไปนะ! 💪'}
        </div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,.7)', marginBottom:20 }}>{score}/{TOTAL_QS} ถูก · +{xp} XP</div>
        <div style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'12px 20px', marginBottom:20, width:'100%', maxWidth:320 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:6 }}>HP ที่ลดได้</div>
          <HPBar current={Math.max(0, enemy.maxHP - score * dmgPerHit)} max={enemy.maxHP} />
          <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:6 }}>
            {Math.max(0, enemy.maxHP - score * dmgPerHit)}/{enemy.maxHP} HP เหลือ
          </div>
        </div>
        <button
          onClick={() => {
            sessionStart.current = Date.now()
            setCur(0); setEnemyHP(enemy.maxHP); setScore(0); setStreak(0); setXp(0)
            setAnswered(false); setAttempts(0); setDone(false)
            setBattleText(`${enemy.emoji} ${enemy.name} กลับมาแล้ว!`)
          }}
          style={{ width:'100%', maxWidth:320, background:'#7F77DD', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:10 }}
        >
          🔄 ต่อสู้อีกครั้ง!
        </button>
        <button
          onClick={() => navigate('home')}
          style={{ width:'100%', maxWidth:320, background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.8)', border:'none', borderRadius:12, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}
        >
          ← หน้าหลัก
        </button>
      </div>
    )
  }

  if (!q) return null

  // ── Battle screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100%', background:'#1a1040', display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif' }}>

      {/* Enemy card */}
      <div style={{ padding:'12px 18px 8px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          fontSize: 48, lineHeight: 1,
          transition: 'filter .15s',
          filter: hitFlash ? 'brightness(3) sepia(1) saturate(5) hue-rotate(-20deg)' : 'none',
          animation: missShake ? 'battle-shake .35s ease' : 'none',
        }}>
          {enemy.emoji}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:15, color:'#fff', marginBottom:4 }}>{enemy.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <HPBar current={Math.max(0, enemyHP)} max={enemy.maxHP} />
            <div style={{ fontSize:10, color:'rgba(255,255,255,.55)', whiteSpace:'nowrap' }}>{Math.max(0,enemyHP)}/{enemy.maxHP}</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', textAlign:'center', flexShrink:0 }}>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:16, color:'#FFD700' }}>{cur+1}/{TOTAL_QS}</div>
          <div>คำถาม</div>
        </div>
      </div>

      {/* Battle text */}
      <div style={{ margin:'0 16px 8px', background:'rgba(255,255,255,.92)', borderRadius:12, padding:'10px 16px', border:'2px solid rgba(255,255,255,.7)' }}>
        <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.5 }}>▷ {battleText}</div>
      </div>

      {/* Streak badge */}
      {streak >= 3 && (
        <div style={{ textAlign:'center', marginBottom:4 }}>
          <span style={{ background:'var(--amber)', color:'var(--amber-d)', borderRadius:12, padding:'2px 12px', fontSize:12, fontWeight:700 }}>
            🔥 {streak} Streak! คริติคอล!
          </span>
        </div>
      )}

      {/* Question card */}
      <div style={{ margin:'4px 16px 8px', background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.2)', borderRadius:16, padding:'14px 14px' }}>
        {q.isCount && (
          <div style={{ textAlign:'center', marginBottom:8 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginBottom:6 }}>มีกี่อัน?</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' }}>
              {q.objects.map((e,i) => <span key={i} style={{ fontSize:38, lineHeight:1 }}>{e}</span>)}
            </div>
          </div>
        )}
        {!q.isCount && <QuestionVisual q={q} />}

        {/* Choice buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {q.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => check(c)}
              disabled={answered}
              style={{
                background: answered && c === q.answer
                  ? 'rgba(29,158,117,.35)'
                  : 'rgba(255,255,255,.12)',
                color: '#fff',
                border: answered && c === q.answer
                  ? '2px solid #1D9E75'
                  : '1.5px solid rgba(255,255,255,.25)',
                borderRadius: 12, padding: '13px 8px',
                fontFamily: "'Fredoka One',cursive",
                fontSize: q.isPattern ? 24 : 26,
                cursor: answered ? 'default' : 'pointer',
                fontWeight: 700,
                touchAction: 'manipulation',
                transition: 'all .12s',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {answered && (
          <div style={{ marginTop:8, textAlign:'center' }}>
            <button
              onClick={next}
              style={{ width:'100%', background:'#7F77DD', color:'#fff', border:'none', borderRadius:10, padding:12, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}
            >
              {cur + 1 >= TOTAL_QS ? 'ดูผล ✨' : 'ต่อไป ⚔️'}
            </button>
          </div>
        )}
        {!answered && attempts >= 3 && (
          <div style={{ marginTop:8, textAlign:'center' }}>
            <button
              onClick={next}
              style={{ width:'100%', background:'rgba(255,255,255,.18)', color:'rgba(255,255,255,.8)', border:'none', borderRadius:10, padding:12, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}
            >
              {cur + 1 >= TOTAL_QS ? 'ดูผล ✨' : 'ต่อไป →'}
            </button>
          </div>
        )}

        {/* XP counter */}
        <div style={{ textAlign:'right', marginTop:6, fontSize:11, color:'rgba(255,255,255,.45)' }}>+{xp} XP ในสมรภูมินี้</div>
      </div>
    </div>
  )
}
