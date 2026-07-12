// Element attack canvas animations — 6 elements × 4 tiers
import { drawAuraLayer } from '../egg/eggAuraLayer.js'

function animate(ctx, w, h, duration, drawFn, onComplete) {
  const start = performance.now()
  function frame(now) {
    const t = Math.min(1, (now - start) / duration)
    ctx.clearRect(0, 0, w, h)
    drawFn(ctx, w, h, t)
    if (t < 1) {
      requestAnimationFrame(frame)
    } else {
      ctx.clearRect(0, 0, w, h)
      if (onComplete) onComplete()
    }
  }
  requestAnimationFrame(frame)
}

function zigzag(ctx, x1, y1, x2, y2, segments, jaggedness, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(x1, y1)
  for (let i = 1; i < segments; i++) {
    const t = i / segments
    const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jaggedness
    const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jaggedness
    ctx.lineTo(mx, my)
  }
  ctx.lineTo(x2, y2); ctx.stroke()
}

// ── LIGHTNING ─────────────────────────────────────────────────────────────────

function _lightT0(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 300, (ctx2, _w, _h, t) => {
    const flash = Math.floor(t * 5) % 2 === 0
    if (!flash) return
    ctx2.globalAlpha = 1 - t
    ctx2.shadowBlur = 12; ctx2.shadowColor = '#ffe040'
    zigzag(ctx2, from.x, from.y, to.x, to.y, 8, 22, '#ffe040', 3)
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _lightT1(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    ctx2.globalAlpha = t < 0.7 ? 1 : (1 - t) / 0.3
    ctx2.shadowBlur = 10; ctx2.shadowColor = '#ffe040'
    zigzag(ctx2, from.x, from.y, to.x, to.y, 10, 26, '#ffe040', 3)
    const offsets = [[-18, -10], [14, 12]]
    offsets.forEach(([ox, oy]) => {
      ctx2.globalAlpha = (t < 0.7 ? 1 : (1 - t) / 0.3) * 0.55
      zigzag(ctx2, from.x + ox, from.y + oy, to.x + ox * 0.4, to.y + oy * 0.4, 7, 18, '#ffe888', 1.5)
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _lightT2(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 600, (ctx2, _w, _h, t) => {
    const alpha = t < 0.6 ? 1 : (1 - t) / 0.4
    // Screen edge pulse yellow
    if (t < 0.3) {
      ctx2.globalAlpha = (0.3 - t) / 0.3 * 0.18
      ctx2.fillStyle = '#ffe040'
      ctx2.fillRect(0, 0, w, h)
    }
    ctx2.globalAlpha = alpha
    ctx2.shadowBlur = 14; ctx2.shadowColor = '#ffe040'
    for (let i = 0; i < 5; i++) {
      const sx = (i / 5) * w * 0.8 + w * 0.1
      zigzag(ctx2, sx, 0, to.x + (i - 2) * 12, to.y, 10, 20, i === 2 ? '#ffffff' : '#ffe040', i === 2 ? 3 : 1.5)
    }
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _lightT3(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 800, (ctx2, _w, _h, t) => {
    const alpha = t < 0.65 ? 1 : (1 - t) / 0.35
    // Double screen flash white
    if (t < 0.08 || (t > 0.35 && t < 0.43)) {
      ctx2.globalAlpha = 0.35
      ctx2.fillStyle = '#ffffff'
      ctx2.fillRect(0, 0, w, h)
    }
    ctx2.globalAlpha = alpha
    ctx2.shadowBlur = 18; ctx2.shadowColor = '#ffe040'
    for (let i = 0; i < 8; i++) {
      const sx = (i / 8) * w * 0.9 + w * 0.05
      zigzag(ctx2, sx, 0, to.x + (i - 3.5) * 10, to.y, 12, 28, '#ffffff', 3)
      zigzag(ctx2, sx, 0, to.x + (i - 3.5) * 10, to.y, 12, 28, '#ffe040', 5)
    }
    // Expanding electric ring at enemy
    const ring = t * 60
    ctx2.strokeStyle = '#ffe040'; ctx2.lineWidth = 2; ctx2.globalAlpha = alpha * (1 - t)
    ctx2.beginPath(); ctx2.arc(to.x, to.y, ring, 0, Math.PI * 2); ctx2.stroke()
    ctx2.shadowBlur = 0
  }, onComplete)
}

// ── FIRE ──────────────────────────────────────────────────────────────────────

function _fireT0(ctx, w, h, from, to, onComplete) {
  const sparks = Array.from({ length: 8 }, () => ({ ox: (Math.random() - 0.5) * 20, oy: (Math.random() - 0.5) * 20 }))
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 8; ctx2.shadowColor = '#ff6020'
    sparks.forEach((s, i) => {
      const pt = Math.max(0, t - i * 0.04)
      if (pt <= 0) return
      const x = from.x + (to.x - from.x) * pt + Math.sin(pt * 8 + i) * 10
      const y = from.y + (to.y - from.y) * pt - Math.sin(pt * Math.PI) * 28 + s.oy
      ctx2.globalAlpha = 1 - pt
      ctx2.fillStyle = pt < 0.5 ? '#ffcc44' : '#ff6020'
      ctx2.beginPath(); ctx2.arc(x, y, 4 * (1 - pt * 0.5), 0, Math.PI * 2); ctx2.fill()
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _fireT1(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 500, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 16; ctx2.shadowColor = '#ff6020'
    // Trail
    for (let i = 4; i >= 1; i--) {
      const tp = Math.max(0, t - i * 0.06)
      const tx = from.x + (to.x - from.x) * tp
      const ty = from.y + (to.y - from.y) * tp - Math.sin(tp * Math.PI) * 20
      ctx2.globalAlpha = (1 - i * 0.2) * (1 - t * 0.5)
      ctx2.fillStyle = '#ff8800'
      ctx2.beginPath(); ctx2.arc(tx, ty, (10 - i * 1.5) * (1 - tp * 0.3), 0, Math.PI * 2); ctx2.fill()
    }
    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 20
    ctx2.globalAlpha = 1 - t * 0.3
    ctx2.fillStyle = '#ff6020'; ctx2.beginPath(); ctx2.arc(x, y, 14 * (1 - t * 0.2), 0, Math.PI * 2); ctx2.fill()
    ctx2.fillStyle = '#ffcc44'; ctx2.beginPath(); ctx2.arc(x, y, 7 * (1 - t * 0.2), 0, Math.PI * 2); ctx2.fill()
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _fireT2(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 600, (ctx2, _w, _h, t) => {
    const wy = to.y - 20
    const height = 40 + t * 30
    const grad = ctx2.createLinearGradient(0, wy - height, 0, wy + height)
    grad.addColorStop(0, `rgba(255,200,40,${(1 - t) * 0.7})`)
    grad.addColorStop(0.5, `rgba(255,80,0,${(1 - t) * 0.8})`)
    grad.addColorStop(1, `rgba(180,0,0,0)`)
    const waveW = t * w * 1.2
    ctx2.save()
    ctx2.beginPath()
    ctx2.rect(0, 0, waveW, h)
    ctx2.clip()
    ctx2.fillStyle = grad
    ctx2.fillRect(0, wy - height, w, height * 2)
    // Flame flicker
    for (let x = 0; x < w; x += 18) {
      const flicker = Math.sin(x * 0.3 + t * 20) * 12
      ctx2.globalAlpha = (1 - t) * 0.6
      ctx2.fillStyle = '#ffaa22'
      ctx2.beginPath(); ctx2.arc(x, wy + flicker, 8, 0, Math.PI * 2); ctx2.fill()
    }
    ctx2.restore()
  }, onComplete)
}

function _fireT3(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 800, (ctx2, _w, _h, t) => {
    const fallY = t < 0.7 ? -40 + (to.y + 40) * (t / 0.7) : to.y
    const fallX = to.x
    // Flame tail
    if (t < 0.7) {
      for (let i = 8; i >= 1; i--) {
        const tp = Math.max(0, t - i * 0.03)
        const ty = -40 + (to.y + 40) * (tp / 0.7)
        ctx2.globalAlpha = (1 - i * 0.1) * 0.7
        ctx2.fillStyle = i < 4 ? '#ff6020' : '#ffaa22'
        ctx2.beginPath(); ctx2.arc(fallX, ty, (22 - i * 1.8) * (1 - tp * 0.2), 0, Math.PI * 2); ctx2.fill()
      }
    }
    ctx2.shadowBlur = 22; ctx2.shadowColor = '#ff6020'
    ctx2.globalAlpha = t < 0.7 ? 1 : (1 - (t - 0.7) / 0.3)
    ctx2.fillStyle = '#ff3000'; ctx2.beginPath(); ctx2.arc(fallX, fallY, 24, 0, Math.PI * 2); ctx2.fill()
    ctx2.fillStyle = '#ff8800'; ctx2.beginPath(); ctx2.arc(fallX, fallY, 14, 0, Math.PI * 2); ctx2.fill()
    // Explosion ring after impact
    if (t >= 0.7) {
      const et = (t - 0.7) / 0.3
      ctx2.globalAlpha = 1 - et
      ctx2.strokeStyle = '#ff6020'; ctx2.lineWidth = 4
      ctx2.beginPath(); ctx2.arc(to.x, to.y, et * 70, 0, Math.PI * 2); ctx2.stroke()
      ctx2.strokeStyle = '#ffaa22'; ctx2.lineWidth = 2
      ctx2.beginPath(); ctx2.arc(to.x, to.y, et * 50, 0, Math.PI * 2); ctx2.stroke()
    }
    ctx2.shadowBlur = 0
  }, onComplete)
}

// ── ICE ───────────────────────────────────────────────────────────────────────

function _iceT0(ctx, w, h, from, to, onComplete) {
  const shards = Array.from({ length: 6 }, (_, i) => ({ angle: (i / 6) * Math.PI * 2 }))
  animate(ctx, w, h, 300, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 8; ctx2.shadowColor = '#80e8ff'
    shards.forEach((s, i) => {
      const pt = Math.max(0, t - i * 0.04)
      if (pt <= 0) return
      const x = from.x + (to.x - from.x) * pt + Math.cos(s.angle) * 12 * (1 - pt)
      const y = from.y + (to.y - from.y) * pt + Math.sin(s.angle) * 12 * (1 - pt)
      ctx2.globalAlpha = 1 - pt
      ctx2.save(); ctx2.translate(x, y); ctx2.rotate(s.angle + pt * 3)
      ctx2.fillStyle = '#c0f4ff'
      ctx2.beginPath(); ctx2.moveTo(0, -5); ctx2.lineTo(4, 0); ctx2.lineTo(0, 5); ctx2.lineTo(-4, 0)
      ctx2.closePath(); ctx2.fill()
      ctx2.restore()
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _iceT1(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 10; ctx2.shadowColor = '#80e8ff'
    const fanAngles = [-0.25, 0, 0.25]
    fanAngles.forEach((fa, i) => {
      const prog = Math.min(1, t * 1.4)
      const angle = Math.atan2(to.y - from.y, to.x - from.x) + fa
      const dist = prog * Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2)
      const ex = from.x + Math.cos(angle) * dist
      const ey = from.y + Math.sin(angle) * dist
      ctx2.globalAlpha = 1 - t * 0.5
      ctx2.save(); ctx2.translate((from.x + ex) / 2, (from.y + ey) / 2)
      ctx2.rotate(angle)
      ctx2.fillStyle = i === 1 ? '#c0f4ff' : '#80e8ff'
      ctx2.fillRect(-dist / 2, -4 + i * 2, dist, 7 - i * 2)
      ctx2.restore()
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _iceT2(ctx, w, h, from, to, onComplete) {
  const flakes = Array.from({ length: 20 }, (_, i) => ({
    angle: (i / 20) * Math.PI * 2,
    radius: 30 + (i % 3) * 20,
    speed: 1 + (i % 4) * 0.5,
  }))
  animate(ctx, w, h, 600, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 6; ctx2.shadowColor = '#80e8ff'
    flakes.forEach(f => {
      const spiral = f.angle + t * f.speed * 4
      const r = f.radius * (1 - t * 0.8)
      const x = to.x + Math.cos(spiral) * r
      const y = to.y + Math.sin(spiral) * r
      ctx2.globalAlpha = t < 0.7 ? 0.9 : (1 - t) / 0.3
      ctx2.fillStyle = '#e0f8ff'
      ctx2.beginPath(); ctx2.arc(x, y, 3 * (1 - t * 0.4), 0, Math.PI * 2); ctx2.fill()
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _iceT3(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 800, (ctx2, _w, _h, t) => {
    const rt = t < 0.6 ? t / 0.6 : 1
    const alpha = t < 0.6 ? 1 : (1 - t) / 0.4
    // Ice crystal star polygon growing
    ctx2.globalAlpha = alpha * 0.85
    ctx2.strokeStyle = '#c0f4ff'; ctx2.lineWidth = 2
    ctx2.shadowBlur = 14; ctx2.shadowColor = '#80e8ff'
    const spikes = 8
    const outerR = rt * 55
    const innerR = rt * 22
    ctx2.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? outerR : innerR
      const x = to.x + Math.cos(angle) * r
      const y = to.y + Math.sin(angle) * r
      i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y)
    }
    ctx2.closePath(); ctx2.stroke()
    // Blue overlay on enemy
    ctx2.globalAlpha = alpha * 0.22
    ctx2.fillStyle = '#80e8ff'
    ctx2.beginPath(); ctx2.arc(to.x, to.y, outerR * 0.9, 0, Math.PI * 2); ctx2.fill()
    ctx2.shadowBlur = 0
  }, onComplete)
}

// ── WIND ──────────────────────────────────────────────────────────────────────

function _windT0(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 300, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 6; ctx2.shadowColor = '#a0e880'
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 20
      const cp1x = from.x + (to.x - from.x) * 0.3 + 30
      const cp1y = from.y + offset - 30
      const cp2x = from.x + (to.x - from.x) * 0.7 - 30
      const cp2y = to.y + offset + 30
      ctx2.globalAlpha = (1 - t) * (i === 1 ? 1 : 0.55)
      ctx2.strokeStyle = '#a0e880'; ctx2.lineWidth = i === 1 ? 2.5 : 1.5
      ctx2.beginPath()
      ctx2.moveTo(from.x, from.y + offset)
      ctx2.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y + offset)
      ctx2.stroke()
    }
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _windT1(ctx, w, h, from, to, onComplete) {
  const leaves = Array.from({ length: 8 }, (_, i) => ({ off: (i - 3.5) * 10 }))
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 6; ctx2.shadowColor = '#a0e880'
    for (let i = 0; i < 6; i++) {
      const offset = (i - 2.5) * 14
      ctx2.globalAlpha = (1 - t) * (Math.abs(i - 2.5) < 1 ? 1 : 0.5)
      ctx2.strokeStyle = '#a0e880'; ctx2.lineWidth = Math.abs(i - 2.5) < 1 ? 2.5 : 1.5
      ctx2.beginPath()
      ctx2.moveTo(from.x, from.y + offset)
      ctx2.bezierCurveTo(from.x + (to.x - from.x) * 0.4 + 25, from.y + offset - 25,
        from.x + (to.x - from.x) * 0.7 - 25, to.y + offset + 20, to.x, to.y + offset)
      ctx2.stroke()
    }
    leaves.forEach((l, i) => {
      const lt = Math.min(1, t * 1.5 - i * 0.05)
      if (lt <= 0) return
      const x = from.x + (to.x - from.x) * lt
      const y = from.y + (to.y - from.y) * lt + l.off
      ctx2.globalAlpha = (1 - lt) * 0.8
      ctx2.save(); ctx2.translate(x, y); ctx2.rotate(lt * 8 + i)
      ctx2.fillStyle = '#88cc66'
      ctx2.beginPath(); ctx2.moveTo(0, -4); ctx2.lineTo(3, 0); ctx2.lineTo(0, 4); ctx2.lineTo(-3, 0)
      ctx2.closePath(); ctx2.fill()
      ctx2.restore()
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _windT2(ctx, w, h, from, to, onComplete) {
  const particles = Array.from({ length: 22 }, (_, i) => ({ y: Math.random() * h, speed: 0.6 + Math.random() * 0.8 }))
  animate(ctx, w, h, 600, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 4; ctx2.shadowColor = '#a0e880'
    particles.forEach(p => {
      const x = t * w * p.speed * 1.4
      ctx2.globalAlpha = t < 0.7 ? 0.7 : (1 - t) / 0.3 * 0.7
      ctx2.strokeStyle = '#a0e880'; ctx2.lineWidth = 1.5
      ctx2.beginPath(); ctx2.moveTo(Math.max(0, x - 30), p.y); ctx2.lineTo(x, p.y); ctx2.stroke()
    })
    // Horizontal sweep gust
    ctx2.globalAlpha = (t < 0.5 ? t * 2 : (1 - t) * 2) * 0.15
    ctx2.fillStyle = '#a0e880'
    ctx2.fillRect(0, 0, w, h)
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _windT3(ctx, w, h, from, to, onComplete) {
  const dots = Array.from({ length: 24 }, (_, i) => ({ angle: (i / 24) * Math.PI * 2, r: 20 + (i % 4) * 15 }))
  animate(ctx, w, h, 800, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 8; ctx2.shadowColor = '#a0e880'
    dots.forEach(d => {
      const spin = d.angle + t * 6
      const r = d.r * (1 - t * 0.6) + 8
      const x = to.x + Math.cos(spin) * r
      const y = to.y + Math.sin(spin) * r
      ctx2.globalAlpha = t < 0.7 ? 0.85 : (1 - t) / 0.3
      ctx2.fillStyle = '#a0e880'
      ctx2.beginPath(); ctx2.arc(x, y, 4 * (1 - t * 0.4), 0, Math.PI * 2); ctx2.fill()
    })
    ctx2.shadowBlur = 0
  }, onComplete)
}

// ── LASER ─────────────────────────────────────────────────────────────────────

function _laserT0(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 300, (ctx2, _w, _h, t) => {
    ctx2.globalAlpha = 1 - t
    ctx2.strokeStyle = '#ff40ff'; ctx2.lineWidth = 2; ctx2.lineCap = 'round'
    ctx2.shadowBlur = 8; ctx2.shadowColor = '#ff40ff'
    ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _laserT1(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    const alpha = t < 0.7 ? 1 : (1 - t) / 0.3
    ctx2.lineCap = 'round'
    // Outer glow
    ctx2.globalAlpha = alpha * 0.3
    ctx2.strokeStyle = '#ff40ff'; ctx2.lineWidth = 12
    ctx2.shadowBlur = 20; ctx2.shadowColor = '#ff40ff'
    ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
    // Core beam
    ctx2.globalAlpha = alpha
    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 3
    ctx2.shadowBlur = 10; ctx2.shadowColor = '#ff40ff'
    ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _laserT2(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 500, (ctx2, _w, _h, t) => {
    const alpha = t < 0.65 ? 1 : (1 - t) / 0.35
    ctx2.lineCap = 'round'
    ctx2.globalAlpha = alpha * 0.4
    ctx2.strokeStyle = '#ff40ff'; ctx2.lineWidth = 16
    ctx2.shadowBlur = 24; ctx2.shadowColor = '#ff40ff'
    ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
    ctx2.globalAlpha = alpha
    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 4
    ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
    // Impact expanding circle
    const ring = t * 55
    ctx2.globalAlpha = alpha * (1 - t)
    ctx2.strokeStyle = '#ff40ff'; ctx2.lineWidth = 3
    ctx2.beginPath(); ctx2.arc(to.x, to.y, ring, 0, Math.PI * 2); ctx2.stroke()
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _laserT3(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 800, (ctx2, _w, _h, t) => {
    if (t < 0.45) {
      // Beam fires in
      const alpha = t < 0.4 ? 1 : (0.45 - t) / 0.05
      ctx2.lineCap = 'round'
      ctx2.globalAlpha = alpha * 0.35
      ctx2.strokeStyle = '#ff40ff'; ctx2.lineWidth = 18
      ctx2.shadowBlur = 28; ctx2.shadowColor = '#ff40ff'
      ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
      ctx2.globalAlpha = alpha
      ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 5
      ctx2.beginPath(); ctx2.moveTo(from.x, from.y); ctx2.lineTo(to.x, to.y); ctx2.stroke()
    } else {
      // Explosion: 8 beams radiating outward
      const et = (t - 0.45) / 0.55
      const alpha = 1 - et
      if (et < 0.15) {
        ctx2.globalAlpha = (0.15 - et) / 0.15 * 0.4
        ctx2.fillStyle = '#ffffff'
        ctx2.fillRect(0, 0, w, h)
      }
      ctx2.shadowBlur = 16; ctx2.shadowColor = '#ff40ff'
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const len = et * 80
        const ex = to.x + Math.cos(angle) * len
        const ey = to.y + Math.sin(angle) * len
        ctx2.globalAlpha = alpha * 0.9
        ctx2.strokeStyle = '#ff40ff'; ctx2.lineWidth = 3; ctx2.lineCap = 'round'
        ctx2.beginPath(); ctx2.moveTo(to.x, to.y); ctx2.lineTo(ex, ey); ctx2.stroke()
        ctx2.globalAlpha = alpha * 0.5
        ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 1.5
        ctx2.beginPath(); ctx2.moveTo(to.x, to.y); ctx2.lineTo(ex, ey); ctx2.stroke()
      }
    }
    ctx2.shadowBlur = 0
  }, onComplete)
}

// ── WATER ─────────────────────────────────────────────────────────────────────

function _waterT0(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    ctx2.shadowBlur = 8; ctx2.shadowColor = '#4088ff'
    for (let i = 0; i < 5; i++) {
      const pt = Math.max(0, t - i * 0.08)
      if (pt <= 0) return
      const x = from.x + (to.x - from.x) * pt
      const y = from.y + (to.y - from.y) * pt - Math.sin(pt * Math.PI) * 25 + (i - 2) * 8
      ctx2.globalAlpha = (1 - pt) * 0.9
      ctx2.strokeStyle = '#88bbff'; ctx2.lineWidth = 1.5
      ctx2.fillStyle = '#4088ff'
      ctx2.beginPath(); ctx2.arc(x, y, 7 * (1 - pt * 0.3), 0, Math.PI * 2); ctx2.fill()
      ctx2.beginPath(); ctx2.arc(x, y, 7 * (1 - pt * 0.3), 0, Math.PI * 2); ctx2.stroke()
    }
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _waterT1(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 400, (ctx2, _w, _h, t) => {
    const waveProgress = t * w * 1.5
    const wy = to.y
    ctx2.shadowBlur = 8; ctx2.shadowColor = '#4088ff'
    ctx2.globalAlpha = t < 0.7 ? 1 : (1 - t) / 0.3
    ctx2.strokeStyle = '#4088ff'; ctx2.lineWidth = 3; ctx2.lineCap = 'round'
    ctx2.beginPath()
    for (let x = 0; x < Math.min(waveProgress, w); x += 4) {
      const y = wy + Math.sin((x / 30) + t * 10) * 10
      x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y)
    }
    ctx2.stroke()
    // Splash at front
    const sx = Math.min(waveProgress, w)
    ctx2.globalAlpha = (t < 0.7 ? 1 : (1 - t) / 0.3) * 0.7
    ctx2.fillStyle = '#88ccff'
    ctx2.beginPath(); ctx2.arc(sx, wy, 8, 0, Math.PI * 2); ctx2.fill()
    ctx2.shadowBlur = 0
  }, onComplete)
}

function _waterT2(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 700, (ctx2, _w, _h, t) => {
    const riseT = Math.min(1, t / 0.5)
    const recedT = t > 0.5 ? (t - 0.5) / 0.5 : 0
    const fillH = riseT * h * 0.35 * (1 - recedT)
    ctx2.globalAlpha = 0.4 * (1 - recedT * 0.5)
    const grad = ctx2.createLinearGradient(0, h - fillH, 0, h)
    grad.addColorStop(0, 'rgba(64,136,255,0.6)')
    grad.addColorStop(1, 'rgba(30,80,200,0.8)')
    ctx2.fillStyle = grad
    ctx2.fillRect(0, h - fillH, w, fillH)
    // Wave on top edge
    if (fillH > 2) {
      ctx2.globalAlpha = 0.7 * (1 - recedT)
      ctx2.strokeStyle = '#88ccff'; ctx2.lineWidth = 2
      ctx2.beginPath()
      for (let x = 0; x <= w; x += 6) {
        const y = h - fillH + Math.sin(x / 25 + t * 12) * 5
        x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y)
      }
      ctx2.stroke()
    }
  }, onComplete)
}

function _waterT3(ctx, w, h, from, to, onComplete) {
  animate(ctx, w, h, 900, (ctx2, _w, _h, t) => {
    const alpha = t < 0.75 ? 1 : (1 - t) / 0.25
    // Massive sine wave sweeping entire screen
    const waveX = t * w * 1.4
    ctx2.globalAlpha = alpha * 0.5
    ctx2.fillStyle = '#1040c0'
    ctx2.fillRect(0, 0, Math.min(waveX, w), h)
    ctx2.shadowBlur = 12; ctx2.shadowColor = '#4088ff'
    ctx2.globalAlpha = alpha
    ctx2.strokeStyle = '#4088ff'; ctx2.lineWidth = 4; ctx2.lineCap = 'round'
    ctx2.beginPath()
    for (let x = 0; x <= Math.min(waveX, w); x += 5) {
      const y = h * 0.5 + Math.sin(x / 35 + t * 8) * 45 + Math.cos(x / 20 + t * 6) * 20
      x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y)
    }
    ctx2.stroke()
    ctx2.strokeStyle = '#88ccff'; ctx2.lineWidth = 2
    ctx2.beginPath()
    for (let x = 0; x <= Math.min(waveX, w); x += 5) {
      const y = h * 0.5 + Math.sin(x / 35 + t * 8 + 0.8) * 35 + Math.cos(x / 20 + t * 6 + 0.5) * 15
      x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y)
    }
    ctx2.stroke()
    ctx2.shadowBlur = 0
  }, onComplete)
}

// ── Dispatch table ────────────────────────────────────────────────────────────

const ANIMATIONS = {
  lightning: [_lightT0, _lightT1, _lightT2, _lightT3],
  fire:      [_fireT0,  _fireT1,  _fireT2,  _fireT3],
  ice:       [_iceT0,   _iceT1,   _iceT2,   _iceT3],
  wind:      [_windT0,  _windT1,  _windT2,  _windT3],
  laser:     [_laserT0, _laserT1, _laserT2, _laserT3],
  water:     [_waterT0, _waterT1, _waterT2, _waterT3],
}

export function playElementAttack(canvas, element, tierIndex, fromPos, toPos, onComplete) {
  if (!canvas) { if (onComplete) onComplete(); return }
  const ctx = canvas.getContext('2d')
  const fns = ANIMATIONS[element]
  if (!fns) { if (onComplete) onComplete(); return }
  const fn = fns[Math.min(tierIndex, fns.length - 1)]
  fn(ctx, canvas.width, canvas.height, fromPos, toPos, onComplete)
}

// SPEC GAME-B §B.4 (2026-07-12) — element-skill charge-meter blast. This
// battle screen's own element system (lightning/fire/ice/wind/laser/water,
// config/elementConfig.js — the ANIMATIONS table above) is a SEPARATE 6-set
// from SPEC GAME-A §A.3's egg-aura element system (fire/water/nature/
// thunder/shadow/light, src/egg/eggAuraLayer.js) — the spec asks the blast
// to reuse the A.3 aura particle system specifically, so this remaps one set
// onto the other (same style of 1:1 judgment-call remap eggAuraLayer.js's
// own header comment already documents for ITS spec mismatch): fire/water
// are shared as-is; lightning->thunder (near-synonyms, both electric);
// ice->light (already precedented in eggAuraLayer.js's own comment: "ice has
// no equivalent so light gets a twinkling-glimmer motif"); wind->nature
// (both natural forces); laser->shadow (the one arbitrary leftover pairing
// once everything else is assigned).
export const AURA_ELEMENT_MAP = {
  fire: 'fire', water: 'water', lightning: 'thunder', ice: 'light', wind: 'nature', laser: 'shadow',
}

// One-shot "big blast" — drives eggAuraLayer.js's drawAuraLayer (level 3,
// max particle stage) through a scale-in/fade-out envelope via the same
// animate() RAF helper playElementAttack's own tiers use, so it's a genuine
// reuse of the A.3 aura draw routine rather than a new bespoke effect.
export function playElementBlast(canvas, battleElement, cx, cy, onComplete) {
  if (!canvas) { if (onComplete) onComplete(); return }
  const ctx = canvas.getContext('2d')
  const element = AURA_ELEMENT_MAP[battleElement] ?? 'light'
  animate(ctx, canvas.width, canvas.height, 450, (ctx2, _w, _h, t) => {
    const scale = t < 0.3 ? t / 0.3 : 1
    const fade  = t > 0.7 ? (1 - t) / 0.3 : 1
    ctx2.save()
    ctx2.globalAlpha = fade
    drawAuraLayer(ctx2, { level: 3, element, cx, cy, eggR: 14 + 34 * scale, t: t * 4, stage: 9 })
    ctx2.restore()
  }, onComplete)
}
