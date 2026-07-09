// PlacementQuest.jsx — Phase 1.2 adaptive placement test, framed to the child
// as "ด่านทดสอบพลัง" (a power test), never as an exam. Flow: intro -> 5
// adaptive questions per subject (thai -> math -> eng) -> finale showing
// "strengths" (node names, never grade labels). The adaptive algorithm lives
// in src/lib/placementTest.js (traced/verified independently there).
//
// UI requirements from spec: no visible timer, no negative/❌ feedback on a
// wrong answer (a gentle "ลองข้อต่อไปนะ" instead), big touch targets,
// everything voiced in Thai.
import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import {
  PLACEMENT_SUBJECTS, createPlacementSession, currentPlacementQuestion,
  recordPlacementAnswer, isPlacementSubjectDone, placementResultNodeId,
  QUESTIONS_PER_SUBJECT,
} from '../lib/placementTest.js'
import { getNode } from '../lib/curriculum.js'
import { speakTh, playTone, playSFX } from '../lib/audio.js'
import NumpadInput from './battle/NumpadInput.jsx'
import WordBuildInput, { DEFAULT_ENG_DISTRACTORS } from './battle/WordBuildInput.jsx'
import SequenceInput from './battle/SequenceInput.jsx'

const SUBJECT_LABEL_TH = { thai: 'ภาษาไทย', math: 'คณิตศาสตร์', eng: 'ภาษาอังกฤษ' }
const SUBJECT_ICON = { thai: '📖', math: '🔢', eng: '🔤' }

// Memory-mode questions don't have a clean single-shot correct/wrong signal
// (matching pairs is its own small multi-step game, not a single tap), which
// this 5-question adaptive loop needs. Only one generator can ever return it
// (questionBank.js's genVocabQ, ~30% of eng_vocab_* calls) — reroll a bounded
// number of times rather than building separate matching-game handling into
// a test that's supposed to take ~4 minutes total end to end.
function generateNonMemoryQuestion(session) {
  let q = currentPlacementQuestion(session)
  for (let i = 0; i < 9 && q.inputMode === 'memory'; i++) {
    q = currentPlacementQuestion(session)
  }
  return q
}

const btnBase = {
  fontFamily: 'Mitr,sans-serif', fontSize: 18, fontWeight: 600,
  borderRadius: 14, border: 'none', cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
}

