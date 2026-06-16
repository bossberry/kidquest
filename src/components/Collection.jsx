import React, { useState, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { buildLegacyPreviewDNA } from '../lib/creatureGenerator.js'
import { drawItem } from '../lib/itemArt.js'
import CreatureDetailPopup from './CreatureDetailPopup.jsx'
import { playTone } from '../lib/audio.js'
import { CREATURE_ELEMENT_COLORS } from '../lib/creatureSystem.js'

const creatureName = (egg) => egg.creatureName || egg.creature?.n || 'สัตว์ลึกลับ'

export default function Collection() {
  const { state, dispatch } = useAppState()
  const [tab, setTab]         = useState('team')
  const [selectedEgg, setSelectedEgg] = useState(null)
  const handleSelect = (egg, dna) => setSelectedEgg({ egg, dna })

  const partyCreatures = useMemo(() =>
    (state.party || []).map(id => (state.hatchedEggs||[]).find(e => e.id === id)).filter(Boolean),
  [state.party, state.hatchedEggs])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', height:'100%', overflowY:'auto', overflowX:'hidden', background:'var(--px-darkest, #0a0a12)', paddingBottom:80 }}>
      <div style={{ fontFamily:'var(--font-pixel)', fontSize:11, color:'var(--px-yellow)', letterSpacing:2, padding:'14px 20px 8px', borderBottom:'2px solid var(--px-border)', width:'100%', boxSizing:'border-box' }}>
        COLLECTION
      </div>
      <div className="coll-tabs" style={{ width:'100%', maxWidth:480 }}>
        <div className={`coll-tab${tab==='team'?' active':''}`} onClick={() => setTab('team')}>ทีม</div>
        <div className={`coll-tab${tab==='items'?' active':''}`} onClick={() => setTab('items')}>กระเป๋า</div>
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
        {tab === 'items' && <ItemBag homeItems={state.homeItems} battleItems={state.battleItems} />}
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
              <canvas
                key={egg.id}
                ref={r => { if (r) drawCreature(r, getCreatureSeed(egg), egg.eggStats ?? {}) }}
                width={90} height={90}
                style={{ imageRendering:'pixelated', display:'block', margin:'0 auto 4px', borderRadius:4 }}
              />
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

const HOME_ITEM_DEFS = [
  { key:'food',         label:'น่องไก่',   effect:'HP+100',  color:'#8B4513' },
  { key:'ribbon',       label:'ริบบิ้น',   effect:'SPD+10',  color:'#FF1493' },
  { key:'shoes',        label:'รองเท้า',   effect:'วิ่ง×2',  color:'#EF9F27' },
  { key:'rainbow_star', label:'ดาวสีรุ้ง', effect:'ซูปเปอร์!', color:'#FF88FF' },
]

const BATTLE_ITEM_DEFS = [
  { key:'scroll',  label:'คาถา',    effect:'ATK+30 (1ยก)', color:'#9B59B6' },
  { key:'thunder', label:'พลังฟ้า', effect:'ATK+20',       color:'#EF9F27' },
  { key:'gem',     label:'เพชร',    effect:'DEF+20',       color:'#00BFFF' },
  { key:'mirror',  label:'กระจก',   effect:'สะท้อน',       color:'#C0C0C0' },
  { key:'clover',  label:'โคลเวอร์',effect:'โชค+15%',      color:'#2ECC71' },
]

function ItemSlot({ def, count }) {
  const { key, label, effect, color } = def
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      padding:8,
      background: count > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)',
      border: `1px solid ${count > 0 ? color + '44' : 'rgba(255,255,255,0.08)'}`,
      opacity: count > 0 ? 1 : 0.4,
      position:'relative',
    }}>
      <canvas
        ref={r => r && drawItem(r, key)}
        width={40} height={40}
        style={{ imageRendering:'pixelated' }}
      />
      {count > 0 && (
        <div style={{
          position:'absolute', top:2, right:4,
          fontFamily:'var(--font-pixel)', fontSize:8,
          color:'#fff', background:'rgba(0,0,0,0.7)',
          padding:'0 3px',
        }}>
          ×{count}
        </div>
      )}
      <div style={{ fontFamily:'var(--font-thai)', fontSize:9, color: count > 0 ? '#fff' : 'rgba(255,255,255,0.3)', textAlign:'center' }}>
        {label}
      </div>
      <div style={{ fontFamily:'var(--font-pixel)', fontSize:7, color: color + 'aa', textAlign:'center' }}>
        {effect}
      </div>
    </div>
  )
}

function ItemBag({ homeItems, battleItems }) {
  const total = [
    ...Object.values(homeItems ?? {}),
    ...Object.values(battleItems ?? {}),
  ].reduce((s, v) => s + (v || 0), 0)
  return (
    <div style={{ padding:'12px 16px' }}>
      <div style={{ fontFamily:'var(--font-pixel)', fontSize:9, color:'rgba(255,255,255,0.5)', marginBottom:12, letterSpacing:1 }}>
        ITEMS — {total} ชิ้น
      </div>

      <div style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:'#aaa', letterSpacing:1, marginBottom:6 }}>
        ไอเทมดูแลครีเอเจอร์
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
        {HOME_ITEM_DEFS.map(def => (
          <ItemSlot key={def.key} def={def} count={homeItems?.[def.key] ?? 0} />
        ))}
      </div>

      <div style={{ height:1, background:'rgba(255,255,255,0.1)', marginBottom:14 }} />

      <div style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:'#aaa', letterSpacing:1, marginBottom:6 }}>
        ไอเทมในการสู้
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {BATTLE_ITEM_DEFS.map(def => (
          <ItemSlot key={def.key} def={def} count={battleItems?.[def.key] ?? 0} />
        ))}
      </div>
    </div>
  )
}
