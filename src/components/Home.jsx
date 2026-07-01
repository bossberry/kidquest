// Home.jsx — main hub (redesigned 2026-07-01):
//   header (avatar · stage · name | 🔥streak · 🪙coins · 🔊) → status bar (HP · XP · Bond)
//   → full-bleed DecoratedRoom (companion egg walks/idles/jumps inside) with a floating Lv pill + tap-to-pet
//   → minigame shortcut card → item tray → explore button.
// BottomNav is rendered by App.jsx (not here). DecoratedRoom internals untouched.
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import DecoratedRoom from './DecoratedRoom.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { playTone, playBGM, stopBGM, playSFX, playCreatureSound } from '../lib/audio.js'
import { drawItem } from '../lib/itemArt.js'
import { HOME_ITEMS } from '../config/itemConfig.js'
import { supabase } from '../lib/supabase.js'
import { useHomeAmbience } from '../hooks/useHomeAmbience.js'
import { useCreatureInteraction } from '../hooks/useCreatureInteraction.js'
import { useHomeInteractions } from '../hooks/useHomeInteractions.js'

// Map egg XP stage (0–8) to companion aura level (0–4) — used by the small header avatar.
function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}

const ITEM_DEFS = [
  { key:'food',         label:'น่องไก่',   effect:'HP+100' },
  { key:'ribbon',       label:'ริบบิ้น',   effect:'SPD+10' },
  { key:'shoes',        label:'รองเท้า',   effect:'วิ่ง×4' },
  { key:'rainbow_star', label:'ดาวสีรุ้ง', effect:'ล่องหนจากมอนสเตอร์ตาม' },
]

// Accent colors
const C_COIN   = '#FFD23F'
const C_STREAK = '#FF6B35'
const C_BOND   = '#9B5DE5'

