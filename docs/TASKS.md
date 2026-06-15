# Tasks — KidQuest

## Now

### ⚡ Procedural Character System (2026-06-09)

- [x] **Procedural Character System design doc v1** — `docs/research/creatures/procedural-character-system.md` created. Full architecture: DNA extraction, 40+ genes, art direction, 7 personalities, animation/voice, 10 open questions. 2026-06-09.
- [x] **Procedural Character System design doc v2** — Revised with: Beauty Layer (sticker test, eye gloss, body gradient, outline, harmony check), 16 Family Archetypes (Puff/Fluff/Bear/Cat/Fox/Bunny/Bird/Dragon/Leaf/Star/Moon/Cloud/Crystal/Ocean/Flower/Dream), Signature Feature system (17 memorable traits), Existing Collection Migration (old emoji → legacy path, new hatches → DNA + canvas), 5-phase path (emoji composite REMOVED), updated 8 open questions. 2026-06-09.
- [x] **Procedural Character System design doc v3** — Egg-to-Creature Identity section added. Core rule: family derived from egg visual motif first (isNight→Moon, golden+streak→Star, h1 green→Leaf, h1 teal→Ocean, h1 blue→Cloud, h1 purple→Crystal, h1 red→Ember/warm-Fox-Dragon-Bear), stats modify within family. Motif catalog with 7 named motifs. Family mapping examples (Moon Fox/Moon Bunny/Moon Puff/Moon Dragon, Star Puff/Star Bird, etc.). Concrete inheritance table. Updated Family Determination Logic (motif-first, stat-fallback). Future note on Egg Visual Identity Pass. Open questions expanded to 10 (Q9: egg legibility, Q10: Ember as 17th family). 2026-06-09.
- [ ] **Claude Chatbot: Answer 10 open questions for Procedural Character System** — See `docs/CHATBOT_NOTES.md` → Procedural Character System. Key decisions: (1) creature evolution, (2) name selection UX, (3) family labels in UI, (4) Moonborn rarity label, (5) collection card size, (6) accessories born-with vs equippable, (7) creature companion zone size, (8) collection friendship vs gallery focus, (9) egg visual motif legibility, (10) Ember as 17th family. Write answers to `CHATBOT_NOTES.md`.
- [x] **Phase 1A: `creatureGenerator.js`** — `buildCreatureDNA(stats)`, `buildVoiceProfile(dna)`, `detectEggMotif()`, `verifyCreatureGen()`. 30+ gene object, deterministic 64-value PRNG pool. Commit `093080f`. 2026-06-09.
- [x] **Phase 1B: Persist DNA at hatch** — `StateContext.jsx` `HATCH_COMPLETE` calls `buildCreatureDNA`, stores `newEgg.dna`. `beautyProfile` field. Streak threshold 100→20. Commit `c3ff44a`. 2026-06-09.
- [x] **Phase 2: Canvas renderer** — `drawCreature.js` Beauty Layer renderer + `CreatureCanvas.jsx` + `Collection.jsx` dual-path (dna vs legacy). Commit `8b14d00`. 2026-06-09.
- [x] **Legacy Creature Preview** — `buildLegacyPreviewDNA(egg, index)` in `creatureGenerator.js`. All Collection creatures rendered via `CreatureCanvas` at 120px. 2-column gallery grid. Emoji badge for old creatures. Commit `8c393f7`. 2026-06-10.
- [x] **Phase 3: Animation layer** — Blink state machine (open/closing/closed/opening), sleep Z-particles, CSS personality body animations (`ci-*` keyframes). `CreatureCanvas` props: `personality`, `animationEnabled`, `idleMode`. Commit `658d25c`. 2026-06-10.
- [x] **Robust Egg Interaction State Machine** — Formal FSM in `Home.jsx`: states `idle/pet/happy/excited/eating/sleep/relax/reunion`. `enterState` cancels in-flight RAF (generation counter), `extendState` resets exit timer without CSS flicker. Tap combo: 1-3=pet, 4-7=happy, 8+=excited. 5s watchdog force-returns to idle after 6s stuck. Unmount cleans up all RAF+timers. Item use resets combo. `petStreak` state removed. Build ✅ 2026-06-10.
- [x] **Phase 4: Voice layer** — `playCreatureSound(voiceProfile, moment)` in `audio.js`. Wired to Home.jsx creature companion tap/reunion/celebrate/wave/sleep. Pitch-shifted per creature body type + personality. Build ✅ 2026-06-15.
- [x] **Phase 5: Birth sequence** — HatchOverlay full reveal (egg glow → creature aura, first blink/look/chirp, name selection). `CreatureCanvas` replaces emoji at 150px; `creature-birth` spring pop animation; element-color glow; `playCreatureSound(celebrate)` fires on reveal. 2026-06-15.

