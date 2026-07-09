// Home.jsx — main hub (full-screen room redesign 2026-07-03):
//   The isometric room fills the whole screen. The companion egg WALKS around the
//   floor inside it (DecoratedRoom, iso-aware wander AI) and is the interactive
//   element. Header (avatar/name/stage · streak · coins) and status bar (HP/XP/Bond)
//   are translucent floating overlays pinned to the top. All actions are small
//   floating icon buttons overlaid on the room: 🎮 minigame, 🗺️ explore, and the
//   4-item cluster (🍗 food · 🎀 ribbon · 👟 shoes · ⭐ rainbow star).
// BottomNav is rendered by App.jsx (not here).
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
import { showToast, spawnConfetti } from './Toasts.jsx'
import { unlockedGames, livesRemaining } from '../lib/minigameLives.js'
import { FOOD_CATALOG } from '../lib/eggCare.js'

const BOTTOM_NAV_H = 80   // px — clearance for the fixed .px-bottom-nav rendered by App.jsx

// Map egg XP stage (0–8) to companion aura level (0–4) — used by the small header avatar.
function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}
// Map CSS-animation state name (from useCreatureInteraction) to egg-sprite anim/mood.
function cssAnimToEggAnim(cssAnim) {
  if (cssAnim === 'sleepy' || cssAnim === 'relax') return 'sleepy'
  if (cssAnim === 'excited' || cssAnim === 'reunion') return 'excited'
  if (cssAnim === 'happy-spin' || cssAnim === 'pet') return 'happy'
  if (cssAnim === 'eat') return 'happy'
  return 'idle'
}
function cssAnimToMood(cssAnim) {
  if (cssAnim === 'sleepy' || cssAnim === 'relax') return 'sleepy'
  if (cssAnim === 'excited' || cssAnim === 'reunion') return 'excited'
  if (cssAnim === 'happy-spin' || cssAnim === 'pet' || cssAnim === 'eat') return 'happy'
  return 'normal'
}

const ITEM_DEFS = [
  { key:'food',         label:'น่องไก่',   effect:'HP+100' },
  { key:'ribbon',       label:'ริบบิ้น',   effect:'SPD+10' },
  { key:'shoes',        label:'รองเท้า',   effect:'วิ่ง×4' },
  { key:'rainbow_star', label:'ดาวสีรุ้ง', effect:'ล่องหนจากมอนสเตอร์ตาม' },
]

// Minigame splash: kid-facing emoji + short Thai name per game key
const MINI_SPLASH = {
  memory:  { emoji:'🃏', name:'จับคู่ไข่' },
  catch:   { emoji:'🧺', name:'รับไข่' },
  eggrun:  { emoji:'🏃', name:'ไข่วิ่ง' },
  tower:   { emoji:'🏗️', name:'ต่อบล็อก' },
  fishing: { emoji:'🎣', name:'ตกปลา' },
  readaloud: { emoji:'🎤', name:'อ่านให้ไข่ฟัง' },
}

// Accent colors
const C_COIN   = '#FFD23F'
const C_STREAK = '#FF6B35'
const C_BOND   = '#9B5DE5'

// SPEC GAME-A §A.1 Care Loop ────────────────────────────────────────────────
// Quiet hours (device local time) — 19:30 to 07:00. No parentControls.
// quietHours override exists in this codebase yet (grepped, confirmed absent),
// so this is device-clock-only for now — flagged in the handoff as a real
// gap between the spec's mention of an override and what this codebase
// actually has to hook into.
function isQuietHours(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= 19 * 60 + 30 || mins < 7 * 60
}

