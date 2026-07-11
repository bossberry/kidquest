// StateContext.jsx — global state store (useReducer + Context). Single source of truth for all game state; persists to localStorage and Supabase.
import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import { KEY, defaultState, loadState, saveState, syncToSupabase, resolveSync, markInitialSyncComplete, validateState, _migrateBattleStats, _mergeAllCreaturesIntoOne } from '../lib/state.js'
import { supabase } from '../lib/supabase.js'
import { eggProgress, buildEggStats, totalXP, EGG_STAGES, STAGE_XP_NEEDED } from '../lib/eggAlgorithm.js'
import { ITEMS, GRADE_LABELS, todayStr, shuffle, calcCreatureStats, AI_OPPONENTS, PROGRESSION_MAP } from '../config/gameConfig.js'
import { buildCreatureDNA, generateCreatureName } from '../lib/creatureGenerator.js'
import { determineElement, calcEvoStage } from '../lib/creatureSystem.js'
import { showItemToast } from '../components/Toasts.jsx'
import { playSFX } from '../lib/audio.js'
import { CRAFT_RECIPES, COZY_CRAFT_RECIPES, WALLPAPER_BY_ID } from '../lib/roomItems.js'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import { applyAnswerToMastery } from '../lib/curriculum.js'
import { recordMissForTeaching, clearTeaching } from '../lib/teachingMoments.js'
import { computeCareTick, applyFeed, applyPetEgg, applyPlayTouch, FOOD_CATALOG } from '../lib/eggCare.js'
import { computeDisplayStage, computeAffinity, countMasteredNodes, AFFINITY_LINES } from '../lib/eggEvolution.js'

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
  READALOUD_DEDUCT_LIFE: 'READALOUD_DEDUCT_LIFE',
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
  // Phase 1.1 curriculum system
  CLEAR_NODE_MASTERY:        'CLEAR_NODE_MASTERY',
  // Phase 1.2 placement test
  COMPLETE_PLACEMENT:        'COMPLETE_PLACEMENT',
  // Phase 1.3 teaching moments
  CLEAR_PENDING_TEACHING:    'CLEAR_PENDING_TEACHING',
  // SPEC GAME-A §A.1 Care Loop
  TICK_CARE:                 'TICK_CARE',
  FEED_EGG:                  'FEED_EGG',
  PET_EGG:                   'PET_EGG',
  PLAY_TOUCH_GAME:           'PLAY_TOUCH_GAME',
  CLEAR_PENDING_WAKE_UP:      'CLEAR_PENDING_WAKE_UP',
  CLEAR_PENDING_COMEBACK_JOY: 'CLEAR_PENDING_COMEBACK_JOY',
  BUY_FOOD_ITEM:              'BUY_FOOD_ITEM',
  // SPEC GAME-A §A.2 Evolution x Education — mints an evolutionAlbum entry +
  // one-shot ceremony signal when the combined mastery-aware stage (see
  // eggEvolution.js) advances. Dispatched from useHomeAmbience's existing
  // stage-up detection effect (same place the old lightweight stageUp banner
  // already lived), which supersedes that banner for real stage-ups.
  RECORD_EVOLUTION:               'RECORD_EVOLUTION',
  CLEAR_PENDING_EVOLUTION_CEREMONY: 'CLEAR_PENDING_EVOLUTION_CEREMONY',
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
  // SPEC GAME-B §B.1 (2026-07-10) — Dressing Room: body/back slots, wardrobe QoL
  ADD_OWNED_ITEM:        'ADD_OWNED_ITEM',
  CLEAR_NEW_ITEM:        'CLEAR_NEW_ITEM',
  SAVE_FAVORITE_OUTFIT:  'SAVE_FAVORITE_OUTFIT',
  WEAR_FAVORITE_OUTFIT:  'WEAR_FAVORITE_OUTFIT',
  CLEAR_FAVORITE_OUTFIT: 'CLEAR_FAVORITE_OUTFIT',
  RANDOM_OUTFIT:         'RANDOM_OUTFIT',
  REMOVE_ALL_OUTFIT:     'REMOVE_ALL_OUTFIT',
  // SPEC GAME-B §B.2 (2026-07-10) — Room: wallpaper/flooring, room hearts
  BUY_WALLPAPER:      'BUY_WALLPAPER',
  BUY_FLOORING:       'BUY_FLOORING',
  APPLY_WALLPAPER:    'APPLY_WALLPAPER',
  APPLY_FLOORING:     'APPLY_FLOORING',
  CRAFT_COZY_ITEM:    'CRAFT_COZY_ITEM',
  SET_ROOM_HEARTS:    'SET_ROOM_HEARTS',
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
  // Room items (2026-07-07): monster drops + auto-collected materials → instant craft
  COLLECT_MATERIAL:            'COLLECT_MATERIAL',
  CRAFT_ITEM:                  'CRAFT_ITEM',
  ADD_OWNED_ROOM_ITEM:         'ADD_OWNED_ROOM_ITEM',
  CLEAR_NEW_ROOM_ITEM:         'CLEAR_NEW_ROOM_ITEM',
  // SPEC GAME-B §B.3 (2026-07-11) — World Map: run/minimap/side-quests/secrets
  MARK_SCREEN_EXPLORED: 'MARK_SCREEN_EXPLORED',
  START_SIDE_QUEST:     'START_SIDE_QUEST',
  UPDATE_SIDE_QUEST:    'UPDATE_SIDE_QUEST',
  COMPLETE_SIDE_QUEST:  'COMPLETE_SIDE_QUEST',
  MARK_SECRET_FOUND:    'MARK_SECRET_FOUND',
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

