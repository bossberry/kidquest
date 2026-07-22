// src/wordfactory/data.js — "โรงงานประกอบคำ" (Word Factory)
// Pure data module, no React, no dependency on the main app's state/curriculum.
// Deliberately isolated from src/lib/curriculum.js / questionBank.js / wordPools.js —
// this mini-game teaches consonant+vowel BLENDING specifically, a different skill
// from the main app's whole-question battle system.
//
// v1 scope (per spec's own "ขอบเขตเวอร์ชันแรก"): only Level 1 (สระอา, 6 words)
// is wired into the game. LEVEL_2/3/4 data below is written now (per the spec's
// "ข้อมูลคำ" instruction to make future additions easy) but NOT yet exposed via
// LEVELS — a future session can add them by extending LEVELS with no data changes.

// Spoken form of a lone consonant (how you'd say the letter's name+อ sound).
export const CONSONANT_SOUND = {
  'ก': 'กอ', 'ม': 'มอ', 'น': 'นอ', 'ต': 'ตอ', 'ป': 'ปอ', 'ล': 'ลอ',
}

// Spoken form of a lone vowel mark.
export const VOWEL_SOUND = {
  'า': 'อา', 'ิ': 'อิ', 'ี': 'อี', 'ุ': 'อุ', 'ู': 'อู',
}

// Thai combining vowel marks (ิ ี ุ ู) render correctly in normal text flow
// when placed right after their consonant character — no manual positioning
// needed, the font handles it. า is a regular following character. So display
// composition is always just consonant + vowel, uniformly.
export function composeWord(consonant, vowel) {
  return consonant + vowel
}

// ิ ี ุ ู are Unicode COMBINING marks — rendered alone (no base consonant, e.g.
// as a distractor choice tile or a not-yet-combined slot) they float with no
// visible anchor and read as a stray mark, not a letter. A generic dotted-
// circle placeholder (U+25CC) isn't in the Thai font used here (renders as a
// tofu box), so instead this uses the same fix Thai teaching materials use:
// pair the mark with อ (the conventional zero-consonant/vowel-carrier letter,
// e.g. อา/อิ/อี/อุ/อู — literally how these vowels are named/written alone).
// Never use this when composing the real word (composeWord above) — only for
// standalone display of a single vowel character.
const COMBINING_VOWELS = new Set(['ิ', 'ี', 'ุ', 'ู'])
export function vowelGlyph(v) {
  return COMBINING_VOWELS.has(v) ? 'อ' + v : v
}

