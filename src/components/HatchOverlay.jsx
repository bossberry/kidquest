import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { getCreatureForHatch } from '../context/creatureHelpers.js'
import { buildEggStats } from '../lib/eggAlgorithm.js'
import { playTone, playTapCrackSound, playHatchSound } from '../lib/audio.js'
import { showToast, spawnConfetti } from './Toasts.jsx'
import { determineElement, CREATURE_ELEMENT_COLORS, CREATURE_ELEMENT_NAMES_TH } from '../lib/creatureSystem.js'

const TAPS_NEEDED = 5

export default function HatchOverlay({ onClose, suppressAutoOpen = false }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const [tapCount, setTapCount]   = useState(0)
  const [phase, setPhase]         = useState('tapping') // 'tapping' | 'revealing' | 'done' | 'naming'
  const [creature, setCreature]   = useState(null)
  const [savedEggStats, setSavedEggStats] = useState(null)
  const [newEggId, setNewEggId]   = useState(null)
  const [nameInput, setNameInput] = useState('')
  const isOpen = state.hatching || (!suppressAutoOpen && state.readyToHatch && !state.hatched)

  useEffect(() => {
    if (isOpen) {
      setSavedEggStats(buildEggStats(state))
      setCreature(getCreatureForHatch(state))
      setTapCount(0)
      setPhase('tapping')
      setNameInput('')
      setNewEggId(null)
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
      playTone('reveal')
      setTimeout(() => playTone('fanfare'), 350)
      spawnConfetti(50)
      // Save hatch — collect the new egg id from the dispatch result via a temp id
      const tempId = `egg_${Date.now()}_tmp`
      const snaps = { xpThai: state.xpThai, xpEng: state.xpEng, xpMath: state.xpMath }
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

  const handleConfirmName = () => {
    // Find the newest hatched egg (first in array after HATCH_COMPLETE prepends it)
    const newest = (state.hatchedEggs || [])[0]
    if (newest && nameInput.trim()) {
      dispatch({ type: ACTIONS.SET_CREATURE_NAME, payload: { creatureId: newest.id, name: nameInput.trim() } })
    }
    doClose()
  }

  const doClose = () => {
    setPhase('tapping')
    dispatch({ type: ACTIONS.CLOSE_HATCH })
    dispatch({ type: ACTIONS.SET_HATCHING, payload: false })
    showToast('ไข่ใบใหม่เริ่มต้นแล้ว!')
    onClose?.()
  }

  if (!isOpen && phase === 'tapping') return null

  // 6-creature hard limit: show a friendly blocking screen if collection is full
  const creatureCount = (state.hatchedEggs || []).length
  if (creatureCount >= 6 && phase === 'tapping') {
    return createPortal(
      <div className="hatch-overlay show">
        <div style={{ fontSize:60, marginBottom:16 }}>🥚</div>
        <div className="hatch-title show" style={{ fontSize:18 }}>คลังเต็มแล้ว!</div>
        <div style={{ fontFamily:'Mitr,sans-serif', fontSize:14, color:'rgba(255,255,255,0.8)', textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
          มีสัตว์ {creatureCount} ตัวแล้ว<br/>นำบางตัวออกก่อนนะ
        </div>
        <button className="hatch-close show" onClick={doClose}>กลับ</button>
      </div>,
      document.body
    )
  }

  // Element derived from current XP snapshot (matches what HATCH_COMPLETE will compute)
  const snapshotEl = determineElement(state.xpThai, state.xpMath, state.xpEng, state.acc, state.streak)
  const elColor  = CREATURE_ELEMENT_COLORS[snapshotEl]
  const elNameTH = CREATURE_ELEMENT_NAMES_TH[snapshotEl]

  return createPortal(
    <div className="hatch-overlay show">
      <div className="hatch-canvas-wrap">
        {phase !== 'done' && phase !== 'naming' && savedEggStats && (
          <EggCanvas
            stats={savedEggStats}
            width={200} height={240}
            style={{ cursor: phase === 'tapping' ? 'pointer' : 'default', opacity: phase === 'revealing' ? 0 : 1, transition:'opacity .5s' }}
            onClick={handleTap}
          />
        )}
        {(phase === 'done' || phase === 'naming') && (
          <div style={{ fontSize:80 }} className="hatch-reveal-glow">{creature?.e || '🐣'}</div>
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
          {/* Element badge */}
          <div style={{
            display:'inline-block', marginTop:8, padding:'3px 12px',
            background: elColor, borderRadius:4,
            fontFamily:'Mitr,sans-serif', fontSize:13, color:'#fff', fontWeight:600,
            boxShadow:`0 0 12px ${elColor}88`,
          }}>
            ธาตุ{elNameTH}
          </div>
          <button
            className="hatch-close show"
            style={{ marginTop:14 }}
            onClick={() => setPhase('naming')}
          >
            ตั้งชื่อ ✏️
          </button>
          <button
            className="hatch-close show"
            style={{ marginTop:6, background:'rgba(255,255,255,0.12)', fontSize:12 }}
            onClick={doClose}
          >
            ข้ามการตั้งชื่อ
          </button>
        </>
      )}

      {phase === 'naming' && creature && (
        <>
          <div className="hatch-title show" style={{ fontSize:16 }}>ตั้งชื่อให้เพื่อนคุณ!</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:10, fontFamily:'Mitr,sans-serif' }}>
            {creature.n}
          </div>
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nameInput.trim() && handleConfirmName()}
            maxLength={16}
            placeholder="ชื่อ..."
            style={{
              fontFamily:'Mitr,sans-serif', fontSize:20, textAlign:'center',
              background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.4)',
              borderRadius:8, color:'#fff', padding:'8px 16px', width:200,
              outline:'none',
            }}
            autoFocus
          />
          <button
            className="hatch-close show"
            style={{ marginTop:12 }}
            onClick={handleConfirmName}
            disabled={!nameInput.trim()}
          >
            ยืนยัน ✅
          </button>
          <button
            className="hatch-close show"
            style={{ marginTop:6, background:'rgba(255,255,255,0.12)', fontSize:12 }}
            onClick={doClose}
          >
            ข้ามการตั้งชื่อ
          </button>
        </>
      )}
    </div>,
    document.body
  )
}
