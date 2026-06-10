// Battle effect particle system — canvas-based attack/hit/XP animations

// ── Factories ──────────────────────────────────────────────────────────────────

export function mkBeam(x1, y1, x2, y2, color = '#44ff88', dur = 280) {
  return { k:'beam', x1, y1, x2, y2, color, t:0, dur }
}

export function mkOrb(x1, y1, x2, y2, color = '#FFD700', dur = 380, delay = 0) {
  return { k:'orb', x1, y1, x2, y2, color, t:-delay, dur }
}

export function mkLightning(x1, y1, x2, y2, dur = 380, seed = 17) {
  return { k:'zap', x1, y1, x2, y2, dur, seed, t:0 }
}

export function mkSparks(cx, cy, dur = 380) {
  const dirs = Array.from({ length:6 }, (_, i) => ({
    a: (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.8,
    s: 1.2 + Math.random() * 1.6,
  }))
  return { k:'sparks', cx, cy, dirs, dur, t:0 }
}

// ── Tick — advance dt ms, render alive effects, return surviving list ──────────

export function tickEffects(ctx, effects, dt) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const next = []
  for (const e of effects) {
    e.t += dt
    if (e.t >= e.dur) continue  // expired
    next.push(e)
    if (e.t < 0) continue       // still in delay
    _draw(ctx, e)
  }
  return next
}

// ── Renderers ──────────────────────────────────────────────────────────────────

function _draw(ctx, e) {
  const p = Math.max(0, Math.min(1, e.t / e.dur))
  const alpha = p < 0.18 ? p / 0.18 : p > 0.72 ? (1 - p) / 0.28 : 1
  ctx.save()
  ctx.globalAlpha = alpha

  if (e.k === 'beam') {
    const cpx = e.x1 + (e.x2 - e.x1) * Math.min(1, p * 1.6)
    const cpy = e.y1 + (e.y2 - e.y1) * Math.min(1, p * 1.6)
    ctx.strokeStyle = e.color; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.shadowBlur = 12; ctx.shadowColor = e.color
    ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(cpx, cpy); ctx.stroke()
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(cpx, cpy, 5 * (1 - p * 0.3), 0, Math.PI * 2); ctx.fill()

  } else if (e.k === 'orb') {
    const x = e.x1 + (e.x2 - e.x1) * p
    const y = e.y1 + (e.y2 - e.y1) * p - Math.sin(p * Math.PI) * 32
    ctx.fillStyle = e.color; ctx.shadowBlur = 14; ctx.shadowColor = e.color
    ctx.beginPath(); ctx.arc(x, y, 7 * (1 - p * 0.25), 0, Math.PI * 2); ctx.fill()
    for (let i = 1; i <= 3; i++) {
      const tp = Math.max(0, p - i * 0.05)
      const tx = e.x1 + (e.x2 - e.x1) * tp
      const ty = e.y1 + (e.y2 - e.y1) * tp - Math.sin(tp * Math.PI) * 32
      ctx.globalAlpha = alpha * (1 - i * 0.28)
      ctx.beginPath(); ctx.arc(tx, ty, 3.5, 0, Math.PI * 2); ctx.fill()
    }

  } else if (e.k === 'zap') {
    ctx.strokeStyle = '#FFE040'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    ctx.shadowBlur = 14; ctx.shadowColor = '#FFD700'
    let s = e.seed
    const segs = 7
    const pts = [[e.x1, e.y1]]
    for (let i = 1; i < segs; i++) {
      const t = i / segs
      const mx = e.x1 + (e.x2 - e.x1) * t
      const my = e.y1 + (e.y2 - e.y1) * t
      s = (s * 1664525 + 1013904223) & 0x7fffffff
      const off = ((s & 0xfff) / 0xfff - 0.5) * 30
      const dx = e.x2 - e.x1, dy = e.y2 - e.y1
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      pts.push([mx + (-dy / len) * off, my + (dx / len) * off])
    }
    pts.push([e.x2, e.y2])
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
    for (const pt of pts.slice(1)) ctx.lineTo(pt[0], pt[1])
    ctx.stroke()

  } else if (e.k === 'sparks') {
    for (const d of e.dirs) {
      const dist = d.s * p * 52
      ctx.globalAlpha = alpha * (1 - p * 0.5)
      ctx.fillStyle = '#aaaaaa'; ctx.shadowBlur = 3; ctx.shadowColor = '#cccccc'
      ctx.beginPath()
      ctx.arc(
        e.cx + Math.cos(d.a) * dist,
        e.cy + Math.sin(d.a) * dist,
        3 * (1 - p * 0.5), 0, Math.PI * 2,
      )
      ctx.fill()
    }
  }

  ctx.restore()
}
