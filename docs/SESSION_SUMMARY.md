# Session Summary — 2026-06-04 (Egg Companion Adventure Design)

**Session type:** Documentation / design only. No code changes. No build.

**Files changed:**
- `docs/research/gameplay/egg-companion-adventure.md` — NEW. Full design doc for Egg Companion Adventure system.
- `docs/RESEARCH_INDEX.md` — Added Gameplay section.
- `docs/GPT_NOTES.md` — Added Egg Companion Adventure Philosophy section.
- `docs/TASKS.md` — Design task marked done; ECA implementation queue (ECA-MVP-1 through ECA-5) added.
- `docs/CHANGELOG.md` — New entry appended.
- `docs/SESSION_SUMMARY.md` — This file.

**Core design decision:**
The egg is the companion, not a progress bar. The child takes their egg on adventures — it reacts to correct/wrong answers, grows visibly, and hatching feels like a relationship payoff. The design reframes every existing activity without changing any mechanics.

**MVP recommendation:**
1. DefenseMode: replace generic 🥚 placeholder with child's actual current egg canvas (one prop change, highest emotional impact).
2. BattleMode: add egg portrait beside player with adv-jump on correct (CSS already exists).
3. Relationship data: `adventuresWith` + `questionsAnswered` + `eggStartDate` fields on egg object — show as biography at hatch.

**Key constraints preserved:**
- eggAlgorithm.js: NOT touched. Egg visual uses existing drawEgg() only.
- No egg HP / health from wrong answers. Egg never in danger.
- No XP numbers during gameplay. Progress shown post-session only.
- No new reward economy.

**5 open questions sent to GPT:**
1. Should egg react differently by subject (color/tone)?
2. Should the child name the egg at creation?
3. Hatch biography before or after creature reveal?
4. Companion framing explicit in text or implicit in visuals?
5. Should `adventuresWith` count sessions or rounds?
