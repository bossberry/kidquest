# Tasks — KidQuest

## Now

### ⚡ KidQuest World — Design Phase (2026-06-09)

_Philosophy shift triggered by real playtesting. Chopin said "boring" and "not like a game." Game-first model replaces subject-first model. All items below must be designed before any code starts._

- [x] **KidQuest World design doc** — `docs/research/world/kidquest-world.md` created. Covers: philosophy shift, emotional center, high-level loop, Egg Home, World Map, exploration, battle role, learning philosophy, MVP scope, open questions. GPT_NOTES.md updated. 2026-06-09.
- [ ] **GPT: Answer 10 open questions for KidQuest World** — See `docs/GPT_NOTES.md` → KidQuest World. Must answer before any code: (1) Egg Home layout, (2) World entry MVP, (3) Encounter trigger on mobile, (4) Subject assignment in encounters, (5) XP sources, (6) Minigame repurposing, (7) Creature companion in Home, (8) Boss battle consequences, (9) Egg naming?, (10) Session length. Write answers to `GPT_NOTES.md`.
- [x] **Egg Home screen design** — `docs/research/world/egg-home.md` created. Layout spec (390px), interaction system (pet/feed/ribbon/potion/star), mood states, stage progression, creature companion, return loop motivators, MVP scope, 10 open questions for GPT. GPT_NOTES.md updated. 2026-06-09.
- [ ] **GPT: Answer 10 open questions for Egg Home** — See `docs/GPT_NOTES.md` → Egg Home Design. Must answer before Egg Home code: (1) egg naming, (2) mood indicator style, (3) return frequency/notifications, (4) creature dialogue, (5) desire indicator, (6) hatch moment, (7) egg-in-battle framing, (8) ambient sound, (9) creature permanence, (10) multiple creatures in Home.
- [ ] **World Map screen design** — After Egg Home decided: design the Green Meadow region. Screen grid layout (3×3 or 5×5), tile types, encounter probability map, asset style, mobile navigation (D-pad vs tap). Write to `docs/research/world/world-map.md`.
- [ ] **Encounter + transition design** — How does exploration → battle → return work? Entry animation, exit animation, state preservation (player position). Write to `docs/research/world/encounter-system.md`.

### KidQuest World — Implementation Queue (after design phase complete)

_Do NOT begin any of these until GPT answers the open questions and design docs are written._

- [x] **EggHome.jsx** — `Home.jsx` fully replaced with Egg Home MVP. Large egg (190×225px) at center, idle float animation. Pet interaction: tap→chirp+sparkle+hearts; streak 3→happy spin; streak 6→sleepy. Item tray: food/ribbon/potion/star with counts, tap-twice-to-use. Reunion burst on first visit or after >4h gap. Creature companion walks after first hatch. Action row: ลูบไข่/คอลเลกชัน/ออกสำรวจ. All subject/score/Adventure Director UI removed. New state: `lastHomeVisit`. New actions: `UPDATE_LAST_HOME_VISIT`. New SFX: `chirp`, `sparkle`, `jingle`, `feed`. Build ✅ 2026-06-09.
- [ ] **WorldMap.jsx** — Screen-based region navigation. Green Meadow only (Year 1). Screen state, movement, encounter triggers.
- [ ] **ExplorationEngine** — Encounter probability, event dispatch, item drops, state for picked-up treasures.
- [ ] **Update routing** — `App.jsx` routing updated for new screens (eggHome, world, explore).
- [ ] **State: exploration fields** — `currentRegion`, `currentScreen`, `pickedUpTreasures[]` added to `defaultState()`.

---

