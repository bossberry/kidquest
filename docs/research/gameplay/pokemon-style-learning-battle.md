# Pokémon-Style Learning Battle — Design Document

_Created: 2026-06-04. Updated: 2026-06-04 (Battle Feel Polish Pass — aligned with battle-feel-philosophy.md). Design only — no code. Related: `egg-companion-adventure.md`, `battle-progression.md`, `battle-feel-philosophy.md`_

> **Authority rule:** `battle-feel-philosophy.md` governs all sensory and emotional decisions. When this document conflicts with it, Battle Feel Philosophy wins.

---

## The Core Principle

**This is not a quiz with battle decoration. This is a battle where answers are moves.**

The psychological difference is enormous:

| Quiz-first framing | Battle-first framing |
|---|---|
| "Answer this question" | "Choose your attack" |
| Child sees: question → answer → animation | Child sees: enemy → move list → attack |
| Answer correct → reward animation plays | Move selected → move FIRES → effect happens |
| Learning is the work; battle is the prize | The learning IS the battle |
| Child feels: "I passed a test" | Child feels: "I won a fight" |

**The goal:** A 5-year-old who doesn't know they're learning. They think they're playing a battle game. The education is invisible inside the move mechanics.

---

## What This Is (and Isn't)

**Is:**
- A complete redesign of the battle UI so that every answer is a named attack move
- Subject-agnostic: same battle shell works for Math, Thai, English
- Child's current egg is the player hero (connects to Egg Companion Adventure)
- Every correct answer advances the battle; every wrong answer has a gentle miss

**Isn't:**
- A replacement for the existing Subject Adventure Engine (BattleMode/ChaseMode/DefenseMode)
- A replacement for GameMathBattle or BattleScreen
- A quiz with a battle skin layered over it
- A new unique minigame mechanic — it reuses attack/HP/enemy patterns from existing BattleMode

---

## The Move-Answer System

The fundamental mechanic: **answer choices are attack moves with names, icons, and damage.**

### Math Example

_Question logic: 2 + 3 = ?_

```
Enemy HP: ████████████ 🐉 "Dragon Cub"

Your egg is ready to attack!

⚡  5
🔥  6
❄️  4
🌪️  8
```

Icons are primary. Numbers are the answer. Move names are small flavor text below the icon (or hidden entirely). The child taps by icon + number — not by reading the name.

### Thai Example

_System speaks: "ปลา" (fish)_

```
Enemy HP: ████████████ 🐻 "Shadow Bear"

ไข่ของเราเตรียมโจมตี!

🌊  🐟
🔥  🐱
⚡  🐶
🌪️  🐰
```

The child hears "ปลา" and taps the card with 🐟. They choose an attack by matching sound to picture. Move names are tiny flavor text below the icon, or hidden entirely. They are not the answer.

### English Example

_System speaks: "cat"_

```
Enemy HP: ████████████ 👾 "Space Blob"

Your egg is ready!

🐾  🐱
🦴  🐶
💦  🐟
🥕  🐰
```

Same pattern. The child hears "cat" and taps the card with 🐱. Icons and answers drive the choice. Move names are tiny flavor text or hidden.

---

## Battle Flow (Per Turn)

```
1. Enemy appears with HP bar and name
   → Enemy has a brief "entrance" animation (slide in + shake)
   → Announcer: "[enemy name] ปรากฏตัว!"

2. Current egg appears as player hero (bottom-left)
   → Egg has the near-hatch glow if stage ≥ 5 (from egg-companion-adventure)
   → No player HP bar — the egg is never in danger (see battle-feel-philosophy.md)

3. "Turn begins" signal
   → Brief egg bounce: "ไข่พร้อมสู้!"

4. Move panel appears (4 choices)
   → Each choice: [emoji icon] [move name] .......... [answer]
   → Choices are large, tap-friendly, no small text required
   → TTS fires for Thai/English on question load (the word to match)

5. Child taps a move

6. Correct move:
   → Egg leaps forward (adv-jump)
   → Battle log: "⚡ [icon] [short name]!"
   → Move animation plays (elemental particle effect matching the icon)
   → Enemy flashes red / shakes
   → HP drains (animated bar)
   → Floating damage number rises and fades
   → Streak ≥ 2 → "Crit!" badge + ×1.5 damage

7. Wrong move:
   → Attack misses — soft fizzle particle on the move card
   → Battle log: "โจมตีพลาด!"
   → Enemy laughs or taunts (brief reaction animation — not punishing)
   → No damage dealt. No HP loss. No strike counter.
   → Battle continues to next turn immediately

8. Enemy defeated (HP = 0):
   → Enemy fades / explodes with stars
   → Victory confetti + fanfare
   → Egg celebration bounce
   → XP reward

9. If enemy still alive:
   → Enemy taunts briefly (animation only — no damage to egg)
   → Next turn begins
```

