import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import LevelSelector from './LevelSelector.jsx'
import TeachOverlay from './TeachOverlay.jsx'
import { TH_ALPHA, TH_L2, TH_L3, TH_L4, SPELL_L1, SP_CON, SP_VOW, CHAR_SPEAK, shuffle } from '../config/gameConfig.js'
import { playTone, speakTh } from '../lib/audio.js'
import { showToast, spawnConfetti } from '../components/Toasts.jsx'

const LEVEL_WORDS = { 1: null, 2: SPELL_L1, 3: TH_L2, 4: TH_L3 }

export default function GameThai() {
  const [view, setView] = useState('levels') // 'levels'|'teach'|'match'|'spell'|'sentence'
  const [activeLv, setActiveLv] = useState(null)
  const { state } = useAppState()

  const handleLevelSelect = (lv) => {
    setActiveLv(lv)
    const key = `thai-${lv.id}`
    const seen = (state.seenTeach || []).includes(key)
    setView(seen ? (lv.type === 'match' ? 'match' : lv.id === 5 ? 'sentence' : 'spell') : 'teach')
  }

  const afterTeach = () => {
    if (!activeLv) return
    setView(activeLv.type === 'match' ? 'match' : activeLv.id === 5 ? 'sentence' : 'spell')
  }

  if (view === 'levels') return <LevelSelector world="thai" onSelect={handleLevelSelect} />
  if (view === 'teach') return <TeachOverlay world="thai" levelId={activeLv?.id} onDone={afterTeach} />
  if (view === 'match') return <ThaiMatchGame lv={activeLv} onBack={() => setView('levels')} />
  if (view === 'sentence') return <ThaiSentenceGame lv={activeLv} onBack={() => setView('levels')} />
  return <ThaiSpellGame lv={activeLv} onBack={() => setView('levels')} words={LEVEL_WORDS[activeLv?.id] || SPELL_L1} />
}

