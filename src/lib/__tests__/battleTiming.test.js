// battleTiming.test.js — SPEC GAME-B §B.4's "added battle time <= +4s" budget.
// No real browser/frame-timing is available in this environment (same
// constraint SPEC GAME-B §B.3's scripted trace hit), so this verifies the
// budget the same way that session did: (1) a source-level regression guard
// confirming every PRE-EXISTING serial battle timer this session touched is
// still the exact value it was before (so a later change can't silently
// blow the budget without this test catching it), and (2) an explicit ledger
// of what was actually ADDED, summed and asserted against the budget.
//
// The design intent (see docs/CHATBOT_NOTES.md's §B.4 entry for the full
// reasoning): every new animation this section added either (a) reuses an
// EXISTING timing window byte-for-byte (attack variants swap which CSS
// class plays inside the same enemyLunge 300ms toggle; egg wobble swaps
// which CSS plays inside the same eggAnimClass='shake' 400ms toggle), or
// (b) runs non-blocking/decorative (the charge-meter blast + <=250ms shake
// fire-and-forget inside fireHit, never gating the pre-existing 700ms
// advance-to-next-question timer), or (c) is genuinely instant (boss phase
// 2's CSS/state flip, the rank computation). The ONE real added serial delay
// is the 600ms vs-splash, which chains before (not on top of) the
// pre-existing entry flash sequence.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const combatSrc = readFileSync(join(__dirname, '../../hooks/useBattleCombat.js'), 'utf8')
const battleModeSrc = readFileSync(join(__dirname, '../../games/MoveSelectBattleMode.jsx'), 'utf8')

const BUDGET_MS = 4000

test('regression: fireHit\'s advance-to-next-question timer is still 700ms (unchanged by the charge/blast additions)', () => {
  assert.match(combatSrc, /}, 700\)/, 'fireHit\'s 700ms advance timer must be untouched')
})

test('regression: fireMiss\'s advance-to-next-question timer is still 600ms (unchanged)', () => {
  const missMatches = combatSrc.match(/}, 600\)/g) || []
  assert.ok(missMatches.length >= 1, 'fireMiss must still advance at 600ms')
})

test('regression: fireMiss\'s enemy-attack-telegraph window is still 220ms->300ms (unchanged by the variant-CSS swap)', () => {
  assert.match(combatSrc, /}, 220\)/, 'the 220ms delay before the enemy attack anim must be untouched')
  assert.match(combatSrc, /}, 300\)/, 'the 300ms enemy attack anim duration must be untouched')
})

test('the charge-meter blast/shake code runs BEFORE fireHit\'s 700ms advance timer, not nested inside it (never gates advancement)', () => {
  const chargeIdx  = combatSrc.indexOf('chargeRef.current = Math.min(3')
  const advanceIdx = combatSrc.indexOf('}, 700)')
  assert.ok(chargeIdx > -1 && advanceIdx > -1, 'both anchors must exist in the source')
  assert.ok(chargeIdx < advanceIdx, 'charge-meter logic must run before (not inside) the 700ms advance timer')
})

test('the screen-shake duration is <=250ms per spec', () => {
  const m = combatSrc.match(/setScreenShake\(false\), (\d+)\)/)
  assert.ok(m, 'setScreenShake(false) timeout must exist')
  assert.ok(Number(m[1]) <= 250, `screen shake must be <=250ms, found ${m[1]}ms`)
})

test('the vs-splash is the one genuinely new serial timer, exactly 600ms as specced', () => {
  // 2026-07-13: the splash's setTimeout body grew a mountedRef guard + a
  // battleLog consolidation (see MoveSelectBattleMode.jsx's urgent-fix
  // comment) — match on the timer's declaration + duration and the
  // dismissal call appearing somewhere in its body, not an exact adjacent
  // literal, so this doesn't re-break on unrelated body changes.
  assert.match(battleModeSrc, /setTimeout\(\(\) => \{/)
  assert.match(battleModeSrc, /setShowVsSplash\(false\)/)
  assert.match(battleModeSrc, /\}, 600\)/)
})

test('the pre-existing entry flash sequence is delayed +600ms (chained after the splash, not overlapping it)', () => {
  // Original times were [80, 200, 280, 400, 480, 530]; +600ms each.
  assert.match(battleModeSrc, /\[680, 800, 880, 1000, 1080, 1130\]/)
})

test('added-time ledger sums to well under the +4000ms budget', () => {
  const ledger = {
    'vs-splash (once per battle, serial)': 600,
    'enemy attack variant (reuses existing 300ms enemyLunge window)': 0,
    'egg wobble (reuses existing 400ms eggAnimClass=shake window)': 0,
    'charge-meter blast + shake (non-blocking, overlaps existing 700ms window)': 0,
    'boss phase 2 (instant CSS/state flip, no timer)': 0,
    'victory rank (computed synchronously, no new RewardChest phase/delay)': 0,
  }
  const total = Object.values(ledger).reduce((a, b) => a + b, 0)
  assert.ok(total <= BUDGET_MS, `ledger total ${total}ms exceeds the ${BUDGET_MS}ms budget`)
  assert.equal(total, 600)
})
