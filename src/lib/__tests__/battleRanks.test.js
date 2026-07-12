// battleRanks.test.js — regression tests for the SPEC GAME-B §B.4 pure logic
// (src/lib/battleRanks.js). Runs on Node's built-in test runner, same
// convention as every other pure-logic suite in this project.

import test from 'node:test'
import assert from 'node:assert/strict'
import { computeBossRank, isBetterRank, RANK_ORDER, RANK_COPY, RANK_BONUS_COINS } from '../battleRanks.js'

test('computeBossRank: S requires perfect accuracy AND zero hints', () => {
  assert.equal(computeBossRank(1, 0), 'S')
  assert.equal(computeBossRank(1, 1), 'A', 'perfect accuracy but a hint used must NOT be S')
  assert.equal(computeBossRank(0.99, 0), 'A', 'not-quite-perfect accuracy must NOT be S even with no hints')
})

test('computeBossRank: A is >=80% accuracy regardless of hints (short of S)', () => {
  assert.equal(computeBossRank(0.8, 0), 'A')
  assert.equal(computeBossRank(0.9, 3), 'A')
  assert.equal(computeBossRank(0.79, 0), 'B', 'just under 80% must fall to B')
})

test('computeBossRank: B is the floor — always a valid rank, never null/undefined', () => {
  assert.equal(computeBossRank(0, 10), 'B')
  assert.equal(computeBossRank(0.5, 0), 'B')
  for (const acc of [0, 0.3, 0.79]) {
    for (const hints of [0, 1, 5]) {
      assert.ok(RANK_ORDER.includes(computeBossRank(acc, hints)))
    }
  }
})

test('isBetterRank: no previous rank always counts as an improvement', () => {
  assert.equal(isBetterRank('B', null), true)
  assert.equal(isBetterRank('B', undefined), true)
  assert.equal(isBetterRank('S', null), true)
})

test('isBetterRank: only a strictly higher rank on RANK_ORDER counts as better', () => {
  assert.equal(isBetterRank('A', 'B'), true)
  assert.equal(isBetterRank('S', 'A'), true)
  assert.equal(isBetterRank('B', 'A'), false, 'a worse rank must never overwrite a better stored one')
  assert.equal(isBetterRank('A', 'S'), false)
  assert.equal(isBetterRank('B', 'B'), false, 'an equal rank is not an improvement')
})

test('RANK_COPY: every rank has copy, and none of it reads as negative (no literal "แย่"/"ผิด" wording)', () => {
  for (const rank of RANK_ORDER) {
    assert.ok(RANK_COPY[rank] && RANK_COPY[rank].length > 0)
    assert.ok(!RANK_COPY[rank].includes('แย่'))
    assert.ok(!RANK_COPY[rank].includes('ผิด'))
  }
})

test('RANK_BONUS_COINS: only S grants a bonus', () => {
  assert.equal(RANK_BONUS_COINS.S, 10)
  assert.equal(RANK_BONUS_COINS.A, 0)
  assert.equal(RANK_BONUS_COINS.B, 0)
})
