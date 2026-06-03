# Mission System Design

## What Is a Mission?

A mission is a short, thematic play session that blends multiple subjects into one continuous experience.

The child is not told "now do Math, now do Thai". They are told "go to the shop" or "help cook dinner". The learning happens inside the story.

A mission is:
- **Bounded** — has a clear start, middle, and end (3–8 steps)
- **Thematic** — set in a recognizable real-world context
- **Multi-subject** — naturally touches Math, Thai, English, general knowledge
- **Replayable** — completing a mission again is always valid and rewarded

A mission is NOT:
- A new mini-game with new mechanics
- A long grind with many questions
- A punishment or a test
- Isolated to one subject

---

## Mission Types

### Progression Mission
- Primary source of XP and advancement
- First time through a mission earns full rewards
- Unlocks the next mission when completed with **≥80% accuracy** — aligned with existing subject-level unlock rules
- 70% acts as a "soft pass" that still gives encouragement and partial rewards, but does not unlock the next mission

### Review Mission
- Replaying a mission the child already completed
- Still earns partial XP (e.g. 60% of full rewards)
- No pressure to improve — just replay for confidence and fun
- Always accessible; never removed

### Challenge Mission
- Optional harder version of a completed mission
- Higher difficulty content (Early Grade 1 stretch, not Grade 2)
- Extra reward on completion
- Clearly marked as optional — child chooses to try it

---

## How Missions Integrate Subjects

Each mission step has a `subject` tag. Within a single mission flow, steps alternate subjects naturally based on the story context — not artificially.

Example: Shop Mission phases and their subject tags (4 phases / 6 questions):
```
Phase 1: Thai Matching — ×3 questions            → thai
  Match each of 3 emoji to its Thai name (แอปเปิ้ล / กล้วย / ส้ม)
Phase 2: English Vocabulary — ×1 question        → english
  Name the item in English (apple / banana / orange / bread)
Phase 3: Counting 1–5 — ×1 question              → math
  Count items on shelf; choose correct number
Phase 4: Social Phrase — ×1 question             → thai
  Say "ขอบคุณครับ/ค่ะ" after buying
```

The child experiences a coherent shop visit, not disconnected quiz questions.

---

## Reusable Mechanics

Missions use **only existing mechanics**. No new mini-games.

| Mechanic | Used in current game | How it maps to missions |
|----------|----------------------|------------------------|
| `multipleChoice` | GameMath, GamePhonics | Choose correct answer from 4 options |
| `matching` | GameThai L1 | Match item name to picture |
| `counting` | GameMath L0 Foundation | Count objects shown on screen |
| `wordOrder` | GameThai L5, GamePhonics L4 | Arrange words into a sentence/phrase |
| `spell` | GameThai L2–L4 | Tap tiles to spell item name |
| `visualModel` | GameMath L1–L4 | Objects/tenFrame to represent a number |

Mission steps are just instances of these mechanics with mission-specific content.
The mission runner is a thin wrapper that sequences steps and tracks progress.

---

## Data Structure

A mission is defined entirely in data (in `gameConfig.js` or a new `missionConfig.js`):

```js
{
  id: 'shop-v1',
  name: 'ร้านค้า',           // Thai: "The Shop"
  theme: 'shop',
  emoji: '🏪',
  unlockAfter: null,         // first mission, always available
  steps: [
    {
      id: 'step-1',
      type: 'matching',
      subject: 'thai',
      prompt: 'จับคู่ของกับชื่อ',   // "Match item to name"
      items: [
        { word: 'แอปเปิ้ล', emoji: '🍎' },
        { word: 'กล้วย',    emoji: '🍌' },
        { word: 'ส้ม',      emoji: '🍊' },
      ]
    },
    {
      id: 'step-2',
      type: 'counting',
      subject: 'math',
      prompt: 'มีแอปเปิ้ลกี่ลูก?',  // "How many apples?"
      objects: ['🍎','🍎','🍎'],
      answer: 3,
      choices: [1, 2, 3, 4]
    },
    // ...
  ],
  rewards: {
    xp: 30,
    itemChance: 0.4,   // 40% chance of item drop
    eggXp: 15          // extra egg XP for completing a mission
  }
}
```

Steps use the same question format as existing game levels — they just have a `missionId` context attached.

---

## Mastery-Gated Stretch Unlock

### The Three Layers

Every mission can have up to three layers. Only Core is required.

| Layer | Content level | Required? | When available |
|-------|--------------|-----------|----------------|
| **Core** | Kindergarten | Yes | Always |
| **Stretch** | Early Grade 1 | No — optional | After Core mastery signal |
| **Challenge** | Early Grade 1 (harder) | No — optional | After Stretch mastery signal |

This is not AI adaptation. It is a simple, deterministic rule applied after the child demonstrates consistent mastery.

---

### Mastery Signal Rule

