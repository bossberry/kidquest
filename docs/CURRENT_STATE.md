# Current State — KidQuest

## Implemented Features

### Core Game System
- **3 subjects** with level-unlock (≥80% accuracy → EMA unlock next)
  - Thai: 5 levels (match, spell×3, word-order)
  - Math: 9 levels (L0 Foundation count · L1–L5 add/sub/mixed · L6 word-problems · L7 comparison · L8 pattern AB)
  - English: 4 levels (phonics, CVC, sight words, sentence ordering)
- **Teach overlay**: first-time per level; mascot + examples; tracked in `seenTeach[]`
- **GameHeader**: progress bar + streak in all game modes across all 3 subjects
- **Hint system**: Thai spell → amber-highlight next correct tile after 1 miss; Math → 3-attempt reveal; Pattern → amber unit-highlight after attempt 1

### Math Visual Models (L1–L4)
- **L1/L2** (`objects`): real emoji objects grid — emojiA×a **+** emojiB×b
- **L3** (`tenFrame`): 2×5 or 4×5 coloured grid (amber=a, blue=b, grey=empty)
- **L4** (`crossOut`): emoji objects with ❌ overlay on last b items
- **L5+**: original 🟡/🔵 dot visualization

### Egg Home (Home.jsx — 2026-06-10)
- **Egg Home MVP**: Large egg (190×225px) center, idle float / stage 7+ excited pulse. Pet → chirp+sparkle+hearts; streak 3 → giggle+happy-spin; streak 6 → sleepy. Reunion burst on first visit or after >4h. Item tray: food/ribbon/potion/star with count badges. Action row: ลูบไข่ / คอลเลกชัน / ออกสำรวจ. All Adventure Director UI removed.
- **Robust Egg Interaction State Machine (2026-06-10)**: Formal state machine with states `idle/pet/happy/excited/eating/sleep/relax/reunion`. `smRef` tracks `{ state, comboCount, enteredAt }`. `enterState(name, dur?)` cancels in-flight RAF + exit timer before transitioning; generation counter prevents orphaned RAF callbacks. `extendState(name)` extends exit timer without re-triggering CSS animation (smooth repeat taps). Tap combo: 1–3 → pet bounce, 4–7 → happy-spin upgrade, 8+ → excited + sparkles + hearts. Combo resets after 3s inactivity. Item use (food/ribbon/potion/star) resets combo and calls `enterState`. Safety watchdog: setInterval 5s checks if non-idle > 6s → force idle + clear all timers. Unmount cleans up RAF + all timers. All `triggerAnim` calls removed; `petStreak` state removed.
- **Egg Home Emotional Polish (2026-06-09)**: Flying food animation (fixed-position emoji flies to egg, eat chain + chew sound + warm glow, sigh after). Per-item glow (drop-shadow on EggCanvas via `egg-glow-warm/blue/gold/pink` CSS classes). Ribbon 🎀 overlay persists on egg. Star orbit when XP boost active. Random idle micro-animations every 5–12s (`idle-wiggle`/`idle-jump`, occasional chirp/begging sounds). `stageRef` fixes stale closure. 6 new SFX: chew, slurp, giggle, sigh, celebrate, begging. iPhone safe-area layout (CSS `padding-bottom: calc(76px + env(safe-area-inset-bottom))`).
- **Dramatic Egg Stage Progression (2026-06-09)**: 9 display stages (0=ไข่น้อย → 8=ใกล้ฟักแล้ว!!!). Per-stage persistent aura on canvas: `egg-s0`–`egg-s8` CSS classes with pulsing `filter:drop-shadow` (grow stronger + faster each stage). Stage colors in header (dots + name tinted per stage). Stage-up celebration: `stageUp` state → `.stage-up-banner` overlay with "ขึ้นระดับแล้ว!" + stage name, pop+fade animation, `stageUp` ascending fanfare sound, confetti burst (18 sparkles + 6 hearts). Heartbeat sound (`heartbeat`) when ready to hatch (plays once + every 8s). `readyToHatch` check updated to `stage >= 8`. Excited mode starts at stage 7 (was 5).

### Green Meadow World (Phase 2 — Canvas Tile Engine) — NEW 2026-06-10

