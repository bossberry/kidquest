# Egg Home — Design Document
_Created: 2026-06-09. Companion to `kidquest-world.md`._
_Status: Design phase. No code yet. Needs GPT review before implementation._

---

## What Is Egg Home?

Egg Home is the first screen the child sees when they open KidQuest.

It is not a menu. It is not a subject selector. It is a place.

The child's egg lives here. The child visits, cares for the egg, watches it grow, and then leaves to explore the world — and returns. Every session begins and ends here.

**Emotional goal:** The child should feel *"I want to visit my egg."*

Not: "I should do my learning today."

---

## Inspirations

| Game | What Egg Home borrows |
|---|---|
| **Tamagotchi** | The egg is alive. It has a mood. It reacts when you visit. It wants attention but doesn't punish neglect. |
| **Animal Crossing** | Returning home is a reward in itself. Something small has always changed. No pressure. Just warmth. |
| **Pokémon Daycare** | Your creature is being cared for. You left it in a safe place. When you come back, it has grown. |

These are emotional references. The goal is the *feeling*, not a mechanical copy.

---

## Core Philosophy

### The egg is alive
The egg is never static. It breathes, bobs, blinks, reacts. Even when the child is not interacting, the egg is doing something small and alive.

### Every visit is rewarding
The child should always get something from visiting — a smile from the egg, a little growth, a surprise reaction, a new item used. Nothing dramatic. Just enough.

### No punishment for absence
The egg does not starve. The egg does not die. The egg does not get sad in a way that makes the child feel guilty. If the child was away for three days, the egg is a little quieter — but it lights up when the child returns. Reunion over punishment.

### No learning required here
No questions. No quizzes. No scores. No subject labels. No mastery bars. This screen exists purely for the child-egg relationship.

---

## Screen Layout (390px iPhone, portrait)

```
┌─────────────────────────┐
│   🌤  [name/stage tag]  │  ← soft ambient header (no stats)
│                         │
│                         │
│       [  🥚  ]          │  ← egg, large, center. Idle animation.
│                         │
│   [creature walking →]  │  ← small companion creature (after first hatch)
│                         │
├─────────────────────────┤
│  🍗  🎀  💧  ⭐  🎁     │  ← item tray (existing items from inventory)
├─────────────────────────┤
│  [Pet]  [Collect] [Map] │  ← action row: pet egg / collection / enter world
└─────────────────────────┘
```

### Header zone
- Egg's name (if naming exists) or a soft mood indicator like "ง่วงๆ" / "มีความสุข" / "ตื่นเต้น"
- Stage tag: "Stage 3 of 7" shown only as a visual element (small stars or dots, not a number bar)
- No XP number. No percentage. No progress bar label.

### Egg zone (primary visual)
- Egg is large — minimum 160px, ideally 180–200px at center
- Idle animation: gentle float, slight rotate, soft breathing scale
- Stage-dependent appearance: stage 1 = small/dim, stage 6 = glowing/crackling/near-hatch excitement
- Tap the egg = pet interaction (see below)
- Egg reacts to every item used on it

### Creature companion zone
- After the first hatch, one creature walks across the lower portion of the screen
- Simple left-right patrol animation
- Tap the creature = it stops, faces the child, does a happy animation, then resumes walking
- If no hatched creatures yet: this zone shows a small "?" silhouette — "ไข่จะฟักเป็นอะไรนะ?"

### Item tray
- Shows currently held items: 🍗 (food), 🎀 (ribbon), 💧 (potion), ⭐ (star)
- Count badges (e.g. ×3) if multiple of same type
- Tap an item → drag to egg (or tap item then tap egg)
- Empty slot = gray placeholder, no "buy items" pressure
- Items are earned only in the world / minigames, not purchased here

### Action row
- **Pet** — tap/stroke the egg. Always available. Never costs anything.
- **Collection** — view all hatched creatures. (Existing Collection screen, re-entered from here)
- **Go explore** — enter the World. Primary call to action for leaving Egg Home.

---

## Interactions

### Petting the egg
**Trigger:** Tap the egg, or tap the "Pet" button.

**What happens:**
- Egg bounces slightly (scale up then back)
- Small sparkle particles appear around the egg
- A soft "chirp" sound plays (short, cute, not the existing playTone tones — needs a new `chirp` type)
- Small hearts or stars float up and disappear
- After ~3 pets in a row: egg does a bigger spin / full bounce animation ("very happy")
- After ~6 pets in quick succession: egg settles into a relaxed, slow-blink animation ("sleepy happy") — it doesn't want more right now

**No hunger meter affected. No score. Just a reaction.**

### Feeding the egg
**Trigger:** Tap 🍗 food item from the item tray, then tap the egg (or drag to egg).

**What happens:**
- Egg opens slightly (crack effect? or mouth?)
- Food emoji floats from tray to egg
- Egg "absorbs" it with a satisfying pop sound
- Happiness animation: egg glows warm orange briefly, bounces once
- If the egg was in a slightly sad/dim state, it brightens up noticeably