// ── Match Game ──
function ThaiMatchGame({ lv, onBack }) {
  const { dispatch } = useAppState()
  const [q, setQ] = useState(() => shuffle([...TH_ALPHA]).slice(0, 10))
  const [cur, setCur] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const question = q[cur]
  const wrong = shuffle(TH_ALPHA.filter(a => a.char !== question?.char)).slice(0, 3)
  const choices = shuffle([question, ...wrong])

  const check = (c, btn) => {
    if (answered || !question) return
    setAnswered(true)
    const ok = c.char === question.char
    if (ok) {
      const newStreak = streak + 1; setStreak(newStreak)
      const earned = 10 + (newStreak >= 3 ? 5 : 0)
      setXp(x => x + earned); setScore(s => s + 1)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world: 'thai', amount: earned, accDelta: 100 } })
      setFeedback({ type:'win', msg: ['เก่งมาก! 🎉','ถูกต้อง! ✅','ยอดเยี่ยม! 🌟'][Math.floor(Math.random()*3)] + ` +${earned} XP` })
      if (newStreak >= 3) { playTone('streak'); spawnConfetti(5) } else playTone('correct')
      setTimeout(() => speakTh(['เก่งมาก','ถูกต้อง'][Math.floor(Math.random()*2)]), 300)
    } else {
      setStreak(0); playTone('wrong')
      setFeedback({ type:'lose', msg:`ไม่เป็นไร! ตัว ${question.char} = ${question.word} ${question.emoji}` })
      setTimeout(() => speakTh(question.char + 'อ ' + question.word), 300)
    }
  }

  const next = () => {
    if (cur + 1 >= 10) {
      setDone(true)
      const p = score / 10
      dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak, score: p } })
      dispatch({ type: ACTIONS.UPDATE_LEVEL_MASTERY, payload: { world:'thai', levelId: lv?.id || 1, value: p * 0.4 + ((useAppState().state.levelMastery?.thai?.[lv?.id||1]) || 0) * 0.6 } })
      if (p >= 0.8) { const cur2 = (useAppState().state.subjectLevels?.thai || 1); if (cur2 < 5) dispatch({ type: ACTIONS.UNLOCK_LEVEL, payload: { world:'thai', newLevel: cur2+1 } }) }
      if (p >= 0.9) { playTone('fanfare'); spawnConfetti(30) }
    } else {
      setAnswered(false); setFeedback(null); setCur(c => c + 1)
      playTone('next')
      setTimeout(() => speakTh(q[cur+1]?.char + 'อ ' + q[cur+1]?.word), 200)
    }
  }

  useEffect(() => { if (question) setTimeout(() => speakTh(question.char + 'อ ' + question.word), 200) }, [cur]) // eslint-disable-line

  if (done) {
    const p = score / 10
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:24, textAlign:'center', width:'100%', maxWidth:480 }}>
        <div style={{ fontSize:64, marginBottom:10 }}>{p>=.9?'🏆':p>=.7?'🎉':'😊'}</div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'var(--green-d)', marginBottom:8 }}>{p>=.9?'เยี่ยมมาก!':p>=.7?'เก่งมาก!':'ทำได้ดี!'}</div>
        <div style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>{score}/10 ถูก · +{xp} XP</div>
        <button onClick={() => { setCur(0); setScore(0); setStreak(0); setXp(0); setAnswered(false); setFeedback(null); setDone(false); setQ(shuffle([...TH_ALPHA]).slice(0,10)) }} style={{ width:'100%', background:'var(--green)', color:'#fff', border:'none', borderRadius:10, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:8 }}>🔄 เล่นอีกครั้ง</button>
        <button onClick={onBack} style={{ width:'100%', background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Level อื่น</button>
      </div>
    )
  }

  if (!question) return null
  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'0 20px 8px', fontSize:12, color:'var(--muted)' }}>
        <span>{cur}/10</span><span>Streak: {streak >= 3 ? `${streak}🔥` : streak}</span><span>+{xp} XP</span>
      </div>
      <div style={{ width:'100%', padding:'0 20px' }}>
        <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:6, background:'var(--green)', borderRadius:4, width:`${cur/10*100}%` }} />
        </div>
      </div>
      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:10, padding:'22px 20px 20px', position:'relative' }}>
        <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginBottom:6 }}>ตัวอักษรนี้คือ... <span style={{ opacity:.6 }}>(แตะเพื่อฟัง)</span></div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:90, color:'var(--green-d)', textAlign:'center', cursor:'pointer' }} onClick={() => speakTh(question.char + 'อ ' + question.word)}>{question.char}</div>
        <div style={{ textAlign:'center', fontSize:22, marginBottom:16 }}>{question.emoji}</div>
        <div className="choices">
          {choices.map((c, i) => (
            <button key={i} className={`choice-btn${answered && c.char === question.char ? ' correct' : ''}`} onClick={() => check(c)}>
              <span style={{ fontSize:18 }}>{c.emoji}</span><br/>{c.char} {c.word}
            </button>
          ))}
        </div>
        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {answered && <button className="next-btn show" style={{ background:'var(--green)', color:'#fff' }} onClick={next}>ต่อไป →</button>}
      </div>
    </div>
  )
}

