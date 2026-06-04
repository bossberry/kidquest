import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { TH_ALPHA, EN_ALPHA, LEVELS, MATH_WORDS, PATTERN_SETS, shuffle } from '../config/gameConfig.js'
import { playTone, speakTh, speakEn } from '../lib/audio.js'
import { showToast, spawnConfetti } from '../components/Toasts.jsx'
import BattleMode from './BattleMode.jsx'
import ChaseMode from './ChaseMode.jsx'
import DefenseMode from './DefenseMode.jsx'

const TOTAL_QS = 8
const MODES = ['battle', 'chase', 'defense']
const COUNTABLES = ['🥚','⭐','🍎','🐟','🌸','🏀','🍬','💎']

// ── Question generators ────────────────────────────────────────────────────────

function genMathQ(lv) {
  if (lv?.op === 'count') {
    const emoji = COUNTABLES[Math.floor(Math.random() * COUNTABLES.length)]
    const n = Math.floor(Math.random() * 5) + 1
    const w = new Set()
    while (w.size < 3) { const v = Math.floor(Math.random()*5)+1; if(v!==n) w.add(v) }
    return { isCount:true, objects:Array(n).fill(emoji), answer:n, choices:shuffle([n,...w]) }
  }
  if (lv?.op === 'pattern') {
    const set = PATTERN_SETS.AB[Math.floor(Math.random() * PATTERN_SETS.AB.length)]
    const si = Math.random() < 0.5 ? 0 : 1
    const seq = Array.from({ length:5 }, (_,i) => set[(si+i)%2])
    const answer = set[(si+5)%2]
    const others = PATTERN_SETS.AB.filter(s => s[0] !== set[0])
    const distractors = shuffle([set[(si+1)%2], ...others.flatMap(s=>s)].filter(e=>e!==answer)).slice(0,3)
    return { isPattern:true, seq, answer, choices:shuffle([answer,...distractors]) }
  }
  if (lv?.op === 'word') {
    const pool = shuffle([...MATH_WORDS.filter(q => lv?.subtype==='comparison' ? q.comparison : !q.comparison)])
    const q = pool[0]
    const w = new Set(); while(w.size<3){const v=q.ans+(Math.floor(Math.random()*5)-2);if(v!==q.ans&&v>=0)w.add(v)}
    return { isWord:true, story:q.story, answer:q.ans, choices:shuffle([q.ans,...w]), a:q.a, b:q.b, op:q.op }
  }
  const mx = lv?.range?.[1] || 10
  let a, b, ans, op='+'
  if (lv?.op === 'sub' || (lv?.op === 'mixed' && Math.random() > 0.5)) {
    op='-'; a=Math.floor(Math.random()*mx)+2; b=Math.floor(Math.random()*a)+1; ans=a-b
  } else {
    a=Math.floor(Math.random()*mx)+1; b=Math.floor(Math.random()*(mx-a+1))+1; ans=a+b
  }
  const w=new Set(); while(w.size<3){const v=ans+(Math.floor(Math.random()*5)-2);if(v!==ans&&v>=0)w.add(v)}
  return { a, b, op, answer:ans, choices:shuffle([ans,...w]) }
}

function genThaiQ() {
  const items = shuffle([...TH_ALPHA])
  const correct = items[0]
  const wrongs = items.slice(1, 4)
  return {
    isThai: true,
    emoji: correct.emoji,
    word: correct.word,
    choices: shuffle([correct.char, ...wrongs.map(w => w.char)]),
    answer: correct.char,
    ttsWord: correct.word,
  }
}

function genEngQ() {
  const items = shuffle([...EN_ALPHA])
  const correct = items[0]
  const wrongs = items.slice(1, 4)
  return {
    isEng: true,
    emoji: correct.emoji,
    word: correct.word,
    choices: shuffle([correct.letter.toUpperCase(), ...wrongs.map(w => w.letter.toUpperCase())]),
    answer: correct.letter.toUpperCase(),
    ttsWord: correct.word,
  }
}

