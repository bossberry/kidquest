// teachingMoments.js — Phase 1.3 "Adaptive Engine v2 — Teaching Moments".
//
// Two independent halves, both pure (no React/JSX) so both are directly
// testable under Node's built-in test runner — unlike Phase 1.1's mastery
// bookkeeping (which stayed inline in StateContext.jsx and could only be
// verified by manual trace, since that file can't be imported by `node
// --test`). This session deliberately extracted the trigger logic here
// instead, matching the questionBank.js/placementTest.js precedent of keeping
// pure logic out of JSX files.
//
//   1. TEACHING_TEMPLATES + getTeachingTemplate() — the ~12 explanation
//      templates the UI (TeachingMoment.jsx) renders.
//   2. recordMissForTeaching() / clearTeaching() — the miss-streak trigger
//      logic StateContext.jsx's LOG_BATTLE_ANSWER case calls into.

import {
  TH_CONFUSABLE_PAIRS, TH_CONSONANTS_1, TH_CONSONANTS_2,
  TH_VOWELS_SHORT, TH_VOWELS_LONG, TH_CVC_WORDS, TH_TONE_SETS, ENG_CVC,
} from './wordPools.js'

export const MISS_STREAK_THRESHOLD = 3
export const MAX_EXPLANATION_LOOPS = 2

// ── Templates (data only — TeachingMoment.jsx does the actual rendering) ────
//
// `visual` selects which animated-explanation renderer the UI uses. Each
// template's example content is a FIXED, illustrative one (not the specific
// question the child just missed) — simpler and deterministic, and the
// spec's own quoted example ("3... แล้วนับต่อ 4, 5, 6, 7!") is itself just an
// illustrative demo, not tied to a specific failed question either.
//
// 12 templates total: the 5 explicitly-named categories from the spec (math
// add, math sub, consonant confusion, vowel length, CVC blending / english
// phonics) plus 6 more covering the rest of the curriculum's "most missed"
// shape (count, multiplication, division, tones, alphabet), plus one generic
// fallback so every one of the 43 curriculum nodes has SOME applicable
// teaching content, not just the curated ones.
export const TEACHING_TEMPLATES = [
  {
    id: 'math_count', matchNodeIds: ['math_count_1_10', 'math_count_11_20'],
    visual: 'counting_objects', emoji: '🍎',
    headline: 'มานับด้วยกันนะ!',
    explainTh: 'ชี้ไปทีละชิ้น แล้วนับ หนึ่ง สอง สาม ไปเรื่อยๆ นะ',
    example: { items: 5, label: 'มีแอปเปิล 5 ลูก' },
  },
  {
    id: 'math_add', matchNodeIds: ['math_add_under_10', 'math_add_under_20', 'math_add_sub_under_100'],
    visual: 'counting_up', emoji: '➕',
    headline: 'บวกเลข ลองนับนิ้วดูนะ!',
    explainTh: '3 แล้วนับต่ออีก 4... 4, 5, 6, 7! ได้ 7',
    example: { a: 3, b: 4, answer: 7 },
  },
  {
    id: 'math_sub', matchNodeIds: ['math_sub_under_10', 'math_sub_under_20'],
    visual: 'counting_down', emoji: '➖',
    headline: 'ลบเลข ลองนับถอยหลังดูนะ!',
    explainTh: '7 แล้วนับถอยลง 3 ครั้ง... 6, 5, 4! ได้ 4',
    example: { a: 7, b: 3, answer: 4 },
  },
  {
    id: 'math_multiplication', matchNodeIds: ['math_multiplication_2_5_10', 'math_multiplication_full'],
    visual: 'skip_counting', emoji: '✖️',
    headline: 'คูณ คือการนับกลุ่มที่เท่ากัน!',
    explainTh: '2 คูณ 3 คือ นับทีละ 2 จำนวน 3 ครั้ง... 2, 4, 6! ได้ 6',
    example: { groupSize: 2, groupCount: 3, answer: 6 },
  },
  {
    id: 'math_division', matchNodeIds: ['math_division_basic'],
    visual: 'sharing_groups', emoji: '➗',
    headline: 'หาร คือการแบ่งเท่าๆ กัน!',
    explainTh: 'มี 6 ชิ้น แบ่งเป็น 2 กลุ่มเท่าๆ กัน กลุ่มละ 3 ชิ้น',
    example: { total: 6, groups: 2, perGroup: 3 },
  },
  {
    id: 'th_consonant_confusion', matchNodeIds: ['th_consonants_1', 'th_consonants_2', 'th_consonant_order'],
    visual: 'confusable_pair', emoji: '🔤',
    headline: 'ตัวนี้หน้าตาคล้ายกันนะ สังเกตดีๆ!',
    explainTh: buildConfusionExplainTh(),
    example: buildConfusionExample(),
  },
  {
    id: 'th_vowel_length', matchNodeIds: ['th_vowels_short', 'th_vowels_long'],
    visual: 'vowel_length', emoji: '🔊',
    headline: 'สระเสียงสั้น กับ สระเสียงยาว ฟังต่างกันนะ!',
    explainTh: `"${TH_VOWELS_SHORT[3].example}" (สั้น) ฟังเร็ว — "${TH_VOWELS_LONG[3].example}" (ยาว) ฟังยาวกว่า`,
    example: { short: TH_VOWELS_SHORT[3], long: TH_VOWELS_LONG[3] },
  },
  {
    id: 'th_tone', matchNodeIds: ['th_tones'],
    visual: 'tone_contrast', emoji: '🎵',
    headline: 'วรรณยุกต์เปลี่ยนความหมายได้นะ!',
    explainTh: `"${TH_TONE_SETS[0].set[0]}" ไม่มีวรรณยุกต์ — "${TH_TONE_SETS[0].set[2]}" มีไม้โท เสียงต่างกัน!`,
    example: { set: TH_TONE_SETS[0] },
  },
  {
    id: 'th_cvc_blending', matchNodeIds: ['th_cvc_words'],
    visual: 'cvc_blend', emoji: '🔡',
    headline: 'ลองสะกดทีละตัวแล้วผสมเสียงนะ!',
    explainTh: `${[...TH_CVC_WORDS[0].w].join(' - ')} ... ผสมกันเป็น "${TH_CVC_WORDS[0].w}" ${TH_CVC_WORDS[0].emoji}`,
    example: TH_CVC_WORDS[0],
  },
  {
    id: 'eng_alphabet', matchNodeIds: ['eng_alphabet_recognition', 'eng_alphabet_order'],
    visual: 'letter_reveal', emoji: '🔠',
    headline: "Let's look at the letter closely!",
    explainTh: 'สังเกตรูปร่างตัวอักษรให้ดีนะ',
    example: { letter: 'A' },
  },
  {
    id: 'eng_phonics_cvc', matchNodeIds: ['eng_phonics_cvc'],
    visual: 'phonics_sequence', emoji: '🔡',
    headline: 'Sound it out letter by letter!',
    explainTh: `${ENG_CVC[0].w.split('').join(' - ')} ... blend together: "${ENG_CVC[0].w}" ${ENG_CVC[0].emoji}`,
    example: ENG_CVC[0],
  },
  {
    id: 'generic_fallback', matchNodeIds: null, // catch-all — matches whatever no other template claims
    visual: 'generic', emoji: '💡',
    headline: 'ไม่เป็นไรนะ ลองสังเกตดีๆ อีกครั้ง!',
    explainTh: 'ค่อยๆ อ่านโจทย์อีกครั้ง แล้วลองตอบดูนะ เก่งแน่นอน!',
    example: null,
  },
]

