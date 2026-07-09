// curriculum.test.js — regression tests for applyAnswerToMastery(), the
// RECORD_ANSWER mastery bookkeeping retrofitted out of StateContext.jsx's
// LOG_BATTLE_ANSWER reducer case (Phase 1.1, originally inline and only
// verifiable by manual trace since StateContext.jsx is a JSX file Node's
// `--test` runner can't import). Extracted to curriculum.js as a pure
// function specifically so it could finally get real committed coverage —
// this suite is that coverage. Verified equivalent to the original inline
// version via a before/after trace comparison across 6 scenarios (all-
// correct, all-wrong, the exact EMA-mastery boundary, two mixed-answer runs,
// and the "last node in subject, no next node" edge case) before the
// retrofit was committed — zero mismatches.

import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRICULUM, applyAnswerToMastery, getNode } from '../curriculum.js'

test('regression: a single correct answer does not instantly master a node', () => {
  const { skillMastery } = applyAnswerToMastery({}, {}, null, 'math', 'math_add_under_10', true)
  assert.equal(skillMastery.math_add_under_10.mastered, false, 'one lucky answer must not satisfy ema > threshold (the EMA cold-start bug this session found in §1.1)')
  assert.equal(skillMastery.math_add_under_10.ema, 0.3)
})

test('regression: 5 consecutive correct answers masters a node via the EMA path', () => {
  let skillMastery = {}, activeNodes = {}, pendingNodeMastery = null
  for (let i = 0; i < 5; i++) {
    ({ skillMastery, activeNodes, pendingNodeMastery } = applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, 'math', 'math_add_under_10', true))
  }
  assert.equal(skillMastery.math_add_under_10.mastered, true)
  assert.ok(skillMastery.math_add_under_10.ema > 0.8)
})

test('regression: 8-correct-in-10 masters a node via the attempts-count path even without a long streak', () => {
  const pattern = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1] // 8 correct in 10, never 5 in a row
  let skillMastery = {}, activeNodes = {}, pendingNodeMastery = null
  for (const c of pattern) {
    ({ skillMastery, activeNodes, pendingNodeMastery } = applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, 'thai', 'th_consonants_1', !!c))
  }
  assert.equal(skillMastery.th_consonants_1.attempts.length, 10)
  assert.equal(skillMastery.th_consonants_1.mastered, true)
})

// getNextEligibleNode scans from the START of the curriculum for the
// earliest unmastered node whose prerequisites are met — it does NOT mean
// "the node that depends on whatever was just mastered." In real play,
// activeNodes only ever reaches nodeId after everything before it in
// curriculum order is already mastered (that's how it got there), so tests
// need to set up that same realistic precondition rather than mastering
// nodeId in isolation.
function masterAllBefore(subject, nodeId) {
  const list = CURRICULUM[subject].nodes
  const idx = list.findIndex(n => n.id === nodeId)
  const skillMastery = {}
  for (let i = 0; i < idx; i++) {
    skillMastery[list[i].id] = { attempts: Array(10).fill(1), ema: 0.99, mastered: true, masteredAt: 1 }
  }
  return skillMastery
}

test('regression: mastering a node advances activeNodes to the next eligible node and fires the celebration', () => {
  let skillMastery = masterAllBefore('math', 'math_add_under_10')
  let activeNodes = { math: 'math_add_under_10' }, pendingNodeMastery = null
  for (let i = 0; i < 5; i++) {
    ({ skillMastery, activeNodes, pendingNodeMastery } = applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, 'math', 'math_add_under_10', true))
  }
  const list = CURRICULUM.math.nodes
  const nextNode = list[list.findIndex(n => n.id === 'math_add_under_10') + 1]
  assert.equal(activeNodes.math, nextNode.id, 'activeNodes.math must advance to the immediately-following node once its prerequisites are met')
  assert.deepEqual(pendingNodeMastery, {
    subject: 'math', nodeId: 'math_add_under_10',
    nextNodeId: nextNode.id, nextNodeNameTh: nextNode.nameTh,
  })
})

test('regression: mastering the LAST node in a subject still celebrates but leaves activeNodes unchanged', () => {
  const lastNode = CURRICULUM.math.nodes[CURRICULUM.math.nodes.length - 1]
  let skillMastery = masterAllBefore('math', lastNode.id)
  let activeNodes = { math: lastNode.id }, pendingNodeMastery = null
  for (let i = 0; i < 5; i++) {
    ({ skillMastery, activeNodes, pendingNodeMastery } = applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, 'math', lastNode.id, true))
  }
  assert.equal(activeNodes.math, lastNode.id, 'no next node exists — activeNodes must not change')
  assert.deepEqual(pendingNodeMastery, { subject: 'math', nodeId: lastNode.id, nextNodeId: null, nextNodeNameTh: null })
})

test('regression: an already-mastered node stays mastered and does not re-fire the celebration', () => {
  let skillMastery = {}, activeNodes = {}, pendingNodeMastery = null
  for (let i = 0; i < 5; i++) {
    ({ skillMastery, activeNodes, pendingNodeMastery } = applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, 'math', 'math_add_under_10', true))
  }
  pendingNodeMastery = null // simulate CLEAR_NODE_MASTERY having already run
  ;({ skillMastery, activeNodes, pendingNodeMastery } = applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, 'math', 'math_add_under_10', true))
  assert.equal(pendingNodeMastery, null, 'a node that was already mastered must not fire a second celebration on a later correct answer')
})

test('regression: an unknown nodeId is a no-op (returns the inputs unchanged)', () => {
  const skillMastery = { real: { attempts: [1], ema: 0.3, mastered: false, masteredAt: null } }
  const result = applyAnswerToMastery(skillMastery, { math: 'x' }, null, 'math', 'does_not_exist', true)
  assert.equal(result.skillMastery, skillMastery)
  assert.deepEqual(result.activeNodes, { math: 'x' })
  assert.equal(result.pendingNodeMastery, null)
})

test('sanity: applyAnswerToMastery resolves a real node via getNode for every subject', () => {
  for (const subject of Object.keys(CURRICULUM)) {
    const firstId = CURRICULUM[subject].nodes[0].id
    assert.ok(getNode(subject, firstId))
    const { skillMastery } = applyAnswerToMastery({}, {}, null, subject, firstId, true)
    assert.ok(skillMastery[firstId])
  }
})