- [x] **Home 2.0 — Adventure Director** — `Home.jsx` rewritten: single `⭐ ผจญภัยต่อ` recommendation card (deterministic: hatch → shop first run → weakest subject); minigames 2×2 grid replaced with `🎁 เซอร์ไพรส์วันนี้` single event rotation (date-hash from unlocked minigames; sessionLog marks played-today). Bug fixes: Report NaN for avgScore/avgDur/avgHints (safe migration defaults). Build ✅.
- [x] **Egg economy source-of-truth doc** — `docs/research/rewards/egg-economy.md` created; RESEARCH_INDEX.md updated; GPT_NOTES.md updated with economy decisions.
- [x] **Observation philosophy source-of-truth doc** — `docs/research/observation/observation-philosophy.md` created. Covers: observe→understand→design loop, children are not their level, positive interpretation, important vs. dominating signals, Subject Readiness as observation not label, parent report philosophy (no anxiety), mission follows child, explicit non-goals (no AI/ranking/manipulation), system relationships, 5 open questions. RESEARCH_INDEX.md, GPT_NOTES.md updated.
- [x] **Gameplay loop source-of-truth doc** — `docs/research/progression/gameplay-loop.md` created. Highest-level philosophy document. Covers: core loop (learn→battle→learn), Home as Adventure Director (not a menu), replay philosophy, surprise philosophy, minigame philosophy, intrinsic motivation, child autonomy, explicit non-goals, system relationships, 5 open questions. RESEARCH_INDEX.md, GPT_NOTES.md updated.
- [x] **Battle progression source-of-truth doc** — `docs/research/battle/battle-progression.md` created. Covers: core loop (learn→battle→learn), battle as reward not primary game, creature philosophy, enemy scaling (gentle, Challenger every 15 rounds), loss philosophy (no permanent penalties), reward design, frequency (self-directed), non-goals, future features, relationships to other systems, 5 open questions. RESEARCH_INDEX.md, GPT_NOTES.md updated.
- [x] **Subject progression source-of-truth doc** — `docs/research/progression/subject-progression.md` created. Covers: core philosophy (subjects primary, missions secondary), progression flow, unlock thresholds (70/80/90), replay always valid, mastery = confidence not perfection, subject independence, stretch/challenge layers, readiness vs. highest level, non-goals, future grades. RESEARCH_INDEX.md, GPT_NOTES.md updated.
- [x] **Creature stats source-of-truth doc** — `docs/research/battle/creature-stats.md` created. Covers: weighted stat philosophy, why one-subject-one-stat is bad, example weightings (HP/ATK/DEF/SPD/CRIT), personality variation (±10% deterministic), migration rules, non-goals, future scaling. RESEARCH_INDEX.md, GPT_NOTES.md, TASKS.md updated.
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
- [ ] **Play Math Battle with Chopin** — Is the battle mode more engaging? Does Chopin prefer it over normal Math? How many questions feel right (8)? Report to GPT_NOTES.md.
- [ ] **Play Shop Mission with Chopin** — validate fun and timing before expanding. Target: 2–3 min, 80% pass on first or second run.
- [ ] **D0: Home UX audit** — review simplified Home with Chopin. Does Continue Adventure feel like the obvious action? Does the "อยากเลือกเอง?" toggle feel discoverable?
- [x] **Egg Companion Adventure design doc** — `docs/research/gameplay/egg-companion-adventure.md` created. Covers: egg as emotional companion (not just progress bar), companion framing per mode (DefenseMode highest impact), visual/audio/progress spec, relationship data fields (adventuresWith/questionsAnswered/daysTogetherCount/favoriteSubject), MVP recommendation, 5 open questions for GPT.
- [x] **Pokémon-Style Learning Battle design doc** — `docs/research/gameplay/pokemon-style-learning-battle.md` created. Battle-first design: answer choices ARE attack moves. Move panel anatomy, subject-specific encoding (Math=numbers, Thai/English=emoji+TTS), full animation/audio spec, session structure, scope check. MVP: Math first → Thai → English. 5 open questions for GPT.

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
- [x] **GPT_NOTES.md updated** — Subject Readiness decisions recorded.

### Pokémon-Style Learning Battle — Implementation Queue (designed 2026-06-04)

_Spec: `docs/research/gameplay/pokemon-style-learning-battle.md` + `docs/research/gameplay/battle-feel-philosophy.md`. Implement only after GPT answers open questions._

- [x] **Battle Feel Philosophy** — `docs/research/gameplay/battle-feel-philosophy.md` created. Defines: player HP removal, miss-not-punishment philosophy, 10-step anticipation sequence, combo system, victory sequence, sound/animation philosophy, screen layout, implementation priority (feel before content). Required reading before PSLB-1.
- [x] **Battle Feel Polish Pass (docs)** — `pokemon-style-learning-battle.md` updated to align with Battle Feel Philosophy. Removed: player HP bar, defeat screen, gentle defeat, losing states, every-3-wrong counter-attack. Changed: wrong answer = miss → fizzle → enemy taunts → continue. Move names reduced to tiny flavor text (icons + answers are primary). Battle log: short only. Open question 3 (player HP) resolved: removed.
- [x] **PSLB-0: Battle Feel Baseline** — Anticipation sequence implemented in MoveSelectBattleMode: tap → card pulse → egg charge → egg lunge → hit/miss effects. CSS keyframes. Total ≤ 1000ms. Build ✅.
- [x] **PSLB-1: Math Move-Select Battle** — `MoveSelectBattleMode.jsx` created. Move panel: 4 cards showing `[element icon] [number]` + tiny move name. Correct = attack fires + enemy flash + HP drain + damage float. Wrong = miss fizzle. Build ✅.
- [x] **PSLB-2: Thai Move-Select Battle** — Same shell. `genThaiMoveQ()` returns emoji choices instead of letter choices. TTS fires on panel load. Move cards show `[element icon] [emoji]`. Build ✅.
- [x] **PSLB-3: English Move-Select Battle** — Same shell. `genEngMoveQ()` returns emoji choices. TTS via `speakEn`. Build ✅.
- [x] **PSLB-4: Animation polish** — `move-pulse`, `egg-charge`, `miss-fizzle`, `enemy-defeat`, `crit-flash` keyframes added. Combo glow ring on egg. Damage float. Hit flash on enemy. Build ✅.
- [x] **PSLB-5: New audio tones** — `miss` (soft fizzle), `combo` (rising chime), `ultimate` (power fanfare) added to `playTone()`. Build ✅.