// ── Spell Game ──
function ThaiSpellGame({ lv, onBack, words }) {
  const { state, dispatch } = useAppState()
  const [q, setQ] = useState(() => shuffle([...words]).slice(0, 10))
  const [cur, setCur] = useState(0)
  const [typed, setTyped] = useState([])
  const [attempts, setAttempts] = useState(0)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [feedback, setFeedback] = useState(null)

  const question = q[cur]
  const tiles = React.useMemo(() => {
    if (!question) return []
    const charSet = new Set(question.chars)
    const distractors = shuffle([...SP_CON, ...SP_VOW].filter(c => !charSet.has(c))).slice(0, Math.max(2, 6 - question.chars.length))
    return shuffle([...question.chars, ...distractors])
  }, [question])
  const [usedTiles, setUsedTiles] = useState([])
  const [errTiles, setErrTiles] = useState([])

  useEffect(() => { setUsedTiles([]); setErrTiles([]); setTyped([]); setAttempts(0); setFeedback(null) }, [cur])
  useEffect(() => { if (question) setTimeout(() => speakTh(question.word), 200) }, [cur]) // eslint-disable-line

  if (!question || done) {
    if (done) {
      const p = score / q.length
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:24, textAlign:'center', width:'100%', maxWidth:480 }}>
          <div style={{ fontSize:64, marginBottom:10 }}>{p>=.9?'🏆':p>=.7?'🎉':'😊'}</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'var(--green-d)', marginBottom:8 }}>{p>=.9?'นักสะกดแชมเปียน!':'เก่งมาก!'}</div>
          <div style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>{score}/{q.length} ถูก · +{xp} XP</div>
          <button onClick={() => { setQ(shuffle([...words]).slice(0,10)); setCur(0); setScore(0); setStreak(0); setXp(0); setDone(false) }} style={{ width:'100%', background:'var(--green)', color:'#fff', border:'none', borderRadius:10, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:8 }}>🔄 เล่นอีกครั้ง</button>
          <button onClick={onBack} style={{ width:'100%', background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Level อื่น</button>
        </div>
      )
    }
    return null
  }

  const tapTile = (ch, idx) => {
    if (usedTiles.includes(idx)) return
    speakTh(CHAR_SPEAK[ch] || ch)
    const expectedIdx = typed.length
    const expected = question.chars[expectedIdx]
    if (ch === expected) {
      const newTyped = [...typed, ch]
      setTyped(newTyped)
      setUsedTiles(u => [...u, idx])
      playTone('click')
      if (newTyped.length === question.chars.length) {
        // Word complete
        const newStreak = streak + 1; setStreak(newStreak)
        const prevM = (state.thaiMastery?.[question.word]) || 0
        dispatch({ type: ACTIONS.UPDATE_THAI_MASTERY, payload: { word: question.word, value: Math.min(1, prevM*0.7+0.3) } })
        const earned = Math.max(2, Math.round(10*(1-prevM)))
        setXp(x => x+earned); setScore(s => s+1)
        dispatch({ type: ACTIONS.ADD_XP, payload: { world:'thai', amount:earned, accDelta:100 } })
        if (newStreak >= 3) { playTone('streak'); spawnConfetti(5) } else playTone('correct')
        setFeedback({ type:'win', msg:['เก่งมาก! 🎉','ถูกต้อง! ✅','ยอดเยี่ยม! 🌟'][Math.floor(Math.random()*3)]+` +${earned} XP` })
        setTimeout(() => speakTh(['เก่งมาก','ถูกต้อง'][Math.floor(Math.random()*2)]), 300)
      }
    } else {
      const newAttempts = attempts + 1; setAttempts(newAttempts)
      setErrTiles([idx])
      setTimeout(() => setErrTiles([]), 400)
      playTone('wrong')
      if (newAttempts >= 2) {
        setStreak(0)
        const prevM = (state.thaiMastery?.[question.word]) || 0
        dispatch({ type: ACTIONS.UPDATE_THAI_MASTERY, payload: { word: question.word, value: Math.max(0, prevM*0.7) } })
        setFeedback({ type:'lose', msg:`ไม่เป็นไร! "${question.word}" สะกดว่า ${question.chars.join(' - ')}` })
        setTimeout(() => speakTh(question.word), 350)
      }
    }
  }

  const next = () => {
    playTone('next')
    if (cur + 1 >= q.length) {
      setDone(true)
      const p = score / q.length
      dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak, score: p } })
      dispatch({ type: ACTIONS.UPDATE_LEVEL_MASTERY, payload: { world:'thai', levelId: lv?.id || 2, value: p*0.4+((state.levelMastery?.thai?.[lv?.id||2])||0)*0.6 } })
      if (p >= 0.8) { const curLv = state.subjectLevels?.thai||1; if (curLv < 5) dispatch({ type: ACTIONS.UNLOCK_LEVEL, payload: { world:'thai', newLevel:curLv+1 } }); showToast(`✨ ปลดล็อก Level ${curLv+1}!`); spawnConfetti(15) }
    } else setCur(c => c+1)
  }

  const wordComplete = typed.length === question.chars.length
  const showNext = wordComplete || attempts >= 2

  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <div style={{ padding:'0 20px 4px', display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)' }}>
        <span>{cur}/{q.length}</span><span>+{xp} XP</span>
      </div>
      <div style={{ padding:'0 20px 4px' }}>
        <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:6, background:'var(--green)', borderRadius:4, width:`${cur/q.length*100}%` }} />
        </div>
      </div>
      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:'8px 20px', padding:'16px 16px 12px' }}>
        <div style={{ fontSize:60, textAlign:'center', cursor:'pointer', lineHeight:1.2, marginBottom:4 }} onClick={() => speakTh(question.word)}>{question.emoji}</div>
        <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginBottom:12 }}>{question.label} · แตะเพื่อฟัง 🔊</div>
        <div className="spell-slots">
          {question.chars.map((_, i) => {
            const filled = i < typed.length
            const err = !filled && attempts >= 2 && i >= typed.length
            return (
              <div key={i} className={`spell-slot${filled ? ' filled' : err ? ' error' : ''}`}>
                {filled ? typed[i] : err ? question.chars[i] : ''}
              </div>
            )
          })}
        </div>
        <div className="spell-tiles">
          {tiles.map((ch, idx) => (
            <div key={idx} className={`spell-tile${usedTiles.includes(idx) ? ' used' : ''}${errTiles.includes(idx) ? ' shake-tile' : ''}`} onClick={() => tapTile(ch, idx)}>{ch}</div>
          ))}
        </div>
        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {showNext && <button className="next-btn show" style={{ background:'var(--green)', color:'#fff' }} onClick={next}>ต่อไป →</button>}
      </div>
    </div>
  )
}

