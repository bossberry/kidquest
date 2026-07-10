// outfitSets.test.js — regression tests for the SPEC GAME-B §B.1 pure logic
// (src/lib/outfitSets.js). Runs on Node's built-in test runner, same
// convention as every other pure-logic suite in this project.

import test from 'node:test'
import assert from 'node:assert/strict'
import { OUTFIT_SETS, detectFullSet } from '../outfitSets.js'
import { COSMETIC_ITEMS } from '../../egg/eggCosmeticLayer.js'

test('sanity: exactly 6 outfit sets, each referencing real catalog ids', () => {
  assert.equal(OUTFIT_SETS.length, 6)
  const ids = new Set(COSMETIC_ITEMS.map(i => i.id))
  for (const set of OUTFIT_SETS) {
    assert.ok(ids.has(set.existingId), `${set.id}: existingId "${set.existingId}" not in COSMETIC_ITEMS`)
    assert.ok(ids.has(set.bodyId), `${set.id}: bodyId "${set.bodyId}" not in COSMETIC_ITEMS`)
    assert.ok(ids.has(set.backId), `${set.id}: backId "${set.backId}" not in COSMETIC_ITEMS`)
    const existingItem = COSMETIC_ITEMS.find(i => i.id === set.existingId)
    assert.equal(existingItem.slot, set.existingSlot, `${set.id}: existingId's real slot doesn't match existingSlot`)
    const bodyItem = COSMETIC_ITEMS.find(i => i.id === set.bodyId)
    assert.equal(bodyItem.slot, 'body', `${set.id}: bodyId must be a body-slot item`)
    const backItem = COSMETIC_ITEMS.find(i => i.id === set.backId)
    assert.equal(backItem.slot, 'back', `${set.id}: backId must be a back-slot item`)
  }
})

test('no existing head/face item is reused across two different sets', () => {
  const used = OUTFIT_SETS.map(s => `${s.existingSlot}:${s.existingId}`)
  assert.equal(new Set(used).size, used.length, 'expected all 6 existingSlot:existingId pairs to be distinct')
})

test('detectFullSet: each set is detected from its own exact combo', () => {
  for (const set of OUTFIT_SETS) {
    const equipped = { head: null, face: null, [set.existingSlot]: set.existingId, body: set.bodyId, back: set.backId }
    assert.equal(detectFullSet(equipped), set, `${set.id} not detected from its own combo`)
  }
})

test('detectFullSet: missing any one of the 3 pieces breaks detection', () => {
  const set = OUTFIT_SETS[0]
  const full = { [set.existingSlot]: set.existingId, body: set.bodyId, back: set.backId }
  assert.equal(detectFullSet({ ...full, body: null }), null, 'missing body should not detect')
  assert.equal(detectFullSet({ ...full, back: null }), null, 'missing back should not detect')
  assert.equal(detectFullSet({ ...full, [set.existingSlot]: null }), null, 'missing existing piece should not detect')
})

test('detectFullSet: a body+back match with the WRONG existing piece does not cross-detect another set', () => {
  // adventurer's body+back with hero's existing piece should match neither set.
  const adventurer = OUTFIT_SETS.find(s => s.id === 'adventurer')
  const hero = OUTFIT_SETS.find(s => s.id === 'hero')
  const mixed = { [hero.existingSlot]: hero.existingId, body: adventurer.bodyId, back: adventurer.backId }
  assert.equal(detectFullSet(mixed), null)
})

test('detectFullSet: null/undefined equipped never throws', () => {
  assert.equal(detectFullSet(null), null)
  assert.equal(detectFullSet(undefined), null)
  assert.equal(detectFullSet({}), null)
})

test('every set has a tint (hex color) and a real pose name', () => {
  for (const set of OUTFIT_SETS) {
    assert.match(set.tint, /^#[0-9a-f]{6}$/i, `${set.id}: tint should be a hex color`)
    assert.equal(typeof set.pose, 'string')
    assert.ok(set.pose.length > 0)
  }
})
