# KidQuest World — Design Document
_Created: 2026-06-09. Source of truth for the world and home redesign._
_Status: Design phase. No code yet. All decisions here need GPT review before implementation._

---

## Why This Document Exists

Real playtesting with Chopin (~5 years old) produced direct feedback:

> "The game is boring."
> "Not like a game."

Chopin enjoys: collecting eggs, caring for eggs, feeding eggs, giving items to eggs, watching eggs hatch, taking eggs into battle.

Chopin does **not** feel engaged by: subjects, levels, scores, the Adventure Director.

**This document defines the new game model.** Previous architecture assumptions are frozen until GPT and the team decide what carries forward.

---

## Philosophy Shift

### Before (current model)
Learning first. Game wrapper second.

- Home = Adventure Director (pushes you to a subject)
- Battle = mechanism to deliver learning questions
- Egg = progress bar for learning XP

### After (new model)
Game first. Learning hidden inside.

- Home = Egg Home (care, feed, watch your egg)
- World = the thing you play
- Battle = where knowledge helps your egg fight
- Learning = invisible support system, not the center

**Learning remains. It just stops being the front door.**

---

## Emotional Center

**The current egg is the hero.**

Not subjects. Not levels. Not scores. Not subject readiness. Not the Adventure Director.

Everything in the game should reinforce:
- The egg is alive.
- The child and egg are on a journey together.
- The egg grows because of the journey, not because of test scores.

---

## Inspirations

| Game | What KidQuest borrows |
|---|---|
| **Tamagotchi** | Egg Home — feed, play, watch, care. The egg feels alive. |
| **Pokémon FireRed** | Screen-based world map, encounter system, egg → creature → battle progression |
| **Animal Crossing** | Exploration is reward by itself. No pressure. Discovery is joyful. |
| **Mario Party** | Random events, surprise encounters, variety within a session |
| **WarioWare** | Micro-bursts of play. Fast, fun, unexpected. |

These are emotional references, not mechanical blueprints. Learning remains KidQuest's core value — these games are the *feeling* to aim for.

---

## High-Level Loop

```
Egg Home
  ↓
  Feed / play with / check on egg
  ↓
Enter the World
  ↓
  Walk through a region (Green Meadow, Beach, Forest...)
  ↓
  Random event triggers
    → Enemy encounter  → Battle  → Reward
    → Treasure chest   → Item
    → Rare egg spot    → Mini-hatch event
    → NPC              → Dialogue + gift
    → Boss encounter   → Hard battle + big reward
    → Secret           → Hidden area / surprise
  ↓
Return to Egg Home
  ↓
  Use rewards to care for egg
  ↓
  Egg grows → stages 1–7 → ready to hatch
  ↓
  Hatch → creature revealed → relationship summary shown
  ↓
New egg begins
  ↓
  (Loop)
```

---

## Egg Home

The main screen. The emotional anchor.

The child opens KidQuest and lands here, not a subject selector.

### What the child can do here

| Action | Description |
|---|---|
| **Feed egg** | Use food items. Egg reacts visually (happy animation). |
| **Play with egg** | Tap interactions — egg bounces, spins, makes sounds. |
| **Give items** | Star, ribbon, potion. Egg reacts uniquely to each. |
| **View inventory** | Items collected on exploration. |
| **View collection** | All hatched creatures. Tap to inspect. |
| **See creature walking** | One hatched creature walks/patrols the home area. |
| **Enter the World** | The main call to action. Big, clear button. |

### What is NOT here

- No subject selector
- No "Continue Adventure" recommendation card
- No level stats, readiness scores, or learning metrics
- No pressure to go anywhere specific

### Creature companion in Home

After the first hatch, one creature should be visible "living" in the home area. Not just a collection icon — actually walking or idle-animated. This creates attachment and incentivises hatching more eggs to see new creatures.

### Open questions for Egg Home

1. Does the Home screen look different per region visited (background art changes)?
2. How does the egg look when fed vs. unhappy vs. very happy?
3. Is there a "favorite creature" selector, or does it always show the most recently hatched?
4. Should the egg name system exist? (Tamagotchi-style naming at creation?)
5. What is the button / entry point to the World? A door? A map icon? A "ออกผจญภัย!" button?

---

## World Map

### Philosophy

The world is large and grows over time. Each region feels distinct and has its own character. Exploration itself is the reward — finding things, triggering events, returning home with items.

### Map structure: screen-based (Pokémon FireRed model)

NOT open-world scrolling. Screen-based navigation:
- Each "location" is one screen
- Moving to an edge takes you to the adjacent screen
- A region = a small grid of connected screens (e.g. 3×3 or 5×5)
- Simple, mobile-friendly, easy to expand

