import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase.js'

const TITLE_STYLE = {
  fontFamily: 'var(--font-thai)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--px-yellow)',
  textShadow: '2px 2px 0 var(--px-darkest)',
  marginBottom: 6,
}
const SUBTITLE_STYLE = {
  fontFamily: 'var(--font-thai)',
  fontSize: 13,
  color: 'var(--px-light)',
  marginBottom: 18,
}
const BTN_THAI = {
  fontFamily: 'var(--font-thai)',
  fontSize: 14,
  textTransform: 'none',
  letterSpacing: 0,
}

export default function LoginModal({ open, onClose, mandatory }) {
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgColor, setMsgColor] = useState('var(--px-red)')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const resetToLoginMode = () => {
    setMode('login'); setMsg(''); setPassword('')
  }

  const handleSignIn = async () => {
    if (!supabase) { setMsg('ไม่สามารถเชื่อมต่อ Supabase ได้'); return }
    if (!email || !password) { setMsg('กรุณากรอก email และ password'); return }
    setLoading(true); setMsg('กำลัง login...')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMsg(''); onClose()
    } catch (e) {
      setMsg('Login ไม่สำเร็จ: ' + (e.message === 'Invalid login credentials' ? 'email หรือ password ไม่ถูกต้อง' : e.message || 'ลองอีกครั้ง'))
      setMsgColor('var(--px-red)')
    } finally { setLoading(false) }
  }

  const handleSignUp = async () => {
    if (!supabase) { setMsg('ไม่สามารถเชื่อมต่อ Supabase ได้'); return }
    if (!email || !password) { setMsg('กรุณากรอก email และ password'); return }
    if (password.length < 6) { setMsg('Password ต้องมีอย่างน้อย 6 ตัว'); return }
    setLoading(true); setMsg('กำลังสมัครสมาชิก...')
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMsg('✅ สมัครสำเร็จ! กรุณายืนยัน email ของคุณ')
      setMsgColor('var(--px-green2)')
      setTimeout(onClose, 2000)
    } catch (e) {
      setMsg('Sign up ไม่สำเร็จ: ' + (e.message || 'ลองอีกครั้ง'))
      setMsgColor('var(--px-red)')
    } finally { setLoading(false) }
  }

  const handleSendReset = async () => {
    if (!supabase) { setMsg('ไม่สามารถเชื่อมต่อ Supabase ได้'); return }
    if (!email) { setMsg('กรุณากรอก email'); return }
    setLoading(true); setMsg('กำลังส่งอีเมล...')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=1`,
      })
      if (error) throw error
      setMode('sent')
      setMsg('')
    } catch (e) {
      setMsg('ส่งอีเมลไม่สำเร็จ: ' + (e.message || 'ลองอีกครั้ง'))
      setMsgColor('var(--px-red)')
    } finally { setLoading(false) }
  }

  return createPortal(
    <div className="auth-overlay show" onClick={e => { if (!mandatory && e.target === e.currentTarget) onClose() }}>
      <div className="px-auth-sheet">
        <div style={{ width: 40, height: 4, background: 'var(--px-border)', borderRadius: 0, margin: '0 auto 18px' }} />
        {!mandatory && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-pixel)', fontSize: 14, color: 'var(--px-light)',
              padding: 4, WebkitTapHighlightColor: 'transparent',
            }}
          >✕</button>
        )}

        {mode === 'login' && (
          <>
            <div style={TITLE_STYLE}>เข้าสู่ระบบ</div>
            <div style={SUBTITLE_STYLE}>เข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มเล่น</div>
            <input className="px-auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            <input className="px-auth-input" type="password" placeholder="Password (อย่างน้อย 6 ตัว)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button
              onClick={() => { setMode('forgot'); setMsg('') }}
              style={{ background: 'none', border: 'none', color: 'var(--px-blue2)', fontFamily: 'var(--font-pixel)', fontSize: 8, letterSpacing: 1, cursor: 'pointer', padding: '4px 0 10px', textAlign: 'left' }}
            >
              ลืมรหัสผ่าน?
            </button>
            <div style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: msgColor, marginBottom: 8, minHeight: 18 }}>{msg}</div>
            <div className="auth-btn-row">
              <button onClick={handleSignIn} disabled={loading} className="px-btn" style={{ flex: 1, opacity: loading ? 0.6 : 1 }}>Login</button>
              <button onClick={handleSignUp} disabled={loading} className="px-btn px-btn-purple" style={{ flex: 1, opacity: loading ? 0.6 : 1 }}>Sign Up</button>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div style={TITLE_STYLE}>ลืมรหัสผ่าน</div>
            <div style={SUBTITLE_STYLE}>กรอก email ที่ใช้สมัคร เราจะส่งลิงก์ไปให้ตั้งรหัสผ่านใหม่</div>
            <input className="px-auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            <div style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: msgColor, marginBottom: 8, minHeight: 18 }}>{msg}</div>
            <button onClick={handleSendReset} disabled={loading} className="px-btn" style={{ ...BTN_THAI, width: '100%', opacity: loading ? 0.6 : 1, marginBottom: 8 }}>
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </button>
            <button onClick={resetToLoginMode} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--px-light)', fontFamily: 'var(--font-thai)', fontSize: 13, cursor: 'pointer', padding: 6 }}>
              ← กลับไปหน้า login
            </button>
          </>
        )}

        {mode === 'sent' && (
          <>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>📧</div>
            <div style={{ ...TITLE_STYLE, textAlign: 'center' }}>ส่งอีเมลแล้ว!</div>
            <div style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: 'var(--px-light)', textAlign: 'center', marginBottom: 18 }}>
              เช็คอีเมล <b style={{ color: 'var(--px-yellow)' }}>{email}</b> แล้วกดลิงก์เพื่อตั้งรหัสผ่านใหม่
            </div>
            <button onClick={() => { resetToLoginMode(); onClose() }} className="px-btn" style={{ ...BTN_THAI, width: '100%' }}>
              ปิดหน้านี้
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
