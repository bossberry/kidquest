# Question-Generation Quality Audit — 2026-07-12

**Purpose:** BEFORE-state accountability record for the question-quality overhaul.
A real user (Chopin, age 5, observed by parent) reported that generated
battle/placement questions were confusing/ambiguous across **all three subjects**
— e.g. a counting question that rendered literally as `นับ: มีทั้งหมดกี่ชิ้น? (5)`
with no objects shown, and English questions with instructions the child cannot read.

This file is committed **before** any generator fix (per the task's hard requirement)
so there is a genuine "before" record of what was actually wrong.

## Method

Scripted, not eyeballed: `generateQuestion(node, d)` was called directly for every
one of the 43 curriculum nodes across difficulties `[1,2,3,5,8,10]`, ~40 samples each,
deduped by prompt and grouped by `inputMode` (so every input-mode path a node's
generator can produce is represented). Raw dump: reproducible via the sampler used
this session. Each sample was reviewed against the 5-rule quality bar:

1. **Complete instruction in child-Thai** — a 5-year-old hearing/reading only the prompt knows exactly what to do. No bare fragments (`นับ (5)`), no instruction the child can't read (English).
2. **Visual-first for K2–P1 nodes** — counting shows the actual objects; comparison shows both groups; letter questions show the letter huge.
3. **Prompt matches input mode** — numpad only for a number the child has seen represented; choice4 options all plausible same-category; never a Thai-text answer on a numeric numpad.
4. **One question, one task** — no compound asks.
5. **Self-contained** — never references something not visible on screen.

## Systemic (cross-cutting) findings

- **S1 — `emoji` field never rendered in battle.** `MoveSelectBattleMode.jsx` Zone 2 renders only `q.prompt`/`q.promptTh`. Many generators carry the picture hint in a separate `q.emoji` field (consonants, vowels, word problems) that battle **never draws** — so the picture the child needs is invisible in real battles. Where the emoji is embedded *inside* the prompt string (cvc/tones/sentences) it does show, but small.
- **S2 — no "visual objects" slot exists at all.** There is no render path for an emoji row (counting) or a huge letter. This is the root of the reported `(5)` bug: the generator had nowhere to put objects, so it dumped the number in parentheses into the text.
- **S3 — `QuestionRenderer.ChoiceButtons` prepends `question.emoji` to EVERY choice button** (placement/teaching), so a picture-match choice question shows the same emoji on all 4 buttons — misleading.
- **S4 — English instruction text is unreadable by the target child.** Most English generators phrase the instruction in English (`Which word is this?`, `Spell it:`, `means...`, `Put these in order:`). A 5-year-old who is learning the alphabet cannot read these. Per the scope correction, ALL instruction text must be Thai; only the tested English token stays English. English hint strings have the same problem.

## Per-node verdicts

Legend: PASS = meets all 5 rules · FAIL = breaks ≥1 rule · rules listed are the ones broken.

### Thai (14)
| node | verdict | broken rules / note |
|------|---------|---------------------|
| th_consonants_1 | PASS | complete & self-contained; picture (emoji) invisible in battle → S1 |
| th_consonants_2 | PASS | same as above (S1) |
| th_consonant_order | PASS | sequence UI has real tap affordance |
| th_vowels_short | **FAIL** | R1/R4 — choice variant `"กุ" ใช้สระอุใช่ไหม?` asks a yes/no question but offers 4 word choices with the answer word (`กุ`) already quoted in the prompt; incoherent |
| th_vowels_long | **FAIL** | R1/R4 — same broken choice variant as th_vowels_short |
| th_tones | PASS | `แตะคำที่แปลว่า 🐴` — emoji in prompt renders; coherent |
| th_cvc_words | PASS | emoji-in-prompt; could be larger (S1-adjacent) |
| th_common_words | PASS | as cvc |
| th_sentences_read | PASS | picture + choices / sequence affordance |
| th_reading_comprehension_1 | PASS | passage shown; complete |
| th_reading_comprehension_2 | PASS | complete |
| th_spelling_rules | PASS | complete; some choices are bare combining marks (minor) |
| th_grammar_basics | PASS | `"…" เรียงถูกไหม?` coherent |
| th_reading_comprehension_3 | PASS | complete |

### Math (15)
| node | verdict | broken rules / note |
|------|---------|---------------------|
| math_count_1_10 | **FAIL** | R1 (bare `(N)`), R2 (no objects) — **the exact reported bug** |
| math_count_11_20 | **FAIL** | R1/R2 — same bare `(N)` |
| math_compare_numbers | **FAIL** | R1 (no instruction verb — just `14 ___ 18`), R2 (abstract `>`/`<`/`=` for a K3 node instead of visible groups) |
| math_add_under_10 | **FAIL** | R2 — bare `2 + 1 = ?` for a P1 node with no visual objects (task: never bare below P1 difficulty 3) |
| math_sub_under_10 | **FAIL** | R2 — bare subtraction, no visual |
| math_add_under_20 | **FAIL** | R2 — bare arithmetic at low tier, no visual |
| math_sub_under_20 | **FAIL** | R2 — bare arithmetic at low tier, no visual |
| math_add_sub_under_100 | PASS | P2, numbers too large to render as objects; arithmetic complete |
| math_multiplication_2_5_10 | PASS | `5 × 3 = ?` complete |
| math_multiplication_full | PASS | complete |
| math_division_basic | PASS | complete |
| math_fractions_intro | PASS | complete Thai question |
| math_decimals_intro | PASS | complete |
| math_fractions_ops | PASS | complete |
| math_percent_intro | PASS | complete |
| (word-problem overlay) | PASS content | but decorative `emoji` invisible in battle → S1 |

### English (14)
| node | verdict | broken rules / note |
|------|---------|---------------------|
| eng_alphabet_recognition | **FAIL** | R1 (English instruction `Which letter is "Z"?` / `Tap the letter "j"`), R2 (no huge letter shown) |
| eng_alphabet_order | **FAIL** | R1 — English instruction `Put these in order: s, t, u` |
| eng_phonics_cvc | **FAIL** | R1 — `This is a picture of...` / `Spell it:` in English; emoji invisible in battle (S1) |
| eng_sight_words_1 | **FAIL** | R1 — `Which word is this?` / `Spell the word you hear` in English |
| eng_vocab_animals | **FAIL** | R1 — `🐢 means...` (English fragment, incomplete); emoji invisible in battle |
| eng_vocab_food | **FAIL** | R1 — same `means...` pattern |
| eng_vocab_family | **FAIL** | R1 — same |
| eng_vocab_school | **FAIL** | R1 — same |
| eng_sight_words_2 | **FAIL** | R1 — English instruction |
| eng_simple_sentences | **FAIL** | R1 — `Which sentence matches the picture?` / `Put the words in order:` in English |
| eng_questions_answers | **FAIL (partial)** | R1 support — English Q&A is the tested content, but there is zero Thai framing telling the child what to do |
| eng_reading_short_passages | **FAIL (partial)** | R1 support — English passage is the content; needs a Thai "read then answer" instruction |
| eng_grammar_present | **FAIL** | R1 — `It ___ school.` with no Thai instruction |
| eng_reading_comprehension | **FAIL (partial)** | R1 support — needs Thai framing line |

## Tally

- **Thai:** 2 FAIL / 12 PASS
- **Math:** 7 FAIL / 8 PASS
- **English:** 14 FAIL (11 full + 3 partial-support) / 0 PASS
- **Total: 23 nodes need fixes**, plus 4 systemic issues (S1–S4) affecting rendering across many more.

## Fix plan (implemented after this commit)

1. Add a `visual` field + a real large, wrapping render slot in battle Zone 2, PlacementQuest, and TeachingMoment (fixes S1/S2). Remove the per-choice emoji prepend in ChoiceButtons (S3).
2. `math_count_*`: emoji object rows from a themed pool with **correct Thai classifiers** (ลูก/ตัว/ดวง/ใบ/ดอก/ชิ้น/คัน) + `มี[ของ]กี่[ลักษณนาม]?`.
3. `math_compare_numbers`: two visible emoji groups + `ข้างไหนมีมากกว่า?`, tap-the-group (choice2).
4. `math_add/sub` (operands ≤10): show the objects (`🍎🍎🍎 ➕ 🍎🍎`) alongside the equation.
5. `th_vowels_short/long`: rewrite the broken choice variant to `คำนี้ใช้สระอะไร?` with the word shown large and vowel-**name** choices (answer no longer embedded in prompt).
6. English (S4): every instruction rewritten to child-Thai; letters/pictures shown large; only the tested English token stays English; English hint strings translated to Thai.
7. Route existing picture emojis into `visual` so they actually render (and larger).
