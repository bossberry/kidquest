import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS, scaleMonsterStats, dispatchAddCoins } from '../context/StateContext.jsx'
import { TH_ALPHA, EN_ALPHA, LEVELS, MATH_WORDS, PATTERN_SETS, COUNTABLES, shuffle,
         SPELL_L1, TH_L2, TH_L3, TH_L5, CVC_WORDS, SIGHT_DATA, ENG_SENTS } from '../config/gameConfig.js'
import { speakTh, speakEn, playBGM, stopBGM, playSFX, playTone } from '../lib/audio.js'
import MoveSelectBattleMode from '../games/MoveSelectBattleMode.jsx'
import RewardChest from '../components/RewardChest.jsx'
import { rollBattleItem } from '../config/itemConfig.js'

const HOME_DROP_TABLE = [
  { key: 'food',         weight: 50 },
  { key: 'ribbon',       weight: 25 },
  { key: 'shoes',        weight: 15 },
  { key: 'rainbow_star', weight: 10 },
]
function rollHomeItem() {
  if (Math.random() > 0.40) return null
  const total = HOME_DROP_TABLE.reduce((s, d) => s + d.weight, 0)
  let r = Math.random() * total
  for (const d of HOME_DROP_TABLE) { r -= d.weight; if (r <= 0) return d.key }
  return HOME_DROP_TABLE[0].key
}

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

function genSequenceQ(alphaList, isThai) {
  const runLen = Math.random() < 0.5 ? 3 : 4
  const maxStart = alphaList.length - runLen
  const start = Math.floor(Math.random() * (maxStart + 1))
  const run = alphaList.slice(start, start + runLen)
  const correctOrder = run.map(item => item.char ?? item.letter)
  const spokenOrder = correctOrder.join(', ')
  return {
    isSequence: true,
    inputMode: 'sequence',
    sequenceChars: correctOrder,
    ttsWord: null,
    instructionTh: isThai
      ? `เรียงตามลำดับนี้ ${spokenOrder}`
      : 'แตะตัวอักษรให้เรียงตามลำดับ',
    instructionEn: !isThai
      ? `Tap them in this order: ${spokenOrder}`
      : 'Tap the letters in the correct order',
  }
}

function genFillGapQ(alphaList) {
  const runLen = 3
  const maxStart = alphaList.length - runLen
  const start = Math.floor(Math.random() * (maxStart + 1))
  const run = alphaList.slice(start, start + runLen)
  const chars = run.map(item => item.char ?? item.letter)
  const answer = chars[1]
  const before = chars[0]
  const after  = chars[2]
  const allChars = alphaList.map(item => item.char ?? item.letter)
  const excludeIdx = new Set([start, start + 1, start + 2])
  const farChars = allChars.filter((_, i) => !excludeIdx.has(i))
  const wrongs = []
  while (wrongs.length < 3 && farChars.length) {
    const idx = Math.floor(Math.random() * farChars.length)
    wrongs.push(farChars.splice(idx, 1)[0])
  }
  return {
    isFillGap: true,
    inputMode: 'choice',
    gapBefore: before,
    gapAfter: after,
    answer,
    choices: shuffle([answer, ...wrongs]),
    instructionTh: 'แตะตัวอักษรที่หายไป',
    instructionEn: 'Tap the missing letter',
  }
}

const TH_CONFUSABLE_GROUPS = [
  ['ก','ถ','ภ'], ['บ','ป'], ['ผ','ฝ'], ['ค','ด'], ['ฎ','ฏ'], ['ษ','ศ','ส'],
]
const EN_CONFUSABLE_GROUPS = [
  ['b','d'], ['p','q'], ['m','w'], ['n','u'], ['f','t'], ['i','j','l'],
]

function genVisualDiscriminationQ(alphaList, isThai) {
  const groups = isThai ? TH_CONFUSABLE_GROUPS : EN_CONFUSABLE_GROUPS
  const group = groups[Math.floor(Math.random() * groups.length)]
  const target = group[Math.floor(Math.random() * group.length)]
  const otherInGroup = group.filter(c => c !== target)
  const allChars = alphaList.map(item => item.char ?? item.letter).filter(c => !group.includes(c))
  const wrongs = [...otherInGroup]
  while (wrongs.length < 3 && allChars.length) {
    const idx = Math.floor(Math.random() * allChars.length)
    wrongs.push(allChars.splice(idx, 1)[0])
  }
  return {
    isVisualDiscrim: true,
    inputMode: 'choice',
    targetChar: target,
    answer: target,
    choices: shuffle([target, ...wrongs.slice(0, 3)]),
    instructionTh: 'แตะตัวที่เหมือนกัน',
    instructionEn: 'Tap the matching letter',
  }
}

function genMemoryCardQ(alphaList) {
  const items = shuffle([...alphaList]).slice(0, 3)
  const cards = []
  items.forEach((item, i) => {
    const ch = item.char ?? item.letter
    cards.push({ id: `card_${i}_emoji`, pairId: i, display: item.emoji, type: 'emoji' })
    cards.push({ id: `card_${i}_char`,  pairId: i, display: ch,         type: 'char'  })
  })
  return {
    isMemoryCard: true,
    inputMode: 'memory',
    memoryCards: shuffle(cards),
    memoryPairCount: items.length,
    instructionTh: 'แตะเปิดไพ่ให้เจอคู่ที่เหมือนกัน',
    instructionEn: 'Flip cards to find matching pairs',
  }
}

