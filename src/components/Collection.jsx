import React, { useState, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import CreatureCanvas from './CreatureCanvas.jsx'
import { buildEggStats, eggProgress, EGG_STAGE_NAMES, STAGE_XP_NEEDED } from '../lib/eggAlgorithm.js'
import { buildLegacyPreviewDNA } from '../lib/creatureGenerator.js'
import CreatureDetailPopup from './CreatureDetailPopup.jsx'
import { playTone } from '../lib/audio.js'
import { CREATURE_ELEMENT_COLORS } from '../lib/creatureSystem.js'

const creatureName = (egg) => egg.creatureName || egg.creature?.n || 'สัตว์ลึกลับ'

export default function Collection() {
  const { state, dispatch, eggStatsData, eggProgressData } = useAppState()
  const [tab, setTab]         = useState('team')
  const [archiveTab, setArchiveTab] = useState('team')
  // selectedEgg holds { egg, dna } so the popup gets the exact same DNA the grid card used.
  const [selectedEgg, setSelectedEgg] = useState(null)
  const handleSelect = (egg, dna) => setSelectedEgg({ egg, dna })

  const partyCreatures   = useMemo(() =>
    (state.party || []).map(id => (state.hatchedEggs||[]).find(e => e.id === id)).filter(Boolean),
  [state.party, state.hatchedEggs])

  const vaultCreatures   = useMemo(() =>
    (state.hatchedEggs||[]).filter(e => !e.inParty),
  [state.hatchedEggs])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', height:'100%', overflowY:'auto', overflowX:'hidden', background:'var(--bg)', paddingBottom:80 }}>
      <div className="page-header">
        <div className="page-title">คอลเลกชัน</div>
      </div>
      <div className="coll-tabs" style={{ width:'100%', maxWidth:480 }}>
        <div className={`coll-tab${tab==='team'?' active':''}`} onClick={() => setTab('team')}>ทีม</div>
        <div className={`coll-tab${tab==='vault'?' active':''}`} onClick={() => setTab('vault')}>คลังสะสม</div>
        <div className={`coll-tab${tab==='hatched'?' active':''}`} onClick={() => setTab('hatched')}>ทั้งหมด</div>
        <div className={`coll-tab${tab==='current'?' active':''}`} onClick={() => setTab('current')}>กำลังฟัก</div>
      </div>
      <div className="egg-catalog">
        {tab === 'team' && (
          <PartyGrid
            partyCreatures={partyCreatures}
            partySlots={state.partySlots ?? 1}
            onSelect={handleSelect}
            onSetActive={(id) => { playTone('tap'); dispatch({ type: ACTIONS.SET_ACTIVE_CREATURE, payload: { creatureId: id } }) }}
          />
        )}
        {tab === 'vault' && (
          <VaultGrid
            vaultCreatures={vaultCreatures}
            partySlots={state.partySlots ?? 1}
            partyCount={partyCreatures.length}
            onSelect={handleSelect}
            onAddToParty={(id) => { playTone('tap'); dispatch({ type: ACTIONS.ADD_TO_PARTY, payload: { creatureId: id } }) }}
          />
        )}
        {tab === 'hatched' && (
          <HatchedGrid hatched={state.hatchedEggs||[]} onSelect={handleSelect} />
        )}
        {tab === 'current' && (
          <CurrentEgg state={state} eggStats={eggStatsData} progress={eggProgressData} />
        )}
      </div>
      {selectedEgg && (
        <CreatureDetailPopup
          egg={selectedEgg.egg}
          dna={selectedEgg.dna}
          onClose={() => { playTone('click'); setSelectedEgg(null) }}
        />
      )}
    </div>
  )
}

function CreatureCard({ egg, index, onSelect }) {
  // Deterministic preview DNA: real DNA if hatched post-Phase-2, generated preview for legacy.
  // Never persisted — memo recomputes only when [egg, index] identity changes.
  const dna = useMemo(() => {
    if (egg.dna) return egg.dna
    try { return buildLegacyPreviewDNA(egg, index) } catch (_) { return null }
  }, [egg, index])

  const rarityColors = { common:'#085041', uncommon:'#0C447C', rare:'#3C3489', epic:'#633806', legendary:'#C8C0F8' }
  const rarityBg    = { common:'#E1F5EE', uncommon:'#E6F1FB', rare:'#EEEDFE', epic:'#FAEEDA', legendary:'#1E1B3A' }
  const rar = egg.creature?.rarity || 'common'

  return (
    <div className="catalog-item catalog-item-lg" onClick={() => { playTone('cardOpen'); onSelect(egg, dna) }}>
      <div style={{ position:'relative', display:'inline-block' }}>
        <CreatureCanvas
          dna={dna}
          size={120}
          personality={dna?.personality}
          animationEnabled
          style={{ margin:'0 auto 8px' }}
        />
      </div>
      <div className="catalog-item-name">{creatureName(egg)}</div>
      <div className="catalog-item-sub">{egg.grade||'อนุบาล'} · {egg.date||'?'}</div>
      <div className="catalog-item-rarity" style={{ background:rarityBg[rar], color:rarityColors[rar] }}>{egg.creature?.rarityLabel||'Common'}</div>
    </div>
  )
}

