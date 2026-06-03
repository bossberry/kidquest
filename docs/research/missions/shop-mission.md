# Shop Mission Design

## Theme

🏪 **ร้านค้า — The Shop**

Chopin visits a small Thai neighbourhood shop (ร้านของชำ). They read item names, count items on the shelf, pick the right quantity, solve a simple price problem, and say thank you before leaving.

Familiar, warm, and completely in range for a 5-year-old.

---

## Scope

- **Kindergarten core** (primary)
- **Early Grade 1 stretch** (optional challenge steps)
- No real money, no payment system, no e-commerce
- No new mechanics — uses only existing question types

---

## Learning Objectives

| Subject | Objective |
|---------|-----------|
| **Math** | Count objects 1–5 · Simple addition 1–5 · Choose correct quantity |
| **Thai** | Read 3–5 shop item names · Say a polite social phrase |
| **English** | Name common fruit/food items in English |
| **General knowledge** | Understand that shops have items and prices · Basic social roles |

---

## Mission Flow (MVP — 6 steps)

```
[Step 1] Thai Matching
  → Show 3 items (apple 🍎, banana 🍌, orange 🍊)
  → "จับคู่ของกับชื่อ" (Match the item to its name)
  → Mechanic: matching

[Step 2] English Naming
  → Show one item with emoji
  → "What is this called?" → choices: apple / mango / bread / egg
  → Mechanic: multipleChoice (English)

[Step 3] Counting
  → Show 4 apples on a shelf
  → "มีแอปเปิ้ลกี่ลูก?" (How many apples?)
  → Mechanic: counting (existing Foundation mechanic)
  → Choices: 1, 2, 3, 4, 5

[Step 4] Quantity Choice
  → "แม่ต้องการแอปเปิ้ล 3 ลูก แต่มีแค่ 1 ลูก ต้องซื้อเพิ่มกี่ลูก?"
     (Mom needs 3 apples. There is 1. How many more do we need?)
  → Mechanic: multipleChoice (Math — simple addition/subtraction 1–5)
  → Choices: 1, 2, 3, 4

[Step 5] Price / Addition (stretch — optional for grade 0, required for grade 1 stretch)
  → "แอปเปิ้ล 1 ลูก ราคา 2 บาท ซื้อ 2 ลูก จ่ายกี่บาท?"
     (1 apple = 2 baht. Buy 2 apples. How much?)
  → Mechanic: multipleChoice (Math — addition 2+2)
  → Visual: 2 apples shown with price tag emoji 💰

[Step 6] Social Phrase
  → "บอกว่าอะไรตอนซื้อของเสร็จ?" (What do you say when you finish buying?)
  → Choices: ขอบคุณครับ / สวัสดี / ลาก่อน / หิวข้าว
  → Mechanic: multipleChoice (Thai social language)
```

---

## Content Details