---

### ⚡ KidQuest World — Design Phase (2026-06-09)

_Philosophy shift triggered by real playtesting. Chopin said "boring" and "not like a game." Game-first model replaces subject-first model. All items below must be designed before any code starts._

- [x] **KidQuest World design doc** — `docs/research/world/kidquest-world.md` created. Covers: philosophy shift, emotional center, high-level loop, Egg Home, World Map, exploration, battle role, learning philosophy, MVP scope, open questions. CHATBOT_NOTES.md updated. 2026-06-09.
- [x] **KidQuest World Bible** — `docs/research/world/kidquest-world.md` expanded to full World Bible. 8 regions (Green Meadow through Dream Sky) each with theme, visual style, music mood, weather, NPC types, enemy families, rare creatures, collectibles, treasure, learning focus, boss, unlock requirements, special mechanics. Boss roster (all friendly, not evil). Enemy design guide. NPC guide. Collectibles system (6 categories). Future systems section (home decoration, cooking, gardening, seasonal events, etc.). 2026-06-10.
- [x] **Claude Chatbot: Answer blocking World Bible questions** — Q1 (direct entry), Q2 (80px trigger+arrows), Q3 (region+readiness), Q4 (multi-source XP), Q5 (open-ended session), Q6 (fullscreen minigames) — all answered and frozen 2026-06-10. Remaining: Q7 (creature companion), Q8 (boss loss — already designed), Q9 (egg naming), Q10 (background adaptation) — not blocking Phase 1.
- [x] **Egg Home screen design** — `docs/research/world/egg-home.md` created. Layout spec (390px), interaction system (pet/feed/ribbon/potion/star), mood states, stage progression, creature companion, return loop motivators, MVP scope, 10 open questions for Claude Chatbot. CHATBOT_NOTES.md updated. 2026-06-09.
- [ ] **Claude Chatbot: Answer 10 open questions for Egg Home** — See `docs/CHATBOT_NOTES.md` → Egg Home Design. Must answer before Egg Home code: (1) egg naming, (2) mood indicator style, (3) return frequency/notifications, (4) creature dialogue, (5) desire indicator, (6) hatch moment, (7) egg-in-battle framing, (8) ambient sound, (9) creature permanence, (10) multiple creatures in Home.
- [x] **Green Meadow implementation plan** — `docs/research/world/green-meadow-implementation-plan.md` created. 9 phases (Foundation → Polish). Per phase: goal, files affected, dependencies, risks, review checklist, success criteria. Dependency tree, ranked risk list, Chopin playtest checkpoints. Required gate questions before Phase 1. New state fields and worldConfig.js structure specified. 2026-06-10.
- [x] **Green Meadow detailed design** — `docs/research/world/green-meadow.md` created. Full 3×3 screen grid: Starting Path / Town Square / Grandma Turtle's House / Flower Field / Forest Entrance / River Crossing / Clover Hill / Pond & Willow / King Clover Bear Meadow. Each screen: theme, visual mood, NPCs, enemies, treasure spots, secrets, weather, day/night, music. All 6 enemies designed (appearance, movement, personality, animations, battle triggers). All 5 NPCs designed (location, dialogue, gifts, quests). Treasure system (fixed + random + hidden clovers). All 5 minigames integrated naturally into world. Session loop (10–15 min). Full boss flow (approach, battle, win, failure, replay). 10 open questions for Claude Chatbot. 2026-06-10.
- [x] **Claude Chatbot: Answer gate questions for Green Meadow** — GM-Q1 (arrows), GM-Q2 (80px), GM-Q3 (AC-style fade+scroll), GM-Q4 (unlimited bag), GM-Q5 (fullscreen minigames), WB-Q1 (direct entry), WB-Q3 (region+readiness), WB-Q4 (multi-source XP). All Phase 1–6 gates cleared. Frozen. `CHATBOT_NOTES.md` updated. 2026-06-10.
- [ ] **Encounter + transition design** — How does exploration → battle → return work? Entry animation, exit animation, state preservation (player position). Write to `docs/research/world/encounter-system.md`.

### KidQuest World — Implementation Queue (after design phase complete)

_Do NOT begin any of these until Claude Chatbot answers the open questions and design docs are written._

