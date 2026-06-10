# Session Summary — 2026-06-10

**Session type:** Documentation only. No code. No build.

---

## Green Meadow Detailed Design

`docs/research/world/green-meadow.md` (NEW) — Full hand-authored design for the Phase 1 World.

### Map structure (3×3 grid)

```
Flower Field   | Grandma Turtle's House | Forest Entrance
River Crossing | Town Square            | Clover Hill
Pond & Willow  | Starting Path ← ENTER | King Clover Bear Meadow
```

All screens fully specified. Visible enemies (no invisible encounters). Walk-into triggers battle.

### What was designed

**9 screens** — each with: theme, visual mood, NPCs, enemies, treasure spots, secrets, weather effects, day/night differences, music variation, special interactions, screen connections.

**6 enemies** — Sleepy Bunny, Bouncy Slime, Tiny Fox, Leaf Sprite, Grumpy Mole, Mushroom Imp. All cute/funny/warm. Each has: appearance, movement, personality, idle/defeat/battle animations, trigger mechanic.

**5 NPCs** — Professor Clover Owl (tutorial), Grandma Turtle (warmth anchor), Post Bird (traveler), Young Bunny Farmer (trader), Traveling Bee Merchant (rare items). Each has: location, dialogue style, gifts, mini quests, special interactions.

**Treasure system** — 11 fixed spots (never same lore items), random sparkle system (1–2 per screen, 30% chance), hidden clover system (27 total across map, Lucky Day bonus if all found), 5 Old Letters (lore collectible chain).

**5 minigame integrations** — EggFishing at River (ML) + Pond (BL). EggRun via Bunny race in Town Square. EggTower via ancient tree at Forest Entrance. EggCatch via butterfly cluster in Flower Field. EggMemory via Grandma's flower pot quest.

**Session loop** — 10–15 min arc. Start at BM → explore → battle → treasure → NPC → boss → home. Natural end triggers (never forced). Home return flows rewards to Egg Home.

**Boss: King Clover Bear** — Full flow: approach sequence (dialogue → player chooses fight/not yet), battle (grander music, mid-battle comments, 2.5× HP), win (claps, laughs, warm dialogue, sparkle + confetti, 3 treasure spots), failure (bear gives consolation gift, never uses "แพ้", bounces child to Starting Path, Professor Owl encourages).

**Failure philosophy** — Bear hugs + small gift after loss. Never: "you lost." Always: "ลองอีกครั้ง." Child keeps items and XP from the session. Boss is rebattlable.

**Future hooks** — Sunny Beach entrance on Clover Hill east edge. Seasonal event spots (Flower Field, River, Pond). Gardening in Grandma's garden. Photo spots at hilltop/river/pond.

**10 open questions** added to `docs/GPT_NOTES.md` — GPT must answer before world map code begins.

---

## Key decisions

- 3×3 grid confirmed (not 5×5). Starting screen = BM (Starting Path). Boss = BR.
- All enemies visible before battle — no invisible random encounters. Ever.
- Minigames are world-embedded, not separate menu entries.
- Failure = bear hugs + gift. Never empty-handed outcome.
- Day/night: follows real clock (same as Egg Home). Night = magical, not scary.

---

## What's next

- GPT: Answer 10 open questions for Green Meadow → `GPT_NOTES.md`.
- Encounter + transition design doc (how exploration → battle → return works technically).
- WorldMap.jsx implementation after GPT answers questions 1–5.
