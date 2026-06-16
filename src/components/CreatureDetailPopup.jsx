import React from 'react'
import { createPortal } from 'react-dom'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { CREATURE_ELEMENT_COLORS, CREATURE_ELEMENT_NAMES_TH, EVO_STAGE_LABELS_TH } from '../lib/creatureSystem.js'

const FAMILY_LABELS_TH = {
  puff:'พัฟฟ์', fluff:'ฟลัฟฟ์', bear:'หมี', cat:'แมว', fox:'สุนัขจิ้งจอก',
  bunny:'กระต่าย', bird:'นก', dragon:'มังกร', leaf:'ใบไม้', star:'ดาว',
  moon:'จันทรา', cloud:'เมฆ', crystal:'คริสตัล', ocean:'มหาสมุทร',
  flower:'ดอกไม้', dream:'ความฝัน',
}
const FAVSUBJ_TH    = { thai:'ภาษาไทย', eng:'English', math:'คณิต' }
const FAVSUBJ_COLOR = { thai:'var(--green)', eng:'var(--blue)', math:'var(--purple)' }

export default function CreatureDetailPopup({ egg, dna, onClose }) {
  const rarityColors = { common:'#085041', uncommon:'#0C447C', rare:'#3C3489', epic:'#633806', legendary:'#C8C0F8' }
  const rarityBg    = { common:'#E1F5EE', uncommon:'#E6F1FB', rare:'#EEEDFE', epic:'#FAEEDA', legendary:'#1E1B3A' }
  const rar  = egg.creature?.rarity || 'common'
  const xpT  = egg.xpThai  || 0
  const xpE  = egg.xpEng   || 0
  const xpM  = egg.xpMath  || 0
  const xpMax = Math.max(xpT, xpE, xpM) || 1
  const tSum = xpT + xpE + xpM || 1

  const displayName = egg.creatureName || egg.creature?.n || 'สัตว์ลึกลับ'
  const bornDate    = egg.bornDate || egg.date || null
  const daysTogether = bornDate ? Math.max(0, Math.floor((Date.now() - new Date(bornDate).getTime()) / 86400000)) : null
  const favSubj      = xpT >= xpE && xpT >= xpM ? 'thai' : xpE >= xpM ? 'eng' : 'math'
  const adventuresWith   = egg.adventuresWith   || 0
  const questionsAnswered = egg.questionsAnswered || 0

  const family      = dna?.family || null
  const familyLabel = family ? FAMILY_LABELS_TH[family] : null
  const isMoonborn  = family === 'moon'
  const elColor     = egg.element ? CREATURE_ELEMENT_COLORS[egg.element] : null
  const elNameTH    = egg.element ? CREATURE_ELEMENT_NAMES_TH[egg.element] : null

  const evoStage    = egg.evoStage ?? 'baby'
  const evoLabel    = EVO_STAGE_LABELS_TH?.[evoStage] || evoStage
  const bondMeter   = egg.bondMeter ?? 0
  const st          = egg.stats || {}

  return createPortal(
    <div className="creature-detail-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="creature-detail-card">

        {/* Header — rarity + Moonborn + close */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:10, background:rarityBg[rar], color:rarityColors[rar] }}>
              {egg.creature?.rarityLabel || 'Common'}
            </div>
            {isMoonborn && (
              <div style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:10, background:'#1a1a3a', color:'#b8aff8' }}>
                Moonborn
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' }}>✕</button>
        </div>

        {/* Creature canvas — pixel art, transparent background, element glow */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{
            position:'relative', display:'inline-block',
            filter: elColor ? `drop-shadow(0 0 10px ${elColor}88)` : undefined,
          }}>
            <canvas
              ref={r => { if (r) drawCreature(r, getCreatureSeed(egg), { ...(egg.eggStats ?? egg.stats ?? {}), evoStage }) }}
              width={120} height={120}
              style={{ imageRendering:'pixelated', background:'transparent', display:'block', margin:'0 auto' }}
            />
          </div>
        </div>

        {/* Name + family + element badges */}
        <div style={{ textAlign:'center', marginBottom:10 }}>
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
          {/* Level + evo stage */}
          <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:4 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:'Mitr,sans-serif' }}>
              Lv.{egg.battleLevel ?? 1}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:'Mitr,sans-serif' }}>
              {evoLabel}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'Mitr,sans-serif' }}>
              {egg.date || '?'}
            </div>
          </div>
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

        {/* Battle stats: ATK / DEF / SPD / HP */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
          {[
            { label:'ATK', value: st.ATK ?? 0, color:'#ff6655' },
            { label:'DEF', value: st.DEF ?? 0, color:'#55aaff' },
            { label:'SPD', value: st.SPD ?? 0, color:'#aaff55' },
            { label:'HP',  value: st.HP  ?? 0, color:'#ff88aa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="eds">
              <div className="eds-val" style={{ color }}>{value}</div>
              <div className="eds-lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* Bond meter */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:4, fontFamily:'Mitr,sans-serif' }}>
            <span>ความผูกพัน</span>
            <span>{bondMeter}/100</span>
          </div>
          <div style={{ height:7, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:7, background:'#f0c040', borderRadius:4, width:`${bondMeter}%`, transition:'width .4s' }} />
          </div>
        </div>

        {/* Born stats — origin XP from learning */}
        <div style={{ marginBottom:6 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8, fontFamily:'Mitr,sans-serif' }}>ต้นกำเนิด</div>
          {[['ภาษาไทย', xpT, 'var(--green)'], ['English', xpE, 'var(--blue)'], ['Math', xpM, 'var(--purple)']].map(([label, xp, color]) => (
            <div key={label} style={{ marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:3, fontFamily:'Mitr,sans-serif' }}>
                <span>{label}</span><span>{xp} XP</span>
              </div>
              <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:6, background:color, borderRadius:4, width:`${Math.round(xp / xpMax * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>,
    document.body
  )
}
