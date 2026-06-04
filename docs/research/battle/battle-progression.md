# Battle Progression — Source of Truth

_Created: 2026-06-04_
_Status: Design philosophy locked. Implementation in `BattleScreen.jsx`, `AI_OPPONENTS` in `gameConfig.js`._

---

## Core Loop

```
Learn (subject levels)
  → Earn XP
    → Egg grows (7 stages)
      → Hatch
        → Creature
          → Battle AI opponents
            → Earn rewards
              → Learn again
```

Battle exists to reinforce and celebrate learning. It is the reward that learning makes possible — not a separate game that runs alongside learning.

Battle is not the primary game. Subject progression is the primary game. Battle is the payoff.

---

## Battle Philosophy

Battle should feel:
- **Exciting** — the child wants to see what their creature can do
- **Rewarding** — winning feels good and meaningful
- **Low pressure** — losing is not a crisis

Battle should not feel:
- **Stressful** — the child should not feel anxiety before or during a battle
- **Competitive** — there is no ranking, no leaderboard, no comparison with other children
- **Grindy** — the child should not feel forced to battle repeatedly to make progress

Children should be excited to battle, not afraid to lose. A 5-year-old who loses a battle should think "let's try again" — not "I failed."

---

## Creature Philosophy

Every creature should be usable in battle. No creature that a child hatches should feel like a liability.

Different creatures should have different styles — one might be fast, another might be tough — but all styles should be viable.

No creature should feel broken. A creature with a stat near zero is a design failure, not a feature. The weighted stat formula with a 40% base floor ensures this.

Learning behavior influences creature personality. A child who plays Math heavily will hatch a creature biased toward ATK. A child who plays Thai heavily will hatch a creature biased toward DEF. These are style differences, not power differences.

Learning behavior should not punish the child. A child who has only played one subject should still hatch a creature that can fight.

See `docs/research/battle/creature-stats.md` for the full stat philosophy and formula.

---

## Unlock Philosophy

Battle should unlock naturally as a consequence of learning — not as a gate that requires a specific action.

Possible unlock signals (implementation may evolve):
- **First hatch** — the most natural trigger: you hatched a creature, now you can battle with it
- **First creature** — same as above, framed from the creature's perspective
- **First mastery** — battle unlocks after reaching mastery in any subject level
- **Total XP milestone** — battle unlocks after accumulating a threshold of total XP

Battle should appear to the child as a reward ("you hatched your first creature — now you can battle!"), not as a requirement ("complete 3 levels to unlock battle"). The distinction is framing: one celebrates progress, the other enforces compliance.

Currently, battle is accessible after hatching the first egg. This is the simplest, most natural trigger and should be preserved.

---

## Enemy Scaling Philosophy

Enemy scaling should be gentle. The game is for a 5-year-old — difficulty exists to create mild excitement, not to challenge or frustrate.

Children should usually:
- Win their battles
- Feel successful and capable
- Occasionally face a challenge that makes victory feel earned

Avoid:
- Sudden difficulty spikes that turn easy wins into unexpected losses
- Frustrating loss streaks with no clear path to improvement
- Enemies that feel unfair or random

Difficulty should increase gradually. The current system uses 6 AI opponent tiers, each stronger than the last. A child's creature stats grow naturally with learning, so the difficulty curve should track learning growth rather than imposing a separate progression system.

The Challenger system (every 15 `dailyBattleRounds`) introduces a stronger opponent as a special event. This is the right model: occasional challenge, not constant difficulty escalation.

---

## Reward Philosophy

Battle rewards may include:
- **XP** — feeds back into egg progression and creature stats
- **Item drops** — cosmetic or functional (future)
- **Egg progress** — battles could contribute small XP toward the next egg
- **Cosmetics** — new egg patterns, creature colors, decorations (future)

Battle rewards should support learning. If battle rewards make learning feel unnecessary, the design has failed. The goal is a loop where learning makes battle better, and battle makes the child want to learn more.

Battle should not replace subject progression. A child who only battles and never plays subject levels should not be able to fully progress. Battle is downstream from learning.

---

## Frequency Philosophy

Battle should be occasional — a punctuation mark in the learning experience, not the main text.

**Healthy rhythm:**
```
Learn (subject sessions)
  → Hatch (celebrates accumulated XP)
    → Battle (payoff for hatching)
      → Learn again
```

**Avoid:**
```
Battle → Battle → Battle (learning becomes optional)
```