// WORDS — id, consonant, vowel, displayWord, phoneticSteps, finalSound,
// imageKey, difficultyLevel — matches the spec's example shape exactly.
// `emoji` is a CLEARLY-PLACEHOLDER illustration (no real art asset pipeline
// yet — see HANDOFF notes). `meaningTh` is shown as a caption once a word is
// solved. Words with `soundPractice: true` have no strong standalone meaning
// (they exist to demonstrate the vowel-swap pattern honestly, matching Thai
// "แจกลูก" teaching practice) — those get a generic "ฝึกออกเสียง" caption/icon
// instead of a fabricated picture-word mapping.
export const WORDS = {
  ka1:   { id: 'ka1',   consonant: 'ก', vowel: 'า', displayWord: 'กา',
           phoneticSteps: ['กอ', 'อา', 'กา'], finalSound: 'กา',
           imageKey: 'crow', emoji: '🐦', meaningTh: 'อีกา', difficultyLevel: 1 },
  ma1:   { id: 'ma1',   consonant: 'ม', vowel: 'า', displayWord: 'มา',
           phoneticSteps: ['มอ', 'อา', 'มา'], finalSound: 'มา',
           imageKey: 'come', emoji: '🚶', meaningTh: 'เดินมา', difficultyLevel: 1 },
  na1:   { id: 'na1',   consonant: 'น', vowel: 'า', displayWord: 'นา',
           phoneticSteps: ['นอ', 'อา', 'นา'], finalSound: 'นา',
           imageKey: 'ricefield', emoji: '🌾', meaningTh: 'ท้องนา', difficultyLevel: 1 },
  ta1:   { id: 'ta1',   consonant: 'ต', vowel: 'า', displayWord: 'ตา',
           phoneticSteps: ['ตอ', 'อา', 'ตา'], finalSound: 'ตา',
           imageKey: 'eye', emoji: '👁️', meaningTh: 'ดวงตา', difficultyLevel: 1 },
  pa1:   { id: 'pa1',   consonant: 'ป', vowel: 'า', displayWord: 'ปา',
           phoneticSteps: ['ปอ', 'อา', 'ปา'], finalSound: 'ปา',
           imageKey: 'throw', emoji: '🤾', meaningTh: 'ปาลูกบอล', difficultyLevel: 1 },
  la1:   { id: 'la1',   consonant: 'ล', vowel: 'า', displayWord: 'ลา',
           phoneticSteps: ['ลอ', 'อา', 'ลา'], finalSound: 'ลา',
           imageKey: 'donkey', emoji: '🫏', meaningTh: 'ลา (สัตว์)', difficultyLevel: 1 },

  // Level 2 data (not yet wired into LEVELS — see file header).
  mi2:   { id: 'mi2',   consonant: 'ม', vowel: 'ิ', displayWord: 'มิ',
           phoneticSteps: ['มอ', 'อิ', 'มิ'], finalSound: 'มิ',
           imageKey: null, emoji: '🔤', soundPractice: true, difficultyLevel: 2 },
  mee2:  { id: 'mee2',  consonant: 'ม', vowel: 'ี', displayWord: 'มี',
           phoneticSteps: ['มอ', 'อี', 'มี'], finalSound: 'มี',
           imageKey: 'have', emoji: '🧸', meaningTh: 'มีของเล่น', difficultyLevel: 2 },
  mu2:   { id: 'mu2',   consonant: 'ม', vowel: 'ุ', displayWord: 'มุ',
           phoneticSteps: ['มอ', 'อุ', 'มุ'], finalSound: 'มุ',
           imageKey: null, emoji: '🔤', soundPractice: true, difficultyLevel: 2 },
  moo2:  { id: 'moo2',  consonant: 'ม', vowel: 'ู', displayWord: 'มู',
           phoneticSteps: ['มอ', 'อู', 'มู'], finalSound: 'มู',
           imageKey: null, emoji: '🔤', soundPractice: true, difficultyLevel: 2 },
}

// Level 1 — สระอา. The only level wired into the live game this version.
export const LEVEL_1_WORD_IDS = ['ka1', 'ma1', 'na1', 'ta1', 'pa1', 'la1']

// Future levels' data, written now per the spec's "easy to add later"
// instruction, not yet consumed by WordFactoryScreen.jsx.
export const LEVEL_2_WORD_IDS = ['ma1', 'mi2', 'mee2', 'mu2', 'moo2']

export const SWAP_PAIRS = [
  { id: 'sw1', fromId: 'ma1', toId: 'ka1', changedPart: 'consonant' },
  { id: 'sw2', fromId: 'ma1', toId: 'mee2', changedPart: 'vowel' },
  { id: 'sw3', fromId: 'ta1', toId: 'pa1', changedPart: 'consonant' },
  { id: 'sw4', fromId: 'na1', toId: 'la1', changedPart: 'consonant' },
  { id: 'sw5', fromId: 'mee2', toId: 'ma1', changedPart: 'vowel' },
  { id: 'sw6', fromId: 'ka1', toId: 'la1', changedPart: 'consonant' },
]

// Full pools used for picking wrong-choice distractors.
export const ALL_CONSONANTS = ['ก', 'ม', 'น', 'ต', 'ป', 'ล']
export const ALL_VOWELS = ['า', 'ิ', 'ี', 'ุ', 'ู']

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
export function pickChoices(correct, pool, n = 3) {
  const others = shuffle(pool.filter(v => v !== correct)).slice(0, n - 1)
  return shuffle([correct, ...others])
}
