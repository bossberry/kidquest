// curriculum.js — Phase 1.1 skill-node tree (43 nodes: 14 thai + 15 math + 14 english).
//
// `questionTypes` values are drawn from the 7 question-INTERACTION categories this
// codebase's battle UI actually supports today (grepped from MoveSelectBattleMode.jsx /
// WorldBattle.jsx before writing this — the original spec draft said "7 input modes"
// but only 5 distinct `inputMode` STRINGS actually exist: choice, numpad, wordbuild,
// sequence, memory. The other 2 of the "7" are UI-level question CATEGORIES that render
// through the plain 'choice' inputMode with different framing — 'fillgap' (missing-letter
// gap fill) and 'visual_discrimination' (confusable-pair spotting), matching the existing
// genFillGapQ/genVisualDiscriminationQ pattern). questionBank.js maps each conceptual type
// to its real inputMode string when building a question object:
//   choice → 'choice', fillgap → 'choice', visual_discrimination → 'choice',
//   sequencing → 'sequence', memory → 'memory', wordbuild → 'wordbuild', numpad → 'numpad'
//
// `standard` is a reference label for parent-facing reports (Phase 2) — approximated
// against สพฐ. ท/ค/ต numbering where the exact sub-code isn't load-bearing here.

function nodes(subjectPrefix, defs) {
  return defs.map(d => ({
    masteryThreshold: 0.8,
    ...d,
  }))
}

