import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { drawEgg } from '../lib/eggAlgorithm.js'

export default function CreatureDetailPopup({ egg, onClose }) {
  const creatureRef = useRef(null)
  const eggRef = useRef(null)

  useEffect(() => {
    if (creatureRef.current) drawCreature(creatureRef.current, getCreatureSeed(egg), egg.eggStats || {})
    if (eggRef.current && egg.eggStats) drawEgg(eggRef.current, egg.eggStats)
  }, [egg])

  const rarityColors = {common:'#085041',uncommon:'#0C447C',rare:'#3C3489',epic:'#633806',legendary:'#C8C0F8'}
  const rarityBg = {common:'#E1F5EE',uncommon:'#E6F1FB',rare:'#EEEDFE',epic:'#FAEEDA',legendary:'#1E1B3A'}
  const rar = egg.creature?.rarity || 'common'
  const xpT=egg.xpThai||0, xpE=egg.xpEng||0, xpM=egg.xpMath||0
  const xpMax = Math.max(xpT, xpE, xpM) || 1
  const s = egg.eggStats || {}
  const tSum = xpT + xpE + xpM || 1
  const abils = []
  if (xpT/tSum >= xpE/tSum && xpT/tSum >= xpM/tSum) abils.push('เชี่ยวชาญภาษาไทย ❤️')
  else if (xpE/tSum >= xpM/tSum) abils.push('พูดภาษาอังกฤษได้ 🌍')
  else abils.push('อัจฉริยะคณิตศาสตร์ 🔢')
  if (Math.max(xpT/tSum, xpE/tSum, xpM/tSum) < 0.45) abils.push('เก่งรอบด้าน ⭐')
  if ((s.streak||0) > 7) abils.push('นักสู้ไม่ยอมแพ้ 🔥')
  if ((s.acc||0) > 90) abils.push('แม่นยำเหมือนเลเซอร์ 🎯')

  return createPortal(
    <div className="creature-detail-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="creature-detail-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:10, background:rarityBg[rar], color:rarityColors[rar] }}>
            {egg.creature?.rarityLabel||'Common'} {'⭐'.repeat({common:1,uncommon:2,rare:3,epic:4,legendary:5}[rar]||1)}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' }}>✕</button>
        </div>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:16 }}>
          <canvas ref={creatureRef} width={120} height={120} style={{ borderRadius:14, flexShrink:0, background:'var(--bg)' }} />
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>{egg.creature?.n||'สัตว์ลึกลับ'}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>{egg.creature?.cat||''}{egg.creature?.f?' · '+egg.creature.f:''}</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>🗓️ {egg.date||'?'}</div>
            <canvas ref={eggRef} width={48} height={58} style={{ borderRadius:8, marginTop:8, display:'block' }} />
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>⚡ พลังของไข่ใบนี้</div>
        {[['📖 ภาษาไทย', xpT, 'var(--green)'], ['🔤 English', xpE, 'var(--blue)'], ['🔢 Math', xpM, 'var(--purple)']].map(([label, xp, color]) => (
          <div key={label} style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:3 }}><span>{label}</span><span>{xp} XP</span></div>
            <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:6, background:color, borderRadius:4, width:`${Math.round(xp/xpMax*100)}%` }} />
            </div>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, margin:'14px 0' }}>
          <div className="eds"><div className="eds-val">{s.streak||0}🔥</div><div className="eds-lbl">Streak</div></div>
          <div className="eds"><div className="eds-val">{s.acc||0}%</div><div className="eds-lbl">แม่นยำ</div></div>
          <div className="eds"><div className="eds-val">{Math.round(s.mins||0)}</div><div className="eds-lbl">นาที</div></div>
        </div>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>✨ ความสามารถพิเศษ</div>
        {abils.map(a => <div key={a} className="cd-ability">{a}</div>)}
      </div>
    </div>,
    document.body
  )
}
