# Garden Mission Design

## Why Garden Comes After Shop and Cooking

| Reason | Detail |
|--------|--------|
| **Vocabulary chain** | Shop → ingredient names. Cooking → action verbs. Garden → origin of ingredients (where food comes from). Each mission adds a layer on top of the last. |
| **Harder concepts** | Garden introduces cause-and-effect over time (plant seed → grows → harvest). More abstract than "buy item" or "follow recipe steps". |
| **Daily habit potential** | A garden naturally suggests returning each day ("check on your plant"). This is a gentle hook for daily play — but only if designed carefully to avoid the Tamagotchi trap of obligation. |
| **Same mechanics again** | Counting (how many seeds), matching (plant name to picture), ordering (seed → sprout → flower → fruit), multiple choice. No new code. |

---

## Theme

🌱 **สวนผัก — The Garden**

Chopin plants and tends a small vegetable or flower garden. They identify plants by name, count seeds and plants, put growth stages in order, and learn simple cause-and-effect (water → plant grows, no water → plant wilts).

Appropriate plants for age 5: ดอกไม้ (flower), ผักบุ้ง (water spinach), มะเขือเทศ (tomato), ถั่ว (bean), ข้าวโพด (corn).

---

## Scope

- **Kindergarten core** (primary)
- **Early Grade 1 stretch** (more plants, more growth stages, simple comparison)
- No farming simulation
- No real-time growing mechanic
- No Grade 2+ content

---

## Learning Objectives

| Subject | Objective |
|---------|-----------|
| **Math** | Count seeds 1–5 · Compare groups (more seeds vs. fewer seeds) · Simple addition (plant 2 + plant 3 = ?) |
| **Thai** | Read plant and vegetable names · Sequence words (ก่อน/แล้ว/สุดท้าย) · Colors of plants and flowers |
| **English** | Plant/vegetable vocabulary (flower, seed, tree, water, sun, leaf) · Colors in English |
| **General knowledge** | Plants grow from seeds · Plants need water and sun · Growth takes time · Seasons/environment basics |

---

## Mission Flow (MVP — 6 steps)

```
[Step 1] Plant Matching (Thai)
  → Show 3 plants: ดอกไม้ 🌸, ผักบุ้ง 🥬, ข้าวโพด 🌽
  → "จับคู่ต้นไม้กับชื่อ" (Match plant to name)
  → Mechanic: matching

[Step 2] Counting Seeds (Math)
  → "ต้องการเมล็ดกี่เมล็ด?" (How many seeds do we need?)
  → Show 🌱🌱🌱🌱 in planter boxes
  → Mechanic: counting

[Step 3] Growth Ordering (General Knowledge / Thai)
  → "เรียงการเจริญเติบโตของพืช" (Put plant growth stages in order)
  → Steps: [เมล็ด 🌰] [ต้นกล้า 🌱] [ดอก 🌸] [ผล 🍅]
  → Mechanic: wordOrder (same as GameThai L5)

[Step 4] Cause and Effect — Water (General Knowledge)
  → "ถ้าไม่รดน้ำต้นไม้จะเป็นยังไง?" (If you don't water the plant, what happens?)
  → Choices: [โตสวย 🌺] [เหี่ยวและตาย 🥀] [กลายเป็นต้นไม้ใหญ่ 🌳] [กลายเป็นน้ำ 💧]
  → Mechanic: multipleChoice (science/general knowledge)

[Step 5] English Vocabulary (English)
  → Show 🌸: "What is this?"
  → Choices: flower / seed / leaf / tree
  → Mechanic: multipleChoice (English)

[Step 6] Comparison / More-Less (Math)
  → Show two planters: 🌱🌱🌱 and 🌱🌱🌱🌱🌱
  → "แถวไหนมีต้นไม้มากกว่า? มากกว่าเท่าไหร่?"
     (Which row has more plants? How many more?)
  → Mechanic: multipleChoice (comparison + subtraction 1–5)
```

---

## Thai Content

- Plant names: ดอกไม้, ผักบุ้ง, มะเขือเทศ, ถั่ว, ข้าวโพด, ต้นไม้
- Action verbs: รดน้ำ, ปลูก, เก็บเกี่ยว, ดูแล (water, plant, harvest, take care of)
- Color words used in context: ดอกสีแดง, ใบสีเขียว (red flower, green leaf)
- Sequence: เมล็ด → ต้นกล้า → ดอก → ผล (seed → sprout → flower → fruit)

## English Content

- Vocabulary: flower, seed, leaf, tree, plant, water, sun, grow, garden
- Colors: red, green, yellow (applied to plant parts)
- Recognition + simple choice — no spelling yet

## Math Content

- Counting seeds/plants 1–5
- More / less comparison between two groups
- Simple addition: plant 2 rows + 3 rows = how many rows?
- Grade 1 stretch: count to 10, larger group comparison

## General Knowledge / Science

- Plants grow from seeds (life cycle concept)
- Plants need water and sunlight (basic needs)
- Growth takes time — it doesn't happen instantly (patience, delayed gratification)
- Different plants look different
- Some plants give us food (connecting to cooking mission)

---

## Daily Habit Loop Possibility

The garden mission has natural daily-play potential:

"Your plant grew a little! Come back tomorrow to see what's next."

**How to do this well (without creating obligation):**
- Show a gentle visual indicator: "your plant grew ✨" on the Home screen
- Optional — tap to see current stage, no penalty for not tapping
- Not a notification or a counter that depletes
- The plant does not die if the child doesn't return
- Seeing the plant grow is a small joy, not a requirement

**How NOT to do it:**
- ❌ "Your plant is wilting! Water it NOW!" (anxiety-inducing)
- ❌ Countdown timers for watering
- ❌ Plants that die and reset progress
- ❌ Daily login streaks for garden (separate from existing streak mechanics)

The garden can have a soft "persistent pet" quality without any punishment mechanics.

---

## MVP Scope

1. **One plant type**: ดอกไม้ (flower) — universally recognizable
2. **6 steps**: matching → counting → ordering → cause-effect → English → comparison
3. **No persistent growing state in MVP** — just a self-contained mission like shop and cooking
4. **Daily habit loop is a later addition** — design it after the static mission is solid
5. **Unlocks after**: completing cooking-v1 with ≥70% accuracy

---

## What NOT to Build for MVP

- ❌ A persistent garden that grows over real days
- ❌ Watering animation or timers
- ❌ Multiple plant types at launch
- ❌ Season cycles or weather mechanics
- ❌ A full farming game (Harvest Moon / Stardew Valley style)
- ❌ Soil quality, fertilizer, or pest mechanics
- ❌ Crop economics or selling harvests (that's the shop mission's job)
- ❌ Grade 2+ botany content

The garden MVP is: learn plant names + growth stages + simple counting. That's it.
