# Codebase Summary — KidQuest

## Architecture

React 18 SPA (Vite, no Next.js, no router). Screen switching = single `useState` in `App.jsx`. Global state via `useReducer + Context`. LocalStorage = always-on primary; Supabase = optional cloud sync. All 8 game screens are lazy-loaded via `GameScreen.jsx`.

5 screens: `home | game | collection | report | world`. Multiple always-mounted overlays: EggPopup, HatchOverlay, LoginModal, ChallengerOverlay, XPToast, ItemToast, ConfettiLayer.

### World / Tile Engine (`src/lib/tileEngine.js`, `src/lib/tileMaps.js`, `src/components/WorldScreen.jsx`)
- `T` constants: GRASS/TALL/TREE/PATH/WATER/WALL, EXIT_N/S/E/W, NPC/SIGN/FLOWER/ITEM_SPOT/ENEMY
- `renderMap(ctx, tileMap, ..., camX, camY, frame)` — draws all visible tiles each rAF frame
- `renderPlayer(ctx, displayX, displayY, dir, walkFrame, eggColor, camX, camY)` — 8-frame sprite
- `canMove(tileMap, col, row)` — returns false for TREE/WATER/WALL/NPC/SIGN/ENEMY
- `getCamera(displayX, displayY)` → `{camX, camY}` clamped to map bounds
- `getExitAt(tileMap, col, row)` → exit tile type or null
- `getEntryPosition(tileMap, fromExitType)` → `{col, row}` entry spot on new screen
- `WorldScreen.jsx`: rAF game loop (gameRef mutation, no React state per frame). 120ms player tween. Virtual D-pad 4-button cross. Screen transition: EXIT tile → 160ms fade → dispatch MOVE_SCREEN + DISCOVER_SCREEN → initScreen with entry position. 25% TALL encounter flash → ENCOUNTER_TRIGGERED. NPC proximity → dialogue overlay. `SCREEN_MAPS` registry maps screen IDs to tile arrays + start positions.

---

## Major Systems

### State (`src/context/StateContext.jsx` — 350 lines)
- `useReducer` + Context; 20+ action types in `ACTIONS` enum
- `StateProvider`: initializes from localStorage → async Supabase load → auth listener → daily resets + happiness decay + challenger trigger
- `useAppState()` → `{ state, dispatch, totalXP, eggProgressData, eggStatsData }`
- Derived values memoized; `stateRef` keeps auth callbacks current

### Game Flow
- `GameScreen` → `LevelSelector` → `TeachOverlay` (once, tracked by `seenTeach[]`) → game mode
- `ADD_XP`: updates subject XP, recalculates egg stage, updates acc/speed EMA
- `ROUND_COMPLETE`: increments `dailyRounds`, `rounds`, `streak`, `badges`
- `UNLOCK_LEVEL`: sets `subjectLevels[world]`; triggered when session accuracy ≥80%
- `useFinishRound()` hook in `GameThai.jsx` — shared by all 3 Thai game modes

### Egg System (`src/lib/eggAlgorithm.js`) — **LOCKED, DO NOT MODIFY**
- `drawEgg(canvas, stats)` — deterministic procedural Canvas drawing
- `eggProgress(state)` → `{ stage, stageXP, pct }` (7 stages × 50 XP = 350 total)
- Seed: `hash(name+grade) XOR hash(dow+month+day+hour)`

### Battle (`src/components/BattleScreen.jsx` — 292 lines)
- `simulateBattle(player, opponent)` — pure fn, returns turn log; animated by `BattleScreen`
- Stats from `calcCreatureStats(eggSnap)` in `gameConfig.js`
- Challenger trigger: `StateProvider` watches `dailyBattleRounds ≥ 15` → `SET_CHALLENGER`

### Persistence (`src/lib/state.js`)
- `saveState(s)` — localStorage + fire-and-forget Supabase upsert (never throws)
- `loadState()` — async: Supabase if logged in → localStorage → `defaultState()`
- Supabase: table `eggs`, columns `user_id (PK), child_name, state_json (jsonb), updated_at`

### Audio (`src/lib/audio.js`)
- `playTone(type)` — Web Audio API: correct/wrong/streak/next/fanfare/click
- `speakTh(text)` — Web Speech API, lang `th-TH`
- `speakEn(text, rate)` — Web Speech API, lang `en-US`
- `playPhonicsSound(q)` — fetches `/sounds/phonics/{letter}.m4a`

---

## Key Functions

| Function | File | Notes |
|----------|------|-------|
| `drawEgg(canvas, stats)` | `eggAlgorithm.js` | **LOCKED** |
| `drawCreature(canvas, seed, stats)` | `creatureAlgorithm.js` | rarity from streak |
| `simulateBattle(p, o)` | `BattleScreen.jsx` | returns turn log |
| `calcCreatureStats(egg)` | `gameConfig.js` | HP/ATK/DEF/SPD/CRIT |
| `loadState()` | `state.js` | async, never throws |
| `saveState(s)` | `state.js` | sync localStorage + async Supabase |
| `useFinishRound({...})` | `GameThai.jsx` | ROUND_COMPLETE + UNLOCK_LEVEL |
| `spawnConfetti(n)` / `showToast(msg)` | `Toasts.jsx` | global UI feedback |

---

## State Shape (key fields)

```
name, grade                             — identity (hardcoded defaults)
xpThai, xpEng, xpMath                  — reset to 0 on each hatch
streak, rounds, badges                  — lifetime stats
dailyRounds, lastPlayDate               — reset each day
eggRunLives, lastRunDate                — 3 lives/day, reset daily
eggDow, eggMonth, eggDay, eggHour      — egg seed fields
firstSubject                            — index of first subject played (0=thai,1=eng,2=math)
happiness (0-100), acc, speed, mins    — EMA-updated stats
items: {food, star, ribbon, potion}
xpBoost, xpBoostEnd                    — star item multiplier
subjectLevels: {thai,math,eng}         — highest unlocked level
levelMastery: {thai:{},math:{},eng:{}} — per-level mastery
seenTeach: []                          — teach keys already shown
thaiMastery: {}                        — per-word mastery
hatchedEggs: []                        — creature records with eggStats snapshot
defeatedBosses: [], battleHistory: []
dailyBattleRounds, pendingChallenger
```

---

## External Services

- **Supabase**: `https://dgpsnlkedergkbhqnjpu.supabase.co` — Auth + `eggs` table
- **Vercel**: hosting, auto-deploy from GitHub
- **Web Speech API**: browser-native TTS (no paid service)
