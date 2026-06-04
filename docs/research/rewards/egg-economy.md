# Egg Economy — KidQuest
_Source of truth for egg progression mechanics._
_Last updated: 2026-06-04_
_Status: **Implemented** — formula live as of commit 62ca3fe._

---

## 1. Core Loop

```
Learn (quiz round)
  → earn XP per correct answer
  → egg visual stage advances
  → egg hatches when XP threshold reached
  → creature revealed (procedural, unique to this egg)
  → battle AI opponents with creature stats
  → return to learning
```

The egg is the physical representation of learning progress. Every correct answer makes it grow. The child sees immediate feedback from study.

---

## 2. Design Philosophy

### The egg is a promise, not a grind

The egg system must feel exciting at every stage of KidQuest. A child who just started should hatch their first egg quickly — before boredom or confusion sets in. A child who has hatched many eggs should feel that each new creature is genuinely earned.

### Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| **First egg is fast** | Child understands the full loop within a single session |
| **Later eggs are slower** | Collection feels earned; creatures feel meaningful |
| **Slower is not punishment** | The egg LOOKS like it's growing — the bar always fills |
| **No FOMO** | Missing a day does not shrink the egg or reduce progress |
| **No streak pressure** | Hatching never depends on consecutive-day play |
| **No paid acceleration** | XP boost items (⭐ star) exist but are cosmetic bonuses, not gates |
| **Creatures feel different** | Each hatch produces a creature shaped by the child's learning profile |

### Non-goals

- ❌ Do NOT make hatching a daily streak requirement
- ❌ Do NOT reset egg progress if the child takes a break
- ❌ Do NOT add timers that pressure the child to play now
- ❌ Do NOT sell faster hatching as a premium feature
- ❌ Do NOT make the egg feel punishing after many hatches

---

## 3. Egg Requirement Scaling

### Formula (implemented)

```
requiredXP = min(800, 120 + hatchedEggs.length × 60)
```

Where `hatchedEggs.length` is the count of already-hatched eggs stored in `state.hatchedEggs`.

### Progression table

| Egg number | hatchedEggs.length | requiredXP | ~Correct answers (8 XP) | Feel |
|-----------|-------------------|------------|------------------------|------|
| 1st | 0 | **120 XP** | ~15 answers | Fast — onboarding win |
| 2nd | 1 | **180 XP** | ~23 answers | Still quick |
| 3rd | 2 | **240 XP** | ~30 answers | A short session |
| 4th | 3 | **300 XP** | ~38 answers | Same as old fixed threshold |
| 5th | 4 | **360 XP** | ~45 answers | Slightly longer |
| 6th | 5 | **420 XP** | ~53 answers | One or two sessions |
| 8th | 7 | **540 XP** | ~68 answers | — |
| 10th | 9 | **660 XP** | ~83 answers | Multi-session effort |
| 12th | 11 | **780 XP** | ~98 answers | — |
| 13th+ | 12+ | **800 XP** | ~100 answers | Capped — never harder than this |

### Why this formula

- The `120` base makes the first egg reachable in a single focused session (~15–20 correct answers)
- The `×60` slope is gentle enough to feel gradual, steep enough to be felt after egg 5
- The `800` cap prevents the late game from feeling infinite or hopeless
- The formula is deterministic and reproducible — no randomness, no server dependency

---

## 4. First-Time Experience

**Target: hatch within the first real session.**

A new child should:
1. Answer ~10 correct answers → see egg reach stage 3 (visible pattern change)
2. Answer ~15 correct answers → egg reaches stage 6 (visually "ready")
3. Tap egg → hatching animation plays
4. Creature revealed → child is delighted
5. Battle tutorial or first battle → core loop understood

The first egg is the tutorial. It MUST be fast enough that the child understands what the egg is for before they lose interest.

**Implementation note:** The egg visual stages scale proportionally to `requiredXP`. For egg 1 (120 XP / 7 stages = ~17 XP per stage), the egg reaches stage 6 after about 102 XP. The progress bar fills the rest of stage 6 before the hatch triggers at 120 XP.

---

