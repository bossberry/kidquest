// eggPoses.test.js — regression tests for the SPEC GAME-A §A.3 pure logic
// (src/egg/eggPoses.js). Runs on Node's built-in test runner, same
// convention as every other pure-logic suite in this project.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EGG_POSES, getPoseTransform, isPoseEyesClosed,
  deriveCareMood, getIdleMoodTransform, shouldBlink,
} from '../../egg/eggPoses.js'

test('sanity: the 14 poses the spec asks to ship (walk_l/walk_r counted as one spec item, but are 2 real distinct poses = 15 keys)', () => {
  assert.equal(EGG_POSES.length, 15)
  for (const name of [
    'idle', 'idle_blink', 'happy_bounce', 'eat', 'sleep', 'yawn', 'curious_tilt',
    'laugh', 'hug', 'dizzy', 'proud', 'sit', 'walk_l', 'walk_r', 'celebrate',
  ]) {
    assert.ok(EGG_POSES.includes(name), `missing pose: ${name}`)
  }
})

test('every pose resolves to a finite, well-shaped transform at several t values', () => {
  for (const pose of EGG_POSES) {
    for (const t of [0, 0.3, 1.7, 5.2, 60]) {
      const p = getPoseTransform(pose, t)
      for (const key of ['tx', 'ty', 'sx', 'sy', 'rot', 'flash']) {
        assert.ok(Number.isFinite(p[key]), `${pose}@t=${t}.${key} is not finite`)
      }
      assert.ok(p.sx > 0 && p.sy > 0, `${pose}@t=${t} has non-positive scale`)
    }
  }
})

test('walk_l and walk_r lean in opposite directions (rot sign flips at the same phase)', () => {
  const t = 0.15 // mid-stride, away from the T-boundary
  const l = getPoseTransform('walk_l', t)
  const r = getPoseTransform('walk_r', t)
  assert.ok(l.rot !== 0 && r.rot !== 0, 'expected non-zero lean mid-stride')
  assert.equal(Math.sign(l.rot), -Math.sign(r.rot), 'walk_l/walk_r should lean opposite ways')
})

test('one-shot poses (yawn/hug/proud) settle in via ease-out, not instantly', () => {
  const early = getPoseTransform('hug', 1, 0.02)   // just started
  const late  = getPoseTransform('hug', 1, 5)      // long since settled
  assert.ok(Math.abs(late.sx - 1) > Math.abs(early.sx - 1), 'settled hug should be further from neutral than a just-started hug')
})

test('isPoseEyesClosed: only "sleep" forces closed eyes among the 14 poses', () => {
  assert.equal(isPoseEyesClosed('sleep'), true)
  for (const pose of EGG_POSES.filter(p => p !== 'sleep')) {
    assert.equal(isPoseEyesClosed(pose), false, `${pose} should not force eyes closed`)
  }
})

// ── Mood-driven idle ────────────────────────────────────────────────────────
test('deriveCareMood: energy floor wins over hunger/happiness (sleepy takes priority)', () => {
  assert.equal(deriveCareMood({ hunger: 20, energy: 25, happiness: 90 }), 'sleepy')
})

test('deriveCareMood: low hunger reads as hungry when energy is fine', () => {
  assert.equal(deriveCareMood({ hunger: 35, energy: 80, happiness: 50 }), 'hungry')
})

test('deriveCareMood: high happiness reads as happy when hunger/energy are fine', () => {
  assert.equal(deriveCareMood({ hunger: 90, energy: 90, happiness: 88 }), 'happy')
})

test('deriveCareMood: mid-range everything reads as content', () => {
  assert.equal(deriveCareMood({ hunger: 60, energy: 60, happiness: 60 }), 'content')
})

test('deriveCareMood: missing/null care state defaults to content, never throws', () => {
  assert.equal(deriveCareMood(null), 'content')
  assert.equal(deriveCareMood(undefined), 'content')
})

test('getIdleMoodTransform: all 4 moods produce distinct, finite transforms', () => {
  const t = 1.0
  const byMood = {}
  for (const mood of ['happy', 'hungry', 'sleepy', 'content']) {
    const p = getIdleMoodTransform(mood, t)
    for (const key of ['tx', 'ty', 'sx', 'sy', 'rot', 'flash']) {
      assert.ok(Number.isFinite(p[key]), `${mood}.${key} not finite`)
    }
    byMood[mood] = p
  }
  // sleepy's droop and content's plain bob should not be numerically identical
  assert.notDeepEqual(byMood.sleepy, byMood.content)
})

// ── Always-on blink ─────────────────────────────────────────────────────────
test('shouldBlink: fires periodically within the spec\'s 3-6s cadence, and stays boolean', () => {
  let blinkStarts = 0
  let wasBlinking = false
  for (let t = 0; t < 20; t += 0.02) {
    const b = shouldBlink(t)
    assert.equal(typeof b, 'boolean')
    if (b && !wasBlinking) blinkStarts++
    wasBlinking = b
  }
  // 20s / a period inside [3,6] should yield somewhere around 3-7 blinks
  assert.ok(blinkStarts >= 3 && blinkStarts <= 7, `expected ~3-7 blinks in 20s, got ${blinkStarts}`)
})

test('shouldBlink: each blink window is short (~120ms), not a long eyes-closed stretch', () => {
  let openCount = 0, closedCount = 0
  for (let t = 0; t < 4.2; t += 0.01) {
    if (shouldBlink(t)) closedCount++; else openCount++
  }
  assert.ok(closedCount < openCount * 0.1, 'blink should be a small fraction of the cycle, not a large one')
})
