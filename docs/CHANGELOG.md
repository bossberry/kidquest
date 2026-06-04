# Changelog — KidQuest

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
