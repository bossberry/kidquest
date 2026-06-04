import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { getCreatureForHatch } from '../context/creatureHelpers.js'
import { buildEggStats } from '../lib/eggAlgorithm.js'
import { playTone, playTapCrackSound, playHatchSound } from '../lib/audio.js'
import { showToast, spawnConfetti } from './Toasts.jsx'

const TAPS_NEEDED = 5

export default function HatchOverlay({ onClose, suppressAutoOpen = false }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const [tapCount, setTapCount] = useState(0)
  const [phase, setPhase] = useState('tapping') // 'tapping' | 'revealing' | 'done'
  const [creature, setCreature] = useState(null)
  const [savedEggStats, setSavedEggStats] = useState(null)
  const isOpen = state.hatching || (!suppressAutoOpen && state.readyToHatch && !state.hatched)

  useEffect(() => {
    if (isOpen) {
      setSavedEggStats(buildEggStats(state))
      setCreature(getCreatureForHatch(state))
      setTapCount(0)
      setPhase('tapping')
      playTone('click')
    }
  }, [isOpen]) // eslint-disable-line

  const handleTap = () => {
    if (phase !== 'tapping') return
    const newCount = tapCount + 1
    setTapCount(newCount)
    playTapCrackSound(newCount)
    spawnConfetti(newCount * 2)
    if (newCount >= TAPS_NEEDED) {
      setPhase('revealing')
      doReveal()
    }
  }

  const doReveal = () => {
    playHatchSound()
    setTimeout(() => {
      setPhase('done')
      playTone('fanfare')
      spawnConfetti(50)
      // Save hatch
      const snaps = { xpThai: state.xpThai, xpEng: state.xpEng, xpMath: state.xpMath }
      const tSum = snaps.xpThai + snaps.xpEng + snaps.xpMath || 1
      const fullEggStats = {
        ...buildEggStats(state),
        xpThai: snaps.xpThai, xpEng: snaps.xpEng, xpMath: snaps.xpMath,
      }
      dispatch({
        type: ACTIONS.HATCH_COMPLETE,
        payload: {
          creature: getCreatureForHatch(state),
          eggStats: fullEggStats,
          snapXpThai: snaps.xpThai,
          snapXpEng: snaps.xpEng,
          snapXpMath: snaps.xpMath,
        }
      })
    }, 1800)
  }

  const handleClose = () => {
    setPhase('tapping') // reset phase first — makes !isOpen && phase==='tapping' true → overlay unmounts
    dispatch({ type: ACTIONS.CLOSE_HATCH })
    dispatch({ type: ACTIONS.SET_HATCHING, payload: false })
    showToast('🥚 ไข่ใบใหม่เริ่มต้นแล้ว!')
    onClose?.()
  }

  if (!isOpen && phase === 'tapping') return null

  return createPortal(
    <div className="hatch-overlay show">
      <div className="hatch-canvas-wrap">
        {phase !== 'done' && savedEggStats && (
          <EggCanvas
            stats={savedEggStats}
            width={200} height={240}
            style={{ cursor: phase === 'tapping' ? 'pointer' : 'default', opacity: phase === 'revealing' ? 0 : 1, transition:'opacity .5s' }}
            onClick={handleTap}
          />
        )}
        {phase === 'done' && (
          <div style={{ fontSize:80 }}>{creature?.e || '🐣'}</div>
        )}
      </div>

      {phase === 'tapping' && (
        <>
          <div style={{ color:'rgba(255,255,255,.8)', fontSize:14, marginTop:10, textAlign:'center' }}>
            {tapCount === 0 ? `👆 แตะไข่ ${TAPS_NEEDED} ครั้งเพื่อฟัก!` : `👆 อีก ${TAPS_NEEDED - tapCount} ครั้ง!`}
          </div>
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:8 }}>
            {Array.from({ length: TAPS_NEEDED }).map((_, i) => (
              <div key={i} style={{ width:12, height:12, borderRadius:'50%', background: i < tapCount ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)', transition:'all .2s', transform: i < tapCount ? 'scale(1.3)' : 'scale(1)' }} />
            ))}
          </div>
        </>
      )}

      {phase === 'revealing' && (
        <div style={{ color:'rgba(255,255,255,.8)', fontSize:16, marginTop:10 }}>💥 กำลังฟัก!!!</div>
      )}

      {phase === 'done' && creature && (
        <>
          <div className="hatch-title show">🎉 ฟักสำเร็จ!</div>
          <div className="hatch-name show">{creature.n}</div>
          <div className="hatch-feature show">{creature.f}</div>
          <button className="hatch-close show" onClick={handleClose}>ยินดีด้วย! 🎉</button>
        </>
      )}
    </div>,
    document.body
  )
}
