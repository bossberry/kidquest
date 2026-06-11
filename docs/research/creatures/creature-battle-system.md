# Creature Battle System — Design Rationale

## Overview

Creatures hatched from eggs now participate in world battles as active fighters. This is a **separate progression axis** from academic XP — battling levels up the creature's combat stats while academic subject XP determines egg evolution.

---

## State Fields (per egg object)

| Field | Default | Purpose |
|-------|---------|---------|
| `id` | `egg_${i}_${hatched_at}` | Stable identity for party/battle tracking |
| `battleLevel` | 1 | Creature's combat level (1–100) |
| `battleXP` | 0 | Cumulative battle XP |
| `currentHP` | stats.HP | Current HP (depletes in battle, not auto-healed) |
| `inParty` | true (first egg) | Whether creature is in the active party |
| `archived` | false | Whether creature is in the vault |

## Global State

| Field | Default | Purpose |
|-------|---------|---------|
| `party` | `[firstEggId]` | Ordered array of creature IDs in the team |
| `partySlots` | 1 | Max party size (unlocks via battle milestones) |
| `battleCreatureId` | null | Which creature is fighting right now |
| `pendingBattle` | null | Enemy data waiting for PartySelect |

---

## Battle Flow

```
WorldScreen collides with enemy
  → dispatch SET_PENDING_BATTLE (stores enemy data)
  → App.jsx shows PartySelect overlay (zIndex 80)
  → Player picks a creature
  → dispatch SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD
  → navigate('world-battle')
  → WorldBattle renders with MoveSelectBattleMode (isWorldBattle=true)
  → Battle ends via enemy HP=0 (victory) OR creature HP=0 (faint)
  → dispatch RETURN_FROM_WORLD_BATTLE
  → navigate('world')
```

---

## Stat Calculations

### Creature Stats (from `calcCreatureStats(egg)`)
- HP = base × (1.50 + subjectMix)  → ~150–200
- ATK = base × (0.40 + subjectMix) → ~40–80
- DEF = similar to ATK
- SPD = similar
- CRIT = min(0.5, accuracy/200)

### Enemy HP Scaling (in WorldScreen)
- `baseHP  = clamp(eData.hp × 60, 50, 600)`
- `baseATK = clamp(round(eData.hp × 3), 5, 100)`
- Gives bunny ≈ 180 HP / 9 ATK; snake ≈ 600 HP / 100 ATK

### Enemy Scaling by Creature Battle Level (scaleMonsterStats)
| Creature Level | Multiplier |
|----------------|-----------|
| 1–5 | ×1.0 |
| 6–15 | ×1.4 |
| 16–30 | ×2.0 |
| 31–50 | ×2.8 |
| 51+ | ×3.8 |

---

## Combat Mechanics

### On Correct Answer (hit)
- Damage = `creatureStats.ATK × combMult`
- comboMult: ×1 base, ×1.5 at combo≥4 or crit, ×2 for ultimate
- Battle XP earned on victory: 10 + 5 (if combo≥3)

### On Wrong Answer (miss)
- SPD dodge chance: `Math.random() < SPD/200` (SPD 40–80 → 20–40% dodge)
- If not dodged: creature takes `max(1, enemyATK - DEF×0.5)` damage
- If creature HP ≤ 0: faint → return to world without victory

---

## Battle Level Progression

```js
function calcBattleLevel(xp) {
  let level = 1, cumulative = 0
  while (true) {
    const needed = 10 + level² × 2
    if (cumulative + needed > xp) break
    cumulative += needed; level++
  }
  return level
}
```

Threshold examples: Lv2 = 12 XP, Lv3 = 30 XP, Lv5 = 100 XP

---

## Party Slot Unlock Milestones

| Creature Battle XP | Slots Unlocked |
|--------------------|---------------|
| 0 | 1 slot |
| 10 | 2 slots |
| 50 | 4 slots |

---

## HP Persistence

Creature HP is **not auto-restored**. Players need to use Potion items (dispatching CREATURE_HEAL) or wait (future mechanic). This creates meaningful resource management even at kindergarten level — Chopin understands "my bunny is tired."

---

## UI Surfaces

1. **PartySelect** — pre-battle creature picker with HP bars and faint state
2. **WorldBattle / MoveSelectBattleMode** — real creature HP bar replaces dummy player HP; damage calculated from creature stats
3. **Home.jsx** — compact party HP strip above item tray
4. **Collection → ทีม tab** — team view with HP bars and battle levels
5. **Collection → คลังสะสม tab** — vault with "เพิ่มในทีม" button

---

## Design Constraints

- Battle level is **completely separate** from academic subject XP — Chopin can have a Lv.10 creature with low Thai XP, or vice versa
- `eggAlgorithm.js` and `creatureGenerator.js` DNA are LOCKED — only stat fields added to existing egg objects
- Guest mode preserved — all state is localStorage; Supabase is optional
