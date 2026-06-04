# Egg Companion Adventure — Design Document

_Created: 2026-06-04. Documentation session only — no code changes._
_Related: [[egg-economy]], [[gameplay-loop]], [[battle-progression]]_

---

## Core Idea

The child is not answering questions. The child is taking their egg on adventures.

The egg is the companion. It travels with the child across every activity — Subject Adventure, battle, missions. Every correct answer helps the egg. Every session brings the egg closer to hatching. When the egg hatches, it feels like a relationship payoff, not a mechanical reward.

This reframe does not change the game mechanics. It changes the emotional meaning of every session.

---

## Problem with the Current Experience

Right now, the egg lives on the Home screen. It grows when XP accumulates. Hatching happens as a separate event.

The child learns → earns XP → egg grows. But **the egg is not present during learning**. It waits passively.

This breaks the companion relationship. The child cannot form attachment to something they do not see or interact with. The egg is currently a progress bar shaped like an egg, not a companion.

---

## Design Principle

> **The egg is the hero before it hatches.**

Every activity is an adventure _with_ the current egg. The child is not playing for points — they are helping their egg grow, explore, and survive each adventure. The egg reacts. The egg progresses. The egg hatches because the child protected and nurtured it.

This transforms:
- Correct answers → "I helped my egg!"
- Wrong answers → "My egg is worried — I'll try again."
- Streak → "My egg is glowing!"
- Near hatch → "My egg is almost ready!"
- Hatch → "We did it together!"
- New egg → "A new adventure begins."

---

## Gameplay Loop (Companion Frame)

```
Current egg
  ↓
"Let's go on an adventure!" (egg visible in session)
  ↓
Child answers questions
  ↓
Egg reacts to each answer (jump / glow / worry / bump)
  ↓
Session ends → egg grows visibly
  ↓
Near hatch → egg glows / cracks / pulses more
  ↓
Hatch → creature is born (relationship payoff)
  ↓
"Your egg hatched into [creature]! It was with you for [N] adventures."
  ↓
New egg → new journey begins
```

---

## Application by Game Mode

### Subject Adventure (BattleMode / ChaseMode / DefenseMode)

**Current:** The baby creature emoji is a generic placeholder (🥚/🐣/🌟 by subject).

**Target:** Replace the baby placeholder with the child's **actual current egg** (canvas-rendered, same visual as Home).

- **BattleMode:** Egg stands beside the player. Enemy attacks — egg flinches. Correct answer — egg jumps with joy and the enemy takes damage.
- **ChaseMode:** Egg rides with the player along the track. Correct — egg and player dash forward together. Wrong — egg wobbles but stays beside the player.
- **DefenseMode:** Egg IS the thing being defended. The child is protecting their own egg from attackers. Correct — egg glows and shield bounces. Wrong — egg shakes slightly (worried, not hurt).

DefenseMode is the strongest companion framing: the child is literally shielding the egg from harm.

### Battle (BattleScreen — challenger/AI battle)

**Current:** Battle screen has no egg presence.

**Target:** Show a small egg portrait in the player's corner (like a sidekick HP display but no HP — just presence).

- Egg pulses gently during battle idle.
- On win: egg jumps + grows animation (mini XP flash).
- On lose: egg hugs the player emoji (no punishment framing — just "we'll try again together").

This is a small, low-risk addition that ties the battle outcome emotionally to the egg.

### Shop Mission (GameShop)

**Current:** No egg presence.

**Target:** Egg appears in the corner of the shop screen, watching.

- Correct answer → egg bounces once.
- Mission complete → egg glows → "เก่งมาก! ไข่ของเราโตขึ้นนะ!"
- The XP gain is already wired — we just need the egg to visibly celebrate it.

### Future: Cooking Mission / Garden Mission

These missions involve nurturing (cooking food, growing plants). The egg companion framing is natural:
- "Cook something delicious for our egg!"
- "Grow a plant and share it with our egg!"
- Egg reacts to completed missions with a happy bounce + glow.

The companion framing does not change mission content. It adds an emotional layer on top.

### Surprise Events (minigames)

Current minigames (EggCatch, EggMemory, EggTower, EggRun, EggFishing) already use egg imagery. These are already companion-adjacent.

**Reinforcement:** Start screen of each should say something like "ช่วยไข่ของเรานะ!" — frame it as helping your egg, not just playing a minigame.

---

## Visual Behavior Spec

### Egg Presence in Sessions

