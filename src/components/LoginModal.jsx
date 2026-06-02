import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase.js'

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgColor, setMsgColor] = useState('var(--red)')
  const [loading, setLoading] = useState(false)

  if (!open) return null

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

  return createPortal(
    <div className="auth-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-sheet">
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 18px' }} />
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>เข้าสู่ระบบ</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>login เพื่อ sync ข้อมูลข้ามอุปกรณ์ · ยังไม่ login ก็เล่นได้ปกติ</div>
        <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <input className="auth-input" type="password" placeholder="Password (อย่างน้อย 6 ตัว)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        <div style={{ fontSize:12, color:msgColor, marginBottom:8, minHeight:18 }}>{msg}</div>
        <div className="auth-btn-row">
          <button onClick={handleSignIn} disabled={loading} style={{ flex:1, background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading?.6:1 }}>Login</button>
          <button onClick={handleSignUp} disabled={loading} style={{ flex:1, background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading?.6:1 }}>Sign Up</button>
        </div>
        <button onClick={onClose} style={{ width:'100%', background:'none', border:'none', color:'var(--muted)', fontFamily:'Mitr,sans-serif', fontSize:13, cursor:'pointer', marginTop:10, padding:6 }}>ข้ามไปก่อน (guest mode)</button>
      </div>
    </div>,
    document.body
  )
}
