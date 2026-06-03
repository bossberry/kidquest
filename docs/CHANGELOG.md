# Changelog — KidQuest

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
