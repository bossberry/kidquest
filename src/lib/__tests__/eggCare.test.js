// eggCare.test.js — regression tests for the Phase A.1 Care Loop pure logic
// (src/lib/eggCare.js). Runs on Node's built-in test runner, same convention
// as every other pure-logic suite in this project (questionBank/placementTest/
// teachingMoments). Includes the spec's own literal acceptance test: a faked
// 26-hour lastCareTick gap must land hunger exactly at its floor, never below.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  computeCareTick, applyFeed, applyPetEgg, applyPlayTouch, defaultEggCare,
  HUNGER_FLOOR, HAPPINESS_FLOOR, HUNGER_DECAY_PER_HOUR, HAPPINESS_DECAY_PER_HOUR,
  COMEBACK_JOY_THRESHOLD_HOURS, TOUCH_HAPPINESS_CAP_PER_DAY, TOUCH_HAPPINESS_PER_INTERACTION,
  OVERFEED_HUNGER_THRESHOLD, FAVORITE_FOOD_MULTIPLIER, FOOD_CATALOG, FAVORITE_FOOD_BY_ELEMENT,
} from '../eggCare.js'

const HOUR = 3_600_000

// ── The spec's own acceptance test ───────────────────────────────────────────
test('regression (spec acceptance): a 26-hour closed gap floors hunger, never drops below', () => {
  const now = Date.now()
  const care = { ...defaultEggCare(), lastCareTick: now - 26 * HOUR }
  const after = computeCareTick(care, now)
  assert.equal(after.hunger, HUNGER_FLOOR, '26h × 4/hour = 104 decay from 100 -> would be -4 without the floor; must clamp to exactly the floor')
  assert.ok(after.hunger >= HUNGER_FLOOR, 'must never drop below the floor')
})

test('happiness decays proportionally and floors correctly on a longer gap', () => {
  const now = Date.now()
  // 26h: 100 - 26*2 = 48, should NOT hit the floor yet.
  const care26 = { ...defaultEggCare(), lastCareTick: now - 26 * HOUR }
  const after26 = computeCareTick(care26, now)
  assert.equal(Math.round(after26.happiness * 10) / 10, 48)
  assert.ok(after26.happiness > HAPPINESS_FLOOR)

  // 40h: 100 - 40*2 = 20 -> floored to 30.
  const care40 = { ...defaultEggCare(), lastCareTick: now - 40 * HOUR }
  const after40 = computeCareTick(care40, now)
  assert.equal(after40.happiness, HAPPINESS_FLOOR)
})

test('a zero-length gap (rapid re-tick, e.g. every 5 minutes while open) changes nothing but the timestamp', () => {
  const now = Date.now()
  const care = { ...defaultEggCare(), lastCareTick: now, hunger: 77, happiness: 63 }
  const after = computeCareTick(care, now)
  assert.equal(after.hunger, 77)
  assert.equal(after.happiness, 63)
  assert.equal(after.lastCareTick, now)
})

// ── Comeback joy ──────────────────────────────────────────────────────────────
test('pendingComebackJoy fires only past the threshold, and never on a brand-new account', () => {
  const now = Date.now()
  const justUnder = computeCareTick({ ...defaultEggCare(), lastCareTick: now - (COMEBACK_JOY_THRESHOLD_HOURS - 1) * HOUR }, now)
  assert.equal(justUnder.pendingComebackJoy, null)

  const atThreshold = computeCareTick({ ...defaultEggCare(), lastCareTick: now - COMEBACK_JOY_THRESHOLD_HOURS * HOUR }, now)
  assert.equal(atThreshold.pendingComebackJoy, true)

  // lastCareTick still 0 (a fresh account that has never ticked) must never
  // fire this, even though "elapsed since epoch" would look enormous.
  const fresh = computeCareTick({ ...defaultEggCare(), lastCareTick: 0 }, now)
  assert.equal(fresh.pendingComebackJoy, null)
})

test('pendingComebackJoy, once set, survives subsequent short-gap ticks until explicitly cleared', () => {
  const now = Date.now()
  let care = computeCareTick({ ...defaultEggCare(), lastCareTick: now - 30 * HOUR }, now)
  assert.equal(care.pendingComebackJoy, true)
  // A later, ordinary 5-minute tick must not silently clear it — only an
  // explicit CLEAR-type action (StateContext.jsx's reducer, not this file)
  // should ever reset it back to null.
  care = computeCareTick(care, now + 5 * 60_000)
  assert.equal(care.pendingComebackJoy, true)
})

// ── Zero-guilt guarantee ──────────────────────────────────────────────────────
// Checks only actual QUOTED STRING LITERALS (what could ever be displayed to
// the child), not code comments — a comment describing the guardrail itself
// (e.g. "the egg never gets sick") legitimately contains guilt-shaped WORDS
// while describing the opposite; only real string literals matter here. This
// file has no user-facing strings at all (pure logic, no UI copy) — this
// test exists mainly as a tripwire against a future edit accidentally adding
// one. The real, meaningful guilt-string sweep happens in Stage 4 across the
// UI files that actually contain child-facing Thai copy (Home.jsx etc).
test('no guilt/negative wording in any quoted string literal in the module source (design guardrail)', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(new URL('../eggCare.js', import.meta.url), 'utf8')
  // Strip comments FIRST — a doc-comment describing this very guardrail
  // (e.g. `// there is no "you neglected me" string in this file`) can
  // legitimately contain a quoted guilt-shaped phrase while explaining its
  // absence; only quoted literals in real code should ever be checked.
  const withoutComments = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  const stringLiterals = withoutComments.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g) || []
  const guiltPatterns = [/neglect/i, /forgot (about )?you/i, /you left me/i, /starv/i, /\bsick\b/i, /dying/i, /resent/i, /sad because you/i]
  for (const literal of stringLiterals) {
    for (const p of guiltPatterns) {
      assert.doesNotMatch(literal, p, `a string literal in eggCare.js matched guilt-shaped wording (${literal} vs ${p})`)
    }
  }
})