### Egg Companion Adventure — Implementation Queue (designed 2026-06-04)

_Spec: `docs/research/gameplay/egg-companion-adventure.md`. Implement only after GPT answers open questions._

- [x] **ECA-MVP-1: DefenseMode egg replacement** — EggCanvas replaces `babyEmoji` in `DefenseMode.jsx`. Egg bounces (`eggBounce`) on shield-block, shakes (`eggShake`) when shield is hit. Sparkle `item` tone 200ms after correct. Build ✅ 2026-06-04.
- [x] **ECA-MVP-2: BattleMode egg companion** — EggCanvas replaces `🦸` player in `BattleMode.jsx`. Egg jumps + golden glow + `✨` sparkle float on correct; shakes on enemy counter-attack; continuous `egg-near-hatch` pulse/glow when stage ≥ 5. Egg growth progress bar shows below battle log with stage name + %. Sparkle `item` tone 200ms after every correct answer. Build ✅ 2026-06-04.
- [x] **ChaseMode egg companion** — EggCanvas replaces `🦸` runner in `ChaseMode.jsx`. Egg dashes (`adv-dash`) on correct. Sparkle tone. Build ✅ 2026-06-04.
- [ ] **ECA-MVP-3: Relationship data fields** — Add `adventuresWith`, `questionsAnswered`, `eggStartDate` to egg object in `defaultState()`. Increment in `ADD_XP` reducer. Non-breaking (defaults 0/null). No migration needed.
- [ ] **ECA-3: Post-session egg moment** — Show egg portrait + growth text on session result screens when XP was added. "ไข่ของเราโตขึ้นนะ!" / "อีกนิดเดียวก็ฟักแล้ว!" (stage 5–6). Requires ECA-MVP-3.
- [ ] **ECA-4: Hatch biography summary** — Show relationship data on hatch overlay: "ผจญภัยด้วยกัน N ครั้ง, ตอบคำถาม N ข้อ". Requires ECA-MVP-3. Add as second phase in HatchOverlay before creature reveal.
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
6. Update docs            → CURRENT_STATE, TASKS, CHANGELOG, GPT_HANDOFF (same commit or next commit)
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
- [x] Project docs system (docs/ folder, CLAUDE.md, AI_SYSTEMS.md, GPT_HANDOFF workflow)
- [x] **Phase 1 UX**: replace alert() with showToast(); ProfileModal with name + grade; SET_PROFILE action
- [x] **Phase 2 UX**: sound toggle persists via `kq_sound` localStorage key; XpBoostBadge countdown in Home header
- [x] **Phase 3**: AI_OPPONENTS tiers 2–5 added; grade→tier mapping fixed in StateContext (was hard-capped at tier 1)
- [x] Vision + scope documentation (PROJECT.md, VISION.md, GOALS.md, scope guardian mandate)
- [x] Math research reorganized into topics/curriculum/learning-path/categories structure
- [x] **Mission system designed**: shop, cooking, garden missions documented in docs/research/missions/
- [x] **Phase C: Shop Mission MVP** — `GameShop.jsx` (4 phases / 6 Qs), `shopV1` state, `UPDATE_SHOP_V1` reducer, shop card in Home, `world === 'shop'` routing. Build passes.
- [x] **Phase D: Play Observation System** — `sessionLog` ring buffer (50 entries), `shopV1` extended (totalHints/totalDuration/phaseStats), `LOG_SESSION` reducer, dispatched from all 8 game result points, Mission Analytics card in Report, play history timeline replaces peer-comparison card.