Example: Green Meadow region = 9 screens (3×3), each screen has different encounter rates and visual content.

**Why screen-based:**
- No scrolling complexity
- Easy to implement in React (show one screen component at a time)
- Easy to expand (add new screen = add new file/config)
- Pokémon FireRed-style movement is familiar to children

### Regions (Year 1 scope: 1–2 regions only)

| Region | Mood | Encounter types |
|---|---|---|
| Green Meadow | Bright, safe, easy | Slimes, caterpillars, flowers, rabbits, treasure |
| Beach | Cheerful, medium | Crabs, fish, waves, shells, hidden caves |
| Forest | Mysterious, medium-hard | Foxes, owls, mushrooms, rare eggs |
| Volcano | Hot, hard | Dragons, rocks, lava creatures, boss area |
| Snow Land | Calm, medium-hard | Penguins, ice creatures, rare eggs |
| Sky Kingdom | Magical, hard | Birds, clouds, star creatures |
| Space | Epic, very hard | Robots, aliens, legendary creatures |

**Year 1 implementation target: Green Meadow only.** Everything else is future expansion.

### Movement

On mobile: tap arrows (D-pad style) or tap destination tile.
The player avatar is the current egg (small egg sprite walking around).
No running — gentle waddle suits the egg character.

---

## Exploration

### Random encounter system

As the player moves through a region, each step has a chance of triggering a random event.

| Event type | Trigger condition | Result |
|---|---|---|
| Enemy encounter | Step-based probability | → Battle screen |
| Treasure chest | Placed on map, one-time | → Item reward |
| Wild rare egg | Low probability, special tiles | → Mini catch / adoption event |
| NPC | Fixed position, tap to talk | → Dialogue + possible gift |
| Boss | Fixed position, visible on map | → Hard battle, big reward |
| Secret | Hidden trigger tile | → Surprise (item, dialogue, hidden area) |

### Encounter probability (design suggestion)

Green Meadow: 15% per step (low — relaxed exploration feel)
Forest: 25% per step
Volcano: 35% per step

Child can walk freely between encounters. No grinding feel in early regions.

### Exploration feel

- No timer on exploration. The child walks at their own pace.
- Music and ambient sound shift per region.
- When an encounter triggers: brief flash/animation, then battle/event screen.
- After the event: return to exact same position on the map.
- Items and treasure chests persist in state (picked up = gone for the session, or permanently?).

---

## Battle

### Role of battle in the new model

Battle is the **consequence** of exploration, not the main game.

- You are walking in the world. An enemy appears. You must fight.
- Your egg fights using what you know.
- Learning happens inside battle — the child doesn't go to "Math class," they fight.

### How learning stays hidden

- The child sees: enemy, HP bars, move cards, egg reacting, damage numbers.
- The child does NOT see: "Thai Level 3," "Math L1–L5," "accuracy score."
- The move cards contain the learning content — numbers, Thai words, English pictures.
- The child experiences: "I chose the right attack and the enemy took damage."

### Battle as learning support

Knowledge subjects become egg abilities:

| Subject | Battle ability |
|---|---|
| Math | Calculation power (damage multipliers) |
| Thai | Defense / protection (HP bonus, shield) |
| English | Speed / evasion (chance to go first, dodge) |

This is **aspirational design** — not necessarily implemented immediately. The key principle: knowing more about any subject makes your egg stronger in some way.

### Battle types

| Type | Trigger | Difficulty |
|---|---|---|
| Wild encounter | Random exploration step | Easy–medium |
| NPC challenge | Talk to trainer NPC | Medium |
| Boss | Fixed boss spot on map | Hard |
| Challenger | Every 15 battle rounds (existing system) | Scales with tier |

---

## Learning Philosophy in the World Model

Learning must remain. It is the product's purpose. But its role changes.

### What changes
- Learning is no longer the front door (no subject selector as main screen)
- Learning is no longer named as "Thai" or "Math" in child-facing UI
- Learning is no longer "levels" to complete — it is power that grows naturally

### What does NOT change
- Questions are still correct/incorrect with meaningful feedback
- XP from correct answers still grows the egg
- sessionLog still records learning sessions for parent Report
- Subject Readiness still computed (for parents, not for the child)
- Teach overlays still exist (appear naturally in context)

### The hidden curriculum principle

The child does not know they are studying. They know:
- "I went to Green Meadow today"
- "My egg learned a new move"
- "I beat the Grass Boss"

The parent knows:
- "Chopin answered 8 Thai questions today"
- "Accuracy: 87%"
- "Subject Readiness: Comfortable"

These two views coexist in the same app.

---

## Transition from Current State

The current app has:
- Home 2.0 (Adventure Director model)
- Subject Adventure Engine (Continue Adventure card)
- Classic subject games (Thai/Math/English behind toggle)
- Minigames (EggRun etc.)
- Battle system (challengers, BattleScreen)