## 5. Later Pacing

**Target: each new hatch feels like a milestone.**

After the first few eggs, the pacing slows naturally. This serves two goals:

1. **The collection does not fill too fast.** If a child hatched 10 eggs in a week, each creature would feel cheap. At 660 XP for egg 10, there is genuine effort behind it.

2. **Learning is the driver, not grinding.** The XP is earned per correct answer (8–13 XP). A child cannot "farm" the egg by guessing — wrong answers give no XP, and streaks reward sustained accuracy. The egg grows with real learning.

3. **Replay remains rewarding.** Even after a child has hatched many eggs, replaying a subject gives XP toward the next egg. The egg economy is never "finished" — there is always a next creature.

---

## 6. Visual Progress (Stage System)

The egg has 7 visual stages (0–6), driven by `drawEgg()` in `eggAlgorithm.js`.

### Dynamic stage threshold

With scaling, `xpPerStage = requiredXP / 7`. The visual stage advances at the same proportion of each egg's total requirement.

```
stage = min(6, floor(totalXP / xpPerStage))
```

This means:
- For egg 1 (xpPerStage ≈ 17): the egg passes through all 7 stages in 120 XP
- For egg 10 (xpPerStage ≈ 94): the egg passes through all 7 stages in 660 XP
- The visual rate of change always FEELS similar — the egg grows at the same pace relative to effort

### Stage labels

| Stage | Name (Thai) | Visual cue |
|-------|------------|------------|
| 0 | ไข่ลึกลับ | Plain egg, no pattern |
| 1 | ไข่แวววาว | Faint shimmer |
| 2 | ไข่มีลาย | Visible pattern begins |
| 3 | ไข่เปล่งแสง | Glowing |
| 4 | เห็นเงาข้างใน... | Shadow visible inside |
| 5 | เห็นดวงตาแล้ว! 👁️ | Eyes visible |
| 6 | ใกล้ฟักแล้ว!!! | Ready to hatch |

### Stage 6 behavior

When the egg reaches stage 6:
- Home label shows "เกือบฟักแล้ว!" and progress bar continues filling within the stage
- When `totalXP >= requiredXP`: `readyToHatch = true` → hatch button appears
- This gap between "stage 6 starts" and "actually ready" is intentional — it builds anticipation without confusion

---

## 7. XP Sources

All XP feeds the same egg pool (`xpThai + xpMath + xpEng`).

| Source | XP per event | Notes |
|--------|-------------|-------|
| Correct answer (base) | 8 XP | Standard rate |
| Streak bonus (≥ 3 in a row) | +5 XP | Applied on top of 8 |
| Streak-boosted correct | 13 XP | Max per answer |
| ⭐ Star item (×2 boost) | doubles all | 5-minute duration |
| 💧 Potion item | +20 XP | One-time bonus |

XP is never reduced by wrong answers. Progress is only forward.

---

## 8. Migration and Safety

### Rules for any future code changes

- **Do not modify `eggAlgorithm.js` drawing logic** — `drawEgg()`, `hash()`, `prng()` are LOCKED
- **Do not reset existing eggs** — `hatchedEggs[]` in state must never be cleared
- **Do not delete hatched creatures** — creature data is permanent per egg
- **Migrate old state safely** — if `hatchedEggs` is missing fields, backfill with defaults; never discard

### Migration on state load (`_migrateEggs` in `state.js`)

On every app load, `_migrateEggs()` runs and fixes:
- `tier` missing → backfill from `grade` label
- `stats` missing → recalculate via `calcCreatureStats()`
- Any of `ATK`, `DEF`, `SPD` is 0 or NaN → recalculate stats

### Progress continuity after requiredXP changes

The `readyToHatch` flag is recomputed in `ADD_XP` on the next correct answer. If a player had accumulated XP under the old threshold (300 XP), and the new threshold for their current egg is 120 XP (first egg), `readyToHatch` will trigger on the very next ADD_XP call. No refresh needed.

---

## 9. Implementation Reference

### Key files

