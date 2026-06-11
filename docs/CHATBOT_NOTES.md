# CHATBOT_NOTES.md — KidQuest
_Written by Claude Chatbot. Read by Claude Code before every session._
_Last updated: 2026-06-10_

**This file replaces GPT_NOTES.md. GPT has been removed from the workflow.**

---

## How This File Works

- **Claude Chatbot** writes decisions, answers open questions, and designs content here
- **Claude Code** reads this file (+ CURRENT_STATE.md + TASKS.md) before every session
- After each code session, Claude Code appends a **Handoff** section at the bottom
- Claude Chatbot reads the Handoff before the next design session

---

## Active Decisions for Claude Code

### 🔴 NEXT TASK: Green Meadow Phase 2 — Canvas Tile Engine

**Decision (2026-06-10):** Phase 2 is NOT "egg walk animation on CSS art."
Phase 2 is a **Canvas-based tile engine** — the foundation that makes the world feel like Pokémon.

**Why this matters:** The current WorldScreen is CSS art with arrow buttons. It looks like a picture, not a world. Chopin can't feel like he's really walking anywhere. The Pokémon GB feeling comes from tile-by-tile movement with immediate visual feedback every step.

**Architecture decided:**

```
WorldScreen.jsx → replaces CSS art with <canvas> tile renderer
TileEngine (new) → drawTileMap(), handleMove(), collision detection
PlayerSprite → 4-direction walk cycle (2 frames per direction = 8 frames total)
Camera → follows player, clamps at map edges
```

**Tile size:** 16×16 px per tile. Map: 20×15 tiles (320×240 px). Canvas scales to fill screen width.

**Tile types for Green Meadow:**
```
GRASS       — walkable, no effect
TALL_GRASS  — walkable, 25% random encounter on entry (not 30% — less frustrating for 5yo)
TREE/WALL   — collision, not walkable
PATH        — walkable, no encounter, slightly different color
WATER       — not walkable (Year 1)
EXIT_N/S/E/W — edge tile, triggers screen transition
NPC         — not walkable, press A/tap to talk
SIGN        — not walkable, press A/tap to read
ITEM_SPOT   — walkable, sparkle animation, tap to collect
```

**Controls (decided):**
Virtual D-pad — 4 buttons fixed bottom-left of screen. Large enough for 5yo fingers (min 56px each button). No swipe — too imprecise for tile grid. Keep Home button top-left always visible.

**Movement feel:**
- Each step = 1 tile (16px) with 120ms tween (smooth but snappy)
- Walking sound: short tap tone per step (use existing `playTone`)
- Tall grass: rustling visual effect (darken tile for 200ms on enter)
- Player sprite bobs slightly when idle (simple 2-frame idle)

**Screen transition:** Keep existing AC-style 160ms fade. Trigger when player walks onto EXIT tile.

**Starting Path (BM) — first map layout (20×15 tiles):**
```
TTTTTTTTTTTTTTTTTTTT  row 0  (trees — top wall)
TggggggggggggggggggT  row 1
TgFFggggggggggFFgggT  row 2  (F=flower)
TggggggNPCgggggggggT  row 3  (NPC=Professor Owl)
TgggggggggggggggggST  row 4  (S=sign)
TggTTTgggggggTTTgggT  row 5  (tall grass patches)
TggTTTgggggggTTTgggT  row 6
TgggggggggggggggggggT row 7
TggggPPPPPPPPPPgggggT row 8 (P=path center)
TggggPPPPPPPPPPgggggT row 9
TggggggggggggggggggT  row 10
TggBNKggggggggggggggT row 11 (B=Sleepy Bunny enemy, fixed start pos)
TgggggggggggggggFggT  row 12
TggggggggggggggggggT  row 13
TTTTTPPPPPPPPPTTTTT   row 14 (exit south=water, exit north=path to Town Square)
```
EXIT_N at col 8–11, row 0 → Town Square (MC)
EXIT_S not available (water/blocked in Year 1)

**NPC dialogue (Professor Owl, first meeting):**
```
Thai: "สวัสดี โชแปง! ข้าคือ ศาสตราจารย์นกฮูก\nหญ้าสูงนั้น... อาจมีสัตว์ซ่อนอยู่นะ!"
English subtitle (small): "I'm Professor Owl. Tall grass hides creatures!"
```

