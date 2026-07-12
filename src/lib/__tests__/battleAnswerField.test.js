// battleAnswerField.test.js — regression test for a CRITICAL bug found during
// the 2026-07-12 urgent-bugfix session: Phase 1.1 (2026-07-09) introduced
// questionBank.js's generators, which return `correctAnswer` — but
// MoveSelectBattleMode.jsx / useBattleCombat.js (dating to 2026-06-04, the
// pre-Phase-1.1 battle engine) compared every tap/numpad-submit against
// `q.answer`, a field no generator has EVER set. Every world-battle answer,
// right or wrong, silently registered as a miss via fireMiss — since the
// day Phase 1.1 shipped. Also fixes a second layer of the same bug: numpad
// questions store correctAnswer as a STRING (`String(n)`) while
// NumpadInput.onSubmit passes a parsed INTEGER, so even a correctAnswer-vs-
// answer fix alone would still fail numpad questions via strict `===` on
// mismatched types.
//
// This guards BOTH: (1) a source-level grep confirming the battle engine
// files never reference `q.answer` again, and (2) a real data-shape check
// that `selectBattleQuestion`'s output is actually answerable the way the
// fixed comparison logic expects.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { selectBattleQuestion } from '../questionBank.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const combatSrc = readFileSync(join(__dirname, '../../hooks/useBattleCombat.js'), 'utf8')
const battleModeSrc = readFileSync(join(__dirname, '../../games/MoveSelectBattleMode.jsx'), 'utf8')

test('regression: useBattleCombat.js never references the dead q.answer field again', () => {
  assert.doesNotMatch(combatSrc, /q\?\.answer\b/)
  assert.doesNotMatch(combatSrc, /q\.answer\b/)
})

test('regression: MoveSelectBattleMode.jsx never references the dead q.answer field again', () => {
  assert.doesNotMatch(battleModeSrc, /q\?\.answer\b/)
  assert.doesNotMatch(battleModeSrc, /q\.answer\b/)
})

test('both battle engine files reference q.correctAnswer (the real field) at least once', () => {
  assert.match(combatSrc, /q\.correctAnswer|q\?\.correctAnswer/)
  assert.match(battleModeSrc, /q\.correctAnswer/)
})

const SUBJECTS = ['thai', 'math', 'eng']

test('every generated question has a defined correctAnswer', () => {
  const state = { skillMastery: {}, activeNodes: {} }
  for (const subject of SUBJECTS) {
    for (let i = 0; i < 40; i++) {
      const q = selectBattleQuestion(subject, state)
      assert.ok(q.correctAnswer !== undefined && q.correctAnswer !== null,
        `${subject} node ${q.nodeId} (${q.inputMode}) produced no correctAnswer`)
    }
  }
})

test('choice-mode questions: correctAnswer is always one of the offered choices (a real, tappable, winnable answer)', () => {
  const state = { skillMastery: {}, activeNodes: {} }
  let checked = 0
  for (const subject of SUBJECTS) {
    for (let i = 0; i < 60; i++) {
      const q = selectBattleQuestion(subject, state)
      if (q.inputMode !== 'choice' || !q.choices) continue
      checked++
      assert.ok(q.choices.includes(q.correctAnswer),
        `${subject} node ${q.nodeId}: correctAnswer "${q.correctAnswer}" not found in choices ${JSON.stringify(q.choices)}`)
    }
  }
  assert.ok(checked > 0, 'test setup sanity: must have actually sampled at least one choice-mode question')
})

test('numpad questions: correctAnswer parses to the same integer NumpadInput.onSubmit would send for a correct entry', () => {
  const state = { skillMastery: {}, activeNodes: {} }
  let checked = 0
  for (let i = 0; i < 80; i++) {
    const q = selectBattleQuestion('math', state)
    if (q.inputMode !== 'numpad') continue
    checked++
    // NumpadInput builds a digit string then calls parseInt(digits, 10) —
    // simulate a child typing the exact correct digits.
    const simulatedSubmit = parseInt(String(q.correctAnswer), 10)
    assert.equal(simulatedSubmit, Number(q.correctAnswer),
      `${q.nodeId}: correctAnswer "${q.correctAnswer}" doesn't round-trip through NumpadInput's parseInt`)
    assert.ok(!Number.isNaN(simulatedSubmit), `${q.nodeId}: correctAnswer "${q.correctAnswer}" is not numeric`)
  }
  assert.ok(checked > 0, 'test setup sanity: must have actually sampled at least one numpad question')
})