// Phase 1.1 curriculum system — RECORD_ANSWER bookkeeping, folded into the
// existing LOG_BATTLE_ANSWER reducer case (see CLAUDE.md's "extend existing
// answer handling" guidance) rather than a parallel action, since every real
// battle answer already dispatches LOG_BATTLE_ANSWER and node-driven questions
// (selectBattleQuestion in questionBank.js) attach `nodeId`/`countsForMastery`
// to the question object that flows back through here.
//
// applyAnswerToMastery() itself now lives in curriculum.js as a pure function
// (retrofitted out of this file so it's finally covered by a real committed
// test suite — see curriculum.test.js — instead of only ever being verifiable
// by manual trace the way it was originally written here).

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
      const lives = reset ? 2 : (state.eggRunLives || 0)
      return { ...state, eggRunLives: Math.max(0, lives - 1), lastRunDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.MEMORY_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastMemoryDate || '') !== today
      const lives = reset ? 3 : (state.memoryLives || 0)
      return { ...state, memoryLives: Math.max(0, lives - 1), lastMemoryDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.CATCH_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastCatchDate || '') !== today
      const lives = reset ? 3 : (state.catchLives || 0)
      return { ...state, catchLives: Math.max(0, lives - 1), lastCatchDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.TOWER_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastTowerDate || '') !== today
      const lives = reset ? 3 : (state.towerLives || 0)
      return { ...state, towerLives: Math.max(0, lives - 1), lastTowerDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.FISHING_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastFishingDate || '') !== today
      const lives = reset ? 2 : (state.fishingLives || 0)
      return { ...state, fishingLives: Math.max(0, lives - 1), lastFishingDate: today, lastSavedAt: Date.now() }
    }

    case ACTIONS.READALOUD_DEDUCT_LIFE: {
      const today = todayStr()
      const reset = (state.lastReadAloudDate || '') !== today
      const lives = reset ? 3 : (state.readAloudLives || 0)
      return { ...state, readAloudLives: Math.max(0, lives - 1), lastReadAloudDate: today, lastSavedAt: Date.now() }
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
      const { subject, correct, responseTimeMs, timestamp, nodeId, countsForMastery, inputMode } = action.payload
      if (!subject || typeof responseTimeMs !== 'number') return state
      const prev = state.responseTimeLogs?.[subject] ?? []
      const updated = [...prev, { timeMs: responseTimeMs, correct, timestamp }].slice(-50)
      // Phase 1.1: node-driven battle questions (selectBattleQuestion) attach nodeId
      // + countsForMastery. Preview questions (countsForMastery === false) deliberately
      // skip mastery bookkeeping — see questionBank.js's selectBattleQuestion comment.
      const masteryUpdate = (nodeId && countsForMastery !== false)
        ? applyAnswerToMastery(state.skillMastery, state.activeNodes, state.pendingNodeMastery, subject, nodeId, correct)
        : { skillMastery: state.skillMastery, activeNodes: state.activeNodes, pendingNodeMastery: state.pendingNodeMastery ?? null }
      // Phase 1.3: same countsForMastery gate as mastery bookkeeping above —
      // preview questions are exposure-only and shouldn't count as "struggling"
      // toward a teaching moment either.
      const teachingUpdate = (nodeId && inputMode && countsForMastery !== false)
        ? recordMissForTeaching(state.missStreaks, state.pendingTeaching, nodeId, inputMode, correct)
        : { missStreaks: state.missStreaks, pendingTeaching: state.pendingTeaching ?? null }
      return {
        ...state,
        responseTimeLogs: {
          ...(state.responseTimeLogs ?? {}),
          [subject]: updated,
        },
        skillMastery: masteryUpdate.skillMastery,
        activeNodes: masteryUpdate.activeNodes,
        pendingNodeMastery: masteryUpdate.pendingNodeMastery,
        missStreaks: teachingUpdate.missStreaks,
        pendingTeaching: teachingUpdate.pendingTeaching,
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.CLEAR_NODE_MASTERY:
      return { ...state, pendingNodeMastery: null, lastSavedAt: Date.now() }

    // Phase 1.3 — dispatched by TeachingMoment.jsx when it finishes (correct
    // practice answer, or hit the MAX_EXPLANATION_LOOPS cap). clearTeaching()
    // also resets that node+type's miss streak to 0, guaranteeing the same
    // teaching moment can't fire again until a fresh run of 3 misses.
    case ACTIONS.CLEAR_PENDING_TEACHING: {
      const { missStreaks } = clearTeaching(state.missStreaks, state.pendingTeaching)
      return { ...state, pendingTeaching: null, missStreaks, lastSavedAt: Date.now() }
    }

    // SPEC GAME-A §A.1 — dispatched on mount + every 5 minutes (Home.jsx).
    // computeCareTick is the single source of truth for hunger/happiness
    // decay (real elapsed wall-clock hours since eggCare.lastCareTick),
    // the daily wake-up reset, and comeback-joy detection — see eggCare.js
    // for the full reasoning behind each.
    case ACTIONS.TICK_CARE:
      return { ...state, eggCare: computeCareTick(state.eggCare, Date.now()), lastSavedAt: Date.now() }

    // payload: { food: foodKey, element: the companion's real element (fire/
    // water/thunder/nature/shadow/light) read from useCompanion() in Home.jsx,
    // since reducers can't call hooks }. No-op (state unchanged) if the food
    // guard blocks it (out of stock / overfeed) — applyFeed's `fed` flag is
    // returned via a transient, NON-PERSISTED `_feedResult` field so the UI
    // can show the right chomp/favorite/overfed reaction without needing a
    // second read-only selector; cleared by the next unrelated dispatch same
    // as this project's other transient one-shot UI signals.
    case ACTIONS.FEED_EGG: {
      const { food, element } = action.payload
      const result = applyFeed(state.eggCare, food, element)
      if (!result.fed && !result.overfed) return state // out of stock — truly nothing happened
      return {
        ...state, eggCare: result.care,
        _feedResult: { food, fed: result.fed, isFavorite: result.isFavorite, overfed: result.overfed, id: Date.now() },
        lastSavedAt: Date.now(),
      }
    }

    // Touch play (poke/stroke/tickle/hold/shake — Home.jsx dispatches this
    // for every gesture). Bundles the happiness grant (capped/day) AND the
    // small energy cost into one dispatch since every real touch-play
    // interaction always does both together (see eggCare.js's applyPetEgg/
    // applyPlayTouch — kept as two separate pure functions since PLAY_TOUCH_GAME
    // below can also fire on its own from a minigame launch, which spends
    // energy without being a direct pet gesture).
    case ACTIONS.PET_EGG: {
      const { care: afterHappiness } = applyPetEgg(state.eggCare)
      const { care: afterEnergy } = applyPlayTouch(afterHappiness)
      return { ...state, eggCare: afterEnergy, lastSavedAt: Date.now() }
    }

    // Fired when the child launches an actual play activity (minigame/
    // battle) rather than a direct touch gesture — energy cost only, no
    // happiness grant (that's PET_EGG's job for direct interaction).
    case ACTIONS.PLAY_TOUCH_GAME: {
      const { care } = applyPlayTouch(state.eggCare)
      return { ...state, eggCare: care, lastSavedAt: Date.now() }
    }

    case ACTIONS.CLEAR_PENDING_WAKE_UP:
      return { ...state, eggCare: { ...state.eggCare, pendingWakeUp: null }, lastSavedAt: Date.now() }

    case ACTIONS.CLEAR_PENDING_COMEBACK_JOY:
      return { ...state, eggCare: { ...state.eggCare, pendingComebackJoy: null }, lastSavedAt: Date.now() }

    // payload: { stage, affinity, affinityLine, element, masteredCount }. The
    // caller (useHomeAmbience's stage-up detection effect) already knows the
    // NEW combined stage crossed a threshold — this just mints the permanent
    // album record and raises the one-shot ceremony flag. snapshot is left
    // null; the album viewer re-renders the historical form live from the
    // stored stage/affinity/element instead of storing a pixel snapshot.
    case ACTIONS.RECORD_EVOLUTION: {
      const entry = { ...action.payload, date: Date.now(), snapshot: null }
      return {
        ...state,
        evolutionAlbum: [...(state.evolutionAlbum || []), entry],
        pendingEvolutionCeremony: entry,
        lastSavedAt: Date.now(),
      }
    }

    case ACTIONS.CLEAR_PENDING_EVOLUTION_CEREMONY:
      return { ...state, pendingEvolutionCeremony: null, lastSavedAt: Date.now() }

    // payload: { food: foodKey }. Coins-for-food purchase — mirrors BUY_ITEM's
    // shape (guard insufficient funds, deduct coins, grant the thing).
    case ACTIONS.BUY_FOOD_ITEM: {
      const { food } = action.payload
      const catalogEntry = FOOD_CATALOG[food]
      if (!catalogEntry || (state.coins || 0) < catalogEntry.price) return state
      return {
        ...state,
        coins: state.coins - catalogEntry.price,
        eggCare: {
          ...state.eggCare,
          foodInventory: { ...state.eggCare.foodInventory, [food]: (state.eggCare.foodInventory[food] || 0) + 1 },
        },
        lastSavedAt: Date.now(),
      }
    }

    // Phase 1.2 — payload.results: { thai: nodeId, math: nodeId, eng: nodeId },
    // one entry per subject from the adaptive placement test. Sets activeNodes
    // directly from the results (this is the "starting node" the placement test
    // exists to determine) — a fresh account has no skillMastery yet, so there's
    // no mastery/prerequisite conflict to resolve here, just a direct assignment.
    case ACTIONS.COMPLETE_PLACEMENT: {
      const { results } = action.payload
      return {
        ...state,
        placementDone: true,
        placementResults: { ...results, completedAt: Date.now() },
        activeNodes: { ...(state.activeNodes || {}), ...results },
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
        rooms: [...rooms, { id, theme, gridX, gridY, layout: {}, wallpaper: null, flooring: null }],
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

    // ── Room items (2026-07-07) ─────────────────────────────────────────────────
    // COLLECT_MATERIAL — award `amount` of one material (cap 30 each, per the
    // simplified auto-collect-while-walking spec — was 99/20-per-day under the
    // earlier manual-button system). Advances the 15/day auto-collect counter,
    // resetting it when the stored date isn't today (todayStr() convention,
    // same as minigame lives). The caller (WorldScreen's tryMove) checks the
    // remaining budget before dispatching, but the cap is enforced here too.
    case ACTIONS.COLLECT_MATERIAL: {
      const { material, amount = 1 } = action.payload
      if (!material) return state
      const today = todayStr()
      const reset = (state.lastMaterialDate || '') !== today
      const usedToday = reset ? 0 : (state.dailyMaterialsCollected || 0)
      if (usedToday >= 15) return state
      const mats = { ...(state.materials || {}) }
      mats[material] = Math.min(30, (mats[material] || 0) + amount)
      return {
        ...state,
        materials: mats,
        dailyMaterialsCollected: Math.min(15, usedToday + amount),
        lastMaterialDate: today,
        lastSavedAt: Date.now(),
      }
    }

    // CRAFT_ITEM — instant craft (no confirm step in the UI): look up the
    // recipe, verify every material requirement is met, deduct them all, and
    // add the item to ownedRoomItems (placeable through the normal Room flow)
    // + craftedItems (provenance) + flag hasNewRoomItem for the nav badge.
    // No-op if the recipe is unknown, requirements aren't met, or already owned.
    // SPEC GAME-B §B.1 (2026-07-10): CRAFT_RECIPES now also holds 2 cosmetic
    // items (butterfly_wings/mini_umbrella) — same shared recipe table the
    // spec asked to extend, but a cosmetic craft must land in ownedItems (the
    // wearable catalog) rather than ownedRoomItems, so this branches on which
    // catalog itemId actually belongs to.
    case ACTIONS.CRAFT_ITEM: {
      const { itemId } = action.payload
      const recipe = CRAFT_RECIPES[itemId]
      if (!recipe) return state
      const isCosmetic = COSMETIC_ITEMS.some(i => i.id === itemId)
      const ownedArr = isCosmetic ? 'ownedItems' : 'ownedRoomItems'
      if ((state[ownedArr] || []).includes(itemId)) return state
      const mats = state.materials || {}
      for (const k in recipe) if ((mats[k] || 0) < recipe[k]) return state
      const newMats = { ...mats }
      for (const k in recipe) newMats[k] = (newMats[k] || 0) - recipe[k]
      return {
        ...state,
        materials: newMats,
        [ownedArr]: [...(state[ownedArr] || []), itemId],
        craftedItems: [...(state.craftedItems || []), itemId],
        ...(isCosmetic ? { hasNewItem: true } : { hasNewRoomItem: true }),
        lastSavedAt: Date.now(),
      }
    }

    // ADD_OWNED_ROOM_ITEM — monster-drop furniture, dispatched from
    // useBattleCombat.js's showVictory() on a 30% post-win roll. No-op if
    // already owned (the caller checks this first to decide between a real
    // item drop and a 15-coin consolation prize, but the reducer guards too).
    case ACTIONS.ADD_OWNED_ROOM_ITEM: {
      const { itemId } = action.payload
      if (!itemId || (state.ownedRoomItems || []).includes(itemId)) return state
      return {
        ...state,
        ownedRoomItems: [...(state.ownedRoomItems || []), itemId],
        hasNewRoomItem: true,
        lastSavedAt: Date.now(),
      }
    }

    // CLEAR_NEW_ROOM_ITEM — dispatched when Room.jsx mounts, clearing the
    // BottomNav "✨ ของใหม่!" bubble now that the child has seen the new item.
    case ACTIONS.CLEAR_NEW_ROOM_ITEM:
      return state.hasNewRoomItem ? { ...state, hasNewRoomItem: false } : state

    // SPEC GAME-B §B.1 (2026-07-10) — ADD_OWNED_ITEM: monster-drop cosmetics
    // (turtle_shell/ninja_suit), the wearable-catalog sibling of
    // ADD_OWNED_ROOM_ITEM. Same no-op-if-already-owned guard.
    case ACTIONS.ADD_OWNED_ITEM: {
      const { itemId } = action.payload
      if (!itemId || (state.ownedItems || []).includes(itemId)) return state
      return {
        ...state,
        ownedItems: [...(state.ownedItems || []), itemId],
        hasNewItem: true,
        lastSavedAt: Date.now(),
      }
    }

    // CLEAR_NEW_ITEM — dispatched when Collection.jsx mounts, same convention
    // as CLEAR_NEW_ROOM_ITEM above.
    case ACTIONS.CLEAR_NEW_ITEM:
      return state.hasNewItem ? { ...state, hasNewItem: false } : state

    // SAVE_FAVORITE_OUTFIT — snapshot the currently-equipped combo into one of
    // the 4 favorite slots (overwrites whatever was there). slotIndex 0-3.
    case ACTIONS.SAVE_FAVORITE_OUTFIT: {
      const { slotIndex } = action.payload
      if (slotIndex == null || slotIndex < 0 || slotIndex > 3) return state
      const favs = [...(state.favoriteOutfits || [null, null, null, null])]
      const eq = state.equipped || {}
      favs[slotIndex] = { head: eq.head ?? null, face: eq.face ?? null, body: eq.body ?? null, back: eq.back ?? null }
      return { ...state, favoriteOutfits: favs, lastSavedAt: Date.now() }
    }

    // WEAR_FAVORITE_OUTFIT — equip a saved favorite combo in one dispatch.
    // Defensively only wears pieces still actually owned (nothing in this
    // codebase currently allows losing an owned cosmetic, but a favorite is
    // long-lived saved data, so this guards against any future drift).
    case ACTIONS.WEAR_FAVORITE_OUTFIT: {
      const { slotIndex } = action.payload
      const fav = (state.favoriteOutfits || [])[slotIndex]
      if (!fav) return state
      const owned = state.ownedItems || []
      const next = { head: null, face: null, body: null, back: null }
      for (const slot of ['head', 'face', 'body', 'back']) {
        if (fav[slot] && owned.includes(fav[slot])) next[slot] = fav[slot]
      }
      return { ...state, equipped: next, lastSavedAt: Date.now() }
    }

    // CLEAR_FAVORITE_OUTFIT — empty one favorite slot back to null.
    case ACTIONS.CLEAR_FAVORITE_OUTFIT: {
      const { slotIndex } = action.payload
      if (slotIndex == null || slotIndex < 0 || slotIndex > 3) return state
      const favs = [...(state.favoriteOutfits || [null, null, null, null])]
      if (!favs[slotIndex]) return state
      favs[slotIndex] = null
      return { ...state, favoriteOutfits: favs, lastSavedAt: Date.now() }
    }

    // RANDOM_OUTFIT — 🎲 button: randomize each of the 4 slots among the
    // child's OWNED items for that slot (never something they don't have).
    // A slot with nothing owned is left empty rather than forced blank —
    // preserves whatever's currently there if there's genuinely nothing to
    // randomize into, so tapping 🎲 with e.g. no owned "back" items yet
    // never yanks off a piece the child does own.
    case ACTIONS.RANDOM_OUTFIT: {
      const owned = state.ownedItems || []
      const eq = state.equipped || {}
      const next = { ...eq }
      for (const slot of ['head', 'face', 'body', 'back']) {
        const pool = COSMETIC_ITEMS.filter(i => i.slot === slot && owned.includes(i.id))
        if (pool.length > 0) next[slot] = pool[Math.floor(Math.random() * pool.length)].id
      }
      return { ...state, equipped: next, lastSavedAt: Date.now() }
    }

    // REMOVE_ALL_OUTFIT — "ถอดหมด" button: clear all 4 slots at once.
    case ACTIONS.REMOVE_ALL_OUTFIT:
      return { ...state, equipped: { head: null, face: null, body: null, back: null }, lastSavedAt: Date.now() }

    // SPEC GAME-B §B.2 (2026-07-10) — Room: wallpaper/flooring are OWNED
    // separately from being APPLIED to a specific room (buy once, apply to
    // any room for free afterward) — same buy-once/place-anywhere shape as
    // ownedRoomItems/furniture placement, just room-wide instead of per-slot.
    case ACTIONS.BUY_WALLPAPER: {
      const { itemId, price } = action.payload
      if ((state.coins || 0) < price) return state
      if ((state.ownedWallpaper || []).includes(itemId)) return state
      return {
        ...state,
        coins: (state.coins || 0) - price,
        ownedWallpaper: [...(state.ownedWallpaper || []), itemId],
        lastSavedAt: Date.now(),
      }
    }
    case ACTIONS.BUY_FLOORING: {
      const { itemId, price } = action.payload
      if ((state.coins || 0) < price) return state
      if ((state.ownedFlooring || []).includes(itemId)) return state
      return {
        ...state,
        coins: (state.coins || 0) - price,
        ownedFlooring: [...(state.ownedFlooring || []), itemId],
        lastSavedAt: Date.now(),
      }
    }
    // APPLY_WALLPAPER/APPLY_FLOORING — instant apply (itemId) or clear back
    // to the theme default (itemId: null). No-op if not actually owned —
    // the UI's buy-then-apply flow already guarantees ownership first, but
    // the reducer guards too (same convention as EQUIP_ITEM).
    case ACTIONS.APPLY_WALLPAPER: {
      const { roomId, itemId } = action.payload
      if (itemId && !(state.ownedWallpaper || []).includes(itemId)) return state
      const rooms = (state.rooms || []).map(r => (r.id === roomId ? { ...r, wallpaper: itemId } : r))
      return { ...state, rooms, lastSavedAt: Date.now() }
    }
    case ACTIONS.APPLY_FLOORING: {
      const { roomId, itemId } = action.payload
      if (itemId && !(state.ownedFlooring || []).includes(itemId)) return state
      const rooms = (state.rooms || []).map(r => (r.id === roomId ? { ...r, flooring: itemId } : r))
      return { ...state, rooms, lastSavedAt: Date.now() }
    }
    // CRAFT_COZY_ITEM — the 2 craft-only wallpaper + 2 craft-only flooring
    // items (COZY_CRAFT_RECIPES, roomItems.js) use a SEPARATE recipe table
    // from CRAFT_RECIPES (§B.1's furniture+cosmetics one) since their target
    // is ownedWallpaper/ownedFlooring, not ownedRoomItems/ownedItems.
    case ACTIONS.CRAFT_COZY_ITEM: {
      const { itemId } = action.payload
      const recipe = COZY_CRAFT_RECIPES[itemId]
      if (!recipe) return state
      const ownedArr = WALLPAPER_BY_ID[itemId] ? 'ownedWallpaper' : 'ownedFlooring'
      if ((state[ownedArr] || []).includes(itemId)) return state
      const mats = state.materials || {}
      for (const k in recipe) if ((mats[k] || 0) < recipe[k]) return state
      const newMats = { ...mats }
      for (const k in recipe) newMats[k] = (newMats[k] || 0) - recipe[k]
      return {
        ...state,
        materials: newMats,
        [ownedArr]: [...(state[ownedArr] || []), itemId],
        lastSavedAt: Date.now(),
      }
    }
    // SET_ROOM_HEARTS — caches the current room's heart total, read from the
    // new Supabase room_hearts table (see supabase/migrations/20260710-b2).
    // Deliberately does NOT stamp lastSavedAt: this mirrors externally-sourced
    // server data, not local progress this device needs to sync up.
    case ACTIONS.SET_ROOM_HEARTS: {
      const { roomId, hearts } = action.payload
      return { ...state, roomHearts: { ...(state.roomHearts || {}), [roomId]: hearts } }
    }

    // ── SPEC GAME-B §B.3 (2026-07-11) — World Map ───────────────────────────────

    // MARK_SCREEN_EXPLORED — persistent per-world fog memory, unlike
    // discoveredScreens (which SET_WORLD_LEVEL resets every tier). Feeds the
    // dedicated tap-to-toggle minimap's fog-of-war.
    case ACTIONS.MARK_SCREEN_EXPLORED: {
      const { worldLevel, screenSlot } = action.payload
      if (worldLevel === undefined || !screenSlot) return state
      const wKey = String(worldLevel)
      if (state.exploredScreens?.[wKey]?.[screenSlot]) return state
      return {
        ...state,
        exploredScreens: {
          ...(state.exploredScreens || {}),
          [wKey]: { ...(state.exploredScreens?.[wKey] || {}), [screenSlot]: true },
        },
        lastSavedAt: Date.now(),
      }
    }

    // START_SIDE_QUEST — one active quest max. The quest object (template,
    // target counts, rewardMaterial) is fully built by the caller (NPC
    // dialogue flow) so this reducer stays pure/deterministic — no RNG here.
    case ACTIONS.START_SIDE_QUEST: {
      if (state.sideQuest) return state
      return { ...state, sideQuest: action.payload, lastSavedAt: Date.now() }
    }

    // UPDATE_SIDE_QUEST — merge partial progress fields (e.g. defeat count,
    // found-sparkle position) into the active quest.
    case ACTIONS.UPDATE_SIDE_QUEST: {
      if (!state.sideQuest) return state
      return { ...state, sideQuest: { ...state.sideQuest, ...action.payload }, lastSavedAt: Date.now() }
    }

    // COMPLETE_SIDE_QUEST — grants coins + food + 1 rare material (fields
    // already fixed on the quest object at START_SIDE_QUEST time), consumes
    // fetch-template materials, clears the quest slot.
    case ACTIONS.COMPLETE_SIDE_QUEST: {
      const q = state.sideQuest
      if (!q) return state
      const mats = { ...(state.materials || {}) }
      if (q.template === 'fetch' && q.material) {
        mats[q.material] = Math.max(0, (mats[q.material] || 0) - (q.amount || 0))
      }
      if (q.rewardMaterial) mats[q.rewardMaterial] = Math.min(30, (mats[q.rewardMaterial] || 0) + 1)
      return {
        ...state,
        materials: mats,
        coins: (state.coins || 0) + (q.rewardCoins || 30),
        homeItems: { ...(state.homeItems || {}), food: (state.homeItems?.food || 0) + 1 },
        sideQuest: null,
        lastSavedAt: Date.now(),
      }
    }

    // MARK_SECRET_FOUND — once-only per world. Grants the world's unique
    // themed collectible into ownedRoomItems (placeable via the normal Room
    // flow, same as any monster-drop/crafted furniture).
    case ACTIONS.MARK_SECRET_FOUND: {
      const { worldLevel, itemId } = action.payload
      if (worldLevel === undefined || !itemId) return state
      const wKey = String(worldLevel)
      if (state.secretsFound?.[wKey]) return state
      return {
        ...state,
        secretsFound: { ...(state.secretsFound || {}), [wKey]: true },
        ownedRoomItems: (state.ownedRoomItems || []).includes(itemId)
          ? state.ownedRoomItems
          : [...(state.ownedRoomItems || []), itemId],
        hasNewRoomItem: true,
        lastSavedAt: Date.now(),
      }
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
      let merged = needsMerge ? _mergeAllCreaturesIntoOne(migrated) : migrated
      // C.1 integrity guard — repair obvious corruption (bad coins/arrays/rooms)
      // before first render. The proper profile-keyed backup RESTORE happens later
      // in the async loadState() path (which knows the logged-in user id); here we
      // only have the 'guest' ring, so this is mostly the minor-repair safety net.
      merged = validateState(merged).state
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
    // SPEC GAME-A §A.2 — stage stops being purely XP-driven; it's now
    // max(xpDrivenStage, masteryDrivenStage) so mastering curriculum nodes
    // can advance it, while an account that predates the curriculum system
    // entirely (real example: Chopin's — high XP-driven stage, completely
    // empty skillMastery) is NEVER demoted. See eggEvolution.js's own
    // extensive comment on why this simple non-persisted max() is safe.
    // Reuses eggAlgorithm.js's locked stage number as ONE of the two inputs
    // (not modifying it) — same externally-overriding technique already
    // established by `sp.stage` overriding rawStats.stage just below.
    const displayStage = computeDisplayStage(sp.stage, state.skillMastery)
    const affinity = computeAffinity(state.skillMastery)
    return {
      totalXPValue: totalXP(state),
      eggProgressData: { ...sp, stage: displayStage },
      eggStatsData: { ...rawStats, stage: displayStage }, // stage overridden to the combined mastery-aware value
      affinity,
      affinityLine: AFFINITY_LINES[affinity],
      masteredCount: countMasteredNodes(state.skillMastery),
    }
  }, [state.xpThai, state.xpEng, state.xpMath, state.streak, state.acc, state.speed, state.mins, state.eggDow, state.eggMonth, state.eggDay, state.eggHour, state.firstSubject, state.name, state.grade, state.hatchedEggs, state.skillMastery]) // eslint-disable-line

  const value = useMemo(() => ({
    state,
    dispatch,
    totalXP: derived.totalXPValue,
    eggProgressData: derived.eggProgressData,
    eggStatsData: derived.eggStatsData,
    affinity: derived.affinity,
    affinityLine: derived.affinityLine,
    masteredCount: derived.masteredCount,
  }), [state, derived])

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used inside StateProvider')
  return ctx
}
