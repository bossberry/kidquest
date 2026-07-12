// questionBank.test.js — regression test for SPEC GAME-B §B.4's boss-phase-2
// review-weight boost in selectBattleQuestion(). Statistically verifies the
// active/review/preview mix actually shifts, same "trace the selection
// weights" style as this project's other statistically-verified mixes.

import test from 'node:test'
import assert from 'node:assert/strict'
import { selectBattleQuestion } from '../questionBank.js'
import { getFirstNodeId, getNode, getNodeAfter } from '../curriculum.js'

const SUBJECT = 'thai'
const activeId   = getFirstNodeId(SUBJECT)
const nextNode   = getNode(SUBJECT, activeId)
const reviewId   = getNodeAfter(SUBJECT, activeId)   // the node right after active — mastered so it's the ONLY review candidate
const previewId  = getNodeAfter(SUBJECT, reviewId)   // the node after that — the preview target once active advances past reviewId

function buildState() {
  return {
    activeNodes: { [SUBJECT]: reviewId },   // active is now the node AFTER the mastered one
    skillMastery: {
      [activeId]: { attempts: Array(10).fill(1), ema: 0.99, mastered: true, masteredAt: 1 },
    },
  }
}

function sampleShares(n, opts) {
  const state = buildState()
  let active = 0, review = 0, preview = 0, other = 0
  for (let i = 0; i < n; i++) {
    const q = selectBattleQuestion(SUBJECT, state, opts)
    if (q.nodeId === reviewId) active++
    else if (q.nodeId === activeId) review++
    else if (q.nodeId === previewId) preview++
    else other++
  }
  return { active: active / n, review: review / n, preview: preview / n, other: other / n }
}

test('sanity: exactly one mastered node exists, so review always draws that same node', () => {
  const state = buildState()
  const q = selectBattleQuestion(SUBJECT, state, { reviewBoost: false })
  assert.ok(nextNode, 'curriculum must have a real first node to test against')
  assert.ok([reviewId, activeId, previewId].includes(q.nodeId))
})

test('normal mode: review draws roughly 20% of questions (0.70-0.90 band)', () => {
  const { review } = sampleShares(3000, { reviewBoost: false })
  assert.ok(review > 0.14 && review < 0.26, `expected ~20% review share, got ${(review * 100).toFixed(1)}%`)
})

test('boss phase 2 (reviewBoost): review draws roughly 50% of questions (0.40-0.90 band)', () => {
  const { review } = sampleShares(3000, { reviewBoost: true })
  assert.ok(review > 0.44 && review < 0.56, `expected ~50% review share, got ${(review * 100).toFixed(1)}%`)
})

test('reviewBoost measurably increases the review share vs normal mode (the actual acceptance criterion)', () => {
  const normal = sampleShares(3000, { reviewBoost: false })
  const boosted = sampleShares(3000, { reviewBoost: true })
  assert.ok(boosted.review > normal.review + 0.15,
    `expected boosted review share to clearly exceed normal (normal=${normal.review}, boosted=${boosted.review})`)
})

test('preview share is unaffected by reviewBoost (only the active/review split moves)', () => {
  const normal = sampleShares(3000, { reviewBoost: false })
  const boosted = sampleShares(3000, { reviewBoost: true })
  assert.ok(Math.abs(normal.preview - boosted.preview) < 0.05,
    `preview share should stay ~10% either way (normal=${normal.preview}, boosted=${boosted.preview})`)
})

test('omitting opts entirely defaults to normal (non-boosted) behavior', () => {
  const state = buildState()
  let review = 0
  const n = 2000
  for (let i = 0; i < n; i++) {
    const q = selectBattleQuestion(SUBJECT, state) // no 3rd arg at all
    if (q.nodeId === activeId) review++
  }
  const share = review / n
  assert.ok(share > 0.14 && share < 0.26, `expected ~20% review share with no opts, got ${(share * 100).toFixed(1)}%`)
})
