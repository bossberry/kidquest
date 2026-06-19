import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { GRADE_LABELS } from '../config/gameConfig.js'
import { supabase } from '../lib/supabase.js'

export default function ProfileModal({ open, onClose }) {
  const { state, dispatch } = useAppState()
  const [name, setName] = useState(state.name || '')
  const [grade, setGrade] = useState(state.grade ?? 0)
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
    dispatch({ type: ACTIONS.SET_PROFILE, payload: { name: trimmed, grade } })
    onClose()
  }

  const handleLogout = async () => {
    if (!supabase) return
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      onClose()
    } catch (e) {
      console.log('[KQ:logout] failed:', e.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return createPortal(
    <div className="auth-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-sheet">
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 18px' }} />
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>👤 โปรไฟล์ลูก</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>ตั้งชื่อและระดับชั้นของลูก</div>

        <div style={{ fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:6, fontFamily:'Mitr,sans-serif' }}>ชื่อลูก</div>
        <input
          className="auth-input"
          type="text"
          placeholder="เช่น โชแปง, น้องแก้ม, มิน..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoComplete="off"
        />

        <div style={{ fontSize:13, color:'var(--text)', fontWeight:600, margin:'14px 0 8px', fontFamily:'Mitr,sans-serif' }}>ระดับชั้น</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
          {GRADE_LABELS.map((label, idx) => (
            <button
              key={idx}
              onClick={() => setGrade(idx)}
              style={{
                padding:'8px 4px',
                borderRadius:10,
                border: grade === idx ? '2px solid var(--purple)' : '2px solid var(--border)',
                background: grade === idx ? 'var(--purple-l)' : 'var(--card)',
                color: grade === idx ? 'var(--purple-d)' : 'var(--muted)',
                fontFamily:'Mitr,sans-serif',
                fontSize:12,
                fontWeight: grade === idx ? 700 : 400,
                cursor:'pointer',
                transition:'all .15s',
              }}
            >{label}</button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5, marginBottom:8 }}
        >บันทึก ✅</button>
        <button
          onClick={onClose}
          style={{ width:'100%', background:'none', border:'none', color:'var(--muted)', fontFamily:'Mitr,sans-serif', fontSize:13, cursor:'pointer', padding:6, marginBottom: userEmail ? 4 : 0 }}
        >ข้ามไปก่อน</button>

        {/* Logout — only shown when actually logged in */}
        {userEmail && (
          <div style={{ borderTop:'1px solid var(--border)', marginTop:10, paddingTop:14 }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8, textAlign:'center', fontFamily:'Mitr,sans-serif' }}>
              เข้าสู่ระบบด้วย {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width:'100%', background:'transparent', border:'1px solid var(--red)',
                color:'var(--red)', borderRadius:10, padding:11,
                fontFamily:'Mitr,sans-serif', fontSize:13, fontWeight:600,
                cursor:'pointer', opacity: loggingOut ? 0.6 : 1,
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