- **Canvas tile engine**: `src/lib/tileEngine.js` (T constants, GB palette, all tiles drawn in Canvas 2D), `src/lib/tileMaps.js` (BM 20×15 + 8 minimal screens).
- **BM — Starting Path**: Full tile map. Owl NPC (row 3), sign (row 4), tall-grass bands (rows 5–6), stone path (rows 8–9), bunny enemy (row 11), flowers, EXIT_N bottom, EXIT_E/W on sides.
- **Player sprite**: 8-frame directional (4 dirs × 2 walk), egg-stage color body, 120ms tween animation.
- **Camera**: follows player, clamped to map bounds. Canvas = full viewport (`window.innerWidth × window.innerHeight`), `getCamera` takes viewport dimensions, `renderMap` culls to actual canvas size. D-pad overlays on canvas — no separate DOM section.
- **D-pad**: 4-button cross, 56×56px, `position:absolute` overlay on canvas, bottom-left, `opacity:0.75`.
- **Collision**: TREE / WATER / WALL / NPC / SIGN / ENEMY block movement.
- **Screen transition**: EXIT tile → 160ms fade overlay → MOVE_SCREEN + DISCOVER_SCREEN dispatch → player enters new screen from opposite edge.
- **NPC interaction**: Prof Owl at BM col 6, row 3. Proximity → 💬 คุย button → Thai dialogue overlay.
- **Sign**: proximity → 📋 อ่าน → 3-line sign text.
- **Encounter**: 25% on TALL tile → encounter flash + `ENCOUNTER_TRIGGERED` dispatch (no-op, placeholder for future battle entry).
- **8 other screens**: minimal walkable (TREE border, GRASS fill, EXIT tiles), all reachable.
- **State**: No new fields. `ENCOUNTER_TRIGGERED` action added (no-op).
- Phase 1 CSS art WorldScreen fully replaced.

### Green Meadow Phase 3 — World Battle (2026-06-11)

- **ENEMY tile collision**: Walking into an `ENEMY` tile dispatches `ENTER_BATTLE_FROM_WORLD` (saves `worldPosition` + `worldBattleEnemy`), then `navigate('world-battle')`.
- **`WorldBattle.jsx`** (NEW): World battle wrapper. Reads `state.worldBattleEnemy`, generates 8 questions for the weakest subject. Wraps `MoveSelectBattleMode` with `showReturnButton={true}` + `enemyData`. On final question: dispatches `ROUND_COMPLETE`, `LOG_SESSION`, `RETURN_FROM_WORLD_BATTLE`, then navigates back to world.
- **`src/lib/drawEnemy.js`** (NEW): Canvas sprite renderer. `drawEnemy(ctx, enemyType, size)` — 4 types: `bunny`, `slime`, `fox`, `egg_pawn`. 48-unit design space scaled to any pixel size.
- **`src/lib/particles.js`** (NEW): Canvas particle system for battle animations. `mkBeam/mkOrb/mkLightning/mkSparks` factories + `tickEffects(ctx, effects, dt)` tick loop. Orb supports `delay` param for staggered XP-orb victory. Used exclusively by `MoveSelectBattleMode`.
- **GB-style Pokémon battle screen** (`MoveSelectBattleMode` full rebuild): Enemy 120px canvas top-right + Egg 96×112px bottom-left, both slide in from opposite sides via CSS `transform` transition (300ms ease-out, enemy from right, egg from left). ResizeObserver-synced `<canvas>` effect overlay in battle field. `spawnEffect(type)` uses `getBoundingClientRect()` to coordinate particle origins: subject-specific attacks (Thai=golden orb, Math=green beam, English=lightning), combo/ultimate combinations, XP orbs fly enemy→egg staggered on victory. HP bars 10px. Compact 2×2 move cards 168px fixed panel. Typewriter dialogue `▶` at 25ms/char. 3 entry flash sequences. `GBHPBar` sub-component (green/yellow/red threshold). `EnemyCanvas` sub-component with hit-flash + defeat animation.
- **Camera centering fix** (`tileEngine.js`): `getCamera` now returns negative `camX/camY` when map is smaller than viewport — centers 320px map on 390px phone. `renderMap` fills `#3a6a3a` background before tiles + clamps `startCol/startRow ≥ 0`. `WorldScreen.jsx` added `orientationchange` listener.
- **Position restore**: `WorldScreen.jsx` mount effect reads `state.worldPosition` → restores player to saved `{tileX, tileY}` via `initScreen` `forcedStart` param, then dispatches `CLEAR_WORLD_POSITION`.
- **State**: `worldPosition: null` + `worldBattleEnemy: null` added to `defaultState()`. New actions: `ENTER_BATTLE_FROM_WORLD`, `RETURN_FROM_WORLD_BATTLE`, `CLEAR_WORLD_POSITION`.
- **App routing**: `world-battle` screen added. BottomNav hidden for `world-battle`.
- **Not yet**: Sleepy Bunny double-tap wake rule (single-contact MVP). Enemy respawn timer.

