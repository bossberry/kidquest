// QuestionRenderer.jsx — renders a questionBank.js question object using the
// right input component for its inputMode (choice/numpad/wordbuild/sequence),
// normalizing every path to a single onAnswer(boolean) callback. Extracted
// from PlacementQuest.jsx (Phase 1.2) so TeachingMoment.jsx (Phase 1.3) can
// reuse the exact same rendering instead of duplicating it — both are
// one-question-at-a-time flows outside the main battle UI.
import React from 'react'
import NumpadInput from './NumpadInput.jsx'
import WordBuildInput, { DEFAULT_ENG_DISTRACTORS } from './WordBuildInput.jsx'
import SequenceInput from './SequenceInput.jsx'

const btnBase = {
  fontFamily: 'Mitr,sans-serif', fontSize: 18, fontWeight: 600,
  borderRadius: 14, border: 'none', cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
}

export function ChoiceButtons({ question, onAnswer, disabled }) {
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

export default function QuestionRenderer({ question, resetKey, onAnswer, disabled }) {
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
