import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { GRADE_LABELS } from '../config/gameConfig.js'

const GENDER_OPTIONS = [
  { value: 'male',        label: 'ชาย',    emoji: '👦' },
  { value: 'female',      label: 'หญิง',    emoji: '👧' },
  { value: 'unspecified', label: 'ไม่ระบุ', emoji: '🌟' },
]

const TITLE_STYLE = {
  fontFamily: 'var(--font-thai)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--px-yellow)',
  textShadow: '2px 2px 0 var(--px-darkest)',
  marginBottom: 6,
}
const LABEL_STYLE = {
  fontFamily: 'var(--font-thai)',
  fontSize: 13,
  color: 'var(--px-light)',
  fontWeight: 600,
}

function toggleBtn(selected) {
  return {
    padding: '8px 4px',
    border: selected ? '2px solid var(--px-yellow)' : '2px solid var(--px-border)',
    background: selected ? 'var(--px-mid)' : 'var(--px-dark)',
    color: selected ? 'var(--px-yellow)' : 'var(--px-light)',
    fontFamily: 'var(--font-thai)',
    fontSize: 12,
    fontWeight: selected ? 700 : 400,
    cursor: 'pointer',
    boxShadow: selected ? '2px 2px 0 var(--px-black)' : 'none',
  }
}

export default function OnboardingModal() {
  const { dispatch } = useAppState()
  const [name, setName] = useState('')
  const [schoolGrade, setSchoolGrade] = useState(null)
  const [gender, setGender] = useState(null) // null on purpose — must be actively tapped, even to select 'unspecified'

  const canSubmit = name.trim().length > 0 && schoolGrade !== null && gender !== null

  const handleSubmit = () => {
    if (!canSubmit) return
    dispatch({ type: ACTIONS.SET_PROFILE, payload: { name: name.trim(), schoolGrade, gender } })
  }

  return createPortal(
    <div className="auth-overlay show">
      <div className="px-auth-sheet">
        <div style={{ width: 40, height: 4, background: 'var(--px-border)', borderRadius: 0, margin: '0 auto 18px' }} />
        <div style={TITLE_STYLE}>👋 ยินดีต้อนรับ!</div>
        <div style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: 'var(--px-light)', marginBottom: 18 }}>มาตั้งค่าโปรไฟล์ลูกกันก่อนเริ่มเล่น</div>

        <div style={{ ...LABEL_STYLE, marginBottom: 6 }}>ชื่อลูก</div>
        <input
          className="px-auth-input"
          type="text"
          placeholder="เช่น น้องแก้ม, มิน, ดีน..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoComplete="off"
        />

        <div style={{ ...LABEL_STYLE, margin: '14px 0 4px' }}>ระดับชั้นเรียนจริง</div>
        <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: 'var(--px-light)', opacity: 0.7, marginBottom: 8 }}>สำหรับเก็บข้อมูลเท่านั้น ไม่กระทบการเล่นเกม</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 20 }}>
          {GRADE_LABELS.map((label) => (
            <button
              key={label}
              onClick={() => setSchoolGrade(label)}
              style={toggleBtn(schoolGrade === label)}
            >{label}</button>
          ))}
        </div>

        <div style={{ ...LABEL_STYLE, margin: '14px 0 8px' }}>เพศ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 20 }}>
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGender(opt.value)}
              style={{ ...toggleBtn(gender === opt.value), padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 20 }}>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-btn"
          style={{ width: '100%', fontFamily: 'var(--font-thai)', fontSize: 14, textTransform: 'none', letterSpacing: 0, opacity: canSubmit ? 1 : 0.5 }}
        >เริ่มเล่นกันเลย! 🎉</button>
      </div>
    </div>,
    document.body
  )
}