### RPG / Egg System
- **Procedural egg**: 9 display stages, adaptive XP (120–800 XP per egg, scales with eggs hatched); `drawEgg()` Canvas — **LOCKED** (`hash`/`prng`/`drawEgg` untouched). `EGG_STAGES=9` in eggAlgorithm.js; `scaledEggProgress()` in StateContext computes display stage 0–8 from adaptive XP threshold.
- **Hatching**: `HatchOverlay.jsx`, tap-to-hatch → `getCreatureForHatch()` → creature revealed
- **Procedural creature**: `drawCreature()` Canvas, rarity from streak at hatch time
- **Tier system**: 6 tiers (0=อนุบาล → 5=ม.ปลาย); `calcCreatureStats()` derives HP/ATK/DEF/SPD/CRIT
- **Collection page**: hatched tab + current egg tab + creature detail popup
- **Item system**: food🍗 ribbon🎀 star⭐ potion💧 — drop in minigames, affect egg state
- **XP boost**: star item = 2× XP for 5 min
- **Happiness decay**: −3/hour after 8h idle, floor 10

### Battle System
- **Turn-based battle**: `BattleScreen.jsx` — `simulateBattle()` pre-computes turn log; animated playback with Pokémon-style per-turn display
- **Stats**: HP, ATK, DEF, SPD, CRIT via `calcCreatureStats()` (derived from subject XP proportions + tier)
- **Challenger system**: every 15 `dailyBattleRounds` → random `AI_OPPONENTS` opponent; grade→tier: 0→T0, 1-2→T1, 3-4→T2, 5-6→T3
- **AI_OPPONENTS all 6 tiers** (Sonic villain theme). **Rebalanced 2026-06-04**: enemy HP ×4 regular / ×3.5 boss; ATK ×2.5 — battles now last 6–15 turns instead of 2–4. Player still usually wins but takes meaningful HP loss.
  T0: Motobug/Buzzbomber/Crabmeat → Egg Pawn → Dr. Eggman I · T1: Caterkiller/Burrobot/Chopper → Egg Gunner → Dr. Eggman II · T2–T5: same villain progression
