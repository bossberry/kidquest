# Creature Battle System — Research & Design Doc
_Written by Claude Chatbot. Last updated: 2026-06-11_
_Read this before implementing the Pokemon-style battle overhaul._

---

## Overview

KidQuest is moving from a "victory-always" battle system to a real Pokemon-style
HP battle where the child's creature can faint. This doc covers the full design
rationale, stat formulas, balance decisions, and migration plan.

---

## Two-Dimension Stat System

Every creature stat is shaped by two independent dimensions:

### Dimension 1 — Grade Level (Tier)
Chopin's grade sets the creature's BASE stat tier. Higher grade = stronger base.
This ensures that as Chopin advances academically, their creature grows accordingly,
regardless of how much they've played.

```
Grade setting    → Tier → Base multiplier
อนุบาล 1-3      → T0   → ×1.0
ประถม 1-2       → T1   → ×1.5
ประถม 3-4       → T2   → ×2.2
ประถม 5-6       → T3   → ×3.0
ม.ต้น 1-3       → T4   → ×4.0
ม.ปลาย 4-6     → T5   → ×5.5
```

### Dimension 2 — Subject Mastery (XP weighting)
Within the tier, each stat is shaped by XP in a specific subject.
This makes learning directly visible in battle — getting better at Math literally
makes your creature hit harder.

```
Stat   Subject        Narrative meaning
HP     Thai XP        Reading/writing = mental endurance = can take hits
ATK    Math XP        Problem-solving = sharp mind = hits hard
DEF    Thai XP        (also Thai — language is both offense and defense)
SPD    English XP     Communication skill = reflexes = dodge chance
CRIT   Accuracy %     Precision in answers = critical hit chance
```

Note: Thai XP feeds both HP and DEF. This is intentional — Thai is Chopin's
primary language and should feel central to survival. Math drives offense.
English is the "agility" stat — less critical for survival but rewarding when high.

### Combined formula (what calcCreatureStats already implements, extended)

```js
function calcCreatureStats(tier, thaiXP, mathXP, englishXP, accuracy) {
  const BASE = [10, 15, 22, 30, 40, 55][tier]  // base HP
  const ATK_BASE = [4, 6, 9, 12, 16, 22][tier]
  const DEF_BASE = [2, 3, 5, 7, 9, 12][tier]
  const SPD_MAX = 1.0  // SPD is a 0–1 probability, not a raw number

  // 40% guaranteed base + 60% subject-weighted
  const HP  = Math.floor(BASE * 0.4 + BASE * 0.6 * Math.min(thaiXP / XP_SCALE[tier], 1))
  const ATK = Math.floor(ATK_BASE * 0.4 + ATK_BASE * 0.6 * Math.min(mathXP / XP_SCALE[tier], 1))
  const DEF = Math.floor(DEF_BASE * 0.4 + DEF_BASE * 0.6 * Math.min(thaiXP / XP_SCALE[tier], 1))
  const SPD = Math.min(englishXP / (XP_SCALE[tier] * 2), 0.5)  // max 50% dodge
  const CRIT = Math.min(accuracy * 0.3, 0.25)  // max 25% crit

  return { HP, ATK, DEF, SPD, CRIT, maxHP: HP }
}

// XP needed to reach "full stat" at each tier (tunable)
const XP_SCALE = [120, 300, 600, 1000, 1500, 2200]
```

**Minimum stat guarantee:** No stat ever below 40% of base (already in existing code).
**Personality modifier:** ±5% deterministic from DNA (already in existing code).

---

## Battle Formulas

### Player turn (correct answer)
```
damage = ATK × combo_mult × element_mult
combo_mult = 1.0 (base) | 1.5 (3+ streak) | 2.0 (ultra move)
element_mult = 1.0 (normal) | 1.3 (element tier 2) | 1.6 (tier 3) | 2.0 (tier 4)

if random() < CRIT: damage = damage × 1.5  // "Critical hit!"
```

### Enemy turn (wrong answer)
```
raw_damage = enemy_ATK - creature_DEF
damage = max(1, raw_damage)  // always at least 1

// SPD dodge check (before damage applies)
if random() < creature_SPD:
  damage = 0  // "หลบได้!"
  playSFX('attack_miss')
```

### Why min damage = 1
Even if DEF is maxed, wrong answers always sting a little.
This preserves the learning incentive — getting questions wrong should
feel consequential without being devastating.

### Shield item interaction
If `shieldActive = true`: skip enemy turn entirely (block absorbs the hit).
Shield consumed regardless of whether the attack would have been dodged.

---

## Monster Stats by Type

Base stats balanced against Tier 0 creature (อนุบาล, average XP).
At Tier 0 average, a battle should last 6–10 questions.

```
Enemy           HP    ATK   DEF   Level zone   Notes
Sleepy Bunny    24    4     1     T0–T1        Starter. Double-tap wake.
Bouncy Slime    28    5     2     T0–T1        Erratic movement.
Leaf Sprite     20    5     2     T0–T1        Gentle, low threat.
Mushroom Imp    20    6     1     T0–T2        Scared but hits surprisingly hard.
Tiny Fox        22    6     1     T1–T2        Fast, 25% flee chance.
Grumpy Mole     36    7     3     T1–T3        Tanky. Hardest non-boss in Green Meadow.
Baby Zombie     18    8     0     T0–T2        Fragile but high ATK. Fast chaser.
Snake           32    9     2     T2–T4        Patrol + aggro. Significant threat.
Egg Pawn        30    7     2     T1–T3        Robot. No personality quirks.
```

### Monster scaling by creature level
Monsters scale to stay relevant as the creature levels up from battle wins.

