# Math Research — Compare More / Less / Same / เปรียบเทียบมากกว่า-น้อยกว่า-เท่ากัน

_Last updated: 2026-06-03_  
_Status: Draft v1 for KidQuest curriculum design_  
_Target path: `docs/research/math/compare-more-less.md`_

## Purpose

This document defines a research-backed comparison layer for KidQuest children around age 5–7.

Target user:
- Thai child around kindergarten to early Grade 1
- Can often count small sets but may still compare by visual size, spacing, or object size instead of quantity
- Learns best through side-by-side visual groups, balance scales, sorting, and short playful challenges

KidQuest goal:
- Comparison should help children understand quantity relationships, not just choose the “bigger-looking” group.
- The game should make “more / less / same” visible through objects, dots, and balance-style feedback.

---

## Evidence Base

### 1. Comparison is part of number sense

WWC / IES recommends teaching number and operations through a developmental progression.

KidQuest implication:
- Comparing quantities should be treated as a core number-sense skill.
- It should not be hidden only inside word problems.
- Children should compare small groups before solving abstract inequalities.

### 2. Young children need purposeful representations

EEF recommends manipulatives and representations to develop understanding.

KidQuest implication:
- Use objects, dots, ten frames, and balance visuals.
- Do not rely only on symbols like `>` and `<`.
- Use equal groups regularly, not only “more” examples.

### 3. CPA sequence is appropriate

Singapore MOE’s CPA approach supports:
- Concrete: apples, eggs, stars, creatures
- Pictorial: dot frames, balance scale, side-by-side arrays
- Abstract: more/less/same words and later `>`, `<`, `=`

KidQuest implication:
- Do not introduce `>` and `<` before the child can compare visual quantities reliably.
- Symbols can be delayed or used only as later extension.

---

## Core Design Rule

For comparison learning:

```text
Compare visible groups
↓
Match one-to-one
↓
Choose more / less / same
↓
Count to verify
↓
Compare numerals later
```

Avoid:
- Starting with `7 > 5`
- Only asking “which has more?”
- Making all objects the same size and spacing forever
- Letting children rely on visual spread instead of quantity
- Missing equal-group practice

---

## Recommended Skill Progression

### C1. Compare 1–5 using visible objects

Lesson:
- Use small groups that can be compared without heavy counting.

Question types:
- “ฝั่งไหนมีไข่มากกว่า?”
- “ฝั่งไหนมีดาวน้อยกว่า?”
- “สองฝั่งเท่ากันไหม?”

Game mechanic:
- Egg Balance Scale
- Two plates or nests appear. Child chooses more / less / same.

Mastery:
- 90% accuracy across 10 questions
- Includes same/equal groups
- Includes small differences like 3 vs 4

---

### C2. Compare 1–10 using count-to-check

Lesson:
- Child may need to count both sides.
- Encourage one-to-one matching.

Question types:
- Count rings on left and right, then choose more.
- Pair objects visually, see leftovers.
- Choose which creature has fewer snacks.

Game mechanic:
- Snack Match
- Objects pair up across two groups; leftovers reveal which side has more.

Mastery:
- 85% accuracy
- Includes scattered groups, not only neat rows

---

### C3. Equal groups / same quantity

Lesson:
- “Same” is a key concept and should be taught explicitly.

Question types:
- Are these the same?
- Choose the pair that has the same amount.
- Make both baskets have the same number.

Game mechanic:
- Equal Basket
- Child adds/removes objects until baskets match.

Mastery:
- 85–90% accuracy
- Includes equal groups with different arrangements

---

### C4. Compare numerals 1–10 with visual support

Lesson:
- Move from groups to numerals after quantity comparison is stable.

Question types:
- Which number is more, 6 or 4?
- Match number to group, then choose more.
- Choose less number.

Game mechanic:
- Number Duel
- Two number cards summon visual groups; child chooses winner.

Mastery:
- 85% accuracy
- Visual hint available

---

### C5. Intro to comparison symbols

Lesson:
- Optional later extension.
- Use crocodile/mouth metaphor carefully if used; ensure child understands quantity, not just trick.

Question types:
- 5 __ 3
- Choose >, <, =
- But only after visual comparison mastery.

Game mechanic:
- Monster Mouth
- Monster opens mouth toward the larger group.

