// ambientLife.test.js — regression tests for the SPEC GAME-B §B.3 pure logic
// (src/lib/ambientLife.js — tick()/spawn() only; draw() is canvas-only and
// exercised via the live app / harness, same convention as particles.js).

import test from 'node:test'
import assert from 'node:assert/strict'
import { ambientKindForTheme, spawnAmbientLife, tickOne, tickAmbientLife } from '../ambientLife.js'

test('ambientKindForTheme maps grassland/beach/snow to their kind, everything else to null', () => {
  assert.equal(ambientKindForTheme('grassland'), 'butterfly')
  assert.equal(ambientKindForTheme('beach'), 'seagull')
  assert.equal(ambientKindForTheme('snow'), 'snowgust')
  assert.equal(ambientKindForTheme('forest'), null)
  assert.equal(ambientKindForTheme('sky'), null)
})

test('spawnAmbientLife: no ambient life for themes without a mapped kind', () => {
  assert.deepEqual(spawnAmbientLife('forest', 400, 300, false, () => 0.5), [])
  assert.deepEqual(spawnAmbientLife('sky', 400, 300, false, () => 0.5), [])
})

test('spawnAmbientLife: lowFx halves (rounded up) the count without zeroing it', () => {
  const full = spawnAmbientLife('grassland', 400, 300, false, () => 0.5)
  const low = spawnAmbientLife('grassland', 400, 300, true, () => 0.5)
  assert.equal(full.length, 5)
  assert.equal(low.length, 3)
  assert.ok(low.length > 0, 'lowFx must reduce, never fully remove, ambient life')
})

test('tickOne wraps a butterfly/seagull/snowgust back onto the viewport instead of leaving it permanently', () => {
  const seagull = { kind: 'seagull', x: 399, y: 50, phase: 0, speed: 5 }
  let e = seagull
  for (let i = 0; i < 20; i++) e = tickOne(e, 2, 400, 300)
  assert.ok(e.x < 400 + 25, 'must have wrapped back near the left edge, not drifted off forever')
})

test('tickAmbientLife advances every entity in the list', () => {
  const list = [{ kind: 'butterfly', x: 10, y: 10, phase: 0, speed: 1 }, { kind: 'snowgust', x: 5, y: 5, phase: 0, speed: 1 }]
  const next = tickAmbientLife(list, 1, 400, 300)
  assert.equal(next.length, 2)
  assert.notDeepEqual(next[0], list[0])
})
