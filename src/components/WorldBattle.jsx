import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS, scaleMonsterStats, dispatchAddCoins } from '../context/StateContext.jsx'
import { speakTh, speakEn, playBGM, stopBGM, playSFX, playTone } from '../lib/audio.js'
import MoveSelectBattleMode from '../games/MoveSelectBattleMode.jsx'
import RewardChest from '../components/RewardChest.jsx'
import { rollBattleItem } from '../config/itemConfig.js'
import { selectBattleQuestion } from '../lib/questionBank.js'
import TeachingMoment from './TeachingMoment.jsx'
import { computeBossRank, isBetterRank, RANK_COPY, RANK_BONUS_COINS } from '../lib/battleRanks.js'

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

// ── WorldBattle ────────────────────────────────────────────────────────────────
//
// Question generation (2026-07-09, Phase 1.1): this file used to own its own
// level-based generators (genThaiMoveQ/genMathQ/genEngMoveQ + the shared
// genSequenceQ/genFillGapQ/genVisualDiscriminationQ/genMemoryCardQ helpers).
// Those are now superseded by the node-driven curriculum system —
// selectBattleQuestion() in src/lib/questionBank.js covers the same 5 real
// input modes (choice/numpad/wordbuild/sequence/memory) plus the fillgap/
// visual_discrimination question-category variants, built on
// src/lib/curriculum.js's 43-node tree instead of the old per-subject LEVELS
// config. This is a straight replacement, not a parallel system — LEVELS/
// getLevelConfig's only consumer here was genMoveQuestion, which no longer
// exists. (The separate GameThai.jsx/GameMath.jsx/GamePhonics.jsx/
// GameMathBattle.jsx "practice mode" screens still have their own independent
// level-based generators, driven by the older levelMastery/subjectLevels
// system — deliberately left untouched this session, see the Phase 1.1
// handoff note on scope.)

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

  // SPEC GAME-B §B.4 (2026-07-12) — boss phase 2 (<=50% HP) review-question
  // weight boost + per-battle hint-use tally (feeds the boss victory rank).
  // Declared before `qs` below since its initializer reads bossPhaseRef.
  const bossPhaseRef   = useRef(false)
  const hintsUsedRef   = useRef(0)

  // Generate initial question bank (loops continuously). Node-driven per Phase
  // 1.1 — selectBattleQuestion reads state.activeNodes/skillMastery directly,
  // so the old per-enemy `level` config is no longer consulted here.
  const [qs, setQs] = useState(() =>
    Array.from({ length: TOTAL_QS }, () => selectBattleQuestion(subject, state, { reviewBoost: bossPhaseRef.current }))
  )
  const [cur, setCur]          = useState(0)
  const [pendingRewards, setPendingRewards] = useState(null)
  const [pendingBattleCoins, setPendingBattleCoins] = useState(0)
  const [pendingRank, setPendingRank] = useState(null)
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
      setQs(Array.from({ length: TOTAL_QS }, () => selectBattleQuestion(subject, state, { reviewBoost: bossPhaseRef.current })))
      setCur(0)
    }
  }

  // SPEC GAME-B §B.4 (2026-07-12)
  function onHintUsedHandler() { hintsUsedRef.current += 1 }
  function onBossPhase2() { bossPhaseRef.current = true }

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
      level: state.activeNodes?.[subject] ?? null, score: accuracy,
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

    // SPEC GAME-B §B.4 (2026-07-12) — victory rank (boss battles only, per
    // the spec's "Store per-boss best" — regular encounters don't rank).
    // S bonus is folded into the single coin dispatch below rather than a
    // second dispatchAddCoins call, so the "ting-ting" SFX doesn't double-fire.
    let rank = null
    let rankBonusCoins = 0
    if (isBossBattle) {
      rank = computeBossRank(accuracy, hintsUsedRef.current)
      const wKey = String(state.worldLevel ?? 0)
      if (isBetterRank(rank, state.bossRanks?.[wKey])) {
        dispatch({ type: ACTIONS.RECORD_BOSS_RANK, payload: { worldLevel: state.worldLevel ?? 0, rank } })
      }
      rankBonusCoins = RANK_BONUS_COINS[rank] ?? 0
      setPendingRank(rank)
    }

    // Coin reward: boss = 15, regular = 10 (+ rank bonus on a boss S-rank)
    const battleCoins = (isBossBattle ? 15 : 10) + rankBonusCoins
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
          rank={pendingRank}
          rankCopy={pendingRank ? RANK_COPY[pendingRank] : null}
          onDone={() => {
            setPendingRewards(null)
            setPendingRank(null)
            dispatch({ type: ACTIONS.CLEAR_PENDING_REWARDS })
            dispatch({ type: ACTIONS.RETURN_FROM_WORLD_BATTLE })
            navigate('world')
          }}
        />
      )}
      {/* Phase 1.3: full-screen teaching-moment overlay, additive on top of the
          still-mounted battle UI underneath — same pattern as RewardChest above
          (not a replacement/unmount, so no risk to MoveSelectBattleMode's
          internal refs/HP state while the intervention is showing). */}
      {state.pendingTeaching && <TeachingMoment />}
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
        onHintUsed={onHintUsedHandler}
        onBossPhase2={onBossPhase2}
      />
    </div>
  )
}