| File | Role |
|------|------|
| `src/lib/eggAlgorithm.js` | LOCKED — `drawEgg()`, `buildEggStats()`, `eggProgress()`, `EGG_STAGES=7`, `STAGE_XP_NEEDED=50` |
| `src/context/StateContext.jsx` | `scaledEggProgress(state)` helper — dynamic threshold. `ADD_XP` reducer — sets `readyToHatch`. `derived` useMemo — overrides `eggStatsData.stage` with scaled value |
| `src/components/Home.jsx` | Displays `stage`, `stageXP`, `xpPerStage`, `pct` from `eggProgressData`. Shows hatch button when `state.readyToHatch` |
| `src/components/HatchOverlay.jsx` | Hatch flow — tap 5 times → reveal creature. `suppressAutoOpen` prevents mid-game interruption |
| `src/lib/state.js` | `defaultState()`, `_migrateEggs()`, `loadState()`, `saveState()` |
| `src/config/gameConfig.js` | `calcCreatureStats()` — weighted stat formula; `TIERS`, `AI_OPPONENTS` |

### `scaledEggProgress(state)` return shape

```js
{
  stage: 0–6,              // visual stage (0 = fresh, 6 = ready-to-hatch)
  stageXP: number,         // XP accumulated within the current stage
  pct: 0–100,              // progress bar percentage within current stage
  xpPerStage: number,      // XP per stage for this egg (= requiredXP / 7, rounded)
  required: number,        // total XP needed to hatch this egg
}
```

### State fields involved

```js
state.xpThai          // XP earned this egg from Thai (resets to 0 after hatch)
state.xpMath          // XP earned this egg from Math (resets to 0 after hatch)
state.xpEng           // XP earned this egg from English (resets to 0 after hatch)
state.hatchedEggs     // Array of hatched egg records — .length drives requiredXP
state.readyToHatch    // Boolean — set when totalXP >= requiredXP
state.hatching        // Boolean — set when user explicitly taps hatch button
state.hatched         // Boolean — true during hatch animation, cleared after HATCH_COMPLETE
```

---

## 10. Open Questions (status as of 2026-06-04)

| Question | Status |
|----------|--------|
| Where is egg progress currently calculated? | ✅ `scaledEggProgress()` in `StateContext.jsx` — overrides `eggProgress()` from locked `eggAlgorithm.js` |
| Is hatch threshold hardcoded at 350 XP? | ✅ No longer — replaced with dynamic formula |
| How does current egg progress migrate if requiredXP changes? | ✅ Handled — `readyToHatch` recomputed on next ADD_XP; no reset needed |
| How does UI show requiredXP / progress? | ✅ `xpPerStage` returned from `scaledEggProgress`, displayed in Home XP label |
| Should first egg use a separate onboarding rule? | 🔵 Open — current formula naturally gives 120 XP for egg 1, which is fast. A separate onboarding rule (e.g., "first egg always = 80 XP") could be considered but not needed now |
| Should the egg stage names change at later pacing? | 🔵 Open — stage names are fixed strings in `eggAlgorithm.js`. Currently unchanged |
| How should creature stats reflect learning quality? | ✅ Resolved — weighted formula in `calcCreatureStats()`, see `docs/research/rewards/creature-stats.md` (to be written) |
| Should egg collection have a maximum? | 🔵 Open — no cap currently. Not needed for Year 1 |
| Should there be a visual indicator of "which egg number is this"? | 🔵 Open — would help the child track progress. Low priority |

---

## 11. Future Considerations (Year 2+)

These are out of scope for Year 1. Document here to prevent premature implementation.

- **Egg variants / rarity** — different egg appearances based on tier or XP distribution. Do not add until Year 2.
- **Egg gifting** — parent sends a bonus egg for a special occasion. Requires payment system.
- **Egg challenges** — special limited-time eggs with unique creatures. Requires event system.
- **Egg collection cap** — if the collection grows too large, may need pagination. Only needed if child has 20+ eggs.
- **Multi-child eggs** — each child has their own egg. Requires multi-child account support.

---

_See also: `docs/research/rewards/creature-stats.md` (pending), `docs/research/missions/shop-mission.md`_
