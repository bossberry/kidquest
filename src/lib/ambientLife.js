// SPEC GAME-B §B.3 (2026-07-11) — ambient wildlife: butterflies (grassland),
// seagull shadows (beach), snow gusts (snow). Deliberately viewport-space
// (not world-tile-anchored) and independent of tileEngine.js/particles.js —
// see worldDrawHelpers.js's drawDustPuff comment for why this stays a plain
// per-frame procedural draw instead of routing through mkSparks/tickEffects.
// tick()/spawn() are pure (no ctx) so they're covered by node --test; draw()
// is canvas-only and exercised only via the live app / harness.

const KIND_BY_THEME = { grassland: 'butterfly', beach: 'seagull', snow: 'snowgust' }

export function ambientKindForTheme(theme) {
  return KIND_BY_THEME[theme] ?? null
}

// lowFx halves the count (still present, just sparser) rather than zeroing
// it — matches the eggAuraLayer.js lowFx precedent of "reduced", not
// "removed", per docs/CHATBOT_NOTES's research notes on the existing pattern.
export function spawnAmbientLife(theme, viewW, viewH, lowFx = false, rand = Math.random) {
  const kind = ambientKindForTheme(theme)
  if (!kind) return []
  const baseCount = kind === 'seagull' ? 3 : 5
  const count = lowFx ? Math.max(1, Math.ceil(baseCount / 2)) : baseCount
  return Array.from({ length: count }, () => spawnOne(kind, viewW, viewH, rand))
}

function spawnOne(kind, viewW, viewH, rand) {
  if (kind === 'butterfly') {
    return { kind, x: rand() * viewW, y: 40 + rand() * (viewH * 0.5), phase: rand() * Math.PI * 2, speed: 0.4 + rand() * 0.3 }
  }
  if (kind === 'seagull') {
    return { kind, x: rand() * viewW, y: 30 + rand() * (viewH * 0.3), phase: rand() * Math.PI * 2, speed: 0.6 + rand() * 0.4 }
  }
  // snowgust
  return { kind, x: rand() * viewW, y: rand() * viewH, phase: rand() * Math.PI * 2, speed: 0.8 + rand() * 0.6 }
}

// Advances one entity by dtFrames (≈1 per RAF tick at 60fps); wraps around
// viewport edges so the pool never needs respawning.
export function tickOne(e, dtFrames, viewW, viewH) {
  const t = e.phase + dtFrames * 0.05
  if (e.kind === 'butterfly') {
    return { ...e, phase: t, x: wrap(e.x + Math.cos(t * 0.7) * e.speed * dtFrames, viewW), y: e.y + Math.sin(t) * 0.6 }
  }
  if (e.kind === 'seagull') {
    return { ...e, phase: t, x: wrap(e.x + e.speed * dtFrames, viewW) }
  }
  // snowgust — diagonal down-right drift, wraps both axes
  return { ...e, phase: t, x: wrap(e.x + e.speed * dtFrames * 0.6, viewW), y: wrap(e.y + e.speed * dtFrames, viewH) }
}

function wrap(v, max) {
  const pad = 24
  if (v > max + pad) return -pad
  if (v < -pad) return max + pad
  return v
}

export function tickAmbientLife(list, dtFrames, viewW, viewH) {
  return list.map(e => tickOne(e, dtFrames, viewW, viewH))
}

export function drawAmbientLife(ctx, list) {
  for (const e of list) {
    if (e.kind === 'butterfly') drawButterfly(ctx, e)
    else if (e.kind === 'seagull') drawSeagullShadow(ctx, e)
    else if (e.kind === 'snowgust') drawSnowFleck(ctx, e)
  }
}

function drawButterfly(ctx, e) {
  const flap = Math.sin(e.phase * 6) * 0.5 + 0.5
  ctx.save()
  ctx.translate(e.x, e.y)
  ctx.fillStyle = 'rgba(255,180,220,0.85)'
  ctx.beginPath(); ctx.ellipse(-3, 0, 3 * (0.4 + flap * 0.6), 4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(3, 0, 3 * (0.4 + flap * 0.6), 4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawSeagullShadow(ctx, e) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath()
  ctx.ellipse(e.x, e.y + 14, 10, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(e.x - 7, e.y); ctx.lineTo(e.x, e.y - 3); ctx.lineTo(e.x + 7, e.y)
  ctx.stroke()
}

function drawSnowFleck(ctx, e) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath()
  ctx.arc(e.x, e.y, 1.6, 0, Math.PI * 2)
  ctx.fill()
}
