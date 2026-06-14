import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import HomeBackground from './HomeBackground.jsx'
import CreatureCanvas from './CreatureCanvas.jsx'
import { buildLegacyPreviewDNA } from '../lib/creatureGenerator.js'
import { EGG_STAGE_NAMES, EGG_STAGES } from '../lib/eggAlgorithm.js'
import { playTone, playBGM, stopBGM, playSFX } from '../lib/audio.js'

const ITEM_DEFS = [
  { key:'food',   label:'อาหาร' },
  { key:'ribbon', label:'ริบบิ้น' },
  { key:'potion', label:'น้ำมนต์' },
  { key:'star',   label:'ดาว' },
]
const ITEM_COLORS = { food:'#d46a2a', ribbon:'#ff88cc', potion:'#4488ff', star:'#ffcc00' }

// Duration (ms) for each idle animation before clearing state
const IDLE_DUR = {
  'idle-wiggle': 600,
  'idle-jump':   600,
  'idle-blink':  380,
  'idle-look':   1100,
  'idle-yawn':   1350,
}

// Interaction state machine — CSS class and auto-return duration for each state
const STATE_CSS = { idle:'float', pet:'pet', happy:'happy-spin', excited:'excited', eating:'eat', sleep:'sleepy', relax:'relax', reunion:'reunion' }
const STATE_DUR = { pet:500, happy:700, excited:1200, eating:900, sleep:2000, relax:1500, reunion:1200 }
const comboToState = n => n >= 8 ? 'excited' : n >= 4 ? 'happy' : 'pet'

