import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import { KEY, defaultState, loadState, saveState, syncToSupabase } from '../lib/state.js'
import { supabase } from '../lib/supabase.js'
import { eggProgress, buildEggStats, totalXP, EGG_STAGES, STAGE_XP_NEEDED } from '../lib/eggAlgorithm.js'
import { ITEMS, GRADE_LABELS, todayStr, shuffle, calcCreatureStats, AI_OPPONENTS } from '../config/gameConfig.js'
import { getCreatureForHatch } from './creatureHelpers.js'

export const StateContext = createContext(null)

// Dynamic egg progression — first egg fast, later eggs gradually harder
// requiredXP = min(800, 120 + hatchedCount * 60)
// Eggs 1–5: 120 / 180 / 240 / 300 / 360 XP; cap 800 at egg 12+
function scaledEggProgress(state) {
  const eggsHatched = (state.hatchedEggs || []).length
  const required = Math.min(800, 120 + eggsHatched * 60)
  const xpPerStage = required / EGG_STAGES
  const total = (state.xpThai || 0) + (state.xpEng || 0) + (state.xpMath || 0)
  const capped = Math.min(total, required)
  const rawStage = capped / xpPerStage
  const stage = Math.min(EGG_STAGES - 1, Math.floor(rawStage))
  const lastStageStart = (EGG_STAGES - 1) * xpPerStage
  const inLast = stage >= EGG_STAGES - 1
  const withinStage = inLast ? Math.max(0, capped - lastStageStart) : capped % xpPerStage
  const stageXP = Math.round(withinStage)
  const pct = inLast
    ? Math.min(100, withinStage / xpPerStage * 100)
    : withinStage / xpPerStage * 100
  return { stage, stageXP, pct, xpPerStage: Math.round(xpPerStage), required }
}

export const ACTIONS = {
  INIT:               'INIT',
  ADD_XP:             'ADD_XP',
  ROUND_COMPLETE:     'ROUND_COMPLETE',
  HATCH_COMPLETE:     'HATCH_COMPLETE',
  CLOSE_HATCH:        'CLOSE_HATCH',
  USE_ITEM:           'USE_ITEM',
  DROP_ITEM:          'DROP_ITEM',
  SET_CURRENT_WORLD:  'SET_CURRENT_WORLD',
  SET_SESSION_XP:     'SET_SESSION_XP',
  UPDATE_THAI_MASTERY:'UPDATE_THAI_MASTERY',
  UPDATE_LEVEL_MASTERY:'UPDATE_LEVEL_MASTERY',
  UNLOCK_LEVEL:       'UNLOCK_LEVEL',
  SEEN_TEACH:         'SEEN_TEACH',
  ER_DEDUCT_LIFE:     'ER_DEDUCT_LIFE',
  ER_SAVE_SCORE:      'ER_SAVE_SCORE',
  UPDATE_HAPPINESS:   'UPDATE_HAPPINESS',
  CHECK_DAILY_RESET:  'CHECK_DAILY_RESET',
  DECAY_HAPPINESS:    'DECAY_HAPPINESS',
  SET_HATCHING:       'SET_HATCHING',
  RECORD_BATTLE:       'RECORD_BATTLE',
  SET_CHALLENGER:      'SET_CHALLENGER',
  CLEAR_CHALLENGER:    'CLEAR_CHALLENGER',
  FOUNDATION_COMPLETE: 'FOUNDATION_COMPLETE',
  SET_PROFILE:         'SET_PROFILE',
  UPDATE_SHOP_V1:      'UPDATE_SHOP_V1',
  LOG_SESSION:         'LOG_SESSION',
}

