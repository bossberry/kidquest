import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase.js'

export default function LoginModal({ open, onClose }) {
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgColor, setMsgColor] = useState('var(--red)')
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
      setMsgColor('var(--red)')
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
      setMsgColor('var(--green-d)')
      setTimeout(onClose, 2000)
    } catch (e) {
      setMsg('Sign up ไม่สำเร็จ: ' + (e.message || 'ลองอีกครั้ง'))
      setMsgColor('var(--red)')
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
      setMsgColor('var(--red)')
    } finally { setLoading(false) }
  }

  return createPortal(
    <div className="auth-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-sheet">
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 18px' }} />

        {mode === 'login' && (
          <>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>เข้าสู่ระบบ</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>login เพื่อ sync ข้อมูลข้ามอุปกรณ์ · ยังไม่ login ก็เล่นได้ปกติ</div>
            <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            <input className="auth-input" type="password" placeholder="Password (อย่างน้อย 6 ตัว)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button
              onClick={() => { setMode('forgot'); setMsg(''); }}
              style={{ background:'none', border:'none', color:'var(--purple)', fontFamily:'Mitr,sans-serif', fontSize:12, cursor:'pointer', padding:'4px 0 10px', textAlign:'left', textDecoration:'underline' }}
            >
              ลืมรหัสผ่าน?
            </button>
            <div style={{ fontSize:12, color:msgColor, marginBottom:8, minHeight:18 }}>{msg}</div>
            <div className="auth-btn-row">
              <button onClick={handleSignIn} disabled={loading} style={{ flex:1, background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading ? 0.6 : 1 }}>Login</button>
              <button onClick={handleSignUp} disabled={loading} style={{ flex:1, background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading ? 0.6 : 1 }}>Sign Up</button>
            </div>
            <button onClick={onClose} style={{ width:'100%', background:'none', border:'none', color:'var(--muted)', fontFamily:'Mitr,sans-serif', fontSize:13, cursor:'pointer', marginTop:10, padding:6 }}>ข้ามไปก่อน (guest mode)</button>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>ลืมรหัสผ่าน</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>กรอก email ที่ใช้สมัคร เราจะส่งลิงก์ไปให้ตั้งรหัสผ่านใหม่</div>
            <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            <div style={{ fontSize:12, color:msgColor, marginBottom:8, minHeight:18 }}>{msg}</div>
            <button onClick={handleSendReset} disabled={loading} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading ? 0.6 : 1, marginBottom:8 }}>
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </button>
            <button onClick={resetToLoginMode} style={{ width:'100%', background:'none', border:'none', color:'var(--muted)', fontFamily:'Mitr,sans-serif', fontSize:13, cursor:'pointer', padding:6 }}>
              ← กลับไปหน้า login
            </button>
          </>
        )}

        {mode === 'sent' && (
          <>
            <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>📧</div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--text)', textAlign:'center', marginBottom:8 }}>ส่งอีเมลแล้ว!</div>
            <div style={{ fontSize:13, color:'var(--muted)', textAlign:'center', marginBottom:18 }}>
              เช็คอีเมล <b>{email}</b> แล้วกดลิงก์เพื่อตั้งรหัสผ่านใหม่
            </div>
            <button onClick={() => { resetToLoginMode(); onClose(); }} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer' }}>
              ปิดหน้านี้
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
