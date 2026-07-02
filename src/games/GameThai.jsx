import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS, dispatchAddCoins } from '../context/StateContext.jsx'
import LevelSelector from './LevelSelector.jsx'
import TeachOverlay from './TeachOverlay.jsx'
import { TH_ALPHA, TH_L2, TH_L3, TH_L5, SPELL_L1, SP_CON, SP_VOW, CHAR_SPEAK, shuffle } from '../config/gameConfig.js'
import { playTone, speakTh } from '../lib/audio.js'
import { showToast, showItemToast, spawnConfetti } from '../components/Toasts.jsx'

const LEVEL_WORDS = { 2: SPELL_L1, 3: TH_L2, 4: TH_L3 }

const getGameView = (lv) => {
  if (!lv) return 'levels'
  if (lv.type === 'match') return 'match'
  if (lv.type === 'wordorder') return 'wordorder'
  return 'spell'
}

export default function GameThai() {
  const [view, setView] = useState('levels')
  const [activeLv, setActiveLv] = useState(null)
  const { state } = useAppState()

  const handleLevelSelect = (lv) => {
    setActiveLv(lv)
    const key = `thai-${lv.id}`
    const seen = (state.seenTeach || []).includes(key)
    setView(seen ? getGameView(lv) : 'teach')
  }

  const afterTeach = () => { if (activeLv) setView(getGameView(activeLv)) }

  if (view === 'levels')   return <LevelSelector world="thai" onSelect={handleLevelSelect} />
  if (view === 'teach')    return <TeachOverlay world="thai" levelId={activeLv?.id} onDone={afterTeach} />
  if (view === 'match')    return <ThaiMatchGame lv={activeLv} onBack={() => setView('levels')} />
  if (view === 'wordorder')return <ThaiWordOrderGame lv={activeLv} onBack={() => setView('levels')} />
  return <ThaiSpellGame lv={activeLv} onBack={() => setView('levels')} words={LEVEL_WORDS[activeLv?.id] || SPELL_L1} />
}

// ── shared result screen ──────────────────────────────────────────────
function ResultScreen({ emoji, title, sub, coins, onReplay, onBack }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:24, textAlign:'center', width:'100%', maxWidth:480 }}>
      <div style={{ fontSize:64, marginBottom:10 }}>{emoji}</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'var(--green-d)', marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14, color:'var(--muted)', marginBottom:coins > 0 ? 8 : 20 }}>{sub}</div>
      {coins > 0 && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,210,63,0.12)', border:'1px solid rgba(255,210,63,0.35)', borderRadius:20, padding:'4px 14px', marginBottom:16, fontFamily:'var(--font-pixel)', fontSize:11, color:'#FFD23F' }}>
          🪙 +{coins}
        </div>
      )}
      <button onClick={onReplay} style={{ width:'100%', background:'var(--green)', color:'#fff', border:'none', borderRadius:10, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:8 }}>🔄 เล่นอีกครั้ง</button>
      <button onClick={onBack}   style={{ width:'100%', background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Level อื่น</button>
    </div>
  )
}

// ── progress bar + header ─────────────────────────────────────────────
function GameHeader({ cur, total, xp, streak }) {
  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'0 20px 6px', fontSize:12, color:'var(--muted)' }}>
        <span>{cur}/{total}</span>
        <span>{streak >= 3 ? `${streak}🔥` : streak > 0 ? `streak ${streak}` : ''}</span>
        <span>+{xp} XP</span>
      </div>
      <div style={{ padding:'0 20px 8px' }}>
        <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:6, background:'var(--green)', borderRadius:4, width:`${(cur/total)*100}%`, transition:'width .4s' }} />
        </div>
      </div>
    </>
  )
}