function genQuestion(subject, lv) {
  if (subject === 'math') return genMathQ(lv)
  if (subject === 'thai') return genThaiQ()
  return genEngQ()
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pickMode(sessionLog, subject) {
  const dayN = Math.floor(Date.now() / 86400000)
  const plays = (sessionLog || []).filter(s => s.world === subject).length
  return MODES[(dayN + plays) % MODES.length]
}

function getLevelConfig(subject, state) {
  if (subject === 'math') {
    const id = state.subjectLevels?.math || 1
    return LEVELS.math?.find(l => l.id === id && !l.isFoundation)
        || LEVELS.math?.find(l => !l.isFoundation)
        || { id:1, diff:1 }
  }
  if (subject === 'thai') {
    const id = state.subjectLevels?.thai || 1
    return LEVELS.thai?.find(l => l.id === id) || { id:1, diff:1 }
  }
  const id = state.subjectLevels?.eng || 1
  return LEVELS.eng?.find(l => l.id === id) || { id:1, diff:1 }
}

// ── Result screen ──────────────────────────────────────────────────────────────

const SUBJECT_COLORS = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

function ResultScreen({ score, total, xp, subject, onReplay, onHome }) {
  const p = score / total
  const won = p >= 0.5
  return (
    <div style={{ minHeight:'100%', background:SUBJECT_COLORS[subject]||'#1a1040', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Mitr,sans-serif', textAlign:'center' }}>
      <div style={{ fontSize:80, marginBottom:8 }} className={won ? 'victory-bounce' : ''}>{won ? '🎉' : '💪'}</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:won?'#FFD700':'#fff', marginBottom:8 }}>
        {won ? 'ยอดเยี่ยม!' : 'สู้ต่อไปนะ!'}
      </div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,.7)', marginBottom:20 }}>{score}/{total} ถูก · +{xp} XP</div>
      <button onClick={onReplay} style={{ width:'100%', maxWidth:320, background:'#7F77DD', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:10 }}>
        🔄 เล่นอีกครั้ง!
      </button>
      <button onClick={onHome} style={{ width:'100%', maxWidth:320, background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.8)', border:'none', borderRadius:12, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>
        ← หน้าหลัก
      </button>
    </div>
  )
}

// ── Session (mounted fresh per replay via key) ─────────────────────────────────

function Session({ navigate, subject, onReset }) {
  const { state, dispatch } = useAppState()
  const lv = useMemo(() => getLevelConfig(subject, state), [subject]) // eslint-disable-line
  const mode = useMemo(() => pickMode(state.sessionLog, subject), []) // eslint-disable-line

  const [qs] = useState(() => Array.from({ length:TOTAL_QS }, () => genQuestion(subject, lv)))
  const [cur, setCur]       = useState(0)
  const [score, setScore]   = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp]         = useState(0)
  const [done, setDone]     = useState(false)
  const scoreRef   = useRef(0)
  const sessionStart = useRef(Date.now())

  // TTS on question change
  useEffect(() => {
    const q = qs[cur]
    if (!q) return
    if (subject === 'thai' && q.ttsWord) {
      const t = setTimeout(() => speakTh(q.ttsWord), 400)
      return () => clearTimeout(t)
    }
    if (subject === 'eng' && q.ttsWord) {
      const t = setTimeout(() => speakEn(q.ttsWord), 400)
      return () => clearTimeout(t)
    }
  }, [cur, subject]) // eslint-disable-line

  const handleCorrect = () => {
    const isCrit = streak >= 2
    const earned = 10 + (isCrit ? 5 : 0)
    scoreRef.current++
    setScore(scoreRef.current)
    setStreak(s => s + 1)
    setXp(x => x + earned)
    dispatch({ type:ACTIONS.ADD_XP, payload:{ world:subject, amount:earned, accDelta:100 } })
    return { earned, isCrit }
  }

  const handleWrong = () => setStreak(0)

  const handleNext = () => {
    if (cur + 1 >= TOTAL_QS) {
      const p = scoreRef.current / TOTAL_QS
      dispatch({ type:ACTIONS.ROUND_COMPLETE, payload:{ streak, score:p } })
      dispatch({ type:ACTIONS.UPDATE_LEVEL_MASTERY, payload:{
        world:subject, levelId:lv?.id||1,
        value: p*0.4 + ((state.levelMastery?.[subject]?.[lv?.id||1])||0)*0.6,
      }})
      const maxLvs = { thai:5, math:8, eng:4 }
      if (p >= 0.8) {
        const curLv = state.subjectLevels?.[subject] || 1
        if (curLv < (maxLvs[subject]||8)) {
          dispatch({ type:ACTIONS.UNLOCK_LEVEL, payload:{ world:subject, newLevel:curLv+1 } })
          showToast(`✨ ปลดล็อก Level ${curLv+1}!`)
          spawnConfetti(15); playTone('unlock')
        }
      }
      if (p >= 0.9) { playTone('fanfare'); spawnConfetti(30) }
      else if (p >= 0.8) playTone('complete')
      dispatch({ type:ACTIONS.LOG_SESSION, payload:{
        ts:sessionStart.current, world:subject, missionId:null, level:lv?.id||1,
        dur:Date.now()-sessionStart.current, score:p,
        wrong:TOTAL_QS-scoreRef.current, hints:0, completed:p>=0.8,
        nextAction:null, phaseStats:null,
      }})
      setDone(true)
    } else {
      setCur(c => c + 1)
    }
  }

  const q = qs[cur]
  const onSpeak = () => {
    if (!q) return
    if (subject === 'thai' && q.ttsWord) speakTh(q.ttsWord)
    if (subject === 'eng' && q.ttsWord) speakEn(q.ttsWord)
  }

  if (done) {
    return <ResultScreen score={score} total={TOTAL_QS} xp={xp} subject={subject} onReplay={onReset} onHome={() => navigate('home')} />
  }
  if (!q) return null

  const modeProps = { q, cur, total:TOTAL_QS, streak, subject, onCorrect:handleCorrect, onWrong:handleWrong, onNext:handleNext, onSpeak }

  if (mode === 'battle') return <BattleMode {...modeProps} />
  if (mode === 'chase')  return <ChaseMode {...modeProps} />
  return <DefenseMode {...modeProps} />
}

// ── Default export — outer wrapper enables session key-based replay ─────────────

export default function GameSubjectAdventure({ navigate, subject }) {
  const [sessionKey, setSessionKey] = useState(0)
  return <Session key={sessionKey} navigate={navigate} subject={subject} onReset={() => setSessionKey(k => k+1)} />
}
