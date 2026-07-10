// eggEvolution.test.js — regression tests for the SPEC GAME-A §A.2 pure logic
// (src/lib/eggEvolution.js). Runs on Node's built-in test runner, same
// convention as every other pure-logic suite in this project. Includes the
// exact scripted-trace scenarios requested for this section: threshold
// boundaries, affinity flip on subject-balance change, and the real
// never-demote case (an account with a high XP-driven stage but zero
// skillMastery, e.g. a pre-curriculum account).

import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRICULUM, SUBJECTS } from '../curriculum.js'
import {
  STAGE_THRESHOLDS, stageFromMasteredCount, countMasteredNodes,
  countMasteredBySubject, computeAffinity, computeDisplayStage, AFFINITY_LINES,
} from '../eggEvolution.js'

function masterFirstN(subject, n) {
  const sm = {}
  const nodes = CURRICULUM[subject].nodes
  const cap = Math.min(n, nodes.length)
  for (let i = 0; i < cap; i++) sm[nodes[i].id] = { mastered: true }
  return sm
}

test('sanity: curriculum node counts this suite assumes (thai=14, math=15, eng=14, total=43)', () => {
  assert.equal(CURRICULUM.thai.nodes.length, 14)
  assert.equal(CURRICULUM.math.nodes.length, 15)
  assert.equal(CURRICULUM.eng.nodes.length, 14)
  assert.equal(STAGE_THRESHOLDS[STAGE_THRESHOLDS.length - 1], 43, 'the top threshold must equal the full tree size')
})

// ── Requested acceptance scenario: threshold boundaries ─────────────────────
test('regression (requested scenario): threshold boundary 1->2 mastered nodes crosses from stage 0 to stage 1', () => {
  assert.equal(stageFromMasteredCount(1), 0, '1 mastered node is below STAGE_THRESHOLDS[1]=2, must stay at stage 0')
  assert.equal(stageFromMasteredCount(2), 1, '2 mastered nodes exactly hits STAGE_THRESHOLDS[1]=2, must reach stage 1')
})

test('regression (requested scenario): threshold boundary 42->43 mastered nodes crosses to the final stage', () => {
  assert.equal(stageFromMasteredCount(42), 7, '42 mastered nodes is one short of the full tree, must stay at stage 7')
  assert.equal(stageFromMasteredCount(43), 8, '43 mastered nodes is the ENTIRE curriculum tree, must reach the final stage 8')
})

test('stageFromMasteredCount clamps at both ends and never returns out-of-range', () => {
  assert.equal(stageFromMasteredCount(0), 0)
  assert.equal(stageFromMasteredCount(100), 8, 'over-cap counts (should never happen, but must not crash or overshoot) clamp at the top stage')
})

// ── Requested acceptance scenario: affinity flip on subject-balance change ──
test('regression (requested scenario): affinity flips as subject-mastery balance shifts, and ties resolve to balanced', () => {
  let sm = masterFirstN('thai', 3)
  assert.equal(computeAffinity(sm), 'thai', 'thai leads with 3 mastered, others at 0')

  sm = { ...sm, ...masterFirstN('math', 5) }
  assert.equal(computeAffinity(sm), 'math', 'math now leads (5 > 3) -- affinity must flip')

  sm = { ...sm, ...masterFirstN('eng', 5) }
  assert.equal(computeAffinity(sm), 'balanced', 'math and eng are now tied at 5 each -- must resolve to balanced, not an arbitrary pick')
})

test('a genuine zero-mastery tie (brand-new account) resolves to balanced, not a crash or arbitrary subject', () => {
  assert.equal(computeAffinity({}), 'balanced')
  assert.equal(computeAffinity(null), 'balanced', 'must be safe against a completely missing skillMastery too')
  assert.equal(computeAffinity(undefined), 'balanced')
})

test('AFFINITY_LINES maps every subject key (plus balanced) to its spec-named visual line', () => {
  assert.equal(AFFINITY_LINES.thai, 'sage')
  assert.equal(AFFINITY_LINES.math, 'architect')
  assert.equal(AFFINITY_LINES.eng, 'explorer')
  assert.equal(AFFINITY_LINES.balanced, 'prism')
  // Every real subject key must have a line mapping (no silent gaps).
  for (const s of SUBJECTS) assert.ok(AFFINITY_LINES[s], `AFFINITY_LINES must define a line for subject "${s}"`)
})

test('countMasteredBySubject reports per-subject counts correctly, including subjects with zero', () => {
  const sm = masterFirstN('thai', 2)
  const counts = countMasteredBySubject(sm)
  assert.equal(counts.thai, 2)
  assert.equal(counts.math, 0)
  assert.equal(counts.eng, 0)
  assert.equal(countMasteredNodes(sm), 2)
})

// ── Requested acceptance scenario: never-demote, Chopin's real situation ────
// Chopin's actual account predates the Phase 1.1 curriculum system entirely:
// years of real XP-driven progress (a high existing stage from
// scaledEggProgress), but skillMastery is genuinely empty (never populated,
// since RECORD_ANSWER/applyAnswerToMastery only started writing to it once
// the curriculum system shipped). This is the exact case the spec's
// never-demote migration rule exists to protect.
test('regression (requested scenario, Chopin\'s real situation): a high XP-driven stage with completely empty skillMastery is never demoted', () => {
  const chopinXpStage = 6 // a plausible real high stage from years of pre-curriculum play
  assert.equal(computeDisplayStage(chopinXpStage, {}), chopinXpStage, 'empty {} skillMastery must not pull the stage down at all')
  assert.equal(computeDisplayStage(chopinXpStage, undefined), chopinXpStage, 'a completely MISSING skillMastery field (old save shape) must be equally safe')
  assert.equal(computeDisplayStage(chopinXpStage, null), chopinXpStage, 'a null skillMastery must be equally safe')
})

test('never-demote holds at every stage level, not just a high one', () => {
  for (let xpStage = 0; xpStage <= 8; xpStage++) {
    assert.equal(computeDisplayStage(xpStage, {}), xpStage, `xpDrivenStage=${xpStage} with no mastery must stay at ${xpStage}`)
  }
})

test('mastery-driven progress correctly RAISES the stage above a lower XP-driven baseline', () => {
  const sm = { ...masterFirstN('math', 15), ...masterFirstN('thai', 5) } // 20 total mastered -> threshold[5]=20 -> stage 5
  assert.equal(computeDisplayStage(2, sm), 5, 'a curriculum-engaged account must be able to exceed a low legacy XP stage via mastery')
})

test('a low mastery count never demotes a HIGHER existing XP-driven stage (the general case, not just Chopin\'s zero-mastery one)', () => {
  const sm = masterFirstN('math', 2) // only enough for stage 1
  assert.equal(computeDisplayStage(7, sm), 7, 'a small amount of real mastery progress must not pull a high existing stage down')
})

test('computeDisplayStage is monotonically safe: increasing either input never decreases the result', () => {
  const smLow = masterFirstN('math', 2)
  const smHigh = { ...smLow, ...masterFirstN('thai', 10) }
  const stageLow = computeDisplayStage(3, smLow)
  const stageHigh = computeDisplayStage(3, smHigh)
  assert.ok(stageHigh >= stageLow, 'more mastered nodes must never produce a LOWER combined stage')
})
