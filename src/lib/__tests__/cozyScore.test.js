// cozyScore.test.js — regression tests for the SPEC GAME-B §B.2 pure logic
// (src/lib/cozyScore.js). Runs on Node's built-in test runner, same
// convention as every other pure-logic suite in this project.

import test from 'node:test'
import assert from 'node:assert/strict'
import { computeCozy, cozyParticleDensity, deriveCozyComment } from '../cozyScore.js'

test('computeCozy: an empty layout scores 0 with every signal false', () => {
  const cozy = computeCozy({})
  assert.equal(cozy.score, 0)
  assert.equal(cozy.distinctCount, 0)
  assert.equal(cozy.hasLight, false)
  assert.equal(cozy.hasSoft, false)
  assert.equal(cozy.hasPlant, false)
  assert.equal(cozy.wallBalance, false)
})

test('computeCozy: null/undefined layout is a safe no-op (never throws)', () => {
  assert.equal(computeCozy(null).score, 0)
  assert.equal(computeCozy(undefined).score, 0)
})

test('computeCozy: additive only — adding more furniture never lowers the score', () => {
  const base = computeCozy({ floor_0_0: 'desk' })
  const more = computeCozy({ floor_0_0: 'desk', floor_1_0: 'toy_chest', floor_2_0: 'bookshelf' })
  assert.ok(more.score >= base.score, 'adding furniture must never decrease the score')
})

test('computeCozy: light/soft/plant signals each fire from their real item ids', () => {
  assert.equal(computeCozy({ floor_0_0: 'lamp' }).hasLight, true)
  assert.equal(computeCozy({ floor_0_0: 'rug' }).hasSoft, true)
  assert.equal(computeCozy({ floor_0_0: 'bed' }).hasSoft, true)
  assert.equal(computeCozy({ floor_0_0: 'plant' }).hasPlant, true)
  // an item that isn't in any of the 3 curated sets triggers none of them
  const none = computeCozy({ floor_0_0: 'desk' })
  assert.equal(none.hasLight, false)
  assert.equal(none.hasSoft, false)
  assert.equal(none.hasPlant, false)
})

test('computeCozy: wall balance requires BOTH walls decorated, not just one', () => {
  assert.equal(computeCozy({ left_wall_0_1: 'fairy_lights' }).wallBalance, false)
  assert.equal(computeCozy({ right_wall_0_1: 'trophy' }).wallBalance, false)
  assert.equal(computeCozy({ left_wall_0_1: 'fairy_lights', right_wall_0_1: 'trophy' }).wallBalance, true)
})

test('computeCozy: variety caps at 8 distinct items (40 of the 100 max points)', () => {
  const eightPlus = {}
  const ids = ['desk', 'toy_chest', 'bookshelf', 'wall_art', 'stuffed_animal', 'window_curtain', 'small_chair', 'mirror_round', 'chalkboard']
  ids.forEach((id, i) => { eightPlus[`floor_${i}_0`] = id })
  const cozy = computeCozy(eightPlus)
  assert.equal(Math.min(cozy.distinctCount, 8) * 5, 40)
})

test('computeCozy: a fully decorated room can reach the max score of 100', () => {
  const cozy = computeCozy({
    floor_0_0: 'lamp', floor_1_0: 'rug', floor_2_0: 'plant', floor_3_0: 'desk',
    floor_4_0: 'bookshelf', floor_5_0: 'toy_chest', floor_0_1: 'wall_art', floor_1_1: 'mirror_round',
    left_wall_0_1: 'fairy_lights', right_wall_0_1: 'trophy',
  })
  assert.equal(cozy.score, 100)
})

test('cozyParticleDensity: tiers match the documented score thresholds', () => {
  assert.equal(cozyParticleDensity({ score: 0 }), 0)
  assert.equal(cozyParticleDensity({ score: 14 }), 0)
  assert.equal(cozyParticleDensity({ score: 15 }), 1)
  assert.equal(cozyParticleDensity({ score: 39 }), 1)
  assert.equal(cozyParticleDensity({ score: 40 }), 2)
  assert.equal(cozyParticleDensity({ score: 69 }), 2)
  assert.equal(cozyParticleDensity({ score: 70 }), 3)
  assert.equal(cozyParticleDensity({ score: 100 }), 3)
})

test('cozyParticleDensity: missing/null cozy is a safe no-op', () => {
  assert.equal(cozyParticleDensity(null), 0)
  assert.equal(cozyParticleDensity(undefined), 0)
})

test('deriveCozyComment: only comments once the room is cozy enough (score >= 40)', () => {
  assert.equal(deriveCozyComment({ score: 39 }), null)
  assert.equal(typeof deriveCozyComment({ score: 40 }), 'string')
  assert.equal(typeof deriveCozyComment({ score: 100 }), 'string')
})

test('deriveCozyComment: never returns a number or references the score itself', () => {
  const comment = deriveCozyComment({ score: 100 })
  assert.equal(/\d/.test(comment), false, 'a cozy comment must never contain a digit (no numeric feedback to the child)')
})
