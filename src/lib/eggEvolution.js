// eggEvolution.js — SPEC GAME-A §A.2 "Evolution × Education". Pure logic only
// (no React/draw code), same pattern as questionBank.js/eggCare.js/
// teachingMoments.js — kept testable under `node --test`.
//
// eggAlgorithm.js is LOCKED and untouched here or anywhere else in this spec
// section — this module only ever produces a stage NUMBER and an affinity
// KEY. Nothing here draws anything; the actual rendering hook is a NEW,
// separate file (src/egg/eggAffinityLayer.js) wired into the *already
// separate, non-locked* src/egg/ layer pipeline (renderEggSprite.js /
// EggCanvas.jsx) — confirmed by reading eggAlgorithm.js first that its own
// drawEgg()/eggProgress() are NOT what the live companion renderer actually
// uses; that pipeline lives entirely in src/egg/ and already has its own
// precedent for overriding the locked file's XP-derived stage number from
// OUTSIDE it (see StateContext.jsx's pre-existing `scaledEggProgress()`,
// which does exactly this for the same reason).
import { SUBJECTS, CURRICULUM } from './curriculum.js'

// mastered-node count -> stage (0-indexed, matching this codebase's existing
// 0..8 stage numbering / EGG_STAGE_NAMES array length 9). Index i means
// "at least THRESHOLDS[i] mastered nodes reaches stage i". The spec's own
// prose describes this 1-indexed ("stage 1..9") — translated here to match
// the codebase's real convention (spec's "stage 1" = this codebase's stage 0).
export const STAGE_THRESHOLDS = [0, 2, 5, 9, 14, 20, 27, 35, 43]

export function stageFromMasteredCount(masteredCount) {
  let stage = 0
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (masteredCount >= STAGE_THRESHOLDS[i]) stage = i
  }
  return stage
}

export function countMasteredNodes(skillMastery) {
  return Object.values(skillMastery || {}).filter(m => m?.mastered).length
}

// Per-subject mastered counts, using curriculum.js's own node->subject
// membership (not guessed from id prefixes) so this stays correct even if
// the curriculum tree changes shape later.
export function countMasteredBySubject(skillMastery) {
  const counts = {}
  for (const subject of SUBJECTS) counts[subject] = 0
  if (!skillMastery) return counts
  for (const subject of SUBJECTS) {
    for (const node of CURRICULUM[subject].nodes) {
      if (skillMastery[node.id]?.mastered) counts[subject] += 1
    }
  }
  return counts
}

// Affinity LINES (the spec's visual-identity naming) per subject key, plus
// the 'balanced' fallback for a genuine tie (including the all-zero case —
// a brand-new account with no mastery yet is a tie at zero, which resolves
// to 'balanced'/'prism' rather than an arbitrary pick).
export const AFFINITY_LINES = {
  thai: 'sage', math: 'architect', eng: 'explorer', balanced: 'prism',
}

// affinity = the SUBJECT KEY with the most mastered nodes ('thai'/'math'/
// 'eng'), or 'balanced' on a tie. Look up AFFINITY_LINES[affinity] for the
// visual line name (sage/architect/explorer/prism).
export function computeAffinity(skillMastery) {
  const bySubject = countMasteredBySubject(skillMastery)
  const max = Math.max(...SUBJECTS.map(s => bySubject[s]))
  if (max === 0) return 'balanced'
  const leaders = SUBJECTS.filter(s => bySubject[s] === max)
  return leaders.length > 1 ? 'balanced' : leaders[0]
}

// ── Combined, never-demoting display stage ──────────────────────────────────
//
// Per the spec: "stage = max(currentStage, thresholdFor(masteredCount)) —
// never demote existing eggs". This codebase has no persisted "current
// stage" field to compare against (stage has always been a DERIVED value,
// recomputed fresh every render from ever-growing XP totals via
// StateContext.jsx's scaledEggProgress) — so "currentStage" here concretely
// means "the pre-existing XP-derived stage that system already produces".
// Since xpThai/xpMath/xpEng only ever increase (no mechanic reduces them)
// and skillMastery.mastered is sticky (once true, applyAnswerToMastery never
// un-sets it), BOTH inputs to this max() are themselves monotonically
// non-decreasing over time — so a plain, non-persisted
// `Math.max(xpDrivenStage, masteryDrivenStage)` computed fresh on every
// render is automatically never-decreasing too, with no extra persisted
// "highest stage ever reached" field needed. This is exactly what makes an
// account like Chopin's (real, pre-dates the curriculum system: high
// XP-driven stage, skillMastery completely empty) safe: masteryDrivenStage
// computes to 0 (0 mastered nodes -> STAGE_THRESHOLDS[0]), so
// max(highXpStage, 0) = highXpStage — his stage is completely unchanged.
export function computeDisplayStage(xpDrivenStage, skillMastery) {
  const masteredCount = countMasteredNodes(skillMastery)
  const masteryStage = stageFromMasteredCount(masteredCount)
  return Math.max(xpDrivenStage, masteryStage)
}
