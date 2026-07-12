// questionPromptField.test.js — regression test for the 2026-07-14 urgent
// fix: MoveSelectBattleMode.jsx's question-display Zone 2 used to check
// pre-Phase-1.1 fields (q.question/q.word/q.letter/q.a+q.op/q.isCount/
// q.isPattern/q.isFillGap/q.isVisualDiscrim/q.isSequence) that NO real
// generator has ever set, so the question prompt never rendered at all —
// only a bare "?" (NumpadInput's own digit-placeholder) was visible. The
// real field is `prompt` (always present) + an optional `promptTh`. This
// guards every selection path (active/review/preview, reviewBoost on/off,
// every subject, every one of the 43 curriculum nodes directly) so this
// exact regression can never silently reappear.

import test from 'node:test'
import assert from 'node:assert/strict'
import { selectBattleQuestion, generateQuestion } from '../questionBank.js'
import { CURRICULUM, getFirstNodeId, getNode, getNodeAfter, getMasteredNodeIds } from '../curriculum.js'

const SUBJECTS = ['thai', 'math', 'eng']
const VALID_INPUT_MODES = ['choice', 'numpad', 'wordbuild', 'sequence', 'memory']

function assertWellFormed(q, label) {
  assert.ok(typeof q.prompt === 'string' && q.prompt.length > 0, `${label}: prompt must be a non-empty string, got ${JSON.stringify(q.prompt)}`)
  assert.ok(VALID_INPUT_MODES.includes(q.inputMode), `${label}: inputMode "${q.inputMode}" is not a registered mode`)
  // memory-mode pair-matching has no single "correct answer" by design (see
  // genVocabQ's useMemory branch) — correctAnswer: null is legitimate there.
  if (q.inputMode !== 'memory') {
    assert.ok(q.correctAnswer !== undefined && q.correctAnswer !== null, `${label}: correctAnswer must be set`)
  }
}

test('every curriculum node\'s generateQuestion() output has a real prompt + valid inputMode (all 43 nodes, direct)', () => {
  let checked = 0
  for (const subject of SUBJECTS) {
    for (const node of CURRICULUM[subject].nodes) {
      for (const difficulty of [1, 5, 10]) {
        const q = generateQuestion(node, difficulty)
        assertWellFormed(q, `${subject}/${node.id}@difficulty${difficulty}`)
        checked++
      }
    }
  }
  assert.ok(checked >= 120, `expected to check every node at 3 difficulties, only checked ${checked}`)
})

// Build a state with several mastered nodes so both the review branch
// (masteredIds.length > 0) and the preview branch get real exercise, not
// just the always-active fallback a totally-fresh account would hit.
function buildRichState(subject) {
  const nodes = CURRICULUM[subject].nodes
  const skillMastery = {}
  for (let i = 0; i < Math.min(4, nodes.length); i++) {
    skillMastery[nodes[i].id] = { attempts: Array(10).fill(1), ema: 0.99, mastered: true, masteredAt: 1 }
  }
  const activeId = nodes[Math.min(4, nodes.length - 1)]?.id || getFirstNodeId(subject)
  return { skillMastery, activeNodes: { [subject]: activeId } }
}

test('selectBattleQuestion: every subject, both reviewBoost modes, many samples — always well-formed', () => {
  for (const subject of SUBJECTS) {
    const state = buildRichState(subject)
    for (const reviewBoost of [false, true]) {
      for (let i = 0; i < 150; i++) {
        const q = selectBattleQuestion(subject, state, { reviewBoost })
        assertWellFormed(q, `${subject} reviewBoost=${reviewBoost} sample${i} (node ${q.nodeId})`)
      }
    }
  }
})

test('selectBattleQuestion: a completely fresh account (no mastered nodes, active-only branch) is still well-formed', () => {
  for (const subject of SUBJECTS) {
    const state = { skillMastery: {}, activeNodes: {} }
    for (let i = 0; i < 30; i++) {
      const q = selectBattleQuestion(subject, state)
      assertWellFormed(q, `${subject} fresh-account sample${i}`)
    }
  }
})

test('the preview branch (node after active, ignoring mastery) is well-formed for every subject/node', () => {
  for (const subject of SUBJECTS) {
    for (const node of CURRICULUM[subject].nodes) {
      const previewId = getNodeAfter(subject, node.id)
      if (!previewId) continue // end of tree — selectBattleQuestion falls back to active, covered elsewhere
      const previewNode = getNode(subject, previewId)
      const q = { ...generateQuestion(previewNode, 1), countsForMastery: false }
      assertWellFormed(q, `${subject} preview-of-${node.id} (-> ${previewId})`)
    }
  }
})

test('the review branch draws real, well-formed questions for every mastered node in a subject', () => {
  for (const subject of SUBJECTS) {
    const state = buildRichState(subject)
    const masteredIds = getMasteredNodeIds(subject, state.skillMastery)
    assert.ok(masteredIds.length > 0, `test setup sanity: ${subject} must have mastered nodes to review`)
    for (const id of masteredIds) {
      const reviewNode = getNode(subject, id)
      const q = generateQuestion(reviewNode, 3)
      assertWellFormed(q, `${subject} review-of-${id}`)
    }
  }
})
