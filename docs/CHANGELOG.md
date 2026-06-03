# Changelog — KidQuest

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
