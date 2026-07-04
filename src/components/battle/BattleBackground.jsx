// BattleBackground.jsx — painted, atmospheric per-subject battlefield scene.
// The whole static scene is drawn ONCE to an offscreen canvas per subject/size;
// each animated frame just blits that image and paints the few moving ambient
// elements (drifting cave lights / fireflies / twinkling stars) on top.
// Sits behind the effect + overlay canvases (lower z-index) in MoveSelectBattleMode.
import React, { useRef, useEffect } from 'react'

// Deterministic hash from coordinates (same idea as tileEngine's tileHash) so
// seeded texture/detail positions are stable across redraws — never Math.random
// for anything baked into the static layer.
function hash(a, b) {
  return (((a * 31 + b * 17) % 97) + 97) % 97
}
// 0..1 helper
function h01(a, b) { return hash(a, b) / 96 }

// ── Static scene painters (draw to an offscreen 2d context `c`) ───────────────

function paintVignetteAndGround(c, w, h, groundLineColor) {
  // subtle lighter ground line near the bottom third
  const gy = Math.round(h * 0.68)
  const grad = c.createLinearGradient(0, gy - 2, 0, gy + 2)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.5, groundLineColor)
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  c.fillStyle = grad
  c.fillRect(0, gy - 2, w, 4)

  // low-opacity vignette: transparent center → dark edges
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.32)')
  c.fillStyle = vg
  c.fillRect(0, 0, w, h)
}

function paintCrystalCave(c, w, h) {
  // deep purple → midnight gradient
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#2a1a5a')
  g.addColorStop(0.5, '#1a1040')
  g.addColorStop(1, '#0a0620')
  c.fillStyle = g
  c.fillRect(0, 0, w, h)

  // glowing rune shapes faint on the ground
  c.save()
  c.globalAlpha = 0.12
  c.strokeStyle = '#8a6cff'
  c.shadowColor = '#8a6cff'
  c.shadowBlur = 10
  c.lineWidth = 2
  for (let i = 0; i < 3; i++) {
    const rx = w * (0.28 + i * 0.22)
    const ry = h * 0.82
    const r = 10 + hash(i, 3) % 8
    c.beginPath()
    // simple hexagon rune
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 2
      const px = rx + Math.cos(a) * r
      const py = ry + Math.sin(a) * r * 0.5
      k === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
    }
    c.closePath()
    c.stroke()
  }
  c.restore()

  // stalactites/crystals hanging from top + rising from edges (blue-purple, glow)
  function crystal(cx, cy, len, wdt, up) {
    c.save()
    c.shadowColor = '#5c7cff'
    c.shadowBlur = 16
    const cg = c.createLinearGradient(cx, cy, cx, cy + (up ? -len : len))
    cg.addColorStop(0, '#6a5cff')
    cg.addColorStop(1, '#3a2c8a')
    c.fillStyle = cg
    c.beginPath()
    if (up) {
      c.moveTo(cx - wdt, cy); c.lineTo(cx + wdt, cy); c.lineTo(cx, cy - len)
    } else {
      c.moveTo(cx - wdt, cy); c.lineTo(cx + wdt, cy); c.lineTo(cx, cy + len)
    }
    c.closePath()
    c.fill()
    // facet highlight
    c.globalAlpha = 0.5
    c.fillStyle = '#b0c0ff'
    c.beginPath()
    c.moveTo(cx - wdt * 0.3, cy); c.lineTo(cx, cy + (up ? -len : len)); c.lineTo(cx + 1, cy)
    c.closePath()
    c.fill()
    c.restore()
  }
  // left edge crystals rising from ground
  crystal(w * 0.05, h * 0.9, h * 0.32, 16, true)
  crystal(w * 0.14, h * 0.93, h * 0.2, 11, true)
  // right edge crystals rising from ground
  crystal(w * 0.95, h * 0.9, h * 0.34, 17, true)
  crystal(w * 0.86, h * 0.94, h * 0.18, 10, true)
  // top stalactites
  crystal(w * 0.3, 0, h * 0.2, 12, false)
  crystal(w * 0.68, 0, h * 0.26, 14, false)

  // stone tile lines near the bottom
  c.save()
  c.strokeStyle = 'rgba(140,120,200,0.14)'
  c.lineWidth = 1
  for (let i = 1; i <= 3; i++) {
    const y = h * (0.82 + i * 0.05)
    c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke()
  }
  c.restore()

  paintVignetteAndGround(c, w, h, 'rgba(150,130,255,0.18)')
}

