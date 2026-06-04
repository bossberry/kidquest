# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-04 (Battle learning special move)_

**AI System:** GPT (research/curriculum/product) → `GPT_NOTES.md` → Claude Code (implementation) → `GPT_HANDOFF.md` → GPT. Claude Chatbot reads both sides for review. Chat history is NOT source of truth. See `docs/AI_SYSTEMS.md`.

---

## Project Vision (read this first)

**KidQuest grows with Chopin over many years.** It does not attempt to build a complete K-6 platform from day one.

**Golden Rule:** Build one mastery level ahead. Never six years ahead.

**Year 1 scope:** Kindergarten core + Early Grade 1 stretch only.

**Success metric:** Chopin voluntarily plays KidQuest and learns through it. Not feature count. Not grades covered. Joyful learning.

**All AI systems are scope guardians.** Warn before implementing anything that violates the Golden Rule, Year 1 scope, or stable engine philosophy. See `VISION.md` for full mandate.

---

## Latest Session Summary

**What changed this session (Battle learning special move — code change):**

- `src/components/BattleScreen.jsx` — Learning-based special move added. Before each battle a question appears: "⚡ ตอบถูก ปล่อยท่าพิเศษ!" with 4 tap-target buttons + skip link. `pickBattleQuestion(sessionLog)` selects subject from most-played recent sessions (most comfortable readiness signal). Falls back to simple Math (1+1 to 4+4) when no session data. Correct → `specialDmg = ceil(opponent.HP × 0.25)`, brief "🔥 ท่าพิเศษพร้อมแล้ว!" feedback, battle starts; special attack fires FIRST (⚡ text + 5-note ascending 'special' SFX + gold damage float + hit flash). Enemy HP re-simulated from reduced starting HP so win condition is correctly earned. Wrong/skip → "💪 สู้ต่อไปนะ!" feedback, battle continues normally — no penalty. One question per battle only. Also added 'special' sound type. Bonus fix: ATK/DEF lose-screen advice text was showing wrong subjects (was Thai→ATK, Math→DEF; now correctly Math→ATK, Thai→DEF per calcCreatureStats formula).
- Build: ✅ zero errors. Commit: d3ef85c.

**What changed last session (Battle balance and sound — code change):**

- `src/config/gameConfig.js` — AI_OPPONENTS rebalanced. Enemy HP ×4 (regular/miniboss) and ×3.5 (boss). Enemy ATK ×2.5 across all 6 tiers. Result: Tier 0 regular battles now last ~7 turns (was 2). Bosses ~14 turns (was 4). Player still usually wins but takes meaningful HP damage. DEF kept unchanged.
- `src/components/BattleScreen.jsx` — Battle SFX fixed and improved. Added `import { getSoundOn, getACtx }` from audio.js. `playBattleSound` now checks `getSoundOn()` (respects sound toggle) and reuses shared AudioContext (no more per-call context leak). Sound types: `attack` (sword-swing whoosh), `hit` (3-layer impact), `crit` (4-tone ascending), `win` (6-note fanfare), `lose` (gentle 4-tone descent).
- Build: ✅ zero errors.

**What changed last session (Battle Home experience — code change):**

- `src/components/BottomNav.jsx` — ⚔️ badge removed from Collection tab entirely.
- `src/App.jsx` — `challengerOpen` state lifted from ChallengerOverlay; useEffect fires when `pendingChallenger` set; props wired to ChallengerOverlay and Home.
- `src/components/ChallengerOverlay.jsx` — internal visible state replaced by `open`/`onClose` props.
- `src/components/Home.jsx` — battle added to Adventure Director priority (hatch → battle → shop → weakest subject). When `pendingChallenger` exists: dark gradient card with challenger emoji + "มอนสเตอร์ปรากฏตัว!" — tap opens ChallengerOverlay.
- Build: ✅ zero errors.

**Previous session (Shop Mission speech feedback — code change):**