- **Learning special move** (updated 2026-06-04): Battle starts immediately. After attack 2 or 3 (random), a small overlay prompt appears: "⚡ พลังพิเศษมาแล้ว!" Questions are emoji-visual — Math shows counting emojis (🍎🍎 → tap 2), Thai/English uses TTS (`speakTh`/`speakEn`) with 3 emoji choices (e.g. "ปลา" → 🐟/🐱/🐶). 🔊 replay button on Thai/English. Correct → 25% bonus damage + special SFX fires in animation. Wrong/Skip → battle continues, no penalty. HP updated relative to damage dealt (not absolute log snapshots) so special mid-battle damage is accurate. One prompt per battle.
- **Pokémon-Style Learning Battle** (2026-06-04): `MoveSelectBattleMode.jsx` replaces `BattleMode.jsx` in Subject Adventure Engine for all 3 subjects. Battle-first design: answer choices ARE attack moves — no "question text" in center, no quiz layout. Move panel: 2×2 grid of cards, each showing `[element icon] [answer content]` + tiny flavor move name. Math: number choices. Thai: emoji choices + TTS speaks word on load. English: emoji choices + TTS. No player HP — egg never in danger. Wrong = miss fizzle + "โจมตีพลาด!" + continue. Combo system: streak 2=glow, 3=combo flash, 4+=CRITICAL ×1.5. Ultimate: 3 consecutive correct charges ultimate (×2 damage on next correct). Boss encounters at 12% rate. Teach intro shown first time per level. Victory always at end of session (last question). Child-facing result screen hides score/accuracy; parent sessionLog still records it.
- **Subject Adventure Engine** (2026-06-04): `GameSubjectAdventure.jsx` + `MoveSelectBattleMode.jsx` + `ChaseMode.jsx` + `DefenseMode.jsx`. Continue Adventure card routes all subjects to `adventure-{world}`. Mode rotates deterministically. Battle mode uses emoji move-panel questions; chase/defense use classic letter/number format. Full XP/sessionLog/level-unlock dispatch identical to classic games. Classic GameThai/GameMath/GamePhonics still reachable via "อยากเลือกเอง?" toggle.
- **Egg Companion Adventure MVP** (2026-06-04): Current egg is the player's avatar across all 3 Subject Adventure modes. MoveSelectBattleMode: EggCanvas with charge/lunge animations, combo glow ring, near-hatch glow, sparkle on correct. DefenseMode: EggCanvas — child defends their own egg. ChaseMode: EggCanvas — egg dashes on correct. All modes: egg has continuous `egg-idle` float animation at rest.
- **Adventure Mode UI 2.0** (2026-06-09): Enemy-first layout across all 3 modes. Enemy 120px in Defense/Chase (was 90/64px). Compact `QuestionHint` replaces large `QuestionDisplay` — no white card, no dominating question area. Mode labels removed. Visual hierarchy: enemy top → egg middle → move panel bottom. Miss animation on wrong choice buttons. Hit flash overlay on correct. Combo indicator compact (no large badge). Chase track slimmed to 32px.
- **Educational Math Visuals** (2026-06-09): `COUNTABLE_GROUPS` + `COUNTABLES` added to `gameConfig.js` — single source of truth for all 3 math files. 3 semantic categories: fruits (🍎🍌🍓🍊🍒), animals (🐟🐱🐶🐰🐸), everyday (🧸⭐🎈🌸🚗). For addition visual models, emojiA/emojiB now always from same category. `PATTERN_SETS.AB` updated: 🥚 removed, now shape/fruit/animal pairs. Teach overlay examples updated to match.
- **Adventure Mode Full-Screen Fix** (2026-06-09): Battle UI now occupies the full mobile viewport — no white margins, no centered narrow column. Strategy: `GameScreen.jsx` uses `position:fixed;inset:0` for adventure worlds (escapes all parent flex constraints). `#root` `align-items:center` removed. `GameSubjectAdventure.jsx` default export wrapped in `flex:1` div. `ResultScreen` changed from `minHeight:100%` to `flex:1`. All three mode components (`MoveSelectBattleMode`, `ChaseMode`, `DefenseMode`) root divs changed from `height:100%/minHeight:100%` to `flex:1/minHeight:0`. Answer cards simplified: attack icons (`⚡🌪❄⭐`) and move names removed — learning answers ARE the attack.
- **Battle SFX**: `attack` (sword swing) + `hit` (impact) + `crit` (4-tone) + `special` (5-note ascending) + `win` (6-note fanfare) + `lose` (gentle descent). Sound toggle respected via `getSoundOn()` from audio.js.
- **Item reward** on win; defeated bosses tracked in `defeatedBosses[]`

