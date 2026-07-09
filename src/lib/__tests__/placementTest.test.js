// placementTest.test.js — regression tests for the Phase 1.2 adaptive
// placement algorithm (src/lib/placementTest.js). Runs on Node's built-in
// test runner (npm test -> node --test), same convention as
// resolveSync.test.js. No React/browser needed — the algorithm is pure.

import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRICULUM } from '../curriculum.js'
import {
  PLACEMENT_SUBJECTS, createPlacementSession, currentPlacementQuestion,
  recordPlacementAnswer, isPlacementSubjectDone, placementResultNodeId,
  QUESTIONS_PER_SUBJECT,
} from '../placementTest.js'

function generateNonMemoryQuestion(session) {
  let q = currentPlacementQuestion(session)
  for (let i = 0; i < 9 && q.inputMode === 'memory'; i++) q = currentPlacementQuestion(session)
  return q
}

function runSubject(subject, answerAt) {
  let session = createPlacementSession(subject)
  let qCount = 0
  while (!isPlacementSubjectDone(session)) {
    const q = generateNonMemoryQuestion(session)
    assert.notEqual(q.inputMode, 'memory', 'memory-mode question leaked through the reroll guard')
    assert.ok(q.prompt && q.correctAnswer !== undefined, 'malformed question object')
    session = recordPlacementAnswer(session, answerAt(qCount))
    qCount++
  }
  return session
}

// Escalating-jump math (revised per explicit feedback on the original flat
// +2/-1 scheme): all-correct must land exactly 9 nodes above the K3 start —
// Q2 jump +2, Q3 jump +3, Q4 jump +4 (Q1 only builds the streak, Q5 is past
// the 3-jump cap) — verified for all 3 subjects, not just one.
test('regression: all-correct placement escalates +2/+3/+4, landing +9 above the K3 start', () => {
  for (const subject of PLACEMENT_SUBJECTS) {
    const list = CURRICULUM[subject].nodes
    const startIdx = list.findIndex(n => n.grade === 'K3')
    const session = runSubject(subject, () => true)
    assert.equal(session.questionsAsked, QUESTIONS_PER_SUBJECT)
    assert.equal(session.jumpsUsed, 3, `${subject}: should have used all 3 escalation tiers`)
    assert.equal(session.highestCorrectIdx, startIdx + 9, `${subject}: all-correct must land exactly +9 above K3 start`)
    const resultId = placementResultNodeId(session)
    assert.equal(resultId, list[startIdx + 9].id)
  }
})

// All-wrong must clamp at the first node and never go negative, falling back
// to that subject's very first node as the result (never got a single
// question right, so there's no "highest correct" to place them at).
test('regression: all-wrong placement clamps to the first node in every subject', () => {
  for (const subject of PLACEMENT_SUBJECTS) {
    const list = CURRICULUM[subject].nodes
    const session = runSubject(subject, () => false)
    assert.equal(session.highestCorrectIdx, -1, `${subject}: no correct answers should leave highestCorrectIdx at -1`)
    assert.equal(session.jumpsUsed, 0)
    const resultId = placementResultNodeId(session)
    assert.equal(resultId, list[0].id, `${subject}: all-wrong must fall back to the very first node`)
  }
})

// A wrong answer mid-escalation must reset BOTH the streak and the jump-tier
// counter back to zero — the next correct-streak starts over at tier 1 (+2),
// not wherever the escalation had reached before the miss.
test('regression: a wrong answer resets the escalation ladder, not just the streak', () => {
  // correct, correct (jump #1, +2), correct (jump #2, +3), WRONG (reset), correct
  const session = runSubject('math', (i) => i !== 3)
  assert.equal(session.jumpsUsed, 0, 'after the wrong answer with no further completed pair, jumpsUsed must be back at 0')
  assert.equal(session.correctStreak, 1, 'the single correct answer after the wrong one only builds a fresh streak of 1')
})

// Mixed pattern sanity check — must always complete exactly 5 questions per
// subject and produce a valid node id, regardless of the exact pattern.
test('regression: mixed and alternating answer patterns always resolve to a valid node', () => {
  const patterns = [
    (i) => i % 2 === 0,                 // alternating
    (i) => [true, false, true, true, false][i],
    (i) => [false, true, false, true, true][i],
  ]
  for (const pattern of patterns) {
    for (const subject of PLACEMENT_SUBJECTS) {
      const session = runSubject(subject, pattern)
      assert.equal(session.questionsAsked, QUESTIONS_PER_SUBJECT)
      const resultId = placementResultNodeId(session)
      const node = CURRICULUM[subject].nodes.find(n => n.id === resultId)
      assert.ok(node, `${subject}: result node id "${resultId}" must exist in CURRICULUM`)
    }
  }
})
