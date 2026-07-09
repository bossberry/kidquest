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

export function createPlacementSession(subject) {
  return {
    subject,
    idx: startIndexForSubject(subject),
    correctStreak: 0,
    highestCorrectIdx: -1, // -1 = no correct answer yet this subject
    questionsAsked: 0,
  }
}

export function currentPlacementQuestion(session) {
  const node = CURRICULUM[session.subject].nodes[session.idx]
  return generateQuestion(node, PLACEMENT_DIFFICULTY)
}

// Binary-search-style adaptive step, per spec: correct 2-in-a-row -> jump up 2
// nodes (streak then resets, so a run of exactly 2 correct produces exactly
// one jump); any wrong answer -> drop 1 node immediately (no streak
// requirement for the down direction — a single miss is enough signal that
// the current node is too hard). Both directions clamp to the subject's
// node-list bounds. A single correct answer that doesn't complete a streak of
// 2 holds position (asks again at the same node) rather than nudging up by 1
// — the spec only specifies movement on the 2-in-a-row/wrong conditions, so a
// lone correct is treated as "not yet enough evidence to move."
export function recordPlacementAnswer(session, correct) {
  const list = CURRICULUM[session.subject].nodes
  let { idx, correctStreak, highestCorrectIdx } = session
  if (correct) {
    if (idx > highestCorrectIdx) highestCorrectIdx = idx
    correctStreak += 1
    if (correctStreak >= 2) {
      idx = Math.min(list.length - 1, idx + 2)
      correctStreak = 0
    }
  } else {
    correctStreak = 0
    idx = Math.max(0, idx - 1)
  }
  return {
    ...session,
    idx,
    correctStreak,
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
