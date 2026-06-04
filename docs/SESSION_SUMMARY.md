# Session Summary — 2026-06-04 (Egg economy documentation)

**Session type:** Documentation only. No code changes. No build.

**Files created/changed:**
- `docs/research/rewards/egg-economy.md` — new (created)
- `docs/RESEARCH_INDEX.md` — Rewards & Economy section added
- `docs/GPT_NOTES.md` — Egg Economy Decisions section added
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated

## What was documented

`docs/research/rewards/egg-economy.md` is the source-of-truth for all egg progression mechanics.

Covers:
1. Core loop (Learn → XP → Egg → Hatch → Creature → Battle → Learn)
2. Design philosophy — first egg fast, later eggs meaningful, no FOMO, no streak pressure
3. Scaling formula `min(800, 120 + n×60)` — table of first 12+ eggs with XP and answer counts
4. First-time experience target (hatch within first session, ~15 correct answers)
5. Later pacing rationale (collection should feel earned, replay stays rewarding)
6. Visual stage system — how `scaledEggProgress` maps to 7 visual stages proportionally
7. XP sources table (8 base, +5 streak, potion +20, star ×2)
8. Migration rules (locked files, never delete eggs, stat recalculation conditions)
9. Implementation reference (key files, `scaledEggProgress` return shape, state fields)
10. Open questions — most resolved by implementation, two still open for GPT

## Status of implementation questions

| Question | Status |
|----------|--------|
| Where is egg progress calculated? | ✅ `scaledEggProgress()` in StateContext.jsx |
| Is hatch hardcoded at 350 XP? | ✅ No — replaced with dynamic formula |
| How does progress migrate after change? | ✅ Recomputed on next ADD_XP |
| How does UI show requiredXP? | ✅ `xpPerStage` in Home.jsx |
| Should first egg use separate onboarding rule? | 🔵 Open — current 120 XP may be sufficient |
| Should egg collection have a cap? | 🔵 Open — not needed for Year 1 |
