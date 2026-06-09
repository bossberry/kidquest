// Phase 2: Procedural creature canvas renderer.
// Deterministic: same dna object → identical canvas output, every time.
// Mirrors drawEgg() architecture — layers drawn back-to-front.

// ── Utilities ────────────────────────────────────────────────────────────────

function hsl(h, s, l, a = 1) {
  const hh = ((h || 0) % 360 + 360) % 360
  return a < 1
    ? `hsla(${hh},${s}%,${l}%,${a.toFixed(2)})`
    : `hsl(${hh},${s}%,${l}%)`
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }

function starPath(ctx, cx, cy, r, n = 5) {
  const step = (Math.PI * 2) / n
  const inner = r * 0.42
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a1 = i * step - Math.PI / 2
    const a2 = a1 + step / 2
    ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(a1) * r, cy + Math.sin(a1) * r)
    ctx.lineTo(cx + Math.cos(a2) * inner, cy + Math.sin(a2) * inner)
  }
  ctx.closePath()
}

function heartPath(ctx, cx, cy, sz) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + sz * 0.4)
  ctx.bezierCurveTo(cx - sz * 1.4, cy - sz * 0.4, cx - sz * 1.4, cy + sz * 1.1, cx, cy + sz * 1.7)
  ctx.bezierCurveTo(cx + sz * 1.4, cy + sz * 1.1, cx + sz * 1.4, cy - sz * 0.4, cx, cy + sz * 0.4)
  ctx.closePath()
}

function leafPath(ctx, cx, cy, w, h, angle = 0) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, -h)
  ctx.bezierCurveTo(w, -h * 0.5, w, h * 0.5, 0, h)
  ctx.bezierCurveTo(-w, h * 0.5, -w, -h * 0.5, 0, -h)
  ctx.closePath()
  ctx.restore()
}

// ── Colour palette ────────────────────────────────────────────────────────────

function buildColors(dna) {
  let { h1, h2, h3, ha, isNight, stage } = dna
  if (isNight) {
    h1 = (h1 - 15 + 360) % 360
    h2 = (h2 - 15 + 360) % 360
  }
  const sr   = (stage || 0) / 8
  const bSat = clamp(55 + sr * 25, 45, 82)
  const bLit = clamp(72 - sr * 18, 50, 78)
  const oLit = clamp(bLit - 30, 22, 44)
  return {
    h1, h2, h3, ha,
    body:    hsl(h1, bSat,      bLit),
    bodyL:   hsl(h1, bSat - 8,  bLit + 12),     // center highlight
    bodyD:   hsl(h1, bSat + 4,  bLit - 8),      // edge shadow
    outline: hsl(h1, 58,        oLit),           // darkened hue — never black
    pat:     hsl(h2, bSat,      clamp(bLit - 14, 34, 68)),
    patL:    hsl(h2, bSat - 8,  clamp(bLit - 6,  42, 74)),
    eye:     hsl(h3, 65,        55),
    eyeD:    hsl(h3, 72,        30),
    glow:    hsl(ha, 90,        70),
    cheek:   hsl(h1, clamp(bSat - 12, 38, 70), clamp(bLit + 18, 68, 93)),
    belly:   hsl(h1, clamp(bSat - 16, 32, 62), clamp(bLit + 14, 64, 90)),
    sig:     hsl(ha, 88,        65),             // signature feature accent
    white:   'rgba(255,255,255,0.92)',
  }
}

// ── Geometry ──────────────────────────────────────────────────────────────────
// All constants defined for 120 px. Multiply by sc to scale.

const BODY_DEF = {
  chubby:  { bx: 34, by: 23, bcy: 85 },
  fluffy:  { bx: 36, by: 25, bcy: 84 },
  compact: { bx: 28, by: 22, bcy: 85 },
  lean:    { bx: 21, by: 28, bcy: 84 },
  tiny:    { bx: 18, by: 17, bcy: 88 },
}
const HEAD_DEF = { normal: 23, large: 26, oversized: 30 }

function buildGeometry(dna, sc) {
  let { bx, by, bcy } = BODY_DEF[dna.bodyType] || BODY_DEF.compact
  const sf = dna.signatureFeature
  if (sf === 'extra-round') { bx = by * 1.25; by *= 1.05 }
  if (sf === 'tiny-body')   { bx *= 0.70; by *= 0.70; bcy += 4 }
  const hr0 = HEAD_DEF[dna.headRatio] || 23
  const hr   = hr0
  const CX   = 60
  const hcy  = bcy - by - hr * 0.55
  return {
    CX:  CX  * sc,
    bcx: CX  * sc,  bcy: bcy * sc,  brx: bx * sc,   bry: by * sc,
    hcx: CX  * sc,  hcy: hcy * sc,  hr:  hr * sc,
  }
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function gradEll(ctx, cx, cy, rx, ry, cL, cD, stroke, lw) {
  const g = ctx.createRadialGradient(
    cx - rx * 0.22, cy - ry * 0.28, rx * 0.05,
    cx + rx * 0.05, cy + ry * 0.05, rx * 1.45
  )
  g.addColorStop(0, cL)
  g.addColorStop(0.65, cD.replace(/hsl\(/, 'hsl(').replace(/hsla\(/, 'hsla('))
  g.addColorStop(1, cD)
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke() }
}

function fillCirc(ctx, cx, cy, r, fill, stroke, lw) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.2; ctx.stroke() }
}

