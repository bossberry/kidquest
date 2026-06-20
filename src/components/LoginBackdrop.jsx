import React, { useRef, useEffect } from 'react'
import { drawCreature } from '../lib/creatureAlgorithm.js'

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

function FloatingCreature({ c }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCreature(canvas, c.seed, c.stats)
  }, [c])

  return (
    <div
      style={{
        position: 'absolute',
        left: `${c.left}%`,
        top: `${c.top}%`,
        animation: `kq-float-${c.id % 3} ${c.duration}s ease-in-out infinite`,
        animationDelay: `${c.delay}s`,
        opacity: 0.85,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={c.size}
        height={c.size}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
    </div>
  )
}

/**
 * LoginBackdrop — purely decorative background behind the mandatory login
 * screen. Renders randomly-generated creature sprites floating over a bright
 * gradient, using the same drawCreature() renderer as the real game.
 */
export default function LoginBackdrop() {
  const creaturesRef = useRef(null)
  if (!creaturesRef.current) {
    creaturesRef.current = makeFloatingCreatures(9)
  }

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
      {creaturesRef.current.map(c => <FloatingCreature key={c.id} c={c} />)}
    </div>
  )
}