export default function Home({ navigate, onOpenLogin, onOpenProfile }) {
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
  const [bondReaction, setBondReaction]     = useState(null) // floating emoji reaction over egg
  const [healFloat, setHealFloat]         = useState(null)  // null | id

  // ── SPEC GAME-A §A.1 Care Loop state ────────────────────────────────────
  const [foodTrayOpen, setFoodTrayOpen]   = useState(false)
  const [armedFood, setArmedFood]         = useState(null) // foodKey armed, waiting for a tap-the-egg to feed
  const [feedReaction, setFeedReaction]   = useState(null) // { emoji, text, id } | null — floats over the egg
  const [wakeUpScene, setWakeUpScene]     = useState(null) // { grantedFood } | null — full-screen morning scene
  const [comebackScene, setComebackScene] = useState(false) // full-screen "คิดถึงจังเลย!" long-absence joy scene
  const [sleepSceneOpen, setSleepSceneOpen] = useState(false)
  const [nowTick, setNowTick]             = useState(() => Date.now()) // re-evaluate isQuietHours periodically
  const holdTimerRef = useRef(null)
  const holdFiredRef = useRef(false)

  const initVisitRef    = useRef(state.lastHomeVisit)

  // Room walker bridge — DecoratedRoom writes live position into followRef's transform
  // and exposes an imperative walkToScreen() through roomApiRef.
  const roomContainerRef = useRef(null)
  const followRef        = useRef(null)
  const roomApiRef       = useRef(null)
  const walkerPosRef     = useRef({ x: 0, y: 0 })
  const itemBtnRefs      = useRef({})

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

  // ── SPEC GAME-A §A.1 Care Loop ───────────────────────────────────────────

  // TICK_CARE on mount (catches up on any elapsed-while-closed gap) + every
  // 5 minutes while the app stays open, per spec.
  useEffect(() => {
    dispatch({ type: ACTIONS.TICK_CARE })
    const id = setInterval(() => dispatch({ type: ACTIONS.TICK_CARE }), 5 * 60_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line

  // Re-check quiet-hours roughly once a minute so the sleepy indicator/scene
  // appears and clears at the right wall-clock moment without a full reload.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const quietHours = isQuietHours(new Date(nowTick))

  // Daily wake-up scene: consumed once, then cleared. Framed entirely as a
  // warm morning greeting + small gift — never a "you were asleep" scold.
  useEffect(() => {
    if (!state.eggCare?.pendingWakeUp) return
    const granted = state.eggCare.pendingWakeUp
    playTone('stageUp')
    setWakeUpScene(granted)
    const t = setTimeout(() => {
      setWakeUpScene(null)
      dispatch({ type: ACTIONS.CLEAR_PENDING_WAKE_UP })
    }, 2600)
    return () => clearTimeout(t)
  }, [state.eggCare?.pendingWakeUp]) // eslint-disable-line

  // Long-absence comeback joy: additive to (not a replacement for) the
  // existing shorter-gap ambient "reunion" burst in useHomeAmbience.js —
  // this one is reserved for genuinely long absences (see eggCare.js's
  // COMEBACK_JOY_THRESHOLD_HOURS) and always shows ONLY joy, per the
  // design guardrail — "คิดถึงจังเลย!" (I missed you so much!), never guilt.
  useEffect(() => {
    if (!state.eggCare?.pendingComebackJoy) return
    enterState('reunion')
    spawnParticles('hearts', 14)
    spawnParticles('sparkle', 10)
    setComebackScene(true)
    const t = setTimeout(() => {
      setComebackScene(false)
      dispatch({ type: ACTIONS.CLEAR_PENDING_COMEBACK_JOY })
    }, 2600)
    return () => clearTimeout(t)
  }, [state.eggCare?.pendingComebackJoy]) // eslint-disable-line

  // Shake-to-dizzy (devicemotion, if available — many desktop browsers and
  // some mobile ones never fire this event at all; feature-detected and
  // silently absent where unsupported, per spec).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) return
    let lastShake = 0
    function onMotion(e) {
      const a = e.accelerationIncludingGravity
      if (!a) return
      const magnitude = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0)
      const now = Date.now()
      if (magnitude > 35 && now - lastShake > 2000) {
        lastShake = now
        enterState('happy', 900)
        playTone('giggle')
        spawnParticles('sparkle', 6)
        dispatch({ type: ACTIONS.PET_EGG })
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, []) // eslint-disable-line

  // Two-finger tickle — a native multi-touch touchstart on the room wrapper.
  // Safe to add without touching DecoratedRoom.jsx's own single-pointer tap/
  // swipe hit-testing: a genuine 2-finger touch is a distinguishable input
  // its own logic doesn't meaningfully act on.
  useEffect(() => {
    const el = roomContainerRef.current
    if (!el) return
    function onTouchStart(e) {
      if (e.touches && e.touches.length >= 2) {
        playTone('giggle')
        spawnParticles('hearts', 4)
        spawnParticles('sparkle', 4)
        enterState('happy', 700)
        dispatch({ type: ACTIONS.PET_EGG })
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    return () => el.removeEventListener('touchstart', onTouchStart)
  }, []) // eslint-disable-line

  // Feed result reaction (chomp/favorite-hearts-burst/overfed) — driven by
  // the transient _feedResult signal FEED_EGG's reducer case sets.
  useEffect(() => {
    const r = state._feedResult
    if (!r) return
    if (r.overfed) {
      setFeedReaction({ emoji: '😌', text: 'อิ่มแล้ว~', id: r.id })
      playTone('chirp')
    } else if (r.fed) {
      const food = FOOD_CATALOG[r.food]
      enterState('eating')
      playCreatureSoundSafe('food')
      playTone('chirp')
      spawnParticles('sparkle', r.isFavorite ? 3 : 6)
      if (r.isFavorite) {
        spawnParticles('hearts', 10)
        setFeedReaction({ emoji: '💕', text: `${food.nameTh} ชอบที่สุดเลย!`, id: r.id })
        playTone('celebrate')
      } else {
        spawnParticles('hearts', 3)
        setFeedReaction({ emoji: food.emoji, text: 'อร่อย!', id: r.id })
      }
    }
    const t = setTimeout(() => setFeedReaction(prev => prev?.id === r.id ? null : prev), 1400)
    return () => clearTimeout(t)
  }, [state._feedResult]) // eslint-disable-line

  function playCreatureSoundSafe(moment) {
    try { playCreatureSound(voiceProfile, moment) } catch { /* best-effort, never blocks feeding */ }
  }

  // Soft lullaby loop while the sleep scene is open — reuses the existing
  // 'sleep' playCreatureSound moment (a slow 3-note descending tone) on a
  // gentle interval rather than a full new composed BGM track, a deliberate
  // scope simplification for A.1 (full musical polish is more natural §A.3
  // "ให้สวยที่สุด" territory).
  useEffect(() => {
    if (!sleepSceneOpen) return
    playCreatureSoundSafe('sleep')
    const id = setInterval(() => playCreatureSoundSafe('sleep'), 4000)
    return () => clearInterval(id)
  }, [sleepSceneOpen]) // eslint-disable-line

  // ── Status bar values ──────────────────────────────────────────────────────
  const maxHP     = activeEgg?.stats?.HP ?? 100
  const currentHP = activeEgg?.currentHP ?? maxHP
  const hpPct     = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
  const xpPct     = Math.max(0, Math.min(100, eggProgressData.pct ?? 0))
  const bondPct   = Math.max(0, Math.min(100, activeEgg?.bondMeter ?? 0))

  const stageName = EGG_STAGE_NAMES[stage] || 'ไข่น้อย'
  const eggLevel  = activeEgg?.battleLevel ?? 1

  // ── Minigame shortcut: random selection among unlocked games with lives left ──
  const miniUnlocked  = unlockedGames(eggLevel)
  const miniTotalLives = miniUnlocked.reduce((sum, k) => sum + livesRemaining(state, k), 0)
  const [miniSplash, setMiniSplash] = useState(null)  // {emoji,name} shown ~800ms before launch
  const launchRandomMinigame = () => {
    if (miniSplash) return
    playTone('tap')
    const pool = miniUnlocked.filter(k => livesRemaining(state, k) > 0)
    if (pool.length === 0) {
      showToast('เกมทั้งหมดเล่นครบแล้ววันนี้! มาใหม่พรุ่งนี้นะ 🌙')
      return
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    playSFX('minigame_start')
    setMiniSplash(MINI_SPLASH[pick] || { emoji:'🎮', name:'มินิเกม' })
    // SPEC GAME-A §A.1: energy decays "during PLAY time only" — modeled as a
    // small cost per genuine play SESSION launched (see PLAY_TOUCH_GAME's own
    // reducer comment for the full reasoning), distinct from PET_EGG's
    // per-gesture cost.
    dispatch({ type: ACTIONS.PLAY_TOUCH_GAME })
    setTimeout(() => {
      playBGM('minigame')
      dispatch({ type: ACTIONS.SET_CURRENT_WORLD, payload: pick })
      navigate('game')
    }, 850)
  }

  // ── unlock_new: detect a minigame crossing its unlock-level threshold ──────
  const prevUnlockedRef = useRef(null)
  useEffect(() => {
    if (prevUnlockedRef.current === null) {
      prevUnlockedRef.current = new Set(miniUnlocked)
      return
    }
    const grew = miniUnlocked.some(k => !prevUnlockedRef.current.has(k))
    if (grew) playSFX('unlock_new')
    prevUnlockedRef.current = new Set(miniUnlocked)
  }, [eggLevel]) // eslint-disable-line

  // Feed the currently-armed food (SPEC GAME-A §A.1 "drag food onto egg",
  // simplified to arm-in-tray-then-tap-egg — the same established pattern
  // this codebase already uses for the old homeItems 🍗/🎀/👟/⭐ tray, since
  // genuine mobile drag-and-drop physics would be new, riskier surface area
  // for comparatively little extra feel; a flying-food + chomp animation
  // still sells a convincing "feeding" moment. Documented as a deliberate
  // simplification, not a silent shortcut.
  function feedArmedFood() {
    if (!armedFood) return
    setFlyingItem({ label: FOOD_CATALOG[armedFood]?.nameTh || '', id: Date.now() })
    dispatch({ type: ACTIONS.FEED_EGG, payload: { food: armedFood, element: resolved.element } })
    setArmedFood(null)
    setTimeout(() => setFlyingItem(null), 620)
  }

  // Egg tap (routed up from DecoratedRoom when a tap lands near the walker):
  // a held tap (>=1000ms down-to-up) leans the egg in with eyes closed
  // (SPEC GAME-A §A.1 "Hold 1s" gesture) instead of the normal pet/combo —
  // detected by composing with a wrapper-level pointerdown timestamp (see
  // the onPointerDown handler on the room container below) rather than
  // touching DecoratedRoom.jsx's own tap-vs-walk hit-testing internals.
  // Otherwise: armed food → feed it; armed item → use it; else post-hatch
  // adds bond (+reaction), pre-hatch pets / triggers hatch.
  const onEggTap = (e) => {
    const heldMs = holdTimerRef.current ? Date.now() - holdTimerRef.current : 0
    holdTimerRef.current = null
    if (heldMs >= 1000 && !holdFiredRef.current) {
      holdFiredRef.current = true
      enterState('relax', 1400)
      playTone('sigh')
      dispatch({ type: ACTIONS.PET_EGG })
      setTimeout(() => { holdFiredRef.current = false }, 1500)
      return
    }
    if (armedFood) { feedArmedFood(); return }
    if (activeItem) { handleTapItem(activeItem); return }
    if (eggsHatched > 0) { handleCreatureTap(e); return }
    handleEggTap(e)
  }

  // Item button tap: cue the walker to trot over to the button, then run the
  // existing arm-then-use flow (handleTapItem). Effects anchor to the walker
  // (via the follow layer) which is now standing at the button.
  const onItemButton = (key) => {
    const btn = itemBtnRefs.current[key]
    const cont = roomContainerRef.current
    if (btn && cont && roomApiRef.current?.walkToScreen) {
      const b = btn.getBoundingClientRect()
      const c = cont.getBoundingClientRect()
      roomApiRef.current.walkToScreen(b.left + b.width / 2 - c.left, b.top + b.height / 2 - c.top)
    }
    handleTapItem(key)
  }

  const spriteAnim = cssAnimToEggAnim(eggAnim)
  const spriteMood = cssAnimToMood(eggAnim)

  return (
    <div id="egg-home" style={{
      width:'100%', height:'100dvh', position:'relative',
      overflowX:'hidden', overflowY:'hidden',
    }}>

      {/* Minigame launch splash — ~800ms bounce-in before navigating to the game */}
      {miniSplash && (
        <div style={{
          position:'fixed', inset:0, zIndex:2000, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:14,
          background:'rgba(8,6,20,0.86)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)',
          animation:'mg-splash-fade .18s ease-out both',
        }}>
          <div style={{ fontSize:96, animation:'mg-splash-emoji .5s cubic-bezier(.2,.8,.3,1.4) both' }}>{miniSplash.emoji}</div>
          <div style={{ fontFamily:'var(--font-thai)', fontSize:22, fontWeight:800, color:'#fff', animation:'mg-splash-fade .3s ease-out .25s both' }}>{miniSplash.name}</div>
          <div style={{ fontFamily:'var(--font-pixel)', fontSize:24, color:'#FFD23F', animation:'mg-splash-go .4s ease-out .45s both' }}>GO!</div>
        </div>
      )}

      {/* Morning wake-up scene (SPEC GAME-A §A.1) — warm greeting + small gift,
          never framed as "you slept in" or any kind of scold. */}
      {wakeUpScene && (
        <div style={{
          position:'fixed', inset:0, zIndex:1900, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:12,
          background:'linear-gradient(180deg, rgba(255,214,140,0.92), rgba(255,180,120,0.92))',
          animation:'mg-splash-fade .25s ease-out both',
        }}>
          <div style={{ fontSize:80, animation:'mg-splash-emoji .5s cubic-bezier(.2,.8,.3,1.4) both' }}>🌅🥚</div>
          <div style={{ fontFamily:'var(--font-thai)', fontSize:22, fontWeight:800, color:'#5b3a1a', textShadow:'0 1px 4px rgba(255,255,255,0.5)' }}>
            อรุณสวัสดิ์!
          </div>
          <div style={{ fontFamily:'var(--font-thai)', fontSize:14, color:'#6b4a2a' }}>
            ได้รับ {FOOD_CATALOG[wakeUpScene.grantedFood]?.emoji} {FOOD_CATALOG[wakeUpScene.grantedFood]?.nameTh} ฟรี!
          </div>
        </div>
      )}

      {/* Long-absence comeback joy scene (SPEC GAME-A §A.1 design guardrail) —
          ONLY ever joy, never guilt. Additive to the shorter-gap ambient
          reunion burst already in useHomeAmbience.js. */}
      {comebackScene && (
        <div style={{
          position:'fixed', inset:0, zIndex:1900, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:10, pointerEvents:'none',
          animation:'mg-splash-fade .25s ease-out both',
        }}>
          <div style={{ fontSize:70, animation:'mg-splash-emoji .5s cubic-bezier(.2,.8,.3,1.4) both' }}>🥚💕</div>
          <div style={{
            fontFamily:'var(--font-thai)', fontSize:24, fontWeight:800, color:'#fff',
            textShadow:'0 2px 10px rgba(0,0,0,0.6)',
          }}>
            คิดถึงจังเลย!
          </div>
        </div>
      )}

      {/* Sleep scene overlay — dim room, stars, breathing egg, soft lullaby.
          Playing is still fully allowed; this is a gentle visual cue only,
          never an enforcement/lockout (enforcement is a parent-control
          concern, out of scope here). */}
      {sleepSceneOpen && (
        <div
          onClick={() => setSleepSceneOpen(false)}
          style={{
            position:'fixed', inset:0, zIndex:1800, cursor:'pointer',
            background:'radial-gradient(ellipse at 50% 40%, rgba(40,40,90,0.85), rgba(8,8,24,0.96))',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16,
          }}
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{
              position:'absolute',
              top: `${(i * 37) % 90 + 3}%`, left: `${(i * 53) % 92 + 2}%`,
              fontSize: 6 + (i % 3) * 3, color:'#fff', opacity: 0.5 + (i % 4) * 0.12,
              animation:`mg-spark-blink ${1.6 + (i % 5) * 0.4}s ease-in-out ${(i % 6) * 0.3}s infinite`,
            }}>✦</span>
          ))}
          <div style={{ fontSize:72, animation:'egg-idle 3s ease-in-out infinite' }}>😴🥚</div>
          <div style={{ fontFamily:'var(--font-thai)', fontSize:15, color:'rgba(255,255,255,0.75)' }}>
            ไข่หลับอยู่... แตะเพื่อกลับไปเล่นนะ
          </div>
        </div>
      )}

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

      {/* Ambient events — rare visual moments (full-screen, don't track the walker) */}
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

      {/* ── Full-screen room (fills everything above the bottom nav) ─────────── */}
      <div
        ref={roomContainerRef}
        onPointerDown={() => { holdTimerRef.current = Date.now() }}
        style={{
          position:'absolute', inset:0, marginBottom:BOTTOM_NAV_H,
          overflow:'hidden',
        }}
      >
        {/* The interactive walking-egg room */}
        <DecoratedRoom
          style={{ position:'absolute', inset:0, zIndex:0 }}
          apiRef={roomApiRef}
          followRef={followRef}
          walkerPosRef={walkerPosRef}
          onPetTap={onEggTap}
          onSwipe={handleCreatureSwipe}
          anim={spriteAnim}
          mood={spriteMood}
        />

        {/* Follow layer — reaction emoji / heal float / tap particles track the egg.
            DecoratedRoom sets this div's transform to the egg's live screen position. */}
        <div ref={followRef} style={{
          position:'absolute', left:0, top:0, zIndex:8,
          pointerEvents:'none', willChange:'transform',
        }}>
          <div style={{ position:'absolute', left:0, top:-58, transform:'translateX(-50%)', textAlign:'center' }}>
            {bondReaction && (
              <div key={`br-${bondReaction}`} style={{
                fontSize:26, animation:'dmg-float 0.85s ease-out forwards',
              }}>
                {bondReaction}
              </div>
            )}
            {healFloat && (
              <div key={healFloat} style={{
                fontFamily:'var(--font-pixel)', fontSize:11, color:'#44ee44',
                animation:'dmg-float 1.1s ease-out forwards',
              }}>
                +100 HP
              </div>
            )}
          </div>
          {particles.map(p => (
            <div key={p.id} style={{
              position:'absolute', top:0, left:0,
              marginTop:p.dy, marginLeft:p.dx,
              animation:`particle-rise ${p.dur}ms ease forwards`,
            }}>
              <div style={{
                width: p.type==='hearts'?8:6, height: p.type==='hearts'?8:6,
                background: p.type==='hearts'?'#ff6677':'#ffdd44',
                boxShadow: `0 0 4px ${p.type==='hearts'?'#ff6677':'#ffdd44'}`,
              }} />
            </div>
          ))}
        </div>

        {/* ── Top overlay: header + status bar (translucent, float over the room) ── */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:12,
          display:'flex', flexDirection:'column', alignItems:'center',
          pointerEvents:'none',
        }}>
          {/* Header */}
          <div style={{
            width:'100%', maxWidth:480, padding:'10px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
            background:'rgba(10,8,22,0.40)', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)',
          }}>
            <button
              onClick={() => (isLoggedIn ? onOpenProfile?.() : onOpenLogin?.())}
              style={{
                display:'flex', alignItems:'center', gap:8, minWidth:0, pointerEvents:'auto',
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
                  textShadow:'0 1px 4px rgba(0,0,0,0.7)',
                }}>
                  {state.name || 'โปรไฟล์'}
                </span>
                <span style={{
                  fontFamily:'var(--font-thai)', fontSize:9, color:'rgba(255,255,255,0.7)',
                  lineHeight:1.1, whiteSpace:'nowrap', textShadow:'0 1px 3px rgba(0,0,0,0.7)',
                }}>
                  {stageName}
                </span>
              </div>
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:3,
                background:'rgba(255,107,53,0.20)', border:`1px solid ${C_STREAK}66`,
                padding:'3px 7px',
              }}>
                <span style={{ fontSize:11 }}>🔥</span>
                <span style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:C_STREAK, letterSpacing:0.5 }}>
                  {state.loginStreak || 0}
                </span>
              </div>
              <div style={{
                display:'flex', alignItems:'center', gap:3,
                background:'rgba(255,210,63,0.18)', border:`1px solid ${C_COIN}66`,
                padding:'3px 7px',
              }}>
                <span style={{ fontSize:11 }}>🪙</span>
                <span style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:C_COIN, letterSpacing:0.5 }}>
                  {state.coins || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Status bar (HP · XP · Bond) */}
          <div style={{
            width:'100%', maxWidth:480, padding:'5px 16px',
            display:'flex', alignItems:'center', gap:10,
            background:'rgba(10,8,22,0.28)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)',
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
                  border:'1px solid rgba(255,255,255,0.14)', overflow:'hidden',
                }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Lv · stage-name pill */}
        <div style={{
          position:'absolute', top:92, left:'50%', transform:'translateX(-50%)', zIndex:7,
          pointerEvents:'none', display:'inline-flex', alignItems:'center', gap:6,
          background:'rgba(10,8,22,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
          border:'1px solid rgba(255,255,255,0.15)', padding:'4px 12px',
        }}>
          <span style={{ fontFamily:'var(--font-pixel)', fontSize:8, color:C_COIN, letterSpacing:0.5 }}>
            Lv.{eggLevel}
          </span>
        </div>

        {/* 🎮 Minigame — floating, upper-left. Enhanced circular button (2026-07-05):
            rotating/pulsing glow ring + orbiting sparkles; badge pulses+recolors when
            lives run low; dimmed 😴 swap when all daily plays are used up. */}
        {(() => {
          const out = miniTotalLives === 0            // all plays used today
          const low = miniTotalLives > 0 && miniTotalLives <= 2
          const badgeColor = low ? '#FF6B35' : '#2ec16b'
          return (
        <button
          onClick={launchRandomMinigame}
          aria-label={out ? 'เกมทั้งหมดเล่นครบแล้ววันนี้' : `มินิเกม (มีหัวใจ ${miniTotalLives} ดวง)`}
          style={{
            position:'absolute', top:96, left:14, zIndex:10,
            width:54, height:54, borderRadius:'50%', padding:0,
            background:'rgba(10,8,22,0.60)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
            border:'2px solid rgba(155,93,229,0.85)', boxShadow:'0 3px 10px rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            opacity: out ? 0.5 : 1,
          }}
        >
          {/* rotating glow ring (hidden when out of plays) */}
          {!out && (
            <span style={{
              position:'absolute', inset:-5, borderRadius:'50%', pointerEvents:'none',
              background:'conic-gradient(from 0deg, rgba(155,93,229,0), rgba(255,210,63,.9), rgba(155,93,229,0))',
              filter:'blur(2px)', animation:'mg-ring-spin 3.5s linear infinite',
            }} />
          )}
          {!out && (
            <span style={{
              position:'absolute', inset:-3, borderRadius:'50%', pointerEvents:'none',
              border:'2px solid rgba(255,210,63,.55)', animation:'mg-ring-pulse 2s ease-in-out infinite',
            }} />
          )}
          {/* orbiting sparkle dots */}
          {!out && [
            { top:-6, left:'50%', d:'0s' },
            { top:'50%', right:-6, d:'.7s' },
            { bottom:-5, left:'30%', d:'1.3s' },
          ].map((p, i) => (
            <span key={i} style={{ position:'absolute', ...p, fontSize:9, pointerEvents:'none', animation:`mg-spark-blink 1.6s ease-in-out ${p.d} infinite` }}>✨</span>
          ))}
          <span style={{ fontSize:28, lineHeight:1, position:'relative', zIndex:1 }}>{out ? '😴' : '🎮'}</span>
          {miniTotalLives > 0 && (
            <span className="px-badge" style={{
              position:'absolute', top:-4, right:-4, background:badgeColor,
              animation: low ? 'mg-badge-lowpulse 0.9s ease-in-out infinite' : 'none',
            }}>{miniTotalLives}</span>
          )}
        </button>
          )
        })()}

        {/* 🗺️ Explore — floating, lower-right */}
        <button
          onClick={() => {
            playTone('start')
            dispatch({ type: ACTIONS.ENTER_WORLD, payload: { region: 'green-meadow', screen: 'BM' } })
            navigate('world')
          }}
          aria-label="ออกสำรวจ"
          style={{
            position:'absolute', bottom:18, right:14, zIndex:10,
            width:60, height:60, borderRadius:'50%', padding:0,
            background:'rgba(155,93,229,0.30)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
            border:'2px solid rgba(155,93,229,0.95)', boxShadow:'0 3px 12px rgba(0,0,0,0.55)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            animation:'challenger-pulse 2.4s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize:30, lineHeight:1 }}>🗺️</span>
        </button>

        {/* 🍎 Food tray toggle — floating, upper-right (SPEC GAME-A §A.1).
            While a food is armed, tapping this cancels the arm instead of
            reopening the tray — a cheap escape hatch so an armed food doesn't
            sit waiting indefinitely if the child changes their mind. */}
        <button
          onClick={() => {
            playTone('tap')
            if (armedFood) { setArmedFood(null); return }
            setFoodTrayOpen(o => !o)
          }}
          aria-label="ให้อาหารไข่"
          style={{
            position:'absolute', top:96, right:14, zIndex:10,
            width:54, height:54, borderRadius:'50%', padding:0,
            background: armedFood ? 'rgba(242,184,56,0.35)' : 'rgba(10,8,22,0.60)',
            backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
            border: armedFood ? '2px solid rgba(242,184,56,0.95)' : '2px solid rgba(124,191,90,0.85)',
            boxShadow:'0 3px 10px rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}
        >
          <span style={{ fontSize:28, lineHeight:1 }}>🍎</span>
        </button>

        {/* Food tray panel — tap a food to arm it, then tap the egg to feed */}
        {foodTrayOpen && (
          <div style={{
            position:'absolute', top:156, right:14, zIndex:11,
            background:'rgba(10,8,22,0.85)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
            border:'1px solid rgba(255,255,255,0.18)', borderRadius:16,
            padding:10, display:'grid', gridTemplateColumns:'repeat(3, 44px)', gap:8,
            boxShadow:'0 6px 18px rgba(0,0,0,0.5)',
          }}>
            {Object.entries(FOOD_CATALOG).map(([key, food]) => {
              const count = state.eggCare?.foodInventory?.[key] || 0
              const isArmed = armedFood === key
              return (
                <button
                  key={key}
                  disabled={count <= 0}
                  onClick={() => {
                    if (count <= 0) return
                    playTone('tap')
                    setArmedFood(key)
                    setFoodTrayOpen(false)
                    showToast('แตะที่ไข่เพื่อป้อนอาหาร!')
                  }}
                  style={{
                    position:'relative', width:44, height:44, borderRadius:10, padding:0,
                    background: isArmed ? 'rgba(242,184,56,0.35)' : 'rgba(255,255,255,0.08)',
                    border: isArmed ? '2px solid #F2B838' : '1px solid rgba(255,255,255,0.18)',
                    opacity: count > 0 ? 1 : 0.35,
                    cursor: count > 0 ? 'pointer' : 'default',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}
                >
                  <span style={{ fontSize:22, lineHeight:1 }}>{food.emoji}</span>
                  {count > 0 && (
                    <span className="px-badge" style={{ position:'absolute', bottom:-4, right:-4, fontSize:8 }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Feed reaction float (chomp/favorite/overfed) — anchors over the follow layer's egg position */}
        {feedReaction && (
          <div key={`fr-${feedReaction.id}`} style={{
            position:'fixed', left:'50%', bottom:260, transform:'translateX(-50%)',
            zIndex:500, pointerEvents:'none', textAlign:'center',
            animation:'dmg-float 1.3s ease-out forwards',
          }}>
            <div style={{ fontSize:26 }}>{feedReaction.emoji}</div>
            <div style={{ fontFamily:'var(--font-thai)', fontSize:12, color:'#fff', fontWeight:700, textShadow:'0 1px 4px rgba(0,0,0,0.7)' }}>
              {feedReaction.text}
            </div>
          </div>
        )}

        {/* 😴 Sleep indicator (quiet hours) — tap to peek at the full sleep scene.
            SPEC GAME-A §A.1: modeling healthy screen habits, never enforcement
            (playing is still fully allowed — this is purely a gentle visual cue). */}
        {quietHours && !sleepSceneOpen && (
          <button
            onClick={() => setSleepSceneOpen(true)}
            aria-label="ไข่กำลังง่วงนอน"
            style={{
              position:'absolute', top:156, left:14, zIndex:10,
              width:44, height:44, borderRadius:'50%', padding:0,
              background:'rgba(20,20,50,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
              border:'2px solid rgba(150,150,220,0.5)',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
              animation:'egg-idle 3s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize:22, lineHeight:1 }}>😴</span>
          </button>
        )}

        {/* Item cluster (🍗🎀👟⭐) — floating, lower-left, 2×2 */}
        <div style={{
          position:'absolute', bottom:16, left:14, zIndex:10,
          display:'grid', gridTemplateColumns:'repeat(2, 52px)', gap:9,
        }}>
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
            const disabled = status === 'cooldown' || count <= 0
            return (
              <button
                key={key}
                ref={el => { itemBtnRefs.current[key] = el }}
                onClick={() => { if (!disabled) onItemButton(key) }}
                aria-label={`${label}${count > 0 ? ` ×${count}` : ''}`}
                disabled={disabled}
                style={{
                  position:'relative', width:52, height:52, borderRadius:'50%', padding:0,
                  background:'rgba(10,8,22,0.60)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
                  border: isActive ? '2px solid var(--px-purple)' : '2px solid rgba(255,255,255,0.28)',
                  boxShadow: isActive
                    ? '0 0 0 3px rgba(155,93,229,0.45), 0 3px 8px rgba(0,0,0,0.5)'
                    : '0 3px 8px rgba(0,0,0,0.5)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: status === 'cooldown' ? 0.4 : count > 0 ? 1 : 0.4,
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  transition:'transform .2s ease',
                }}
              >
                <canvas
                  ref={r => r && drawItem(r, key)}
                  width={28} height={28}
                  style={{ width:28, height:28, imageRendering:'pixelated', pointerEvents:'none', display:'block' }}
                />
                {status === 'ready' && count > 0 && (
                  <span className="px-badge" style={{ position:'absolute', top:-4, right:-4 }}>{count}</span>
                )}
                {status !== 'ready' && (
                  <span style={{
                    position:'absolute', bottom:-3, left:0, right:0,
                    fontFamily:'var(--font-pixel)', fontSize:6, textAlign:'center',
                    color: status === 'active' ? '#EF9F27' : 'rgba(255,255,255,0.6)',
                  }}>
                    {status === 'active' ? `${activeRemaining}m` : `${cooldownRemaining}m`}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Hatch CTA — only for a brand-new player whose first egg is ready.
            Anchored bottom-center (the egg now wanders, so it can't sit on it). */}
        {readyToHatch && eggsHatched === 0 && (
          <div style={{
            position:'absolute', bottom:88, left:0, right:0,
            display:'flex', justifyContent:'center', zIndex:15,
          }}>
            <button
              onClick={() => dispatch({ type: ACTIONS.SET_HATCHING, payload: true })}
              className="px-btn px-btn-yellow"
              aria-label="แตะเพื่อฟักไข่"
              style={{
                fontFamily:'var(--font-thai)', fontSize:13, minHeight:44,
                display:'inline-flex', alignItems:'center', gap:6,
                animation:'challenger-pulse 1s ease-in-out infinite',
              }}
            >
              <span style={{ fontSize:22, lineHeight:1 }}>👆</span>
              แตะเพื่อฟักไข่!
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