Mastery:
- 80–85% accuracy
- Not required for age 5 foundation

---

## KidQuest Level Proposal

Current KidQuest already has Math L7 comparison. This file should serve as the source of truth for improving or expanding that level.

### Proposed Level Structure

| Level | Skill | Game Style | Mastery |
|---|---|---|---|
| M7a | More/less 1–5 | Egg Balance Scale | 90% |
| M7b | More/less/same 1–10 | Snack Match | 85% |
| M7c | Equal groups | Equal Basket | 85–90% |
| M7d | Numeral comparison | Number Duel | 85% |
| M7e | Symbols > < = | Monster Mouth | 80–85%, optional |

---

## Question Bank Schema Suggestion

```ts
type CompareQuestion = {
  id: string
  ageBand: '5-7'
  strand: 'numberSense'
  skill: 'compareMoreLess' | 'compareSame' | 'compareNumerals' | 'compareSymbols'
  level: 'M7'
  representation: 'concrete' | 'pictorial' | 'abstract'
  promptTh: string
  visualModel: 'objectGroups' | 'balanceScale' | 'pairedObjects' | 'numberCards'
  left: number
  right: number
  comparison: 'more' | 'less' | 'same'
  answer: 'left' | 'right' | 'same' | '>' | '<' | '='
  choices: Array<string>
  hint: string
  masteryTag: string
}
```

---

## Example Questions

```ts
[
  {
    id: 'compare-more-001',
    ageBand: '5-7',
    strand: 'numberSense',
    skill: 'compareMoreLess',
    level: 'M7',
    representation: 'concrete',
    promptTh: 'ฝั่งไหนมีไข่มากกว่า?',
    visualModel: 'balanceScale',
    left: 4,
    right: 2,
    comparison: 'more',
    answer: 'left',
    choices: ['left', 'right', 'same'],
    hint: 'ลองจับคู่ไข่ทีละฟอง ฝั่งไหนเหลือคือมากกว่า',
    masteryTag: 'compare.more.1-5'
  },
  {
    id: 'compare-same-001',
    ageBand: '5-7',
    strand: 'numberSense',
    skill: 'compareSame',
    level: 'M7',
    representation: 'pictorial',
    promptTh: 'สองฝั่งมีจำนวนเท่ากันไหม?',
    visualModel: 'pairedObjects',
    left: 5,
    right: 5,
    comparison: 'same',
    answer: 'same',
    choices: ['left', 'right', 'same'],
    hint: 'ถ้าจับคู่ได้พอดี ไม่มีฝั่งไหนเหลือ แปลว่าเท่ากัน',
    masteryTag: 'compare.same'
  }
]
```

---

## Parent Insight Mapping

| Skill | Parent insight |
|---|---|
| More/less | “เริ่มเปรียบเทียบจำนวนมากกว่า-น้อยกว่าได้” |
| Same/equal | “เริ่มเข้าใจว่า ‘เท่ากัน’ หมายถึงจำนวนเท่ากัน ไม่ใช่หน้าตาเหมือนกัน” |
| Count-to-check | “เริ่มนับเพื่อยืนยันคำตอบ แทนการเดาจากภาพ” |
| Numeral comparison | “เริ่มเปรียบเทียบตัวเลขจากความหมายของจำนวนได้” |
| Symbol comparison | “เริ่มเข้าใจสัญลักษณ์มากกว่า/น้อยกว่าแบบพื้นฐาน” |

---

## Game Design Rules for Claude Code

When implementing comparison content:
1. Include equal/same questions from the start.
2. Avoid symbol-first comparison.
3. Add visual pairing if possible.
4. Vary arrangement and spacing so child does not rely on visual spread.
5. Keep choices simple: “ซ้าย / ขวา / เท่ากัน” or icon buttons.
6. Use friendly hints, not “wrong”.
7. Do not modify `eggAlgorithm.js`.

---

## Open Questions

1. Should comparison stay at existing Math L7 or be moved earlier before subtraction?
2. Should `>` and `<` appear in MVP or later?
3. Should equal-basket drag/drop be built now or start with tap-choice?
4. Should comparison mastery feed into parent report separately from arithmetic?

---

## Recommended Next Step

Ask Claude Chatbot to review current Math L7 against this file and recommend:
- Keep current implementation
- Improve visuals
- Split comparison into subskills
- Delay symbols

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

