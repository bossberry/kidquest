import { supabase } from './supabase.js'
import { calcCreatureStats, GRADE_LABELS } from '../config/gameConfig.js'
import { determineElement, calcEvoStage } from './creatureSystem.js'
import { generateCreatureName } from './creatureGenerator.js'

export const KEY = 'kq_state'
export const STATE_VERSION = 1

const saveStatusListeners = new Set()
export function onSaveStatusChange(fn) {
  saveStatusListeners.add(fn)
  return () => saveStatusListeners.delete(fn)
}
function emitSaveStatus(status) {
  saveStatusListeners.forEach(fn => fn(status))
}

// ── Initial-sync gate (Fix 2) ────────────────────────────────────────────────
// Blocks saveState() from pushing anything (localStorage OR Supabase) until the
// initial loadState()/resolveSync()/INIT chain has finished. Without this, the
// `useEffect(() => saveState(state), [state])` in StateContext fires on the very
// first render and can push an empty/default state up to Supabase BEFORE the
// async cloud fetch has resolved and corrected the in-memory state — overwriting
// real cloud progress with a blank wipe.
let _initialSyncComplete = false
export function markInitialSyncComplete() { _initialSyncComplete = true }
export function isInitialSyncComplete() { return _initialSyncComplete }

// hasRealProgress — true only if a state carries progress that a player could
// actually LOSE. Intentionally restricted to fields that are NEVER written by the
// first-mount maintenance dispatches (DECAY_HAPPINESS / CHECK_DAILY_RESET /
// DAILY_LOGIN / ER_SAVE_SCORE). Those dispatches stamp lastSavedAt and can bump
// coins/happiness/login fields, so those fields are unreliable for "is this an
// untouched default?" — but creatures, XP, rounds, owned items, grade and badges
// only ever change through real gameplay. This is the maintenance-immune signal
// resolveSync() uses to close Issue D's timing gap.
export function hasRealProgress(s) {
  if (!s) return false
  if ((s.hatchedEggs?.length ?? 0) > 0) return true
  if ((s.xpThai || 0) + (s.xpEng || 0) + (s.xpMath || 0) > 0) return true
  if ((s.rounds || 0) > 0) return true
  if ((s.ownedItems?.length ?? 0) > 0) return true
  if ((s.ownedRoomItems?.length ?? 0) > 0) return true
  if ((s.grade || 0) > 0) return true
  if ((s.badges || 0) > 0) return true
  return false
}

