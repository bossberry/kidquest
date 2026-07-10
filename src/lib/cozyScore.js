/**
 * cozyScore.js — SPEC GAME-B §B.2 (Room)
 * --------------------------------------------------------------------------
 * Pure logic (no React/canvas), same pattern as eggEvolution.js/outfitSets.js.
 *
 * computeCozy(layout) is a SOFT score: it only ever adds points, never
 * subtracts. A sparse or "wrong" room is simply low-scoring, never penalized
 * or flagged — there is no way for a child to make their room "bad".
 *
 * IMPORTANT (guardrail, same class as §A.1's care-loop rule): the numeric
 * score itself must NEVER be shown to the child. It only drives two soft,
 * ambient child-facing signals (ambient particle density, an occasional egg
 * comment — see deriveCozyComment below) and is exported here so a future
 * parent dashboard (Phase 2, not built this session) can read it directly.
 */

// Item-id sets used to detect each cozy signal. Deliberately narrow/curated
// (not "everything is a light") so the signals stay meaningful — matches
// this project's existing style of hand-picked, not auto-derived, item
// categorization (see MONSTER_DROPS/CRAFT_RECIPES in roomItems.js).
const LIGHT_ITEMS = new Set([
  'lamp', 'wall_lamp_right', 'fairy_lights', 'slime_lamp', 'forest_lantern',
  'spore_lamp', 'ghost_lamp', 'star_lantern', 'cuckoo_clock',
])
const SOFT_ITEMS = new Set([
  'rug', 'bed', 'bunny_cushion', 'jelly_rug', 'leaf_hammock', 'snake_rug',
  'stuffed_animal', 'fox_plushie',
])
const PLANT_ITEMS = new Set([
  'plant', 'carrot_planter', 'vine_curtain', 'mushroom_ring', 'flower_wreath', 'mossy_log',
])

/**
 * @param {Object<string,string>} layout  room.layout — { "{zone}_{a}_{b}": itemId }
 * @returns {{
 *   score: number,            // 0-100, additive only, for a future parent dashboard
 *   distinctCount: number,    // distinct furniture ids placed (variety signal)
 *   hasLight: boolean, hasSoft: boolean, hasPlant: boolean, wallBalance: boolean,
 * }}
 */
export function computeCozy(layout) {
  const entries = Object.entries(layout || {}).filter(([, id]) => !!id)
  const items = entries.map(([, id]) => id)
  const distinctCount = new Set(items).size

  const hasLight = items.some(id => LIGHT_ITEMS.has(id))
  const hasSoft = items.some(id => SOFT_ITEMS.has(id))
  const hasPlant = items.some(id => PLANT_ITEMS.has(id))
  const hasLeftWall = entries.some(([k]) => k.startsWith('left_wall_'))
  const hasRightWall = entries.some(([k]) => k.startsWith('right_wall_'))
  const wallBalance = hasLeftWall && hasRightWall

  let score = 0
  score += Math.min(distinctCount, 8) * 5   // variety, up to 40
  if (hasLight) score += 15
  if (hasSoft) score += 15
  if (hasPlant) score += 15
  if (wallBalance) score += 15

  return { score: Math.min(100, score), distinctCount, hasLight, hasSoft, hasPlant, wallBalance }
}

// Ambient particle density (SPEC GAME-B §B.2's ONLY child-visible cozy
// signal, besides the occasional comment below). Deliberately coarse tiers
// (not a 1:1 slider) so it reads as "the room feels alive", not a bar filling.
export function cozyParticleDensity(cozy) {
  const score = cozy?.score ?? 0
  if (score >= 70) return 3
  if (score >= 40) return 2
  if (score >= 15) return 1
  return 0
}

// A handful of gentle, low-frequency comment lines — chosen by the CALLER
// only occasionally (e.g. on Home mount / Room mount, not every render).
// Never a number, never phrased as feedback on what's missing.
const COZY_COMMENTS = [
  'ห้องนี้น่านอนจังเลย~',
  'อบอุ่นจังเลยห้องนี้~',
  'หนูตกแต่งเก่งจัง!',
  'ไข่ชอบห้องนี้จัง~',
]

/** @returns a comment string if the room is cozy enough to comment on, else null. */
export function deriveCozyComment(cozy) {
  if ((cozy?.score ?? 0) < 40) return null
  return COZY_COMMENTS[Math.floor(Math.random() * COZY_COMMENTS.length)]
}
