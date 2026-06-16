import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import { KEY, defaultState, loadState, saveState, syncToSupabase, _migrateBattleStats, _mergeAllCreaturesIntoOne } from '../lib/state.js'
import { supabase } from '../lib/supabase.js'
import { eggProgress, buildEggStats, totalXP, EGG_STAGES, STAGE_XP_NEEDED } from '../lib/eggAlgorithm.js'
import { ITEMS, GRADE_LABELS, todayStr, shuffle, calcCreatureStats, AI_OPPONENTS } from '../config/gameConfig.js'
import { getCreatureForHatch } from './creatureHelpers.js'
import { buildCreatureDNA, generateCreatureName } from '../lib/creatureGenerator.js'
import { determineElement, calcEvoStage } from '../lib/creatureSystem.js'

export const StateContext = createContext(null)

// Battle level progression: XP thresholds grow quadratically
function calcBattleLevel(xp) {
  let level = 1, cumulative = 0
  while (true) {
    const needed = 10 + level * level * 2
    if (cumulative + needed > xp) break
    cumulative += needed
    level++
    if (level >= 100) break
  }
  return level
}

// Scale world enemy stats by creature battle level
export function scaleMonsterStats(baseStats, creatureLevel) {
  const mult =
    creatureLevel <= 5  ? 1.0 :
    creatureLevel <= 15 ? 1.3 :
    creatureLevel <= 30 ? 1.8 :
    creatureLevel <= 50 ? 2.4 : 3.2
  return {
    hp:  Math.round(baseStats.HP  * mult),
    atk: Math.round(baseStats.ATK * mult),
    def: Math.round(baseStats.DEF * mult),
  }
}

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
  UPDATE_LAST_HOME_VISIT: 'UPDATE_LAST_HOME_VISIT',
  ENTER_WORLD:          'ENTER_WORLD',
  EXIT_WORLD:           'EXIT_WORLD',
  MOVE_SCREEN:          'MOVE_SCREEN',
  DISCOVER_SCREEN:      'DISCOVER_SCREEN',
  ENCOUNTER_TRIGGERED:       'ENCOUNTER_TRIGGERED',
  ENTER_BATTLE_FROM_WORLD:   'ENTER_BATTLE_FROM_WORLD',
  RETURN_FROM_WORLD_BATTLE:  'RETURN_FROM_WORLD_BATTLE',
  CLEAR_WORLD_POSITION:      'CLEAR_WORLD_POSITION',
  // Party + creature battle system
  SET_PENDING_BATTLE:        'SET_PENDING_BATTLE',
  CLEAR_PENDING_BATTLE:      'CLEAR_PENDING_BATTLE',
  SET_BATTLE_CREATURE:       'SET_BATTLE_CREATURE',
  CREATURE_TAKE_DAMAGE:      'CREATURE_TAKE_DAMAGE',
  CREATURE_HEAL:             'CREATURE_HEAL',
  CREATURE_GAIN_BATTLE_XP:   'CREATURE_GAIN_BATTLE_XP',
  ADD_TO_PARTY:              'ADD_TO_PARTY',
  UNLOCK_PARTY_SLOT:         'UNLOCK_PARTY_SLOT',
  INCREMENT_BATTLE_WINS:     'INCREMENT_BATTLE_WINS',
  SET_WORLD_LEVEL:           'SET_WORLD_LEVEL',
  DEFEAT_BOSS:               'DEFEAT_BOSS',
  RESPAWN_BOSS_ON_NORMAL_MAP:'RESPAWN_BOSS_ON_NORMAL_MAP',
  ACTIVATE_MAZE:             'ACTIVATE_MAZE',
  CLEAR_MAZE:                'CLEAR_MAZE',
  // Creature system
  SET_CREATURE_NAME:         'SET_CREATURE_NAME',
  ADD_CREATURE_BOND:         'ADD_CREATURE_BOND',
  CREATURE_EVOLVE:           'CREATURE_EVOLVE',
  SET_ACTIVE_CREATURE:       'SET_ACTIVE_CREATURE',
  CLEAR_EVO_NOTICE:          'CLEAR_EVO_NOTICE',
  // Map system
  MAP_CLEARED:               'MAP_CLEARED',
  SECRET_MAP_SPAWN:          'SECRET_MAP_SPAWN',
  SECRET_MAP_EXPIRE:         'SECRET_MAP_EXPIRE',
  // Atomic battle entry (prevents intermediate render between SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD)
  SELECT_CREATURE_AND_ENTER_BATTLE: 'SELECT_CREATURE_AND_ENTER_BATTLE',
}