---

## Move Icons and Flavor Text

**Icons are primary. The answer content is primary. Move names are low-importance flavor.**

The child is choosing attacks by icon + answer. They are NOT reading move names.

### Move icon pool (assign randomly per turn)
```
⚡ 🔥 ❄️ 🌪️ 🌊 🌟 💥 🗡️ 🐾 🌿
```

### Move name flavor text (tiny, below icon — optional, can be hidden)

Examples only — not learning content:
- Thunder / Fire Spin / Blizzard / Whirlwind
- Scratch / Bark / Splash / Vine Whip

**Rules:**
- Move names must never be larger than the icon or the answer content
- The child should be able to ignore move names entirely and still play perfectly
- Names exist to add battle personality, not to teach vocabulary
- Rotate randomly per session for freshness

---

## Subject-Specific Question Types

All subjects use the same 4-choice move panel. The content embedded in the panel differs.

### Math

| Level | Move Panel Content | Example |
|---|---|---|
| L1–L2 | Tap the move showing the answer number | `2 + 3 = ?` → move shows `5` |
| L3+ | Tap the move where the number matches the sum | Visual count `🍎🍎🍎` → tap move showing `3` |
| Higher | Same equation style with larger numbers | `14 + 7 = ?` |

Numbers are large and prominent. No reading required.

### Thai

| Type | Move Panel Content |
|---|---|
| Letter match | Hear the word via TTS → tap move with matching starting letter |
| Word-picture match | Hear the Thai word → tap move with matching emoji |
| Spelling | See scrambled letters → tap move with correct order |

Thai content is always TTS-first. The emoji in each move is the answer option.

### English

| Type | Move Panel Content |
|---|---|
| Word-picture match | Hear the English word → tap move with matching emoji |
| Letter phonics | See emoji + hear word → tap move with correct starting letter |
| CVC words | Hear the CVC word → tap matching emoji |

English content is always TTS-first. No reading required at Kindergarten level.

---

## Visual Anatomy of the Battle Screen

```
┌─────────────────────────────────┐
│  ENEMY                           │
│  [enemy emoji]  ████████ HP     │
│  [enemy name]                    │
│                                  │
│  [Turn counter: Turn 1/8]        │
├─────────────────────────────────┤
│  BATTLE LOG / ANNOUNCER          │
│  "⚡ Thunder!"                   │
├─────────────────────────────────┤
│  PLAYER                          │
│  [egg canvas + combo glow]       │
│  [egg stage name]                │
├─────────────────────────────────┤
│  MOVE PANEL                      │
│  ┌──────────┐  ┌──────────┐     │
│  │    ⚡    │  │    🔥    │     │
│  │    5     │  │    6     │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │    ❄️    │  │    🌪️   │     │
│  │    4     │  │    8     │     │
│  └──────────┘  └──────────┘     │
└─────────────────────────────────┘
```

Key layout rules:
- Move panel takes bottom 40% of screen (primary interaction zone)
- Enemy occupies top 30% (visual target, focus of the battle)
- Enemy HP is the only HP bar — player has no HP bar
- Egg occupies middle-left (companion, always visible, with combo glow)
- Battle log is a single line (one announcer message at a time, short)
- No scrolling, no small text, no reading required for core play
- Move card shows icon (large) + answer content (large) + name (tiny flavor, optional)

---

## Animations Required

Each animation is a named CSS keyframe (follow existing `adv-jump`, `adv-dash`, `adv-shield` pattern):