A mission layer is considered **mastered** when all of the following are true:

- Accuracy ≥ 90%
- Wrong answers ≤ 1
- Completed ≥ 2 successful runs

Speed is **optional context only** — tracked if available but never required for any unlock. Children who think slowly but accurately are not penalised.

This rule is simple, deterministic, and does not require AI.

---

### Unlock Behavior

**When Core is mastered:**
- Stretch version becomes available
- Show a gentle, non-pressuring message: **"เก่งมาก! มีภารกิจท้าทายเล็ก ๆ ให้ลองแล้วนะ"** ("You're great! There's a small challenge waiting for you.")
- Core remains fully accessible and replayable forever
- Stretch is never forced — child taps to try it

**When Stretch is mastered:**
- Challenge version becomes available (if defined)
- Challenge gives bonus reward / cosmetic only
- Challenge never gates progression to the next mission

---

### What This Is Not

- ❌ Not AI tutoring — no generated questions, no model, no personalization
- ❌ Not forced progression — child can stay on Core forever
- ❌ Not a difficulty mode toggle — layers unlock naturally through play
- ❌ Not punishment for not reaching Stretch — Core is complete and rewarding on its own

---

### Threshold Summary

| Event | Threshold |
|-------|-----------|
| Unlock next mission | ≥80% accuracy (one pass) |
| Unlock Stretch layer | ≥90% accuracy + ≤1 wrong + ≥2 runs |
| Review missions give | 60% XP |
| Challenge missions give | 1.5× XP + guaranteed item |

---

### Minimum State for Phase C

Phase C (Shop Core MVP) should store only what's needed to support future mastery tracking:

```js
// In kq_state (added to defaultState)
shopV1: {
  bestScore: 0,        // highest accuracy (0–1)
  runs: 0,             // total completions
  mastered: false,     // true when mastery signal met
  stretchUnlocked: false,
}
```

Do not implement Stretch UI in Phase C. Just record the data so it's available later.

---

## Reward Design

| Trigger | Reward |
|---------|--------|
| Complete a Progression Mission | Full XP + possible item drop + egg XP |
| Complete a Review Mission | 60% XP + possible item drop |
| Complete a Challenge Mission | 1.5× XP + guaranteed item drop |
| All steps correct | Confetti + fanfare |
| Streak within mission (3+ correct in a row) | Streak bonus XP |

Rewards must feel meaningful but not make replay feel like grinding:
- Review missions give fewer XP so children aren't tempted to farm easy missions
- But they still give enough that replay feels worthwhile

---

## Replay Design

Replay is **always allowed** and **never punished**.

### What changes on replay:
- Item drops are still possible (same 40% chance)
- XP is 60% of first-clear XP for Review mode
- Questions may be randomized within the same step types (different items, same mechanic)

### What stays the same:
- The story context and theme
- The step sequence and subject mix
- The reward screen with encouraging message

