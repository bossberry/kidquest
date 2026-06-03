# Math Research — Shape Recognition / รูปร่างพื้นฐาน

_Last updated: 2026-06-03_  
_Status: Draft v1 for KidQuest curriculum design_  
_Target path: `docs/research/math/shape.md`_

## Purpose

This document defines a research-backed shape-recognition layer for KidQuest children around age 5–7.

Target user:
- Thai child around kindergarten to early Grade 1
- May know shape names informally but still needs visual comparison and repeated exposure
- Learns best through visual play, object matching, short feedback, and familiar real-world examples

KidQuest goal:
- Shape learning should feel like exploring gates, keys, monsters, rooms, and treasures.
- It should not feel like memorising definitions.

---

## Evidence Base

### 1. Early math should include geometry, not only counting and arithmetic

WWC / IES “Teaching Math to Young Children” recommends teaching geometry, patterns, measurement, and data analysis using a developmental progression, in addition to number and operations.

KidQuest implication:
- Do not treat geometry as an extra topic after arithmetic.
- Shape recognition can become a main Math level, not just a bonus.
- Shapes should be introduced through concrete/pictorial matching before abstract labels.

### 2. Manipulatives and representations support early mathematical understanding

EEF recommends using manipulatives and representations purposefully to develop understanding in children aged 3–7.

KidQuest implication:
- Use familiar objects: ball, plate, clock, window, book, roof, pizza slice, door.
- Use visual cards before text-only shape names.
- Avoid asking only “What is this shape?” repeatedly. Let children sort, match, build, and choose.

### 3. CPA applies to geometry too

Singapore MOE describes CPA as moving from concrete/familiar materials to pictorial representations and then abstract symbols.

KidQuest implication:
- Concrete: real-world objects or game objects that look like shapes.
- Pictorial: clean icons of circle/square/triangle/rectangle.
- Abstract: Thai/English shape names and attributes.

---

## Core Design Rule

For shape learning:

```text
Real object
↓
Shape icon
↓
Shape name
↓
Shape attribute
↓
Mixed recognition
```

Avoid:
- Starting with formal definitions
- Using too many shapes at once
- Teaching 3D shapes before 2D shapes are stable
- Penalising children for confusing square/rectangle too early
- Using tiny icons that make visual discrimination hard

---

## Recommended Skill Progression

### S1. Recognise circle / square / triangle

Lesson:
- Start with the three most visually distinct shapes.
- Use large, high-contrast icons.

Question types:
- “วงกลมอยู่ตรงไหน?”
- “ประตูรูปสามเหลี่ยมคืออันไหน?”
- Choose the shape that matches the key.

Game mechanic:
- Shape Gate
- Creature holds a shape key and must pass through the matching gate.

Mastery:
- 90% accuracy across 10–12 questions
- Includes random order
- Includes at least 2 distractor shapes

---

### S2. Add rectangle

Lesson:
- Introduce rectangle after square is stable.
- Contrast square vs rectangle visually.

Question types:
- “อันไหนคือสี่เหลี่ยมผืนผ้า?”
- Choose the rectangle door.
- Match book/window/phone to rectangle.

Game mechanic:
- Door Match
- Creature must choose the correct door shape.

Mastery:
- 85% accuracy
- Must include square-vs-rectangle comparisons

---

### S3. Match real object to shape

Lesson:
- Connect math to daily life.

Question types:
- Plate → circle
- Book → rectangle
- Pizza slice / roof → triangle
- Block / tile → square

Game mechanic:
- Treasure Sort
- Drag objects into shape chests.

Mastery:
- 85% accuracy
- Child can match at least 4 real-object examples per shape

---

### S4. Sort by shape

Lesson:
- Sorting strengthens classification and visual discrimination.

Question types:
- Put all circles together.
- Which object does not belong?
- Choose all triangles.

Game mechanic:
- Monster Lunchbox
- Feed each monster only its favourite shape.

Mastery:
- 85% accuracy
- Includes mixed objects with colour variation so child sorts by shape, not colour

---

### S5. Basic attributes

Lesson:
- Introduce simple attributes without formal geometry language:
  - circle: no corners
  - triangle: 3 corners
  - square: 4 equal sides
  - rectangle: 4 sides, longer shape

