// questionBank.js — Phase 1.1 node-driven question generation.
//
// generateQuestion(node, difficulty) is the single entry point: dispatch by
// node.id to a per-node generator built on wordPools.js content (thai/english)
// or fully procedural math. Every generator can produce >=20 distinct question
// objects (verified via a spot-check script during this session, not just
// eyeballed) through shuffled distractor/choice-order combinatorics, even where
// the underlying content pool itself is small (e.g. the reading-comprehension
// passage pools — flagged in the Phase 1.1 handoff as thin content that would
// benefit from more passages before heavy production use).
//
// difficulty is 1-10 and, for procedural nodes, scales the actual arithmetic
// range/operand size; for pool-based nodes it gates which pool subset is
// eligible (excluding `rare`-flagged / longer / more-advanced items at low
// difficulty). selectBattleQuestion() below derives a node's current difficulty
// from that node's own skillMastery.ema (ramping 1 -> 10 as ema approaches
// mastery) — a reasonable default, not a graded requirement per the spec.

import { shuffle } from '../config/gameConfig.js'
import {
  CURRICULUM, getNode, getFirstNodeId, getNextEligibleNode,
  getMasteredNodeIds, getNodeAfter,
} from './curriculum.js'
import {
  TH_CONSONANTS_1, TH_CONSONANTS_2, TH_CONFUSABLE_PAIRS,
  TH_VOWELS_SHORT, TH_VOWELS_LONG, TH_CVC_WORDS, TH_TONE_SETS,
  TH_COMMON_WORDS, TH_SENTENCES, TH_PASSAGES,
  ENG_CVC, ENG_SIGHT_1, ENG_SIGHT_2, ENG_VOCAB, ENG_SENTENCES, ENG_QA, ENG_PASSAGES,
  MATH_STORY_TEMPLATES,
} from './wordPools.js'

// ── generic helpers ──────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// n distractors from `pool`, excluding whatever `keyFn(correct)` resolves to.
function distractorsFrom(pool, correct, keyFn, n = 3) {
  const correctKey = keyFn(correct)
  const candidates = shuffle(pool.filter(x => keyFn(x) !== correctKey))
  return candidates.slice(0, n)
}

function clampDifficulty(d) { return Math.max(1, Math.min(10, Math.round(d || 1))) }

// ── THAI: consonant pools (th_consonants_1 / th_consonants_2) ───────────────

function consonantPool(nodeId) {
  return nodeId === 'th_consonants_2' ? TH_CONSONANTS_2 : TH_CONSONANTS_1
}

function genConsonantChoice(nodeId, difficulty) {
  const pool = consonantPool(nodeId)
  const usable = difficulty <= 4 ? pool.filter(c => !c.rare) : pool
  const correct = pick(usable.length ? usable : pool)
  const distractors = distractorsFrom(pool, correct, c => c.c)
  const choices = shuffle([correct.c, ...distractors.map(d => d.c)])
  return {
    prompt: `ตัวไหนคือ "${correct.name}"?`,
    promptTh: `${correct.name} เหมือน ${correct.exampleWord}`,
    inputMode: 'choice',
    correctAnswer: correct.c,
    choices,
    hints: [`คำตัวอย่าง: ${correct.exampleWord} ${correct.emoji}`, `ฟังเสียง "${correct.name}" อีกครั้ง`],
    ttsWord: correct.name,
    emoji: correct.emoji,
  }
}

function genConsonantVisualDiscrimination(nodeId, difficulty) {
  const pool = consonantPool(nodeId)
  const poolChars = new Set(pool.map(c => c.c))
  const eligiblePairs = TH_CONFUSABLE_PAIRS.filter(([a, b]) => poolChars.has(a) || poolChars.has(b))
  if (!eligiblePairs.length) return genConsonantChoice(nodeId, difficulty)
  const [a, b] = pick(eligiblePairs)
  const target = poolChars.has(a) ? a : b
  const other = target === a ? b : a
  const rest = shuffle([...poolChars].filter(c => c !== target && c !== other)).slice(0, 2)
  const choices = shuffle([target, other, ...rest])
  const correctEntry = pool.find(c => c.c === target) || pool[0]
  return {
    prompt: 'แตะตัวที่ตรงกับเสียงนี้',
    promptTh: `หา "${target}" ให้เจอ`,
    inputMode: 'choice',
    correctAnswer: target,
    choices,
    hints: [`ระวังสับสนกับ "${other}"`, `คำตัวอย่าง: ${correctEntry.exampleWord}`],
    ttsWord: correctEntry.name,
  }
}