export function defaultState() {
  return {
    name: '', grade: 0,
    stateVersion: STATE_VERSION,
    schoolGrade: null, // parent-entered actual school grade (e.g. 'ป.1') — purely informational, NEVER read by game progression logic (creature tier/stats/evolution still use `grade`, which is auto-advanced by SET_SUBJECT_LEVEL)
    gender: 'unspecified', // 'male' | 'female' | 'unspecified' — used for stats and future gendered content/item variants (not yet wired into any gating logic)
    xpThai: 0, xpEng: 0, xpMath: 0,
    streak: 0, rounds: 0, badges: 0,
    eggDow: new Date().getDay(),
    eggMonth: new Date().getMonth() + 1,
    eggDay: new Date().getDate(),
    eggHour: new Date().getHours(),
    firstSubject: -1,
    speed: 50, acc: 70, mins: 0,
    happiness: 80,
    hatched: false,
    hatchedCreature: null,
    homeItems:   { food: 2, ribbon: 0, shoes: 0, rainbow_star: 0 },
    battleItems: { scroll: 0, thunder: 0, gem: 0, mirror: 0, clover: 0 },
    activeBoosts: {},
    xpBoost: 1, xpBoostEnd: 0,
    thaiMastery: {}, thSpellLevel: 1,
    dailyRounds: 0, lastPlayDate: '',
    eggRunLives: 2, lastRunDate: '',
    memoryLives: 3, lastMemoryDate: '',
    catchLives: 3, lastCatchDate: '',
    towerLives: 3, lastTowerDate: '',
    fishingLives: 2, lastFishingDate: '',
    subjectLevels: { thai: 1, math: 1, eng: 1 },
    levelMastery: { thai: {}, math: {}, eng: {} },
    seenTeach: [],
    sessionXP: 0,
    currentWorld: 'thai',
    unlockedTiers: [0],
    defeatedBosses: [],
    battleHistory: [],
    dailyBattleRounds: 0,
    lastBattleDate: '',
    pendingChallenger: null,
    foundationComplete: false,
    shopV1: {
      bestScore: 0, runs: 0, mastered: false, stretchUnlocked: false,
      totalHints: 0, totalDuration: 0,
      phaseStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } },
    },
    sessionLog: [],
    lastHomeVisit: null,
    currentRegion: null,
    currentScreen: null,
    discoveredScreens: [],
    worldPosition: null,
    worldBattleEnemy: null,
    pendingBattle: null,
    party: [],
    partySlots: 1,
    battleCreatureId: null,
    battleWins: 0,
    worldLevel: 0,
    mazePortal: { screenId: ['NW','NE','SW','SE'][Math.floor(Math.random() * 4)], col: null, row: null },
    mazeActive: false,
    mazeCleared: false,
    bossDefeated: [],
    bossDefeatedThisTier: false,
    bossEnemyDefeated: false,
    bossRoamingScreen: null,
    bossWinsAtDefeat: 0,
    pendingEvoNotice: null,
    clearedMaps: [],
    responseTimeLogs: { thai: [], math: [], eng: [] },
    subjectSessionStreak: { thai: 0, math: 0, eng: 0 },
    subjectLevelFloor:    { thai: 1, math: 1, eng: 1 },
    pendingLevelUp: null,
    pendingRewards: [],
    inputModeMastery: { wordbuild: 0, sequence: 0 },
    coins: 0,
    lastLoginDate: '',
    loginStreak: 0,
    coinsLevelBonus: {},
    ownedItems: [],
    equipped: { head: null, face: null },
    ownedRoomItems: [],
    // Multi-room expansion (2026-07-05). `rooms` + `activeRoomId` are the SOURCE OF
    // TRUTH. `roomLayout` (below) is kept only as a strictly-derived MIRROR of the
    // active room's layout, so old code / reducers that still read state.roomLayout
    // keep working. `homeRoomId` is INDEPENDENT of `activeRoomId`: it picks which
    // room's layout+theme Home's DecoratedRoom background shows, so browsing rooms
    // in the Room editor never changes the Home backdrop.
    rooms: [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: {} }],
    activeRoomId: 'main',
    homeRoomId: 'main',
    roomLayout: {},
    // 0 means "never actually saved". Real saves always stamp Date.now() via
    // saveState(). A pristine defaultState() must be distinguishable from a real
    // recent save so resolveSync() never lets an empty new device beat real cloud
    // progress (data-loss bug, Fix 1).
    lastSavedAt: 0,
  }
}

