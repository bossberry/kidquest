import { supabase } from './supabase.js'
import { calcCreatureStats, GRADE_LABELS } from '../config/gameConfig.js'
import { determineElement, calcEvoStage } from './creatureSystem.js'

export const KEY = 'kq_state'

export function defaultState() {
  return {
    name: 'โชแปง', grade: 0,
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
    items: { food: 2, star: 0, ribbon: 0, potion: 0, scroll: 0, thunder: 0, gem: 0, mirror: 0, clover: 0 },
    xpBoost: 1, xpBoostEnd: 0,
    thaiMastery: {}, thSpellLevel: 1,
    dailyRounds: 0, lastPlayDate: '',
    eggRunLives: 3, lastRunDate: '',
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
    mazeActive: false,
    mazeCleared: false,
    bossDefeated: [],
    bossDefeatedThisTier: false,
    pendingEvoNotice: null,
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
          let migrated = _migrateEggs(data.state_json)
          migrated = _migrateBattleStats(migrated)
          if (migrated !== data.state_json) {
            console.log('[KQ:load] migrating cloud eggs')
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
  let migrated = _migrateEggs(s)
  migrated = _migrateBattleStats(migrated)
  if (migrated !== s) {
    console.log('[KQ:load] migrated', s.hatchedEggs?.length, 'eggs → saving')
    localStorage.setItem(KEY, JSON.stringify(migrated))
    syncToSupabase(migrated)
  }
  return migrated
}

// Push any state object to Supabase (used by StateContext on SIGNED_IN)
export async function syncToSupabase(s) {
  try {
    if (!supabase) { console.log('[KQ:sync] no client'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.log('[KQ:sync] no user'); return }
    console.log('[KQ:sync] pushing state for', user.email, '— xpThai:', s.xpThai, 'rounds:', s.rounds)
    const { error } = await supabase.from('eggs').upsert({
      user_id: user.id,
      child_name: s.name || 'โชแปง',
      state_json: s,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) console.log('[KQ:sync] upsert error:', error.message)
    else console.log('[KQ:sync] ✓ done')
  } catch (e) {
    console.log('[KQ:sync] failed:', e.message)
  }
}

export function saveState(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
  syncToSupabase(s)
}
