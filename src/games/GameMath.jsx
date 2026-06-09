import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import LevelSelector from './LevelSelector.jsx'
import TeachOverlay from './TeachOverlay.jsx'
import { MATH_WORDS, PATTERN_SETS, LEVELS, COUNTABLES, COUNTABLE_GROUPS, shuffle } from '../config/gameConfig.js'
import { playTone, speakTh } from '../lib/audio.js'
import { showToast, spawnConfetti } from '../components/Toasts.jsx'

export default function GameMath() {
  const [view, setView] = useState('levels')
  const [activeLv, setActiveLv] = useState(null)
  const { state } = useAppState()

  const visibleLevels = LEVELS.math.filter(lv =>
    lv.isFoundation ? (state.grade === 0 && !state.foundationComplete) : true
  )

  const handleSelect = (lv) => {
    setActiveLv(lv)
    const key = `math-${lv.id}`
    setView((state.seenTeach||[]).includes(key) ? 'play' : 'teach')
  }

  if (view === 'levels') return <LevelSelector world="math" onSelect={handleSelect} levelsOverride={visibleLevels} />
  if (view === 'teach') return <TeachOverlay world="math" levelId={activeLv?.id} onDone={() => setView('play')} />
  return <MathLevelGame lv={activeLv} onBack={() => setView('levels')} />
}