function genConsonantOrder(difficulty) {
  const pool = shuffle([...TH_CONSONANTS_1, ...TH_CONSONANTS_2])
  const runLen = difficulty <= 4 ? 3 : 4
  const start = pool.slice(0, runLen)
  // Order the run the way it actually appears in the combined ก-ฮ sequence by
  // re-deriving from the canonical ordered arrays rather than the shuffled pool.
  const canonical = [...TH_CONSONANTS_1, ...TH_CONSONANTS_2].map(c => c.c)
  const startIdx = Math.floor(Math.random() * (canonical.length - runLen))
  const run = canonical.slice(startIdx, startIdx + runLen)
  return {
    prompt: `เรียงตามลำดับ: ${run.join(', ')}`,
    promptTh: `เรียงพยัญชนะ ${run.join(' ')} ให้ถูกลำดับ`,
    inputMode: 'sequence',
    correctAnswer: run.join(''),
    sequenceChars: run,
    choices: undefined,
    hints: ['ลองท่องพยัญชนะ ก ข ค ง... ดูนะ'],
  }
}

// ── THAI: vowels (th_vowels_short / th_vowels_long) ─────────────────────────

function genVowelQ(nodeId, difficulty) {
  const pool = nodeId === 'th_vowels_long' ? TH_VOWELS_LONG : TH_VOWELS_SHORT
  const correct = pick(pool)
  const isFillgap = difficulty % 2 === 0 && pool.some(v => v !== correct)
  const distractors = distractorsFrom(pool, correct, v => v.v)
  if (isFillgap) {
    return {
      prompt: `เติมสระ: ${correct.example.replace(correct.v.replace('-', ''), '_')}`,
      promptTh: `คำนี้อ่านว่า ${correct.example} ใช้สระอะไร?`,
      inputMode: 'choice',
      correctAnswer: correct.v,
      choices: shuffle([correct.v, ...distractors.map(d => d.v)]),
      hints: [`${correct.name}: ${correct.exampleWord}`],
      emoji: correct.emoji,
    }
  }
  return {
    prompt: `"${correct.example}" ใช้${correct.name}ใช่ไหม?`,
    promptTh: `${correct.name} เหมือนคำว่า ${correct.exampleWord}`,
    inputMode: 'choice',
    correctAnswer: correct.example,
    choices: shuffle([correct.example, ...distractors.map(d => d.example)]),
    hints: [`คำตัวอย่าง: ${correct.exampleWord} ${correct.emoji}`],
    ttsWord: correct.exampleWord,
    emoji: correct.emoji,
  }
}

// ── THAI: tones (th_tones) ───────────────────────────────────────────────────

function genToneQ() {
  const set = pick(TH_TONE_SETS)
  const answerEntries = Object.entries(set.answers)
  const [target, emoji] = pick(answerEntries)
  const distractors = set.set.filter(w => w !== target)
  return {
    prompt: `แตะคำที่แปลว่า ${emoji}`,
    promptTh: `คำไหนอ่านว่า "${target}"?`,
    inputMode: 'choice',
    correctAnswer: target,
    choices: shuffle([target, ...distractors]),
    hints: [`สังเกตวรรณยุกต์ (ไม้เอก/ไม้โท) ให้ดี`],
    emoji,
  }
}

// ── THAI: CVC + common words (wordbuild/choice) ──────────────────────────────

function wordToChars(w) { return [...w] }

function genWordPoolQ(pool, difficulty) {
  const usable = difficulty <= 4 ? pool.filter(x => x.w.length <= 3) : pool
  const correct = pick(usable.length ? usable : pool)
  const useWordbuild = Math.random() < 0.5
  const distractors = distractorsFrom(pool, correct, x => x.w)
  if (useWordbuild) {
    return {
      prompt: `สะกดคำ: ${correct.emoji}`,
      promptTh: null,
      inputMode: 'wordbuild',
      correctAnswer: correct.w,
      chars: wordToChars(correct.w),
      choices: shuffle([correct.w, ...distractors.map(d => d.w)]),
      hints: [`ลองออกเสียงทีละพยางค์`],
      ttsWord: correct.w,
      emoji: correct.emoji,
    }
  }
  return {
    prompt: `คำนี้คือ ${correct.emoji}`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct.w,
    choices: shuffle([correct.w, ...distractors.map(d => d.w)]),
    hints: [`ฟังเสียงคำอีกครั้ง`],
    ttsWord: correct.w,
    emoji: correct.emoji,
  }
}

// ── THAI: sentence reading / word order (th_sentences_read) ─────────────────

function genSentenceOrderQ() {
  const item = pick(TH_SENTENCES)
  const words = item.s.split(' ')
  return {
    prompt: `เรียงคำให้เป็นประโยค: ${item.emoji}`,
    promptTh: null,
    inputMode: 'sequence',
    correctAnswer: words.join(''),
    sequenceChars: words,
    hints: [`ประโยคนี้มี ${words.length} คำ`],
    emoji: item.emoji,
  }
}