// ── Layer functions ───────────────────────────────────────────────────────────

function drawAura(ctx, G, C, dna, sc) {
  const { glowTier } = dna
  if (!glowTier) return
  const alphas = [0, 0.22, 0.38, 0.56, 0.80]
  const radii  = [0, 1.35, 1.55, 1.75, 2.00]
  const a  = alphas[glowTier]
  const r  = G.brx * radii[glowTier]
  const g  = ctx.createRadialGradient(G.bcx, G.bcy, G.brx * 0.3, G.bcx, G.bcy, r)
  g.addColorStop(0,   hsl(C.ha, 90, 72, a))
  g.addColorStop(0.5, hsl(C.ha, 85, 74, a * 0.4))
  g.addColorStop(1,   hsl(C.ha, 80, 78, 0))
  ctx.beginPath()
  ctx.ellipse(G.bcx, G.bcy - G.bry * 0.3, r, r * 0.85, 0, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

function drawWings(ctx, G, C, dna, sc) {
  const { wingType, bodyType } = dna
  if (wingType === 'none') return
  const { bcx, bcy, brx, bry, hr } = G
  const lw = Math.max(1, 1.4 * sc)

  if (wingType === 'flutter') {
    // Cloud family — wispy arcs
    const wy = bcy - bry * 0.6
    for (const side of [-1, 1]) {
      const wx = bcx + side * brx * 0.9
      ctx.beginPath()
      ctx.moveTo(wx, wy)
      ctx.bezierCurveTo(
        wx + side * brx * 0.9, wy - bry * 1.4,
        wx + side * brx * 1.6, wy - bry * 0.4,
        wx + side * brx * 1.3, wy + bry * 0.5
      )
      ctx.bezierCurveTo(
        wx + side * brx * 1.0, wy + bry * 0.2,
        wx + side * brx * 0.5, wy - bry * 0.3,
        wx, wy
      )
      ctx.fillStyle = hsl(C.h1, 20, 94, 0.85)
      ctx.fill()
      ctx.strokeStyle = hsl(C.h1, 30, 80, 0.7)
      ctx.lineWidth = lw
      ctx.stroke()
    }
  } else if (wingType === 'fairy') {
    const wy = bcy - bry * 0.5
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(bcx, wy)
      ctx.bezierCurveTo(
        bcx + side * brx * 0.5, wy - bry * 1.8,
        bcx + side * brx * 1.5, wy - bry * 1.2,
        bcx + side * brx * 1.2, wy + bry * 0.3
      )
      ctx.bezierCurveTo(
        bcx + side * brx * 0.9, wy + bry * 0.6,
        bcx + side * brx * 0.3, wy + bry * 0.2,
        bcx, wy
      )
      ctx.fillStyle = hsl(C.h1, 50, 90, 0.50)
      ctx.fill()
      ctx.strokeStyle = hsl(C.h1, 55, 75, 0.6)
      ctx.lineWidth = lw
      ctx.stroke()
    }
  } else if (wingType === 'bird') {
    const wy = bcy - bry * 0.3
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(bcx + side * brx * 0.4, wy)
      ctx.bezierCurveTo(
        bcx + side * brx * 1.2, wy - bry * 1.6,
        bcx + side * brx * 1.8, wy - bry * 0.8,
        bcx + side * brx * 1.4, wy + bry * 0.4
      )
      ctx.bezierCurveTo(
        bcx + side * brx * 1.0, wy + bry * 0.7,
        bcx + side * brx * 0.6, wy + bry * 0.2,
        bcx + side * brx * 0.4, wy
      )
      ctx.fillStyle = hsl(C.h1, 60, 78, 0.88)
      ctx.fill()
      ctx.strokeStyle = C.outline
      ctx.lineWidth = lw
      ctx.stroke()
    }
  } else if (wingType === 'leaf') {
    const wy = bcy - bry * 0.6
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(bcx + side * brx * 0.6, wy)
      ctx.rotate(side * 0.45)
      leafPath(ctx, 0, 0, brx * 0.6, bry * 1.4)
      ctx.fillStyle = hsl(C.h2, 55, 65, 0.78)
      ctx.fill()
      ctx.strokeStyle = hsl(C.h2, 50, 42)
      ctx.lineWidth = lw
      ctx.stroke()
      ctx.restore()
    }
  } else if (wingType === 'heart') {
    for (const side of [-1, 1]) {
      const wx = bcx + side * brx * 1.1
      const wy = bcy - bry * 0.2
      heartPath(ctx, wx, wy, brx * 0.25)
      ctx.fillStyle = hsl(C.ha, 80, 72, 0.80)
      ctx.fill()
      ctx.strokeStyle = hsl(C.ha, 70, 52)
      ctx.lineWidth = lw * 0.8
      ctx.stroke()
    }
  }
}

function drawBody(ctx, G, C, dna, sc) {
  const lw = (dna.beautyProfile?.outlineWeight || 2.0) * sc
  gradEll(ctx, G.bcx, G.bcy, G.brx, G.bry, C.bodyL, C.body, C.outline, lw)
}

