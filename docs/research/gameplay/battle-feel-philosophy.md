# Battle Feel Philosophy — KidQuest
_Created: 2026-06-04_

---

## Core Principle

**Battle itself is the experience. Not a quiz. Not a quiz with animation.**

Fun comes from anticipation, animation, sound, impact, HP drain, enemy reactions, combos, crits, and victory — not from text, move names, or long explanations.

The child should feel **"I choose attacks."**
Not: **"I answer quizzes."**

This document defines the sensory and emotional grammar for all Subject Battle implementations.
It is required reading before implementing **Math Pokémon Battle MVP**, **Thai Battle**, or **English Battle**.

---

## Visual Hierarchy

### What to emphasize (largest / most prominent)

1. **Enemy** — always the emotional center of the screen
2. **Enemy HP bar** — the thing the child is destroying
3. **Battle log** — single line of feedback, always moving
4. **Move panel** — 4 large tap targets with icons

### What to de-emphasize

- The question itself
- Move names (flavor only)
- Text labels

### The question disappears into move selection

Do NOT show:

```
2 + 3 = ?
```

large in the center.

Instead:

```
[Enemy sprite]
[HP ████░░░░░░]

Battle log: 🥚 ไข่ใช้ไฟฟ้า!

┌──────────┐  ┌──────────┐
│  ⚡  5   │  │  🔥  6   │
│ Thunder  │  │ Firespin │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│  ❄️  4   │  │  🌪️  8   │
│ Blizzard │  │ Whirlwind│
└──────────┘  └──────────┘
```

The child is choosing an attack. The number is the damage value / answer. The move panel replaces the quiz panel.

---

## Move Icons and Flavor

- **Icons are primary** — large, immediately recognizable emoji
- **Move names are secondary** — small label below icon, flavor text only
- **Text stays small** — the number/answer content is what matters
- **Animations matter more than names** — never delay an animation for a text label

Move names give the battle personality. They are NOT learning content. A child does not need to know what "Thunderbolt" means to tap the right answer.

---

## Player HP: Removed

**The egg never loses HP. There is no game over. There is no losing.**

Wrong answers:
- Cause the attack to miss (soft fizzle effect)
- Slow progress
- Allow the enemy to react (laugh, taunt)
- Do NOT damage the egg

**Emotional message: Mistakes are safe. The egg is always with you.**

This is not a weakness in the game design — it is the design. The child is 5 years old. Anxiety from losing HP is a barrier to learning, not a motivator.

The egg faces forward. The egg is never in danger.

---

## Wrong Answer Philosophy

**Never:**
- ❌ "ผิด!" / "Wrong!" banner
- Harsh buzzer sound
- Red flash punishment
- HP loss
- Strike count that feels like "3 and you're out"

**Instead:**
- "โจมตีพลาด!" in the battle log
- Soft fizzle particle effect on the failed move
- Enemy laughs or does a taunt animation (reactive, not punishing)
- Battle continues immediately

The wrong-answer moment should feel like a near-miss in a game — "oops, not that one" — not a failure state.

---

## Anticipation Sequence

Every tap on a move card triggers a full anticipation sequence. This is what makes the battle feel like a game, not a quiz.

```
1. Tap move card
   ↓
2. Move card pulses (scale up + glow)
   ↓
3. Charge effect on egg (glow ring, 200ms build)
   ↓
4. Egg jumps forward (lunge animation)
   ↓
5. Elemental burst effect (icon-matched particle: ⚡🔥❄️🌪️)
   ↓
6. Enemy flashes (red, 100ms)
   ↓
7. Camera shake (screen micro-shake, 150ms)
   ↓
8. HP bar drains (animated, not instant)
   ↓
9. Damage number floats up (large, then fades)
   ↓
10. Combo check → if ≥2 correct streak, apply combo glow
    ↓
11. Victory check → if enemy HP = 0, trigger defeat sequence
```

This sequence must feel **fast** and **responsive**. Total duration: ~800–1000ms. Do not slow gameplay. Use CSS animations, not JS timeouts chained together.

---

## Sound Philosophy

Every moment should feel alive. Sound transforms animation into impact.

| Event | Sound character |
|-------|----------------|
| Move select (tap) | Warm pop / whoosh |
| Charge | Building hum |
| Attack fire | Elemental SFX (thunder crack / fire whoosh / ice chime / wind sweep) |
| Hit landing | 3-layer impact thud |
| Enemy reaction | Surprised squeak / laugh |
| Combo x2 | Rising chime |
| Combo x3 | Ascending fanfare |
| Critical hit | 4-note ascending riff |
| Miss / fizzle | Soft descending tone, no harshness |
| Victory fanfare | 6-note celebratory fanfare |

**Tone:**
- Cute
- Positive
- Pokémon-like (clean tones, not realistic SFX)
- Mario-like (responsive, musical)
- **No harsh sounds** — no buzzers, no horns, no error tones
- **Always respect sound toggle**

---

## Combo System

Consecutive correct answers build a combo counter.

| Streak | Effect |
|--------|--------|
| 1 | Normal attack |
| 2 | Combo glow — gold outline on egg |
| 3 | Combo flash — screen briefly gold-tinted |
| 4+ | **Critical hit** — ×1.5 damage + ascending fanfare + large damage number |

**Visual:**
- Gold glow builds with each hit
- On crit: full screen flash (brief, < 200ms), large floating "CRITICAL!" label
- Damage number scales larger per combo level

**Audio:**
- Each hit in a combo plays an ascending note in sequence
- Crit breaks into a full ascending fanfare riff