- [x] **EggHome.jsx** — `Home.jsx` fully replaced with Egg Home MVP. Large egg (190×225px) at center, idle float animation. Pet interaction: tap→chirp+sparkle+hearts; streak 3→happy spin; streak 6→sleepy. Item tray: food/ribbon/potion/star with counts, tap-twice-to-use. Reunion burst on first visit or after >4h gap. Creature companion walks after first hatch. Action row: ลูบไข่/คอลเลกชัน/ออกสำรวจ. All subject/score/Adventure Director UI removed. New state: `lastHomeVisit`. New actions: `UPDATE_LAST_HOME_VISIT`. New SFX: `chirp`, `sparkle`, `jingle`, `feed`. Build ✅ 2026-06-09.
- [x] **Egg Home Emotional Polish** — Flying food (fixed-position fly animation → eat chain → sigh). Per-item glow (warm/blue/gold/pink CSS drop-shadow). Ribbon overlay persists on egg. Star orbit when boost active. Random idle micro-animations every 5–12s. `stageRef`/`eggAnimRef` fix stale closures. 6 new SFX (chew/slurp/giggle/sigh/celebrate/begging). iPhone safe-area layout fix. Build ✅ 2026-06-09.
- [x] **Dramatic Egg Stage Progression** — `EGG_STAGES` changed from 7 to 9. 9 Thai stage names (ไข่น้อย→ใกล้ฟักแล้ว). Per-stage persistent canvas aura (`egg-s0`–`egg-s8`, pulsing drop-shadow growing each stage). Stage colors in header dots+name. Stage-up banner ("ขึ้นระดับแล้ว!" + stage name, pop/fade, sparkle confetti, `stageUp` ascending fanfare). Heartbeat sound on ready-to-hatch. Build ✅ 2026-06-09.
- [x] **Phase 1: World Foundation** — `WorldScreen.jsx` (NEW), `worldConfig.js` (NEW), `state.js` (+3 fields), `StateContext.jsx` (+4 actions/reducers), `App.jsx` (+world route, BottomNav hidden for world), `Home.jsx` (explore→navigate world), `styles.css` (+world CSS). BM Starting Path: full CSS art scene (sky/sun/moon/clouds/hills/ground/path/flowers/bushes/particles, day/night). All other screens: themed placeholder (unique sky+ground palette+icon). AC-style fade transition (160ms dark overlay). Egg avatar floats at screen center. Direction arrows: only shown where connection exists. Home button always visible. Build ✅ 2026-06-10.
- [x] **Phase 2: Movement (Canvas Tile Engine)** — `tileEngine.js` + `tileMaps.js` (NEW). `WorldScreen.jsx` REPLACED with canvas tile engine: GB-palette tile map, rAF loop, 120ms player tween, virtual D-pad, collision, EXIT transitions, encounter flash, NPC/sign dialogue. All 9 screens walkable. Build ✅ 2026-06-10. **Gate: Chopin must play and confirm tile navigation feels good before Phase 3.**
- [x] **Phase 3: World Battle** — ENEMY tile collision in WorldScreen, WorldBattle.jsx wrapper, drawEnemy.js canvas sprites, particles.js, MoveSelectBattleMode full GB rebuild, camera centering fix, orientationchange listener. Build ✅ 2026-06-11.
- [x] **World Map HUD** — 4-section HUD strip (mini-map / creature status / XP bar / items / item bag) replaces top bar in WorldScreen. Camera offset adjusted. Build ✅ 2026-06-12.
- [x] **Map System (2026-06-15)** — MAP_THEMES + BOSS_XP_THRESHOLD in gameConfig. `clearedMaps/secretMapExpiry` in state. 3 new actions. WorldHUD minimap shows ✓ cleared + N/4 progress + boss gating. Secret maze via battleWins%10 + 30-min countdown. Boss confirm dialog "ใช้ไอเทมไม่ได้". Boss defeat → tier advance cutscene. Item bag popup in HUD. Build ✅ 2026-06-15.
- [x] **Phase 3 Extended: Dynamic enemies + all 7 types** — `drawEnemy.js` updated: 3 new sprites (leaf_sprite, grumpy_mole, mushroom_imp), signature `(ctx, type, size, x, y)` for world canvas. `enemyConfig.js` (NEW). `SCREEN_ENEMIES` added to `tileMaps.js` with per-screen enemy placement for all 9 screens. `WorldScreen.jsx`: enemiesRef, init useEffect per screen, triggerBattle, movement patterns (slime bounce/fox patrol/egg_pawn patrol/leaf+mushroom wander/sleepy_bunny proximity-wake+chase), 32px canvas rendering, `!` bubble for woken bunny, defeat+30s respawn. BM static ENEMY tile removed. WorldBattle.jsx WORLD_ENEMY_NAMES expanded. Build ✅ 2026-06-11.
- [ ] **Phase 4: NPC System** — 5 NPCs, dialogue, gifts. Gate: GM-Q10 (Post Bird scope) before Phase 4 ships.
- [ ] **Phase 5: Treasure System** — Fixed + random + hidden clovers, unlimited bag. Gate: GM-Q8 (collectible display) before Phase 5 ships.
- [ ] **Phase 6: Minigame Integration** — Fullscreen world-native triggers, return to world position.
- [ ] **Phase 7: Remaining Enemies** — ✅ All 7 enemy types now live. Still needed: weather behaviors + day-night enemy variations.
- [ ] **Phase 8: King Clover Bear** — Boss arena, full boss flow. **Gate: Chopin must play full session.**
- [ ] **Phase 9: Polish** — Ambient life, weather events, secrets, music transitions.
- [ ] **WorldMap.jsx** — Replaced by Phase 1–2 above. Remove this task when Phase 2 ships.
- [ ] **ExplorationEngine** — Encounter probability, event dispatch, item drops, state for picked-up treasures.
- [x] **Update routing** — `App.jsx` routing updated: `world` screen added, BottomNav hidden during world. Done in Phase 1.
- [x] **State: exploration fields** — `currentRegion`, `currentScreen`, `discoveredScreens[]` added to `defaultState()`. Done in Phase 1.

