import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAppState } from '../context/StateContext.jsx'
import { ACTIONS } from '../context/StateContext.jsx'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import BattleScreen from './BattleScreen.jsx'

function EggCard({ egg, isSelected, onSelect }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (canvasRef.current) drawCreature(canvasRef.current, getCreatureSeed(egg), egg.eggStats || {})
  }, [egg])
  const s = egg.stats || {}
  return (
    <div
      onClick={() => onSelect(egg)}
      style={{
        background: isSelected ? 'var(--purple-l)' : 'var(--card)',
        border: `2px solid ${isSelected ? 'var(--purple)' : 'var(--border)'}`,
        borderRadius:14, padding:12, cursor:'pointer', display:'flex', alignItems:'center', gap:12,
        transition:'all .2s ease',
      }}
    >
      <canvas ref={canvasRef} width={56} height={56} style={{ borderRadius:8, background:'var(--bg)', flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--text)', marginBottom:2 }}>{egg.creature?.n || 'สัตว์'}</div>
        <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{egg.grade} · {egg.stats?.tierName || ''}</div>
        <div style={{ display:'flex', gap:8, fontSize:11 }}>
          <span style={{ color:'#E24B4A' }}>⚔️{s.ATK||0}</span>
          <span style={{ color:'#378ADD' }}>🛡️{s.DEF||0}</span>
          <span style={{ color:'#1D9E75' }}>⚡{s.SPD||0}</span>
        </div>
      </div>
      {isSelected && <div style={{ fontSize:20 }}>✅</div>}
    </div>
  )
}

export default function ChallengerOverlay() {
  const { state, dispatch } = useAppState()
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState('toast') // toast | eggSelect | battle
  const [selectedEgg, setSelectedEgg] = useState(null)

  const challenger = state.pendingChallenger

  // Show toast whenever a new challenger appears
  useEffect(() => {
    if (challenger) setVisible(true)
  }, [challenger])

  if (!challenger || !visible) return null

  if (phase === 'battle' && selectedEgg) {
    return (
      <BattleScreen
        egg={selectedEgg}
        opponent={challenger}
        opponentType="normal"
        onClose={() => {
          setVisible(false)
          setPhase('toast')
          setSelectedEgg(null)
        }}
      />
    )
  }

  if (phase === 'eggSelect') {
    const eggs = (state.hatchedEggs || []).filter(e => e.stats)
    // Advice based on opponent stats
    let adviceStat = 'ATK'
    if (challenger.DEF >= 8) adviceStat = 'ATK'      // high DEF → need ATK
    if (challenger.ATK >= 10) adviceStat = 'DEF'     // high ATK → need DEF
    if (challenger.SPD >= 9) adviceStat = 'SPD'      // high SPD → match SPD
    const adviceText = {
      ATK: `${challenger.emoji} ${challenger.name} มี DEF สูง → เลือกไข่ที่ ATK สูง!`,
      DEF: `${challenger.emoji} ${challenger.name} มี ATK สูง → เลือกไข่ที่ DEF สูง!`,
      SPD: `${challenger.emoji} ${challenger.name} มี SPD สูง → เลือกไข่ที่ SPD สูง!`,
    }

    return createPortal(
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
        <div style={{ background:'var(--bg)', borderRadius:'20px 20px 0 0', padding:'20px 20px 32px', width:'100%', maxWidth:480, fontFamily:'Mitr,sans-serif', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
          <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }} />
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--text)', marginBottom:4 }}>เลือกไข่ที่จะสู้!</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>
            คู่ต่อสู้: {challenger.emoji} {challenger.name} · HP:{challenger.HP} ATK:{challenger.ATK} DEF:{challenger.DEF} SPD:{challenger.SPD}
          </div>
          <div style={{ background:'var(--amber-l)', borderRadius:10, padding:'8px 12px', marginBottom:12, fontSize:12, color:'var(--amber-d)' }}>
            💡 {adviceText[adviceStat]}
          </div>

          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
            {eggs.length === 0 && (
              <div style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>ยังไม่มีไข่ที่ฟักแล้ว<br/>เล่นเกมเพื่อฟักไข่ก่อนนะ!</div>
            )}
            {eggs.map((egg, i) => (
              <EggCard key={i} egg={egg} isSelected={selectedEgg === egg} onSelect={setSelectedEgg} />
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => { if (selectedEgg) setPhase('battle') }}
              disabled={!selectedEgg}
              style={{ flex:2, background: selectedEgg?'var(--purple)':'var(--border)', color: selectedEgg?'#fff':'var(--muted)', border:'none', borderRadius:12, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:700, cursor: selectedEgg?'pointer':'default' }}
            >
              ⚔️ สู้เลย!
            </button>
            <button
              onClick={() => setPhase('toast')}
              style={{ flex:1, background:'none', border:'1px solid var(--border)', borderRadius:12, padding:13, fontFamily:'Mitr,sans-serif', fontSize:13, color:'var(--muted)', cursor:'pointer' }}
            >
              ← กลับ
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Phase: toast (dramatic challenger notification)
  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(10,5,30,.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'linear-gradient(135deg,#1a0a3a,#3c1a6e)', borderRadius:24, padding:28, width:'100%', maxWidth:380, textAlign:'center', fontFamily:'Mitr,sans-serif', border:'2px solid rgba(255,255,255,.15)', boxShadow:'0 0 40px rgba(127,119,221,.4)' }}>
        {/* Dramatic header */}
        <div style={{ fontSize:11, letterSpacing:3, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase' }}>⚠️ ผู้ท้าทายโผล่มา!</div>

        <div style={{ fontSize:80, lineHeight:1, marginBottom:12, filter:'drop-shadow(0 0 20px rgba(255,100,100,.6))' }}>
          {challenger.emoji}
        </div>

        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'#fff', marginBottom:4 }}>
          {challenger.name}
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginBottom:20 }}>
          กำลังท้าทายคุณ!
        </div>

        {/* Opponent stats */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:24 }}>
          {[['⚔️',challenger.ATK,'ATK'],['🛡️',challenger.DEF,'DEF'],['⚡',challenger.SPD,'SPD']].map(([e,v,k])=>(
            <div key={k} style={{ textAlign:'center' }}>
              <div style={{ fontSize:18 }}>{e}</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#FFD700' }}>{v}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)' }}>{k}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPhase('eggSelect')}
          style={{ width:'100%', background:'linear-gradient(135deg,#7F77DD,#3C3489)', color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:10, boxShadow:'0 4px 20px rgba(127,119,221,.5)' }}
        >
          รับคำท้า! ⚔️
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{ width:'100%', background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.6)', border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'10px 0', fontFamily:'Mitr,sans-serif', fontSize:13, cursor:'pointer' }}
        >
          ไว้ทีหลัง (เก็บไว้รอ)
        </button>
      </div>
    </div>,
    document.body
  )
}
