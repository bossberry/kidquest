import React, { useRef, useEffect } from 'react'
import { drawCreature } from '../lib/drawCreature.js'

function pixelateCanvas(canvas, blockSize) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const tmp = document.createElement('canvas')
  tmp.width  = Math.max(1, Math.ceil(W / blockSize))
  tmp.height = Math.max(1, Math.ceil(H / blockSize))
  const tc = tmp.getContext('2d')
  tc.imageSmoothingEnabled = false
  tc.drawImage(canvas, 0, 0, tmp.width, tmp.height)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, W, H)
  ctx.drawImage(tmp, 0, 0, W, H)
}

// Seconds between blinks per personality (mean; ±1s jitter applied)
const BLINK_RATE = { happy: 4, curious: 5, brave: 8, playful: 3, gentle: 5, sleepy: 2, shy: 4 }
// How long eyes stay closed per blink
const BLINK_HOLD = { sleepy: 0.45, default: 0.07 }

// CSS idle animation class applied to the canvas element
function idleClass(personality, idleMode) {
  if (idleMode === 'celebrate') return 'ci-celebrate'
  if (idleMode === 'sleep')     return 'ci-sleepy'
  return `ci-${personality || 'gentle'}`
}

export default function CreatureCanvas({
  dna,
  size = 88,
  personality,
  animationEnabled = true,
  idleMode = 'idle',
  style = {},
  className = '',
}) {
  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const stateRef   = useRef(null)

  // One-time static draw (handles no-animation case and first paint)
  useEffect(() => {
    if (canvasRef.current && dna) {
      drawCreature(canvasRef.current, dna)
      pixelateCanvas(canvasRef.current, 3)
    }
  }, [dna])

  // Animation loop
  useEffect(() => {
    if (!animationEnabled || !dna || !canvasRef.current) return

    const personalityKey = personality || dna?.personality || 'gentle'
    const blinkRate = BLINK_RATE[personalityKey] ?? 5
    const holdTime  = personalityKey === 'sleepy' ? BLINK_HOLD.sleepy : BLINK_HOLD.default
    const isAsleep  = idleMode === 'sleep'

    // Initialise or reset animation state
    stateRef.current = {
      phase:     'open',   // 'open' | 'closing' | 'closed' | 'opening'
      blinkAmt:  0,
      blinkTimer: blinkRate + Math.random() * 2,
      particles: [],
      nextZIn:   1.0 + Math.random() * 0.8,
      prevTime:  null,
    }
    const S = stateRef.current

    function tick(now) {
      rafRef.current = requestAnimationFrame(tick)
      if (S.prevTime === null) { S.prevTime = now; return }
      const dt = Math.min((now - S.prevTime) / 1000, 0.05)
      S.prevTime = now

      // ── Blink state machine ─────────────────────────────────────────────
      if (isAsleep) {
        S.blinkAmt = 1
      } else {
        S.blinkTimer -= dt
        if (S.phase === 'open' && S.blinkTimer <= 0) {
          S.phase = 'closing'
        }
        if (S.phase === 'closing') {
          S.blinkAmt = Math.min(1, S.blinkAmt + dt / 0.09)
          if (S.blinkAmt >= 1) { S.phase = 'closed'; S.blinkTimer = holdTime }
        }
        if (S.phase === 'closed') {
          S.blinkTimer -= dt
          if (S.blinkTimer <= 0) S.phase = 'opening'
        }
        if (S.phase === 'opening') {
          S.blinkAmt = Math.max(0, S.blinkAmt - dt / 0.12)
          if (S.blinkAmt <= 0) {
            S.phase = 'open'
            S.blinkAmt = 0
            S.blinkTimer = blinkRate + (Math.random() * 2 - 1)
          }
        }
      }

      // ── Sleep Z particles ───────────────────────────────────────────────
      if (isAsleep) {
        for (let i = S.particles.length - 1; i >= 0; i--) {
          const p = S.particles[i]
          p.y     += dt * 0.85
          p.x     += dt * 0.14
          p.alpha -= dt * 0.36
          if (p.alpha <= 0) S.particles.splice(i, 1)
        }
        S.nextZIn -= dt
        if (S.nextZIn <= 0 && S.particles.length < 3) {
          S.particles.push({
            x:     0.22 + Math.random() * 0.55,
            y:     0.12 + Math.random() * 0.12,
            alpha: 0.72 + Math.random() * 0.18,
            size:  Math.random() * 0.65,
          })
          S.nextZIn = 0.85 + Math.random() * 0.75
        }
      } else {
        if (S.particles.length) S.particles = []
      }

      // ── Redraw ──────────────────────────────────────────────────────────
      if (canvasRef.current) {
        drawCreature(canvasRef.current, dna, {
          blinkAmt:      S.blinkAmt,
          sleepParticles: isAsleep ? S.particles : null,
        })
        pixelateCanvas(canvasRef.current, 3)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [dna, animationEnabled, personality, idleMode]) // eslint-disable-line

  const animClass = animationEnabled ? idleClass(personality || dna?.personality, idleMode) : ''
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`${animClass} ${className}`.trim()}
      style={{ borderRadius: 8, display: 'block', ...style }}
    />
  )
}
