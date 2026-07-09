// minigameLives.js — single source of truth for the minigame daily-lives +
// unlock-gating system (2026-07-01).
//
// Each minigame has: a world key (matches GameScreen's `world === '...'` checks),
// a per-day life counter + a date stamp in state, a max lives/day, an unlock level
// (compared against the companion's battleLevel), and the reducer action that
// deducts one life.
//
// Date handling uses `todayStr()` (the SAME helper the reducers stamp with, e.g.
// ER_DEDUCT_LIFE) so the UI's remaining-lives read and the reducer's stored date
// always agree. (EggRun's own inline `checkLivesReset` historically used
// toLocaleDateString(), a different format — we standardise on todayStr() here so
// the gating actually works.)
import { todayStr } from '../config/gameConfig.js'

export const MINIGAMES = {
  memory:  { world: 'memory',  livesKey: 'memoryLives',  dateKey: 'lastMemoryDate',  max: 3, unlockLevel: 0,  deductAction: 'MEMORY_DEDUCT_LIFE',  title: '🃏 Egg Memory' },
  catch:   { world: 'catch',   livesKey: 'catchLives',   dateKey: 'lastCatchDate',   max: 3, unlockLevel: 2,  deductAction: 'CATCH_DEDUCT_LIFE',   title: '🧺 Egg Catch' },
  eggrun:  { world: 'eggrun',  livesKey: 'eggRunLives',  dateKey: 'lastRunDate',     max: 2, unlockLevel: 6,  deductAction: 'ER_DEDUCT_LIFE',      title: '🏃 Egg Run' },
  tower:   { world: 'tower',   livesKey: 'towerLives',   dateKey: 'lastTowerDate',   max: 3, unlockLevel: 6,  deductAction: 'TOWER_DEDUCT_LIFE',   title: '🏗️ Egg Tower' },
  fishing: { world: 'fishing', livesKey: 'fishingLives', dateKey: 'lastFishingDate', max: 2, unlockLevel: 10, deductAction: 'FISHING_DEDUCT_LIFE', title: '🎣 Egg Fishing' },
  readaloud: { world: 'readaloud', livesKey: 'readAloudLives', dateKey: 'lastReadAloudDate', max: 3, unlockLevel: 4, deductAction: 'READALOUD_DEDUCT_LIFE', title: '🎤 อ่านให้ไข่ฟัง' },
}

// Remaining lives for a game today. If the stored date isn't today, lives have
// reset to max (the reducer performs the same reset when it next deducts).
export function livesRemaining(state, key) {
  const g = MINIGAMES[key]
  if (!g) return 0
  if ((state[g.dateKey] || '') !== todayStr()) return g.max
  return state[g.livesKey] ?? 0
}

// Games unlocked at the given companion battle level.
export function unlockedGames(level) {
  return Object.keys(MINIGAMES).filter(k => level >= MINIGAMES[k].unlockLevel)
}

// Hearts string: ❤️ per remaining, 🖤 per used (same visual as EggRun).
export function heartsStr(remaining, max) {
  const r = Math.max(0, Math.min(max, remaining))
  return '❤️'.repeat(r) + '🖤'.repeat(Math.max(0, max - r))
}