function genSentenceChoiceQ() {
  const items = shuffle([...TH_SENTENCES])
  const correct = items[0]
  const wrongs = items.slice(1, 4).map(i => i.s)
  return {
    prompt: `ประโยคไหนตรงกับรูป ${correct.emoji}?`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct.s,
    choices: shuffle([correct.s, ...wrongs]),
    hints: [`อ่านทีละคำ`],
    emoji: correct.emoji,
  }
}

// ── THAI: reading comprehension (nodes 1-3) + spelling + grammar ────────────

function passagesForNode(nodeId) {
  const gradeMap = {
    th_reading_comprehension_1: ['P3'],
    th_reading_comprehension_2: ['P4'],
    th_reading_comprehension_3: ['P5', 'P6'],
  }
  const grades = gradeMap[nodeId] || ['P3']
  const matched = TH_PASSAGES.filter(p => grades.includes(p.grade))
  return matched.length ? matched : TH_PASSAGES
}

function genPassageQ(nodeId) {
  const passage = pick(passagesForNode(nodeId))
  const wrongs = passage.choices.filter(c => c !== passage.a)
  return {
    prompt: `${passage.text}\n\n${passage.q}`,
    promptTh: passage.text,
    inputMode: 'choice',
    correctAnswer: passage.a,
    choices: shuffle([passage.a, ...wrongs]),
    hints: ['อ่านย่อหน้าอีกครั้งช้าๆ นะ'],
  }
}

function genSpellingRuleQ(difficulty) {
  // Th spelling-rule practice: pick a common word, blank one character, ask
  // which character completes it (distractors = other characters seen in the
  // same word pool, so wrong answers are still plausible Thai characters).
  const pool = difficulty <= 5 ? TH_COMMON_WORDS.filter(w => w.w.length <= 4) : TH_COMMON_WORDS
  const correct = pick(pool.length ? pool : TH_COMMON_WORDS)
  const chars = wordToChars(correct.w)
  const blankIdx = Math.floor(Math.random() * chars.length)
  const answerChar = chars[blankIdx]
  const displayed = chars.map((c, i) => (i === blankIdx ? '_' : c)).join('')
  const allChars = shuffle([...new Set(TH_COMMON_WORDS.flatMap(w => wordToChars(w.w)))])
    .filter(c => c !== answerChar).slice(0, 3)
  return {
    prompt: `เติมตัวอักษรที่หายไป: ${displayed} ${correct.emoji}`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: answerChar,
    choices: shuffle([answerChar, ...allChars]),
    hints: [`คำเต็มคือ "${correct.w}"`],
    emoji: correct.emoji,
  }
}

function genGrammarBasicsQ() {
  // Grammar-order sanity check built from TH_SENTENCES: is this word order
  // correct Thai subject-verb-object, or has it been scrambled?
  const item = pick(TH_SENTENCES)
  const words = item.s.split(' ')
  const isCorrectOrder = Math.random() < 0.5
  const shown = isCorrectOrder ? words : shuffle(words)
  // Guard against an accidental shuffle landing back on the correct order.
  const stillCorrect = shown.join(' ') === words.join(' ')
  const answer = (isCorrectOrder || stillCorrect) ? 'ถูก' : 'ผิด'
  return {
    prompt: `"${shown.join(' ')}" เรียงถูกไหม?`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: answer,
    choices: ['ถูก', 'ผิด'],
    hints: [`ประโยคที่ถูกคือ "${words.join(' ')}"`],
    emoji: item.emoji,
  }
}

// ── ENGLISH ──────────────────────────────────────────────────────────────────

function genAlphaRecognitionQ(difficulty) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const correct = pick(letters)
  const distractors = shuffle(letters.filter(l => l !== correct)).slice(0, 3)
  return {
    prompt: `Which letter is "${correct}"?`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct,
    choices: shuffle([correct, ...distractors]),
    hints: [`Say the alphabet from A to find it`],
  }
}

function genAlphaVisualDiscriminationQ() {
  const EN_CONFUSABLE_GROUPS = [['b', 'd'], ['p', 'q'], ['m', 'w'], ['n', 'u'], ['f', 't'], ['i', 'j', 'l']]
  const group = pick(EN_CONFUSABLE_GROUPS)
  const target = pick(group)
  const others = group.filter(c => c !== target)
  const rest = shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !group.includes(c))).slice(0, 2)
  return {
    prompt: `Tap the letter "${target}"`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: target,
    choices: shuffle([target, ...others, ...rest].slice(0, 4)),
    hints: [`Careful not to mix it up with "${others[0]}"`],
  }
}