function ChoiceButtons({ question, onAnswer, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
      {question.choices.map((c, i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => onAnswer(String(c) === String(question.correctAnswer))}
          style={{
            ...btnBase,
            padding: '18px 20px',
            background: 'var(--card)',
            border: '2px solid var(--border)',
            color: 'var(--text)',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {question.emoji ? `${question.emoji}  ` : ''}{c}
        </button>
      ))}
    </div>
  )
}

function QuestionBody({ question, resetKey, onAnswer, disabled }) {
  if (question.inputMode === 'numpad') {
    return (
      <NumpadInput
        resetKey={resetKey}
        disabled={disabled}
        onSubmit={(val) => onAnswer(String(val) === String(question.correctAnswer))}
      />
    )
  }
  if (question.inputMode === 'wordbuild') {
    return (
      <WordBuildInput
        chars={question.chars}
        resetKey={resetKey}
        disabled={disabled}
        distractorPool={/^[a-zA-Z]/.test(question.chars?.[0] || '') ? DEFAULT_ENG_DISTRACTORS : undefined}
        onSubmit={onAnswer}
      />
    )
  }
  if (question.inputMode === 'sequence') {
    return (
      <SequenceInput
        correctOrder={question.sequenceChars}
        resetKey={resetKey}
        disabled={disabled}
        onSubmit={onAnswer}
      />
    )
  }
  return <ChoiceButtons question={question} onAnswer={onAnswer} disabled={disabled} />
}

export default function PlacementQuest({ onDone }) {
  const { dispatch } = useAppState()
  const [phase, setPhase] = useState('intro') // intro | quiz | finale
  const [subjectIdx, setSubjectIdx] = useState(0)
  const [session, setSession] = useState(null)
  const [question, setQuestion] = useState(null)
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [locked, setLocked] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [results, setResults] = useState({})

  const subject = PLACEMENT_SUBJECTS[subjectIdx]

  // (Re)start a session + first question whenever quiz phase begins or the subject advances.
  useEffect(() => {
    if (phase !== 'quiz') return
    const s = createPlacementSession(subject)
    setSession(s)
    setQuestion(generateNonMemoryQuestion(s))
    setFeedback(null)
    setLocked(false)
    setResetKey(k => k + 1)
  }, [phase, subjectIdx]) // eslint-disable-line

  function startQuiz() {
    playTone('start')
    setPhase('quiz')
  }

  function handleAnswer(correct) {
    if (locked || !session) return
    setLocked(true)
    if (correct) { playTone('correct'); speakTh('เก่งมาก') }
    else { playTone('miss') }
    setFeedback(correct ? 'correct' : 'wrong')

    setTimeout(() => {
      const nextSession = recordPlacementAnswer(session, correct)
      if (isPlacementSubjectDone(nextSession)) {
        const nodeId = placementResultNodeId(nextSession)
        const newResults = { ...results, [subject]: nodeId }
        setResults(newResults)
        if (subjectIdx + 1 < PLACEMENT_SUBJECTS.length) {
          setSubjectIdx(i => i + 1)
          setSession(null)
          setQuestion(null) // avoid a one-frame flash of the just-finished subject's last question
        } else {
          finish(newResults)
        }
      } else {
        setSession(nextSession)
        setQuestion(generateNonMemoryQuestion(nextSession))
        setFeedback(null)
        setLocked(false)
        setResetKey(k => k + 1)
      }
    }, correct ? 900 : 1300)
  }

  function finish(finalResults) {
    playSFX('level_up')
    playTone('fanfare')
    setResults(finalResults)
    setPhase('finale')
  }

  function handleFinaleDone() {
    dispatch({ type: ACTIONS.COMPLETE_PLACEMENT, payload: { results } })
    onDone?.()
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'linear-gradient(180deg, #1a1040 0%, #2a1a5a 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 24, boxSizing: 'border-box', fontFamily: 'Mitr,sans-serif', color: '#fff',
    textAlign: 'center',
  }

  if (phase === 'intro') {
    return (
      <div style={overlayStyle}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🥚✨</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>มาทดสอบพลังกันเถอะ!</div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 28, maxWidth: 320, lineHeight: 1.6 }}>
          ตอบคำถามสนุกๆ สั้นๆ เพื่อดูว่าหนูเก่งเรื่องอะไรบ้าง ไม่มีผิดไม่มีถูก แค่ลองดูนะ!
        </div>
        <button
          onClick={startQuiz}
          style={{ ...btnBase, padding: '16px 40px', fontSize: 18, background: '#FFD700', color: '#3a2a00' }}
        >
          🚀 เริ่มเลย!
        </button>
      </div>
    )
  }

  if (phase === 'quiz') {
    if (!question) return <div style={overlayStyle}>...</div>
    const questionNumber = (session?.questionsAsked ?? 0) + 1
    return (
      <div style={overlayStyle}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
          {SUBJECT_ICON[subject]} {SUBJECT_LABEL_TH[subject]} · ข้อ {questionNumber}/{QUESTIONS_PER_SUBJECT}
        </div>
        {/* No visible timer or progress bar per spec — just a soft subject/question counter. */}
        <div style={{ fontSize: 20, fontWeight: 600, margin: '18px 0 24px', minHeight: 60 }}>
          {question.emoji && question.inputMode !== 'choice' ? <div style={{ fontSize: 44 }}>{question.emoji}</div> : null}
          {question.prompt}
        </div>
        <QuestionBody question={question} resetKey={resetKey} onAnswer={handleAnswer} disabled={locked} />
        {/* Gentle feedback only — no ❌/negative animation on a wrong answer. */}
        {feedback === 'correct' && (
          <div style={{ marginTop: 20, fontSize: 16, color: '#7CFC7C' }}>เก่งมาก! 🎉</div>
        )}
        {feedback === 'wrong' && (
          <div style={{ marginTop: 20, fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>ลองข้อต่อไปนะ 😊</div>
        )}
      </div>
    )
  }

  // finale
  return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 72, marginBottom: 12 }}>🥚💖</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>พลังของหนูคือ...</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340, marginBottom: 28 }}>
        {PLACEMENT_SUBJECTS.map(subj => {
          const node = getNode(subj, results[subj])
          return (
            <div key={subj} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,215,0,0.4)',
              borderRadius: 14, padding: '14px 16px', textAlign: 'left',
            }}>
              <span style={{ fontSize: 26 }}>{SUBJECT_ICON[subj]}</span>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{SUBJECT_LABEL_TH[subj]}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{node?.nameTh ?? ''}</div>
              </div>
            </div>
          )
        })}
      </div>
      <button
        onClick={handleFinaleDone}
        style={{ ...btnBase, padding: '16px 40px', fontSize: 18, background: '#FFD700', color: '#3a2a00' }}
      >
        ไปผจญภัยกันเถอะ! 🎈
      </button>
    </div>
  )
}