| Location | What appears |
|----------|-------------|
| Subject Adventure (BattleMode) | Egg beside player character, small (40–50px canvas) |
| Subject Adventure (ChaseMode) | Egg inside player dash icon area |
| Subject Adventure (DefenseMode) | Egg IS the center object being defended (replaces 🥚 placeholder) |
| BattleScreen | Small egg portrait in player corner (32–40px), idle pulse |
| GameShop | Egg in top-right corner (32px), visible throughout |
| Future missions | Egg in corner or beside mission character |

### Egg Reaction Animations (triggered by game events)

| Event | Egg animation |
|-------|--------------|
| Correct answer | Quick upward jump (adv-jump, already exists) + brief glow |
| Streak ≥ 2 | Stronger glow + bounce (brighter than single-correct) |
| Streak ≥ 5 | Egg pulses gold (if near-hatch stage, extra intensity) |
| Wrong answer | Gentle side-to-side wobble (worried, not hurt) |
| Wrong ×3 (damage) | Egg bumps gently (shakes once, no harm framing) |
| Session complete | Egg bounces + stage-growth flash if XP threshold crossed |
| Near hatch (stage 5–6) | Continuous subtle crack/glow/pulse even at idle |
| Hatch trigger | Full hatch overlay (already implemented — egg already glows) |

### Stage Visibility in Sessions

Show the egg's current stage number or progress bar **only** in post-session summary, not during gameplay. During gameplay, the egg reacts — it does not display a number. Numbers during play break immersion and add pressure.

Post-session: "ไข่ของเรา: ขั้น N/7" or small XP bar filling.

---

## Audio Behavior Spec

| Event | Sound |
|-------|-------|
| Correct answer (egg moment) | Existing `correct` tone + add brief chirp (high soft pop, ~150ms) |
| Streak egg glow | Existing `streak` tone is sufficient |
| Near hatch (stage 6) | `eggReady` tone (already implemented in audio.js) on session end |
| Hatch | `reveal` + staggered `fanfare` (already implemented) |
| Session egg summary | `complete` tone (already exists) |

**Important:** Do not add new audio layers that compete with question feedback tones. The egg chirp should be quieter and shorter than the correct-answer tone. Egg is the companion sound — it should underscore, not dominate.

---

## Progress Behavior Spec

### What to show during sessions

- Egg visible and reacting: yes.
- XP numbers mid-session: no (distracting from learning task).
- Stage number mid-session: no.
- Streak counter: only if the current game mode already shows it (e.g., BattleMode streak badge already exists).

### What to show post-session

Post-session summary screen should include an egg moment:
- Egg graphic (current stage).
- Brief text: "ไข่ของเราโตขึ้นนะ!" or "อีกนิดเดียวก็ฟักแล้ว!" (if near stage 6).
- If stage advanced this session: show the new stage with a glow.
- If ready to hatch: show hatch CTA on the summary screen (not just on Home).

---

## Relationship Data

These fields track the history between the child and the current egg. They do not affect gameplay. They appear as flavor text after hatching on the creature detail card.

### Fields to track per egg (in egg object)

```js
// All fields default to 0 / null. Non-breaking addition to defaultState egg object.
adventuresWith: 0,          // sessions completed while this egg was current
questionsAnswered: 0,       // total questions answered during this egg's journey
favoriteSubject: null,      // subject with most sessions during this egg (computed at hatch)
favoriteMode: null,         // adventure mode most played (battle/chase/defense — computed)
daysTogetherCount: 0,       // calendar days from egg start to hatch
bornFrom: null,             // subject profile summary at hatch (e.g., 'math-strong')
eggStartDate: null,         // ISO date string — when this egg became current
```

### How these appear post-hatch (creature detail)

```
🥚 → 🐲 Draco
ผจญภัยด้วยกัน: 14 ครั้ง
คำถามที่ตอบ: 112 ข้อ
วิชาโปรด: คณิตศาสตร์
อยู่ด้วยกัน: 8 วัน
```

This creates a unique biography for every creature. No two creatures have the same story.

### What NOT to track