export function _migrateBattleStats(s) {
  if (!Array.isArray(s.hatchedEggs) || !s.hatchedEggs.length) return s

  // Sort most-recent-first (by hatched_at timestamp)
  const sorted = [...s.hatchedEggs].sort((a, b) =>
    (b.hatched_at ?? 0) - (a.hatched_at ?? 0)
  )

  const now = Date.now()
  let dirty = false
  const migratedEggs = sorted.map((egg, i) => {
    let e = egg
    if (e.id === undefined) {
      e = { ...e, id: `egg_${i}_${e.hatched_at ?? i}` }
      dirty = true
    }
    const needsBattle = e.battleLevel === undefined || e.currentHP === undefined
    if (needsBattle) {
      const stats = e.stats ?? calcCreatureStats({ ...e, tier: e.tier || 0 })
      // Most recent 6 join the party; older creatures go to archive
      e = {
        ...e,
        battleLevel:   e.battleLevel   ?? 1,
        battleXP:      e.battleXP      ?? 0,
        currentHP:     e.currentHP     ?? stats.HP,
        hpUpdatedAt:   e.hpUpdatedAt   ?? now,
        inParty:       e.inParty       ?? (i < 6),
        archived:      e.archived      ?? (i >= 6),
      }
      dirty = true
    }
    // Backfill creature system fields (element, evoStage, bondMeter, born stats)
    if (e.element === undefined) {
      const el = determineElement(e.xpThai, e.xpMath, e.xpEng, e.acc, e.streak)
      const evo = calcEvoStage(e.battleLevel ?? 1, e.tier ?? 0, 0, 'baby')
      e = {
        ...e,
        element:    el,
        evoStage:   evo,
        bondMeter:  0,
        bornAtk:    e.xpThai    ?? 0,
        bornDef:    e.xpMath    ?? 0,
        bornSpd:    e.xpEng     ?? 0,
        bornCrit:   e.acc       ?? 70,
        bornDate:   e.date      ?? '',
        bornTier:   e.tier      ?? 0,
        creatureName: null,
      }
      dirty = true
    }
    // Backfill ECA relationship fields (adventuresWith, questionsAnswered, eggStartDate)
    if (e.adventuresWith === undefined) {
      e = { ...e, adventuresWith: 0, questionsAnswered: 0, eggStartDate: e.bornDate || e.date || '' }
      dirty = true
    }
    // Backfill auto-generated name for hatched eggs without a creatureName
    if (!e.creatureName && e.hatched_at) {
      const fallbackDna = e.dna ?? { family: 'puff', seed: (e.id?.length ?? 0), h1: 140 }
      e = { ...e, creatureName: generateCreatureName(fallbackDna) }
      dirty = true
    }

    // Time-based HP recovery: 1 HP per 30 seconds since last update
    if (e.hpUpdatedAt && e.hpUpdatedAt < now) {
      const stats = e.stats ?? calcCreatureStats({ ...e, tier: e.tier || 0 })
      const maxHP  = stats.HP + (e.battleLevel - 1)  // includes level bonus
      if ((e.currentHP ?? maxHP) < maxHP) {
        const recovered  = Math.floor((now - e.hpUpdatedAt) / 30000)
        const newHP      = Math.min(maxHP, (e.currentHP ?? 0) + recovered)
        if (newHP !== e.currentHP) {
          e = { ...e, currentHP: newHP, hpUpdatedAt: now }
          dirty = true
        }
      }
    }
    return e
  })

  // Validate party — always rebuild if empty or any stored ID doesn't resolve to an egg.
  // This runs independently of dirty so stale IDs after a migration never leave party empty.
  const validParty = (s.party || []).filter(id => migratedEggs.some(e => e.id === id))
  const party = validParty.length > 0
    ? validParty
    : migratedEggs.filter(e => e.inParty).map(e => e.id)

  if (!dirty && party.length === (s.party || []).length &&
      party.every((id, i) => id === (s.party || [])[i])) return s

  return {
    ...s,
    hatchedEggs: migratedEggs,
    party,
    partySlots:  s.partySlots  ?? 1,
    battleWins:  s.battleWins  ?? 0,
  }
}

export function _mergeAllCreaturesIntoOne(state) {
  const eggs = state.hatchedEggs || []

  // Re-averaging path: already merged to 1 egg with summed stats — divide by original count
  if (eggs.length === 1) {
    const egg = eggs[0]
    const count = egg.mergedFromCount || 1
    if (count <= 1) return state
    const avgHP = Math.round((egg.stats?.HP || 0) / count)
    const averaged = {
      ...egg,
      stats: {
        ...(egg.stats || {}),
        ATK: Math.round((egg.stats?.ATK || 0) / count),
        DEF: Math.round((egg.stats?.DEF || 0) / count),
        SPD: Math.round((egg.stats?.SPD || 0) / count),
        HP:  avgHP,
      },
      battleXP:   Math.round((egg.battleXP  || 0) / count),
      bondMeter:  Math.min(100, Math.round((egg.bondMeter || 0) / count)),
      currentHP:  avgHP,
    }
    return {
      ...state,
      hatchedEggs: [averaged],
      party: [averaged.id],
      battleCreatureId: null,
      pendingBattle: null,
    }
  }

  if (eggs.length < 2) return state

  // Fresh merge path: multiple eggs → compute averages
  const count = eggs.length
  const avgATK = Math.round(eggs.reduce((sum, e) => sum + (e.stats?.ATK || 0), 0) / count)
  const avgDEF = Math.round(eggs.reduce((sum, e) => sum + (e.stats?.DEF || 0), 0) / count)
  const avgSPD = Math.round(eggs.reduce((sum, e) => sum + (e.stats?.SPD || 0), 0) / count)
  const avgHP  = Math.round(eggs.reduce((sum, e) => sum + (e.stats?.HP  || 0), 0) / count)
  const avgBattleXP = Math.round(eggs.reduce((sum, e) => sum + (e.battleXP || 0), 0) / count)
  const avgBond = Math.min(100, Math.round(eggs.reduce((sum, e) => sum + (e.bondMeter || 0), 0) / count))
  const maxLevel = Math.max(...eggs.map(e => e.battleLevel || 1))

  const base = [...eggs].sort((a, b) => (b.hatched_at || 0) - (a.hatched_at || 0))[0]

  const merged = {
    ...base,
    stats: {
      ...(base.stats || {}),
      ATK: avgATK,
      DEF: avgDEF,
      SPD: avgSPD,
      HP:  avgHP,
    },
    battleXP: avgBattleXP,
    battleLevel: maxLevel,
    bondMeter: avgBond,
    currentHP: avgHP,
    inParty: true,
    mergedFromCount: count,
  }

  return {
    ...state,
    hatchedEggs: [merged],
    party: [merged.id],
    battleCreatureId: null,
    pendingBattle: null,
  }
}