function reducer(state, action) {
  switch (action.type) {

    case ACTIONS.INIT:
      return { ...defaultState(), ...action.payload, battleCreatureId: null, pendingBattle: null, worldBattleEnemy: null }

    case ACTIONS.ADD_XP: {
      const { world, amount, accDelta, speedDelta } = action.payload
      const boost = (state.xpBoostEnd || 0) > Date.now() ? (state.xpBoost || 1) : 1
      const earned = Math.round(amount * boost)
      const key = 'xp' + world.charAt(0).toUpperCase() + world.slice(1)
      const newXp = (state[key] || 0) + earned
      const newTotal = (state.xpThai || 0) + (state.xpEng || 0) + (state.xpMath || 0) + earned
      const eggsHatched = (state.hatchedEggs || []).length
      const hatchRequired = Math.min(800, 120 + eggsHatched * 60)
      const readyToHatch = newTotal >= hatchRequired && !state.hatched && (state.hatchedEggs?.length ?? 0) === 0
      // Distribute creature XP: active = 100%, bench party members = 50%
      const partyIds = state.party || []
      const activeId = partyIds[0]
      let evoNotice = state.pendingEvoNotice ?? null
      const hatchedEggsWithXP = (partyIds.length === 0 || !earned)
        ? (state.hatchedEggs || [])
        : (state.hatchedEggs || []).map(e => {
            if (!partyIds.includes(e.id)) return e
            const gain = e.id === activeId ? earned : Math.floor(earned * 0.5)
            if (!gain) return e
            const newBXP = (e.battleXP ?? 0) + gain
            const newBLv = calcBattleLevel(newBXP)
            const newEvo = calcEvoStage(newBLv, state.grade ?? 0, e.bondMeter ?? 0, e.evoStage ?? 'baby')
            if (newEvo !== (e.evoStage ?? 'baby') && !evoNotice) {
              evoNotice = { creatureId: e.id, newStage: newEvo, creatureName: e.creatureName || e.creature?.n }
            }
            // ECA: increment questionsAnswered for active creature only
            const qDelta = e.id === activeId ? 1 : 0
            return { ...e, battleXP: newBXP, battleLevel: newBLv, evoStage: newEvo, questionsAnswered: (e.questionsAnswered ?? 0) + qDelta }
          })
      return {
        ...state,
        [key]: newXp,
        hatchedEggs: hatchedEggsWithXP,
        pendingEvoNotice: evoNotice,
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
      // +2 bond to active creature on study round
      const activeId = (state.party || [])[0]
      const activeEgg = activeId ? (state.hatchedEggs || []).find(e => e.id === activeId) : null
      let evoNoticeRC = state.pendingEvoNotice ?? null
      const eggsAfterBond = activeEgg
        ? (state.hatchedEggs || []).map(e => {
            if (e.id !== activeId) return e
            const bond = (activeEgg.bondMeter ?? 0) < 100 ? Math.min(100, (e.bondMeter ?? 0) + 2) : (e.bondMeter ?? 0)
            const newEvo = calcEvoStage(e.battleLevel ?? 1, state.grade ?? 0, bond, e.evoStage ?? 'baby')
            if (newEvo !== (e.evoStage ?? 'baby') && !evoNoticeRC) {
              evoNoticeRC = { creatureId: e.id, newStage: newEvo, creatureName: e.creatureName || e.creature?.n }
            }
            // ECA: increment adventuresWith on each study round
            return { ...e, bondMeter: bond, evoStage: newEvo, adventuresWith: (e.adventuresWith ?? 0) + 1 }
          })
        : (state.hatchedEggs || [])
      return {
        ...state,
        hatchedEggs: eggsAfterBond,
        pendingEvoNotice: evoNoticeRC,
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
      if ((state.hatchedEggs?.length ?? 0) >= 1) return state  // already have a creature, no new eggs
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
      // Generate deterministic DNA. Same eggStats always produce the same DNA.
      // Legacy creatures (no dna field) continue to render as emojis unchanged.
      let dna = null
      try { dna = buildCreatureDNA(eggStats) } catch (_) { /* silent — emoji fallback */ }
      const eggStats2 = calcCreatureStats(eggSnap)
      const hatchAcc = state.acc || 70
      const hatchStreak = state.streak || 0
      const element = determineElement(snapXpThai, snapXpMath, snapXpEng, hatchAcc, hatchStreak)
      const newEgg = {
        id:      `egg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        creature,
        eggStats,
        xpThai: snapXpThai,
        xpEng: snapXpEng,
        xpMath: snapXpMath,
        grade: GRADE_LABELS[tier],
        tier,
        streak: hatchStreak,
        acc:    hatchAcc,
        stats:  eggStats2,
        date: new Date().toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' }),
        hatched_at: Date.now(),
        dna,
        // Battle fields
        battleLevel: 1,
        battleXP:    0,
        currentHP:   eggStats2.HP,
        inParty:     false,
        archived:    false,
        // Creature system fields (locked at hatch)
        element,
        evoStage:    'baby',
        bondMeter:   0,
        bornAtk:     snapXpThai,
        bornDef:     snapXpMath,
        bornSpd:     snapXpEng,
        bornCrit:    hatchAcc,
        bornDate:    new Date().toISOString().slice(0, 10),
        bornTier:    tier,
        creatureName: dna ? generateCreatureName(dna) : null,
        // ECA relationship data
        adventuresWith:   0,
        questionsAnswered: 0,
        eggStartDate:     new Date().toISOString().slice(0, 10),
      }
      // Auto-add to party if party is empty (first creature always joins)
      const newEggInParty = (state.party || []).length === 0
      const updatedNewEgg = newEggInParty ? { ...newEgg, inParty: true } : newEgg
      const newParty = newEggInParty
        ? [...(state.party || []), newEgg.id]
        : (state.party || [])
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
        hatchedEggs: [updatedNewEgg, ...(state.hatchedEggs || [])],
        party: newParty,
      }
    }

    case ACTIONS.CLOSE_HATCH:
      return { ...state, hatching: false, readyToHatch: false }

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

    case ACTIONS.UPDATE_LAST_HOME_VISIT:
      return { ...state, lastHomeVisit: action.payload }

    case ACTIONS.ENTER_WORLD: {
      const { region, screen } = action.payload
      const discovered = [...new Set([...(state.discoveredScreens || []), screen])]
      return { ...state, currentRegion: region, currentScreen: screen, discoveredScreens: discovered }
    }

    case ACTIONS.EXIT_WORLD:
      return { ...state, currentRegion: null, currentScreen: null }

    case ACTIONS.MOVE_SCREEN:
      return { ...state, currentScreen: action.payload }

    case ACTIONS.DISCOVER_SCREEN: {
      const scr = action.payload
      const already = state.discoveredScreens || []
      if (already.includes(scr)) return state
      return { ...state, discoveredScreens: [...already, scr] }
    }

    case ACTIONS.ENCOUNTER_TRIGGERED:
      return state

    case ACTIONS.ENTER_BATTLE_FROM_WORLD: {
      const { position, enemy } = action.payload
      return { ...state, worldPosition: position, worldBattleEnemy: enemy, pendingBattle: null }
    }

    case ACTIONS.RETURN_FROM_WORLD_BATTLE:
      return { ...state, worldBattleEnemy: null, battleCreatureId: null }

    case ACTIONS.CLEAR_WORLD_POSITION:
      return { ...state, worldPosition: null }

    // ── Party + creature battle system ────────────────────────────────────────

    case ACTIONS.SET_PENDING_BATTLE:
      return { ...state, pendingBattle: action.payload }

    case ACTIONS.CLEAR_PENDING_BATTLE:
      return { ...state, pendingBattle: null, battleCreatureId: null }

    case ACTIONS.SET_BATTLE_CREATURE:
      return { ...state, battleCreatureId: action.payload }

    case ACTIONS.SELECT_CREATURE_AND_ENTER_BATTLE: {
      const { creatureId, battle } = action.payload
      const { position, enemy } = battle ?? {}
      return {
        ...state,
        battleCreatureId: creatureId,
        worldPosition: position ?? state.worldPosition,
        worldBattleEnemy: enemy ?? state.worldBattleEnemy,
        pendingBattle: null,
      }
    }

    case ACTIONS.CREATURE_TAKE_DAMAGE: {
      const { creatureId, damage } = action.payload
      const now = Date.now()
      const hatchedEggs = (state.hatchedEggs || []).map(e =>
        e.id === creatureId
          ? { ...e, currentHP: Math.max(0, (e.currentHP ?? e.stats?.HP ?? 10) - damage), hpUpdatedAt: now }
          : e
      )
      return { ...state, hatchedEggs }
    }

    case ACTIONS.CREATURE_HEAL: {
      const { creatureId, amount } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const maxHP = (e.stats?.HP ?? 10) + ((e.battleLevel ?? 1) - 1)
        return { ...e, currentHP: Math.min(maxHP, (e.currentHP ?? maxHP) + amount), hpUpdatedAt: Date.now() }
      })
      return { ...state, hatchedEggs }
    }

    case ACTIONS.CREATURE_GAIN_BATTLE_XP: {
      const { creatureId, xp } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const newBattleXP    = (e.battleXP ?? 0) + xp
        const newBattleLevel = calcBattleLevel(newBattleXP)
        return { ...e, battleXP: newBattleXP, battleLevel: newBattleLevel }
      })
      return { ...state, hatchedEggs }
    }

    case ACTIONS.ADD_TO_PARTY: {
      const { creatureId: cid } = action.payload
      if ((state.party || []).includes(cid)) return state
      if ((state.party || []).length >= (state.partySlots || 1)) return state
      const hatchedEggs = (state.hatchedEggs || []).map(e =>
        e.id === cid ? { ...e, inParty: true } : e
      )
      return { ...state, party: [...(state.party || []), cid], hatchedEggs }
    }

    case ACTIONS.SET_ACTIVE_CREATURE: {
      const { creatureId: activeId } = action.payload
      const party = state.party || []
      if (!party.includes(activeId) || party[0] === activeId) return state
      return { ...state, party: [activeId, ...party.filter(id => id !== activeId)] }
    }

    case ACTIONS.UNLOCK_PARTY_SLOT:
      return { ...state, partySlots: Math.min(6, (state.partySlots || 1) + 1) }

    case ACTIONS.INCREMENT_BATTLE_WINS: {
      // +1 bond to active creature on battle win
      const activeIdW = (state.party || [])[0]
      const activeEggW = activeIdW ? (state.hatchedEggs || []).find(e => e.id === activeIdW) : null
      let evoNoticeW = state.pendingEvoNotice ?? null
      const eggsAfterWin = (activeEggW && (activeEggW.bondMeter ?? 0) < 100)
        ? (state.hatchedEggs || []).map(e => {
            if (e.id !== activeIdW) return e
            const bond = Math.min(100, (e.bondMeter ?? 0) + 1)
            const newEvo = calcEvoStage(e.battleLevel ?? 1, state.grade ?? 0, bond, e.evoStage ?? 'baby')
            if (newEvo !== (e.evoStage ?? 'baby') && !evoNoticeW) {
              evoNoticeW = { creatureId: e.id, newStage: newEvo, creatureName: e.creatureName || e.creature?.n }
            }
            return { ...e, bondMeter: bond, evoStage: newEvo }
          })
        : (state.hatchedEggs || [])
      const newBattleWins = (state.battleWins ?? 0) + 1
      const shouldSpawnMaze = newBattleWins % 10 === 0 && !state.mazeActive && !state.mazeCleared
      return {
        ...state,
        battleWins: newBattleWins,
        hatchedEggs: eggsAfterWin,
        pendingEvoNotice: evoNoticeW,
        ...(shouldSpawnMaze ? {
          mazeActive: true,
          mazeCleared: false,
          secretMapExpiry: Date.now() + 30 * 60 * 1000,
        } : {}),
      }
    }

    case ACTIONS.SET_WORLD_LEVEL:
      return {
        ...state,
        worldLevel: action.payload,
        currentScreen: 'NW',
        discoveredScreens: ['NW'],
        mazeActive: false,
        mazeCleared: false,
        clearedMaps: [],
        secretMapExpiry: null,
        bossDefeatedThisTier: false,
        bossEnemyDefeated: false,
        bossRoamingScreen: null,
        bossWinsAtDefeat: 0,
      }

    case ACTIONS.DEFEAT_BOSS: {
      const curr = state.worldLevel ?? 0
      const defeated = [...(state.bossDefeated ?? []), curr]
      return {
        ...state,
        bossDefeated: defeated,
        bossDefeatedThisTier: true,
        bossEnemyDefeated: true,
        bossWinsAtDefeat: state.battleWins ?? 0,
        clearedMaps: [],
        secretMapExpiry: null,
        currentScreen: 'NW',     // return player to normal map on remount
        worldPosition: null,     // don't restore boss tile position
      }
    }

    case ACTIONS.RESPAWN_BOSS_ON_NORMAL_MAP: {
      const screens = ['NW', 'NE', 'SW', 'SE']
      const bossRoamingScreen = screens[(state.battleWins ?? 0) % 4]
      return { ...state, bossRoamingScreen }
    }

    case ACTIONS.ACTIVATE_MAZE:
      return { ...state, mazeActive: true }

    case ACTIONS.CLEAR_MAZE:
      return { ...state, mazeActive: false, mazeCleared: true }

    case ACTIONS.SET_CREATURE_NAME: {
      const { creatureId, name } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e =>
        e.id === creatureId ? { ...e, creatureName: name } : e
      )
      return { ...state, hatchedEggs }
    }

    case ACTIONS.ADD_CREATURE_BOND: {
      const { creatureId, amount } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const bond = Math.min(100, (e.bondMeter ?? 0) + amount)
        const newEvo = calcEvoStage(e.battleLevel ?? 1, state.grade ?? 0, bond, e.evoStage ?? 'baby')
        return { ...e, bondMeter: bond, evoStage: newEvo }
      })
      return { ...state, hatchedEggs }
    }

    case ACTIONS.CREATURE_EVOLVE: {
      const { creatureId } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const newEvo = calcEvoStage(e.battleLevel ?? 1, state.grade ?? 0, e.bondMeter ?? 0, e.evoStage ?? 'baby')
        return { ...e, evoStage: newEvo }
      })
      return { ...state, hatchedEggs }
    }

    case ACTIONS.CLEAR_EVO_NOTICE:
      return { ...state, pendingEvoNotice: null }

    case ACTIONS.MAP_CLEARED: {
      const sid = action.payload
      const cleared = state.clearedMaps || []
      if (!['NW','NE','SW','SE'].includes(sid) || cleared.includes(sid)) return state
      return { ...state, clearedMaps: [...cleared, sid] }
    }

    case ACTIONS.SECRET_MAP_SPAWN:
      return { ...state, mazeActive: true, mazeCleared: false, secretMapExpiry: action.payload }

    case ACTIONS.SECRET_MAP_EXPIRE:
      return { ...state, mazeActive: false, secretMapExpiry: null }

    default:
      return state
  }
}

export function StateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    try {
      const raw = { ...defaultState(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }
      const migrated = _migrateBattleStats(raw)
      const needsMerge = (migrated.hatchedEggs?.length ?? 0) > 1 || (migrated._creaturesMerged && migrated.hatchedEggs?.length === 1 && !migrated._statAveraged)
      const merged = needsMerge ? { ..._mergeAllCreaturesIntoOne(migrated), _creaturesMerged: true } : migrated
      // Always clear transient battle state — these can be stale if app was closed mid-battle.
      // A stuck battleCreatureId makes !state.battleCreatureId falsy → PartySelect never renders.
      return { ...merged, battleCreatureId: null, pendingBattle: null, worldBattleEnemy: null }
    }
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

    // Async Supabase load — only overwrite if remote is at least as recent as local.
    // Supabase sync is async; if the previous session's sync hadn't finished when the
    // app reloads, remote.rounds can be behind the in-memory state that was already
    // restored from localStorage. Blindly dispatching INIT in that case reverts XP,
    // items, and other progress the player just earned.
    loadState().then(remote => {
      if (!remote) return
      const cur = stateRef.current
      // Run merge on remote data so Supabase state gets cleaned up too
      const remoteNeedsMerge = (remote.hatchedEggs?.length ?? 0) > 1 || (remote._creaturesMerged && remote.hatchedEggs?.length === 1 && !remote._statAveraged)
      const remoteFinal = remoteNeedsMerge ? { ..._mergeAllCreaturesIntoOne(remote), _creaturesMerged: true } : remote
      if ((remoteFinal.rounds || 0) >= (cur.rounds || 0)) {
        dispatch({ type: ACTIONS.INIT, payload: remoteFinal })
      } else {
        console.log('[KQ:load] remote behind local (remote rounds:', remoteFinal.rounds, 'local:', cur.rounds, ') — keeping local, pushing to cloud')
        syncToSupabase(cur)
      }
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
              const remote = row.state_json
              const cur = stateRef.current
              if ((remote.rounds || 0) >= (cur.rounds || 0)) {
                // Cloud is at least as recent → accept cloud state
                console.log('[KQ:auth] cloud has data (remote rounds:', remote.rounds, ') → dispatch INIT')
                localStorage.setItem(KEY, JSON.stringify(remote))
                dispatch({ type: ACTIONS.INIT, payload: remote })
              } else {
                // Local is ahead (user played before auth resolved) → push local up, keep in-memory state
                console.log('[KQ:auth] local is ahead (local rounds:', cur.rounds, 'remote:', remote.rounds, ') → pushing local to cloud')
                localStorage.setItem(KEY, JSON.stringify(cur))
                await syncToSupabase(cur)
              }
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

  // DISABLED — ChallengerOverlay system removed; re-enable when redesigned
  // useEffect(() => {
  //   if ((state.dailyBattleRounds || 0) >= 15 && !state.pendingChallenger) {
  //     const g = state.grade || 0
  //     const tier = g === 0 ? 0 : g <= 2 ? 1 : g <= 4 ? 2 : 3
  //     const tierData = AI_OPPONENTS[tier] || AI_OPPONENTS[0]
  //     const opp = tierData.normal[Math.floor(Math.random() * tierData.normal.length)]
  //     dispatch({ type: ACTIONS.SET_CHALLENGER, payload: { ...opp, challengerTier: tier } })
  //   }
  // }, [state.dailyBattleRounds])

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
