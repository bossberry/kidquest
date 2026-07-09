// TeachingMoment.jsx — Phase 1.3 "Adaptive Engine v2 — Teaching Moments".
// Full-screen friendly overlay (NOT battle UI) shown before the next battle
// question whenever state.pendingTeaching is set (3 consecutive misses on the
// same node+questionType — see teachingMoments.js). Egg-as-teacher framing,
// one animated explanation (TeachingVisual.jsx) + one guaranteed-hint practice
// question at the easiest difficulty. Correct -> clear and resume battle.
// Wrong -> repeat the explanation once, then clear anyway regardless (never
// trap the child in a loop, per spec).
import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { findNodeAnywhere } from '../lib/curriculum.js'
import { getTeachingTemplate, MAX_EXPLANATION_LOOPS } from '../lib/teachingMoments.js'
import { generateQuestion } from '../lib/questionBank.js'
import { speakTh, playTone, playSFX } from '../lib/audio.js'
import QuestionRenderer from './battle/QuestionRenderer.jsx'
import TeachingVisual from './TeachingVisual.jsx'

const btnBase = {
  fontFamily: 'Mitr,sans-serif', fontSize: 18, fontWeight: 600,
  borderRadius: 14, border: 'none', cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
}

export default function TeachingMoment() {
  const { state, dispatch } = useAppState()
  const pending = state.pendingTeaching
  const resolved = pending ? findNodeAnywhere(pending.nodeId) : null
  const template = pending ? getTeachingTemplate(pending.nodeId) : null

  const [phase, setPhase] = useState('explain') // explain | practice
  const [loopCount, setLoopCount] = useState(0)
  const [practiceQuestion, setPracticeQuestion] = useState(null)
  const [resetKey, setResetKey] = useState(0)
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'

  useEffect(() => {
    if (!pending || !template) return
    playSFX('level_up')
    const t = setTimeout(() => speakTh(template.explainTh), 300)
    return () => clearTimeout(t)
    // Re-voice whenever a genuinely new teaching moment starts (nodeId/questionType
    // change) or the explanation repeats after a wrong practice attempt (phase
    // flips back to 'explain' with the loop count already bumped).
  }, [pending?.nodeId, pending?.questionType, loopCount]) // eslint-disable-line

  // Defensive — should never render without a real pending teaching moment
  // and a resolvable node (App/WorldBattle only mount this when both exist).
  if (!pending || !resolved || !template) return null

  function startPractice() {
    playTone('start')
    setPracticeQuestion(generateQuestion(resolved.node, 1))
    setResetKey(k => k + 1)
    setFeedback(null)
    setLocked(false)
    setPhase('practice')
  }

  function finish() {
    dispatch({ type: ACTIONS.CLEAR_PENDING_TEACHING })
  }

  function handlePracticeAnswer(correct) {
    if (locked) return
    setLocked(true)
    if (correct) {
      playTone('correct')
      speakTh('เข้าใจแล้วใช่มั้ย ไปต่อกันเลย')
      setFeedback('correct')
      setTimeout(finish, 1100)
      return
    }
    playTone('miss')
    setFeedback('wrong')
    const nextLoop = loopCount + 1
    setTimeout(() => {
      if (nextLoop >= MAX_EXPLANATION_LOOPS) {
        // Never trap the child in a loop — clear anyway once the cap is hit,
        // even though they haven't answered the practice question correctly.
        finish()
        return
      }
      setLoopCount(nextLoop)
      setPhase('explain')
      setPracticeQuestion(null)
    }, 1300)
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 190, // below PlacementQuest's 200, above normal battle UI
    background: 'linear-gradient(180deg, #16213e 0%, #1f3a5f 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 24, boxSizing: 'border-box', fontFamily: 'Mitr,sans-serif', color: '#fff',
    textAlign: 'center',
  }

  if (phase === 'explain') {
    return (
      <div style={overlayStyle}>
        {/* Egg as teacher, per spec — glasses accessory via emoji overlay */}
        <div style={{ fontSize: 56, marginBottom: 10 }}>🥚🤓</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>{template.headline}</div>
        <div style={{ margin: '4px 0 20px' }}>
          <TeachingVisual template={template} />
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 26, maxWidth: 320, lineHeight: 1.6 }}>
          {template.explainTh}
        </div>
        <button onClick={startPractice} style={{ ...btnBase, padding: '15px 36px', background: '#FFD700', color: '#3a2a00' }}>
          ลองดูนะ! →
        </button>
      </div>
    )
  }

  // practice
  return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>🥚🤓 ลองข้อนี้ดูนะ</div>
      <div style={{ fontSize: 20, fontWeight: 600, margin: '10px 0 16px', minHeight: 50 }}>
        {practiceQuestion?.emoji && practiceQuestion.inputMode !== 'choice' && (
          <div style={{ fontSize: 40 }}>{practiceQuestion.emoji}</div>
        )}
        {practiceQuestion?.prompt}
      </div>
      {/* Guaranteed hint — always visible here, unlike normal battle where a
          hint requires an idle timeout or item use. */}
      {practiceQuestion?.hints?.[0] && (
        <div style={{ fontSize: 13, color: '#FFD700', marginBottom: 16 }}>💡 {practiceQuestion.hints[0]}</div>
      )}
      {practiceQuestion && (
        <QuestionRenderer question={practiceQuestion} resetKey={resetKey} onAnswer={handlePracticeAnswer} disabled={locked} />
      )}
      {feedback === 'correct' && (
        <div style={{ marginTop: 18, fontSize: 15, color: '#7CFC7C' }}>เข้าใจแล้วใช่มั้ย! ไปต่อกันเลย 🎉</div>
      )}
      {feedback === 'wrong' && (
        <div style={{ marginTop: 18, fontSize: 15, opacity: 0.85 }}>ไม่เป็นไรนะ ลองดูอีกครั้ง 😊</div>
      )}
    </div>
  )
}
