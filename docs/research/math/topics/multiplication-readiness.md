# Math Research — Multiplication Readiness / ความพร้อมก่อนคูณ

_Last updated: 2026-06-03_  
_Status: Draft v1 for KidQuest curriculum design_  
_Target path: `docs/research/math/multiplication-readiness.md`_

## Purpose

This document defines a research-backed multiplication-readiness layer for KidQuest children around age 6–8.

Target user:
- Thai child around late kindergarten to Grade 2
- May not be ready for formal multiplication symbols
- Can benefit from visual grouping, skip counting, repeated addition, and equal groups

KidQuest goal:
- Prepare the child for multiplication without turning it into memorising times tables.
- Make multiplication feel like grouping treasure, feeding creatures equally, and counting equal baskets.

---

## Important Position

This file is about **readiness**, not formal multiplication mastery.

For age 5–6:
- Do not start with `3 × 2 = 6`.
- Start with “3 groups of 2” using pictures.
- Repeated addition like `2 + 2 + 2` can appear after visual grouping.

For age 7–8:
- Multiplication symbol can be introduced carefully after equal groups are stable.

---

## Evidence Base

### 1. Number and operations should follow developmental progression

WWC / IES recommends teaching number and operations through developmental progressions.

KidQuest implication:
- Multiplication should not appear as a sudden abstract level.
- It should grow from counting, number order, equal groups, and repeated addition.

### 2. Manipulatives and representations are essential

EEF recommends purposeful manipulatives and representations in early mathematics.

KidQuest implication:
- Use baskets, eggs, stars, plates, monster snacks, and rows.
- Avoid symbol-only drills.
- Equal groups should be visible and countable.

### 3. CPA model is critical here

Singapore MOE CPA progression:
- Concrete: 3 baskets, 2 apples each
- Pictorial: grouped dots or arrays
- Abstract: 2 + 2 + 2 = 6, later 3 × 2 = 6

KidQuest implication:
- The level should start with grouping objects.
- Abstract equations should be optional/later.

---

## Prerequisites

Before multiplication readiness, the child should have:

- Counting 1–20
- Numeral recognition 1–20
- Addition within 10
- Number order 1–20
- More/less/same
- Basic pattern recognition
- Optional: skip counting by 2s, 5s, 10s

If these are weak, multiplication readiness should be locked or used as visual-only enrichment.

---

## Core Design Rule

For multiplication readiness:

```text
Equal groups
↓
Count all
↓
Repeated addition
↓
Skip counting
↓
Arrays
↓
Multiplication symbol later
```

Avoid:
- Times table memorisation
- Abstract multiplication before equal groups
- Mixed unequal groups in the first lessons
- Fast timers
- Treating “knows answer” as understanding

---

## Recommended Skill Progression

### MR1. Equal groups

Lesson:
- Child sees the same number in each group.

Question types:
- “มีตะกร้า 3 ใบ ใบละ 2 ลูก รวมกี่ลูก?”
- “ทุกจานมีขนมเท่ากันไหม?”
- Choose the picture with equal groups.

Game mechanic:
- Treasure Baskets
- Each basket has the same number of gems.

Mastery:
- 85% accuracy with visual support
- Child can identify equal vs unequal groups

---

### MR2. Count all in equal groups

Lesson:
- Child counts total objects across groups.

Question types:
- 2 + 2 + 2 visually
- Count all eggs in 3 nests.
- Choose total from 3 options.

Game mechanic:
- Egg Nests
- Creature collects eggs from equal nests.

Mastery:
- 85% accuracy
- Visual support always available

---

### MR3. Repeated addition

Lesson:
- Connect equal groups to addition.

Question types:
- 2 + 2 + 2 = ?
- Which repeated addition matches 3 baskets of 2?
- Choose equation for picture.

Game mechanic:
- Magic Sum
- Equal groups combine into a repeated-addition spell.

Mastery:
- 80–85% accuracy
- Do not introduce multiplication symbol yet

---

### MR4. Skip counting readiness

Lesson:
- Count by 2s, 5s, or 10s with visual support.

Question types:
- 2, 4, 6, __
- Count pairs of shoes.
- Count hands by 5.

Game mechanic:
- Jump Stones
- Creature jumps equal steps.

Mastery:
- 80% accuracy
- Start with 2s and 5s only

---

### MR5. Arrays

Lesson:
- Rows and columns prepare for multiplication.

Question types:
- Count 2 rows of 3 stars.
- Which array has 6?
- Match array to repeated addition.

Game mechanic:
- Star Grid
- Build star rows.

Mastery:
- 80–85% accuracy
- Visual only at first

---

### MR6. Optional symbol bridge