- `src/games/GameShop.jsx` — `speakTh`/`speakEn` imported. `THAI_NUMS` array added. After each correct answer: Thai → speak Thai word (380ms delay); English → speak English word (380ms); Math/counting → speak Thai number word (หนึ่ง/สอง/สาม...). Social phrase question speaks the child's actual choice (ขอบคุณครับ or ขอบคุณค่ะ). All existing tones preserved. Sound toggle respected via `_soundOn` inside speak functions.
- `docs/research/progression/gameplay-loop.md` — "Learning Feedback Principles" section added: visual/sound/speech pattern, principles, implementation status table, what to avoid.
- `docs/GPT_NOTES.md` — Learning Feedback Principles section added.
- Build: ✅ zero errors.

**Previous session (Home UI simplification — code change):**

- `src/components/Home.jsx` — subject cards made collapsible: "หรือเลือกเรียน" static label → "อยากเลือกเอง?" toggle button (closed by default). Shop Mission permanent card removed. Visual hierarchy now: Egg → Continue Adventure (large) → "อยากเลือกเอง?" toggle → Egg Run → Surprise Event → Stats.
- Shop still reachable via Continue Adventure recommendation (triggers when `shopV1.runs === 0`).
- All game logic, minigame code, and recommendation logic unchanged.
- Build: ✅ zero errors.

**Previous session (Observation philosophy documentation — docs only):**

- `docs/research/observation/observation-philosophy.md` — created. Covers: observe→understand→design loop, children are not their level (behavior > history), positive interpretation (replay = confidence-building), important signals vs. signals that must not dominate (no speed/streaks/rankings), Subject Readiness as observations not labels, parent report philosophy (no anxiety/grades/fear), mission follows child (deterministic design iteration not AI), non-goals (no AI tutoring/adaptive engines/manipulation/addiction optimization), system relationships, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Observation section added.
- `docs/GPT_NOTES.md` — Observation Philosophy section added.
- No code changes. No build.

**Previous session (Gameplay loop documentation — docs only):**

- `docs/research/progression/gameplay-loop.md` — highest-level philosophy document created. Covers: Home as Adventure Director (answers "what next?", not "what do you choose?"), core loop (learn→battle→learn, learning always upstream), replay philosophy (healthy/full XP), surprise philosophy (rare=special, daily date-hash rotation), minigame philosophy (rewards not primary game, one daily > 2×2 grid), intrinsic motivation (curiosity/collection/surprise/progress/mastery; no FOMO/streak/time pressure), child autonomy (suggest not force), explicit non-goals, system relationships (this doc is highest-level), 5 open questions.
- `docs/RESEARCH_INDEX.md` — gameplay-loop.md added, marked highest-level philosophy.
- `docs/GPT_NOTES.md` — Gameplay Loop Philosophy section added.
- No code changes. No build.

**Previous session (Battle progression documentation — docs only):**

- `docs/research/battle/battle-progression.md` — source-of-truth created. Covers: core loop (Learn→XP→Egg→Hatch→Creature→Battle→Learn), battle as reward not primary game, creature philosophy (every creature usable), gentle enemy scaling, Challenger every 15 rounds, loss philosophy (no permanent penalties), reward design, self-directed frequency, non-goals (no PvP/leaderboards/pay-to-win/gacha/energy), future features (evolution/equipment/rarity/bosses), system relationships, known BattleScreen text bug (ATK advice still says Thai not Math), 5 open questions.
- `docs/RESEARCH_INDEX.md` — battle-progression.md entry added.
- `docs/GPT_NOTES.md` — Battle Progression Philosophy section added.
- No code changes. No build.

**Previous session (Subject progression documentation — docs only):**

