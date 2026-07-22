// src/wordfactory/storage.js — tiny isolated localStorage helper for the
// Word Factory mini-game's own adaptive-learning stats. Deliberately its own
// key (`kq_wordfactory_stats_v1`), separate from the main app's `kq_state` —
// this game's progress is not "real save progress" for hasRealProgress()
// purposes, it's low-stakes practice data local to this feature only.
const KEY = 'kq_wordfactory_stats_v1'

function defaultStats() {
  return {
    wordMisses: {},            // { wordId: count }
    consonantMisses: {},       // { char: count }
    vowelMisses: {},           // { char: count } — single/leading vowels only
    compoundVowelMisses: {},   // { char: count } — ัว/เ-ีย/เ-ือ, tracked separately
                                // per 2026-07-22 update: a confused-with-ัว vs
                                // confused-with-เอือ pattern is a different signal
                                // than single-vowel confusion, worth telling apart.
    listenReplays: 0,
    starsEarned: 0,
    sessionsCompleted: 0,
    sessionsCompletedByDifficulty: { easy: 0, hard: 0 },
  }
}

export function loadStats() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return defaultStats()
    const parsed = JSON.parse(raw)
    // Shallow-merge only covers top-level keys — sessionsCompletedByDifficulty
    // needs its own merge so an old saved blob missing it doesn't clobber the
    // default {easy:0,hard:0} shape with undefined.
    return {
      ...defaultStats(),
      ...parsed,
      sessionsCompletedByDifficulty: {
        ...defaultStats().sessionsCompletedByDifficulty,
        ...(parsed.sessionsCompletedByDifficulty || {}),
      },
    }
  } catch (e) {
    return defaultStats()
  }
}

function save(stats) {
  try { window.localStorage.setItem(KEY, JSON.stringify(stats)) } catch (e) {}
}

// `vowelType` ('single' | 'compound') routes a vowel miss into the right
// bucket — only meaningful when missedPart === 'vowel'.
export function recordMiss(wordId, missedPart, missedChar, vowelType) {
  const stats = loadStats()
  stats.wordMisses[wordId] = (stats.wordMisses[wordId] || 0) + 1
  if (missedPart === 'consonant') {
    stats.consonantMisses[missedChar] = (stats.consonantMisses[missedChar] || 0) + 1
  }
  if (missedPart === 'vowel') {
    const bucket = vowelType === 'compound' ? stats.compoundVowelMisses : stats.vowelMisses
    bucket[missedChar] = (bucket[missedChar] || 0) + 1
  }
  save(stats)
}

export function recordListenReplay() {
  const stats = loadStats()
  stats.listenReplays += 1
  save(stats)
}

export function recordSessionComplete(starsThisSession, difficulty) {
  const stats = loadStats()
  stats.starsEarned += starsThisSession
  stats.sessionsCompleted += 1
  if (difficulty === 'easy' || difficulty === 'hard') {
    stats.sessionsCompletedByDifficulty[difficulty] += 1
  }
  save(stats)
  return stats
}