// ── finish round helper ────────────────────────────────────────────────
function useFinishRound({ score, total, world, levelId, maxLevels, streak, sessionStartRef }) {
  const { state, dispatch } = useAppState()
  const p = score / total
  const mastery = state.levelMastery?.[world]?.[levelId] || 0
  const accuracyMul = p < 0.5 ? 0.3 : p
  const coins = Math.max(2, Math.min(12, Math.round(12 * accuracyMul * (1 - mastery))))
  const finish = () => {
    const now = Date.now()
    const ts = sessionStartRef?.current || now
    dispatchAddCoins(dispatch, coins)
    showItemToast(`🪙 +${coins}`)
    dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak, score: p } })
    dispatch({ type: ACTIONS.UPDATE_LEVEL_MASTERY, payload: { world, levelId, value: p * 0.4 + ((state.levelMastery?.[world]?.[levelId]) || 0) * 0.6 } })
    if (p >= 0.8) {
      const cur = state.subjectLevels?.[world] || 1
      if (cur < maxLevels) {
        dispatch({ type: ACTIONS.UNLOCK_LEVEL, payload: { world, newLevel: cur + 1 } })
        dispatchAddCoins(dispatch, 15, `${world}_${cur + 1}`)
        showToast(`✨ ปลดล็อก Level ${cur + 1}!`); spawnConfetti(15); playTone('unlock')
      }
    }
    if (p >= 0.9) { playTone('fanfare'); spawnConfetti(30) }
    else if (p >= 0.8) { playTone('complete') }
    dispatch({ type: ACTIONS.LOG_SESSION, payload: {
      ts, world, missionId: null, level: levelId,
      dur: now - ts, score: p, wrong: total - score,
      hints: 0, completed: p >= 0.8, nextAction: null, phaseStats: null,
    }})
  }
  return { finish, coins }
}

// ── MATCH GAME (Level 1) ───────────────────────────────────────────────
function ThaiMatchGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [q, setQ]         = useState(() => shuffle([...TH_ALPHA]).slice(0, 10))
  const [cur, setCur]     = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp]       = useState(0)
  const [answered, setAnswered] = useState(false)
  const [done, setDone]   = useState(false)
  const [feedback, setFeedback] = useState(null)
  const sessionStart = useRef(Date.now())

  const question = q[cur]
  const wrong    = shuffle(TH_ALPHA.filter(a => a.char !== question?.char)).slice(0, 3)
  const choices  = React.useMemo(() => shuffle([question, ...wrong]), [cur]) // eslint-disable-line

  const check = (c) => {
    if (answered || !question) return
    setAnswered(true)
    const ok = c.char === question.char
    if (ok) {
      const ns = streak + 1; setStreak(ns)
      const earned = Math.round(10 * 1 * (1 - ((state.levelMastery?.thai?.[1]) || 0))) + (ns >= 3 ? 5 : 0)
      const safe = Math.max(2, earned)
      setXp(x => x + safe); setScore(s => s + 1)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world:'thai', amount:safe, accDelta:100 } })
      setFeedback({ type:'win', msg:['เก่งมาก! 🎉','ถูกต้อง! ✅','ยอดเยี่ยม! 🌟'][Math.floor(Math.random()*3)] + ` +${safe} XP` })
      if (ns >= 3) { playTone('streak'); spawnConfetti(5) } else playTone('correct')
      setTimeout(() => speakTh(['เก่งมาก','ถูกต้อง'][Math.floor(Math.random()*2)]), 300)
    } else {
      setStreak(0); playTone('wrong')
      setFeedback({ type:'lose', msg:`ตัว ${question.char} = ${question.word} ${question.emoji}` })
      setTimeout(() => speakTh(question.char + 'อ ' + question.word), 300)
    }
  }

  const { finish, coins: coinsEarned } = useFinishRound({ score, total:10, world:'thai', levelId:1, maxLevels:5, streak, sessionStartRef: sessionStart })

  const next = () => {
    if (cur + 1 >= 10) { setDone(true); finish() }
    else { setAnswered(false); setFeedback(null); setCur(c => c + 1); playTone('next') }
  }

  useEffect(() => { if (question) setTimeout(() => speakTh(question.char + 'อ ' + question.word), 200) }, [cur]) // eslint-disable-line

  if (done) {
    const p = score / 10
    return <ResultScreen emoji={p>=.9?'🏆':p>=.7?'🎉':'😊'} title={p>=.9?'เยี่ยมมาก!':p>=.7?'เก่งมาก!':'ทำได้ดี!'} sub={`${score}/10 ถูก · +${xp} XP`} coins={coinsEarned}
      onReplay={() => { sessionStart.current = Date.now(); setCur(0);setScore(0);setStreak(0);setXp(0);setAnswered(false);setFeedback(null);setDone(false);setQ(shuffle([...TH_ALPHA]).slice(0,10)) }}
      onBack={onBack} />
  }
  if (!question) return null
  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <GameHeader cur={cur} total={10} xp={xp} streak={streak} />
      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:'0 10px', padding:'20px 16px' }}>
        <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginBottom:4 }}>ตัวอักษรนี้คือ... <span style={{ opacity:.6 }}>(แตะเพื่อฟัง)</span></div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:90, color:'var(--green-d)', textAlign:'center', cursor:'pointer', lineHeight:1 }} onClick={() => speakTh(question.char + 'อ ' + question.word)}>{question.char}</div>
        <div style={{ textAlign:'center', fontSize:22, margin:'6px 0 14px' }}>{question.emoji}</div>
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