/**
 * resolveSync — single source of truth for deciding whether local or remote
 * state should win when both exist. Used by both the initial-load path and
 * the SIGNED_IN auth-change path.
 */
export function resolveSync(local, remote) {
  const hasLocalCreatures = (local?.hatchedEggs?.length ?? 0) > 0
  const hasRemoteCreatures = (remote?.hatchedEggs?.length ?? 0) > 0

  if (hasRemoteCreatures && !hasLocalCreatures) {
    return { winner: remote, remoteWon: true, reason: 'remote has creatures, local is empty' }
  }

  const remoteTime = remote?.lastSavedAt ?? 0
  const localTime = local?.lastSavedAt ?? 0

  // Fix 3a — local was never actually saved (lastSavedAt 0) but remote holds a
  // real save. A pristine defaultState() (Fix 1) reports 0 here, so this catches
  // a brand-new device whose local timestamp has NOT been inflated by a
  // maintenance dispatch. (On the mount path a maintenance dispatch usually
  // stamps `now` before this runs, so this branch is a cheap safety net for other
  // callers such as the SIGNED_IN listener; the field-based check below is what
  // actually protects the mount path.)
  if (localTime === 0 && remoteTime > 0) {
    return { winner: remote, remoteWon: true, reason: 'local never saved (lastSavedAt 0), remote has a real save' }
  }

  // Fix 3b — remote holds real, losable progress while local is an untouched
  // default. This is the maintenance-IMMUNE guard: first-mount dispatches
  // (DECAY_HAPPINESS / CHECK_DAILY_RESET / DAILY_LOGIN / ER_SAVE_SCORE) inflate
  // lastSavedAt and can add daily-login coins, which would silently defeat any
  // purely timestamp-based check (Issue D). hasRealProgress() ignores every field
  // those dispatches touch, so an empty new device is still recognised as empty
  // even after they run — and real remote progress correctly wins. When local DOES
  // have real progress this branch never fires, so the intentional DAILY_LOGIN
  // timestamp bump (which lets same-device daily coins win the fallback below) is
  // preserved and this fix introduces no regression.
  if (hasRealProgress(remote) && !hasRealProgress(local)) {
    return { winner: remote, remoteWon: true, reason: 'remote has real progress, local is an untouched default' }
  }

  const remoteWon = (remoteTime > 0 || localTime > 0)
    ? remoteTime >= localTime
    : (remote?.rounds || 0) >= (local?.rounds || 0)

  return {
    winner: remoteWon ? remote : local,
    remoteWon,
    reason: remoteWon
      ? `remote savedAt ${new Date(remoteTime).toISOString()} >= local ${new Date(localTime).toISOString()}`
      : `local savedAt ${new Date(localTime).toISOString()} > remote ${new Date(remoteTime).toISOString()}`,
  }
}

