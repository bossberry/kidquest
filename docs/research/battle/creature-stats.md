# Creature Stats — Source of Truth

_Created: 2026-06-04_
_Status: Design philosophy locked. Implementation in `calcCreatureStats()` in `src/config/gameConfig.js`._

---

## 1. Design Philosophy

Creatures should feel different from one another.

Creatures should not feel broken.

Every creature should be battle-viable — no creature should feel like a liability in battle just because of how it was hatched.

Difference should come from style (one creature is faster, another is tankier), not from unusable stats. A creature with ATK near 0 is not "a support type" — it is a design failure.

No creature should effectively become unable to attack or defend.

---

## 2. Why One-Subject-One-Stat Is Bad

**Avoid this mapping:**

| Subject | Stat |
|---------|------|
| Math | ATK |
| Thai | DEF |
| English | SPD |

**The problem:**

A child who has not yet played English cannot earn SPD. A child who prefers Thai gets strong DEF but effectively zero ATK if they have done no Math. This is not a stylistic difference — it is a stat lock created by subject preference.

Children who love one subject should not be punished in battle for that preference.

Battle creatures should reflect how a child learns — their consistency, their mastery, their energy — not which subject deficiencies exist.

Subject-exclusive stat ownership also creates hidden traps: a child who plays only Thai and Math could hatch a creature with SPD=0, making it always last in turn order. The child did nothing wrong. The design failed them.

---

## 3. Weighted Stat Philosophy

Every subject contributes to every stat. Subjects influence stat style through weighting, not exclusive ownership.

The overall quality of learning matters more than which subject was studied. A child who plays one subject with high accuracy and streaks should produce a stronger creature than a child who dabbles in all three subjects poorly.

Stats emerge from a combination of:

- **Subject proportions** — which subjects the child has spent time on (thaiShare, mathShare, engShare)
- **Accuracy** — how often the child answers correctly
- **Streaks** — consistency and flow during sessions
- **Mastery** — how far the child has progressed through levels
- **Total XP** — raw amount of learning done
- **Egg quality** — the egg's accumulated XP forms the base power

A weighted formula means:
- Math-heavy learners produce creatures biased toward ATK (Math is the primary ATK weight)
- Thai-heavy learners produce creatures biased toward DEF (Thai is the primary DEF weight)
- English-heavy learners produce creatures biased toward SPD (English is the primary SPD weight)
- But no stat is ever zero — the 40% base floor guarantees a viable creature regardless of subject balance

---

## 4. Suggested Learning Profile Inputs

The following values are derived from the child's accumulated learning state and used as inputs to the stat formula:

```
thaiShare    — proportion of total XP earned from Thai (0.0–1.0)
mathShare    — proportion of total XP earned from Math (0.0–1.0)
engShare     — proportion of total XP earned from English (0.0–1.0)

avgAccuracy  — average correct-answer rate across sessions (0.0–1.0)
avgMastery   — average level progress across subjects (0.0–1.0)
streakBonus  — normalized bonus from streak performance

basePower    — derived from total XP at hatch time; forms the 40% floor
```

All three subject shares sum to 1.0. If only one subject has been played, that share = 1.0 and the others = 0.0 — this is fine because the base floor prevents any stat from reaching 0.

---

## 5. Example Stat Weighting

These weightings are illustrative. The implementation may differ. The implementation in `calcCreatureStats()` is the authoritative source.

### HP
| Component | Weight |
|-----------|--------|
| basePower | 40% |
| Thai | 25% |
| Math | 20% |
| English | 15% |

HP is most influenced by the base (total learning) and Thai (associated with resilience and grounding).

### ATK
| Component | Weight |
|-----------|--------|
| basePower | 40% |
| Math | 30% |
| English | 20% |
| Thai | 10% |

ATK is Math-weighted — pattern recognition, counting speed, and problem-solving translate to offensive power.

### DEF
| Component | Weight |
|-----------|--------|
| basePower | 40% |
| Thai | 30% |
| Math | 20% |
| English | 10% |

DEF is Thai-weighted — reading and language comprehension translate to defensive steadiness.

### SPD
| Component | Weight |
|-----------|--------|
| basePower | 40% |
| English | 30% |
| Math | 20% |
| Thai | 10% |

SPD is English-weighted — phonics fluency and sight-word recognition translate to quickness.

### CRIT
| Component | Weight |
|-----------|--------|
| basePower | 40% |
| English | 25% |
| Math | 25% |
| Thai | 10% |

