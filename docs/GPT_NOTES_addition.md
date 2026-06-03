# GPT_NOTES.md Addition — Math Kindergarten Research

Paste this into `docs/GPT_NOTES.md`.

---

## Research Notes

### Math age 5–6 / Kindergarten

Sources reviewed:
- IES / WWC “Teaching Math to Young Children”
- EEF “Improving Mathematics in the Early Years and Key Stage 1”
- Singapore MOE NEL “Using Concrete-Pictorial-Abstract (CPA) Approach”

Key findings:
- Early math should follow developmental progressions, especially number and operations.
- Children need purposeful visual/concrete representations, not only symbolic equations.
- CPA approach should guide level design: concrete → pictorial → abstract.
- Math should connect to daily-life play situations and be assessed by micro-skills.

KidQuest implication:
- Current Math levels can remain, but should be expanded with a foundation layer:
  - counting 1–5
  - counting 1–10
  - numeral-to-quantity matching
  - more/less/same
  - pattern AB/ABC
  - shape/spatial language
- Parent Report should eventually show math strand mastery, not only XP.

---

## Curriculum Decisions

### Math Level Tree v2 draft

- M0 Count 1–5
- M1 Add 1–5
- M2 Add 1–10
- M3 Compare more/less/same
- M4 Subtract 1–10
- M5 Patterns AB/ABC
- M6 Mixed add/sub story
- M7 Word problems
- M8 Number order
- M9 Shape/spatial
- M10 Review boss

Decision status:
- Draft only.
- Needs Claude Chatbot review before implementation.

---

## Architecture Suggestions

For future math expansion:
- Move toward question-bank objects with:
  - ageBand
  - strand
  - skill
  - level
  - representation
  - promptTh
  - visualModel
  - answer
  - choices
  - hint
  - masteryTag

Do not modify `eggAlgorithm.js`.

---

## Open Questions for Claude

1. Can `src/config/gameConfig.js` support Math M0–M10 without refactoring?
2. Should Math M0 be inserted before current L1, or become optional foundation mode?
3. Does current `GameMath.jsx` support non-numeric question types like compare/pattern/shape?
4. What is the smallest safe implementation path?
