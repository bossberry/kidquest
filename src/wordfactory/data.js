// src/wordfactory/data.js — "โรงงานประกอบคำ" (Word Factory)
// Pure data module, no React, no dependency on the main app's state/curriculum.
// Deliberately isolated from src/lib/curriculum.js / questionBank.js / wordPools.js —
// this mini-game teaches consonant+vowel BLENDING specifically, a different skill
// from the main app's whole-question battle system.
//
// Two difficulty pools, both live in the game (2026-07-22 update, per real
// playtesting — the single-vowel-only version had gotten too easy):
//   EASY_WORD_IDS — single/leading vowels (า ิ ี ุ ู เ แ โ)
//   HARD_WORD_IDS — compound vowels (ัว, เ-ีย, เ-ือ) — unlockable immediately,
//     not gated behind easy, since the whole point is to drill the exact
//     thing the child is still stuck on.

// Spoken form of a lone consonant (how you'd say the letter's name+อ sound).
// Not consumed at runtime (phoneticSteps are hand-authored per word below) —
// kept as the requested "sound mapping" reference data, and for hand-writing
// new phoneticSteps consistently when adding words later.
export const CONSONANT_SOUND = {
  'ก': 'กอ', 'ม': 'มอ', 'น': 'นอ', 'ต': 'ตอ', 'ป': 'ปอ', 'ล': 'ลอ',
  'ห': 'หอ', 'ว': 'วอ', 'บ': 'บอ', 'ส': 'สอ', 'ร': 'รอ',
}

// Vowel positioning metadata — the single source of truth for how a vowel's
// character(s) sit relative to the consonant. `before`/`after` are the exact
// substrings placed immediately before/after the consonant when composing a
// real word (composeWord below). This is what lets single (า ิ ี ุ ู),
// leading (เ แ โ), wrap-after (ัว), and true split-around (เ-ีย/เ-ือ) vowels
// all compose correctly through one function instead of one-off position
// guessing per character.
export const VOWEL_DEFS = {
  'า':    { type: 'single',   before: '', after: 'า' },
  'ิ':    { type: 'single',   before: '', after: 'ิ' },
  'ี':    { type: 'single',   before: '', after: 'ี' },
  'ุ':    { type: 'single',   before: '', after: 'ุ' },
  'ู':    { type: 'single',   before: '', after: 'ู' },
  'เ':    { type: 'single',   before: 'เ', after: '' },
  'แ':    { type: 'single',   before: 'แ', after: '' },
  'โ':    { type: 'single',   before: 'โ', after: '' },
  // Compound vowels — one written sound made of 2 pieces, taught as ONE
  // piece (see WordFactoryScreen.jsx: the child taps a single vowel tile for
  // these, never 2 separate taps). ัว wraps AFTER the consonant only (ั
  // combines above, ว trails) — เ-ีย/เ-ือ genuinely wrap both sides.
  'ัว':   { type: 'compound', before: '', after: 'ัว' },
  'เ-ีย': { type: 'compound', before: 'เ', after: 'ีย' },
  'เ-ือ': { type: 'compound', before: 'เ', after: 'ือ' },
}

// Compose the real word string from a consonant + vowel key. Correct for
// every vowel shape above (single-after, single-before/leading, compound
// wrap-after, compound split-around) through the same before/after fields —
// no per-vowel-type branching needed here.
export function composeWord(consonant, vowelKey) {
  const def = VOWEL_DEFS[vowelKey]
  if (!def) return consonant + vowelKey
  return def.before + consonant + def.after
}

// How the assembly stage should lay out slots for a given vowel, left to
// right, matching real Thai script order:
//   'trailing' — [consonant, vowel]           (า ิ ี ุ ู, ัว)
//   'leading'  — [vowel, consonant]            (เ แ โ)
//   'split'    — [vowelFront, consonant, vowelBack]  (เ-ีย, เ-ือ)
export function getVowelLayout(vowelKey) {
  const def = VOWEL_DEFS[vowelKey]
  if (!def) return 'trailing'
  if (def.before && def.after) return 'split'
  if (def.before) return 'leading'
  return 'trailing'
}

// The vowel's piece(s) in reading order — 1 element for single/leading/wrap
// vowels, 2 for true split-around compounds. Matches the spec's requested
// `vowelParts` field shape exactly.
export function getVowelParts(vowelKey) {
  const def = VOWEL_DEFS[vowelKey]
  if (!def) return [vowelKey]
  return [def.before, def.after].filter(Boolean)
}

