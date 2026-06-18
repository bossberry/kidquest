import { useState, useRef, useEffect } from 'react'

const STATE_CSS = { idle:'float', pet:'pet', happy:'happy-spin', excited:'excited', eating:'eat', sleep:'sleepy', relax:'relax', reunion:'reunion' }
const STATE_DUR = { pet:500, happy:700, excited:1200, eating:900, sleep:2000, relax:1500, reunion:1200 }

/**
 * useCreatureInteraction — owns the creature's interaction state machine:
 * enterState/extendState transitions, the underlying smRef state machine,
 * glow effect timing, and a watchdog that force-resets to idle if stuck.
 *
 * @param {number} stage - current creature stage, used to pick the idle animation class
 */
export function useCreatureInteraction(stage) {
  const [eggAnim, setEggAnim] = useState('float')
  const [idleAnim, setIdleAnim] = useState(null)
  const [eggGlow, setEggGlow] = useState(null)

  const stageRef      = useRef(stage)
  const smRef          = useRef({ state: 'idle', comboCount: 0, enteredAt: 0 })
  const enterRafRef    = useRef(null)
  const enterGenRef    = useRef(0)
  const animTimerRef   = useRef(null)
  const comboResetRef  = useRef(null)
  const glowTimerRef   = useRef(null)

  useEffect(() => { stageRef.current = stage }, [stage])

  // Cancel pending RAF + timers on unmount
  useEffect(() => () => {
    if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current)
    clearTimeout(animTimerRef.current)
    clearTimeout(comboResetRef.current)
    clearTimeout(glowTimerRef.current)
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

  return {
    eggAnim, setEggAnim,
    idleAnim, setIdleAnim,
    eggGlow, setGlow,
    smRef, comboResetRef,
    enterState, extendState,
  }
}