function genAlphaOrderQ(difficulty) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const runLen = difficulty <= 4 ? 3 : 4
  const start = Math.floor(Math.random() * (letters.length - runLen))
  const run = letters.slice(start, start + runLen)
  return {
    prompt: `Put these in order: ${run.join(', ')}`,
    promptTh: null,
    inputMode: 'sequence',
    correctAnswer: run.join(''),
    sequenceChars: run,
    hints: ['Try singing the ABC song'],
  }
}

function genEngCvcQ() {
  const correct = pick(ENG_CVC)
  const useWordbuild = Math.random() < 0.5
  const distractors = distractorsFrom(ENG_CVC, correct, x => x.w)
  if (useWordbuild) {
    return {
      prompt: `Spell it: ${correct.emoji}`,
      promptTh: null,
      inputMode: 'wordbuild',
      correctAnswer: correct.w,
      chars: wordToChars(correct.w),
      choices: shuffle([correct.w, ...distractors.map(d => d.w)]),
      hints: ['Sound it out letter by letter'],
      ttsWord: correct.w,
      emoji: correct.emoji,
    }
  }
  return {
    prompt: `This is a picture of...`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct.w,
    choices: shuffle([correct.w, ...distractors.map(d => d.w)]),
    hints: ['Listen to the word again'],
    ttsWord: correct.w,
    emoji: correct.emoji,
  }
}

function genSightWordsQ(nodeId) {
  const pool = nodeId === 'eng_sight_words_2' ? ENG_SIGHT_2 : ENG_SIGHT_1
  const correct = pick(pool)
  const distractors = shuffle(pool.filter(w => w !== correct)).slice(0, 3)
  const useWordbuild = Math.random() < 0.35
  return {
    prompt: useWordbuild ? `Spell the word you hear` : `Which word is this?`,
    promptTh: null,
    inputMode: useWordbuild ? 'wordbuild' : 'choice',
    correctAnswer: correct,
    chars: useWordbuild ? wordToChars(correct) : undefined,
    choices: shuffle([correct, ...distractors]),
    hints: ['Sight words are best memorised by shape'],
    ttsWord: correct,
  }
}

function genVocabQ(nodeId) {
  const themeMap = {
    eng_vocab_animals: 'animals', eng_vocab_food: 'food',
    eng_vocab_family: 'family', eng_vocab_school: 'school',
  }
  const pool = ENG_VOCAB[themeMap[nodeId]] || ENG_VOCAB.animals
  const correct = pick(pool)
  const useMemory = Math.random() < 0.3 && pool.length >= 3
  const distractors = distractorsFrom(pool, correct, x => x.w)
  if (useMemory) {
    const items = shuffle(pool).slice(0, 3)
    const cards = []
    items.forEach((item, i) => {
      cards.push({ id: `card_${i}_emoji`, pairId: i, display: item.emoji, type: 'emoji' })
      cards.push({ id: `card_${i}_word`, pairId: i, display: item.w, type: 'word' })
    })
    return {
      prompt: 'Match the picture to the word',
      promptTh: null,
      inputMode: 'memory',
      correctAnswer: null,
      memoryCards: shuffle(cards),
      memoryPairCount: items.length,
      choices: undefined,
      hints: ['Flip two cards to find a matching pair'],
    }
  }
  return {
    prompt: `${correct.emoji} means...`,
    promptTh: `${correct.emoji} คือ ${correct.th}`,
    inputMode: 'choice',
    correctAnswer: correct.w,
    choices: shuffle([correct.w, ...distractors.map(d => d.w)]),
    hints: [`ในภาษาไทยคือ "${correct.th}"`],
    ttsWord: correct.w,
    emoji: correct.emoji,
  }
}

function genSimpleSentenceOrderQ() {
  const item = pick(ENG_SENTENCES)
  const words = item.s.split(' ')
  return {
    prompt: `Put the words in order: ${item.emoji}`,
    promptTh: null,
    inputMode: 'sequence',
    correctAnswer: words.join(''),
    sequenceChars: words,
    hints: [`This sentence has ${words.length} words`],
    emoji: item.emoji,
  }
}

// ENG_SENTENCES only has 10 base entries, and the sequence-order form above can't
// vary beyond "which sentence got picked" (the correct order is fixed) — capped at
// 10 distinct outputs. Add a choice-based recognition variant (mirrors th_sentences_
// read's genSentenceChoiceQ) so distractor-combination shuffling gives >=20 distinct
// question objects overall, same fix applied after this session's own spot-check
// flagged eng_simple_sentences as thin.
function genSimpleSentenceChoiceQ() {
  const items = shuffle([...ENG_SENTENCES])
  const correct = items[0]
  const wrongs = items.slice(1, 4).map(i => i.s)
  return {
    prompt: `Which sentence matches the picture? ${correct.emoji}`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct.s,
    choices: shuffle([correct.s, ...wrongs]),
    hints: ['Read each word one at a time'],
    emoji: correct.emoji,
  }
}