// ั ิ ี ึ ื ุ ู are Unicode COMBINING marks — shown alone (no base consonant,
// e.g. a distractor choice tile, or one half of a split-compound slot before
// the consonant is attached) they float with no visible anchor. Standard fix
// (same one Thai vowel-naming charts use): pair with อ, the conventional
// zero-consonant/vowel-carrier letter — อา/อิ/อี/อุ/อู/เอ/แอ/โอ/อัว/เอีย/เอือ
// are literally how these vowels are named/written alone. A first attempt
// using the generic U+25CC dotted-circle placeholder rendered as a tofu box
// (not in the Sarabun font used here) — confirmed live in Chrome before
// switching to this อ-based fix.
const NEEDS_ANCHOR = new Set(['ั', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู'])
function anchorIfNeeded(fragment) {
  return fragment && NEEDS_ANCHOR.has(fragment[0]) ? 'อ' + fragment : fragment
}
// Whole-vowel standalone display (choice tiles, non-split slots) — always
// safe since composeWord always produces a complete, correctly-anchored string.
export function vowelGlyph(vowelKey) {
  return composeWord('อ', vowelKey)
}
// One piece of a split-compound vowel, safe to show alone in its own slot.
export function vowelPartGlyph(fragment) {
  return anchorIfNeeded(fragment)
}

// WORDS — id, consonant, vowel, vowelType, vowelParts, displayWord,
// phoneticSteps, finalSound, imageKey, difficultyLevel — matches the spec's
// requested shape. `emoji` is a CLEARLY-PLACEHOLDER illustration (no real art
// asset pipeline yet). `meaningTh` is the caption shown once solved. Words
// with `soundPractice: true` have no strong standalone meaning for a 5-6
// year old (some real Thai CV syllables genuinely don't — honest labeling
// per the spec's "don't fabricate a meaning" instruction) — those get a
// generic "ฝึกออกเสียง" caption instead.
function mkWord({ id, consonant, vowelKey, phoneticSteps, imageKey = null, emoji, meaningTh, difficultyLevel, soundPractice = false }) {
  const def = VOWEL_DEFS[vowelKey]
  const displayWord = composeWord(consonant, vowelKey)
  return {
    id, consonant, vowel: vowelKey,
    vowelType: def.type,               // 'single' | 'compound' — the spec's requested field
    vowelParts: getVowelParts(vowelKey), // the spec's requested field
    displayWord,
    phoneticSteps,
    finalSound: displayWord,
    imageKey, emoji, meaningTh, difficultyLevel,
    ...(soundPractice ? { soundPractice: true } : {}),
  }
}

export const WORDS = {
  // ── ด่าน 1: สระอา ──
  ka1:  mkWord({ id: 'ka1', consonant: 'ก', vowelKey: 'า', phoneticSteps: ['กอ', 'อา', 'กา'], imageKey: 'crow', emoji: '🐦', meaningTh: 'อีกา', difficultyLevel: 1 }),
  ma1:  mkWord({ id: 'ma1', consonant: 'ม', vowelKey: 'า', phoneticSteps: ['มอ', 'อา', 'มา'], imageKey: 'come', emoji: '🚶', meaningTh: 'เดินมา', difficultyLevel: 1 }),
  na1:  mkWord({ id: 'na1', consonant: 'น', vowelKey: 'า', phoneticSteps: ['นอ', 'อา', 'นา'], imageKey: 'ricefield', emoji: '🌾', meaningTh: 'ท้องนา', difficultyLevel: 1 }),
  ta1:  mkWord({ id: 'ta1', consonant: 'ต', vowelKey: 'า', phoneticSteps: ['ตอ', 'อา', 'ตา'], imageKey: 'eye', emoji: '👁️', meaningTh: 'ดวงตา', difficultyLevel: 1 }),
  pa1:  mkWord({ id: 'pa1', consonant: 'ป', vowelKey: 'า', phoneticSteps: ['ปอ', 'อา', 'ปา'], imageKey: 'throw', emoji: '🤾', meaningTh: 'ปาลูกบอล', difficultyLevel: 1 }),
  la1:  mkWord({ id: 'la1', consonant: 'ล', vowelKey: 'า', phoneticSteps: ['ลอ', 'อา', 'ลา'], imageKey: 'donkey', emoji: '🫏', meaningTh: 'ลา (สัตว์)', difficultyLevel: 1 }),

  // ── ด่าน 2: เปลี่ยนสระ (ิ ี ุ ู เ แ โ) ──
  mi2:  mkWord({ id: 'mi2', consonant: 'ม', vowelKey: 'ิ', phoneticSteps: ['มอ', 'อิ', 'มิ'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),
  mee2: mkWord({ id: 'mee2', consonant: 'ม', vowelKey: 'ี', phoneticSteps: ['มอ', 'อี', 'มี'], imageKey: 'have', emoji: '🧸', meaningTh: 'มีของเล่น', difficultyLevel: 2 }),
  mu2:  mkWord({ id: 'mu2', consonant: 'ม', vowelKey: 'ุ', phoneticSteps: ['มอ', 'อุ', 'มุ'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),
  moo2: mkWord({ id: 'moo2', consonant: 'ม', vowelKey: 'ู', phoneticSteps: ['มอ', 'อู', 'มู'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),
  tee2: mkWord({ id: 'tee2', consonant: 'ต', vowelKey: 'ี', phoneticSteps: ['ตอ', 'อี', 'ตี'], imageKey: 'hit', emoji: '🥁', meaningTh: 'ตีกลอง', difficultyLevel: 2 }),
  pee2: mkWord({ id: 'pee2', consonant: 'ป', vowelKey: 'ี', phoneticSteps: ['ปอ', 'อี', 'ปี'], imageKey: 'year', emoji: '📅', meaningTh: 'ปีใหม่', difficultyLevel: 2 }),
  poo2: mkWord({ id: 'poo2', consonant: 'ป', vowelKey: 'ู', phoneticSteps: ['ปอ', 'อู', 'ปู'], imageKey: 'crab', emoji: '🦀', meaningTh: 'ปู (สัตว์)', difficultyLevel: 2 }),
  pi2:  mkWord({ id: 'pi2', consonant: 'ป', vowelKey: 'ิ', phoneticSteps: ['ปอ', 'อิ', 'ปิ'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),
  tu2:  mkWord({ id: 'tu2', consonant: 'ต', vowelKey: 'ุ', phoneticSteps: ['ตอ', 'อุ', 'ตุ'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),
  ke2:  mkWord({ id: 'ke2', consonant: 'ก', vowelKey: 'เ', phoneticSteps: ['กอ', 'เอ', 'เก'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),
  too2: mkWord({ id: 'too2', consonant: 'ต', vowelKey: 'โ', phoneticSteps: ['ตอ', 'โอ', 'โต'], imageKey: 'big', emoji: '🐘', meaningTh: 'โตขึ้น (ตัวใหญ่)', difficultyLevel: 2 }),
  kae2: mkWord({ id: 'kae2', consonant: 'ก', vowelKey: 'แ', phoneticSteps: ['กอ', 'แอ', 'แก'], emoji: '🔤', difficultyLevel: 2, soundPractice: true }),

  // ── (โหมดยาก) ด่าน 5: สระอัว ──
  tua5: mkWord({ id: 'tua5', consonant: 'ต', vowelKey: 'ัว', phoneticSteps: ['ตอ', 'อัว', 'ตัว'], imageKey: 'body', emoji: '🧍', meaningTh: 'ตัว (ร่างกาย)', difficultyLevel: 5 }),
  hua5: mkWord({ id: 'hua5', consonant: 'ห', vowelKey: 'ัว', phoneticSteps: ['หอ', 'อัว', 'หัว'], imageKey: 'head', emoji: '🗣️', meaningTh: 'หัว (ศีรษะ)', difficultyLevel: 5 }),
  mua5: mkWord({ id: 'mua5', consonant: 'ม', vowelKey: 'ัว', phoneticSteps: ['มอ', 'อัว', 'มัว'], imageKey: 'blurry', emoji: '🌫️', meaningTh: 'มัว (มองไม่ชัด)', difficultyLevel: 5 }),
  wua5: mkWord({ id: 'wua5', consonant: 'ว', vowelKey: 'ัว', phoneticSteps: ['วอ', 'อัว', 'วัว'], imageKey: 'cow', emoji: '🐄', meaningTh: 'วัว (สัตว์)', difficultyLevel: 5 }),
  bua5: mkWord({ id: 'bua5', consonant: 'บ', vowelKey: 'ัว', phoneticSteps: ['บอ', 'อัว', 'บัว'], imageKey: 'lotus', emoji: '🪷', meaningTh: 'บัว (ดอกไม้)', difficultyLevel: 5 }),

  // ── (โหมดยาก) ด่าน 6: สระเอีย ──
  sia6: mkWord({ id: 'sia6', consonant: 'ส', vowelKey: 'เ-ีย', phoneticSteps: ['สอ', 'เอีย', 'เสีย'], imageKey: 'lose', emoji: '💔', meaningTh: 'ของเสีย (พัง)', difficultyLevel: 6 }),
  mia6: mkWord({ id: 'mia6', consonant: 'ม', vowelKey: 'เ-ีย', phoneticSteps: ['มอ', 'เอีย', 'เมีย'], imageKey: 'spouse', emoji: '💑', meaningTh: 'เมีย (คู่สมรส)', difficultyLevel: 6 }),
  pia6: mkWord({ id: 'pia6', consonant: 'ป', vowelKey: 'เ-ีย', phoneticSteps: ['ปอ', 'เอีย', 'เปีย'], imageKey: 'braid', emoji: '💇‍♀️', meaningTh: 'เปีย (ผมถัก)', difficultyLevel: 6 }),

  // ── (โหมดยาก) ด่าน 7: สระเอือ ──
  suea7: mkWord({ id: 'suea7', consonant: 'ส', vowelKey: 'เ-ือ', phoneticSteps: ['สอ', 'เอือ', 'เสือ'], imageKey: 'tiger', emoji: '🐯', meaningTh: 'เสือ (สัตว์)', difficultyLevel: 7 }),
  ruea7: mkWord({ id: 'ruea7', consonant: 'ร', vowelKey: 'เ-ือ', phoneticSteps: ['รอ', 'เอือ', 'เรือ'], imageKey: 'boat', emoji: '⛵', meaningTh: 'เรือ (พาหนะ)', difficultyLevel: 7 }),
}

// ── Easy pool: single/leading vowels only (ด่าน 1-2's real content) ──
export const LEVEL_1_WORD_IDS = ['ka1', 'ma1', 'na1', 'ta1', 'pa1', 'la1']
export const LEVEL_2_WORD_IDS = ['mi2', 'mee2', 'mu2', 'moo2', 'tee2', 'pee2', 'poo2', 'pi2', 'tu2', 'ke2', 'too2', 'kae2']
export const EASY_WORD_IDS = [...LEVEL_1_WORD_IDS, ...LEVEL_2_WORD_IDS]

// ── Hard pool: compound vowels (ัว / เ-ีย / เ-ือ) — unlocked immediately,
// not gated behind the easy pool (per direct playtesting feedback: the point
// is to drill exactly what the child is stuck on, not re-prove สระเดี่ยว). ──
export const LEVEL_5_WORD_IDS = ['tua5', 'hua5', 'mua5', 'wua5', 'bua5']
export const LEVEL_6_WORD_IDS = ['sia6', 'mia6', 'pia6']
export const LEVEL_7_WORD_IDS = ['suea7', 'ruea7']
export const HARD_WORD_IDS = [...LEVEL_5_WORD_IDS, ...LEVEL_6_WORD_IDS, ...LEVEL_7_WORD_IDS]

// Swap-mode data (§ด่าน4 "เปลี่ยนเพียงชิ้นเดียว") — written for a future
// session per the "easy to add later" instruction, not yet wired into any UI.
export const SWAP_PAIRS = [
  { id: 'sw1', fromId: 'ma1', toId: 'ka1', changedPart: 'consonant' },
  { id: 'sw2', fromId: 'ma1', toId: 'mee2', changedPart: 'vowel' },
  { id: 'sw3', fromId: 'ta1', toId: 'pa1', changedPart: 'consonant' },
  { id: 'sw4', fromId: 'na1', toId: 'la1', changedPart: 'consonant' },
  { id: 'sw5', fromId: 'mee2', toId: 'ma1', changedPart: 'vowel' },
  { id: 'sw6', fromId: 'ka1', toId: 'la1', changedPart: 'consonant' },
]

// Distractor pools — kept separate per difficulty so easy mode never shows a
// never-before-seen hard-only consonant/compound vowel as a decoy, and vice
// versa.
export const ALL_CONSONANTS = ['ก', 'ม', 'น', 'ต', 'ป', 'ล']
export const ALL_CONSONANTS_HARD = [...ALL_CONSONANTS, 'ห', 'ว', 'บ', 'ส', 'ร']
export const SINGLE_VOWEL_KEYS = ['า', 'ิ', 'ี', 'ุ', 'ู', 'เ', 'แ', 'โ']
export const COMPOUND_VOWEL_KEYS = ['ัว', 'เ-ีย', 'เ-ือ']

export const ROUNDS_PER_SESSION = 5
export const MAX_REQUEUE_PER_WORD = 2

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Correct value + (n-1) distinct distractors from pool, shuffled together.
// If the pool (minus the correct value) has fewer than n-1 members — always
// true for COMPOUND_VOWEL_KEYS, which only has 3 entries total — this simply
// returns every available option, which is fine (still within the spec's
// "2-4 choices" range).
export function pickChoices(correct, pool, n = 3) {
  const others = shuffle(pool.filter(v => v !== correct)).slice(0, n - 1)
  return shuffle([correct, ...others])
}
