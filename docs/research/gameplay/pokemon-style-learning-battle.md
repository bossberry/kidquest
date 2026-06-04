# Pokémon-Style Learning Battle — Design Document

_Created: 2026-06-04. Design only — no code. Related: `egg-companion-adventure.md`, `battle-progression.md`_

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

⚡ Thunderbolt ............. 5
🔥 Fireball ............... 6
❄️ Ice Beam ............... 4
🌪 Wind Slash ............. 8
```

The move name is decoration. The **number IS the answer.** Correct number = that move fires and deals real damage. Wrong numbers = moves that miss or deal less damage.

### Thai Example

_System speaks: "ปลา" (fish)_

```
Enemy HP: ████████████ 🐻 "Shadow Bear"

ไข่ของเราเตรียมโจมตี!

🌊 Water Slash ............ 🐟
🔥 Fire Fang .............. 🐱
⚡ Thunder Kick ........... 🐶
🌪 Wind Claw .............. 🐰
```

The child hears "ปลา" and selects the matching emoji. The emoji IS the answer. The move name is flavor. Water Slash fires because the child matched the word to the fish — not because they tapped "Water Slash."

### English Example

_System speaks: "cat"_

```
Enemy HP: ████████████ 👾 "Space Blob"

Your egg is ready!

🐾 Scratch ................ 🐱
🦴 Bark ................... 🐶
💦 Splash ................. 🐟
🥕 Hop .................... 🐰
```

Same pattern. The child hears "cat" and taps 🐾 Scratch because it has 🐱 on it. They're not thinking "match the word to the picture" — they're thinking "use the cat attack!"

---

## Battle Flow (Per Turn)

```
1. Enemy appears with HP bar and name
   → Enemy has a brief "entrance" animation (slide in + shake)
   → Announcer: "[enemy name] ปรากฏตัว!"

