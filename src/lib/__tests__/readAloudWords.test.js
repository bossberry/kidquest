// readAloudWords.test.js — regression tests for src/lib/readAloudWords.js.
// Runs on Node's built-in test runner.

import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRICULUM } from '../curriculum.js'
import { getReadAloudPool, pickReadAloudWords } from '../readAloudWords.js'

test('every thai/eng curriculum node resolves to a non-empty read-aloud pool', () => {
  for (const subject of ['thai', 'eng']) {
    for (const node of CURRICULUM[subject].nodes) {
      const pool = getReadAloudPool(subject, node.id)
      assert.ok(Array.isArray(pool) && pool.length > 0, `${node.id}: must have a non-empty pool (fallback included)`)
      for (const entry of pool) {
        assert.ok(entry.text, `${node.id}: every pool entry must have text`)
        assert.ok(entry.emoji, `${node.id}: every pool entry must have an emoji`)
      }
    }
  }
})

test('an unknown nodeId falls back to the subject-appropriate generic pool', () => {
  const thaiFallback = getReadAloudPool('thai', 'does_not_exist')
  const engFallback = getReadAloudPool('eng', 'does_not_exist')
  assert.ok(thaiFallback.length > 0)
  assert.ok(engFallback.length > 0)
  assert.notDeepEqual(thaiFallback, engFallback, 'thai and eng fallbacks must be different pools')
})

test('pickReadAloudWords always returns exactly `count` entries, even from a small pool', () => {
  // th_tones has a small pool (6 base sets) — must wrap around cleanly rather
  // than erroring or returning fewer than requested.
  const picked = pickReadAloudWords('thai', 'th_tones', 5)
  assert.equal(picked.length, 5)
  for (const p of picked) assert.ok(p.text)
})

test('pickReadAloudWords picks a genuinely random subset (not always the same order)', () => {
  const a = pickReadAloudWords('eng', 'eng_vocab_animals', 5).map(w => w.text).join(',')
  const b = pickReadAloudWords('eng', 'eng_vocab_animals', 5).map(w => w.text).join(',')
  // Not a hard guarantee (shuffles COULD coincidentally match), but across a
  // pool of 16 real animal words the odds of an identical shuffle twice in a
  // row are astronomically small — a reasonable sanity check that shuffling
  // is actually happening, not a fixed/deterministic order.
  let sameCount = 0
  for (let i = 0; i < 20; i++) {
    const x = pickReadAloudWords('eng', 'eng_vocab_animals', 5).map(w => w.text).join(',')
    if (x === a) sameCount++
  }
  assert.ok(sameCount < 20, 'expected at least some variation across 20 re-picks')
})