/**
 * migrateStateShape — ensures an old/incomplete saved state has every field
 * defaultState() defines, including nested object fields merged key-by-key.
 * Prevents new sub-keys inside existing objects from silently going missing
 * on old saves that were written before those keys existed.
 */
export function migrateStateShape(saved) {
  if (!saved) return defaultState()
  const base = defaultState()
  const merged = { ...base, ...saved }

  const nestedObjectFields = [
    'homeItems', 'battleItems', 'activeBoosts', 'thaiMastery',
    'subjectLevels', 'levelMastery', 'shopV1', 'responseTimeLogs',
    'subjectSessionStreak', 'subjectLevelFloor', 'inputModeMastery',
    'mazePortal',
  ]
  for (const field of nestedObjectFields) {
    if (base[field] && typeof base[field] === 'object' && !Array.isArray(base[field])) {
      merged[field] = { ...base[field], ...(saved[field] || {}) }
    }
  }

  // roomLayout schema migration (2026-07-02, iso room):
  // The OLD flat-grid room stored numeric-string slot keys ("0".."11"). The NEW
  // iso room uses "{zone}_{a}_{b}" keys and cannot be mapped 1:1, so a stale flat
  // layout is reset to {}. NEW-format keys and empty {} pass through untouched.
  // IMPORTANT: ownedRoomItems is NEVER modified here — every purchase must persist.
  const rl = saved.roomLayout
  if (rl && typeof rl === 'object' && !Array.isArray(rl)) {
    const keys = Object.keys(rl)
    if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
      merged.roomLayout = {}
      // Stamp lastSavedAt so a stale cloud copy can't revert the reset via resolveSync.
      merged.lastSavedAt = Date.now()
    }
  }

  // Multi-room migration (2026-07-05): if a save predates `rooms`, build the single
  // starter room from whatever roomLayout resolves to AFTER the reset above (so a
  // stale pre-iso layout stays {} in rooms[0].layout too, never resurrected). If
  // `rooms` already exists, leave it and its per-room layouts untouched. Keep the
  // top-level roomLayout mirror in sync with the active room on the way out.
  if (!Array.isArray(saved.rooms)) {
    merged.rooms = [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: merged.roomLayout || {} }]
    merged.activeRoomId = 'main'
    merged.homeRoomId = 'main'
    merged.lastSavedAt = merged.lastSavedAt || Date.now()
  } else {
    merged.rooms = saved.rooms
    merged.activeRoomId = saved.activeRoomId || saved.rooms[0]?.id || 'main'
    merged.homeRoomId = saved.homeRoomId || saved.rooms[0]?.id || 'main'
    const active = merged.rooms.find(r => r.id === merged.activeRoomId)
    merged.roomLayout = active?.layout || {}
  }

  merged.stateVersion = STATE_VERSION
  return merged
}

function _migrateEggs(s) {
  if (!Array.isArray(s.hatchedEggs) || !s.hatchedEggs.length) return s
  let dirty = false
  const hatchedEggs = s.hatchedEggs.map(egg => {
    let e = egg
    if (e.tier === undefined || e.tier === null) {
      const idx = GRADE_LABELS.indexOf(e.grade || 'อนุบาล')
      e = { ...e, tier: Math.min(5, idx >= 0 ? idx : 0) }
      dirty = true
    }
    const needsRecalc = !e.stats ||
      isNaN(e.stats.ATK) || e.stats.ATK === 0 ||
      isNaN(e.stats.DEF) || e.stats.DEF === 0 ||
      isNaN(e.stats.SPD) || e.stats.SPD === 0
    if (needsRecalc) {
      e = { ...e, streak: e.streak || 0, acc: e.acc || 70,
               stats: calcCreatureStats({ ...e, tier: e.tier || 0 }) }
      dirty = true
    }
    return e
  })
  return dirty ? { ...s, hatchedEggs } : s
}

