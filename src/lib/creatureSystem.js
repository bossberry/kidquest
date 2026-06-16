// Creature element + evolution logic. eggAlgorithm.js is NOT touched here.
import { PROGRESSION_MAP } from '../config/gameConfig.js'

export const CREATURE_ELEMENT_COLORS = {
  fire:    '#E24B4A',
  water:   '#378ADD',
  thunder: '#EF9F27',
  nature:  '#639922',
  shadow:  '#534AB7',
  light:   '#FAC775',
}

export const CREATURE_ELEMENT_NAMES_TH = {
  fire:    'ไฟ',
  water:   'น้ำ',
  thunder: 'สายฟ้า',
  nature:  'ธรรมชาติ',
  shadow:  'เงามืด',
  light:   'แสงสว่าง',
}

const ELEMENT_MAP = { thai: 'fire', math: 'water', eng: 'thunder' }

/**
 * Determine creature element at hatch.
 * @param {number} xpThai
 * @param {number} xpMath
 * @param {number} xpEng
 * @param {number} accuracy  0–100 (state.acc)
 * @param {number} streak    integer (state.streak)
 */
export function determineElement(xpThai, xpMath, xpEng, accuracy, streak) {
  const t = xpThai || 0
  const m = xpMath || 0
  const e = xpEng  || 0
  const acc = (accuracy ?? 70) / 100  // convert 0-100 → 0-1
  const s   = streak ?? 0

  // Special rare elements (checked first)
  if (acc >= 0.9 && s >= 14) return 'light'
  if (acc >= 0.85) return 'nature'
  if (s >= 7 && Math.max(t, m, e) < 100) return 'shadow'

  // Dominant subject → element
  const dominant = t >= m && t >= e ? 'thai' : m >= e ? 'math' : 'eng'
  return ELEMENT_MAP[dominant]
}

/**
 * Element color hint for the egg at current progression (Stage 2+).
 * Returns null before Stage 2 (no spoilers).
 */
export function getEggElementHint(xpThai, xpMath, xpEng, accuracy, streak, eggStage) {
  if (eggStage < 2) return null
  const el = determineElement(xpThai, xpMath, xpEng, accuracy, streak)
  return { element: el, color: CREATURE_ELEMENT_COLORS[el], nameTH: CREATURE_ELEMENT_NAMES_TH[el] }
}

/**
 * Compute evolution stage from creature data.
 * Uses PROGRESSION_MAP.evoRequirements for thresholds.
 */
export function calcEvoStage(battleLevel, playerTier, bondMeter, currentEvoStage) {
  if (currentEvoStage === 'final') return 'final'
  const lv   = battleLevel ?? 1
  const tier = playerTier  ?? 0
  const bond = bondMeter   ?? 0
  const req  = PROGRESSION_MAP.evoRequirements
  if (currentEvoStage === 'teen') {
    return (lv >= req.final.minBattleLevel && tier >= req.final.minTier && bond >= req.final.minBond)
      ? 'final'
      : 'teen'
  }
  // baby
  return (lv >= req.teen.minBattleLevel && tier >= req.teen.minTier) ? 'teen' : 'baby'
}

export const EVO_STAGE_LABELS_TH = {
  baby:  'เด็ก',
  teen:  'โต',
  final: 'สุดยอด',
}

// 5 name suggestions per element — shown as large tap targets in HatchOverlay (no typing)
export const CREATURE_NAME_SUGGESTIONS = {
  fire:    ['ไฟน้อย', 'อาคา', 'โรโร', 'ลิ้น', 'แสบ'],
  water:   ['น้ำใส', 'มาริน', 'ฮาน่า', 'อาควา', 'คิโระ'],
  thunder: ['ฟ้า',   'โบลต์', 'ปิก้า', 'ซาปา', 'วาว'],
  nature:  ['ใบไม้', 'ลีฟ',  'สปรา', 'ไอวี่', 'คลอวา'],
  shadow:  ['เงา',   'ลูน่า', 'มิสตี้', 'นอคซ์', 'ชาดี'],
  light:   ['แสง',  'ดาว',  'ลูมิ', 'ออร่า', 'ชายน์'],
}