---

- [x] **Home 2.0 — Adventure Director** — `Home.jsx` rewritten: single `⭐ ผจญภัยต่อ` recommendation card (deterministic: hatch → shop first run → weakest subject); minigames 2×2 grid replaced with `🎁 เซอร์ไพรส์วันนี้` single event rotation (date-hash from unlocked minigames; sessionLog marks played-today). Bug fixes: Report NaN for avgScore/avgDur/avgHints (safe migration defaults). Build ✅.
- [x] **Egg economy source-of-truth doc** — `docs/research/rewards/egg-economy.md` created; RESEARCH_INDEX.md updated; CHATBOT_NOTES.md updated with economy decisions.
- [x] **Observation philosophy source-of-truth doc** — `docs/research/observation/observation-philosophy.md` created. Covers: observe→understand→design loop, children are not their level, positive interpretation, important vs. dominating signals, Subject Readiness as observation not label, parent report philosophy (no anxiety), mission follows child, explicit non-goals (no AI/ranking/manipulation), system relationships, 5 open questions. RESEARCH_INDEX.md, CHATBOT_NOTES.md updated.
- [x] **Gameplay loop source-of-truth doc** — `docs/research/progression/gameplay-loop.md` created. Highest-level philosophy document. Covers: core loop (learn→battle→learn), Home as Adventure Director (not a menu), replay philosophy, surprise philosophy, minigame philosophy, intrinsic motivation, child autonomy, explicit non-goals, system relationships, 5 open questions. RESEARCH_INDEX.md, CHATBOT_NOTES.md updated.
- [x] **Battle progression source-of-truth doc** — `docs/research/battle/battle-progression.md` created. Covers: core loop (learn→battle→learn), battle as reward not primary game, creature philosophy, enemy scaling (gentle, Challenger every 15 rounds), loss philosophy (no permanent penalties), reward design, frequency (self-directed), non-goals, future features, relationships to other systems, 5 open questions. RESEARCH_INDEX.md, CHATBOT_NOTES.md updated.
- [x] **Subject progression source-of-truth doc** — `docs/research/progression/subject-progression.md` created. Covers: core philosophy (subjects primary, missions secondary), progression flow, unlock thresholds (70/80/90), replay always valid, mastery = confidence not perfection, subject independence, stretch/challenge layers, readiness vs. highest level, non-goals, future grades. RESEARCH_INDEX.md, CHATBOT_NOTES.md updated.
- [x] **Creature stats source-of-truth doc** — `docs/research/battle/creature-stats.md` created. Covers: weighted stat philosophy, why one-subject-one-stat is bad, example weightings (HP/ATK/DEF/SPD/CRIT), personality variation (±10% deterministic), migration rules, non-goals, future scaling. RESEARCH_INDEX.md, CHATBOT_NOTES.md, TASKS.md updated.
- [x] **Egg pacing + creature stat rebalance** — `scaledEggProgress()` in StateContext (required = min(800, 120 + n×60)); `calcCreatureStats()` weighted formula (40% base + 60% weighted — no stat ever 0); migration recalculates 0/NaN stats. Build ✅.
- [x] **Shop feedback + hatch overlay fix** — `GameShop.jsx`: wrong-button shake (`.wrong` CSS), streak fire messages, prominent streak counter. `HatchOverlay.jsx`: freeze fixed (`setPhase('tapping')` in handleClose), mid-game auto-trigger suppressed via `suppressAutoOpen` prop. `App.jsx`: `suppressAutoOpen={screen === 'game'}`. Build ✅.
- [x] **Battle Home experience** — ⚔️ badge removed from BottomNav. Battle card added to Adventure Director (priority: hatch → battle → shop → weakest subject). Shows challenger emoji + "มอนสเตอร์ปรากฏตัว!" on dark gradient card. Tapping opens ChallengerOverlay (visible state lifted to App.jsx). Build ✅.
- [x] **Shop Mission speech feedback** — `speakTh`/`speakEn` added to `GameShop.jsx`. After each correct answer: Thai questions speak the Thai word (380ms delay), English speaks the English word, Math/counting speaks Thai number word (หนึ่ง/สอง/...). Sound toggle respected. Build ✅.
- [x] **Home UI simplification** — Subject grid now collapsible behind "อยากเลือกเอง?" toggle (closed by default). Shop Mission card removed from main Home. Visual hierarchy: Egg → Continue Adventure → "อยากเลือกเอง?" → Egg Run → Surprise. Build ✅.
- [x] **Battle balance and sound** — enemy HP ×4, ATK ×2.5; battles last 6–15 turns. BattleScreen sound respects toggle; attack/hit/crit/win/lose SFX improved. Build ✅.
- [x] **Battle learning special move** — question phase before each battle (Thai/Math/English from existing content). Correct → ⚡ special attack fires (25% bonus damage, special SFX, gold flash). Wrong/skip → no penalty. Subject chosen from most-played in sessionLog; falls back to simple Math. Also fixed ATK/DEF advice text mismatch in result screen. Build ✅.
- [x] **Audio polish + louder phonics** — 9 new playTone types (tap, open, unlock, item, eggReady, reveal, start, complete, cardOpen). Phonics GainNode 2.5 → 4.0. Sounds wired to Home (tap/open/eggReady), Collection (cardOpen/close), HatchOverlay (reveal), BattleScreen (item), GameShop/Math/Thai/Phonics (unlock, complete). Build ✅.
- [x] **Animation juice polish** — 10 new CSS keyframe animations + utility classes across styles.css. Wired to Home (card float/pulse/shimmer, grid slide-in), BattleScreen (victory bounce, item pop, special-move glow), HatchOverlay (creature reveal glow), GameShop (done bounce, streak bounce). `prefers-reduced-motion` respected. Build ✅.
- [x] **Math Battle learning mode MVP** — `GameMathBattle.jsx` created. 8-question battle vs cute enemy (🤖👻😈🐲). Correct → attack flash + HP drain. Streak≥3 → Crit × 1.5. Wrong → gentle bump, no player HP loss. Same XP/sessionLog/UNLOCK_LEVEL dispatches as GameMath. Continue Adventure Math card routes to battle mode. Subject grid Math card still routes to normal GameMath. Build ✅.
- [x] **Battle special move timing + accessibility** — Prompt moved to mid-battle surprise (after turn 2-3). Questions are emoji-visual: counting emojis for Math, TTS word + emoji choices for Thai/English. 🔊 replay button. Correct fires special SFX + ท่าพิเศษ. Wrong/Skip = no penalty. Build ✅.
- [x] **Subject Adventure Engine MVP** — GameSubjectAdventure.jsx + BattleMode/ChaseMode/DefenseMode. Mode rotates deterministically by day+playCount. All 3 subjects. TTS on Thai/English. XP/sessionLog/level-unlock identical to classic games. Continue Adventure now routes to adventure-{world}. Classic games still accessible. Build ✅.
- [ ] **Play Math Battle with Chopin** — Is the battle mode more engaging? Does Chopin prefer it over normal Math? How many questions feel right (8)? Report to CHATBOT_NOTES.md.
- [ ] **Play Shop Mission with Chopin** — validate fun and timing before expanding. Target: 2–3 min, 80% pass on first or second run.
- [ ] **D0: Home UX audit** — review simplified Home with Chopin. Does Continue Adventure feel like the obvious action? Does the "อยากเลือกเอง?" toggle feel discoverable?
- [x] **Egg Companion Adventure design doc** — `docs/research/gameplay/egg-companion-adventure.md` created. Covers: egg as emotional companion (not just progress bar), companion framing per mode (DefenseMode highest impact), visual/audio/progress spec, relationship data fields (adventuresWith/questionsAnswered/daysTogetherCount/favoriteSubject), MVP recommendation, 5 open questions for Claude Chatbot.
- [x] **Pokémon-Style Learning Battle design doc** — `docs/research/gameplay/pokemon-style-learning-battle.md` created. Battle-first design: answer choices ARE attack moves. Move panel anatomy, subject-specific encoding (Math=numbers, Thai/English=emoji+TTS), full animation/audio spec, session structure, scope check. MVP: Math first → Thai → English. 5 open questions for Claude Chatbot.

