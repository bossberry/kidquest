# Session Summary — 2026-06-04 (Pokémon-Style Learning Battle Design)

**Session type:** Documentation / design only. No code changes. No build.

**Files changed:**
- `docs/research/gameplay/pokemon-style-learning-battle.md` — NEW. Full design doc.
- `docs/RESEARCH_INDEX.md` — Gameplay section updated.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section added.
- `docs/TASKS.md` — Design task marked done; PSLB-1 through PSLB-5 implementation queue added.
- `docs/CHANGELOG.md` — New entry appended.
- `docs/GPT_HANDOFF.md` — Latest session updated; Claude Code / GPT next steps updated.
- `docs/SESSION_SUMMARY.md` — This file.

**Core design decision:**
This is battle-first design — answer choices ARE attack moves. The child feels "I choose a move to help my egg win," not "I answered a question and saw an animation." The learning is invisible inside the move mechanic.

**Move-Select Panel:**
Each button shows: `[emoji icon] [move name] ... [answer content]`. For Math: the number IS the answer (correct number = that move fires). For Thai/English: the emoji IS the answer (TTS word → tap matching emoji move).

**MVP recommendation:**
1. PSLB-1: Math Move-Select Battle — numbers in move panel; implement as new `MoveSelectBattleMode.jsx` replacing BattleMode in Subject Adventure for Math subject.
2. PSLB-2: Thai Battle — same shell, emoji options + TTS.
3. PSLB-3: English Battle — same shell, emoji options + TTS.

**Key constraints preserved:**
- Same battle shell for all subjects (one component, content injected per subject).
- Reuses existing BattleMode HP/enemy/EggCanvas patterns — no new unique mechanic.
- EggAlgorithm.js NOT touched. Egg companion reactions reuse existing keyframes.
- Wrong answer = miss/fizzle, not punishment. No harsh buzzer.
- Year 1 scope: uses only existing Math/Thai/English content from current levels.

**5 open questions sent to GPT:**
1. Correct move = consistent damage vs. most damage (strategy vs. pure learning)?
2. Enemy counter on wrong × 3 only vs. every N turns regardless?
3. Player HP bar — adds stakes or unwanted pressure for age 5?
4. Move names random per turn or loosely subject-themed?
5. Replace BattleMode in Subject Adventure entirely, or keep both?