function VisualModel({ q }) {
  const { a, b, visualModel, emojiA, emojiB } = q
  const total = a + b

  if (visualModel === 'objects') {
    const sz = total > 10 ? 18 : 24
    return (
      <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center',marginBottom:12,minHeight:36,alignItems:'center'}}>
        {[...Array(a)].map((_,i)=><span key={`a${i}`} style={{fontSize:sz,lineHeight:1}}>{emojiA}</span>)}
        <span style={{fontSize:16,color:'var(--purple)',fontWeight:700,padding:'0 6px',alignSelf:'center'}}>+</span>
        {[...Array(b)].map((_,i)=><span key={`b${i}`} style={{fontSize:sz,lineHeight:1}}>{emojiB}</span>)}
      </div>
    )
  }

  if (visualModel === 'tenFrame') {
    const rows = total <= 10 ? 2 : total <= 20 ? 4 : null
    if (rows === null) {
      // total > 20: fallback to coloured dots
      return (
        <div style={{display:'flex',justifyContent:'center',gap:4,flexWrap:'wrap',marginBottom:12}}>
          {[...Array(a)].map((_,i)=><span key={`a${i}`} style={{width:18,height:18,borderRadius:'50%',background:'var(--amber)',display:'inline-block'}}/>)}
          {[...Array(b)].map((_,i)=><span key={`b${i}`} style={{width:18,height:18,borderRadius:'50%',background:'var(--blue)',display:'inline-block'}}/>)}
        </div>
      )
    }
    const cells = rows * 5
    return (
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,28px)',gap:3,justifyContent:'center',marginBottom:12}}>
        {[...Array(cells)].map((_,i) => {
          const bg = i < a ? 'var(--amber)' : i < a+b ? 'var(--blue)' : '#e5e7eb'
          return <div key={i} style={{width:28,height:28,borderRadius:4,background:bg,border:`1.5px solid ${bg==='#e5e7eb'?'#d1d5db':'rgba(0,0,0,0.1)'}`}}/>
        })}
      </div>
    )
  }

  if (visualModel === 'crossOut') {
    const keepCount = a - b
    return (
      <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center',marginBottom:12,minHeight:36}}>
        {[...Array(a)].map((_,i) => {
          const crossed = i >= keepCount
          return (
            <span key={i} style={{position:'relative',display:'inline-block',fontSize:26,lineHeight:1,opacity:crossed?0.5:1}}>
              {emojiA}
              {crossed && <span style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',fontSize:20,lineHeight:1,pointerEvents:'none'}}>❌</span>}
            </span>
          )
        })}
      </div>
    )
  }

  // null / L5+: existing coloured dots
  return (
    <div style={{display:'flex',justifyContent:'center',gap:5,flexWrap:'wrap',minHeight:36,marginBottom:12,padding:'0 8px'}}>
      {[...Array(a)].map((_,i)=><span key={`a${i}`} style={{width:22,height:22,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🟡</span>)}
      {[...Array(b)].map((_,i)=><span key={`b${i}`} style={{width:22,height:22,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🔵</span>)}
    </div>
  )
}

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
    const startIdx = Math.random() < 0.5 ? 0 : 1
    const seq = Array.from({length:5}, (_,i) => set[(startIdx+i)%2])
    const answer = set[(startIdx+5)%2]
    const others = PATTERN_SETS.AB.filter(s => s[0] !== set[0])
    const distractors = shuffle([
      set[(startIdx+1)%2],
      ...others.flatMap(s => s),
    ].filter(e => e !== answer)).slice(0, 3)
    return { seq, answer, choices: shuffle([answer, ...distractors]), isPattern:true, patternUnit:set }
  }
  if (lv?.op === 'word') {
    const pool = shuffle([...MATH_WORDS.filter(q => lv?.subtype === 'comparison' ? q.comparison : !q.comparison)])
    const q = pool[0]
    const w = new Set(); while(w.size<3){const v=q.ans+(Math.floor(Math.random()*5)-2);if(v!==q.ans&&v>=0)w.add(v)}
    return {a:q.a,b:q.b,op:q.op,answer:q.ans,choices:shuffle([q.ans,...w]),story:q.story,isWord:true}
  }
  const mx = lv?.range?.[1] || 10
  let a, b, ans, op = '+'
  if (lv?.op === 'sub' || (lv?.op === 'mixed' && Math.random() > 0.5)) {
    op='-'; a=Math.floor(Math.random()*mx)+2; b=Math.floor(Math.random()*a)+1; ans=a-b
  } else {
    a=Math.floor(Math.random()*mx)+1; b=Math.floor(Math.random()*(mx-a+1))+1; ans=a+b
  }
  const w=new Set(); while(w.size<3){const v=ans+(Math.floor(Math.random()*5)-2);if(v!==ans&&v>=0)w.add(v)}
  const visModel = lv?.visualModel || null
  let emojiA = null, emojiB = null
  if (visModel) {
    const group = shuffle([...COUNTABLE_GROUPS[Math.floor(Math.random() * COUNTABLE_GROUPS.length)]])
    emojiA = group[0]
    emojiB = visModel === 'objects' ? group[1] : null
  }
  return {a,b,op,answer:ans,choices:shuffle([ans,...w]),visualModel:visModel,emojiA,emojiB}
}

function MathLevelGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [qs, setQs] = useState(() => Array.from({length:10},()=>genQ(lv)))
  const [cur, setCur] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [done, setDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(lv?.timer || 15)
  const timerRef = useRef(null)
  const sessionStart = useRef(Date.now())

  const q = qs[cur]
  const timerMax = lv?.timer || 15

  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimeLeft(timerMax)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) { clearInterval(timerRef.current); handleTimeout(); return 0 }
        return t - 0.1
      })
    }, 100)
  }

  useEffect(() => {
    if (!lv?.isFoundation) startTimer()
    return () => clearInterval(timerRef.current)
  }, [cur]) // eslint-disable-line

  const handleTimeout = () => {
    if (answered) return
    setAnswered(true); setStreak(0); playTone('wrong')
    setFeedback({ type:'lose', msg:`หมดเวลา! ${q?.a}${q?.op}${q?.b}=${q?.answer}` })
  }

  const check = (val) => {
    if (answered) return
    clearInterval(timerRef.current)
    const ok = val === q.answer
    if (ok) {
      setAnswered(true)
      const newStreak = streak+1; setStreak(newStreak)
      const diff = lv?.diff || 1
      const prevM = (state.levelMastery?.math?.[lv?.id||1]) || 0
      const earned = Math.max(2, Math.round(10*diff*(1-prevM))) + (newStreak>=3?5:0)
      setXp(x=>x+earned); setScore(s=>s+1)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world:'math', amount:earned, accDelta:100, speedDelta:lv?.isFoundation?50:Math.round((1-timeLeft/timerMax)*100) } })
      if (newStreak>=3){playTone('streak');spawnConfetti(5)}else playTone('correct')
      setFeedback({ type:'win', msg:['เก่งมาก! 🎉','ถูกต้อง! ✅','ยอดเยี่ยม! 🌟'][Math.floor(Math.random()*3)]+` +${earned} XP` })
    } else {
      const newAttempts = attempts+1; setAttempts(newAttempts)
      setStreak(0); playTone('wrong')
      if (q.isPattern && newAttempts===1) setFeedback({type:'lose',msg:'ดูรูปแบบที่ซ้ำกัน 🔁 (ไฮไลท์ช่วย)'})
      else if (newAttempts===1) setFeedback({type:'lose',msg:'ไม่ถูก ลองอีกครั้ง! 🤔'})
      else if (newAttempts===2) setFeedback({type:'lose',msg: q.isCount ? 'นับให้ครบทุกตัวนะ! 👇' : 'Hint: นับจุดช่วยได้!'})
      else { setAnswered(true); setFeedback({type:'lose',msg:`คำตอบคือ ${q.answer}`}) }
    }
  }

  const next = () => {
    playTone('next')
    if (cur+1>=10){
      setDone(true)
      const p=score/10
      dispatch({type:ACTIONS.ROUND_COMPLETE,payload:{streak,score:p}})
      dispatch({type:ACTIONS.UPDATE_LEVEL_MASTERY,payload:{world:'math',levelId:lv?.id||1,value:p*0.4+((state.levelMastery?.math?.[lv?.id||1])||0)*0.6}})
      if (lv?.isFoundation) {
        if (p >= 0.8) { dispatch({type:ACTIONS.FOUNDATION_COMPLETE}); showToast('✨ ผ่าน Foundation แล้ว!'); spawnConfetti(15) }
      } else if (p>=0.8) {
        const cur2=state.subjectLevels?.math||1
        if(cur2<8){dispatch({type:ACTIONS.UNLOCK_LEVEL,payload:{world:'math',newLevel:cur2+1}});showToast(`✨ ปลดล็อก Level ${cur2+1}!`);spawnConfetti(15);playTone('unlock')}
      }
      if(p>=0.9){playTone('fanfare');spawnConfetti(30)}else if(p>=0.8){playTone('complete')}
      dispatch({ type: ACTIONS.LOG_SESSION, payload: {
        ts: sessionStart.current, world: 'math', missionId: null, level: lv?.id || 1,
        dur: Date.now() - sessionStart.current, score: p, wrong: 10 - score,
        hints: 0, completed: p >= 0.8, nextAction: null, phaseStats: null,
      }})
    } else { setAnswered(false);setAttempts(0);setFeedback(null);setCur(c=>c+1) }
  }

  if (done) {
    const p = score/10
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:24,textAlign:'center',width:'100%',maxWidth:480}}>
        <div style={{fontSize:64,marginBottom:10}}>{p>=.9?'🏆':p>=.7?'🎉':'😊'}</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:'var(--purple-d)',marginBottom:8}}>{p>=.9?'อัจฉริยะเลข!':'เก่งมาก!'}</div>
        <div style={{fontSize:14,color:'var(--muted)',marginBottom:16}}>{score}/10 ถูก · +{xp} XP</div>
        <button onClick={()=>{sessionStart.current=Date.now();setQs(Array.from({length:10},()=>genQ(lv)));setCur(0);setScore(0);setStreak(0);setXp(0);setAnswered(false);setAttempts(0);setFeedback(null);setDone(false)}} style={{width:'100%',background:'var(--purple)',color:'#fff',border:'none',borderRadius:10,padding:14,fontFamily:'Mitr,sans-serif',fontSize:16,fontWeight:600,cursor:'pointer',marginBottom:8}}>🔄 เล่นอีกครั้ง</button>
        <button onClick={onBack} style={{width:'100%',background:'var(--purple-l)',color:'var(--purple-d)',border:'none',borderRadius:10,padding:13,fontFamily:'Mitr,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>← Level อื่น</button>
      </div>
    )
  }

  if (!q) return null
  return (
    <div style={{width:'100%',maxWidth:480,padding:'8px 0'}}>
      <div style={{padding:'0 20px 4px',display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--muted)'}}><span>{cur}/10</span><span>+{xp} XP</span></div>
      {!lv?.isFoundation && (
        <div style={{padding:'0 20px 4px'}}><div style={{height:5,background:'var(--border)',borderRadius:20,overflow:'hidden'}}><div style={{height:5,background:timeLeft<4?'var(--red)':'var(--amber)',borderRadius:20,width:`${timeLeft/timerMax*100}%`,transition:'width .1s linear'}}/></div></div>
      )}
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,margin:'8px 20px',padding:'18px 16px'}}>
        {q.isCount ? (
          <div style={{textAlign:'center',marginBottom:12}}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>มีกี่อัน?</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',padding:'8px 0'}}>
              {q.objects.map((e,i) => <span key={i} style={{fontSize:44,lineHeight:1}}>{e}</span>)}
            </div>
          </div>
        ) : q.isPattern ? (
          <div style={{textAlign:'center',marginBottom:12}}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>อะไรมาถัดไป?</div>
            <div style={{display:'flex',gap:6,justifyContent:'center',alignItems:'center',flexWrap:'wrap'}}>
              {q.seq.map((e,i) => (
                <span key={i} style={{
                  fontSize:38,lineHeight:1,padding:6,borderRadius:8,
                  background: attempts>=1 && i<2 ? 'var(--amber-l)' : 'transparent',
                  transition:'background .3s',
                }}>{e}</span>
              ))}
              <span style={{fontSize:32,border:'2px dashed var(--border)',borderRadius:8,padding:'4px 14px',color:'var(--muted)',fontWeight:700}}>?</span>
            </div>
          </div>
        ) : q.isWord ? (
          <div style={{fontSize:13,color:'var(--text)',lineHeight:1.7,marginBottom:12,padding:'0 4px'}}>{q.story}</div>
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:58,color:'var(--purple-d)',lineHeight:1}}>{q.a}</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:44,color:'var(--purple)'}}>{q.op}</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:58,color:'var(--purple-d)',lineHeight:1}}>{q.b}</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:44,color:'var(--muted)'}}>=</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:58,color:'var(--amber)'}}>?</div>
          </div>
        )}
        {!q.isWord && !q.isCount && !q.isPattern && <VisualModel q={q} />}
        <div className="choices">
          {q.choices.map((c,i)=>(
            <button key={i} className={`choice-btn${answered&&c===q.answer?' correct':''}`}
              style={{fontSize: q.isPattern ? 28 : 26, fontFamily:"'Fredoka One',cursive"}}
              onClick={()=>check(c)}>{c}</button>
          ))}
        </div>
        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {(answered||attempts>=3) && <button className="next-btn show" style={{background:'var(--purple)',color:'#fff'}} onClick={next}>ต่อไป →</button>}
      </div>
    </div>
  )
}
