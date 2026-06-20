import React, { useRef, useEffect, useState } from 'react'
import { drawCreature } from '../lib/creatureAlgorithm.js'
import { startBGM, stopBGM, playCreatureTapSFX, playTone } from '../lib/audio.js'

const EVO_STAGES = ['baby', 'teen', 'final']

function makeFloatingCreatures(count) {
  return Array.from({ length: count }, (_, i) => {
    const stage = EVO_STAGES[Math.floor(Math.random() * EVO_STAGES.length)]
    const bias = Math.random()
    const stats = {
      xpThai: bias < 0.34 ? 100 : Math.random() * 40,
      xpMath: bias >= 0.34 && bias < 0.67 ? 100 : Math.random() * 40,
      xpEng:  bias >= 0.67 ? 100 : Math.random() * 40,
      acc: 60 + Math.random() * 35,
      streak: Math.floor(Math.random() * 10),
      evoStage: stage,
    }
    return {
      id: i,
      seed: Math.floor(Math.random() * 1e9),
      stats,
      size: stage === 'final' ? 64 : stage === 'teen' ? 52 : 40,
      left: 5 + Math.random() * 85,
      top:  5 + Math.random() * 80,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * -8,
    }
  })
}

// Cycles forward through evo stages so repeated taps stay fun.
function nextStage(stage) {
  const idx = EVO_STAGES.indexOf(stage)
  return EVO_STAGES[(idx + 1) % EVO_STAGES.length]
}

function FloatingCreature({ c }) {
  const canvasRef = useRef(null)
  const [reaction, setReaction] = useState(null) // null | 'squish' | 'evolve'
  const [displayStats, setDisplayStats] = useState(c.stats)
  const revertTimerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCreature(canvas, c.seed, displayStats)
  }, [c, displayStats])

  const handleTap = () => {
    const doEvolve = Math.random() < 0.4
    if (doEvolve) {
      setReaction('evolve')
      setDisplayStats(prev => ({ ...prev, evoStage: nextStage(prev.evoStage) }))
      playTone('stageUp')
    } else {
      setReaction('squish')
      playCreatureTapSFX()
    }
    clearTimeout(revertTimerRef.current)
    revertTimerRef.current = setTimeout(() => setReaction(null), 450)
  }

  useEffect(() => () => clearTimeout(revertTimerRef.current), [])

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'absolute',
        left: `${c.left}%`,
        top: `${c.top}%`,
        animation: reaction ? 'none' : `kq-float-${c.id % 3} ${c.duration}s ease-in-out infinite`,
        animationDelay: `${c.delay}s`,
        opacity: 0.9,
        cursor: 'pointer',
        transform: reaction === 'squish' ? 'scale(0.8, 1.2)' : reaction === 'evolve' ? 'scale(1.3)' : undefined,
        transition: reaction ? 'transform 0.2s ease' : undefined,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        width={c.size}
        height={c.size}
        style={{ imageRendering: 'pixelated', display: 'block', pointerEvents: 'none' }}
      />
    </div>
  )
}

export default function LoginBackdrop({ onStartTap }) {
  const creaturesRef = useRef(null)
  if (!creaturesRef.current) {
    creaturesRef.current = makeFloatingCreatures(9)
  }

  useEffect(() => {
    startBGM()
    return () => stopBGM()
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: 'linear-gradient(160deg, #FFD27A 0%, #F09977 30%, #85B7EB 70%, #7F77DD 100%)',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes kq-float-0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(8px, -14px) rotate(3deg); }
        }
        @keyframes kq-float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(-10px, -10px) rotate(-4deg); }
        }
        @keyframes kq-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(6px, -18px) rotate(2deg); }
        }
      `}</style>

      {creaturesRef.current.map(c => (
        <FloatingCreature key={c.id} c={c} />
      ))}

      {/* Central pixel-art start button */}
      <button
        onClick={onStartTap}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--px-darkest)',
          border: '3px solid var(--px-yellow)',
          boxShadow: '4px 4px 0 var(--px-black)',
          borderRadius: 0,
          padding: '18px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
          <rect x="7" y="1" width="2" height="8" fill="#d8d8e8" />
          <rect x="6" y="1" width="1" height="1" fill="#fff" />
          <rect x="5" y="8" width="6" height="2" fill="#8a6020" />
          <rect x="6" y="10" width="4" height="1" fill="#5a3a10" />
          <rect x="7" y="10" width="2" height="5" fill="#3a2a10" />
        </svg>
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 11,
          color: 'var(--px-yellow)', textShadow: '2px 2px 0 var(--px-black)',
          letterSpacing: 1, textTransform: 'uppercase',
        }}>
          เริ่มเล่น!
        </div>
      </button>
    </div>
  )
}
