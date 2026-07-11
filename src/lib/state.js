import { supabase } from './supabase.js'
import { calcCreatureStats, GRADE_LABELS } from '../config/gameConfig.js'
import { determineElement, calcEvoStage } from './creatureSystem.js'
import { generateCreatureName } from './creatureGenerator.js'
import { SUBJECTS, getFirstNodeId } from './curriculum.js'
import { defaultEggCare } from './eggCare.js'

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
  // Extra losable-progress signals (C.1, 2026-07-09). All of these are only ever
  // written by real gameplay — NEVER by the first-mount maintenance dispatches
  // (DECAY_HAPPINESS / CHECK_DAILY_RESET / DAILY_LOGIN / ER_SAVE_SCORE) — so they
  // stay safe to use as the maintenance-immune "is this a real save?" signal.
  if ((s.rooms?.length ?? 0) > 1) return true                 // bought a room block (1000 coins each)
  if ((s.craftedItems?.length ?? 0) > 0) return true          // crafted furniture
  if (s.equipped && (s.equipped.head || s.equipped.face || s.equipped.body || s.equipped.back)) return true
  // SPEC GAME-B §B.1 (2026-07-10). A saved favorite-outfit slot is a real,
  // deliberate wardrobe choice the child made — same category as owned
  // items/equipped above, not a fluctuating gauge.
  if ((s.favoriteOutfits || []).some(f => f)) return true
  if (s.materials && Object.values(s.materials).some(v => (v || 0) > 0)) return true
  // Phase 1.1 curriculum system (2026-07-09). Same maintenance-immunity rule as
  // everything else here: skillMastery is ONLY ever written by RECORD_ANSWER (a
  // real battle answer), and activeNodes only ever advances off a real mastery
  // event — neither is touched by the first-mount maintenance dispatches, so both
  // are safe, losable-progress signals for this check.
  if (s.skillMastery && Object.values(s.skillMastery).some(m => (m?.attempts?.length ?? 0) > 0 || m?.mastered)) return true
  if (s.activeNodes && SUBJECTS.some(subj => s.activeNodes[subj] && s.activeNodes[subj] !== getFirstNodeId(subj))) return true
  // Phase 1.2 placement test (2026-07-09). Completing placement is a real,
  // deliberate one-time flow — only ever set true by COMPLETE_PLACEMENT, never
  // by a maintenance dispatch, so it's safe here. Protects against a sync race
  // silently resetting placementDone to false and forcing the placement quest
  // to inappropriately reappear for a child who already completed it.
  if (s.placementDone === true) return true
  // Phase 1.3 teaching moments (2026-07-09). pendingTeaching is a real,
  // meaningful in-progress signal (a genuine intervention currently queued to
  // show before the next battle question) — losing it to a sync race would
  // silently drop the intervention without ever showing it. Only ever set by
  // RECORD_ANSWER-equivalent logic (real battle misses), never a maintenance
  // dispatch. missStreaks itself is deliberately NOT included here — a lone
  // miss-streak counter reset by a stale sync is harmless (worst case the
  // child just needs a few fresh misses to re-trigger), unlike the fields
  // above which represent real, hard-won progress.
  if (s.pendingTeaching) return true
  // SPEC GAME-A §A.1 Care Loop (2026-07-09). Only the one-shot UI events are
  // protected here — same reasoning as pendingTeaching just above: a queued
  // wake-up gift or comeback-joy scene that gets silently wiped by a stale
  // sync mid-flight would just never be shown to the child, exactly like a
  // lost teaching moment. hunger/energy/happiness are deliberately NOT
  // included — they're fluctuating gauges recomputed from lastCareTick on
  // every load, not earned/losable progress (same category as happiness/acc/
  // speed at the top level, which aren't protected either). foodInventory is
  // similarly left unprotected: it's a small-stakes consumable count that
  // already ships with a non-empty starting kit in defaultEggCare(), so
  // there's no clean "is this real progress" line to draw the way there is
  // for e.g. ownedRoomItems — a stale-sync food-count revert is a minor,
  // low-stakes inconvenience, not a meaningful loss on the scale of the
  // fields already protected above.
  if (s.eggCare?.pendingWakeUp || s.eggCare?.pendingComebackJoy) return true
  // SPEC GAME-A §A.2 Evolution × Education (2026-07-09). Unlike eggCare's
  // fluctuating meters above, a minted evolutionAlbum entry IS genuine,
  // hard-won, permanent progress — a real stage transition the child earned,
  // exactly the same category as hatchedEggs/ownedRoomItems above. Also
  // protects the one-shot pendingEvolutionCeremony event (same reasoning as
  // pendingTeaching/pendingWakeUp) so a queued ceremony can't be silently
  // dropped by a stale sync mid-flight.
  if ((s.evolutionAlbum?.length ?? 0) > 0) return true
  if (s.pendingEvolutionCeremony) return true
  // SPEC GAME-B §B.2 (2026-07-10). A room's wallpaper/flooring choice is a
  // real, deliberate decoration purchase — same category as ownedRoomItems/
  // equipped above, not a fluctuating gauge.
  if (Array.isArray(s.rooms) && s.rooms.some(r => r?.wallpaper || r?.flooring)) return true
  if ((s.ownedWallpaper?.length ?? 0) > 0) return true
  if ((s.ownedFlooring?.length ?? 0) > 0) return true
  // SPEC GAME-B §B.3 (2026-07-11). exploredScreens is persistent per-world
  // fog-of-war the child earned by actually walking there (unlike
  // discoveredScreens, which resets on every world-level change) — real,
  // losable progress in the same category as clearedMaps/rooms above.
  // secretsFound is a genuine one-time discovery (hidden-passage glade +
  // unique collectible), same category as evolutionAlbum entries. sideQuest
  // is a queued in-progress event — same reasoning as pendingTeaching/
  // pendingWakeUp: a stale sync silently dropping it mid-flight would lose
  // real quest progress the child made (materials gathered, enemies
  // defeated) without ever showing the completion.
  if (Object.values(s.exploredScreens || {}).some(w => w && Object.values(w).some(Boolean))) return true
  if (Object.values(s.secretsFound || {}).some(Boolean)) return true
  if (s.sideQuest) return true
  return false
}

