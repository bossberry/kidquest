import React, { useState, useMemo, useRef } from 'react'
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
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef(null)

  if (partyCreatures.length === 0) return (
    <div className="catalog-empty">ยังไม่มี creature ในทีม<br/><span style={{ fontSize:12, color:'var(--muted)' }}>ฟักไข่แล้วเพิ่มในทีม!</span></div>
  )

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIdx(idx)
  }

  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column' }}>
      {/* Header with position indicator */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', marginBottom:8,
      }}>
        <div className="catalog-section-title" style={{ margin:0 }}>
          ทีมปัจจุบัน ({partyCreatures.length}/{partySlots})
        </div>
        {partyCreatures.length > 1 && (
          <div style={{ display:'flex', gap:4 }}>
            {partyCreatures.map((_, i) => (
              <div key={i} style={{
                width: i === activeIdx ? 18 : 6, height: 6,
                borderRadius: 3,
                background: i === activeIdx ? '#EF9F27' : 'rgba(255,255,255,0.2)',
                transition:'width 0.25s ease, background 0.25s ease',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Horizontal scroll-snap carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display:'flex',
          overflowX:'auto',
          scrollSnapType:'x mandatory',
          WebkitOverflowScrolling:'touch',
          width:'100%',
          scrollbarWidth:'none',
        }}
        className="carousel-scroll-hide-bar"
      >
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
              style={{
                flex:'0 0 100%',
                width:'100%',
                scrollSnapAlign:'start',
                boxSizing:'border-box',
                padding:'0 16px 24px',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
              }}
            >
              <div
                onClick={() => onSelect(egg, dna)}
                className="catalog-item catalog-item-lg"
                style={{
                  background: '#0f0f1a',
                  border: `2px solid ${isActive ? '#EF9F27' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 0,
                  padding: '20px 16px',
                  width: '100%',
                  maxWidth: 380,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 16px rgba(239,159,39,0.3)' : 'none',
                }}
              >
                {isActive && (
                  <div style={{
                    fontFamily:'var(--font-pixel)', fontSize:8,
                    color:'#EF9F27', marginBottom:6, letterSpacing:1,
                  }}>★ ตัวหลัก</div>
                )}
                <canvas
                  key={egg.id}
                  ref={r => { if (r) drawCreature(r, getCreatureSeed(egg), egg.eggStats ?? {}) }}
                  width={140} height={140}
                  style={{ imageRendering:'pixelated', display:'block', margin:'0 auto 8px' }}
                />
                <div style={{
                  fontFamily:'var(--font-thai)', fontSize:16,
                  color:'rgba(255,255,255,0.9)',
                  display:'flex', alignItems:'center', gap:6, justifyContent:'center',
                  marginBottom:4,
                }}>
                  {elColor && <span style={{ display:'inline-block', width:9, height:9, borderRadius:'50%', background:elColor, flexShrink:0 }} />}
                  {creatureName(egg)}
                </div>
                <div style={{ fontFamily:'var(--font-pixel)', fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:8 }}>
                  Lv.{egg.battleLevel ?? 1}
                </div>
                <div style={{ width:'100%', maxWidth:240, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', height:6, marginBottom:3 }}>
                  <div style={{
                    width:`${pct}%`, height:'100%',
                    background: pct > 50 ? '#4acd4a' : pct > 20 ? '#cdcd20' : '#cd2020',
                  }} />
                </div>
                <div style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:'rgba(255,255,255,0.3)', marginBottom:10 }}>
                  HP {curHP}/{maxHP}
                </div>
                {!isActive && (
                  <button
                    onClick={e => { e.stopPropagation(); onSetActive?.(egg.id) }}
                    style={{
                      padding:'5px 14px',
                      background:'transparent',
                      border:'1px solid #EF9F27',
                      borderRadius:0,
                      color:'#EF9F27',
                      fontSize:11, fontFamily:'var(--font-thai)',
                      cursor:'pointer',
                    }}
                  >
                    ตั้งเป็นตัวหลัก
                  </button>
                )}
                <CreatureJourney egg={egg} currentTier={currentTier ?? 0} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Swipe hint — only show if more than 1 creature */}
      {partyCreatures.length > 1 && (
        <div style={{
          textAlign:'center',
          fontFamily:'var(--font-thai)', fontSize:11,
          color:'rgba(255,255,255,0.25)',
          marginTop:4,
        }}>
          ← เลื่อนดูตัวอื่น →
        </div>
      )}
    </div>
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
  const evoIndex = EVO_ORDER[evo]

  const nextStep = evo === 'final' ? null : evo === 'teen' ? 'final' : 'teen'
  const nextReq  = nextStep ? req[nextStep] : null

  // Progress % = bottleneck stat (the one furthest from done drives the bar)
  let progressPct = 100
  let primaryLabel = ''
  let remainingText = ''
  if (nextStep === 'teen') {
    const levelPct = Math.min(100, (level / req.teen.minBattleLevel) * 100)
    const tierPct  = Math.min(100, (currentTier / req.teen.minTier) * 100)
    progressPct = Math.min(levelPct, tierPct)
    primaryLabel = 'กำลังมุ่งสู่ Teen'
    const levelsLeft = Math.max(0, req.teen.minBattleLevel - level)
    remainingText = levelsLeft > 0
      ? `เลเวล ${level}/${req.teen.minBattleLevel} · ตอบถูกอีก ~${levelsLeft * 8} ข้อ ก็เลื่อนขั้น!`
      : `รอเลื่อนชั้นเรียนถึง Tier ${req.teen.minTier} เพื่อวิวัฒนาการ!`
  } else if (nextStep === 'final') {
    const levelPct = Math.min(100, (level / req.final.minBattleLevel) * 100)
    const tierPct  = Math.min(100, (currentTier / req.final.minTier) * 100)
    const bondPct  = Math.min(100, (bond / req.final.minBond) * 100)
    progressPct = Math.min(levelPct, tierPct, bondPct)
    primaryLabel = 'กำลังมุ่งสู่ Final'
    const levelsLeft = Math.max(0, req.final.minBattleLevel - level)
    const bondLeft = Math.max(0, req.final.minBond - bond)
    if (levelsLeft > 0) remainingText = `เลเวล ${level}/${req.final.minBattleLevel} · ตอบถูกอีก ~${levelsLeft * 8} ข้อ!`
    else if (bondLeft > 0) remainingText = `ผูกพัน ${bond}/${req.final.minBond} · เล่นกับมันที่บ้านอีกหน่อย!`
    else remainingText = `รอเลื่อนชั้นเรียนถึง Tier ${req.final.minTier}!`
  }

  const stages = [
    { stage: 'baby',  emoji: '🥚', label: 'Baby'  },
    { stage: 'teen',  emoji: '🐉', label: 'Teen'  },
    { stage: 'final', emoji: '✨', label: 'Final' },
  ]

  const stageStatus = (idx) => idx < evoIndex ? 'done' : idx === evoIndex ? 'current' : 'locked'

  return (
    <div style={{
      marginTop: 10, padding: '14px 14px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)', width: '100%', boxSizing: 'border-box',
    }}>
      {/* 3-stage journey map */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 14 }}>
        {stages.map((s, i) => {
          const status = stageStatus(i)
          const isLast = i === stages.length - 1
          return (
            <React.Fragment key={s.stage}>
              <div style={{ flex: '0 0 auto', textAlign: 'center', width: status === 'current' ? 60 : 50 }}>
                <div style={{
                  width: status === 'current' ? 48 : 38,
                  height: status === 'current' ? 48 : 38,
                  borderRadius: '50%',
                  background: status === 'done' ? 'rgba(74,205,74,0.25)'
                    : status === 'current' ? 'rgba(239,159,39,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  border: status === 'current' ? '3px solid #EF9F27' : status === 'done' ? '2px solid #4acd4a' : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: status === 'current' ? 21 : 17,
                  margin: '0 auto 4px',
                  opacity: status === 'locked' ? 0.35 : 1,
                  filter: status === 'locked' ? 'grayscale(0.6)' : 'none',
                }}>
                  {s.emoji}
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: status === 'current' ? 9 : 8,
                  color: status === 'done' ? '#4acd4a' : status === 'current' ? '#EF9F27' : 'rgba(255,255,255,0.3)',
                }}>
                  {s.label}
                </div>
              </div>
              {!isLast && (
                <div style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i < evoIndex ? '#4acd4a' : i === evoIndex ? '#EF9F27' : 'rgba(255,255,255,0.08)',
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Animated progress bar for the next milestone */}
      {nextStep && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-thai)', fontWeight: 600, color: '#fff' }}>{primaryLabel}</span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{Math.round(progressPct)}%</span>
          </div>
          <div style={{
            position: 'relative', height: 22, background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #d97f1a, #EF9F27)',
              borderRadius: 6, transition: 'width 0.6s ease',
            }} />
            <div style={{
              position: 'absolute', left: `${progressPct}%`, top: '50%',
              transform: 'translate(-50%, -50%)', fontSize: 14, transition: 'left 0.6s ease',
            }}>
              {stages[evoIndex + 1]?.emoji}
            </div>
          </div>
          <div style={{
            textAlign: 'center', marginTop: 7, fontFamily: 'var(--font-thai)', fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
          }}>
            {remainingText}
          </div>
        </div>
      )}

      {!nextStep && (
        <div style={{
          textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12,
          fontFamily: 'var(--font-thai)', fontSize: 13, color: '#FFD700',
        }}>
          ✨ วิวัฒนาการครบขั้นสุดท้ายแล้ว! ✨
        </div>
      )}
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
