// resolveSync.test.js — regression tests for the two historical cross-device
// data-loss scenarios, plus the C.1 state-integrity guard (validateState +
// local backup restore). Runs on Node's BUILT-IN test runner — no new dependency:
//
//     npm test          (→ node --test)
//     node --test src/lib/__tests__/resolveSync.test.js
//
// state.js's backup helpers use localStorage; Node has none, so we install a tiny
// in-memory shim before importing. resolveSync/migrateStateShape themselves are
// pure and need no shim.

import test from 'node:test'
import assert from 'node:assert/strict'

// ── Minimal localStorage shim (must exist before importing state.js indirectly) ─
const _store = new Map()
globalThis.localStorage = {
  getItem: k => (_store.has(k) ? _store.get(k) : null),
  setItem: (k, v) => { _store.set(k, String(v)) },
  removeItem: k => { _store.delete(k) },
  clear: () => { _store.clear() },
}

const {
  resolveSync, migrateStateShape, defaultState, hasRealProgress,
  validateState, writeBackup, readBackups, setCurrentProfileId, BACKUP_PREFIX,
} = await import('../state.js')

// ── Scenario 1 — multi-room migration wipe ───────────────────────────────────
// A device that had purchased extra rooms (real, 1000-coin-each progress) must
// never have that erased by a stale remote/local sync that only knows the single
// default room. The higher room count must win outright, independent of timestamps.
test('regression: multi-room progress is never wiped by a stale single-room sync', () => {
  const local = {
    ...defaultState(),
    lastSavedAt: 5000, // arbitrarily "newer" than remote by timestamp
    rooms: [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: {} }],
  }
  const remote = {
    ...defaultState(),
    lastSavedAt: 1000, // older timestamp, but MORE rooms
    rooms: [
      { id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: { floor_0_0: 'plant' } },
      { id: 'pool_1', theme: 'pool', gridX: 1, gridY: 0, layout: {} },
      { id: 'garden_1', theme: 'garden', gridX: 0, gridY: 1, layout: {} },
    ],
  }
  const { winner, remoteWon } = resolveSync(local, remote)
  assert.equal(remoteWon, true, 'remote (3 rooms) must beat local (1 room) despite older timestamp')
  assert.equal(winner.rooms.length, 3)

  // And the reverse: a stale remote must not shrink a local 3-room save.
  const r2 = resolveSync(remote, local)
  assert.equal(r2.remoteWon, false, 'local (3 rooms) must beat remote (1 room)')
  assert.equal(r2.winner.rooms.length, 3)
})

// migrateStateShape's safety net: a save whose rooms[] exists but whose active
// room layout is empty while the top-level roomLayout MIRROR still carries real
// NEW-format data must have that data restored into the room (not dropped).
test('regression: migrateStateShape recovers a desynced roomLayout mirror', () => {
  const saved = {
    ...defaultState(),
    activeRoomId: 'main',
    rooms: [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: {} }],
    roomLayout: { floor_1_1: 'bookshelf', left_wall_0_1: 'window' }, // real data stranded in the mirror
  }
  const out = migrateStateShape(saved)
  assert.deepEqual(out.rooms[0].layout, { floor_1_1: 'bookshelf', left_wall_0_1: 'window' },
    'desynced mirror data must be restored into rooms[0].layout')
})

// ── Scenario 2 — defaultState race ───────────────────────────────────────────
// A returning player opens the app on a device whose localStorage was cleared.
// The first-mount maintenance dispatches (DAILY_LOGIN etc.) stamp lastSavedAt=now
// and add daily-login coins BEFORE the async cloud fetch resolves — so a purely
// timestamp/coins-based compare would let the empty-but-freshly-stamped local
// state beat the real remote save. hasRealProgress() ignores those maintenance
// fields, so remote must still win.
test('regression: freshly-stamped blank local never beats real remote progress', () => {
  const localBlankButStamped = {
    ...defaultState(),
    lastSavedAt: Date.now(),   // inflated by maintenance dispatch
    coins: 15,                 // daily-login bonus
    loginStreak: 1,
    lastLoginDate: '2026-7-9',
  }
  const remoteReal = {
    ...defaultState(),
    lastSavedAt: Date.now() - 60000, // older
    xpThai: 340, rounds: 12, grade: 1,
    ownedItems: ['bow', 'party_hat'],
  }
  assert.equal(hasRealProgress(localBlankButStamped), false, 'blank+coins local has NO real progress')
  assert.equal(hasRealProgress(remoteReal), true, 'remote has real progress')

  const { remoteWon, winner } = resolveSync(localBlankButStamped, remoteReal)
  assert.equal(remoteWon, true, 'remote real progress must win over freshly-stamped blank local')
  assert.equal(winner.xpThai, 340)
})