### Procedural Character System (Phases 1A–3, 2026-06-09/10)
- **Phase 1A** — `src/lib/creatureGenerator.js`: `buildCreatureDNA(stats)` returns 30+ gene object (motif, family, 17 body/face/feature genes, h1/h2/h3/ha hues, voicePitch, voiceFamily, birthMark, beautyProfile). Deterministic: pre-drawn 64-value PRNG pool ensures same `buildEggStats()` output → same DNA forever. `detectEggMotif()` maps egg hue/hour/streak to named motif (golden, moon, midnight, dawn, ember, ocean, rainbow, classic). `SIG_CONFLICTS` prevents incoherent trait combos on dragon/puff/dream families. `buildVoiceProfile(dna)`, `verifyCreatureGen()` also exported. Commit: `093080f`.
- **Phase 1B** — `StateContext.jsx`: `buildCreatureDNA(eggStats)` called in `HATCH_COMPLETE` reducer; result stored as `newEgg.dna` (null on error → emoji fallback). `beautyProfile: { outlineWeight, gradientStrength, eyeGloss, cheekGlow, featureDensity }` added to DNA. Streak threshold 100→20 in family determination. Commit: `c3ff44a`.
- **Phase 2** — `src/lib/drawCreature.js` (~490 lines): deterministic canvas renderer. `drawCreature(canvas, dna)`. Painter's algorithm: aura→wings→body→bellyPatch→pattern→ears→head→horn→eyes→nose→mouth→cheeks→accessory→tail→signatureOverlay→birthMark. Beauty Layer: radial gradient body fill, hue-darkened outlines (never black), eye gloss dot always present, cheek radial gradient to transparent. 120px reference coords scaled by `sc = canvas.width/120`. `src/components/CreatureCanvas.jsx`: simple React wrapper. `Collection.jsx`: `egg.dna` → new renderer; no `dna` → legacy `drawLegacyCreature`. Commit: `8b14d00`.
- **Legacy Creature Preview** (2026-06-10): All hatched eggs in Collection now render via `CreatureCanvas` regardless of whether they have real `dna`. `buildLegacyPreviewDNA(egg, index)` in `creatureGenerator.js`: primary path calls `buildCreatureDNA(egg.eggStats)` (deterministic, uses stored hatch-time stats); fallback (no eggStats) synthesises stats from `creature.e`/`rarity`/`cat` + index hash, with emoji nudges (🐉→dragon, 🦊→fox, 🦄→crystal, 🤖→crystal, 💎→crystal, ⚡→star, 🦅→bird). Preview DNA is never persisted, never mutates egg data. `Collection.jsx`: imports `CreatureCanvas` + `buildLegacyPreviewDNA`, removed `creatureAlgorithm` import; `CreatureCard` uses `useMemo` for stable DNA reference; legacy emoji badge shown in canvas corner. Gallery grid changed 3-column 88px → 2-column 120px. CSS: `.catalog-grid-lg`, `.catalog-item-lg` classes. Commit: `8c393f7`.
- **Phase 3** — Creature Personality & Animation (2026-06-10): `drawCreature(canvas, dna, anim)` accepts optional `anim = { blinkAmt, sleepParticles }`. `drawEyes` applies blink: scales eye y-radius by `1 - blinkAmt * 1.25`; below threshold draws closed-eye curve line; crescent/button types squash via `ctx.scale`. `drawSleepZ` renders floating 'z' glyphs for sleep particles. `CreatureCanvas.jsx` rewritten with RAF animation loop: blink state machine (open/closing/closed/opening) driven by personality-specific rate + jitter; sleep Z-particle system (spawn/float/fade). CSS idle animation class (`ci-happy`, `ci-curious`, `ci-brave`, `ci-playful`, `ci-gentle`, `ci-sleepy`, `ci-shy`, `ci-celebrate`) applied to canvas element; 8 keyframe sets in `styles.css` provide body breathing+bob per personality. `prefers-reduced-motion` suppresses all `ci-*` classes. Props: `dna`, `size`, `personality`, `animationEnabled`, `idleMode`. Commit: `658d25c`.

### Minigames (5 total — all lazy-loaded)
- **EggRun** 🏃: daily reward, requires 10 rounds/day, endless runner, 3 lives/day, speed scales with XP
- **EggCatch** 🧺: unlock at 2 hatched eggs — catch items, dodge rocks/bombs
- **EggMemory** 🃏: unlock at 4 eggs — match pairs of hatched creatures on Canvas
- **EggTower** 🏗️: unlock at 6 eggs — stack blocks, starting width scales with egg stage
- **EggFishing** 🎣: unlock at 10 eggs — timing game, fish drop items

### Persistence & Auth
- **localStorage** key `kq_state` — always-on, written on every state change
- **Supabase** `eggs` table: `user_id (PK), child_name, state_json (jsonb), updated_at`
- **Guest mode**: fully functional without login; localStorage only
- **On SIGNED_IN**: cloud wins if data exists; else pushes local state up silently
- **Egg migration**: `_migrateEggs()` backfills `tier` + `stats` on legacy hatched egg records