**Current mechanic:** food item already affects happiness. This interaction gives it a visual ritual that makes it feel intentional.

### Giving ribbon 🎀
**Trigger:** Tap ribbon from item tray, use on egg.

**What happens:**
- A ribbon wraps around the egg (visual decoration persists on the canvas — or overlaid CSS)
- Egg does a little proud animation (puffs up slightly)
- Soft jingle sound
- Ribbon decoration stays visible until next stage change or new ribbon applied

**Design question:** does the ribbon visually change the egg canvas? Or is it an overlay element?

### Giving potion 💧
**Trigger:** Tap potion from item tray, use on egg.

**What happens:**
- Droplet animation floats to egg
- Egg glows blue briefly
- XP progress fills a small amount visually (no number shown — just the progress arc/bar moving)
- Soft sparkle sound

### Activating star ⭐
**Trigger:** Tap star from item tray, use on egg.

**What happens:**
- Egg pulses gold
- Golden glow persists for the 5-minute XP boost duration
- Small golden particles orbit the egg while the boost is active
- Timer shown minimally — a fading golden ring around the egg, not a countdown number

### Surprise box 🎁 (mystery interaction)
**Trigger:** Occasionally appears in the item tray as a special item found during exploration.

**What happens:**
- Tap to open → small animation → reveals a random item or reaction
- Could reveal: a food item, a rare decoration, an egg interaction ("your egg wants to play!"), or just a little visual moment
- Never reveals a quiz or a learning prompt

---

## Egg Mood System

The egg has a mood state that is expressed visually — never as a stat bar.

| Mood | Trigger | Egg appearance | Egg behavior |
|---|---|---|---|
| **Happy** | Fed recently, petted, fresh return | Bright colors, warm glow | Fast idle bounce, occasional spin |
| **Content** | Normal state | Normal colors, soft glow | Regular idle float |
| **Quiet** | Not visited in >4 hours | Slightly dimmer colors | Slower idle, occasional yawn |
| **Excited** | Stage 5–6 (near hatch) | Crackling glow, shaking | Rapid bounce, cracks appear |
| **Reunion** | Child returns after >4 hour gap | Burst of sparkles | Jump + spin + hearts |

### Important: no punishment, only reunion

If the child opens the app after 3 days, the egg is in "Quiet" state — dimmer, slower. The instant the child taps it, it bursts into Reunion animation. The message is always: *"I'm so happy you're back."* Never: *"You forgot about me."*

### Mood does NOT affect learning, XP, or progression

Mood is purely aesthetic and emotional. A quiet egg still gives full XP in battle. A happy egg does not give bonus XP. Mood is not a mechanic — it is a feeling.

---

## Stage Progression in Egg Home

As the egg grows (stages 1–7), Egg Home should visually reflect the journey.

| Stage | Egg appearance in Home | Special behavior |
|---|---|---|
| 1 | Small, faint patterns, dim | Very gentle idle |
| 2 | Slightly larger, patterns clearer | Regular idle |
| 3 | Medium, patterns bright | Occasional little hop |
| 4 | Large, vivid colors | More animated idle, occasional spin |
| 5 | Large + soft glow | Near-hatch pulse starts |
| 6 | Glowing, cracks begin | Excited state, shaking, crackling particles |
| 7 (hatch-ready) | Full glow, cracks prominent | Egg does mini-hatch animation (without actually hatching) until child taps |

Stage 7 / hatch-ready state: the egg should feel like it's *trying* to hatch — not silently waiting. It should draw the child in. The hatch should feel like a moment the child chose to witness, not a thing that happened automatically.

---

## Creature Companion

After the first hatch, a creature lives in Egg Home.

### Behavior
- Walks left-right across the lower screen area, slow and cheerful
- Pauses occasionally to look around or do a small idle animation
- Tap it → stops, faces child, does a happy jump/wave, then resumes walking
- Never blocks the egg or the item tray

### Which creature shows?
**Open question.** Options:
- Always the most recently hatched creature
- Player's choice (a "favorite" selector)
- Random rotation — a different creature each session

For Year 1 MVP: most recently hatched. Add selector later.

### Multiple creatures
When the child has multiple hatched creatures, only one walks around at a time. A small "next →" arrow could cycle through them. This makes having more creatures feel meaningful.

---

## Return Loop — What Brings the Child Back?

This is the most important design question for Egg Home. The answer must be intrinsic (curiosity, attachment, care) — never extrinsic (fear of failure, streak pressure, FOMO).

### Intrinsic return motivators

**1. The egg is slightly different every visit**
- New idle animation variation
- Slightly changed appearance as stage advances
- Creature companion is doing something slightly different
- A tiny random "event" waiting: egg has been practicing a spin, or left a small surprise item on the ground

**2. The reunion animation**
- Every return after >4 hours triggers the Reunion burst
- Makes coming back feel like a genuine hello
- Simple, fast, joyful — never guilt-inducing

**3. Near-hatch excitement (stages 5–7)**
- The egg visibly wants to hatch
- Returning to see the cracks forming is genuinely exciting
- The child knows they might miss the hatch if they don't check
- This is the strongest natural return motivator in the whole game