// ── C.1 kill-switch — corrupt state self-repairs from local backup ───────────
test('C.1: validateState restores rooms/progress from local backup after a wipe', () => {
  _store.clear()
  const profileId = 'test-profile-123'
  setCurrentProfileId(profileId)

  // A real, healthy save gets ringed into the backup.
  const healthy = {
    ...defaultState(),
    coins: 500, xpThai: 200, rounds: 8, ownedRoomItems: ['plant', 'chair'],
    rooms: [
      { id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: { floor_0_0: 'plant' } },
      { id: 'pool_1', theme: 'pool', gridX: 1, gridY: 0, layout: {} },
    ],
    lastSavedAt: Date.now(),
  }
  writeBackup(healthy, profileId)
  assert.equal(readBackups(profileId).length, 1, 'backup ring should hold the healthy save')

  // Now simulate a corrupted state_json: rooms wiped to empty, coins gone NaN.
  const corrupt = { ...defaultState(), rooms: [], coins: NaN }
  const { state: repaired, restored } = validateState(corrupt, profileId)
  assert.equal(restored, true, 'a rooms-wiped state must be RESTORED from backup')
  assert.equal(repaired.rooms.length, 2, 'restored rooms from the backup (2 rooms)')
  assert.equal(repaired.coins, 500, 'restored coins from the backup')
  assert.equal(repaired.xpThai, 200)
})

// validateState minor-repair path: broken fields fixed in place, no restore needed.
test('C.1: validateState repairs minor corruption without a restore', () => {
  _store.clear()
  setCurrentProfileId('another-profile')
  const dirty = {
    ...defaultState(),
    coins: -50,                 // negative → clamp to 0
    ownedRoomItems: 'not-array',// wrong type → []
    equipped: null,             // missing → {head,face}
    xpThai: 120,                // has real progress, so NO restore
    rooms: [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: {} }],
  }
  const { state: s, repaired, restored } = validateState(dirty)
  assert.equal(restored, false, 'has real progress → must NOT restore from backup')
  assert.equal(repaired, true)
  assert.equal(s.coins, 0, 'negative coins clamped to 0')
  assert.ok(Array.isArray(s.ownedRoomItems), 'ownedRoomItems coerced to array')
  assert.deepEqual(s.equipped, { head: null, face: null }, 'equipped rebuilt')
})

// ── Phase 1.1 curriculum system — skillMastery/activeNodes protection ───────
// Same class of bug as Scenario 2 above, for the new curriculum fields added
// in Phase 1.1: a device with real skillMastery progress (attempts recorded,
// a node already mastered) and activeNodes advanced past the subject's first
// node must never lose that to a stale/blank remote sync, even when the local
// side's timestamp looks "older" on paper.
test('regression: local skillMastery/activeNodes progress is never wiped by a stale blank remote', () => {
  const localWithProgress = {
    ...defaultState(),
    lastSavedAt: 1000, // older timestamp than remote below
    activeNodes: { thai: 'th_vowels_short', math: 'math_add_under_10', english: 'eng_phonics_cvc' },
    skillMastery: {
      th_consonants_1: { attempts: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], ema: 0.95, mastered: true, masteredAt: 5000 },
      th_consonants_2: { attempts: [1, 0, 1, 1], ema: 0.6, mastered: false, masteredAt: null },
    },
  }
  const remoteBlank = {
    ...defaultState(),
    lastSavedAt: 9000, // newer timestamp, but genuinely untouched defaults
  }
  assert.equal(hasRealProgress(localWithProgress), true, 'mastered node + advanced activeNodes must count as real progress')
  assert.equal(hasRealProgress(remoteBlank), false, 'untouched default (first node, empty skillMastery) has no real progress')

  const { winner, remoteWon } = resolveSync(localWithProgress, remoteBlank)
  assert.equal(remoteWon, false, 'local curriculum progress must beat a newer-but-blank remote')
  assert.equal(winner.skillMastery.th_consonants_1.mastered, true)
  assert.equal(winner.activeNodes.thai, 'th_vowels_short')

  // And the mirror case: remote genuinely has curriculum progress, local is blank.
  const r2 = resolveSync(remoteBlank, localWithProgress)
  assert.equal(r2.remoteWon, true, 'remote curriculum progress must beat a blank local')
})

// The backup ring never grows past 3 and keeps the newest.
test('C.1: backup ring caps at 3 newest entries', () => {
  _store.clear()
  const pid = 'ring-profile'
  for (let i = 1; i <= 5; i++) {
    writeBackup({ ...defaultState(), xpThai: i * 10, rounds: i, lastSavedAt: 1000 + i }, pid)
  }
  const ring = readBackups(pid)
  assert.equal(ring.length, 3, 'ring capped at 3')
  assert.deepEqual(ring.map(b => b.state.xpThai), [30, 40, 50], 'kept the 3 newest')
})
