import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS, scaleMonsterStats } from '../context/StateContext.jsx'
import { TH_ALPHA, EN_ALPHA, LEVELS, MATH_WORDS, PATTERN_SETS, COUNTABLES, shuffle,
         SPELL_L1, TH_L2, TH_L3, TH_L5, CVC_WORDS, SIGHT_DATA, ENG_SENTS } from '../config/gameConfig.js'
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
  baby_zombie:  'เบบี้ซอมบี้',
  snake:        'งูยักษ์',
}

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

function genThaiMoveQ(lv) {
  const id = lv?.id ?? 1

  if (id <= 1) {
    // Level 1: alphabet match — hear word, tap correct emoji
    const items = shuffle([...TH_ALPHA])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    return { isThai:true, ttsWord:correct.word, answer:correct.emoji, choices:shuffle([correct.emoji,...wrongs.map(w=>w.emoji)]), word:correct.word }
  }
  if (id === 2) {
    // Level 2: SPELL_L1 — see emoji, choose correct 2-char word (อา/อิ/อู/เ/โ vowels)
    const items = shuffle([...SPELL_L1])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    return { isThai:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...wrongs.map(w=>w.word)]), word:correct.emoji }
  }
  if (id === 3) {
    // Level 3: TH_L2 — see emoji, choose correct animal word
    const items = shuffle([...TH_L2])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    return { isThai:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...wrongs.map(w=>w.word)]), word:correct.emoji }
  }
  if (id === 4) {
    // Level 4: TH_L3 — see emoji, choose correct 3-syllable word (fruits/objects)
    const items = shuffle([...TH_L3])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    return { isThai:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...wrongs.map(w=>w.word)]), word:correct.emoji }
  }
  // Level 5: TH_L5 — see emoji, choose correct short sentence
  const items = shuffle([...TH_L5])
  const correct = items[0]; const wrongs = items.slice(1, 4)
  const correctSentence = correct.words.join('')
  return {
    isThai:true, ttsWord:correct.sound || correctSentence,
    answer:correctSentence,
    choices:shuffle([correctSentence,...wrongs.map(w=>w.words.join(''))]),
    word:correct.emoji,
  }
}

function genEngMoveQ(lv) {
  const type = lv?.type || 'phonics'

  if (type === 'phonics') {
    // Level 1: A–Z phonics — hear word, tap correct emoji
    const items = shuffle([...EN_ALPHA])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    return { isEng:true, ttsWord:correct.word, answer:correct.emoji, choices:shuffle([correct.emoji,...wrongs.map(w=>w.emoji)]), word:correct.word }
  }
  if (type === 'cvc') {
    // Level 2: CVC words — see emoji, choose correct spelling
    const items = shuffle([...CVC_WORDS])
    const correct = items[0]
    return { isEng:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...correct.alts.slice(0,3)]), word:correct.emoji }
  }
  if (type === 'sight') {
    // Level 3: sight words — see picture, choose word that fills the blank
    const item = SIGHT_DATA[Math.floor(Math.random() * SIGHT_DATA.length)]
    return {
      isEng:true, ttsWord:item.sentence.replace('___', item.blank),
      answer:item.blank, choices:shuffle([...item.choices]),
      word:item.emoji,
      question:item.sentence,  // shown in Zone 2 when present (smaller font)
    }
  }
  // Level 4: sentences — see emoji, choose correct full sentence
  const items = shuffle([...ENG_SENTS])
  const correct = items[0]; const wrongs = items.slice(1, 4)
  const correctSentence = correct.words.join(' ')
  return {
    isEng:true, ttsWord:correctSentence, answer:correctSentence,
    choices:shuffle([correctSentence,...wrongs.map(w=>w.words.join(' '))]),
    word:correct.emoji,
  }
}

function genMoveQuestion(subject, lv) {
  if (subject === 'math') return genMathQ(lv)
  if (subject === 'thai') return genThaiMoveQ(lv)
  return genEngMoveQ(lv)
}

function getLevelConfig(subject, levelId) {
  const id = typeof levelId === 'number' ? levelId : 1
  return LEVELS[subject]?.find(l => l.id === id) || LEVELS[subject]?.[0] || { id:1 }
}

// ── WorldBattle ────────────────────────────────────────────────────────────────

