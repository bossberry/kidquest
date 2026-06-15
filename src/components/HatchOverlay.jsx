import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import CreatureCanvas from './CreatureCanvas.jsx'
import { getCreatureForHatch } from '../context/creatureHelpers.js'
import { buildEggStats } from '../lib/eggAlgorithm.js'
import { buildCreatureDNA, buildVoiceProfile } from '../lib/creatureGenerator.js'
import { playTone, playTapCrackSound, playHatchSound, playCreatureSound } from '../lib/audio.js'
import { showToast, spawnConfetti } from './Toasts.jsx'
import { determineElement, CREATURE_ELEMENT_COLORS, CREATURE_ELEMENT_NAMES_TH, CREATURE_NAME_SUGGESTIONS } from '../lib/creatureSystem.js'

const TAPS_NEEDED = 5

export default function HatchOverlay({ onClose, suppressAutoOpen = false }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const [tapCount, setTapCount]   = useState(0)
  const [phase, setPhase]         = useState('tapping') // 'bio' | 'tapping' | 'revealing' | 'done' | 'naming'
  const [creature, setCreature]   = useState(null)
  const [savedEggStats, setSavedEggStats] = useState(null)
  const [creatureDNA, setCreatureDNA] = useState(null)
  const [bioDNA, setBioDNA]       = useState(null)
  const [bioCreature, setBioCreature] = useState(null)
  const [newEggId, setNewEggId]   = useState(null)
  const isOpen = state.hatching || (!suppressAutoOpen && state.readyToHatch && !state.hatched)

  useEffect(() => {
    if (isOpen) {
      setSavedEggStats(buildEggStats(state))
      setCreature(getCreatureForHatch(state))
      setCreatureDNA(null)
      setTapCount(0)
      setNewEggId(null)
      playTone('click')
      // Bio phase: if active party creature has adventures, show farewell screen first
      const activeId = (state.party || [])[0]
      const activeEgg = activeId ? (state.hatchedEggs || []).find(e => e.id === activeId) : null
      if (activeEgg && (activeEgg.adventuresWith ?? 0) > 0) {
        setBioCreature(activeEgg)
        let d = activeEgg.dna
        if (!d) { try { d = buildCreatureDNA(buildEggStats({ ...activeEgg, xpThai: activeEgg.xpThai ?? 0, xpEng: activeEgg.xpEng ?? 0, xpMath: activeEgg.xpMath ?? 0 })) } catch (_) { d = null } }
        setBioDNA(d)
        setPhase('bio')
      } else {
        setBioCreature(null)
        setBioDNA(null)
        setPhase('tapping')
      }
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
      // Build DNA synchronously so CreatureCanvas renders immediately with 'done' phase
      const eggSt = buildEggStats(state)
      const dna = buildCreatureDNA(eggSt)
      setCreatureDNA(dna)

      setPhase('done')
      playTone('reveal')
      try { playCreatureSound(buildVoiceProfile(dna), 'celebrate') } catch (_) {}
      setTimeout(() => playTone('fanfare'), 350)
      spawnConfetti(50)
      // Save hatch
      const snaps = { xpThai: state.xpThai, xpEng: state.xpEng, xpMath: state.xpMath }
      const fullEggStats = {
        ...eggSt,
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

  const handlePickName = (name) => {
    const newest = (state.hatchedEggs || [])[0]
    if (newest && name) {
      dispatch({ type: ACTIONS.SET_CREATURE_NAME, payload: { creatureId: newest.id, name } })
    }
    doClose()
  }

  const doClose = () => {
    setCreatureDNA(null)
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

  // Biography phase — farewell to active creature before hatching new egg
  if (phase === 'bio' && bioCreature) {
    const bioName = bioCreature.creatureName || bioCreature.creature?.n || 'เพื่อน'
    const adventures = bioCreature.adventuresWith ?? 0
    const questions  = bioCreature.questionsAnswered ?? 0
    return createPortal(
      <div className="hatch-overlay show">
        {bioDNA && (
          <div style={{ marginBottom:12, filter:'drop-shadow(0 0 12px rgba(255,255,200,0.4))' }}>
            <CreatureCanvas dna={bioDNA} size={100} animationEnabled={true} idleMode="celebrate" />
          </div>
        )}
        <div className="hatch-title show" style={{ fontSize:16 }}>ก่อนฟักไข่ใบใหม่...</div>
        <div style={{ fontFamily:'Mitr,sans-serif', fontSize:15, color:'rgba(255,255,255,0.9)', textAlign:'center', marginBottom:6, lineHeight:1.7 }}>
          {bioName}
        </div>
        <div style={{ display:'flex', gap:18, justifyContent:'center', marginBottom:18 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:'#ffe066' }}>{adventures}</div>
            <div style={{ fontFamily:'Mitr,sans-serif', fontSize:11, color:'rgba(255,255,255,0.65)' }}>ผจญภัย</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:'#ffe066' }}>{questions}</div>
            <div style={{ fontFamily:'Mitr,sans-serif', fontSize:11, color:'rgba(255,255,255,0.65)' }}>ข้อ</div>
          </div>
        </div>
        <button className="hatch-close show" onClick={() => setPhase('tapping')}>ฟักไข่ต่อ!</button>
        <button className="hatch-close show" style={{ marginTop:6, background:'rgba(255,255,255,0.10)', fontSize:12 }} onClick={doClose}>ยังไม่ฟักตอนนี้</button>
      </div>,
      document.body
    )
  }

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
        {(phase === 'done' || phase === 'naming') && creatureDNA && (
          <div
            className={phase === 'done' ? 'hatch-creature-enter' : ''}
            style={{
              filter: phase === 'done'
                ? `drop-shadow(0 0 20px ${elColor}cc) drop-shadow(0 0 40px ${elColor}55)`
                : `drop-shadow(0 0 8px ${elColor}66)`,
            }}
          >
            <CreatureCanvas
              dna={creatureDNA}
              size={150}
              animationEnabled={true}
              idleMode={phase === 'done' ? 'celebrate' : 'idle'}
            />
          </div>
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
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:12, fontFamily:'Mitr,sans-serif' }}>
            แตะชื่อที่ชอบ
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, width:220 }}>
            {(CREATURE_NAME_SUGGESTIONS[snapshotEl] || CREATURE_NAME_SUGGESTIONS.fire).map(name => (
              <button
                key={name}
                className="hatch-close show"
                style={{ fontSize:20, fontFamily:'Mitr,sans-serif', padding:'10px 0', letterSpacing:1 }}
                onClick={() => handlePickName(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <button
            className="hatch-close show"
            style={{ marginTop:10, background:'rgba(255,255,255,0.10)', fontSize:12 }}
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