- Score history (that is sessionLog's job).
- Streaks (pressure framing).
- Accuracy per egg (could make child feel bad about a creature).
- Time played (privacy + pressure).

---

## Emotional Payoff Architecture

The companion system works in three phases:

### Phase 1 — Formation (new egg)
Child sees the new egg on Home. Text: "เพื่อนใหม่กำลังรอการผจญภัย!" (A new friend is waiting for adventure!)

First session with new egg: egg is extra animated, bounces on every correct answer. Establishes the companion bond early.

### Phase 2 — Journey (growing egg)
Sessions accumulate. Egg becomes familiar. The child recognizes this specific egg (the procedural egg visual is unique — same egg across all sessions). The egg's reactions become meaningful because the child has seen them many times.

### Phase 3 — Ready (stage 5–6)
Egg shows visible readiness cues even on Home (cracking, pulsing, glow). In sessions, egg pulses more intensely on correct answers. Near-hatch feeling builds anticipation.

Text clues at stage 6: "ไข่กำลังจะฟัก... ผจญภัยอีกครั้งเถอะนะ!" (The egg is about to hatch... let's go on one more adventure!)

### Phase 4 — Hatch (relationship payoff)
Hatch overlay already has creature reveal. Add:
- Show egg biography: "ผจญภัยด้วยกัน N ครั้ง, ตอบคำถาม N ข้อ"
- Text: "ไข่ของเราฟักออกมาเป็น [creature name] แล้ว!"
- This makes hatching feel like a graduation, not a gacha pull.

---

## MVP Recommendation

**Smallest change that delivers the biggest emotional shift:**

> **Replace the DefenseMode baby placeholder with the child's actual current egg.**

Why this is MVP:
1. DefenseMode already frames the egg as the thing being protected. The child is defending their egg.
2. The egg visual is already a canvas component (`drawEgg()` — LOCKED but usable).
3. One prop change in DefenseMode: instead of rendering `🥚`, render the egg canvas at current stage.
4. Zero new state fields required.
5. Zero risk — egg algorithm is not modified, only rendered in a new location.

**MVP Step 2 (next smallest):**
> Show egg portrait in BattleMode beside player. Add the jump reaction on correct answers.

`adv-jump` keyframe already exists. Just needs the egg canvas rendered in BattleMode.

**MVP Step 3 (relationship data):**
> Add `adventuresWith` and `questionsAnswered` counters to the current egg object. Increment in `ADD_XP` reducer alongside XP addition.

This is two fields + two increment lines. Non-breaking. Pays off at creature detail after hatch.

**What to defer:**
- Hatch summary biography text (needs relationship data fields first).
- Post-session egg growth flash (needs more design on the result screen UX).
- Shop / Mission egg presence (lower emotional impact than Subject Adventure).
- `favoriteSubject` computation (can be derived from sessionLog at hatch time — no extra tracking needed).

---

## Implementation Risks

| Risk | Mitigation |
|------|-----------|
| Egg canvas in 3 game views slows render | Egg canvas is tiny (40–50px). `drawEgg()` is cheap. No animation on canvas — CSS handles movement. |
| Egg reactions distract from question focus | Reactions are brief (150–300ms CSS transitions). Egg should never move during the question answer window — only after. |
| Relationship data fields break old state | All new fields default to 0/null. No migration needed — they accumulate from zero on existing eggs. |
| Egg visual looks wrong in different game contexts | Use same canvas component, just smaller. Egg is recognizable at 40px. |
| DefenseMode egg swap breaks game identity | DefenseMode was using generic placeholder anyway. The actual egg is more meaningful. |

---

## Non-Goals

- Do not add egg HP or egg health that decreases with wrong answers. The egg is never in danger from the child's mistakes.
- Do not add egg personality types, egg rarities, or egg augmentation systems.
- Do not show egg XP numbers during gameplay.
- Do not create egg-specific power-ups or egg items.
- Do not implement egg social sharing.
- Do not show accumulated relationship data during the journey (only at hatch reveal).
- Do not track speed, streaks, or accuracy as egg health inputs.

---

## System Relationships

- **[[egg-economy]]** — XP thresholds, stage system, and hatch trigger are all defined here. Companion system adds emotional layer; does not change XP math.
- **[[gameplay-loop]]** — Adventure Director recommends activities. Companion system makes those activities feel like they have a consistent protagonist (the egg).
- **[[battle-progression]]** — Battle is the reward after learning. Egg companion in battle reinforces the learning→battle→egg-grows loop.
- **[[observation-philosophy]]** — Relationship data is observation, not pressure. It describes what happened, not how well the child performed.

---

## Open Questions for GPT

1. **Should the egg react differently by subject?** (e.g., Thai adventures = egg glows warm orange, Math = blue sparkle, English = green pop) — adds variety but adds complexity.
2. **Should the egg have a name?** (child names the egg at creation) — strong attachment mechanic but adds an onboarding step and UI complexity.
3. **Should hatching summary show the relationship biography before or after the creature reveal?** — Before: sets up the payoff. After: lets the creature shine first. Which is more emotionally satisfying?
4. **Should the companion framing be explicit in UI text ("ผจญภัยกับไข่ของคุณ!") or implicit (egg is just present and reacting)?** — Explicit risks feeling forced. Implicit relies on the child noticing. Which age-appropriate for 5-year-old?
5. **Should `adventuresWith` count sessions or rounds?** — Sessions (per game start) are more meaningful as a biography stat. Rounds might inflate quickly.