- `docs/research/progression/subject-progression.md` — source-of-truth created. Covers: core philosophy (subjects primary, missions secondary), unlock thresholds (70 soft pass / 80 unlock / 90 mastery), replay always valid with full XP, mastery = confidence not perfection, stretch/challenge optional layers, subject independence, readiness vs. highest unlock, non-goals, future grade roadmap, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Progression section added.
- `docs/GPT_NOTES.md` — Subject Progression Philosophy section added.
- No code changes. No build.

**Previous session (Creature stats documentation — docs only):**

- `docs/research/battle/creature-stats.md` — source-of-truth created. Covers: design philosophy (every creature battle-viable), why one-subject-one-stat fails (ATK=0 for Thai-only learner), weighted formula with 40% base floor, example weightings for HP/ATK/DEF/SPD/CRIT, personality variation (±10% deterministic from XP seed), migration rules (recalc on 0/NaN, never delete eggs), explicit non-goals (no AI, no rerolls, no pay-to-win), future scaling (learning profile always the foundation), 5 open implementation questions.
- `docs/RESEARCH_INDEX.md` — Battle section added.
- `docs/GPT_NOTES.md` — Creature Stat Design Philosophy section added.
- No code changes. No build.

**Previous session (Egg economy documentation — docs only):**

- `docs/research/rewards/egg-economy.md` — source-of-truth created. Covers: core loop, design philosophy (no FOMO, no streak pressure, first egg fast), scaling formula table, visual stage system, XP sources, migration rules, implementation reference, open questions.
- `docs/RESEARCH_INDEX.md` — Rewards & Economy section added.
- `docs/GPT_NOTES.md` — Egg Economy Decisions + open question for GPT re: first-egg onboarding threshold.
- No code changes.

**Previous session (Egg pacing + creature stat rebalance):**

### Egg progression pacing
- **`src/context/StateContext.jsx`** — `scaledEggProgress(state)` helper added. `required = min(800, 120 + hatchedEggs.length × 60)` — first egg 120 XP (fast), gradual to 800 cap. Dynamic `xpPerStage = required/7`. `ADD_XP` now uses `newTotal >= hatchRequired` for `readyToHatch`. `derived` useMemo uses `scaledEggProgress`; `eggStatsData.stage` overridden to scaled value so canvas matches display.
- **`src/components/Home.jsx`** — egg label uses dynamic `xpPerStage`; stage 6 shows "เกือบฟักแล้ว!" before hatch trigger.

### Creature stat rebalance
- **`src/config/gameConfig.js`** — `calcCreatureStats()` rewritten. Old: Thai=ATK, Math=DEF, Eng=SPD (exclusive, ATK=0 if no Thai). New: weighted formula — `ATK = base×(0.4 + 0.3×mShare + 0.2×eShare + 0.1×tShare)`. Every stat has 40% base floor, no stat can reach 0.
- **`src/lib/state.js`** — `_migrateEggs()` now recalculates stats if ATK/DEF/SPD is 0 or NaN.
- **Build: ✅ zero errors.**

