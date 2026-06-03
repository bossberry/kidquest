# Shop Mission Design

## Theme

🏪 **ร้านค้า — The Shop**

Chopin visits a small Thai neighbourhood shop (ร้านของชำ). They match item names, say what they are in English, count items on the shelf, and say thank you before leaving.

Familiar, warm, and completely in range for a 5-year-old.

---

## Scope

- **Kindergarten core** (primary)
- **Early Grade 1 stretch** — price/quantity steps available as later expansion only
- No real money, no payment system, no e-commerce
- No new mechanics — uses only existing question types

---

## Learning Objectives

| Subject | Objective |
|---------|-----------|
| **Math** | Count objects 1–5 |
| **Thai** | Match 3 item names to emoji · Say a polite social phrase |
| **English** | Name common fruit/food items |
| **General knowledge** | Shops have items with names · Basic social courtesy |

---

## Difficulty Layers

This mission has three layers. **Only Core is implemented in Phase C.**

| Layer | When available | Content level | Required? |
|-------|---------------|---------------|-----------|
| **Core** | Always | Kindergarten | Yes — required for completion |
| **Stretch** | After Core mastery signal | Early Grade 1 | Optional |
| **Challenge** | After Stretch mastery signal | Early Grade 1 (harder) | Optional, bonus reward only |

See `mission-system.md` → Mastery-Gated Stretch Unlock for the mastery signal rules.

---

## Core Mission Flow (Phase C MVP — 4 phases / 6 questions)

```
[Phase 1] Thai Matching — 3 questions
  → Show each of 3 items: แอปเปิ้ล 🍎, กล้วย 🍌, ส้ม 🍊 (one at a time)
  → "จับคู่ของกับชื่อ" (Match item emoji to Thai name)
  → 4 choices per question; 3 questions total
  → Mechanic: multipleChoice (Thai matching)

[Phase 2] English Vocabulary — 1 question
  → Show one item emoji (e.g. 🍌)
  → "What is this called?"
  → Choices: apple / banana / orange / bread
  → Mechanic: multipleChoice (English)

[Phase 3] Counting — 1 question
  → Show items on shelf (e.g. 🍎🍎🍎🍎)
  → "มีแอปเปิ้ลกี่ลูก?" (How many apples?)
  → Range 1–5 only
  → Choices: 1, 2, 3, 4, 5
  → Mechanic: counting (existing Foundation mechanic)

[Phase 4] Social Phrase — 1 question
  → "บอกว่าอะไรตอนซื้อของเสร็จ?" (What do you say after buying?)
  → Choices: ขอบคุณครับ / ขอบคุณค่ะ / สวัสดี / หิวข้าว
  → Accepts both ขอบคุณครับ and ขอบคุณค่ะ as correct
  → Mechanic: multipleChoice (Thai social language)
```

**Total: 4 phases / 6 questions. Estimated time: 2–3 minutes.**

Core unlock threshold to progress to next mission: **≥80% accuracy**.
Core mastery signal (to unlock Stretch): **≥90% accuracy, ≤1 wrong answer, completed ≥2 runs**.

---

## Shop Stretch — Early Grade 1 (mastery-gated, not Phase C)

Stretch steps are **not implemented in Phase C**. Document them here for future reference.

**Unlock trigger:** Core mastery signal met — all three must be true:
- Accuracy ≥ 90%
- Wrong answers ≤ 1
- Completed ≥ 2 successful runs

Speed is never part of the unlock requirement.
Unlock message: **"เก่งมาก! มีภารกิจท้าทายเล็ก ๆ ให้ลองแล้วนะ"**
Core remains replayable forever. Stretch is never forced.

### Stretch Step A — Quantity Difference
```
"แม่ต้องการแอปเปิ้ล 3 ลูก แต่มีแค่ 1 ลูก ต้องซื้อเพิ่มกี่ลูก?"
(Mom needs 3 apples. There is 1. How many more do we need to buy?)
→ Mechanic: multipleChoice (Math — subtraction / difference 1–4)
→ Choices: 1, 2, 3, 4
```
Requires two-step reasoning — Early Grade 1 appropriate, not Kindergarten.

### Stretch Step B — Simple Price Concept
```
"แอปเปิ้ล 1 ลูก ราคา 2 บาท ซื้อ 2 ลูก จ่ายกี่บาท?"
(1 apple = 2 baht. Buy 2 apples. How much do you pay?)
→ Mechanic: multipleChoice (Math — addition, visual: 🍎💰🍎💰)
→ Choices: 2, 3, 4, 5
```
Money is **conceptual only** — no real currency, no denomination matching, no change-making.
Not a money education feature. Just a contextual addition problem.

---

## Shop Challenge — Optional (future, not Phase C)

Challenge is an optional harder variant for Stretch masters. No implementation plan yet.

Ideas only:
- Count 6–10 items (extends counting range)
- Choose "มากกว่า / น้อยกว่า" (more / less) between two groups
- Very simple change concept: "มี 5 บาท ของราคา 3 บาท เหลือกี่บาท?" (have 5 baht, item costs 3, change?)

⚠️ Challenge should only be added after Stretch is tested and validated. Do not implement in Phase C or even Phase D planning until Shop Core and Stretch are confirmed fun.

---