function reducer(state, action) {
  switch (action.type) {

    case ACTIONS.INIT:
      return { ...defaultState(), ...action.payload }

    case ACTIONS.ADD_XP: {
      const { world, amount, accDelta, speedDelta } = action.payload
      const boost = (state.xpBoostEnd || 0) > Date.now() ? (state.xpBoost || 1) : 1
      const earned = Math.round(amount * boost)
      const key = 'xp' + world.charAt(0).toUpperCase() + world.slice(1)
      const newXp = (state[key] || 0) + earned
      const newTotal = (state.xpThai || 0) + (state.xpEng || 0) + (state.xpMath || 0) + earned
      const eggsHatched = (state.hatchedEggs || []).length
      const hatchRequired = Math.min(800, 120 + eggsHatched * 60)
      const readyToHatch = newTotal >= hatchRequired && !state.hatched
      return {
        ...state,
        [key]: newXp,
        sessionXP: (state.sessionXP || 0) + earned,
        correctAnswers: (state.correctAnswers || 0) + 1,
        mins: (state.mins || 0) + 0.25,
        happiness: Math.min(100, (state.happiness || 80) + 2),
        acc: accDelta !== undefined ? Math.round((state.acc || 70) * 0.95 + accDelta * 0.05) : state.acc,
        speed: speedDelta !== undefined ? Math.round((state.speed || 50) * 0.9 + speedDelta * 0.1) : state.speed,
        firstSubject: state.firstSubject === -1 ? ['thai','eng','math'].indexOf(world) : state.firstSubject,
        readyToHatch,
      }
    }

    case ACTIONS.ROUND_COMPLETE: {
      const { streak, score } = action.payload
      const today = todayStr()
      const dailyReset = (state.lastPlayDate || '') !== today
      return {
        ...state,
        streak: Math.max(state.streak || 0, streak || 0),
        rounds: (state.rounds || 0) + 1,
        dailyRounds: (dailyReset ? 0 : (state.dailyRounds || 0)) + 1,
        lastPlayDate: today,
        badges: (score || 0) >= 0.9 ? (state.badges || 0) + 1 : (state.badges || 0),
        dailyBattleRounds: (dailyReset ? 0 : (state.dailyBattleRounds || 0)) + 1,
        lastBattleDate: today,
      }
    }

    case ACTIONS.HATCH_COMPLETE: {
      const { creature, eggStats, snapXpThai, snapXpEng, snapXpMath } = action.payload
      const tier = state.grade || 0
      const eggSnap = {
        tier,
        xpThai: snapXpThai,
        xpEng:  snapXpEng,
        xpMath: snapXpMath,
        acc:    state.acc    || 70,
        streak: state.streak || 0,
      }
      const newEgg = {
        creature,
        eggStats,
        xpThai: snapXpThai,
        xpEng: snapXpEng,
        xpMath: snapXpMath,
        grade: GRADE_LABELS[tier],
        tier,
        streak: state.streak || 0,
        acc:    state.acc    || 70,
        stats:  calcCreatureStats(eggSnap),
        date: new Date().toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' }),
        hatched_at: Date.now(),
      }
      return {
        ...state,
        xpThai: 0, xpEng: 0, xpMath: 0,
        hatched: false, hatching: false, readyToHatch: false,
        hatchedCreature: null, sessionXP: 0,
        eggDow: new Date().getDay(),
        eggMonth: new Date().getMonth() + 1,
        eggDay: new Date().getDate(),
        eggHour: new Date().getHours(),
        firstSubject: -1,
        badges: (state.badges || 0) + 1,
        hatchedEggs: [newEgg, ...(state.hatchedEggs || [])],
      }
    }

    case ACTIONS.CLOSE_HATCH:
      return { ...state, hatching: false }

    case ACTIONS.USE_ITEM: {
      const { key } = action.payload
      const count = state.items?.[key] || 0
      if (count <= 0) return state
      let updates = { items: { ...state.items, [key]: count - 1 } }
      if (key === 'food') updates.happiness = Math.min(100, (state.happiness || 80) + 25)
      if (key === 'star') { updates.xpBoost = 2; updates.xpBoostEnd = Date.now() + 5 * 60 * 1000 }
      if (key === 'ribbon') updates.happiness = Math.min(100, (state.happiness || 80) + 15)
      if (key === 'potion') {
        const world = ['thai','eng','math'][Math.max(0, state.firstSubject)]
        const k = 'xp' + world.charAt(0).toUpperCase() + world.slice(1)
        updates[k] = (state[k] || 0) + 20
      }
      return { ...state, ...updates }
    }

    case ACTIONS.DROP_ITEM: {
      const { key } = action.payload
      if (!state.items) return state
      return { ...state, items: { ...state.items, [key]: (state.items[key] || 0) + 1 } }
    }

    case ACTIONS.SET_CURRENT_WORLD:
      return { ...state, currentWorld: action.payload }

    case ACTIONS.SET_SESSION_XP:
      return { ...state, sessionXP: action.payload }

    case ACTIONS.UPDATE_THAI_MASTERY: {
      const { word, value } = action.payload
      return { ...state, thaiMastery: { ...(state.thaiMastery || {}), [word]: value } }
    }

    case ACTIONS.UPDATE_LEVEL_MASTERY: {
      const { world, levelId, value } = action.payload
      return {
        ...state,
        levelMastery: {
          ...(state.levelMastery || {}),
          [world]: { ...(state.levelMastery?.[world] || {}), [levelId]: value },
        },
      }
    }

    case ACTIONS.UNLOCK_LEVEL: {
      const { world, newLevel } = action.payload
      return { ...state, subjectLevels: { ...(state.subjectLevels || {}), [world]: newLevel } }
    }

    case ACTIONS.SEEN_TEACH: {
      const { key } = action.payload
      const seen = state.seenTeach || []
      if (seen.includes(key)) return state
      return { ...state, seenTeach: [...seen, key] }
    }

    case ACTIONS.ER_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastRunDate || '') !== today
      const lives = reset ? 3 : (state.eggRunLives || 0)
      return { ...state, eggRunLives: Math.max(0, lives - 1), lastRunDate: today }
    }

    case ACTIONS.ER_SAVE_SCORE: {
      const { dist, rings } = action.payload
      return {
        ...state,
        erBestDist: Math.max(state.erBestDist || 0, dist),
        erBestRings: Math.max(state.erBestRings || 0, rings),
      }
    }

    case ACTIONS.UPDATE_HAPPINESS:
      return { ...state, happiness: Math.max(0, Math.min(100, action.payload)) }

    case ACTIONS.CHECK_DAILY_RESET: {
      const today = todayStr()
      if ((state.lastPlayDate || '') === today) return state
      return { ...state, dailyRounds: 0, lastPlayDate: today }
    }

    case ACTIONS.DECAY_HAPPINESS: {
      if (!state.lastLogin) return { ...state, lastLogin: Date.now() }
      const hoursAway = (Date.now() - state.lastLogin) / 3600000
      if (hoursAway <= 8) return { ...state, lastLogin: Date.now() }
      return {
        ...state,
        happiness: Math.max(10, (state.happiness || 80) - Math.floor(hoursAway * 3)),
        lastLogin: Date.now(),
      }
    }

    case ACTIONS.SET_HATCHING:
      return { ...state, hatching: action.payload }

    case ACTIONS.SET_CHALLENGER:
      return { ...state, pendingChallenger: action.payload, dailyBattleRounds: 0 }

    case ACTIONS.CLEAR_CHALLENGER:
      return { ...state, pendingChallenger: null }

    case ACTIONS.RECORD_BATTLE: {
      const { entry, bossKey, itemKey } = action.payload
      const defeatedBosses = bossKey
        ? [...new Set([...(state.defeatedBosses || []), bossKey])]
        : (state.defeatedBosses || [])
      const battleHistory = [...(state.battleHistory || []).slice(-99), entry]
      const items = itemKey
        ? { ...(state.items || {}), [itemKey]: ((state.items || {})[itemKey] || 0) + 1 }
        : state.items
      return { ...state, defeatedBosses, battleHistory, items }
    }

    case ACTIONS.FOUNDATION_COMPLETE:
      return { ...state, foundationComplete: true }

    case ACTIONS.SET_PROFILE: {
      const { name, grade } = action.payload
      return { ...state, name: name || state.name, grade: grade ?? state.grade }
    }

    case ACTIONS.UPDATE_SHOP_V1: {
      const { score, wrong, hints = 0, dur = 0, phaseStats: ps } = action.payload
      const prev = state.shopV1 || { bestScore: 0, runs: 0, mastered: false, stretchUnlocked: false, totalHints: 0, totalDuration: 0, phaseStats: {} }
      const newRuns = prev.runs + 1
      const masteryMet = score >= 0.9 && wrong <= 1 && newRuns >= 2
      const nextPhaseStats = { ...(prev.phaseStats || {}) }
      if (ps) {
        ps.forEach(({ phase, correct, total }) => {
          nextPhaseStats[phase] = {
            correct: ((nextPhaseStats[phase]?.correct) || 0) + correct,
            total:   ((nextPhaseStats[phase]?.total)   || 0) + total,
          }
        })
      }
      return {
        ...state,
        shopV1: {
          ...prev,
          bestScore:     Math.max(prev.bestScore, score),
          runs:          newRuns,
          mastered:      prev.mastered || masteryMet,
          stretchUnlocked: prev.stretchUnlocked || false,
          totalHints:    (prev.totalHints || 0) + hints,
          totalDuration: (prev.totalDuration || 0) + dur,
          phaseStats:    nextPhaseStats,
        },
      }
    }

    case ACTIONS.LOG_SESSION: {
      const entry = action.payload
      const prevLog = state.sessionLog || []
      const lastSame = [...prevLog].reverse().find(s => s.world === entry.world)
      const replayedImmediately = lastSame
        ? (entry.ts - (lastSame.ts + (lastSame.dur || 0))) < 60000
        : false
      const nextLog = [...prevLog, { ...entry, replayedImmediately }].slice(-50)
      return { ...state, sessionLog: nextLog }
    }

    default:
      return state
  }
}