2. Current egg appears as player hero (bottom-left)
   → Egg has the near-hatch glow if stage ≥ 5 (from egg-companion-adventure)
   → Player HP bar shown (or skip if child doesn't need to lose)

3. "Turn begins" signal
   → Brief egg bounce: "ไข่พร้อมสู้!"

4. Move panel appears (4 choices)
   → Each choice: [emoji icon] [move name] .......... [answer]
   → Choices are large, tap-friendly, no small text required
   → TTS fires for Thai/English on question load (the word to match)

5. Child taps a move

6. Correct move:
   → Egg leaps forward (adv-jump)
   → Announcer: "ไข่ใช้ [move name]!"
   → Move animation plays (elemental particle effect matching the icon)
   → Enemy flashes red / shakes
   → HP drains (animated bar)
   → Floating damage number rises and fades
   → Streak ≥ 2 → "Crit!" badge + ×1.5 damage

7. Wrong move:
   → Move fizzles or misses (partial animation, no impact effect)
   → Announcer: "โจมตีพลาด!" (gentle, not "wrong")
   → No damage dealt
   → 3 wrong in a row → enemy counter-attacks (enemy lunge + egg shakes + player HP loss)

8. Enemy defeated (HP = 0):
   → Enemy fades / explodes with stars
   → Victory confetti + fanfare
   → Egg celebration bounce
   → XP reward

9. If enemy still alive:
   → Enemy counter-attack after every Nth turn (every 3 correct answers, or when HP > 50%)
   → Enemy lunge animation + egg shakes (no big HP damage — keep pressure low)
   → Next turn begins
```

---

## Move Names by Subject

Move names are purely decorative — they exist to make the child feel like they're choosing an attack, not an answer. The actual learning content is the number or image shown after the move name.

### Math Move Names
```
⚡ Thunderbolt
🔥 Fireball
❄️ Ice Beam
🌪 Wind Slash
🌊 Tidal Wave
🌟 Star Blast
💥 Explosion
🗡️ Sword Strike
```

### Thai Move Names
```
🌊 Water Slash
🔥 Fire Fang
⚡ Thunder Kick
🌪 Wind Claw
🌿 Leaf Blade
🔥 Flame Burst
❄️ Frost Bite
🌟 Light Beam
```

### English Move Names
```
🐾 Scratch
🦴 Bark
💦 Splash
🥕 Hop
🌀 Spin
⚡ Zap
🌿 Vine Whip
🔥 Ember
```

Move names should feel age-appropriate (Pokémon-ish but not exact copies). Rotate assignment randomly each session — the child should encounter different names each battle.

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
│  "ไข่ใช้ Thunderbolt!"           │
├─────────────────────────────────┤
│  PLAYER                          │
│  [egg canvas]   ████████ HP     │
│  [egg stage name]                │
├─────────────────────────────────┤
│  MOVE PANEL                      │
│  ┌──────────┐  ┌──────────┐     │
│  │⚡Thunder │  │🔥Fireball│     │
│  │    5     │  │    6     │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │❄️Ice Beam│  │🌪Wind    │     │
│  │    4     │  │    8     │     │
│  └──────────┘  └──────────┘     │
└─────────────────────────────────┘
```

Key layout rules:
- Move panel takes bottom 40% of screen (primary interaction zone)
- Enemy occupies top 30% (visual target, focus of the battle)
- Egg occupies middle-left (companion, always visible)
- Battle log is a single line (one announcer message at a time)
- No scrolling, no small text, no reading required for core play

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
| `enemy-counter` | Enemy attacks | Different than `hit` — a growl + lower thud |
| `miss-sound` | Wrong answer | Soft fizzle — no harsh buzzer; just "that didn't land" |
| `victory` | Enemy defeated | Existing `win` / `fanfare` tone |
| `gentle-defeat` | Player HP = 0 | Soft descending 3-note — no jarring sound |

TTS: Thai/English questions always fire TTS on move panel appear. `speakTh` / `speakEn` with 200ms delay to allow panel animation to settle. Sound toggle respected.

---

## Egg Integration

The player hero is always the child's current egg canvas (from `EggCanvas` component). This connects directly to the Egg Companion Adventure framing:

- The child's actual egg faces the enemy
- Egg reacts to every battle event (existing keyframes apply)
- Near-hatch egg (stage ≥ 5) glows continuously during battle
- After battle win: egg growth progress shows on result screen
- The egg is not at risk — wrong answers make it stumble, not take lethal damage

The emotional message: **"Your egg is fighting beside you. Help it win by choosing the right move."**

---

## Session Structure

A standard Pokémon Battle session:
- 1 enemy per session (or 2 for longer sessions — test with Chopin first)
- 8 turns per enemy (= 8 questions, same as current Subject Adventure sessions)
- Each turn = 1 question embedded in 4 move choices
- Session ends: enemy defeated → XP reward → result screen

If player HP reaches 0 before enemy is defeated:
- Gentle defeat screen: "สู้ต่อไปนะ! เดี๋ยวลองอีกครั้ง"
- No XP loss. Full XP for correct answers already given
- Option to replay same battle or exit

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

2. **Enemy counter-attack timing:** Should enemies counter only on wrong answers (3×) or also after every N turns regardless of accuracy? Recommendation: only on wrong answers × 3 — keeps the counter-attack as a natural consequence, not random.

3. **Player HP necessity:** Does a 5-year-old benefit from having a player HP bar (stakes) or does it add pressure? Consider: no player HP at all, just an enemy HP bar. Child always survives; the question is how fast they defeat the enemy. Recommendation: defer to play observation after Math MVP. Test both variants if possible.

4. **Move name variety:** Should move names be completely random per turn (freshness) or loosely themed to the subject (Thai vocabulary words learn move names of animals, Math gets physics-y names)? Recommendation: loosely themed — adds subtle reinforcement. Thai battle uses animal-themed move names; Math uses power/force names.

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