export const CURRICULUM = {
  thai: {
    nodes: nodes('th', [
      { id: 'th_consonants_1', nameTh: 'พยัญชนะ ก-ฮ ชุดที่ 1 (ก-ณ)', grade: 'K2', standard: 'ท 1.1',
        prerequisites: [], questionTypes: ['choice', 'visual_discrimination'], difficulty: 1 },
      { id: 'th_consonants_2', nameTh: 'พยัญชนะ ก-ฮ ชุดที่ 2 (ด-ฮ)', grade: 'K2', standard: 'ท 1.1',
        prerequisites: ['th_consonants_1'], questionTypes: ['choice', 'visual_discrimination'], difficulty: 1 },
      { id: 'th_consonant_order', nameTh: 'เรียงลำดับพยัญชนะ', grade: 'K3', standard: 'ท 1.1',
        prerequisites: ['th_consonants_2'], questionTypes: ['sequencing', 'choice'], difficulty: 2 },
      { id: 'th_vowels_short', nameTh: 'สระเสียงสั้น', grade: 'K3', standard: 'ท 1.1',
        prerequisites: ['th_consonant_order'], questionTypes: ['choice', 'fillgap'], difficulty: 2 },
      { id: 'th_vowels_long', nameTh: 'สระเสียงยาว', grade: 'P1', standard: 'ท 1.1',
        prerequisites: ['th_vowels_short'], questionTypes: ['choice', 'fillgap'], difficulty: 3 },
      { id: 'th_tones', nameTh: 'วรรณยุกต์', grade: 'P1', standard: 'ท 1.1',
        prerequisites: ['th_vowels_long'], questionTypes: ['choice', 'memory'], difficulty: 3 },
      { id: 'th_cvc_words', nameTh: 'คำแม่ ก กา (สะกดตรงตัว)', grade: 'P1', standard: 'ท 1.1',
        prerequisites: ['th_tones'], questionTypes: ['wordbuild', 'choice'], difficulty: 3 },
      { id: 'th_common_words', nameTh: 'คำศัพท์พื้นฐาน ป.2', grade: 'P2', standard: 'ท 1.1',
        prerequisites: ['th_cvc_words'], questionTypes: ['wordbuild', 'choice', 'memory'], difficulty: 4 },
      { id: 'th_sentences_read', nameTh: 'อ่านและเรียงประโยค', grade: 'P2', standard: 'ท 1.1',
        prerequisites: ['th_common_words'], questionTypes: ['sequencing', 'choice'], difficulty: 4 },
      { id: 'th_reading_comprehension_1', nameTh: 'จับใจความ (ย่อหน้าสั้น)', grade: 'P3', standard: 'ท 2.1',
        prerequisites: ['th_sentences_read'], questionTypes: ['choice'], difficulty: 5 },
      { id: 'th_reading_comprehension_2', nameTh: 'จับใจความ (ระดับ ป.4)', grade: 'P4', standard: 'ท 2.1',
        prerequisites: ['th_reading_comprehension_1'], questionTypes: ['choice'], difficulty: 6 },
      { id: 'th_spelling_rules', nameTh: 'หลักการสะกดคำ', grade: 'P4', standard: 'ท 4.1',
        prerequisites: ['th_reading_comprehension_2'], questionTypes: ['choice', 'wordbuild'], difficulty: 6 },
      { id: 'th_grammar_basics', nameTh: 'หลักภาษาไทยเบื้องต้น', grade: 'P5', standard: 'ท 4.1',
        prerequisites: ['th_spelling_rules'], questionTypes: ['choice'], difficulty: 7 },
      { id: 'th_reading_comprehension_3', nameTh: 'จับใจความ (ระดับ ป.6)', grade: 'P6', standard: 'ท 2.1',
        prerequisites: ['th_grammar_basics'], questionTypes: ['choice'], difficulty: 8 },
    ]),
  },
  math: {
    nodes: nodes('math', [
      { id: 'math_count_1_10', nameTh: 'นับจำนวน 1-10', grade: 'K2', standard: 'ค 1.1',
        prerequisites: [], questionTypes: ['choice', 'numpad'], difficulty: 1 },
      { id: 'math_count_11_20', nameTh: 'นับจำนวน 11-20', grade: 'K3', standard: 'ค 1.1',
        prerequisites: ['math_count_1_10'], questionTypes: ['choice', 'numpad'], difficulty: 2 },
      { id: 'math_compare_numbers', nameTh: 'เปรียบเทียบจำนวน', grade: 'K3', standard: 'ค 1.1',
        prerequisites: ['math_count_11_20'], questionTypes: ['choice'], difficulty: 2 },
      { id: 'math_add_under_10', nameTh: 'บวกเลขไม่เกิน 10', grade: 'P1', standard: 'ค 1.2',
        prerequisites: ['math_compare_numbers'], questionTypes: ['numpad', 'choice'], difficulty: 2 },
      { id: 'math_sub_under_10', nameTh: 'ลบเลขไม่เกิน 10', grade: 'P1', standard: 'ค 1.2',
        prerequisites: ['math_add_under_10'], questionTypes: ['numpad', 'choice'], difficulty: 2 },
      { id: 'math_add_under_20', nameTh: 'บวกเลขไม่เกิน 20', grade: 'P1', standard: 'ค 1.2',
        prerequisites: ['math_sub_under_10'], questionTypes: ['numpad', 'choice'], difficulty: 3 },
      { id: 'math_sub_under_20', nameTh: 'ลบเลขไม่เกิน 20', grade: 'P2', standard: 'ค 1.2',
        prerequisites: ['math_add_under_20'], questionTypes: ['numpad', 'choice'], difficulty: 3 },
      { id: 'math_add_sub_under_100', nameTh: 'บวกลบเลขไม่เกิน 100', grade: 'P2', standard: 'ค 1.2',
        prerequisites: ['math_sub_under_20'], questionTypes: ['numpad', 'choice'], difficulty: 4 },
      { id: 'math_multiplication_2_5_10', nameTh: 'คูณแม่ 2, 5, 10', grade: 'P2', standard: 'ค 1.2',
        prerequisites: ['math_add_sub_under_100'], questionTypes: ['numpad', 'choice'], difficulty: 4 },
      { id: 'math_multiplication_full', nameTh: 'สูตรคูณ 1-12', grade: 'P3', standard: 'ค 1.2',
        prerequisites: ['math_multiplication_2_5_10'], questionTypes: ['numpad', 'choice'], difficulty: 5 },
      { id: 'math_division_basic', nameTh: 'การหารเบื้องต้น', grade: 'P3', standard: 'ค 1.2',
        prerequisites: ['math_multiplication_full'], questionTypes: ['numpad', 'choice'], difficulty: 5 },
      { id: 'math_fractions_intro', nameTh: 'เศษส่วนเบื้องต้น', grade: 'P4', standard: 'ค 1.3',
        prerequisites: ['math_division_basic'], questionTypes: ['choice'], difficulty: 6 },
      { id: 'math_decimals_intro', nameTh: 'ทศนิยมเบื้องต้น', grade: 'P5', standard: 'ค 1.3',
        prerequisites: ['math_fractions_intro'], questionTypes: ['choice'], difficulty: 7 },
      { id: 'math_fractions_ops', nameTh: 'บวกลบเศษส่วน', grade: 'P5', standard: 'ค 1.3',
        prerequisites: ['math_decimals_intro'], questionTypes: ['numpad', 'choice'], difficulty: 7 },
      { id: 'math_percent_intro', nameTh: 'ร้อยละเบื้องต้น', grade: 'P6', standard: 'ค 1.3',
        prerequisites: ['math_fractions_ops'], questionTypes: ['choice'], difficulty: 8 },
    ]),
  },
  // Keyed 'eng', NOT 'english' — matches this codebase's existing 3-letter
  // subject-key convention used everywhere else (xpEng, subjectLevels.eng,
  // responseTimeLogs.eng, battle enemy.subject:'eng' in enemyConfig.js, etc).
  // An earlier version of this file used 'english' (copied literally from the
  // spec's example without cross-checking) — that would have made every
  // English world battle crash, since WorldBattle.jsx passes the real 'eng'
  // key and CURRICULUM.english/activeNodes.english would never match it.
  // Caught and fixed before it shipped to a live battle.
  eng: {
    nodes: nodes('eng', [
      { id: 'eng_alphabet_recognition', nameTh: 'รู้จักตัวอักษร A-Z', grade: 'K2', standard: 'ต 1.1',
        prerequisites: [], questionTypes: ['choice', 'visual_discrimination'], difficulty: 1 },
      { id: 'eng_alphabet_order', nameTh: 'เรียงลำดับตัวอักษร', grade: 'K3', standard: 'ต 1.1',
        prerequisites: ['eng_alphabet_recognition'], questionTypes: ['sequencing', 'choice'], difficulty: 2 },
      { id: 'eng_phonics_cvc', nameTh: 'Phonics คำ CVC', grade: 'P1', standard: 'ต 1.1',
        prerequisites: ['eng_alphabet_order'], questionTypes: ['wordbuild', 'choice'], difficulty: 2 },
      { id: 'eng_sight_words_1', nameTh: 'Sight Words ชุดที่ 1', grade: 'P1', standard: 'ต 1.1',
        prerequisites: ['eng_phonics_cvc'], questionTypes: ['choice', 'wordbuild'], difficulty: 3 },
      { id: 'eng_vocab_animals', nameTh: 'คำศัพท์: สัตว์', grade: 'P1', standard: 'ต 1.2',
        prerequisites: ['eng_sight_words_1'], questionTypes: ['choice', 'memory'], difficulty: 3 },
      { id: 'eng_vocab_food', nameTh: 'คำศัพท์: อาหาร', grade: 'P1', standard: 'ต 1.2',
        prerequisites: ['eng_vocab_animals'], questionTypes: ['choice', 'memory'], difficulty: 3 },
      { id: 'eng_vocab_family', nameTh: 'คำศัพท์: ครอบครัว', grade: 'P2', standard: 'ต 1.2',
        prerequisites: ['eng_vocab_food'], questionTypes: ['choice', 'memory'], difficulty: 4 },
      { id: 'eng_vocab_school', nameTh: 'คำศัพท์: โรงเรียน', grade: 'P2', standard: 'ต 1.2',
        prerequisites: ['eng_vocab_family'], questionTypes: ['choice', 'memory'], difficulty: 4 },
      { id: 'eng_sight_words_2', nameTh: 'Sight Words ชุดที่ 2', grade: 'P2', standard: 'ต 1.1',
        prerequisites: ['eng_vocab_school'], questionTypes: ['choice', 'wordbuild'], difficulty: 4 },
      { id: 'eng_simple_sentences', nameTh: 'ประโยคง่าย', grade: 'P3', standard: 'ต 1.1',
        prerequisites: ['eng_sight_words_2'], questionTypes: ['sequencing', 'choice'], difficulty: 5 },
      { id: 'eng_questions_answers', nameTh: 'ถาม-ตอบ', grade: 'P3', standard: 'ต 1.1',
        prerequisites: ['eng_simple_sentences'], questionTypes: ['choice'], difficulty: 5 },
      { id: 'eng_reading_short_passages', nameTh: 'อ่านย่อหน้าสั้น', grade: 'P4', standard: 'ต 2.1',
        prerequisites: ['eng_questions_answers'], questionTypes: ['choice'], difficulty: 6 },
      { id: 'eng_grammar_present', nameTh: 'ไวยากรณ์ Present Tense', grade: 'P5', standard: 'ต 4.1',
        prerequisites: ['eng_reading_short_passages'], questionTypes: ['choice'], difficulty: 7 },
      { id: 'eng_reading_comprehension', nameTh: 'จับใจความภาษาอังกฤษ', grade: 'P6', standard: 'ต 2.1',
        prerequisites: ['eng_grammar_present'], questionTypes: ['choice'], difficulty: 8 },
    ]),
  },
}