function paintEnchantedForest(c, w, h) {
  // dark forest → lighter horizon → dark ground
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#08221a')
  g.addColorStop(0.5, '#1a4a30')
  g.addColorStop(0.72, '#123322')
  g.addColorStop(1, '#08150e')
  c.fillStyle = g
  c.fillRect(0, 0, w, h)

  // layered tree silhouettes — background (lighter) then foreground (darker)
  function tree(cx, baseY, trunkH, crownR, col) {
    c.fillStyle = col
    // trunk
    c.fillRect(cx - crownR * 0.12, baseY - trunkH, crownR * 0.24, trunkH)
    // rounded overlapping canopy blobs
    c.beginPath(); c.ellipse(cx, baseY - trunkH - crownR * 0.5, crownR, crownR * 1.1, 0, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(cx - crownR * 0.6, baseY - trunkH, crownR * 0.7, crownR * 0.8, 0, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(cx + crownR * 0.6, baseY - trunkH, crownR * 0.7, crownR * 0.8, 0, 0, Math.PI * 2); c.fill()
  }
  // background trees (lighter, further)
  tree(w * 0.2, h * 0.78, h * 0.12, w * 0.1, '#123c26')
  tree(w * 0.8, h * 0.78, h * 0.12, w * 0.1, '#123c26')
  // foreground trees (darker, framing edges)
  tree(w * 0.04, h * 0.95, h * 0.2, w * 0.16, '#06180f')
  tree(w * 0.98, h * 0.95, h * 0.22, w * 0.17, '#06180f')

  // semi-transparent lighter fog band across the lower-middle
  c.save()
  const fg = c.createLinearGradient(0, h * 0.5, 0, h * 0.72)
  fg.addColorStop(0, 'rgba(180,220,190,0)')
  fg.addColorStop(0.5, 'rgba(170,215,185,0.14)')
  fg.addColorStop(1, 'rgba(150,200,170,0)')
  c.fillStyle = fg
  c.fillRect(0, h * 0.5, w, h * 0.22)
  c.restore()

  // dark grass texture — short vertical strokes, seeded positions (stable)
  c.save()
  c.strokeStyle = 'rgba(30,70,40,0.5)'
  c.lineWidth = 1.5
  const bladeTop = h * 0.8
  for (let i = 0; i < Math.floor(w / 10); i++) {
    const x = i * 10 + (hash(i, 7) % 8)
    const baseY = bladeTop + (hash(i, 11) % Math.round(h * 0.18))
    const len = 4 + hash(i, 13) % 7
    const lean = (h01(i, 17) - 0.5) * 4
    c.beginPath(); c.moveTo(x, baseY); c.lineTo(x + lean, baseY - len); c.stroke()
  }
  c.restore()

  paintVignetteAndGround(c, w, h, 'rgba(150,220,160,0.16)')
}

function paintSkyArena(c, w, h) {
  // navy → midnight gradient
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#0a1f3d')
  g.addColorStop(0.6, '#081530')
  g.addColorStop(1, '#040a1c')
  c.fillStyle = g
  c.fillRect(0, 0, w, h)

  // faint teal/purple aurora band sweeping the upper background
  c.save()
  const ag = c.createLinearGradient(0, h * 0.08, w, h * 0.32)
  ag.addColorStop(0, 'rgba(60,200,180,0)')
  ag.addColorStop(0.4, 'rgba(70,210,190,0.16)')
  ag.addColorStop(0.6, 'rgba(150,110,230,0.16)')
  ag.addColorStop(1, 'rgba(120,90,220,0)')
  c.fillStyle = ag
  c.beginPath()
  c.moveTo(0, h * 0.12)
  for (let x = 0; x <= w; x += 20) {
    c.lineTo(x, h * 0.12 + Math.sin(x / w * Math.PI * 2) * h * 0.05)
  }
  c.lineTo(w, h * 0.3); c.lineTo(0, h * 0.3)
  c.closePath()
  c.fill()
  c.restore()

  // soft cloud shapes (overlapping low-alpha ellipses) in upper half
  c.save()
  c.globalAlpha = 0.4
  c.fillStyle = '#b8c8e8'
  function cloud(cx, cy, s) {
    c.beginPath(); c.ellipse(cx, cy, s, s * 0.55, 0, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(cx - s * 0.7, cy + s * 0.15, s * 0.6, s * 0.4, 0, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(cx + s * 0.7, cy + s * 0.15, s * 0.6, s * 0.4, 0, 0, Math.PI * 2); c.fill()
  }
  cloud(w * 0.25, h * 0.2, 30)
  cloud(w * 0.7, h * 0.14, 26)
  cloud(w * 0.85, h * 0.32, 22)
  cloud(w * 0.12, h * 0.4, 20)
  c.restore()

  // floating stone platform edge at the bottom — light grey with a top face
  c.save()
  const py = h * 0.86
  // top face (lighter)
  c.fillStyle = '#8a93a8'
  c.beginPath()
  c.moveTo(w * 0.08, py)
  c.lineTo(w * 0.92, py)
  c.lineTo(w * 0.86, py + 10)
  c.lineTo(w * 0.14, py + 10)
  c.closePath()
  c.fill()
  // front face (darker)
  c.fillStyle = '#4a5266'
  c.beginPath()
  c.moveTo(w * 0.14, py + 10)
  c.lineTo(w * 0.86, py + 10)
  c.lineTo(w * 0.8, h)
  c.lineTo(w * 0.2, h)
  c.closePath()
  c.fill()
  // top edge highlight
  c.strokeStyle = 'rgba(255,255,255,0.25)'
  c.lineWidth = 1.5
  c.beginPath(); c.moveTo(w * 0.08, py); c.lineTo(w * 0.92, py); c.stroke()
  c.restore()

  paintVignetteAndGround(c, w, h, 'rgba(160,190,255,0.16)')
}

// ── Animated ambient element initialisers ─────────────────────────────────────

function initAmbient(subject, w, h) {
  const parts = []
  if (subject === 'math') {
    const n = 10
    for (let i = 0; i < n; i++) {
      parts.push({
        x: h01(i, 1) * w, y: h01(i, 2) * h,
        r: 1 + h01(i, 3) * 2,
        spd: 4 + h01(i, 4) * 8,
        phase: h01(i, 5) * Math.PI * 2,
        drift: (h01(i, 6) - 0.5) * 10,
        color: i % 2 ? '#9a8cff' : '#6cc0ff',
      })
    }
  } else if (subject === 'thai') {
    const n = 7
    for (let i = 0; i < n; i++) {
      parts.push({
        x: h01(i, 1) * w, y: h * 0.45 + h01(i, 2) * h * 0.4,
        r: 1.5 + h01(i, 3) * 1.5,
        spd: 5 + h01(i, 4) * 6,
        phase: h01(i, 5) * Math.PI * 2,
        drift: (h01(i, 6) - 0.5) * 16,
      })
    }
  } else {
    const n = 18
    for (let i = 0; i < n; i++) {
      parts.push({
        x: h01(i, 1) * w, y: h01(i, 2) * h * 0.55,
        r: 0.6 + h01(i, 3) * 1.6,
        spd: 1.5 + h01(i, 4) * 3,
        phase: h01(i, 5) * Math.PI * 2,
      })
    }
  }
  return parts
}

function drawAmbient(ctx, subject, parts, t, w, h) {
  ctx.save()
  if (subject === 'math') {
    for (const p of parts) {
      const y = (p.y - t * p.spd) % h
      const yy = y < 0 ? y + h : y
      const x = p.x + Math.sin(t * 0.5 + p.phase) * p.drift
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + p.phase))
      ctx.globalAlpha = tw * 0.8
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(x, yy, p.r, 0, Math.PI * 2); ctx.fill()
    }
  } else if (subject === 'thai') {
    for (const p of parts) {
      const x = p.x + Math.sin(t * 0.4 + p.phase) * p.drift
      const y = p.y + Math.cos(t * 0.3 + p.phase) * 8
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.1 + p.phase))
      ctx.globalAlpha = tw
      ctx.fillStyle = '#d8ff88'
      ctx.shadowColor = '#aaff66'
      ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill()
    }
  } else {
    for (const p of parts) {
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * (p.spd * 0.3) + p.phase))
      ctx.globalAlpha = tw
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#cfe4ff'
      ctx.shadowBlur = 6
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.restore()
}

const PAINTERS = { math: paintCrystalCave, thai: paintEnchantedForest, eng: paintSkyArena }

export default function BattleBackground({ subject }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ctx = canvas.getContext('2d')
    const paint = PAINTERS[subject] || paintCrystalCave

    let staticImg = null
    let parts = []
    let size = { w: 0, h: 0 }
    let raf = 0

    function buildStatic(w, h) {
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const c = off.getContext('2d')
      paint(c, w, h)
      return off
    }

    function resize() {
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      size = { w, h }
      staticImg = buildStatic(w, h)
      parts = initAmbient(subject, w, h)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const start = performance.now()
    function frame(now) {
      const t = (now - start) / 1000
      const { w, h } = size
      if (staticImg && w) {
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(staticImg, 0, 0, w, h)
        drawAmbient(ctx, subject, parts, t, w, h)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [subject])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', display: 'block' }}
    />
  )
}
