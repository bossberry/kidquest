// eggCare.js — Phase A.1 "Care Loop" (feeding, energy, happiness). Pure logic
// only (no React/reducer code) — same pattern as questionBank.js/
// placementTest.js/teachingMoments.js, kept out of the JSX reducer so it can
// be traced/tested under `node --test` directly (the exact gap this
// project's own §1.1 mastery-bookkeeping had before being retrofitted).
//
// eggAlgorithm.js is LOCKED and untouched by anything here — this file only
// ever produces numbers/flags; drawing is a separate concern.
//
// ── DESIGN GUARDRAILS (hard requirements, not suggestions) ───────────────────
// Meters (hunger/energy/happiness) are NEVER shown to the child as numbers or
// bars — mood is expressed only through the egg's own animation/expression
// (wired in Home.jsx). The egg never gets sick, never "dies", never blames
// the child. hunger/happiness have hard FLOORS (never drop below, no matter
// how long the app stays closed) — see HUNGER_FLOOR/HAPPINESS_FLOOR below.
// Returning after a long absence produces ONLY a joy/reunion signal
// (pendingComebackJoy), never a guilt/scolding message — there is no
// "you neglected me" string anywhere in this file, by design.
import { todayStr } from '../config/gameConfig.js'

export const HUNGER_DECAY_PER_HOUR = 4
export const HUNGER_FLOOR = 20
export const HAPPINESS_DECAY_PER_HOUR = 2
export const HAPPINESS_FLOOR = 30
// "Days away" per the spec's guardrail wording — set at 24h (not the shorter
// 4h threshold the pre-existing, unrelated ambient "reunion" burst in
// useHomeAmbience.js already uses for any welcome-back moment). This eggCare-
// specific signal is reserved for genuinely long absences, matching how far
// the care meters would actually have decayed — see the handoff for why this
// is additive to, not a replacement for, the existing shorter-gap reunion.
export const COMEBACK_JOY_THRESHOLD_HOURS = 24
export const TOUCH_HAPPINESS_CAP_PER_DAY = 20
export const TOUCH_HAPPINESS_PER_INTERACTION = 2
export const OVERFEED_HUNGER_THRESHOLD = 95
export const FAVORITE_FOOD_MULTIPLIER = 1.5

// Food catalog — prices/values per the spec, hungerValue spread 15-40 roughly
// scaled with price. Also earned (not just bought): battle-win drops, wake-up
// gifts (see computeCareTick) — those add directly to foodInventory counts
// elsewhere, this catalog is just the shared reference data.
export const FOOD_CATALOG = {
  apple:  { nameTh: 'แอปเปิ้ล', emoji: '🍎', price: 5,  hungerValue: 15 },
  milk:   { nameTh: 'นม',       emoji: '🥛', price: 8,  hungerValue: 20 },
  rice:   { nameTh: 'ข้าว',     emoji: '🍚', price: 8,  hungerValue: 20 },
  cookie: { nameTh: 'คุกกี้',   emoji: '🍪', price: 12, hungerValue: 25 },
  sushi:  { nameTh: 'ซูชิ',     emoji: '🍣', price: 20, hungerValue: 35 },
  cake:   { nameTh: 'เค้ก',     emoji: '🍰', price: 30, hungerValue: 40 },
}

