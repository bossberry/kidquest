# BUGS.md — Stability & Bug Audit (SPEC GAME-C, 2026-07-09)

Systematic sweep of the 8 checklist areas in SPEC GAME-C §C.3. Method this session
was **rigorous code review + unit tests + clean build**. Full live cross-device /
two-profile / iOS-silent-switch / fake-clock testing was **NOT** performed in this
environment — see "Verification limits" at the bottom. The data-integrity fixes are
instead covered by the passing regression + kill-switch tests in
`src/lib/__tests__/resolveSync.test.js`.

Severity: **P0** = data loss / blocker · **P1** = visible breakage · **P2** = minor / polish.
P0/P1 are fixed this session; P2 are filed in `docs/TASKS.md` (not fixed now).

---

## Fixed this session (P0 / P1)

### [P0] No state-integrity guard / no local backup restore path — FIXED (C.1)
- **Before**: a corrupted or wiped `state_json` (rooms emptied, coins NaN, arrays
  turned to objects by a bad sync/migration) became the live state with no repair
  and no way to recover — the exact class behind the two historical cross-device
  wipes.
- **Fix**: `validateState()` in `state.js` repairs minor corruption (coins→finite ≥0,
  arrays/objects coerced, rooms rebuilt/validated, activeRoomId/homeRoomId re-pointed)
  and, on critical loss (rooms wiped / no real progress), restores from a new
  per-profile local rolling backup ring (`kq_backup_{profileId}`, last 3 real saves).
  Wired into `loadState()` (cloud + local paths) and the `StateProvider` init.
- **Regression coverage**: both historical wipes (multi-room migration wipe;
  defaultState race) + a corrupt-state kill-switch test all PASS (`npm test`).

### [P1] ErrorBoundary leaked raw technical error text to the child — FIXED (C.2)
- **Before**: the fallback rendered `this.state.error?.message` on screen — a direct
  violation of CLAUDE.md's "no stack traces / technical terms to the child" rule.
- **Fix**: fallback now shows only a friendly egg-with-bandage 🩹 + "อุ๊ปส์! ลองใหม่นะ"
  and never surfaces the error text; the real error/componentStack goes to
  `console.error` only.

### [P1] A crash in any one screen white-screened the entire app — FIXED (C.2)
- **Before**: a single root ErrorBoundary meant any render error in any screen took
  down the whole app with no recovery except manual reload.
- **Fix**: every top-level screen in `App.jsx` is wrapped in its own
  `<ErrorBoundary key={screen}>`, so a crash is isolated to that screen, offers a
  retry, and auto-resets when the child navigates elsewhere. Root boundary retained.

### [P1] One bad furniture/entity draw could kill an entire canvas scene — FIXED (C.2)
- **Before**: a throwing or malformed `item.draw()` (e.g. a stale/renamed item id, a
  future data shape) inside the room furniture loops or the world Y-sort entity loop
  would throw out of the whole `requestAnimationFrame` frame — blanking the Home /
  Room / World canvas.
- **Fix**: per-item `try/catch` (skip + `console.error`) in
  `roomScene.js` `drawFloorFurniture`/`drawWallFurniture` and in `tileEngine.js`'s
  `standing.forEach(draw)` world-entity pass.

---

## Audit results by checklist area (no further P0/P1 found)

### 1. Money / economy — CLEAN
- Economy is **earn-only**; every `dispatchAddCoins`/`ADD_COINS` call site passes a
  **positive** amount (grep-verified across all game/minigame/battle files). No coin
  *sink* uses `ADD_COINS` with a negative amount.
- `ADD_COINS` reducer clamps with `Math.max(0, coins + amount)` → **negative balance
  impossible**.
- Every real sink guards insufficient funds at the reducer: `BUY_ITEM`,
  `BUY_ROOM_ITEM`, `BUY_ROOM_BLOCK` all early-return on `coins < price` (and on
  already-owned). Room furniture buy-confirm and Collection CTA also disable/grey the
  button when unaffordable (UI belt-and-suspenders).
- "Food" is not coin-purchasable in this game (home items come from drops/chests), so
  there's no insufficient-coins path to guard there.

### 2. Sync / offline — CLEAN (guard hardened)
- `resolveSync()` protects creatures, room count, and (now, via extended
  `hasRealProgress()`) extra rooms / crafted items / equipped cosmetics / collected
  materials — all maintenance-immune fields, so a freshly-mounted blank device can't
  beat real cloud progress on timestamp alone.
- `saveState()` is gated behind `_initialSyncComplete` so the first-render save can't
  race ahead of the cloud pull; `syncToSupabase()` refuses to push a blank/never-saved
  snapshot over real cloud data.