---

## Next

### Phase D — Play Observation System ✅ DONE

- [x] **D1: State + reducer** — `sessionLog: []` in `defaultState()`; `totalHints`, `totalDuration`, `phaseStats` added to `shopV1`; `LOG_SESSION` reducer; `UPDATE_SHOP_V1` extended
- [x] **D2: Dispatch from result screens** — `LOG_SESSION` dispatch: `GameShop.jsx` (with phaseStats + dur), `GameThai.jsx` (via extended `useFinishRound`), `GameMath.jsx` (`next()` when done), `GamePhonics.jsx` (all 4 game components)
- [x] **D3: Mission Analytics card in Report.jsx** — runs, avg score, avg duration, hints, per-phase difficulty (✅/⚠️), replay behavior text, deterministic nudge
- [x] **D4: Replace peer-comparison card** — "เทียบกับเด็กวัยเดียวกัน" replaced with play-history timeline (last 10 sessions, no peer reference)

### Phase D+ — Subject Readiness Documentation ✅ DONE

- [x] **Subject Readiness spec** — added to `play-observation-system.md`: 4 readiness states (Strong / Comfortable / Exploring / Not Ready), derivation logic (last 10 sessions, avgScore + goodRuns + completionRate), explicit non-goals. No new code.
- [x] **Mission system updated** — `mission-system.md` now includes "Subject Readiness and Mission Design" section: explains why unlock level is unreliable, how mission weighting should follow readiness profile, when to apply.
- [x] **CHATBOT_NOTES.md updated** — Subject Readiness decisions recorded.