### UI / Navigation
- **Profile button** (👤 + name) in Home header — opens `ProfileModal` to change child name and grade
- **ProfileModal**: name input + grade grid (อนุบาล–ป.6), saves via `SET_PROFILE` action, persists to localStorage + Supabase
- **Lock toasts**: EggRun and minigame lock feedback now uses `showToast()` — no more `alert()` calls
- **Persistent sound toggle**: sound preference stored in `localStorage` key `kq_sound`; survives page reload
- **XP boost indicator**: `XpBoostBadge` in Home header shows `⭐ ×2 M:SS` countdown when star item is active
- **Egg Home MVP** (2026-06-09): `Home.jsx` fully replaced with egg-centric home screen. Large egg (190×225px) at center with idle float animation (`egg-anim-float`). Stage 5+ → excited pulse animation. Pet interaction: tap egg or "ลูบไข่" button → chirp + sparkle particles; streak 3 → happy-spin + hearts; streak 6 → sleepy. Reunion burst on first visit or gap >4h. Item tray: food/ribbon/potion/star slots with count badges; tap once to select, tap again (or tap egg) to use. Creature companion walks left-right in creature zone after first hatch; tap for chirp + bounce. Go Explore ("ออกสำรวจ") → routes to adventure-thai. No subject grid, no XP numbers, no Adventure Director, no Egg Run, no stats strip. New state field: `lastHomeVisit` (null). New action: `UPDATE_LAST_HOME_VISIT`. New SFX: `chirp`, `sparkle`, `jingle`, `feed`. Background: soft warm gradient `#FFF9EE → #EEE6FB`.
- **Hatch overlay fix**: `suppressAutoOpen` prop added — overlay no longer interrupts gameplay (`screen === 'game'`). Freeze-after-hatch fixed: `setPhase('tapping')` called in `handleClose()` before dispatches, ensuring `!isOpen && phase === 'tapping'` → overlay unmounts cleanly.
- **Shop Mission feedback**: wrong choice now shows `.wrong` shake animation; streak >= 3 shows `STREAK_MSGS` (🔥 messages) with louder celebration; streak counter styled amber/bold when active. All existing `playTone` calls preserved.
- **Egg pacing (graduated)**: `scaledEggProgress()` in StateContext. Required XP = `min(800, 120 + n×60)` where n = hatched egg count. Egg 1: 120 XP (fast). Egg 5: 360 XP. Cap 800 at egg 12+. `eggStatsData.stage` overridden in derived useMemo so canvas and display stay in sync. Home XP label uses dynamic `xpPerStage`, shows "เกือบฟักแล้ว!" in stage 6.
- **Creature stats rebalanced**: `calcCreatureStats()` uses weighted formula. Every stat: 40% base guarantee + 60% subject-weighted. ATK weighted to Math, DEF to Thai, SPD to English. Minimum any stat = base × 0.50 (no zeros). ±5% deterministic personality. Migration recalculates broken (0/NaN) stats on load.

---

### Green Meadow — Phase 1: World Foundation (2026-06-10)
- **`WorldScreen.jsx`** (NEW): full-screen world overlay (`position:fixed;inset:0;zIndex:50`). AC-style fade transition: 160ms dark green overlay on move, snap to new screen, 160ms fade out. Direction arrows (N/S/E/W) only rendered where `connects[dir]` is non-null. Home button (🏠 กลับบ้าน) top-left, screen name top-right. Egg avatar (`EggCanvas 80×95px`) floats center (`egg-home-float` animation). Day/night computed from `new Date().getHours()`.
- **Starting Path (BM)** — full CSS art scene: sky gradient, sun with glow rings, moon+stars (night), animated clouds (`hbg-cloud-1/2/3`), distant hills (rounded divs), ground gradient, perspective trapezoid path (clip-path polygon), left+right bushes, 5 left flowers + 5 right flowers with float animation, pollen particles (day only).
- **Other 8 screens** — themed placeholder: unique sky/ground gradient palette + screen icon centered in sky. Visually distinct per screen, no "coming soon" text.
- **`worldConfig.js`** (NEW): `SCREENS` object (9 screens: BM/MC/TM/TL/TR/ML/MR/BL/BR), each with `label`, `region`, `connects {N/S/E/W}`. `WORLD_REGIONS` (green-meadow entry). `SCREEN_THEMES` (sky/ground colors + icon per screen).
- **State additions**: `currentRegion: null`, `currentScreen: null`, `discoveredScreens: []` added to `defaultState()`.
- **New ACTIONS**: `ENTER_WORLD` (sets region+screen+discovers), `EXIT_WORLD` (clears region+screen), `MOVE_SCREEN` (updates currentScreen), `DISCOVER_SCREEN` (appends to discoveredScreens, deduped).
- **`Home.jsx`** explore button: was `navigate('game')` + `SET_CURRENT_WORLD` + `SET_SESSION_XP`. Now: `ENTER_WORLD {region:'green-meadow', screen:'BM'}` + `navigate('world')`.
- **`App.jsx`**: `WorldScreen` imported + rendered for `screen === 'world'`. BottomNav hidden for both `game` and `world`.
- **`styles.css`**: `.world-arrow-btn:active { filter: brightness(0.82) }` added.