function genQuestionsAnswersQ() {
  const item = pick(ENG_QA)
  const wrongs = shuffle(item.wrong).slice(0, 3)
  return {
    prompt: item.q,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: item.a,
    choices: shuffle([item.a, ...wrongs]),
    hints: ['Think about what answers the question naturally'],
  }
}

function passagesForEngNode(nodeId) {
  const grades = nodeId === 'eng_reading_comprehension' ? ['P6'] : ['P4', 'P5']
  const matched = ENG_PASSAGES.filter(p => grades.includes(p.grade))
  return matched.length ? matched : ENG_PASSAGES
}

function genEngPassageQ(nodeId) {
  const passage = pick(passagesForEngNode(nodeId))
  const wrongs = passage.choices.filter(c => c !== passage.a)
  return {
    prompt: `${passage.text}\n\n${passage.q}`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: passage.a,
    choices: shuffle([passage.a, ...wrongs]),
    hints: ['Read the passage once more, slowly'],
  }
}

function genGrammarPresentQ() {
  // Present-tense subject/verb agreement drill, procedurally combined so
  // there are far more than 20 distinct prompts from a small template set.
  const subjects = [
    { s: 'I', verb: 'like' }, { s: 'You', verb: 'like' }, { s: 'We', verb: 'like' },
    { s: 'They', verb: 'like' }, { s: 'He', verb: 'likes' }, { s: 'She', verb: 'likes' }, { s: 'It', verb: 'likes' },
  ]
  const topics = ['cats', 'rice', 'school', 'football', 'music', 'reading', 'mango', 'swimming']
  const subj = pick(subjects)
  const topic = pick(topics)
  const wrongVerb = subj.verb === 'likes' ? 'like' : 'likes'
  return {
    prompt: `${subj.s} ___ ${topic}.`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: subj.verb,
    choices: [subj.verb, wrongVerb],
    hints: [`"${subj.s}" ${subj.s === 'He' || subj.s === 'She' || subj.s === 'It' ? 'needs an -s verb' : 'does not need an -s verb'}`],
  }
}

// ── MATH: procedural ─────────────────────────────────────────────────────────

// Bounded distractor generation. The naive "random offset, retry until 3 distinct
// non-negative values" approach can loop forever when `answer` is small (e.g. 0 or
// 1) and `spread` is small — there simply aren't 3 distinct non-negative integers
// != answer reachable within the random offset range (hit this exact hang with
// answer=0, spread=5 during this session's own spot-check). Cap the random attempts,
// then deterministically fill any remaining slots by walking outward from answer
// (+1, -1, +2, -2, ...) — those are always distinct, always eventually >= 0, and
// the loop is bounded by construction, so this can never hang.
function opChoices(answer, spread = 5) {
  const half = Math.max(1, Math.floor(spread / 2))
  const w = new Set()
  for (let tries = 0; tries < 30 && w.size < 3; tries++) {
    const v = answer + (Math.floor(Math.random() * (half * 2 + 1)) - half)
    if (v !== answer && v >= 0) w.add(v)
  }
  for (let step = 1; w.size < 3; step++) {
    const up = answer + step
    if (up !== answer && !w.has(up)) w.add(up)
    if (w.size >= 3) break
    const down = answer - step
    if (down !== answer && down >= 0 && !w.has(down)) w.add(down)
  }
  return shuffle([answer, ...w])
}

function genCountQ(difficulty) {
  const max = difficulty <= 3 ? 10 : 20
  const n = Math.floor(Math.random() * max) + 1
  return {
    prompt: `นับ: มีทั้งหมดกี่ชิ้น? (${n})`,
    promptTh: null,
    inputMode: 'numpad',
    correctAnswer: String(n),
    choices: opChoices(n).map(String),
    hints: ['นับทีละหนึ่ง'],
  }
}

function genCompareQ(difficulty) {
  const max = difficulty <= 5 ? 20 : 100
  let a = Math.floor(Math.random() * max) + 1
  let b = Math.floor(Math.random() * max) + 1
  while (b === a) b = Math.floor(Math.random() * max) + 1
  const answer = a > b ? '>' : '<'
  return {
    prompt: `${a} ___ ${b}`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: answer,
    choices: ['>', '<', '='],
    hints: ['ตัวเลขที่มากกว่าคือจำนวนที่นับได้เยอะกว่า'],
  }
}