export async function loadState() {
  console.log('[KQ:load] start')
  try {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('[KQ:load] user =', user.email)
        const { data, error } = await supabase
          .from('eggs')
          .select('state_json')
          .eq('user_id', user.id)
          .single()
        if (data?.state_json) {
          console.log('[KQ:load] cloud has data → using cloud')
          let migrated = migrateStateShape(data.state_json)
          migrated = _migrateEggs(migrated)
          migrated = _migrateBattleStats(migrated)
          if (migrated !== data.state_json) {
            console.log('[KQ:load] migrating cloud state shape/eggs')
            syncToSupabase(migrated)
          }
          localStorage.setItem(KEY, JSON.stringify(migrated))
          return migrated
        }
        console.log('[KQ:load] cloud empty (error:', error?.code, ') → using localStorage')
      } else {
        console.log('[KQ:load] no user → using localStorage')
      }
    }
  } catch (e) {
    console.log('[KQ:load] failed:', e.message)
  }
  let s
  try {
    s = JSON.parse(localStorage.getItem(KEY)) || defaultState()
    console.log('[KQ:load] localStorage xpThai =', s.xpThai)
  } catch (e) {
    s = defaultState()
  }
  let migrated = migrateStateShape(s)
  migrated = _migrateEggs(migrated)
  migrated = _migrateBattleStats(migrated)
  if (migrated !== s) {
    console.log('[KQ:load] migrated', s.hatchedEggs?.length, 'eggs → saving')
    localStorage.setItem(KEY, JSON.stringify(migrated))
    syncToSupabase(migrated)
  }
  return migrated
}

// Push any state object to Supabase (used by StateContext on SIGNED_IN)
export async function syncToSupabase(s, { notify = false } = {}) {
  // Fix 4 (defense-in-depth) — never upsert a blank, never-saved snapshot on top
  // of real cloud data. This lives in syncToSupabase() (not just saveState()) so
  // it also protects the direct callers that bypass saveState(): loadState()'s
  // migration re-push and the SIGNED_IN auth listener. A state that carries no
  // real progress AND was never stamped (lastSavedAt falsy/0) has nothing worth
  // persisting and could only wipe a good remote row, so refuse it.
  // NOTE: saveState() re-stamps lastSavedAt to Date.now() before calling here, so
  // this never blocks a legitimate save routed through saveState(); it only guards
  // the un-restamped objects the direct callers pass.
  if (!(s?.lastSavedAt > 0) && !hasRealProgress(s)) {
    console.log('[KQ:sync] skipped — blank/never-saved state, refusing to overwrite cloud')
    return
  }
  try {
    if (!supabase) { console.log('[KQ:sync] no client'); if (notify) emitSaveStatus('offline'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.log('[KQ:sync] no user'); if (notify) emitSaveStatus('offline'); return }
    console.log('[KQ:sync] pushing state for', user.email, '— xpThai:', s.xpThai, 'rounds:', s.rounds)
    const { error } = await supabase.from('eggs').upsert({
      user_id: user.id,
      child_name: s.name || 'โชแปง',
      state_json: s,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) { console.log('[KQ:sync] upsert error:', error.message); if (notify) emitSaveStatus('error') }
    else { console.log('[KQ:sync] ✓ done'); if (notify) emitSaveStatus('saved') }
  } catch (e) {
    console.log('[KQ:sync] failed:', e.message)
    if (notify) emitSaveStatus('error')
  }
}

export function saveState(s, { notify = false } = {}) {
  // Fix 2 — do not persist anything until the initial load/sync has resolved.
  // Prevents the first-render `saveState(state)` (and the maintenance dispatches
  // that follow it) from racing ahead of loadState() and pushing an empty default
  // to Supabase before resolveSync() has had a chance to pull the real cloud row.
  if (!_initialSyncComplete) return
  // Fix 4 — guard the ORIGINAL input (before the re-stamp below). If the caller
  // handed us a state that was never really saved (lastSavedAt falsy/0) AND holds
  // no real progress, refuse rather than stamp+persist a blank wipe. Checking the
  // re-stamped copy would make this dead code since we always stamp Date.now().
  if (!(s?.lastSavedAt > 0) && !hasRealProgress(s)) return
  const withTimestamp = { ...s, lastSavedAt: Date.now() }
  localStorage.setItem(KEY, JSON.stringify(withTimestamp))
  if (notify) emitSaveStatus('saving')
  syncToSupabase(withTimestamp, { notify })
}
