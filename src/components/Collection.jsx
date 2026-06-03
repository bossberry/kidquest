import React, { useState, useRef, useEffect } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { buildEggStats, eggProgress, EGG_STAGE_NAMES, STAGE_XP_NEEDED } from '../lib/eggAlgorithm.js'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import CreatureDetailPopup from './CreatureDetailPopup.jsx'
export default function Collection() {
  const { state, eggStatsData, eggProgressData } = useAppState()
  const [tab, setTab] = useState('hatched')
  const [selectedEgg, setSelectedEgg] = useState(null)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', height:'100%', overflowY:'auto', overflowX:'hidden', background:'var(--bg)', paddingBottom:80 }}>
      <div className="page-header">
        <div className="page-title">🥚 คอลเลกชัน</div>
      </div>
      <div className="coll-tabs" style={{ width:'100%', maxWidth:480 }}>
        <div className={`coll-tab${tab==='hatched'?' active':''}`} onClick={() => setTab('hatched')}>ฟักแล้ว 🐣</div>
        <div className={`coll-tab${tab==='current'?' active':''}`} onClick={() => setTab('current')}>กำลังฟัก 🥚</div>
      </div>
      <div className="egg-catalog">
        {tab === 'hatched'
          ? <HatchedGrid hatched={state.hatchedEggs||[]} onSelect={setSelectedEgg} />
          : <CurrentEgg state={state} eggStats={eggStatsData} progress={eggProgressData} />
        }
      </div>
      {selectedEgg && <CreatureDetailPopup egg={selectedEgg} onClose={() => setSelectedEgg(null)} />}
    </div>
  )
}

function CreatureCard({ egg, index, onSelect }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (canvasRef.current) drawCreature(canvasRef.current, getCreatureSeed(egg), egg.eggStats || {})
  }, [egg])
  const rarityColors = {common:'#085041',uncommon:'#0C447C',rare:'#3C3489',epic:'#633806',legendary:'#C8C0F8'}
  const rarityBg = {common:'#E1F5EE',uncommon:'#E6F1FB',rare:'#EEEDFE',epic:'#FAEEDA',legendary:'#1E1B3A'}
  const rar = egg.creature?.rarity || 'common'
  return (
    <div className="catalog-item" onClick={() => onSelect(egg)}>
      <canvas ref={canvasRef} width={88} height={88} style={{ borderRadius:8, display:'block', margin:'0 auto 6px', background:'var(--bg)' }} />
      <div className="catalog-item-name">{egg.creature?.n || 'สัตว์ลึกลับ'}</div>
      <div className="catalog-item-sub">{egg.grade||'อนุบาล'} · {egg.date||'?'}</div>
      <div className="catalog-item-rarity" style={{ background:rarityBg[rar], color:rarityColors[rar] }}>{egg.creature?.rarityLabel||'Common'}</div>
    </div>
  )
}

function HatchedGrid({ hatched, onSelect }) {
  if (!hatched.length) return (
    <div className="catalog-empty">🥚<br/><br/>ยังไม่มีไข่ที่ฟักแล้ว<br/><span style={{ fontSize:12, color:'var(--muted)' }}>เล่นเกมเพื่อฟักไข่ใบแรก!</span></div>
  )
  return (
    <>
      <div className="catalog-section-title">ไข่ที่ฟักแล้ว {hatched.length} ใบ</div>
      <div className="catalog-grid">
        {hatched.map((egg, i) => <CreatureCard key={i} egg={egg} index={i} onSelect={onSelect} />)}
      </div>
    </>
  )
}

function CurrentEgg({ state, eggStats, progress }) {
  const { stage, stageXP, pct } = progress
  const readyToHatch = stage >= 6
  return (
    <div>
      <div className="catalog-section-title">ไข่ที่กำลังฟักอยู่</div>
      <div style={{ background:'var(--card)', border:'0.5px solid var(--border)', borderRadius:16, padding:20, display:'flex', flexDirection:'column', alignItems:'center', marginBottom:16 }}>
        <EggCanvas stats={eggStats} width={140} height={168} style={{ borderRadius:12, marginBottom:12, cursor:'pointer', animation: readyToHatch ? 'eggShake .6s ease infinite' : 'eggHeartbeat 2s ease-in-out infinite' }} />
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--text)', marginBottom:4 }}>{EGG_STAGE_NAMES[stage]}</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>Stage {stage+1} / 7</div>
        <div style={{ width:'100%', background:'var(--border)', borderRadius:20, height:8, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:8, background:'var(--purple)', borderRadius:20, width:`${pct}%`, transition:'width .6s' }} />
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>{stage >= 6 ? '🐣 พร้อมฟักแล้ว!' : `${stageXP} / ${STAGE_XP_NEEDED} XP ถึง Stage ถัดไป`}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:'100%', marginTop:14 }}>
          <div className="eds" style={{ background:'var(--green-l)' }}><div className="eds-val" style={{ color:'var(--green-d)' }}>{state.xpThai||0}</div><div className="eds-lbl">XP ไทย</div></div>
          <div className="eds" style={{ background:'var(--blue-l)' }}><div className="eds-val" style={{ color:'var(--blue-d)' }}>{state.xpEng||0}</div><div className="eds-lbl">XP EN</div></div>
          <div className="eds" style={{ background:'var(--purple-l)' }}><div className="eds-val" style={{ color:'var(--purple-d)' }}>{state.xpMath||0}</div><div className="eds-lbl">XP Math</div></div>
        </div>
      </div>
    </div>
  )
}
