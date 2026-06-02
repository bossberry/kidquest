import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TEACH_CONTENT } from '../config/gameConfig.js'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'

export default function TeachOverlay({ world, levelId, onDone }) {
  const { dispatch } = useAppState()
  const tc = TEACH_CONTENT[world]?.[levelId]

  useEffect(() => {
    if (!tc) { onDone(); return }
    dispatch({ type: ACTIONS.SEEN_TEACH, payload: { key: `${world}-${levelId}` } })
  }, []) // eslint-disable-line

  if (!tc) return null

  return createPortal(
    <div className="teach-overlay show">
      <div className="teach-sheet">
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 14px' }} />
        <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>{tc.mascot}</div>
        <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.8, textAlign:'center', marginBottom:14, whiteSpace:'pre-line' }}>{tc.text}</div>
        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {tc.examples.map((ex, i) => <div key={i} className="teach-example">{ex}</div>)}
        </div>
        <button onClick={onDone} style={{ width:'100%', background:'var(--green)', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>เข้าใจแล้ว! →</button>
        <button onClick={onDone} style={{ width:'100%', background:'none', border:'none', color:'var(--muted)', fontFamily:'Mitr,sans-serif', fontSize:13, cursor:'pointer', marginTop:8, padding:6 }}>ข้ามไปก่อน</button>
      </div>
    </div>,
    document.body
  )
}