### Pokémon-Style Learning Battle — Implementation Queue (designed 2026-06-04)

_Spec: `docs/research/gameplay/pokemon-style-learning-battle.md` + `docs/research/gameplay/battle-feel-philosophy.md`. Implement only after Claude Chatbot answers open questions._

- [x] **Battle Feel Philosophy** — `docs/research/gameplay/battle-feel-philosophy.md` created. Defines: player HP removal, miss-not-punishment philosophy, 10-step anticipation sequence, combo system, victory sequence, sound/animation philosophy, screen layout, implementation priority (feel before content). Required reading before PSLB-1.
- [x] **Battle Feel Polish Pass (docs)** — `pokemon-style-learning-battle.md` updated to align with Battle Feel Philosophy. Removed: player HP bar, defeat screen, gentle defeat, losing states, every-3-wrong counter-attack. Changed: wrong answer = miss → fizzle → enemy taunts → continue. Move names reduced to tiny flavor text (icons + answers are primary). Battle log: short only. Open question 3 (player HP) resolved: removed.
- [x] **PSLB-0: Battle Feel Baseline** — Anticipation sequence implemented in MoveSelectBattleMode: tap → card pulse → egg charge → egg lunge → hit/miss effects. CSS keyframes. Total ≤ 1000ms. Build ✅.
- [x] **PSLB-1: Math Move-Select Battle** — `MoveSelectBattleMode.jsx` created. Move panel: 4 cards showing `[element icon] [number]` + tiny move name. Correct = attack fires + enemy flash + HP drain + damage float. Wrong = miss fizzle. Build ✅.
- [x] **PSLB-2: Thai Move-Select Battle** — Same shell. `genThaiMoveQ()` returns emoji choices instead of letter choices. TTS fires on panel load. Move cards show `[element icon] [emoji]`. Build ✅.
- [x] **PSLB-3: English Move-Select Battle** — Same shell. `genEngMoveQ()` returns emoji choices. TTS via `speakEn`. Build ✅.
- [x] **PSLB-4: Animation polish** — `move-pulse`, `egg-charge`, `miss-fizzle`, `enemy-defeat`, `crit-flash` keyframes added. Combo glow ring on egg. Damage float. Hit flash on enemy. Build ✅.
- [x] **PSLB-5: New audio tones** — `miss` (soft fizzle), `combo` (rising chime), `ultimate` (power fanfare) added to `playTone()`. Build ✅.
- [x] **PSLB-6: Full BGM + SFX sound system** — Web Audio API only, no audio files. `playBGM(track)`, `stopBGM()`, `playSFX(name)` added to `audio.js`. 4 BGM tracks (home/world/battle/victory). 19 SFX. Wired to Home, WorldScreen, WorldBattle, MoveSelectBattleMode. Battle subject: fixed `notready` priority rank (math now appears), variety safeguard (last-3-same→rotate), adaptive level rotation (easy→hard→medium every 3 battles). Build ✅ 2026-06-11.
- [x] **PSLB-7: Battle item system** — 5 items (scroll/skip, thunder/free_attack, gem/double_xp, mirror/hint, clover/block). `itemConfig.js` with BATTLE_ITEMS + rollBattleItem(). `PixelItemIcon.jsx` 10×10 canvas icons. Item bar in MoveSelectBattleMode above answer panel. `useBattleItem()` logic with all 5 effects. Shield absorbs 1 miss. XP boost dispatches double ADD_XP. Hint eliminates 2 wrong cards. Free attack deals 15 dmg + KO check. 10% victory drop. 55% TreasureSlot drop. State keys added to defaultState. Build ✅ 2026-06-11.
- [x] **PSLB-8: Pokémon party + real HP battle system** — `state.party/partySlots/battleCreatureId/pendingBattle`. `_migrateBattleStats()` adds id/battleLevel/battleXP/currentHP/inParty/archived to legacy eggs. 8 new actions (SET_PENDING_BATTLE, CLEAR_PENDING_BATTLE, SET_BATTLE_CREATURE, CREATURE_TAKE_DAMAGE, CREATURE_HEAL, CREATURE_GAIN_BATTLE_XP, ADD_TO_PARTY, UNLOCK_PARTY_SLOT). `scaleMonsterStats()` exported. `PartySelect.jsx` (NEW). App.jsx overlay. WorldBattle.jsx rebuilt. MoveSelectBattleMode: isWorldBattle mode with creature ATK damage, SPD dodge, DEF reduction, faint. Home party HP strip. Collection ทีม/คลังสะสม tabs. Build ✅ 2026-06-12.

