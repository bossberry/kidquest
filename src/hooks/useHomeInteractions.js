import { useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { playTone, playSFX } from '../lib/audio.js'

const comboToState = n => n >= 8 ? 'excited' : n >= 4 ? 'happy' : 'pet'

/**
 * useHomeInteractions — owns all tap/swipe response logic on the Home screen:
 * particle spawning, pet-combo escalation, item usage effects, and
 * creature tap/swipe bond rewards.
 *
 * Reads/writes through the state-machine pieces passed in from
 * useCreatureInteraction so behavior matches the original exactly.
 */
export function useHomeInteractions({
  readyToHatch, eggsHatched, activeEgg,
  smRef, comboResetRef, enterState, extendState, setGlow,
  activeItem, setActiveItem,
  setFlyingItem, setHealFloat, setBondReaction, setCreatureBounce,
  setParticles,
}) {
  const { state, dispatch } = useAppState()
  const particleIdRef = useRef(0)
  const swipeCountRef  = useRef(0)

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

  const handlePetEgg = () => {
    if (readyToHatch && eggsHatched === 0) { dispatch({ type: ACTIONS.SET_HATCHING, payload: true }); return }
    const sm = smRef.current
    sm.comboCount += 1
    const n = sm.comboCount
    clearTimeout(comboResetRef.current)
    comboResetRef.current = setTimeout(() => { smRef.current.comboCount = 0 }, 3000)
    const targetState = comboToState(n)
    if (targetState !== sm.state) {
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

    smRef.current.comboCount = 0

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

  return {
    spawnParticles,
    handlePetEgg, handleTapItem, handleEggTap,
    handleCreatureTap, handleCreatureSwipe,
  }
}
