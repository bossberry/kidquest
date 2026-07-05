// StateContext.jsx — global state store (useReducer + Context). Single source of truth for all game state; persists to localStorage and Supabase.
import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import { KEY, defaultState, loadState, saveState, syncToSupabase, resolveSync, markInitialSyncComplete, _migrateBattleStats, _mergeAllCreaturesIntoOne } from '../lib/state.js'
import { supabase } from '../lib/supabase.js'
import { eggProgress, buildEggStats, totalXP, EGG_STAGES, STAGE_XP_NEEDED } from '../lib/eggAlgorithm.js'
import { ITEMS, GRADE_LABELS, todayStr, shuffle, calcCreatureStats, AI_OPPONENTS, PROGRESSION_MAP } from '../config/gameConfig.js'
import { buildCreatureDNA, generateCreatureName } from '../lib/creatureGenerator.js'
import { determineElement, calcEvoStage } from '../lib/creatureSystem.js'
import { showItemToast } from '../components/Toasts.jsx'
import { playSFX } from '../lib/audio.js'

export const StateContext = createContext(null)

// dispatchAddCoins — every ADD_COINS award should play the coin_earn "ting-ting"
// SFX; rather than adding playSFX('coin_earn') at every one of the ~15 call sites
// across the game/minigame files, route them all through this helper (2026-07-02
// audio expansion). The reducer itself stays pure — the sound plays here, not
// inside ACTIONS.ADD_COINS's case.
export function dispatchAddCoins(dispatch, amount, bonusKey) {
  if (amount) playSFX('coin_earn')
  dispatch({ type: ACTIONS.ADD_COINS, payload: bonusKey ? { amount, bonusKey } : { amount } })
}

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
  // Gentle linear scale — each level adds 2% (level 16 → 1.30x, level 51 → 2.0x hard cap)
  const mult = Math.min(1.0 + (creatureLevel - 1) * 0.02, 2.0)
  return {
    hp:  Math.round(baseStats.HP  * mult),
    atk: Math.round(baseStats.ATK * mult),
    def: Math.round(baseStats.DEF * mult * 0.5),  // DEF scales slower
  }
}

// Inline evo calculator — avoids circular import between StateContext and creatureSystem
function calcEvoStageInline(battleLevel, grade, bond) {
  if (battleLevel >= 26 && grade >= 3 && bond >= 60) return 'final'
  if (battleLevel >= 11 && grade >= 1) return 'teen'
  return 'baby'
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
  USE_HOME_ITEM:      'USE_HOME_ITEM',
  USE_BATTLE_ITEM:    'USE_BATTLE_ITEM',
  DROP_HOME_ITEM:     'DROP_HOME_ITEM',
  DROP_BATTLE_ITEM:   'DROP_BATTLE_ITEM',
  SET_CURRENT_WORLD:  'SET_CURRENT_WORLD',
  SET_SESSION_XP:     'SET_SESSION_XP',
  UPDATE_THAI_MASTERY:'UPDATE_THAI_MASTERY',
  UPDATE_LEVEL_MASTERY:'UPDATE_LEVEL_MASTERY',
  UNLOCK_LEVEL:       'UNLOCK_LEVEL',
  SEEN_TEACH:         'SEEN_TEACH',
  ER_DEDUCT_LIFE:     'ER_DEDUCT_LIFE',
  ER_SAVE_SCORE:      'ER_SAVE_SCORE',
  MEMORY_DEDUCT_LIFE:  'MEMORY_DEDUCT_LIFE',
  CATCH_DEDUCT_LIFE:   'CATCH_DEDUCT_LIFE',
  TOWER_DEDUCT_LIFE:   'TOWER_DEDUCT_LIFE',
  FISHING_DEDUCT_LIFE: 'FISHING_DEDUCT_LIFE',
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
  SPAWN_MAZE_PORTAL:          'SPAWN_MAZE_PORTAL',
  SPAWN_MAZE_PORTAL_RESOLVED: 'SPAWN_MAZE_PORTAL_RESOLVED',
  ENTER_MAZE:                 'ENTER_MAZE',
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
  // Analytics
  LOG_BATTLE_ANSWER:         'LOG_BATTLE_ANSWER',
  // Atomic battle entry (prevents intermediate render between SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD)
  SELECT_CREATURE_AND_ENTER_BATTLE: 'SELECT_CREATURE_AND_ENTER_BATTLE',
  CREATURE_STAT_BOOST:             'CREATURE_STAT_BOOST',
  // Adaptive difficulty
  SET_SUBJECT_LEVEL:          'SET_SUBJECT_LEVEL',
  SET_PENDING_LEVEL_UP:       'SET_PENDING_LEVEL_UP',
  CLEAR_PENDING_LEVEL_UP:     'CLEAR_PENDING_LEVEL_UP',
  SET_SUBJECT_SESSION_STREAK: 'SET_SUBJECT_SESSION_STREAK',
  // Reward chest
  SET_PENDING_REWARDS:        'SET_PENDING_REWARDS',
  CLEAR_PENDING_REWARDS:      'CLEAR_PENDING_REWARDS',
  // Input mode mastery (tracks comfort with wordbuild/sequence mechanics, fades hints)
  RECORD_INPUT_MODE_RESULT:   'RECORD_INPUT_MODE_RESULT',
  // Coin economy
  ADD_COINS:      'ADD_COINS',
  DAILY_LOGIN:    'DAILY_LOGIN',
  // Cosmetic shop
  BUY_ITEM:       'BUY_ITEM',
  EQUIP_ITEM:     'EQUIP_ITEM',
  // Room / Den decoration
  BUY_ROOM_ITEM:    'BUY_ROOM_ITEM',
  PLACE_ROOM_ITEM:  'PLACE_ROOM_ITEM',
  REMOVE_ROOM_ITEM: 'REMOVE_ROOM_ITEM',
  // Multi-room expansion
  BUY_ROOM_BLOCK:              'BUY_ROOM_BLOCK',
  SET_ACTIVE_ROOM:             'SET_ACTIVE_ROOM',
  SET_HOME_ROOM:               'SET_HOME_ROOM',
  PLACE_ROOM_ITEM_IN_ROOM:     'PLACE_ROOM_ITEM_IN_ROOM',
  REMOVE_ROOM_ITEM_FROM_ROOM:  'REMOVE_ROOM_ITEM_FROM_ROOM',
}