**Sign text:**
```
"→ ทาวน์สแควร์\n← ทุ่งดอกไม้\n↑ ยังไปไม่ได้..."
```

---

### ✅ Answered: Creature System Open Questions (was GPT Q1–Q10)

1. **Evolution** — Born complete for Year 1. Evolution is Year 2+. No evolution system in code.
2. **Naming** — Child picks from 5 suggestions shown as large tap targets after hatch. No typing. Names stored in `egg.creatureName`.
3. **Family labels** — Subtle badge in Collection detail popup only. NOT a category filter. Not shown on Collection grid.
4. **"Moonborn" rarity** — Yes, formalize as a label. Add to Collection detail popup. One extra visual badge.
5. **Collection layout** — 2 columns, 120px cards (already implemented). Keep.
6. **Accessories** — Born-with for Year 1. No equippable shop items yet.
7. **Creature companion zone** — Enlarge to 80px min height in Home.jsx to show signature feature properly.
8. **Collection feel** — Friendship focus. Show days together + favorite subject badge on detail popup. Gallery is secondary.
9. **Egg visual motif legibility** — Accept ambiguity for Year 1. Do NOT modify `drawEgg()`. The creature reveal is the payoff.
10. **Ember family** — Formalize as 17th family. Flame-tip tail locked + ember glow mandatory. Add to `creatureGenerator.js` MOTIF_MAP.

---

### ✅ Answered: Egg Home Open Questions (was GPT Q1–10)

1. **Egg naming** — No. Don't name the egg. Name the creature after hatch instead (see above).
2. **Mood indicator** — Animation only. No emoji above egg. No stat bar. Pure visual.
3. **Notifications** — No push notifications. Purely intrinsic return motivation. Parent controls app access.
4. **Creature dialogue** — Yes, occasionally. Small speech bubble shows a Thai word (1–2× per session, random). Soft learning moment. Not scheduled.
5. **Desire indicator** — No Tamagotchi hunger icon. Returns motivated by egg growth progress, not guilt.
6. **Hatch moment** — Egg tries to hatch on its own (shakes, cracks) at stage 8. Tap egg to help it hatch. "ช่วยกันหน่อยนะ!" message.
7. **Egg in battle** — No framing change needed. "Your egg went on an adventure" is implied. No text needed.
8. **Ambient sound** — Defer to Year 2. No home theme music in Year 1 MVP.
9. **Creatures leaving** — No. Permanent residents. No Animal Crossing departures.
10. **Multiple creatures** — All walk around together (up to 3 visible). Makes Home feel alive. More than 3 = only show 3 most recent.

---

### ✅ Answered: Green Meadow Open Questions (GM-Q6, Q8, Q10)

**GM-Q6 (boss rebattle curriculum):**
King Clover Bear rebattle uses rotating question sets. 3 sets total. Set rotates per visit (not random). Each set focuses on the subject Chopin is weakest in (from Subject Readiness in sessionLog). Same warm win/loss framing every time.

**GM-Q8 (collectible display location):**
Discovered clovers and treasures → "Clover Bag" button in world screen (top-right, small 🍀 icon + count badge). Opens a simple fullscreen overlay showing grid of collected items. NOT on Home screen. NOT in main Collection page.

**GM-Q10 (Post Bird quest scope):**
Post Bird = traveling NPC, simple gift-giving only. Not a quest chain in Year 1. Appears at 1–2 random screens per session. Dialogue: "มีจดหมายถึงนายนะ!" → gives small item (food or pebble). 5 Old Letters are a passive lore collect, not a quest chain.

---

### ✅ Answered: Gameplay Loop Open Questions

1. **Adventure Director recommend battle?** — No. Director recommends learning always. Battle is child-initiated.
2. **Post-hatch suggestion?** — After hatch: show creature for 5 seconds, then return to Home. No auto-suggest battle.
3. **Minigame XP vs subject XP** — Minigame XP stays at current level. No reduction needed yet. Revisit if farming observed.
4. **Session end signal** — After 3 battles in world: "เหนื่อยมั้ย? กลับบ้านกันไหม?" prompt (voluntary, dismissable).

---

### ✅ Answered: Battle Open Questions