// ── Local rolling backup ring (C.1, 2026-07-09) ──────────────────────────────
// Every successful save also writes a per-profile ring of the last 3 real states
// (+timestamps) to localStorage under `kq_backup_{profileId}`. validateState()
// restores from this ring when it detects CRITICAL loss (e.g. rooms wiped) on a
// state that has no real progress. This is a purely local safety net — server-side
// backups are Phase 5.3 and explicitly out of scope here.
export const BACKUP_PREFIX = 'kq_backup_'
const MAX_BACKUPS = 3

// Cached current profile id, so the synchronous saveState() can key backups per
// account without an async auth lookup on every save. Updated whenever we resolve
// a Supabase user (loadState / syncToSupabase). Falls back to 'guest' for the
// logged-out / localStorage-only path.
let _currentProfileId = 'guest'
export function setCurrentProfileId(id) { if (id) _currentProfileId = id }
export function getCurrentProfileId() { return _currentProfileId }

export function readBackups(profileId = _currentProfileId) {
  try {
    const raw = localStorage.getItem(BACKUP_PREFIX + (profileId || 'guest'))
    const ring = raw ? JSON.parse(raw) : []
    return Array.isArray(ring) ? ring : []
  } catch { return [] }
}

export function writeBackup(state, profileId = _currentProfileId) {
  // Only ring real saves — a blank/default state is worthless as a restore point
  // and would only dilute the ring (or worse, become a "restore" target itself).
  if (!hasRealProgress(state)) return
  try {
    const key = BACKUP_PREFIX + (profileId || 'guest')
    const ring = readBackups(profileId)
    ring.push({ ts: Date.now(), state })
    while (ring.length > MAX_BACKUPS) ring.shift()
    localStorage.setItem(key, JSON.stringify(ring))
  } catch { /* localStorage full / unavailable — non-fatal */ }
}

// Most-recent backup that actually carries real progress (the only useful kind).
export function latestGoodBackup(profileId = _currentProfileId) {
  return readBackups(profileId)
    .filter(b => b && b.state && hasRealProgress(b.state))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0] || null
}

