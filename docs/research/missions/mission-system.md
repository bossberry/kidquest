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
- Unlocks the next mission when completed with ≥70% accuracy
- Gentle threshold — lower than subject levels because integration is harder

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

Example: Shop Mission steps and their subject tags:
```
Step 1: Read the shop sign (Thai reading)        → thai
Step 2: Name the item in English (vocabulary)    → english
Step 3: Count items on shelf (counting)          → math
Step 4: Pick correct quantity (number choice)    → math
Step 5: Calculate simple total (addition 1–5)   → math
Step 6: Say "ขอบคุณครับ/ค่ะ" (social phrase)    → thai
```

The child experiences a coherent shop visit, not six separate quiz questions.

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

Navigation:
- Tap mission card → MissionScreen
- MissionScreen sequences steps, shows progress bar
- ResultScreen at end → back to Home

---

## What NOT to Build Yet

Keep the MVP minimal. Do not build:

- ❌ An open-world map or exploration screen
- ❌ Animated characters that walk around
- ❌ Voice narration of mission story
- ❌ Complex branching story paths
- ❌ Multiplayer or cooperative missions
- ❌ Timed missions with countdown
- ❌ Missions that require Grade 2+ content
- ❌ A separate save system for mission progress
- ❌ Complex inventory or shop economics

The MVP is: step sequence → rewards → replay. Everything else comes later.

---

## Engine Philosophy

Missions are **content, not engine**.

The mission runner is ~1 new React component (`MissionScreen.jsx`).
Mission data lives in a new `src/config/missionConfig.js`.
All question types reuse existing game components.

This means adding new missions in the future = adding data, not code.
