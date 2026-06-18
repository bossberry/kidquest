# Changelog — KidQuest

## 2026-06-18 — feat: maze fog-of-war with flickering torch-light radius

### src/lib/worldDrawHelpers.js
- Added `drawMazeFog(ctx, playerPx, playerPy, frame, canvasW, canvasH)`: fills canvas near-black, uses destination-out radial gradient to punch a lit circle (~58px radius) around the player, adds warm candle tint overlay; flicker via two overlapping sine waves

### src/hooks/useWorldGameLoop.js
- Added `screenIdRef` to destructured params; imported `drawMazeFog`
- Render loop: `screenIdRef?.current === 'MAZE'` → `drawMazeFog` before player; else normal `drawPlayerGlow`

### src/components/WorldScreen.jsx
- Passes `screenIdRef` to `useWorldGameLoop`

## 2026-06-18 — fix: rainbow_star saiyan stops chase AI; player can still walk into chasers; rainbow SFX + visual

### src/hooks/useWorldGameLoop.js
- Added `saiyanActive` check at top of `updateEnemies()`
- sleepy_bunny: chase movement now guarded by `&& !saiyanActive`
- baby_zombie: movement timer check now guarded by `&& !saiyanActive`
- snake: aggro movement changed from `if (ne.isAggro)` to `if (ne.isAggro && !saiyanActive)` / `else if (!ne.isAggro)` so aggro-but-saiyan causes zero movement (no movement branch taken)
- Removed duplicate `saiyanActiveNow` local variable — reuses single `saiyanActive` from top of function
- World-map player glow changed from static gold to fast rainbow hue cycle: `hsl((frame×6) % 360, 100%, 60%)` — full color rotation every ~60 frames

### src/components/WorldScreen.jsx
- `tryMove` hitEnemy: removed early `if (isChaser && saiyanActive) return false` that was blocking walk-into-chaser
- Now only suppresses the "chaser already on player tile" overlap branch with `isChaser && !saiyanActive`
- Player deliberately stepping onto enemy tile always triggers battle

### src/lib/audio.js
- Added `powerup` SFX to the SFX dictionary: upward sine sweep (200→1600 Hz) + ascending triangle arp

### src/hooks/useHomeInteractions.js
- rainbow_star activation now calls `playSFX('powerup')` before `playTone('celebrate')`

### src/components/Home.jsx
- Creature outer wrapper div gains `className={saiyanActive ? 'saiyan-rainbow' : ''}` for CSS hue-cycle animation

### src/styles.css
- Added `@keyframes rainbow-cycle`: hue-rotate 0→360deg with saturate(1.5) brightness(1.1)
- Added `.saiyan-rainbow` class: `animation: rainbow-cycle 0.6s linear infinite`

## 2026-06-18 — feat: adaptive hint overlay for word-building and sequencing modes

### src/lib/state.js
- Added `inputModeMastery: { wordbuild: 0, sequence: 0 }` to `defaultState()` — range 0–1, persists to localStorage

### src/context/StateContext.jsx
- Added `RECORD_INPUT_MODE_RESULT` action constant
- Added reducer case: EMA update with `success ? +0.15 : -0.08`, clamped 0–1

### src/games/MoveSelectBattleMode.jsx
- Computed `showWordbuildHint = wordbuildMastery < 0.5` and `showSequenceHint = sequenceMastery < 0.5` from `state.inputModeMastery`
- Wordbuild `onSubmit`: dispatches `RECORD_INPUT_MODE_RESULT` with `mode:'wordbuild'` before locking
- Sequence `onSubmit`: dispatches `RECORD_INPUT_MODE_RESULT` with `mode:'sequence'` before locking
- Both components now receive `showHint` prop

### src/components/battle/WordBuildInput.jsx
- Accepts `showHint` prop; computes `nextNeededChar` (target char at first empty slot) and `hintTileId` (first unused tray tile matching it)
- Hinted tile gets gold border + pulsing `hint-pulse` box-shadow animation
- "👆 ตัวที่กระพริบ ไปวางในช่องว่างนะ" instruction shown above tray when hint is active

### src/components/battle/SequenceInput.jsx
- Identical hint system as WordBuildInput; `nextNeededChar` from `target[nextEmptyIdx]`

### src/styles.css
- Added `@keyframes hint-pulse` — oscillates box-shadow between 8px and 18px at 0.8s

### Notes
- EMA math: 4–5 consecutive correct answers crosses 0.5 threshold and hints disappear; a few wrong answers brings them back — adaptive behaviour confirmed

---

## 2026-06-18 — fix: new input mode coverage expanded to ALL English/Math levels

### src/components/WorldBattle.jsx
- `genEngMoveQ()` — removed type-specific gates (`type==='phonics'`/`type==='cvc'`) from sequence/fillgap/visualdiscrim/memory checks; all 4 variety modes now apply across every English level (15%/10%/10%/8% respectively)
- `genEngMoveQ()` — `sight` branch gains `inputMode:'wordbuild'|'choice'` (35/65 split); `chars: item.blank.split('')` added for wordbuild path
- `genMathQ()` — `isCount` branch gains `inputMode:'numpad'|'choice'` (40/60 split); `isPattern` intentionally left choice-only (emoji/symbol answer, not a number)
- Verified: `value === q.answer` in MoveSelectBattleMode.jsx works for `isCount` numpad since `answer:n` is always a number; `WordBuildInput` `isLatinChars` check routes sight word chars to pixel font correctly — no further changes needed

---

## 2026-06-18 — feat: Collection team tab redesigned as full-screen swipeable carousel

### src/components/Collection.jsx
- `PartyGrid` rewritten: multi-column grid replaced with horizontal `scroll-snap` carousel (one creature per screen)
- Dot indicator in header — active dot widens to 18px pill, inactive stays 6px circle; both animate on scroll
- Carousel uses `onScroll` + `Math.round(scrollLeft / clientWidth)` to track current page index
- Each card: 140×140 creature canvas (up from 90×90), gold "★ ตัวหลัก" badge on slot 0, HP bar (maxWidth 240), "ตั้งเป็นตัวหลัก" button for non-active slots, CreatureJourney section
- `SubjectLevelProgress` removed from per-card layout (it showed global stats, not per-creature)
- "← เลื่อนดูตัวอื่น →" hint shown when party has >1 creature
- `useRef` added to React imports

### src/styles.css
- Added `.carousel-scroll-hide-bar` — hides scrollbar cross-browser (webkit + Firefox/IE)

### Notes
- `drawCreature()` confirmed scale-agnostic: uses `Math.floor(Math.min(W,H) / 12)` so 140×140 renders correctly without code changes

---

## 2026-06-18 — fix: missing scroll/mirror/clover pixel art + hint item mode-awareness

### src/lib/itemArt.js
- Added `scroll` drawer — parchment roll with dark caps, red ribbon binding, text lines
- Added `mirror` drawer — oval frame with handle, teal glass surface and shine
- Added `clover` drawer — 4 leaf lobes with highlights, center connector, stem, notch outlines
- All 9 game item keys now resolve: food/ribbon/shoes/rainbow_star (home) + scroll/thunder/gem/mirror/clover (battle)

### src/hooks/useBattleCombat.js
- `hint` effect (mirror item) is now mode-aware: numpad → digit-count hint in battle log; wordbuild/sequence → first-char hint in battle log; memory → friendly "ใบ้ไม่ได้" message; choice mode → original eliminate-2-wrong-choices behavior; fallback for unknown mode

---

## 2026-06-18 — feat: spoken + visual instructions for sequence/fillgap/visualdiscrim/memory modes

### src/components/WorldBattle.jsx
- `genSequenceQ` — added `instructionTh:'แตะตัวอักษรให้เรียงตามลำดับ'`, `instructionEn:'Tap the letters in the correct order'`
- `genFillGapQ` — added `instructionTh:'แตะตัวอักษรที่หายไป'`, `instructionEn:'Tap the missing letter'`
- `genVisualDiscriminationQ` — added `instructionTh:'แตะตัวที่เหมือนกัน'`, `instructionEn:'Tap the matching letter'`
- `genMemoryCardQ` — added `instructionTh:'แตะเปิดไพ่ให้เจอคู่ที่เหมือนกัน'`, `instructionEn:'Flip cards to find matching pairs'`
- `onSpeak()` — falls back to speaking instruction phrase when `ttsWord` is null; speaker button now always does something

### src/games/MoveSelectBattleMode.jsx
- TTS `useEffect` — falls back to `speakTh(q.instructionTh)` / `speakEn(q.instructionEn)` when no `ttsWord` or math text
- `handleDismissTeach` — same fallback so instruction plays after teach overlay closes
- Zone 2 `isFillGap` — added gold `fontSize:16` Thai instruction label above the gap display
- Zone 2 `isVisualDiscrim` — added gold `fontSize:16` Thai instruction label above target char; removed old dim 11px caption
- Zone 2 `isSequence` — new early-return path with gold `fontSize:16` Thai instruction label above 🔤 (no longer falls through to generic TTS-button path)

### src/components/battle/MemoryCardInput.jsx
- Added gold `fontSize:15` Thai instruction label "แตะเปิดไพ่ให้เจอคู่ที่เหมือนกัน" above the existing small pair-count label

---

## 2026-06-18 — feat: memory card matching mini-game for Thai/English vocabulary

### New file
- `src/components/battle/MemoryCardInput.jsx` — 6-card 3-pair flip-and-match grid; tap to flip, tap mismatch returns after 700ms, tap match stays face-up in green; `onPairFound()` fires per match; `onAllPairsFound()` fires 500ms after last pair; no penalty for mismatches

### src/components/WorldBattle.jsx
- Added `genMemoryCardQ(alphaList)` — picks 3 random items, creates 6 cards (emoji+char pairs), shuffles the card array
- Thai L1–2: 8% chance for memory card round (after fill-gap and visual-discrim checks)
- English phonics: 8% chance for memory card round

### src/games/MoveSelectBattleMode.jsx
- Added `import MemoryCardInput from '../components/battle/MemoryCardInput.jsx'`
- Added `memoryMatchedRef = useRef(0)`, reset inside per-question `useEffect`
- Added `handleMemoryPairFound()`: increments counter, calls `fireHit(-1)` only on the **last** pair (which triggers normal onNext/showVictory flow); earlier pairs call `playTone('correct') + spawnEffect('attack')` for feedback without advancing the question
- Move panel: `memory` inputMode uses flex centering container; renders `MemoryCardInput` with `onPairFound={handleMemoryPairFound}` and no-op `onAllPairsFound` (last pair's `fireHit` handles progression)
- `disabled` for memory mode does NOT lock on `lockedRef.current` — individual card interactions are never locked by the outer question lock

---

## 2026-06-18 — feat: fill-the-gap and visual-discrimination question types for Thai/English

### src/components/WorldBattle.jsx
- Added `genFillGapQ(alphaList)` — picks 3 consecutive letters, hides middle, presents `[before] [?] [after]`; wrong choices drawn from letters NOT adjacent to the run
- Added `TH_CONFUSABLE_GROUPS` and `EN_CONFUSABLE_GROUPS` — visually similar letter clusters Chopin's age commonly confuses (e.g. ก/ถ/ภ, b/d, p/q)
- Added `genVisualDiscriminationQ(alphaList, isThai)` — picks one letter from a confusable group as target; wrong choices are other group members padded with unrelated letters
- `genThaiMoveQ()` levels 1–2: 10% fill-gap + 10% visual-discrim chance (after existing 15% sequence check)
- `genEngMoveQ()` phonics level: same 10%+10% chances

### src/games/MoveSelectBattleMode.jsx
- Zone 2 (question display) now has early-return paths for `isFillGap` and `isVisualDiscrim` before the existing `display` logic
- `isFillGap`: renders `[before] [?gold-dashed-box] [after]` in 32px pixel font, no TTS button
- `isVisualDiscrim`: renders target char at 48px pixel font with gold glow + "แตะตัวที่เหมือนกัน" subtitle, no TTS button
- Both types use `inputMode:'choice'` so MoveCard 4-choice grid renders automatically with no other changes

---

## 2026-06-18 — feat: word-building input mode for English CVC words

### src/components/WorldBattle.jsx
- `genEngMoveQ()` cvc branch: added `inputMode:'wordbuild'|'choice'` at 50/50 random and `chars: correct.word.split('')` (e.g. 'cat' → ['c','a','t']) on returned question object

### src/components/battle/WordBuildInput.jsx
- Added named exports `DEFAULT_THAI_DISTRACTORS` and `DEFAULT_ENG_DISTRACTORS` (common Latin vowels + consonants)
- Added `distractorPool` prop — overrides built-in pool; falls back to `DEFAULT_THAI_DISTRACTORS` when undefined (preserves Thai behavior)
- Added `isLatinChars` detection (charCode < 0x0E00 = Thai Unicode block start)
- `tileStyle` now uses `var(--font-pixel)` + `textTransform:'lowercase'` for Latin chars; `var(--font-thai)` for Thai

### src/games/MoveSelectBattleMode.jsx
- Updated import: `import WordBuildInput, { DEFAULT_ENG_DISTRACTORS } from '../components/battle/WordBuildInput.jsx'`
- WordBuildInput call now passes `distractorPool={subject === 'eng' ? DEFAULT_ENG_DISTRACTORS : undefined}` — Thai words fall back to default pool, English CVC gets Latin distractors

---

## 2026-06-18 — feat: sequencing input mode — reorder consecutive Thai/English alphabet letters

### New file
- `src/components/battle/SequenceInput.jsx` — tap-to-place letter ordering; shuffled tray of N tiles (no distractors — all tiles are correct letters); fills slots in order; tap slot to return tile; auto-submits `onSubmit(true|false)` on last tile; shows "เรียงตามลำดับ" instruction label; resets on `resetKey`

### src/components/WorldBattle.jsx
- Added `genSequenceQ(alphaList)` — picks a random run of 3–4 consecutive letters from TH_ALPHA or EN_ALPHA; returns `{ isSequence, inputMode:'sequence', sequenceChars, ttsWord:null }`
- `genThaiMoveQ()`: 15% chance for levels 1–4 to return a sequence question (level 5 sentences unchanged)
- `genEngMoveQ()`: 15% chance for phonics/cvc levels to return a sequence question (sight/sentences unchanged)

### src/games/MoveSelectBattleMode.jsx
- Added `import SequenceInput from '../components/battle/SequenceInput.jsx'`
- Zone 2 display: added `q.isSequence` branch showing `🔤` so the question zone doesn't appear blank
- Move panel container style now centers for `numpad`, `wordbuild`, and `sequence` inputModes
- Move panel branches: `numpad` → NumpadInput | `wordbuild` → WordBuildInput | `sequence` → SequenceInput | default → 2×2 MoveCard grid
- SequenceInput `onSubmit(isCorrect)` mirrors exact timing/animation as all other input modes (220ms charge → 280ms lunge → fireHit/fireMiss)

---

## 2026-06-18 — feat: word-building (tap-to-spell) input mode for Thai battles

### New file
- `src/components/battle/WordBuildInput.jsx` — tap-to-place spelling; character tiles from shuffled tray fill ordered answer slots; tap filled slot returns tile; auto-submits `onSubmit(true|false)` when all slots filled; adds 1–2 distractor tiles from DISTRACTOR_POOL; resets on `resetKey` prop change

### src/components/WorldBattle.jsx
- `genThaiMoveQ()` levels 2, 3, 4: added `inputMode: 'wordbuild'|'choice'` at 50/50 random and `chars: correct.chars` on returned question object
- Level 1 (emoji/audio match) and level 5 (sentences) unchanged — choice only

### src/games/MoveSelectBattleMode.jsx
- Added `import WordBuildInput from '../components/battle/WordBuildInput.jsx'`
- Move panel div style now centers for both `'numpad'` and `'wordbuild'` inputModes
- Move panel branches: `numpad` → NumpadInput | `wordbuild` → WordBuildInput | default → 2×2 MoveCard grid
- WordBuildInput `onSubmit(isCorrect)` mirrors exact timing/animation of handleTap (220ms charge → 280ms lunge → fireHit/fireMiss)

---

## 2026-06-18 — feat: numpad input mode for math battles

### New file
- `src/components/battle/NumpadInput.jsx` — digit-by-digit numeric entry; 3×4 button grid (1-9, ⌫, 0, ✓); gold display field shows typed digits; confirm disabled until ≥1 digit; caps at 2 digits; uses `playTone('tap'/'click')`; resets on `resetKey` prop change

### src/components/WorldBattle.jsx
- `genMathQ()` arithmetic branch: added `const inputMode = Math.random() < 0.5 ? 'numpad' : 'choice'` and `inputMode` field on returned question object
- `isCount`, `isPattern`, `isWord` branches unchanged — no inputMode field, defaults to choice in component

### src/games/MoveSelectBattleMode.jsx
- Added `import NumpadInput from '../components/battle/NumpadInput.jsx'`
- Move panel (Zone 3) now branches on `q?.inputMode === 'numpad'`: renders `<NumpadInput>` centered in the 168px panel, or the existing 2×2 `<MoveCard>` grid
- NumpadInput `onSubmit(value)` mirrors `handleTap` timing (220ms charge → 280ms lunge → resolve) and compares `value === q.answer` directly
- TEACH_INTRO unchanged — `isFirstLevel={false}` always from WorldBattle, so teach screen never shows during numpad questions

---

## 2026-06-18 — refactor(battle-round3): extract fireHit/fireMiss/showVictory/useBattleItem into useBattleCombat hook

### New file
- `src/hooks/useBattleCombat.js` — owns fireHit, fireMiss, showVictory, useBattleItemFn (returned as `useBattleItem`). Receives all state setters, refs, and props as explicit params so behavior is byte-for-byte identical to original. Imports: StateContext, audio (playTone/playSFX/playElementSFX), Toasts (spawnConfetti), elementConfig (getElementTier), elementAnimations (playElementAttack), itemConfig (BATTLE_ITEMS, rollBattleItem).

### src/games/MoveSelectBattleMode.jsx
- Removed `playElementSFX` from audio import (now in hook)
- Removed `spawnConfetti` import from Toasts (now in hook)
- Removed `getElementTier` from elementConfig import (now in hook)
- Removed `playElementAttack` import from elementAnimations (now in hook)
- Removed `rollBattleItem` from itemConfig import (now in hook)
- Added `import { useBattleCombat } from '../hooks/useBattleCombat.js'`
- Removed `useBattleItem` function body (~60 lines, lines 223–282)
- Removed `fireHit` function body (~113 lines, lines 304–416)
- Removed `fireMiss` function body (~102 lines, lines 417–518)
- Removed `showVictory` function body (~32 lines, lines 519–550)
- Added `useBattleCombat({...})` hook call before `handleTap`
- MoveSelectBattleMode.jsx now **711 lines** (was 1018); build: 0 errors
- **MoveSelectBattleMode refactor complete** — all 3 rounds done: 1190 → 711 lines (−40%)

---

## 2026-06-18 — refactor(battle-round2): extract particle/effect canvas system into useBattleEffects hook

### New file
- `src/hooks/useBattleEffects.js` — owns effectCanvasRef, overlayCanvasRef, effectsRef, effectRafRef, rafTimeRef, ResizeObserver canvas-sync effect, RAF tick loop, and spawnEffect(). Returns `{effectCanvasRef, overlayCanvasRef, spawnEffect}`.

### src/games/MoveSelectBattleMode.jsx
- Removed `import { mkBeam, mkOrb, mkLightning, mkSparks, tickEffects }` (now in hook)
- Added `import { useBattleEffects } from '../hooks/useBattleEffects.js'`
- Removed 5 useRef declarations (effectCanvasRef, overlayCanvasRef, effectsRef, effectRafRef, rafTimeRef)
- Removed `cancelAnimationFrame(effectRafRef.current)` from unmount cleanup (hook owns its own cleanup)
- Removed ResizeObserver useEffect (~18 lines)
- Removed RAF loop useEffect (~19 lines)
- Removed `spawnEffect` function (~31 lines)
- Added `useBattleEffects({battleFieldRef, eggDivRef, enemyDivRef, subject})` hook call
- MoveSelectBattleMode.jsx now **1018 lines** (was ~1190); build: 0 errors

---

## 2026-06-18 — refactor(battle-round1): extract GBHPBar, EnemyCanvas, MoveCard, HintBar presentational components

### New files
- `src/components/battle/GBHPBar.jsx` — GB-style HP bar with player/enemy color logic
- `src/components/battle/EnemyCanvas.jsx` — enemy canvas sprite with hurt/defeat animations; owns drawEnemy import
- `src/components/battle/MoveCard.jsx` — answer move button with emoji/text size logic
- `src/components/battle/HintBar.jsx` — dot-group hint for math arithmetic; exports `numTh`, `mathToThai` helpers

### src/games/MoveSelectBattleMode.jsx
- Removed inline GBHPBar, EnemyCanvas, MoveCard, HintBar function definitions (~120 lines)
- Removed THAI_NUMS, numTh, mathToThai (moved to HintBar.jsx)
- Removed `import { drawEnemy, drawEnemyHurt }` (now owned by EnemyCanvas.jsx)
- Added 4 imports from `../components/battle/`; re-imported `{ numTh, mathToThai }` from HintBar.jsx
- MoveSelectBattleMode.jsx now **1092 lines** (was ~1190); build: 0 errors

---

## 2026-06-18 — refactor(home-round3): extract item/tap/swipe handlers into useHomeInteractions hook

### New file
- `src/hooks/useHomeInteractions.js` — spawnParticles, handlePetEgg, handleTapItem, handleEggTap, handleCreatureTap, handleCreatureSwipe; owns its own particleIdRef/swipeCountRef; comboToState moved here from module scope

### src/components/Home.jsx
- Removed `comboToState` constant (moved to hook)
- Removed `particleIdRef`, `swipeCountRef` useRef declarations (owned by hook)
- Removed `spawnParticles`, `handlePetEgg`, `handleTapItem`, `handleEggTap`, `handleCreatureTap`, `handleCreatureSwipe` functions (~127 lines)
- Added `useHomeInteractions` import
- Added `useHomeInteractions({...})` hook call before `useHomeAmbience` (so spawnParticles is available to pass in)
- Hook call order: useCreatureInteraction → useHomeInteractions → useHomeAmbience
- Home.jsx now **632 lines** (was 952; Phase 3 refactor complete: −34%)
- Build: 0 errors

---

## 2026-06-18 — refactor(home-round2): extract interaction state machine into useCreatureInteraction hook

### New file
- `src/hooks/useCreatureInteraction.js` — creature interaction FSM: `enterState`, `extendState`, `setGlow`, `smRef`, watchdog, unmount cleanup. STATE_CSS/STATE_DUR moved here. Returns `{eggAnim, setEggAnim, idleAnim, setIdleAnim, eggGlow, setGlow, smRef, comboResetRef, enterState, extendState}`.

### src/components/Home.jsx
- Removed `STATE_CSS`, `STATE_DUR` constants (moved to hook)
- Removed `eggAnim`, `idleAnim`, `eggGlow` useState declarations (now from hook)
- Removed `animTimerRef`, `glowTimerRef`, `stageRef`, `smRef`, `enterRafRef`, `enterGenRef`, `comboResetRef` useRef declarations (owned by hook)
- Removed stageRef sync useEffect (moved to hook)
- Removed unmount cleanup useEffect (moved to hook)
- Removed watchdog useEffect (moved to hook)
- Removed `enterState` function (moved to hook)
- Removed `extendState` function (moved to hook)
- Removed `setGlow` function (moved to hook)
- Added `useCreatureInteraction` import
- Added `useCreatureInteraction(stage)` hook call (before `spawnParticles`, before `useHomeAmbience`)
- Home.jsx now **766 lines** (was 848 after round1)
- Build: 0 errors

---

## 2026-06-18 — refactor(home-round1): extract ambient/idle effects into useHomeAmbience hook

### New file
- `src/hooks/useHomeAmbience.js` — idle micro-animations, butterfly/leaf/star ambient events, stage-up celebration, hatch-ready heartbeat, reunion burst on mount, post-session growth banner. Returns `{ambientEvent, stageUp, growthBanner}`.

### src/components/Home.jsx
- Removed `IDLE_DUR` constant (moved to hook)
- Removed `ambientEvent`, `stageUp`, `growthBanner` useState declarations (now from hook)
- Removed `idleTimerRef`, `eggAnimRef`, `prevStageRef` useRef declarations (only used in moved effects)
- Kept `stageRef` + its sync effect (still used by enterState/extendState/watchdog)
- Removed eggAnimRef sync effect (moved to hook)
- Removed 6 useEffect blocks — 100 lines total: stage-up, heartbeat, reunion-on-mount, growth banner, idle animations, ambient events
- Added `useHomeAmbience({...})` call after setGlow, before interaction handlers
- Home.jsx now **848 lines** (was 952 before refactor)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round4): extract RAF game loop into useWorldGameLoop hook

### New file
- `src/hooks/useWorldGameLoop.js` — RAF render/update loop: enemy AI (9 types), respawn timers, collision-triggered battle, chest/enemy/player rendering, camera. TILE+DIRS4 at module level; local rafIdRef inside effect; dep array [].

### src/components/WorldScreen.jsx
- Removed 326-line RAF useEffect (lines 423–748)
- Added `useWorldGameLoop({ canvasRef, gameRef, tileMapRef, enemiesRef, chestsRef, stateRef, battlePendingRef, battleDispatchedRef, triggerBattleRef, eggColorRef, HUD_CONTENT_H })` call at same location
- Removed from tileEngine import: `renderMap`, `renderPlayer`, `getCamera`, `MAP_ROWS`, `MAP_COLS`, `EXIT_OPPOSITE` (none needed in WorldScreen after extraction)
- Removed `import { drawEnemy }` (only used inside RAF loop)
- Removed `rafRef = useRef(null)` declaration (replaced by local rafIdRef in hook)
- Added `import { useWorldGameLoop } from '../hooks/useWorldGameLoop.js'`
- WorldScreen.jsx now **873 lines** (was 1700 at start of Phase 2 refactor — 49% reduction)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round3): extract battle-trigger logic into useBattleTrigger hook

### New file
- `src/hooks/useBattleTrigger.js` — custom hook owning triggerBattle, enterBossBattle, triggerBattleRef, battleDispatchedRef, battlePendingRef. Imports useAppState/ACTIONS, getBattleSubject, ENEMY_DATA, WORLD_LEVELS, playSFX internally.

### src/components/WorldScreen.jsx
- Removed duplicate useLayoutEffect that synced battlePendingRef/battleDispatchedRef (was exact duplicate of canonical one now in hook)
- Removed `getBattleLevel` import from battleSubject.js (moved to hook; not used elsewhere)
- Removed `ENEMY_DATA` import from enemyConfig.js (moved to hook)
- Added `import useBattleTrigger from '../hooks/useBattleTrigger.js'`
- Removed 3 ref declarations (triggerBattleRef, battleDispatchedRef, battlePendingRef)
- Added hook call after state declarations; destructures all 5 values
- Removed 58-line block: triggerBattle callback + triggerBattleRef assignment + useLayoutEffect + enterBossBattle callback
- WorldScreen.jsx now 1194 lines (was 1257 after Round 2)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round2): extract pure drawing helpers into worldDrawHelpers.js

### New file
- `src/lib/worldDrawHelpers.js` — exports: `drawChest`, `drawPlayerGlow`, `spawnChests`, `findSpecials`, `getOwlLines`, `SIGN_LINES`, `STAGE_COLORS`
  - Imports `T`, `MAP_ROWS`, `MAP_COLS` from `tileEngine.js`; local `TILE = 16`

### src/components/WorldScreen.jsx
- Removed 94 lines (drawing helpers + STAGE_COLORS + SIGN_LINES)
- Added import from `../lib/worldDrawHelpers.js`; `const TILE = 16` and `SKY_TINTS` kept in WorldScreen
- WorldScreen.jsx now 1257 lines (was 1346 after Round 1)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round1): extract WorldHUD and MissionPanel into separate components