**Previous session (Shop feedback + hatch overlay fix):**
- `GameShop.jsx`: wrong-button shake, streak fire messages. `HatchOverlay.jsx`: freeze fix + `suppressAutoOpen` prop. `App.jsx`: no mid-game hatch interruption.

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation, L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB)
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- **Shop Mission** (`GameShop.jsx`): 4 phases / 6 Qs. `shopV1` with extended analytics (totalHints, totalDuration, phaseStats). Shop card on Home.
- **Play Observation System** (Phase D): `sessionLog` ring buffer (50 entries), `replayedImmediately` auto-computed, Mission Analytics card in Report, play history timeline.
- **Subject Readiness** (Phase D+): `SubjectReadiness` component in `Report.jsx`. `computeReadiness()` derives state from last 10 `sessionLog` entries per subject at render time. 4 states with Thai labels. No new state fields.
- **Home 2.0 — Adventure Director**: Single recommendation card (⭐ ผจญภัยต่อ) + daily surprise event (🎁 เซอร์ไพรส์วันนี้). Replaces 2×2 minigame grid.
- **Shop Mission feedback polished**: wrong-button shake, streak fire messages, amber streak counter. `playTone` calls unchanged.
- **Hatch overlay stable**: freeze-after-hatch fixed; no longer auto-interrupts gameplay (`suppressAutoOpen` prop).
- **Egg pacing**: first egg 120 XP (fast onboarding), later eggs scale by `min(800, 120 + n×60)`. Visual progress and drawEgg canvas both use scaled stage.
- **Creature stats rebalanced**: weighted formula — every stat has 40% base floor. No stat can be 0. Deterministic ±5% personality variation. Migration recalculates broken (0/NaN) stats.
- Procedural egg + creature drawing on Canvas (egg algorithm LOCKED)
- Turn-based battle + learning special move (question before battle, correct → 25% bonus damage, wrong → no penalty); challenger system every 15 rounds; AI_OPPONENTS all 6 tiers
- 5 minigames (EggRun, EggCatch, EggMemory, EggTower, EggFishing)
- Supabase auth + cloud sync; full guest mode
- Parent Report: overview, subject time, strengths, Mission Analytics, Subject Readiness, play history

**Not done:** payment, landing page, multi-child, PWA, Cooking/Garden missions.

---

## Active Tasks

**Now (highest priority):**
- **Play Shop Mission with Chopin** — validate fun and 2–3 min timing. Which steps feel clear? Which feel hard or boring? Report back to `GPT_NOTES.md`.
- **D0: Shop card UX audit (updated)** — Now: test Home 2.0 with Chopin. Does the Adventure Director feel natural? Does Chopin tap the big recommendation card without prompting? Does the Surprise section delight or confuse? Write to `GPT_NOTES.md`.

**Phase E (after play validation):**
- Shop Stretch (quantity difference + price concept) with mastery-gate UI
- ⚠️ Shop Stretch is independent of Subject Readiness — proceed after play validation

**Phase F / Content expansion (after Phase E):**
- **Cooking Mission MVP** — ⚠️ Do not design step sequence before consulting Subject Readiness data from real play sessions.

---

## Home 2.0 Design Reference

**Adventure Director logic (`getRecommendation`):**
| Priority | Condition | Recommendation |
|----------|-----------|----------------|
| 1 | `state.readyToHatch && stage >= 6` | 🥚 ฟักไข่! |
| 2 | `shopV1.runs === 0` | 🏪 ร้านค้า (first time) |
| 3 | default | Subject with lowest XP |

**Surprise Event logic (`getSurpriseEvent`):**
- Filter: `['catch','memory','tower','fishing'].filter(id => eggsHatched >= MG_UNLOCK[id])`
- Pick: `unlocked[dateHash % unlocked.length]` — deterministic daily rotation
- Played check: `sessionLog.some(s => s.world === id && sameDay)`
- No new state fields

---

## Important Decisions

| Decision | Rule |
|----------|------|
| Egg algorithm | **LOCKED** — `eggAlgorithm.js` must not be modified |
| LocalStorage | Mandatory fallback — Supabase must never throw to user |
| Guest mode | Always works — full app without login |
| Child errors | Silent or friendly only — no stack traces |
| State blob | Full `state_json` in one Supabase row (not per-session rows) |
| Highest unlock level | **Not a readiness proxy** — use `sessionLog` derived Subject Readiness instead |
| Subject Readiness | Computed at render time from `sessionLog`. No new state. No AI. Now live in Report.jsx. |
| Mission content | Must follow readiness profile, not assumed level gates |
| Home 2.0 | Adventure Director: single recommendation + daily surprise. No 2×2 minigame grid. |

---

## Subject Readiness Reference

Computed from `sessionLog` per subject. Four states:

