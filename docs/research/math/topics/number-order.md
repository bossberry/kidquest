# Math Research — Number Order / ลำดับจำนวน

_Last updated: 2026-06-03_  
_Status: Draft v1 for KidQuest curriculum design_  
_Target path: `docs/research/math/number-order.md`_

## Purpose

This document defines a research-backed number-order layer for KidQuest children around age 5–7.

Target user:
- Thai child around kindergarten to early Grade 1
- May be able to recite 1–10 but may not yet understand before/after, missing numbers, or order as quantity
- Learns best through stepping stones, bridges, tracks, and visual sequences

KidQuest goal:
- Number order should feel like building a path or bridge.
- Children should understand sequence and relative position, not only memorise counting words.

---

## Evidence Base

### 1. Number and operations should follow a developmental progression

WWC / IES recommends teaching number and operations using developmental progressions for young children.

KidQuest implication:
- Number order should sit between counting and arithmetic.
- A child who can recite numbers may still need practice with before/after/missing-number tasks.
- Do not assume success in counting means readiness for fast addition/subtraction.

### 2. Math should be connected to everyday activities and progress monitoring

WWC / IES recommends helping children see math in daily activities and monitoring progress to tailor instruction.

KidQuest implication:
- Use game paths, stairs, bridges, calendars, and score tracks.
- Parent report should separate “counting” from “number order”.

### 3. Representations should be purposeful

EEF recommends manipulatives and representations to develop understanding.

KidQuest implication:
- Use number lines, tiles, stepping stones, and bridge pieces.
- Avoid only asking text prompts like “what comes after 8?” without visual support at first.

### 4. CPA progression is appropriate

Singapore MOE’s CPA model supports:
- Concrete: physical stepping stones / tiles
- Pictorial: number line / bridge tiles
- Abstract: missing number symbols

---

## Core Design Rule

For number order:

```text
Count objects
↓
See ordered path
↓
Fill next number
↓
Find before/after
↓
Fill missing number
↓
Order mixed numbers
```

Avoid:
- Jumping directly to abstract missing-number worksheets
- Timers that pressure children before sequence is stable
- Starting beyond 20 too early
- Treating recitation as full mastery

---

## Recommended Skill Progression

### N1. Order 1–5

Lesson:
- Build a very short ordered sequence.

Question types:
- Put 1, 2, 3 in order.
- What comes after 2?
- Complete 1, 2, __.

Game mechanic:
- Number Bridge
- Creature crosses only if bridge tiles are in order.

Mastery:
- 90% accuracy
- No timer or generous timer

---

### N2. Order 1–10

Lesson:
- Extend sequence and introduce before/after.

Question types:
- What comes after 6?
- What comes before 5?
- Complete 4, 5, __.
- Put 3, 5, 4 in order.

Game mechanic:
- Bridge Builder
- Child drags number tiles into a bridge.

Mastery:
- 85% accuracy
- Includes both before and after

---

### N3. Missing number 1–10

Lesson:
- Recognise missing internal values, not only next number.

Question types:
- 3, __, 5
- 6, 7, __
- __, 9, 10

Game mechanic:
- Broken Bridge
- Missing tile must be placed correctly.

Mastery:
- 85% accuracy
- Includes first/middle/last missing positions

---

### N4. Order 1–20

Lesson:
- Extend number sequence gradually.
- Use number line support.

Question types:
- What comes after 13?
- Complete 16, 17, __.
- Put 12, 10, 11 in order.

Game mechanic:
- Long Bridge
- Number line can be shown as hint.

Mastery:
- 80–85% accuracy
- Allow slower response than 1–10

---

### N5. Skip-counting readiness

Lesson:
- Prepare for later multiplication by noticing regular jumps.
- Do not force multiplication symbols yet.

Question types:
- 2, 4, 6, __
- 5, 10, __
- Choose the next stepping stone.

Game mechanic:
- Jump Stones

Mastery:
- 80% accuracy with visual support
- Treat as readiness, not formal multiplication

---