## Why 4 Core Phases (6 Questions), Not More

The original design included quantity-difference and price/addition problems. These are now **Shop Stretch** — not Core:

1. **Quantity difference** requires two-step reasoning — Early Grade 1, not Kindergarten.
2. **Price/addition** is conceptually rich but not needed for the first experience — saved as a meaningful mastery-gated reward after Core is mastered.
3. **4 Core phases validates the concept** without over-committing. Stretch gives Chopin something to grow into naturally once Core is mastered.

Shop Core MVP = 4 phases / 6 questions: Thai matching (×3) + English vocabulary (×1) + Counting 1–5 (×1) + Social phrase (×1).
Shop Stretch = Quantity difference + Simple price concept (both unlocked by mastery signal, not by default).

---

## Content Details

### Thai Content
- Item names (MVP): แอปเปิ้ล, กล้วย, ส้ม (apple, banana, orange)
- Social phrases: ขอบคุณครับ/ค่ะ (thank you — male/female form)
- Reading level: 2–3 syllable words, อนุบาล level

### Math Content
- Counting objects 1–5 on a shelf
- No addition or subtraction in MVP

### English Content
- Vocabulary: apple, banana, orange, bread
- Recognition only — no spelling required

### General Knowledge Content
- Shops sell items with names
- Saying thank you after buying is polite
- Basic social role: customer

---

## Reusable Mechanics

All already exist in the codebase:

| Step | Mechanic | Existing location |
|------|----------|-------------------|
| Thai Matching | `matching` | `GameThai.jsx` L1 ThaiMatchGame |
| English Choice | `multipleChoice` | `GamePhonics.jsx` PhonicsGame |
| Counting | `counting` | `GameMath.jsx` genQ count type |
| Social Phrase | `multipleChoice` | `GameMath.jsx`, `GameThai.jsx` |

---

## Suggested Data Structure

```js
// Inline in GameShop.jsx for MVP, or src/config/missionConfig.js later

const SHOP_V1 = {
  id: 'shop-v1',
  name: 'ร้านค้า',
  emoji: '🏪',
  layer: 'core',           // 'core' | 'stretch' | 'challenge'
  unlockAfter: null,       // always available from start
  unlockThreshold: 0.80,   // ≥80% to unlock next mission
  masteryThreshold: 0.90,  // ≥90% + ≤1 wrong + ≥2 runs → unlock Stretch
  steps: [
    {
      id: 's1', type: 'matching', subject: 'thai',
      prompt: 'จับคู่ของกับชื่อ',
      pairs: [
        { word: 'แอปเปิ้ล', emoji: '🍎' },
        { word: 'กล้วย',    emoji: '🍌' },
        { word: 'ส้ม',      emoji: '🍊' },
      ]
    },
    {
      id: 's2', type: 'multipleChoice', subject: 'english',
      prompt: 'What is this?',
      image: '🍌',
      answer: 'banana',
      choices: ['apple', 'banana', 'orange', 'bread']
    },
    {
      id: 's3', type: 'counting', subject: 'math',
      prompt: 'มีแอปเปิ้ลกี่ลูก?',
      objects: ['🍎','🍎','🍎','🍎'],
      answer: 4,
      choices: [1, 2, 3, 4, 5]
    },
    {
      id: 's4', type: 'multipleChoice', subject: 'thai',
      prompt: 'บอกว่าอะไรตอนซื้อของเสร็จ?',
      answer: 'ขอบคุณครับ',
      choices: ['ขอบคุณครับ','ขอบคุณค่ะ','สวัสดี','หิวข้าว']
    },
  ],
  rewards: {
    xp: 25,
    itemChance: 0.4,
    eggXp: 12
  }
}
```

---

## MVP Implementation Note

Prefer **`GameShop.jsx`** over a full generic `MissionScreen.jsx` for the first build:

- Start with a focused, minimal component specific to the shop
- Reuse existing reward/XP patterns from `GameMath.jsx` and `GameThai.jsx`
- Add only one state field: `shopV1Complete: false` in `defaultState()`
- If Shop, Cooking, and Garden clearly share the same pattern after testing, then refactor into a generic `MissionScreen.jsx` + `missionConfig.js`

Do not over-engineer before validating the pattern with a real play session.

---

## Later Expansion — Other Shop Variants

After Core + Stretch are tested and validated:

- Add more shop items (ขนมปัง, ไข่, น้ำ, ผัก — bread, egg, water, vegetables)
- Add a second shop variant (fruit shop 🍓, stationery shop 📝, toy shop 🧸)
- Each variant = new data only, no new components
- Animate a simple shopkeeper character (emoji-based) — cosmetic only

---

## What NOT to Build in Phase C

- ❌ Stretch steps (quantity difference, price/addition) — implement only after Core mastery signal
- ❌ Challenge steps — implement only after Stretch is validated
- ❌ Drag-and-drop item placement
- ❌ Animated cart / basket
- ❌ Real currency denomination coins/notes
- ❌ Multiple shoppers or queue mechanics
- ❌ Shop inventory that depletes
- ❌ Story dialogue trees
- ❌ Grade 2+ pricing (multiplication, large numbers)
- ❌ Generic MissionScreen.jsx before shop is validated
- ❌ Mastery-gated unlock UI (track data in Phase C, show UI later)