| Animation | Trigger | Description |
|---|---|---|
| `move-select-pulse` | Hover/touch start on a move | Move card scales up slightly, glows |
| `egg-charge` | Pre-attack after tap | Egg vibrates in place (300ms) |
| `egg-lunge` | Attack begins | Egg leaps forward toward enemy (400ms) |
| `elemental-burst` | Move lands | Particle ring in move color (icon color) |
| `enemy-hit-shake` | Enemy takes damage | Enemy shakes horizontally (200ms) |
| `enemy-flash-red` | Enemy takes damage | Red overlay fades on enemy (150ms) |
| `hp-drain` | After hit | HP bar width animates down with color shift |
| `damage-float` | After hit | Damage number rises and fades (500ms) |
| `crit-badge` | Streak ≥ 2 correct | "CRIT!" badge scales in and out |
| `move-miss` | Wrong answer | Move sparks, fizzles, no forward movement |
| `enemy-counter` | Enemy attacks | Enemy lunges briefly toward egg |
| `egg-flinch` | Enemy counter lands | Egg shakes side-to-side |
| `victory-celebration` | Enemy HP = 0 | Enemy fades, confetti, egg full bounce |
| `move-panel-enter` | Turn begins | Move panel slides up from bottom |

Implementation note: use existing `@keyframes` where available (adv-jump covers egg-lunge with minor tuning). New keyframes follow `styles.css` naming pattern.

---

## Audio Required

Follow existing `playTone()` pattern in `src/lib/audio.js`. New types:

| Sound | Trigger | Character |
|---|---|---|
| `move-select` | Tap a move | Short sword whoosh (builds anticipation) |
| `egg-charge` | Pre-lunge vibration | Low rumble, rising pitch |
| `attack-fire` | Move animation plays | Subject-matched: lightning crackle / fire whoosh / ice shatter / wind gust |
| `hit-impact` | Enemy takes damage | 3-layer thud (existing `hit` tone is close) |
| `crit-sound` | Streak crit | Ascending 4-note burst (existing `streak`/`crit` is close) |
| `miss-sound` | Wrong answer | Soft fizzle — no harsh buzzer; just "that didn't land" |
| `enemy-taunt` | Enemy reacts to miss | Light growl or squeak — playful, not scary |
| `victory` | Enemy defeated | Existing `win` / `fanfare` tone |

TTS: Thai/English questions always fire TTS on move panel appear. `speakTh` / `speakEn` with 200ms delay to allow panel animation to settle. Sound toggle respected.

---

## Egg Integration

The player hero is always the child's current egg canvas (from `EggCanvas` component). This connects directly to the Egg Companion Adventure framing:

- The child's actual egg faces the enemy
- Egg reacts to every battle event (existing keyframes apply)
- Near-hatch egg (stage ≥ 5) glows continuously during battle
- After battle win: egg growth progress shows on result screen
- The egg is never at risk — wrong answers cause the attack to miss, not harm the egg
- The egg faces forward at all times. It never takes damage from mistakes.

The emotional message: **"Your egg is fighting beside you. Help it win by choosing the right move."**

---

## Session Structure

A standard Pokémon Battle session:
- 1 enemy per session (or 2 for longer sessions — test with Chopin first)
- 8 turns per enemy (= 8 questions, same as current Subject Adventure sessions)
- Each turn = 1 question embedded in 4 move choices
- Session ends: enemy defeated → XP reward → result screen

**There is no defeat condition. The child cannot lose.**

Wrong answers slow progress (missed attacks) but do not end the battle. The egg is never in danger. The session always ends in victory — the only question is how many turns it takes.

Result screen:
- Enemy HP drain display (enemy defeated = bar empty)
- Correct/total (e.g. "ตอบถูก 7/8")
- Egg growth progress (existing panel from BattleMode)
- Replay / Home buttons

---

## Subject Battle Shell Principle

**Same shell, different content.** This is the critical architectural rule.

```
PokémonBattle
├── BattleArena (enemy, HP bars, egg, announcer) — SHARED
├── MovePanel (4 buttons: icon + name + content) — SHARED
└── QuestionContent — SUBJECT-SPECIFIC
    ├── MathContent: number as the answer in each move
    ├── ThaiContent: emoji as the answer in each move + TTS
    └── EngContent: emoji as the answer in each move + TTS
```

The question content is injected into the move panel. The battle mechanics (HP, damage, streaks, animations, audio) are identical across all subjects.