export const SUBJECTS = Object.keys(CURRICULUM)

export function getNode(subject, nodeId) {
  return CURRICULUM[subject]?.nodes.find(n => n.id === nodeId) || null
}

// Phase 1.3: teaching-moment triggers only carry a bare nodeId (no subject) —
// this searches across all 3 subjects to resolve both, since node ids are
// globally unique (prefixed th_/math_/eng_) but that prefix isn't parsed here
// to avoid a second, drifting source of truth for the subject key.
export function findNodeAnywhere(nodeId) {
  for (const subject of SUBJECTS) {
    const node = CURRICULUM[subject].nodes.find(n => n.id === nodeId)
    if (node) return { subject, node }
  }
  return null
}

export function getFirstNodeId(subject) {
  return CURRICULUM[subject]?.nodes[0]?.id || null
}

export function isNodeMastered(skillMastery, nodeId) {
  return !!skillMastery?.[nodeId]?.mastered
}

// Next node (in curriculum order) that is not yet mastered AND whose prerequisites
// are ALL mastered. Returns null if every node is mastered (end of tree) or the
// subject/nodeId is unknown.
export function getNextEligibleNode(subject, skillMastery) {
  const list = CURRICULUM[subject]?.nodes || []
  for (const node of list) {
    if (isNodeMastered(skillMastery, node.id)) continue
    const prereqsMet = node.prerequisites.every(p => isNodeMastered(skillMastery, p))
    if (prereqsMet) return node.id
  }
  return null
}

