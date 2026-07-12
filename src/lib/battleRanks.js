// SPEC GAME-B §B.4 (2026-07-12) — Battle: victory ranks. Pure logic, no
// state/DOM access, so it's covered by a plain node --test file.

export const RANK_ORDER = ['B', 'A', 'S']

// S = every question answered correctly with zero hints used (the auto
// timeout-reveal AND the manual hint battle item both count as "a hint").
// A = strong performance (>=80% accuracy — the same threshold this codebase
// already uses elsewhere, WorldBattle.jsx's isStrong check for adaptive
// leveling) even if a hint was used or an answer was missed. B = any win
// below that — the floor rank, always positive, never a "failure" state
// (this only ever runs after a real victory).
export function computeBossRank(accuracy, hintsUsed) {
  if (accuracy >= 1 && (hintsUsed ?? 0) === 0) return 'S'
  if (accuracy >= 0.8) return 'A'
  return 'B'
}

// True if `next` outranks `prev` (or there was no previous rank at all) —
// used to gate whether a new boss-win result should overwrite the stored
// per-boss best. A rank can only ever improve, never regress.
export function isBetterRank(next, prev) {
  if (!prev) return true
  return RANK_ORDER.indexOf(next) > RANK_ORDER.indexOf(prev)
}

// Copy is always positive per the spec — even the floor rank encourages
// another try, never reads as a failure.
export const RANK_COPY = {
  S: 'S! สุดยอดไปเลย! เก่งที่สุด! 🌟',
  A: 'A! เก่งมาก! ใกล้ S แล้วนะ!',
  B: 'B ก็เก่งมาก! ลองอีกทีได้ S แน่!',
}

// Coin bonus on top of the normal boss-win coin reward. Only S grants extra.
export const RANK_BONUS_COINS = { S: 10, A: 0, B: 0 }