// ── SPELL GAME (Levels 2, 3, 4) ───────────────────────────────────────
function ThaiSpellGame({ lv, onBack, words }) {
  const { state, dispatch } = useAppState()
  const pool = React.useMemo(() => shuffle([...words]).slice(0, 10), []) // eslint-disable-line
  const [q, setQ]           = useState(pool)
  const [cur, setCur]       = useState(0)
  const [typed, setTyped]   = useState([])
  const [attempts, setAttempts] = useState(0)
  const [done, setDone]     = useState(false)
  const [score, setScore]   = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp]         = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [usedTiles, setUsedTiles] = useState([])
  const [errTiles, setErrTiles]   = useState([])
  const sessionStart = useRef(Date.now())

  const question = q[cur]
  const diff = lv?.diff || 1.5

  const tiles = React.useMemo(() => {
    if (!question) return []
    const charSet = new Set(question.chars)
    const extra = shuffle([...SP_CON, ...SP_VOW].filter(c => !charSet.has(c))).slice(0, Math.max(2, 6 - question.chars.length))
    return shuffle([...question.chars, ...extra])
  }, [question])

  // Hint: highlight next correct tile on 2nd mistake
  const hintTileIdx = attempts >= 1 && typed.length < (question?.chars.length || 0)
    ? tiles.findIndex((ch, idx) => !usedTiles.includes(idx) && ch === question?.chars[typed.length])
    : -1

  useEffect(() => { setUsedTiles([]); setErrTiles([]); setTyped([]); setAttempts(0); setFeedback(null) }, [cur])
  useEffect(() => { if (question) setTimeout(() => speakTh(question.word), 200) }, [cur]) // eslint-disable-line

  const { finish, coins: coinsEarned } = useFinishRound({ score, total:q.length, world:'thai', levelId:lv?.id || 2, maxLevels:5, streak, sessionStartRef: sessionStart })

  const tapTile = (ch, idx) => {
    if (usedTiles.includes(idx) || !question) return
    speakTh(CHAR_SPEAK[ch] || ch)
    const expected = question.chars[typed.length]
    if (ch === expected) {
      const newTyped = [...typed, ch]
      setTyped(newTyped)
      setUsedTiles(u => [...u, idx])
      playTone('click')
      if (newTyped.length === question.chars.length) {
        const ns = streak + 1; setStreak(ns)
        const prevM = (state.thaiMastery?.[question.word]) || 0
        dispatch({ type: ACTIONS.UPDATE_THAI_MASTERY, payload: { word: question.word, value: Math.min(1, prevM*0.7+0.3) } })
        const earned = Math.max(2, Math.round(10 * diff * (1 - prevM)))
        setXp(x => x + earned); setScore(s => s + 1)
        dispatch({ type: ACTIONS.ADD_XP, payload: { world:'thai', amount:earned, accDelta:100 } })
        if (ns >= 3) { playTone('streak'); spawnConfetti(5) } else playTone('correct')
        setFeedback({ type:'win', msg:['เก่งมาก! 🎉','ถูกต้อง! ✅','ยอดเยี่ยม! 🌟'][Math.floor(Math.random()*3)] + ` +${earned} XP` })
        setTimeout(() => speakTh(['เก่งมาก','ถูกต้อง'][Math.floor(Math.random()*2)]), 300)
      }
    } else {
      const na = attempts + 1; setAttempts(na)
      setErrTiles([idx]); setTimeout(() => setErrTiles([]), 400)
      playTone('wrong')
      setStreak(0)
      if (na === 1) setFeedback({ type:'lose', msg:'ลองอีกครั้ง! 💡 ดูตัวที่ไฮไลท์ช่วย' })
      else if (na >= 2) {
        const prevM = (state.thaiMastery?.[question.word]) || 0
        dispatch({ type: ACTIONS.UPDATE_THAI_MASTERY, payload: { word: question.word, value: Math.max(0, prevM*0.7) } })
        setFeedback({ type:'lose', msg:`"${question.word}" สะกดว่า ${question.chars.join(' - ')} 📖` })
        setTimeout(() => speakTh(question.word), 350)
      }
    }
  }

  const next = () => {
    playTone('next')
    if (cur + 1 >= q.length) { setDone(true); finish() }
    else setCur(c => c + 1)
  }

  const wordComplete = typed.length === (question?.chars.length || 0)
  const showNext     = wordComplete || attempts >= 2

  if (done || !question) {
    if (done) {
      const p = score / q.length
      return <ResultScreen emoji={p>=.9?'🏆':p>=.7?'🎉':'😊'} title={p>=.9?'นักสะกดแชมเปียน!':'เก่งมาก!'} sub={`${score}/${q.length} ถูก · +${xp} XP`} coins={coinsEarned}
        onReplay={() => { sessionStart.current = Date.now(); const nq=shuffle([...words]).slice(0,10); setQ(nq); setCur(0);setScore(0);setStreak(0);setXp(0);setDone(false) }}
        onBack={onBack} />
    }
    return null
  }

  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <GameHeader cur={cur} total={q.length} xp={xp} streak={streak} />
      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:'0 10px', padding:'14px' }}>
        <div style={{ fontSize:56, textAlign:'center', cursor:'pointer', lineHeight:1.3, marginBottom:4 }} onClick={() => speakTh(question.word)}>{question.emoji}</div>
        <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginBottom:10 }}>{question.label} · แตะเพื่อฟัง 🔊</div>
        <div className="spell-slots">
          {question.chars.map((_, i) => {
            const filled = i < typed.length
            const reveal = !filled && attempts >= 2 && i >= typed.length
            return (
              <div key={i} className={`spell-slot${filled ? ' filled' : reveal ? ' error' : ''}`}>
                {filled ? typed[i] : reveal ? question.chars[i] : ''}
              </div>
            )
          })}
        </div>
        <div className="spell-tiles">
          {tiles.map((ch, idx) => (
            <div key={idx}
              className={`spell-tile${usedTiles.includes(idx) ? ' used' : ''}${errTiles.includes(idx) ? ' shake-tile' : ''}${idx === hintTileIdx ? ' hint-tile' : ''}`}
              onClick={() => tapTile(ch, idx)}
            >{ch}</div>
          ))}
        </div>
        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {showNext && <button className="next-btn show" style={{ background:'var(--green)', color:'#fff' }} onClick={next}>ต่อไป →</button>}
      </div>
    </div>
  )
}