// All mastered node ids for a subject, in curriculum order.
export function getMasteredNodeIds(subject, skillMastery) {
  return (CURRICULUM[subject]?.nodes || [])
    .filter(n => isNodeMastered(skillMastery, n.id))
    .map(n => n.id)
}

// Node immediately after `nodeId` in curriculum order (used for the 10% "preview"
// battle-question slice) — independent of prerequisite/mastery state, this is just
// positional "what comes next" for exposure purposes.
export function getNodeAfter(subject, nodeId) {
  const list = CURRICULUM[subject]?.nodes || []
  const idx = list.findIndex(n => n.id === nodeId)
  if (idx === -1 || idx + 1 >= list.length) return null
  return list[idx + 1].id
}

// Read-only parent-report helper (Phase 2 will build UI on top of this).
export function getSkillReport(skillMastery = {}) {
  const report = {}
  for (const subject of SUBJECTS) {
    report[subject] = CURRICULUM[subject].nodes.map(node => {
      const m = skillMastery?.[node.id]
      return {
        nodeId: node.id,
        nameTh: node.nameTh,
        grade: node.grade,
        standard: node.standard,
        mastered: !!m?.mastered,
        masteredAt: m?.masteredAt ?? null,
        ema: m?.ema ?? 0,
        attempts: m?.attempts?.length ?? 0,
      }
    })
  }
  return report
}

