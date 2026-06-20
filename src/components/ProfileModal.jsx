import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { GRADE_LABELS } from '../config/gameConfig.js'
import { supabase } from '../lib/supabase.js'
import { defaultState, KEY, saveState } from '../lib/state.js'

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

export default function ProfileModal({ open, onClose }) {
  const { state, dispatch } = useAppState()
  const [name, setName] = useState(state.name || '')
  const [schoolGrade, setSchoolGrade] = useState(state.schoolGrade)
  const [gender, setGender] = useState(state.gender ?? 'unspecified')
  const [userEmail, setUserEmail] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!supabase || !open) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [open])

  if (!open) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const updatedState = { ...state, name: trimmed, schoolGrade, gender }
    dispatch({ type: ACTIONS.SET_PROFILE, payload: { name: trimmed, schoolGrade, gender } })
    saveState(updatedState, { notify: true })
    onClose()
  }

  const handleLogout = async () => {
    if (!supabase) return
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      // Fully wipe local state so the next person on this device starts fresh —
      // signOut() only clears the Supabase session, it does NOT touch the
      // in-memory React state or localStorage, which would otherwise leave
      // the previous child's creatures/items/progress visible.
      localStorage.removeItem(KEY)
      dispatch({ type: ACTIONS.INIT, payload: defaultState() })
      onClose()
    } catch (e) {
      console.log('[KQ:logout] failed:', e.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return createPortal(
    <div className="auth-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="px-auth-sheet">
        <div style={{ width: 40, height: 4, background: 'var(--px-border)', borderRadius: 0, margin: '0 auto 18px' }} />
        <div style={TITLE_STYLE}>👤 โปรไฟล์ลูก</div>
        <div style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: 'var(--px-light)', marginBottom: 18 }}>ตั้งชื่อและระดับชั้นของลูก</div>

        <div style={{ ...LABEL_STYLE, marginBottom: 6 }}>ชื่อลูก</div>
        <input
          className="px-auth-input"
          type="text"
          placeholder="เช่น โชแปง, น้องแก้ม, มิน..."
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
          {[
            { value: 'male',        label: 'ชาย',    emoji: '👦' },
            { value: 'female',      label: 'หญิง',    emoji: '👧' },
            { value: 'unspecified', label: 'ไม่ระบุ', emoji: '🌟' },
          ].map(opt => (
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
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-btn"
          style={{ width: '100%', fontFamily: 'var(--font-thai)', fontSize: 14, textTransform: 'none', letterSpacing: 0, opacity: name.trim() ? 1 : 0.5, marginBottom: 8 }}
        >บันทึก ✅</button>
        <button
          onClick={onClose}
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--px-light)', fontFamily: 'var(--font-thai)', fontSize: 13, cursor: 'pointer', padding: 6, marginBottom: userEmail ? 4 : 0 }}
        >ข้ามไปก่อน</button>

        {/* Logout — only shown when actually logged in */}
        {userEmail && (
          <div style={{ borderTop: '1px solid var(--px-border)', marginTop: 10, paddingTop: 14 }}>
            <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: 'var(--px-light)', marginBottom: 8, textAlign: 'center', opacity: 0.8 }}>
              เข้าสู่ระบบด้วย {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: '100%',
                background: 'transparent',
                border: '2px solid var(--px-red)',
                color: 'var(--px-red)',
                padding: 11,
                fontFamily: 'var(--font-thai)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '2px 2px 0 var(--px-black)',
                opacity: loggingOut ? 0.6 : 1,
              }}
            >
              {loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