export default function WorldBattle({ navigate }) {
  const { state, dispatch, eggStatsData, eggProgressData } = useAppState()
  const enemy = state.worldBattleEnemy  // { type, subject, level, hp, atk, nameTH }

  // Resolve creature in party
  const creatureId    = state.battleCreatureId
  const creature      = (state.hatchedEggs || []).find(e => e.id === creatureId)
  const creatureLevel = creature?.battleLevel ?? 1

  // Scale creature stats to world-battle range.
  // calcCreatureStats produces baseStat=100 scale: ATK≈40-70, HP≈120-200.
  // World enemies are balanced for ATK=4-5, HP=32-52 — divide by ~10-14.
  const WB_STAT_SCALE = 0.07   // ATK/DEF: ~60 → 4  (11 hits vs easiest enemy)

  const creatureStats = React.useMemo(() => {
    const base = creature?.stats ?? {}
    const lvBonus = creatureLevel - 1
    const bond = creature?.bondMeter ?? 0
    // Bond unlock combat bonuses
    const atkMult = bond >= 100 ? 1.5 : bond >= 25 ? 1.05 : 1.0  // 25%→+5%, 100%→+50%
    const spdBonus = bond >= 50 ? 30 : 0                            // 50%→+15% dodge
    return {
      ...base,
      HP:  Math.max(15, Math.round(base.HP  ?? 100) + lvBonus),
      ATK: Math.max(3,  Math.round(Math.round((base.ATK ?? 50)  * WB_STAT_SCALE) * atkMult) + Math.floor(lvBonus * 0.5)),
      DEF: Math.max(0,  Math.round((base.DEF ?? 50)  * WB_STAT_SCALE)),
      SPD: (base.SPD ?? 40) + spdBonus,
    }
  }, [creature, creatureLevel]) // eslint-disable-line

  // Scale enemy stats by creature battle level
  const scaledEnemy = React.useMemo(() => {
    if (!enemy) return null
    const baseHP  = enemy.hp  ?? 200
    const baseATK = enemy.atk ?? 10
    const baseDEF = enemy.def ?? 0
    const scaled  = scaleMonsterStats({ HP: baseHP, ATK: baseATK, DEF: baseDEF }, creatureLevel)
    return {
      ...enemy,
      name: enemy.nameTH ?? WORLD_ENEMY_NAMES[enemy.type] ?? 'ศัตรู',
      hp:   scaled.hp,
      atk:  scaled.atk,
      def:  scaled.def,
      type: enemy.type || 'bunny',
      isBoss: !!enemy.isBossBattle,
    }
  }, [enemy, creatureLevel]) // eslint-disable-line

  const isBossBattle = !!(enemy?.isBossBattle)

  const subject     = enemy?.subject || 'thai'
  const levelConfig = getLevelConfig(subject, enemy?.level)

  // Generate initial question bank (loops continuously)
  const [qs, setQs] = useState(() =>
    Array.from({ length: TOTAL_QS }, () => genMoveQuestion(subject, levelConfig))
  )
  const [cur, setCur]  = useState(0)
  const streakRef      = useRef(0)
  const scoreRef       = useRef(0)
  const startTime      = useRef(Date.now())
  const doneRef        = useRef(false)
  const mountedRef     = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    playBGM('battle')
    return () => stopBGM()
  }, [])

  useEffect(() => { if (!enemy) navigate('world') }, []) // eslint-disable-line

  // Debug log — verify level rotation is working across battles
  useEffect(() => {
    if (!enemy) return
    console.log('🎮 Battle started:', {
      subject,
      levelId: levelConfig?.id,
      levelName: levelConfig?.name,
      levelType: levelConfig?.type ?? levelConfig?.op,
      questionCount: qs.length,
      firstQuestion: qs[0]?.question ?? qs[0]?.word ?? qs[0]?.story ?? '?',
      xpThai: state.xpThai, xpMath: state.xpMath, xpEng: state.xpEng,
      dailyBattleRounds: state.dailyBattleRounds,
    })
  }, []) // eslint-disable-line

  if (!enemy || !scaledEnemy) return null

  const creatureCurrentHP = Math.min(
    creatureStats.HP,
    creature?.currentHP ?? creatureStats.HP
  )

  function onCorrect() {
    const isCrit = streakRef.current >= 2
    const earned = 8 + (isCrit ? 4 : 0)
    scoreRef.current++
    streakRef.current++
    dispatch({ type: ACTIONS.ADD_XP, payload: { world: subject, amount: earned } })
    // Bond 75%+: passive heal +1 HP per correct answer
    if (creatureId && (creature?.bondMeter ?? 0) >= 75) {
      dispatch({ type: ACTIONS.CREATURE_HEAL, payload: { creatureId, amount: 1 } })
    }
    return { earned, isCrit }
  }

  function onWrong() {
    streakRef.current = 0
  }

  // Loop questions indefinitely — victory comes from enemy HP=0, not question count
  function onNext() {
    const nextIdx = cur + 1
    if (nextIdx < TOTAL_QS) {
      setCur(nextIdx)
    } else {
      // Regenerate fresh bank and restart from 0
      setQs(Array.from({ length: TOTAL_QS }, () => genMoveQuestion(subject, levelConfig)))
      setCur(0)
    }
  }

  function handleCreatureTakeDamage(damage) {
    if (!creatureId) return
    dispatch({ type: ACTIONS.CREATURE_TAKE_DAMAGE, payload: { creatureId, damage } })
  }

  function handleBattleXP(xp) {
    if (!creatureId) return
    dispatch({ type: ACTIONS.CREATURE_GAIN_BATTLE_XP, payload: { creatureId, xp } })
    dispatch({ type: ACTIONS.INCREMENT_BATTLE_WINS })
    // Party slot milestones by battle win count (research doc spec)
    const newWins = (state.battleWins ?? 0) + 1
    if ((state.partySlots ?? 1) < 2 && newWins >= 10) {
      dispatch({ type: ACTIONS.UNLOCK_PARTY_SLOT })
    }
    if ((state.partySlots ?? 1) < 4 && newWins >= 50) {
      dispatch({ type: ACTIONS.UNLOCK_PARTY_SLOT })
    }
  }

  function onComplete() {
    if (doneRef.current) return
    doneRef.current = true
    stopBGM()
    const score = scoreRef.current / Math.max(1, scoreRef.current + (TOTAL_QS - scoreRef.current))
    const dur   = Math.floor((Date.now() - startTime.current) / 1000)
    dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: streakRef.current, score } })
    dispatch({ type: ACTIONS.LOG_SESSION, payload: {
      ts: Date.now(), world: subject,
      missionId: `world-${enemy.type}`,
      level: levelConfig.id, score,
      wrong: 0, dur, completed: true,
    }})

    // Adaptive difficulty: level up after 3 strong sessions, silent level down on weak
    if (!isBossBattle) {
      const MAX_LEVEL = { thai: 5, math: 8, eng: 4 }
      const curLevel  = state.subjectLevels?.[subject] ?? 1
      const curStreak = state.subjectSessionStreak?.[subject] ?? 0
      if (score >= 0.80) {
        const newStreak = curStreak + 1
        if (newStreak >= 3 && curLevel < (MAX_LEVEL[subject] ?? 5)) {
          const newLevel = curLevel + 1
          dispatch({ type: ACTIONS.SET_SUBJECT_LEVEL, payload: { subject, level: newLevel } })
          dispatch({ type: ACTIONS.SET_PENDING_LEVEL_UP, payload: { subject, oldLevel: curLevel, newLevel } })
          dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: 0 } })
        } else {
          dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: newStreak } })
        }
      } else if (score < 0.50) {
        const floor    = state.subjectLevelFloor?.[subject] ?? 1
        const newLevel = Math.max(floor, curLevel - 1)
        if (newLevel < curLevel) {
          dispatch({ type: ACTIONS.SET_SUBJECT_LEVEL, payload: { subject, level: newLevel } })
        }
        dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: 0 } })
      } else {
        dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: 0 } })
      }
    }

    if (isBossBattle) {
      dispatch({ type: ACTIONS.DEFEAT_BOSS })
    }
    dispatch({ type: ACTIONS.RETURN_FROM_WORLD_BATTLE })
    navigate('world')
  }

  function onFaint() {
    if (doneRef.current) return
    doneRef.current = true
    stopBGM()
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
        onFaint={onFaint}
        onSpeak={onSpeak}
        eggStats={eggStatsData}
        eggProgress={eggProgressData}
        readyToHatch={state.readyToHatch}
        isFirstLevel={false}
        enemyData={scaledEnemy}
        showReturnButton={true}
        isWorldBattle={true}
        isBossBattle={isBossBattle}
        creature={creature}
        creatureStats={creatureStats}
        creatureCurrentHP={creatureCurrentHP}
        creatureName={creature?.creature?.n}
        onCreatureTakeDamage={handleCreatureTakeDamage}
        onCreatureHeal={() => {}}
        onBattleXP={handleBattleXP}
      />
    </div>
  )
}