### Thai Content
- Item names: แอปเปิ้ล, กล้วย, ส้ม, ขนมปัง, ไข่, น้ำ (apple, banana, orange, bread, egg, water)
- Social phrases: ขอบคุณครับ/ค่ะ, ขอซื้อ..., เท่าไหร่ครับ/ค่ะ (thank you, I'd like to buy..., how much?)
- Reading: item labels on shelf (2–3 syllable words, อนุบาล level)

### Math Content
- Counting 1–5 objects on a shelf
- Simple addition 1–5 (e.g. 1 + 2 = ?)
- Simple subtraction: "need 3, have 1, need how many more?" (difference 1–4)
- Grade 1 stretch: price addition (2 + 2 = 4 baht)

### English Content
- Vocabulary: apple, banana, orange, bread, egg, water, shop, buy
- Recognition: hear word → match to picture (uses existing CVC/phonics mechanic)
- Level: pure recognition, no spelling required at this stage

### General Knowledge Content
- Shops sell things for money
- Shopkeeper and customer social roles
- Money is used to buy things (concept only, no complex arithmetic)
- Items have names and prices (reading labels)

---

## Reusable Mechanics Needed

All already exist in the codebase:

| Step type | Component/mechanic | Location |
|-----------|-------------------|----------|
| Matching | ThaiMatchGame pattern | `GameThai.jsx` |
| Multiple choice (Thai) | Used in all games | `GameThai.jsx`, `GameMath.jsx` |
| Counting | Foundation count mechanic | `GameMath.jsx` (genQ count type) |
| Multiple choice (Math) | MathLevelGame | `GameMath.jsx` |
| Multiple choice (English) | PhonicsGame pattern | `GamePhonics.jsx` |

The MissionScreen wrapper sequences these steps and passes appropriate content.

---

## Suggested Data Structure

```js
// src/config/missionConfig.js

export const MISSIONS = [
  {
    id: 'shop-v1',
    name: 'ร้านค้า',
    emoji: '🏪',
    theme: 'shop',
    unlockAfter: null,          // available from start
    targetGrade: [0, 1],        // KG + early G1
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
        image: '🍎',
        answer: 'apple',
        choices: ['apple', 'mango', 'bread', 'egg']
      },
      {
        id: 's3', type: 'counting', subject: 'math',
        prompt: 'มีแอปเปิ้ลกี่ลูก?',
        objects: ['🍎','🍎','🍎','🍎'],
        answer: 4,
        choices: [1, 2, 3, 4, 5]
      },
      {
        id: 's4', type: 'multipleChoice', subject: 'math',
        prompt: 'แม่ต้องการ 3 ลูก มี 1 ลูก ต้องซื้อเพิ่มกี่ลูก?',
        visualA: ['🍎'],
        visualB: ['🍎','🍎','🍎'],
        answer: 2,
        choices: [1, 2, 3, 4],
        gradeStretch: false   // required for all
      },
      {
        id: 's5', type: 'multipleChoice', subject: 'math',
        prompt: '1 ลูก = 2 บาท ซื้อ 2 ลูก จ่ายกี่บาท?',
        image: '🍎💰',
        answer: 4,
        choices: [2, 3, 4, 5],
        gradeStretch: true    // optional for grade 0, shown for grade 1+
      },
      {
        id: 's6', type: 'multipleChoice', subject: 'thai',
        prompt: 'บอกว่าอะไรตอนซื้อของเสร็จ?',
        answer: 'ขอบคุณครับ',
        choices: ['ขอบคุณครับ','สวัสดี','ลาก่อน','หิวข้าว']
      },
    ],
    rewards: {
      xp: 30,
      itemChance: 0.4,
      eggXp: 15
    }
  }
]
```

---

## MVP Version

The minimum viable shop mission:

1. **No animated shopkeeper** — just emoji + text
2. **No map or navigation screen** — tap the mission card on Home → start immediately
3. **No money counter UI** — price problems use existing multiple-choice layout
4. **Reuse existing question UI** — same card style as current game modes
5. **6 steps** — short enough for a 5-year-old attention span (3–5 minutes)
6. **One item type per playthrough** (apple/banana/orange — randomized per session)

The MVP introduces the mission concept with minimal new code.

---

## Later Expansion Ideas

After MVP is solid and Chopin plays through it:

- Add more shop items (ขนมปัง, ไข่, น้ำ, ผัก — bread, egg, water, vegetables)
- Add a second mission variant (different story context, same mechanic types)
- Animate a simple shopkeeper character (emoji-based, not full sprite)
- Add "change" calculation (Grade 1 stretch: paid 5 baht, item costs 3 baht, get back ?)
- Add different shops: fruit shop 🍓, stationery shop 📝, toy shop 🧸
- Each shop variant = new data in missionConfig, no new components

---

## What NOT to Build for MVP

- ❌ Drag-and-drop item placement
- ❌ Animated cart / basket
- ❌ Real currency denomination coins/notes
- ❌ Multiple shoppers or queue mechanics
- ❌ Shop inventory that depletes
- ❌ Story dialogue trees
- ❌ Grade 2+ pricing (multiplication, large numbers)
