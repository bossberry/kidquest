import React, { useState, useEffect, useRef } from 'react'
import { playSFX, playTone } from '../lib/audio.js'

const LEVEL_NAMES = {
  thai: { 1:'พยัญชนะ ก-ฮ', 2:'สะกดคำ', 3:'คำศัพท์', 4:'ประโยค', 5:'อ่านจับใจความ' },
  math: { 1:'นับ 1-10', 2:'บวกลบ 1-10', 3:'บวกลบ 1-20', 4:'บวกลบ 1-100', 5:'โจทย์คำ', 6:'เปรียบเทียบ', 7:'รูปแบบ AB', 8:'คูณหาร' },
  eng:  { 1:'A-Z Phonics', 2:'CVC Words', 3:'Sight Words', 4:'ประโยค' },
}
const SUBJECT_COLORS = { thai: '#E24B4A', math: '#378ADD', eng: '#EF9F27' }
const SUBJECT_LABELS = { thai: 'ภาษาไทย', math: 'คณิตศาสตร์', eng: 'ภาษาอังกฤษ' }

const STAR_COLORS = ['#FFD700', '#FF88FF', '#FF6600', '#00FF88', '#4488FF', '#FF4488']

export default function LevelUpCutscene({ data, onDone }) {
  const { subject, oldLevel, newLevel } = data
  const [phase, setPhase] = useState('flash') // flash → reveal → celebrate → done
  const canvasRef = useRef(null)
  const starsRef  = useRef([])
  const rafRef    = useRef(null)

  // Init stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 35 }, (_, i) => ({
      x:     Math.random(),
      y:    -Math.random() * 1.5,
      speed: 0.004 + Math.random() * 0.006,
      size:  3 + Math.floor(Math.random() * 7),
      color: STAR_COLORS[i % STAR_COLORS.length],
      rot:   Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.15,
    }))
  }, [])

  // Phase timing
  useEffect(() => {
    const t1 = setTimeout(() => { setPhase('reveal');    playSFX('level_up') },   400)
    const t2 = setTimeout(() => { setPhase('celebrate'); playTone('fanfare') },   1200)
    const t3 = setTimeout(() => setPhase('done'), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Star rain canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let alive = true

    function drawStar(ctx, x, y, size, rot, color) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.fillStyle = color
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2
        const b = a + Math.PI / 4
        const r1 = size, r2 = size * 0.4
        if (i === 0) ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1)
        else ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1)
        ctx.lineTo(Math.cos(b) * r2, Math.sin(b) * r2)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    function loop() {
      if (!alive) return
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      starsRef.current = starsRef.current.map(s => {
        const ny  = s.y + s.speed
        const out = ny > 1.1
        return out
          ? { ...s, y: -0.05 - Math.random() * 0.5, x: Math.random(), rot: Math.random() * Math.PI * 2 }
          : { ...s, y: ny, rot: s.rot + s.rotSpd }
      })
      starsRef.current.forEach(s => {
        const px = s.x * w, py = s.y * h
        if (py < -s.size) return
        drawStar(ctx, px, py, s.size, s.rot, s.color)
      })
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const color       = SUBJECT_COLORS[subject] || '#FFD700'
  const levelName   = LEVEL_NAMES[subject]?.[newLevel] ?? `ระดับ ${newLevel}`
  const subjectLabel = SUBJECT_LABELS[subject] || subject
  const visible     = phase !== 'flash'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: phase === 'flash' ? '#FFFFFF' : 'rgba(0,0,10,0.94)',
        transition: 'background 0.35s ease',
        cursor: phase === 'done' ? 'pointer' : 'default',
      }}
      onClick={phase === 'done' ? onDone : undefined}
    >
      {/* Star rain canvas */}
      <canvas
        ref={canvasRef}
        width={400} height={700}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          imageRendering: 'pixelated', pointerEvents: 'none',
          opacity: phase === 'celebrate' || phase === 'done' ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.6)',
        transition: 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Subject label */}
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 9,
          color, letterSpacing: 3, marginBottom: 12,
          textShadow: `0 0 16px ${color}`,
        }}>
          {subjectLabel}
        </div>

        {/* LEVEL UP! */}
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 32,
          color: '#FFD700', letterSpacing: 2,
          textShadow: '0 0 16px #FF8800, 0 0 40px #FFD700, 0 2px 0 #8B4500',
          marginBottom: 20,
          animation: (phase === 'celebrate' || phase === 'done')
            ? 'levelup-pulse 0.9s ease-in-out infinite alternate'
            : 'none',
        }}>
          LEVEL UP!
        </div>

        {/* Level number change */}
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 20, color: '#fff',
          letterSpacing: 2, marginBottom: 10,
          textShadow: '0 2px 0 #000',
          animation: (phase === 'celebrate' || phase === 'done')
            ? 'scale-pop 0.6s ease-out both'
            : 'none',
        }}>
          Lv.{oldLevel} → Lv.{newLevel}
        </div>

        {/* Arrow decoration */}
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 11,
          color: color + 'cc', marginBottom: 6,
          animation: (phase === 'celebrate' || phase === 'done')
            ? 'arrow-slide 0.5s 0.3s ease-out both'
            : 'none',
          opacity: 0,
        }}>
          ▼ ▼ ▼
        </div>

        {/* New level name */}
        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 20,
          color, textShadow: `0 0 14px ${color}88`,
          marginBottom: 32,
          animation: (phase === 'celebrate' || phase === 'done')
            ? 'arrow-slide 0.5s 0.5s ease-out both'
            : 'none',
          opacity: 0,
        }}>
          {levelName}
        </div>

        {/* Tap to continue */}
        {phase === 'done' && (
          <div style={{
            fontFamily: 'var(--font-thai)', fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            animation: 'blink 1.1s step-end infinite',
          }}>
            แตะเพื่อดำเนินการต่อ
          </div>
        )}
      </div>
    </div>
  )
}
