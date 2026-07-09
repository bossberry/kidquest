// speech.js — Phase 1.4 Speaking & Reading-Aloud Mode: a thin wrapper over the
// browser's Web Speech API (SpeechRecognition), plus pure text-similarity
// logic that's testable without a browser.
//
// PRIVACY: recognition runs entirely inside the browser's own built-in speech
// API (the same one iOS/Android/Chrome already ship for dictation elsewhere).
// This file never records, stores, or transmits raw audio anywhere — it only
// ever reads the short text transcript the browser's own API returns, compares
// it to the expected word/sentence locally, and discards it. Nothing is
// uploaded to any KidQuest server. See CURRENT_STATE.md's "Speaking &
// Reading-Aloud" entry for the parent-facing version of this note.

// ── Feature detection ────────────────────────────────────────────────────────

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechAvailable() {
  return !!getRecognitionCtor()
}

// ── Pure text normalization + similarity (no browser needed — testable) ─────

// Thai tone marks only (ไม้เอก/โท/ตรี/จัตวา, U+0E48-U+0E4B) — deliberately NOT
// stripping other Thai diacritics/vowel marks, since those change the word's
// actual identity (a mismatched vowel is a real miss, not just an accent
// difference the way a slightly-off tone can be for a young reader).
const THAI_TONE_MARKS = /[่-๋]/g

export function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(THAI_TONE_MARKS, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '') // strip punctuation, keep letters/numbers/spaces (unicode-aware)
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshteinDistance(a, b) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // deletion
        dp[i][j - 1] + 1,     // insertion
        dp[i - 1][j - 1] + cost, // substitution
      )
    }
  }
  return dp[m][n]
}

// Normalized similarity ratio in [0, 1] — 1 = identical (after normalization),
// 0 = completely different. `1 - distance / maxLength`, the standard
// Levenshtein-ratio formula.
export function similarity(heard, expected) {
  const a = normalize(heard), b = normalize(expected)
  if (!a && !b) return 1
  if (!a || !b) return 0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return Math.max(0, 1 - levenshteinDistance(a, b) / maxLen)
}

// Match-tier thresholds, per spec: >=0.7 correct, 0.4-0.7 "almost" (worth a
// retry), <0.4 incorrect (model the pronunciation, then let them repeat).
export const MATCH_CORRECT_THRESHOLD = 0.7
export const MATCH_ALMOST_THRESHOLD = 0.4

export function classifyMatch(match) {
  if (match >= MATCH_CORRECT_THRESHOLD) return 'correct'
  if (match >= MATCH_ALMOST_THRESHOLD) return 'almost'
  return 'incorrect'
}

// ── Browser speech recognition ───────────────────────────────────────────────

// Recognition error codes that mean "this device/browser can't actually do
// speech recognition right now" (permission denied, no mic, or the platform's
// speech service itself refusing) — as opposed to a normal "didn't catch
// that" (no-speech/aborted/network hiccup) which is worth just retrying.
// iOS Safari in particular is known to expose the SpeechRecognition
// constructor (so isSpeechAvailable() reports true) while recognition itself
// silently fails via one of these — callers should treat this as a signal to
// fall back to listening mode for the rest of the session, not just retry.
const PERMISSION_ERROR_CODES = new Set(['not-allowed', 'service-not-allowed', 'audio-capture'])
export function isPermissionError(code) { return PERMISSION_ERROR_CODES.has(code) }

// startListening — begins recognition immediately and returns { promise, stop }.
// `stop()` lets a caller end recognition early (e.g. releasing a "hold to
// talk" button) — this calls the recognition's own graceful `.stop()` (not
// `.abort()`), which still fires a final onresult with whatever was heard so
// far rather than discarding it. If SpeechRecognition isn't available at all
// (feature-detected via isSpeechAvailable()), the promise resolves immediately
// with `unavailable: true` so callers can fall back to listening mode.
//
// The `timeoutMs` window only starts counting once the microphone actually
// begins capturing (the `onaudiostart` event) rather than from `.start()` —
// on a first-time permission request, the OS's native permission dialog can
// itself take several seconds to resolve, and counting the timeout from
// `.start()` would silently eat into the child's real speaking window before
// they'd even had a chance to see/answer the prompt. Falls back to counting
// from `.start()` if `onaudiostart` never fires (a browser that doesn't
// support the event, or permission is denied before capture ever begins).
export function startListening(expected, { lang = 'th-TH', timeoutMs = 6000 } = {}) {
  const Ctor = getRecognitionCtor()
  if (!Ctor) {
    return { promise: Promise.resolve({ heard: '', match: 0, unavailable: true, errorCode: null }), stop() {} }
  }

  let resolveFn
  const promise = new Promise((resolve) => { resolveFn = resolve })

  const recognition = new Ctor()
  recognition.lang = lang
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  let done = false
  let timer = null
  const armTimeout = () => {
    clearTimeout(timer)
    timer = setTimeout(() => { try { recognition.stop() } catch { finish('') } }, timeoutMs)
  }
  const finish = (heard, errorCode = null) => {
    if (done) return
    done = true
    clearTimeout(timer)
    resolveFn({ heard, match: similarity(heard, expected), unavailable: false, errorCode })
  }

  armTimeout() // initial fallback window in case onaudiostart never fires
  recognition.onaudiostart = armTimeout // real capture began — restart the window from here
  recognition.onresult = (e) => finish(e.results?.[0]?.[0]?.transcript || '')
  recognition.onerror = (e) => finish('', e?.error || 'unknown')
  recognition.onend = () => { if (!done) finish('') }
  try { recognition.start() } catch { finish('', 'start-failed') }

  return { promise, stop: () => { try { recognition.stop() } catch { finish('') } } }
}

// Simple fire-and-forget convenience wrapper over startListening — used
// anywhere "hold to talk" early-stop isn't needed (e.g. the dev speech-test
// harness's tap-to-test flow).
export async function listenForPhrase(expected, opts = {}) {
  return startListening(expected, opts).promise
}