### Missions
- **Shop Mission MVP** (`GameShop.jsx`): 4 phases / 6 questions — Phase 1 Thai matching ×3 (emoji → Thai name, 4 choices), Phase 2 English vocab ×1, Phase 3 counting 1–5 ×1, Phase 4 social phrase ×1 (accepts both ขอบคุณครับ/ค่ะ). XP dispatched per subject. 80% pass threshold. State: `shopV1: { bestScore, runs, mastered, stretchUnlocked, totalHints, totalDuration, phaseStats }`. Mastery signal tracked (≥90% + ≤1 wrong + ≥2 runs). Always unlocked via Continue Adventure recommendation (first-run condition). Permanent Shop card on Home removed.

### Play Observation System (Phase D)
- **`sessionLog[]`** in state (ring buffer, max 50): each completed game/mission appends an entry with `{ ts, world, missionId, level, dur, score, wrong, hints, completed, replayedImmediately, nextAction, phaseStats }`. `replayedImmediately` computed by reducer from previous same-world entry.
- **`shopV1` extended**: `totalHints`, `totalDuration`, `phaseStats` (per-phase correct/total accumulated across all runs). Per-question correctness tracked via `perQCorrect` ref in `GameShop.jsx`.
- **`LOG_SESSION` reducer**: appends to `sessionLog`, computes `replayedImmediately` from previous log entry.
- **`UPDATE_SHOP_V1` extended**: now accepts `hints`, `dur`, `phaseStats` and accumulates them.
- **Mission Analytics card** in `Report.jsx`: shows runs, avg score, avg duration, hints, per-phase difficulty (✅/⚠️), replay behavior text, one deterministic nudge. Appears only if `shopV1.runs > 0`.
- **Play History card** in `Report.jsx`: replaces old peer-comparison card. Shows last 10 sessions with world label, date, completed/not. No peer reference.
- **All subject games dispatch `LOG_SESSION`**: GameThai (via `useFinishRound`), GameMath (in `next()`), GamePhonics (in each game's `next()`). GameShop dispatches alongside `UPDATE_SHOP_V1`.
- **Subject Readiness card** in `Report.jsx`: `computeReadiness(sessionLog, world)` derived at render time from last 10 entries per subject. 4 states: Strong (แข็งแรงมาก) / Comfortable (กำลังมั่นใจ) / Exploring (กำลังสำรวจ) / Not Ready (ยังไม่มีข้อมูลพอ). Observation footnote: "ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก". No new state fields.

---

## Partially Implemented

- **Single child profile**: editable via ProfileModal; `SET_PROFILE` action updates name + grade in global state
- **Challenger tiers**: `AI_OPPONENTS` now covers all 6 tiers (0–5); grade→tier mapping fixed in StateContext
- **Foundation mode**: Level 0 count-objects game exists; shown only when `grade===0 && !foundationComplete`

---

## Not Implemented

- Multi-child profiles / parent account management
- Payment / subscription (target: 199 THB/month)
- Landing / marketing page
- AI tutor or personalized question generation
- Classroom mode (B2B)
- PWA / mobile app
- Per-session Supabase logging (currently one state blob per user, no row history)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, plain CSS |
| State | useReducer + Context + localStorage |
| Backend | Supabase (PostgreSQL + email/password Auth) |
| Hosting | Vercel (`vercel.json` — migrated from Netlify) |
| Audio | Web Speech API (Thai/English TTS), Web Audio API (SFX), static `.m4a` in `public/sounds/phonics/` |
| Canvas | HTML Canvas 2D — procedural egg (`eggAlgorithm.js` LOCKED) + procedural creature |

---

## Known Risks

- Single-child profile is editable but still one child per account (no multi-child support)
- Single-child assumption baked into `defaultState()` — multi-child requires state shape refactor
- No session audit trail — all progress in one Supabase blob per user
- `SPEC.md` in repo root describes old HTML prototype — deprecated, do not use