There is no current mechanism that forces battle frequency. This is intentional. The child chooses when to battle. The Adventure Director recommends learning (weakest subject), not battling. Battle remains a self-directed reward.

---

## Loss Philosophy

Losing a battle is acceptable. Loss should never feel punishing.

Avoid:
- Losing creatures (permanent loss of a hatched creature)
- Losing progress (XP deducted, levels reset, egg regressed)
- Losing items (inventory reduction as a penalty)

Loss should provide:
- **Encouragement** — friendly message, positive framing ("ไม่เป็นไร ลองอีกครั้ง!")
- **Retry opportunity** — the child can immediately try again
- **No lasting consequence** — the state after a loss is identical to before it, except time spent

The child's creature and all progress must be fully intact after a loss. The only thing that ends is the battle encounter.

---

## Explicit Non-Goals

| Non-goal | Reason |
|----------|--------|
| PvP (player vs. player) | Comparing children creates winners and losers — incompatible with encouragement philosophy |
| Leaderboards | No ranking, no competition |
| Pay-to-win | Stats are earned through learning; they cannot be purchased |
| Creature trading | Creatures are personal — a reflection of the child's learning journey |
| Ranked mode | No competitive ladder of any kind |
| Gacha spending | No random-reward monetization |
| Permanent penalties | Losing a battle changes nothing permanently |
| Energy systems | No "battle tokens" or timed gates that limit play |

These are permanent non-goals. They apply to all battle features now and in the future.

---

## Future Possibilities

Future battle systems may expand to include:

| Feature | Notes |
|---------|-------|
| Evolution | Creatures transform after certain XP or battle milestones |
| Equipment | Items from Mission rewards that modify stats |
| Rarity | Egg rarity affects base stat ceiling (not a pay feature) |
| Boss battles | Special encounters tied to curriculum milestones |
| Regions | Thematic battle zones tied to subject themes (Math World, Thai Forest) |

**Year 1 scope remains simple.** None of these features are needed before Chopin has validated the core battle loop. Build one level ahead — not six.

All future expansions must preserve the core invariant: learning is always upstream of battle. A child who learns more always produces a more capable creature.

---

## Relationship to Other Systems

| System | Document |
|--------|---------|
| Subject progression (what feeds XP) | `docs/research/progression/subject-progression.md` |
| Egg progression (how XP becomes a creature) | `docs/research/rewards/egg-economy.md` |
| Creature stats (how learning shapes the creature) | `docs/research/battle/creature-stats.md` |
| Play observation (how readiness is measured) | `docs/research/observation/play-observation-system.md` |

Battle is always downstream from learning. The flow is always:

```
Learn → XP → Egg → Creature → Battle
```

No part of battle system design should reverse this flow or make battle feel like the prerequisite for learning.

---

## Implementation Reference

| File | Purpose |
|------|---------|
| `src/components/BattleScreen.jsx` | Battle simulation, turn animation, win/loss handling |
| `src/config/gameConfig.js` | `AI_OPPONENTS` (6 tiers), `calcCreatureStats()` |
| `src/context/StateContext.jsx` | `dailyBattleRounds` counter, challenger trigger (every 15 rounds) |

**Known issue:** `BattleScreen.jsx` advice text still references the old stat formula ("เรียนภาษาไทยเพิ่มเพื่อเพิ่ม ATK!") but ATK is now Math-weighted. Minor UI text inconsistency; fix when next touching that file.

---

## Open Questions for Future Design

1. **Should battle contribute XP to the next egg?** Currently only subject sessions add XP. Allowing battle to add small XP (e.g., 5 XP per win) would tighten the battle ↔ egg loop, but risks making battle feel like farming.

2. **Should the Challenger trigger be adjustable?** Currently every 15 `dailyBattleRounds`. Should this increase as the child's creatures get stronger, to maintain the sense of challenge?

3. **Should there be a visual signal that a Challenger is approaching?** A "challenger approaching" indicator after 12 rounds might build anticipation without surprise frustration.

4. **Should loss provide any learning prompt?** After a loss, could the system gently suggest "เรียนคณิตเพิ่มเพื่อทำให้ [creature] แข็งแรงขึ้น!" — linking the loss back to learning motivation? Or does this feel punishing?

5. **Should evolution exist in Year 1?** If Chopin hatches 3+ creatures and battles regularly, evolution could be a meaningful milestone. Define the trigger before building — is it battles won, XP accumulated, or a specific mastery milestone?
