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

---

**2026-06-11 — fix: hint bar dots-only for math; enemy sprites rebuilt as pixel art:**
- Built:
  - `src/games/MoveSelectBattleMode.jsx` — `HintBar` rewritten: Thai/English return `null` (QuestionHint already shows the word + 🔊). Math arithmetic shows 2 dot groups (blue=`q.a`, orange=`q.b`) + operator + `= ?`. Math isCount/isPattern/isWord also return null. Uses `q.a`/`q.b`/`q.op` directly (not regex). ✅
  - `src/lib/drawEnemy.js` (FULL REBUILD) — All 7 draw functions replaced with `ctx.fillRect()`-only pixel art. `px(ctx, gx, gy, gw, gh, size, color)` maps 48×48 grid to pixels. `ctx.imageSmoothingEnabled = false` in `drawEnemy()`. `DRAW_FNS` lookup replaces switch. All type aliases preserved (`bunny`/`sleepy_bunny`, `slime`/`bouncy_slime`, `fox`/`fox_kit`/`tiny_fox`, etc.). ✅
- Not finished: none.
- Blockers/risks found: None.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: element attack system — 6 elements × 4 tiers with canvas animations and SFX:**
- Built:
  - `src/config/elementConfig.js` (NEW) — `ELEMENTS` config (6 elements × 4 tiers, Thai names, colors) + `getElementTier(element, combo)` helper. ✅
  - `src/lib/elementAnimations.js` (NEW) — 24 canvas animations (6×4). `animate()` RAF helper + `zigzag()` lightning helper. All 6 elements: lightning (zigzag bolts), fire (particles/fireball/wave/meteor), ice (diamonds/spears/snowflakes/star-crystal), wind (bezier arcs/leaves/sweep/spiral), laser (beam/glow/impact/8-radial), water (bubbles/sine-wave/flood/tidal-wave). ✅
  - `src/lib/audio.js` — `SFX_ELEMENTS` dict (6×4 Web Audio tones) + `playElementSFX(element, tierIndex)` export. ✅
  - `src/games/MoveSelectBattleMode.jsx` — `battleElement` random-on-mount, `attackLabel` flash, `overlayCanvasRef` second canvas (zIndex 16), element badge pill in enemy status panel, `fadeInOut` label animation, `playElementSFX` + `playElementAttack` wired in `fireHit()`. ✅
  - `src/styles.css` — `@keyframes fadeInOut` added. ✅
  - Build: ✅ 129 modules, zero errors.
- Not finished: none.
- Blockers/risks found: None.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: treasure chest + slot machine; fix hint bar centering:**
- Built:
  - `src/components/TreasureSlot.jsx` (NEW) — slot machine overlay. 3 emoji reels spin at 80ms/frame, stop at frames 15/22/30. 3-match = star×3 jackpot; 2-match = ribbon×1; else = food×1. `onReward` fires 800ms after spin. `DROP_ITEM` dispatched per qty.
  - `src/components/WorldScreen.jsx` — `drawChest()` pixel art (16px, sparkle); `spawnChests(screenId)` picks 2–3 GRASS/FLOWER tiles; `chestsRef` init on screen change; chest collision in `tryMove`; `renderChests` in rAF loop; `handleTreasureReward`; TreasureSlot in JSX.
  - `src/games/MoveSelectBattleMode.jsx` — dialogue box `justifyContent:'center'`; removed `QuestionHint` + `DotGroup` components and render block.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: pixel UI system — Press Start 2P font, pixel classes, square corners, hard shadows:**