CRIT is balanced between English and Math — a measure of precision and timing across subjects.

**Key invariant:** In all stats, basePower contributes 40%. This means the worst-case scenario (a child who has played only one subject) still produces a creature with stats at least at the base level. No stat reaches 0.

---

## 6. Personality Variation

Small deterministic variation is allowed and encouraged.

Two creatures hatched from the same learning profile should feel subtly different — different enough to have personality, not different enough to be unfair.

Variation must:
- Create personality (this creature feels a little faster; that one feels a little tankier)
- Not create broken creatures (no variation should push a stat toward 0 or into an extreme)
- Remain deterministic (same inputs always produce the same creature — no random rerolls on view)

**Suggested range: ±10%**

The variation seed should be derived from the egg's XP total or the hatch timestamp — something that is fixed at hatch time and does not change after. The current implementation uses a deterministic ±5% variation from the XP seed, which is conservative and safe.

Personality variation is cosmetic in effect. It should never be the primary driver of stat differences. The primary driver is always the learning profile.

---

## 7. Migration Philosophy

Existing creatures should remain valid. A child should not lose a creature they earned because the stat formula changed.

**Safe recalculation is allowed when:**
- Any stat is 0 (stat lock from old exclusive formula)
- Any stat is NaN (missing or corrupt value)
- Values are missing entirely from the creature object
- Values are extreme (e.g., a stat that exceeds any reasonable maximum)

**When recalculating:**
- Use the creature's existing accumulated XP as the basis
- Apply the current weighted formula
- Do not alter the creature's appearance (egg drawing is locked)
- Do not change the creature's name or identity

The current migration in `_migrateEggs()` (`src/lib/state.js`) triggers recalculation if ATK, DEF, or SPD is 0 or NaN. This covers the transition from the old one-subject-one-stat formula.

**Never delete eggs.** Even a creature with recalculated stats is still the child's creature. Never silently remove eggs from state.

---

## 8. Explicit Non-Goals

These approaches are explicitly rejected for creature stat design:

| Non-goal | Reason |
|----------|--------|
| AI-generated stats | Non-deterministic; unpredictable; unnecessary |
| Procedural generation | Indistinguishable from randomness to a child; hard to debug |
| Random rerolls | A child should always get the same creature from the same egg |
| Pay-to-win | Stats must never be purchasable or premium-gated |
| Subject punishment | A child who prefers one subject should not be penalized in battle |
| Hard floor patches as primary design | Clamps are emergency guards, not a substitute for a well-designed formula |

The goal is a formula that produces fair, interesting creatures by design — not one that patches edge cases after the fact.

---

## 9. Future Battle Scaling

Creature stats may later incorporate additional factors as the game grows:

- **Rarity** — rarer egg patterns could produce stronger base creatures
- **Tier** — egg tier (based on hatch number) could add a scaling multiplier
- **Battle level** — creatures may gain stats from battles won
- **Equipment** — cosmetic/functional items from Shop Mission rewards
- **Evolution** — a future system where creatures transform after certain thresholds

In all future expansions, **the learning profile remains the foundation**. External factors (rarity, equipment, evolution) may modify stats, but they should never completely replace the learning-derived base. A child who learns well should always produce a competitive creature regardless of rarity or equipment.

---

## Implementation Reference

| File | Purpose |
|------|---------|
| `src/config/gameConfig.js` | `calcCreatureStats()` — authoritative weighted formula |
| `src/lib/state.js` | `_migrateEggs()` — stat recalculation for 0/NaN cases |
| `docs/GPT_NOTES.md` | Creature stat decisions and open questions |

---

## Open Questions for Implementation

1. **Should HP scale differently than ATK/DEF/SPD?** HP affects survivability, not offensive/defensive style. Consider whether HP should be purely basePower-derived with minor subject flavoring.

2. **Should accuracy and mastery be explicit inputs?** Currently, accuracy and mastery influence XP totals, which flow into basePower. A future version could weight them directly as separate inputs.

3. **Should streaks affect stats or only XP?** Streak bonuses currently inflate XP. A separate streak multiplier on stats could reward consistency more visibly.

4. **What is the max meaningful stat range?** As children accumulate more XP, basePower grows. Define a soft cap or normalization so battle numbers stay readable (e.g., 1–999 range).

5. **Should AI opponent stats follow the same formula?** Currently AI opponents use hardcoded tiers. Aligning them to the same formula would make the battle system more coherent and let the difficulty curve emerge naturally from the child's actual learning level.
