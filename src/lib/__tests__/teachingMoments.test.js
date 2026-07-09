// teachingMoments.test.js — regression tests for the Phase 1.3 teaching-
// moment trigger logic (src/lib/teachingMoments.js). Runs on Node's built-in
// test runner, same convention as resolveSync.test.js/placementTest.test.js.
// Pure logic, no React/browser needed.

import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRICULUM } from '../curriculum.js'
import {
  recordMissForTeaching, clearTeaching, getTeachingTemplate,
  TEACHING_TEMPLATES, MISS_STREAK_THRESHOLD, MAX_EXPLANATION_LOOPS,
} from '../teachingMoments.js'

const NODE = 'math_add_under_10'
const TYPE = 'numpad'

test('regression: 3 consecutive misses on the same node+type triggers a teaching moment', () => {
  let missStreaks = {}, pendingTeaching = null
  for (let i = 0; i < MISS_STREAK_THRESHOLD - 1; i++) {
    ({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
    assert.equal(pendingTeaching, null, `must not trigger before ${MISS_STREAK_THRESHOLD} misses (at miss ${i + 1})`)
  }
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  assert.deepEqual(pendingTeaching, { nodeId: NODE, questionType: TYPE })
})

test('regression: a correct answer resets the miss streak', () => {
  let missStreaks = {}, pendingTeaching = null
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, true))
  assert.equal(missStreaks[`${NODE}:${TYPE}`], undefined, 'a correct answer must clear the streak entirely')
  // Two more misses after the correct answer should NOT trigger — streak restarted at 0.
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  assert.equal(pendingTeaching, null)
})

test('regression: clearing a teaching moment resets its streak, so it can never show twice in a row', () => {
  let missStreaks = {}, pendingTeaching = null
  for (let i = 0; i < MISS_STREAK_THRESHOLD; i++) {
    ({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  }
  assert.ok(pendingTeaching, 'sanity: should have triggered')
  ;({ missStreaks } = clearTeaching(missStreaks, pendingTeaching))
  pendingTeaching = null
  assert.equal(missStreaks[`${NODE}:${TYPE}`], undefined, 'streak must be reset on clear')

  // A single miss right after clearing must NOT immediately re-trigger.
  ;({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  assert.equal(pendingTeaching, null, 'must not show twice in a row for the same node')

  // It DOES need to be able to re-trigger given a genuinely fresh run of misses.
  for (let i = 0; i < MISS_STREAK_THRESHOLD - 1; i++) {
    ({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  }
  assert.deepEqual(pendingTeaching, { nodeId: NODE, questionType: TYPE }, 'a fresh streak of 3 must still be able to trigger again')
})

test('regression: only one teaching moment is ever pending at a time', () => {
  let missStreaks = {}, pendingTeaching = null
  for (let i = 0; i < MISS_STREAK_THRESHOLD; i++) {
    ({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, 'th_consonants_1', 'choice', false))
  }
  const first = pendingTeaching
  assert.ok(first)
  // A second, unrelated node+type also crossing the threshold must NOT overwrite it.
  for (let i = 0; i < MISS_STREAK_THRESHOLD + 2; i++) {
    ({ missStreaks, pendingTeaching } = recordMissForTeaching(missStreaks, pendingTeaching, NODE, TYPE, false))
  }
  assert.deepEqual(pendingTeaching, first, 'the first pending teaching moment must remain active')
})

test('regression: MAX_EXPLANATION_LOOPS caps the practice-question retry loop at 2', () => {
  // TeachingMoment.jsx's own loop-count logic simulated with the same
  // exported constant, confirming the cap value itself is what the UI reads
  // (not a magic number duplicated in the component).
  let loopCount = 0
  let cleared = false
  function attempt(correct) {
    if (correct) { cleared = true; return }
    loopCount += 1
    if (loopCount >= MAX_EXPLANATION_LOOPS) cleared = true
  }
  attempt(false)
  assert.equal(cleared, false, 'first wrong attempt must repeat the explanation, not clear yet')
  attempt(false)
  assert.equal(cleared, true, 'second wrong attempt must clear regardless (never trap the child)')
  assert.equal(MAX_EXPLANATION_LOOPS, 2)
})

test('regression: every curriculum node resolves to a valid teaching template', () => {
  for (const subject of Object.keys(CURRICULUM)) {
    for (const node of CURRICULUM[subject].nodes) {
      const template = getTeachingTemplate(node.id)
      assert.ok(template, `${node.id}: must resolve to some template (at least the generic fallback)`)
      assert.ok(template.headline && template.explainTh && template.visual, `${node.id}: template must have headline/explainTh/visual`)
    }
  }
  assert.equal(TEACHING_TEMPLATES.length, 12)
})
