import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { GRADE_LABELS } from '../config/gameConfig.js'

const GENDER_OPTIONS = [
  { value: 'male',        label: 'ชาย',    emoji: '👦' },
  { value: 'female',      label: 'หญิง',    emoji: '👧' },
  { value: 'unspecified', label: 'ไม่ระบุ', emoji: '🌟' },
]

/**
 * OnboardingModal — mandatory first-time setup shown right after a new
 * account's first login. Forces name + schoolGrade + gender to be actively
 * chosen before the app is usable. Cannot be skipped or dismissed.
 */
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
      <div className="auth-sheet">
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 18px' }} />
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>👋 ยินดีต้อนรับ!</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>มาตั้งค่าโปรไฟล์ลูกกันก่อนเริ่มเล่น</div>

        <div style={{ fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:6, fontFamily:'Mitr,sans-serif' }}>ชื่อลูก</div>
        <input
          className="auth-input"
          type="text"
          placeholder="เช่น น้องแก้ม, มิน, ดีน..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoComplete="off"
        />

        <div style={{ fontSize:13, color:'var(--text)', fontWeight:600, margin:'14px 0 4px', fontFamily:'Mitr,sans-serif' }}>ระดับชั้นเรียนจริง</div>
        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8, fontFamily:'Mitr,sans-serif' }}>สำหรับเก็บข้อมูลเท่านั้น ไม่กระทบการเล่นเกม</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
          {GRADE_LABELS.map((label) => (
            <button
              key={label}
              onClick={() => setSchoolGrade(label)}
              style={{
                padding:'8px 4px',
                borderRadius:10,
                border: schoolGrade === label ? '2px solid var(--purple)' : '2px solid var(--border)',
                background: schoolGrade === label ? 'var(--purple-l)' : 'var(--card)',
                color: schoolGrade === label ? 'var(--purple-d)' : 'var(--muted)',
                fontFamily:'Mitr,sans-serif',
                fontSize:12,
                fontWeight: schoolGrade === label ? 700 : 400,
                cursor:'pointer',
                transition:'all .15s',
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ fontSize:13, color:'var(--text)', fontWeight:600, margin:'14px 0 8px', fontFamily:'Mitr,sans-serif' }}>เพศ</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:20 }}>
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGender(opt.value)}
              style={{
                padding:'10px 4px',
                borderRadius:10,
                border: gender === opt.value ? '2px solid var(--purple)' : '2px solid var(--border)',
                background: gender === opt.value ? 'var(--purple-l)' : 'var(--card)',
                color: gender === opt.value ? 'var(--purple-d)' : 'var(--muted)',
                fontFamily:'Mitr,sans-serif',
                fontSize:12,
                fontWeight: gender === opt.value ? 700 : 400,
                cursor:'pointer',
                transition:'all .15s',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}
            >
              <span style={{ fontSize:20 }}>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width:'100%', background:'var(--purple)', color:'#fff', border:'none',
            borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15,
            fontWeight:600, cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >เริ่มเล่นกันเลย! 🎉</button>
      </div>
    </div>,
    document.body
  )
}