- Built:
  - `index.html` — added Press Start 2P + Sarabun to Google Fonts link (combined with existing Mitr+Fredoka One).
  - `src/styles.css` — 20 new CSS variables in `:root` (`--font-pixel`, `--font-thai`, full `--px-*` palette of 16 colors, border/radius/shadow tokens). Pixel CSS class library appended: `px-box`, `px-box-light`, `px-btn` (+purple/yellow/dark variants), `px-hp-bar-outer/inner`, `px-xp-bar-outer/inner`, `px-dialogue`, `px-name-badge`, `px-item-card`, `px-badge`, `px-title`, `px-subtitle`, `px-cursor`, `px-answer-card` (+correct/wrong), `px-combo-badge`, `px-transition-overlay`, `px-bottom-nav`, `px-nav-item`, `px-nav-dot`. Global border-radius kill on interactive elements (`!important`). `img,canvas` get `image-rendering:pixelated`.
  - `src/components/BottomNav.jsx` — replaced `bottom-nav`/`nav-btn`/`nav-dot` with `px-bottom-nav`/`px-nav-item`/`px-nav-dot`. Nav labels use `var(--font-thai)` (Thai can't render Press Start 2P). Emoji icons kept (visual navigation cue for child).
  - `src/components/Home.jsx` — Header: removed `backdropFilter:blur`, flat `var(--px-darkest)` bg + border. Title: Thai font + `var(--px-yellow)` + hard shadow; moodEmoji replaced with `px-subtitle` Thai mood text + 3 pixel dot mood-level indicators (6×6px squares, yellow when active). Hatch CTA: `px-btn px-btn-yellow`, flat, no gradient. Item tray: removed blur/glassmorphism, `px-item-card` per item, `px-badge` for counts. Action row: `px-btn px-btn-dark` (ลูบไข่/คอลเลกชัน) + `px-btn px-btn-purple` (ออกสำรวจ!), flat backgrounds, no gradient/blur, emoji removed from button labels, Thai font override on all 3.
  - `src/games/MoveSelectBattleMode.jsx` — `GBHPBar`: `px-hp-bar-outer/inner` classes (stepped width transition). `MoveCard`: `px-answer-card` base + `wrong` class on miss (replaces miss-fizzle). Enemy/player status panels: `px-box`. Name labels: `px-name-badge` with Thai font. Dialogue box: `px-dialogue`. Teach overlay start button + victory return button: `px-btn` with Thai font.
- Not finished: none.
- Blockers/risks found: Press Start 2P cannot render Thai — all Thai text elements need explicit `fontFamily:'var(--font-thai)'` override when inside pixel-styled containers. This pattern is consistent throughout the changes.
- Ready to start next: Phase 4 NPC System (world); or Green Meadow Phase 4 canvas pixel font pass (separate prompt O3).
- Needs Chatbot decision first: None blocking immediate next task.

---

**2026-06-11 — fix: restore question display in answer panel:**
- Built: Added Zone 2 question display in `MoveSelectBattleMode.jsx` above the 4 answer cards. Math → equation text (28px yellow pixel font, uses `q.question` with fallback `${q.a} ${q.op} ${q.b} = ?`). Thai → `q.word` (36px Sarabun) + 🔊 button calls speakTh. English → `q.word || q.letter` (36px pixel font) + 🔊 button calls speakEn. Also fixed Zone 1 (dialogue box) condition: now shows shownText battle log for Thai/English/non-arithmetic-math instead of swallowing HintBar's null return.
- Not finished: none.
- Ready to start next: Phase 4 NPC System or Green Meadow canvas pixel font pass.

---

**2026-06-11 — feat: pixel home scene — canvas tilemap with animated sprites:**
- Built:
  - `src/components/HomeBackground.jsx` (FULL REBUILD) — Replaced all CSS-div/keyframe art with a `<canvas>` pixel renderer. Canvas dimensions: `window.innerWidth × Math.floor(window.innerHeight * 0.65)`. Scale factor `S = Math.max(1, Math.floor(W / 160))`. `ctx.imageSmoothingEnabled = false`; all drawing via `fillRect` only.
  - Static tiles (redrawn each frame from offscreen): 3-band sky (day: `#4ec8f0/#87ddff/#d4f7c0`, night: `#0a1a3a/#1a2a5a/#2a3a7a`); 2 stacked-`fillRect` pixel mountains; 3-strip ground (bright/mid/dark green rows); 2 pixel-triangle canopy trees; trapezoidal path via horizontal `fillRect` slices; 8 pixel cross-flowers (day only).
  - Animated sprites via `requestAnimationFrame`: sun (square body + 8 cardinal/diagonal rays, `sin(t)`-pulsing scale), moon (square with crescent cutout overlay), 12 twinkling stars (sine opacity), 3 scrolling pixel clouds (box-with-bump), 2 butterflies (sine-wave Y path, flapping wings via `Math.abs(cos(wingPhase))`), 1 bird (V-wing pixel, cross-screen patrol), 4 fireflies (night only, drift + glow `rgba`).
  - Below-canvas div fills remaining 35vh with matching ground color (`#2a7a2a` day / `#0a1a0e` night).
  - `hour` prop preserved (same signature as before); `isDay = h >= 6 && h < 19` computed internally.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: treasure chest requires 1 easy question before slot machine:**
- Built: `TreasureSlot.jsx` — added question gate phase (`phase: 'question' → 'spin'`). `genGateQuestion(subject)` picks level-1 questions: math L1 add 1–5, thai = TH_ALPHA emoji match, eng = EN_ALPHA emoji match. Correct → `playSFX('item_collect')` + spin phase. Wrong → `playSFX('attack_miss')` + red flash overlay + `onClose()` after 700ms (chest stays closed). `WorldScreen.jsx` — passes `subject={getBattleSubject(...)}` prop to TreasureSlot (same subject logic as battle). Gate is always level 1 — easy hurdle, not a test.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

---

**2026-06-11 — feat: Baby Zombie + Snake enemies:**
- Built: `drawEnemy.js` — `_babyZombie` (24-unit grid, X-eyes, outstretched arms) + `_snake` (48-unit, S-curve body, slit eyes, forked tongue). `enemyConfig.js` — baby_zombie (hp30 L2) + snake (hp55 L3). `tileMaps.js` — BM+1 baby_zombie; MC+1 snake; TR+1 snake; MR+1 baby_zombie+1 snake. `WorldScreen.jsx` — baby_zombie chases player at ≈300ms intervals (fast), rendered at 60% sprite size. Snake patrols slowly (1800ms random drift), charges when player within 4 tiles (250ms), plays `enemy_notice` SFX + red `!` on aggro trigger.
- Baby zombie fast chase: ✅ working — timer threshold 6 ticks at 20fps = ≈300ms per step.
- Snake aggro trigger: ✅ working — dist ≤ 4 tiles, one-shot SFX + 10-tick aggroTimer for `!` indicator.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: GM-Q10 (Post Bird scope) before Phase 4 ships.

**2026-06-11 — fix: remove all UI emoji + apply pixel rendering:**
- Built:
  - `Home.jsx` — removed all emoji from ITEM_DEFS (colored CSS squares), flying food shows Thai label, ambient event divs show pixel squares, stage-up banner sparkle removed, particles replaced with CSS colored squares, star orbit uses CSS blocks, ribbon → CSS pink square, sound toggle → Thai text (เสียง/ปิด), creature companion switched from emoji to CreatureCanvas (26px, static, with legacy DNA fallback)
  - `Collection.jsx` — removed all emoji from page title, tab labels, legacy emoji overlay, empty state, ready-to-hatch text
  - `BottomNav.jsx` — replaced 🏠/🥚/📊 nav emoji with colored CSS squares (yellow/purple/blue)
  - `WorldScreen.jsx` — removed 🏠 from กลับบ้าน button
  - `TreasureSlot.jsx` — removed 💰/🎰 from UI labels; ITEMS array kept (slot symbols exception)
  - `Report.jsx` — removed all emoji: page title, rc-icon spans, WORLD_LABELS, READINESS_SUBJECTS, speedLabel/accLabel/domSub strings, BarRow labels, session log status text
  - `CreatureDetailPopup.jsx` — removed rarity stars, legacy overlay, streak 🔥, date icon, section header emoji, XP bar label emoji, ability string emoji
  - `HatchOverlay.jsx` — removed 🥚 from new-egg toast
  - `drawCreature.js` — `imageSmoothingEnabled = false` (was true)
  - `EggCanvas.jsx` — `pixelateCanvas(canvas, 4)` post-process after drawEgg()
  - `CreatureCanvas.jsx` — `pixelateCanvas(canvas, 3)` post-process on both static draw and animation loop
- Not finished:
  - `HatchOverlay.jsx` line 91: `{creature?.e || '🐣'}` hatch reveal still uses emoji. Needs CreatureCanvas integration into hatch flow.
  - `BattleScreen.jsx`: creature.e displays in battle HUD + ITEM_EMOJI dict still use emoji. Need CreatureCanvas integration.
  - Games (`GameSubjectAdventure`, `BattleMode`, `MoveSelectBattleMode`, `DefenseMode`, `EggMemory`, `EggFishing`): 🥚 used as egg visual in mini-games — intentional game visual, not decoration.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: HatchOverlay creature reveal + BattleScreen creature visual — replace emoji with CreatureCanvas?

---

**2026-06-11 — Battle item system:**
- Built:
  - `src/config/itemConfig.js` (NEW) — `BATTLE_ITEMS` (5 items: scroll/thunder/gem/mirror/clover), `rollBattleItem()` (55% chance, weighted random)
  - `src/components/PixelItemIcon.jsx` (NEW) — 10×10 canvas icon renderer, palette-indexed colors per item type, `imageRendering: pixelated`
  - `src/lib/state.js` — `defaultState.items` extended with `scroll/thunder/gem/mirror/clover: 0`
  - `src/games/MoveSelectBattleMode.jsx` — added `useAppState`/`dispatch`; item bar UI above answer panel; `useBattleItem()` implementing all 5 effects; shield ref absorbs 1 miss; XP boost dispatches second ADD_XP; mirror hint eliminates 2 wrong cards; 10% victory drop dispatched via DROP_ITEM; `cur` useEffect clears eliminatedChoices on question advance
  - `src/components/TreasureSlot.jsx` — `resolveReward()` calls `rollBattleItem()`, sets `reward.battleItem` + appends name to label
  - `src/components/WorldScreen.jsx` — `handleTreasureReward()` dispatches extra DROP_ITEM for `reward.battleItem`
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking — item system is self-contained.

**2026-06-11 — fix: snake battle + enemy death animation + respawn + player glow:**
- Built:
  - `src/components/WorldScreen.jsx` — 4 fixes:
    1. **Snake/zombie collision**: `tryMove()` now also checks if fast enemies are already on player's current tile; `updateEnemies()` detects when snake/zombie moves onto player tile and returns `pendingBattle`; `loop()` calls `triggerBattleRef.current?.(battleEnemy)` and returns immediately.
    2. **Enemy death animation**: `renderEnemies()` draws dead enemies as squished/rotated corpse (ctx.scale 1×0.3, rotated 90°) with fading `globalAlpha = e.opacity`; ✕ mark above corpse. Death triggered by sessionStorage `kq_last_battle` restore on enemy init (enemy sets `dead: true, deathTimer: 180`).
    3. **Enemy respawn timer**: `scheduleRespawn()` uses `setTimeout` (45–90s random) to add fresh enemy at walkable tile ≥5 tiles from player; `respawnTimerIds[]` collected and cleared on RAF cleanup.
    4. **Player glow**: module-level `fillCirclePixel()` + `drawPlayerGlow()` draw 3 pulsing pixel rings (warm yellow/white) behind player sprite every frame.
  - `triggerBattleRef = useRef(null)` + `triggerBattleRef.current = triggerBattle` wires RAF loop access to the useCallback.
  - sessionStorage `kq_last_battle` persists last-defeated enemy across WorldScreen remount (battle returns → new mount reads it → starts death animation).
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System, OR any Chatbot-decided next task.
- Needs Chatbot decision first: nothing blocking.

**2026-06-12 — Pokémon battle system — real HP, party, creature faint, battle leveling:**
- Built:
  - `src/lib/state.js` — `defaultState()` extended with `pendingBattle`, `party`, `partySlots`, `battleCreatureId`. `_migrateBattleStats()` adds `id/battleLevel/battleXP/currentHP/inParty/archived` to all existing eggs; called in both loadState() paths.
  - `src/context/StateContext.jsx` — 8 new ACTIONS (SET_PENDING_BATTLE, CLEAR_PENDING_BATTLE, SET_BATTLE_CREATURE, CREATURE_TAKE_DAMAGE, CREATURE_HEAL, CREATURE_GAIN_BATTLE_XP, ADD_TO_PARTY, UNLOCK_PARTY_SLOT). `calcBattleLevel()` + exported `scaleMonsterStats()`. HATCH_COMPLETE now assigns `id`, battle stats, auto-joins party. ENTER_BATTLE_FROM_WORLD clears pendingBattle. RETURN_FROM_WORLD_BATTLE clears battleCreatureId.
  - `src/components/PartySelect.jsx` (NEW) — pre-battle creature picker; HP bars; fainted creatures disabled; flee button.
  - `src/App.jsx` — PartySelect overlay (zIndex 80) when `pendingBattle && !battleCreatureId`.
  - `src/components/WorldScreen.jsx` — `triggerBattle` now dispatches SET_PENDING_BATTLE (with scaled hp/atk from ENEMY_DATA) instead of directly navigating.
  - `src/components/WorldBattle.jsx` — full rewrite: reads battleCreatureId, scales enemy via scaleMonsterStats, passes isWorldBattle props to MoveSelectBattleMode, loops questions (no question-count victory), handleCreatureTakeDamage/handleBattleXP/handleFaint, UNLOCK_PARTY_SLOT milestones at 10/50 XP.
  - `src/games/MoveSelectBattleMode.jsx` — added isWorldBattle/creatureStats/creatureCurrentHP/creatureName/onCreatureTakeDamage/onBattleXP/onFaint props. World battle: maxHP from enemyData.hp, creature ATK for hit damage, SPD dodge + DEF reduction for miss damage, faint triggers onFaint, no question-count victory, onBattleXP called on victory.
  - `src/components/Home.jsx` — compact party HP strip above item tray (CreatureCanvas 22px + HP bar + HP text).
  - `src/components/Collection.jsx` — added ทีม/คลังสะสม/ทั้งหมด tabs; PartyGrid shows HP bars + battle level; VaultGrid shows non-party creatures with เพิ่มในทีม button (ADD_TO_PARTY dispatch).
  - `docs/research/creatures/creature-battle-system.md` (NEW) — full design rationale doc.
- Not finished: none.
- Blockers/risks found:
  - Creature HP is NOT auto-healed. Players need Potions. Heal-over-time mechanic could be a future task.
  - Party system only tracks creature IDs; if `hatchedEggs` is empty, party functions gracefully (empty array).
- Ready to start next: Phase 4 NPC System (Phase 3 world/battle now complete).
- Needs Chatbot decision first: (1) Should HP auto-restore after battle? (2) Should party slot 3 unlock at 25 XP (between 10 and 50)?

---

**2026-06-12 — fix: battle items working + item tooltip popup + monster hurt animation:**
- Built:
  - `src/lib/drawEnemy.js` — Added `EYE_POSITIONS` lookup (all 9 enemy types, 48-grid coords). `drawHurtEyes()` draws X-mark eyes (red lines) + zigzag mouth. `drawEnemyHurt()` (exported) applies `rotate(0.08)` tilt + base sprite + hurt eyes.
  - `src/games/MoveSelectBattleMode.jsx` — Fix 1: `skip` item in world battles now always calls `onNext()` instead of triggering premature `showVictory()` at question 7. Fix 2: Item tooltip popup — tapping item opens overlay with icon/name/description/qty/ใช้เลย!/ยกเลิก; `ITEM_DESCRIPTIONS` object (5 Thai-language descriptions). Fix 3: Monster hurt animation — `enemyHurt` state, 400ms flash in `fireHit`; `EnemyCanvas` calls `drawEnemyHurt` when hurt; imported `drawEnemyHurt`.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — fix: battle uses all question types — full level rotation across thai/math/english:**
- Built:
  - `src/components/WorldBattle.jsx` — `genThaiMoveQ(lv)` now dispatches on `lv.id`: L1 alphabet match (TH_ALPHA), L2 SPELL_L1 (2-char words อา/อิ/อู vowels), L3 TH_L2 (animal words), L4 TH_L3 (3-syllable words), L5 TH_L5 (short sentences). `genEngMoveQ(lv)` dispatches on `lv.type`: phonics (EN_ALPHA), cvc (CVC_WORDS), sight (SIGHT_DATA sentences with blank), sentence (ENG_SENTS full sentence choice). `genMoveQuestion` now passes `lv` to both generators. Battle-start debug console.log added.
  - `src/lib/battleSubject.js` — `getBattleLevel`: threshold lowered to 60 XP/level; uses `minId = levels[0].id` (0 for math → counting level now reachable); rotation formula: `[minId, maxUnlocked, floor((minId+maxUnlocked)/2)]`.
  - `src/games/MoveSelectBattleMode.jsx` — `MoveCard` fontFamily: added `Sarabun,Mitr` fallback so Thai word choices render correctly. Zone 2: shows `q.question` at small font when present (sight-word sentences, level 5 Thai).
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- All math question types: counting/add/sub/mixed/word/comparison/pattern — all reach via getBattleLevel ✓
- Thai levels rotating beyond L1: yes, at 60+ XP triggers L2 (spelling) ✓
- English CVC/sight words: yes, at 60/120 XP respectively ✓
- Debug console.log in place to confirm level variety across battles ✓
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: battle balance — monster HP/DEF rebalance + damage formula fix:**
- Built:
  - `src/config/enemyConfig.js` — All 9 enemies rebalanced: hp 40–52 (was 18–36), atk 3–5 (was 4–9), `def` field added (0 or 1). Target ~10 correct hits to defeat easiest enemy at T0.
  - `src/context/StateContext.jsx` — `scaleMonsterStats`: tier thresholds updated (1.0/1.3/1.8/2.4/3.2, was 1.4/2.0/2.8/3.8). Return type changed from uppercase `{HP,ATK,DEF}` to lowercase `{hp,atk,def}`.
  - `src/components/WorldBattle.jsx` — Now passes `enemy.def` to `scaleMonsterStats`; uses `scaled.hp/atk/def`; scaledEnemy includes `def: scaled.def`.
  - `src/components/WorldScreen.jsx` — `SET_PENDING_BATTLE` dispatch now includes `def: eData.def ?? 0`.
  - `src/games/MoveSelectBattleMode.jsx` — Damage formula: `Math.round(Math.max(1, ATK − enemy.def) × mult)`. Monster DEF now correctly reduces player damage.
- Not finished: none.
- Blockers/risks found: None. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: fix enemy collision — battle triggers on contact, flee keeps enemy alive:**
- Built: `WorldScreen.jsx` — removed `defeated` marking from `triggerBattle` (enemy stays alive while PartySelect is open; flee no longer silently removes enemy). Added `pendingBattle` guard to prevent double-dispatch. Added woken `sleepy_bunny` to RAF-loop chase-collision and `tryMove` same-tile check alongside snake/baby_zombie.
- Not finished: none. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: fix PartySelect never appearing after enemy collision:**
- Root cause: `battleCreatureId` persists to localStorage. App closed mid-battle → next load has `battleCreatureId = 'egg_xxx'`. `state.pendingBattle && !state.battleCreatureId` → false → PartySelect never renders → player sees nothing after walking into enemy.
- Built:
  - `src/context/StateContext.jsx` — `useReducer` initializer now forces `battleCreatureId: null`, `pendingBattle: null`, `worldBattleEnemy: null` after migration. These are transient battle fields that must never survive an app restart.
  - `src/lib/state.js` — `_migrateBattleStats`: party validation now runs independently of `dirty` flag. Validates stored party IDs against actual egg IDs; falls back to `inParty` flag rebuild if valid party is empty. Previously only ran inside `if (dirty)` block — fully-migrated users with stale party never got it fixed.
- Not finished: none. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — audit: enemy collision verified complete (no code changes needed):**
- Audited `WorldScreen.jsx` collision system. All required pieces are in place:
  - `tryMove` (L323): enemy collision at destination tile `e.col===newCol && e.row===newRow` ✓
  - `tryMove` (L338): chaser (snake/baby_zombie/woken bunny) same-tile check ✓
  - `triggerBattle` (L301): `if (stateRef.current.pendingBattle) return` guard ✓
  - `triggerBattle` (L316): dispatches `SET_PENDING_BATTLE` with full enemy payload (type/subject/level/hp/atk/def/nameTH) ✓
  - Enemy NOT marked `defeated` at collision — stays in world during PartySelect, flee keeps enemy ✓
  - `updateEnemies` RAF loop (L614): woken bunny included in chase-collision alongside snake/zombie ✓
- No code changes were needed. Previous session already restored all collision logic.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — feat: PartySelect centered + no flee + selected creature wired to battle:**
- Fix 1 (flee button): Already removed in prior session. No change needed.
- Fix 2 (layout centering): Added `justifyContent: 'center'` to wrapper. `gap: 14→20`. Enemy preview switched from `font-pixel/10px` to `font-thai/14px`. Grid now uses `gridTemplateColumns: partyCreatures.length === 1 ? '1fr' : 'repeat(2, 1fr)'` and `maxWidth: 1 creature → 200, else 320`.
- Fix 3 (selected creature wired to battle): Already working via App.jsx `onSelect` → `SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD + navigate('world-battle')`. WorldBattle.jsx reads `state.battleCreatureId`, resolves creature, passes stats to MoveSelectBattleMode. No change needed.
- Fix 4 (HP display): `maxHP` now includes battle level bonus: `(creature.stats.HP ?? 10) + Math.max(0, (creature.battleLevel ?? 1) - 1)`. `currentHP` display clamped to `Math.min(creature.currentHP, maxHP)`. Fixes 191/188 overflow bug.
- Built: `PartySelect.jsx` only. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — audit: battle balance fixes verified already in place (no code changes):**
- Verified all 4 requested fixes are already implemented from prior sessions:
  - Fix 1: `enemyConfig.js` has correct HP/ATK/DEF (hp=44 bunny, 44 slime, 40 leaf/imp, 36 fox, 52 mole, 32 zombie, 50 snake, 44 egg_pawn; ATK 3–5; DEF 0–1). Lowercase keys match tileMaps.js (`sleepy_bunny`, `fox_kit`, etc.) — task spec uppercase keys would have broken tile map lookups. Subjects kept as `'thai'`/`'math'`/`'eng'` for battle routing (task spec had `null` for all; existing design is intentional).
  - Fix 2: Damage formula `Math.round(Math.max(1, creatureStats.ATK - enemy.def) * mult)` already correct at `MoveSelectBattleMode.jsx:537–538`.
  - Fix 3: `scaleMonsterStats(baseStats, creatureLevel)` in `StateContext.jsx` already uses tier thresholds ≤5/≤15/≤30/≤50/>50 → 1.0/1.3/1.8/2.4/3.2. `WorldBattle.jsx` passes `creature?.battleLevel ?? 1`.
  - Fix 4: `WorldScreen.jsx:303` `SET_PENDING_BATTLE` dispatch already includes `atk: eData.atk ?? 4, def: eData.def ?? 0`.
- No code changes made. Build status: unchanged ✅.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: item reuse per question + no corpse + smooth glow + no flee:**
- Built:
  - `MoveSelectBattleMode.jsx` — Added `setItemUsed(false)` to the per-question reset `useEffect([cur])`. Item is now usable once per question turn (was once per battle). No other item logic changed.
  - `StateContext.jsx` USE_ITEM — Already correctly decrements item count. Verified key alignment: BATTLE_ITEMS keys (`scroll/thunder/gem/mirror/clover`) match `state.items` keys. No change needed.
  - `WorldScreen.jsx` death animation — Removed corpse rendering entirely. Dead enemies now removed from array immediately in `updateEnemies()` (calls `scheduleRespawn` + returns null). Removed `fillCirclePixel` helper + replaced `drawPlayerGlow` with smooth `ctx.arc` rings (outer 85%, inner 58% of tile). Pulse: `(sin(frame×0.06)+1)/2` — continuous sine, no step function. Init changed from `dead: true, deathTimer: 180, opacity: 1.0` to just `dead: true`.
  - `PartySelect.jsx` — Removed the "หนี" flee button. Player must choose a creature. Only when ALL creatures are fainted does a "กลับแมพ" forced-retreat button appear (calls `onFlee` → CLEAR_PENDING_BATTLE).
- Not finished: none. Build ✅ zero errors.
- Blockers/risks: none.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: battle still not opening after collision (INIT dispatch overwrites null):**
- Root cause (deeper than previous fix): `useReducer` initializer correctly sets `battleCreatureId: null`. BUT the `loadState().then(remote => dispatch(ACTIONS.INIT, remote))` runs ~50ms later and dispatches `ACTIONS.INIT` with the full saved state — including the stale `battleCreatureId` from Supabase or localStorage. The previous INIT reducer did `{ ...defaultState(), ...payload }` which spread the stale value back in, silently undoing the initializer's null.
- Built: `src/context/StateContext.jsx` — `ACTIONS.INIT` reducer case now appends `battleCreatureId: null, pendingBattle: null, worldBattleEnemy: null` after the payload spread. These transient fields must never survive app restart regardless of what loadState returns.
- Not finished: none. Build assumed ✅ (single-line change).
- Blockers/risks: none.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: PartySelect infinite loop / freeze on mount:**
- Root cause (A): `WorldScreen.jsx` used `useEffect` to sync `stateRef.current = state`. `useEffect` runs AFTER the browser paint. The RAF loop fires between dispatch and effect, reads stale `stateRef.current.pendingBattle = null`, and calls `triggerBattle` again → another `SET_PENDING_BATTLE` dispatch. This repeats every 3 frames (~50ms) until the effect finally runs. Dozens of dispatches → dozens of PartySelect re-renders.
- Root cause (B): `PartySelect.jsx` computed `dna` via an IIFE inside `.map()`, outside any `useMemo`. On every re-render, a new DNA object was created. `CreatureCanvas.useEffect([dna])` fires on every new reference → RAF animation restarted every re-render. Combined with rapid dispatches above, `buildLegacyPreviewDNA` was being called dozens of times per second → freeze.
- Root cause (C): If `partyCreatures.length === 0`, there was no escape button. UX deadlock.
- Built:
  - `WorldScreen.jsx` — `useEffect(() => { stateRef.current = state })` → `useLayoutEffect`. Runs before browser paint; stateRef is updated before next RAF fires. Guard `if (stateRef.current.pendingBattle) return` now blocks re-entry correctly.
  - `PartySelect.jsx` — `dna` moved into `partyCreatures` useMemo (computed once per `[state.party, state.hatchedEggs]` change). JSX map destructures `{ creature, dna }`. `allFainted` check uses `({ creature: c })` destructure. Empty party now shows "กลับแมพ" button.
- Not finished: none. Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: replace PartySelect with definitive loop-free version:**
- Previous fix (e8c51e8) addressed the RAF timing race and dna reference issue, but CreatureCanvas remained — it starts its own RAF animation on mount and `buildLegacyPreviewDNA` still runs once per useMemo invalidation.
- Built: `PartySelect.jsx` full rewrite. Removed `CreatureCanvas`, `buildLegacyPreviewDNA`, and `useMemo`. Added `renderCount` ref bailout (>50 renders → show error button instead of freezing). Pure state derivation: `partyCreatures` computed inline each render (no expensive ops, array is tiny). Fallback to most-recently-hatched egg if party is empty. Escape button for both empty-party and all-fainted. Creatures shown as 🥚 for now.
- Root cause summary: WorldScreen stateRef race (useLayoutEffect fix, previous session) + CreatureCanvas RAF amplifier (dna memo, previous session) + remaining risk from buildLegacyPreviewDNA inside useMemo. Definitive fix removes all canvas concerns from PartySelect entirely.
- Not finished: CreatureCanvas can be restored to PartySelect once stability is confirmed.
- Build ✅ zero errors.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-12 — hotfix: damage calculation — creature 1-shots all enemies:**
- Root cause: `calcCreatureStats` uses `TIERS[0].baseStat = 100`, producing ATK≈40–70 for all Tier 0 creatures. World enemies have HP=32–52 and were designed for ATK=4–5 hits. The formula `max(1, 60−0)×1 = 60` one-shot kills `sleepy_bunny` (HP=44). Both damage directions were broken: creature ATK×10 too high, and creature DEF×0.5 always absorbed all enemy ATK leaving `max(1, …)=1`.
- Built: `src/components/WorldBattle.jsx` — `creatureStats` useMemo now applies world-battle scaling: `WB_STAT_SCALE=0.07` (ATK/DEF: ~60→4, giving ~11 hits vs easiest enemy), `WB_HP_SCALE=0.10` (HP: ~166→17, faint after ~8–9 non-dodged wrong answers). `creatureCurrentHP` computed as `min(scaledMaxHP, round(creature.currentHP × WB_HP_SCALE))` — carries scaled HP across battles. `handleCreatureTakeDamage` dispatches `round(damage / WB_HP_SCALE)` to state so state HP decreases proportionally. DEF now actually reduces enemy damage (was always blocked by 50× higher value).
- Not finished: none. Build assumed ✅ (WorldBattle.jsx only).
- Blockers/risks: none.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.


---

**2026-06-12 — World Map HUD (mini-map + creature status + XP bar + items):**
- Built:
  - `WorldScreen.jsx` — Replaced flat top bar (home button + screen label) with `WorldHUD` component. 4 sections: (1) Mini-map — 3×3 grid of 9 screens (TL/TM/TR/ML/MC/MR/BL/BM/BR), undiscovered=dark, discovered=grdA color from SCREEN_THEMES, current screen=yellow highlight with • dot; (2) Creature — first party member (fallback: most recent egg), name/level/HP bar/HP numbers; (3) XP bar — Lv.N + gold progress bar using `10 + level² × 2` threshold; (4) Items — 5 PixelItemIcon (scroll/thunder/gem/mirror/clover) at 13px, count badge, dimmed at 0. Home button (⌂ HTML entity + HOME label) replaces old "กลับบ้าน" button.
  - Camera offset: `camY = camYBase − round(HUD_CONTENT_H / 2)` — player character centered in visible play area below the 64px HUD strip.
  - Safe-area support: `paddingTop: env(safe-area-inset-top, 0px)` so HUD content sits below notch on iPhone.
  - `SCREEN_THEMES` import added. `PixelItemIcon` import added. `screenLabel` const removed.
- Not finished: none. Build ✅ zero errors.
- Blockers/risks: none.
- Ready to start next: Phase 4 NPC System.
- Needs Chatbot decision first: nothing blocking.

---

**2026-06-14 — feat: World Progression System — multi-level worlds, dynamic maps, boss screen, secret maze:**
- Built:
  - `src/config/worldConfig.js` — `WORLD_LEVELS` array (3 levels: Green Meadow L0, Dark Forest L1, Crystal Cave L2), each with `name/nameTH/theme/bgColors/enemies/bossEnemy/bossHP/bossATK/bossDEF/unlockRequirement`. `DYNAMIC_SCREENS` object (NW/NE/SW/SE/BOSS/MAZE with explicit `connects`). `SCREEN_LAYOUT`, `BOSS_SCREEN`, `MAZE_SCREEN` exports.
  - `src/lib/state.js` — 4 new fields in `defaultState()`: `worldLevel:0`, `mazeActive:false`, `mazeCleared:false`, `bossDefeated:[]`.
  - `src/context/StateContext.jsx` — 4 new action types + reducers: `SET_WORLD_LEVEL` (sets level, resets to NW, clears maze state), `DEFEAT_BOSS` (pushes current level to bossDefeated[]), `ACTIVATE_MAZE`, `CLEAR_MAZE`.
  - `src/lib/tileMaps.js` — `generateScreenMap(screenSlot, worldLevel)`: 20×15 TREE border, PATH rows 7-8, TALL patches per slot, EXIT tiles by slot. `generateBossMap(worldLevel)`: winding corridor, EXIT_N at row 14 (entry/return). `generateMazeMap()`: recursive backtracker from (13,1), EXIT_N at (0,17) top (clear/reward), EXIT_E side escape. `getScreenEnemies(screenSlot, worldLevel)`: 4-6 random enemies from world pool for NW/NE/SW/SE; [] for BOSS/MAZE.
  - `src/components/WorldScreen.jsx` — Major rewrite: `initScreen` uses generators by screen type. `handleExit` uses `DYNAMIC_SCREENS` + maze routing override (NW→S or SE→W → MAZE when `mazeActive`). Enemy init useEffect: BOSS screen gets static boss at `BOSS_TILE={col:7,row:3}` with `isWorldBoss:true`; regular screens use `getScreenEnemies`; `spawnChests` now accepts `(tileMap, enemyDefs)`. Boss confirm dialog: walking into boss → `setBossConfirm(true)` → confirm dialog (หนีก่อน / สู้เลย!). `enterBossBattle` dispatches `SET_PENDING_BATTLE` with `isBossBattle:true` + boss stats from `WORLD_LEVELS[worldLevel]`. Maze timer `useEffect([worldLevel])`: random 0-20 min → `ACTIVATE_MAZE`. World unlock `useEffect([battleWins])`: checks next level requirement → `SET_WORLD_LEVEL` + 4s banner. MAZE exit via EXIT_N: `CLEAR_MAZE` + 3 random item drops. Boss '!' indicator: always red above `isWorldBoss` enemies in `renderEnemies`. `WorldHUD` mini-map updated: 2×2 grid (NW/NE/SW+MAZE-when-active/SE) + full-width BOSS tile below; colors from `WORLD_LEVELS[worldLevel].bgColors.ground`; BOSS tile red tint; MAZE tile purple tint. World name shown below mini-map.
  - `src/games/MoveSelectBattleMode.jsx` — Item bar hidden when `isBossBattle=true`.
  - `src/components/WorldBattle.jsx` — `isBossBattle` flag read from `enemy.isBossBattle`; `DEFEAT_BOSS` dispatched on boss victory.
- Not finished: MAZE enemy population (maze is empty — enemies could be added from carved GRASS cells in future). Boss screen has 1 boss only (no ambient enemies). Chopin playtest needed before finalizing world unlock thresholds (20/50 wins).
- Blockers/risks found: Old saves with `currentScreen: 'BM'` etc. default to 'NW' via `VALID_DYNAMIC.has()` guard. `SCREEN_ENEMIES` static export still in `tileMaps.js` (harmless but unused — left for backward compat with any other importer).
- Ready to start next: Chopin playtest; then Phase 4 NPC System or Boss battle tuning.
- Needs Chatbot decision first: (1) Should maze have enemies? (2) Is 20 battleWins for Dark Forest / 50 for Crystal Cave the right pace for Chopin?

---

**2026-06-14 — chore: remove Subject Adventure random mode:** Deleted `GameSubjectAdventure.jsx`; removed adventure-* routes and `isAdventure` block from `GameScreen.jsx`. `currentWorld`/`SET_CURRENT_WORLD`/`sessionXP` kept (used by classic games). Home "ออกสำรวจ" already routed to world map only. Build ✅.

**2026-06-14 — feat: food item heals active creature +10 HP in Home screen:** `Home.jsx` — food use dispatches `CREATURE_HEAL` for `state.party[0]` + `playSFX('egg_pet')` + floating "+10 HP" text (green, `dmg-float` 1.1s) above party HP bar. `CREATURE_HEAL` already existed in StateContext. Build ✅ pushed c5d9469.

---

**2026-06-14 — hotfix: question display for math count/pattern questions:**
Root cause: NOT a broken import from GameSubjectAdventure. WorldBattle.jsx has its own self-contained generators. The real issue: `isCount`/`isPattern` questions skipped Zone 2 (comment said "HintBar handles these") but HintBar also returns null for them — leaving genuinely blank Zone 2. For a new player (xpMath=0), ALL math battles are level 0 (count), so every math battle showed no question text. Fix: Zone 2 now shows `q.objects.join(' ') + ' = ?'` for count, `q.seq.join(' ') + ' ?'` for pattern. Build ✅.

---

**2026-06-15 — feat: Creature System Phase 1 — element, bond meter, evolution, hatch naming:**
- Built:
  - `src/lib/creatureSystem.js` (NEW) — `determineElement()`, `calcEvoStage()`, `getEggElementHint()`, `CREATURE_ELEMENT_COLORS`, `CREATURE_ELEMENT_NAMES_TH`, `EVO_STAGE_LABELS_TH`
  - `src/config/gameConfig.js` — `CREATURE_LEVELS` export (xpPerLevel:80, maxLevel:50, evo thresholds)
  - `src/lib/state.js` — `bossDefeatedThisTier: false` in defaultState; migration backfills element/evoStage/bondMeter/bornAtk-Def-Spd-Crit/bornDate/bornTier/creatureName on all existing creatures
  - `src/context/StateContext.jsx` — new ACTIONS: SET_CREATURE_NAME, ADD_CREATURE_BOND, CREATURE_EVOLVE. HATCH_COMPLETE: records element, evoStage:'baby', bondMeter:0, born stats. ADD_XP: distributes creature battleXP (active 100%, bench 50%) + checks evolution. ROUND_COMPLETE: +2 bond active. INCREMENT_BATTLE_WINS: +1 bond active. DEFEAT_BOSS: sets bossDefeatedThisTier:true.
  - `src/components/HatchOverlay.jsx` — 'naming' phase after reveal: element badge + name input + SET_CREATURE_NAME dispatch. Skip button available.
  - `src/components/Home.jsx` — element color dot on party HP bar, bond meter bar (gold, active only), creatureName shown. Element hint badge at Stage 2+ in header.
- Not finished:
  - Collection screen "Set Active" button (collection already shows all creatures but no switch-active UI)
  - Evolution animation/notification (evoStage updates silently in state — no flash/reveal yet)
  - "Team full (6 creatures)" guard on hatch — spec says show message; not yet gated
  - Bond unlock effects (25%→ATK+5%, 50%→dodge, 75%→passive heal, 100%→special move) — tracked in state but no combat effect yet
- Blockers/risks found:
  - `_migrateBattleStats` now imports from `creatureSystem.js` — circular risk if creatureSystem ever imports from state.js (currently safe)
  - XP distribution to bench in ADD_XP runs `calcBattleLevel` quadratic formula; spec's `xpPerLevel:80` is a different system. Added CREATURE_LEVELS to gameConfig for UI display but actual leveling still uses quadratic calcBattleLevel.
- Ready to start next: Bond unlock combat effects (25%/50%/75%/100% thresholds) OR Collection "Set Active" button
- Needs Chatbot decision first: (1) Should evolution trigger a visible animation/fanfare? (2) Should the 6-creature hard limit gate new egg spawn, or just warn? (3) Bond unlock effects — implement as stat modifiers in WorldBattle, or passive overlays?

---

**2026-06-15 — Creature System Phase 2 — Collection Set Active:**
- Built:
  - `StateContext.jsx`: new action `SET_ACTIVE_CREATURE` — reorders `party[]` so chosen creature becomes `party[0]`; reducer is a no-op if creature not in party or already active
  - `Collection.jsx`: `creatureName(egg)` helper (custom name > species name); PartyGrid shows "★ ตัวหลัก" gold badge on party[0], "★ ตั้งเป็นตัวหลัก" button on bench members; element color dot next to name; all name displays updated to show custom name
- Not finished:
  - Evolution animation/fanfare (evoStage updates silently — no visual reaction)
  - 6-creature hard limit guard (hatch still possible with 6+ creatures — no gate or warning)
  - Bond unlock combat effects (25/50/75/100% milestones exist in state but not wired to WorldBattle)
- Blockers/risks found: None new
- Ready to start next: Bond unlock combat effects (implement as flat stat bonuses in WorldBattle when active creature bondMeter crosses thresholds)
- Needs Chatbot decision first: (1) Evolution animation — simple toast flash or full overlay? (2) 6-creature limit — hard gate (block new egg) or soft warn (let hatch but show message)? (3) Bond effects — stat modifiers in `scaleMonsterStats()` vs separate overlay? Confirm approach before coding.

---

**2026-06-15 — hotfix: world map encounter freeze (browser hang on PartySelect):**
- Built:
  - `WorldScreen.jsx` RAF loop: replaced `triggerBattle(battleEnemy); return` with a guarded call `if (battleEnemy && !stateRef.current.pendingBattle) triggerBattle(battleEnemy)` — canvas now keeps rendering every frame while PartySelect is visible instead of returning early and freezing
  - `WorldScreen.jsx` tryMove: added `if (stateRef.current.pendingBattle) return` guard — blocks D-pad input while PartySelect is open, preventing re-triggering encounters
  - `StateContext.jsx` ADD_XP: skip `hatchedEggs.map()` when party is empty or XP gain is 0 — returns same array ref so `derived` useMemo doesn't recompute unnecessarily
  - `StateContext.jsx` ROUND_COMPLETE: skip `hatchedEggs.map()` if no active creature or bond already at 100
  - `StateContext.jsx` INCREMENT_BATTLE_WINS: same stable-ref optimization
- Not finished: None from this session
- Blockers/risks found: Root cause was two compounding issues: (1) RAF loop's `return` when encountering enemy froze the canvas/audio on every 3rd frame while PartySelect was visible; (2) ADD_XP/ROUND_COMPLETE/INCREMENT_BATTLE_WINS created new `hatchedEggs` arrays on every call, causing `derived` useMemo to recompute on every XP gain → extra re-renders for all consumers
- Ready to start next: Chopin playtest of world encounter flow — verify freeze is gone, creature select appears and battle starts cleanly

---

**2026-06-15 — feat: Creature System Phase 3 — bond combat effects, 6-creature limit, evo toast:**
- Built:
  - `state.js`: `pendingEvoNotice: null` added to `defaultState()`
  - `StateContext.jsx`: `CLEAR_EVO_NOTICE` action. ADD_XP / ROUND_COMPLETE / INCREMENT_BATTLE_WINS each detect evoStage change → set `state.pendingEvoNotice = { creatureId, newStage, creatureName }` (first change per reducer wins)
  - `WorldBattle.jsx` `creatureStats` useMemo: bond combat bonuses — bond≥25 → ATK×1.05; bond≥100 → ATK×1.5 (supersedes 1.05); bond≥50 → SPD+30 (dodge ≈+15%). `onCorrect()`: dispatches `CREATURE_HEAL(+1)` when active creature bond≥75 (passive heal per correct answer)
  - `HatchOverlay.jsx`: 6-creature hard gate — if `hatchedEggs.length >= 6` during 'tapping' phase, renders "คลังเต็มแล้ว!" blocking panel with count + back button; egg never shown
  - `App.jsx`: `useEffect([state.pendingEvoNotice])` → `showToast("★ [name] วิวัฒนาการแล้ว! → [stage]")` + `CLEAR_EVO_NOTICE`. Imports `showToast` + `EVO_STAGE_LABELS_TH`
- Not finished: None
- Blockers/risks found: None. Build ✅ zero errors
- Ready to start next: Phase 4 NPC System; OR bond/evo effects playtest with Chopin
- Needs Chatbot decision first: nothing blocking

**2026-06-15 — feat: Creature System Step 3 — voice layer + name suggestion tap targets:**
- Built: `playCreatureSound(voiceProfile, moment)` in audio.js (pitch-shifted creature voices for pet/ambient/food/reunion/celebrate/sleep moments); `CREATURE_NAME_SUGGESTIONS` export in creatureSystem.js (5 Thai name tap targets per element); HatchOverlay naming phase replaced text input with 5 large tap-target buttons using element-appropriate names; Home.jsx `voiceProfile` useMemo (active party creature → buildVoiceProfile → null fallback); wired voice to all creature companion interactions (reunion, celebrate/wave/sleep/gift, tap)
- Not finished: nothing — Step 3 fully complete
- Blockers/risks found: none; build ✅ zero errors
- Ready to start next: Phase 5 Birth sequence (HatchOverlay — egg glow → CreatureCanvas reveal, first blink/look/chirp instead of emoji placeholder)
- Needs Chatbot decision first: nothing blocking

**2026-06-15 — feat: Creature System Step 4 — Phase 5 birth sequence (CreatureCanvas at hatch reveal):**
- Built: `buildCreatureDNA(buildEggStats(state))` called synchronously at reveal time — DNA set before `setPhase('done')` fires; `CreatureCanvas` (150px, `idleMode='celebrate'`) replaces `{creature?.e || '🐣'}` emoji; element-color `drop-shadow` filter (strong during 'done', subtle during 'naming'); `playCreatureSound(buildVoiceProfile(dna), 'celebrate')` fires at creature reveal; `@keyframes creature-birth` + `.hatch-creature-enter` spring-pop animation (scale 0.15→1.14→1.0, 0.60s cubic-bezier); `creatureDNA` state cleared in `doClose` + on overlay re-open
- Not finished: nothing — Phase 5 fully complete
- Blockers/risks found: none; build ✅ zero errors
- Ready to start next: Phase 4 NPC System (5 NPCs: Prof Owl already wired; Sleepy Bunny, Sign, and 2 more NPC dialogues to add per green-meadow.md spec)
- Needs Chatbot decision first: nothing blocking for NPC System; GM-Q10 (Post Bird scope) still open but not required for Prof Owl or Bunny NPCs

---

**2026-06-15 — feat: Creature System Steps 5–10 — family labels, companion resize, friendship data, ECA fields, bio phase, egg growth message:**
- Built:
  - Step 5+7 — `CreatureDetailPopup.jsx`: `FAMILY_LABELS_TH` (16 families), `FAVSUBJ_TH/COLOR`. Header: rarity badge + Moonborn badge (family==='moon'). Creature canvas wrapped in element glow (`drop-shadow`). Name section: displayName (`creatureName` priority) + family badge + element badge. Friendship stats row: days together, adventuresWith, questionsAnswered, favorite subject badge (color-coded by subject)
  - Step 6 — `Home.jsx`: companion zone height 52→80px; CreatureCanvas size 22→46px
  - Step 8 (ECA-MVP-3) — `state.js`: backfill `adventuresWith:0, questionsAnswered:0, eggStartDate` for legacy creatures in `_migrateBattleStats`. `StateContext.jsx`: HATCH_COMPLETE adds these 3 fields; ADD_XP increments `questionsAnswered` for active party; ROUND_COMPLETE increments `adventuresWith` for active party (refactored to always map when activeEgg exists)
  - Step 9 (ECA-4) — `HatchOverlay.jsx`: `bioDNA`/`bioCreature` state; mount useEffect checks active creature `adventuresWith>0` → `setPhase('bio')`; 'bio' phase renders as separate `createPortal` return with CreatureCanvas (100px celebrate), name, adventure count, question count, "ฟักไข่ต่อ!" button → `setPhase('tapping')`, "ยังไม่ฟักตอนนี้" → doClose
  - Step 10 (ECA-3) — `Home.jsx`: `growthBanner` state; mount useEffect checks `state.sessionXP>0` → shows "ไข่ของเราโตขึ้นนะ!" (or "อีกนิดเดียวก็ฟักแล้ว!" at stage≥5) after 900ms, auto-hides at 3s; dispatches `SET_SESSION_XP:0` to reset; styled banner with yellow border
- Not finished: nothing — Steps 5–10 all complete
- Blockers/risks found: none; build ✅ zero errors
- Ready to start next: Phase 4 NPC System (Prof Owl already wired; add Sleepy Bunny, Sign, 2 more NPC dialogues)
- Needs Chatbot decision first: nothing blocking

---

**2026-06-15 — feat: Map System — item bag, 4 maps/tier, secret maze trigger, boss gating:**
- Built:
  - `gameConfig.js`: `MAP_THEMES` (NW=ป่า/nature, NE=ภูเขาไฟ/fire, SW=ใต้น้ำ/water, SE=ทะเลทราย/thunder) + `BOSS_XP_THRESHOLD = 300`
  - `state.js`: `clearedMaps: []`, `secretMapExpiry: null` added to `defaultState()`
  - `StateContext.jsx`: 3 new ACTIONS (`MAP_CLEARED`, `SECRET_MAP_SPAWN`, `SECRET_MAP_EXPIRE`). `INCREMENT_BATTLE_WINS` auto-spawns maze when `battleWins % 10 === 0 && !mazeActive && !mazeCleared` (sets secretMapExpiry = now+30min). `SET_WORLD_LEVEL` now resets `clearedMaps/secretMapExpiry/bossDefeatedThisTier`. `DEFEAT_BOSS` resets `clearedMaps/secretMapExpiry`.
  - `WorldScreen.jsx`: WorldHUD — added 🎒 item bag button (red count badge); minimap shows ✓ on cleared maps, "N/4 [world]" label, boss tile grayed when locked, ! when unlocked, ? on MAZE tile. Boss map unlock computed (`bossMapUnlocked = allMapsCleared && totalXP >= 300`). `handleExit` dispatches `MAP_CLEARED` when leaving NW/NE/SW/SE; blocks BOSS entry when not unlocked. Old random-timer maze useEffect removed; replaced with `useEffect([secretMapExpiry])` for countdown expiry + `setInterval` tick for display. Boss defeat useEffect shows 3.5s cutscene overlay ("โชแปงพิชิต [world]!") then `SET_WORLD_LEVEL` + worldUnlockBanner. Item bag popup (2×2 grid, food/star/ribbon/potion, USE_ITEM dispatch). Boss dialog updated: "พบบอส Final!" + "⚠️ ใช้ไอเทมไม่ได้" warning panel. Maze notification: "🌀 แมพลับปรากฏทางทิศใต้ · MM:SS" countdown.
- Not finished: nothing in core spec. Skipped: 7×7 maze map generation spec (chatbot wanted 7×7 grid but existing generateMazeMap() uses recursive 20×15 backtracker — kept existing, did not rebuild). Monster stat scaling per map theme not implemented (skipped — out of scope for MVP).
- Blockers/risks found: Boss tier advance replaces battleWins-based unlock. Old saves with `worldLevel > 0` will stay at their current tier until boss is defeated — this may confuse returning players. Also: `bossDefeatedThisTier` can trigger the cutscene loop if `SET_WORLD_LEVEL` fails (e.g. at max tier) — guarded with `dispatch(SET_WORLD_LEVEL(wl))` (same level) so it still resets the flag.
- Ready to start next: Phase 4 NPC System (Prof Owl existing + Sleepy Bunny + 2 more NPC dialogues per green-meadow.md)
- Needs Chatbot decision first: (1) Should monster scaling change per map theme (NW=weak, NE=fire-heavy, etc.)? Currently all screens use same world-level pool. (2) Map "cleared" currently means "exited" — should it instead require defeating at least 1 enemy first?

---

**2026-06-15 — fix: suppress hatch overlay during battle + one-time creature merge migration:**
- Built:
  - `App.jsx`: `HatchOverlay suppressAutoOpen` now also suppresses during `world-battle` screen and when `pendingBattle` or `battleCreatureId` is set — prevents hatch sequence from interrupting an in-progress battle
  - `state.js`: `_mergeAllCreaturesIntoOne(state)` exported — sums ATK/DEF/SPD/HP/battleXP/bondMeter across all eggs, picks most-recently-hatched as base, merges into single creature with `mergedFromCount` field; runs once (guard: `eggs.length <= 1`)
  - `StateContext.jsx`: imports `_mergeAllCreaturesIntoOne`; initializer calls it after `_migrateBattleStats` when `hatchedEggs.length > 1` — Chopin's multiple hatched creatures collapsed to one combined creature on first app load
- Not finished: nothing
- Blockers/risks found: `mergedFromCount` stored on merged creature for audit trail. After merge, party is rebuilt to `[merged.id]` and `battleCreatureId`/`pendingBattle` cleared. Irreversible on load — one-shot.
- Ready to start next: Phase 4 NPC System (Prof Owl already wired; add Sleepy Bunny + 2 more NPC dialogues)
- Needs Chatbot decision first: nothing blocking

---

**2026-06-15 — hotfix: force creature merge + fix frozen กลับ button:**
- Built:
  - `state.js`: `_mergeAllCreaturesIntoOne` now also sets `_creaturesMerged: true` on returned state
  - `StateContext.jsx` initializer: uses `needsMerge = eggs.length > 1 && !_creaturesMerged` flag — merge is idempotent even if INIT fires multiple times
  - `StateContext.jsx` `loadState().then()`: also runs merge on remote Supabase data before dispatching INIT — so even if Supabase had 43 eggs, INIT dispatches the merged 1-egg state and saveState() pushes it back to Supabase (Task 3 — cloud cleanup)
  - `StateContext.jsx` CLOSE_HATCH reducer: now also clears `readyToHatch: false` — root cause of frozen กลับ button (hatching=false but readyToHatch stayed true → isOpen flipped back → overlay re-showed immediately)
  - `HatchOverlay.jsx` full-collection กลับ button: uses `handleFullClose` that dispatches CLOSE_HATCH + SET_HATCHING then calls `onClose?.()` directly — skips doClose's wrong "ไข่ใบใหม่เริ่มต้นแล้ว" toast
- Not finished: nothing
- Blockers/risks found: CLOSE_HATCH clearing readyToHatch means if player dismisses hatch without completing, they lose the "ready" indicator until next ROUND_COMPLETE re-sets it. Acceptable — egg XP is preserved; it just re-triggers on next round.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: nothing blocking

---

**2026-06-15 — fix: use average stats for creature merge instead of sum:**
- Built:
  - `state.js` `_mergeAllCreaturesIntoOne`: fresh-merge path now uses AVERAGE (÷ count) for ATK/DEF/SPD/HP/battleXP/bondMeter; added re-averaging path for already-merged 1-egg state (divides summed stats by `mergedFromCount`); returns `_statAveraged: true`
  - `StateContext.jsx` initializer: `needsMerge` condition extended to also trigger when `_creaturesMerged && hatchedEggs.length === 1 && !_statAveraged` — one-time re-run to correct the previously summed stats
  - `StateContext.jsx` `loadState().then()`: same `remoteNeedsMerge` condition so Supabase data is also corrected and pushed back
- Not finished: nothing
- Blockers/risks found: re-averaging divides by `mergedFromCount` stored on the merged egg. If `mergedFromCount` is missing (shouldn't happen — set by fresh merge), defaults to 1 so no division error.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: nothing blocking

---

**2026-06-15 — feat: scale enemy stats with player battle level:**
- Built:
  - `WorldScreen.jsx` `triggerBattle`: looks up active party creature's `battleLevel`, computes `scaleFactor = 1 + (playerLevel - 1) * 0.4`, applies to hp/atk/def before dispatching SET_PENDING_BATTLE. Level 1 = base stats, level 10 = 4.6× stronger.
- Not finished: nothing
- Blockers/risks found: boss battle (`enterBossBattle`) has its own separate dispatch — not scaled by this change. Flag if boss should also scale.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: nothing blocking
