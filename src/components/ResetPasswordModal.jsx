import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase.js'

export default function ResetPasswordModal() {
  const [show, setShow] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgColor, setMsgColor] = useState('var(--red)')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setShow(true)
    })
    return () => data?.subscription?.unsubscribe()
  }, [])

  if (!show) return null

  const handleSetPassword = async () => {
    if (password.length < 6) { setMsg('Password ต้องมีอย่างน้อย 6 ตัว'); setMsgColor('var(--red)'); return }
    if (password !== confirmPassword) { setMsg('Password ไม่ตรงกัน'); setMsgColor('var(--red)'); return }
    setLoading(true); setMsg('กำลังบันทึก...')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setMsg('')
    } catch (e) {
      setMsg('บันทึกไม่สำเร็จ: ' + (e.message || 'ลองอีกครั้ง'))
      setMsgColor('var(--red)')
    } finally { setLoading(false) }
  }

  return createPortal(
    <div className="auth-overlay show">
      <div className="auth-sheet">
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 18px' }} />
        {!done ? (
          <>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>ตั้งรหัสผ่านใหม่</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>กรอกรหัสผ่านใหม่ของคุณ</div>
            <input className="auth-input" type="password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            <input className="auth-input" type="password" placeholder="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            <div style={{ fontSize:12, color:msgColor, marginBottom:8, minHeight:18 }}>{msg}</div>
            <button onClick={handleSetPassword} disabled={loading} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading ? 0.6 : 1 }}>
              บันทึกรหัสผ่านใหม่
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>✅</div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--text)', textAlign:'center', marginBottom:18 }}>เปลี่ยนรหัสผ่านสำเร็จ!</div>
            <button onClick={() => setShow(false)} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer' }}>
              ปิดหน้านี้
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
