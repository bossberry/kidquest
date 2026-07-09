// speech.test.js — regression tests for the pure parts of src/lib/speech.js
// (normalize/levenshteinDistance/similarity/classifyMatch/isSpeechAvailable).
// The actual browser SpeechRecognition wrapper (startListening/listenForPhrase)
// can't be tested without a real browser + microphone — see
// src/components/SpeechTestHarness.jsx (?speechtest=1) for real-device
// verification instead. Runs on Node's built-in test runner.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalize, levenshteinDistance, similarity, classifyMatch, isSpeechAvailable,
  isPermissionError, MATCH_CORRECT_THRESHOLD, MATCH_ALMOST_THRESHOLD,
} from '../speech.js'

test('isSpeechAvailable() is false in a non-browser environment (no window)', () => {
  assert.equal(isSpeechAvailable(), false)
})

test('normalize() strips Thai tone marks but preserves vowels (a real word change)', () => {
  // มา / ม่า / ม้า are the same base syllable at 3 different tones — a young
  // reader's imperfect tone shouldn't be penalized the same as a real miss.
  assert.equal(normalize('มา'), normalize('ม่า'))
  assert.equal(normalize('ม่า'), normalize('ม้า'))
  // มี is a genuinely different word (different vowel) — must NOT collapse to มา.
  assert.notEqual(normalize('มี'), normalize('มา'))
})

test('normalize() lowercases and strips punctuation, case, and extra whitespace', () => {
  assert.equal(normalize('Hello!'), normalize('  hello  '))
  assert.equal(normalize('Cat.'), 'cat')
})

test('levenshteinDistance() basic cases', () => {
  assert.equal(levenshteinDistance('cat', 'cat'), 0)
  assert.equal(levenshteinDistance('cat', 'cats'), 1)
  assert.equal(levenshteinDistance('cat', 'dog'), 3)
  assert.equal(levenshteinDistance('', 'abc'), 3)
  assert.equal(levenshteinDistance('abc', ''), 3)
})

test('similarity() returns 1 for identical (post-normalization) text, 0 for one empty side', () => {
  assert.equal(similarity('cat', 'cat'), 1)
  assert.equal(similarity('CAT!', 'cat'), 1, 'case/punctuation must not affect an otherwise-identical match')
  assert.equal(similarity('', ''), 1, 'both empty is a degenerate identical case')
  assert.equal(similarity('cat', ''), 0)
  assert.equal(similarity('', 'cat'), 0)
})

test('similarity() reflects small edits proportionally', () => {
  const close = similarity('cat', 'cet') // 1-char substitution out of 3
  assert.ok(close > 0.6 && close < 1, `expected a high-but-not-perfect score for a 1-char typo, got ${close}`)
  const far = similarity('cat', 'elephant')
  assert.ok(far < 0.3, `expected a low score for very different words, got ${far}`)
})

test('classifyMatch() applies the spec thresholds with inclusive boundaries', () => {
  assert.equal(classifyMatch(1), 'correct')
  assert.equal(classifyMatch(MATCH_CORRECT_THRESHOLD), 'correct', 'boundary 0.7 must count as correct')
  assert.equal(classifyMatch(0.69), 'almost')
  assert.equal(classifyMatch(MATCH_ALMOST_THRESHOLD), 'almost', 'boundary 0.4 must count as almost')
  assert.equal(classifyMatch(0.39), 'incorrect')
  assert.equal(classifyMatch(0), 'incorrect')
})

// isPermissionError() — the iOS-Safari-specific edge case found during this
// session's own review: SpeechRecognition can be present (isSpeechAvailable()
// true) while actually failing every time due to permission/hardware/service
// issues. ReadAloud.jsx uses this to distinguish "the child mispronounced it"
// from "recognition can never work here" and falls back to listening mode
// only for the latter — never for a normal no-speech/aborted hiccup, which is
// just worth a plain retry.
test('isPermissionError() identifies permission/hardware/service failures, not ordinary recognition misses', () => {
  assert.equal(isPermissionError('not-allowed'), true)
  assert.equal(isPermissionError('service-not-allowed'), true)
  assert.equal(isPermissionError('audio-capture'), true)
  assert.equal(isPermissionError('no-speech'), false, 'a plain "didn\'t catch anything" must NOT trigger a permanent fallback')
  assert.equal(isPermissionError('aborted'), false)
  assert.equal(isPermissionError('network'), false)
  assert.equal(isPermissionError(null), false)
  assert.equal(isPermissionError(undefined), false)
})
