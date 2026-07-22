// src/wordfactory/storage.js — tiny isolated localStorage helper for the
// Word Factory mini-game's own adaptive-learning stats. Deliberately its own
// key (`kq_wordfactory_stats_v1`), separate from the main app's `kq_state` —
// this game's progress is not "real save progress" for hasRealProgress()
// purposes, it's low-stakes practice data local to this feature only.
const KEY = 'kq_wordfactory_stats_v1'

function defaultStats() {
  return {
    wordMisses: {},       // { wordId: count }
    consonantMisses: {},  // { char: count }
    vowelMisses: {},      // { char: count }
    listenReplays: 0,
    starsEarned: 0,
    sessionsCompleted: 0,
  }
}

export function loadStats() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return defaultStats()
    const parsed = JSON.parse(raw)
    return { ...defaultStats(), ...parsed }
  } catch (e) {
    return defaultStats()
  }
}

function save(stats) {
  try { window.localStorage.setItem(KEY, JSON.stringify(stats)) } catch (e) {}
}

export function recordMiss(wordId, missedPart, missedChar) {
  const stats = loadStats()
  stats.wordMisses[wordId] = (stats.wordMisses[wordId] || 0) + 1
  if (missedPart === 'consonant') stats.consonantMisses[missedChar] = (stats.consonantMisses[missedChar] || 0) + 1
  if (missedPart === 'vowel') stats.vowelMisses[missedChar] = (stats.vowelMisses[missedChar] || 0) + 1
  save(stats)
}

export function recordListenReplay() {
  const stats = loadStats()
  stats.listenReplays += 1
  save(stats)
}

export function recordSessionComplete(starsThisSession) {
  const stats = loadStats()
  stats.starsEarned += starsThisSession
  stats.sessionsCompleted += 1
  save(stats)
  return stats
}