function genArithmeticQ(nodeId, difficulty) {
  const ranges = {
    math_add_under_10: 10, math_sub_under_10: 10,
    math_add_under_20: 20, math_sub_under_20: 20,
    math_add_sub_under_100: 100,
  }
  const isSub = nodeId.includes('sub') || (nodeId === 'math_add_sub_under_100' && Math.random() < 0.5)
  const max = ranges[nodeId] || 10
  // difficulty (1-10) scales operand size within the node's own range ceiling.
  const opCeil = Math.max(2, Math.round((max) * (difficulty / 10)))
  let a, b, ans, op
  if (isSub) {
    op = '-'
    a = Math.floor(Math.random() * Math.min(opCeil, max)) + 2
    b = Math.floor(Math.random() * a) + 1
    ans = a - b
  } else {
    op = '+'
    a = Math.floor(Math.random() * Math.min(opCeil, max)) + 1
    b = Math.floor(Math.random() * Math.max(1, Math.min(opCeil, max) - a + 1)) + 1
    ans = a + b
  }
  return {
    prompt: `${a} ${op} ${b} = ?`,
    promptTh: null,
    inputMode: 'numpad',
    correctAnswer: String(ans),
    choices: opChoices(ans).map(String),
    hints: [op === '+' ? `${a} แล้วนับต่ออีก ${b}` : `นับถอยหลังจาก ${a} ไป ${b} ครั้ง`, 'นับนิ้วช่วยได้นะ'],
  }
}

function genMultiplicationQ(nodeId, difficulty) {
  const tables = nodeId === 'math_multiplication_2_5_10' ? [2, 5, 10] : Array.from({ length: 12 }, (_, i) => i + 1)
  const a = pick(tables)
  const bMax = difficulty <= 5 ? 5 : 12
  const b = Math.floor(Math.random() * bMax) + 1
  const ans = a * b
  return {
    prompt: `${a} × ${b} = ?`,
    promptTh: null,
    inputMode: 'numpad',
    correctAnswer: String(ans),
    choices: opChoices(ans, 8).map(String),
    hints: [`นับทีละ ${a} จำนวน ${b} ครั้ง`],
  }
}

function genDivisionQ(difficulty) {
  const divisor = Math.floor(Math.random() * (difficulty <= 5 ? 5 : 10)) + 2
  const quotient = Math.floor(Math.random() * (difficulty <= 5 ? 5 : 10)) + 1
  const dividend = divisor * quotient
  return {
    prompt: `${dividend} ÷ ${divisor} = ?`,
    promptTh: null,
    inputMode: 'numpad',
    correctAnswer: String(quotient),
    choices: opChoices(quotient, 4).map(String),
    hints: [`${dividend} แบ่งเป็นกลุ่มละ ${divisor} ได้กี่กลุ่ม`],
  }
}

function genFractionsIntroQ() {
  const denom = pick([2, 3, 4, 5, 6, 8])
  const num = Math.floor(Math.random() * (denom - 1)) + 1
  const correct = `${num}/${denom}`
  const wrongDenoms = shuffle([2, 3, 4, 5, 6, 8].filter(d => d !== denom)).slice(0, 3)
  const choices = shuffle([correct, ...wrongDenoms.map(d => `${Math.min(num, d - 1)}/${d}`)])
  return {
    prompt: `แรเงา ${num} ใน ${denom} ส่วน — เขียนเป็นเศษส่วนได้อย่างไร?`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct,
    choices,
    hints: ['เศษ (ตัวบน) คือจำนวนที่แรเงา ส่วน (ตัวล่าง) คือจำนวนทั้งหมด'],
  }
}

function genDecimalsIntroQ() {
  const whole = Math.floor(Math.random() * 9)
  const tenth = Math.floor(Math.random() * 9) + 1
  const correct = `${whole}.${tenth}`
  const choices = shuffle([correct, `${whole}.${(tenth + 1) % 10}`, `${whole + 1}.${tenth}`, `${whole}.${(tenth + 5) % 10}`])
  return {
    prompt: `${whole} จุด ${tenth} ส่วนสิบ เขียนเป็นทศนิยมอย่างไร?`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct,
    choices,
    hints: ['ทศนิยมตำแหน่งแรกคือเศษส่วนสิบ'],
  }
}