### Egg Companion Adventure — Implementation Queue (designed 2026-06-04)

_Spec: `docs/research/gameplay/egg-companion-adventure.md`. Implement only after Claude Chatbot answers open questions._

- [x] **ECA-MVP-1: DefenseMode egg replacement** — EggCanvas replaces `babyEmoji` in `DefenseMode.jsx`. Egg bounces (`eggBounce`) on shield-block, shakes (`eggShake`) when shield is hit. Sparkle `item` tone 200ms after correct. Build ✅ 2026-06-04.
- [x] **ECA-MVP-2: BattleMode egg companion** — EggCanvas replaces `🦸` player in `BattleMode.jsx`. Egg jumps + golden glow + `✨` sparkle float on correct; shakes on enemy counter-attack; continuous `egg-near-hatch` pulse/glow when stage ≥ 5. Egg growth progress bar shows below battle log with stage name + %. Sparkle `item` tone 200ms after every correct answer. Build ✅ 2026-06-04.
- [x] **ChaseMode egg companion** — EggCanvas replaces `🦸` runner in `ChaseMode.jsx`. Egg dashes (`adv-dash`) on correct. Sparkle tone. Build ✅ 2026-06-04.
- [x] **ECA-MVP-3: Relationship data fields** — `adventuresWith`, `questionsAnswered`, `eggStartDate` added at hatch + backfilled in migration. ADD_XP increments questionsAnswered for active. ROUND_COMPLETE increments adventuresWith for active. Build ✅ 2026-06-15.
- [x] **ECA-3: Post-session egg moment** — `Home.jsx` growth banner on mount when `sessionXP>0`: "ไข่ของเราโตขึ้นนะ!" or "อีกนิดเดียวก็ฟักแล้ว!" (stage≥5). Auto-hides 3s, resets sessionXP. Build ✅ 2026-06-15.
- [x] **ECA-4: Hatch biography summary** — `HatchOverlay.jsx` 'bio' phase: shows active creature canvas + adventuresWith + questionsAnswered + "ฟักไข่ต่อ!" button. Appears before tapping phase when active creature has adventures. Build ✅ 2026-06-15.
- [ ] **ECA-5: Shop + Mission egg presence** — Small egg canvas in corner of GameShop.jsx and future missions. Low priority after adventure modes.

### Phase E — Shop Stretch (after play validation with Chopin)

- [ ] Review Shop Core with Chopin — confirm fun before expanding
- [ ] Add Shop Stretch (quantity difference + price concept) — only after Core mastery signal observed in play data
- [ ] Add mastery-gated stretch unlock UI ("เก่งมาก! มีภารกิจท้าทายเล็ก ๆ")

### Content expansion (after Phase D + E)

- [x] **Subject Readiness Report display** — `SubjectReadiness` component in Report.jsx; `computeReadiness()` derived from `sessionLog` at render time; 4 states (แข็งแรงมาก / กำลังมั่นใจ / กำลังสำรวจ / ยังไม่มีข้อมูลพอ); observation note "ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก".
- [ ] Cooking Mission MVP (after Shop Core + Stretch confirmed + Subject Readiness data available)
  - ⚠️ **Do not design Cooking Mission step sequence before consulting readiness data from real play.**
- [ ] Thai Levels 6+ (fruits, everyday objects, short sentences — อนุบาล → early ป.1)
- [ ] Math Levels 9+ (place value, counting to 100 — early ป.1 stretch)
- [ ] English Levels 5+ (longer sentences, basic comprehension)

---

## Later

### Content
- [ ] Expand Thai Level 3 animal words (20 → 30+)
- [ ] Add English Level 5+ (longer sentences, paragraph comprehension)
- [ ] Add Math Levels 9+ (ABC patterns, multiplication intro)