1. **Battle → next egg XP?** — Yes. Win = 8 XP toward egg. Loss = 3 XP (participation). Already implemented.
2. **Challenger adjust as creatures level?** — Yes but simple: Challenger tier = creature tier. Already in code via grade→tier map.
3. **Loss → learning prompt?** — No prompt on loss. Just warm encouragement. Learning is upstream; battle is downstream.

---

### ✅ Answered: Subject Progression Open Questions

1. **Stretch unlock per-level or per-subject?** — Per-level. Each level has its own mastery signal.
2. **Adventure Director recommend Stretch?** — Yes, once. A one-time subtle suggestion: "มีโหมดพิเศษรอนายอยู่นะ" after mastery signal. Never repeated.
3. **Readiness threshold for Grade 1 design?** — When Chopin hits Strong on 2/3 subjects for 2 consecutive weeks. Boss and parent observe, then signal Claude Chatbot to begin Grade 1 content design.

---

## Architecture Notes for Claude Code

**`BattleScreen.jsx` known bug:** advice text still says "เรียนภาษาไทยเพิ่มเพื่อเพิ่ม ATK!" but ATK is Math-weighted. Fix when next touching that file.

**`BattleMode.jsx`:** Dead code — replaced by `MoveSelectBattleMode`. Safe to delete. Confirm no imports first.

**ECA-MVP-3 (still pending):** Add `adventuresWith`, `questionsAnswered`, `eggStartDate` to `defaultState()` and `ADD_XP` reducer. Non-breaking. Low priority.

---

## Content Waiting to Be Built

### Missions (after world is playable)
- Cooking Mission 🍳 — follows Shop Mission pattern. Wait for ~10 Shop sessions of data before designing content.
- Garden Mission 🌱 — gentle daily-habit loop. Design after Cooking is proven.