Breaking the combo (miss) resets gracefully. No shame. The gold glow simply fades.

---

## Victory Sequence

Enemy defeat must feel **amazing**. This is the emotional peak of the battle.

```
1. Final hit lands
   ↓
2. Enemy HP drains to zero (animated)
   ↓
3. Enemy wobbles / staggers
   ↓
4. Enemy fades out (opacity + scale down)
   ↓
5. Stars burst from where enemy was
   ↓
6. Confetti falls
   ↓
7. Victory fanfare plays
   ↓
8. Egg celebrates (jump + sparkle + near-hatch glow if stage ≥ 5)
   ↓
9. Egg growth progress appears ("ไข่โตขึ้น! +XP")
   ↓
10. Victory result screen slides in
```

The child should feel genuine triumph. The battle was won because they chose the right attacks.

---

## Battle Log

Single line. Always visible. Always updating. Never two lines at once.

| Situation | Log text |
|-----------|----------|
| Move selected | 🥚 ไข่ใช้ [ชื่อท่า]! |
| Attack lands | โจมตีโดน! |
| Miss | โจมตีพลาด! |
| Combo x2 | คอมโบ! |
| Critical hit | Critical hit! |
| Enemy counter | ศัตรูโต้กลับ! |
| Enemy defeated | มอนสเตอร์พ่ายแพ้! |
| Victory | ชนะแล้ว! 🎉 |

**Rules:**
- One line at a time — never stack multiple messages
- Keep text short — no full sentences, no explanations
- Thai-first — use Thai labels everywhere
- Battle log is flavor, not tutorial

---

## Animation Philosophy

**Fast. Responsive. Juicy. Do not slow down gameplay.**

- Prefer CSS keyframes over JS-driven animation
- Reuse existing keyframes from `styles.css` where possible (`adv-jump`, `victory-bounce`, `shake`, etc.)
- New keyframes needed: `move-card-pulse`, `egg-charge`, `egg-lunge`, `elemental-burst`, `hit-flash`, `miss-fizzle`, `damage-float`, `enemy-defeat-fade`
- Total anticipation sequence: ≤ 1000ms
- Do not wait for animation to complete before accepting next input — queue if needed
- `@media(prefers-reduced-motion:reduce)` must disable all decorative animations

---

## Screen Layout Reference

```
┌─────────────────────────────┐
│                             │
│    [Enemy sprite — large]   │
│    [HP ██████░░░░]          │
│                             │
│    [Battle log — 1 line]    │
│                             │
│  [Egg canvas + combo glow]  │
│                             │
├─────────────────────────────┤
│  [Move card]  [Move card]   │
│  [Move card]  [Move card]   │
└─────────────────────────────┘
```

- Enemy takes top ~45% of screen
- Battle log is a thin strip, always visible
- Egg is positioned below battle log, above move panel
- Move panel is bottom ~35% of screen — 4 large tap targets
- No permanent HP bar for player (removed)

---

## What This Document Governs

Battle Feel Philosophy applies to:
- `MoveSelectBattleMode.jsx` (PSLB-1 through PSLB-3)
- Any future Subject Battle implementation (Thai, English, future subjects)
- BattleMode in Subject Adventure Engine (retroactive improvement)
- Any standalone battle component

It does NOT govern:
- BattleScreen.jsx (challenger battle — different system)
- Minigames (EggRun, EggCatch, etc.)
- Shop / Mission screens

---

## Implementation Priority

Battle Feel must be implemented **before** Math Pokémon Battle MVP content (PSLB-1).

Getting the feel right first means content (questions, move sets, subjects) can be added into a system that already has the right emotional grammar. Adding content to a flat quiz shell and patching feel later is much harder.

**Order:**
1. **Battle Feel baseline** — anticipation sequence, miss effect, combo glow, victory sequence (this document)
2. **PSLB-1** — Math Move-Select Battle content
3. **PSLB-2** — Thai content injection
4. **PSLB-3** — English content injection
5. **PSLB-4 / PSLB-5** — Full animation + audio polish pass

---

## Open Questions Before Implementation

1. **Move card layout** — 2×2 grid or horizontal row? 2×2 gives larger tap targets on mobile. Row gives more screen for enemy. Recommendation: 2×2.
2. **Damage numbers** — floating above enemy or floating in center screen? Floating above enemy is more spatially grounded.
3. **Enemy counter on wrong answers** — every 3 misses (current BattleMode behavior) or every N turns regardless? Current behavior is simpler and less punishing. Recommend keeping every-3-misses.
4. **Combo reset on session end** — combo should reset between sessions but not between battles in a multi-battle session. Confirm session structure before implementing.
5. **Sound assets** — new `move-select`, `attack-fire-thunder`, `attack-fire-flame`, `attack-fire-ice`, `attack-fire-wind`, `miss-fizzle`, `combo-chime`, `crit-fanfare` need to be added to `playTone()` in `audio.js`. Confirm naming convention with audio system before wiring.

---

## Relationship to Other Documents

| Document | Relationship |
|----------|-------------|
| `pokemon-style-learning-battle.md` | Parent spec — battle structure, content encoding, subject shell. Battle Feel governs the sensory layer on top. |
| `egg-companion-adventure.md` | Egg reactions (jump, glow, shake, near-hatch) integrate directly into the anticipation sequence. |
| `battle-progression.md` | Battle as reward philosophy — battle feel amplifies the reward value. |
| `gameplay-loop.md` | Battle is the peak of the core loop. Feel quality directly affects whether children return to learn more. |