### Missions
- [ ] Shop Challenge layer (counting 6–10, more/less, simple change concept) — after Stretch validated
- [ ] Shop Mission variant 2 (different items: stationery / toy shop)
- [ ] Garden Mission MVP (after Cooking confirmed working)
- [ ] Garden daily-habit loop (gentle "plant grew" indicator on Home)
- [ ] Mission unlock cosmetic rewards (new egg pattern, creature color)
- [ ] Refactor to generic `MissionScreen.jsx` + `missionConfig.js` (after 2+ missions share same pattern)

### Features
- [ ] First-run onboarding flow (before ProfileModal is opened manually)
- [ ] Daily learning habit indicators
- [ ] Parent dashboard (protected route, separate from Report tab)
- [ ] PWA manifest + service worker (offline support)

### Infrastructure
- [ ] Per-session logging to Supabase `sessions` table
- [ ] Multi-child profiles (state shape refactor + `children` table)
- [ ] Payment integration (Omise or Stripe, 199 THB/month)
- [ ] Landing / marketing page

---

## Development Workflow (required every session that changes app code)

```
1. npm run build          → confirm zero errors before committing
2. git add <files>        → stage specific files (never git add -A blindly)
3. git commit             → meaningful message
4. git push origin main   → triggers Vercel auto-deploy
5. Open production URL    → verify the change is live and working
6. Update docs            → CURRENT_STATE, TASKS, CHANGELOG, CHATBOT_NOTES (same commit or next commit)
```

Vercel auto-deploys from every push to `main`. There is no manual deploy step.
Production URL: check `vercel.json` or Vercel dashboard for the live URL.

---

## Done

- [x] React migration (single-file HTML → React 18 + Vite)
- [x] Supabase auth (email/password) + cloud state sync; guest mode
- [x] LocalStorage always-on fallback
- [x] Procedural egg algorithm + 7-stage evolution (LOCKED)
- [x] Procedural creature drawing (Canvas)
- [x] Hatching animation + creature reveal; Collection page
- [x] Item system (food, star, ribbon, potion); XP boost; happiness decay
- [x] Tier system (6 tiers); calcCreatureStats(); creature battle stats
- [x] Minigames: EggRun, EggCatch, EggMemory, EggTower, EggFishing
- [x] Battle system (Pokémon-style animation + turn log)
- [x] Challenger system (every 15 battle rounds) + ChallengerOverlay
- [x] AI_OPPONENTS tiers 0 and 1 (with normal/mini-boss/boss entries)
- [x] Thai: 5 levels; English: 4 levels
- [x] Math: 9 levels (L0 Foundation, L1–L5 add/sub/mixed, L6 word, L7 comparison, L8 pattern)
- [x] Math visual models: objects (L1/L2), tenFrame (L3), crossOut (L4), dots (L5+)
- [x] Math PATTERN_SETS + pattern question type (emoji sequence + AB completion)
- [x] Math Foundation mode (count emoji, grade-0 only, no timer, foundationComplete flag)
- [x] MATH_WORDS 16 → 30 (joining, taking-away, comparison types)
- [x] Teach overlay, GameHeader, level mastery EMA, hint systems
- [x] Content expansion (Thai 24 words, CVC 24 words)
- [x] Bug fixes: Eng Level 3 unlock, CVCGame confetti, GameMath Play Again
- [x] Fanfare (≥90%) consistent across all subjects
- [x] Migrate hosting Netlify → Vercel; phonics audio → static .m4a files
- [x] Parent Report page (time, accuracy, subject breakdown, AI insights)
- [x] Project docs system (docs/ folder, CLAUDE.md, AI_SYSTEMS.md, CHATBOT_NOTES handoff workflow)
- [x] **Phase 1 UX**: replace alert() with showToast(); ProfileModal with name + grade; SET_PROFILE action
- [x] **Phase 2 UX**: sound toggle persists via `kq_sound` localStorage key; XpBoostBadge countdown in Home header
- [x] **Phase 3**: AI_OPPONENTS tiers 2–5 added; grade→tier mapping fixed in StateContext (was hard-capped at tier 1)
- [x] Vision + scope documentation (PROJECT.md, VISION.md, GOALS.md, scope guardian mandate)
- [x] Math research reorganized into topics/curriculum/learning-path/categories structure
- [x] **Mission system designed**: shop, cooking, garden missions documented in docs/research/missions/
- [x] **Phase C: Shop Mission MVP** — `GameShop.jsx` (4 phases / 6 Qs), `shopV1` state, `UPDATE_SHOP_V1` reducer, shop card in Home, `world === 'shop'` routing. Build passes.
- [x] **Phase D: Play Observation System** — `sessionLog` ring buffer (50 entries), `shopV1` extended (totalHints/totalDuration/phaseStats), `LOG_SESSION` reducer, dispatched from all 8 game result points, Mission Analytics card in Report, play history timeline replaces peer-comparison card.
