# Math Research — Position Words / คำบอกตำแหน่ง

_Last updated: 2026-06-03_  
_Status: Draft v1 for KidQuest curriculum design_  
_Target path: `docs/research/math/position.md`_

## Purpose

This document defines a research-backed spatial language layer for KidQuest children around age 5–7.

Target user:
- Thai child around kindergarten to early Grade 1
- May understand position words in daily speech but not consistently in math tasks
- Learns best through movement, hiding/finding games, object placement, and visual scenes

KidQuest goal:
- Position learning should feel like hide-and-seek, treasure search, and creature placement.
- Children should understand spatial relationships before seeing worksheet-style instructions.

---

## Evidence Base

### 1. Geometry and spatial reasoning are part of early mathematics

WWC / IES recommends teaching geometry and related topics through developmental progression for young children.

KidQuest implication:
- Position words are not just language; they are part of spatial reasoning.
- Add position-word gameplay to Math rather than leaving it only to Thai/English language content.

### 2. Young children learn math through daily routines and concrete contexts

WWC / IES recommends helping children view and describe the world mathematically, and integrating math into everyday activities.

KidQuest implication:
- Use familiar scenes:
  - egg in basket
  - creature under tree
  - star above cloud
  - toy inside box
  - fish outside pond
- Questions should be scene-based, not text-only.

### 3. Visual representation reduces cognitive load

EEF recommends purposeful use of manipulatives and representations for young children.

KidQuest implication:
- Let children see the relationship directly.
- Use drag/drop or tap choice before asking them to read written position words.

### 4. CPA supports spatial concepts

Singapore MOE’s CPA approach applies well:
- Concrete: place a toy inside a box.
- Pictorial: choose object in a picture scene.
- Abstract: read “inside / outside / above / below”.

---

## Core Design Rule

For position words:

```text
See position
↓
Hear position word
↓
Act on position
↓
Choose matching scene
↓
Read word later
```

Avoid:
- Text-only prompts as the first exposure
- Too many position words in one level
- Ambiguous pictures
- Small icons where “front/back” is hard to distinguish
- Using “left/right” too early unless the child is ready

---

## Recommended Vocabulary

### Core age 5–6 words

Thai:
- บน
- ล่าง / ใต้
- ใน / ข้างใน
- นอก / ข้างนอก
- ข้าง ๆ
- หน้า
- หลัง

English mapping for later:
- on / above
- under / below
- in / inside
- out / outside
- next to / beside
- in front of
- behind

Do not mix Thai and English in the same early Math level unless intentionally bilingual.

---

## Recommended Skill Progression

### P1. Inside / outside

Lesson:
- Easiest because the boundary is visually clear.

Question types:
- “ไข่อยู่ในตะกร้าอันไหน?”
- “ตัวไหนอยู่นอกกล่อง?”
- Drag egg inside basket.

Game mechanic:
- Egg Basket
- Creature hides eggs in or out of baskets.

Mastery:
- 90% accuracy across 10 questions
- Includes both “ใน” and “นอก”

---

### P2. On / under

Lesson:
- Use vertical relationships.

Question types:
- “ตัวไหนอยู่บนโต๊ะ?”
- “ไข่อยู่ใต้ต้นไม้ตรงไหน?”
- Choose the creature under the bridge.

Game mechanic:
- Tree Hide and Seek

Mastery:
- 85–90% accuracy
- Includes both “บน” and “ใต้”

---

### P3. Next to / beside

Lesson:
- Horizontal relationship but no direction.

Question types:
- “ดาวอยู่ข้าง ๆ ไข่ตรงไหน?”
- Choose the monster beside the box.

Game mechanic:
- Friend Finder
- Creature finds friend standing beside an object.

Mastery:
- 85% accuracy

---

### P4. In front of / behind

Lesson:
- More difficult because pictures must show depth clearly.
- Use clear overlap and shadow.

Question types:
- “ตัวไหนอยู่หลังต้นไม้?”
- “ลูกบอลอยู่หน้ากล่องอันไหน?”

Game mechanic:
- Forest Hideout

Mastery:
- 80–85% accuracy
- Use only very clear visuals

---

### P5. Mixed spatial scenes

Lesson:
- Child chooses based on one target relationship among distractors.

Question types:
- “แตะไข่ที่อยู่ใต้โต๊ะ”
- “ตัวไหนอยู่ในกล่อง?”
- “วางดาวไว้บนเมฆ”

Game mechanic:
- Treasure Map

Mastery:
- 85% accuracy
- Includes 4–6 mixed position words

---

## KidQuest Level Proposal

Recommended level placement:
- Math L11: Position Words
- Can be paired with Shape as Geometry/Spatial branch.

### Proposed Level

| Level | Skill | Game Style | Mastery |
|---|---|---|---|
| M11 | inside/outside | Egg Basket | 90% |
| M11b | on/under | Tree Hide and Seek | 85–90% |
| M11c | next to / in front / behind | Treasure Map | 80–85% |