/**
 * validateState — schema-check + repair a state object before it becomes the live
 * app state. Two tiers:
 *   1. MINOR repair (always): coerce clearly-broken critical fields back to sane
 *      defaults (coins → finite number ≥0, ownedRoomItems/ownedItems/party → arrays,
 *      rooms → non-empty array containing a 'main', equipped/materials/homeItems/
 *      battleItems → objects, etc). Never throws; a totally garbage input yields a
 *      clean defaultState().
 *   2. CRITICAL restore: if after repair the state still carries NO real progress
 *      but a local backup for this profile DOES, restore from that backup (covers
 *      "rooms/items wiped but backup has data"). Also fires when rooms is missing/
 *      empty even if some other progress survived.
 * Returns { state, repaired, restored } so callers can log/telemetry the outcome.
 */
export function validateState(state, profileId = _currentProfileId) {
  const base = defaultState()
  let repaired = false
  let restored = false

  let s = (state && typeof state === 'object' && !Array.isArray(state)) ? { ...state } : null
  if (!s) {
    // Whole object is missing/garbage — try a backup before falling back to blank.
    const good = latestGoodBackup(profileId)
    if (good) return { state: migrateStateShape(good.state), repaired: true, restored: true }
    return { state: base, repaired: true, restored: false }
  }

  // ── Minor field repairs ────────────────────────────────────────────────────
  if (typeof s.coins !== 'number' || !isFinite(s.coins) || s.coins < 0) {
    s.coins = (typeof s.coins === 'number' && isFinite(s.coins)) ? Math.max(0, s.coins) : 0
    repaired = true
  }
  const arrayFields = ['ownedItems', 'ownedRoomItems', 'craftedItems', 'party', 'hatchedEggs',
                       'seenTeach', 'discoveredScreens', 'clearedMaps', 'battleHistory', 'sessionLog',
                       'evolutionAlbum', 'favoriteOutfits', 'ownedWallpaper', 'ownedFlooring']
  for (const f of arrayFields) {
    if (!Array.isArray(s[f])) { s[f] = Array.isArray(base[f]) ? [...base[f]] : []; repaired = true }
  }
  const objectFields = ['homeItems', 'battleItems', 'activeBoosts', 'equipped', 'materials',
                        'subjectLevels', 'levelMastery', 'thaiMastery', 'responseTimeLogs',
                        'skillMastery', 'activeNodes', 'missStreaks', 'roomHearts',
                        'exploredScreens', 'secretsFound']
  for (const f of objectFields) {
    if (!s[f] || typeof s[f] !== 'object' || Array.isArray(s[f])) {
      s[f] = (base[f] && typeof base[f] === 'object') ? { ...base[f] } : {}
      repaired = true
    }
  }
  if (!s.equipped || typeof s.equipped !== 'object') {
    s.equipped = { head: null, face: null, body: null, back: null }
    repaired = true
  } else {
    if (!('head' in s.equipped)) { s.equipped.head = null; repaired = true }
    if (!('face' in s.equipped)) { s.equipped.face = null; repaired = true }
    // SPEC GAME-B §B.1 (2026-07-10) — new slots
    if (!('body' in s.equipped)) { s.equipped.body = null; repaired = true }
    if (!('back' in s.equipped)) { s.equipped.back = null; repaired = true }
  }

  // placementDone/placementResults — NOT handled by the generic objectFields
  // loop above, because `null` is a legitimate, meaningful value for
  // placementResults (placement not yet completed) that must never be
  // coerced to `{}`. Only reset on genuinely wrong-typed garbage.
  if (typeof s.placementDone !== 'boolean') { s.placementDone = false; repaired = true }
  if (s.placementResults !== null && (typeof s.placementResults !== 'object' || Array.isArray(s.placementResults))) {
    s.placementResults = null
    repaired = true
  }

  // pendingTeaching — same null-is-legitimate care as placementResults above
  // (missStreaks itself IS in the generic objectFields loop, since {} is
  // always a valid value for it — no null case to protect there).
  if (s.pendingTeaching !== null && (typeof s.pendingTeaching !== 'object' || Array.isArray(s.pendingTeaching))) {
    s.pendingTeaching = null
    repaired = true
  }
  if (s.pendingEvolutionCeremony !== null && (typeof s.pendingEvolutionCeremony !== 'object' || Array.isArray(s.pendingEvolutionCeremony))) {
    s.pendingEvolutionCeremony = null
    repaired = true
  }

  // SPEC GAME-B §B.3 (2026-07-11) — sideQuest is null-legitimate (no active
  // quest), same care as pendingTeaching/pendingEvolutionCeremony above.
  if (s.sideQuest !== null && (typeof s.sideQuest !== 'object' || Array.isArray(s.sideQuest))) {
    s.sideQuest = null
    repaired = true
  }

  // eggCare — nested structure with its own null-legitimate one-shot fields
  // (pendingWakeUp/pendingComebackJoy), so handled with dedicated repair
  // logic rather than the generic objectFields loop above (same reasoning as
  // placementResults/pendingTeaching: a generic loop would wrongly coerce a
  // legitimate null into {}).
  if (!s.eggCare || typeof s.eggCare !== 'object' || Array.isArray(s.eggCare)) {
    s.eggCare = defaultEggCare()
    repaired = true
  } else {
    const base = defaultEggCare()
    const ec = s.eggCare
    for (const f of ['hunger', 'energy', 'happiness', 'touchHappinessToday']) {
      if (typeof ec[f] !== 'number' || !isFinite(ec[f]) || ec[f] < 0) { ec[f] = base[f]; repaired = true }
    }
    ec.hunger = Math.min(100, ec.hunger)
    ec.energy = Math.min(100, ec.energy)
    ec.happiness = Math.min(100, ec.happiness)
    if (typeof ec.lastCareTick !== 'number' || !isFinite(ec.lastCareTick) || ec.lastCareTick < 0) { ec.lastCareTick = 0; repaired = true }
    if (typeof ec.lastSleptDate !== 'string') { ec.lastSleptDate = ''; repaired = true }
    if (typeof ec.lastTouchDate !== 'string') { ec.lastTouchDate = ''; repaired = true }
    if (!ec.foodInventory || typeof ec.foodInventory !== 'object' || Array.isArray(ec.foodInventory)) {
      ec.foodInventory = { ...base.foodInventory }
      repaired = true
    } else {
      for (const key of Object.keys(base.foodInventory)) {
        if (typeof ec.foodInventory[key] !== 'number' || !isFinite(ec.foodInventory[key]) || ec.foodInventory[key] < 0) {
          ec.foodInventory[key] = base.foodInventory[key]
          repaired = true
        }
      }
    }
    if (ec.pendingWakeUp !== null && (typeof ec.pendingWakeUp !== 'object' || Array.isArray(ec.pendingWakeUp))) {
      ec.pendingWakeUp = null
      repaired = true
    }
    if (ec.pendingComebackJoy !== null && ec.pendingComebackJoy !== true) {
      ec.pendingComebackJoy = null
      repaired = true
    }
  }

  // ── rooms integrity — the highest-value critical field ─────────────────────
  const roomsBad = !Array.isArray(s.rooms) || s.rooms.length === 0 ||
                   !s.rooms.some(r => r && typeof r === 'object' && r.id)
  if (roomsBad) {
    const good = latestGoodBackup(profileId)
    if (good && Array.isArray(good.state.rooms) && good.state.rooms.length > 0) {
      return { state: migrateStateShape(good.state), repaired: true, restored: true }
    }
    // No backup — rebuild a valid single room from whatever layout survived.
    s.rooms = [{ id: 'main', theme: 'default', gridX: 0, gridY: 0,
                 layout: (s.roomLayout && typeof s.roomLayout === 'object' && !Array.isArray(s.roomLayout)) ? s.roomLayout : {} }]
    s.activeRoomId = 'main'
    s.homeRoomId = 'main'
    repaired = true
  }
  // Ensure activeRoomId/homeRoomId point at a real room.
  if (Array.isArray(s.rooms) && s.rooms.length > 0) {
    if (!s.rooms.some(r => r.id === s.activeRoomId)) { s.activeRoomId = s.rooms[0].id; repaired = true }
    if (!s.rooms.some(r => r.id === s.homeRoomId)) { s.homeRoomId = s.rooms[0].id; repaired = true }
  }
  // SPEC GAME-B §B.2 (2026-07-10) — wallpaper/flooring: backfill missing keys
  // to null (= "use the theme's own base fill") and reset any wrongly-typed
  // value, same light-touch level as the room-shape checks above (this
  // system doesn't deep-validate theme/gridX/gridY either). This single pass
  // covers every older room-spawn site that predates these 2 fields, so they
  // don't each need updating individually.
  if (Array.isArray(s.rooms)) {
    for (const r of s.rooms) {
      if (!r || typeof r !== 'object') continue
      if (r.wallpaper !== null && r.wallpaper !== undefined && typeof r.wallpaper !== 'string') { r.wallpaper = null; repaired = true }
      else if (r.wallpaper === undefined) { r.wallpaper = null }
      if (r.flooring !== null && r.flooring !== undefined && typeof r.flooring !== 'string') { r.flooring = null; repaired = true }
      else if (r.flooring === undefined) { r.flooring = null }
    }
  }

  // ── Critical restore: repaired state is indistinguishable from a fresh wipe,
  // but a backup for this profile still holds real progress. Prefer the backup.
  if (!hasRealProgress(s)) {
    const good = latestGoodBackup(profileId)
    if (good) return { state: migrateStateShape(good.state), repaired: true, restored: true }
  }

  return { state: s, repaired, restored }
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
    // Phase 1.4 speaking/reading-aloud minigame ("อ่านให้ไข่ฟัง", 2026-07-09) —
    // same daily-lives convention as the other 5 minigames above.
    readAloudLives: 3, lastReadAloudDate: '',
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
    equipped: { head: null, face: null, body: null, back: null },
    // SPEC GAME-B §B.1 (2026-07-10) — 4 save-a-combo slots, each null or a
    // snapshot { head, face, body, back }. hasNewItem drives the "ของใหม่!"
    // bubble on BottomNav's แต่งตัว tab (cosmetic drop/craft), cleared when
    // Collection.jsx mounts — same convention as hasNewRoomItem below.
    favoriteOutfits: [null, null, null, null],
    hasNewItem: false,
    ownedRoomItems: [],
    // Room items — two acquisition paths (2026-07-07 simplified replacement of
    // the earlier workbench+20/day-collect-button system): monster drops
    // (30% chance on a real battle win, ADD_OWNED_ROOM_ITEM) and instant
    // crafting from materials auto-collected while walking the world map
    // (15% chance per tile, CRAFT_ITEM). `craftedItems` is a provenance list
    // (distinct from bought/dropped furniture) for the "มีแล้ว" badge.
    // dailyMaterialsCollected/lastMaterialDate cap auto-collection at 15/day
    // (todayStr() reset, same convention as minigame lives).
    materials: { flower: 0, wood: 0, stone: 0, water: 0, stardust: 0, mushroom: 0, crystal: 0 },
    craftedItems: [],
    dailyMaterialsCollected: 0,
    lastMaterialDate: '',
    // Set true whenever ADD_OWNED_ROOM_ITEM/CRAFT_ITEM adds something new;
    // drives the "✨ ของใหม่!" bubble on BottomNav's ห้อง tab, cleared when
    // Room.jsx mounts.
    hasNewRoomItem: false,
    // Multi-room expansion (2026-07-05). `rooms` + `activeRoomId` are the SOURCE OF
    // TRUTH. `roomLayout` (below) is kept only as a strictly-derived MIRROR of the
    // active room's layout, so old code / reducers that still read state.roomLayout
    // keep working. `homeRoomId` is INDEPENDENT of `activeRoomId`: it picks which
    // room's layout+theme Home's DecoratedRoom background shows, so browsing rooms
    // in the Room editor never changes the Home backdrop.
    // SPEC GAME-B §B.2 (2026-07-10) — wallpaper/flooring: item ids applying
    // to the WHOLE room (not one furniture slot); null = theme default.
    rooms: [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: {}, wallpaper: null, flooring: null }],
    // Owned separately from being applied to any one room (buy once, apply
    // to any room for free) — same shape as ownedRoomItems/ownedItems.
    ownedWallpaper: [],
    ownedFlooring: [],
    // Local read-cache of room_hearts totals (server-side table, see the new
    // Supabase migration) keyed by room id — NOT authoritative, just what
    // this device last fetched for display; never written to directly by
    // gameplay, only by SET_ROOM_HEARTS after a fetch/like_room response.
    roomHearts: {},
    activeRoomId: 'main',
    homeRoomId: 'main',
    roomLayout: {},
    // Phase 1.1 curriculum system (2026-07-09). skillMastery: { [nodeId]: { attempts,
    // ema, mastered, masteredAt } }, keyed dynamically by node id — NOT a fixed-subkey
    // object, so it does NOT go in migrateStateShape()'s nestedObjectFields merge list
    // (that pattern is for objects like homeItems with known, stable sub-keys). Old
    // saves get activeNodes defaulted to each subject's first curriculum node in
    // migrateStateShape() below. pendingNodeMastery mirrors the existing
    // pendingEvoNotice/pendingLevelUp one-shot-UI-event convention.
    skillMastery: {},
    activeNodes: {},
    pendingNodeMastery: null,
    // Phase 1.2 placement test ("ด่านทดสอบพลัง", 2026-07-09). placementResults is
    // null until COMPLETE_PLACEMENT fires, then { thai, math, eng, completedAt }.
    // A brand-new save (this literal object) always gets placementDone:false —
    // new players SHOULD see the placement flow. Existing saves that predate
    // this field get an explicit skip-rule computation in migrateStateShape()
    // below instead (never just inherit this false via the shallow merge).
    placementDone: false,
    placementResults: null,
    // Phase 1.3 teaching moments (2026-07-09). missStreaks: { "{nodeId}:{questionType}":
    // count }, tracked per real (non-preview) battle answer, reset to 0 on a
    // correct answer or when a teaching moment clears. pendingTeaching: null until
    // a node+type streak hits 3, then { nodeId, questionType } (one-shot event,
    // same convention as pendingNodeMastery/pendingEvoNotice).
    missStreaks: {},
    pendingTeaching: null,
    // SPEC GAME-A §A.1 Care Loop (2026-07-09, "อ่านให้ไข่ฟัง"'s sibling system —
    // hunger/energy/happiness, feeding, touch play, sleep). See src/lib/eggCare.js
    // for the full field-by-field documentation; lastCareTick:0 (like
    // lastSavedAt below) marks "never actually ticked" so the first real
    // TICK_CARE dispatch computes elapsed time from account creation rather
    // than a huge bogus gap from epoch.
    eggCare: defaultEggCare(),
    // SPEC GAME-A §A.2 Evolution × Education (2026-07-09). evolutionAlbum
    // entries are minted by the RECORD_EVOLUTION reducer (StateContext.jsx)
    // whenever the combined display stage (see src/lib/eggEvolution.js's
    // computeDisplayStage — max of the pre-existing XP-driven stage and the
    // new mastery-driven one, so existing accounts are never demoted)
    // increases: { stage, date, affinity, masteredCount, snapshot }.
    // pendingEvolutionCeremony is a one-shot UI event (same convention as
    // pendingNodeMastery/pendingTeaching/pendingWakeUp) consumed by
    // EvolutionScene.jsx, superseding the older lightweight stage-up banner.
    evolutionAlbum: [],
    pendingEvolutionCeremony: null,
    // SPEC GAME-B §B.3 (2026-07-11) — World Map. exploredScreens: persistent
    // per-world fog-of-war memory, { [worldLevel]: { NW: true, NE: true, ... } }
    // — deliberately SEPARATE from discoveredScreens (which resets every
    // SET_WORLD_LEVEL, see StateContext.jsx), keyed dynamically by worldLevel
    // like skillMastery so it's not in migrateStateShape()'s fixed-subkey
    // nestedObjectFields merge list. sideQuest: null | { npcId, template,
    // screenId, worldLevel, ...templateFields, progress }, one active max.
    // secretsFound: { [worldLevel]: true } — once-only hidden-glade reward.
    exploredScreens: {},
    sideQuest: null,
    secretsFound: {},
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

  // Rooms — same idea as the creatures check above. `rooms` always carries at
  // least the default 'main' entry (see defaultState()), and each additional
  // room cost real coins (1000 each) to buy, so a higher count is real,
  // losable progress. Whichever side has strictly more rooms wins outright,
  // so a stale sync can never silently erase purchased-room progress via the
  // timestamp fallback below. Missing/unmigrated `rooms` counts as 0, which
  // also covers "local is empty → fall back to remote" for free.
  const localRoomCount = local?.rooms?.length ?? 0
  const remoteRoomCount = remote?.rooms?.length ?? 0
  if (remoteRoomCount > localRoomCount) {
    return { winner: remote, remoteWon: true, reason: `remote has more rooms (${remoteRoomCount} vs ${localRoomCount})` }
  }
  if (localRoomCount > remoteRoomCount) {
    return { winner: local, remoteWon: false, reason: `local has more rooms (${localRoomCount} vs ${remoteRoomCount})` }
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

  // Fix 3c (Phase 1.1, 2026-07-09) — the mirror of Fix 3b. Discovered as a genuine
  // gap while adding a regression test for the new skillMastery/activeNodes fields:
  // Fix 3b only protected "remote real, local blank" — the reverse (local has real,
  // losable progress, e.g. a mastered curriculum node, while remote is a genuinely
  // untouched default that merely happens to carry a newer timestamp) fell through
  // to the raw timestamp compare below and could let a blank-but-newer remote
  // silently overwrite real local progress. There's no legitimate scenario where a
  // remote row with zero real progress should ever beat local data that has real
  // progress, so this closes the gap the same way Fix 3b already does for the
  // opposite direction (and matches the room-count check above, which was already
  // bidirectional).
  if (hasRealProgress(local) && !hasRealProgress(remote)) {
    return { winner: local, remoteWon: false, reason: 'local has real progress, remote is an untouched default' }
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
    'mazePortal', 'materials', 'eggCare',
  ]
  for (const field of nestedObjectFields) {
    if (base[field] && typeof base[field] === 'object' && !Array.isArray(base[field])) {
      merged[field] = { ...base[field], ...(saved[field] || {}) }
    }
  }

  // ── ROOM DATA RECOVERY SAFETY NET — must run FIRST, before any other room
  // migration below resets or moves roomLayout. Guards against a saved state
  // whose `rooms` array already exists but is desynced from its own layout
  // (e.g. a stale/raw row from before the room-content reducers consistently
  // kept `rooms`/`roomLayout` in sync) — if the top-level roomLayout mirror
  // carries real NEW-format data (not the old incompatible flat-numeric-key
  // format, which is genuinely un-migratable and handled separately below)
  // while the corresponding room's own layout is empty, restore it there
  // before anything else runs. Idempotent / no-op when everything is already
  // in sync, which is the normal case.
  {
    const savedRL = saved.roomLayout
    const savedRLKeys = (savedRL && typeof savedRL === 'object' && !Array.isArray(savedRL))
      ? Object.keys(savedRL) : []
    const isOldFlatFormat = savedRLKeys.length > 0 && savedRLKeys.every(k => /^\d+$/.test(k))
    const hasNewFormatData = savedRLKeys.length > 0 && !isOldFlatFormat

    if (hasNewFormatData) {
      if (Array.isArray(saved.rooms) && saved.rooms.length > 0) {
        const targetId = saved.activeRoomId || saved.rooms[0].id
        const targetIdx = saved.rooms.findIndex(r => r.id === targetId)
        const idx = targetIdx >= 0 ? targetIdx : 0
        const targetLayout = saved.rooms[idx]?.layout
        const targetLayoutEmpty = !targetLayout || Object.keys(targetLayout).length === 0
        if (targetLayoutEmpty) {
          merged.rooms = saved.rooms.map((r, i) => i === idx ? { ...r, layout: savedRL } : r)
          merged.lastSavedAt = Date.now()
        }
      } else {
        // rooms doesn't exist yet — pre-seed it here too, so the recovered data
        // is guaranteed present regardless of what the multi-room block below does.
        merged.rooms = [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: savedRL }]
        merged.activeRoomId = 'main'
        merged.homeRoomId = 'main'
        merged.lastSavedAt = Date.now()
      }
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
  // stale pre-iso layout stays {} in rooms[0].layout too, never resurrected) — unless
  // the safety net above already recovered/seeded `merged.rooms`, in which case that
  // takes priority. If `rooms` already exists, leave it and its per-room layouts
  // untouched (the safety net above already restored any empty target layout). Keep
  // the top-level roomLayout mirror in sync with the active room on the way out.
  if (!Array.isArray(saved.rooms)) {
    merged.rooms = merged.rooms ?? [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: merged.roomLayout || {} }]
    merged.activeRoomId = 'main'
    merged.homeRoomId = 'main'
    merged.lastSavedAt = merged.lastSavedAt || Date.now()
  } else {
    merged.rooms = merged.rooms ?? saved.rooms
    merged.activeRoomId = saved.activeRoomId || saved.rooms[0]?.id || 'main'
    merged.homeRoomId = saved.homeRoomId || saved.rooms[0]?.id || 'main'
    const active = merged.rooms.find(r => r.id === merged.activeRoomId)
    merged.roomLayout = active?.layout || {}
  }

  // Phase 1.1 curriculum migration: skillMastery defaults to {} (per-node records
  // are only ever added by RECORD_ANSWER, safe to start empty for old saves).
  // activeNodes defaults each subject to its curriculum's first node, preserving
  // any subject that's already present (e.g. a save that already has progress).
  if (!merged.skillMastery || typeof merged.skillMastery !== 'object' || Array.isArray(merged.skillMastery)) {
    merged.skillMastery = {}
  }
  {
    const savedActiveNodes = (saved.activeNodes && typeof saved.activeNodes === 'object' && !Array.isArray(saved.activeNodes))
      ? saved.activeNodes : {}
    merged.activeNodes = {}
    for (const subject of SUBJECTS) {
      merged.activeNodes[subject] = savedActiveNodes[subject] || getFirstNodeId(subject)
    }
  }

  // Phase 1.2 placement-test migration: a save that PREDATES this field
  // entirely (typeof !== 'boolean' — defaultState() always sets a real boolean,
  // so this only fires for genuinely old saves) skips the placement flow if it
  // already shows meaningful progress: any mastered curriculum node (Phase 1.1)
  // OR any subjectLevel reaching 3+ (the pre-curriculum adaptive-difficulty
  // signal — this is the concrete meaning of the spec's "player level >= 3"
  // in a codebase with no single scalar "level" field). A save that already
  // has a real boolean here (including a fresh defaultState()) is left alone —
  // it already went through this decision once.
  if (typeof saved.placementDone !== 'boolean') {
    const hasMasteredNode = Object.values(merged.skillMastery).some(m => m?.mastered)
    const maxSubjectLevel = Math.max(
      merged.subjectLevels?.thai ?? 1, merged.subjectLevels?.math ?? 1, merged.subjectLevels?.eng ?? 1,
    )
    merged.placementDone = hasMasteredNode || maxSubjectLevel >= 3
  } else {
    merged.placementDone = saved.placementDone
  }
  if (!saved.placementResults || typeof saved.placementResults !== 'object' || Array.isArray(saved.placementResults)) {
    merged.placementResults = null
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
        setCurrentProfileId(user.id)
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
          // C.1 integrity guard — repair minor corruption / restore from local
          // backup if the cloud row is critically wiped (rooms empty, etc).
          const v = validateState(migrated, user.id)
          if (v.repaired || v.restored) {
            console.log('[KQ:load] validateState —', v.restored ? 'RESTORED from local backup' : 'repaired minor issues')
            migrated = v.state
          }
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
  // C.1 integrity guard on the localStorage path too (guest mode / offline).
  const v = validateState(migrated)
  if (v.repaired || v.restored) {
    console.log('[KQ:load] validateState (local) —', v.restored ? 'RESTORED from local backup' : 'repaired minor issues')
    migrated = v.state
  }
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
    setCurrentProfileId(user.id)
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
  // C.1 — ring the local rolling backup on every successful, real save.
  writeBackup(withTimestamp)
  if (notify) emitSaveStatus('saving')
  syncToSupabase(withTimestamp, { notify })
}