Question types:
- “รูปร่างไหนมี 3 มุม?”
- “รูปร่างไหนไม่มีมุม?”
- Choose the shape with 4 corners.

Game mechanic:
- Shape Detective
- Creature searches for clues.

Mastery:
- 80–85% accuracy
- Only after S1–S4 are stable

---

## KidQuest Level Proposal

Recommended level placement:
- Math L10: Shape Recognition
- Should come after pattern/comparison or be available as a parallel geometry branch.

### Proposed Level

| Level | Skill | Game Style | Mastery |
|---|---|---|---|
| M10 | Circle / square / triangle / rectangle | Shape Gate | 90% |
| M10b | Object-to-shape matching | Treasure Sort | 85% |
| M10c | Shape attributes | Shape Detective | 80–85% |

---

## Question Bank Schema Suggestion

```ts
type ShapeQuestion = {
  id: string
  ageBand: '5-7'
  strand: 'geometry'
  skill: 'shapeRecognition' | 'objectShapeMatch' | 'shapeSorting' | 'shapeAttributes'
  level: 'M10'
  representation: 'concrete' | 'pictorial' | 'abstract'
  promptTh: string
  visualModel: 'shapeCards' | 'objectCards' | 'sortTray'
  targetShape: 'circle' | 'square' | 'triangle' | 'rectangle'
  choices: Array<'circle' | 'square' | 'triangle' | 'rectangle'>
  hint: string
  masteryTag: string
}
```

---

## Example Questions

```ts
[
  {
    id: 'shape-circle-001',
    ageBand: '5-7',
    strand: 'geometry',
    skill: 'shapeRecognition',
    level: 'M10',
    representation: 'pictorial',
    promptTh: 'วงกลมอยู่ตรงไหน?',
    visualModel: 'shapeCards',
    targetShape: 'circle',
    choices: ['triangle', 'circle', 'square'],
    hint: 'วงกลมจะกลม ๆ ไม่มีมุม',
    masteryTag: 'shape.circle'
  },
  {
    id: 'shape-object-001',
    ageBand: '5-7',
    strand: 'geometry',
    skill: 'objectShapeMatch',
    level: 'M10',
    representation: 'concrete',
    promptTh: 'จานเหมือนรูปร่างอะไร?',
    visualModel: 'objectCards',
    targetShape: 'circle',
    choices: ['circle', 'square', 'triangle'],
    hint: 'ลองมองขอบของจานนะ',
    masteryTag: 'shape.object.circle'
  }
]
```

---

## Parent Insight Mapping

| Skill | Parent insight |
|---|---|
| Shape recognition | “เริ่มจำแนกรูปร่างพื้นฐานได้ดีขึ้น” |
| Object-shape match | “เริ่มเชื่อมคณิตศาสตร์กับของรอบตัวได้” |
| Shape sorting | “มองเห็นลักษณะร่วมของสิ่งของและจัดกลุ่มได้” |
| Shape attributes | “เริ่มเข้าใจคำว่า มุม / ด้าน / ไม่มีมุม แบบพื้นฐาน” |

---

## Game Design Rules for Claude Code

When implementing shape content:
1. Prefer visual choice cards over text-only choices.
2. Do not start with shape definitions.
3. Introduce circle, square, triangle before rectangle.
4. Add square-vs-rectangle questions only after basic shapes are stable.
5. Use friendly hints:
   - “วงกลมไม่มีมุม ลองหาอันที่กลม ๆ”
   - “สามเหลี่ยมมี 3 มุม”
6. Keep one question under 10–20 seconds.
7. Do not modify `eggAlgorithm.js`.

---

## Open Questions

1. Should shape be Math L10 or a separate Geometry branch?
2. Should Thai shape names or icons appear first?
3. Should English shape names be introduced later in English, not Math?
4. Should 3D shapes be delayed until Grade 1 or Grade 2?

---

## Recommended Next Step

Ask Claude Chatbot to review this file against:
- `src/config/gameConfig.js`
- `src/games/GameMath.jsx`
- `docs/research/math/kindergarten.md`
- `docs/TASKS.md`

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