function genMathQ(lv) {
  if (lv?.op === 'count') {
    const emoji = COUNTABLES[Math.floor(Math.random() * COUNTABLES.length)]
    const n = Math.floor(Math.random() * 5) + 1
    const w = new Set()
    while (w.size < 3) { const v = Math.floor(Math.random()*5)+1; if(v!==n) w.add(v) }
    const inputMode = Math.random() < 0.4 ? 'numpad' : 'choice'
    return { isCount:true, objects:Array(n).fill(emoji), answer:n, choices:shuffle([n,...w]), inputMode }
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
  const inputMode = Math.random() < 0.5 ? 'numpad' : 'choice'
  return { a, b, op, answer:ans, choices:shuffle([ans,...w]), inputMode }
}

function genThaiMoveQ(lv) {
  const id = lv?.id ?? 1

  // 15% chance for levels 1-4 to be a letter-sequencing question instead
  if (id <= 4 && Math.random() < 0.15) {
    return genSequenceQ(TH_ALPHA, true)
  }
  // 10% chance for levels 1-2 to be a fill-the-gap question
  if (id <= 2 && Math.random() < 0.10) {
    return genFillGapQ(TH_ALPHA)
  }
  // 10% chance for levels 1-2 to be a visual discrimination question
  if (id <= 2 && Math.random() < 0.10) {
    return genVisualDiscriminationQ(TH_ALPHA, true)
  }
  // 8% chance for levels 1-2 to be a memory card matching round
  if (id <= 2 && Math.random() < 0.08) {
    return genMemoryCardQ(TH_ALPHA)
  }

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
    const inputMode = Math.random() < 0.5 ? 'wordbuild' : 'choice'
    return { isThai:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...wrongs.map(w=>w.word)]), word:correct.emoji, chars:correct.chars, inputMode }
  }
  if (id === 3) {
    // Level 3: TH_L2 — see emoji, choose correct animal word
    const items = shuffle([...TH_L2])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    const inputMode = Math.random() < 0.5 ? 'wordbuild' : 'choice'
    return { isThai:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...wrongs.map(w=>w.word)]), word:correct.emoji, chars:correct.chars, inputMode }
  }
  if (id === 4) {
    // Level 4: TH_L3 — see emoji, choose correct 3-syllable word (fruits/objects)
    const items = shuffle([...TH_L3])
    const correct = items[0]; const wrongs = items.slice(1, 4)
    const inputMode = Math.random() < 0.5 ? 'wordbuild' : 'choice'
    return { isThai:true, ttsWord:correct.word, answer:correct.word, choices:shuffle([correct.word,...wrongs.map(w=>w.word)]), word:correct.emoji, chars:correct.chars, inputMode }
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

  // 15% chance across ALL English levels to be a letter-sequencing question
  if (Math.random() < 0.15) {
    return genSequenceQ(EN_ALPHA, false)
  }
  // 10% chance across ALL English levels to be a fill-the-gap question
  if (Math.random() < 0.10) {
    return genFillGapQ(EN_ALPHA)
  }
  // 10% chance across ALL English levels to be a visual discrimination question
  if (Math.random() < 0.10) {
    return genVisualDiscriminationQ(EN_ALPHA, false)
  }
  // 8% chance across ALL English levels to be a memory card matching round
  if (Math.random() < 0.08) {
    return genMemoryCardQ(EN_ALPHA)
  }

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
    const inputMode = Math.random() < 0.5 ? 'wordbuild' : 'choice'
    return {
      isEng:true, ttsWord:correct.word, answer:correct.word,
      choices:shuffle([correct.word,...correct.alts.slice(0,3)]),
      word:correct.emoji,
      chars: correct.word.split(''),
      inputMode,
    }
  }
  if (type === 'sight') {
    // Level 3: sight words — see picture, choose word that fills the blank
    const item = SIGHT_DATA[Math.floor(Math.random() * SIGHT_DATA.length)]
    const inputMode = Math.random() < 0.35 ? 'wordbuild' : 'choice'
    return {
      isEng:true, ttsWord:item.sentence.replace('___', item.blank),
      answer:item.blank, choices:shuffle([...item.choices]),
      word:item.emoji,
      question:item.sentence,
      chars: inputMode === 'wordbuild' ? item.blank.split('') : undefined,
      inputMode,
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
  const [cur, setCur]          = useState(0)
  const [pendingRewards, setPendingRewards] = useState(null)
  const [pendingBattleCoins, setPendingBattleCoins] = useState(0)
  const streakRef      = useRef(0)
  const scoreRef       = useRef(0)
  const accuracyRef    = useRef({ correct: 0, total: 0 })
  const startTime      = useRef(Date.now())
  const doneRef        = useRef(false)
  const mountedRef     = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    playBGM('battle')
    return () => stopBGM()
  }, [])

  useEffect(() => { if (!enemy) navigate('world') }, []) // eslint-disable-line

  if (!enemy || !scaledEnemy) return null

  const creatureCurrentHP = Math.min(
    creatureStats.HP,
    creature?.currentHP ?? creatureStats.HP
  )

  function onCorrect() {
    const isCrit = streakRef.current >= 2
    const earned = 8 + (isCrit ? 4 : 0)
    scoreRef.current++
    accuracyRef.current.correct++
    accuracyRef.current.total++
    streakRef.current++
    dispatch({ type: ACTIONS.ADD_XP, payload: { world: subject, amount: earned } })
    // Bond 75%+: passive heal +1 HP per correct answer
    if (creatureId && (creature?.bondMeter ?? 0) >= 75) {
      dispatch({ type: ACTIONS.CREATURE_HEAL, payload: { creatureId, amount: 1 } })
    }
    return { earned, isCrit }
  }

  function onWrong() {
    accuracyRef.current.total++
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
    const accuracy = accuracyRef.current.total > 0
      ? accuracyRef.current.correct / accuracyRef.current.total
      : 0
    const isStrong = accuracy >= 0.80 && accuracyRef.current.total >= 8
    const dur = Math.floor((Date.now() - startTime.current) / 1000)
    dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: streakRef.current, score: accuracy } })
    dispatch({ type: ACTIONS.LOG_SESSION, payload: {
      ts: Date.now(), world: subject,
      missionId: `world-${enemy.type}`,
      level: levelConfig.id, score: accuracy,
      questionsAnswered: accuracyRef.current.total,
      wrong: accuracyRef.current.total - accuracyRef.current.correct,
      dur, completed: true,
    }})

    // Adaptive difficulty: 3 consecutive strong sessions → level up; streak resets on any non-strong session
    if (!isBossBattle) {
      const MAX_LEVEL = { thai: 5, math: 8, eng: 4 }
      const curLevel  = state.subjectLevels?.[subject] ?? 1
      const curStreak = state.subjectSessionStreak?.[subject] ?? 0
      if (isStrong) {
        const newStreak = curStreak + 1
        dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: newStreak } })
        if (newStreak >= 3 && curLevel < (MAX_LEVEL[subject] ?? 5)) {
          const newLevel = Math.min(curLevel + 1, MAX_LEVEL[subject] ?? 5)
          dispatch({ type: ACTIONS.SET_SUBJECT_LEVEL, payload: { subject, level: newLevel } })
          dispatch({ type: ACTIONS.SET_PENDING_LEVEL_UP, payload: { subject, oldLevel: curLevel, newLevel } })
          dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: 0 } })
        }
      } else {
        // Always reset streak when not strong — prevents gradual drift
        dispatch({ type: ACTIONS.SET_SUBJECT_SESSION_STREAK, payload: { subject, streak: 0 } })
        if (accuracy < 0.50 && accuracyRef.current.total >= 8) {
          const floor = state.subjectLevelFloor?.[subject] ?? 1
          if (curLevel > floor) {
            dispatch({ type: ACTIONS.SET_SUBJECT_LEVEL, payload: { subject, level: curLevel - 1 } })
          }
        }
      }
    }

    if (isBossBattle) {
      playSFX('victory')
      playTone('fanfare')
      dispatch({ type: ACTIONS.DEFEAT_BOSS })
    }

    // Coin reward: boss = 15, regular = 10
    const battleCoins = isBossBattle ? 15 : 10
    setPendingBattleCoins(battleCoins)
    dispatchAddCoins(dispatch, battleCoins)

    // Roll rewards
    const battleItemDrop = rollBattleItem()
    const homeItemDrop   = rollHomeItem()
    const rewards = []
    if (battleItemDrop) rewards.push({ type: 'battle', key: battleItemDrop })
    if (homeItemDrop)   rewards.push({ type: 'home',   key: homeItemDrop })

    if (battleItemDrop) dispatch({ type: ACTIONS.DROP_BATTLE_ITEM, payload: { key: battleItemDrop } })
    if (homeItemDrop)   dispatch({ type: ACTIONS.DROP_HOME_ITEM,   payload: { key: homeItemDrop } })
    dispatch({ type: ACTIONS.SET_PENDING_REWARDS, payload: rewards })

    // Show chest overlay — navigation happens in onDone
    setPendingRewards(rewards)
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
    if (q?.ttsWord) {
      if (subject === 'thai') speakTh(q.ttsWord)
      else if (subject === 'eng') speakEn(q.ttsWord)
      return
    }
    if (q?.instructionTh && subject === 'thai') { speakTh(q.instructionTh); return }
    if (q?.instructionEn && subject === 'eng')  { speakEn(q.instructionEn); return }
  }

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column' }}>
      {pendingRewards !== null && (
        <RewardChest
          rewards={pendingRewards}
          coins={pendingBattleCoins}
          onDone={() => {
            setPendingRewards(null)
            dispatch({ type: ACTIONS.CLEAR_PENDING_REWARDS })
            dispatch({ type: ACTIONS.RETURN_FROM_WORLD_BATTLE })
            navigate('world')
          }}
        />
      )}
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