| State | Thai Label | Threshold |
|-------|------------|-----------|
| **Strong** | แข็งแรงมาก | avgScore ≥ 0.85 AND goodRuns ≥ 3 AND completionRate ≥ 0.80 (last 10 sessions) |
| **Comfortable** | กำลังมั่นใจ | avgScore ≥ 0.70 AND goodRuns ≥ 2 |
| **Exploring** | กำลังสำรวจ | Sessions exist but below Comfortable |
| **Not Ready** | ยังไม่มีข้อมูลพอ | No sessions for this world |

Full spec: `docs/research/observation/play-observation-system.md` → "Subject Readiness"

---

## Codebase Map (key files)

```
src/config/gameConfig.js        — ALL game content (~380 lines)
src/context/StateContext.jsx    — Global state + ACTIONS (includes LOG_SESSION, UPDATE_SHOP_V1)
src/lib/state.js                — defaultState() — sessionLog + shopV1 with analytics fields
src/components/Home.jsx         — Home 2.0: Adventure Director (rec card + surprise event)
src/components/Report.jsx       — Report: Overview + Subject time + Strengths + MissionAnalytics + SubjectReadiness + PlayHistory
src/games/GameShop.jsx          — Shop Mission 6 Qs — dispatches LOG_SESSION + extended UPDATE_SHOP_V1
src/games/GameThai.jsx          — Thai: useFinishRound dispatches LOG_SESSION
src/games/GameMath.jsx          — Math: dispatches LOG_SESSION in next() when done
src/games/GamePhonics.jsx       — English: all 4 game components dispatch LOG_SESSION
src/components/BattleScreen.jsx — Battle sim + animation
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
```

---

## Risks / Unknowns

- **`nextAction` in sessionLog is always `null`** — tracking post-result navigation requires a navigation event system. Deferred. Field exists in schema for future use.
- **Subject Readiness will show "ยังไม่มีข้อมูลพอ" for all subjects until Chopin plays** — expected. Labels update naturally.
- **Cooking Mission readiness dependency** — step sequence must not be designed until readiness data from real play is available.
- **Home 2.0 recommendation is always lowest-XP subject** — intentional for balance. May feel repetitive if Chopin wants to replay a preferred subject. Could add "last played" tie-breaker later if needed.
- **Surprise rotation with one unlocked game** — shows same game daily until a second is unlocked. Acceptable for now.
- **Egg pacing affects only new eggs** — existing players with old state see correct new pacing on their NEXT egg (current egg's readyToHatch is recalculated on next ADD_XP).
- **Battle special move question is random within subject** — no difficulty progression within the subject's question pool. Always picks from early-level content (simple letter match / 1+1 to 4+4 / letter-emoji match). This is intentional for now; always achievable by a 5-year-old.
- **Creature stats ~1.8× higher than before vs old enemies** — now resolved by the HP×4 / ATK×2.5 rebalance. Battles last 6–15 turns; player still favored but takes real HP damage.
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail in Supabase — all progress in one blob per user

---

## Recommended Next Work

**GPT — next:**
1. **Play Home 2.0 with Chopin** — does the Adventure Director feel natural? Does Chopin tap the big recommendation card? Does the Surprise section delight? Write to `GPT_NOTES.md`.
2. **Play Shop Mission with Chopin** — validate fun, timing, and which phases feel clear vs confusing. Write to `GPT_NOTES.md`.
3. **Shop Stretch design review** — is the quantity-difference question at the right Early Grade 1 level? Write to `GPT_NOTES.md`.
4. **Thai Levels 6–8 content** — fruits, everyday objects, short action sentences for อนุบาล/early ป.1. Write to `GPT_NOTES.md`.
5. **Math Levels 9–10 content** — place value, counting to 100, early ป.1 stretch. Write to `GPT_NOTES.md`.

**Claude Code — after play validation:**
1. Phase E: Shop Stretch implementation + mastery-gate UI
2. (Later) Cooking Mission MVP — only after Subject Readiness data from real play accumulates