function drawBellyPatch(ctx, G, C, dna, sc) {
  if (!dna.bellyPatch) return
  const rx = G.brx * 0.58
  const ry = G.bry * 0.68
  const g  = ctx.createRadialGradient(G.bcx, G.bcy, 0, G.bcx, G.bcy, rx * 1.1)
  g.addColorStop(0,   C.belly)
  g.addColorStop(0.7, hsl(C.h1, 40, 84, 0.7))
  g.addColorStop(1,   hsl(C.h1, 30, 88, 0))
  ctx.beginPath()
  ctx.ellipse(G.bcx, G.bcy + G.bry * 0.1, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

function drawPattern(ctx, G, C, dna, sc) {
  const { patternType } = dna
  if (patternType === 'solid') return
  const { bcx, bcy, brx, bry } = G
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(bcx, bcy, brx, bry, 0, 0, Math.PI * 2)
  ctx.clip()

  if (patternType === 'spots') {
    const spots = [[0.0,0.2,0.30],[0.55,-0.1,0.22],[-0.4,0.3,0.20],[-0.1,-0.4,0.18],[0.3,0.5,0.16]]
    for (const [dx,dy,r] of spots)
      fillCirc(ctx, bcx + dx*brx, bcy + dy*bry, r*brx, hsl(C.h2, 55, 55, 0.40))
  } else if (patternType === 'freckles') {
    const dots = [[-0.5,0.1],[-0.35,-0.3],[0.1,-0.45],[0.5,0.2],[0.3,0.45],[-0.2,0.5]]
    for (const [dx,dy] of dots)
      fillCirc(ctx, bcx + dx*brx, bcy + dy*bry, 0.07*brx, hsl(C.h2, 55, 52, 0.45))
  } else if (patternType === 'stripes') {
    ctx.fillStyle = hsl(C.h2, 55, 55, 0.30)
    for (let i = -2; i <= 2; i++) {
      const y = bcy + i * bry * 0.42
      ctx.fillRect(bcx - brx, y - bry * 0.12, brx * 2, bry * 0.18)
    }
  } else if (patternType === 'stars-scatter') {
    ctx.fillStyle = hsl(C.h2, 70, 68, 0.50)
    const pts = [[-0.3,-0.3],[0.4,0.0],[-0.1,0.45],[0.35,-0.45],[-0.45,0.35]]
    for (const [dx,dy] of pts) {
      starPath(ctx, bcx + dx*brx, bcy + dy*bry, 0.10*brx)
      ctx.fill()
    }
  } else if (patternType === 'belly') {
    // belly handled by bellyPatch draw
  }
  ctx.restore()
}

function drawEars(ctx, G, C, dna, sc) {
  const { earType, signatureFeature } = dna
  if (earType === 'none') return
  const { hcx, hcy, hr } = G
  const lw  = Math.max(1, 1.3 * sc)
  const meg = signatureFeature === 'mega-ears' ? 1.6 : 1.0
  const twitch = signatureFeature === 'twitch-ears'

  if (earType === 'round') {
    const er = hr * 0.32 * meg
    for (const side of [-1, 1]) {
      const ex = hcx + side * hr * 0.72
      const ey = hcy - hr * 0.62
      // inner ear
      fillCirc(ctx, ex, ey, er * 0.58, hsl(C.h1, 50, 80, 0.70))
      fillCirc(ctx, ex, ey, er, C.body, C.outline, lw)
    }
  } else if (earType === 'cat') {
    for (const side of [-1, 1]) {
      const base = hr * 0.5 * meg
      const ex  = hcx + side * hr * 0.55
      const ey  = hcy - hr * 0.75
      ctx.beginPath()
      ctx.moveTo(ex - side * base * 0.4, ey + base * 0.6)
      ctx.lineTo(ex + side * base * 0.3, ey - (twitch ? base * 1.4 : base * 1.2))
      ctx.lineTo(ex + side * base * 0.6, ey + base * 0.6)
      ctx.closePath()
      ctx.fillStyle = C.body
      ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw; ctx.stroke()
      // inner ear
      ctx.beginPath()
      ctx.moveTo(ex - side * base * 0.15, ey + base * 0.3)
      ctx.lineTo(ex + side * base * 0.2,  ey - base * 0.9)
      ctx.lineTo(ex + side * base * 0.42, ey + base * 0.3)
      ctx.closePath()
      ctx.fillStyle = hsl(C.h1, 50, 82, 0.65)
      ctx.fill()
    }
  } else if (earType === 'floppy') {
    const ew = hr * 0.28 * meg
    const eh = hr * 0.75 * meg
    for (const side of [-1, 1]) {
      const ex = hcx + side * (hr * 0.95 + ew)
      const ey = hcy + hr * 0.05
      ctx.beginPath()
      ctx.ellipse(ex, ey, ew, eh, side * 0.15, 0, Math.PI * 2)
      ctx.fillStyle = C.body
      ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw; ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(ex, ey + eh * 0.08, ew * 0.60, eh * 0.65, side * 0.15, 0, Math.PI * 2)
      ctx.fillStyle = hsl(C.h1, 48, 80, 0.55)
      ctx.fill()
    }
  } else if (earType === 'fin') {
    for (const side of [-1, 1]) {
      const fx = hcx + side * hr * 1.0
      const fy = hcy - hr * 0.25
      ctx.beginPath()
      ctx.moveTo(fx, fy + hr * 0.45 * meg)
      ctx.bezierCurveTo(
        fx + side * hr * 0.55 * meg, fy + hr * 0.10 * meg,
        fx + side * hr * 0.60 * meg, fy - hr * 0.45 * meg,
        fx, fy - hr * 0.35 * meg
      )
      ctx.closePath()
      ctx.fillStyle = C.body
      ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw; ctx.stroke()
    }
  } else if (earType === 'pointed') {
    for (const side of [-1, 1]) {
      const base = hr * 0.45 * meg
      const ex  = hcx + side * hr * 0.60
      const ey  = hcy - hr * 0.65
      ctx.beginPath()
      ctx.moveTo(ex - side * base * 0.35, ey + base * 0.5)
      ctx.lineTo(ex + side * base * 0.10, ey - (twitch ? base * 1.7 : base * 1.4))
      ctx.lineTo(ex + side * base * 0.55, ey + base * 0.5)
      ctx.closePath()
      ctx.fillStyle = C.body
      ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw; ctx.stroke()
    }
  } else if (earType === 'leaf') {
    for (const side of [-1, 1]) {
      const lx = hcx + side * hr * 0.68
      const ly = hcy - hr * 0.60
      ctx.save()
      ctx.translate(lx, ly)
      ctx.rotate(side * 0.5)
      leafPath(ctx, 0, 0, hr * 0.24 * meg, hr * 0.55 * meg)
      ctx.fillStyle = C.pat
      ctx.fill()
      ctx.strokeStyle = hsl(C.h2, 50, 38)
      ctx.lineWidth = lw; ctx.stroke()
      // midrib
      ctx.beginPath(); ctx.moveTo(0, hr * 0.48 * meg); ctx.lineTo(0, -hr * 0.48 * meg)
      ctx.strokeStyle = hsl(C.h2, 45, 40, 0.5); ctx.lineWidth = lw * 0.5; ctx.stroke()
      ctx.restore()
    }
  }
}

function drawHead(ctx, G, C, dna, sc) {
  const lw = (dna.beautyProfile?.outlineWeight || 2.0) * sc
  gradEll(ctx, G.hcx, G.hcy, G.hr, G.hr, C.bodyL, C.body, C.outline, lw)
}

function drawHorn(ctx, G, C, dna, sc) {
  const { hornType } = dna
  if (hornType === 'none') return
  const { hcx, hcy, hr } = G
  const lw = Math.max(1, 1.3 * sc)
  const hbx = hcx
  const hby = hcy - hr

  if (hornType === 'stubby') {
    fillCirc(ctx, hbx, hby - hr * 0.14, hr * 0.13, C.pat, C.outline, lw)
  } else if (hornType === 'spiral') {
    // Crescent-style spiral horn
    ctx.save()
    ctx.translate(hbx, hby - hr * 0.08)
    for (let r = hr * 0.38; r > hr * 0.08; r -= hr * 0.10) {
      ctx.beginPath()
      ctx.arc(0, 0, r, Math.PI * 1.1, Math.PI * 2.1)
      ctx.strokeStyle = r > hr * 0.25 ? C.sig : hsl(C.ha, 70, 78)
      ctx.lineWidth = r > hr * 0.25 ? lw * 1.2 : lw * 0.8
      ctx.stroke()
    }
    ctx.restore()
  } else if (hornType === 'star') {
    starPath(ctx, hbx, hby - hr * 0.22, hr * 0.30)
    ctx.fillStyle = C.sig
    ctx.fill()
    ctx.strokeStyle = hsl(C.ha, 70, 48)
    ctx.lineWidth = lw; ctx.stroke()
  } else if (hornType === 'bumps') {
    for (let i = -1; i <= 1; i++) {
      const bx = hbx + i * hr * 0.32
      const by = hby - hr * (0.14 - Math.abs(i) * 0.05)
      const br = hr * (0.14 - Math.abs(i) * 0.03)
      fillCirc(ctx, bx, by, br, C.pat, C.outline, lw * 0.9)
    }
  }
}

function drawEyes(ctx, G, C, dna, sc, blinkAmt = 0) {
  const { eyeType, eyeSize, signatureFeature } = dna
  const { hcx, hcy, hr } = G
  const BASE_R = { small: 6, normal: 8, large: 10 }
  let er = (BASE_R[eyeSize] || 8) * sc
  if (signatureFeature === 'mega-cheeks') er *= 1.0  // unchanged
  const twoColor = signatureFeature === 'two-color-eyes'
  const bigShine = signatureFeature === 'big-shine'
  const sleepy   = signatureFeature === 'sleepy-droop'
  const gloss    = dna.beautyProfile?.eyeGloss || 1

  const EYE_POSITIONS = [
    { side: -1, dx: -hr * 0.31, dy: hr * 0.08 },
    { side:  1, dx:  hr * 0.31, dy: hr * 0.08 },
  ]

  for (const { side, dx, dy } of EYE_POSITIONS) {
    const ex = hcx + dx
    const ey = hcy + dy
    const eyeHue = twoColor ? (side < 0 ? C.h1 : C.h3) : C.h3
    const eyeC   = hsl(eyeHue, 65, 55)
    const eyeCD  = hsl(eyeHue, 72, 30)
    const openEry = sleepy && side < 0 ? er * 0.50 : er
    const bScale  = Math.max(0, 1 - blinkAmt * 1.25)

    // Fully closed — draw as a gentle curved line
    if (bScale < 0.12) {
      ctx.beginPath()
      ctx.moveTo(ex - er * 0.75, ey)
      ctx.quadraticCurveTo(ex, ey + er * 0.10, ex + er * 0.75, ey)
      ctx.strokeStyle = eyeCD
      ctx.lineWidth = Math.max(1, 1.2 * sc)
      ctx.lineCap = 'round'
      ctx.stroke()
      continue
    }

    const ery = openEry * bScale

    if (eyeType === 'crescent') {
      // Happy squint — U-shape, squash on blink
      ctx.save()
      ctx.translate(ex, ey)
      ctx.scale(1, bScale)
      ctx.beginPath()
      ctx.arc(0, 0, er, 0, Math.PI)
      ctx.fillStyle = eyeCD
      ctx.fill()
      ctx.restore()
    } else if (eyeType === 'button') {
      ctx.save()
      ctx.translate(ex, ey)
      ctx.scale(1, bScale)
      ctx.beginPath()
      ctx.arc(0, 0, er * 0.75, 0, Math.PI * 2)
      ctx.fillStyle = eyeCD
      ctx.fill()
      ctx.restore()
    } else {
      // Base eye fill
      const eG = ctx.createRadialGradient(ex - er * 0.2, ey - er * 0.2, er * 0.05, ex, ey, er * 1.1)
      eG.addColorStop(0, eyeC)
      eG.addColorStop(1, eyeCD)
      ctx.beginPath()
      if (eyeType === 'wide') {
        ctx.ellipse(ex, ey, er * 1.25, ery, 0, 0, Math.PI * 2)
      } else {
        ctx.ellipse(ex, ey, er, ery, 0, 0, Math.PI * 2)
      }
      ctx.fillStyle = eG
      ctx.fill()

      // Sparkle highlight (4-point star)
      if (eyeType === 'sparkle') {
        const sr2 = er * 0.35
        starPath(ctx, ex - er * 0.18, ey - er * 0.18, sr2, 4)
        ctx.fillStyle = C.white
        ctx.fill()
      }

      // Gloss highlights — skip when nearly closed
      if (bScale > 0.45) {
        if (eyeType === 'dewy' || gloss >= 2) {
          fillCirc(ctx, ex - er * 0.28, ey - er * 0.28, er * (bigShine ? 0.42 : 0.28), C.white)
          fillCirc(ctx, ex + er * 0.20, ey + er * 0.20, er * 0.14, 'rgba(255,255,255,0.65)')
        } else {
          fillCirc(ctx, ex - er * 0.26, ey - er * 0.28, er * (bigShine ? 0.38 : 0.24), C.white)
        }
      }
    }
  }
}

function drawSleepZ(ctx, G, C, particles, sc) {
  if (!particles || !particles.length) return
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const p of particles) {
    ctx.globalAlpha = p.alpha
    ctx.font = `bold ${(8 + p.size * 8) * sc}px serif`
    ctx.fillStyle = hsl(C.ha, 65, 72)
    ctx.fillText('z', G.hcx + p.x * G.hr, G.hcy - p.y * G.hr)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawNose(ctx, G, C, sc) {
  const { hcx, hcy, hr } = G
  fillCirc(ctx, hcx, hcy + hr * 0.28, hr * 0.07 * sc / sc, hsl(C.h1, 55, 42, 0.6))
}

function drawMouth(ctx, G, C, dna, sc) {
  const { mouthType } = dna
  const { hcx, hcy, hr } = G
  const lw = Math.max(1.5, 1.8 * sc)
  const my = hcy + hr * 0.40
  ctx.lineWidth = lw
  ctx.lineCap = 'round'

  if (mouthType === 'smile' || mouthType === 'grin') {
    const w = mouthType === 'grin' ? hr * 0.40 : hr * 0.30
    ctx.beginPath()
    ctx.moveTo(hcx - w, my - hr * 0.04)
    ctx.quadraticCurveTo(hcx, my + hr * (mouthType === 'grin' ? 0.22 : 0.18), hcx + w, my - hr * 0.04)
    ctx.strokeStyle = hsl(C.h1, 55, 32)
    ctx.stroke()
    // Dimples for grin
    if (mouthType === 'grin') {
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(hcx + side * w * 0.82, my + hr * 0.04, hr * 0.04, 0, Math.PI * 2)
        ctx.fillStyle = hsl(C.h1, 50, 55, 0.5)
        ctx.fill()
      }
    }
  } else if (mouthType === 'open-happy') {
    ctx.beginPath()
    ctx.moveTo(hcx - hr * 0.28, my - hr * 0.04)
    ctx.quadraticCurveTo(hcx, my + hr * 0.20, hcx + hr * 0.28, my - hr * 0.04)
    ctx.strokeStyle = hsl(C.h1, 55, 32)
    ctx.stroke()
    // Open interior
    ctx.beginPath()
    ctx.ellipse(hcx, my + hr * 0.10, hr * 0.16, hr * 0.10, 0, 0, Math.PI * 2)
    ctx.fillStyle = hsl(0, 70, 50, 0.70)
    ctx.fill()
  } else { // tiny
    ctx.beginPath()
    ctx.moveTo(hcx - hr * 0.14, my)
    ctx.quadraticCurveTo(hcx, my + hr * 0.10, hcx + hr * 0.14, my)
    ctx.strokeStyle = hsl(C.h1, 55, 35)
    ctx.stroke()
  }
}

function drawCheeks(ctx, G, C, dna, sc) {
  const { cheekSize, signatureFeature, blushType } = dna
  const { hcx, hcy, hr } = G
  const bp   = dna.beautyProfile?.cheekGlow || 0.5
  const meg  = signatureFeature === 'mega-cheeks' ? 1.8 : 1.0
  const BASE = { dot: 0.18, normal: 0.22, puffy: 0.28, huge: 0.36 }
  const cr   = hr * (BASE[cheekSize] || 0.22) * meg

  for (const side of [-1, 1]) {
    const cx = hcx + side * hr * (cheekSize === 'huge' ? 0.64 : 0.60)
    const cy = hcy + hr * 0.26

    if (blushType === 'heart') {
      heartPath(ctx, cx, cy - cr * 0.4, cr * 0.45)
      ctx.fillStyle = hsl(C.h1, 68, 75, bp * 0.85)
      ctx.fill()
    } else if (blushType === 'star') {
      starPath(ctx, cx, cy, cr * 0.55)
      ctx.fillStyle = hsl(C.h1, 68, 76, bp * 0.80)
      ctx.fill()
    } else {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
      g.addColorStop(0,   hsl(C.h1, 68, 74, bp * 0.90))
      g.addColorStop(0.5, hsl(C.h1, 62, 78, bp * 0.55))
      g.addColorStop(1,   hsl(C.h1, 58, 82, 0))
      ctx.beginPath()
      ctx.arc(cx, cy, cr, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
    }
  }
}

function drawTail(ctx, G, C, dna, sc) {
  const { tailType, signatureFeature } = dna
  if (tailType === 'none') return
  const { bcx, bcy, brx, bry } = G
  const lw  = Math.max(1, 1.3 * sc)
  const meg = signatureFeature === 'mega-tail' ? 1.8 : 1.0
  const twin = signatureFeature === 'twin-tails'
  const curly = signatureFeature === 'curly-tail'
  const offsets = twin ? [[-0.3, 0], [0.3, 0]] : [[0, 0]]

  for (const [odx, ody] of offsets) {
    const tx0 = bcx + odx * brx
    const ty0 = bcy + ody * bry

    if (tailType === 'fluffy-pom') {
      const pr = brx * 0.38 * meg
      const px = tx0 + brx * 0.70
      const py = ty0 + bry * 0.50
      const g  = ctx.createRadialGradient(px - pr * 0.2, py - pr * 0.2, pr * 0.05, px, py, pr * 1.2)
      g.addColorStop(0, C.bodyL); g.addColorStop(1, C.body)
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fillStyle = g; ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw; ctx.stroke()
    } else if (tailType === 'star-tipped') {
      // Slim tail curving up-right then star tip
      ctx.save()
      ctx.translate(tx0 + brx * 0.70, ty0 + bry * 0.30)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(brx * 0.5 * meg, -bry * 0.3, brx * 0.8 * meg, -bry * 0.8, brx * 0.4 * meg, -bry * 1.3 * meg)
      ctx.strokeStyle = C.body; ctx.lineWidth = lw * 1.6; ctx.stroke()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw * 0.6; ctx.stroke()
      // Star
      starPath(ctx, brx * 0.4 * meg, -bry * 1.3 * meg, brx * 0.18 * meg)
      ctx.fillStyle = C.sig; ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw * 0.7; ctx.stroke()
      ctx.restore()
    } else if (tailType === 'wiggly' || (tailType !== 'none' && curly)) {
      ctx.save()
      ctx.translate(tx0 + brx * 0.65, ty0 + bry * 0.40)
      ctx.beginPath()
      if (curly) {
        ctx.arc(brx * 0.4 * meg, 0, brx * 0.4 * meg, Math.PI, Math.PI * 3.2)
      } else {
        ctx.moveTo(0, 0)
        ctx.bezierCurveTo(brx * 0.5 * meg, bry * 0.4, brx * 0.9 * meg, -bry * 0.3, brx * 0.7 * meg, -bry * 0.9 * meg)
      }
      ctx.strokeStyle = C.body; ctx.lineWidth = lw * 2.0; ctx.stroke()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw * 0.8; ctx.stroke()
      ctx.restore()
    } else if (tailType === 'long-swish') {
      ctx.save()
      ctx.translate(tx0 + brx * 0.75, ty0 + bry * 0.35)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(brx * 0.6 * meg, bry * 0.6, brx * 1.1 * meg, -bry * 0.4, brx * 0.9 * meg, -bry * 1.5 * meg)
      ctx.strokeStyle = C.body; ctx.lineWidth = lw * 1.8; ctx.stroke()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw * 0.7; ctx.stroke()
      ctx.restore()
    } else if (tailType === 'leaf-tipped') {
      ctx.save()
      ctx.translate(tx0 + brx * 0.72, ty0 + bry * 0.30)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(brx * 0.55 * meg, -bry * 0.6, brx * 0.4 * meg, -bry * 1.1 * meg)
      ctx.strokeStyle = C.body; ctx.lineWidth = lw * 1.5; ctx.stroke()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw * 0.6; ctx.stroke()
      leafPath(ctx, brx * 0.4 * meg, -bry * 1.2 * meg, brx * 0.15, bry * 0.28)
      ctx.fillStyle = C.pat; ctx.fill()
      ctx.strokeStyle = C.outline; ctx.lineWidth = lw * 0.7; ctx.stroke()
      ctx.restore()
    }
  }
}

function drawAccessory(ctx, G, C, dna, sc) {
  const { accessory, signatureFeature } = dna
  if (accessory === 'none') return
  const { hcx, hcy, hr, bcx, bcy } = G
  const lw   = Math.max(1, 1.2 * sc)
  const bigB = signatureFeature === 'large-bow' ? 2.0 : 1.0

  if (accessory === 'bow') {
    const bsz = hr * 0.26 * bigB
    const bx  = hcx + hr * 0.65
    const by  = hcy - hr * 0.80
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(bx + side * bsz * 0.55, by)
      ctx.scale(side, 1)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(-bsz * 0.8, -bsz * 0.7, -bsz * 1.4, 0.0, -bsz * 0.8, bsz * 0.7)
      ctx.bezierCurveTo(-bsz * 0.3, bsz * 1.0, 0, bsz * 0.3, 0, 0)
      ctx.fillStyle = hsl(C.ha, 75, 62, 0.90)
      ctx.fill()
      ctx.strokeStyle = hsl(C.ha, 65, 42); ctx.lineWidth = lw; ctx.stroke()
      ctx.restore()
    }
    fillCirc(ctx, bx, by, bsz * 0.22, hsl(C.ha, 75, 72), hsl(C.ha, 65, 42), lw)
  } else if (accessory === 'flower-crown') {
    const count = 5
    const cr = hr * 0.12
    for (let i = 0; i < count; i++) {
      const a  = Math.PI * (0.85 + i * 0.30 / count * Math.PI) - Math.PI * 1.7
      const fx = hcx + Math.cos(a) * hr * 0.92
      const fy = hcy + Math.sin(a) * hr * 0.92 - hr * 0.1
      // Petals
      for (let p = 0; p < 5; p++) {
        const pa = p * Math.PI * 2 / 5
        fillCirc(ctx, fx + Math.cos(pa) * cr * 1.1, fy + Math.sin(pa) * cr * 1.1, cr * 0.75,
          hsl(C.ha + 30, 75, 70, 0.85))
      }
      fillCirc(ctx, fx, fy, cr * 0.7, hsl(C.h3, 80, 72), hsl(C.h3, 65, 40), lw * 0.6)
    }
  } else if (accessory === 'heart-mark') {
    heartPath(ctx, hcx + hr * 0.38, hcy - hr * 0.50, hr * 0.12)
    ctx.fillStyle = hsl(C.ha, 80, 68, 0.85)
    ctx.fill()
  } else if (accessory === 'glasses') {
    const gx  = hcx
    const gy  = hcy + hr * 0.06
    const gr  = hr * 0.22
    const gap = gr * 1.8
    ctx.strokeStyle = hsl(C.h3, 55, 35)
    ctx.lineWidth   = lw * 0.9
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(gx + side * gap * 0.5, gy, gr, 0, Math.PI * 2)
      ctx.stroke()
    }
    // bridge
    ctx.beginPath()
    ctx.moveTo(gx - gap * 0.5 + gr * 0.75, gy)
    ctx.lineTo(gx + gap * 0.5 - gr * 0.75, gy)
    ctx.stroke()
  } else if (accessory === 'scarf') {
    const sy = bcy - G.bry * 0.85
    ctx.beginPath()
    ctx.ellipse(bcx, sy, G.brx * 1.12, G.bry * 0.24, 0, 0, Math.PI * 2)
    ctx.fillStyle = hsl(C.h2, 65, 58, 0.88)
    ctx.fill()
    ctx.strokeStyle = hsl(C.h2, 60, 38); ctx.lineWidth = lw; ctx.stroke()
    // Knot/loop on side
    ctx.beginPath()
    ctx.ellipse(bcx + G.brx * 0.88, sy + G.bry * 0.18, G.brx * 0.18, G.bry * 0.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = hsl(C.h2, 70, 62, 0.90); ctx.fill()
  } else if (accessory === 'tiny-hat') {
    const hx = hcx
    const hy = hcy - hr * 0.98
    // Brim
    ctx.beginPath()
    ctx.ellipse(hx, hy, hr * 0.55, hr * 0.12, 0, 0, Math.PI * 2)
    ctx.fillStyle = hsl(C.h2, 60, 40, 0.88); ctx.fill()
    ctx.strokeStyle = hsl(C.h2, 55, 28); ctx.lineWidth = lw; ctx.stroke()
    // Crown
    ctx.beginPath()
    ctx.rect(hx - hr * 0.32, hy - hr * 0.50, hr * 0.64, hr * 0.52)
    ctx.fillStyle = hsl(C.h2, 60, 42, 0.88); ctx.fill()
    ctx.strokeStyle = hsl(C.h2, 55, 28); ctx.lineWidth = lw; ctx.stroke()
    // Hat band stripe
    ctx.beginPath()
    ctx.rect(hx - hr * 0.32, hy - hr * 0.20, hr * 0.64, hr * 0.10)
    ctx.fillStyle = hsl(C.ha, 75, 65, 0.80); ctx.fill()
  } else if (accessory === 'bandana') {
    const bx = hcx
    const by = hcy + hr * 0.58
    ctx.beginPath()
    ctx.moveTo(bx - hr * 0.42, by)
    ctx.lineTo(bx, by + hr * 0.28)
    ctx.lineTo(bx + hr * 0.42, by)
    ctx.quadraticCurveTo(bx, by - hr * 0.15, bx - hr * 0.42, by)
    ctx.fillStyle = hsl(C.h2, 65, 55, 0.85)
    ctx.fill()
    ctx.strokeStyle = hsl(C.h2, 60, 35); ctx.lineWidth = lw; ctx.stroke()
  }
}

function drawSignatureOverlay(ctx, G, C, dna, sc) {
  const { signatureFeature } = dna
  if (!signatureFeature) return
  const { hcx, hcy, hr, bcx, bcy, brx, bry } = G
  const lw = Math.max(1, 1.2 * sc)

  if (signatureFeature === 'moon-mark') {
    // Crescent above brow
    const mx = hcx, my = hcy - hr * 0.50
    ctx.save()
    ctx.beginPath()
    ctx.arc(mx, my, hr * 0.16, 0, Math.PI * 2)
    ctx.fillStyle = C.sig
    ctx.globalCompositeOperation = 'source-over'
    ctx.fill()
    // Inner "bite" to make crescent
    ctx.beginPath()
    ctx.arc(mx + hr * 0.08, my - hr * 0.04, hr * 0.11, 0, Math.PI * 2)
    ctx.fillStyle = C.body
    ctx.fill()
    ctx.restore()
  } else if (signatureFeature === 'star-freckle') {
    // Small 3-point star cluster near one cheek
    for (const side of [-1, 1]) {
      const fx = hcx + side * hr * 0.48
      const fy = hcy + hr * 0.20
      for (let i = 0; i < 3; i++) {
        const a  = i * Math.PI * 2 / 3
        const sx = fx + Math.cos(a) * hr * 0.12
        const sy = fy + Math.sin(a) * hr * 0.12
        starPath(ctx, sx, sy, hr * 0.06, 4)
        ctx.fillStyle = C.sig
        ctx.fill()
      }
    }
  } else if (signatureFeature === 'body-glow-spot') {
    // Glowing circle on chest
    const sx = bcx, sy = bcy - bry * 0.15
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, brx * 0.28)
    g.addColorStop(0, hsl(C.ha, 90, 80, 0.90))
    g.addColorStop(0.5, hsl(C.ha, 80, 75, 0.50))
    g.addColorStop(1, hsl(C.ha, 70, 78, 0))
    ctx.beginPath()
    ctx.arc(sx, sy, brx * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = g; ctx.fill()
  } else if (signatureFeature === 'stripe-face') {
    // Horizontal stripe in h2 across the face
    const sy  = hcy + hr * 0.08
    const sw  = hr * 0.80
    const sh  = hr * 0.12
    ctx.save()
    ctx.beginPath()
    ctx.arc(hcx, hcy, hr * 0.97, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = hsl(C.h2, 60, 60, 0.45)
    ctx.fillRect(hcx - sw, sy - sh / 2, sw * 2, sh)
    ctx.restore()
  } else if (signatureFeature === 'big-shine') {
    // Already handled in drawEyes; add a second sparkle ring
    ctx.beginPath()
    ctx.arc(hcx, hcy + hr * 0.08, hr * 0.60, -Math.PI * 0.2, Math.PI * 0.05)
    ctx.strokeStyle = hsl(C.ha, 80, 80, 0.35)
    ctx.lineWidth = lw * 0.8
    ctx.stroke()
  }
  // mega-cheeks, tiny-body, extra-round, two-color-eyes, heart-cheek, star-freckle (face),
  // sleepy-droop, mega-ears, mega-tail, twin-tails, curly-tail, large-bow:
  // all handled in their respective draw functions.
}

function drawBirthMark(ctx, G, C, dna, sc) {
  const { hcx, hcy, hr } = G
  const lw = Math.max(0.8, 1.0 * sc)
  // Thin curved line near one eye — like a crack line in the egg color
  ctx.beginPath()
  ctx.moveTo(hcx - hr * 0.08, hcy + hr * 0.08)
  ctx.quadraticCurveTo(hcx - hr * 0.18, hcy + hr * 0.22, hcx - hr * 0.10, hcy + hr * 0.32)
  ctx.strokeStyle = hsl(C.ha, 80, 60, 0.70)
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.stroke()
}

// ── Main export ───────────────────────────────────────────────────────────────

export function drawCreature(canvas, dna, anim = {}) {
  if (!canvas || !dna) return
  const ctx = canvas.getContext('2d')
  const S   = canvas.width
  ctx.clearRect(0, 0, S, S)

  const sc = S / 120
  const C  = buildColors(dna)
  const G  = buildGeometry(dna, sc)
  const { blinkAmt = 0, sleepParticles = null } = anim

  // Painter's algorithm — back to front
  drawAura(ctx, G, C, dna, sc)
  drawWings(ctx, G, C, dna, sc)
  drawBody(ctx, G, C, dna, sc)
  drawBellyPatch(ctx, G, C, dna, sc)
  drawPattern(ctx, G, C, dna, sc)
  drawEars(ctx, G, C, dna, sc)           // before head so head overlaps base
  drawHead(ctx, G, C, dna, sc)
  drawHorn(ctx, G, C, dna, sc)
  drawEyes(ctx, G, C, dna, sc, blinkAmt)
  drawNose(ctx, G, C, sc)
  drawMouth(ctx, G, C, dna, sc)
  drawCheeks(ctx, G, C, dna, sc)
  if (dna.accessory && dna.accessory !== 'none') drawAccessory(ctx, G, C, dna, sc)
  drawTail(ctx, G, C, dna, sc)
  drawSignatureOverlay(ctx, G, C, dna, sc)
  if (dna.birthMark) drawBirthMark(ctx, G, C, dna, sc)
  if (sleepParticles) drawSleepZ(ctx, G, C, sleepParticles, sc)
}