---

## Visual Requirements

Good position-word questions need clear visuals.

Rules:
1. Use large objects.
2. Avoid visual clutter.
3. For “inside”, show a clear container boundary.
4. For “under”, leave vertical gap small enough to be obvious.
5. For “behind”, use partial occlusion.
6. Avoid left/right until later.

---

## Question Bank Schema Suggestion

```ts
type PositionQuestion = {
  id: string
  ageBand: '5-7'
  strand: 'geometry'
  skill: 'positionWords'
  level: 'M11'
  representation: 'concrete' | 'pictorial' | 'abstract'
  promptTh: string
  visualModel: 'positionScene' | 'dragToPosition'
  targetPosition: 'inside' | 'outside' | 'on' | 'under' | 'beside' | 'front' | 'behind'
  sceneObjects: Array<string>
  answer: string
  choices?: Array<string>
  hint: string
  masteryTag: string
}
```

---

## Example Questions

```ts
[
  {
    id: 'position-inside-001',
    ageBand: '5-7',
    strand: 'geometry',
    skill: 'positionWords',
    level: 'M11',
    representation: 'pictorial',
    promptTh: 'ไข่อยู่ในตะกร้าอันไหน?',
    visualModel: 'positionScene',
    targetPosition: 'inside',
    sceneObjects: ['basketA', 'basketB', 'egg'],
    answer: 'basketA',
    choices: ['basketA', 'basketB'],
    hint: 'คำว่า “ใน” คืออยู่ข้างในของสิ่งนั้น',
    masteryTag: 'position.inside'
  },
  {
    id: 'position-under-001',
    ageBand: '5-7',
    strand: 'geometry',
    skill: 'positionWords',
    level: 'M11',
    representation: 'pictorial',
    promptTh: 'ตัวไหนอยู่ใต้ต้นไม้?',
    visualModel: 'positionScene',
    targetPosition: 'under',
    sceneObjects: ['tree', 'creatureA', 'creatureB'],
    answer: 'creatureA',
    choices: ['creatureA', 'creatureB'],
    hint: 'ใต้ แปลว่าอยู่ด้านล่าง',
    masteryTag: 'position.under'
  }
]
```

---

## Parent Insight Mapping

| Skill | Parent insight |
|---|---|
| Inside/outside | “เข้าใจคำบอกตำแหน่งแบบมีขอบเขต เช่น ใน/นอก ได้ดีขึ้น” |
| On/under | “เริ่มเข้าใจตำแหน่งด้านบนและด้านล่างจากภาพได้” |
| Beside | “เริ่มมองความสัมพันธ์ระหว่างวัตถุสองชิ้นได้” |
| Front/behind | “เริ่มเข้าใจตำแหน่งที่มีมิติหน้า/หลัง” |
| Mixed spatial scenes | “ใช้คำบอกตำแหน่งหลายแบบในสถานการณ์เดียวกันได้ดีขึ้น” |

---

## Game Design Rules for Claude Code

When implementing position content:
1. Use scenes, not text-only cards.
2. Start with inside/outside and on/under.
3. Delay left/right until later research.
4. Use Thai wording first.
5. Add friendly hints, not “wrong”.
6. Avoid ambiguous visuals.
7. Keep each question under 10–20 seconds.
8. Do not modify `eggAlgorithm.js`.

---

## Open Questions

1. Should position words be Math or Thai, or shared between both subjects?
2. Should left/right be introduced after age 6 only?
3. Should drag-and-drop be used immediately, or tap-choice first?
4. Should front/behind require custom artwork instead of emoji?

---

## Recommended Next Step

Ask Claude Chatbot to review this file against:
- `src/games/GameMath.jsx`
- `src/config/gameConfig.js`
- existing visual model architecture
- `docs/research/math/kindergarten.md`

Then ask Claude Code to implement only after review.

## Sources

- Institute of Education Sciences / What Works Clearinghouse, “Teaching Math to Young Children”
  - https://ies.ed.gov/ncee/wwc/PracticeGuide/18
  - PDF: https://ies.ed.gov/ncee/wwc/Docs/practiceguide/early_math_pg_111313.pdf
- Education Endowment Foundation, “Improving Mathematics in the Early Years and Key Stage 1”
  - https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/early-maths
- Education Endowment Foundation, “Use manipulatives and representations to develop understanding”
  - https://educationendowmentfoundation.org.uk/early-years/maths/use-manipulatives-and-representations-to-develop-understanding
- Singapore MOE Nurturing Early Learners, “Using Concrete-Pictorial-Abstract (CPA) Approach”
  - https://nel.moe.edu.sg/la/numeracy/how-can-you-do-it-/using-concrete-pictorial-abstract--cpa--approach/
- NCTM / NAEYC, “Early Childhood Mathematics: Promoting Good Beginnings”
  - https://www.naeyc.org/positionstatements/mathematics