## KidQuest Level Proposal

Recommended level placement:
- Math L12: Number Order
- It can be introduced earlier than multiplication readiness.

### Proposed Level

| Level | Skill | Game Style | Mastery |
|---|---|---|---|
| M12 | before/after 1–10 | Number Bridge | 85% |
| M12b | missing number 1–10 | Broken Bridge | 85% |
| M12c | order 1–20 | Long Bridge | 80–85% |
| M12d | skip-count readiness | Jump Stones | 80% |

---

## Question Bank Schema Suggestion

```ts
type NumberOrderQuestion = {
  id: string
  ageBand: '5-7'
  strand: 'numberSense'
  skill: 'numberOrder' | 'beforeAfter' | 'missingNumber' | 'skipCountingReadiness'
  level: 'M12'
  representation: 'concrete' | 'pictorial' | 'abstract'
  promptTh: string
  visualModel: 'numberBridge' | 'numberLine' | 'steppingStones'
  sequence: number[]
  missingIndex?: number
  answer: number | number[]
  choices?: Array<number | number[]>
  hint: string
  masteryTag: string
}
```

---

## Example Questions

```ts
[
  {
    id: 'order-after-001',
    ageBand: '5-7',
    strand: 'numberSense',
    skill: 'beforeAfter',
    level: 'M12',
    representation: 'pictorial',
    promptTh: 'เลขอะไรอยู่ถัดจาก 6?',
    visualModel: 'numberBridge',
    sequence: [4, 5, 6, null],
    missingIndex: 3,
    answer: 7,
    choices: [5, 7, 8],
    hint: 'ลองนับต่อจาก 6 อีกหนึ่งครั้ง',
    masteryTag: 'numberOrder.after.1-10'
  },
  {
    id: 'order-missing-001',
    ageBand: '5-7',
    strand: 'numberSense',
    skill: 'missingNumber',
    level: 'M12',
    representation: 'pictorial',
    promptTh: 'เลขที่หายไปคืออะไร? 3, __, 5',
    visualModel: 'numberBridge',
    sequence: [3, null, 5],
    missingIndex: 1,
    answer: 4,
    choices: [2, 4, 6],
    hint: 'ลองนับ 3 แล้วไปต่อถึง 5',
    masteryTag: 'numberOrder.missing.1-10'
  }
]
```

---

## Parent Insight Mapping

| Skill | Parent insight |
|---|---|
| Before/after | “เริ่มเข้าใจว่าเลขมีลำดับก่อนและหลัง ไม่ใช่แค่ท่องจำ” |
| Missing number | “เริ่มเติมลำดับตัวเลขที่หายไปได้” |
| Ordering mixed numbers | “เริ่มเรียงตัวเลขจากน้อยไปมากได้” |
| Number line support | “ใช้ภาพเส้นจำนวนช่วยคิดได้ดีขึ้น” |
| Skip-count readiness | “เริ่มมองเห็นรูปแบบการนับเพิ่มทีละเท่า ๆ กัน” |

---

## Game Design Rules for Claude Code

When implementing number-order content:
1. Use number bridge / tiles / number line visuals.
2. Start with 1–10 before 1–20.
3. Avoid fast timers for the first version.
4. Separate before/after from missing-number mastery.
5. Do not treat counting recitation as number-order mastery.
6. Use hints like:
   - “ลองนับต่ออีกหนึ่ง”
   - “ดูเลขข้างหน้าและข้างหลัง”
7. Do not modify `eggAlgorithm.js`.

---

## Open Questions

1. Should Number Order appear before current Math L3 “บวก 1–20”?
2. Should number line become a shared visual model in `GameMath.jsx`?
3. Should skip-count readiness be in this file or in `multiplication-readiness.md` only?
4. Should Grade 0 children see 1–20 or stay at 1–10?

---

## Recommended Next Step

Ask Claude Chatbot to review whether current Math level order should change:
- Should M12 Number Order be inserted before existing L3?
- Or should it be added as later L9/L10 content to avoid migration complexity?

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