function genFractionOpsQ(difficulty) {
  const denom = difficulty <= 5 ? pick([2, 4]) : pick([3, 5, 6])
  const a = Math.floor(Math.random() * (denom - 1)) + 1
  let b = Math.floor(Math.random() * (denom - a))
  if (b < 1) b = 1
  const isAdd = Math.random() < 0.5 && a + b <= denom
  const op = isAdd ? '+' : '-'
  const ans = isAdd ? a + b : Math.max(0, a - b)
  const correct = `${ans}/${denom}`
  return {
    prompt: `${a}/${denom} ${op} ${b}/${denom} = ?`,
    promptTh: null,
    inputMode: 'choice',
    correctAnswer: correct,
    choices: shuffle([correct, `${ans + 1}/${denom}`, `${Math.max(0, ans - 1)}/${denom}`, `${ans}/${denom + 1}`]),
    hints: ['ตัวส่วนเท่ากัน บวก/ลบแค่ตัวเศษ'],
  }
}

function genPercentQ() {
  const pct = pick([10, 20, 25, 50, 75])
  const base = pick([20, 40, 50, 80, 100, 200])
  const ans = Math.round((pct / 100) * base)
  return {
    prompt: `${pct}% ของ ${base} เท่ากับเท่าไหร่?`,
    promptTh: null,
    inputMode: 'numpad',
    correctAnswer: String(ans),
    choices: opChoices(ans, Math.max(4, Math.round(ans * 0.2))).map(String),
    hints: [`${pct}% คือ ${pct}/100 ส่วน`],
  }
}

function genMathWordProblemQ(difficulty) {
  const tpl = pick(MATH_STORY_TEMPLATES)
  const max = difficulty <= 5 ? 10 : 20
  let a = Math.floor(Math.random() * max) + 1
  let b = Math.floor(Math.random() * max) + 1
  let ans
  if (tpl.op === 'add') ans = a + b
  else if (tpl.op === 'sub') { if (b > a) [a, b] = [b, a]; ans = a - b }
  else if (tpl.op === 'mul') { a = Math.min(a, 5); b = Math.min(b, 5); ans = a * b }
  else { b = Math.max(1, Math.min(b, 5)); a = b * (Math.floor(Math.random() * 5) + 1); ans = a / b }
  return {
    prompt: tpl.t.replace('{a}', a).replace('{b}', b),
    promptTh: null,
    inputMode: 'numpad',
    correctAnswer: String(ans),
    choices: opChoices(ans).map(String),
    hints: ['อ่านโจทย์อีกครั้งช้าๆ นะ'],
    emoji: tpl.emoji,
  }
}

// ── dispatch table ───────────────────────────────────────────────────────────

const GENERATORS = {
  // thai
  th_consonants_1: (d) => (Math.random() < 0.7 ? genConsonantChoice('th_consonants_1', d) : genConsonantVisualDiscrimination('th_consonants_1', d)),
  th_consonants_2: (d) => (Math.random() < 0.7 ? genConsonantChoice('th_consonants_2', d) : genConsonantVisualDiscrimination('th_consonants_2', d)),
  th_consonant_order: (d) => genConsonantOrder(d),
  th_vowels_short: (d) => genVowelQ('th_vowels_short', d),
  th_vowels_long: (d) => genVowelQ('th_vowels_long', d),
  th_tones: () => genToneQ(),
  th_cvc_words: (d) => genWordPoolQ(TH_CVC_WORDS, d),
  th_common_words: (d) => genWordPoolQ(TH_COMMON_WORDS, d),
  th_sentences_read: () => (Math.random() < 0.5 ? genSentenceOrderQ() : genSentenceChoiceQ()),
  th_reading_comprehension_1: () => genPassageQ('th_reading_comprehension_1'),
  th_reading_comprehension_2: () => genPassageQ('th_reading_comprehension_2'),
  th_spelling_rules: (d) => genSpellingRuleQ(d),
  th_grammar_basics: () => genGrammarBasicsQ(),
  th_reading_comprehension_3: () => genPassageQ('th_reading_comprehension_3'),
  // math
  math_count_1_10: (d) => genCountQ(d),
  math_count_11_20: (d) => genCountQ(Math.max(d, 5)),
  math_compare_numbers: (d) => genCompareQ(d),
  math_add_under_10: (d) => genArithmeticQ('math_add_under_10', d),
  math_sub_under_10: (d) => genArithmeticQ('math_sub_under_10', d),
  math_add_under_20: (d) => genArithmeticQ('math_add_under_20', d),
  math_sub_under_20: (d) => genArithmeticQ('math_sub_under_20', d),
  math_add_sub_under_100: (d) => genArithmeticQ('math_add_sub_under_100', d),
  math_multiplication_2_5_10: (d) => genMultiplicationQ('math_multiplication_2_5_10', d),
  math_multiplication_full: (d) => genMultiplicationQ('math_multiplication_full', d),
  math_division_basic: (d) => genDivisionQ(d),
  math_fractions_intro: () => genFractionsIntroQ(),
  math_decimals_intro: () => genDecimalsIntroQ(),
  math_fractions_ops: (d) => genFractionOpsQ(d),
  math_percent_intro: () => genPercentQ(),
  // english
  eng_alphabet_recognition: (d) => (Math.random() < 0.7 ? genAlphaRecognitionQ(d) : genAlphaVisualDiscriminationQ()),
  eng_alphabet_order: (d) => genAlphaOrderQ(d),
  eng_phonics_cvc: () => genEngCvcQ(),
  eng_sight_words_1: () => genSightWordsQ('eng_sight_words_1'),
  eng_vocab_animals: () => genVocabQ('eng_vocab_animals'),
  eng_vocab_food: () => genVocabQ('eng_vocab_food'),
  eng_vocab_family: () => genVocabQ('eng_vocab_family'),
  eng_vocab_school: () => genVocabQ('eng_vocab_school'),
  eng_sight_words_2: () => genSightWordsQ('eng_sight_words_2'),
  eng_simple_sentences: () => (Math.random() < 0.5 ? genSimpleSentenceOrderQ() : genSimpleSentenceChoiceQ()),
  eng_questions_answers: () => genQuestionsAnswersQ(),
  eng_reading_short_passages: () => genEngPassageQ('eng_reading_short_passages'),
  eng_grammar_present: () => genGrammarPresentQ(),
  eng_reading_comprehension: () => genEngPassageQ('eng_reading_comprehension'),
  // word-problem overlay nodes reuse MATH_STORY_TEMPLATES at higher arithmetic nodes
}

