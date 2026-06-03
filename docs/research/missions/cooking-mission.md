# Cooking Mission Design

## Why Cooking Comes After Shop

| Reason | Detail |
|--------|--------|
| **Shared vocabulary** | Shop mission teaches fruit/food names. Cooking mission uses the same words in a new context — reinforcing without re-introducing. |
| **Slightly harder sequencing** | Shop = pick and pay. Cooking = read recipe steps in order. Sequencing is a new cognitive skill. Shop must be mastered first. |
| **Natural story progression** | "We bought ingredients at the shop. Now let's cook something with them." Story continuity rewards the child for completing the shop first. |
| **Same mechanics, new content** | Counting, multiple choice, and word ordering already proven in shop mission. Cooking just uses different data. |

---

## Theme

🍳 **ทำอาหาร — Cooking / Making Food**

Chopin helps prepare a simple Thai dish or snack. They read ingredient names, count measurements, put steps in order, and identify what comes next.

Simple dishes appropriate for age 5: ไข่ดาว (fried egg), ข้าวผัด (fried rice), ส้มตำอย่างง่าย (simple papaya salad), ขนมกล้วย (banana snack).

---

## Scope

- **Kindergarten core** (primary)
- **Early Grade 1 stretch** (more complex sequencing, larger numbers)
- No cooking simulation engine
- No timers or real-time mechanics
- No Grade 2+ content (multiplication of ingredients, fractions)

---

## Learning Objectives

| Subject | Objective |
|---------|-----------|
| **Math** | Count ingredients 1–5 · Ordering numbers · Simple measurement concepts (more/less) |
| **Thai** | Read ingredient names · Read simple verb-noun phrases (เทน้ำ, หยิบไข่) · Sequence words (ก่อน, แล้ว, สุดท้าย) |
| **English** | Ingredient vocabulary (egg, rice, oil, carrot, onion) · Action words (wash, cut, mix, cook) |
| **General knowledge** | Cause and effect (heat → cooked) · Sequence matters · Ingredients combine to make something |

---

## Mission Flow (MVP — 6 steps)

```
[Step 1] Ingredient Matching (Thai)
  → Show 3 ingredients with emoji
  → "จับคู่วัตถุดิบกับชื่อ" (Match ingredient to name)
  → Mechanic: matching

[Step 2] Counting Ingredients (Math)
  → "ต้องการไข่กี่ฟอง?" (How many eggs do we need?)
  → Show recipe card with 🥚🥚🥚
  → Mechanic: counting

[Step 3] Sequencing / Word Order (Thai)
  → "เรียงขั้นตอนให้ถูกต้อง" (Put steps in the right order)
  → Steps: [ตอกไข่] [ใส่กระทะ] [รอให้สุก] (crack egg → put in pan → wait to cook)
  → Mechanic: wordOrder (same as GameThai L5 / GamePhonics L4)

[Step 4] Cause and Effect (General Knowledge)
  → "ถ้าใส่ไข่ในกระทะร้อน จะเกิดอะไรขึ้น?" (If you put egg in hot pan, what happens?)
  → Choices: [ไข่สุก 🍳] [ไข่แข็ง 🧊] [ไข่บิน ✈️] [ไข่เป็นสีแดง 🔴]
  → Mechanic: multipleChoice (general knowledge / science concept)

[Step 5] English Vocabulary (English)
  → Show picture of egg: "What is this ingredient called?"
  → Choices: egg / rice / fish / milk
  → Mechanic: multipleChoice (English)

[Step 6] More / Less Measurement (Math — stretch for Grade 1)
  → "ถ้าสูตรบอก 2 ช้อน แต่ใส่ 4 ช้อน จะมากกว่าเท่าไหร่?"
     (Recipe says 2 spoons. You add 4. How many more than needed?)
  → Mechanic: multipleChoice (comparison / subtraction 1–5)
  → gradeStretch: true
```

---

## Thai Content

- Ingredient names: ไข่, ข้าว, น้ำมัน, หอม, แครอท (egg, rice, oil, onion, carrot)
- Action verbs: ล้าง, หั่น, ผัด, เทน้ำ, ตอก (wash, cut, stir-fry, pour water, crack)
- Sequence words: ก่อน, หลังจากนั้น, สุดท้าย (first, then, finally)
- Cooking phrases: "ใส่ลงในกระทะ" (put in the pan), "รอจนสุก" (wait until cooked)

## English Content

- Ingredient vocabulary: egg, rice, oil, onion, carrot, water
- Action verbs: wash, cut, mix, cook, stir
- Recognition only — not spelling at this stage

## Math Content

- Counting ingredients 1–5
- Ordering: which step comes first? (sequencing is pre-number but related to order concepts)
- More / less comparison for measurement (Grade 1 stretch)
- Simple addition for ingredient counts (2 eggs + 1 egg = 3 eggs)

## General Knowledge / Science

- Heat changes food (cause and effect at age-appropriate level)
- Steps must happen in order — sequencing matters
- Ingredients have roles (oil prevents sticking, eggs are protein)
- Kitchen safety: stove is hot, wash hands before cooking (attitude/values)

---

## MVP Scope

For the first cooking mission implementation:

1. **One dish only**: ไข่ดาว (fried egg) — simple, familiar, 3 ingredients
2. **6 steps**: matching → counting → ordering → cause-effect → English vocab → stretch math
3. **No animation** of cooking process — just emoji + text + existing question UI
4. **Sequence mechanic reuses wordOrder** from GameThai L5 — same component, new data
5. **Unlocks after**: completing shop-v1 with ≥70% accuracy

---

## What NOT to Build for MVP

- ❌ Real-time cooking timer (stir before it burns!)
- ❌ Animated cooking sequence
- ❌ Multiple dish variants at launch (add later as data)
- ❌ Nutrition facts or diet content
- ❌ Grade 2+ measurement (fractions, half cups)
- ❌ A full kitchen map to explore