function buildConfusionExplainTh() {
  const [a, b] = TH_CONFUSABLE_PAIRS.find(([x, y]) => x === 'ผ' || y === 'ผ') || TH_CONFUSABLE_PAIRS[0]
  return `"${a}" กับ "${b}" หน้าตาคล้ายกัน แต่เป็นคนละตัวนะ ลองดูให้ดีๆ`
}
function buildConfusionExample() {
  const pair = TH_CONFUSABLE_PAIRS.find(([x, y]) => x === 'ผ' || y === 'ผ') || TH_CONFUSABLE_PAIRS[0]
  const findEntry = (c) => TH_CONSONANTS_1.find(e => e.c === c) || TH_CONSONANTS_2.find(e => e.c === c)
  return { pair, entries: pair.map(findEntry).filter(Boolean) }
}

export function getTeachingTemplate(nodeId) {
  const specific = TEACHING_TEMPLATES.find(t => t.matchNodeIds?.includes(nodeId))
  return specific || TEACHING_TEMPLATES.find(t => t.id === 'generic_fallback')
}

// ── Pure miss-streak trigger logic ──────────────────────────────────────────
//
// Tracked per (nodeId + questionType) pair, where questionType = the
// question's real inputMode (choice/numpad/wordbuild/sequence/memory) — the
// most concrete, already-available signal for "the same kind of question,"
// without needing new plumbing through questionBank.js to tag a separate
// conceptual category.
function streakKey(nodeId, questionType) { return `${nodeId}:${questionType}` }

// Called from LOG_BATTLE_ANSWER for every real (non-preview) battle answer.
// A correct answer clears that node+type's streak. 3 consecutive misses (and
// no teaching moment already pending — never queue a second one on top of an
// active one) sets pendingTeaching. Returns fresh { missStreaks, pendingTeaching }.
export function recordMissForTeaching(missStreaks, pendingTeaching, nodeId, questionType, correct) {
  if (!nodeId || !questionType) return { missStreaks, pendingTeaching: pendingTeaching ?? null }
  const key = streakKey(nodeId, questionType)
  if (correct) {
    if (!missStreaks?.[key]) return { missStreaks: missStreaks || {}, pendingTeaching: pendingTeaching ?? null }
    const next = { ...missStreaks }
    delete next[key]
    return { missStreaks: next, pendingTeaching: pendingTeaching ?? null }
  }
  const newStreak = (missStreaks?.[key] ?? 0) + 1
  const nextMissStreaks = { ...(missStreaks || {}), [key]: newStreak }
  let nextPendingTeaching = pendingTeaching ?? null
  if (newStreak >= MISS_STREAK_THRESHOLD && !nextPendingTeaching) {
    nextPendingTeaching = { nodeId, questionType }
  }
  return { missStreaks: nextMissStreaks, pendingTeaching: nextPendingTeaching }
}

// Called when TeachingMoment.jsx finishes (correct practice answer, or hit
// the MAX_EXPLANATION_LOOPS cap). Clears pendingTeaching AND resets that
// node+type's streak to 0 — this is what guarantees a teaching moment can
// never show twice in a row for the same node: it needs a FRESH run of 3
// misses to fire again, not a stale streak still sitting at >=3.
export function clearTeaching(missStreaks, pendingTeaching) {
  if (!pendingTeaching) return { missStreaks: missStreaks || {} }
  const key = streakKey(pendingTeaching.nodeId, pendingTeaching.questionType)
  const next = { ...(missStreaks || {}) }
  delete next[key]
  return { missStreaks: next }
}
