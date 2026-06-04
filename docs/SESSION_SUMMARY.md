# Session Summary — 2026-06-04 (Battle Feel Philosophy Design)

**Session type:** Documentation / design only. No code changes. No build.

**Files changed:**
- `docs/research/gameplay/battle-feel-philosophy.md` — NEW. Full design doc.
- `docs/RESEARCH_INDEX.md` — Gameplay section updated.
- `docs/GPT_NOTES.md` — Battle Feel Philosophy section added.
- `docs/TASKS.md` — PSLB-0 (feel baseline) added before PSLB-1; Battle Feel task marked done.
- `docs/CHANGELOG.md` — New entry appended.
- `docs/GPT_HANDOFF.md` — Latest session updated.
- `docs/SESSION_SUMMARY.md` — This file.

**Core design decisions:**

**1. Player HP removed.**
The egg never loses HP. No game over. No losing. Wrong answers cause misses, slow progress, and enemy reactions — but the egg is never in danger. Emotional message: mistakes are safe. The egg is always with you. This is not a weakness; it is correct design for a 5-year-old learner.

**2. Wrong answer = miss, not punishment.**
No ❌ banner. No harsh buzzer. No HP loss. "โจมตีพลาด!" in the battle log + soft fizzle + enemy reacts. Battle continues immediately.

**3. Anticipation sequence before content.**
10-step tap-to-result chain: tap → pulse → charge → egg lunge → elemental burst → enemy flash → camera shake → HP drain → damage float → combo/victory check. Total ≤ 1000ms. CSS-driven. Implement this baseline BEFORE adding Math/Thai/English content (PSLB-0 before PSLB-1).

**4. Combo system: streak → crit.**
Streak 2 = gold glow. Streak 3 = screen flash. Streak 4+ = critical hit (×1.5 damage, ascending fanfare, large damage number). Combo resets gracefully on miss.

**5. Victory must feel amazing.**
Enemy fades → stars → confetti → fanfare → egg celebrates → XP progress appears. This is the emotional peak of the learning loop.

**Implementation priority defined:**
Battle Feel baseline (PSLB-0) → Math content (PSLB-1) → Thai (PSLB-2) → English (PSLB-3) → polish pass (PSLB-4/5).

**5 open questions before implementation:**
1. 2×2 grid vs. horizontal row for move panel
2. Damage number above enemy vs. center screen
3. Enemy counter every-3-misses vs. every-N-turns
4. Combo reset rules between sessions
5. New `playTone()` naming for battle sounds