// Favorite food per element — TERMINOLOGY CORRECTION from the spec's literal
// list (fire/water/grass/electric/ice/ghost), which does not match any real
// element this codebase produces. The actual companion elements (see
// src/context/CompanionContext.jsx's DEFAULTS + src/lib/creatureSystem.js's
// determineElement/ELEMENT_MAP) are: fire, water, thunder, nature, shadow,
// light — 6 elements, conveniently still matching the spec's "6 favorites"
// count, just remapped onto the real set with no two elements sharing a food
// (the spec's original list had water AND ice both mapping to milk):
//   fire → cookie (kept, closest spec analogue)
//   water → milk (kept, exact spec match)
//   thunder → sushi (spec's electric → sushi, thunder ≈ electric)
//   nature → apple (spec's grass → apple, nature ≈ grass)
//   light → cake (spec's ghost → cake reassigned — bright/celebratory treat)
//   shadow → rice (the one food left over, completing a clean 1:1 mapping)
export const FAVORITE_FOOD_BY_ELEMENT = {
  fire: 'cookie', water: 'milk', thunder: 'sushi',
  nature: 'apple', light: 'cake', shadow: 'rice',
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

export function defaultEggCare() {
  return {
    hunger: 100, energy: 100, happiness: 100,
    lastCareTick: 0,
    foodInventory: { apple: 3, rice: 1, cookie: 0, milk: 2, cake: 0, sushi: 0 },
    lastSleptDate: '',
    // Implementation-necessary additions beyond the spec's literal state
    // shape (documented, not silently invented): touchHappinessToday/
    // lastTouchDate implement the spec's explicit "+2/day cap" for touch
    // play, which requires SOME daily counter to enforce. pendingWakeUp/
    // pendingComebackJoy are one-shot UI events, same convention as this
    // project's existing pendingNodeMastery/pendingEvoNotice/pendingLevelUp.
    touchHappinessToday: 0,
    lastTouchDate: '',
    pendingWakeUp: null,
    pendingComebackJoy: null,
  }
}

// ── Tick: decay + daily wake-up + comeback-joy detection ────────────────────
//
// hunger/happiness decay from REAL ELAPSED WALL-CLOCK TIME since lastCareTick
// — this is what makes the spec's "decays while app CLOSED" requirement work
// correctly: the same formula applies whether TICK_CARE fires from a 5-minute
// mount interval or from reopening after days away, since both are just
// "how much real time passed since the last tick." Floors clamp both, so a
// long gap NEVER drops below the floor (the spec's own acceptance test: a
// faked 26h gap must land hunger exactly at the floor, not below).
//
// energy is DELIBERATELY NOT part of this wall-clock formula — per the
// spec's own wording ("decays 6/hour during PLAY time only"), energy is
// consumed by ACTIVE touch-play interactions (see applyPlayTouch below), not
// by time passing while the app is closed or even just sitting open and
// idle. This is a judgment call on a genuinely ambiguous spec point — flagged
// in the handoff — but keeps energy strictly tied to genuine activity rather
// than needing a fragile foreground/background wall-clock tracker this
// codebase has no existing mechanism for.
//
// The "morning wake-up" (energy reset to 100 + a small food gift) uses the
// same todayStr()-calendar-day-rollover convention already established
// throughout this codebase (daily login streak, minigame lives, daily quest
// resets) rather than literally tracking the 19:30/07:00 clock-hour
// boundaries the spec's prose describes — simpler, consistent with existing
// patterns, and delivers the same "wake up once each morning" experience.
export function computeCareTick(care, nowMs) {
  const c = { ...care }
  const last = c.lastCareTick || nowMs
  const elapsedHours = Math.max(0, (nowMs - last) / 3_600_000)

  const hunger = clamp(c.hunger - elapsedHours * HUNGER_DECAY_PER_HOUR, HUNGER_FLOOR, 100)
  const happiness = clamp(c.happiness - elapsedHours * HAPPINESS_DECAY_PER_HOUR, HAPPINESS_FLOOR, 100)

  // Comeback joy: only ever set true here, never cleared here — a UI-driven
  // CLEAR action is what resets it after the joy scene has actually shown
  // (same one-shot pattern as pendingNodeMastery elsewhere in this codebase).
  // Guarded on lastCareTick > 0 so a brand-new account (lastCareTick still 0,
  // "elapsed" would otherwise be huge relative to epoch) never fires this on
  // its very first tick.
  const comebackJoy = c.lastCareTick > 0 && elapsedHours >= COMEBACK_JOY_THRESHOLD_HOURS

  const today = todayStr()
  let energy = c.energy
  let lastSleptDate = c.lastSleptDate
  let foodInventory = c.foodInventory
  let wokeUp = null
  if (c.lastSleptDate !== today) {
    energy = 100
    lastSleptDate = today
    const foodKeys = Object.keys(FOOD_CATALOG)
    const grantedFood = foodKeys[Math.floor(Math.random() * foodKeys.length)]
    foodInventory = { ...c.foodInventory, [grantedFood]: (c.foodInventory[grantedFood] || 0) + 1 }
    wokeUp = { grantedFood }
  }

  return {
    ...c,
    hunger, happiness, energy, lastSleptDate, foodInventory,
    lastCareTick: nowMs,
    pendingWakeUp: wokeUp || c.pendingWakeUp || null,
    pendingComebackJoy: (comebackJoy || c.pendingComebackJoy) ? true : null,
  }
}

// ── Feeding ──────────────────────────────────────────────────────────────────
// Returns { care, isFavorite, overfed, fed }. `fed` is false (no-op, no state
// change) when there's no food of that kind left, or when the overfeed guard
// blocks it — callers should only stamp lastSavedAt / play chomp animation
// when `fed` is true.
export function applyFeed(care, foodKey, element) {
  const food = FOOD_CATALOG[foodKey]
  if (!food) return { care, isFavorite: false, overfed: false, fed: false }
  if ((care.foodInventory?.[foodKey] || 0) <= 0) return { care, isFavorite: false, overfed: false, fed: false }
  if (care.hunger >= OVERFEED_HUNGER_THRESHOLD) return { care, isFavorite: false, overfed: true, fed: false }

  const isFavorite = FAVORITE_FOOD_BY_ELEMENT[element] === foodKey
  const value = food.hungerValue * (isFavorite ? FAVORITE_FOOD_MULTIPLIER : 1)
  return {
    care: {
      ...care,
      hunger: clamp(care.hunger + value, 0, 100),
      happiness: clamp(care.happiness + 5, 0, 100),
      foodInventory: { ...care.foodInventory, [foodKey]: care.foodInventory[foodKey] - 1 },
    },
    isFavorite, overfed: false, fed: true,
  }
}

// ── Touch play ────────────────────────────────────────────────────────────────
// Every gesture (poke/stroke/tickle/hold/shake) routes through this one
// function — happiness +2 per interaction, capped at +20/day total from
// touch (spec-explicit cap). Resets the daily counter on a new calendar day.
export function applyPetEgg(care) {
  const today = todayStr()
  const sameDay = care.lastTouchDate === today
  const touchHappinessToday = sameDay ? care.touchHappinessToday : 0
  if (touchHappinessToday >= TOUCH_HAPPINESS_CAP_PER_DAY) {
    return { care: { ...care, lastTouchDate: today, touchHappinessToday } }
  }
  const grant = Math.min(TOUCH_HAPPINESS_PER_INTERACTION, TOUCH_HAPPINESS_CAP_PER_DAY - touchHappinessToday)
  return {
    care: {
      ...care,
      happiness: clamp(care.happiness + grant, 0, 100),
      touchHappinessToday: touchHappinessToday + grant,
      lastTouchDate: today,
    },
  }
}

// ── Touch-play energy cost ───────────────────────────────────────────────────
// "decays 6/hour during PLAY time only" (see computeCareTick's comment for
// why this isn't wall-clock-based): modeled as a small flat cost per genuine
// touch-play interaction, so passive/closed time never touches energy — only
// actual play does. energy has no explicit floor in the spec (only hunger/
// happiness are given floors under "Design guardrails") — clamped to a bare
// [0,100] technical bound; a depleted egg is simply sleepy (mood-idle
// territory, not a punishing state) — never sick/distressed, per the same
// guardrail that governs hunger/happiness.
export const ENERGY_COST_PER_TOUCH_PLAY = 1

export function applyPlayTouch(care) {
  return { care: { ...care, energy: clamp(care.energy - ENERGY_COST_PER_TOUCH_PLAY, 0, 100) } }
}