// ── RECORD_ANSWER mastery bookkeeping (retrofitted out of StateContext.jsx) ─
//
// Originally written inline in the LOG_BATTLE_ANSWER reducer case (Phase 1.1,
// 2026-07-09) — that meant it could only ever be verified by manual trace,
// never an automated test, since StateContext.jsx is a JSX file Node's
// `--test` runner can't import. Retrofitted here as a pure function (same
// signature shape as teachingMoments.js's recordMissForTeaching/clearTeaching:
// explicit primitive/plain-object arguments in, a plain result object out —
// no `state` object dependency) specifically so it can finally get a real
// committed regression suite. Verified byte-for-byte behavior-equivalent to
// the original inline version via before/after trace comparison across many
// scenarios (see the handoff for the exact comparison method) — this is a
// pure refactor, no behavior change.
//
// alpha=0.3 EMA smoothing is a reasonable default (not a graded requirement
// per the spec) — weights the most recent ~3-4 answers most heavily while
// still remembering longer-run performance. Always blends from the PRIOR ema
// (starting at 0 for a brand-new node), never a "cold start = this attempt's
// raw result" special case — that special case was tried first and caught by
// this session's own manual trace: it set ema=1 after a single lucky correct
// answer on a fresh node (since there was no prior attempt to blend against),
// which would satisfy `ema > masteryThreshold` and instantly "master" a node
// off one answer. Blending from 0 instead means ema only crosses a 0.8
// threshold after ~5 consecutive correct answers, which is what "recent
// performance" mastery is supposed to measure.
export const MASTERY_EMA_ALPHA = 0.3

export function applyAnswerToMastery(skillMastery, activeNodes, pendingNodeMastery, subject, nodeId, correct) {
  const node = getNode(subject, nodeId)
  const noop = { skillMastery, activeNodes, pendingNodeMastery: pendingNodeMastery ?? null }
  if (!node) return noop

  const prevRecord = skillMastery?.[nodeId] ?? { attempts: [], ema: 0, mastered: false, masteredAt: null }
  const attempts = [...(prevRecord.attempts || []), correct ? 1 : 0].slice(-10)
  const ema = (prevRecord.ema || 0) * (1 - MASTERY_EMA_ALPHA) + (correct ? 1 : 0) * MASTERY_EMA_ALPHA
  const sum = attempts.reduce((a, b) => a + b, 0)
  const wasMastered = !!prevRecord.mastered
  const isMastered = wasMastered || (attempts.length >= 10 && sum >= 8) || ema > node.masteryThreshold
  const newlyMastered = isMastered && !wasMastered

  const newRecord = {
    attempts,
    ema,
    mastered: isMastered,
    masteredAt: newlyMastered ? Date.now() : (prevRecord.masteredAt ?? null),
  }
  const newSkillMastery = { ...(skillMastery || {}), [nodeId]: newRecord }

  let newActiveNodes = activeNodes || {}
  let newPendingNodeMastery = pendingNodeMastery ?? null
  if (newlyMastered) {
    const nextId = getNextEligibleNode(subject, newSkillMastery)
    if (nextId) {
      newActiveNodes = { ...newActiveNodes, [subject]: nextId }
      const nextNode = getNode(subject, nextId)
      newPendingNodeMastery = { subject, nodeId, nextNodeId: nextId, nextNodeNameTh: nextNode?.nameTh ?? null }
    } else {
      // End of this subject's tree — nothing left to advance to, but the child
      // still earned the celebration.
      newPendingNodeMastery = { subject, nodeId, nextNodeId: null, nextNodeNameTh: null }
    }
  }
  return { skillMastery: newSkillMastery, activeNodes: newActiveNodes, pendingNodeMastery: newPendingNodeMastery }
}