// Multi-room helper — write a new layout into one room inside `rooms`, and keep the
// top-level `roomLayout` mirror in sync ONLY when that room is the active one. Every
// room-content reducer routes through this so `rooms` and the `roomLayout` mirror can
// never drift apart. Always stamps lastSavedAt (same convention as every reducer).
function applyRoomLayoutChange(state, roomId, newLayout) {
  const rooms = (state.rooms || []).map(r => (r.id === roomId ? { ...r, layout: newLayout } : r))
  return {
    ...state,
    rooms,
    roomLayout: roomId === state.activeRoomId ? newLayout : state.roomLayout,
    lastSavedAt: Date.now(),
  }
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
        lastSavedAt: Date.now(),
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
        lastSavedAt: Date.now(),
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
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.CLOSE_HATCH:
      return { ...state, hatching: false, readyToHatch: false, lastSavedAt: Date.now() }

    case ACTIONS.USE_HOME_ITEM: {
      const { key } = action.payload
      const count = state.homeItems?.[key] || 0
      if (count <= 0) return state
      const updates = { homeItems: { ...state.homeItems, [key]: count - 1 } }
      if (key === 'food') {
        updates.happiness = Math.min(100, (state.happiness || 80) + 25)
        const activeId = (state.party || [])[0]
        if (activeId) {
          updates.hatchedEggs = (state.hatchedEggs || []).map(e => {
            if (e.id !== activeId) return e
            const maxHP = e.stats?.HP ?? 100
            return { ...e, currentHP: Math.min(maxHP, (e.currentHP ?? 0) + 30) }
          })
        }
      }
      if (key === 'ribbon') {
        updates.activeBoosts = {
          ...(state.activeBoosts || {}),
          ribbon: { endsAt: Date.now() + 5 * 60 * 1000, stat: 'SPD', amount: 10 }
        }
      }
      if (key === 'shoes') {
        updates.activeBoosts = {
          ...(state.activeBoosts || {}),
          shoes: { endsAt: Date.now() + 5 * 60 * 1000, effect: 'map_speed' }
        }
      }
      if (key === 'rainbow_star') {
        updates.activeBoosts = {
          ...(state.activeBoosts || {}),
          rainbow_star: { endsAt: Date.now() + 5 * 60 * 1000, effect: 'saiyan_aura' }
        }
      }
      return { ...state, ...updates, lastSavedAt: Date.now() }
    }

    case ACTIONS.USE_BATTLE_ITEM: {
      const { key } = action.payload
      const count = state.battleItems?.[key] || 0
      if (count <= 0) return state
      return { ...state, battleItems: { ...state.battleItems, [key]: count - 1 }, lastSavedAt: Date.now() }
    }

    case ACTIONS.DROP_HOME_ITEM: {
      const { key } = action.payload
      return { ...state, homeItems: { ...state.homeItems, [key]: (state.homeItems?.[key] || 0) + 1 }, lastSavedAt: Date.now() }
    }

    case ACTIONS.DROP_BATTLE_ITEM: {
      const { key } = action.payload
      return { ...state, battleItems: { ...state.battleItems, [key]: (state.battleItems?.[key] || 0) + 1 }, lastSavedAt: Date.now() }
    }

    // Backward-compat aliases
    case ACTIONS.USE_ITEM:
      return reducer(state, { type: ACTIONS.USE_HOME_ITEM, payload: action.payload })
    case ACTIONS.DROP_ITEM:
      return reducer(state, { type: ACTIONS.DROP_BATTLE_ITEM, payload: action.payload })

    case ACTIONS.SET_CURRENT_WORLD:
      return { ...state, currentWorld: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.SET_SESSION_XP:
      return { ...state, sessionXP: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.UPDATE_THAI_MASTERY: {
      const { word, value } = action.payload
      return { ...state, thaiMastery: { ...(state.thaiMastery || {}), [word]: value }, lastSavedAt: Date.now() }
    }

    case ACTIONS.UPDATE_LEVEL_MASTERY: {
      const { world, levelId, value } = action.payload
      return {
        ...state,
        levelMastery: {
          ...(state.levelMastery || {}),
          [world]: { ...(state.levelMastery?.[world] || {}), [levelId]: value },
        },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.UNLOCK_LEVEL: {
      const { world, newLevel } = action.payload
      return { ...state, subjectLevels: { ...(state.subjectLevels || {}), [world]: newLevel }, lastSavedAt: Date.now() }
    }

    case ACTIONS.SEEN_TEACH: {
      const { key } = action.payload
      const seen = state.seenTeach || []
      if (seen.includes(key)) return state
      return { ...state, seenTeach: [...seen, key], lastSavedAt: Date.now() }
    }

    case ACTIONS.ER_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastRunDate || '') !== today
      const lives = reset ? 3 : (state.eggRunLives || 0)
      return { ...state, eggRunLives: Math.max(0, lives - 1), lastRunDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.MEMORY_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastMemoryDate || '') !== today
      const lives = reset ? 5 : (state.memoryLives || 0)
      return { ...state, memoryLives: Math.max(0, lives - 1), lastMemoryDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.CATCH_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastCatchDate || '') !== today
      const lives = reset ? 5 : (state.catchLives || 0)
      return { ...state, catchLives: Math.max(0, lives - 1), lastCatchDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.TOWER_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastTowerDate || '') !== today
      const lives = reset ? 5 : (state.towerLives || 0)
      return { ...state, towerLives: Math.max(0, lives - 1), lastTowerDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.FISHING_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastFishingDate || '') !== today
      const lives = reset ? 3 : (state.fishingLives || 0)
      return { ...state, fishingLives: Math.max(0, lives - 1), lastFishingDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.ER_SAVE_SCORE: {
      const { dist, rings } = action.payload
      return {
        ...state,
        erBestDist: Math.max(state.erBestDist || 0, dist),
        erBestRings: Math.max(state.erBestRings || 0, rings),
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.UPDATE_HAPPINESS:
      return { ...state, happiness: Math.max(0, Math.min(100, action.payload)), lastSavedAt: Date.now() }

    case ACTIONS.CHECK_DAILY_RESET: {
      const today = todayStr()
      if ((state.lastPlayDate || '') === today) return state
      return { ...state, dailyRounds: 0, lastPlayDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.DECAY_HAPPINESS: {
      if (!state.lastLogin) return { ...state, lastLogin: Date.now(), lastSavedAt: Date.now() }
      const hoursAway = (Date.now() - state.lastLogin) / 3600000
      if (hoursAway <= 8) return { ...state, lastLogin: Date.now(), lastSavedAt: Date.now() }
      return {
        ...state,
        happiness: Math.max(10, (state.happiness || 80) - Math.floor(hoursAway * 3)),
        lastLogin: Date.now(),
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SET_HATCHING:
      return { ...state, hatching: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.SET_CHALLENGER:
      return { ...state, pendingChallenger: action.payload, dailyBattleRounds: 0, lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_CHALLENGER:
      return { ...state, pendingChallenger: null, lastSavedAt: Date.now() }

    case ACTIONS.RECORD_BATTLE: {
      const { entry, bossKey, itemKey } = action.payload
      const defeatedBosses = bossKey
        ? [...new Set([...(state.defeatedBosses || []), bossKey])]
        : (state.defeatedBosses || [])
      const battleHistory = [...(state.battleHistory || []).slice(-99), entry]
      const battleItems = itemKey
        ? { ...(state.battleItems || {}), [itemKey]: ((state.battleItems || {})[itemKey] || 0) + 1 }
        : state.battleItems
      return { ...state, defeatedBosses, battleHistory, battleItems, lastSavedAt: Date.now() }
    }

    case ACTIONS.FOUNDATION_COMPLETE:
      return { ...state, foundationComplete: true, lastSavedAt: Date.now() }

    case ACTIONS.SET_PROFILE: {
      const { name, schoolGrade, gender } = action.payload
      return {
        ...state,
        name: name || state.name,
        schoolGrade: schoolGrade ?? state.schoolGrade,
        gender: gender ?? state.gender,
        lastSavedAt: Date.now(),
      }
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
        lastSavedAt: Date.now(),
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
      return { ...state, sessionLog: nextLog, lastSavedAt: Date.now() }
    }

    case ACTIONS.LOG_BATTLE_ANSWER: {
      const { subject, correct, responseTimeMs, timestamp } = action.payload
      if (!subject || typeof responseTimeMs !== 'number') return state
      const prev = state.responseTimeLogs?.[subject] ?? []
      const updated = [...prev, { timeMs: responseTimeMs, correct, timestamp }].slice(-50)
      return {
        ...state,
        responseTimeLogs: {
          ...(state.responseTimeLogs ?? {}),
          [subject]: updated,
        },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.UPDATE_LAST_HOME_VISIT:
      return { ...state, lastHomeVisit: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.ENTER_WORLD: {
      const { region, screen } = action.payload
      const discovered = [...new Set([...(state.discoveredScreens || []), screen])]
      return { ...state, currentRegion: region, currentScreen: screen, discoveredScreens: discovered, lastSavedAt: Date.now() }
    }

    case ACTIONS.EXIT_WORLD:
      return { ...state, currentRegion: null, currentScreen: null, lastSavedAt: Date.now() }

    case ACTIONS.MOVE_SCREEN:
      return { ...state, currentScreen: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.DISCOVER_SCREEN: {
      const scr = action.payload
      const already = state.discoveredScreens || []
      if (already.includes(scr)) return state
      return { ...state, discoveredScreens: [...already, scr], lastSavedAt: Date.now() }
    }

    case ACTIONS.ENCOUNTER_TRIGGERED:
      return state

    case ACTIONS.ENTER_BATTLE_FROM_WORLD: {
      const { position, enemy } = action.payload
      return { ...state, worldPosition: position, worldBattleEnemy: enemy, pendingBattle: null, lastSavedAt: Date.now() }
    }

    case ACTIONS.RETURN_FROM_WORLD_BATTLE:
      return { ...state, worldBattleEnemy: null, battleCreatureId: null, lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_WORLD_POSITION:
      return { ...state, worldPosition: null, lastSavedAt: Date.now() }

    // ── Party + creature battle system ────────────────────────────────────────

    case ACTIONS.SET_PENDING_BATTLE:
      return { ...state, pendingBattle: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_PENDING_BATTLE:
      return { ...state, pendingBattle: null, battleCreatureId: null, lastSavedAt: Date.now() }

    case ACTIONS.SET_BATTLE_CREATURE:
      return { ...state, battleCreatureId: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.SELECT_CREATURE_AND_ENTER_BATTLE: {
      const { creatureId, battle } = action.payload
      const { position, enemy } = battle ?? {}
      return {
        ...state,
        battleCreatureId: creatureId,
        worldPosition: position ?? state.worldPosition,
        worldBattleEnemy: enemy ?? state.worldBattleEnemy,
        pendingBattle: null,
        lastSavedAt: Date.now(),
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
      return { ...state, hatchedEggs, lastSavedAt: Date.now() }
    }

    case ACTIONS.CREATURE_HEAL: {
      const { creatureId, amount } = action.payload
      return {
        ...state,
        hatchedEggs: (state.hatchedEggs || []).map(e => {
          if (e.id !== creatureId) return e
          const maxHP = e.stats?.HP ?? 100
          const newHP = Math.min(maxHP, (e.currentHP ?? maxHP) + amount)
          return { ...e, currentHP: newHP }
        }),
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.CREATURE_GAIN_BATTLE_XP: {
      const { creatureId, xp } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const newBattleXP    = (e.battleXP ?? 0) + xp
        const newBattleLevel = calcBattleLevel(newBattleXP)
        return { ...e, battleXP: newBattleXP, battleLevel: newBattleLevel }
      })
      return { ...state, hatchedEggs, lastSavedAt: Date.now() }
    }

    case ACTIONS.ADD_TO_PARTY: {
      const { creatureId: cid } = action.payload
      if ((state.party || []).includes(cid)) return state
      if ((state.party || []).length >= (state.partySlots || 1)) return state
      const hatchedEggs = (state.hatchedEggs || []).map(e =>
        e.id === cid ? { ...e, inParty: true } : e
      )
      return { ...state, party: [...(state.party || []), cid], hatchedEggs, lastSavedAt: Date.now() }
    }

    case ACTIONS.SET_ACTIVE_CREATURE: {
      const { creatureId: activeId } = action.payload
      const party = state.party || []
      if (!party.includes(activeId) || party[0] === activeId) return state
      return { ...state, party: [activeId, ...party.filter(id => id !== activeId)], lastSavedAt: Date.now() }
    }

    case ACTIONS.UNLOCK_PARTY_SLOT:
      return { ...state, partySlots: Math.min(6, (state.partySlots || 1) + 1), lastSavedAt: Date.now() }

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
      return {
        ...state,
        battleWins: newBattleWins,
        hatchedEggs: eggsAfterWin,
        pendingEvoNotice: evoNoticeW,
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SET_WORLD_LEVEL:
      return {
        ...state,
        worldLevel: action.payload,
        currentScreen: 'NW',
        discoveredScreens: ['NW'],
        mazePortal: { screenId: ['NW','NE','SW','SE'][Math.floor(Math.random() * 4)], col: null, row: null },
        mazeActive: false,
        mazeCleared: false,
        clearedMaps: [],
        bossDefeatedThisTier: false,
        bossEnemyDefeated: false,
        bossRoamingScreen: null,
        bossWinsAtDefeat: 0,
        lastSavedAt: Date.now(),
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
        currentScreen: 'NW',
        worldPosition: null,
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.RESPAWN_BOSS_ON_NORMAL_MAP: {
      const screens = ['NW', 'NE', 'SW', 'SE']
      const bossRoamingScreen = screens[(state.battleWins ?? 0) % 4]
      return { ...state, bossRoamingScreen, lastSavedAt: Date.now() }
    }

    case ACTIONS.ACTIVATE_MAZE:
      return { ...state, mazeActive: true, lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_MAZE: {
      const mazeClearScreens = ['NW', 'NE', 'SW', 'SE']
      const newPortalScreen = mazeClearScreens[Math.floor(Math.random() * mazeClearScreens.length)]
      return {
        ...state,
        mazeActive: false,
        mazePortal: { screenId: newPortalScreen, col: null, row: null },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SET_CREATURE_NAME: {
      const { creatureId, name } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e =>
        e.id === creatureId ? { ...e, creatureName: name } : e
      )
      return { ...state, hatchedEggs, lastSavedAt: Date.now() }
    }

    case ACTIONS.ADD_CREATURE_BOND: {
      const { creatureId, amount } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const bond = Math.min(100, (e.bondMeter ?? 0) + amount)
        const newEvo = calcEvoStage(e.battleLevel ?? 1, state.grade ?? 0, bond, e.evoStage ?? 'baby')
        return { ...e, bondMeter: bond, evoStage: newEvo }
      })
      return { ...state, hatchedEggs, lastSavedAt: Date.now() }
    }

    case ACTIONS.CREATURE_EVOLVE: {
      const { creatureId } = action.payload
      const hatchedEggs = (state.hatchedEggs || []).map(e => {
        if (e.id !== creatureId) return e
        const newEvo = calcEvoStage(e.battleLevel ?? 1, state.grade ?? 0, e.bondMeter ?? 0, e.evoStage ?? 'baby')
        return { ...e, evoStage: newEvo }
      })
      return { ...state, hatchedEggs, lastSavedAt: Date.now() }
    }

    case ACTIONS.CLEAR_EVO_NOTICE:
      return { ...state, pendingEvoNotice: null, lastSavedAt: Date.now() }

    case ACTIONS.MAP_CLEARED: {
      const sid = action.payload
      const cleared = state.clearedMaps || []
      if (!['NW','NE','SW','SE'].includes(sid) || cleared.includes(sid)) return state
      return { ...state, clearedMaps: [...cleared, sid], lastSavedAt: Date.now() }
    }

    case ACTIONS.SECRET_MAP_SPAWN:
      return { ...state, mazeActive: true, mazeCleared: false, secretMapExpiry: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.SECRET_MAP_EXPIRE:
      return { ...state, mazeActive: false, secretMapExpiry: null, lastSavedAt: Date.now() }

    case ACTIONS.CREATURE_STAT_BOOST: {
      const { creatureId, stat, amount } = action.payload
      return {
        ...state,
        hatchedEggs: (state.hatchedEggs || []).map(e => {
          if (e.id !== creatureId) return e
          const newStats = { ...(e.stats ?? {}), [stat]: (e.stats?.[stat] ?? 0) + amount }
          const maxHP = newStats.HP ?? 100
          return { ...e, stats: newStats, currentHP: Math.min(maxHP, e.currentHP ?? maxHP) }
        }),
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SET_SUBJECT_LEVEL: {
      const { subject, level } = action.payload
      const newLevels = { ...(state.subjectLevels || { thai:1, math:1, eng:1 }), [subject]: level }
      const avgLevel = Object.values(newLevels).reduce((s,v) => s+v, 0) / Object.keys(newLevels).length
      const newGrade = avgLevel >= 4 ? 3
        : avgLevel >= 3 ? 2
        : avgLevel >= 2 ? 1
        : 0
      const updatedGrade = Math.max(state.grade ?? 0, newGrade)
      return {
        ...state,
        subjectLevels:     newLevels,
        subjectLevelFloor: { ...(state.subjectLevelFloor || {}), [subject]: level },
        grade: updatedGrade,
        readyToHatch: updatedGrade !== (state.grade ?? 0) && (state.hatchedEggs?.length ?? 0) < 6
          ? true
          : state.readyToHatch,
        hatchedEggs: updatedGrade !== (state.grade ?? 0)
          ? (state.hatchedEggs || []).map(e => {
              const newEvo = calcEvoStageInline(e.battleLevel ?? 1, updatedGrade, e.bondMeter ?? 0)
              return newEvo !== (e.evoStage ?? 'baby') ? { ...e, evoStage: newEvo } : e
            })
          : state.hatchedEggs,
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SET_PENDING_LEVEL_UP:
      return { ...state, pendingLevelUp: action.payload, lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_PENDING_LEVEL_UP:
      return { ...state, pendingLevelUp: null, lastSavedAt: Date.now() }

    case ACTIONS.SET_PENDING_REWARDS:
      return { ...state, pendingRewards: action.payload ?? [], lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_PENDING_REWARDS:
      return { ...state, pendingRewards: [], lastSavedAt: Date.now() }

    case ACTIONS.SET_SUBJECT_SESSION_STREAK: {
      const { subject, streak } = action.payload
      return {
        ...state,
        subjectSessionStreak: { ...(state.subjectSessionStreak || {}), [subject]: streak },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.RECORD_INPUT_MODE_RESULT: {
      const { mode, success } = action.payload
      if (!['wordbuild', 'sequence'].includes(mode)) return state
      const current = state.inputModeMastery?.[mode] ?? 0
      const delta = success ? 0.15 : -0.08
      const updated = Math.max(0, Math.min(1, current + delta))
      return {
        ...state,
        inputModeMastery: { ...state.inputModeMastery, [mode]: updated },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SPAWN_MAZE_PORTAL: {
      const portalScreens = ['NW', 'NE', 'SW', 'SE']
      const portalScreenId = portalScreens[Math.floor(Math.random() * portalScreens.length)]
      return { ...state, mazePortal: { screenId: portalScreenId, col: null, row: null }, lastSavedAt: Date.now() }
    }

    case ACTIONS.SPAWN_MAZE_PORTAL_RESOLVED:
      if (!state.mazePortal) return state
      return { ...state, mazePortal: { ...state.mazePortal, col: action.payload.col, row: action.payload.row }, lastSavedAt: Date.now() }

    case ACTIONS.ENTER_MAZE:
      return { ...state, mazeActive: true, lastSavedAt: Date.now() }

    case ACTIONS.ADD_COINS: {
      const { amount, bonusKey } = action.payload
      if (bonusKey && (state.coinsLevelBonus || {})[bonusKey]) return state
      return {
        ...state,
        coins: Math.max(0, (state.coins || 0) + amount),
        ...(bonusKey ? { coinsLevelBonus: { ...(state.coinsLevelBonus || {}), [bonusKey]: true } } : {}),
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.DAILY_LOGIN: {
      const today = todayStr()
      if ((state.lastLoginDate || '') === today) return state
      const d = new Date(Date.now() - 86400000)
      const yesterday = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
      const streak = (state.lastLoginDate || '') === yesterday ? (state.loginStreak || 0) + 1 : 1
      const bonus = 10 + Math.min(streak, 5)
      // lastSavedAt bumped so resolveSync sees local as genuinely newer than Supabase,
      // preventing the async INIT dispatch from reverting the daily coin award.
      return {
        ...state,
        lastLoginDate: today,
        loginStreak: streak,
        coins: Math.max(0, (state.coins || 0) + bonus),
        _dailyLoginBonus: bonus,
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.BUY_ITEM: {
      const { id, price, slot } = action.payload
      if ((state.coins || 0) < price) return state
      if ((state.ownedItems || []).includes(id)) return state
      // lastSavedAt bumped (see c74e83d) so resolveSync sees local as genuinely
      // newer than the Supabase snapshot; otherwise a stale remote read reverts
      // the purchase — ownedItems vanishes on the next reload.
      return {
        ...state,
        coins: (state.coins || 0) - price,
        ownedItems: [...(state.ownedItems || []), id],
        equipped: { ...(state.equipped || { head: null, face: null }), [slot]: id },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.EQUIP_ITEM: {
      const { id, slot } = action.payload
      if (!(state.ownedItems || []).includes(id)) return state
      const current = (state.equipped || {})[slot]
      // lastSavedAt bumped (see c74e83d) so an equip/unequip survives a stale
      // remote resolveSync instead of being reverted on reload.
      return {
        ...state,
        equipped: { ...(state.equipped || { head: null, face: null }), [slot]: current === id ? null : id },
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.BUY_ROOM_ITEM: {
      const { id, price } = action.payload
      if ((state.coins || 0) < price) return state
      if ((state.ownedRoomItems || []).includes(id)) return state
      // lastSavedAt bumped (see c74e83d) — same latent revert bug as BUY_ITEM.
      return {
        ...state,
        coins: (state.coins || 0) - price,
        ownedRoomItems: [...(state.ownedRoomItems || []), id],
        lastSavedAt: Date.now(),
      }
    }

    // PLACE/REMOVE_ROOM_ITEM (no _IN_ROOM suffix) stay for any caller that still
    // uses them — they now just target whichever room is active by delegating to
    // the room-aware versions. Item ownership stays a GLOBAL, non-consumable unlock:
    // an owned item can appear in as many slots (across as many rooms) as desired.
    case ACTIONS.PLACE_ROOM_ITEM:
      return reducer(state, { type: ACTIONS.PLACE_ROOM_ITEM_IN_ROOM, payload: { ...action.payload, roomId: state.activeRoomId } })

    case ACTIONS.REMOVE_ROOM_ITEM:
      return reducer(state, { type: ACTIONS.REMOVE_ROOM_ITEM_FROM_ROOM, payload: { ...action.payload, roomId: state.activeRoomId } })

    case ACTIONS.PLACE_ROOM_ITEM_IN_ROOM: {
      const { roomId, slotKey, itemId } = action.payload
      if (!(state.ownedRoomItems || []).includes(itemId)) return state
      const room = (state.rooms || []).find(r => r.id === roomId)
      if (!room) return state
      return applyRoomLayoutChange(state, roomId, { ...(room.layout || {}), [slotKey]: itemId })
    }

    case ACTIONS.REMOVE_ROOM_ITEM_FROM_ROOM: {
      const { roomId, slotKey } = action.payload
      const room = (state.rooms || []).find(r => r.id === roomId)
      if (!room) return state
      const newLayout = { ...(room.layout || {}) }
      delete newLayout[slotKey]
      return applyRoomLayoutChange(state, roomId, newLayout)
    }

    case ACTIONS.BUY_ROOM_BLOCK: {
      const { gridX, gridY, theme } = action.payload
      const price = 1000
      if ((state.coins || 0) < price) return state
      const rooms = state.rooms || []
      // guard: no room already at this cell
      if (rooms.some(r => r.gridX === gridX && r.gridY === gridY)) return state
      // guard: must be orthogonally adjacent to an existing room (grid stays connected)
      const adjacent = rooms.some(r => Math.abs(r.gridX - gridX) + Math.abs(r.gridY - gridY) === 1)
      if (!adjacent) return state
      const id = `${theme}_${Date.now()}`
      return {
        ...state,
        coins: (state.coins || 0) - price,
        rooms: [...rooms, { id, theme, gridX, gridY, layout: {} }],
        activeRoomId: id,
        roomLayout: {},   // mirror follows the newly-active (empty) room
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.SET_ACTIVE_ROOM: {
      const { roomId } = action.payload
      const room = (state.rooms || []).find(r => r.id === roomId)
      if (!room) return state
      return { ...state, activeRoomId: roomId, roomLayout: room.layout || {}, lastSavedAt: Date.now() }
    }

    case ACTIONS.SET_HOME_ROOM: {
      const { roomId } = action.payload
      if (!(state.rooms || []).some(r => r.id === roomId)) return state
      return { ...state, homeRoomId: roomId, lastSavedAt: Date.now() }
    }

    default:
      return state
  }
}

export function StateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY)) || {}
      const raw = { ...defaultState(), ...saved }
      if (!raw.activeBoosts) raw.activeBoosts = {}
      // Multi-room: keep `rooms` + the `roomLayout` mirror consistent from frame 1
      // (the async migrateStateShape() path also does this, but this avoids a flash
      // of an empty room before INIT lands). Mirror the full migration's intent.
      if (!Array.isArray(saved.rooms)) {
        raw.rooms = [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: raw.roomLayout || {} }]
        raw.activeRoomId = 'main'
        raw.homeRoomId = 'main'
      } else {
        raw.rooms = saved.rooms
        raw.activeRoomId = saved.activeRoomId || saved.rooms[0]?.id || 'main'
        raw.homeRoomId = saved.homeRoomId || saved.rooms[0]?.id || 'main'
        const active = raw.rooms.find(r => r.id === raw.activeRoomId)
        raw.roomLayout = active?.layout || {}
      }
      const migrated = _migrateBattleStats(raw)
      // Clamp currentHP to stats.HP max (fixes corrupted states where currentHP > stats.HP)
      if (migrated.hatchedEggs?.length) {
        migrated.hatchedEggs = migrated.hatchedEggs.map(e => ({
          ...e,
          currentHP: Math.min(e.stats?.HP ?? 100, e.currentHP ?? e.stats?.HP ?? 100)
        }))
      }
      const needsMerge = (migrated.hatchedEggs?.length ?? 0) > 1
      const merged = needsMerge ? _mergeAllCreaturesIntoOne(migrated) : migrated
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

    // Daily login coins — show toast after a brief delay so ItemToast is registered
    const loginToday = todayStr()
    if ((state.lastLoginDate || '') !== loginToday) {
      const _d = new Date(Date.now() - 86400000)
      const _yesterday = _d.getFullYear() + '-' + (_d.getMonth() + 1) + '-' + _d.getDate()
      const _loginStreak = (state.lastLoginDate || '') === _yesterday ? (state.loginStreak || 0) + 1 : 1
      const _loginBonus = 10 + Math.min(_loginStreak, 5)
      dispatch({ type: ACTIONS.DAILY_LOGIN })
      if (_loginBonus) playSFX('coin_earn')
      setTimeout(() => showItemToast(`ล็อกอินรายวัน 🪙 +${_loginBonus}`), 900)
    }
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
      if (remote) {
        const cur = stateRef.current
        // Run merge on remote data so Supabase state gets cleaned up too
        const remoteNeedsMerge = (remote.hatchedEggs?.length ?? 0) > 1
        const remoteFinal = remoteNeedsMerge ? _mergeAllCreaturesIntoOne(remote) : remote

        // resolveSync closes Issue D's timing gap via maintenance-immune fields:
        // even though the DECAY_HAPPINESS / CHECK_DAILY_RESET / DAILY_LOGIN
        // dispatches above have already inflated cur.lastSavedAt (and possibly
        // added daily coins) by the time this async callback runs, resolveSync()
        // now also compares real-progress fields those dispatches never touch, so
        // an empty new device can't beat real cloud progress on timestamp alone.
        const { winner, remoteWon, reason } = resolveSync(cur, remoteFinal)
        console.log('[KQ:load]', remoteWon ? 'remote wins' : 'local wins', '—', reason)
        if (remoteWon) {
          dispatch({ type: ACTIONS.INIT, payload: winner })
        } else {
          syncToSupabase(cur)
        }
      }
    }).catch(e => {
      console.log('[KQ:load] resolveSync chain failed:', e?.message)
    }).finally(() => {
      // Initial load/sync is done (or safely failed) — unblock saveState(). Using
      // finally() guarantees saves are never permanently disabled even if the
      // promise rejects (loadState() has its own try/catch and always resolves,
      // but this is belt-and-suspenders per Fix 2).
      markInitialSyncComplete()
    })

    // Startup guard: if user is logged in but local hatchedEggs is empty, force pull from cloud
    if (supabase) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return
        const cur = stateRef.current
        if ((cur.hatchedEggs?.length ?? 0) === 0) {
          console.log('[KQ:startup] logged in but no local creatures — auto-restoring from cloud')
          try {
            const { data: row } = await supabase.from('eggs').select('state_json').eq('user_id', user.id).single()
            if ((row?.state_json?.hatchedEggs?.length ?? 0) > 0) {
              console.log('[KQ:startup] cloud has creatures → dispatch INIT')
              localStorage.setItem(KEY, JSON.stringify(row.state_json))
              dispatch({ type: ACTIONS.INIT, payload: row.state_json })
            }
          } catch (e) {
            console.log('[KQ:startup] auto-restore failed:', e.message)
          }
        }
      })
    }

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
              const { winner, remoteWon, reason } = resolveSync(cur, remote)
              console.log('[KQ:auth]', remoteWon ? 'cloud wins' : 'local is ahead', '—', reason)
              if (remoteWon) {
                localStorage.setItem(KEY, JSON.stringify(winner))
                dispatch({ type: ACTIONS.INIT, payload: winner })
              } else {
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