export function StateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    try { return { ...defaultState(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) } }
    catch { return defaultState() }
  })

  // Always-current ref so auth callbacks see real state, not mount-time snapshot
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Save to localStorage on every state change
  useEffect(() => { saveState(state) }, [state])

  // Async Supabase sync + auth listener on mount
  useEffect(() => {
    // Daily reset + lives reset on load
    dispatch({ type: ACTIONS.DECAY_HAPPINESS })
    dispatch({ type: ACTIONS.CHECK_DAILY_RESET })
    const today = todayStr()
    if ((state.lastRunDate || '') !== today) {
      dispatch({ type: ACTIONS.ER_SAVE_SCORE, payload: { dist: state.erBestDist || 0, rings: state.erBestRings || 0 } })
      // reset lives
      if ((state.lastRunDate || '') !== today) {
        // handled by ER_DEDUCT_LIFE checking date
      }
    }

    // Async Supabase load
    loadState().then(remote => {
      if (remote) dispatch({ type: ACTIONS.INIT, payload: remote })
    })

    // Auth listener
    let sub = null
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
          const userId = session?.user?.id
          const email = session?.user?.email
          console.log('[KQ:auth] SIGNED_IN', email)
          if (!userId) return

          try {
            const { data: row, error } = await supabase
              .from('eggs')
              .select('state_json')
              .eq('user_id', userId)
              .single()

            if (row?.state_json) {
              // Cloud has data → overwrite local with cloud
              console.log('[KQ:auth] cloud has data → dispatch INIT')
              localStorage.setItem(KEY, JSON.stringify(row.state_json))
              dispatch({ type: ACTIONS.INIT, payload: row.state_json })
            } else {
              // Cloud empty → push current in-memory state (stateRef = real current state)
              console.log('[KQ:auth] cloud empty (', error?.code, ') → pushing current state up, xpThai:', stateRef.current.xpThai)
              await syncToSupabase(stateRef.current)
              // state stays as-is (already correct in memory)
            }
          } catch (e) {
            console.log('[KQ:auth] SIGNED_IN error:', e.message)
          }
        }
      })
      sub = data?.subscription
    }

    // Preload voices
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }

    return () => { sub?.unsubscribe() }
  }, []) // eslint-disable-line

  // Challenger trigger: every 15 battle rounds → pick a random opponent
  useEffect(() => {
    if ((state.dailyBattleRounds || 0) >= 15 && !state.pendingChallenger) {
      const g = state.grade || 0
      const tier = g === 0 ? 0 : g <= 2 ? 1 : g <= 4 ? 2 : 3
      const tierData = AI_OPPONENTS[tier] || AI_OPPONENTS[0]
      const opp = tierData.normal[Math.floor(Math.random() * tierData.normal.length)]
      dispatch({ type: ACTIONS.SET_CHALLENGER, payload: { ...opp, challengerTier: tier } })
    }
  }, [state.dailyBattleRounds]) // eslint-disable-line

  const derived = useMemo(() => {
    const sp = scaledEggProgress(state)
    const rawStats = buildEggStats(state)
    return {
      totalXPValue: totalXP(state),
      eggProgressData: sp,
      eggStatsData: { ...rawStats, stage: sp.stage }, // stage overridden to scaled value
    }
  }, [state.xpThai, state.xpEng, state.xpMath, state.streak, state.acc, state.speed, state.mins, state.eggDow, state.eggMonth, state.eggDay, state.eggHour, state.firstSubject, state.name, state.grade, state.hatchedEggs]) // eslint-disable-line

  const value = useMemo(() => ({
    state,
    dispatch,
    totalXP: derived.totalXPValue,
    eggProgressData: derived.eggProgressData,
    eggStatsData: derived.eggStatsData,
  }), [state, derived])

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used inside StateProvider')
  return ctx
}
