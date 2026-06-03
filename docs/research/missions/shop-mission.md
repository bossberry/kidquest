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

## Mission Flow (MVP — 4 steps)

```
[Step 1] Thai Matching
  → Show 3 items: แอปเปิ้ล 🍎, กล้วย 🍌, ส้ม 🍊
  → "จับคู่ของกับชื่อ" (Match item emoji to Thai name)
  → Mechanic: matching

[Step 2] English Vocabulary
  → Show one item emoji (e.g. 🍌)
  → "What is this called?"
  → Choices: apple / banana / orange / bread
  → Mechanic: multipleChoice (English)

[Step 3] Counting
  → Show items on shelf (e.g. 🍎🍎🍎🍎)
  → "มีแอปเปิ้ลกี่ลูก?" (How many apples?)
  → Range 1–5 only
  → Choices: 1, 2, 3, 4, 5
  → Mechanic: counting (existing Foundation mechanic)

[Step 4] Social Phrase
  → "บอกว่าอะไรตอนซื้อของเสร็จ?" (What do you say after buying?)
  → Choices: ขอบคุณครับ / ขอบคุณค่ะ / สวัสดี / หิวข้าว
  → Mechanic: multipleChoice (Thai social language)
```

**Total: 4 steps. Estimated time: 2–3 minutes.**

---

## Why 4 Steps, Not 6

The original 6-step design included a quantity-difference problem and a price/addition problem. These were removed from the MVP because:

1. **Quantity difference** ("need 3, have 1, need how many more?") requires two-step reasoning. Appropriate for Early Grade 1 stretch, not Kindergarten MVP.
2. **Price/addition** ("1 apple = 2 baht, buy 2, pay how much?") introduces money concepts that are conceptually rich but not necessary for a first mission. Saves it as a meaningful stretch reward.
3. **4 steps is the right size** for a 5-year-old's first mission experience. Validates the concept without over-committing.

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
  unlockAfter: null,       // always available from start
  unlockThreshold: 0.80,   // complete with ≥80% to unlock next mission
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

## Later Expansion — Early Grade 1 Stretch

These steps were intentionally moved out of MVP. Add them only after the 4-step version is validated and Chopin is approaching Grade 1:

### Quantity Difference (stretch step 5)
```
"แม่ต้องการแอปเปิ้ล 3 ลูก แต่มีแค่ 1 ลูก ต้องซื้อเพิ่มกี่ลูก?"
(Mom needs 3 apples. There is 1. How many more do we need to buy?)
→ Mechanic: multipleChoice (Math — subtraction / difference 1–4)
→ Choices: 1, 2, 3, 4
```
Requires two-step reasoning — Early Grade 1 appropriate, not Kindergarten MVP.

### Price / Addition (stretch step 6)
```
"แอปเปิ้ล 1 ลูก ราคา 2 บาท ซื้อ 2 ลูก จ่ายกี่บาท?"
(1 apple = 2 baht. Buy 2 apples. How much do you pay?)
→ Mechanic: multipleChoice (Math — addition, visual: 🍎💰🍎💰)
→ Choices: 2, 3, 4, 5
```
Money is **conceptual only** — no real currency, no denomination matching, no change-making. Add when Chopin is comfortable with addition to 10.

**Do not include price steps in the first MVP. This is not a money education game.**

---

## What NOT to Build for MVP

- ❌ Price/money steps (moved to stretch — see above)
- ❌ Quantity difference problem (moved to stretch — see above)
- ❌ Drag-and-drop item placement
- ❌ Animated cart / basket
- ❌ Real currency denomination coins/notes
- ❌ Multiple shoppers or queue mechanics
- ❌ Shop inventory that depletes
- ❌ Story dialogue trees
- ❌ Grade 2+ pricing (multiplication, large numbers)
- ❌ Generic MissionScreen.jsx before shop is validated
