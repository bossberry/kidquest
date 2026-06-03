# Research: Missions

Mission system design for KidQuest Year 1.
Scope: Kindergarten core + Early Grade 1 stretch only.

---

## Files

| File | Purpose |
|------|---------|
| [mission-system.md](mission-system.md) | Core design: what a mission is, types, mechanics, rewards, replay |
| [shop-mission.md](shop-mission.md) | First integrated mission — shop theme (implement this first) |
| [cooking-mission.md](cooking-mission.md) | Second mission — cooking theme |
| [garden-mission.md](garden-mission.md) | Third mission — garden theme |

---

## Recommended Implementation Order

```
1. mission-system.md   ← read and review design first
2. shop-mission.md     ← implement MVP
3. cooking-mission.md  ← implement after shop is solid
4. garden-mission.md   ← implement after cooking is solid
```

---

## Why Shop Mission First

The shop mission is the right first mission because:

1. **Familiar to a 5-year-old.** Chopin has been to shops. The mental model is immediate.
2. **Natural multi-subject integration.** One scenario covers Math (counting, simple addition), Thai (reading item names, social phrases), English (item name vocabulary), and general knowledge (money, social roles) without any artificial switching.
3. **Minimal new UI needed.** The mechanic is multiple-choice + counting — both already exist in the engine.
4. **Concretely bounded scope.** "Enter shop → read items → count → choose → say thank you → get reward" is a complete loop with a clear start and end. Not open-ended.
5. **Sets the pattern** for all future missions. Getting shop right defines the data structure, reward flow, and UX pattern that cooking and garden will follow.

Do not implement cooking or garden until shop is reviewed and confirmed working.

---

## Scope Reminder

These missions cover **Kindergarten + Early Grade 1 only.**

Do not design missions for Grade 2+ content in this session.
Do not create new mini-game mechanics.
Do not build a full e-commerce simulation.