This means:
- One new game component handles all three subjects
- Subject-specific question generation reuses `genMathQ`, `genThaiQ`, `genEngQ` from `GameSubjectAdventure.jsx`
- No new question types needed for MVP

---

## MVP Recommendation

### Phase 1: Math Battle (Implement First)

Math is the easiest subject to encode as move choices — numbers map directly to damage values. No TTS dependency for the core mechanic. Start here.

**What to build:**
- New `PokémonBattleMode.jsx` (or `MoveSelectBattleMode.jsx`) — replaces the current BattleMode in the Subject Adventure Engine for Math subject
- Move panel: 4 choices, each showing `[icon] [move name] ... [number]`
- Correct number = that move fires; wrong number = miss
- Reuse: existing BattleMode enemy sprites, HP bars, EggCanvas, damage animations
- Do NOT change BattleScreen (the challenger battle system stays as-is)

**Scope boundary:**
- Only Math first
- 8 turns per session
- 1 enemy per session
- Tap move → fire attack → next turn

### Phase 2: Thai Battle (After Math Playtest)

Add TTS for Thai words. Move choices show emoji options. Same battle shell.

### Phase 3: English Battle (After Thai Playtest)

TTS for English words. Move choices show emoji options. Same shell.

### Phase 4: Polish (After All Three Work)

- Differentiated elemental effects per move icon (color-coded particles)
- Enemy type-specific animations (boss enemies have different entrance/defeat)
- Move name rotation (randomize per session so familiar enemies feel fresh)

---

## Scope Check

This design passes the Scope Guardian test:
- **Not ahead of Year 1 scope** — uses existing Math/Thai/English content from current levels
- **No new unique mini-game** — reuses BattleMode mechanics (HP, enemies, animations, EggCanvas)
- **No stable engine modification** — EggAlgorithm untouched; existing question generators reused
- **Battle-first framing** is a UI/UX redesign of BattleMode, not a new system
- **Risk:** this replaces the current BattleMode in Subject Adventure. The existing BattleMode still works but is superseded by the move-select version. No regression risk to BattleScreen (challenger) or GameMathBattle.

---

## Open Questions for GPT

1. **Move damage values:** Should the correct move always deal the most damage (strategy-free) or should correct moves deal consistent damage and wrong moves just miss (no strategy needed)? Recommendation: correct = consistent damage, wrong = miss. Avoids the child "guessing the big number" instead of answering the question.

2. **Enemy taunt on wrong answers:** Should the enemy react every time (every wrong) or only every N wrongs? Recommendation: every wrong — keeps the battle feeling alive, enemy is responsive. Should feel playful, not threatening.

3. ~~**Player HP necessity**~~ — **DECIDED: Player HP removed.** The egg never loses HP. No defeat screen. No losing state. Wrong answers = miss + enemy reacts + continue. This is the correct design for a 5-year-old learner. (See `battle-feel-philosophy.md`.)

4. **Move name visibility:** Show tiny move names below the icon, or hide entirely and show only icon + answer? Recommendation: show tiny names for personality, but never emphasize. Can be hidden on smaller screens.

5. **Integration with existing BattleMode:** Replace BattleMode in Subject Adventure Engine entirely, or offer both modes? Recommendation: replace. The move-select design is strictly superior (more immersive). Avoid maintaining two parallel systems.

---

## Relationship to Other Systems

| System | Relationship |
|---|---|
| `egg-companion-adventure.md` | The player hero IS the current egg. All egg reaction keyframes apply unchanged. |
| `battle-progression.md` | Same XP dispatch, same LOG_SESSION, same level-unlock logic. Battle remains downstream from learning. |
| `BattleMode.jsx` | This design replaces BattleMode in Subject Adventure. BattleMode's HP/enemy/animation patterns are the foundation. |
| `BattleScreen.jsx` (challenger) | Unchanged. Challenger battles remain separate from Subject Adventure. |
| `GameMathBattle.jsx` | May be superseded. Math Pokémon Battle is the better version. Evaluate after playtest. |
| `gameplay-loop.md` | Core loop unchanged: Learn → XP → Egg → Hatch → Creature → Battle → Learn. The Pokémon Battle IS the "learn" step in new clothes. |
| Subject Adventure Engine | Pokémon Battle becomes the `battle` mode in the 3-mode rotation (replacing current BattleMode). Chase and Defense modes remain. |