// ── Sentence Game (Level 5) ──
function ThaiSentenceGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [q, setQ] = useState(() => shuffle([...TH_L4]).slice(0, 6))
  const [cur, setCur] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [done, setDone] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const question = q[cur]
  useEffect(() => { if (question) setTimeout(() => speakTh(question.sound || question.sentence), 200) }, [cur]) // eslint-disable-line

  const check = (w) => {
    if (answered || !question) return
    setAnswered(true)
    const ok = w === question.blank
    if (ok) {
      const newStreak = streak + 1; setStreak(newStreak)
      const earned = Math.max(2, Math.round(10*2.5))
      setXp(x=>x+earned); setScore(s=>s+1)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world:'thai', amount:earned, accDelta:100 } })
      playTone(newStreak>=3?'streak':'correct')
      setFeedback({ type:'win', msg: question.sentence.replace('___', question.blank) + ` +${earned} XP` })
    } else {
      setStreak(0); playTone('wrong')
      setFeedback({ type:'lose', msg:'คำตอบที่ถูกคือ: ' + question.blank })
    }
    setTimeout(() => speakTh(question.sound || question.sentence.replace('___', question.blank)), 300)
  }

  const next = () => {
    playTone('next')
    if (cur+1 >= q.length) {
      setDone(true)
      const p = score / q.length
      dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak, score: p } })
    } else { setAnswered(false); setFeedback(null); setCur(c=>c+1) }
  }

  if (done || !question) {
    if (done) {
      const p = score / q.length
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:24, textAlign:'center', width:'100%', maxWidth:480 }}>
          <div style={{ fontSize:64, marginBottom:10 }}>{p>=.8?'🏆':'🎉'}</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'var(--green-d)', marginBottom:8 }}>{p>=.8?'ยอดเยี่ยม!':'เก่งมาก!'}</div>
          <div style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>{score}/{q.length} ถูก · +{xp} XP</div>
          <button onClick={() => { setQ(shuffle([...TH_L4]).slice(0,6)); setCur(0); setScore(0); setStreak(0); setXp(0); setDone(false); setAnswered(false); setFeedback(null) }} style={{ width:'100%', background:'var(--green)', color:'#fff', border:'none', borderRadius:10, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:8 }}>🔄 เล่นอีกครั้ง</button>
          <button onClick={onBack} style={{ width:'100%', background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Level อื่น</button>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:'8px 20px', padding:20 }}>
        <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginBottom:8 }}>เลือกคำที่หายไปในประโยค</div>
        <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>{question.emoji}</div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'var(--text)', textAlign:'center', marginBottom:16, lineHeight:1.6 }}>{question.sentence.replace('___','[ ? ]')}</div>
        <div className="choices">
          {shuffle(question.choices).map((w, i) => (
            <button key={i} className={`choice-btn${answered && w===question.blank?' correct':''}`} onClick={() => check(w)}>{w}</button>
          ))}
        </div>
        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {answered && <button className="next-btn show" style={{ background:'var(--green)', color:'#fff' }} onClick={next}>ต่อไป →</button>}
      </div>
    </div>
  )
}