### New files
- `src/components/world/WorldHUD.jsx` — HUD bar (mini-map, creature HP, XP bar, battle items, item bag button, home button). Exports: `default WorldHUD`, `HUD_CONTENT_H`, `HOME_ITEM_KEYS`, `BATTLE_ITEM_KEYS`
- `src/components/world/MissionPanel.jsx` — Map info panel above the world map (name, objective, enemy types, daily progress bar)

### src/components/WorldScreen.jsx
- Removed 387 lines (WorldHUD + MissionPanel functions + their local consts)
- Imports WorldHUD/MissionPanel from `./world/`; `HUD_CONTENT_H`, `HOME_ITEM_KEYS`, `BATTLE_ITEM_KEYS` imported as named exports
- Removed `getCreatureSeed` import (only used inside WorldHUD)
- Removed `MAP_THEMES` import (only used inside WorldHUD)
- Build: 137 modules transform, 0 errors

---

## 2026-06-17 — cleanup: remove completed migrations, simplify merge logic, audit hardcoded names

### src/context/StateContext.jsx
- Removed 5 one-time migrations: items→homeItems/battleItems split; star→rainbow_star/potion→shoes rename; subjectLevels calibration; additive items; evo recheck (all flags confirmed true in live state)
- Simplified creature merge check to `(length ?? 0) > 1` at both local and remote sites (removed `_creaturesMerged && !_statAveraged` flag complexity)

### src/lib/state.js
- `_mergeAllCreaturesIntoOne()`: removed `_creaturesMerged` and `_statAveraged` flag tracking from both return objects
- Re-averaging guard simplified: `count <= 1 || state._statAveraged` → `count <= 1`

### src/components/WorldScreen.jsx
- `OWL_LINES` → `getOwlLines(name)` function so NPC greets player by their actual name
- Boss cutscene: `โชแปงพิชิต` → `{state.name}พิชิต` (uses state.name for any player)

### src/lib/battleSubject.js
- Removed debug `console.log('getBattleLevel', ...)` (was printing on every battle)

### src/components/WorldBattle.jsx
- Removed "Debug log — verify level rotation" useEffect (was printing on every battle start)

---

## 2026-06-17 — feat: rainbow_star boost grants phase-through immunity from chaser enemies

### src/components/WorldScreen.jsx
- `tryMove`: `saiyanActive` check before chaser collision — snake/baby_zombie/woken sleepy_bunny are ignored when rainbow_star active; walking directly onto a stationary enemy still triggers battle
- RAF loop enemy-initiated: `saiyanActiveNow` check added to `if (!pendingBattle && isChaser ...)` — chasers can't force battle by landing on player tile during saiyan
- `HOME_ITEM_EFFECTS`: `rainbow_star: 'หลบศัตรูตาม!'`; `shoes: 'วิ่ง×4'`

### src/components/Collection.jsx + src/components/Home.jsx
- `rainbow_star` effect → `'ล่องหนจากมอนสเตอร์ตาม'`; `shoes` effect → `'วิ่ง×4'`; Home bondReaction → `'👟 วิ่ง×4 (5 นาที)'`

---

## 2026-06-17 — fix: shoes boost uses faster lerp animation instead of tile-skipping playerSpeed=2

### src/components/WorldScreen.jsx
- `tryMove`: removed `playerSpeed = shoesActive ? 2 : 1` and `dCol * playerSpeed`; always moves exactly 1 tile
- Sets `window.__kq_moveSpeedMult = 2.0` when shoes active (1.0 otherwise)
- RAF lerp: `/ 120` → `/ (120 / speedMult)` — shoes = 60ms per tile, normal = 120ms
- `g.moving` gate naturally clears 2× faster so next input is accepted sooner; no separate cooldown needed
- Every tile is now visited during shoes boost — chests, enemies, and NPCs all trigger correctly

---

## 2026-06-17 — feat: subject level progress with streak dots + evo stage visual preview in Collection

### src/components/Collection.jsx
- `SubjectLevelProgress` component: LEVEL UP section per creature card; shows Thai/Math/Eng icon badge, Lv + grade label, 3 streak dots (glowing when filled), mastery bar for current level, "LEVEL UP! ⬆️" when streak≥3
- `CreatureJourney` STAGE row replaced with 3 mini `drawCreature` canvases (Baby 29px / Teen 38px / Final 48px); future = grayscale + dim; current = gold glow + NOW label; past = ✓
- `PartyGrid` signature extended with `subjectLevels`, `subjectSessionStreak`, `levelMastery`; passed down from Collection state

---

## 2026-06-17 — fix: collection screen dark pixel art theme — creature cards, tabs, journey section

### src/components/Collection.jsx
- Header: `fontSize:11→10`, `color:#EF9F27`, `letterSpacing:3`, `borderBottom:rgba(255,255,255,0.08)`
- Tabs: inline style overrides — active `color:#EF9F27 + borderBottom:2px solid #EF9F27`, inactive `rgba(255,255,255,0.35)`, both `background:transparent`
- Card container: `background:#0f0f1a`, dark/gold border, `borderRadius:0`, gold `boxShadow` glow on active card
- Active badge: `#FFD700→#EF9F27`; creature name inline dark style; level `rgba(0.5→0.35)`; HP bar `rgba(0,0,0,0.5)` bg
- Set active button: filled `#B8860B` → transparent outlined `border:1px solid #EF9F27`, `color:#EF9F27`
- CreatureJourney: `width:'100%'` on container; label "JOURNEY AHEAD"; future step icon `rgba(255,255,255,0.2)`; needs text `rgba(255,100,100,0.5)` (was white)

---

## 2026-06-17 — feat: mission progress panel in empty space above map — shows objective, enemies, daily progress

### src/components/WorldScreen.jsx
- `MissionPanel` component added (above WorldScreen): `SCREEN_NAMES` + `SCREEN_ENEMIES` lookup tables for 6 screen IDs; shows map name + cleared badge, objective text, enemy list, daily progress bar (dailyBattleRounds/10)
- `<MissionPanel>` rendered below `<WorldHUD>`, `zIndex:25`, `pointerEvents:none`
- Camera offset: `HUD_CONTENT_H/2` → `(HUD_CONTENT_H + PANEL_H=72) / 2` — map now centers in space below panel

---

## 2026-06-17 — fix: RewardChest — static import for drawItem + collected animation before closing

### src/components/RewardChest.jsx
- Static `import { drawItem } from '../lib/itemArt.js'` replaces dynamic import inside ref callback (fixes black canvas)
- New `collected` phase: items animate to `translateY(-60px) scale(0.5)` + fade out over 0.6s staggered; "เข้ากระเป๋าแล้ว!" banner fades in; `onDone` auto-fires after 1200ms
- Tap in `reveal` → `collected` phase (was: tap in `reveal` → `onDone` immediately)
- Tap hint: `reveal`→"แตะเพื่อเก็บ!", `collected`→"" (hidden), else "แตะเพื่อเปิด!"

---

## 2026-06-17 — fix: item bag popup reads from homeItems/battleItems + pixel art redesign + show correct counts

### src/components/WorldScreen.jsx
- Split `items = state.homeItems` into `homeItems = state.homeItems` + `battleItems = state.battleItems`
- HUD battle items bar: `items[key]` → `battleItems[key]` (was reading home items, showing wrong counts)
- `homeItemCount`: `items[k]` → `homeItems[k]`
- Item bag popup: `state.items` → `state.homeItems`; `USE_ITEM` → `USE_HOME_ITEM`; closes bag after use
- Popup redesigned: dark pixel art style (`#0a0a12` bg, pixel font), HOME 4-col grid (40px drawItem canvas + ×count in gold), BATTLE 5-col grid (32px PixelItemIcon + ×count in green), CLOSE button

---

## 2026-06-17 — feat: rewrite TreasureSlot — pixel art chest open animation + item reveal with drawItem

### src/components/TreasureSlot.jsx (full rewrite)
- Removed slot machine reels entirely
- New flow: question gate → chest shakes (tap to open) → chest opens → items float up → รับของ! button
- Rolls home item (55% chance from food/ribbon/shoes/rainbow_star) + battle item via `rollBattleItem()`
- Items drawn via dynamic `import('../lib/itemArt.js').then(drawItem)` canvas; glow + label + type badge
- `onReward` now passes `{ rewards: [{type, key}, ...] }` array (was `{qty, type, battleItem}` object)

### src/components/WorldScreen.jsx
- `handleTreasureReward`: updated to handle `reward.rewards[]` array format; dispatches `DROP_HOME_ITEM` / `DROP_BATTLE_ITEM` per item (was `DROP_ITEM` with qty loop)

---

## 2026-06-17 — feat: post-battle reward chest with open animation — battle + home item drops

### src/components/RewardChest.jsx (new file)
- Phases: closed → shaking (400ms delay) → opening (600ms animation) → reveal
- Tap at any phase to accelerate to open; tap at reveal to continue
- Pixel art items drawn via dynamic `import('../lib/itemArt.js').then(drawItem)` on canvas refs
- Item glow labels using ITEM_COLORS; type tag (ไอเทมสู้/ไอเทมบ้าน) shown below each item
- Empty rewards handled gracefully ("ไม่มีของรางวัลครั้งนี้...")

### src/components/WorldBattle.jsx
- Imports `rollBattleItem` from `itemConfig.js` and `RewardChest`
- Module-level `HOME_DROP_TABLE` (food 50 / ribbon 25 / shoes 15 / rainbow_star 10) + `rollHomeItem()` (40% chance)
- `onComplete()`: rolls both drops, dispatches `DROP_BATTLE_ITEM` / `DROP_HOME_ITEM`, calls `setPendingRewards(rewards)` instead of navigating immediately
- Chest overlay rendered in JSX; `onDone` dispatches `CLEAR_PENDING_REWARDS` + `RETURN_FROM_WORLD_BATTLE` then navigates

### src/context/StateContext.jsx
- `ACTIONS.SET_PENDING_REWARDS` + `ACTIONS.CLEAR_PENDING_REWARDS` added
- Reducer cases: `SET_PENDING_REWARDS` sets `state.pendingRewards`; `CLEAR_PENDING_REWARDS` resets to `[]`

### src/lib/state.js
- `pendingRewards: []` added to `defaultState()`

### src/styles.css
- `@keyframes chest-shake` — horizontal wiggle with rotation
- `@keyframes sparkle-rise` — scale + float up + fade out
- `@keyframes fadeInUp` — slide up + fade in for revealed items

---

## 2026-06-17 — fix: gentle monster scaling + stricter adaptive difficulty (streak resets properly)

### src/context/StateContext.jsx
- `scaleMonsterStats()`: replaced step function (1.0/1.3/1.8/2.4/3.2x) with linear `1.0 + (level-1)*0.02`, hard-capped at 2.0x; DEF now scales at `mult*0.5` (slower than HP/ATK)

### src/components/WorldScreen.jsx
- `triggerBattle` scaleFactor: `0.4/level` → `0.15/level` (capped at 4x); level 16 was 7x, now 3.25x
- Enemy HP/ATK floors: `Math.max(30, ...)` and `Math.max(4, ...)` prevent trivially-weak enemies at Lv1
- DEF scales at `cappedScale * 0.5`

### src/components/WorldBattle.jsx
- `isStrong` minimum questions: 6 → 8
- Streak always resets to 0 on any non-strong session (was only reset on level-up or level-down, causing slow drift upward)
- Level-down minimum questions: 6 → 8 (consistent with `isStrong`)

---

## 2026-06-16 — fix: cap creature currentHP at stats.HP max in all heal/boost actions