export default function Home({ navigate, soundOn, toggleSound }) {
  const { state, dispatch, eggProgressData, eggStatsData } = useAppState()

  const [eggAnim, setEggAnim]             = useState('float')
  const [idleAnim, setIdleAnim]           = useState(null)
  const [activeItem, setActiveItem]       = useState(null)
  const [particles, setParticles]         = useState([])
  const [flyingItem, setFlyingItem]       = useState(null)
  const [eggGlow, setEggGlow]             = useState(null)
  const [hasRibbon, setHasRibbon]         = useState(false)
  const [creature, setCreature]           = useState({ x: 30, dir: 1 })
  const [creatureTapped, setCreatureTapped] = useState(false)
  const [creatureState, setCreatureState] = useState('walk') // walk|wave|sit|celebrate|gift|look|sleep
  const [ambientEvent, setAmbientEvent]   = useState(null)  // null | {type, id}
  const [stageUp, setStageUp]             = useState(null)  // null | {stage, id}
  const [healFloat, setHealFloat]         = useState(null)  // null | id

  const particleIdRef   = useRef(0)
  const animTimerRef    = useRef(null)
  const glowTimerRef    = useRef(null)
  const idleTimerRef    = useRef(null)
  const creatureRef     = useRef({ x: 30, dir: 1 })
  const creatureModeRef = useRef('walk')
  const initVisitRef    = useRef(state.lastHomeVisit)
  const stageRef        = useRef(0)
  const eggAnimRef      = useRef('float')
  const prevStageRef    = useRef(null)
  // Interaction state machine
  const smRef           = useRef({ state: 'idle', comboCount: 0, enteredAt: 0 })
  const enterRafRef     = useRef(null)
  const enterGenRef     = useRef(0)
  const comboResetRef   = useRef(null)

  const { stage } = eggProgressData
  const eggsHatched       = (state.hatchedEggs || []).length
  const lastCreatureDNA = useMemo(() => {
    const egg = state.hatchedEggs?.[0]
    if (!egg) return null
    if (egg.dna) return egg.dna
    try { return buildLegacyPreviewDNA(egg, 0) } catch (_) { return null }
  }, [state.hatchedEggs])
  const readyToHatch      = state.readyToHatch && stage >= EGG_STAGES - 1
  const boostActive       = (state.xpBoostEnd || 0) > Date.now()

  useEffect(() => {
    playBGM('home')
    return () => stopBGM()
  }, [])

  // Keep refs current
  useEffect(() => { stageRef.current = stage }, [stage])
  useEffect(() => { eggAnimRef.current = eggAnim }, [eggAnim])

  // Stage-up detection — skip first render by initializing prevStageRef to null
  useEffect(() => {
    if (prevStageRef.current === null) { prevStageRef.current = stage; return }
    if (stage > prevStageRef.current) {
      playTone('stageUp'); playSFX('stage_up')
      spawnParticles('sparkle', 18)
      spawnParticles('hearts', 6)
      const id = Date.now()
      setStageUp({ stage, id })
      setTimeout(() => setStageUp(prev => prev?.id === id ? null : prev), 2800)
    }
    prevStageRef.current = stage
  }, [stage]) // eslint-disable-line

  // Heartbeat sound pulses when egg is ready to hatch
  useEffect(() => {
    if (!readyToHatch) return
    playTone('heartbeat')
    const id = setInterval(() => playTone('heartbeat'), 8000)
    return () => clearInterval(id)
  }, [readyToHatch]) // eslint-disable-line

  // Record visit + reunion burst on mount
  useEffect(() => {
    const last = initVisitRef.current
    const now  = Date.now()
    const isReunion = !last || (now - last) > 4 * 60 * 60 * 1000
    dispatch({ type: ACTIONS.UPDATE_LAST_HOME_VISIT, payload: now })
    if (isReunion) {
      enterState('reunion')
      spawnParticles('hearts', 10)
      spawnParticles('sparkle', 8)
      playTone('chirp')
      setTimeout(() => playTone('chirp'), 360)
    }
  }, []) // eslint-disable-line

  // Random idle micro-animations — egg feels alive on its own
  useEffect(() => {
    const IDLE = [
      'idle-wiggle','idle-jump','idle-wiggle','idle-wiggle',
      'idle-blink','idle-look','idle-yawn',
      'idle-jump','idle-wiggle','idle-blink',
    ]
    const schedule = () => {
      idleTimerRef.current = setTimeout(() => {
        if (eggAnimRef.current === 'float') {
          const a = IDLE[Math.floor(Math.random() * IDLE.length)]
          setIdleAnim(a)
          setTimeout(() => setIdleAnim(null), IDLE_DUR[a] || 600)
          if (a === 'idle-yawn') {
            playTone('yawn')
          } else if (a === 'idle-jump') {
            if (Math.random() < 0.28) playTone('chirp')
          } else if (a === 'idle-wiggle' || a === 'idle-blink') {
            if (Math.random() < 0.16) playTone('chirp')
          } else if (a === 'idle-look') {
            if (Math.random() < 0.12) playTone('begging')
          }
        }
        schedule()
      }, 5000 + Math.random() * 7000)
    }
    schedule()
    return () => clearTimeout(idleTimerRef.current)
  }, []) // eslint-disable-line

  // Creature patrol — pauses during personality moments
  useEffect(() => {
    if (eggsHatched === 0) return
    const MAX_X = 230
    const id = setInterval(() => {
      if (creatureModeRef.current !== 'walk') return
      const s = creatureRef.current
      let x = s.x + s.dir * 0.5, dir = s.dir
      if (x >= MAX_X) { x = MAX_X; dir = -1 }
      if (x <= 10)    { x = 10;    dir =  1 }
      creatureRef.current = { x, dir }
      setCreature({ x, dir })
    }, 40)
    return () => clearInterval(id)
  }, [eggsHatched]) // eslint-disable-line

  // Creature personality behaviors — occasional moments of life
  useEffect(() => {
    if (eggsHatched === 0) return
    const BEHAVIORS = ['walk','walk','walk','walk','wave','sit','celebrate','gift','look','sleep']
    let timer
    const doSchedule = () => {
      timer = setTimeout(() => {
        const b = BEHAVIORS[Math.floor(Math.random() * BEHAVIORS.length)]
        if (b !== 'walk') {
          setCreatureState(b)
          creatureModeRef.current = b
          if (b === 'celebrate') {
            playTone('celebrate')
            spawnParticles('sparkle', 4)
          } else if (b === 'wave') {
            playTone('chirp')
          } else if (b === 'gift') {
            playTone('jingle')
          }
          setTimeout(() => {
            setCreatureState('walk')
            creatureModeRef.current = 'walk'
          }, 3500 + Math.random() * 2000)
        }
        doSchedule()
      }, 20000 + Math.random() * 25000)
    }
    doSchedule()
    return () => clearTimeout(timer)
  }, [eggsHatched]) // eslint-disable-line

  // Ambient events — rare visual delights: butterfly, falling leaf, shooting star
  useEffect(() => {
    const EVENTS = ['butterfly','leaf','star','butterfly','leaf','butterfly']
    const CLEAR_AFTER = { butterfly: 4800, leaf: 4400, star: 1200 }
    let timer
    const doSchedule = () => {
      timer = setTimeout(() => {
        const type = EVENTS[Math.floor(Math.random() * EVENTS.length)]
        const id = Date.now()
        setAmbientEvent({ type, id })
        setTimeout(() => setAmbientEvent(prev => prev?.id === id ? null : prev), CLEAR_AFTER[type])
        doSchedule()
      }, 38000 + Math.random() * 50000) // 38–88s between events
    }
    doSchedule()
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line

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

  const handlePetEgg = () => {
    if (readyToHatch) { dispatch({ type: ACTIONS.SET_HATCHING, payload: true }); return }
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
    const count = state.items?.[key] || 0
    if (count <= 0) return
    dispatch({ type: ACTIONS.USE_ITEM, payload: { key } })
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
      setHasRibbon(true)
      playTone('jingle')
      spawnParticles('sparkle', 6)
      setGlow('pink', 1200)
      enterState('happy', 800)

    } else if (key === 'potion') {
      playTone('slurp')
      spawnParticles('sparkle', 6)
      setGlow('blue', 2000)
      enterState('relax', 1500)

    } else if (key === 'star') {
      playTone('celebrate')
      spawnParticles('sparkle', 12)
      spawnParticles('hearts', 4)
      setGlow('gold', 3000)
      enterState('happy', 900)
    }
  }

  const handleEggTap = () => activeItem ? handleTapItem(activeItem) : handlePetEgg()

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

      <HomeBackground hour={hour} />

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
          {EGG_STAGE_NAMES[stage] || 'ไข่น้อย'}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {readyToHatch && (
            <div className="px-badge" style={{
              background:'var(--px-yellow)', color:'var(--px-black)',
              animation:'challenger-pulse 1s ease-in-out infinite',
            }}>
              พร้อมฟัก!
            </div>
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

        {/* Creature companion */}
        <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:52, overflow:'visible' }}>
          {eggsHatched > 0 ? (
            <div
              style={{ position:'absolute', bottom:4, left:creature.x, cursor:'pointer', userSelect:'none' }}
              onClick={() => {
                setCreatureTapped(true)
                playTone('chirp')
                setTimeout(() => setCreatureTapped(false), 500)
              }}
            >
              {/* Directional flip — separate from animation so they don't fight */}
              <div style={{ transform:`scaleX(${creature.dir < 0 ? -1 : 1})`, display:'inline-flex', alignItems:'flex-end', gap:2 }}>
                {/* Creature canvas + behavior animation */}
                <div
                  className={
                    creatureState === 'wave'      ? 'creature-wave' :
                    creatureState === 'celebrate' ? 'creature-celebrate' :
                    creatureTapped                ? 'egg-anim-pet' : ''
                  }
                  style={{
                    display:'inline-block',
                    transform: creatureState === 'sit' ? 'rotate(14deg) translateY(4px)' : undefined,
                    opacity: creatureState === 'sleep' ? 0.48 : 1,
                    transition:'transform 0.35s, opacity 0.5s',
                  }}
                >
                  <CreatureCanvas dna={lastCreatureDNA} size={26} animationEnabled={false} style={{ borderRadius:4 }} />
                </div>

                {/* Behavior overlays — shown inline next to creature */}
                {creatureState === 'wave' && (
                  <span style={{ fontSize:9, lineHeight:1, fontFamily:'var(--font-thai)', color:'#aaffaa',
                    animation:'creature-overlay-bob .45s ease-in-out infinite alternate',
                    display:'inline-block',
                  }}>ทัก!</span>
                )}
                {creatureState === 'gift' && (
                  <span style={{ fontSize:9, lineHeight:1, fontFamily:'var(--font-thai)', color:'#ffaa88', display:'inline-block' }}>ของ</span>
                )}
                {creatureState === 'celebrate' && (
                  <span style={{ fontSize:9, lineHeight:1, fontFamily:'var(--font-thai)', color:'#ffff88', display:'inline-block' }}>สนุก!</span>
                )}
                {creatureState === 'sleep' && (
                  <span style={{ fontSize:9, lineHeight:1, color:'#aaaaff', opacity:0.7, display:'inline-block' }}>zz</span>
                )}
                {creatureState === 'look' && (
                  <span style={{ fontSize:9, lineHeight:1, color:'#aaaaaa', display:'inline-block' }}>...</span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ position:'absolute', bottom:8, left:20, fontSize:11, color:'rgba(90,58,139,0.36)', fontFamily:'Mitr,sans-serif' }}>
              ฟักไข่เพื่อพบเพื่อนใหม่!
            </div>
          )}
        </div>
      </div>

      {/* Party HP bars */}
      {(state.party || []).length > 0 && (
        <div style={{
          width:'100%', maxWidth:480, padding:'5px 14px',
          display:'flex', gap:8, justifyContent:'center',
          flexShrink:0, position:'relative',
          background:'var(--px-darker, #16162a)',
          borderTop:'1px solid var(--px-border)',
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
          {(state.party || []).map(id => {
            const c = (state.hatchedEggs || []).find(e => e.id === id)
            if (!c) return null
            const maxHP = c.stats?.HP ?? 10
            const curHP = c.currentHP ?? maxHP
            const pct   = Math.max(0, (curHP / maxHP) * 100)
            const dna   = c.dna ?? (() => { try { return buildLegacyPreviewDNA(c, 0) } catch { return null } })()
            return (
              <div key={id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:48 }}>
                {dna ? (
                  <CreatureCanvas dna={dna} size={22} animationEnabled={false} />
                ) : (
                  <div style={{ fontSize:16 }}>🥚</div>
                )}
                <div style={{
                  fontFamily:'var(--font-thai)', fontSize:7,
                  color:'rgba(255,255,255,0.5)',
                  maxWidth:44, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                  {c.creature?.n || '?'}
                </div>
                <div style={{ width:44, background:'#000', border:'1px solid #333', height:4 }}>
                  <div style={{
                    width:`${pct}%`, height:'100%',
                    background: pct > 50 ? '#4acd4a' : pct > 20 ? '#cdcd20' : '#cd2020',
                    transition:'width 300ms steps(8)',
                  }} />
                </div>
                <div style={{
                  fontFamily:'var(--font-pixel)', fontSize:6,
                  color:'rgba(255,255,255,0.35)',
                }}>
                  {curHP}/{maxHP}
                </div>
              </div>
            )
          })}
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
          const count    = state.items?.[key] || 0
          const isActive = activeItem === key
          return (
            <div
              key={key}
              onClick={() => count > 0 && handleTapItem(key)}
              className="px-item-card"
              style={{
                width:60,
                opacity: count > 0 ? 1 : 0.35,
                cursor: count > 0 ? 'pointer' : 'default',
                border: isActive ? '2px solid var(--px-purple)' : undefined,
                transform: isActive ? 'scale(1.1) translateY(-3px)' : 'scale(1)',
                boxShadow: isActive ? '3px 3px 0 var(--px-purple)' : undefined,
              }}
            >
              <div style={{ width:22, height:22, background:ITEM_COLORS[key], margin:'0 auto 2px', border:'2px solid rgba(0,0,0,0.3)' }} />
              <span style={{ fontFamily:'var(--font-thai)', fontSize:8, color:'var(--px-light)', marginTop:2 }}>{label}</span>
              {count > 0 && (
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
          onClick={handlePetEgg}
          className="px-btn px-btn-dark"
          style={{ flex:1, height:48, fontFamily:'var(--font-thai)', fontSize:13 }}
        >
          ลูบไข่
        </button>
        <button
          onClick={() => { playTone('tap'); navigate('collection') }}
          className="px-btn px-btn-dark"
          style={{ flex:1, height:48, fontFamily:'var(--font-thai)', fontSize:13 }}
        >
          คอลเลกชัน
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