### What carries forward
- Procedural egg (LOCKED — no change)
- Battle system (BattleScreen, MoveSelectBattleMode, ChaseMode, DefenseMode)
- Subject content (Thai 5 levels, Math 9 levels, English 4 levels)
- Minigames (repurposed as exploration rewards, not daily events)
- Collection / creature system
- Item system (food, star, ribbon, potion)
- sessionLog + parent Report
- All existing XP and progression mechanics

### What is superseded
- Adventure Director model (no longer the primary navigation)
- "Continue Adventure" as main CTA
- Subject grid as navigation
- Daily Surprise as the exploration mechanic (replaced by real exploration)

### What needs to be designed before code
1. Egg Home screen layout (what does it look like? what interactions exist?)
2. World Map screen structure (how does navigation work on mobile?)
3. Battle entry from exploration (how does the encounter trigger / transition work?)
4. How does the current `currentWorld` state field map to the new model?
5. How does sessionLog work when sessions are triggered by exploration vs. subject select?

---

## MVP Scope (Year 1)

Keep scope minimal. One working loop, done well.

**Year 1 world MVP:**
1. Egg Home (replace current Home) — feed, play, enter world button
2. Green Meadow — 1 region, 3×3 screen grid
3. Random encounters — enemy battles (uses existing MoveSelectBattleMode)
4. Treasure chests — drop existing items (food, star, ribbon, potion)
5. Hatch loop remains — egg grows from exploration XP, hatches, creature revealed

**Everything else is expansion:**
- Other regions (Beach, Forest, etc.) — add one at a time
- NPC characters — after MVP stable
- Boss encounters — after 2+ regions exist
- Rare egg spots — after first hatch loop confirmed working
- Decorating Egg Home — much later

---

## Open Questions (for GPT before implementation)

### Priority questions (must answer before any code)

1. **Egg Home layout**: What does the Egg Home screen look like on a 390px iPhone? Should it be portrait-only? What is the primary visual — the egg large in center? What interactive elements exist?

2. **World entry**: What IS the MVP of the world? Is it a simple "choose region" screen (like a map icon select) or an actual navigable screen-based map? For Year 1 with one region, do we even need a world map screen yet?

3. **Encounter trigger**: How does a battle start during exploration? Does the child tap around a map screen and random things happen? Or is it a walking sim where steps auto-trigger? On mobile, "walking" must be touch-friendly.

4. **Subject assignment in exploration**: When an enemy encounter starts, which subject's questions appear? Is it random? Based on the region? Based on readiness? Based on what the child has played recently?

5. **XP source change**: Currently XP comes from answering questions correctly. In the world model, does XP still come from battles? Or also from exploration (finding treasure, walking, collecting)?

### Secondary questions (design clarification)

6. **Minigame repurposing**: EggRun, EggCatch, EggMemory, EggTower, EggFishing currently live as separate screens. In the world model, do they become exploration events (finding a "fishing spot" triggers EggFishing)? Or do they remain standalone?

7. **Creature companion in Home**: After hatching, one creature walks around Egg Home. How does this look in practice? Is it an emoji walking left-right on a loop? Or a canvas creature? Which creature shows — always the latest, or player's choice?

8. **Battle stakes in world model**: With no player HP in subject battle, the egg never loses. But in the world model, should boss battles have some form of consequence? Loss = pushed back to previous screen? Or still no consequence?

9. **Naming the egg**: Tamagotchi lets you name your companion. Should Chopin name each new egg? This would increase attachment. But it adds a UI step. Worth it?

10. **Session length expectation**: In the current model, one subject session = 8 questions ≈ 2–3 minutes. In the world model, how long should one "exploration session" be? Is there a natural stopping point, or is it open-ended?

---

## Non-Goals (Year 1 World)

- No multiplayer / friend codes
- No PvP
- No real-time multiplayer exploration
- No procedurally generated maps (hand-authored regions only)
- No physics-based movement
- No chat or social features
- No paid DLC regions
- No in-app purchases for map content (all Year 1 regions are free)

---

## Relationship to Other Documents

| Document | How it relates |
|---|---|
| `VISION.md` | World design must not violate the Golden Rule (one mastery level ahead). Green Meadow = Kindergarten level only. |
| `battle-feel-philosophy.md` | Battle inside the world uses the same feel grammar. No change to battle UX. |
| `egg-companion-adventure.md` | Egg companion reactions carry forward exactly into the world model. |
| `gameplay-loop.md` | This document **supersedes** the Home 2.0 philosophy. The new highest-level loop is here. |
| `play-observation-system.md` | Parent Report unchanged. sessionLog still works. Subject Readiness still computed. |
