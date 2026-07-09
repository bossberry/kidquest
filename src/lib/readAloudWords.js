// readAloudWords.js — Phase 1.4 word/sentence pools for the "อ่านให้ไข่ฟัง"
// (ReadAloud) minigame. Pulls directly from wordPools.js content per node —
// NOT from questionBank.js's generateQuestion(), since quiz questions carry
// UI-mode-specific shapes (sequence tiles, numpad answers, memory-card pairs)
// that don't map cleanly onto "here is a word/sentence, say it out loud."
// This only ever needs thai/eng subjects — math has no spoken-word content,
// matching the spec's own scope ("word/short sentence from the child's
// current thai or english node pool").

import {
  TH_CONSONANTS_1, TH_CONSONANTS_2, TH_VOWELS_SHORT, TH_VOWELS_LONG,
  TH_CVC_WORDS, TH_COMMON_WORDS, TH_SENTENCES, TH_TONE_SETS,
  ENG_CVC, ENG_SIGHT_1, ENG_SIGHT_2, ENG_VOCAB, ENG_SENTENCES,
} from './wordPools.js'

function fromConsonants(pool) { return pool.map(e => ({ text: e.exampleWord, emoji: e.emoji })) }
function fromVowels(pool) { return pool.map(v => ({ text: v.exampleWord, emoji: v.emoji })) }
function fromWordPool(pool) { return pool.map(w => ({ text: w.w, emoji: w.emoji })) }

// Node id -> pool of { text, emoji }. Nodes with no clean single-word/
// sentence source (reading-comprehension passages, spelling-rule/grammar
// nodes) intentionally fall through to the generic subject fallback below —
// a full passage isn't a "read aloud one word/sentence" activity.
function poolForNode(nodeId) {
  switch (nodeId) {
    case 'th_consonants_1': return fromConsonants(TH_CONSONANTS_1)
    case 'th_consonants_2': return fromConsonants(TH_CONSONANTS_2)
    case 'th_consonant_order': return fromConsonants([...TH_CONSONANTS_1, ...TH_CONSONANTS_2])
    case 'th_vowels_short': return fromVowels(TH_VOWELS_SHORT)
    case 'th_vowels_long': return fromVowels(TH_VOWELS_LONG)
    case 'th_tones': return TH_TONE_SETS.flatMap(t => Object.entries(t.answers).map(([text, emoji]) => ({ text, emoji })))
    case 'th_cvc_words': return fromWordPool(TH_CVC_WORDS)
    case 'th_common_words': return fromWordPool(TH_COMMON_WORDS)
    case 'th_sentences_read': return TH_SENTENCES.map(s => ({ text: s.s, emoji: s.emoji }))

    case 'eng_alphabet_recognition': return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => ({ text: l, emoji: '🔤' }))
    case 'eng_alphabet_order': return 'abcdefghijklmnopqrstuvwxyz'.split('').map(l => ({ text: l, emoji: '🔤' }))
    case 'eng_phonics_cvc': return fromWordPool(ENG_CVC)
    case 'eng_sight_words_1': return ENG_SIGHT_1.map(w => ({ text: w, emoji: '🔤' }))
    case 'eng_sight_words_2': return ENG_SIGHT_2.map(w => ({ text: w, emoji: '🔤' }))
    case 'eng_vocab_animals': return fromWordPool(ENG_VOCAB.animals)
    case 'eng_vocab_food': return fromWordPool(ENG_VOCAB.food)
    case 'eng_vocab_family': return fromWordPool(ENG_VOCAB.family)
    case 'eng_vocab_school': return fromWordPool(ENG_VOCAB.school)
    case 'eng_simple_sentences': return ENG_SENTENCES.map(s => ({ text: s.s, emoji: s.emoji }))
    default: return null
  }
}

const FALLBACK_TH = fromWordPool(TH_COMMON_WORDS)
const FALLBACK_ENG = ENG_SIGHT_1.map(w => ({ text: w, emoji: '🔤' }))

export function getReadAloudPool(subject, nodeId) {
  const pool = poolForNode(nodeId)
  if (pool && pool.length) return pool
  return subject === 'eng' ? FALLBACK_ENG : FALLBACK_TH
}

// Picks `count` words for one round, shuffled, wrapping the pool if it's
// smaller than `count` (some node pools, e.g. th_tones, are quite small).
export function pickReadAloudWords(subject, nodeId, count = 5) {
  const pool = getReadAloudPool(subject, nodeId)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const picked = []
  for (let i = 0; i < count; i++) picked.push(shuffled[i % shuffled.length])
  return picked
}