function PartyGrid({ partyCreatures, partySlots, onSelect, onSetActive }) {
  if (partyCreatures.length === 0) return (
    <div className="catalog-empty">ยังไม่มี creature ในทีม<br/><span style={{ fontSize:12, color:'var(--muted)' }}>ฟักไข่แล้วเพิ่มในทีม!</span></div>
  )
  return (
    <>
      <div className="catalog-section-title">ทีมปัจจุบัน ({partyCreatures.length}/{partySlots})</div>
      <div className="catalog-grid catalog-grid-lg">
        {partyCreatures.map((egg, i) => {
          const dna = egg.dna ?? (() => { try { return buildLegacyPreviewDNA(egg, i) } catch { return null } })()
          const maxHP = egg.stats?.HP ?? 10
          const curHP = egg.currentHP ?? maxHP
          const pct   = Math.max(0, (curHP / maxHP) * 100)
          const elColor = egg.element ? CREATURE_ELEMENT_COLORS[egg.element] : null
          const isActive = i === 0
          return (
            <div key={egg.id || i} className="catalog-item catalog-item-lg" onClick={() => onSelect(egg, dna)}>
              {isActive && (
                <div style={{
                  fontFamily:'var(--font-pixel)', fontSize:7, color:'#FFD700',
                  marginBottom:2, letterSpacing:1,
                }}>★ ตัวหลัก</div>
              )}
              <CreatureCanvas dna={dna} size={90} animationEnabled personality={dna?.personality} style={{ margin:'0 auto 4px' }} />
              <div className="catalog-item-name" style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                {elColor && <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:elColor, flexShrink:0 }} />}
                {creatureName(egg)}
              </div>
              <div style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>
                Lv.{egg.battleLevel ?? 1}
              </div>
              <div style={{ width:'100%', background:'#000', border:'1px solid #333', height:5, marginBottom:2 }}>
                <div style={{
                  width:`${pct}%`, height:'100%',
                  background: pct > 50 ? '#4acd4a' : pct > 20 ? '#cdcd20' : '#cd2020',
                }} />
              </div>
              <div style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>
                HP {curHP}/{maxHP}
              </div>
              {!isActive && (
                <button
                  onClick={e => { e.stopPropagation(); onSetActive?.(egg.id) }}
                  style={{
                    padding:'3px 8px',
                    background:'#B8860B', border:'none', borderRadius:0,
                    color:'#fff', fontSize:10, fontFamily:'var(--font-thai)',
                    cursor:'pointer', boxShadow:'2px 2px 0 #000',
                  }}
                >
                  ★ ตั้งเป็นตัวหลัก
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function VaultGrid({ vaultCreatures, partySlots, partyCount, onSelect, onAddToParty }) {
  if (vaultCreatures.length === 0) return (
    <div className="catalog-empty">คลังว่างเปล่า<br/><span style={{ fontSize:12, color:'var(--muted)' }}>creature ทุกตัวอยู่ในทีมแล้ว!</span></div>
  )
  const canAddMore = partyCount < partySlots
  return (
    <>
      <div className="catalog-section-title">คลังสะสม ({vaultCreatures.length} ตัว)</div>
      <div className="catalog-grid catalog-grid-lg">
        {vaultCreatures.map((egg, i) => {
          const dna = egg.dna ?? (() => { try { return buildLegacyPreviewDNA(egg, i) } catch { return null } })()
          return (
            <div key={egg.id || i} className="catalog-item catalog-item-lg"
              style={{ opacity: egg.archived ? 0.55 : 1 }}
              onClick={() => onSelect(egg, dna)}
            >
              <CreatureCanvas dna={dna} size={90} animationEnabled={false} personality={dna?.personality} style={{ margin:'0 auto 4px' }} />
              <div className="catalog-item-name">{creatureName(egg)}</div>
              <div className="catalog-item-sub">Lv.{egg.battleLevel ?? 1}</div>
              {canAddMore && (
                <button
                  onClick={e => { e.stopPropagation(); onAddToParty(egg.id) }}
                  style={{
                    marginTop:6, padding:'4px 10px',
                    background:'var(--px-purple, #6644aa)',
                    border:'none', borderRadius:0,
                    color:'#fff', fontSize:10, fontFamily:'var(--font-thai)',
                    cursor:'pointer', boxShadow:'2px 2px 0 #000',
                  }}
                >
                  เพิ่มในทีม
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function HatchedGrid({ hatched, onSelect }) {
  if (!hatched.length) return (
    <div className="catalog-empty">ยังไม่มีไข่ที่ฟักแล้ว<br/><span style={{ fontSize:12, color:'var(--muted)' }}>เล่นเกมเพื่อฟักไข่ใบแรก!</span></div>
  )
  return (
    <>
      <div className="catalog-section-title">ไข่ที่ฟักแล้ว {hatched.length} ใบ</div>
      <div className="catalog-grid catalog-grid-lg">
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
        <div style={{ fontSize:11, color:'var(--muted)' }}>{stage >= 6 ? 'พร้อมฟักแล้ว!' : `${stageXP} / ${STAGE_XP_NEEDED} XP ถึง Stage ถัดไป`}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:'100%', marginTop:14 }}>
          <div className="eds" style={{ background:'var(--green-l)' }}><div className="eds-val" style={{ color:'var(--green-d)' }}>{state.xpThai||0}</div><div className="eds-lbl">XP ไทย</div></div>
          <div className="eds" style={{ background:'var(--blue-l)' }}><div className="eds-val" style={{ color:'var(--blue-d)' }}>{state.xpEng||0}</div><div className="eds-lbl">XP EN</div></div>
          <div className="eds" style={{ background:'var(--purple-l)' }}><div className="eds-val" style={{ color:'var(--purple-d)' }}>{state.xpMath||0}</div><div className="eds-lbl">XP Math</div></div>
        </div>
      </div>
    </div>
  )
}
