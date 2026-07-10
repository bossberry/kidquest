import React, { useState, useEffect } from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import { playTone, playSFX, speakTh } from '../lib/audio.js'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'

// Same stage->aura mapping used everywhere else this pairing appears
// (Home.jsx/Collection.jsx/RoomVisit.jsx) — duplicated here rather than
// exported from one of those UI files, matching the existing convention.
function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}

const AFFINITY_LABEL_TH = {
  sage: 'สายปราชญ์ · ภาษาไทย',
  architect: 'สายสถาปนิก · คณิตศาสตร์',
  explorer: 'สายนักผจญภัย · ภาษาอังกฤษ',
  prism: 'สายรุ้ง · สมดุลทุกวิชา',
}

/**
 * EvolutionScene — SPEC GAME-A §A.2 full-screen stage-up ceremony.
 * Modeled directly on LevelUpCutscene.jsx's phase-based structure.
 * Phases: dim -> flash (<=300ms) -> reveal -> celebrate (fanfare + voice) -> done.
 *
 * @param {object} data - the evolutionAlbum entry that was just minted:
 *   { stage, affinity, affinityLine, element, masteredCount, date }
 * @param {Function} onDone
 */
export default function EvolutionScene({ data, onDone }) {
  const { resolved } = useCompanion()
  const { stage, affinityLine, masteredCount } = data
  const [phase, setPhase] = useState('dim') // dim -> flash -> reveal -> celebrate -> done

  useEffect(() => {
    const t1 = setTimeout(() => { setPhase('flash'); playSFX('stage_up') }, 550)
    const t2 = setTimeout(() => { setPhase('reveal') }, 830) // flash window ~280ms, under the 300ms cap
    const t3 = setTimeout(() => {
      setPhase('celebrate')
      playTone('stageUp')
      setTimeout(() => speakTh('ไข่โตขึ้นเพราะหนูเก่งขึ้น!'), 350)
    }, 1450)
    const t4 = setTimeout(() => setPhase('done'), 4700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const revealed  = phase === 'reveal' || phase === 'celebrate' || phase === 'done'
  const celebrating = phase === 'celebrate' || phase === 'done'
  const stageName = EGG_STAGE_NAMES[stage] || `ระดับ ${stage}`
  const affinityLabel = affinityLine ? AFFINITY_LABEL_TH[affinityLine] : null
  // Aura swell — briefly one level brighter through flash/reveal, settles to
  // the real level once the celebration text appears.
  const auraLevel = (phase === 'flash' || phase === 'reveal')
    ? Math.min(4, stageToAura(stage) + 1)
    : stageToAura(stage)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 210,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: phase === 'flash' ? '#FFFFFF' : 'rgba(0,0,10,0.92)',
        transition: 'background 0.28s ease',
        cursor: phase === 'done' ? 'pointer' : 'default',
      }}
      onClick={phase === 'done' ? onDone : undefined}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: phase === 'dim' ? 0 : 1,
        transform: revealed ? 'scale(1) translateY(0)' : 'scale(0.82) translateY(12px)',
        transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <EggCanvasCore
          element={resolved.element}
          eye={resolved.eye}
          gender={resolved.gender}
          stage={stage}
          aura={auraLevel}
          affinityLine={affinityLine}
          anim="idle"
          size={190}
        />

        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 20, color: '#FFD700',
          letterSpacing: 1, marginTop: 18, textAlign: 'center',
          textShadow: '0 0 16px #FF8800, 0 0 40px #FFD700, 0 2px 0 #8B4500',
          opacity: revealed ? 1 : 0, transition: 'opacity 0.4s ease 0.1s',
        }}>
          ไข่วิวัฒนาการ!
        </div>

        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 18, color: '#fff',
          marginTop: 10, textShadow: '0 2px 0 #000',
          opacity: celebrating ? 1 : 0, transition: 'opacity 0.4s ease',
        }}>
          {stageName}
        </div>

        {affinityLabel && (
          <div style={{
            fontFamily: 'var(--font-thai)', fontSize: 14,
            color: 'rgba(255,255,255,0.78)', marginTop: 6,
            opacity: celebrating ? 1 : 0, transition: 'opacity 0.5s ease 0.15s',
          }}>
            {affinityLabel}
          </div>
        )}

        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 12,
          color: 'rgba(255,255,255,0.55)', marginTop: 4,
          opacity: celebrating ? 1 : 0, transition: 'opacity 0.5s ease 0.2s',
        }}>
          เก่งขึ้นแล้ว {masteredCount ?? 0} เรื่อง
        </div>

        {phase === 'done' && (
          <div style={{
            fontFamily: 'var(--font-thai)', fontSize: 14,
            color: 'rgba(255,255,255,0.65)', marginTop: 26,
            animation: 'blink 1.1s step-end infinite',
          }}>
            แตะเพื่อดำเนินการต่อ
          </div>
        )}
      </div>
    </div>
  )
}