export default function Home({ navigate, soundOn, toggleSound, onOpenLogin, onOpenProfile }) {
  const { state, dispatch, eggProgressData } = useAppState()
  const { resolved } = useCompanion()

  const [activeItem, setActiveItem]       = useState(null)
  const [particles, setParticles]         = useState([])
  const [flyingItem, setFlyingItem]       = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data?.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session))
    return () => subscription.unsubscribe()
  }, [])
  const [creatureBounce, setCreatureBounce] = useState(false)
  const [bondReaction, setBondReaction]     = useState(null) // floating emoji reaction over egg zone
  const [healFloat, setHealFloat]         = useState(null)  // null | id

  const initVisitRef    = useRef(state.lastHomeVisit)

  const { stage } = eggProgressData
  const eggsHatched       = (state.hatchedEggs || []).length
  // Voice profile derived from companion element + gender (replaces creature DNA voice)
  const voiceProfile = useMemo(() => {
    const pitchMap = { fire:1.3, water:0.85, thunder:1.5, nature:1.0, shadow:0.7, light:1.2 }
    return {
      pitchBase:     pitchMap[resolved.element] ?? 1.0,
      pitchVariance: resolved.gender === 'female' ? 0.07 : 0.12,
      soundFamily:   'chirp',
      soundSpeed:    1.0,
    }
  }, [resolved.element, resolved.gender])

  const activeEgg = (state.hatchedEggs ?? []).find(e => e.id === state.party?.[0]) ?? state.hatchedEggs?.[0]

  const readyToHatch      = state.readyToHatch && (state.hatchedEggs?.length ?? 0) === 0

  useEffect(() => {
    playBGM('home')
    return () => stopBGM()
  }, [])

  const {
    eggAnim, setEggAnim, idleAnim, setIdleAnim, eggGlow, setGlow,
    smRef, comboResetRef, enterState, extendState,
  } = useCreatureInteraction(stage)

  const {
    spawnParticles, handlePetEgg, handleTapItem, handleEggTap,
    handleCreatureTap, handleCreatureSwipe,
  } = useHomeInteractions({
    readyToHatch, eggsHatched, activeEgg,
    smRef, comboResetRef, enterState, extendState, setGlow,
    activeItem, setActiveItem,
    setFlyingItem, setHealFloat, setBondReaction, setCreatureBounce,
    setParticles,
  })

  const { ambientEvent, stageUp, growthBanner } = useHomeAmbience({
    stage,
    readyToHatch,
    eggAnim,
    setIdleAnim,
    spawnParticles,
    enterState,
    voiceProfile,
    initialLastHomeVisit: initVisitRef.current,
    sessionXP: state.sessionXP,
  })

  // ── Status bar values ──────────────────────────────────────────────────────
  const maxHP     = activeEgg?.stats?.HP ?? 100
  const currentHP = activeEgg?.currentHP ?? maxHP
  const hpPct     = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
  const xpPct     = Math.max(0, Math.min(100, eggProgressData.pct ?? 0))
  const bondPct   = Math.max(0, Math.min(100, activeEgg?.bondMeter ?? 0))

  const stageName = EGG_STAGE_NAMES[stage] || 'ไข่น้อย'
  const eggLevel  = activeEgg?.battleLevel ?? 1

  // Egg-zone tap: armed item → use it; else post-hatch adds bond (+reaction), pre-hatch pets / triggers hatch.
  const onEggZoneTap = (e) => {
    if (activeItem) { handleTapItem(activeItem); return }
    if (eggsHatched > 0) { handleCreatureTap(e); return }
    handleEggTap(e)
  }

  return (
    <div id="egg-home" style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      width:'100%', height:'100dvh', overflowX:'hidden', overflowY:'hidden',
    }}>

      {/* Flying food overlay */}
      {flyingItem && (
        <div key={`fly-${flyingItem.id}`} style={{
          position:'fixed', left:'50%', bottom:200,
          fontSize:30, pointerEvents:'none', zIndex:500,
          animation:'food-fly-up .58s cubic-bezier(.2,.8,.4,1) forwards',
        }}>
          <span style={{ fontFamily:'var(--font-thai)', fontSize:12, color:'#fff', fontWeight:700 }}>{flyingItem.label}</span>
        </div>
      )}

      {/* Ambient events — rare visual moments */}
      {ambientEvent?.type === 'butterfly' && (
        <div key={`amb-${ambientEvent.id}`} style={{
          position:'fixed', top:'38%', left:0,
          fontSize:22, pointerEvents:'none', zIndex:600,
          animation:'ambient-butterfly 4.4s ease-in-out forwards',
        }}><div style={{ width:10, height:7, background:'#ff88ff', boxShadow:'0 0 4px #ff88ff' }} /></div>
      )}
      {ambientEvent?.type === 'leaf' && (
        <div key={`amb-${ambientEvent.id}`} style={{
          position:'fixed', top:0, left:'42%',
          fontSize:18, pointerEvents:'none', zIndex:600,
          animation:'ambient-leaf 4s ease-in forwards',
        }}><div style={{ width:8, height:8, background:'#44aa44', boxShadow:'0 0 3px #44aa44' }} /></div>
      )}
      {ambientEvent?.type === 'star' && (
        <div key={`amb-${ambientEvent.id}`} style={{
          position:'fixed', top:'10%', right:'18%',
          fontSize:16, pointerEvents:'none', zIndex:600,
          animation:'ambient-shooting-star .85s ease-out forwards',
        }}><div style={{ width:6, height:6, background:'#ffdd44', boxShadow:'0 0 6px #ffdd44' }} /></div>
      )}

      {/* Stage-up celebration banner */}
      {stageUp && (
        <div key={`su-${stageUp.id}`} className="stage-up-banner" style={{ animation:'stage-up-pop 2.8s ease forwards' }}>
          <div style={{
            fontFamily:"'Fredoka One',cursive", fontSize:22,
            color:'#FFD700', textShadow:'0 2px 12px rgba(80,30,0,.8)',
          }}>ขึ้นระดับแล้ว!</div>
          <div style={{
            fontFamily:'Mitr,sans-serif', fontSize:15, color:'#fff',
            marginTop:4, textShadow:'0 1px 6px rgba(0,0,0,.55)',
          }}>{EGG_STAGE_NAMES[stageUp.stage]}</div>
        </div>
      )}

      {/* Post-session egg growth message */}
      {growthBanner && (
        <div style={{
          position:'fixed', top:'18%', left:'50%', transform:'translateX(-50%)',
          background:'rgba(20,12,40,0.92)', border:'2px solid rgba(255,220,80,0.7)',
          padding:'10px 22px', zIndex:700, pointerEvents:'none',
          animation:'stage-up-pop 3s ease forwards',
        }}>
          <div style={{ fontFamily:'Mitr,sans-serif', fontSize:15, color:'#ffe066', textAlign:'center', whiteSpace:'nowrap' }}>
            {growthBanner}
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        width:'100%', maxWidth:480, padding:'10px 16px', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
        background:'rgba(10,8,22,0.72)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
        borderBottom:'2px solid var(--px-border)',
      }}>
        {/* Left: avatar (tap → profile/login) + stage + name */}
        <button
          onClick={() => (isLoggedIn ? onOpenProfile?.() : onOpenLogin?.())}
          style={{
            display:'flex', alignItems:'center', gap:8, minWidth:0,
            background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left',
          }}
        >
          <div style={{
            width:34, height:34, flexShrink:0, borderRadius:'50%', overflow:'hidden',
            border:'2px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.35)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <EggCanvas stage={stage} aura={stageToAura(stage)} width={40} height={40} style={{ display:'block' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:1, minWidth:0 }}>
            <span style={{
              fontFamily:'var(--font-thai)', fontSize:13, fontWeight:800,
              color:'var(--px-yellow)', lineHeight:1.1, whiteSpace:'nowrap',
              overflow:'hidden', textOverflow:'ellipsis', maxWidth:130,
            }}>
              {state.name || 'โปรไฟล์'}
            </span>
            <span style={{
              fontFamily:'var(--font-thai)', fontSize:9, color:'rgba(255,255,255,0.55)',
              lineHeight:1.1, whiteSpace:'nowrap',
            }}>
              {stageName}
            </span>
          </div>
        </button>

        {/* Right: streak pill · coin pill · sound toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:3,
            background:'rgba(255,107,53,0.16)', border:`1px solid ${C_STREAK}66`,
            padding:'3px 7px',
          }}>
            <span style={{ fontSize:11 }}>🔥</span>
            <span style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:C_STREAK, letterSpacing:0.5 }}>
              {state.loginStreak || 0}
            </span>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:3,
            background:'rgba(255,210,63,0.15)', border:`1px solid ${C_COIN}66`,
            padding:'3px 7px',
          }}>
            <span style={{ fontSize:11 }}>🪙</span>
            <span style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:C_COIN, letterSpacing:0.5 }}>
              {state.coins || 0}
            </span>
          </div>
          <button
            onClick={toggleSound}
            aria-label="toggle sound"
            style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid var(--px-border)',
              padding:'3px 7px', cursor:'pointer', fontSize:13, lineHeight:1,
              opacity: soundOn ? 1 : 0.45,
            }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* ── Status bar (HP · XP · Bond) ────────────────────────────────────── */}
      <div style={{
        width:'100%', maxWidth:480, padding:'6px 16px', flexShrink:0,
        display:'flex', alignItems:'center', gap:10, maxHeight:36,
        background:'rgba(10,8,22,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
        borderBottom:'1px solid var(--px-border)',
      }}>
        {[
          { emoji:'❤️', pct:hpPct,   color:C_STREAK },
          { emoji:'⭐', pct:xpPct,   color:C_COIN },
          { emoji:'💕', pct:bondPct, color:C_BOND },
        ].map(({ emoji, pct, color }, i) => (
          <div key={i} style={{ flex:1, display:'flex', alignItems:'center', gap:5, minWidth:0 }}>
            <span style={{ fontSize:12, flexShrink:0 }}>{emoji}</span>
            <div style={{
              flex:1, height:7, background:'rgba(0,0,0,0.5)',
              border:'1px solid rgba(255,255,255,0.12)', overflow:'hidden',
            }}>
              <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width 0.4s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Egg zone — transparent, room walker shows through; tap to pet ───── */}
      <div
        onClick={onEggZoneTap}
        onTouchStart={onEggZoneTap}
        onTouchMove={handleCreatureSwipe}
        style={{
          flex:1, width:'100%', maxWidth:480, minHeight:0,
          position:'relative', cursor:'pointer', overflow:'hidden',
          display:'flex', flexDirection:'column', alignItems:'center',
        }}
      >
        {/* Full-bleed decorated room — the companion egg walks/idles/jumps inside it */}
        <DecoratedRoom style={{ position:'absolute', inset:0, zIndex:0 }} />

        {/* Floating Lv · stage-name pill, top-center */}
        <div style={{
          marginTop:12, zIndex:5, pointerEvents:'none',
          display:'inline-flex', alignItems:'center', gap:6,
          background:'rgba(10,8,22,0.62)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
          border:'1px solid rgba(255,255,255,0.15)', padding:'4px 12px',
        }}>
          <span style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:C_COIN, letterSpacing:0.5 }}>
            Lv.{eggLevel}
          </span>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>·</span>
          <span style={{ fontFamily:'var(--font-thai)', fontSize:11, fontWeight:700, color:'#fff' }}>
            {stageName}
          </span>
        </div>

        {/* Floating reaction emoji + heal float, centered */}
        <div style={{
          position:'absolute', top:'42%', left:'50%', transform:'translateX(-50%)',
          pointerEvents:'none', zIndex:20,
        }}>
          {bondReaction && (
            <div key={`br-${bondReaction}`} style={{
              fontSize:26, textAlign:'center',
              animation:'dmg-float 0.85s ease-out forwards',
            }}>
              {bondReaction}
            </div>
          )}
          {healFloat && (
            <div key={healFloat} style={{
              fontFamily:'var(--font-pixel)', fontSize:11, color:'#44ee44', textAlign:'center',
              animation:'dmg-float 1.1s ease-out forwards',
            }}>
              +100 HP
            </div>
          )}
        </div>

        {/* Tap particles, centered */}
        {particles.length > 0 && (
          <div style={{ position:'absolute', top:'55%', left:'50%', pointerEvents:'none', zIndex:10 }}>
            {particles.map(p => (
              <div key={p.id} style={{
                position:'absolute', top:0, left:0,
                marginTop: p.dy, marginLeft: p.dx,
                animation:`particle-rise ${p.dur}ms ease forwards`,
                pointerEvents:'none',
              }}>
                <div style={{ width: p.type==='hearts'?8:6, height: p.type==='hearts'?8:6, background: p.type==='hearts'?'#ff6677':'#ffdd44', boxShadow: `0 0 4px ${p.type==='hearts'?'#ff6677':'#ffdd44'}` }} />
              </div>
            ))}
          </div>
        )}

        {/* Hatch CTA — only for a brand-new player whose first egg is ready */}
        {readyToHatch && eggsHatched === 0 && (
          <div style={{ position:'absolute', bottom:14, left:0, right:0, display:'flex', justifyContent:'center', zIndex:15 }}>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: ACTIONS.SET_HATCHING, payload: true }) }}
              className="px-btn px-btn-yellow"
              style={{
                fontFamily:'var(--font-thai)', fontSize:14,
                animation:'challenger-pulse 1s ease-in-out infinite',
              }}
            >
              แตะเพื่อฟักไข่!
            </button>
          </div>
        )}
      </div>

      {/* ── Minigame shortcut card ─────────────────────────────────────────── */}
      <div style={{
        width:'100%', maxWidth:480, padding:'0 16px', flexShrink:0, marginBottom:8,
      }}>
        <button
          onClick={() => {
            playTone('tap')
            dispatch({ type: ACTIONS.SET_CURRENT_WORLD, payload: 'memory' })
            navigate('game')
          }}
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:12,
            background:'rgba(155,93,229,0.16)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
            border:`2px solid ${C_BOND}`, boxShadow:`3px 3px 0 rgba(0,0,0,0.4)`,
            padding:'10px 14px', cursor:'pointer', textAlign:'left',
          }}
        >
          <span style={{ fontSize:24, flexShrink:0 }}>🎮</span>
          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:3 }}>
            <span style={{ fontFamily:'var(--font-thai)', fontSize:14, fontWeight:800, color:'#fff' }}>มินิเกม</span>
            <span style={{
              fontFamily:'var(--font-thai)', fontSize:9, color:'rgba(255,255,255,0.6)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              Egg Memory · Egg Run · อีก 3 เกม
            </span>
          </div>
          <span style={{ fontFamily:'var(--font-pixel)', fontSize:14, color:C_BOND, flexShrink:0 }}>›</span>
        </button>
      </div>

      {/* ── Item tray ──────────────────────────────────────────────────────── */}
      <div style={{
        width:'100%', maxWidth:480, padding:'8px 16px', flexShrink:0,
        display:'flex', justifyContent:'center',
        background:'rgba(10,8,22,0.72)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
        borderTop:'2px solid var(--px-border)',
      }}>
        <div style={{ display:'flex', gap:10 }}>
        {ITEM_DEFS.map(({ key, label }) => {
          const count    = state.homeItems?.[key] || 0
          const isActive = activeItem === key
          const boost    = state.activeBoosts?.[key]
          const now      = Date.now()
          const cooldownMs = HOME_ITEMS[key]?.cooldown ?? 0
          const status = (() => {
            if (!boost) return 'ready'
            if (now < boost.endsAt) return 'active'
            if (cooldownMs && now < boost.endsAt + cooldownMs) return 'cooldown'
            return 'ready'
          })()
          const cooldownRemaining = boost
            ? Math.max(0, Math.ceil((boost.endsAt + cooldownMs - now) / 60000))
            : 0
          const activeRemaining = boost
            ? Math.max(0, Math.ceil((boost.endsAt - now) / 60000))
            : 0
          return (
            <div
              key={key}
              onClick={() => status !== 'cooldown' && count > 0 && handleTapItem(key)}
              className="px-item-card"
              style={{
                width:66, padding:'8px 4px 6px',
                opacity: status === 'cooldown' ? 0.4 : count > 0 ? 1 : 0.35,
                cursor: status === 'cooldown' || count <= 0 ? 'default' : 'pointer',
                border: isActive ? '2px solid var(--px-purple)' : undefined,
                transform: isActive ? 'scale(1.1) translateY(-3px)' : 'scale(1)',
                boxShadow: isActive ? '3px 3px 0 var(--px-purple)' : undefined,
              }}
            >
              <canvas ref={r => r && drawItem(r, key)} width={28} height={28} style={{ width:28, height:28, imageRendering:'pixelated', display:'block', margin:'0 auto 3px' }} />
              <span style={{ fontFamily:'var(--font-thai)', fontSize:9, color:'var(--px-light)', display:'block', textAlign:'center' }}>{label}</span>
              <span style={{
                fontFamily:'var(--font-pixel)', fontSize:6, display:'block', textAlign:'center', marginTop:2,
                color: status === 'active' ? '#EF9F27' : status === 'cooldown' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
              }}>
                {status === 'active' ? `${activeRemaining}m` : status === 'cooldown' ? `${cooldownRemaining}m` : 'พร้อม'}
              </span>
              {status === 'active' && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0, bottom:0,
                  border:'2px solid #EF9F27', pointerEvents:'none',
                }} />
              )}
              {status === 'ready' && count > 0 && (
                <div className="px-badge" style={{ position:'absolute', top:-5, right:-5 }}>{count}</div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* ── Explore button ─────────────────────────────────────────────────── */}
      <div style={{
        width:'100%', maxWidth:480, padding:'8px 16px 10px', flexShrink:0,
        background:'rgba(10,8,22,0.72)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
        borderTop:'2px solid var(--px-border)',
      }}>
        <button
          onClick={() => {
            playTone('start')
            dispatch({ type: ACTIONS.ENTER_WORLD, payload: { region: 'green-meadow', screen: 'BM' } })
            navigate('world')
          }}
          className="px-btn px-btn-purple"
          style={{ width:'100%', height:50, fontFamily:'var(--font-thai)', fontSize:15, fontWeight:800 }}
        >
          🗺️ ออกสำรวจ!
        </button>
      </div>
    </div>
  )
}