### src/context/StateContext.jsx
- `CREATURE_HEAL`: maxHP changed from `(e.stats?.HP ?? 10) + (battleLevel - 1)` to `e.stats?.HP ?? 100` — the battleLevel bonus was the root cause of Chopin's 519 > 504 bug
- `USE_HOME_ITEM` food: now also heals active creature +30 HP (capped at `stats.HP`); was happiness-only before
- `CREATURE_STAT_BOOST`: after updating stats, `currentHP` is clamped to `newStats.HP ?? 100` (defensive — prevents overflow if HP stat was the one boosted)
- Initializer: clamps all `currentHP` values to `stats.HP` on every app load (fixes corrupted states like Chopin's immediately on next open)

---

## 2026-06-16 — fix: calibrate subject levels + accurate score tracking + item migration + grade/evo system + remove debug code

### src/context/StateContext.jsx
- Added `calcEvoStageInline(battleLevel, grade, bond)` helper above reducer (avoids circular import)
- Initializer migration 1: `_subjectLevelCalibrated` — recalibrates `subjectLevels` from `levelMastery` (highest level with ≥60% mastery) on first load
- Initializer migration 2: `_itemsMigrated` — additive merge of `items{}` into `homeItems/battleItems` (handles states where both exist simultaneously)
- Initializer migration 3: `_evoRechecked` — rechecks `evoStage` for all creatures after `_migrateBattleStats` populates `battleLevel`
- `SET_SUBJECT_LEVEL` reducer: grade now computed from avg subject level (thresholds: avg≥2→grade1, avg≥3→grade2, avg≥4→grade3); grade only advances, never drops; creature `evoStage` updated inline when grade changes

### src/components/WorldBattle.jsx
- Added `accuracyRef = useRef({ correct: 0, total: 0 })` to track real answer counts
- `onCorrect()`: increments both `correct` and `total` in accuracyRef
- `onWrong()`: increments `total` only
- `onComplete()`: score replaced with `accuracy = correct/total`; `isStrong = accuracy≥0.80 AND total≥6`; level-up uses `isStrong`; level-down uses `accuracy<0.50 AND total≥6`; `LOG_SESSION` now includes `questionsAnswered` and accurate `wrong` count

### src/App.jsx
- Removed `debugSupabaseState()` function, its call, and emergency restore button JSX
- Removed `import { supabase }` (was added only for debug)

---

## 2026-06-16 — debug: Supabase state restore for emergency recovery

### src/App.jsx
- Added `debugSupabaseState()` — logs full Supabase eggs row + hatchedEggs count to console on every load (temporary)
- Added emergency restore button (🔄 กู้คืนข้อมูล) — fixed bottom-center, visible only when hatchedEggs is empty; fetches state_json from Supabase and writes to kq_state, then reloads

---

## 2026-06-16 — fix: restore login button + auto-restore from Supabase when local state is empty

### src/components/Home.jsx
- Added `onOpenLogin` and `onOpenProfile` to function props (were passed from App.jsx but silently ignored)
- Added `isLoggedIn` state via `supabase.auth.getSession()` + `onAuthStateChange` listener
- Imported `supabase` from lib
- Header: login button (เข้าสู่ระบบ) when not logged in; profile button (shows child name) when logged in

### src/context/StateContext.jsx
- SIGNED_IN handler: now always takes cloud data when cloud has hatchedEggs and local is empty, regardless of rounds count (prevents reset state from blocking restore)
- Added startup guard: if user is authenticated but local hatchedEggs is empty on mount, auto-fetches from Supabase and dispatches INIT

---

## 2026-06-16 — feat: connect creature/egg/tier/level systems — unified progression via PROGRESSION_MAP

### src/config/battleConfig.js
- Added PROGRESSION_MAP: 5 tiers (tier 0–4 / อนุบาล→ป.3+), each with minSubjectLevel, eggUnlock, mapTheme
- Added evoRequirements (teen: Lv11+Tier1, final: Lv26+Tier3+Bond60) — single source of truth for evo thresholds

### src/lib/creatureSystem.js
- calcEvoStage() now reads PROGRESSION_MAP.evoRequirements instead of hard-coded numbers
- Changed thresholds: teen was (lv≥11, tier≥2) → now (lv≥11, tier≥1); final was (lv≥26, tier≥5, bond≥60) → now (lv≥26, tier≥3, bond≥60)
- Added import for PROGRESSION_MAP from gameConfig.js

### src/context/StateContext.jsx
- Added PROGRESSION_MAP import from gameConfig.js
- ADD_XP case: removed XP-based readyToHatch computation (3 lines removed)
- SET_SUBJECT_LEVEL case: now detects tier advance when ALL subjects reach next tier's minSubjectLevel; auto-increments state.grade; sets readyToHatch when hatchedEggs < 6

### src/components/Home.jsx
- readyToHatch local var: removed stage >= EGG_STAGES-1 check (tier-advance is now the trigger); kept (hatchedEggs === 0) guard against ghost messages
- Removed unused EGG_STAGES import

### src/components/Collection.jsx
- Added PROGRESSION_MAP import
- Added CreatureJourney component: shows evolution roadmap (○/⚡/✅) with level/tier/bond requirements; BABY→TEEN→FINAL stage tracker
- PartyGrid: added currentTier prop; renders <CreatureJourney /> below each creature card

### src/components/Report.jsx
- Added PROGRESSION_MAP import
- Parent report section: appended tier progression line (current tier name + sessions until next tier unlock)

---

## 2026-06-16 — feat: adaptive difficulty — auto level up/down + level-up cutscene + map sky tint

### src/lib/state.js
- Added to defaultState(): `subjectSessionStreak`, `subjectLevelFloor`, `pendingLevelUp`

### src/context/StateContext.jsx
- Added ACTIONS: SET_SUBJECT_LEVEL, SET_PENDING_LEVEL_UP, CLEAR_PENDING_LEVEL_UP, SET_SUBJECT_SESSION_STREAK
- Added reducer cases for all 4 new actions; SET_SUBJECT_LEVEL also updates subjectLevelFloor

### src/components/WorldBattle.jsx
- onComplete(): after each non-boss battle, check score and subject streak
  - score ≥ 0.80 → increment streak; after 3 consecutive → dispatch SET_SUBJECT_LEVEL + SET_PENDING_LEVEL_UP + reset streak
  - score < 0.50 → silent level down (clamped to floor), reset streak
  - 0.50–0.79 → reset streak only (hold current level)

### src/components/WorldScreen.jsx
- triggerBattle + enterBossBattle: replaced `getBattleLevel()` with `state.subjectLevels?.[subject] ?? 1`
- Added SKY_TINTS constant (4 time-of-day colors for levels 1/2/3/4+)
- Added sky tint overlay div in JSX (reads active subject via getBattleSubject + subjectLevels, transitions with CSS)

### src/components/LevelUpCutscene.jsx (new)
- 4-phase cutscene: flash → reveal → celebrate → done
- Canvas star rain animation (35 stars, 4-point rotating shapes, 6 colors)
- Displays subject label, LEVEL UP!, Lv.old→Lv.new, new level name (Thai)
- "แตะเพื่อดำเนินการต่อ" blink prompt when done; tap triggers onDone

### src/App.jsx
- Imported LevelUpCutscene; global overlay renders when `state.pendingLevelUp` is set
- onDone: dispatches CLEAR_PENDING_LEVEL_UP + navigates to world

### src/styles.css
- Added keyframes: `blink`, `levelup-pulse`, `scale-pop`, `arrow-slide`

---

## 2026-06-16 — feat: report subject level/grade section

### src/components/Report.jsx
- Added SUBJECT_LEVEL_MAP (Thai 5 levels, Math 9 levels, Eng 4 levels) with Thai grade labels
- Added SubjectLevelCard: collapsible row showing current level name + grade badge; expands to full table with ✓/►/· status per level
- New LEVEL · GRADE section inserted as Section 3 (response speed/parent report shifted to 4/5/6)

---

## 2026-06-16 — feat: new home items — shoes + rainbow star + saiyan aura

### src/config/itemConfig.js
- Added HOME_ITEMS export: food (instant heal), ribbon (SPD boost 5min), shoes (map speed ×2, 5min), rainbow_star (saiyan aura, 5min); all timed boosts with 5min cooldown

### src/lib/itemArt.js
- Added pixel art drawers: shoes (orange sneaker with laces/tongue/stripe), rainbow_star (multicolor 8-arm star with sparkle dots)

### src/lib/state.js
- defaultState homeItems: {food, ribbon, shoes, rainbow_star}; added activeBoosts: {}

### src/context/StateContext.jsx
- USE_HOME_ITEM: ribbon/shoes/rainbow_star store boost in state.activeBoosts (persisted)
- Migration on load: star→rainbow_star, potion→shoes; ensure activeBoosts: {} exists

### src/components/Home.jsx
- ITEM_DEFS: food/ribbon/shoes/rainbow_star
- Local activeBoosts state removed; hasRibbon + saiyanActive derived from state.activeBoosts
- handleTapItem: ribbon/shoes/rainbow_star handlers; rainbow_star triggers excited state + saiyan reaction
- Creature canvas wrapped with saiyan-pulse drop-shadow when rainbow_star active

### src/components/WorldScreen.jsx
- tryMove: shoes doubles tile step (stateRef.current.activeBoosts.shoes.endsAt check)
- Canvas loop: rainbow_star adds ctx.shadowBlur gold glow on player sprite
- HOME_ITEM_KEYS/LABELS/EFFECTS updated; `state.homeItems` replaces `state.items` in WorldHUD

### src/games/MoveSelectBattleMode.jsx
- saiyanActive check; eggFilter gets gold drop-shadow + brightness(1.3) when rainbow_star active

### src/components/Collection.jsx
- HOME_ITEM_DEFS: shoes/rainbow_star replace potion/star

### src/styles.css
- Added saiyan-pulse keyframe (gold/orange glow pulsing filter)

---

## 2026-06-16 — refactor: separate homeItems and battleItems — clean up item system

### src/lib/state.js
- Split `items{}` into `homeItems: { food, ribbon, potion, star }` + `battleItems: { scroll, thunder, gem, mirror, clover }`

### src/context/StateContext.jsx
- Added ACTIONS: USE_HOME_ITEM, USE_BATTLE_ITEM, DROP_HOME_ITEM, DROP_BATTLE_ITEM
- Replaced USE_ITEM/DROP_ITEM reducer cases; kept backward-compat aliases
- Fixed RECORD_BATTLE to use `battleItems` not `items`
- Added localStorage migration: `items{}` → `homeItems{}` + `battleItems{}` on load

### src/components/Home.jsx
- Item tray reads from `state.homeItems`, dispatches USE_HOME_ITEM
- ITEM_DEFS: 4 home items (food/ribbon/potion/star) with effect/desc text

### src/games/MoveSelectBattleMode.jsx
- All item reads from `state.battleItems`; dispatches USE_BATTLE_ITEM / DROP_BATTLE_ITEM

### src/components/Collection.jsx
- ItemBag rewritten: two sections (ไอเทมดูแลครีเอเจอร์ / ไอเทมในการสู้) with divider
- Removed non-existent items: shield, bone, coin

---

## 2026-06-16 — fix: flat 20% dodge cap + temporary item boosts with cooldown timer

### src/games/MoveSelectBattleMode.jsx
- Dodge = flat 20% (removed SPD scaling; SPD=210 was giving 100% dodge)

### src/components/Home.jsx
- `activeBoosts` state for ribbon (5 min / 30 min cooldown) + star (10 min / 60 min cooldown)
- Ribbon and star give temporary visual buff only — no permanent CREATURE_STAT_BOOST dispatch
- Ribbon expiry useEffect auto-clears `hasRibbon` visual
- Item tray: orange active overlay with countdown, dark cooldown overlay with timer, count badge only when ready

---

## 2026-06-16 — refactor: report screen — pixel art theme, parent report, 5 sections

### src/components/Report.jsx (full rewrite)
- Removed: MissionAnalytics (shopV1 dead), raw session history table, all light-theme CSS
- Header: "REPORT" in font-pixel yellow, dark background matching Home/Collection
- Section 1: 2×2 stat cards (mins/rounds/acc/streak), color-coded
- Section 2: Subject XP bars (Thai red / Math blue / Eng orange), readiness label below each
- Section 3: ResponseSpeed component restyled dark (unchanged logic, visible only when data exists)
- Section 4: Parent Report — natural Thai sentences from real data (dominant subject, accuracy insight, streak, speed trend, weak-subject nudge)
- Section 5: "ควรเล่นอะไรต่อ" — actionable suggestion with gold border box

---

## 2026-06-16 — fix: enemy ATK from correct source + cap dodge chance at 30%

### src/games/MoveSelectBattleMode.jsx
- `fireMiss()`: damage now reads `enemyData?.atk` (scaled world-battle prop) not `enemy.atk` (local useState with no combat stats)
- `fireMiss()`: dodge chance = `min(0.30, SPD/500)` — capped at 30%; old `SPD/200` gave 80% dodge at SPD=160

---

## 2026-06-16 — fix: unified HP scale between home and battle, localCreatureHP tracks damage in-battle

### src/components/WorldBattle.jsx
- Removed `WB_HP_SCALE` from `creatureStats.HP` — HP is now raw same-unit as Home screen
- `creatureCurrentHP = creature.currentHP ?? creatureStats.HP` (no scale conversion)
- `handleCreatureTakeDamage` dispatches raw damage (no `/ WB_HP_SCALE` division)
- Passes `onCreatureHeal={() => {}}` prop to MoveSelectBattleMode

### src/games/MoveSelectBattleMode.jsx
- Accepts `onCreatureHeal` prop
- `fireHit()` increments `localCreatureHP` +1 when `creature.bondMeter >= 75` so the HP bar reflects passive heals in-battle

---

## 2026-06-16 — fix: creature HP decreases in battle, HP numbers shown, name badge visible, shake on hit

### src/games/MoveSelectBattleMode.jsx
- Added `localCreatureHP` state (init from `creatureCurrentHP` prop); `fireMiss()` now decrements this local state instead of reading the stale prop snapshot — creature HP actually decreases each hit
- GBHPBar: added `current`/`max` props; both HP bars now show e.g. `17/20` to the right of the fill bar
- Name badges: added `color:#fff` + `rgba(0,0,0,0.6)` background inline on both enemy and player badges — text was invisible on dark bg
- `fireMiss()`: added `setEggAnimClass('shake')` → `translateX(-8px)` on creature canvas for visible hit feedback, clears after 400ms
- `_displayPlayerHP` now uses `localCreatureHP` so the bar reflects local state, not stale prop

### src/components/WorldBattle.jsx
- `creatureCurrentHP` now scales stored `creature.currentHP` by `WB_HP_SCALE` to match the scaled `creatureStats.HP` unit; defaults to `creatureStats.HP` when no HP stored yet

### src/styles.css
- `.px-name-badge`: added `color:#fff` to base rule

---

## 2026-06-16 — refactor: simplify collection to team+items tabs, pixel art style, remove duplicate nav button

### src/components/Collection.jsx
- Removed tabs: vault (คลังสะสม), hatched (ทั้งหมด), current (กำลังฟัก) — redundant with team tab
- Removed sub-components: VaultGrid, HatchedGrid, CurrentEgg
- Removed unused imports: EggCanvas, buildEggStats, eggProgress, EGG_STAGE_NAMES, STAGE_XP_NEEDED, buildLegacyPreviewDNA
- Now 2 tabs only: ทีม (PartyGrid, unchanged) + กระเป๋า (new ItemBag)
- ItemBag: 4×2 grid of 8 items via `drawItem` canvas; count badge; dimmed at opacity 0.4 when count=0
- Pixel art header: "COLLECTION" in font-pixel yellow; background changed to `var(--px-darkest, #0a0a12)`

### src/components/Home.jsx
- Removed คอลเลกชัน button from action row (Collection accessible via bottom nav tab)
- Remaining buttons: ลูบ! (flex:1) + ออกสำรวจ! (flex:2)

---

## 2026-06-16 — fix: remove duplicate walking creature, add HP bar, fix ribbon stat boost

### src/components/Home.jsx
- Removed duplicate creature companion system (state: creature/creatureTapped/creatureState; refs: creatureRef/creatureModeRef; patrol setInterval effect; personality setTimeout effect; companion div ~60 lines) — `HomeBackground.jsx` walking system is the canonical one
- Added HP bar below stat row in creature zone: color-coded green (>60%), yellow (>25%), red (≤25%), shows `currentHP/maxHP` in pixel font
- Ribbon item now dispatches `CREATURE_STAT_BOOST` (+10 SPD) to active party creature and shows `⚡ SPD+10` bond reaction overlay

### src/context/StateContext.jsx
- Added `CREATURE_STAT_BOOST: 'CREATURE_STAT_BOOST'` to ACTIONS enum
- Added reducer case: patches `stats[stat]` in-place on target egg by `creatureId`

---

## 2026-06-16 — fix: CreatureDetailPopup — pixel art creature canvas, battle stats, bond meter

### src/components/CreatureDetailPopup.jsx
- FULL REWRITE: removed `CreatureCanvas` + `drawEgg` imports; added `drawCreature + getCreatureSeed` from `creatureAlgorithm.js`
- Creature display: 120×120 `<canvas>` using pixel art renderer with element color glow (`drop-shadow` via `CREATURE_ELEMENT_COLORS`)
- Added: Level + evo stage row below name/badge section
- Added: ATK/DEF/SPD/HP 4-column grid (from `egg.stats`) replacing old streak/accuracy/minutes
- Added: bond meter bar (from `egg.bondMeter`) with gold fill
- Removed: 196px `<CreatureCanvas dna={...}>` + 48×58 egg mini canvas + abilities section
- Born stats: XP origin bars kept, section renamed "ต้นกำเนิด", egg canvas removed from this section
- Imports `CREATURE_ELEMENT_COLORS, CREATURE_ELEMENT_NAMES_TH, EVO_STAGE_LABELS_TH` from `creatureSystem.js`

---

## 2026-06-16 — fix: home background walking character uses active creature design

### src/components/HomeBackground.jsx
- Added `import { drawCreature } from '../lib/creatureAlgorithm.js'`
- Added `creatureSeed` + `creatureStats` props to component signature
- Added `offRef = useRef(null)` to cache 32×32 offscreen canvas across frames
- Added `useEffect([creatureSeed, creatureStats])` that calls `drawCreature(off, creatureSeed, creatureStats)` when seed changes
- Added walking creature animation in rAF loop: draws from `offRef.current` at ground level, `ctx.save/translate/scale(-1,1)` flip when walking left, bounces between 33–67% canvas width at 0.8 px/frame

### src/components/Home.jsx
- Updated `<HomeBackground>` to pass `creatureSeed` + `creatureStats` from `activeEgg`
- Replaced 46×46 `<CreatureCanvas>` creature companion with `<canvas ref={r => drawCreature(r, getCreatureSeed(activeEgg), activeEgg.eggStats ?? {})}>` using `creatureAlgorithm.js`
- Removed dead `lastCreatureDNA` useMemo block (was only consumed by the now-replaced CreatureCanvas companion)

---

## 2026-06-16 — fix: creature drawing on world map player sprite and Collection screen

### src/lib/tileEngine.js
- Added `import { drawCreature } from './creatureAlgorithm.js'`
- Added module-level `_playerOff` lazy-init offscreen canvas (reused every frame, no per-frame GC)
- Replaced old fillRect humanoid in `renderPlayer()` with `drawCreature` + `ctx.drawImage` blit at TILE×TILE size

### src/components/WorldScreen.jsx
- Added `import { getCreatureSeed } from '../lib/creatureAlgorithm.js'`
- Sets `window.__kq_activeCreatureSeed` and `window.__kq_activeCreatureStats` in render body from active creature

### src/components/Collection.jsx
- Removed `import CreatureCanvas` (no longer used for grid cards)
- Added `import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'`
- Replaced all 3 `<CreatureCanvas dna={...}>` usages (CreatureCard, PartyGrid, VaultGrid) with `<canvas ref={...} width={90} height={90}>` using pixel art system
- `CurrentEgg` EggCanvas left unchanged (draws unhatched egg)

---

## 2026-06-16 — fix: unify creature drawing across all screens — single drawCreature system

### src/components/PartySelect.jsx
- Removed 🥚 emoji placeholder; added `<canvas>` with `drawCreature(r, getCreatureSeed(c), c.eggStats ?? {})` at 56×56px
- Imports `drawCreature, getCreatureSeed` from `creatureAlgorithm.js`

### src/games/MoveSelectBattleMode.jsx
- Added `creature` prop to component signature
- When `isWorldBattle && creature`: shows creature canvas (96×96) instead of EggCanvas — inherits same hit-flash filter
- Non-world battles (adventure modes): unchanged, still shows EggCanvas
- Imports `drawCreature, getCreatureSeed` from `creatureAlgorithm.js`

### src/components/WorldBattle.jsx
- Passes `creature={creature}` to `MoveSelectBattleMode` (creature object was already available)

---

## 2026-06-16 — refactor(phase1): delete dead files, split gameConfig, add file headers

### Deleted
- `src/components/ChallengerOverlay.jsx` — confirmed no active imports; dead code

### src/config/creatureConfig.js (NEW)
- Extracted from `gameConfig.js`: `HATCH_CREATURES`, `GRADE_LABELS`, `CREATURE_LEVELS`, `TIERS`, `calcCreatureStats()`

### src/config/battleConfig.js (NEW)
- Extracted from `gameConfig.js`: `BOSS_XP_THRESHOLD`, `AI_OPPONENTS`

### src/config/mapConfig.js (NEW)
- Extracted from `gameConfig.js`: `MAP_THEMES`

### src/config/gameConfig.js
- Removed the 6 exports above; added barrel re-exports (`export * from './creatureConfig.js'` etc.) — all existing import sites unchanged

### File headers added (1-line comment at top)
- `src/components/WorldScreen.jsx`
- `src/games/MoveSelectBattleMode.jsx`
- `src/components/Home.jsx`
- `src/context/StateContext.jsx`
- `src/lib/drawCreature.js`

---

## 2026-06-16 — feat: auto-generate creature names from DNA — remove manual naming UI

### src/lib/creatureGenerator.js
- Added `generateCreatureName(dna)`: deterministic family-based name picker with optional stat modifier suffix. 17 family pools × 5 names, 4 stat modifiers × 4 words.

### src/context/StateContext.jsx
- Imports `generateCreatureName`; HATCH_COMPLETE sets `creatureName: dna ? generateCreatureName(dna) : null` (was `null`)

### src/lib/state.js
- Imports `generateCreatureName`; `_migrateBattleStats` backfills `creatureName` for any hatched egg missing one

### src/components/HatchOverlay.jsx
- Removed `handlePickName` function and `CREATURE_NAME_SUGGESTIONS` import
- Removed `naming` phase JSX block entirely
- `done` phase: replaced "ตั้งชื่อ ✏️" + "ข้ามการตั้งชื่อ" buttons with single "ดำเนินการต่อ!" button

---

## 2026-06-15 — feat: lock to single creature, disable new egg creation and auto-hatch

### src/context/StateContext.jsx
- ADD_XP: `readyToHatch` only true when `hatchedEggs.length === 0` — no egg pressure once creature exists
- HATCH_COMPLETE: early return `state` when `hatchedEggs.length >= 1` — blocks new egg creation

### src/components/HatchOverlay.jsx
- `isOpen` guarded by `!hasCreature` — overlay never opens (auto or manual) when creature exists

### src/components/Home.jsx
- Added `activeCreature` memo (party[0] → hatchedEggs[0] fallback)
- `readyToHatch` local: also guards `eggsHatched === 0`
- `handlePetEgg`: does not dispatch SET_HATCHING when creature exists
- Header: stage name → creature name when creature exists; element hint + "พร้อมฟัก!" badge hidden
- Egg zone (title + egg canvas + hatch CTA): wrapped in `{eggsHatched === 0 && (...)}`
- Creature stats panel added: name, Lv.X, 2×2 ATK/DEF/SPD/HP grid — shown when creature exists
- "ลูบไข่" button label: "ลูบ!" when creature exists

---

## 2026-06-15 — feat: scale enemy stats with player battle level

### src/components/WorldScreen.jsx
- `triggerBattle`: looks up active party creature `battleLevel`, computes `scaleFactor = 1 + (playerLevel - 1) * 0.4`, applies `Math.round(base * scaleFactor)` to hp/atk/def before dispatching SET_PENDING_BATTLE
- Level 1 = base stats unchanged; level 10 = 4.6× base; linear 40% increase per level

---

## 2026-06-15 — fix: use average stats for creature merge instead of sum

### src/lib/state.js
- `_mergeAllCreaturesIntoOne`: fresh-merge path now computes AVERAGE stats (÷ eggs.length) for ATK/DEF/SPD/HP/battleXP/bondMeter instead of sum
- Added re-averaging path: if `eggs.length === 1 && mergedFromCount > 1 && !_statAveraged`, divides the previously-summed stats by `mergedFromCount` to correct them
- Return value now includes `_statAveraged: true`

### src/context/StateContext.jsx
- Initializer `needsMerge`: extended condition triggers re-run when `_creaturesMerged && hatchedEggs.length === 1 && !_statAveraged`
- `loadState().then()` `remoteNeedsMerge`: same extended condition so Supabase state is also corrected on load

---

## 2026-06-15 — hotfix: force creature merge migration + fix frozen กลับ button

### src/lib/state.js
- `_mergeAllCreaturesIntoOne`: return value now includes `_creaturesMerged: true` flag

### src/context/StateContext.jsx
- Initializer: `needsMerge` guard uses `_creaturesMerged` flag — idempotent even after INIT re-fires
- `loadState().then()`: runs merge on remote Supabase data before dispatching INIT — ensures 43-egg cloud state is merged to 1 egg before INIT, then saveState() pushes merged state back to Supabase
- CLOSE_HATCH reducer: now also sets `readyToHatch: false` — was the root cause of the frozen กลับ button (CLOSE_HATCH cleared `hatching` but left `readyToHatch: true`, so `isOpen` immediately flipped back and re-showed the overlay)

### src/components/HatchOverlay.jsx
- Full-collection กลับ button: replaced `doClose` with `handleFullClose` — dispatches CLOSE_HATCH + SET_HATCHING then calls `onClose?.()` directly, skipping the "ไข่ใบใหม่เริ่มต้นแล้ว" toast that was wrong for this case

---

## 2026-06-15 — fix: suppress hatch during battle + one-time creature merge migration

### src/App.jsx
- `HatchOverlay suppressAutoOpen` extended: now also suppresses when `screen === 'world-battle'`, `!!state.pendingBattle`, or `!!state.battleCreatureId` — prevents hatch sequence from interrupting mid-battle

### src/lib/state.js
- Added `_mergeAllCreaturesIntoOne(state)`: sums stats (ATK/DEF/SPD/HP/battleXP/bondMeter) across all hatched eggs, uses most-recently-hatched as base, returns state with `hatchedEggs: [merged]`, `party: [merged.id]`, battle state cleared. Guard: no-op if `eggs.length <= 1`. `mergedFromCount` stored on result for audit trail.

### src/context/StateContext.jsx
- Imports `_mergeAllCreaturesIntoOne`; initializer now calls it after `_migrateBattleStats` when `hatchedEggs.length > 1` — one-time migration collapses Chopin's multiple creatures into one combined creature on first load

---

## 2026-06-15 — hotfix: disable challenger useEffect — root cause of PartySelect freeze

### src/context/StateContext.jsx
- Commented out the `dailyBattleRounds` useEffect: every world battle incremented `dailyBattleRounds` → useEffect fired → `SET_CHALLENGER` dispatched → `pendingChallenger` set → `dailyBattleRounds` reset to 0 → useEffect fired again; loop set `pendingChallenger` on every single battle encounter, breaking PartySelect condition
- `SET_CHALLENGER` / `CLEAR_CHALLENGER` reducers left intact for future re-enable

---

## 2026-06-15 — hotfix: atomic battle dispatch fixes PartySelect loop + remove ChallengerOverlay

### src/context/StateContext.jsx
- Added `SELECT_CREATURE_AND_ENTER_BATTLE` action + atomic reducer: sets `battleCreatureId`, `worldPosition`, `worldBattleEnemy`, and clears `pendingBattle` in a single state update — eliminates intermediate render where `battleCreatureId` was set but `pendingBattle` still non-null

### src/App.jsx
- `PartySelect.onSelect`: replaced 2 dispatches (`SET_BATTLE_CREATURE` + `ENTER_BATTLE_FROM_WORLD`) with single `SELECT_CREATURE_AND_ENTER_BATTLE` dispatch
- Removed `ChallengerOverlay` import, `challengerOpen` state, `pendingChallenger` useEffect, `<ChallengerOverlay>` JSX, and `onOpenChallenger` prop

---

## 2026-06-15 — hotfix: fix baby_zombie collision infinite dispatch loop (battleDispatchedRef reset timing)

### src/components/WorldScreen.jsx
- Previous fix reset `battleDispatchedRef.current = false` unconditionally when `pendingBattle` was null — but RAF runs before React commits state, so on the tick immediately after dispatch `pendingBattle` still reads null and the guard was immediately cleared
- Fix: only reset the guard when it is already `true` AND `pendingBattle` is null (confirmed clear); when guard is up, still call `updateEnemies()` for enemy movement but skip battle trigger

---

## 2026-06-15 — hotfix: fix infinite loop when enemy AI walks into player

### src/components/WorldScreen.jsx
- Added `battleDispatchedRef = useRef(false)` — synchronous flag set immediately when `triggerBattle` is dispatched
- RAF loop: resets `battleDispatchedRef.current = false` when `stateRef.current.pendingBattle` is null (state committed)
- RAF loop: checks `!battleDispatchedRef.current` before calling `triggerBattleRef` on enemy-initiated collision
- Root cause: `stateRef` is only updated via `useLayoutEffect` after React re-renders, so the 3-frame gap between dispatch and state commit allowed repeated `triggerBattle` calls on enemy-initiated encounters

---

## 2026-06-15 — feat: Map System — item bag HUD, 4-map-per-tier tracking, secret maze battle-wins trigger, boss gating

### src/config/gameConfig.js
- Added `MAP_THEMES` (NW/NE/SW/SE → name/element/mapIndex) and `BOSS_XP_THRESHOLD = 300`

### src/lib/state.js
- Added `clearedMaps: []` and `secretMapExpiry: null` to `defaultState()`

### src/context/StateContext.jsx
- 3 new ACTIONS: `MAP_CLEARED`, `SECRET_MAP_SPAWN`, `SECRET_MAP_EXPIRE`
- `INCREMENT_BATTLE_WINS`: auto-spawns maze when `battleWins % 10 === 0 && !mazeActive` (sets `secretMapExpiry = Date.now() + 30min`)
- `SET_WORLD_LEVEL`: now also resets `clearedMaps`, `secretMapExpiry`, `bossDefeatedThisTier`
- `DEFEAT_BOSS`: now also resets `clearedMaps`, `secretMapExpiry`

### src/components/WorldScreen.jsx
- `WorldHUD`: added 🎒 item bag button (38px, red count badge); minimap shows ✓ on cleared maps, "N/4 [world]" label, boss tile grayed/locked vs red/!, MAZE ? indicator; `bossMapUnlocked` prop
- `bossMapUnlocked` computed: `allMapsCleared && totalXP >= 300`
- `handleExit`: dispatches `MAP_CLEARED` on leaving NW/NE/SW/SE; blocks BOSS entry if not unlocked
- Removed old random-timer maze useEffect and battleWins-based world unlock useEffect
- Added `useEffect([secretMapExpiry])`: sets timeout to dispatch `SECRET_MAP_EXPIRE` on expiry
- Added `useEffect([mazeActive, secretMapExpiry])`: `setInterval` for countdown display tick
- Added `useEffect([bossDefeatedThisTier])`: shows 3.5s `bossCutscene` overlay → `SET_WORLD_LEVEL(wl+1)` + worldUnlockBanner
- Boss confirm dialog: "พบบอส Final!" + "⚠️ ใช้ไอเทมไม่ได้" warning + "สู้เลย! ⚔️"
- Maze notification: "🌀 แมพลับปรากฏทางทิศใต้ · MM:SS" countdown
- Added item bag popup: 2×2 grid (food/star/ribbon/potion), USE_ITEM dispatch on tap
- Added boss cutscene banner: "โชแปงพิชิต [world]!" overlay 3.5s before tier advance
- Added boss unlock hint banner on BOSS screen when not yet unlocked (shows N/4 maps · N/300 XP)

---

## 2026-06-15 — feat: Creature System Steps 5–10 — family labels, companion zone, friendship data, ECA fields, bio phase, egg growth message

### src/components/CreatureDetailPopup.jsx
- Added `FAMILY_LABELS_TH` (16 family archetypes → Thai label), `FAVSUBJ_TH`, `FAVSUBJ_COLOR`
- Header: Moonborn badge when `family === 'moon'`
- Creature canvas wrapped in element `drop-shadow` glow filter
- Name section: `creatureName` priority + family badge + element badge
- Friendship stats row: days together, `adventuresWith`, `questionsAnswered`, favorite subject badge (green/blue/purple)

### src/components/Home.jsx
- Companion zone height 52→80px; CreatureCanvas size 22→46px
- `growthBanner` state: on mount, if `sessionXP>0` → show "ไข่ของเราโตขึ้นนะ!" / "อีกนิดเดียวก็ฟักแล้ว!" (stage≥5) after 900ms, auto-hide 3s, dispatch `SET_SESSION_XP:0`

### src/lib/state.js
- `_migrateBattleStats`: backfills `adventuresWith:0`, `questionsAnswered:0`, `eggStartDate` for legacy creatures

### src/context/StateContext.jsx
- `HATCH_COMPLETE`: adds `adventuresWith:0`, `questionsAnswered:0`, `eggStartDate` to new eggs
- `ADD_XP`: increments `questionsAnswered+1` for active party creature on correct answer
- `ROUND_COMPLETE`: increments `adventuresWith+1` for active party creature each round (always maps when activeEgg exists)

### src/components/HatchOverlay.jsx
- `bioDNA`/`bioCreature` state; mount useEffect sets `phase='bio'` when active creature has `adventuresWith>0`
- New 'bio' phase portal: `CreatureCanvas` (100px celebrate), name, adventure/question counts, "ฟักไข่ต่อ!" button, cancel button

## 2026-06-15 — feat: Creature System Phase 5 — birth sequence (CreatureCanvas reveal)

### src/components/HatchOverlay.jsx
- Replaced `{creature?.e || '🐣'}` emoji with `CreatureCanvas` (150px) in 'done' and 'naming' phases
- `buildCreatureDNA(buildEggStats(state))` called synchronously inside `doReveal` setTimeout — DNA ready at the same tick as `setPhase('done')`
- `idleMode='celebrate'` during 'done' phase; switches to `'idle'` during naming
- Element-color `drop-shadow` filter wraps CreatureCanvas (strong glow for 'done', subtle for 'naming')
- `playCreatureSound(buildVoiceProfile(dna), 'celebrate')` fires at creature reveal
- `creatureDNA` state cleared in `doClose` + on overlay re-open
- New imports: `CreatureCanvas`, `buildCreatureDNA`, `buildVoiceProfile`, `playCreatureSound`

### src/styles.css
- Added `@keyframes creature-birth` (scale 0.15→1.14→1.0 spring pop)
- Added `.hatch-creature-enter` class applying the 0.60s cubic-bezier spring animation

## 2026-06-15 — feat: Creature System Phase 4 — voice layer + name suggestion tap targets

### src/lib/creatureSystem.js
- Added `CREATURE_NAME_SUGGESTIONS` — 5 Thai name options per element (fire/water/thunder/nature/shadow/light)

### src/components/HatchOverlay.jsx
- Naming phase rewritten: replaced text input with 5 large tap-target buttons from `CREATURE_NAME_SUGGESTIONS[element]`
- Removed `nameInput` state + `handleConfirmName`; added `handlePickName(name)` that dispatches `SET_CREATURE_NAME` + `doClose`
- Child taps a name → immediately confirmed; "ข้ามการตั้งชื่อ" still available

### src/lib/audio.js
- Added `playCreatureSound(voiceProfile, moment)` — pitch-shifted creature voice using `pitchBase × (1 ± pitchVariance)`
- 5 moments: `pet/ambient` (chirp/peep/trill/hum/squeak by soundFamily), `food` (hum+chirp), `reunion` (4 ascending note pairs), `celebrate` (6-note rapid ascent), `sleep` (3 descending low hums)

### src/components/Home.jsx
- Imports `buildVoiceProfile` from `creatureGenerator.js` + `playCreatureSound` from `audio.js`
- New `voiceProfile` useMemo — derived from active party creature's DNA (falls back to hatchedEggs[0])
- Creature companion tap: `playCreatureSound(vp, 'pet')` replaces `playTone('chirp')`
- Reunion visit (>4h): `playCreatureSound(vp, 'reunion')` replaces double `playTone('chirp')`
- Companion celebrate/wave/sleep personality behaviors wired to `celebrate/pet/sleep` moments
- All creature sounds fall back to `playTone('chirp')` when no voice profile available

---

## 2026-06-15 — feat: Creature System Phase 3 — bond combat effects, 6-creature limit, evo toast

### src/lib/state.js
- Added `pendingEvoNotice: null` to `defaultState()`

### src/context/StateContext.jsx
- New action `CLEAR_EVO_NOTICE` — clears `state.pendingEvoNotice`
- `ADD_XP`: detects evoStage change during creature XP map → sets `pendingEvoNotice` (first change wins)
- `ROUND_COMPLETE`: same evo detection on bond +2 map
- `INCREMENT_BATTLE_WINS`: same evo detection on bond +1 map

### src/components/WorldBattle.jsx
- `creatureStats` useMemo now applies bond bonuses: bond≥25 → ATK×1.05; bond≥100 → ATK×1.5; bond≥50 → SPD+30
- `onCorrect()` dispatches `CREATURE_HEAL({creatureId, amount:1})` when active creature bond≥75 (passive heal)

### src/components/HatchOverlay.jsx
- 6-creature hard limit: if `hatchedEggs.length >= 6` during tapping phase, shows "คลังเต็มแล้ว!" blocking panel instead of the egg

### src/App.jsx
- `useEffect` watches `state.pendingEvoNotice` → calls `showToast("★ [name] วิวัฒนาการแล้ว! → [stage]")` + `CLEAR_EVO_NOTICE`
- Imports `showToast` from Toasts.jsx and `EVO_STAGE_LABELS_TH` from creatureSystem.js

---

## 2026-06-15 — hotfix: world map encounter freeze (browser hang on PartySelect)

### src/components/WorldScreen.jsx
- RAF loop: removed `return` after `triggerBattle` call — canvas now keeps rendering while PartySelect is shown, preventing the canvas/audio freeze
- RAF loop: added `!stateRef.current.pendingBattle` guard before calling `triggerBattle` in loop (redundant safety on top of the guard already inside `triggerBattle`)
- `tryMove`: added `stateRef.current.pendingBattle` early-return guard — blocks player movement (and re-trigger) while PartySelect overlay is open

### src/context/StateContext.jsx
- `ADD_XP`: skip `hatchedEggs.map()` entirely when `party` is empty or `earned === 0` — returns same array reference so `derived` useMemo doesn't recompute
- `ROUND_COMPLETE`: skip `hatchedEggs.map()` when no active creature OR active creature's bond is already at 100 — same stable-ref optimization
- `INCREMENT_BATTLE_WINS`: same stable-ref optimization — skip map when no active creature or bond maxed

---

## 2026-06-15 — feat: Collection "Set Active" button + creature custom name display

### src/context/StateContext.jsx
- New action `SET_ACTIVE_CREATURE` — moves creature to `party[0]` (swaps with current active; no-op if already active or not in party)

### src/components/Collection.jsx
- `creatureName(egg)` helper — returns `egg.creatureName || egg.creature?.n || 'สัตว์ลึกลับ'` (custom name takes priority everywhere)
- PartyGrid: active creature (party[0]) shows "★ ตัวหลัก" gold badge; bench members show "★ ตั้งเป็นตัวหลัก" button (dispatches `SET_ACTIVE_CREATURE`)
- PartyGrid: element color dot next to creature name when `egg.element` is set
- All creature name displays (PartyGrid, VaultGrid, HatchedGrid/CreatureCard) now show custom name if set
- Import `CREATURE_ELEMENT_COLORS` from `creatureSystem.js`

---

## 2026-06-15 — feat: Creature System — element, bond meter, evolution, hatch naming

### src/lib/creatureSystem.js (NEW)
- `determineElement(xpThai, xpMath, xpEng, accuracy, streak)` — maps dominant subject to fire/water/thunder; rare: nature (acc≥85%), shadow (streak≥7+low XP), light (acc≥90%+streak≥14)
- `CREATURE_ELEMENT_COLORS`, `CREATURE_ELEMENT_NAMES_TH`, `EVO_STAGE_LABELS_TH`
- `getEggElementHint(...)` — returns element hint for stage 2+ (returns null before)
- `calcEvoStage(battleLevel, playerTier, bondMeter, currentEvoStage)` — baby→teen→final

### src/config/gameConfig.js
- Added `CREATURE_LEVELS` export (xpPerLevel:80, maxLevel:50, evo thresholds)

### src/lib/state.js
- Added `bossDefeatedThisTier: false` to `defaultState()`
- Migration in `_migrateBattleStats`: backfills `element`, `evoStage`, `bondMeter:0`, `bornAtk/Def/Spd/Crit`, `bornDate`, `bornTier`, `creatureName:null` on all existing creatures

### src/context/StateContext.jsx
- New ACTIONS: `SET_CREATURE_NAME`, `ADD_CREATURE_BOND`, `CREATURE_EVOLVE`
- `HATCH_COMPLETE`: stores element, evoStage, bondMeter, born stats, creatureName on newEgg
- `ADD_XP`: distributes creature battleXP — active 100%, bench 50%; checks evolution
- `ROUND_COMPLETE`: +2 bond to active creature; checks evolution
- `INCREMENT_BATTLE_WINS`: +1 bond to active creature; checks evolution
- `DEFEAT_BOSS`: sets `bossDefeatedThisTier: true`
- New reducers: `SET_CREATURE_NAME`, `ADD_CREATURE_BOND`, `CREATURE_EVOLVE`

### src/components/HatchOverlay.jsx
- After reveal: element badge (colored pill), "ตั้งชื่อ ✏️" → naming phase with text input
- Naming phase dispatches `SET_CREATURE_NAME` for newest hatchedEgg on confirm
- "ข้ามการตั้งชื่อ" skip button in both done and naming phases

### src/components/Home.jsx
- Party HP bar: element color dot on creature portrait, bond meter (gold bar, active only), `creatureName` shown if set
- Header: element hint badge at Stage 2+ ("ธาตุน้ำ?" in element color)

## 2026-06-14 — feat: World Progression System — multi-level worlds, boss screen, secret maze

### src/config/worldConfig.js
- Added `WORLD_LEVELS[3]` array (Green Meadow / Dark Forest / Crystal Cave) with themes, enemy pools, boss configs, unlock requirements
- Added `DYNAMIC_SCREENS` (NW/NE/SW/SE/BOSS/MAZE) with explicit connects
- Added `SCREEN_LAYOUT`, `BOSS_SCREEN`, `MAZE_SCREEN` exports

### src/lib/state.js
- Added 4 fields to `defaultState()`: `worldLevel`, `mazeActive`, `mazeCleared`, `bossDefeated`

### src/context/StateContext.jsx
- Added `SET_WORLD_LEVEL`, `DEFEAT_BOSS`, `ACTIVATE_MAZE`, `CLEAR_MAZE` actions + reducers

### src/lib/tileMaps.js
- Added `generateScreenMap(slot, worldLevel)` — dynamic 20×15 maps per slot
- Added `generateBossMap(worldLevel)` — winding corridor boss arena
- Added `generateMazeMap()` — recursive backtracker maze with EXIT_N reward portal
- Added `getScreenEnemies(slot, worldLevel)` — world-level enemy pool selection

### src/components/WorldScreen.jsx
- `initScreen` rewritten to use generators (BOSS → generateBossMap, MAZE → generateMazeMap, regular → generateScreenMap)
- Enemy init useEffect: BOSS gets static boss at BOSS_TILE with `isWorldBoss:true`; regular screens use `getScreenEnemies`
- `spawnChests` refactored to `(tileMap, enemyDefs)` — no longer uses SCREEN_MAPS global
- `handleExit` rewritten: uses `DYNAMIC_SCREENS` connects + maze routing override (NW→S/SE→W → MAZE when `mazeActive`); MAZE EXIT_N → `CLEAR_MAZE` + 3 item drops
- `tryMove`: boss collision → `setBossConfirm(true)` instead of `triggerBattle`
- `enterBossBattle`: dispatches `SET_PENDING_BATTLE` with `isBossBattle:true` + boss stats from `WORLD_LEVELS[worldLevel]`
- Maze timer `useEffect([worldLevel])`: random 0–20 min → `ACTIVATE_MAZE`
- World unlock `useEffect([battleWins])`: threshold check → `SET_WORLD_LEVEL` + 4s banner
- `renderEnemies`: boss always shows red `!` above sprite
- `WorldHUD` mini-map: updated to 2×2 + full-width BOSS tile; colors from world level; MAZE tile shows when `mazeActive`
- Boss confirm dialog, maze notification, world unlock banner added to JSX
- Removed stale `SCREENS`, `SCREEN_THEMES`, `SCREEN_MAPS` imports

### src/games/MoveSelectBattleMode.jsx
- Item bar hidden when `isBossBattle=true`

### src/components/WorldBattle.jsx
- `DEFEAT_BOSS` dispatched on boss victory

---

## 2026-06-12 — hotfix: replace PartySelect with simple loop-free version

### src/components/PartySelect.jsx (full rewrite)
- Removed `CreatureCanvas` and `buildLegacyPreviewDNA` — eliminates all RAF animation risk
  from this component (those were the amplifying factor in the freeze).
- Removed `useMemo` — not needed without expensive DNA computation.
- Added `renderCount` ref bailout: if render count exceeds 50, renders an escape button
  and logs an error instead of freezing the browser.
- Fallback to most-recently-hatched egg when party is empty (sorted by `hatched_at`).
- Escape button shown for both empty-party and all-fainted states.
- Creature shown as 🥚 placeholder for now; CreatureCanvas can be restored once
  stability is confirmed.

---

## 2026-06-12 — hotfix: PartySelect infinite loop / freeze on mount

### src/components/WorldScreen.jsx
- `useEffect(() => { stateRef.current = state })` → `useLayoutEffect`.
  Root cause: `useEffect` runs after the browser paint, so the RAF loop fires before
  `stateRef.current.pendingBattle` is updated, causing `triggerBattle` to bypass its guard
  and dispatch `SET_PENDING_BATTLE` dozens of times per second → freeze.

### src/components/PartySelect.jsx
- `dna` computation moved inside `partyCreatures` useMemo — stable reference across re-renders.
  Previously an IIFE in `.map()` created a new DNA object every render, causing
  `CreatureCanvas.useEffect([dna])` to restart the animation RAF on each re-render.
- JSX `.map(creature =>` → `.map(({ creature, dna }) =>` — destructures from memo.
- `allFainted` check: `c.currentHP` → `({ creature: c }).currentHP` to match new shape.
- Empty party now shows "กลับแมพ" escape button — previously UX deadlock (no way to close).

---

## 2026-06-12 — hotfix: damage calculation — creature 1-shots world enemies

### src/components/WorldBattle.jsx
- `creatureStats` useMemo now scales creature stats to world-battle range.
  `WB_STAT_SCALE=0.07`: ATK/DEF ~60→4 (Tier 0, balanced XP). `WB_HP_SCALE=0.10`: HP ~166→17.
  Result: ~11 hits (no combo) / ~7 hits (×1.5 combo) vs `sleepy_bunny` (HP=44). ✅
- `creatureCurrentHP` now computed as `min(scaledMaxHP, round(creature.currentHP × WB_HP_SCALE))`.
  Carries persistent HP across battles (creature heals only via items/full-restore). ✅
- `handleCreatureTakeDamage` dispatches `round(damage / WB_HP_SCALE)` to state.
  State HP decreases proportionally → creature faint in state matches battle faint. ✅
- Root cause: `TIERS[0].baseStat = 100` → `calcCreatureStats` outputs ATK≈40–70 (designed for
  academic battles vs AI opponents with HP=280–700). World battle enemies (HP=32–52, ATK=3–5)
  require a separate scale factor; previous code passed raw stats directly.

---

## 2026-06-12 — feat: PartySelect centered layout + HP display fix

### src/components/PartySelect.jsx
- `justifyContent: 'center'` added to wrapper — content vertically centered on screen.
- `gap: 14 → 20` between sections.
- Enemy preview: `var(--font-pixel)/10px → var(--font-thai)/14px` for readability.
- Grid: single-creature case uses `gridTemplateColumns: '1fr'` and `maxWidth: 200`
  (was always `repeat(2, 1fr)` and `maxWidth: 320`).
- `maxHP` now includes battle level bonus: `stats.HP + max(0, battleLevel - 1)`.
  Fixes HP display overflow (e.g. 191/188) when battleLevel > 1.
- `currentHP` display clamped to `Math.min(currentHP, maxHP)`.

---

## 2026-06-12 — hotfix: item reuse per question + no corpse + smooth glow + no flee

### src/games/MoveSelectBattleMode.jsx
- `setItemUsed(false)` added to per-question reset `useEffect([cur])` — item available once per question, not once per battle.

### src/components/WorldScreen.jsx
- `fillCirclePixel` helper removed; `drawPlayerGlow` now uses `ctx.arc` for smooth circular rings.
  Pulse formula `(sin(frame×0.06)+1)/2` (continuous sine). Outer ring 85% tile radius, inner 58%.
- `updateEnemies`: dead enemies immediately call `scheduleRespawn()` + return `null` — no death-timer countdown.
- `renderEnemies`: corpse rendering block removed entirely (squish/rotate/opacity/✕ mark gone).
- Enemy init: `dead: true` without `deathTimer/opacity` fields.

### src/components/PartySelect.jsx
- "หนี" flee button removed. Battle is mandatory when any creature is available.
- When all creatures are fainted, "กลับแมพ" forced-retreat button shown.

---

## 2026-06-12 — hotfix: battle not opening — INIT dispatch overwrites initializer null

### Root cause
`ACTIONS.INIT` reducer spread `action.payload` which included the stale `battleCreatureId`
from Supabase/localStorage, undoing the `useReducer` initializer's `null` override. The
`loadState().then(dispatch INIT)` runs ~50ms after mount; the stale value came back every load.

### src/context/StateContext.jsx
- `ACTIONS.INIT` case now appends `battleCreatureId: null, pendingBattle: null, worldBattleEnemy: null`
  after the payload spread — transient battle fields are always cleared on any full state load.

---

## 2026-06-12 — hotfix: fix PartySelect never appearing after enemy collision

### Root cause
`battleCreatureId` persists to localStorage. If the app was closed mid-battle,
it remains non-null on next load. `state.pendingBattle && !state.battleCreatureId`
evaluates false → PartySelect never renders → player sees nothing after collision.

### src/context/StateContext.jsx
- `useReducer` initializer: force `battleCreatureId: null`, `pendingBattle: null`,
  `worldBattleEnemy: null` after migration — clears any stale battle state from
  an app-closed-mid-battle session.

### src/lib/state.js
- `_migrateBattleStats`: party validation now runs independently of `dirty` flag.
  - Filters stored party IDs against actual egg IDs (removes stale/mismatched IDs).
  - Falls back to rebuilding from `inParty` flags if valid party is empty.
  - Previously this only ran when `dirty = true` (eggs needed migration), so a
    fully-migrated user with an empty/stale party never got it rebuilt.

---

## 2026-06-12 — hotfix: fix enemy collision — battle triggers on contact, flee keeps enemy alive

### src/components/WorldScreen.jsx
- `triggerBattle`: removed `defeated: true` marking at collision time — enemy stays alive in world while PartySelect is open; flee no longer silently removes enemies.
- `triggerBattle`: added `if (stateRef.current.pendingBattle) return` guard to prevent re-triggering while PartySelect is already open.
- `updateEnemies`: woken `sleepy_bunny` added to chase-collision check alongside snake/baby_zombie — bunny chasing the player now triggers battle when it reaches the player's tile.
- `tryMove`: woken `sleepy_bunny` added to "chaser already on player's tile" check — consistent with updateEnemies fix.

---

## 2026-06-12 — hotfix: battle balance — monster HP/DEF rebalance + damage formula fix

### src/config/enemyConfig.js
- All 9 enemies rebalanced: hp raised to 40–52 (was 18–36), atk lowered to 3–5 (was 4–9), `def` field added (0 or 1).
- Target: ~10 correct answers to defeat easiest enemy at Tier 0 creature.

### src/context/StateContext.jsx
- `scaleMonsterStats`: tier multipliers updated to 1.0/1.3/1.8/2.4/3.2 (was 1.0/1.4/2.0/2.8/3.8).
- Return keys changed from uppercase `{HP,ATK,DEF}` to lowercase `{hp,atk,def}`.

### src/components/WorldBattle.jsx
- Passes `DEF: enemy.def ?? 0` to `scaleMonsterStats` (was hardcoded 0).
- Uses `scaled.hp`, `scaled.atk`, `scaled.def` (updated for new lowercase return).
- `scaledEnemy` now includes `def: scaled.def`.

### src/components/WorldScreen.jsx
- `SET_PENDING_BATTLE` dispatch now includes `def: eData.def ?? 0` in enemy payload.

### src/games/MoveSelectBattleMode.jsx
- Hit damage formula: `Math.round(Math.max(1, creatureATK − enemy.def) × mult)` (was `Math.ceil(ATK × mult)`).

---

## 2026-06-12 — fix: battle uses all question types — full level rotation across thai/math/english

### src/components/WorldBattle.jsx
- Added imports: `SPELL_L1, TH_L2, TH_L3, TH_L5, CVC_WORDS, SIGHT_DATA, ENG_SENTS` from gameConfig.
- `genThaiMoveQ(lv)` now dispatches by `lv.id`: L1=alphabet match (unchanged), L2=SPELL_L1 emoji→word, L3=TH_L2 animal emoji→word, L4=TH_L3 3-syllable emoji→word, L5=TH_L5 emoji→sentence.
- `genEngMoveQ(lv)` now dispatches by `lv.type`: phonics=unchanged, cvc=CVC_WORDS emoji→word, sight=SIGHT_DATA sentence-with-blank, sentence=ENG_SENTS emoji→full-sentence.
- `genMoveQuestion` now passes `lv` to both Thai and English generators.
- Added battle-start debug console.log (levelId, levelName, xp values, dailyBattleRounds).

### src/lib/battleSubject.js
- `getBattleLevel`: lowered XP threshold from 120 to 60 per level for faster variety unlock.
- Uses `minId = levels[0].id` as base (0 for math, 1 for thai/eng) — math level 0 (counting) now reachable.
- Rotation formula: `[minId, maxUnlocked, floor((minId + maxUnlocked) / 2)]`.

### src/games/MoveSelectBattleMode.jsx
- `MoveCard` fontFamily now includes `Sarabun,Mitr` fallback — Thai word choices now render correctly.
- Zone 2 question display: shows `q.question` at smaller font (15px Thai, 13px English) when present (used by sight-word and sentence levels). Falls back to `q.word` at 36px for all other types.

---

## 2026-06-12 — fix: battle items working + item tooltip popup + monster hurt animation

### src/lib/drawEnemy.js
- Added `EYE_POSITIONS` lookup table (48-grid coords for all 9 enemy types).
- Added `drawHurtEyes(ctx, size, pos)` — X-mark eyes (red crossed lines) + zigzag mouth using canvas `lineTo`.
- Added exported `drawEnemyHurt(ctx, type, size, x, y)` — slight `rotate(0.08)` tilt + base sprite + hurt eyes overlay.

### src/games/MoveSelectBattleMode.jsx
- **Fix 1**: `useBattleItem` — `skip` (scroll) now calls `onNext()` unconditionally in world battles instead of triggering `showVictory()` at question 7.
- **Fix 2**: Item tooltip popup — changed item bar `onClick` from immediate `useBattleItem()` to `setPendingItem(key)`. Added `ITEM_DESCRIPTIONS` object (5 Thai descriptions). Added `pendingItem` state. Added tooltip overlay (semi-transparent dark, item icon 40px, name, description, qty, ใช้เลย!/ยกเลิก buttons, tap-outside-to-dismiss).
- **Fix 3**: Monster hurt animation — added `enemyHurt` state. `fireHit` sets `enemyHurt=true` for 400ms. `EnemyCanvas` now calls `drawEnemyHurt` when `enemyHurt=true`. Imported `drawEnemyHurt` from `drawEnemy.js`.

---

## 2026-06-12 — feat: Pokémon battle system — real HP, party select, creature faint, battle leveling

### src/lib/state.js
- Added `pendingBattle`, `party`, `partySlots`, `battleCreatureId` to `defaultState()`.
- Added and exported `_migrateBattleStats()`: adds `id/battleLevel/battleXP/currentHP/inParty/archived` to existing eggs; builds `party` from `inParty` flags; called in both `loadState()` paths.

### src/context/StateContext.jsx
- Added 8 new ACTIONS: SET_PENDING_BATTLE, CLEAR_PENDING_BATTLE, SET_BATTLE_CREATURE, CREATURE_TAKE_DAMAGE, CREATURE_HEAL, CREATURE_GAIN_BATTLE_XP, ADD_TO_PARTY, UNLOCK_PARTY_SLOT.
- Added local `calcBattleLevel(xp)` (quadratic thresholds) and exported `scaleMonsterStats(baseStats, creatureLevel)` (×1.0–×3.8 by tier).
- `HATCH_COMPLETE`: new eggs get `id`, battle stats, auto-join party if party empty.
- `ENTER_BATTLE_FROM_WORLD` clears `pendingBattle`. `RETURN_FROM_WORLD_BATTLE` clears `battleCreatureId`.
- All new reducers added. StateProvider lazy initializer now calls `_migrateBattleStats`.

### src/components/PartySelect.jsx (NEW)
- Pre-battle creature selection overlay (zIndex 80). Shows party creatures with CreatureCanvas, HP bars, battle level, faint state. Flee button dispatches CLEAR_PENDING_BATTLE.

### src/App.jsx
- PartySelect overlay shown when `state.pendingBattle && !state.battleCreatureId`.
- On creature select: SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD + navigate('world-battle').

### src/components/WorldScreen.jsx
- `triggerBattle` now dispatches `SET_PENDING_BATTLE` with scaled HP/ATK from ENEMY_DATA. No longer calls navigate directly.

### src/components/WorldBattle.jsx (REBUILT)
- Reads `battleCreatureId` to resolve fighting creature. Scales enemy via `scaleMonsterStats`.
- Passes `isWorldBattle/creatureStats/creatureCurrentHP/creatureName/onCreatureTakeDamage/onBattleXP/onFaint` to MoveSelectBattleMode.
- Questions loop indefinitely (regenerates bank); victory only from enemy HP=0.
- `handleCreatureTakeDamage` → CREATURE_TAKE_DAMAGE. `handleBattleXP` → CREATURE_GAIN_BATTLE_XP + UNLOCK_PARTY_SLOT at 10/50 XP total. `handleFaint` → RETURN_FROM_WORLD_BATTLE + navigate('world').

### src/games/MoveSelectBattleMode.jsx
- Added world battle props: `isWorldBattle`, `creatureStats`, `creatureCurrentHP`, `creatureName`, `onCreatureTakeDamage`, `onBattleXP`, `onFaint`.
- World battle: `maxHP` from `enemyData.hp`; hit damage = creature ATK × combo mult; miss = SPD dodge check (SPD/200) + DEF reduction (`max(1, rawDmg − DEF×0.5)`); faint calls `onFaint()`; victory only from HP=0 (no question-count victory); `onBattleXP(10+5)` called on victory.
- Player HP bar shows creature HP when `isWorldBattle`; name badge shows `creatureName`.

### src/components/Home.jsx
- Added compact party HP strip above item tray: each party creature shown as CreatureCanvas 22px + name + HP bar + HP text. Only shown when `state.party.length > 0`.

### src/components/Collection.jsx
- Added ทีม tab (`PartyGrid`: HP bars + battle level, dispatches ADD_TO_PARTY).
- Added คลังสะสม tab (`VaultGrid`: non-party creatures greyed out, เพิ่มในทีม button).
- Kept ทั้งหมด (all) and กำลังฟัก tabs.

### docs/research/creatures/creature-battle-system.md (NEW)
- Full design rationale: state fields, battle flow diagram, stat calculations, combat mechanics, battle level progression, party slot milestones, UI surfaces, design constraints.

## 2026-06-11 — Fix: Snake battle + enemy death animation + respawn + player glow

### src/components/WorldScreen.jsx
- **Snake/zombie bidirectional collision**: `tryMove()` checks fast enemies on player's current tile; `updateEnemies()` returns `pendingBattle` when enemy moves onto player; `loop()` fires battle and returns.
- **Enemy death animation**: dead enemies render as squished (scale 1×0.3, rotated 90°) fading corpse + ✕ mark. `sessionStorage kq_last_battle` persists defeated enemy type across WorldScreen remount so death animation plays on return from battle.
- **Enemy respawn timer**: `scheduleRespawn()` uses setTimeout (45–90s random) to re-spawn enemy at walkable tile ≥5 from player. Timer IDs cleared on RAF cleanup.
- **Player glow**: `fillCirclePixel()` + `drawPlayerGlow()` draw 3 pulsing warm-yellow/white pixel rings behind player every frame.
- `triggerBattleRef = useRef(null)` wires RAF closure to current `triggerBattle` useCallback.

## 2026-06-11 — Feat: Battle item system

### src/config/itemConfig.js (NEW)
- `BATTLE_ITEMS` — 5 items: scroll (skip), thunder (free_attack 15dmg), gem (double_xp), mirror (hint/eliminate 2 wrong), clover (block next miss)
- `rollBattleItem()` — 55% drop chance, weighted random from DROP_TABLE

### src/components/PixelItemIcon.jsx (NEW)
- 10×10 grid canvas icons for all 5 battle item types
- Palette-indexed per type (dark border + main + highlight colors)
- `imageRendering: pixelated`; size prop scales cell size

### src/lib/state.js
- `defaultState.items` — added `scroll: 0, thunder: 0, gem: 0, mirror: 0, clover: 0`

### src/games/MoveSelectBattleMode.jsx
- Added imports: `useAppState`, `ACTIONS`, `PixelItemIcon`, `BATTLE_ITEMS`, `rollBattleItem`
- Added state: `itemUsed`, `eliminatedChoices`, `shieldActive`, `xpBoostActive`, `victoryBonus`
- Added refs: `shieldActiveRef`, `xpBoostActiveRef`
- `useBattleItem(key)` — dispatches USE_ITEM; handles 5 effects; one use per battle
- Item bar UI above answer panel — shows only battle items with count > 0; hides if none owned; shows โล่/XP×2 status indicators
- `fireHit()` — XP boost check: dispatches second ADD_XP if xpBoostActiveRef active
- `fireMiss()` — shield check: absorbs miss damage, clears shield, then proceeds normally
- `showVictory()` — 10% chance rolls and dispatches DROP_ITEM for bonus battle item; shows in victory screen
- Answer cards — `eliminatedChoices` renders dimmed/disabled for mirror hint effect
- `cur` useEffect — added `setEliminated([])` to clear hint on question advance

### src/components/TreasureSlot.jsx
- `resolveReward()` — calls `rollBattleItem()` after primary reward; sets `reward.battleItem` + appends item name to label

### src/components/WorldScreen.jsx
- `handleTreasureReward()` — dispatches extra `DROP_ITEM` for `reward.battleItem` if present

---

## 2026-06-11 — Fix: Remove all UI emoji + apply pixel post-processing

### Home.jsx
- Removed `emoji` field from ITEM_DEFS; added `ITEM_COLORS` dict; item tray now shows 22×22 colored CSS squares
- Flying food item uses Thai label (`{ label:'อาหาร' }`) instead of emoji
- Ambient events (butterfly/leaf/star) render pixel squares instead of emoji
- Stage-up banner sparkle div removed
- Particles replaced with colored CSS squares (hearts=#ff6677, sparkle=#ffdd44)
- Star boost orbit uses CSS inline-block squares instead of emoji
- Ribbon decoration uses 10×10 pink CSS square instead of 🎀
- Sound toggle uses Thai text "เสียง"/"ปิด" instead of 🔊/🔇
- Creature companion: replaced `{lastCreatureEmoji}` with `CreatureCanvas` (26px, animationEnabled=false, legacy DNA fallback via `buildLegacyPreviewDNA`)
- Behavior overlays: replaced 👋/🎁/🎊/💤/👀 with Thai text ทัก!/ของ/สนุก!/zz/...
- Placeholder text: removed ❓ from "ฟักไข่เพื่อพบเพื่อนใหม่!"
- Added `useMemo`, `CreatureCanvas`, `buildLegacyPreviewDNA` imports

### Collection.jsx
- Removed 🥚 from page title; removed 🐣/🥚 from tab labels
- Removed legacy creature emoji overlay (`{egg.creature.e}`) from CreatureCard
- Removed 🥚 from empty state, removed 🐣 from "พร้อมฟักแล้ว!" text
- Removed unused `isLegacy` variable

### BottomNav.jsx
- Replaced 🏠/🥚/📊 emoji icons with 18×18 colored CSS squares (yellow/purple/blue)

### WorldScreen.jsx
- Removed 🏠 emoji from "กลับบ้าน" back button

### TreasureSlot.jsx
- Removed 💰/🎰 from UI headers and button text
- Removed emoji from reward label strings (kept ITEMS array as slot symbols)
- Removed ✅ from "รับของ!" button

### Report.jsx
- Removed 📊 from page title; removed all rc-icon emoji spans
- WORLD_LABELS: removed emoji prefixes from all 4 subject strings
- READINESS_SUBJECTS: removed icon field entirely, removed icon span from JSX
- `domSub`/`weakSub`/`speedLabel`/`accLabel` computed strings: removed trailing emoji
- BarRow labels: removed 📖/🔤/🔢 prefixes
- Phase difficulty: replaced ⚠️/✅ with colored "!"/OK text labels
- Session log: replaced ✅/❌ with "ผ่าน"/"ล้ม" Thai text

### CreatureDetailPopup.jsx
- Removed rarity ⭐ stars from rarity badge
- Removed legacy emoji overlay (`{egg.creature.e}`)
- Removed 🗓️ from date display; removed ⚡/✨ from section headers
- XP bar labels: removed 📖/🔤/🔢 emoji prefixes
- Streak: removed 🔥 suffix
- Ability strings: removed all trailing emoji (❤️/🌍/🔢/⭐/🔥/🎯)
- Removed unused `isLegacy` variable

### HatchOverlay.jsx
- Removed 🥚 from new-egg toast message

### drawCreature.js
- `imageSmoothingEnabled` changed from `true` → `false`; removed `imageSmoothingQuality = 'high'`

### EggCanvas.jsx
- Added `pixelateCanvas(canvas, blockSize)` helper (downsample + upsample with imageSmoothingEnabled=false)
- `useEffect` now calls `pixelateCanvas(ref.current, 4)` after every `drawEgg()` call

### CreatureCanvas.jsx
- Added `pixelateCanvas(canvas, blockSize)` helper
- Static draw (`useEffect` on dna): calls `pixelateCanvas(canvasRef.current, 3)` after `drawCreature()`
- Animation loop `tick()`: calls `pixelateCanvas(canvasRef.current, 3)` after every `drawCreature()` frame

## 2026-06-11 — Feat: Baby Zombie (tiny fast chaser) + Snake (patrol+aggro) enemies

### drawEnemy.js
- `_babyZombie(ctx, size)` — 24-unit grid (half-scale detail). Ragged green-grey shirt with tears, oversized head, X-mark dead eyes, open jagged mouth with 2 teeth, outstretched arms, stubby uneven legs
- `_snake(ctx, size)` — 48-unit grid. S-curve body (tail + 3 segments), scale diamonds, belly stripe, flat triangular head, yellow slit-pupil eyes, forked red tongue
- Added `baby_zombie` and `snake` to `DRAW_FNS` dispatch table

### enemyConfig.js
- `baby_zombie`: nameTH 'เบบี้ซอมบี้', hp 30, level 2, subject null
- `snake`: nameTH 'งูยักษ์', hp 55, level 3, subject null

### tileMaps.js SCREEN_ENEMIES
- BM: +1 `baby_zombie` at col 14 row 3
- MC: +1 `snake` at col 10 row 8
- TR: +1 `snake` at col 13 row 7
- MR: +1 `baby_zombie` at col 8 row 3, +1 `snake` at col 15 row 11

### WorldScreen.jsx
- Enemy init: added `isAggro: false`, `aggroTimer: 0` to all enemy state objects
- `updateEnemies` `baby_zombie` case: always chases player, moves every 6 ticks (≈300ms); picks dominant axis (x or y) toward player each step
- `updateEnemies` `snake` case: patrol (36 ticks ≈1800ms, random drift) when dist > 4; aggro charge (5 ticks ≈250ms, chase player) when dist ≤ 4; transition sets `aggroTimer=10` + fires `playSFX('enemy_notice')` once
- `renderEnemies`: `baby_zombie` rendered at 60% sprite size (≈19px). Snake `aggroTimer > 0` draws red `!` above sprite for ≈500ms

## 2026-06-11 — Feat: pixel home scene — canvas tilemap with animated pixel sprites

### HomeBackground.jsx (full rebuild)
- Replaced all CSS-div/keyframe art with a `<canvas>` pixel renderer
- Canvas size: `window.innerWidth × Math.floor(window.innerHeight * 0.65)`; scale `S = max(1, floor(W/160))`
- `ctx.imageSmoothingEnabled = false`; every pixel drawn with `fillRect` only
- Static tiles redrawn each frame: 3-band sky (day `#4ec8f0/#87ddff/#d4f7c0`; night `#0a1a3a/#1a2a5a/#2a3a7a`); 2 pixel mountains (stacked-`fillRect` triangles); 3-strip ground (bright/mid/dark); 2 pixel trees (triangle canopy rows + trunk); trapezoidal path (horizontal slices); 8 cross-shaped pixel flowers (day only)
- Animated sprites via `requestAnimationFrame`: pulsing pixel sun (square + 8 rays); pixel moon + crescent cutout; 12 twinkling stars (sine opacity); 3 left-scrolling pixel clouds; 2 butterflies (sine-wave Y, cosine wing flap width); 1 bird (V-wing pixel shape, cross-screen); 4 fireflies with rgba glow (night only)
- Below-canvas div fills remaining 35vh with solid ground color (day `#2a7a2a` / night `#0a1a0e`)
- `hour` prop preserved; `isDay` computed internally — no Home.jsx changes required

## 2026-06-11 — Feat: pixel UI system — Press Start 2P font, pixel classes, square corners, hard shadows

### index.html
- Added Press Start 2P + Sarabun to Google Fonts link (combined with existing Mitr + Fredoka One)

### src/styles.css
- Added 20 pixel CSS variables to `:root`: `--font-pixel`, `--font-thai`, full 16-color `--px-*` palette, border/radius/shadow tokens
- Appended pixel class library: `px-box`, `px-box-light`, `px-btn` (+purple/yellow/dark), `px-hp-bar-outer/inner`, `px-xp-bar-outer/inner`, `px-dialogue`, `px-name-badge`, `px-item-card`, `px-badge`, `px-title`, `px-subtitle`, `px-cursor`, `px-answer-card` (+correct/wrong + `px-shake` keyframe), `px-combo-badge`, `px-transition-overlay`, `px-bottom-nav`, `px-nav-item`, `px-nav-dot`
- Global border-radius kill on interactive elements (`button, input, .card, [class*="btn"]` etc. → `border-radius: 0 !important`)
- `img, canvas` get `image-rendering: pixelated`

### src/components/BottomNav.jsx
- Replaced `bottom-nav` / `nav-btn` / `nav-dot` with `px-bottom-nav` / `px-nav-item` / `px-nav-dot`
- Nav labels use Sarabun via `var(--font-thai)` (Press Start 2P cannot render Thai)

### src/components/Home.jsx
- Header: removed `backdropFilter: blur`, flat `var(--px-darkest)` background + pixel border
- Stage label: Thai font + `var(--px-light)` color
- Ready-to-hatch badge: `px-badge` with yellow fill, no gradient
- Title: Thai font + `var(--px-yellow)` + `2px 2px 0` hard text-shadow
- Mood indicator: moodEmoji replaced with `px-subtitle` Thai text + 3-dot pixel level squares
- Hatch CTA: `px-btn px-btn-yellow`, flat, no gradient
- Item tray: removed glassmorphism blur — flat `var(--px-darkest)` bg + `px-item-card` per item + `px-badge` counts
- Action row: `px-btn px-btn-dark` for ลูบไข่/คอลเลกชัน, `px-btn px-btn-purple` for ออกสำรวจ!; no gradients, no blur, emoji removed from labels

### src/games/MoveSelectBattleMode.jsx
- `GBHPBar`: `px-hp-bar-outer/inner` (stepped width transition)
- `MoveCard`: `px-answer-card` base + `.wrong` class on miss (px-shake replaces miss-fizzle)
- Enemy/player status panels: `px-box`
- Enemy/player name labels: `px-name-badge` with Thai font override
- Dialogue box: `px-dialogue` class
- Teach start button + victory return button: `px-btn` variants with Thai font

## 2026-06-11 — Feat: element attack system — 6 elements × 4 tiers with canvas animations and SFX

### New files
- `src/config/elementConfig.js`: `ELEMENTS` (6 elements × 4 tier definitions) + `getElementTier(element, combo)` helper
- `src/lib/elementAnimations.js`: `playElementAttack(canvas, element, tierIndex, fromPos, toPos, onComplete)` — canvas animation for all 24 combos (6 elements × 4 tiers). `animate()` RAF loop helper. `zigzag()` helper for lightning. Each animation uses `performance.now()` + RAF for fixed-duration render.

### MoveSelectBattleMode.jsx
- Added imports: `ELEMENTS`, `getElementTier` from elementConfig; `playElementAttack` from elementAnimations; `playElementSFX` from audio
- `battleElement` state: random element assigned on mount, fixed for entire battle
- `attackLabel` state: tier name flash (900ms)
- `overlayCanvasRef`: second canvas inside battleFieldRef div, zIndex 16 (above particles at 15). Size synced via same ResizeObserver as effectCanvasRef
- `fireHit()`: after spawnEffect — calls `getElementTier(battleElement, combo)`, plays `playElementSFX`, flashes tier name label, calls `playElementAttack` with egg→enemy coords from `getBoundingClientRect()`
- Element badge: inline-block pill below enemy name — element color + icon + Thai name
- Attack label overlay: absolute positioned, `fadeInOut 0.9s` CSS animation, element color + textShadow glow

### audio.js
- Added `SFX_ELEMENTS` dict: 6 elements × 4 tier SFX (Web Audio API, all using existing `_t`, `_sweep`, `_noise` helpers)
- Added `playElementSFX(element, tierIndex)` export

### styles.css
- Added `@keyframes fadeInOut` for attack tier name flash

## 2026-06-11 — Feat: treasure chest + slot machine reward; fix hint bar centering

### WorldScreen.jsx
- `drawChest()` pixel art function: brown box + gold lid trim + lock + alternating sparkle dot (uses TILE=16px grid)
- `spawnChests(screenId)` module helper: selects 2–3 random GRASS/FLOWER tiles per screen, avoids enemy positions, shuffled
- `chestsRef` ref + screen-change useEffect: chests re-spawn fresh on every screen entry (same lifecycle as enemies)
- `tryMove`: chest collision check before `canMove` — walking into closed chest marks it opened, plays `cardOpen` tone, opens slot machine overlay
- `renderChests` in rAF loop: draws unopened chests on canvas after enemies, before player
- `handleTreasureReward`: dispatches `DROP_ITEM` for each qty unit of the reward item; plays `stage_up` SFX
- TreasureSlot overlay rendered in JSX when `slotMachineOpen` is true

### TreasureSlot.jsx (NEW)
- Full-screen overlay with 3 emoji reels
- Spin animation: each reel cycles through ITEMS emojis at 80ms/frame, stops independently (reel 1 at frame 15, reel 2 at 22, reel 3 at 30)
- Reward logic: 3 matching → 🌟 star ×3 jackpot; 2 matching → 🎀 ribbon ×1; else → 🍖 food ×1
- `onReward` fires 800ms after spin completes (item added to inventory before player taps collect)
- "รับของ!" collect button shows after spin resolves; `onClose` hides overlay

### MoveSelectBattleMode.jsx
- Dialogue box container: added `justifyContent:'center'` so HintBar dots are properly centered
- Removed entire `QuestionHint` component and `DotGroup` component (dead code — no longer rendered)
- Removed `QuestionHint` render block (the section between dialogue box and move panel)
- The only visual hint is now HintBar dot groups for math arithmetic; everything else is TTS-only

## 2026-06-11 — Fix: hint bar dots-only for math + pixel art enemy sprites

### MoveSelectBattleMode.jsx
- `HintBar` rewritten: Thai/English return null (QuestionHint below already shows the word + 🔊 button)
- Math arithmetic: HintBar now shows dot groups only — blue dots for `q.a`, orange dots for `q.b`, operator, `= ?`
- Math isCount/isPattern/isWord questions: HintBar returns null (QuestionHint handles display)
- Uses `q.a`/`q.b`/`q.op` fields directly — no regex parsing

### drawEnemy.js (full rebuild)
- All 7 enemy draw functions rebuilt with `ctx.fillRect()` only — no arcs, ellipses, or bezier curves
- `px(ctx, gx, gy, gw, gh, size, color)` helper function scales 48×48 grid coordinates to actual pixels
- `ctx.imageSmoothingEnabled = false` added for crisp pixel art at all sizes
- `DRAW_FNS` dispatch object replaces switch statement
- All type aliases preserved (`bunny`/`sleepy_bunny`, `slime`/`bouncy_slime`, `fox`/`fox_kit`/`tiny_fox`, etc.)
- Sprite designs: sleepy_bunny (floppy ears, closed-line eyes, pink blush, ZZZ rects), bouncy_slime (blob stacked rects, flower-pot hat), fox_kit (pixel triangle ears, tail+scarf), egg_pawn (chest panel+visor+antennae), leaf_sprite (layered leaf rects+veins), grumpy_mole (square glasses+shovel+frown+claws), mushroom_imp (cap dome rows+white spots+O mouth+worried eyebrows)

## 2026-06-11 — Feat: Home screen redesign — Pokémon background + Tamagotchi ambient life

### HomeBackground.jsx (full rebuild)
- Sky: vivid FireRed/LeafGreen palette — `#4ec8f0→#87ddff→#c8f0ff→#d4f7c0` day; `#0a1a3a→#1a2a5a→#2a3a7a→#0d2a1a` night
- Sun: `hbg-sun-pulse` 4s scale animation; moon+crescent retained for night
- Clouds: 3 CSS clouds with ::before/::after bumps; sped up (28s/42s/35s); cloud-3 now 110px wide
- Mountains: 2 prominent rounded-rectangle hills (height 28%/22%) with Pokémon green tints (#a8d4a8/#90c490)
- Ground: curved top edge (`border-radius: 50% 50% 0 0 / 30px`); 3-stop vivid green gradient; 2 depth mounds
- Butterflies (day): 2 CSS-drawn `Butterfly` components — 2 wings (`border-radius:50% 0 50% 50%` + mirror) + body; `hbg-flap-l/r` alternate scaleY; `hbg-bf1` (8s) + `hbg-bf2` (12s) sine-wave flight loops; `#ff99dd` + `#ffcc44` colors; `will-change:transform`
- Bird (day): CSS `Bird` component — oval body + 2 wing shapes; `hbg-bird-flap` 0.25s alternating; `hbg-bird-fly` 15s left→right repeat
- Leaf particles: 3 small rounded-diamond divs; `hbg-leaf1/2/3` fall+rotate+sway loops (6–9.5s staggered)
- Fireflies (night only): 4 tiny 4px circles `#ffffaa` with static glow; `hbg-ff1/2/3/4` drift+opacity loops
- Flowers (day): `hbg-flower-float` +3px bob with staggered delays; 6 CSS dot-shadow flowers retained

### Home.jsx (targeted changes)
- Title "ไข่ของ{name}" moved to above egg: smaller (17px Fredoka), soft `text-shadow` glow
- Stage dots removed; replaced with single mood emoji (😊/🤩/😋/😴) driven by `eggAnim` state
- Header left side simplified to stage-name label only; right side keeps sound button + readyToHatch badge
- Item tray: outer container opacity reduced; inner glassmorphism card (`rgba(255,255,255,0.15)` + `backdropFilter:blur(8px)` + frosted 1px border + `borderRadius:20`)
- ออกสำรวจ! button: shimmer gradient (`home-shimmer 3s linear infinite`, `background-size:200%`)
- Egg canvas wrapped in relative container; ellipse ground shadow `radial-gradient(ellipse, rgba(0,0,0,0.18), transparent)` absolutely positioned -8px below canvas

### styles.css additions
- `hbg-sun-pulse`, `hbg-flap-l/r`, `hbg-bf1/2`, `hbg-bird-flap/fly`, `hbg-ff1/2/3/4`, `hbg-leaf1/2/3`, `hbg-flower-float`, `home-shimmer`

## 2026-06-11 — Fix: hint bar visual, enemy announce TTS, strict subject rotation

- `MoveSelectBattleMode.jsx` — Added `HintBar` component: Thai shows word + "คืออะไร?", Eng shows word + "= ?", math arithmetic shows `a op b =?` in large Fredoka font, count/pattern/word questions show Thai labels
- `MoveSelectBattleMode.jsx` — DIALOGUE BOX slot replaced: shows `HintBar` during battle (not victoryMode, q exists); falls back to `shownText` battle log during victory and loading
- `MoveSelectBattleMode.jsx` — Enemy name announce on mount: `speakTh(enemy.name + ' ปรากฏตัว')` fires at 700ms; first-question TTS delayed to 1800ms via `isFirstQuestionRef` to avoid cancellation; subsequent questions TTS at 500ms
- `src/lib/battleSubject.js` — `getBattleSubject` rewritten: strict thai→math→eng rotation (`dailyBattleRounds % 3`); `notready` override: if any subject has never been played it wins; old PRIORITY sort + variety safeguard removed
- `src/lib/battleSubject.js` — `getBattleLevel` adds debug `console.log` for xpThai/xpMath/xpEng/dailyBattleRounds and returned level (logic unchanged)

## 2026-06-11 — Fix: 5 UX fixes — dpad center, hint bar, auto-TTS, tall grass battle, enemy collision

- `WorldScreen.jsx` — D-pad repositioned to bottom-center (`left:'50%', transform:'translateX(-50%)'`); opacity 0.75→0.82
- `WorldScreen.jsx` — Tall grass encounter: replaced `ENCOUNTER_TRIGGERED` (was no-op) with `triggerBattle` on random hidden enemy (30% chance, 5-type pool); now correctly enters WorldBattle
- `MoveSelectBattleMode.jsx` — Added `THAI_NUMS`, `numTh()`, `mathToThai()` module-level helpers for math speech
- `MoveSelectBattleMode.jsx` — Added `DotGroup` component; math arithmetic `QuestionHint` now shows colored dot groups (blue for a, orange for b) when both ≤ 10
- `MoveSelectBattleMode.jsx` — `🔊 ฟังอีกครั้ง` / `🔊 Listen` → icon-only `🔊` buttons; math 🔊 speaks via `speakTh(mathToThai(q))`
- `MoveSelectBattleMode.jsx` — Auto-TTS useEffect fires for all subjects (math → Thai number equation via `speakTh`); `handleDismissTeach` extended to speak math equations
- `MoveSelectBattleMode.jsx` — Question hint container `minHeight` 48→58 to accommodate dot row

## 2026-06-11 — Feat: full BGM + SFX sound system + adaptive battle difficulty

- `src/lib/audio.js` — added `playBGM(track)`, `stopBGM(fadeMs)`, `playSFX(name)` exports; 5 primitive helpers (`_t`, `_sweep`, `_noise`, `_arp`, `_vibrato`); 4 BGM tracks (home/world/battle/victory) generated via Web Audio API (no files); 19 named SFX; iOS touchstart AudioContext resume listener
- `src/lib/battleSubject.js` — fixed PRIORITY order (`notready` now ranks before `comfortable` so unplayed subjects appear); variety safeguard (last-3-same-subject → rotate away); `getBattleLevel` now rotates easy(1)→hard(maxUnlocked)→medium(ceil/2) every 3 battles
- `src/components/Home.jsx` — BGM mount/unmount; `playSFX('stage_up')`, `egg_excited`, `egg_pet` wired to interactions
- `src/components/WorldScreen.jsx` — BGM mount/unmount; footstep→`playSFX('footstep')`, tall grass→`tall_grass`, NPC→`npc_talk`, screen transition→`screen_enter`, bunny wake→`enemy_notice`
- `src/components/WorldBattle.jsx` — BGM mount/unmount; `stopBGM()` on battle complete
- `src/games/MoveSelectBattleMode.jsx` — `battle_start` at entry flash, `attack_launch` on tap, `attack_hit/combo/ultra_move` in hit chain, `attack_miss` on miss, `victory` on showVictory

## 2026-06-11 — Fix: battle subject+level driven by child readiness, not enemy type

- `src/lib/battleSubject.js` (REWRITTEN) — `getBattleSubject(sessionLog, state)`: priority sort (exploring→comfortable→notready→strong), rotation tiebreaker via `dailyBattleRounds`. `getBattleLevel(subject, state)`: XP→level via `floor(xpX/120)+1`, clamped to LEVELS max id.
- `src/components/WorldScreen.jsx` — `triggerBattle` uses `getBattleSubject`+`getBattleLevel`; enemy type no longer influences subject or level

## 2026-06-11 — Fix: battle subject uses weakest subject from sessionLog, not hardcoded thai

- `src/lib/subjectReadiness.js` (NEW) — `computeReadiness(sessionLog, world)` extracted from Report.jsx
- `src/lib/battleSubject.js` (NEW) — `getBattleSubject(enemyType, sessionLog)` 3-layer: (1) exploring subject overrides all; (2) enemy preferred if comfortable; (3) sort by rank
- `src/config/enemyConfig.js` — added `subject` to all 7 types: bunny/leaf=thai, slime/mole/egg_pawn=math, fox/mushroom=eng
- `src/components/Report.jsx` — removed local `computeReadiness`, now imports from subjectReadiness.js
- `src/components/WorldScreen.jsx` — replaced `getWeakestSubject` with `getBattleSubject` import

## 2026-06-11 — Feat: creature Beauty Layer — Pokémon-quality rendering

- `src/lib/drawCreature.js` only:
- Added `lighten()/darken()` HSL string helpers, `eyeHighlight()` always-on white dot, `withShadow()` drop-shadow wrapper
- `gradEll()` 3-stop gradient: lighten → base → darken-12 at edge
- `FAM_RATIO` table: 16 family silhouettes applied in `buildGeometry()` (geometry-mean-preserving)
- `_cloudBody()` (3 circles) + `_crystalBody()` (hexagon + facets); `drawBody()` dispatches; belly/pattern skip cloud+crystal
- `drawHorn()` spiral+star wrapped in `withShadow()`; `drawTail()` star-tipped star wrapped in `withShadow()`
- `drawEyes()` eye size cap `hr×0.30`; always-on `eyeHighlight()` for all types except crescent
- `drawCheeks()` fixed opacity 0.73/0.40/0.00
- `drawAmbientGlow()` primary-color radial before aura; `imageSmoothingEnabled/Quality='high'` on canvas

## 2026-06-11 — Feat: 7 enemy types across all screens with movement patterns

- `src/lib/drawEnemy.js` (UPDATED) — Signature changed to `drawEnemy(ctx, type, size, x=0, y=0)` with `ctx.save/translate/restore` for world canvas rendering. Backward-compat aliases: `bunny`=`sleepy_bunny`, `slime`=`bouncy_slime`, `fox`=`fox_kit`. 3 new sprites: `leaf_sprite` (3-leaf wispy figure, #4aaa4a body, white dot eyes), `grumpy_mole` (round brown body, #8a6030, tinted glasses, frown, shovel), `mushroom_imp` (red cap #cc3030 with 3 white dots, scared wide eyes, O-mouth).
- `src/config/enemyConfig.js` (NEW) — `ENEMY_DATA` lookup for 7 types with `nameTH`, `hp`, `level`.
- `src/lib/tileMaps.js` (UPDATED) — `SCREEN_ENEMIES` export: per-screen enemy placement arrays for all 9 screens (3–4 enemies per screen). Static `ENEMY('bunny')` tile in BM_MAP row 11 replaced with grass.
- `src/components/WorldScreen.jsx` (UPDATED) — Imports `drawEnemy` + `SCREEN_ENEMIES`. `enemiesRef` for rAF-safe enemy array. `useEffect([screenId])` initializes enemies with `{id, type, col, row, dir, timer, rngSeed, woken, defeated, respawnTimer}`. `triggerBattle(enemy)` callback: marks defeated+respawnTimer=1800, flash, dispatch, navigate. `tryMove` now uses dynamic enemy collision (replaces T.ENEMY tile check): bumping sleepy_bunny wakes it; all others trigger battle. rAF loop: `updateEnemies` at ~20fps with per-type movement (slime=N/S bounce 45fr, fox=E/W patrol 60fr, egg_pawn=N/S patrol 60fr, leaf/mushroom=random wander 90fr via rngSeed, sleepy_bunny=proximity wake ≤3 tiles+chase 60fr). `renderEnemies`: 32px sprite per enemy at tile center offset by camera; `!` text bubble above woken bunny.
- `src/components/WorldBattle.jsx` (UPDATED) — `WORLD_ENEMY_NAMES` expanded with all 7 types including new ones.
- Build: ✅ zero errors.

## 2026-06-11 — Workflow: ntfy push notification rule

- Added ntfy push notification rule to `CLAUDE.md` for all future tasks. Claude Code must send a curl notification to `ntfy.sh/kidquest-boss` at the end of every task (success or error).

## 2026-06-11 — Feat: Fullscreen map + Pokémon GB battle animations

- `src/lib/particles.js` (NEW) — Canvas particle system: `mkBeam` (extending line + leading orb), `mkOrb` (arc-path orb + trailing ghost), `mkLightning` (seeded zigzag bolt), `mkSparks` (6-dir burst). `tickEffects(ctx, effects, dt)` advances + renders + returns surviving list. `mkOrb` supports `delay` for staggered XP victory.
- `src/games/MoveSelectBattleMode.jsx` (FULL REBUILD) — Enemy 120px top-right + Egg 96px bottom-left. Slide-in entry: CSS `transition:transform 300ms ease-out` — enemy from +120px, egg from -120px, both enter on `setEntered(true)` at 530ms. ResizeObserver-synced `<canvas>` effect overlay in battle field. `spawnEffect('attack'|'combo'|'ultimate'|'miss'|'xp')` uses `getBoundingClientRect()` for canvas-local coordinates. Thai attack=golden orb, Math=green beam, English=lightning, combo=lightning+orb, ultimate=beam+lightning+orb, xp=3 staggered orbs enemy→egg. Compact 2×2 move cards (168px fixed panel). HP bars 10px with threshold color. `GBHPBar` + `EnemyCanvas` sub-components. Victory: enemy defeat + XP orbs + "กลับสำรวจ" button when `showReturnButton`.
- `src/lib/tileEngine.js` (EDITED) — `getCamera`: when `mapPixW <= viewW` returns `-(viewW - mapPixW)/2` (negative = center map). `renderMap`: fills `#3a6a3a` background before tile loop; `startCol/startRow` clamped to `Math.max(0, ...)` to guard negative cam offsets.
- `src/components/WorldScreen.jsx` (EDITED) — Added `orientationchange` event listener alongside `resize`.
- `src/styles.css` (EDITED) — `.move-card-btn { -webkit-tap-highlight-color: transparent }` + `.move-card-btn:active:not(:disabled) { transform: scale(0.94) }`.
- Build: ✅ zero errors.

## 2026-06-11 — Feat: Pokémon GB battle screen + world→battle→world

- `src/lib/drawEnemy.js` (NEW) — Canvas sprite renderer for 4 enemy types (`bunny`, `slime`, `fox`, `egg_pawn`). `drawEnemy(ctx, enemyType, size)` draws at 48-unit design space scaled via `p(v) = Math.round(v * size / 48)`.
- `src/games/MoveSelectBattleMode.jsx` (FULL REWRITE) — GB-style battle layout: enemy canvas 48px top-right with HP bar, egg bottom-left with HP bar. 3-flash white-out on mount. Typewriter dialogue (`▶` prefix, 28ms/char). Enemy lunge + egg white-flash on wrong answer counterattack. Player HP visual-only (starts 60, `Math.max(8, h-8)` per wrong, never game over). New optional props: `enemyData`, `showReturnButton`. `GBHPBar` and `EnemyCanvas` sub-components.
- `src/components/WorldBattle.jsx` (NEW) — World battle wrapper. Reads `state.worldBattleEnemy`, generates 8 questions via inline `genMoveQuestion`. Dispatches `ROUND_COMPLETE`, `LOG_SESSION`, `RETURN_FROM_WORLD_BATTLE` on final question, then `navigate('world')`.
- `src/lib/state.js` — `worldPosition: null` and `worldBattleEnemy: null` added to `defaultState()`.
- `src/context/StateContext.jsx` — 3 new actions: `ENTER_BATTLE_FROM_WORLD` (saves position + enemy), `RETURN_FROM_WORLD_BATTLE` (clears enemy), `CLEAR_WORLD_POSITION` (clears position).
- `src/components/WorldScreen.jsx` — ENEMY tile detection in `tryMove` before `canMove` check: dispatches `ENTER_BATTLE_FROM_WORLD` + `navigate('world-battle')`. `stateRef` added for stale-closure safety. Mount effect restores `worldPosition` via `initScreen` `forcedStart` param.
- `src/App.jsx` — `world-battle` screen route added. BottomNav hidden for `world-battle`.
- Build: ✅ zero errors.
- Docs updated: `CURRENT_STATE.md`, `TASKS.md`, `CHANGELOG.md`, `CHATBOT_NOTES.md`, `green-meadow-implementation-plan.md`.

## 2026-06-10 — Feat: Camera-follow system + fullscreen map

- `src/lib/tileEngine.js` — `getCamera(playerX, playerY, viewW, viewH)`: now accepts viewport dimensions instead of fixed `CANVAS_W/CANVAS_H`. `renderMap()`: culling uses `ctx.canvas.width/height` for dynamic viewport size.
- `src/components/WorldScreen.jsx` — Canvas `width`/`height` attributes = `window.innerWidth/Height`, recalculated on `resize`. Canvas is `position:absolute; inset:0` inside `position:fixed; inset:0` container. D-pad moved from separate DOM section to overlay (`position:absolute`, `bottom: calc(24px + env(safe-area-inset-bottom))`, `left: 24`, `opacity: 0.75`). No flex column layout — single fixed container with absolute children. Render loop uses `canvas.width/height` dynamically for `clearRect` and `getCamera`.
- Result: map fills full viewport, d-pad overlays on canvas, no black space below map.

## 2026-06-10 — Feat: Green Meadow Phase 2 — Canvas Tile Engine

- `src/lib/tileEngine.js` (NEW) — Tile type constants (`T`), GB-palette Canvas 2D renderers (grass/tall/tree/path/water/exit/flower/sign/npc/enemy/itemspot), `renderMap()`, `renderPlayer()` (8-frame directional sprite, egg-stage color), `canMove()` collision, `getCamera()` clamp, `getExitAt()`, `getEntryPosition()` for cross-screen arrival.
- `src/lib/tileMaps.js` (NEW) — BM (Starting Path) full 20×15 tile map (owl NPC row 3, sign row 4, tall-grass rows 5–6, path rows 8–9, enemy row 11, EXIT_N bottom rows 7 side exits). Minimal walkable maps for all other 8 screens (TREE border, GRASS fill, EXIT tiles matching worldConfig connections). `SCREEN_MAPS` registry.
- `src/components/WorldScreen.jsx` (REPLACED) — Canvas tile engine replaces CSS art. rAF game loop (120ms player tween, tile animation frame counter). Virtual D-pad (4-button cross, 56×56px, bottom-left). 25% tall-grass encounter flash → `ENCOUNTER_TRIGGERED`. EXIT tile → 160ms fade transition → new screen entry from opposite edge. NPC proximity detection → 💬 คุย button → Prof Owl Thai dialogue. Sign proximity → 📋 อ่าน → sign lines. Home button + screen name overlaid on canvas. `position:fixed; inset:0` layout.
- `src/context/StateContext.jsx` — Added `ENCOUNTER_TRIGGERED` to ACTIONS enum + no-op reducer case.
- Build: ✅ zero errors.
- `docs/CURRENT_STATE.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/PROJECT_MAP.md`, `docs/CODEBASE_SUMMARY.md`, `CHATBOT_NOTES.md` updated.

## 2026-06-10 — Feat: Green Meadow Phase 1 — World Foundation

- `src/config/worldConfig.js` (NEW) — `SCREENS` 9-entry map (BM/MC/TM/TL/TR/ML/MR/BL/BR), each with `label`, `region`, `connects {N/S/E/W}` (null = no exit). `WORLD_REGIONS` (green-meadow, entryScreen BM). `SCREEN_THEMES` (sky+ground colors + icon per screen for placeholder backgrounds).
- `src/components/WorldScreen.jsx` (NEW) — Full-screen world overlay (`position:fixed;inset:0;zIndex:50`). `StartingPathBG`: CSS art scene with sky, sun/moon, animated clouds, distant hills, ground gradient, perspective trapezoid path, flowers, bushes, pollen particles, day/night support. `PlaceholderBG`: unique gradient + icon per screen. AC-style transition: 160ms dark overlay → screen snap → 160ms fade-in. Direction arrows (N/S/E/W) only shown where connection exists. `egg-home-float` on egg avatar (80×95 EggCanvas). Home button top-left. Screen name top-right.
- `src/lib/state.js` — Added `currentRegion: null`, `currentScreen: null`, `discoveredScreens: []` to `defaultState()`.
- `src/context/StateContext.jsx` — Added ACTIONS: `ENTER_WORLD`, `EXIT_WORLD`, `MOVE_SCREEN`, `DISCOVER_SCREEN`. Reducer cases for all 4.
- `src/components/Home.jsx` — Explore button changed: removes `SET_CURRENT_WORLD`+`SET_SESSION_XP` dispatches; now dispatches `ENTER_WORLD {region:'green-meadow', screen:'BM'}` + `navigate('world')`.
- `src/App.jsx` — `WorldScreen` imported, rendered for `screen === 'world'`. BottomNav now hidden for `game` and `world`.
- `src/styles.css` — `.world-arrow-btn:active { filter: brightness(0.82) }` added.
- Build: ✅ zero errors.
- `docs/CURRENT_STATE.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md`, `docs/SESSION_SUMMARY.md` updated.

## 2026-06-10 — Docs: Green Meadow Gate Questions Answered

- `docs/GPT_NOTES.md` — Green Meadow implementation gate questions answered and frozen. GM-Q1: large edge arrows (no joystick/D-pad). GM-Q2: 80px enemy trigger radius, 120px NPC radius. GM-Q3: Animal Crossing style fade+scroll ~300ms. GM-Q4: unlimited bag (no inventory management). GM-Q5: fullscreen minigame launch, return to world position. WB-Q1: direct entry Home→"ออกสำรวจ"→Green Meadow, no map screen. WB-Q3: region+readiness subject assignment, Green Meadow = Kindergarten content only. WB-Q4: XP from battles + treasure + NPC interactions + collectibles + minigames + exploration. World Bible open questions 1–6 also marked answered. Future questions section added: GM-Q6 (boss rebattle curriculum), GM-Q7 (egg sprite), GM-Q8 (collectible display), GM-Q10 (Post Bird chain), trade system, Sunny Beach unlock, seasonal events.
- `docs/TASKS.md` — Gate question task marked done. Phase 1 unblocked. Phase 2–6 tasks updated with confirmed decisions. World Bible blocking tasks resolved.

## 2026-06-10 — Docs: Green Meadow Implementation Plan

- `docs/research/world/green-meadow-implementation-plan.md` (NEW) — Full 9-phase implementation plan for Green Meadow (Phase 1 World). Each phase specifies: goal, files affected, dependencies, risks, review checklist, success criteria. Phases: (1) World Foundation, (2) Movement, (3) Visible Enemies, (4) NPC System, (5) Treasure System, (6) Minigame Integration, (7) Remaining Enemies, (8) King Clover Bear boss, (9) Polish. New state fields documented (`currentRegion`, `currentScreen`, `pickedUpTreasures`, `collectibles`, `clovers`, `bag`). `worldConfig.js` structure defined. Pre-implementation gate: 8 GPT questions must be answered before Phase 1. Dependency tree shows strict phase order (no reordering). Ranked risk list: navigation UX for age 4 is the highest risk. Chopin playtest checkpoints after Phases 2, 3, 4, 5, 6, 8, 9. No code. No build.
- `docs/TASKS.md` — Phase 1–9 implementation tasks added. WorldMap.jsx superseded task noted.

## 2026-06-10 — Docs: Green Meadow Detailed Design

- `docs/research/world/green-meadow.md` (NEW) — Full hand-authored design for Green Meadow (Phase 1 World). 3×3 screen grid with every screen fully specified: Starting Path (entrance), Town Square (hub), Grandma Turtle's House, Flower Field, Forest Entrance, River Crossing, Clover Hill, Pond & Willow, King Clover Bear Meadow (boss arena). Per screen: theme, visual mood, NPC placement, enemy placement, treasure spots, secrets, weather effects, day/night differences, music variation, special interactions, connections. All 6 Green Meadow enemies designed: Sleepy Bunny, Bouncy Slime, Tiny Fox, Leaf Sprite, Grumpy Mole, Mushroom Imp — each with appearance, movement, personality, animations, battle trigger, retreat behavior. All 5 NPCs designed: Professor Clover Owl, Grandma Turtle, Post Bird, Young Bunny Farmer, Traveling Bee Merchant — location, dialogue style, gifts, mini quests, special interactions. Treasure system: 11 fixed spots, random sparkle system, hidden clover system (27 total), lore collectibles (5 Old Letters). All 5 minigames integrated naturally: EggFishing at river/pond, EggRun via Bunny race, EggTower via ancient tree, EggCatch via butterfly field, EggMemory via Grandma's flower pots. Session loop (10–15 min arc). Full King Clover Bear boss flow: approach sequence, battle, win cutscene, failure philosophy (bear hugs + consolation gift, never lose-framing), replay. Home return system. Future hooks (Sunny Beach entrance, seasonal events, gardening, photo spots). 10 open questions for GPT. No code. No build.
- `docs/GPT_NOTES.md` — Green Meadow Design section added.
- `docs/TASKS.md` — Green Meadow design done; new open questions task added.

## 2026-06-10 — Docs: KidQuest World Bible

- `docs/research/world/kidquest-world.md` — Expanded from philosophy draft to full World Bible. 8 regions fully designed: Green Meadow (Phase 1), Sunny Beach, Crystal Cave, Cloud Kingdom, Moon Forest, Volcano Mountain, Ancient Ruins, Dream Sky. Each region has theme / visual / music / weather / NPC types / enemy families / rare creatures / collectibles / treasure / learning focus / boss / unlock requirements / special mechanics. Boss roster: King Clover Bear → Sleepy Whale → Crystal Deer → Cloud King → Moon Rabbit → Volcano Dragon → Ancient Turtle → Dream Lion (all friendly, not evil). Enemy design guide (cute/funny/warm). NPC guide. Collectibles (6 categories). Future systems section (cooking, gardening, fishing, seasonal events, home decoration, etc.). 10 open questions for GPT. No code. No build.
- `docs/GPT_NOTES.md` — World Bible summary section added with region table, boss roster, open questions.
- `docs/TASKS.md` — World Bible task done; open questions task updated.

## 2026-06-10 — Feat: Egg Home Background Scene

- `src/components/HomeBackground.jsx` (NEW) — Pure decorative CSS/SVG background scene. Day (6am–7pm): warm sky gradient, sun with glow, 3 drifting CSS clouds (pseudo-element bump shapes), soft hills (3 rounded div shapes), grass/ground curve, left+right trees (trunk div + leaf oval), 2 bushes, nest glow ellipse, tapered path, 6 flowers (box-shadow petal technique). Night (7pm–6am): dark sky, moon + crescent shadow overlay, 12 twinkling stars, night magic particles (floating purple dots). 4 CSS keyframes: `hbg-drift-r/l` (cloud drift), `hbg-twinkle` (stars), `hbg-float-magic` (night particles). All elements `pointerEvents:none`, `zIndex:-1`.
- `src/components/Home.jsx` — Import HomeBackground. Add `hour` + `isDay` computed values. `<HomeBackground hour={hour} />` as first child. Header: backdrop blur + day/night text colors. Item tray + action row: backdropFilter + day/night panel colors. Action buttons: day white / night dark.
- `src/styles.css` — `#egg-home` gets `position:relative`, background gradient removed. `.hbg-cloud` base + `.hbg-cloud-1/2/3` position + animation. 4 keyframes. `prefers-reduced-motion` disables cloud animations.
- Commit: `17bedf9`.

## 2026-06-10 — Fix: Robust Egg Interaction State Machine

- `src/components/Home.jsx` — Complete interaction system rewrite. `triggerAnim` removed. New formal FSM: `smRef` tracks `{ state, comboCount, enteredAt }`. States: `idle/pet/happy/excited/eating/sleep/relax/reunion`. `enterState(name, dur?)` cancels in-flight RAF (generation counter via `enterGenRef`) and exit timer before starting new transition; RAF callback is a no-op if superseded. `extendState(name)` resets exit timer only — no CSS class flicker for same-tier repeat taps. Tap combo: taps 1–3=pet bounce, 4–7=happy-spin (upgrade transition), 8+=excited+sparkles+hearts. Combo resets via `comboResetRef` after 3s inactivity. Item use (food/ribbon/potion/star) resets combo and calls `enterState`. Watchdog `setInterval(5000)` force-returns to idle if stuck non-idle >6s. Unmount cleanup cancels RAF + all timers. `petStreak` useState removed. Commit: pending.

## 2026-06-10 — Fix: Egg Home Rapid Tap Freeze

- `src/components/Home.jsx` — Three bugs fixed. (1) `triggerAnim` now cancels pending RAF via `rafRef` and uses `animGenRef` generation counter so orphaned timer/RAF callbacks are no-ops. (2) `petStreakRef` replaces stale `petStreak` closure reads in `handlePetEgg`. (3) 150ms cooldown via `lastPetRef` absorbs hyper-rapid taps. Also resets `petStreakRef.current` in the 6s inactivity timer; unmount cleanup cancels pending RAF. Commit `3e9ebed`.

## 2026-06-10 — Fix: Procedural Creature Detail Popup

- `src/components/CreatureDetailPopup.jsx` — Replaced legacy `drawCreature` (creatureAlgorithm.js) + manual canvas with `<CreatureCanvas dna={dna} size={196} animationEnabled>`. Accepts `dna` prop from Collection. Layout: creature 196px centered at top, name/info below, egg mini+XP bars, stats, abilities. Legacy emoji badge in corner. Commit `5de06e9`.
- `src/components/Collection.jsx` — `selectedEgg` state changed to `{ egg, dna }`. `CreatureCard` calls `onSelect(egg, dna)`. `handleSelect` passes both to popup. Ensures grid and popup use identical DNA. Commit `5de06e9`.

## 2026-06-10 — Collection: Procedural Creature Preview for Legacy Eggs

- `src/lib/creatureGenerator.js` — NEW: `buildLegacyPreviewDNA(egg, index)`. Primary: `buildCreatureDNA(egg.eggStats)`. Fallback: hash(name+emoji+rarity+index) → synthetic stats → `buildCreatureDNA`. Emoji nudges: 🐉→streak:82 (dragon), 🦊→eng+speed (fox), 🦄/🤖/💎→math (crystal), ⚡→streak:82 (star), 🦅→eng+speed (bird). Never persisted. Commit `8c393f7`.
- `src/components/Collection.jsx` — Replaced legacy canvas+useEffect+`drawLegacyCreature` with `<CreatureCanvas size={120}>`. `useMemo` ensures stable DNA reference. Legacy emoji badge (bottom-right corner) for old creatures. Removed `creatureAlgorithm.js` import entirely. Commit `8c393f7`.
- `src/styles.css` — `.catalog-grid-lg` (2-column), `.catalog-item-lg` (larger padding, bigger font). Commit `8c393f7`.

## 2026-06-10 — Procedural Character System Phase 3: Creature Personality & Animation

- `src/lib/drawCreature.js` — `drawCreature(canvas, dna, anim={})` now accepts optional animation state. `drawEyes` applies `blinkAmt` (0=open, 1=closed): scales eye y-radius by `1 - blinkAmt * 1.25`; below `bScale < 0.12` draws gentle closed-eye curve; crescent/button eye types squash via `ctx.save/translate/scale`. New `drawSleepZ(ctx, G, C, particles, sc)` draws floating 'z' glyphs using accent hue. Commit `658d25c`.
- `src/components/CreatureCanvas.jsx` — Full rewrite. RAF animation loop drives blink state machine (`open → closing → closed → opening`) with personality-specific rate and ±1s jitter. Sleep Z-particle system: spawn/float/fade particles passed to `drawCreature` as `sleepParticles`. Props added: `personality`, `animationEnabled` (default `true`), `idleMode` (`'idle'|'sleep'|'celebrate'`). CSS idle class derived from personality + idleMode applied to canvas element. Commit `658d25c`.
- `src/styles.css` — 8 CSS keyframe sets (`ci-happy`, `ci-curious`, `ci-brave`, `ci-playful`, `ci-gentle`, `ci-sleepy`, `ci-shy`, `ci-celebrate`) and matching animation classes. Each keyframe combines breathing (scale) + body bob (translateY) tuned per personality speed. `@media(prefers-reduced-motion:reduce)` disables all `ci-*` classes. Commit `658d25c`.

## 2026-06-09 — Procedural Character System Design v3 (Egg-to-Creature Identity)

- `docs/research/creatures/procedural-character-system.md` — NEW SECTION: **Egg-to-Creature Identity**. Core rule: family derived from egg visual motif first; stats modify creature within that family. Motif detection logic (isNight → Moon; ha gold + streak ≥ 14 + stage ≥ 5 → Star; h1 hue ranges → Leaf/Ocean/Cloud/Crystal/Ember). Motif catalog (7 named motifs with visual descriptions). Family mapping from egg motif with named examples (Moon Fox / Moon Bunny / Moon Puff / Moon Dragon / Star Puff / Star Bird / Star Cat / Leaf Bear / Ember Fox / Ember Dragon, etc.). Concrete inheritance examples table. Updated Family Determination Logic (motif-first, stat-fallback for no-motif eggs). Updated Egg-to-Creature Visual Continuity section (now references Identity section, adds motif row to hard-continuity table). Future note: Egg Visual Identity Pass may require CSS overlay or planned `drawEgg()` modification so eggs look more clearly motif-typed. Open questions expanded to 10 (Q9: egg legibility, Q10: Ember as 17th family).
- `docs/GPT_NOTES.md` — Egg-to-Creature Identity section added; open questions updated to 10.
- `docs/TASKS.md` — Design v3 task marked done; GPT questions updated to 10.
- No code changes. No build.

## 2026-06-09 — Procedural Character System Design v2 (Beauty Layer + Families + Migration)

- `docs/research/creatures/procedural-character-system.md` — REVISED. Added: **Beauty Layer** (between Art Direction and Animation — sticker test, tinted outline, eye gloss, body radial gradient, cheek gradient, signature feature amplification, harmony check, breathing room, collection background aura). Added: **16 Family Archetypes** (Puff/Fluff/Bear/Cat/Fox/Bunny/Bird/Dragon/Leaf/Star/Moon/Cloud/Crystal/Ocean/Flower/Dream — visual themes not species; family determined first; 2–3 locked features per family; sibling relationship). Added: **Signature Feature System** (17 traits: mega-cheeks, two-color-eyes, heart-cheek, star-freckle, mega-ears, curly-tail, twin-tails, large-bow, body-glow-spot, etc.; one per creature; amplified by Beauty Layer; has own idle micro-animation). Added: **Existing Collection Migration** section (old emoji creatures → legacy render path; new hatches → `dna` field → canvas; same seed = same character forever; no data loss). **Removed Phase 2 emoji-composite** from implementation path. New **5-phase path**: P1 DNA extraction → P2 drawCreature() canvas → P3 Animation → P4 Voice → P5 Birth sequence. Updated combination math: ~340M valid creatures. Updated open questions: 8 questions, Q1 (canvas vs emoji-composite) resolved by removing emoji composite.
- `docs/GPT_NOTES.md` — Procedural Character System section updated with revised architecture, new decisions (Beauty Layer, families, signature features, migration), 5-phase path, 8 open questions.
- `docs/TASKS.md` — Design v2 task marked done; emoji-composite Phase 2 task replaced with Canvas renderer task; Phase 3–5 tasks updated.
- No code changes. No build.

## 2026-06-09 — Procedural Character System Design

- `docs/research/creatures/procedural-character-system.md` — NEW. Full architecture for infinite creature generation without fixed monster pools. Core: re-uses `hash()` + `prng()` from `eggAlgorithm.js` (imported, never modified) to derive creature DNA from egg stats. 40+ gene attributes (body/face/ears/horns/wings/tail/pattern/accessories/glow). Art direction layer enforces cute/warm/huggable constraints for ages 4–6. 7 personality types (Happy/Curious/Brave/Playful/Gentle/Sleepy/Shy) derived from learning profile at hatch time. Animation + voice layers. Egg-to-creature visual continuity (same hue values carry over; 60–75% feature echo probability). Feature richness scales by hatch stage. ~42M valid combinations. 4-phase implementation path. 10 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Creatures section added.
- `docs/GPT_NOTES.md` — Procedural Character System section with key decisions and 7 GPT open questions.
- `docs/TASKS.md` — Design task done; Phase 1–4 implementation tasks added.
- No code changes. No build.

## 2026-06-09 — Dramatic Egg Stage Progression

- `src/lib/eggAlgorithm.js` — `EGG_STAGES` changed 7→9. `EGG_STAGE_NAMES` updated to 9 Thai names: ไข่น้อย / ไข่อบอุ่น / ไข่มีความสุข / ไข่แวววาว / ไข่วิเศษ / ไข่เปล่งแสง / ไข่โบราณ / ไข่แตกร้าว / ใกล้ฟักแล้ว!!!. `drawEgg()`, `hash()`, `prng()` untouched — visual spread naturally adjusts via `progress = stage/8` (was `stage/6`).
- `src/lib/audio.js` — 2 new SFX: `stageUp` (5-note ascending triangle fanfare + 2 sine accents); `heartbeat` (two-beat lub-dub low sine, 90→38Hz).
- `src/styles.css` — 9 `@keyframes egg-aura-s*` (s2–s8) with pulsing `drop-shadow` growing in intensity/frequency per stage. 9 `.egg-s*` classes apply persistent aura on EggCanvas. `@keyframes stage-up-pop` + `.stage-up-banner` for pop/float/fade celebration overlay.
- `src/components/Home.jsx` — `EGG_STAGES` imported. `stageUp` state + `prevStageRef` for stage-up detection. Stage-up `useEffect`: detects stage increase → `stageUp` sound + 18 sparkle + 6 heart particles + `.stage-up-banner` overlay (2.8s, auto-clear). Heartbeat `useEffect`: plays `heartbeat` once + every 8s when `readyToHatch`. `readyToHatch` updated to `stage >= EGG_STAGES - 1`. Excited mode threshold updated 5→7. `stageDots` uses `EGG_STAGES` constant (was hardcoded 7). `EggCanvas` gets `egg-s${stage}` class (merged with temp `egg-glow-*` — glow overrides aura during interactions). Stage header: 9-color dot+name tints per stage, smaller dots (7px, was 9px), color transitions on stage change.
- Build ✅. Commit: `feat: dramatic egg stage progression`. Pushed.

## 2026-06-09 — Egg Home Emotional Life

- `src/components/Home.jsx` — New idle behaviors: `idle-blink` (fast Y-squish, ~blink), `idle-look` (gentle tilt, curious), `idle-yawn` (slow stretch + settle) added to the 5–12s random idle pool. Creature companion gains personality state machine (walk/wave/sit/celebrate/gift/look/sleep, 20–45s cycle): `wave` → creature bounces + 👋 inline + chirp sound; `sit` → tilted 14° + static; `celebrate` → jump loop + 🎊 + sparkle particles + celebrate sound; `gift` → 🎁 shown; `look` → 👀 shown; `sleep` → dim opacity + 💤. Creature patrol pauses during non-walk states. Directional flip wrapped separately from animation class so they don't conflict. Ambient events: butterfly 🦋, falling leaf 🍂, shooting star ✨ — `position:fixed` CSS animations, triggered every 38–88 seconds, visual only, no mechanics. Reunion enhanced: hearts+sparkle combined burst + double chirp. Ribbon: changed from `pet` to `happy-spin` (proud spin). Star: combined sparkle+hearts burst.
- `src/lib/audio.js` — Added `yawn` sound: low descending sine (290→165Hz, 0.94s).
- `src/styles.css` — 12 new keyframes/classes: `idle-blink`, `idle-look`, `idle-yawn`, `creature-wave`, `creature-celebrate`, `creature-overlay-bob`, `ambient-butterfly`, `ambient-leaf`, `ambient-shooting-star` + CSS classes for new idle and creature animations.
- Build ✅. Commit: `feat: egg home emotional life`. Pushed.

## 2026-06-09 — Home Bottom Layout Overlap Fix

- `src/styles.css` — Added `#root { height:100%; width:100%; display:flex; flex-direction:column; overflow:hidden }`. This fixes the height propagation chain (html→body→#root) so that `height:100%` on children resolves correctly. Also increased `#egg-home` padding-bottom from `calc(60px + safe)` to `calc(76px + env(safe-area-inset-bottom))` — actual nav height is 95px (61px buttons + 34px safe area), previous value was 94px (1px short).
- `src/components/Home.jsx` — Changed root div `height:'100%'` → `height:'100dvh'` and split `overflow:'hidden'` → `overflowX:'hidden', overflowY:'hidden'`. `100dvh` (dynamic viewport height) works independently of the parent height chain and adjusts correctly for iOS Safari's retractable browser toolbar. Belt-and-suspenders with the #root CSS fix.
- Build ✅. Commit: `fix: home bottom layout overlap`. Pushed.

## 2026-06-09 — Egg Home Emotional Polish

- `src/components/Home.jsx` — Full rewrite. Flying food animation (fixed-position emoji flies from tray up to egg center, egg eats it). Per-item glow effects via CSS `drop-shadow` on EggCanvas (`egg-glow-warm/blue/gold/pink`). Ribbon 🎀 overlay (persists on egg after use, top-right corner). Star orbit: two `.egg-star-orbit` divs rotating around egg when XP boost active. Random idle micro-animations: every 5–12s, `idle-wiggle` or `idle-jump` fires (25% chirp, 8% begging sound) — egg feels alive without interaction. `stageRef` + `eggAnimRef` fix stale closure in `triggerAnim` and idle scheduler. Food chain: flyingItem set → 360ms → eat anim + chew sound + warm glow → 620ms: flyingItem clear → 870ms: sigh sound. Ribbon: jingle + pink glow + pet anim. Potion: slurp + blue glow + relax anim. Star: celebrate + gold glow + happy-spin. Pet streak 3 → giggle sound. Layout: inline `paddingBottom:66` removed; CSS `#egg-home` rule handles safe-area-aware padding.
- `src/lib/audio.js` — 6 new SFX: `chew` (3-hit crunch), `slurp` (rising sine + accent), `giggle` (4-step ascending triangle pairs), `sigh` (descending sine fade), `celebrate` (6-note ascending fanfare), `begging` (rising-falling sine breath).
- `src/styles.css` — EGG HOME section expanded: `egg-anim-eat`, `egg-anim-relax`, `egg-anim-idle-wiggle`, `egg-anim-idle-jump`, `food-fly-up`, `egg-glow-warm/blue/gold/pink`, `star-orbit` keyframes and classes. Layout: `#egg-home` `padding-bottom: calc(60px + env(safe-area-inset-bottom))` fixes iPhone safe area overlap.
- Build ✅. Commit: `feat: egg home emotional polish`. Pushed.

## 2026-06-09 — Egg Home MVP

- `src/components/Home.jsx` — REPLACED. Old Home (Adventure Director, subject grid, Egg Run, stats strip) removed. New Egg Home: large egg center (190×225px), idle float animation, stage 5+ excited pulse, pet interaction (chirp+sparkle+hearts), streak happy-spin + sleepy, reunion burst on first visit or >4h gap, item tray (food/ribbon/potion/star, count badges, tap-twice-to-use), creature companion walks left-right after first hatch (tap for chirp+bounce), action row (ลูบไข่ / คอลเลกชัน / ออกสำรวจ), warm gradient background.
- `src/lib/state.js` — Added `lastHomeVisit: null` to `defaultState()`.
- `src/context/StateContext.jsx` — Added `UPDATE_LAST_HOME_VISIT` action + reducer case.
- `src/lib/audio.js` — Added 4 new SFX to `playTone()`: `chirp` (high cute chirp), `sparkle` (ascending twinkle), `jingle` (ribbon jingle), `feed` (eating sound).
- `src/styles.css` — Added Egg Home keyframes: `egg-home-float`, `egg-home-excited`, `egg-anim-pet`, `egg-anim-happy-spin`, `egg-anim-reunion`, `egg-anim-sleepy`, `particle-rise`. Added CSS classes: `.egg-anim-float/excited/pet/happy-spin/reunion/sleepy`.
- Build ✅. Commit: `feat: egg home mvp`. Pushed.

## 2026-06-09 — Egg Home Design (docs only)

- `docs/research/world/egg-home.md` — NEW. Full Egg Home design. Goal: child feels "I want to visit my egg." Covers: screen layout (390px portrait), egg zone (160–200px center, stage-aware appearance), item tray interactions (pet/feed/ribbon/potion/star with distinct visual rituals), mood system (happy/content/quiet/excited/reunion — visual only, no stat bars), stage progression in Home (stages 1–7 with distinct egg behaviour), creature companion (walks left-right, tap for reaction), return loop motivators (intrinsic only: reunion burst, near-hatch excitement, items waiting), Year 1 MVP scope, 10 open questions for GPT.
- `docs/GPT_NOTES.md` — Egg Home Design section added at top.
- `docs/TASKS.md` — Egg Home design task marked done; GPT open questions task added.
- `docs/SESSION_SUMMARY.md` — Updated.
- `docs/GPT_HANDOFF.md` — Latest session summary updated.
- No code changes. No build.

## 2026-06-09 — KidQuest World Design (docs only)

- `docs/research/world/kidquest-world.md` — NEW. Full design document for the world-based game model. Covers: philosophy shift (game-first, learning hidden), Chopin's direct playtesting feedback ("boring" / "not like a game"), emotional center (egg is the hero), high-level loop (Egg Home → explore → encounter → battle → reward → grow → hatch), Egg Home spec, World Map structure (screen-based, Pokémon FireRed model), region list (Year 1 = Green Meadow only), exploration events, battle's new role, learning hidden curriculum principle, transition from current state, Year 1 MVP scope, 10 open questions for GPT.
- `docs/GPT_NOTES.md` — KidQuest World section added at top. Records: Chopin's feedback, philosophy decision, emotional center decision, high-level loop, map structure decision (screen-based), Year 1 scope (Green Meadow), 10 open questions, what Claude Code must NOT touch until GPT answers.
- `docs/TASKS.md` — KidQuest World design phase tasks added at top of Now section: world doc (done), GPT open questions (pending), Egg Home design, World Map design, Encounter design, implementation queue (blocked on design).
- `docs/SESSION_SUMMARY.md` — Updated.
- `docs/GPT_HANDOFF.md` — Updated with new session summary and revised current state.
- No code changes. No build.

## 2026-06-09 — Educational Visuals for Math Counting

- `src/config/gameConfig.js` — Added `COUNTABLE_GROUPS` (3 semantic categories: fruits 🍎🍌🍓🍊🍒, animals 🐟🐱🐶🐰🐸, everyday 🧸⭐🎈🌸🚗) and `COUNTABLES` (flat export). Updated `PATTERN_SETS.AB`: removed game meta-item `🥚` (egg), added educationally coherent pairs — shapes `['🔺','🔵']`, fruits `['🍎','🍌']`, animals `['🐱','🐶']`. Updated `TEACH_CONTENT.math[0]` examples (🥚🥚🥚 → 🍎🍎🍎, ⭐×5 → 🐟×5). Updated `TEACH_CONTENT.math[8]` pattern examples to match new pattern sets.
- `src/games/GameMath.jsx` — Removed local `COUNTABLES`. Imports `COUNTABLES, COUNTABLE_GROUPS` from gameConfig. `genQ` for `objects` visual model now picks both `emojiA` and `emojiB` from the same semantic group (e.g. 🍎+🍌, 🐱+🐶), so addition visuals are coherent instead of random cross-category pairs.
- `src/games/GameMathBattle.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- `src/games/GameSubjectAdventure.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- Build: ✅ zero errors. Commit: b050fd1.

## 2026-06-09 — True Full-Screen Mobile Battle Layout (bug fix)

- `src/games/GameScreen.jsx` — Adventure worlds now use `position:fixed;inset:0;zIndex:50` overlay, fully escaping all parent flex constraints. Absolute-positioned `←` back button (z-index 200). Inner `flex:1` div contains the game tree.
- `src/styles.css` — Removed `align-items:center` from `#root` rule. `#root` now only stretches children (no centering). Home still centers itself internally — safe change.
- `src/games/GameSubjectAdventure.jsx` — Default export wrapped in `flex:1/minHeight:0` div so Session fills the overlay. `ResultScreen` root changed `minHeight:'100%'` → `flex:1` for reliable viewport fill in flex context.
- `src/games/MoveSelectBattleMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/ChaseMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/DefenseMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- Build: ✅ zero errors. Commit: 2ba7922.

## 2026-06-09 — Mobile Playtest Polish: Full-Width UI + Simplified Answer Cards

- `src/games/GameScreen.jsx` — Adventure worlds (`adventure-*`) now use a dedicated full-width container: no `maxWidth`, no `alignItems:'center'` (defaults to stretch), `overflow:'hidden'`. All other worlds keep the existing `maxWidth:480 / alignItems:center` container. Root cause of white-margin bug: `alignItems:'center'` on the flex column container prevented game components from stretching to full width.
- `src/games/MoveSelectBattleMode.jsx` — Removed attack identity layer entirely. Deleted: `ICONS` array, `MOVE_NAME` map, `moveIcons` useMemo, `shuffle` import, `useMemo` import. `MoveCard` now shows **only the learning answer** — no element icon above, no attack name below. Font size adapts to content: ≤2 chars→64px (emoji, digit), ≤4 chars→54px, longer→44px. Battle log for simple hit changed from `"⚡ Thunder! +N XP"` to `"⚔️ โจมตี! +N XP"`. Chunk size: 36.72→36.22 KB.
- Build: ✅ zero errors. Commit: a8759ea.

## 2026-06-09 — Adventure Mode UI 2.0

- `src/games/DefenseMode.jsx` — Full layout redesign. Enemy (attacker) enlarged from 90px → 120px emoji. Removed `QuestionDisplay` component (44px emoji + word + subtext — was dominating the screen). Replaced with compact `QuestionHint` (28px emoji + 🔊 button only, or tiny math/count display). Hit flash overlay added (crit-flash keyframe). Miss animation on wrong choice button (`miss-fizzle`). Red button highlight on wrong tap. Combo indicator top-left (no large badge). Mode text labels removed. Vertical stack unchanged: Enemy → Shield → Egg. Egg gets continuous `egg-idle 3s` idle animation. Move panel: `flex:1` takes bottom half, `flexShrink:0` on all headers.
- `src/games/ChaseMode.jsx` — Full layout redesign. Target emoji enlarged from 64px → 120px, moved to top center (was top-right corner). Removed `QuestionDisplay`. Replaced with same compact `QuestionHint`. Chase track slimmed from 70px → 32px. Egg on track stays (28px canvas). Hit flash overlay added. Miss animation on wrong button. Combo indicator top-left. Target now shows "จับได้แล้ว!" + victory-bounce when dist≥100. Slim track shows gold fill when dist≥80 ("⚡ ใกล้แล้ว!" label inside).
- `src/games/MoveSelectBattleMode.jsx` — Egg idle animation: default state now `egg-idle 3s ease-in-out infinite` instead of `none`. Question hint min-height reduced 46→36px. Minor layout tightening.
- `src/styles.css` — New keyframe `egg-idle` (gentle float + rotate, 3s ease-in-out). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.72KB.

## 2026-06-04 — Pokémon-Style Learning Battle (all 3 subjects)

- `src/games/MoveSelectBattleMode.jsx` — NEW. Pokémon-style battle shell replacing BattleMode in Subject Adventure Engine. One component serves Math/Thai/English via subject adapters. Move panel: 2×2 grid, each card shows `[element icon] [answer content]` (number for Math, emoji for Thai/Eng). No player HP. Wrong answer = miss fizzle + "โจมตีพลาด!". Combo system: streak 2=glow, 3=combo flash, 4+=CRITICAL ×1.5 damage. Ultimate: after 3 consecutive correct, ultimate charges (×2 damage on next correct). Boss encounters at 12% rate. Victory after last question: enemy defeat animation → confetti → fanfare → result screen. Teach intro overlay shown on first-ever play of a level. Anticipation sequence: tap → card pulse → egg charge → egg lunge → hit/miss effects. TTS fires on Thai/English question load. Egg companion: all existing EggCanvas animations, near-hatch glow, combo glow ring.
- `src/games/GameSubjectAdventure.jsx` — Added `genThaiMoveQ()` and `genEngMoveQ()` generators that return emoji choices (not letter choices) for the battle move panel. `genMoveQuestion()` dispatcher selects format by subject. Session now generates battle questions with `genMoveQuestion` when mode is 'battle', classic questions for chase/defense. Replaced `BattleMode` import with `MoveSelectBattleMode`. Passes `isFirstLevel` prop. `ResultScreen` updated: hides score/accuracy from child (score still in sessionLog for parent Report), shows 🎉 ชนะแล้ว! + +XP + ไข่โตขึ้น! only.
- `src/lib/audio.js` — 3 new `playTone()` types: `miss` (soft descending fizzle, no harsh sound), `combo` (rising 3-note chime), `ultimate` (7-note ascending power fanfare).
- `src/styles.css` — 5 new keyframes: `move-pulse` (card tap scale+glow), `egg-charge` (vibrate in place), `miss-fizzle` (card fades/blurs), `enemy-defeat` (enemy shrinks and fades), `crit-flash` (screen flash). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.39KB (was 32.40KB).

## 2026-06-04 — Battle Feel Polish Pass (docs only)

- `docs/research/gameplay/pokemon-style-learning-battle.md` — Updated to align fully with `battle-feel-philosophy.md`. Removed: player HP bar, defeat screen, gentle defeat section, losing states, "every 3 wrong = counter attack" mechanic. Wrong answer philosophy changed: wrong → attack misses → soft fizzle → enemy laughs/taunts → continue (no punishment accumulation, no strike count, no anxiety). Move names reduced: icons + answers are primary; move names are tiny flavor text below icon (or hidden entirely). Move card examples updated to show icon + answer only. Battle log aligned to short format: "⚡ Thunder!", "โจมตีพลาด!", "คอมโบ!", "CRITICAL!", "ชนะแล้ว!". Open question 3 (player HP) resolved: removed. Audio: `gentle-defeat` tone removed; `enemy-taunt` added. Session structure: defeat condition removed, replaced with "child cannot lose" statement. Visual anatomy: player HP bar removed from diagram. Authority note added: Battle Feel Philosophy governs all conflicts.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section updated with all Battle Feel Polish decisions.
- `docs/TASKS.md` — Battle Feel Polish Pass task added and marked done.
- No code changes. No build.

## 2026-06-04 — Battle Feel Philosophy Design

- `docs/research/gameplay/battle-feel-philosophy.md` — NEW. Defines the sensory and emotional grammar for all Subject Battle implementations. Covers: core "battle is the experience" principle, visual hierarchy (enemy > HP > log > move panel), player HP removal rationale, wrong-answer philosophy (miss not punishment), full anticipation sequence (10-step tap-to-result chain), sound philosophy (cute/positive/Pokémon-like), combo system (streak 2→3→4 = crit ×1.5), victory sequence (enemy defeat → stars → confetti → egg celebrates), battle log spec (1-line, Thai-first), animation philosophy (fast/CSS/reuse existing keyframes), screen layout reference, implementation priority (feel before content), 5 open questions before implementation.
- `docs/RESEARCH_INDEX.md` — Battle Feel Philosophy entry added to Gameplay section.
- `docs/GPT_NOTES.md` — Battle Feel Philosophy section added with player HP decision and combo philosophy.
- `docs/TASKS.md` — Battle Feel design task added and marked done; PSLB-0 (feel baseline) inserted before PSLB-1.
- No code changes. No build.

## 2026-06-04 — Pokémon-Style Learning Battle Design

- `docs/research/gameplay/pokemon-style-learning-battle.md` — NEW. Full design document. Battle-first framing: answer choices ARE attack moves (not a quiz with battle decoration). Covers: move-select panel anatomy (`[icon] [name] ... [answer]`), subject encoding per subject (Math=numbers as damage, Thai/English=emoji+TTS), full battle flow (8 steps per turn), move name sets per subject, screen layout spec, animation list (14 keyframes), audio list (8 new tones), egg integration (child's egg is the hero), session structure (8 turns / 1 enemy), subject battle shell principle (one component, three content types), MVP recommendation (Math first → Thai → English → polish), scope check (passes Year 1 guardian), 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section updated with pokemon-style-learning-battle.md entry.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section added with key decisions and open questions.
- `docs/TASKS.md` — Design task marked done; PSLB implementation queue added (PSLB-1 through PSLB-5).
- No code changes. No build.

## 2026-06-04 — Egg Companion Adventure MVP

- `src/games/BattleMode.jsx` — EggCanvas replaces `🦸` player avatar. Egg jumps (`eggBounce`) + gold glow + `✨` sparkle float on correct answer. Egg shakes (`eggShake`) when enemy counter-attacks. Continuous `egg-near-hatch` pulse/glow at stage ≥ 5. Egg growth progress bar below battle log: stage name + progress bar + %. `item` sparkle tone fires 200ms after every correct answer.
- `src/games/DefenseMode.jsx` — EggCanvas replaces generic baby emoji. Egg bounces on shield-block; shakes when hit. Sparkle tone on correct.
- `src/games/ChaseMode.jsx` — EggCanvas replaces `🦸` runner. Egg dashes on correct. Sparkle tone on correct.
- `src/games/GameSubjectAdventure.jsx` — Passes `eggStats`, `eggProgress`, `readyToHatch` props from `useAppState()` to all 3 modes.
- `src/styles.css` — `egg-near-hatch` keyframe: combined scale + golden glow pulse (looping, for stage 5–6 eggs).
- Build ✅ zero errors.

## 2026-06-04 — Egg Companion Adventure Design

- `docs/research/gameplay/egg-companion-adventure.md` — NEW. Full design document. Covers: egg as emotional companion (not progress bar), companion framing across all modes (DefenseMode = egg being defended, BattleMode = egg beside player, ChaseMode = egg dashes with player), visual/audio/progress behavior spec, relationship data fields (adventuresWith/questionsAnswered/daysTogetherCount/favoriteSubject/bornFrom), MVP recommendation (DefenseMode egg first, then BattleMode, then relationship data), hatch biography payoff design, non-goals (no egg HP, no egg health from mistakes, no numbers during gameplay), 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section added with egg-companion-adventure.md entry.
- `docs/GPT_NOTES.md` — Egg Companion Adventure Philosophy section added.
- `docs/TASKS.md` — Design task marked done; ECA implementation queue added (ECA-MVP-1 through ECA-5).
- No code changes. No build.

## 2026-06-04 — Subject Adventure Engine MVP

- `src/games/GameSubjectAdventure.jsx` — NEW. Orchestrator: generates 8 questions per session from existing content (genMathQ respects player level; genThaiQ from TH_ALPHA emoji→letter; genEngQ from EN_ALPHA emoji→letter). Picks mode deterministically: `MODES[(dayN + playCount) % 3]` so it rotates battle→chase→defense daily per subject. Dispatches ADD_XP, ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL (≥80% score), LOG_SESSION. TTS via useEffect on cur change (speakTh for Thai, speakEn for English). Key-based replay (session key increments → full remount = fresh state + new mode).
- `src/games/BattleMode.jsx` — NEW. Subject-specific enemies (math: 🤖👻😈🐲, thai: 👺🐻🐉🐯, eng: 👾👽⛈️🦾). Enemy HP bar + player HP bar. Correct: adv-jump animation + enemy red flash + floating damage number. Crit at streak≥2: ×1.5 damage + confetti + streak-bounce badge. Wrong ×3: enemy counter-attack + player shake + HP damage. combo badge shown when streak≥3.
- `src/games/ChaseMode.jsx` — NEW. Horizontal distance track. Start at 30%, +14% per correct (×1.5 on crit), -10% per 3rd wrong. adv-dash animation on correct. Target emoji at right end, player 🦸 trails behind. Distance label updates. "dash" SFX on correct.
- `src/games/DefenseMode.jsx` — NEW. Baby creature (🥚/🐣/🌟 by subject) + shield with pip HP (one pip per question). Attacker → shield ← baby layout. Correct: adv-shield bounce + attacker pushed back + "block" SFX. Wrong ×3: shield pip lost + shake. Shield glows on block via filter.
- `src/games/GameScreen.jsx` — Lazy import + 3 routes for adventure-thai/adventure-math/adventure-eng, each passing subject prop.
- `src/components/Home.jsx` — "learn" recommendation routes to `adventure-{world}`. Label/icon updated per subject mode (Math→⚔️, Thai→🛡️, Eng→🏃). Classic games still accessible via "อยากเลือกเอง?" grid.
- `src/lib/audio.js` — `dash` tone (ascending 3-note sawtooth sweep, chase correct); `block` tone (low square thump, defense correct).
- `src/styles.css` — `adv-jump` (player leaps), `adv-dash` (player dashes forward), `adv-shield` (shield bounces on block).
- Build: ✅ zero errors. GameSubjectAdventure lazy chunk: 30KB.

## 2026-06-04 — Battle special move timing + accessibility

- `src/components/BattleScreen.jsx` — Special move prompt moved from pre-battle question phase to mid-battle surprise. Battle now starts immediately (`phase` initialised to `'fighting'`). Special prompt appears as a semi-transparent overlay after attack 2 or 3 (random), while the battle screen remains visible behind it. New question format: Math shows emoji counting (`🍎🍎` → tap 2), Thai/English uses TTS (`speakTh`/`speakEn`) with emoji choices (e.g. "ปลา" → 🐟/🐱/🐶). 🔊 replay button on Thai/English prompt. Correct → exciting special SFX fires immediately + `victory-bounce` "🔥 ท่าพิเศษพร้อมแล้ว!" feedback → special attack animates in battle; Wrong/Skip → gentle "💪 สู้ต่อไปนะ!" or no feedback, battle continues normally — no penalty. HP tracking changed from absolute (log snapshot) to relative (damage-delta) so special damage mid-battle is accurate without a second simulation. `TH_ALPHA`/`EN_ALPHA` imports removed; replaced with compact inline question sets (7 math, 6 Thai, 6 English). Build ✅.

## 2026-06-04 — Math Battle learning mode

- `src/games/GameMathBattle.jsx` — NEW. Battle-wrapped Math MVP. Dark purple (#1a1040) UI. 8 questions per battle against one of 4 cute enemies (🤖👻😈🐲, 64 HP each). Enemy selected randomly. Player's current math level auto-used (no level selector in battle mode). Correct answer → enemy attack flash + HP reduction + battle text. Streak ≥3 → Critical Hit (×1.5 dmg, streak SFX, confetti). Wrong → gentle enemy shake, up to 3 attempts, then reveal. No player HP — child-friendly, zero frustration punishment. All dispatches identical to GameMath: ADD_XP (same formula), ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL, LOG_SESSION (world:'math'). Result screen shows HP drained + replay/home.
- `src/games/GameScreen.jsx` — Lazy-import for GameMathBattle; `mathbattle` added to WORLD_TITLES.
- `src/components/Home.jsx` — Continue Adventure Math recommendation: icon `⚔️`, label "Math Battle", sub "ตอบถูก = โจมตี! ⚡". Routes to `mathbattle` world. Subject grid Math card unchanged → still routes to normal `math`.
- Build: ✅ zero errors. Commit: f6e5b74.

## 2026-06-04 — Fix: rewards from Continue Adventure

- `src/context/StateContext.jsx` — Fixed race condition where `loadState()` async callback and the `SIGNED_IN` auth handler could dispatch `INIT` with stale Supabase data, silently reverting XP, items, and egg progress earned since app start. Fix: before dispatching `INIT`, compare `remote.rounds` against `stateRef.current.rounds` (the always-current ref already wired in the context). If local is ahead (user made progress before the async resolve or token refresh fired), keep local state and push it to Supabase instead. Guest mode and new-device/fresh-install paths unaffected.

## 2026-06-04 — Animation juice polish

- `src/styles.css` — 10 new `@keyframes` + utility classes: `pulse-float` (Continue Adventure gentle bob), `battle-glow-pulse` (purple glow ring for battle card), `shimmer-bright` (Surprise card), `slide-down-in` (subject grid open), `victory-bounce` (win/done emoji), `item-pop-in` (reward box), `streak-bounce` (Shop streak feedback), `hatch-glow` (creature reveal golden drop-shadow), `modal-pop` (creature detail card), `answer-correct-glow` (correct choice ring). `.catalog-item:hover` lift + shadow; `.choice-btn.correct` enhanced with dual animation. `@media(prefers-reduced-motion:reduce)` block disables all decorative animations.
- `src/components/Home.jsx` — adventure card gets `rec-card-float` (default) or `rec-card-battle` (challenger); Surprise card gets `rec-card-surprise`; subject grid gets `subjects-slide-in` on open.
- `src/components/BattleScreen.jsx` — win emoji: `victory-bounce`; reward box: `item-pop-in`; special-move correct feedback emoji: `victory-bounce`.
- `src/components/HatchOverlay.jsx` — creature emoji at done phase: `hatch-reveal-glow`.
- `src/games/GameShop.jsx` — done screen emoji: `victory-bounce`; streak feedback: `streak-win` (streak-bounce); `streak: true` flag added to streak feedback state.
- Build: ✅ zero errors. Commit: b5ff1a5.

## 2026-06-04 — Audio polish and louder phonics

- `src/lib/audio.js` — 9 new tones added to `playTone()`: `tap` (warm pop), `open` (2-note upward chirp), `unlock` (4-note ascending jingle), `item` (sparkle arpeggio), `eggReady` (3-note glowing pulse), `reveal` (5-note sweep + sine), `start` (energetic burst), `complete` (4-note mission jingle), `cardOpen` (2-note soft pop). Phonics GainNode boosted from 2.5 → 4.0.
- `src/components/Home.jsx` — `playTone('tap')` on Continue Adventure + Surprise Event tap. `playTone('open'/'click')` on subject grid toggle. `playTone('eggReady')` fires once when `state.readyToHatch` transitions true.
- `src/components/Collection.jsx` — `playTone('cardOpen')` on creature card tap; `playTone('click')` on popup close.
- `src/components/HatchOverlay.jsx` — `playTone('reveal')` + staggered `fanfare` (350ms) at creature reveal (`done` phase).
- `src/components/BattleScreen.jsx` — `playTone('item')` fires 950ms after win (reward popup timing). Added `playTone` import.
- `src/games/GameShop.jsx` — `playTone('complete')` at ≥80% pass (was silent); ≥90% keeps `fanfare`.
- `src/games/GamePhonics.jsx` / `GameMath.jsx` / `GameThai.jsx` — `playTone('unlock')` on level unlock; `playTone('complete')` on pass (80–89%).
- Build: ✅ zero errors. Commit: 78a6ddd.

## 2026-06-04 — Battle learning special move

- `src/components/BattleScreen.jsx` — New question phase before each battle. `pickBattleQuestion(sessionLog)` selects subject from most-played recent sessions (safest readiness signal); falls back to simple Math (1+1→4+4) when no data. Question UI: full-screen dark overlay, 4 large tap-target buttons, skip link. Correct answer → `specialDmgRef` = 25% of enemy HP; 900ms "🔥 ท่าพิเศษพร้อมแล้ว!" feedback; `setPhase('fighting')`. Wrong/skip → 700ms "💪 สู้ต่อไปนะ!" feedback; battle starts normally. Special attack plays at battle start: ⚡ text + new 5-note ascending 'special' SFX + hit flash + gold damage float. Enemy HP re-simulated from reduced starting value so win condition is correct. Also fixed ATK/DEF advice text mismatch (was: Thai→ATK, Math→DEF; now: Math→ATK, Thai→DEF to match calcCreatureStats formula).
- Build: ✅ zero errors.

## 2026-06-04 — Battle balance and sound

- `src/config/gameConfig.js` — All AI_OPPONENTS HP scaled ×4 (regular/miniboss) and ×3.5 (boss); all ATK scaled ×2.5. Battles now last 6–15 turns instead of 2–4.
- `src/components/BattleScreen.jsx` — Imported `getSoundOn`/`getACtx` from audio.js. `playBattleSound` now respects sound toggle and reuses shared AudioContext. Added `attack` sound type (sword-swing whoosh). Improved `hit` (3-layer impact), `crit` (4-tone ascending), `win` (6-note fanfare), `lose` (gentler 4-tone descent). `attack` sound fires when attack text is shown; `hit` fires on flash.
- Build: ✅ zero errors.

## 2026-06-04 — Battle Home experience

- `src/components/BottomNav.jsx` — ⚔️ badge removed from Collection tab. `hasChallenger` and `useAppState` import removed.
- `src/App.jsx` — `challengerOpen` state added; useEffect watches `state.pendingChallenger`; `<ChallengerOverlay open={challengerOpen} onClose=.../>` and `<Home onOpenChallenger=.../>` wired.
- `src/components/ChallengerOverlay.jsx` — internal `visible` useState and its useEffect removed; now accepts `open`/`onClose` props. All `setVisible(false)` replaced with `onClose()`.
- `src/components/Home.jsx` — `onOpenChallenger` prop added. Battle case in `getRecommendation()` (priority: hatch → battle → shop → subject). Battle card: dark gradient, challenger emoji, "มอนสเตอร์ปรากฏตัว!". `handleRecommendedAction` calls `onOpenChallenger()` for battle type.
- `docs/CURRENT_STATE.md` — Home 2.0 Adventure Director entry updated.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Shop Mission speech feedback

- `src/games/GameShop.jsx` — speech added after correct answers. Import: `speakTh, speakEn` from audio.js. `THAI_NUMS` array added (หนึ่ง–สิบ). After correct: Thai questions → `speakTh(val)` after 380ms; English → `speakEn(val)` after 380ms; Math/counting → `speakTh(THAI_NUMS[val])` after 380ms. Social phrase question speaks the child's actual choice (ขอบคุณครับ or ขอบคุณค่ะ). All tones preserved. Sound toggle respected.
- `docs/research/progression/gameplay-loop.md` — "Learning Feedback Principles" section added: visual/sound/speech pattern, implementation status per game, what to avoid.
- `docs/GPT_NOTES.md` — Learning Feedback Principles section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Home UI simplification

- `src/components/Home.jsx` — subject section made collapsible: "หรือเลือกเรียน" static label replaced with "อยากเลือกเอง?" toggle button (`subjectsOpen` useState, default false); subject cards hidden until toggled. Shop Mission permanent card removed from Home (Shop still reachable via Continue Adventure recommendation when shopV1.runs === 0). Visual hierarchy: Egg → Continue Adventure → "อยากเลือกเอง?" → Egg Run → Surprise.
- `docs/CURRENT_STATE.md` — Home 2.0 and Shop Mission entries updated to reflect new state.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Observation philosophy documentation

- `docs/research/observation/observation-philosophy.md` — created. Source-of-truth for observation philosophy: observe→understand→design loop, children are not their level (behavior > history), positive interpretation table, important signals (accuracy/replay/completion/consistency), signals that must not dominate (speed/streaks/rankings), Subject Readiness as observations not labels, parent report philosophy (no anxiety/grades/rankings), mission follows child (deterministic design iteration not AI), explicit non-goals (no AI tutoring/adaptive engines/manipulation/addiction optimization), system relationships, implementation reference, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Observation section added with entries for both observation-philosophy.md and play-observation-system.md.
- `docs/GPT_NOTES.md` — Observation Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Gameplay loop documentation

- `docs/research/progression/gameplay-loop.md` — created. Highest-level philosophy document for KidQuest. Covers: Home as Adventure Director (not a menu), core loop (learn→battle→learn), replay philosophy (healthy/full XP), surprise philosophy (rare=special, daily date-hash rotation), minigame philosophy (rewards not primary game), intrinsic motivation (curiosity/collection/surprise/progress/mastery), child autonomy (suggest not force), explicit non-goals (no daily chores/energy systems/FOMO/competition), system relationships (subordinate docs listed), 5 open questions.
- `docs/RESEARCH_INDEX.md` — gameplay-loop.md entry added, marked as highest-level philosophy.
- `docs/GPT_NOTES.md` — Gameplay Loop Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Battle progression documentation

- `docs/research/battle/battle-progression.md` — created. Source-of-truth for battle progression philosophy: core loop (Learn→Battle→Learn), battle as reward not primary game, creature philosophy (every creature usable), gentle enemy scaling, Challenger every 15 rounds, loss philosophy (no permanent penalties), reward design (supports learning), self-directed frequency, explicit non-goals (no PvP/leaderboards/pay-to-win/gacha/energy), future features (evolution/equipment/rarity/bosses), system relationships, known BattleScreen text bug, 5 open design questions.
- `docs/RESEARCH_INDEX.md` — battle-progression.md entry added to Battle section.
- `docs/GPT_NOTES.md` — Battle Progression Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Subject progression documentation

- `docs/research/progression/subject-progression.md` — created. Source-of-truth for subject progression philosophy: core philosophy (subjects primary, missions secondary), progression flow, unlock thresholds (70/80/90%), replay always valid with full XP, mastery = confidence not perfection, stretch/challenge optional bonus layers, subject independence, readiness vs. highest unlock level, explicit non-goals, future grade roadmap, implementation reference, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Progression section added.
- `docs/GPT_NOTES.md` — Subject Progression Philosophy section added (thresholds, replay, mastery, independence, open questions for GPT).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Creature stats documentation

- `docs/research/battle/creature-stats.md` — created. Source-of-truth for creature stat design philosophy: why one-subject-one-stat fails, weighted formula with 40% base floor, example weightings (HP/ATK/DEF/SPD/CRIT), personality variation (±10% deterministic from XP seed), migration rules (recalc on 0/NaN, never delete eggs), explicit non-goals, future scaling notes, 5 open implementation questions.
- `docs/RESEARCH_INDEX.md` — Battle section added.
- `docs/GPT_NOTES.md` — Creature Stat Design Philosophy section added (key decisions + open questions for implementation).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Egg economy documentation

- `docs/research/rewards/egg-economy.md` — created. Source-of-truth for egg progression mechanics: core loop, design philosophy (first egg fast / no FOMO / no streak pressure), scaling formula (`min(800, 120+n×60)`), progression table, stage system, XP sources, migration rules, implementation reference, open questions, future considerations.
- `docs/RESEARCH_INDEX.md` — Rewards & Economy section added.
- `docs/GPT_NOTES.md` — Egg Economy Decisions section added (pacing formula, creature stat decisions, open question for GPT re: onboarding threshold).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Egg pacing + creature stat rebalance

### Part 1 — Egg progression pacing
- `src/context/StateContext.jsx` — `scaledEggProgress(state)` helper added (module-level). Computes `required = min(800, 120 + hatchedEggs.length * 60)`, divides into 7 stages dynamically, returns `{stage, stageXP, pct, xpPerStage, required}`. `ADD_XP` reducer: replaced static `newStage`-based `readyToHatch` with `newTotal >= hatchRequired` (dynamic). `derived` useMemo: `eggProgressData` now uses `scaledEggProgress()`; `eggStatsData.stage` overridden to scaled stage so `drawEgg()` visual matches progress display. `state.hatchedEggs` added to useMemo deps.
- `src/components/Home.jsx` — destructures `xpPerStage` from `eggProgressData`; egg XP label updated: shows "เกือบฟักแล้ว!" in stage 6 before ready, uses dynamic `xpPerStage` denominator instead of hardcoded 50.

### Part 2 — Creature battle stat rebalance
- `src/config/gameConfig.js` — `calcCreatureStats()` rewritten with weighted formula. Old: ATK=base×thaiShare (exclusive ownership — ATK=0 if no Thai XP). New: every stat has 40% base guarantee + 60% subject-weighted. HP: 1.5+0.3t+0.1m+0.1e; ATK: 0.4+0.3m+0.2e+0.1t; DEF: 0.4+0.3t+0.2m+0.1e; SPD: 0.4+0.3e+0.2m+0.1t. Deterministic ±5% personality variation from XP seed. Minimum possible any stat = base × 0.5 (Thai-only learner) — no more 0 stats.
- `src/lib/state.js` — `_migrateEggs()` updated: recalculates stats if any of ATK/DEF/SPD is 0 or NaN (covers pre-rebalance eggs with broken stats).
- Build: ✅ zero errors.

## 2026-06-04 — Shop feedback + hatch overlay fix

- `src/games/GameShop.jsx` — feedback improvements:
  - `wrongChoice` state added; `.wrong` CSS class (shake animation) applied to the wrong button on incorrect answer. Cleared on correct / next / replay.
  - `STREAK_MSGS` array added; when streak ≥ 3 feedback message uses fire messages instead of generic correct msg.
  - Streak counter in header styled amber bold at ≥ 3 (was muted/small).
  - Wrong feedback text changed from "ไม่ถูก ลองอีกครั้ง! 🤔" to "ลองอีกครั้ง! 💪"; reveal message now friendlier: `คำตอบที่ถูกคือ "${q.answer}" 😊`.
  - All existing `playTone` calls unchanged.
- `src/components/HatchOverlay.jsx` — two bug fixes:
  - **Freeze fix**: `setPhase('tapping')` called as first line of `handleClose()`. After dispatch+navigate, `isOpen` is `false` and `phase` is `'tapping'` → condition `!isOpen && phase === 'tapping'` is true → overlay unmounts cleanly. No more frozen screen requiring refresh.
  - **Mid-game interruption fix**: `suppressAutoOpen` prop (default false). When `true`, `isOpen` ignores `readyToHatch && !hatched` auto-trigger. Only explicit `state.hatching` (user-initiated) can open overlay.
- `src/App.jsx` — passes `suppressAutoOpen={screen === 'game'}` to `HatchOverlay`. During gameplay, hatch overlay won't auto-interrupt. After returning to home, `readyToHatch` is still true → overlay appears normally.
- Build: ✅ zero errors.

## 2026-06-04 — Home 2.0: Adventure Director + NaN bug fixes

- `src/components/Home.jsx` — rewritten as Adventure Director.
  - **`⭐ ผจญภัยต่อ`** section: single large recommended card above the world grid. Deterministic priority: (1) hatch if egg ready, (2) Shop if never played, (3) weakest subject by XP. No AI, no state.
  - **`🎁 เซอร์ไพรส์วันนี้`** section: replaces the 2×2 minigame grid. One unlocked minigame shown per day (date-hash mod count of unlocked games). After playing, shows "เล่นแล้ว! มาพรุ่งนี้นะ 🌙" (derived from `sessionLog`, no new state). If no minigames unlocked yet, shows a teaser card.
  - World-label text changed to "หรือเลือกเรียน" (secondary framing).
  - `getRecommendation()` and `getSurpriseEvent()` helper functions added (module-level, no hooks).
- `src/components/Report.jsx` — **NaN bug fixes** in `MissionAnalytics`:
  - `totalHints = 0`, `totalDuration = 0` default values added to destructuring (handles pre-Phase-D state with no analytics fields).
  - `avgScore` now returns `null` when `totalQs === 0` (renders as `—` not `0%`).
  - `avgDur` now returns `null` when `totalDuration === 0` (renders as `—` not `NaN`).
  - `nudge` guard updated: `avgScore !== null && avgScore >= 90`.
- Build: ✅ zero errors.

## 2026-06-04 — Subject Readiness Report display

- `src/components/Report.jsx` — `computeReadiness(sessionLog, world)` added: filters last 10 `sessionLog` entries per world, derives one of 4 states (strong / comfortable / exploring / notready) from avgScore + goodRuns + completionRate thresholds. `SubjectReadiness` component renders a card with color-coded Thai-language badges for ภาษาไทย / คณิต / อังกฤษ. Observation footnote: "ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก". No new state fields.
- Build: ✅ zero errors.

## 2026-06-03 — Subject Readiness Design (docs only)

- `docs/research/observation/play-observation-system.md` — **Subject Readiness** section added: 4 readiness states (Strong / Comfortable / Exploring / Not Ready), derivation logic (last 10 sessions, avgScore ≥ 0.85 + goodRuns ≥ 3 + completionRate ≥ 0.80 for Strong; avgScore ≥ 0.70 + goodRuns ≥ 2 for Comfortable; else Exploring; no sessions = Not Ready), explicit non-goals (no AI, no gate, no child UI, no level tree), phase status section updated to mark Phase D shipped and describe Phase D+ scope.
- `docs/research/observation/play-observation-system.md` — Peer Comparison section updated: marked as ✅ done (replaced in Phase D).
- `docs/research/missions/mission-system.md` — **Subject Readiness and Mission Design** section added: explains why highest unlocked level is unreliable, defines mission content weighting from readiness profile, example profiles (Thai Strong / Math Comfortable / English Exploring → Thai 60% / Math 30% / English 10%), when to apply per mission phase, core principle "Mission should follow the child."
- `docs/GPT_NOTES.md` — Subject Readiness Decisions section added: 9 decisions covering derivation, mission weighting, Shop Stretch independence, Cooking Mission dependency, implementation timing.
- `docs/TASKS.md` — Phase D+ Subject Readiness documentation marked done; Cooking Mission task updated with readiness dependency warning; Subject Readiness Report display added as deferred task.
- No app code changed.

## 2026-06-03 — Phase D: Play Observation System

- `src/lib/state.js` — `sessionLog: []` added to `defaultState()`; `shopV1` extended with `totalHints: 0`, `totalDuration: 0`, `phaseStats: { 1–4 }`.
- `src/context/StateContext.jsx` — `LOG_SESSION` action + reducer (appends to ring buffer, computes `replayedImmediately`); `UPDATE_SHOP_V1` extended to accumulate `hints`, `dur`, `phaseStats` per run.
- `src/games/GameShop.jsx` — `sessionStart` + `perQCorrect` refs added; per-question correctness tracked; `LOG_SESSION` + extended `UPDATE_SHOP_V1` payload dispatched on done screen; `replay()` resets refs.
- `src/games/GameThai.jsx` — `useFinishRound` extended with `sessionStartRef` param; dispatches `LOG_SESSION` after each subject round; `sessionStart` refs added to ThaiMatchGame, ThaiSpellGame, ThaiWordOrderGame with reset on replay.
- `src/games/GameMath.jsx` — `sessionStart` ref added to `MathLevelGame`; `LOG_SESSION` dispatched in `next()` when done; replay resets ref.
- `src/games/GamePhonics.jsx` — `useRef` import added; `sessionStart` refs added to all 4 game components (PhonicsGame, CVCGame, SightGame, SentenceGame); `LOG_SESSION` dispatched in each `next()` when done; replay resets refs.
- `src/components/Report.jsx` — `MissionAnalytics` component added (runs, avg score, avg duration, hints, phase difficulty table, replay framing, deterministic nudge); peer-comparison card replaced with play-history timeline (last 10 sessions).
- Build: ✅ zero errors.

## 2026-06-03 — Workflow Audit + Architecture Language Patch (docs only)

- `docs/GPT_NOTES.md` — fixed two present-tense statements that implied `MissionScreen.jsx` + `missionConfig.js` are current architecture. Both are future targets (after 2+ missions). Current routing clarified: Home → `GameScreen.jsx` → `GameShop.jsx` (world `'shop'`).
- `docs/research/missions/mission-system.md` — Mission Access Points navigation section updated: current implementation (GameShop.jsx) vs. future target (MissionScreen.jsx) now clearly separated.
- `docs/TASKS.md` — Phase C app code commit added as critical Now task. Development workflow documented (build → commit → push → verify).
- `docs/GPT_HANDOFF.md` — session updated; Phase C uncommitted code flagged as risk; workflow gap noted.
- **Critical finding**: Phase C app code (`GameShop.jsx`, `Home.jsx`, `StateContext.jsx`, `GameScreen.jsx`, `state.js`) is uncommitted. Production is on Phase 3. Must commit + push before play testing.
- No app code changed this session.

## 2026-06-03 — Phase D Wording Patch: Observation Language + Engagement Signals (docs only)

- `docs/research/observation/play-observation-system.md` — final wording improvements before implementation: `passed` → `completed`; `hardestPhase` → `challengePhase`; "most difficult phase" → "current challenge area"; `replayedImmediately` and `nextAction` added to session entry schema; new **Engagement Signals** section (explains why engagement signals outweigh scores, documents `replayedImmediately`, `nextAction`, replay count, and session duration); nudge rule updated to `runs === 1 && completed`; nudge condition updated to `challengePhaseAcc`; "pass/fail icon" in play history renamed to "completed/not completed".
- `docs/GPT_NOTES.md` — terminology decisions section added; engagement signal rationale recorded; D0 noted in Phase D scope.
- `docs/TASKS.md` — D0 (Shop card UX audit) added before D1 in Phase D list.
- No app code changed.

## 2026-06-03 — Phase D Design: Play Observation System (docs only)

- `docs/research/observation/play-observation-system.md` — NEW: full design spec for lightweight passive play observation system. Covers: session log ring buffer (last 50 entries), `shopV1` state extensions (`totalHints`, `totalDuration`, `phaseStats`), new `LOG_SESSION` reducer action, parent report Mission Analytics card design, deterministic nudge rules, replay framing principles, explicit non-goals (no AI, no peer comparison, no child-facing UI).
- `docs/GPT_NOTES.md` — Play Observation System decisions added (nudge rules, ring buffer cap, no-speed-gate, peer-comparison card replacement).
- `docs/TASKS.md` — Phase D (D1–D4) and Phase E tasks structured under Next.
- `docs/GPT_HANDOFF.md` — Updated: latest session, active tasks, recommended next GPT work.
- No app code changed.

## 2026-06-03 — Phase D Prep: Shop Mission Terminology Sync (docs only)

- `docs/research/missions/shop-mission.md` — "4 steps" → "4 phases / 6 questions"; steps renamed to phases; Phase 1 annotated ×3, phases 2–4 annotated ×1; "Why 4 Core Steps" section retitled and updated.
- `docs/research/missions/mission-system.md` — example step list replaced with actual 4-phase/6-question breakdown.
- `docs/CURRENT_STATE.md`, `docs/GPT_HANDOFF.md`, `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md` — all updated to use "4 phases / 6 questions" terminology consistently.
- No app code changed.

## 2026-06-03 — Phase C: Shop Mission MVP

- `src/games/GameShop.jsx` — NEW: 4 phases / 6 questions (Phase 1: Thai matching ×3, Phase 2: English vocab ×1, Phase 3: counting ×1, Phase 4: social phrase ×1). 4 choices per question. Accepts both ขอบคุณครับ/ค่ะ for social phrase. XP dispatched per subject. Done screen with pass/fail at 80% threshold.
- `src/lib/state.js` — `shopV1: { bestScore, runs, mastered, stretchUnlocked }` added to `defaultState()`.
- `src/context/StateContext.jsx` — `UPDATE_SHOP_V1` action + reducer case: tracks bestScore, runs, mastered (≥90% + ≤1 wrong + ≥2 runs). stretchUnlocked always false for MVP.
- `src/games/GameScreen.jsx` — lazy-imports `GameShop`, adds `shop` world to `WORLD_TITLES`.
- `src/components/Home.jsx` — Missions section added above Egg Run. Shop card shows best score and run count after first play. Always unlocked.

## 2026-06-03 — Phase B+ Mastery-Gate Patch: mastery signal tightened, Stretch content confirmed
- `mission-system.md`: Mastery signal simplified to 3 hard criteria — accuracy ≥ 90%, ≤ 1 wrong, ≥ 2 runs. Removed "hint dependency" from hard criteria (not tracked yet; can be added later). Speed re-clarified as optional context only, never a gate.
- `shop-mission.md`: Shop Stretch section updated with explicit unlock trigger listing the 3 criteria. "Why 4 steps" section rewritten — quantity difference and price concept named as Stretch, Core MVP steps stated inline.
- `GPT_NOTES.md`: Product Decisions — mastery signal now 3 explicit criteria; Shop Core/Stretch split named explicitly.
- `TASKS.md`: Mastery signal note updated — speed NOT required.
- No app code changed.

## 2026-06-03 — Phase B Review Patch: Mission MVP scope tightened
- `shop-mission.md`: MVP reduced 6 → 4 steps. Price/money and quantity-difference steps moved to Later Expansion (Early Grade 1 stretch) — not deleted.
- `mission-system.md`: Unlock threshold 70% → 80% (aligned with subject levels; 70% guessable on 4 questions). Engine philosophy updated: start with `GameShop.jsx`, delay generic `MissionScreen.jsx` until pattern validated.
- `GPT_NOTES.md`: Architecture suggestions updated to staged approach; threshold and step count corrected.
- `TASKS.md`: Now task updated — 4-step MVP, GameShop.jsx first, no missionConfig/MissionScreen yet.
- No app code changed.

## 2026-06-03 — Mission System Design Review & Patch
- Confirmed existing mission docs (README, mission-system, shop, cooking, garden) are complete.
- Added "Explicit Non-Goals" section to `mission-system.md`: no payment, no multiplayer, no social features, no Grade 2+, no AI tutor, no unique mini-games.
- No other changes needed — TASKS, GPT_NOTES, RESEARCH_INDEX already up to date.

## 2026-06-03 — Mission System Design (documentation only)
- Created `docs/research/missions/` with 5 files: README, mission-system, shop-mission, cooking-mission, garden-mission.
- Mission system: 3 types (Progression/Review/Challenge), reuses all existing mechanics, data-driven via `missionConfig.js`, thin `MissionScreen.jsx` wrapper.
- Shop mission MVP: 6 steps, Kindergarten core + Grade 1 stretch, integrates Thai/Math/English/GK. Full data structure specified.
- Cooking and garden missions: design only — not for implementation until shop is confirmed working.
- Updated `GPT_NOTES.md`, `TASKS.md`, `RESEARCH_INDEX.md`, `SESSION_SUMMARY.md`.
- No app code changed.

## 2026-06-03 — Vision + Scope Documentation
- Created `PROJECT.md` — one-page project brief (what, who, golden rule, success metric).
- Created `VISION.md` — full design philosophy: golden rule, mastery progression, Year 1 scope, stable engine, content strategy, replay philosophy, non-goals, scope guardian mandate.
- Created `GOALS.md` — Year 1 goals, non-goals, long-term goals, definition of done.
- Created `docs/README.md` — navigation index for all docs by audience role.
- Updated `docs/DECISIONS.md` — added mastery-based progression, Golden Rule, replay philosophy, scope guardian decisions under Product and AI sections.
- Updated `CLAUDE.md` — scope guardian check added to Before Coding section.
- Updated `docs/ARCHITECTURE.md` — stable engine note replaces stale React migration note.
- Updated `SPEC.md` — deprecated header updated to canonical format.
- Updated `docs/GPT_HANDOFF.md` — vision section added; recommended next work updated to Year 1 scope.

## 2026-06-03 — Phase 3: AI_OPPONENTS Tiers 2–5
- `gameConfig.js`: Added tiers 2–5 to `AI_OPPONENTS`. Stats scale ~1.5× per tier. Sonic villain theme continues:
  - T2 ป.3-4: Coconuts/Octus/Rexon → Egg Robo → Dr. Eggman III
  - T3 ป.5-6: Rhino-Bot/Slicer/Jawz → Heavy Gunner → Dr. Eggman IV
  - T4 ม.ต้น: GUN Mech/E-101 Beta/Dark Chao → Egg Emperor → Dr. Eggman V
  - T5 ม.ปลาย: Metal Sonic/Shadow Android/Silver Gladiator → Mephiles → PERFECT CHAOS
- `StateContext.jsx`: Fixed challenger grade→tier mapping (`Math.min(grade,1)` → proper mapping: 0→0, 1-2→1, 3-4→2, 5-6→3).

## 2026-06-03 — Phase 2 UX (Sound Persist + XP Boost Indicator)
- **Sound persistence**: `App.jsx` initializes `soundOn` from `localStorage.getItem('kq_sound')`; all toggle callbacks write `kq_sound` on change. Device-local key, separate from `kq_state` blob.
- **XP boost badge**: new `XpBoostBadge` component in `Home.jsx` — shows amber `⭐ ×2 M:SS` countdown in header when `xpBoostEnd > now` and `xpBoost > 1`; hides automatically when boost expires; 1-second interval via `useRef`.

## 2026-06-03 — Phase 1 UX Readiness
- **Replaced `alert()`** in `Home.jsx` with `showToast()` calls — EggRun lock and no-lives both show friendly toast messages; minigame dead-guard removed.
- **New `ProfileModal.jsx`**: name input + grade grid (อนุบาล–ป.6); saves via `SET_PROFILE` action; persisted to localStorage + Supabase automatically.
- **Profile button** (👤 + child name) added to Home header — always visible, opens ProfileModal.
- **`SET_PROFILE` action** added to `StateContext.jsx` + reducer case.
- `App.jsx`: ProfileModal mounted alongside LoginModal; `onOpenProfile` prop wired to Home.

## 2026-06-03 — Docs Sync (Current State Audit)
- `CURRENT_STATE.md` updated: Math level count corrected (6 → 9), visual models added, tier system detailed, minigame unlock conditions expanded, Vercel/phonics audio noted accurately.
- `TASKS.md` restructured: consolidated Done list, added visual models + tiers + AI_OPPONENTS entries, removed duplicate items, added Math L9+ and English L5+ to Later.
- `GPT_HANDOFF.md` regenerated to reflect latest codebase state.
- No app code changed.

## 2026-06-03 — Math Visual Models for L1–L4
- `gameConfig.js`: added `visualModel` field to math levels 1–4 (`objects`, `objects`, `tenFrame`, `crossOut`).
- `GameMath.jsx`: `genQ` numeric branch now attaches `visualModel`, `emojiA`, `emojiB` to question object.
- New `VisualModel` component with 4 modes:
  - `objects`: real emoji grid (emojiA×a + emojiB×b) with `+` separator; smaller font when total > 10.
  - `tenFrame`: 2×5 or 4×5 coloured grid (amber=a, blue=b, grey=empty); fallback dots if total > 20.
  - `crossOut`: emoji grid with ❌ overlay on the last `b` items (subtraction visualisation).
  - `null` (L5+): unchanged coloured 🟡/🔵 dots.

## 2026-06-03 — Math Content Expansion + New Question Types
- `MATH_WORDS` expanded from 16 → 30: added joining, taking-away, and 10 comparison problems (`comparison:true`).
- `PATTERN_SETS` added to `gameConfig.js` (5 AB emoji pairs; ABC reserved for L9).
- `LEVELS.math` expanded: Level 0 (Foundation/count), Level 7 (เปรียบเทียบ), Level 8 (รูปแบบ AB).
- `TEACH_CONTENT.math` entries added for keys 0, 7, 8.
- `GameMath.jsx`: new `count` and `pattern` question types; foundation mode (grade-0 only, no timer); maxLevels `6→8`; amber hint highlight for patterns at attempt 1.
- `LevelSelector.jsx`: optional `levelsOverride` prop added.
- `StateContext.jsx`: `FOUNDATION_COMPLETE` action added.
- `state.js`: `foundationComplete: false` added to `defaultState()`.

## 2026-06-03 — SPEC.md Formally Deprecated (Session 6)
- Added deprecation header to `SPEC.md` with documentation precedence order.
- Updated `DECISIONS.md` — SPEC.md deprecated note under Architecture Decisions.
- Updated `AI_SYSTEMS.md` — SPEC.md historical-only note added.
- Risk of conflicting documentation between old prototype and current React app eliminated.
- No app code changed.

## 2026-06-03 — Research System + Review Workflow (Session 5)
- Created `docs/research/` with 7 subject subfolders (thai, math, english, logic, life, curriculum, competitors).
- Created `docs/POST_REVIEW.md` — Claude Chatbot post-implementation review.
- Created `docs/RESEARCH_INDEX.md` — index of all research documents.
- Updated `AI_SYSTEMS.md` — post-review flow and research/ added.
- Updated `CLAUDE.md` — POST_REVIEW.md added to after-coding checklist.
- No app code changed.

## 2026-06-03 — AI System Overview (Session 4)
- Created `docs/AI_SYSTEMS.md` — defines 3-AI collaboration model (GPT / Claude Chatbot / Claude Code).
- Updated `CLAUDE.md`, `DECISIONS.md`, `GPT_HANDOFF.md` to reference the system.
- No app code changed.

## 2026-06-03 — Auto Sync Upgrade (Session 3)
- Created `docs/GPT_NOTES.md` — shared memory for GPT → Claude knowledge transfer.
- Created `docs/GPT_HANDOFF.md` — single-file Claude → GPT handoff, regenerated each session.
- Updated `CLAUDE.md` — added GPT_NOTES/GPT_HANDOFF to pre/post-session workflow.
- Restructured `TASKS.md` to Now / Next / Later / Done format.
- Added AI Sync section to `DECISIONS.md`.
- No app code changed.

## 2026-06-03 — Docs Verified + Trimmed (Session 2)
- Verified all docs against real codebase; no feature inaccuracies found.
- Fixed stale `gameConfig.js` line count (354 → 346) in PROJECT_MAP and CODEBASE_SUMMARY.
- Trimmed all docs to meet token limits (CURRENT_STATE ≤120, PROJECT_MAP ≤120, CODEBASE_SUMMARY ≤150, SESSION_SUMMARY ≤30).
- TASKS.md: moved Session 1 doc task to Done; condensed Done list.

## 2026-06-03 — Project Memory System Initialized
- Project memory / documentation system created (`docs/` folder).
- Existing project state documented from codebase inspection.

## 2026-06-03 — Bug Fixes & UI Consistency
- **Fix**: English `SightGame` (Level 3) was missing `UNLOCK_LEVEL` dispatch — completing Level 3 with ≥80% never unlocked Level 4. Fixed.
- **Fix**: English `CVCGame` (Level 2) was missing `spawnConfetti(15)` on level unlock. Fixed.
- **Add**: `GameHeader` (progress bar + streak display) added to all 4 English Phonics game modes (was missing; Thai already had it).
- **Add**: "Play Again" button added to GameMath result screen (only had "← Level อื่น" before).
- **Add**: Fanfare + confetti on 90%+ score added consistently to all Math and English levels.
- **Remove**: Dead code — `TH_L4` fill-in-blank data removed from `gameConfig.js` (was orphaned after Thai Level 5 changed to word-order game).

## 2026-06-03 — Content Expansion (All Subjects)
- Thai `SPELL_L1`: 12 → 24 words (สระ อา/อิ/อู/เ/โ).
- Thai `TH_L2` (animals): 12 → 20 words.
- Thai `TH_L3` (3-syllable): 8 → 14 words.
- Thai `TH_L5`: NEW word-order game data (9 sentences). Level 5 changed from fill-in-blank → `ThaiWordOrderGame`.
- Thai Level 4 renamed to "คำ 3 พยางค์".
- Hint system added to `ThaiSpellGame`: after 1 mistake → amber pulse on next correct tile.
- Shared `ResultScreen` + `GameHeader` + `useFinishRound` hook in `GameThai.jsx`.
- Math `MATH_WORDS`: 8 → 16 word problems.
- English `CVC_WORDS`: 10 → 24 words with sound-alike distractors.
- English `SIGHT_DATA`: 8 → 16 fill-in-blank sentences.
- English `ENG_SENTS`: 8 → 12 word-ordering sentences.

## 2026-06-03 — Hosting Migration
- Migrated from Netlify to Vercel. Added `vercel.json`.

## 2026-06-03 — Audio Optimization
- Moved phonics audio from base64 embedded in JS bundle → static `.m4a` files in `public/sounds/phonics/`.

## Earlier — Challenger System + Battle Animation
- Added Pokémon-style battle animation (`BattleScreen.jsx`).
- Added Challenger system: every 15 battle rounds → random AI opponent (`AI_OPPONENTS` config).
- Added `ChallengerOverlay.jsx` for full-screen challenger announcement.

## Earlier — Battle System + Egg Migration
- Added turn-based battle system with HP/ATK/DEF/SPD/CRIT stats.
- Added egg migration (`_migrateEggs`) to backfill `tier` and `stats` fields on old hatched eggs.

## Earlier — Tier System + Creature Stats + AI Opponents
- Added `TIERS` config (0=อนุบาล through 5=ม.ปลาย).
- Added `calcCreatureStats()` for derived battle stats.
- Added `AI_OPPONENTS` config for tier 0 and tier 1.

## Earlier — React Migration
- Migrated from single-file HTML prototype (~600KB) to React 18 + Vite.
- Supabase auth and state sync implemented.
- All game screens, minigames, and UI rebuilt as React components.

## 2026-06-12 — World Map HUD
- `WorldScreen.jsx`: New `WorldHUD` component replaces plain top bar. Sections: 3×3 mini-map (screen colors from SCREEN_THEMES, discovered/undiscovered/current states), creature status (name + level + HP bar + HP numbers), XP bar (Lv.N + gold progress), battle items (5 PixelItemIcon at 13px with count badges). Home button replaced with compact ⌂ symbol.
- Camera `camY` offset adjusted by `−HUD_CONTENT_H/2` so the player avatar centers in the visible play area below the HUD.
- Added `SCREEN_THEMES` and `PixelItemIcon` imports; removed unused `screenLabel` const.

## 2026-06-16 — feat: 6-element pixel art creatures + auto creature names

### Pixel Art Creature Renderer (`creatureAlgorithm.js`)
- Old procedural HSL renderer (circles/ellipses/bezier curves) replaced with pixel-art grid renderer
- 12×12 grid at P = `floor(min(canvas.width, canvas.height) / 12)` px per unit, centered in canvas
- Dark `#0a0a12` background behind all sprites
- 6 elements with distinct palettes and pixel patterns:
  - **fire** (ฟุระ/เปลวไฟ/ราชันเพลิง): red/orange, mane sides, flame tail, blush cheeks
  - **water** (อาควา/กระแส/ไทดัน): blue, flat fin ears, fin sides, droplet tail
  - **thunder** (ซาปิ/สายฟ้า/โวลเทน): yellow/gold, spike ears, spark sides, zigzag tail
  - **nature** (ลีฟู/ป่าลึก/ซิลวาน): green, tall leaf ears, vine sides, leaf tail
  - **shadow** (นิกซ์/เงามืด/อัมบรา): purple, long wispy ears, dark aura sides, shadow tail
  - **light** (ลูมิ/แสงทอง/ออโรร่า): warm gold, halo ears, glow sides, star tail
- 3 stages:
  - **baby**: 6-unit-wide head/body, element-specific ears/sides/tail
  - **teen**: 8-unit-wide body, shoulder pads in accent, taller ears, element accessories
  - **final**: wide head + full-width armored body, crown/helmet, glowing eyes (shadow/fire), large tail

### Auto Creature Names
- `getCreatureName(element, evoStage)` exported from `creatureAlgorithm.js` — Thai species names per element × stage
- `getCreatureSeed(egg)` unchanged — backward-compatible with all existing callers

## 2026-06-16 — Audio fix: mobile resume + remove monster name TTS

### Mobile Audio (audio.js)
- Replaced single `touchstart` `{ once: true }` listener with paired `touchstart` + `click` listeners that pre-warm AudioContext from the user gesture (create if null, resume if suspended), then self-remove after first fire
- Added `if (!audioCtx || audioCtx.state === 'suspended') return` guard in `playBGM` — prevents silent WebAudio nodes from scheduling in a suspended context; BGM starts cleanly after first user interaction on iOS

### Monster Name TTS Removed (MoveSelectBattleMode.jsx)
- Removed "Enemy name announce on mount" useEffect (was `speakTh(enemy.name + ' ปรากฏตัว')` at 700ms)
- Removed `isFirstQuestionRef` and the 1800ms first-question delay (flat 500ms now)
- Question TTS (`speakTh`/`speakEn` for thai/eng/math) is unchanged

## 2026-06-16 — Home screen: large creature display + party bar

### Home.jsx
- Replaced 2×2 stat grid (ATK 169 / DEF 178 / SPD 160 / HP 504) with full creature display:
  - Creature name (large pixel font, gold)
  - Level badge (Lv.X)
  - 160×160 pixel-art canvas using `drawCreature` from `creatureAlgorithm.js`
  - Compact single-line stat row (ATK · DEF · SPD · HP, color-coded)
  - Canvas keyed by `activeEgg.id` so it remounts on party switch
- Replaced Party HP bars section with scrollable party portrait bar:
  - 56×56 pixel-art canvas per creature
  - Name + level label underneath each card
  - Active creature = gold `#EF9F27` border + glow
  - 1 creature → centered; multiple → horizontal scroll
  - Tap any card → `SET_ACTIVE_CREATURE` → switches large display
- `evoStage` merged into stats for both large canvas and party cards (teen/final stages now render)

## 2026-06-16 — Response time analytics for battle answers

### MoveSelectBattleMode.jsx
- `questionStartTime` ref: set to `Date.now()` when each new question appears (in TTS effect on `[cur, subject]`)
- `responseTimeRef`: captures elapsed ms in `handleTap` before animation, so timing is accurate to player tap
- `fireHit` (correct) and `fireMiss` (wrong) both dispatch `LOG_BATTLE_ANSWER` with subject/question/correct/responseTimeMs/timestamp

### StateContext.jsx
- New action `LOG_BATTLE_ANSWER` in ACTIONS
- Reducer maintains rolling 50-entry per-subject array in `state.responseTimeLogs.{thai,math,eng}` — each `{ timeMs, correct, timestamp }`

### state.js (defaultState)
- Added `responseTimeLogs: { thai:[], math:[], eng:[] }` — old saves get empty arrays, reducer handles missing keys gracefully

### Report.jsx
- New `ResponseSpeed` component: shows avg response time (last 10) and trend vs prior 10 per subject
- Hidden until ≥5 answers recorded per subject; appears after SubjectReadiness section
- Supabase persistence is automatic (responseTimeLogs included in state_json)
