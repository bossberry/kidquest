// Home.jsx — main hub: active creature display, party portrait bar, ambient life (HomeBackground), and quick-nav to all modes.
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import HomeBackground from './HomeBackground.jsx'
import { buildLegacyPreviewDNA, buildVoiceProfile } from '../lib/creatureGenerator.js'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { playTone, playBGM, stopBGM, playSFX, playCreatureSound } from '../lib/audio.js'
import { getEggElementHint, CREATURE_ELEMENT_COLORS, EVO_STAGE_LABELS_TH } from '../lib/creatureSystem.js'
import { drawItem } from '../lib/itemArt.js'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { HOME_ITEMS } from '../config/itemConfig.js'
import { supabase } from '../lib/supabase.js'
import { useHomeAmbience } from '../hooks/useHomeAmbience.js'

const ITEM_DEFS = [
  { key:'food',         label:'น่องไก่',   effect:'HP+100' },
  { key:'ribbon',       label:'ริบบิ้น',   effect:'SPD+10' },
  { key:'shoes',        label:'รองเท้า',   effect:'วิ่ง×4' },
  { key:'rainbow_star', label:'ดาวสีรุ้ง', effect:'ล่องหนจากมอนสเตอร์ตาม' },
]

// Interaction state machine — CSS class and auto-return duration for each state
const STATE_CSS = { idle:'float', pet:'pet', happy:'happy-spin', excited:'excited', eating:'eat', sleep:'sleepy', relax:'relax', reunion:'reunion' }
const STATE_DUR = { pet:500, happy:700, excited:1200, eating:900, sleep:2000, relax:1500, reunion:1200 }
const comboToState = n => n >= 8 ? 'excited' : n >= 4 ? 'happy' : 'pet'

