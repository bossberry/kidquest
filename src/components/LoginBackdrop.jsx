import React, { useRef, useEffect, useState } from 'react'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { startBGM, stopBGM, playCreatureTapSFX } from '../lib/audio.js'

const ELEMENTS = ['fire', 'water', 'thunder', 'nature', 'shadow', 'light']
const EYES     = ['gba', 'tama', 'sanrio', 'summoners']
const GENDERS  = ['male', 'female']

function makeFloatingEggs(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
    eye:     EYES[Math.floor(Math.random() * EYES.length)],
    gender:  GENDERS[Math.floor(Math.random() * GENDERS.length)],
    stage:   1 + Math.floor(Math.random() * 5),
    size:    40 + Math.floor(Math.random() * 28),
    left:    5 + Math.random() * 85,
    top:     5 + Math.random() * 80,
    duration: 6 + Math.random() * 6,
    delay:   Math.random() * -8,
  }))
}

function FloatingEgg({ c }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const [squish, setSquish] = useState(false)
  const squishTimerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      renderEggSprite(ctx, {
        element: c.element, eye: c.eye, gender: c.gender,
        stage: c.stage, aura: 0,
        t: performance.now() / 1000,
        canvasSize: c.size, basePxOverride: 2,
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [c])

  const handleTap = () => {
    playCreatureTapSFX()
    setSquish(true)
    clearTimeout(squishTimerRef.current)
    squishTimerRef.current = setTimeout(() => setSquish(false), 450)
  }

  useEffect(() => () => clearTimeout(squishTimerRef.current), [])

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'absolute',
        left: `${c.left}%`,
        top: `${c.top}%`,
        animation: squish ? 'none' : `kq-float-${c.id % 3} ${c.duration}s ease-in-out infinite`,
        animationDelay: `${c.delay}s`,
        opacity: 0.9,
        cursor: 'pointer',
        transform: squish ? 'scale(0.8, 1.2)' : undefined,
        transition: squish ? 'transform 0.2s ease' : undefined,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        width={c.size}
        height={Math.round(c.size * 1.19)}
        style={{ imageRendering: 'pixelated', display: 'block', pointerEvents: 'none' }}
      />
    </div>
  )
}

export default function LoginBackdrop({ onStartTap }) {
  const eggsRef = useRef(null)
  if (!eggsRef.current) {
    eggsRef.current = makeFloatingEggs(9)
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

      {eggsRef.current.map(c => (
        <FloatingEgg key={c.id} c={c} />
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
