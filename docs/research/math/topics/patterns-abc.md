# Math Research — ABC Patterns / รูปแบบซ้ำ 3 ส่วน

_Last updated: 2026-06-03_  
_Status: Draft v1 for KidQuest curriculum design_  
_Target path: `docs/research/math/patterns-abc.md`_

## Purpose

This document defines a research-backed ABC-pattern layer for KidQuest children around age 5–7.

Target user:
- Thai child around kindergarten to early Grade 1
- Has likely practised simple AB patterns but may not yet generalise to 3-part repeating structures
- Learns best through colourful sequences, rhythm, movement, and prediction

KidQuest goal:
- ABC patterns should feel like a creature parade, egg garland, rhythm game, or magic sequence.
- Children should learn to identify the repeating unit and predict what comes next.

---

## Evidence Base

### 1. Patterns are part of early mathematics

WWC / IES recommends teaching geometry, patterns, measurement, and data analysis in preschool and kindergarten math instruction.

KidQuest implication:
- Pattern work belongs in Math, not only logic minigames.
- AB and ABC patterns should be sequenced developmentally.

### 2. Representations should make structure visible

EEF recommends using representations purposefully.

KidQuest implication:
- Use colour, shape, object type, sound, and movement as pattern attributes.
- Highlight the repeating unit after a mistake or as a hint.
- Do not rely only on text prompts.

### 3. Patterns support algebraic thinking readiness

Early patterning helps children notice regularity, structure, and prediction. This is a foundation for later algebraic thinking, skip counting, and repeated addition.

KidQuest implication:
- Pattern levels are not “extra cute content”; they support later math structure.
- ABC pattern mastery should come before more advanced sequencing and skip-counting tasks.

---

## Core Design Rule

For ABC patterns:

```text
Recognise repeating unit
↓
Copy pattern
↓
Continue pattern
↓
Fill missing object
↓
Transfer pattern to new objects
```

Avoid:
- Jumping from AB directly to complex AABB/ABB/ABBC patterns
- Using too many colours/shapes at once
- Asking text-only questions
- Giving patterns that are too short to reveal the repeating unit
- Making distractors visually too similar at first

---

## Prerequisite

Child should already be comfortable with:
- AB patterns, e.g. 🥚⭐🥚⭐?
- Sorting by one attribute
- Basic visual discrimination

Existing KidQuest:
- Math L8 includes AB pattern.
- ABC should follow L8 or be Math L9.

---

## Recommended Skill Progression

### A1. Copy ABC pattern

Lesson:
- Child first copies the complete unit.

Question types:
- Copy: 🥚🐣⭐
- Tap the same 3-item sequence.
- Build one unit.

Game mechanic:
- Creature Parade Practice
- Child copies the first 3 parade members.

Mastery:
- 90% accuracy
- No timer

---

### A2. Continue ABC pattern

Lesson:
- Continue a visible repeating pattern.

Question types:
- 🥚🐣⭐ 🥚🐣 ?
- 🔴🔵🟡 🔴 ? 🟡
- Choose next object.

Game mechanic:
- Creature Parade
- Choose the next parade member.

Mastery:
- 85–90% accuracy
- Sequence should show at least 2 full cycles before asking

---

### A3. Fill missing object

Lesson:
- Child identifies missing middle or final item.

Question types:
- 🥚 __ ⭐ 🥚🐣⭐
- 🥚🐣⭐ 🥚 __ ⭐
- Choose missing object.

Game mechanic:
- Broken Garland
- Fix the missing bead.

Mastery:
- 85% accuracy
- Include beginning/middle/end missing positions

---

### A4. Identify the repeating unit

Lesson:
- Child recognises the unit itself, not only next item.

Question types:
- What repeats here?
- Choose the group that makes this pattern.
- 🥚🐣⭐ is the “magic spell” repeated.

Game mechanic:
- Magic Spell
- Choose the 3-symbol spell that powers the bridge.

Mastery:
- 80–85% accuracy
- This is harder and can be optional

---

### A5. Transfer pattern to new objects

Lesson:
- The child recognises structure even when objects change.

Question types:
- If 🥚🐣⭐ becomes 🍎🍌🍇, what comes next?
- Match same pattern using new objects.

Game mechanic:
- Pattern Costume
- Parade changes costumes but keeps same rhythm.

Mastery:
- 80% accuracy
- Later extension

---

## KidQuest Level Proposal

Recommended level placement:
- Math L9: ABC Pattern
- It naturally follows current Math L8 AB Pattern.

### Proposed Level