// ── WORD ORDER GAME (Level 5) ──────────────────────────────────────────
function ThaiWordOrderGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [q, setQ]         = useState(() => shuffle([...TH_L5]).slice(0, 8))
  const [cur, setCur]     = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp]       = useState(0)
  const [typed, setTyped] = useState([])
  const [usedIdxs, setUsedIdxs] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback]   = useState(null)
  const [done, setDone]   = useState(false)
  const sessionStart = useRef(Date.now())

  const question = q[cur]
  const tiles    = React.useMemo(() => question ? shuffle([...question.words]) : [], [cur]) // eslint-disable-line

  useEffect(() => {
    setTyped([]); setUsedIdxs([]); setFeedback(null); setSubmitted(false)
    if (question) setTimeout(() => speakTh(question.sound || question.words.join('')), 250)
  }, [cur]) // eslint-disable-line

  const { finish, coins: coinsEarned } = useFinishRound({ score, total:q.length, world:'thai', levelId:5, maxLevels:5, streak, sessionStartRef: sessionStart })

  const tapTile = (w, idx) => {
    if (submitted || usedIdxs.includes(idx) || !question) return
    const newTyped = [...typed, w]
    setTyped(newTyped); setUsedIdxs(u => [...u, idx])
    playTone('click')
    if (newTyped.length === question.words.length) {
      setSubmitted(true)
      const ok = newTyped.join('') === question.words.join('')
      if (ok) {
        const ns = streak + 1; setStreak(ns)
        const prevM = (state.levelMastery?.thai?.[5]) || 0
        const earned = Math.max(2, Math.round(10 * 3 * (1 - prevM))) + (ns >= 3 ? 5 : 0)
        setXp(x => x + earned); setScore(s => s + 1)
        dispatch({ type: ACTIONS.ADD_XP, payload: { world:'thai', amount:earned, accDelta:100 } })
        if (ns >= 3) { playTone('streak'); spawnConfetti(5) } else playTone('correct')
        setFeedback({ type:'win', msg: question.words.join(' ') + ` +${earned} XP` })
        setTimeout(() => speakTh(question.sound || question.words.join('')), 300)
      } else {
        setStreak(0); playTone('wrong')
        setFeedback({ type:'lose', msg:'คำตอบที่ถูก: ' + question.words.join(' ') })
        setTimeout(() => speakTh(question.sound || question.words.join('')), 350)
      }
    }
  }

  const next = () => {
    playTone('next')
    if (cur + 1 >= q.length) { setDone(true); finish() }
    else setCur(c => c + 1)
  }

  if (done || !question) {
    if (done) {
      const p = score / q.length
      return <ResultScreen emoji={p>=.9?'🏆':p>=.7?'🎉':'😊'} title={p>=.9?'ยอดเยี่ยม!':'เก่งมาก!'} sub={`${score}/${q.length} ถูก · +${xp} XP`} coins={coinsEarned}
        onReplay={() => { sessionStart.current = Date.now(); setQ(shuffle([...TH_L5]).slice(0,8)); setCur(0);setScore(0);setStreak(0);setXp(0);setDone(false) }}
        onBack={onBack} />
    }
    return null
  }

  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <GameHeader cur={cur} total={q.length} xp={xp} streak={streak} />
      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:'0 10px', padding:'16px' }}>
        <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginBottom:6 }}>เรียงคำให้เป็นประโยค</div>
        <div style={{ fontSize:48, textAlign:'center', cursor:'pointer', marginBottom:10 }} onClick={() => speakTh(question.sound || question.words.join(''))}>{question.emoji}</div>

        {/* Answer slots */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', minHeight:44, marginBottom:12, padding:8, background:'var(--bg)', borderRadius:10, border:'1.5px dashed var(--border)' }}>
          {typed.map((w, i) => (
            <span key={i} style={{ background:'var(--green-l)', color:'var(--green-d)', borderRadius:8, padding:'6px 12px', fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600 }}>{w}</span>
          ))}
        </div>

        {/* Word tiles */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:8 }}>
          {tiles.map((w, i) => (
            <button key={i} onClick={() => tapTile(w, i)} style={{
              background: usedIdxs.includes(i) ? 'transparent' : 'var(--card)',
              border: `2px solid ${usedIdxs.includes(i) ? 'transparent' : 'var(--border)'}`,
              borderRadius:10, padding:'8px 14px',
              fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600,
              cursor: usedIdxs.includes(i) ? 'default' : 'pointer',
              opacity: usedIdxs.includes(i) ? 0 : 1, transition:'opacity .2s',
            }}>{w}</button>
          ))}
        </div>

        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {submitted && <button className="next-btn show" style={{ background:'var(--green)', color:'#fff' }} onClick={next}>ต่อไป →</button>}
      </div>
    </div>
  )
}
