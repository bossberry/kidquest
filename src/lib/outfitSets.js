/**
 * outfitSets.js — SPEC GAME-B §B.1 (Dressing Room)
 * --------------------------------------------------------------------------
 * Pure logic (no React/canvas), same pattern as eggEvolution.js/eggPoses.js.
 * 6 named outfit sets, each pairing one CLOSEST-MATCH existing head/face item
 * (spec: "inspect the real ownedItems catalog and pick the closest match;
 * document choices") with the 2 new body/back items from this section.
 *
 * Picks made against the real src/egg/eggCosmeticLayer.js COSMETIC_ITEMS
 * catalog (documented in CHATBOT_NOTES.md's handoff too):
 *   นักผจญภัย (Adventurer) — no literal "adventurer hat" exists; `cap` (a
 *     plain baseball cap) is the closest casual/exploring head item.
 *   ฮีโร่ (Hero) — spec says "any crown/cap"; used `eye_mask` instead (a
 *     FACE item) because its own code comment literally already calls it a
 *     "superhero / masquerade eye mask" — a stronger match than reusing cap.
 *   นินจา (Ninja) — spec says "shades (existing face)" → `sunglasses`, exact.
 *   เจ้าหญิง/เจ้าชาย (Royal) — spec says "crown (existing)" → `jeweled_crown`
 *     (picked over `gold_crown` as the more distinctly "royal/ornate" one).
 *   ชาวสวน (Gardener) — spec says "existing sun-style hat if any"; no literal
 *     sun hat exists, `flower_crown` is the closest garden-themed head item.
 *   นักบิน (Aviator/Pilot) — spec says "existing goggles-style face item if
 *     any"; `round_glasses` (round frames) reads closest to classic aviator
 *     goggles among the 3 existing face-glasses items.
 * No existing item is reused across two sets.
 */

export const OUTFIT_SETS = [
  {
    id: 'adventurer',
    nameTh: 'นักผจญภัย',
    existingSlot: 'head', existingId: 'cap',
    bodyId: 'adventurer_suit', backId: 'backpack',
    tint: '#c9a24a',      // warm khaki
    pose: 'curious_tilt',
  },
  {
    id: 'hero',
    nameTh: 'ฮีโร่',
    existingSlot: 'face', existingId: 'eye_mask',
    bodyId: 'sport_jersey', backId: 'hero_cape',
    tint: '#ff4444',      // heroic red
    pose: 'proud',
  },
  {
    id: 'ninja',
    nameTh: 'นินจา',
    existingSlot: 'face', existingId: 'sunglasses',
    bodyId: 'ninja_suit', backId: 'turtle_shell',
    tint: '#3a3a4a',      // stealthy near-black
    pose: 'sit',
  },
  {
    id: 'royal',
    nameTh: 'เจ้าหญิง/เจ้าชาย',
    existingSlot: 'head', existingId: 'jeweled_crown',
    bodyId: 'royal_outfit', backId: 'angel_wings',
    tint: '#8a4fd6',      // royal purple
    pose: 'celebrate',
  },
  {
    id: 'gardener',
    nameTh: 'ชาวสวน',
    existingSlot: 'head', existingId: 'flower_crown',
    bodyId: 'gardener_overalls', backId: 'mini_umbrella',
    tint: '#5bbf6a',      // garden green
    pose: 'happy_bounce',
  },
  {
    id: 'aviator',
    nameTh: 'นักบิน',
    existingSlot: 'face', existingId: 'round_glasses',
    bodyId: 'scientist_coat', backId: 'mini_rocket',
    tint: '#4db8e8',      // sky blue
    pose: 'laugh',
  },
]

/**
 * @param {{head:?string, face:?string, body:?string, back:?string}} equipped
 * @returns the matching OUTFIT_SETS entry, or null if no full set is worn.
 * Purely cosmetic detection — never touches stats (fairness rule, no set
 * grants any stat advantage).
 */
export function detectFullSet(equipped) {
  if (!equipped) return null
  for (const set of OUTFIT_SETS) {
    if (
      equipped[set.existingSlot] === set.existingId &&
      equipped.body === set.bodyId &&
      equipped.back === set.backId
    ) {
      return set
    }
  }
  return null
}