// ── Daily wake-up ─────────────────────────────────────────────────────────────
test('a new calendar day resets energy to 100 and grants exactly one food item, once', () => {
  const now = Date.now()
  const sleepy = { ...defaultEggCare(), energy: 12, lastSleptDate: '2020-1-1' } // long-past date, guaranteed "new day"
  const after = computeCareTick(sleepy, now)
  assert.equal(after.energy, 100)
  assert.ok(after.pendingWakeUp && FOOD_CATALOG[after.pendingWakeUp.grantedFood], 'must grant a real, valid food item')
  const grantedKey = after.pendingWakeUp.grantedFood
  assert.equal(after.foodInventory[grantedKey], sleepy.foodInventory[grantedKey] + 1)

  // Ticking again the SAME day must not grant a second gift or reset energy again.
  const again = computeCareTick({ ...after, energy: 40 }, now + 60_000)
  assert.equal(again.energy, 40, 'same-day tick must not force energy back to 100')
})

// ── Feeding ──────────────────────────────────────────────────────────────────
test('feeding increases hunger by the food value, clamped at 100, and adds a small happiness bump', () => {
  const care = { ...defaultEggCare(), hunger: 50, happiness: 50, foodInventory: { ...defaultEggCare().foodInventory, apple: 2 } }
  const { care: after, fed, isFavorite } = applyFeed(care, 'apple', 'shadow') // shadow's favorite is rice, not apple
  assert.equal(fed, true)
  assert.equal(isFavorite, false)
  assert.equal(after.hunger, 50 + FOOD_CATALOG.apple.hungerValue)
  assert.equal(after.happiness, 55)
  assert.equal(after.foodInventory.apple, 1, 'one unit of food consumed')
})

test('favorite food gives the 1.5x multiplier and a distinct favorite exists for every element with no collisions', () => {
  const favs = Object.values(FAVORITE_FOOD_BY_ELEMENT)
  assert.equal(new Set(favs).size, favs.length, 'every element must have a DIFFERENT favorite food (no collisions)')
  assert.equal(favs.length, 6)

  const care = { ...defaultEggCare(), hunger: 50, foodInventory: { ...defaultEggCare().foodInventory, apple: 1 } }
  const { care: after, isFavorite } = applyFeed(care, 'apple', 'nature') // nature's favorite IS apple
  assert.equal(isFavorite, true)
  assert.equal(after.hunger, 50 + FOOD_CATALOG.apple.hungerValue * FAVORITE_FOOD_MULTIPLIER)
})

test('overfeed guard blocks feeding at/above the threshold and does NOT consume food', () => {
  const care = { ...defaultEggCare(), hunger: OVERFEED_HUNGER_THRESHOLD, foodInventory: { ...defaultEggCare().foodInventory, apple: 3 } }
  const { care: after, fed, overfed } = applyFeed(care, 'apple', 'nature')
  assert.equal(fed, false)
  assert.equal(overfed, true)
  assert.equal(after.foodInventory.apple, 3, 'food must not be consumed when overfed-blocked')
  assert.equal(after.hunger, OVERFEED_HUNGER_THRESHOLD, 'hunger must not change either')
})

test('feeding a food the child has none of is a safe no-op', () => {
  const care = { ...defaultEggCare(), foodInventory: { ...defaultEggCare().foodInventory, cake: 0 } }
  const { fed } = applyFeed(care, 'cake', 'light')
  assert.equal(fed, false)
})

// ── Touch play ────────────────────────────────────────────────────────────────
test('touch play grants +2 happiness per interaction, capped at +20/day total', () => {
  let care = { ...defaultEggCare(), happiness: 50 }
  for (let i = 0; i < 15; i++) care = applyPetEgg(care).care // far more than needed to hit the cap
  assert.equal(care.happiness, 50 + TOUCH_HAPPINESS_CAP_PER_DAY)
  assert.equal(care.touchHappinessToday, TOUCH_HAPPINESS_CAP_PER_DAY)
})

test('the daily touch-happiness cap resets on a new calendar day', () => {
  const cappedYesterday = { ...defaultEggCare(), happiness: 50, touchHappinessToday: TOUCH_HAPPINESS_CAP_PER_DAY, lastTouchDate: '2020-1-1' }
  const { care } = applyPetEgg(cappedYesterday)
  assert.equal(care.happiness, 50 + TOUCH_HAPPINESS_PER_INTERACTION, 'a fresh day must allow touch happiness to accrue again')
})

// ── Energy / touch-play cost ──────────────────────────────────────────────────
test('applyPlayTouch consumes a small flat energy cost per interaction, clamped at 0', () => {
  let care = { ...defaultEggCare(), energy: 3 }
  care = applyPlayTouch(care).care
  care = applyPlayTouch(care).care
  care = applyPlayTouch(care).care
  care = applyPlayTouch(care).care // one more than remaining energy
  assert.equal(care.energy, 0, 'energy must clamp at 0, never go negative')
})
