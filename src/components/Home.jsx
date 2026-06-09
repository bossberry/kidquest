import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { playTone } from '../lib/audio.js'

const ITEM_DEFS = [
  { key:'food',   emoji:'🍗', label:'อาหาร' },
  { key:'ribbon', emoji:'🎀', label:'ริบบิ้น' },
  { key:'potion', emoji:'💧', label:'น้ำมนต์' },
  { key:'star',   emoji:'⭐', label:'ดาว' },
]

export default function Home({ navigate, soundOn, toggleSound }) {
  const { state, dispatch, eggProgressData, eggStatsData } = useAppState()

  const [petStreak, setPetStreak]       = useState(0)
  const [eggAnim, setEggAnim]           = useState('float')
  const [idleAnim, setIdleAnim]         = useState(null)
  const [activeItem, setActiveItem]     = useState(null)
  const [particles, setParticles]       = useState([])
  const [flyingItem, setFlyingItem]     = useState(null)
  const [eggGlow, setEggGlow]           = useState(null)
  const [hasRibbon, setHasRibbon]       = useState(false)
  const [creature, setCreature]         = useState({ x: 30, dir: 1 })
  const [creatureTapped, setCreatureTapped] = useState(false)

  const particleIdRef  = useRef(0)
  const animTimerRef   = useRef(null)
  const glowTimerRef   = useRef(null)
  const idleTimerRef   = useRef(null)
  const creatureRef    = useRef({ x: 30, dir: 1 })
  const initVisitRef   = useRef(state.lastHomeVisit)
  const stageRef       = useRef(0)
  const eggAnimRef     = useRef('float')

  const { stage } = eggProgressData
  const eggsHatched      = (state.hatchedEggs || []).length
  const lastCreatureEmoji = state.hatchedEggs?.[0]?.creature?.e || null
  const readyToHatch     = state.readyToHatch && stage >= 6
  const boostActive      = (state.xpBoostEnd || 0) > Date.now()

  // Keep refs current
  useEffect(() => { stageRef.current = stage }, [stage])
  useEffect(() => { eggAnimRef.current = eggAnim }, [eggAnim])

  // Record visit + reunion on mount
  useEffect(() => {
    const last = initVisitRef.current
    const now  = Date.now()
    const isReunion = !last || (now - last) > 4 * 60 * 60 * 1000
    dispatch({ type: ACTIONS.UPDATE_LAST_HOME_VISIT, payload: now })
    if (isReunion) {
      triggerAnim('reunion', 1100)
      spawnParticles('sparkle', 10)
      playTone('chirp')
    }
  }, []) // eslint-disable-line

  // Random idle micro-animations — egg feels alive
  useEffect(() => {
    const IDLE = ['idle-wiggle', 'idle-jump', 'idle-wiggle', 'idle-wiggle', 'idle-jump']
    const schedule = () => {
      idleTimerRef.current = setTimeout(() => {
        if (eggAnimRef.current === 'float') {
          const a = IDLE[Math.floor(Math.random() * IDLE.length)]
          setIdleAnim(a)
          setTimeout(() => setIdleAnim(null), 600)
          if (Math.random() < 0.22) playTone('chirp')
          else if (Math.random() < 0.08) playTone('begging')
        }
        schedule()
      }, 5000 + Math.random() * 7000)
    }
    schedule()
    return () => clearTimeout(idleTimerRef.current)
  }, []) // eslint-disable-line

  // Creature patrol
  useEffect(() => {
    if (eggsHatched === 0) return
    const MAX_X = 230
    const id = setInterval(() => {
      const s = creatureRef.current
      let x = s.x + s.dir * 0.5, dir = s.dir
      if (x >= MAX_X) { x = MAX_X; dir = -1 }
      if (x <= 10)    { x = 10;    dir =  1 }
      creatureRef.current = { x, dir }
      setCreature({ x, dir })
    }, 40)
    return () => clearInterval(id)
  }, [eggsHatched]) // eslint-disable-line

  // Pet streak reset after 6s inactivity
  useEffect(() => {
    if (petStreak === 0) return
    const t = setTimeout(() => setPetStreak(0), 6000)
    return () => clearTimeout(t)
  }, [petStreak])

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

  const triggerAnim = (name, duration) => {
    clearTimeout(animTimerRef.current)
    setIdleAnim(null)
    setEggAnim('float')
    requestAnimationFrame(() => {
      setEggAnim(name)
      if (duration) {
        animTimerRef.current = setTimeout(
          () => setEggAnim(stageRef.current >= 5 ? 'excited' : 'float'),
          duration
        )
      }
    })
  }

  const setGlow = (color, duration) => {
    clearTimeout(glowTimerRef.current)
    setEggGlow(color)
    glowTimerRef.current = setTimeout(() => setEggGlow(null), duration)
  }

  const handlePetEgg = () => {
    if (readyToHatch) { dispatch({ type: ACTIONS.SET_HATCHING, payload: true }); return }
    const ns = petStreak + 1
    setPetStreak(ns)
    if (ns >= 6) {
      triggerAnim('sleepy', 2000)
      // quiet — no sound
    } else if (ns >= 3) {
      playTone('giggle')
      triggerAnim('happy-spin', 700)
      spawnParticles('hearts', 8)
    } else {
      playTone('chirp')
      triggerAnim('pet', 500)
      spawnParticles('sparkle', 4)
    }
  }

  const handleTapItem = (key) => {
    if (activeItem !== key) {
      setActiveItem(key)
      playTone('tap')
      return
    }
    // Second tap = use on egg
    const count = state.items?.[key] || 0
    if (count <= 0) return
    dispatch({ type: ACTIONS.USE_ITEM, payload: { key } })
    setActiveItem(null)

    if (key === 'food') {
      // Food flies from tray to egg, then egg eats it
      setFlyingItem({ emoji:'🍗', id: Date.now() })
      setTimeout(() => {
        triggerAnim('eat', 900)
        spawnParticles('hearts', 5)
        playTone('chew')
        setGlow('warm', 1600)
      }, 360)
      setTimeout(() => {
        setFlyingItem(null)
        setTimeout(() => playTone('sigh'), 250)
      }, 620)

    } else if (key === 'ribbon') {
      setHasRibbon(true)
      playTone('jingle')
      spawnParticles('sparkle', 5)
      setGlow('pink', 1000)
      triggerAnim('pet', 600)

    } else if (key === 'potion') {
      playTone('slurp')
      spawnParticles('sparkle', 6)
      setGlow('blue', 2000)
      triggerAnim('relax', 1500)

    } else if (key === 'star') {
      playTone('celebrate')
      spawnParticles('sparkle', 11)
      setGlow('gold', 3000)
      triggerAnim('happy-spin', 800)
    }
  }

  const handleEggTap = () => activeItem ? handleTapItem(activeItem) : handlePetEgg()

  // Egg animation class — idle override slots in when no active animation
  const idleBaseClass = stage >= 5 ? 'egg-anim-excited' : 'egg-anim-float'
  const eggClass = eggAnim !== 'float'
    ? `egg-anim-${eggAnim}`
    : idleAnim
      ? `egg-anim-${idleAnim}`
      : idleBaseClass

  const stageDots = Array.from({ length: 7 }, (_, i) => i <= stage)

  return (
    <div id="egg-home" style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      width:'100%', height:'100%', overflow:'hidden',
    }}>

      {/* Flying food overlay — fixed position, flies from tray area to egg */}
      {flyingItem && (
        <div key={`fly-${flyingItem.id}`} style={{
          position:'fixed', left:'50%', bottom:155,
          fontSize:30, pointerEvents:'none', zIndex:500,
          animation:'food-fly-up .58s cubic-bezier(.2,.8,.4,1) forwards',
        }}>
          {flyingItem.emoji}
        </div>
      )}

      {/* Header */}
      <div style={{
        width:'100%', maxWidth:480, padding:'14px 20px 0',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        flexShrink:0,
      }}>
        <div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#5A3A8B', lineHeight:1.1 }}>
            ไข่ของ{state.name}
          </div>
          <div style={{ display:'flex', gap:5, marginTop:5, alignItems:'center' }}>
            {stageDots.map((filled, i) => (
              <div key={i} style={{
                width:9, height:9, borderRadius:'50%',
                background: filled ? '#9B59B6' : 'rgba(155,89,182,0.18)',
                transition:'background 0.4s',
              }} />
            ))}
            <span style={{ fontSize:10, color:'rgba(90,58,139,0.5)', marginLeft:4, fontFamily:'Mitr,sans-serif' }}>
              {EGG_STAGE_NAMES[stage] || 'ไข่ลึกลับ'}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {readyToHatch && (
            <div style={{
              background:'linear-gradient(135deg,#FFD700,#FF9500)', color:'#5A3A00',
              borderRadius:16, padding:'5px 12px', fontFamily:'Mitr,sans-serif',
              fontWeight:700, fontSize:12,
              animation:'challenger-pulse 1s ease-in-out infinite',
              boxShadow:'0 2px 10px rgba(255,165,0,0.35)',
            }}>
              🥚 พร้อมฟัก!
            </div>
          )}
          <button onClick={toggleSound} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', opacity:0.5, padding:4 }}>
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Egg zone */}
      <div style={{
        flex:1, width:'100%', maxWidth:480, minHeight:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        position:'relative', paddingBottom:50,
      }}>

        {/* Egg wrapper — animation class goes here */}
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
                  {p.type === 'hearts' ? '💗' : '✨'}
                </div>
              ))}
            </div>
          )}

          {/* Star boost orbit */}
          {boostActive && (
            <>
              <div className="egg-star-orbit" style={{ animationDuration:'2s' }}>✨</div>
              <div className="egg-star-orbit" style={{ animationDuration:'2.7s', animationDelay:'-1.35s' }}>⭐</div>
            </>
          )}

          {/* Ribbon overlay */}
          {hasRibbon && (
            <div style={{
              position:'absolute', top:-8, right:-8,
              fontSize:20, pointerEvents:'none', zIndex:12,
              filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
            }}>
              🎀
            </div>
          )}

          {/* Canvas — glow class applied directly so drop-shadow tracks egg shape */}
          <EggCanvas
            stats={eggStatsData}
            width={190} height={225}
            className={eggGlow ? `egg-glow-${eggGlow}` : ''}
            style={{ display:'block' }}
          />
        </div>

        {/* Hatch CTA */}
        {readyToHatch && (
          <button
            onClick={() => dispatch({ type: ACTIONS.SET_HATCHING, payload: true })}
            style={{
              marginTop:14, background:'linear-gradient(135deg,#FFD700,#FFA500)',
              color:'#5A3A00', border:'none', borderRadius:24,
              padding:'11px 28px', fontFamily:'Mitr,sans-serif',
              fontWeight:700, fontSize:17, cursor:'pointer',
              boxShadow:'0 4px 18px rgba(255,165,0,0.45)',
            }}
          >
            🥚 แตะเพื่อฟักไข่!
          </button>
        )}

        {/* Creature companion */}
        <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:48, overflow:'hidden' }}>
          {eggsHatched > 0 ? (
            <div
              style={{
                position:'absolute', bottom:4, left: creature.x,
                fontSize:26, lineHeight:1,
                transform:`scaleX(${creature.dir < 0 ? -1 : 1})`,
                cursor:'pointer', userSelect:'none',
                animation: creatureTapped ? 'egg-anim-pet 0.4s ease' : undefined,
              }}
              onClick={() => { setCreatureTapped(true); playTone('chirp'); setTimeout(() => setCreatureTapped(false), 500) }}
            >
              {lastCreatureEmoji}
            </div>
          ) : (
            <div style={{ position:'absolute', bottom:8, left:20, fontSize:11, color:'rgba(90,58,139,0.36)', fontFamily:'Mitr,sans-serif' }}>
              ❓ ฟักไข่เพื่อพบเพื่อนใหม่!
            </div>
          )}
        </div>
      </div>

      {/* Item tray */}
      <div style={{
        width:'100%', maxWidth:480, padding:'8px 20px',
        display:'flex', gap:10, justifyContent:'center', flexShrink:0,
        borderTop:'1px solid rgba(155,89,182,0.1)',
        background:'rgba(255,255,255,0.45)',
      }}>
        {ITEM_DEFS.map(({ key, emoji, label }) => {
          const count    = state.items?.[key] || 0
          const isActive = activeItem === key
          return (
            <div
              key={key}
              onClick={() => count > 0 && handleTapItem(key)}
              style={{
                width:64, height:64, borderRadius:16,
                background: isActive ? 'rgba(155,89,182,0.15)' : 'rgba(255,255,255,0.9)',
                border: isActive ? '2px solid #9B59B6' : '1.5px solid rgba(155,89,182,0.16)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                cursor: count > 0 ? 'pointer' : 'default', position:'relative',
                opacity: count > 0 ? 1 : 0.3,
                transform: isActive ? 'scale(1.1) translateY(-3px)' : 'scale(1)',
                transition:'all 0.14s',
                boxShadow: isActive ? '0 4px 14px rgba(155,89,182,0.22)' : 'none',
              }}
            >
              <span style={{ fontSize:22, lineHeight:1 }}>{emoji}</span>
              <span style={{ fontSize:8, color:'#7A5FB5', fontFamily:'Mitr,sans-serif', marginTop:2 }}>{label}</span>
              {count > 0 && (
                <div style={{
                  position:'absolute', top:-5, right:-5,
                  background:'#9B59B6', color:'#fff',
                  borderRadius:10, minWidth:17, height:17,
                  fontSize:9, fontWeight:700, fontFamily:'Mitr,sans-serif',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  padding:'0 3px', boxShadow:'0 1px 4px rgba(0,0,0,0.18)',
                }}>
                  {count}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action row — paddingBottom handled by #egg-home CSS (safe-area-aware) */}
      <div style={{
        width:'100%', maxWidth:480, padding:'6px 20px 10px',
        display:'flex', gap:10, flexShrink:0,
      }}>
        <button
          onClick={handlePetEgg}
          style={{
            flex:1, height:52, borderRadius:14,
            background:'rgba(255,255,255,0.85)',
            border:'1.5px solid rgba(155,89,182,0.18)',
            fontFamily:'Mitr,sans-serif', fontWeight:700, fontSize:14,
            color:'#7A4FB8', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:4,
            boxShadow:'0 2px 8px rgba(155,89,182,0.07)',
          }}
        >
          🤚 ลูบไข่
        </button>
        <button
          onClick={() => { playTone('tap'); navigate('collection') }}
          style={{
            flex:1, height:52, borderRadius:14,
            background:'rgba(255,255,255,0.85)',
            border:'1.5px solid rgba(155,89,182,0.18)',
            fontFamily:'Mitr,sans-serif', fontWeight:700, fontSize:14,
            color:'#7A4FB8', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:4,
            boxShadow:'0 2px 8px rgba(155,89,182,0.07)',
          }}
        >
          🥚 คอลเลกชัน
        </button>
        <button
          onClick={() => {
            playTone('start')
            dispatch({ type: ACTIONS.SET_CURRENT_WORLD, payload: 'adventure-thai' })
            dispatch({ type: ACTIONS.SET_SESSION_XP, payload: 0 })
            navigate('game')
          }}
          style={{
            flex:2, height:52, borderRadius:14,
            background:'linear-gradient(135deg,#8E44AD,#6C3483)',
            border:'none',
            fontFamily:'Mitr,sans-serif', fontWeight:700, fontSize:16,
            color:'#fff', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            boxShadow:'0 4px 18px rgba(140,68,173,0.38)',
          }}
        >
          🗺️ ออกสำรวจ!
        </button>
      </div>
    </div>
  )
}