export default function Home({ navigate, soundOn, toggleSound, onOpenLogin, onOpenProfile }) {
  const { state, dispatch, eggProgressData, eggStatsData } = useAppState()

  const [eggAnim, setEggAnim]             = useState('float')
  const [idleAnim, setIdleAnim]           = useState(null)
  const [activeItem, setActiveItem]       = useState(null)
  const [particles, setParticles]         = useState([])
  const [flyingItem, setFlyingItem]       = useState(null)
  const [eggGlow, setEggGlow]             = useState(null)
  const hasRibbon    = (state.activeBoosts?.ribbon?.endsAt ?? 0) > Date.now()
  const saiyanActive = (state.activeBoosts?.rainbow_star?.endsAt ?? 0) > Date.now()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data?.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session))
    return () => subscription.unsubscribe()
  }, [])
  const [creatureBounce, setCreatureBounce] = useState(false)
  const [bondReaction, setBondReaction]     = useState(null) // emoji shown above large canvas
  const [healFloat, setHealFloat]         = useState(null)  // null | id

  const particleIdRef   = useRef(0)
  const swipeCountRef   = useRef(0)
  const animTimerRef    = useRef(null)
  const glowTimerRef    = useRef(null)
  const initVisitRef    = useRef(state.lastHomeVisit)
  const stageRef        = useRef(0)
  // Interaction state machine
  const smRef           = useRef({ state: 'idle', comboCount: 0, enteredAt: 0 })
  const enterRafRef     = useRef(null)
  const enterGenRef     = useRef(0)
  const comboResetRef   = useRef(null)

  const { stage } = eggProgressData
  const eggsHatched       = (state.hatchedEggs || []).length
  // Voice profile for the active party creature — used to generate creature-specific sounds
  const voiceProfile = useMemo(() => {
    const activeId = state.party?.[0]
    const egg = activeId
      ? (state.hatchedEggs || []).find(e => e.id === activeId)
      : state.hatchedEggs?.[0]
    if (!egg) return null
    let dna = egg.dna
    if (!dna) { try { dna = buildLegacyPreviewDNA(egg, 0) } catch (_) { return null } }
    try { return buildVoiceProfile(dna) } catch (_) { return null }
  }, [state.party, state.hatchedEggs]) // eslint-disable-line
  const activeCreature = useMemo(() => {
    const activeId = state.party?.[0]
    return activeId
      ? (state.hatchedEggs || []).find(e => e.id === activeId)
      : state.hatchedEggs?.[0]
  }, [state.party, state.hatchedEggs]) // eslint-disable-line
  const activeEgg = (state.hatchedEggs ?? []).find(e => e.id === state.party?.[0]) ?? state.hatchedEggs?.[0]
  const readyToHatch      = state.readyToHatch && (state.hatchedEggs?.length ?? 0) === 0
  const boostActive       = (state.xpBoostEnd || 0) > Date.now()

  useEffect(() => {
    playBGM('home')
    return () => stopBGM()
  }, [])

  // Keep refs current
  useEffect(() => { stageRef.current = stage }, [stage])

  // Cancel pending RAF + timers on unmount
  useEffect(() => () => {
    if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current)
    clearTimeout(animTimerRef.current)
    clearTimeout(comboResetRef.current)
  }, [])

  // Watchdog: every 5s force back to idle if stuck non-idle > 6s
  useEffect(() => {
    const id = setInterval(() => {
      const sm = smRef.current
      if (sm.state === 'idle') return
      if (Date.now() - sm.enteredAt > 6000) {
        clearTimeout(animTimerRef.current)
        clearTimeout(comboResetRef.current)
        sm.state = 'idle'
        sm.comboCount = 0
        setEggAnim(stageRef.current >= 7 ? 'excited' : 'float')
      }
    }, 5000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line

  const spawnParticles = (type, count = 5) => {
    const ps = Array.from({ length: count }, () => {
      const id    = ++particleIdRef.current
      const angle = Math.random() * 360
      const r     = 48 + Math.random() * 44
      const dx    = Math.cos(angle * Math.PI / 180) * r
      const dy    = Math.sin(angle * Math.PI / 180) * r - 18
      const dur   = 750 + Math.floor(Math.random() * 350)
      return { id, type, dx, dy, dur }
    })
    setParticles(prev => [...prev, ...ps])
    setTimeout(() => setParticles(prev => prev.filter(p => !ps.find(np => np.id === p.id))), 1200)
  }

  // Enter a new interaction state — cancels any in-flight transition, restarts animation
  const enterState = (newState, dur) => {
    if (enterRafRef.current) { cancelAnimationFrame(enterRafRef.current); enterRafRef.current = null }
    clearTimeout(animTimerRef.current)
    const sm = smRef.current
    sm.state = newState
    sm.enteredAt = Date.now()
    setIdleAnim(null)
    if (newState === 'idle') {
      setEggAnim(stageRef.current >= 7 ? 'excited' : 'float')
      return
    }
    const cssName = STATE_CSS[newState] || 'float'
    const d = dur != null ? dur : (STATE_DUR[newState] ?? 600)
    const gen = ++enterGenRef.current
    setEggAnim('float')
    enterRafRef.current = requestAnimationFrame(() => {
      enterRafRef.current = null
      if (enterGenRef.current !== gen) return
      setEggAnim(cssName)
      animTimerRef.current = setTimeout(() => {
        if (smRef.current.state === newState) {
          smRef.current.state = 'idle'
          setEggAnim(stageRef.current >= 7 ? 'excited' : 'float')
        }
      }, d)
    })
  }

  // Extend the current state without re-triggering the CSS animation (same visual tier)
  const extendState = (targetState, dur) => {
    clearTimeout(animTimerRef.current)
    smRef.current.enteredAt = Date.now()
    const d = dur != null ? dur : (STATE_DUR[targetState] ?? 600)
    animTimerRef.current = setTimeout(() => {
      if (smRef.current.state === targetState) {
        smRef.current.state = 'idle'
        setEggAnim(stageRef.current >= 7 ? 'excited' : 'float')
      }
    }, d)
  }

  const setGlow = (color, duration) => {
    clearTimeout(glowTimerRef.current)
    setEggGlow(color)
    glowTimerRef.current = setTimeout(() => setEggGlow(null), duration)
  }

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

  const handlePetEgg = () => {
    if (readyToHatch && eggsHatched === 0) { dispatch({ type: ACTIONS.SET_HATCHING, payload: true }); return }
    const sm = smRef.current
    sm.comboCount += 1
    const n = sm.comboCount
    // Reset combo after 3s inactivity so next session starts fresh
    clearTimeout(comboResetRef.current)
    comboResetRef.current = setTimeout(() => { smRef.current.comboCount = 0 }, 3000)
    const targetState = comboToState(n)
    if (targetState !== sm.state) {
      // Tier upgrade — full transition with new animation
      if (targetState === 'excited') {
        playTone('giggle'); playSFX('egg_excited')
        spawnParticles('sparkle', 10)
        spawnParticles('hearts', 6)
      } else if (targetState === 'happy') {
        playTone('giggle'); playSFX('egg_pet')
        spawnParticles('hearts', 6)
      } else {
        playTone('chirp'); playSFX('egg_pet')
        spawnParticles('sparkle', 3)
      }
      enterState(targetState)
    } else {
      // Same tier — extend exit timer without re-triggering animation (keeps it smooth)
      if (targetState === 'pet') {
        playTone('chirp')
        spawnParticles('sparkle', 2)
      } else if (targetState === 'happy') {
        spawnParticles('hearts', 2)
      } else {
        if (Math.random() < 0.4) playTone('chirp')
        spawnParticles('sparkle', 2)
      }
      extendState(targetState)
    }
  }

  const handleTapItem = (key) => {
    if (activeItem !== key) {
      setActiveItem(key)
      playTone('tap')
      return
    }
    const count = state.homeItems?.[key] || 0
    if (count <= 0) return
    dispatch({ type: ACTIONS.USE_HOME_ITEM, payload: { key } })
    setActiveItem(null)

    smRef.current.comboCount = 0  // items reset combo so next pet sequence starts clean

    if (key === 'food') {
      setFlyingItem({ label:'อาหาร', id: Date.now() })
      setTimeout(() => {
        enterState('eating')
        spawnParticles('hearts', 5)
        playTone('chew')
        setGlow('warm', 1600)
      }, 360)
      setTimeout(() => {
        setFlyingItem(null)
        setTimeout(() => playTone('sigh'), 250)
      }, 620)
      // Heal active creature +10 HP
      const activeCreatureId = state.party?.[0]
      if (activeCreatureId) {
        dispatch({ type: ACTIONS.CREATURE_HEAL, payload: { creatureId: activeCreatureId, amount: 100 } })
        playSFX('egg_pet')
        const floatId = Date.now()
        setHealFloat(floatId)
        setTimeout(() => setHealFloat(f => f === floatId ? null : f), 1200)
      }

    } else if (key === 'ribbon') {
      playTone('jingle')
      spawnParticles('sparkle', 6)
      setGlow('pink', 1200)
      enterState('happy', 800)
      setBondReaction('⚡ SPD+10 (5 นาที)')
      setTimeout(() => setBondReaction(null), 1500)

    } else if (key === 'shoes') {
      playTone('jingle')
      spawnParticles('sparkle', 6)
      setGlow('warm', 1200)
      enterState('happy', 800)
      setBondReaction('👟 วิ่ง×4 (5 นาที)')
      setTimeout(() => setBondReaction(null), 1500)

    } else if (key === 'rainbow_star') {
      playTone('celebrate')
      spawnParticles('sparkle', 14)
      spawnParticles('hearts', 4)
      setGlow('gold', 3000)
      enterState('excited', 1200)
      setBondReaction('✨ ซูปเปอร์ไซย่า!')
      setTimeout(() => setBondReaction(null), 2000)
    }
  }

  const handleEggTap = () => activeItem ? handleTapItem(activeItem) : handlePetEgg()

  // Tap the large creature canvas — plays reaction, adds bond, triggers bounce
  const handleCreatureTap = (e) => {
    if (e?.preventDefault) e.preventDefault()
    handlePetEgg()
    if (!activeEgg) return
    dispatch({ type: ACTIONS.ADD_CREATURE_BOND, payload: { creatureId: activeEgg.id, amount: 1 } })
    setCreatureBounce(true)
    setTimeout(() => setCreatureBounce(false), 320)
    const reactions = ['😊','⭐','💕','✨','💪']
    const r = reactions[Math.floor(Math.random() * reactions.length)]
    setBondReaction(r)
    setTimeout(() => setBondReaction(null), 750)
  }

  // Swipe across the large canvas — after 3 swipes, reward +3 bond
  const handleCreatureSwipe = () => {
    swipeCountRef.current++
    if (swipeCountRef.current >= 3) {
      swipeCountRef.current = 0
      if (activeEgg) dispatch({ type: ACTIONS.ADD_CREATURE_BOND, payload: { creatureId: activeEgg.id, amount: 3 } })
      playTone('chirp')
      setBondReaction('💖')
      setTimeout(() => setBondReaction(null), 1000)
    }
  }

  const idleBaseClass = stage >= 7 ? 'egg-anim-excited' : 'egg-anim-float'
  const eggClass = eggAnim !== 'float'
    ? `egg-anim-${eggAnim}`
    : idleAnim
      ? `egg-anim-${idleAnim}`
      : idleBaseClass

  const STAGE_DOT_COLORS = [
    '#9B87B8','#C4956A','#7BAF6E','#9B59B6',
    '#D4AC0D','#E87E2C','#5E9BD8','#5DADE2','#FFD700',
  ]
  const stageColor = STAGE_DOT_COLORS[stage] || '#9B87B8'
  const hour = new Date().getHours()
  const isDay = hour >= 6 && hour < 19
  const moodText =
    eggAnim === 'sleepy'      ? 'ง่วงนอน' :
    eggAnim === 'eat'         ? 'กินข้าว' :
    (eggAnim === 'excited' || eggAnim === 'happy-spin') ? 'สุขมาก!' : 'สบายดี'
  const moodLevel =
    (eggAnim === 'excited' || eggAnim === 'happy-spin') ? 3 :
    (eggAnim === 'eat' || eggAnim === 'pet') ? 2 : 1

  return (
    <div id="egg-home" style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      width:'100%', height:'100dvh', overflowX:'hidden', overflowY:'hidden',
    }}>

      <HomeBackground
        hour={hour}
        creatures={state.hatchedEggs ?? []}
      />

      {/* Flying food overlay */}
      {flyingItem && (
        <div key={`fly-${flyingItem.id}`} style={{
          position:'fixed', left:'50%', bottom:155,
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

      {/* Header */}
      <div style={{
        width:'100%', maxWidth:480, padding:'14px 20px 8px',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        flexShrink:0,
        background: 'var(--px-darkest)',
        borderBottom: '2px solid var(--px-border)',
      }}>
        <div style={{
          fontFamily:'var(--font-thai)', fontSize:11,
          color: 'var(--px-light)',
          fontWeight: stage >= 6 ? 700 : 400,
        }}>
          {eggsHatched === 0
            ? (EGG_STAGE_NAMES[stage] || 'ไข่น้อย')
            : (activeCreature?.creatureName || activeCreature?.creature?.n || 'เพื่อนของ' + state.name)}
        </div>
        {/* Element hint — only when no creature yet */}
        {eggsHatched === 0 && (() => {
          const hint = getEggElementHint(state.xpThai, state.xpMath, state.xpEng, state.acc, state.streak, stage)
          if (!hint) return null
          return (
            <div style={{
              display:'inline-block', padding:'1px 8px', marginTop:2,
              background: hint.color + '33', border: `1px solid ${hint.color}88`,
              fontFamily:'Mitr,sans-serif', fontSize:10, color: hint.color,
            }}>
              ธาตุ{hint.nameTH}?
            </div>
          )
        })()}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {eggsHatched === 0 && readyToHatch && (
            <div className="px-badge" style={{
              background:'var(--px-yellow)', color:'var(--px-black)',
              animation:'challenger-pulse 1s ease-in-out infinite',
            }}>
              พร้อมฟัก!
            </div>
          )}
          {!isLoggedIn ? (
            <button
              onClick={() => onOpenLogin?.()}
              style={{
                background:'var(--px-purple,#7c4dff)', color:'#fff',
                border:'none', padding:'5px 12px',
                fontFamily:'var(--font-thai)', fontSize:11,
                cursor:'pointer', boxShadow:'2px 2px 0 #000',
              }}
            >
              เข้าสู่ระบบ
            </button>
          ) : (
            <button
              onClick={() => onOpenProfile?.()}
              style={{
                background:'transparent', color:'var(--px-light)',
                border:'1px solid var(--px-border)', padding:'5px 12px',
                fontFamily:'var(--font-thai)', fontSize:11,
                cursor:'pointer',
              }}
            >
              {state.name || 'โปรไฟล์'}
            </button>
          )}
          <button onClick={toggleSound} style={{ background:'none', border:'none', fontSize:10, cursor:'pointer', opacity:0.5, padding:4, fontFamily:'var(--font-thai)', color:'var(--px-light)' }}>
            {soundOn ? 'เสียง' : 'ปิด'}
          </button>
        </div>
      </div>

      {/* Egg zone */}
      <div style={{
        flex:1, width:'100%', maxWidth:480, minHeight:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        position:'relative', paddingBottom:50,
      }}>

        {/* Large creature display — shown when creature exists */}
        {eggsHatched > 0 && activeEgg && (
          <div style={{ textAlign:'center', zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', gap:6, paddingBottom:8 }}>
            {/* Creature name */}
            <div style={{
              fontFamily:'var(--font-thai)', fontSize:17, fontWeight:700,
              color:'var(--px-yellow)', textShadow:'2px 2px 0 var(--px-darkest)', lineHeight:1.2,
            }}>
              {activeEgg.creatureName || activeEgg.creature?.n || ('เพื่อนของ' + state.name)}
            </div>
            {/* Level badge */}
            <div style={{
              fontFamily:'var(--font-pixel)', fontSize:9,
              color:'rgba(255,255,255,0.6)',
              background:'rgba(0,0,0,0.45)',
              padding:'2px 10px',
            }}>
              Lv.{activeEgg.battleLevel ?? 1}
            </div>
            {/* Large creature canvas — tappable + swipeable */}
            <div style={{ position:'relative', display:'inline-block' }}>
              {bondReaction && (
                <div style={{
                  position:'absolute', top:-34, left:'50%', transform:'translateX(-50%)',
                  fontSize:22, pointerEvents:'none', zIndex:20,
                  animation:'dmg-float 0.75s ease-out forwards',
                }}>
                  {bondReaction}
                </div>
              )}
              <div style={{
                filter: saiyanActive
                  ? undefined
                  : undefined,
                animation: saiyanActive ? 'saiyan-pulse 0.5s ease-in-out infinite alternate' : 'none',
              }}>
                <canvas
                  key={activeEgg.id}
                  ref={r => r && drawCreature(r, getCreatureSeed(activeEgg), { ...(activeEgg?.eggStats ?? {}), evoStage: activeEgg?.evoStage })}
                  width={160} height={160}
                  onClick={handleCreatureTap}
                  onTouchStart={handleCreatureTap}
                  onTouchMove={handleCreatureSwipe}
                  style={{
                    imageRendering:'pixelated', display:'block', margin:'0 auto',
                    cursor:'pointer',
                    transform: creatureBounce ? 'scale(1.15)' : 'scale(1)',
                    transition:'transform 0.32s cubic-bezier(.2,1.5,.5,1)',
                    filter: saiyanActive
                      ? 'drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 24px #FF8800) drop-shadow(0 0 36px #FFFF00)'
                      : 'none',
                  }}
                />
              </div>
            </div>
            {/* Compact single-line stat row */}
            <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:2 }}>
              {[
                { label:'ATK', value: activeEgg.stats?.ATK ?? 0, color:'#ff6655' },
                { label:'DEF', value: activeEgg.stats?.DEF ?? 0, color:'#55aaff' },
                { label:'SPD', value: activeEgg.stats?.SPD ?? 0, color:'#aaff55' },
                { label:'HP',  value: activeEgg.stats?.HP  ?? 0, color:'#ff88aa' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ fontFamily:'var(--font-pixel)', fontSize:7 }}>
                  <span style={{ color }}>{label}</span>
                  <span style={{ color:'rgba(255,255,255,0.75)', marginLeft:3 }}>{value}</span>
                </div>
              ))}
            </div>
            {/* HP bar */}
            {(() => {
              const maxHP = activeEgg.stats?.HP ?? 100
              const currentHP = activeEgg.currentHP ?? maxHP
              const hpPct = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
              const hpColor = hpPct > 60 ? '#44ee44' : hpPct > 25 ? '#eeee44' : '#ee4444'
              return (
                <div style={{ width:160, margin:'4px auto 0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'rgba(255,255,255,0.5)' }}>HP</span>
                    <span style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:hpColor }}>{currentHP}/{maxHP}</span>
                  </div>
                  <div style={{ height:6, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.15)' }}>
                    <div style={{ width:`${hpPct}%`, height:'100%', background:hpColor, transition:'width 0.3s' }} />
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Egg zone — only shown when no creature yet (TASK 3) */}
        {eggsHatched === 0 && (<>
        {/* Title + mood indicator above egg */}
        <div style={{ textAlign:'center', marginBottom:6, zIndex:5 }}>
          <div style={{
            fontFamily:'var(--font-thai)', fontSize:17, fontWeight:700,
            color:'var(--px-yellow)',
            textShadow:'2px 2px 0 var(--px-darkest)',
            lineHeight:1.2,
          }}>
            ไข่ของ{state.name}
          </div>
          <div className="px-subtitle" style={{ marginTop:2 }}>{moodText}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:6, height:6,
                background: i < moodLevel ? 'var(--px-yellow)' : 'var(--px-border)',
                boxShadow: i < moodLevel ? '0 0 3px var(--px-yellow)' : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Egg wrapper — animation class drives all movement */}
        <div
          className={eggClass}
          onClick={handleEggTap}
          style={{ cursor:'pointer', position:'relative', display:'inline-block' }}
        >
          {/* Particles */}
          {particles.length > 0 && (
            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10, overflow:'visible' }}>
              {particles.map(p => (
                <div key={p.id} style={{
                  position:'absolute', top:'50%', left:'50%',
                  marginTop: p.dy, marginLeft: p.dx,
                  fontSize: p.type === 'hearts' ? 16 : 14,
                  animation:`particle-rise ${p.dur}ms ease forwards`,
                  pointerEvents:'none',
                }}>
                  <div style={{ width: p.type==='hearts'?8:6, height: p.type==='hearts'?8:6, background: p.type==='hearts'?'#ff6677':'#ffdd44', boxShadow: `0 0 4px ${p.type==='hearts'?'#ff6677':'#ffdd44'}` }} />
                </div>
              ))}
            </div>
          )}

          {/* Star boost orbit */}
          {boostActive && (
            <>
              <div className="egg-star-orbit" style={{ animationDuration:'2s', width:6, height:6, background:'#ffdd44', display:'inline-block', boxShadow:'0 0 4px #ffdd44' }} />
              <div className="egg-star-orbit" style={{ animationDuration:'2.7s', animationDelay:'-1.35s', width:6, height:6, background:'#ffffff', display:'inline-block', boxShadow:'0 0 3px #fff' }} />
            </>
          )}

          {/* Ribbon decoration */}
          {hasRibbon && (
            <div style={{
              position:'absolute', top:-6, right:-6,
              width:10, height:10, background:'#ff88cc', border:'2px solid #fff',
              pointerEvents:'none', zIndex:12,
            }} />
          )}

          {/* Canvas with ground shadow */}
          <div style={{ position:'relative', display:'inline-block' }}>
            <EggCanvas
              stats={eggStatsData}
              width={190} height={225}
              className={[`egg-s${stage}`, eggGlow ? `egg-glow-${eggGlow}` : ''].filter(Boolean).join(' ')}
              style={{ display:'block' }}
            />
            <div style={{
              position:'absolute', bottom:-8, left:'50%',
              transform:'translateX(-50%)',
              width:70, height:14,
              background:'radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, transparent 70%)',
              borderRadius:'50%', pointerEvents:'none',
            }} />
          </div>
        </div>

        {/* Hatch CTA */}
        {readyToHatch && (
          <button
            onClick={() => dispatch({ type: ACTIONS.SET_HATCHING, payload: true })}
            className="px-btn px-btn-yellow"
            style={{ marginTop:14, fontFamily:'var(--font-thai)', fontSize:14 }}
          >
            แตะเพื่อฟักไข่!
          </button>
        )}
        </>)}

      </div>

      {/* Party bar — portrait cards, horizontal scroll, tap to switch active */}
      {(state.hatchedEggs ?? []).length > 0 && (
        <div style={{
          width:'100%', maxWidth:480, padding:'8px 12px',
          flexShrink:0, position:'relative',
          background:'var(--px-darker, #16162a)',
          borderTop:'1px solid var(--px-border)',
          overflowX:'auto',
        }}>
          {healFloat && (
            <div key={healFloat} style={{
              position:'absolute', top:0, left:'50%',
              transform:'translateX(-50%)',
              fontFamily:'var(--font-pixel)', fontSize:11,
              color:'#44ee44', pointerEvents:'none', zIndex:10,
              animation:'dmg-float 1.1s ease-out forwards',
            }}>
              +100 HP
            </div>
          )}
          <div style={{
            display:'flex', gap:8,
            justifyContent: (state.hatchedEggs ?? []).length === 1 ? 'center' : 'flex-start',
            minWidth:'max-content',
          }}>
            {(state.hatchedEggs ?? []).map(egg => {
              const isActive = egg.id === (state.party?.[0] ?? state.hatchedEggs?.[0]?.id)
              return (
                <div
                  key={egg.id}
                  onClick={() => {
                    dispatch({ type: ACTIONS.SET_ACTIVE_CREATURE, payload: { creatureId: egg.id } })
                    setCreatureBounce(true)
                    setTimeout(() => setCreatureBounce(false), 400)
                  }}
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                    cursor:'pointer', padding:4,
                    border: isActive ? '2px solid #EF9F27' : '2px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'rgba(239,159,39,0.1)' : 'rgba(0,0,0,0.3)',
                    boxShadow: isActive ? '0 0 6px rgba(239,159,39,0.5)' : 'none',
                    transition:'border-color 150ms, box-shadow 150ms',
                  }}
                >
                  <canvas
                    key={`party-${egg.id}`}
                    ref={r => r && drawCreature(r, getCreatureSeed(egg), { ...(egg?.eggStats ?? {}), evoStage: egg?.evoStage })}
                    width={56} height={56}
                    style={{ imageRendering:'pixelated', display:'block' }}
                  />
                  <div style={{
                    fontFamily:'var(--font-thai)', fontSize:7,
                    color: isActive ? '#EF9F27' : 'rgba(255,255,255,0.55)',
                    maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {egg.creatureName || egg.creature?.n || '?'}
                  </div>
                  <div style={{ fontFamily:'var(--font-pixel)', fontSize:6, color:'rgba(255,255,255,0.35)' }}>
                    Lv.{egg.battleLevel ?? 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Item tray */}
      <div style={{
        width:'100%', maxWidth:480, padding:'8px 20px',
        display:'flex', justifyContent:'center', flexShrink:0,
        background: 'var(--px-darkest)',
        borderTop: '2px solid var(--px-border)',
      }}>
        <div style={{ display:'flex', gap:8 }}>
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
                width:60,
                opacity: status === 'cooldown' ? 0.4 : count > 0 ? 1 : 0.35,
                cursor: status === 'cooldown' || count <= 0 ? 'default' : 'pointer',
                border: isActive ? '2px solid var(--px-purple)' : undefined,
                transform: isActive ? 'scale(1.1) translateY(-3px)' : 'scale(1)',
                boxShadow: isActive ? '3px 3px 0 var(--px-purple)' : undefined,
              }}
            >
              <canvas ref={r => r && drawItem(r, key)} width={32} height={32} style={{ imageRendering:'pixelated', display:'block', margin:'0 auto 2px' }} />
              <span style={{ fontFamily:'var(--font-thai)', fontSize:8, color:'var(--px-light)', marginTop:2 }}>{label}</span>
              {status === 'active' && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0, bottom:0,
                  background:'rgba(239,159,39,0.15)',
                  border:'2px solid #EF9F27',
                  display:'flex', alignItems:'flex-end', justifyContent:'center',
                  paddingBottom:2, pointerEvents:'none',
                }}>
                  <span style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'#EF9F27' }}>
                    {activeRemaining}m
                  </span>
                </div>
              )}
              {status === 'cooldown' && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0, bottom:0,
                  background:'rgba(0,0,0,0.5)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  pointerEvents:'none',
                }}>
                  <span style={{ fontFamily:'var(--font-pixel)', fontSize:7, color:'rgba(255,255,255,0.4)' }}>
                    {cooldownRemaining}m
                  </span>
                </div>
              )}
              {status === 'ready' && count > 0 && (
                <div className="px-badge" style={{ position:'absolute', top:-5, right:-5 }}>{count}</div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* Action row — padding-bottom handled by #egg-home CSS (safe-area-aware) */}
      <div style={{
        width:'100%', maxWidth:480, padding:'6px 20px 10px',
        display:'flex', gap:8, flexShrink:0,
        background: 'var(--px-darkest)',
        borderTop: '2px solid var(--px-border)',
      }}>
        <button
          onClick={eggsHatched > 0 ? handleCreatureTap : handlePetEgg}
          className="px-btn px-btn-dark"
          style={{ flex:1, height:48, fontFamily:'var(--font-thai)', fontSize:13 }}
        >
          {eggsHatched === 0 ? 'ลูบไข่' : 'ลูบ!'}
        </button>
        <button
          onClick={() => {
            playTone('start')
            dispatch({ type: ACTIONS.ENTER_WORLD, payload: { region: 'green-meadow', screen: 'BM' } })
            navigate('world')
          }}
          className="px-btn px-btn-purple"
          style={{ flex:2, height:48, fontFamily:'var(--font-thai)', fontSize:14 }}
        >
          ออกสำรวจ!
        </button>
      </div>
    </div>
  )
}
