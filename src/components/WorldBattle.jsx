import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { TH_ALPHA, EN_ALPHA, LEVELS, MATH_WORDS, PATTERN_SETS, COUNTABLES, shuffle } from '../config/gameConfig.js'
import { speakTh, speakEn, playBGM, stopBGM } from '../lib/audio.js'
import MoveSelectBattleMode from '../games/MoveSelectBattleMode.jsx'

const TOTAL_QS = 8

const WORLD_ENEMY_NAMES = {
  bunny:        'กระต่ายหลับ',
  sleepy_bunny: 'กระต่ายหลับ',
  slime:        'สไลม์กระโดด',
  bouncy_slime: 'สไลม์กระโดด',
  fox:          'จิ้งจอกน้อย',
  fox_kit:      'จิ้งจอกน้อย',
  egg_pawn:     'Egg Pawn',
  leaf_sprite:  'นางไม้ใบ',
  grumpy_mole:  'ตุ่นบึ้กตึง',
  mushroom_imp: 'เห็ดนิสัยซน',
}

// ── Question generators (same as GameSubjectAdventure move-question variants) ─

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

function genThaiMoveQ() {
  const items = shuffle([...TH_ALPHA])
  const correct = items[0]
  const wrongs  = items.slice(1, 4)
  return {
    isThai:  true,
    ttsWord: correct.word,
    answer:  correct.emoji,
    choices: shuffle([correct.emoji, ...wrongs.map(w => w.emoji)]),
    word:    correct.word,
  }
}

function genEngMoveQ() {
  const items = shuffle([...EN_ALPHA])
  const correct = items[0]
  const wrongs  = items.slice(1, 4)
  return {
    isEng:   true,
    ttsWord: correct.word,
    answer:  correct.emoji,
    choices: shuffle([correct.emoji, ...wrongs.map(w => w.emoji)]),
    word:    correct.word,
  }
}

function genMoveQuestion(subject, lv) {
  if (subject === 'math') return genMathQ(lv)
  if (subject === 'thai') return genThaiMoveQ()
  return genEngMoveQ()
}

function getLevelConfig(subject, levelId) {
  const id = typeof levelId === 'number' ? levelId : 1
  return LEVELS[subject]?.find(l => l.id === id) || LEVELS[subject]?.[0] || { id:1 }
}

// ── WorldBattle ────────────────────────────────────────────────────────────────

export default function WorldBattle({ navigate }) {
  const { state, dispatch, eggStatsData, eggProgressData } = useAppState()
  const enemy = state.worldBattleEnemy // { type, subject, level }

  // Compute stable values from enemy data (fixed for duration of this battle)
  const subject     = enemy?.subject || 'thai'
  const enemyType   = enemy?.type    || 'bunny'
  const levelConfig = getLevelConfig(subject, enemy?.level)
  const enemyData   = { name: WORLD_ENEMY_NAMES[enemyType] || 'ศัตรู', type: enemyType, isBoss: false }

  const [qs] = useState(() =>
    Array.from({ length: TOTAL_QS }, () => genMoveQuestion(subject, levelConfig))
  )
  const [cur, setCur]   = useState(0)
  const streakRef       = useRef(0)
  const scoreRef        = useRef(0)
  const startTime       = useRef(Date.now())
  const doneRef         = useRef(false)
  const mountedRef      = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    playBGM('battle')
    return () => stopBGM()
  }, [])

  useEffect(() => { if (!enemy) navigate('world') }, []) // eslint-disable-line

  if (!enemy) return null

  function onCorrect() {
    const isCrit = streakRef.current >= 2
    const earned = 8 + (isCrit ? 4 : 0)
    scoreRef.current++
    streakRef.current++
    dispatch({ type: ACTIONS.ADD_XP, payload: { world: subject, amount: earned } })
    return { earned, isCrit }
  }

  function onWrong() {
    streakRef.current = 0
  }

  // Advance to next question (called between questions, not on victory)
  function onNext() {
    const nextCur = cur + 1
    if (nextCur < TOTAL_QS) setCur(nextCur)
  }

  // Finalize battle — called once on victory (KO or last question)
  function onComplete() {
    if (doneRef.current) return
    doneRef.current = true
    stopBGM()
    const score = scoreRef.current / TOTAL_QS
    const dur   = Math.floor((Date.now() - startTime.current) / 1000)
    dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: streakRef.current, score } })
    dispatch({ type: ACTIONS.LOG_SESSION, payload: {
      ts: Date.now(), world: subject,
      missionId: `world-${enemyType}`,
      level: levelConfig.id, score,
      wrong: TOTAL_QS - scoreRef.current,
      dur, completed: true,
    }})
    dispatch({ type: ACTIONS.RETURN_FROM_WORLD_BATTLE })
    navigate('world')
  }

  function onSpeak() {
    const q = qs[cur]
    if (!q?.ttsWord) return
    if (subject === 'thai') speakTh(q.ttsWord)
    else if (subject === 'eng') speakEn(q.ttsWord)
  }

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column' }}>
      <MoveSelectBattleMode
        q={qs[cur]}
        cur={cur}
        total={TOTAL_QS}
        streak={streakRef.current}
        subject={subject}
        onCorrect={onCorrect}
        onWrong={onWrong}
        onNext={onNext}
        onComplete={onComplete}
        onSpeak={onSpeak}
        eggStats={eggStatsData}
        eggProgress={eggProgressData}
        readyToHatch={state.readyToHatch}
        isFirstLevel={false}
        enemyData={enemyData}
        showReturnButton={true}
      />
    </div>
  )
}