Lesson:
- Only after equal groups, repeated addition, skip counting, and arrays are stable.

Question types:
- 3 groups of 2 = 3 × 2
- Match picture to multiplication sentence.
- Do not require memorised answer yet.

Game mechanic:
- Boss Key
- Multiplication symbol unlocks as a “shortcut”.

Mastery:
- 80% accuracy
- Grade 1/2+ only, not core kindergarten

---

## KidQuest Level Proposal

Recommended level placement:
- Math L13 or later
- Should come after Number Order and ABC Patterns
- May be hidden unless grade/skill level is appropriate

### Proposed Level

| Level | Skill | Game Style | Mastery |
|---|---|---|---|
| M13a | Equal groups | Treasure Baskets | 85% |
| M13b | Count all groups | Egg Nests | 85% |
| M13c | Repeated addition | Magic Sum | 80–85% |
| M13d | Skip counting readiness | Jump Stones | 80% |
| M13e | Arrays | Star Grid | 80–85% |
| M13f | Symbol bridge | Boss Key | 80%, optional |

---

## Question Bank Schema Suggestion

```ts
type MultiplicationReadinessQuestion = {
  id: string
  ageBand: '6-8'
  strand: 'operations'
  skill: 'equalGroups' | 'countGroups' | 'repeatedAddition' | 'skipCounting' | 'arrays' | 'symbolBridge'
  level: 'M13'
  representation: 'concrete' | 'pictorial' | 'abstract'
  promptTh: string
  visualModel: 'equalGroups' | 'array' | 'skipCountPath'
  groups?: number
  perGroup?: number
  rows?: number
  columns?: number
  sequence?: number[]
  answer: number | string
  choices?: Array<number | string>
  hint: string
  masteryTag: string
}
```

---

## Example Questions

```ts
[
  {
    id: 'mr-equal-groups-001',
    ageBand: '6-8',
    strand: 'operations',
    skill: 'equalGroups',
    level: 'M13',
    representation: 'concrete',
    promptTh: 'มีตะกร้า 3 ใบ ใบละ 2 ลูก รวมกี่ลูก?',
    visualModel: 'equalGroups',
    groups: 3,
    perGroup: 2,
    answer: 6,
    choices: [5, 6, 7],
    hint: 'ลองนับทีละตะกร้า: 2, 4, 6',
    masteryTag: 'multiplicationReadiness.equalGroups'
  },
  {
    id: 'mr-repeated-addition-001',
    ageBand: '6-8',
    strand: 'operations',
    skill: 'repeatedAddition',
    level: 'M13',
    representation: 'pictorial',
    promptTh: 'รูปนี้ตรงกับประโยคไหน?',
    visualModel: 'equalGroups',
    groups: 3,
    perGroup: 2,
    answer: '2 + 2 + 2',
    choices: ['2 + 2 + 2', '3 + 2', '2 + 3 + 3'],
    hint: 'มี 3 กลุ่ม และแต่ละกลุ่มมี 2 ชิ้น',
    masteryTag: 'multiplicationReadiness.repeatedAddition'
  }
]
```

---

## Parent Insight Mapping

| Skill | Parent insight |
|---|---|
| Equal groups | “เริ่มเข้าใจว่าการคูณมาจากกลุ่มที่มีจำนวนเท่ากัน” |
| Count all groups | “นับจำนวนรวมจากหลายกลุ่มได้ดีขึ้น” |
| Repeated addition | “เริ่มเชื่อมการบวกซ้ำกับสถานการณ์จริงได้” |
| Skip counting | “เริ่มนับเพิ่มทีละจำนวนเท่า ๆ กันได้” |
| Arrays | “เริ่มมองจำนวนในรูปแบบแถวและคอลัมน์ได้” |
| Symbol bridge | “เริ่มรู้จักสัญลักษณ์คูณเป็นทางลัดของการบวกซ้ำ” |

---

## Game Design Rules for Claude Code

When implementing multiplication readiness:
1. Do not implement formal times-table drills.
2. Do not start with multiplication symbols.
3. Use equal-group visuals first.
4. Keep timers generous or disabled initially.
5. Use repeated addition before `×`.
6. Use `×` only as optional later bridge.
7. Do not modify `eggAlgorithm.js`.

---

## Open Questions

1. Should multiplication readiness be available to grade 0 users or hidden until grade 1/2?
2. Should skip counting live in `number-order.md` or here?
3. Should arrays require a new visual model in `GameMath.jsx`?
4. Should multiplication symbol be excluded from MVP?

---

## Recommended Next Step

Ask Claude Chatbot to review:
- Whether M13 should be implemented now or postponed
- Whether equal groups can reuse existing visual model code
- Whether grade gating is needed

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