**4. Items waiting to be used**
- If the child found items exploring, they sit in the tray
- The child wants to give the egg something
- "I found this for you" — the transfer is the reward

**5. Creature surprise**
- Occasionally (once per day, random timing), the creature does something new or rare
- Could be a new movement, a tiny particle effect, a sound
- Not guaranteed — creates organic surprise, not a daily checklist

### What NOT to use as return motivators
- Streak counters ("Day 3 of logging in")
- "Your egg is hungry!" anxiety notifications
- "Don't break your streak!" messaging
- Time-gated rewards that expire
- Any "come back or else" mechanic

---

## What Is NOT in Egg Home (Year 1)

| Feature | Status | Reason |
|---|---|---|
| Home decoration / furniture | Deferred | Too much scope for Year 1 |
| Multiple egg slots | Deferred | One egg at a time (current model) |
| Egg naming at creation | Open question | High attachment value but adds a UI step |
| Egg color customization | Deferred | Egg algorithm is LOCKED |
| Friends / sharing | Deferred | Single-player first |
| Parent controls visible here | No | Parent Report is a separate tab |
| Learning content of any kind | Never | This screen is a learning-free zone |
| Microtransaction items | Never | All items earned through play |
| "Limited time" items | Never | No FOMO mechanics |

---

## Egg Home MVP (Year 1)

The minimum version that delivers the emotional goal:

1. **Egg large at center** — procedural canvas egg, idle animation, stage-appropriate appearance
2. **Tap to pet** — sparkle + chirp + bounce
3. **Item tray** — existing items (food, ribbon, potion, star) + use-on-egg interaction
4. **Stage mood** — egg mood reflected in animation, no stat bars
5. **Reunion animation** — triggered on return after >4 hours
6. **Creature companion** — one creature walking after first hatch
7. **"Go explore" button** — primary exit to World

Everything else (home decoration, creature cycling, mystery box, near-hatch special behavior) can be layered in after MVP.

---

## Open Questions (for GPT before implementation)

### Priority questions

1. **Should the egg have a name?**
   Naming at creation (like Tamagotchi) dramatically increases attachment. But it adds a naming screen on new egg creation. Worth it for a 5-year-old? Can they type a name, or should there be a preset name selection?

2. **What is the mood indicator?**
   Options: (a) no UI indicator at all — mood is only in the egg's animation; (b) a tiny emoji above the egg (😊 / 😴 / ✨); (c) an ambient background warmth/coolness shift. What is most readable for a 5-year-old without feeling like a stat?

3. **How often should the child return, and how?**
   Is there any notification system? A soft "your egg wants to see you!" push notification? Or is this purely intrinsic — no reminders, child returns when they want to? What is the right approach for a 5-year-old whose parent controls app access?

4. **Does the creature companion do anything special?**
   In Animal Crossing, villagers have dialogue that changes. Should the creature companion ever "say" something (a Thai/English word as a speech bubble)? This could be a soft, hidden learning moment — the creature says "ปลา!" and a fish emoji appears.

5. **What does the egg "want"?**
   In Tamagotchi, the pet sometimes shows an icon indicating what it wants (food, play, etc.). Should the egg occasionally show a small desire indicator? This would create a "I should check on my egg" motivation without being punishing.

6. **How does the hatch moment work in Egg Home?**
   When the egg is ready (stage 7), should the hatch happen automatically when the child taps the egg? Or should there be a clear "Hatch now!" button? Does the egg try to hatch on its own until the child notices and helps?

7. **What happens in Egg Home while the child is exploring the world?**
   Conceptually: the egg stays home while the child explores. But mechanically: the egg gains XP from battles in the world. How is this framed? "Your egg grew stronger from the adventure" when you return? Or is the egg visually present during battle (as it currently is)?

8. **Should Egg Home have ambient sound / music?**
   A soft, looping home theme (different from battle music). Animal Crossing-style. Calming. Swells when the egg is happy. Should this exist in Year 1 MVP, or is it too much scope?

9. **Does the creature companion ever leave?**
   In Animal Crossing, villagers can move away. Should the creature ever express wanting to go on a journey? Or does it permanently live in Egg Home forever once hatched?

10. **When the child has many hatched creatures, what is Egg Home like?**
    Multiple creatures walking around? Or still one at a time? Does having more creatures make Egg Home feel more alive and reward collecting?

---

## Relationship to Other Documents

| Document | Relationship |
|---|---|
| `kidquest-world.md` | Parent document. Egg Home is the start/end of the world loop. |
| `egg-companion-adventure.md` | Egg companion reactions in battle carry forward. The egg IS the same egg. |
| `battle-feel-philosophy.md` | No overlap. Battle and Egg Home are separate emotional spaces. |
| `play-observation-system.md` | Egg Home activity is NOT recorded in sessionLog. It is not a learning session. |
| `egg-economy.md` | Item system (food/ribbon/potion/star) is used in Egg Home. Economy unchanged. |