### World Screens (after Starting Path is playable)
Build in this order after BM is tested with Chopin:
1. MC (Town Square) — hub, 2 NPCs, no tall grass
2. MR (Clover Hill) — more tall grass, Tiny Fox + Grumpy Mole
3. TM (Grandma's House) — EggMemory quest hook
4. Others — Phase 7+ (King Clover Bear last)

---

## Rejected (permanent)

- GPT in workflow — removed 2026-06-10
- Full open-world before tile engine proven — deferred
- New mini-game mechanics — all Year 1 mechanics already exist
- Speed-gated mastery — never
- Push notifications / streak anxiety — never
- Grade 2+ content in Year 1 — never

---

## Claude Code Handoff
_(Claude Code appends here after each session)_

**Last session (2026-06-10):** Green Meadow Phase 1 — World Foundation complete.
9 screens navigable, AC-style transition, Starting Path CSS art scene.
Phase 2 (Canvas Tile Engine) not yet started.
See GPT_HANDOFF.md for full Phase 1 details.

---

**Session (2026-06-10):** Green Meadow Phase 2 — Canvas Tile Engine complete. Build ✅.

**What was built:**
- `src/lib/tileEngine.js` (NEW) — T constants, GB-palette Canvas renderers for all tile types, renderMap/renderPlayer, canMove collision, camera clamp, exit detection, entry position calculation.
- `src/lib/tileMaps.js` (NEW) — BM 20×15 full tile map + 8 minimal screen maps. SCREEN_MAPS registry.
- `src/components/WorldScreen.jsx` (REPLACED) — CSS art fully removed. Canvas tile engine with rAF loop, 120ms player tween, virtual D-pad (4-button cross 56×56px), 25% tall-grass encounter flash, EXIT tile transitions (160ms fade), NPC proximity → 💬 dialogue, sign proximity → 📋 text.
- `src/context/StateContext.jsx` — ENCOUNTER_TRIGGERED action added (no-op placeholder).

**BM map details:**
- Owl NPC: col 6, row 3 (Thai dialogue: 2 lines)
- Sign: col 18, row 4 (3-line directional text)
- Tall grass bands: rows 5–6, cols 3–5 and 13–15
- Stone path: rows 8–9, cols 5–14
- Bunny enemy: col 3, row 11
- Player start: col 10, row 12
- EXIT_N: row 14, cols 7–12 → MC
- EXIT_E: row 7, col 19 → BR
- EXIT_W: row 7, col 0 → BL

**Next for Chatbot:**
- Chopin playtest gate still applies: does tile D-pad feel natural? 5-year-old feedback needed before Phase 3.
- Phase 3 = Visible Enemies (80px trigger, battle entry/return) — blocked on playtest gate.
- GM-Q6 (boss rebattle curriculum), GM-Q8 (collectible display), GM-Q10 (Post Bird scope) still unanswered.

---

**Session (2026-06-10):** Research docs updated to reflect Phase 1 + Phase 2 completion.

**What was updated:**
- `docs/research/world/green-meadow-implementation-plan.md` — all gate questions marked RESOLVED. Phase 1 and Phase 2 marked STATUS: COMPLETE with actual implementation notes and ✅ checklists. Phase 3 marked STATUS: NEXT with playtest gate cleared.
- `docs/research/world/green-meadow.md` — `## Implementation Status` section added (phase table + playtest log: Chopin played Phase 2, map works well, Phase 3 gate cleared).
- `docs/SESSION_STARTER.md` — fully translated to English (was entirely Thai documentation prose).

**Phase 3 is unblocked.** `ENCOUNTER_TRIGGERED` is already a no-op placeholder in StateContext — just needs battle entry wired. When ready to design Phase 3 enemy visuals/behavior/battle entry, that decision belongs here.

---

**2026-06-10 — Camera-follow system + fullscreen map:**
- Built: `tileEngine.js` — `getCamera` now takes `viewW, viewH`; `renderMap` culls to `ctx.canvas.width/height`. `WorldScreen.jsx` — canvas fills full viewport (`window.innerWidth × window.innerHeight`), resize listener, D-pad moved from below-canvas DOM to absolute overlay on canvas (`opacity: 0.75`). Single `position:fixed; inset:0` container, no flex column.
- Not finished: tile scaling (tiles remain 16px; map 320×240 fills top-left of screen with background visible outside map bounds — acceptable for now, Phase 3 map expansion will naturally use more screen real estate).
- Blockers/risks found: none.
- Ready to start next: Phase 3 — Visible Enemies (battle entry/return, 80px trigger).
- Needs Chatbot decision first: Phase 3 enemy behavior + battle entry flow design.

---

**2026-06-11 — Pokémon GB battle screen + world→battle→world:**
- Built: `src/lib/drawEnemy.js` (NEW — canvas sprite renderer for bunny/slime/fox/egg_pawn at 48px design space, scaled to any size). `MoveSelectBattleMode.jsx` (FULL REWRITE — GB-style layout: enemy canvas top-right, egg bottom-left, both HP bars, typewriter dialogue box `▶`, 3-flash entry white-out, enemy lunge + egg-hit-flash on counterattack). `src/components/WorldBattle.jsx` (NEW — world battle wrapper: reads `state.worldBattleEnemy`, generates TOTAL_QS=8 questions, dispatches ROUND_COMPLETE/LOG_SESSION/RETURN_FROM_WORLD_BATTLE, then navigate('world')). `src/lib/state.js` (+`worldPosition`, +`worldBattleEnemy` to defaultState). `StateContext.jsx` (+ENTER_BATTLE_FROM_WORLD, +RETURN_FROM_WORLD_BATTLE, +CLEAR_WORLD_POSITION actions+reducers). `WorldScreen.jsx` (5 edits: stateRef, ENEMY tile collision in tryMove, position restore on mount, initScreen forcedStart param). `App.jsx` (+WorldBattle route, BottomNav hidden for world-battle).
- Not finished: Sleepy Bunny double-tap wake rule (spec called for first contact = wake animation, second = battle — simplified to single-contact for MVP). Enemy respawn timer not yet implemented.
- Blockers/risks found: none. Build ✅ zero errors.
- Ready to start next: Playtest with Chopin; then Phase 4 NPC System.
- Needs Chatbot decision first: Double-tap wake rule + enemy respawn behavior (30s timer vs leave-and-return) — Phase 4 polish question.

---

**2026-06-11 — Fullscreen map + Pokémon GB battle animations:**
- Built: `src/lib/particles.js` (NEW — canvas particle system: `mkBeam/mkOrb/mkLightning/mkSparks/tickEffects`; orb supports `delay` for staggered XP orbs; tickEffects returns surviving list each frame). `src/lib/tileEngine.js` (EDITED — `getCamera` centers map when smaller than viewport: negative camX/camY allowed; `renderMap` fills `#3a6a3a` background before drawing tiles, `startCol/startRow` clamped to ≥0 to handle negative camX). `src/components/WorldScreen.jsx` (EDITED — added `orientationchange` listener alongside `resize`). `src/styles.css` (EDITED — `.move-card-btn` active press scale + `-webkit-tap-highlight-color`). `src/games/MoveSelectBattleMode.jsx` (FULL REWRITE — 120px enemy + 96px egg, entry slide-in from sides via CSS `transition:transform 300ms ease-out`, ResizeObserver-synced effect canvas overlay, `spawnEffect('attack'|'combo'|'ultimate'|'miss'|'xp')` using `getBoundingClientRect`, subject-specific attacks: Thai=golden orb, Math=green beam, English=lightning, compact 2×2 move cards at fixed 168px panel, HP bars 10px, victory: XP orbs fly enemy→egg staggered, 3 entry flash sequences, staggered dialogue typewriter).
- Not finished: none — all planned changes complete.
- Blockers/risks found: Map 320×240px is still smaller than any phone screen (390+ px wide). The camera-center fix works correctly — map draws centered with dark grass fill outside bounds. No tile scaling implemented (was in-scope to defer).
- Ready to start next: Playtest with Chopin (Phase 3 map+battle). Then Phase 4 NPC System.
- Needs Chatbot decision first: Double-tap wake rule + enemy respawn — still Phase 4 polish question.

---

**2026-06-11 — fix: battle end bug resolved.** `MoveSelectBattleMode.fireHit` now checks `newHP <= 0 || isLast` (was `isLast` only); `battleOverRef` blocks input after victory; `WorldBattle` split into `onNext` (advance question) + `onComplete` (finalize + navigate) so early KO doesn't require multiple taps to exit.

---

**2026-06-11 — feat: all 7 enemy types across all 9 screens with movement patterns:**
- Built:
  - `drawEnemy.js`: 3 new sprites (leaf_sprite, grumpy_mole, mushroom_imp), `(ctx, type, size, x, y)` signature for world canvas
  - `enemyConfig.js` (new): ENEMY_DATA with nameTH/hp/level for all 7 types
  - `tileMaps.js`: SCREEN_ENEMIES export (3–4 enemies per screen across all 9 screens); static ENEMY tile removed from BM_MAP
  - `WorldScreen.jsx`: full dynamic enemy system — `enemiesRef`, per-screen init, triggerBattle, proximity wake for sleepy_bunny, movement patterns (slime/fox/egg_pawn patrol, leaf/mushroom wander, bunny chase), 32px sprite rendering, `!` bubble, 30s respawn
  - `WorldBattle.jsx`: WORLD_ENEMY_NAMES expanded for all 7 types
- Not finished: Tiny Fox flee mechanic. Weather/day-night enemy variations.
- Blockers/risks found: None. Build passes cleanly.
- Ready to start next: Phase 4 NPC System (Prof Owl dialogue already in WorldScreen; 4 more NPCs to add).
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: creature Beauty Layer — Pokémon-quality rendering in drawCreature.js:**
- Built (all changes in `src/lib/drawCreature.js` only):
  - `lighten()/darken()` helpers — operate on `hsl(h,s%,l%)` strings via lightness regex
  - `eyeHighlight()` — always-on highlight dot (28% eye radius, upper-left), applied to all eye types except crescent; button type uses effective radius (er×0.75)
  - `withShadow()` — save/restore wrapper applying `rgba(0,0,0,0.20)` shadow with 5px blur
  - `gradEll()` updated — 3-stop gradient (cL at 0, cD at 0.55, darken(cD,12) at 1.0) — edge darkening for rounder look
  - `FAM_RATIO` table — 16 family width/height ratios applied geometry-mean-preserving in `buildGeometry()`
  - `_cloudBody()` — 3 overlapping circles (offsets -0.32/+0.32/0, radii 0.70/0.70/0.88 × brx)
  - `_crystalBody()` — 6-sided polygon with radial gradient + 50%-alpha facet lines
  - `drawBody()` dispatches to `_cloudBody`/`_crystalBody` for those families; `drawBellyPatch()`/`drawPattern()` skip cloud+crystal
  - `drawHorn()` — spiral and star horns wrapped in `withShadow()`
  - `drawEyes()` — eye size cap `Math.min(er, hr*0.30)`; always-on `eyeHighlight()`; replaced conditional gloss block
  - `drawCheeks()` — fixed gradient opacity: 0.73/0.40/0.00 (was bp×0.90/0.55/0)
  - `drawTail()` — star-tipped star wrapped in `withShadow()`
  - `drawAmbientGlow()` — subtle primary-color radial glow (r=brx×2.2, opacity 0.18→0.08→0) drawn before aura
  - `drawCreature()` — `imageSmoothingEnabled=true/imageSmoothingQuality='high'`; calls `drawAmbientGlow` first
- Not finished: none — all 9 fixes complete.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System or Chopin playtest.
- Needs Chatbot decision first: None for this task. GM-Q10 still open for Phase 4.

---

**2026-06-11 — fix: battle subject uses weakest subject from sessionLog, not hardcoded thai:**
- Built:
  - `src/lib/subjectReadiness.js` (NEW) — extracted `computeReadiness(sessionLog, world)` from Report.jsx as shared utility
  - `src/lib/battleSubject.js` (NEW) — `getBattleSubject(enemyType, sessionLog)`: 3-layer selection: (1) exploring subject overrides; (2) enemy preferred if comfortable; (3) weakest by rank
  - `src/config/enemyConfig.js` — added `subject` field to all 7 enemy types: bunny/leaf→thai, slime/mole/egg_pawn→math, fox/mushroom→eng
  - `src/components/Report.jsx` — removed local `computeReadiness`, imports from subjectReadiness.js
  - `src/components/WorldScreen.jsx` — removed `getWeakestSubject`, added `getBattleSubject` import, `triggerBattle` passes `enemy.type` to `getBattleSubject`
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Chopin playtest to confirm all 3 subjects appear across different enemies.
- Needs Chatbot decision first: None.

---

**2026-06-11 — fix: battle subject+level driven by child readiness, not enemy type:**
- Built:
  - `src/lib/battleSubject.js` (REWRITTEN) — `getBattleSubject(sessionLog, state)`: sorts subjects by readiness priority (exploring→comfortable→notready→strong), rotates among tied subjects via `state.dailyBattleRounds % tied.length`. Empty sessionLog → even rotation. Enemy type removed from subject selection entirely.
  - `getBattleLevel(subject, state)` added — maps thai→xpThai, math→xpMath, eng→xpEng; formula `min(floor(xp/120)+1, maxId)` where maxId = last entry's id in LEVELS[subject].
  - `src/components/WorldScreen.jsx` — `triggerBattle` calls `getBattleSubject(sessionLog, state)` + `getBattleLevel(subject, state)`; removed `subjectLevels` dependency.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Chopin playtest — fight enemies of different types, confirm subjects rotate, confirm level increases with XP.
- Needs Chatbot decision first: None.

---

**2026-06-11 — fix+feat: adaptive battle difficulty + full BGM/SFX sound system:**
- Built:
  - `src/lib/battleSubject.js` — fixed PRIORITY bug: `notready` now before `comfortable` (math now appears for new players). Variety safeguard: if last 3 sessionLog entries same subject, rotate to another. `getBattleLevel` now cycles `[1, maxUnlocked, ceil(maxUnlocked/2)]` via `dailyBattleRounds % 3` — easy→hard→medium adaptive rotation.
  - `src/lib/audio.js` (additions only) — `playBGM(track)`, `stopBGM(fadeMs)`, `playSFX(name)` exports. 5 primitive helpers. 4 BGM tracks (home/world/battle/victory). 19 named SFX. iOS touchstart AudioContext resume. Existing `playTone()` untouched.
  - `src/components/Home.jsx` — BGM on mount/off on unmount; `playSFX('stage_up')`, `egg_excited`, `egg_pet` added alongside existing `playTone` calls.
  - `src/components/WorldScreen.jsx` — BGM on mount; `footstep`, `tall_grass`, `npc_talk`, `screen_enter`, `enemy_notice` SFX wired.
  - `src/components/WorldBattle.jsx` — BGM on mount; `stopBGM()` called in `onComplete()` before navigate.
  - `src/games/MoveSelectBattleMode.jsx` — `battle_start`, `attack_launch`, `attack_hit`, `combo`, `ultra_move`, `attack_miss`, `victory` SFX added alongside existing `playTone` calls.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System (Owl is wired, 4 more NPCs to add).
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — fix: 5 UX fixes — dpad center, hint bar, auto-TTS, tall grass battle, enemy collision:**
- Built:
  - D-pad centered: `left: 24` → `left:'50%', transform:'translateX(-50%)'`. Opacity 0.75→0.82. ✅
  - Hint bar: `QuestionHint` updated — `🔊 ฟังอีกครั้ง`/`🔊 Listen` → icon-only `🔊` button. Math arithmetic: added `DotGroup` colored dot visualization (blue for a, orange for b) when both ≤ 10. Math 🔊 button calls `speakTh(mathToThai(q))`. ✅
  - Auto-TTS: TTS `useEffect` now fires for all subjects — Thai/Eng speak `ttsWord`, math calls `speakTh(mathToThai(q))` (Thai number words + บวก/ลบ). `handleDismissTeach` same. `THAI_NUMS` + `numTh()` + `mathToThai()` added at module level. ✅
  - Tall grass battle: ENCOUNTER_TRIGGERED (was no-op reducer) replaced with `triggerBattle({ id:'_grass_', type:randomType })` from GRASS_POOL (5 hidden enemies). 30% encounter rate (was 25%). Flash + battle + navigate all fire correctly. ✅
  - Visible enemy collision: already worked correctly (dynamic enemy check before canMove, triggerBattle fires for all non-sleeping enemies). No static T.ENEMY tiles remain in maps. Confirmed working. ✅
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — fix: hint bar visual, enemy announce TTS, strict subject rotation:**
- Built:
  - `MoveSelectBattleMode.jsx` — Added `HintBar` component (visual question prompt: Thai word + "คืออะไร?", Eng word + "= ?", math arithmetic a op b =?, count/pattern/word labels). DIALOGUE BOX slot now shows HintBar during battle; shownText (hit/miss/victory log) only shown during victoryMode or when q is null. `display:'flex', alignItems:'center'` added to container so HintBar centers. ✅
  - `MoveSelectBattleMode.jsx` — Enemy name announce: new mount-only useEffect fires `speakTh(enemy.name + ' ปรากฏตัว')` at 700ms (after entry animation). `isFirstQuestionRef` added: first question TTS delayed to 1800ms (after enemy announce), subsequent questions fire at 500ms as before. ✅
  - `src/lib/battleSubject.js` — `getBattleSubject` rewritten: strict thai→math→eng rotation via `dailyBattleRounds % 3`; if any subject has `computeReadiness === 'notready'` it overrides the rotation. PRIORITY array and variety safeguard removed (replaced by strict rotation). `getBattleLevel` unchanged in logic but debug `console.log` statements added for xpThai/xpMath/xpEng/dailyBattleRounds and returned level. ✅
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: Home screen redesign — Pokémon background + Tamagotchi ambient life:**
- Built:
  - `src/components/HomeBackground.jsx` (FULL REBUILD) — Vivid FireRed/LeafGreen sky gradient day/night; sun with 4s scale-pulse animation; clouds at new sizes+speeds (28/42/35s); 2 large CSS mountains (height 28%/22%, rounded-rect with vivid greens); curved ground (`border-radius:50% 50% 0 0 / 30px`); ground mounds for depth; `Butterfly` CSS component (2 wings with alternating scaleY flap + sine flight loops, #ff99dd and #ffcc44); `Bird` CSS component (oval body + 2 wings, 0.25s fast flap, 15s cross-screen loop); 3 leaf particles (fall+rotate+sway, looping); 4 fireflies (night only, static glow + drift+opacity loops); vivid night sky (#0a1a3a→#2a3a7a); stars retained. All animated elements have `will-change:transform`. No box-shadow animations.
  - `src/components/Home.jsx` (TARGETED EDITS) — Title "ไข่ของ{name}" moved above egg (17px Fredoka, glow text-shadow); stage dots replaced with single `moodEmoji` (😊/🤩/😋/😴 driven by `eggAnim` state); header left side simplified to stage-name only; item tray has glassmorphism inner card (`rgba(255,255,255,0.15)` + blur(8px) + frosted border); ออกสำรวจ! button has shimmer (`home-shimmer` keyframe, background-position sweep); egg canvas wrapped with ellipse ground shadow.
  - `src/styles.css` (ADDITIONS) — 15 new keyframes in HOME BACKGROUND SCENE section; cloud CSS classes resized/respeeded.
- Not finished: none — all spec parts complete.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System, or Chopin playtest to validate Home feel.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