| Level | Skill | Game Style | Mastery |
|---|---|---|---|
| M9a | copy ABC unit | Creature Parade Practice | 90% |
| M9b | continue ABC pattern | Creature Parade | 85–90% |
| M9c | fill missing ABC item | Broken Garland | 85% |
| M9d | identify repeating unit | Magic Spell | 80–85% |
| M9e | transfer ABC pattern | Pattern Costume | 80%, later |

---

## Question Bank Schema Suggestion

```ts
type PatternABCQuestion = {
  id: string
  ageBand: '5-7'
  strand: 'patterns'
  skill: 'abcPattern'
  level: 'M9'
  representation: 'concrete' | 'pictorial'
  promptTh: string
  visualModel: 'patternSequence' | 'garland' | 'parade'
  unit: [string, string, string]
  sequence: string[]
  missingIndex?: number
  answer: string | string[]
  choices: Array<string | string[]>
  hint: string
  masteryTag: string
}
```

---

## Example Questions

```ts
[
  {
    id: 'abc-next-001',
    ageBand: '5-7',
    strand: 'patterns',
    skill: 'abcPattern',
    level: 'M9',
    representation: 'pictorial',
    promptTh: 'ตัวต่อไปคืออะไร?',
    visualModel: 'parade',
    unit: ['🥚', '🐣', '⭐'],
    sequence: ['🥚', '🐣', '⭐', '🥚', '🐣'],
    answer: '⭐',
    choices: ['🥚', '🐣', '⭐'],
    hint: 'ลองดูชุดที่ซ้ำ: ไข่ ลูกเจี๊ยบ ดาว',
    masteryTag: 'pattern.abc.next'
  },
  {
    id: 'abc-missing-001',
    ageBand: '5-7',
    strand: 'patterns',
    skill: 'abcPattern',
    level: 'M9',
    representation: 'pictorial',
    promptTh: 'ช่องว่างควรเป็นอะไร?',
    visualModel: 'garland',
    unit: ['🍎', '🍌', '🍇'],
    sequence: ['🍎', null, '🍇', '🍎', '🍌', '🍇'],
    missingIndex: 1,
    answer: '🍌',
    choices: ['🍎', '🍌', '🍇'],
    hint: 'ชุดนี้ซ้ำแบบ แอปเปิล กล้วย องุ่น',
    masteryTag: 'pattern.abc.missing'
  }
]
```

---

## Hint Design

Pattern hints should show structure, not just reveal answer.

Attempt 1:
- Highlight the repeating unit.
- Example: 🥚🐣⭐ | 🥚🐣 ?

Attempt 2:
- Speak or show sequence:
  - “ไข่ ลูกเจี๊ยบ ดาว... ไข่ ลูกเจี๊ยบ... อะไรต่อ?”

Attempt 3:
- Reveal answer gently:
  - “รอบนี้คือดาว เพราะชุดซ้ำคือ ไข่-ลูกเจี๊ยบ-ดาว”

---

## Parent Insight Mapping

| Skill | Parent insight |
|---|---|
| Copy pattern | “เริ่มสังเกตลำดับซ้ำและทำตามแบบได้” |
| Continue pattern | “เริ่มคาดเดาสิ่งถัดไปจากรูปแบบได้” |
| Fill missing item | “เริ่มมองเห็นตำแหน่งที่ขาดหายในลำดับได้” |
| Repeating unit | “เริ่มเข้าใจว่ารูปแบบเกิดจากชุดเล็ก ๆ ที่ซ้ำกัน” |
| Pattern transfer | “เริ่มมองเห็นโครงสร้างเดิม แม้เปลี่ยนสิ่งของที่ใช้” |

---

## Game Design Rules for Claude Code

When implementing ABC patterns:
1. Use existing AB pattern architecture if possible.
2. Add `PATTERN_SETS_ABC` or extend existing `PATTERN_SETS` safely.
3. Show at least 2 cycles before asking “next” questions.
4. Highlight the repeating unit as a hint.
5. Do not mix AB, ABC, AAB, ABB in the same early level.
6. Keep visual sequence large and uncluttered.
7. Do not modify `eggAlgorithm.js`.

---

## Open Questions

1. Should ABC pattern be Math L9 immediately after current L8?
2. Should existing pattern code support `unitLength: 2 | 3`?
3. Should pattern mastery be separate from general Math XP?
4. Should rhythm/audio pattern be added later as a minigame?

---

## Recommended Next Step

Ask Claude Chatbot to review:
- Current `PATTERN_SETS`
- Current `GameMath.jsx` pattern question logic
- Whether extension to unit length 3 is safe

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

