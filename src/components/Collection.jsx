import React, { useState, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { buildLegacyPreviewDNA } from '../lib/creatureGenerator.js'
import { drawItem } from '../lib/itemArt.js'
import CreatureDetailPopup from './CreatureDetailPopup.jsx'
import { playTone } from '../lib/audio.js'
import { CREATURE_ELEMENT_COLORS } from '../lib/creatureSystem.js'
import { PROGRESSION_MAP } from '../config/gameConfig.js'

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
      <div style={{
        fontFamily:'var(--font-pixel)', fontSize:10,
        color:'#EF9F27', letterSpacing:3,
        padding:'14px 20px 10px',
        borderBottom:'2px solid rgba(255,255,255,0.08)',
        width:'100%', boxSizing:'border-box',
      }}>
        COLLECTION
      </div>
      <div className="coll-tabs" style={{ width:'100%', maxWidth:480 }}>
        <div
          className="coll-tab"
          onClick={() => setTab('team')}
          style={{
            color: tab==='team' ? '#EF9F27' : 'rgba(255,255,255,0.35)',
            borderBottom: tab==='team' ? '2px solid #EF9F27' : '2px solid transparent',
            background: 'transparent',
          }}
        >ทีม</div>
        <div
          className="coll-tab"
          onClick={() => setTab('items')}
          style={{
            color: tab==='items' ? '#EF9F27' : 'rgba(255,255,255,0.35)',
            borderBottom: tab==='items' ? '2px solid #EF9F27' : '2px solid transparent',
            background: 'transparent',
          }}
        >กระเป๋า</div>
      </div>
      <div className="egg-catalog">
        {tab === 'team' && (
          <PartyGrid
            partyCreatures={partyCreatures}
            partySlots={state.partySlots ?? 1}
            currentTier={state.grade ?? 0}
            subjectLevels={state.subjectLevels}
            subjectSessionStreak={state.subjectSessionStreak}
            levelMastery={state.levelMastery}
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

function PartyGrid({ partyCreatures, partySlots, currentTier, subjectLevels, subjectSessionStreak, levelMastery, onSelect, onSetActive }) {
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
            <div
              key={egg.id || i}
              className="catalog-item catalog-item-lg"
              onClick={() => onSelect(egg, dna)}
              style={{
                background: '#0f0f1a',
                border: `2px solid ${isActive ? '#EF9F27' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 0,
                padding: '14px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 12px rgba(239,159,39,0.3)' : 'none',
              }}
            >
              {isActive && (
                <div style={{
                  fontFamily:'var(--font-pixel)', fontSize:7,
                  color:'#EF9F27', marginBottom:4, letterSpacing:1,
                }}>★ ตัวหลัก</div>
              )}
              <canvas
                key={egg.id}
                ref={r => { if (r) drawCreature(r, getCreatureSeed(egg), egg.eggStats ?? {}) }}
                width={90} height={90}
                style={{ imageRendering:'pixelated', display:'block', margin:'0 auto 4px' }}
              />
              <div style={{
                fontFamily:'var(--font-thai)', fontSize:13,
                color:'rgba(255,255,255,0.9)',
                display:'flex', alignItems:'center', gap:4, justifyContent:'center',
                marginBottom:2,
              }}>
                {elColor && <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:elColor, flexShrink:0 }} />}
                {creatureName(egg)}
              </div>
              <div style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>
                Lv.{egg.battleLevel ?? 1}
              </div>
              <div style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', height:5, marginBottom:2 }}>
                <div style={{
                  width:`${pct}%`, height:'100%',
                  background: pct > 50 ? '#4acd4a' : pct > 20 ? '#cdcd20' : '#cd2020',
                }} />
              </div>
              <div style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>
                HP {curHP}/{maxHP}
              </div>
              {!isActive && (
                <button
                  onClick={e => { e.stopPropagation(); onSetActive?.(egg.id) }}
                  style={{
                    padding:'4px 10px',
                    background:'transparent',
                    border:'1px solid #EF9F27',
                    borderRadius:0,
                    color:'#EF9F27',
                    fontSize:10, fontFamily:'var(--font-thai)',
                    cursor:'pointer',
                  }}
                >
                  ตั้งเป็นตัวหลัก
                </button>
              )}
              <CreatureJourney egg={egg} currentTier={currentTier ?? 0} />
              <SubjectLevelProgress
                subjectLevels={subjectLevels}
                subjectSessionStreak={subjectSessionStreak}
                levelMastery={levelMastery}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}

const SUBJECT_CONFIG = {
  thai: { label:'ไทย',  color:'#E24B4A', icon:'ก' },
  math: { label:'คณิต', color:'#378ADD', icon:'#' },
  eng:  { label:'Eng',  color:'#EF9F27', icon:'A' },
}
const SUBJECT_MAX_LEVELS = { thai:5, math:8, eng:4 }
const LEVEL_GRADE_LABELS = {
  thai: { 1:'อนุบาล', 2:'อนุบาล', 3:'ป.1', 4:'ป.1-2', 5:'ป.2' },
  math: { 1:'อนุบาล', 2:'ป.1', 3:'ป.1', 4:'ป.1-2', 5:'ป.2', 6:'ป.2-3', 7:'ป.2', 8:'ป.1-2' },
  eng:  { 1:'อนุบาล', 2:'ป.1', 3:'ป.1-2', 4:'ป.2-3' },
}

function SubjectLevelProgress({ subjectLevels, subjectSessionStreak, levelMastery }) {
  return (
    <div style={{
      width:'100%', marginTop:10,
      padding:'8px 10px',
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        fontFamily:'var(--font-pixel)', fontSize:7,
        color:'rgba(255,255,255,0.25)', marginBottom:8, letterSpacing:1,
      }}>
        LEVEL UP
      </div>
      {['thai','math','eng'].map(sub => {
        const cfg    = SUBJECT_CONFIG[sub]
        const level  = subjectLevels?.[sub] ?? 1
        const maxLv  = SUBJECT_MAX_LEVELS[sub]
        const streak = subjectSessionStreak?.[sub] ?? 0
        const mastery = levelMastery?.[sub]?.[String(level)] ?? 0
        const grade  = LEVEL_GRADE_LABELS[sub]?.[level] ?? ''
        const streakNeeded = 3
        return (
          <div key={sub} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <div style={{
                width:18, height:18,
                background: cfg.color + '33',
                border: `1px solid ${cfg.color}66`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-pixel)', fontSize:8,
                color: cfg.color, flexShrink:0,
              }}>
                {cfg.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:'rgba(255,255,255,0.7)' }}>
                  {cfg.label} Lv.{level}
                  {level >= maxLv && <span style={{ color:'#44ee44', marginLeft:4 }}>MAX</span>}
                </div>
                <div style={{ fontFamily:'var(--font-thai)', fontSize:9, color:'rgba(255,255,255,0.3)' }}>
                  {grade}
                </div>
              </div>
              {level < maxLv && (
                <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                  {Array.from({ length: streakNeeded }, (_, i) => (
                    <div key={i} style={{
                      width:6, height:6, borderRadius:'50%',
                      background: i < streak ? cfg.color : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${i < streak ? cfg.color : 'rgba(255,255,255,0.15)'}`,
                      boxShadow: i < streak ? `0 0 4px ${cfg.color}` : 'none',
                    }} />
                  ))}
                  <div style={{ fontFamily:'var(--font-pixel)', fontSize:6, color:'rgba(255,255,255,0.2)', marginLeft:2 }}>
                    {streak}/{streakNeeded}
                  </div>
                </div>
              )}
            </div>
            {level < maxLv && (
              <div style={{ paddingLeft:24 }}>
                <div style={{ height:4, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{
                    height:'100%',
                    width:`${Math.min(100, mastery * 100)}%`,
                    background: mastery >= 0.8 ? '#44ee44' : cfg.color,
                    transition:'width 0.5s ease',
                  }} />
                </div>
                <div style={{
                  fontFamily:'var(--font-pixel)', fontSize:6,
                  color:'rgba(255,255,255,0.2)', marginTop:2,
                  display:'flex', justifyContent:'space-between',
                }}>
                  <span>Mastery {Math.round(mastery * 100)}%</span>
                  {streak >= streakNeeded
                    ? <span style={{ color:'#44ee44' }}>LEVEL UP! ⬆️</span>
                    : <span>ต้องการ {streakNeeded} strong ติดกัน</span>
                  }
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CreatureJourney({ egg, currentTier }) {
  const evo   = egg.evoStage ?? 'baby'
  const level = egg.battleLevel ?? 1
  const bond  = egg.bondMeter ?? 0
  const req   = PROGRESSION_MAP.evoRequirements
  const EVO_ORDER = { baby: 0, teen: 1, final: 2 }

  const steps = [
    {
      id: 'teen',
      label: 'วิวัฒนาการ → Teen',
      done: EVO_ORDER[evo] >= 1,
      ready: level >= req.teen.minBattleLevel && currentTier >= req.teen.minTier,
      needs: [
        level < req.teen.minBattleLevel && `Lv ${level}/${req.teen.minBattleLevel}`,
        currentTier < req.teen.minTier  && `Tier ${currentTier}/${req.teen.minTier}`,
      ].filter(Boolean),
    },
    {
      id: 'final',
      label: 'วิวัฒนาการ → Final',
      done: evo === 'final',
      ready: level >= req.final.minBattleLevel && currentTier >= req.final.minTier && bond >= req.final.minBond,
      needs: [
        level < req.final.minBattleLevel && `Lv ${level}/${req.final.minBattleLevel}`,
        currentTier < req.final.minTier  && `Tier ${currentTier}/${req.final.minTier}`,
        bond < req.final.minBond         && `Bond ${bond}/${req.final.minBond}`,
      ].filter(Boolean),
    },
  ]

  return (
    <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', width:'100%' }}>
      <div style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'rgba(255,255,255,0.25)', marginBottom:6, letterSpacing:1 }}>
        JOURNEY AHEAD
      </div>
      {steps.map(step => (
        <div key={step.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <div style={{
            fontSize:11,
            color: step.done ? '#44ee44' : step.ready ? '#EF9F27' : 'rgba(255,255,255,0.2)',
          }}>{step.done ? '✅' : step.ready ? '⚡' : '○'}</div>
          <div style={{
            flex:1, fontFamily:'var(--font-thai)', fontSize:10,
            color: step.done ? '#44ee44' : step.ready ? '#EF9F27' : 'rgba(255,255,255,0.4)',
          }}>
            {step.label}
          </div>
          {!step.done && step.needs.length > 0 && (
            <div style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'rgba(255,100,100,0.5)', textAlign:'right' }}>
              {step.needs.join(' · ')}
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'flex-end', justifyContent:'center' }}>
        {[
          { stage:'baby',  label:'Baby',  scale:0.6 },
          { stage:'teen',  label:'Teen',  scale:0.8 },
          { stage:'final', label:'Final', scale:1.0 },
        ].map(({ stage, label, scale }) => {
          const isDone    = EVO_ORDER[evo] > EVO_ORDER[stage]
          const isCurrent = evo === stage
          const isFuture  = EVO_ORDER[evo] < EVO_ORDER[stage]
          const size = Math.round(48 * scale)
          return (
            <div key={stage} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              opacity: isFuture ? 0.3 : 1,
              position:'relative',
            }}>
              {isCurrent && (
                <div style={{ fontFamily:'var(--font-pixel)', fontSize:6, color:'#EF9F27', marginBottom:2 }}>NOW</div>
              )}
              {isDone && (
                <div style={{ fontFamily:'var(--font-pixel)', fontSize:6, color:'#44ee44', marginBottom:2 }}>✓</div>
              )}
              <canvas
                ref={r => { if (r) drawCreature(r, getCreatureSeed({ ...egg, evoStage: stage }), { ...(egg.eggStats ?? {}), evoStage: stage }) }}
                width={size} height={size}
                style={{
                  imageRendering:'pixelated',
                  filter: isFuture ? 'grayscale(1) brightness(0.4)' : isCurrent ? 'drop-shadow(0 0 4px #EF9F27)' : 'none',
                  border: isCurrent ? '1px solid #EF9F27' : '1px solid rgba(255,255,255,0.08)',
                }}
              />
              <div style={{
                fontFamily:'var(--font-pixel)', fontSize:6,
                color: isCurrent ? '#EF9F27' : isDone ? '#44ee44' : 'rgba(255,255,255,0.2)',
              }}>
                {label.toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const HOME_ITEM_DEFS = [
  { key:'food',         label:'น่องไก่',   effect:'HP+100',  color:'#8B4513' },
  { key:'ribbon',       label:'ริบบิ้น',   effect:'SPD+10',  color:'#FF1493' },
  { key:'shoes',        label:'รองเท้า',   effect:'วิ่ง×4',  color:'#EF9F27' },
  { key:'rainbow_star', label:'ดาวสีรุ้ง', effect:'ล่องหนจากมอนสเตอร์ตาม', color:'#FF88FF' },
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