- **Not live-tested** this session (two simultaneous profiles / airplane-mode) — see
  limits below. Covered structurally by the unit tests.

### 3. Daily resets (quests / lives / materials / login) — CLEAN
- All reset logic keys off the single `todayStr()` helper. `DAILY_LOGIN`'s
  "yesterday" computation uses the **same** `getFullYear()+'-'+(getMonth()+1)+'-'+getDate()`
  format `todayStr()` produces, so streak detection matches (the historical EggRun
  `toLocaleDateString()` mismatch is gone — no inline date checks remain in `src/games`).
- Minigame lives, `dailyRounds`, `dailyMaterialsCollected`/`lastMaterialDate` all use
  the same convention.
- **Not fake-clock / timezone tested** live this session — see limits.

### 4. Multi-room — CLEAN (one known P2)
- `BUY_ROOM_BLOCK` guards funds, cell-occupied, and orthogonal-adjacency; `SET_ACTIVE_ROOM`/
  `SET_HOME_ROOM` guard room existence; `PLACE/REMOVE_ROOM_ITEM_IN_ROOM` guard room
  existence + ownership; the `roomLayout` mirror is kept in sync via the single
  `applyRoomLayoutChange()` helper.
- **P2 (known, previously flagged)**: `SET_HOME_ROOM` has no UI entry point since the
  mini-map was removed (2026-07-08) — reducer/state intact, just unreachable. Left as
  a design decision for Chatbot.

### 5. Battle — CLEAN
- Input is guarded by `lockedRef` (set true on answer, released on resolve) plus
  `victoryMode` / `showTeach` / `battleOverRef` checks on every move/item button →
  **rapid-tap spam can't double-fire** an attack.
- Back-out mid-battle is safe: `StateProvider` init always clears transient battle
  state (`battleCreatureId`, `pendingBattle`, `worldBattleEnemy`), so a mid-battle
  reload can't leave a stuck battle.
- All 7 input modes reviewed for presence/wiring; not each exercised live (login gate).

### 6. Minigames — CLEAN
- All 5 games (`EggMemory/EggCatch/EggRun/EggTower/EggFishing`) import the shared
  `minigameLives.js` (`livesRemaining`, `MINIGAMES`, correct `*_DEDUCT_LIFE` actions).
- Reset caps are aligned across all three sources of truth: `minigameLives.js` `max`
  (3/3/2/3/2 for memory/catch/eggrun/tower/fishing), the `*_DEDUCT_LIFE` reducers, and
  `defaultState()` — the historical date-format / mismatched-reset bug class is closed.
- `MinigameResult` disables retry at 0 lives.

### 7. Audio — CLEAN (code-review; iOS not testable here)
- `playBGM()` calls `stopBGM(0)` first, so fast screen-switching can't stack
  overlapping BGM tracks; `stopBGM()` clears loop-scheduler timers before stopping
  nodes.
- AudioContext is created/resumed on first user gesture (iOS + desktop). **iOS
  silent-switch behavior can't be exercised from this environment** — code-reviewed
  only, no functional issue visible in code.

### 8. Rendering — CLEAN (code-review)
- The egg is drawn everywhere through the one shared pipeline (`renderEggSprite` /
  `EggCanvas`), so it's identical across screens by construction.
- DPR is read via `window.devicePixelRatio` in the canvas components; Room /
  DecoratedRoom / BattleBackground use `ResizeObserver` to keep the backing store
  matched on resize. Orientation/resize mid-scene and DPR 1/2/3 were **not** device-
  tested live.

---

## Filed as P2 in docs/TASKS.md (not fixed this session)
- **resolveSync field-conflict**: the room-count winner-takes-all can, in a rare
  cross-field conflict (local has more rooms but remote has strictly higher XP),
  discard the other side's non-room progress. A true field-level merge would be the
  real fix; the current design deliberately prioritises protecting purchased rooms.
- **SET_HOME_ROOM unreachable from UI** (see area 4).
- **Audio loop-scheduler micro-timing** on extremely fast screen switching (cosmetic).
- **Bundle >500 KB, no code-splitting** (perf, not correctness).

---

## Verification limits (honest disclosure)
- No live browser session was run against the test account this session. The
  documented recurring blockers (Supabase login gate + Chrome background-tab RAF
  suspension) plus the cost of full Chrome automation made live sweeping of areas
  2/3/5/8 unreliable; the highest-risk area (data integrity, area 2) is instead
  covered by the automated regression + kill-switch tests, which pass.
- iOS silent-switch (area 7) and real multi-device / airplane-mode (area 2) and
  fake-clock/timezone (area 3) require hardware/harness not available here.