### Gentle encouragement to move on:
Do not lock old missions. Instead:
- Show a ✨ "New mission unlocked!" badge on the Home screen
- Show "ยังมีอีก!" (There's more!) at the end of a Review mission
- Unlock cosmetic rewards (new egg pattern, new creature color) from new missions
- New missions have new characters the child hasn't met yet

Never say "you've already done this" or "try something harder". Just let the new mission exist alongside the old ones.

---

## Mission Access Points

In the Home screen:
- A "Missions" section between the World Cards and the EggRun banner
- Cards showing: mission emoji, mission name, lock/unlock status
- Locked missions show a preview with "???" like the level lock UI

Navigation (current implementation):
- Tap mission card → `GameScreen.jsx` → `GameShop.jsx` (via `world === 'shop'`)
- Each mission is its own component for now — `MissionScreen.jsx` does not exist yet

Navigation (future target — after 2+ missions share the pattern):
- Tap mission card → `MissionScreen.jsx` (generic runner, reads from `missionConfig.js`)
- MissionScreen sequences steps, shows progress bar
- Result screen → back to Home

---

## Subject Readiness and Mission Design

### The problem with level-gated content

Using `subjectLevels[world]` (the highest unlocked level) as a mission content gate creates a false assumption: that the child at "Level 5" is ready for Level 5 content in a mission.

They may have:
- unlocked Level 5 through one lucky or random session
- not played that subject in weeks
- genuine comfort only at Level 2 or 3

A mission that assumes Level 5 readiness will feel too hard and create frustration or guessing behavior.

Conversely, a child who voluntarily replays Level 2 for the fifth time, consistently scoring 95%, is demonstrably comfortable — even though the unlock number "1" or "2" doesn't capture it.

### Mission should follow the child

Subject Readiness (see `docs/research/observation/play-observation-system.md`) gives a per-subject state derived from recent play behavior:

| State | Profile |
|-------|---------|
| **Strong** | Sustained high accuracy, voluntary replays, consistent completion |
| **Comfortable** | Good accuracy across multiple sessions |
| **Exploring** | Attempting the subject; accuracy still developing |
| **Not Ready** | No session data for this subject |

This is computed from `sessionLog` at render time. No new state. No AI.

### Mission content weighting

A mission's subject mix can follow the child's readiness profile rather than a fixed ratio.

**Shop Core current mix** (roughly fixed, intentionally Thai-heavy):
```
Phase 1: Thai matching     ×3 questions  → ~50% Thai
Phase 2: English vocab     ×1 question   → ~17% English
Phase 3: Math counting     ×1 question   → ~17% Math
Phase 4: Thai phrase       ×1 question   → ~17% Thai (social)
```
This weighting is appropriate for a Kindergarten child. Thai is the strongest subject at this age; Math and English are light.

**Readiness-informed design for future missions:**

If Chopin's readiness profile after several weeks of play is:
```
Thai:    Strong
Math:    Comfortable
English: Exploring
```

A future Cooking Mission might weight:
```
Thai:    60% (confidence-building, familiar vocabulary)
Math:    30% (counting ingredients, measuring — Comfortable is ready for more)
English: 10% (light, non-pressuring — Exploring means we introduce gently)
```

A different child whose profile is:
```
Thai:    Comfortable
Math:    Strong
English: Not Ready
```

Cooking Mission for that child might look:
```
Thai:    40%
Math:    55% (follow the strength)
English: 5% (or absent — Not Ready means we don't foreground it)
```

This is **not adaptive question generation**. The content is pre-defined. The subject mix within a mission type is selected at design time using the observed readiness profile. A mission has a fixed step sequence once chosen — readiness informs the initial design, not runtime generation.

### What this is not

- ❌ Not AI — readiness is a deterministic derivation from `sessionLog`
- ❌ Not adaptive question generation — content is pre-defined in `gameConfig.js` / `missionConfig.js`
- ❌ Not a level tree or prerequisite chain
- ❌ Not dynamic per-session difficulty — the step sequence is fixed once the mission launches
- ❌ Not a gate — readiness does not lock or unlock missions; mastery signal does that

### When to apply Subject Readiness in mission design

| Mission | When Readiness matters |
|---------|----------------------|
| Shop Core (current) | Design is already right — Thai-heavy reflects Kindergarten readiness intuitively |
| Shop Stretch | Not needed — Stretch gates on mastery signal (score ≥ 90% + wrong ≤ 1 + runs ≥ 2) |
| Cooking Mission MVP | **Yes — consult readiness profile before finalizing step sequence.** Do not design Cooking before seeing real play data from Phase D. |
| Garden Mission | Same — check readiness for all three subjects before designing the subject mix |

### The core principle

> Mission should follow the child. The child should not follow the mission.

The mission is a story. The story should be told in a language the child is comfortable in — emphasizing the subjects they're growing in, not hammering the ones they're struggling with. The learning happens through confidence, not anxiety.

---

## Explicit Non-Goals

These are out of scope for the mission system — permanently or until explicitly revisited:

- ❌ **No payment system** — missions have no in-app purchase or real money
- ❌ **No multiplayer** — missions are single-player only
- ❌ **No social features** — no leaderboards, no sharing, no friend codes
- ❌ **No Grade 2+ content** — Year 1 scope is Kindergarten + Early Grade 1 only
- ❌ **No AI tutor** — no personalized question generation or adaptive AI
- ❌ **No unique mini-games** unless an existing mechanic absolutely cannot express the skill

---

## What NOT to Build Yet

Keep the MVP minimal. Do not build:

- ❌ An open-world map or exploration screen
- ❌ Animated characters that walk around
- ❌ Voice narration of mission story
- ❌ Complex branching story paths
- ❌ Timed missions with countdown pressure
- ❌ A separate save system for mission progress
- ❌ Complex inventory or shop economics

The MVP is: step sequence → rewards → replay. Everything else comes later.

---

## Engine Philosophy

Missions are **content, not engine**.

### Phase C MVP approach (staged):

1. **Start small** — build `GameShop.jsx` as a focused, shop-specific component. Reuse existing reward and XP patterns. Add only the minimum state needed to mark `shop-v1` complete.
2. **Validate first** — play through the shop mission with Chopin. Confirm it's fun and the step pattern works.
3. **Refactor if justified** — if Shop, Cooking, and Garden clearly share the same structure after real testing, extract into `MissionScreen.jsx` + `missionConfig.js`.

### Do not build the full engine upfront:
- `MissionScreen.jsx` is the *target architecture*, not the *starting point*
- `START_MISSION` / `COMPLETE_MISSION_STEP` actions are not required for MVP
- One state field (`shopV1Complete: false`) is enough to track shop completion initially

This means the first mission uses minimal new code, and future missions are added as data once the pattern is confirmed.