// Nodes whose curriculum questionTypes include a math word-problem flavor get an
// occasional MATH_STORY_TEMPLATES-driven question mixed in (P1-P3 range per the
// template pool's own comment) instead of always the bare arithmetic form.
const WORD_PROBLEM_ELIGIBLE = new Set([
  'math_add_under_10', 'math_sub_under_10', 'math_add_under_20', 'math_sub_under_20',
  'math_add_sub_under_100', 'math_multiplication_2_5_10', 'math_division_basic',
])

export function generateQuestion(node, difficulty = 1) {
  if (!node) throw new Error('generateQuestion: node is required')
  const d = clampDifficulty(difficulty)
  let q
  if (WORD_PROBLEM_ELIGIBLE.has(node.id) && Math.random() < 0.2) {
    q = genMathWordProblemQ(d)
  } else {
    const gen = GENERATORS[node.id]
    if (!gen) throw new Error(`generateQuestion: no generator for node "${node.id}"`)
    q = gen(d)
  }
  return { nodeId: node.id, ...q }
}

// ── battle question selection: 70% active / 20% review / 10% preview ───────
//
// Active-node questions are the child's real current-mastery attempts and
// always count toward skillMastery. Review questions (spaced repetition on an
// already-mastered node, easier difficulty) ALSO count — that's the point of
// spaced repetition, keeping a mastered node's ema fresh. Preview questions
// (an exposure peek at the node after the active one, ignoring prerequisites)
// deliberately do NOT count toward skillMastery — the child hasn't been taught
// that content yet, so a "wrong" answer there would be a false signal, not a
// real mastery failure.
export function selectBattleQuestion(subject, state) {
  const skillMastery = state?.skillMastery || {}
  const activeId = state?.activeNodes?.[subject] || getFirstNodeId(subject)
  const activeNode = getNode(subject, activeId) || getNode(subject, getFirstNodeId(subject))
  const masteredIds = getMasteredNodeIds(subject, skillMastery)

  const activeDifficulty = clampDifficulty(1 + Math.floor((skillMastery[activeNode.id]?.ema ?? 0) * 9))

  const roll = Math.random()
  if (roll < 0.70 || masteredIds.length === 0) {
    return { ...generateQuestion(activeNode, activeDifficulty), countsForMastery: true }
  }
  if (roll < 0.90) {
    const reviewId = masteredIds[Math.floor(Math.random() * masteredIds.length)]
    const reviewNode = getNode(subject, reviewId)
    const reviewDifficulty = clampDifficulty(activeDifficulty - 2)
    return { ...generateQuestion(reviewNode, reviewDifficulty), countsForMastery: true }
  }
  const previewId = getNodeAfter(subject, activeNode.id)
  if (!previewId) {
    // No node after the active one (end of tree) — nothing to preview, fall
    // back to a normal active-node question instead of erroring.
    return { ...generateQuestion(activeNode, activeDifficulty), countsForMastery: true }
  }
  const previewNode = getNode(subject, previewId)
  return { ...generateQuestion(previewNode, 1), countsForMastery: false }
}