```
Creature level   Monster stat multiplier
1–5             ×1.0 (base stats above)
6–15            ×1.4
16–30           ×2.0
31–50           ×2.8
51+             ×3.8
```

This means a Lv 50 creature fighting a Sleepy Bunny faces one with HP=91 and ATK=15.
The child still wins, but it takes more correct answers.

### Why scale monsters instead of replacing them
- Chopin has emotional attachment to enemy characters (Sleepy Bunny is friendly/familiar)
- Avoids constantly introducing new content to maintain difficulty
- Simpler to implement — one multiplier, not new enemy configs per level

---

## Party System (6 slots)

### Initial state
Current 35 creatures → keep most recent 6 as active party.
Older creatures → archive (visible in Collection, cannot battle).

### Slot unlock progression
```
Slots 1–1:  Default (start with 1 active)
Slot 2:     Unlock after 10 battle wins
Slot 3:     Unlock after defeating first boss (King Clover Bear)
Slot 4:     Unlock after 50 battle wins
Slot 5:     Unlock after defeating second region boss
Slot 6:     Unlock after 100 battle wins
```

Rationale: starting with 1 forces emotional investment. Chopin will care deeply
about 1 creature in a way they can't about 35. Additional slots are earned,
making each new slot feel like a milestone.

### Pre-battle creature select
Before every world battle, show a party screen:
- 1×N grid of creature cards (max 6)
- Each card: creature canvas (60px), name, HP bar, level
- Fainted creatures shown with grey overlay, HP = 0
- Tap to select → confirm → battle starts with that creature
- Cannot select fainted creature unless all are fainted (then forced to flee)

### Faint & recovery
```
Faint:       creature HP = 0 → battle ends → return to map
Recovery:    HP recovers at 1 HP per 30 seconds real time
             Potion item: instant full HP restore
             Ribbon item: +5 HP bonus (permanent, one-time per ribbon)
```

No permadeath. Fainting is temporary. This is critical for a 5-year-old — losing
a creature forever would cause genuine distress and undermine the learning loop.

### All-faint scenario
If all party creatures are fainted: player cannot enter battle.
World map shows visual cue (creatures sleeping). Must wait or use potions.
This is intentional pressure: taking care of creatures = using items from egg economy.

---

## Creature Level System

Separate from academic XP. Tracks battle experience specifically.

```
Source                    XP gained
Win a battle              +10
Win with 3+ combo         +15
Win with ultra move       +20
Defeat rare/boss enemy    +30
Lose (faint)             +2   (participation — learning happened even in loss)
```

```
Level   XP required (cumulative)
1       0
2       20
3       45
4       80
5       130
...
10      500
20      2000
50      15000
100     80000
```

Formula: `xpToNextLevel = 10 + level² × 2`

Stat bonus per level: every level adds +1 to HP and +0.5 to ATK (rounded down).
This stacks on top of the subject XP formula — a high-level creature with high
academic XP is significantly stronger than either alone.

---

## XP Migration Plan

Current state:
- 35 creatures with existing `eggStats` containing tier + subject XP proportions
- `calcCreatureStats()` already computes stats from these

Migration steps:
1. Keep most recent 6 creatures as `party` (active). Add `inParty: true` flag.
2. Add `battleLevel: 1` and `battleXP: 0` to all creatures.
3. Add `currentHP` = maxHP (full health on migration).
4. All other creatures get `archived: true`.
5. Run `_migrateBattleStats()` on state load (same pattern as existing `_migrateEggs()`).

No creature DNA or existing stats change. Migration is additive only.

---

## UI Changes Required

### Pre-battle screen (new)
- Route: triggered when `ENTER_BATTLE_FROM_WORLD` dispatched
- Shows party select before WorldBattle renders
- State: `battleCreatureId` — which creature is fighting

### Battle screen changes
- Add creature HP bar (player side) — already has enemy HP bar
- Creature canvas uses `battleCreatureId`'s creature DNA
- On correct answer: trigger creature attack animation toward enemy
- On wrong answer: trigger enemy attack animation toward creature
- On creature faint: dispatch `CREATURE_FAINT` action → return to map

### Home screen changes
- Party display: show 1–6 creature mini-cards in creature zone
- HP bars under each creature (small, 40px wide)
- Fainted creatures show ZZZ animation
- Tap creature → opens detail (level, stats, HP, battle wins)

### Collection changes
- Active party marked with slot number badge
- Archived creatures shown in separate section "คลังสะสม"
- Cannot drag/rearrange — party management in a separate Party screen

---

## Open Questions (decide before Phase 2)

1. **Creature naming before party select** — does Chopin name their creature?
   (CHATBOT_NOTES says: yes, after hatch, pick from 5 suggestions. Implement now.)

2. **Party management screen** — how does Chopin swap party members?
   Suggest: tap creature in Collection → "เพิ่มในทีม" button → replaces weakest HP creature
   or prompts slot select if space available.

3. **XP curve balance** — the `xpToNextLevel = 10 + level² × 2` formula means
   Lv 1→2 costs 20 XP, Lv 10→11 costs 210 XP. At 10 XP per win, Lv 10 creature
   needs 21 more wins to level up. Is this pacing appropriate for Chopin?
   Adjust if playtesting shows it feels too slow.

4. **Creature death vs faint framing** — use "หลับ" (sleeping) not "ล้มลง" (fell down).
   Keeps tone friendly for 5-year-old. Confirm this is the messaging.

---

## Non-Goals (do not build now)

- Trading or battling other players
- Evolution system (Year 2+)
- Creature abilities beyond stats (no type advantages, no move sets)
- Persistent creature happiness/hunger (Tamagotchi mechanics already in egg, not creature)
