import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CreatureCanvas from './CreatureCanvas.jsx'
import { drawEgg } from '../lib/eggAlgorithm.js'
import { CREATURE_ELEMENT_COLORS, CREATURE_ELEMENT_NAMES_TH } from '../lib/creatureSystem.js'

const FAMILY_LABELS_TH = {
  puff:'พัฟฟ์', fluff:'ฟลัฟฟ์', bear:'หมี', cat:'แมว', fox:'สุนัขจิ้งจอก',
  bunny:'กระต่าย', bird:'นก', dragon:'มังกร', leaf:'ใบไม้', star:'ดาว',
  moon:'จันทรา', cloud:'เมฆ', crystal:'คริสตัล', ocean:'มหาสมุทร',
  flower:'ดอกไม้', dream:'ความฝัน',
}
const FAVSUBJ_TH = { thai:'ภาษาไทย', eng:'English', math:'คณิต' }
const FAVSUBJ_COLOR = { thai:'var(--green)', eng:'var(--blue)', math:'var(--purple)' }

// dna is passed in from Collection — exact same object the grid card used.
// No re-computation, no duplicate logic, guaranteed identical character.
export default function CreatureDetailPopup({ egg, dna, onClose }) {
  const eggRef = useRef(null)

  useEffect(() => {
    if (eggRef.current && egg.eggStats) drawEgg(eggRef.current, egg.eggStats)
  }, [egg])

  const rarityColors = { common:'#085041', uncommon:'#0C447C', rare:'#3C3489', epic:'#633806', legendary:'#C8C0F8' }
  const rarityBg    = { common:'#E1F5EE', uncommon:'#E6F1FB', rare:'#EEEDFE', epic:'#FAEEDA', legendary:'#1E1B3A' }
  const rar  = egg.creature?.rarity || 'common'
  const xpT  = egg.xpThai  || 0
  const xpE  = egg.xpEng   || 0
  const xpM  = egg.xpMath  || 0
  const xpMax = Math.max(xpT, xpE, xpM) || 1
  const s    = egg.eggStats || {}
  const tSum = xpT + xpE + xpM || 1

  // Friendship data
  const displayName = egg.creatureName || egg.creature?.n || 'สัตว์ลึกลับ'
  const bornDate = egg.bornDate || egg.date || null
  const daysTogether = bornDate ? Math.max(0, Math.floor((Date.now() - new Date(bornDate).getTime()) / 86400000)) : null
  const favSubj = xpT >= xpE && xpT >= xpM ? 'thai' : xpE >= xpM ? 'eng' : 'math'
  const adventuresWith = egg.adventuresWith || 0
  const questionsAnswered = egg.questionsAnswered || 0

  // Family + element from DNA
  const family = dna?.family || null
  const familyLabel = family ? FAMILY_LABELS_TH[family] : null
  const isMoonborn = family === 'moon'
  const elColor = egg.element ? CREATURE_ELEMENT_COLORS[egg.element] : null
  const elNameTH = egg.element ? CREATURE_ELEMENT_NAMES_TH[egg.element] : null

  const abils = []
  if      (xpT / tSum >= xpE / tSum && xpT / tSum >= xpM / tSum) abils.push('เชี่ยวชาญภาษาไทย')
  else if (xpE / tSum >= xpM / tSum)                              abils.push('พูดภาษาอังกฤษได้')
  else                                                             abils.push('อัจฉริยะคณิตศาสตร์')
  if (Math.max(xpT / tSum, xpE / tSum, xpM / tSum) < 0.45) abils.push('เก่งรอบด้าน')
  if ((s.streak || 0) > 7)  abils.push('นักสู้ไม่ยอมแพ้')
  if ((s.acc    || 0) > 90) abils.push('แม่นยำเหมือนเลเซอร์')

  return createPortal(
    <div className="creature-detail-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="creature-detail-card">

        {/* Header — rarity badge + (Moonborn) + close */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:10, background:rarityBg[rar], color:rarityColors[rar] }}>
              {egg.creature?.rarityLabel||'Common'}
            </div>
            {isMoonborn && (
              <div style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:10, background:'#1a1a3a', color:'#b8aff8' }}>
                Moonborn
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' }}>✕</button>
        </div>

        {/* Creature — large, centered, with element glow */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{
            position:'relative', display:'inline-block',
            filter: elColor ? `drop-shadow(0 0 10px ${elColor}88)` : undefined,
          }}>
            <CreatureCanvas
              dna={dna}
              size={196}
              personality={dna?.personality}
              animationEnabled
            />
          </div>
        </div>

        {/* Name + family badge + element badge */}
        <div style={{ textAlign:'center', marginBottom:12 }}>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'var(--text)', marginBottom:6 }}>
            {displayName}
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
            {familyLabel && (
              <div style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.08)', color:'var(--muted)', border:'1px solid rgba(255,255,255,0.15)' }}>
                ตระกูล{familyLabel}
              </div>
            )}
            {elColor && elNameTH && (
              <div style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:`${elColor}22`, color:elColor, border:`1px solid ${elColor}66`, fontWeight:600 }}>
                ธาตุ{elNameTH}
              </div>
            )}
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{egg.date||'?'}</div>
        </div>

        {/* Friendship stats */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:14, padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.08)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          {daysTogether !== null && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)' }}>{daysTogether}</div>
              <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'Mitr,sans-serif' }}>วันด้วยกัน</div>
            </div>
          )}
          {adventuresWith > 0 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)' }}>{adventuresWith}</div>
              <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'Mitr,sans-serif' }}>ผจญภัย</div>
            </div>
          )}
          {questionsAnswered > 0 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)' }}>{questionsAnswered}</div>
              <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'Mitr,sans-serif' }}>ข้อ</div>
            </div>
          )}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:FAVSUBJ_COLOR[favSubj], color:'#fff', fontFamily:'Mitr,sans-serif', fontWeight:600 }}>
              {FAVSUBJ_TH[favSubj]}
            </div>
            <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'Mitr,sans-serif', marginTop:2 }}>วิชาโปรด</div>
          </div>
        </div>

        {/* Egg mini + XP bars */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
          <canvas ref={eggRef} width={48} height={58} style={{ borderRadius:8, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>พลังของไข่ใบนี้</div>
            {[['ภาษาไทย', xpT, 'var(--green)'], ['English', xpE, 'var(--blue)'], ['Math', xpM, 'var(--purple)']].map(([label, xp, color]) => (
              <div key={label} style={{ marginBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:3 }}>
                  <span>{label}</span><span>{xp} XP</span>
                </div>
                <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:6, background:color, borderRadius:4, width:`${Math.round(xp / xpMax * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          <div className="eds"><div className="eds-val">{s.streak||0}</div><div className="eds-lbl">Streak</div></div>
          <div className="eds"><div className="eds-val">{s.acc||0}%</div><div className="eds-lbl">แม่นยำ</div></div>
          <div className="eds"><div className="eds-val">{Math.round(s.mins||0)}</div><div className="eds-lbl">นาที</div></div>
        </div>

        {/* Abilities */}
        <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>ความสามารถพิเศษ</div>
        {abils.map(a => <div key={a} className="cd-ability">{a}</div>)}

      </div>
    </div>,
    document.body
  )
}
