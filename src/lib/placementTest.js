// placementTest.js — Phase 1.2 adaptive placement test ("ด่านทดสอบพลัง").
//
// Pure, UI-independent adaptive algorithm — deliberately split from
// PlacementQuest.jsx (same separation as questionBank.js vs the battle UI) so
// the binary-search-style node-jumping logic can be traced/scripted without a
// browser. This session verified it with scripted all-correct / all-wrong /
// mixed traces per the plan (not committed as throwaway scripts — results
// documented in the handoff/CURRENT_STATE.md).

import { CURRICULUM } from './curriculum.js'
import { generateQuestion } from './questionBank.js'

export const PLACEMENT_SUBJECTS = ['thai', 'math', 'eng']
export const QUESTIONS_PER_SUBJECT = 5
export const PLACEMENT_START_GRADE = 'K3'
// Fixed mid-difficulty for every placement question — node DEPTH (which node
// in the tree) is the adaptive lever here, not per-question difficulty within
// a node, so a constant difficulty keeps the comparison between questions fair.
const PLACEMENT_DIFFICULTY = 3

function startIndexForSubject(subject) {
  const list = CURRICULUM[subject].nodes
  const idx = list.findIndex(n => n.grade === PLACEMENT_START_GRADE)
  return idx >= 0 ? idx : 0
}

// Escalating jump sizes: first correct-pair jumps +2, second +3, third +4.
// Capped at 3 uses per subject session — there are only QUESTIONS_PER_SUBJECT
// (5) questions total, so a 4th tier was never specified and isn't needed in
// practice (see the trace math in the comment on recordPlacementAnswer below).
const JUMP_SIZES = [2, 3, 4]

export function createPlacementSession(subject) {
  return {
    subject,
    idx: startIndexForSubject(subject),
    correctStreak: 0,
    jumpsUsed: 0, // how many escalating jumps have fired this subject (caps at JUMP_SIZES.length)
    highestCorrectIdx: -1, // -1 = no correct answer yet this subject
    questionsAsked: 0,
  }
}

export function currentPlacementQuestion(session) {
  const node = CURRICULUM[session.subject].nodes[session.idx]
  return generateQuestion(node, PLACEMENT_DIFFICULTY)
}

// Binary-search-style adaptive step with ESCALATING jumps (revised per explicit
// user feedback on the original flat +2/-1 version, which only reached +4-5
// nodes above the K3 start in an all-correct run — too conservative to
// differentiate a clearly-advanced child within just 5 questions).
//
// Once a 2-answer correct streak is established, EVERY further correct answer
// in that streak (not only a fresh, separate pair) triggers the next
// escalation tier immediately — this is what makes the target math work out:
// an all-correct run asks Q1 (streak 1, no jump yet) / Q2 (streak 2 -> jump
// #1, +2) / Q3 (streak 3, still "in a streak" -> jump #2, +3) / Q4 (streak 4
// -> jump #3, +4) / Q5 (streak 5, but jumpsUsed already hit the 3-jump cap ->
// no further jump). Total displacement = 2+3+4 = +9 nodes above the K3 start,
// landing ~2-3 grade levels up for a child who answers everything right.
// Any wrong answer resets BOTH correctStreak and jumpsUsed to 0 (drops the
// child back to the first escalation tier next time a streak re-forms) and
// moves down 1 node immediately — a single miss is enough signal that the
// current node is too hard, no streak requirement for the down direction.
// Both directions clamp to the subject's node-list bounds.
export function recordPlacementAnswer(session, correct) {
  const list = CURRICULUM[session.subject].nodes
  let { idx, correctStreak, jumpsUsed, highestCorrectIdx } = session
  if (correct) {
    if (idx > highestCorrectIdx) highestCorrectIdx = idx
    correctStreak += 1
    if (correctStreak >= 2 && jumpsUsed < JUMP_SIZES.length) {
      idx = Math.min(list.length - 1, idx + JUMP_SIZES[jumpsUsed])
      jumpsUsed += 1
    }
  } else {
    correctStreak = 0
    jumpsUsed = 0
    idx = Math.max(0, idx - 1)
  }
  return {
    ...session,
    idx,
    correctStreak,
    jumpsUsed,
    highestCorrectIdx,
    questionsAsked: session.questionsAsked + 1,
  }
}

export function isPlacementSubjectDone(session) {
  return session.questionsAsked >= QUESTIONS_PER_SUBJECT
}

// Result node id = the highest node the child got AT LEAST ONE question right
// on (per spec: "highest node where the child got a question right"). If they
// never answered correctly in this subject (all-wrong path), fall back to the
// subject's very first node — starting a child at content they've shown zero
// evidence of understanding would be the wrong failure mode for a placement
// test whose whole point is finding a safe starting point.
export function placementResultNodeId(session) {
  const list = CURRICULUM[session.subject].nodes
  const idx = session.highestCorrectIdx >= 0 ? session.highestCorrectIdx : 0
  return list[idx].id
}
