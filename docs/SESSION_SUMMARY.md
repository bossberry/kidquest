# Session Summary — 2026-06-04 (Creature stats documentation)

**Session type:** Documentation only. No code changes. No build.

**Files created/changed:**
- `docs/research/battle/creature-stats.md` — new (created)
- `docs/RESEARCH_INDEX.md` — Battle section added
- `docs/GPT_NOTES.md` — Creature Stat Design Philosophy section added
- `docs/TASKS.md` — creature stats doc task marked done
- `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated

## What was documented

`docs/research/battle/creature-stats.md` is the source-of-truth for creature stat design philosophy.

Covers:
1. Design philosophy — creatures feel different (style), never broken (viability), every creature is battle-viable
2. Why one-subject-one-stat fails — punishes subject preference, creates stat locks (ATK=0 for Thai-only learner)
3. Weighted stat philosophy — every subject contributes to every stat; style via weighting, not ownership; 40% base floor prevents 0 stats
4. Learning profile inputs — thaiShare, mathShare, engShare, avgAccuracy, avgMastery, streakBonus, basePower
5. Example weightings — HP (Thai-weighted), ATK (Math-weighted), DEF (Thai-weighted), SPD (English-weighted), CRIT (Math+English balanced)
6. Personality variation — ±10% max, deterministic from XP seed, creates personality without breaking viability
7. Migration philosophy — safe recalculation when stat is 0/NaN; never delete eggs
8. Explicit non-goals — no AI, no random rerolls, no pay-to-win, no subject punishment
9. Future battle scaling — rarity/tier/equipment/evolution may extend stats; learning profile always remains the foundation
10. Open questions — HP design, explicit accuracy/mastery inputs, streak multipliers, stat range cap, AI opponent formula alignment

## Open questions for implementation

| Question | Status |
|----------|--------|
| Should HP be purely basePower-derived? | 🔵 Open |
| Should accuracy/mastery be explicit stat inputs? | 🔵 Open |
| Should streaks affect stats directly (not just XP)? | 🔵 Open |
| What is the max readable stat range? | 🔵 Open |
| Should AI opponents use the same formula? | 🔵 Open |
