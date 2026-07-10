import { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { playTone, playCreatureSound } from '../lib/audio.js'

const IDLE_DUR = {
  'idle-wiggle': 600,
  'idle-jump':   600,
  'idle-blink':  380,
  'idle-look':   1100,
  'idle-yawn':   1350,
}

/**
 * useHomeAmbience — owns all "the creature feels alive on its own" effects:
 * idle micro-animations, rare ambient visual events, stage-up celebration,
 * hatch-ready heartbeat, reunion burst on mount, and post-session growth banner.
 *
 * Takes the pieces it needs to read/write from the caller (Home.jsx) so behavior
 * and timing stay identical to the original inline implementation.
 *
 * @param {object} params
 * @param {number} params.stage - current egg/creature stage
 * @param {boolean} params.readyToHatch
 * @param {string} params.eggAnim - current animation class, used to gate idle anims
 * @param {Function} params.setIdleAnim
 * @param {Function} params.spawnParticles
 * @param {Function} params.enterState
 * @param {object|null} params.voiceProfile
 * @param {number} params.initialLastHomeVisit - state.lastHomeVisit at mount time
 * @param {number} params.sessionXP - state.sessionXP at mount time
 */
export function useHomeAmbience({
  stage, readyToHatch, eggAnim, setIdleAnim, spawnParticles, enterState,
  voiceProfile, initialLastHomeVisit, sessionXP,
  element, affinity, affinityLine, masteredCount,
}) {
  const { dispatch } = useAppState()

  const [ambientEvent, setAmbientEvent] = useState(null) // null | {type, id}
  const [growthBanner, setGrowthBanner] = useState(null) // null | string

  const idleTimerRef  = useRef(null)
  const eggAnimRef    = useRef(eggAnim)
  const stageRef      = useRef(stage)
  const prevStageRef  = useRef(null)

  useEffect(() => { eggAnimRef.current = eggAnim }, [eggAnim])
  useEffect(() => { stageRef.current = stage }, [stage])

  // Stage-up detection — skip first render by initializing prevStageRef to null.
  // SPEC GAME-A §A.2: a real stage-up now mints a permanent evolutionAlbum
  // entry + raises pendingEvolutionCeremony (consumed by Home.jsx's full-screen
  // EvolutionScene), which supersedes this effect's old lightweight
  // stageUp-banner+SFX so a single stage-up isn't celebrated twice.
  useEffect(() => {
    if (prevStageRef.current === null) { prevStageRef.current = stage; return }
    if (stage > prevStageRef.current) {
      dispatch({
        type: ACTIONS.RECORD_EVOLUTION,
        payload: { stage, affinity, affinityLine, element, masteredCount },
      })
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
    const last = initialLastHomeVisit
    const now  = Date.now()
    const isReunion = !last || (now - last) > 4 * 60 * 60 * 1000
    dispatch({ type: ACTIONS.UPDATE_LAST_HOME_VISIT, payload: now })
    if (isReunion) {
      enterState('reunion')
      spawnParticles('hearts', 10)
      spawnParticles('sparkle', 8)
      // Creature voice for reunion moment (falls back to chirp if no voice profile yet)
      setTimeout(() => {
        if (voiceProfile) playCreatureSound(voiceProfile, 'reunion')
        else { playTone('chirp'); setTimeout(() => playTone('chirp'), 360) }
      }, 200)
    }
  }, []) // eslint-disable-line

  // Post-session egg growth banner — fires once on mount if XP was earned this session
  useEffect(() => {
    if ((sessionXP || 0) <= 0) return
    const msg = stage >= 5 ? 'อีกนิดเดียวก็ฟักแล้ว!' : 'ไข่ของเราโตขึ้นนะ!'
    setTimeout(() => {
      setGrowthBanner(msg)
      playTone('stageUp')
      setTimeout(() => setGrowthBanner(null), 3000)
    }, 900)
    dispatch({ type: ACTIONS.SET_SESSION_XP, payload: 0 })
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

  return { ambientEvent, growthBanner }
}
