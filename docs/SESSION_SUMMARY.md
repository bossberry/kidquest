# Session Summary — 2026-06-04 (Egg pacing + creature stat rebalance)

**Files changed:** `src/context/StateContext.jsx`, `src/config/gameConfig.js`, `src/lib/state.js`, `src/components/Home.jsx`, `docs/`×4

## Part 1 — Egg Progression Pacing

**Old behavior:** Every egg required exactly 300–350 XP (fixed). All eggs felt the same. No progression sense.

**New formula:** `required = min(800, 120 + hatchedEggs.length × 60)`

| Egg | hatched count | Required XP | ~Correct answers (8 XP each) |
|-----|--------------|-------------|------------------------------|
| 1st | 0 | 120 XP | ~15 answers — first win quickly |
| 2nd | 1 | 180 XP | ~23 answers |
| 3rd | 2 | 240 XP | ~30 answers |
| 4th | 3 | 300 XP | ~38 answers |
| 5th | 4 | 360 XP | ~45 answers |
| 6th | 5 | 420 XP | ~53 answers |
| 12th+ | 11+ | 780–800 XP | ~100 answers (cap) |

**Design logic:**
- `scaledEggProgress(state)` in StateContext.jsx — pure helper, not in locked eggAlgorithm.js
- Dynamic `xpPerStage = required / 7` — egg visual stages scale with the same proportion
- `eggStatsData.stage` overridden so `drawEgg()` canvas matches the displayed progress (no visual mismatch)
- ADD_XP reducer: `readyToHatch = newTotal >= hatchRequired` (replaces old stage-based trigger)
- Home.jsx: stage 6 shows "เกือบฟักแล้ว!" + fills bar before triggering hatch; uses `xpPerStage` not hardcoded 50

## Part 2 — Creature Battle Stats

**Old formula:** Thai=ATK, Math=DEF, English=SPD (exclusive). If child only studies Math: ATK = base × thaiShare = base × 0 = 0.

**New formula:** Weighted 40% base guarantee + 60% subject-weighted contribution.

```
HP  = base × (1.50 + 0.30×tShare + 0.10×mShare + 0.10×eShare)
ATK = base × (0.40 + 0.30×mShare + 0.20×eShare + 0.10×tShare)
DEF = base × (0.40 + 0.30×tShare + 0.20×mShare + 0.10×eShare)
SPD = base × (0.40 + 0.30×eShare + 0.20×mShare + 0.10×tShare)
```

Minimum any stat (single-subject learner): `base × 0.50` — never 0.
Deterministic ±5% personality variation from XP seed.

**3 example creatures at tier 0 (base=100):**

| Profile | tShare | mShare | eShare | HP | ATK | DEF | SPD |
|---------|--------|--------|--------|-----|-----|-----|-----|
| Balanced (33% each) | .33 | .33 | .33 | ~167 | ~60 | ~60 | ~60 |
| Thai-heavy (80/10/10) | .80 | .10 | .10 | ~188 | ~52 | ~72 | ~52 |
| Math-only (0/100/0) | 0 | 1.0 | 0 | ~160 | ~70 | ~60 | ~60 |

**Migration:** `_migrateEggs()` now recalculates stats if any of ATK/DEF/SPD is 0 or NaN — covers pre-rebalance eggs.

## Known Risks
- BattleScreen still says "เรียนภาษาไทยเพิ่มเพื่อเพิ่ม ATK!" but new formula uses Math for ATK. Minor text inconsistency — not changed per task instructions.
- New creature stats are ~1.8× higher ATK/DEF/SPD vs old average. Battles remain player-wins (AI was already weak). No rebalancing of AI opponents done.
- Existing saved eggs with good stats are NOT forced to recalculate (only 0/NaN triggers migration). This preserves players' existing creatures while fixing broken ones.
