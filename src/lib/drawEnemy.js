// Enemy sprite renderer — pixel art style (48×48 grid, scaled to `size` px)
// x,y: offset on shared canvas (world mode). Default 0,0: dedicated battle canvas.

function px(ctx, gx, gy, gw, gh, size, color) {
  const s = size / 48
  ctx.fillStyle = color
  ctx.fillRect(
    Math.round(gx * s), Math.round(gy * s),
    Math.round(gw * s), Math.round(gh * s)
  )
}

export function drawEnemy(ctx, type, size, x = 0, y = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.imageSmoothingEnabled = false
  if (x === 0 && y === 0) ctx.clearRect(0, 0, size, size)
  const fn = DRAW_FNS[type] || _bunny
  fn(ctx, size)
  ctx.restore()
}

const DRAW_FNS = {
  bunny: _bunny, sleepy_bunny: _bunny,
  slime: _slime, bouncy_slime: _slime,
  fox: _fox, fox_kit: _fox, tiny_fox: _fox,
  egg_pawn: _eggPawn,
  leaf_sprite: _leafSprite,
  grumpy_mole: _grumpyMole,
  mushroom_imp: _mushroomImp,
  baby_zombie: _babyZombie,
  snake: _snake,
  ghost_wisp: _ghostWisp,
}

// ── SLEEPY BUNNY ──────────────────────────────────────────────────────────────

function _bunny(ctx, size) {
  // Floppy ears (drooped to sides)
  px(ctx,  8,  6,  7, 14, size, '#e8d8d0')
  px(ctx,  9,  7,  5, 12, size, '#ffb0b0')
  px(ctx, 33,  8,  7, 12, size, '#e8d8d0')
  px(ctx, 34,  9,  5, 10, size, '#ffb0b0')
  // Head
  px(ctx, 14, 12, 20, 16, size, '#f0ece8')
  px(ctx, 12, 14, 24, 12, size, '#f0ece8')
  // Body
  px(ctx, 14, 26, 20, 16, size, '#f0ece8')
  px(ctx, 12, 28, 24, 14, size, '#f0ece8')
  // Cheeks
  px(ctx, 12, 22,  6,  4, size, '#ffb0b0')
  px(ctx, 30, 22,  6,  4, size, '#ffb0b0')
  // Closed eyes (thin horizontal lines)
  px(ctx, 17, 18,  6,  2, size, '#666666')
  px(ctx, 25, 18,  6,  2, size, '#666666')
  // Nose
  px(ctx, 22, 23,  4,  3, size, '#c09090')
  // ZZZ accent rects above head
  px(ctx, 30,  2,  6,  4, size, '#aaaaff')
  px(ctx, 35,  6,  5,  3, size, '#aaaaff')
}

// ── BOUNCY SLIME ──────────────────────────────────────────────────────────────

function _slime(ctx, size) {
  // Body (stacked rects for blobby silhouette)
  px(ctx, 16, 12, 16,  4, size, '#5acd5a')
  px(ctx, 10, 14, 28,  6, size, '#5acd5a')
  px(ctx,  8, 18, 32, 12, size, '#5acd5a')
  px(ctx, 10, 28, 28,  8, size, '#5acd5a')
  px(ctx, 14, 34, 20,  4, size, '#4ab44a')
  px(ctx, 18, 36, 12,  4, size, '#3a9a3a')
  // Highlight patch
  px(ctx, 14, 16,  8,  4, size, '#8aff8a')
  // Eyes — white sclera
  px(ctx, 11, 20, 10,  8, size, '#ffffff')
  px(ctx, 27, 20, 10,  8, size, '#ffffff')
  // Pupils
  px(ctx, 13, 22,  6,  6, size, '#1a1a2a')
  px(ctx, 29, 22,  6,  6, size, '#1a1a2a')
  // Shine
  px(ctx, 13, 22,  2,  2, size, '#ffffff')
  px(ctx, 29, 22,  2,  2, size, '#ffffff')
  // Smile (3 rects for blocky curve)
  px(ctx, 14, 30,  2,  2, size, '#2a7a2a')
  px(ctx, 16, 32, 16,  2, size, '#2a7a2a')
  px(ctx, 32, 30,  2,  2, size, '#2a7a2a')
  // Tiny flower-pot hat
  px(ctx, 19,  6, 10,  4, size, '#a05020')
  px(ctx, 17,  8, 14,  3, size, '#c06030')
  px(ctx, 20,  2,  8,  6, size, '#5acd5a')
}

// ── FOX KIT ───────────────────────────────────────────────────────────────────

function _fox(ctx, size) {
  // Tail (behind body, left side)
  px(ctx,  2, 22, 14, 18, size, '#e87030')
  px(ctx,  2, 18, 10, 14, size, '#e87030')
  px(ctx,  2, 18,  8,  8, size, '#f8f8f8')
  // Body
  px(ctx, 14, 24, 20, 18, size, '#e87030')
  px(ctx, 12, 26, 24, 16, size, '#e87030')
  // Belly
  px(ctx, 17, 27, 14, 12, size, '#f0c080')
  // Ears (pointy pixel triangles via stacked rects)
  px(ctx, 12,  2,  8, 12, size, '#e87030')
  px(ctx, 28,  2,  8, 12, size, '#e87030')
  px(ctx, 13,  3,  6, 10, size, '#ffb0a0')
  px(ctx, 29,  3,  6, 10, size, '#ffb0a0')
  px(ctx, 14,  2,  4,  8, size, '#e87030')
  px(ctx, 30,  2,  4,  8, size, '#e87030')
  // Head
  px(ctx, 14, 12, 20, 14, size, '#e87030')
  px(ctx, 12, 14, 24, 12, size, '#e87030')
  // Face belly patch
  px(ctx, 17, 18, 14,  8, size, '#f0c080')
  // Eyes
  px(ctx, 16, 14,  4,  4, size, '#333333')
  px(ctx, 28, 14,  4,  4, size, '#333333')
  px(ctx, 16, 14,  2,  2, size, '#ffffff')
  px(ctx, 28, 14,  2,  2, size, '#ffffff')
  // Nose
  px(ctx, 21, 22,  6,  4, size, '#553030')
  // Blue scarf
  px(ctx, 14, 28, 20,  4, size, '#4488cc')
  px(ctx, 14, 28, 20,  2, size, '#6699dd')
}

// ── EGG PAWN ──────────────────────────────────────────────────────────────────

function _eggPawn(ctx, size) {
  // Stubby arms
  px(ctx,  4, 24,  8,  8, size, '#cc2020')
  px(ctx, 36, 24,  8,  8, size, '#cc2020')
  // Body
  px(ctx, 12, 18, 24, 22, size, '#cc2020')
  px(ctx, 10, 22, 28, 18, size, '#cc2020')
  // Chest plate
  px(ctx, 16, 22, 16, 14, size, '#f0f0f0')
  // Yellow buttons
  px(ctx, 18, 25,  5,  5, size, '#ffcc00')
  px(ctx, 25, 25,  5,  5, size, '#ffcc00')
  px(ctx, 18, 32,  5,  5, size, '#ffcc00')
  px(ctx, 25, 32,  5,  5, size, '#ffcc00')
  // Head dome
  px(ctx, 16,  4, 16, 12, size, '#cc2020')
  px(ctx, 14,  6, 20, 12, size, '#cc2020')
  // Visor
  px(ctx, 14, 10, 20,  6, size, '#4444cc')
  px(ctx, 16, 11, 16,  4, size, '#6666ff')
  px(ctx, 16, 11,  8,  2, size, '#9999ff')
  // Antennae orbs
  px(ctx, 17,  2,  5,  5, size, '#ffcc00')
  px(ctx, 26,  2,  5,  5, size, '#ffcc00')
  // Antenna stems
  px(ctx, 19,  5,  3,  5, size, '#cc2020')
  px(ctx, 26,  5,  3,  5, size, '#cc2020')
  // Legs
  px(ctx, 16, 40,  6,  6, size, '#881818')
  px(ctx, 26, 40,  6,  6, size, '#881818')
}

// ── LEAF SPRITE ───────────────────────────────────────────────────────────────

function _leafSprite(ctx, size) {
  // Central leaf body
  px(ctx, 18, 14, 12, 28, size, '#4aaa4a')
  px(ctx, 16, 16, 16, 24, size, '#4aaa4a')
  px(ctx, 14, 20, 20, 18, size, '#4aaa4a')
  // Side arm leaves
  px(ctx,  6, 20, 10,  6, size, '#3a9a3a')
  px(ctx, 32, 18, 10,  6, size, '#5aaa3a')
  // Leaf veins
  px(ctx, 22, 16,  4, 24, size, '#2a8a2a')
  px(ctx, 14, 26,  8,  2, size, '#2a8a2a')
  px(ctx, 26, 24,  8,  2, size, '#2a8a2a')
  // Head
  px(ctx, 18, 10, 12, 10, size, '#5ac05a')
  // Eyes
  px(ctx, 20, 13,  4,  4, size, '#ffffff')
  px(ctx, 26, 13,  4,  4, size, '#ffffff')
  px(ctx, 21, 14,  2,  2, size, '#1a3a1a')
  px(ctx, 27, 14,  2,  2, size, '#1a3a1a')
}

// ── GRUMPY MOLE ───────────────────────────────────────────────────────────────

function _grumpyMole(ctx, size) {
  // Shovel handle (behind, right side)
  px(ctx, 34,  6,  4, 28, size, '#7a5020')
  px(ctx, 30, 32, 12,  6, size, '#909090')
  px(ctx, 32, 30,  8,  4, size, '#aaaaaa')
  // Body
  px(ctx, 10, 22, 26, 20, size, '#8a6030')
  px(ctx,  8, 26, 28, 16, size, '#8a6030')
  // Belly fur
  px(ctx, 14, 26, 16, 12, size, '#c09060')
  // Head
  px(ctx, 10, 10, 26, 14, size, '#8a6030')
  px(ctx,  8, 12, 28, 12, size, '#8a6030')
  // Snout
  px(ctx, 14, 18, 18,  8, size, '#c09060')
  px(ctx, 16, 16, 14,  6, size, '#c09060')
  // Nostrils
  px(ctx, 17, 20,  5,  4, size, '#7a4020')
  px(ctx, 24, 20,  5,  4, size, '#7a4020')
  // Glasses frames (square)
  px(ctx,  9, 11, 14, 11, size, '#333333')
  px(ctx, 25, 11, 14, 11, size, '#333333')
  // Lenses
  px(ctx, 10, 12, 12,  9, size, '#aaddff')
  px(ctx, 26, 12, 12,  9, size, '#aaddff')
  // Lens shine
  px(ctx, 10, 12,  4,  3, size, '#ffffff')
  px(ctx, 26, 12,  4,  3, size, '#ffffff')
  // Bridge
  px(ctx, 23, 14,  2,  4, size, '#333333')
  // Frown (3 rects)
  px(ctx, 15, 26,  3,  3, size, '#5a3010')
  px(ctx, 18, 28, 10,  2, size, '#5a3010')
  px(ctx, 28, 26,  3,  3, size, '#5a3010')
  // Claws
  px(ctx,  8, 32,  3,  5, size, '#5a3010')
  px(ctx, 12, 32,  3,  5, size, '#5a3010')
}

// ── BABY ZOMBIE ───────────────────────────────────────────────────────────────
// 24-unit grid — designed small so it renders at correct tiny scale

function _babyZombie(ctx, size) {
  const s = size / 24
  const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round(x*s),Math.round(y*s),Math.round(w*s),Math.round(h*s)) }

  // Body (tiny, ragged shirt — green-grey)
  p(7,  10, 10, 8, '#7a9a6a')
  p(6,  11, 11, 6, '#7a9a6a')
  p(8,  10,  2, 2, '#5a7a4a')  // shirt tear
  p(14, 10,  2, 2, '#5a7a4a')  // shirt tear

  // Head (slightly too big for body)
  p(6,  3, 12, 9, '#9ab88a')
  p(5,  4, 14, 7, '#9ab88a')

  // Hair (patchy)
  p(6,  3,  3, 2, '#3a2a1a')
  p(12, 3,  4, 2, '#3a2a1a')

  // Eyes (X marks — dead eyes)
  p(7,  6, 1, 1, '#cc2020'); p(9,  6, 1, 1, '#cc2020')  // left X
  p(8,  7, 1, 1, '#cc2020')
  p(13, 6, 1, 1, '#cc2020'); p(15, 6, 1, 1, '#cc2020')  // right X
  p(14, 7, 1, 1, '#cc2020')

  // Mouth (open, jagged)
  p(9,  9, 6, 1, '#1a0a0a')
  p(10, 9, 1, 2, '#ffffff')   // tooth
  p(13, 9, 1, 2, '#ffffff')   // tooth

  // Arms reaching forward (outstretched)
  p(2,  12, 5, 2, '#9ab88a')  // left arm
  p(17, 12, 5, 2, '#9ab88a')  // right arm
  p(0,  11, 3, 2, '#9ab88a')  // left hand
  p(19, 11, 3, 2, '#9ab88a')  // right hand

  // Legs (stubby, uneven)
  p(8,  18, 3, 4, '#4a5a3a')  // left leg
  p(13, 18, 3, 4, '#4a5a3a')  // right leg
  p(7,  21, 4, 2, '#3a2a1a')  // left shoe
  p(13, 21, 4, 2, '#3a2a1a')  // right shoe
}

// ── SNAKE ─────────────────────────────────────────────────────────────────────

function _snake(ctx, size) {
  const s = size / 48
  const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round(x*s),Math.round(y*s),Math.round(w*s),Math.round(h*s)) }

  // Tail
  p(8,  36,  4,  4, '#2a8a2a')
  // Segment 3
  p(10, 28,  8,  6, '#2a8a2a')
  p(9,  30, 10,  4, '#2a8a2a')
  // Segment 2
  p(22, 22,  8,  6, '#2a8a2a')
  p(21, 24, 10,  4, '#2a8a2a')
  // Segment 1
  p(18, 14,  8,  6, '#2a8a2a')
  p(17, 16, 10,  4, '#2a8a2a')
  // Scale pattern (darker diamonds)
  p(12, 29,  2,  2, '#1a6a1a')
  p(24, 23,  2,  2, '#1a6a1a')
  p(20, 15,  2,  2, '#1a6a1a')
  // Belly stripe
  p(11, 31,  6,  2, '#4aaa4a')
  p(23, 25,  6,  2, '#4aaa4a')

  // Head (triangular/flat)
  p(16,  6, 12,  8, '#2a8a2a')
  p(14,  7, 16,  6, '#2a8a2a')
  p(13,  8,  4,  4, '#2a8a2a')  // jaw left
  p(27,  8,  4,  4, '#2a8a2a')  // jaw right

  // Eyes (slit pupils)
  p(17,  8,  4,  3, '#ffcc00')  // left eye yellow
  p(25,  8,  4,  3, '#ffcc00')  // right eye yellow
  p(18,  8,  2,  3, '#1a1a1a')  // left slit
  p(26,  8,  2,  3, '#1a1a1a')  // right slit

  // Forked tongue
  p(21,  5,  2,  3, '#cc2020')  // tongue base
  p(19,  3,  2,  2, '#cc2020')  // fork left
  p(23,  3,  2,  2, '#cc2020')  // fork right
}

// ── GHOST WISP ────────────────────────────────────────────────────────────────

function _ghostWisp(ctx, size) {
  const s = size / 48
  const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round(x*s),Math.round(y*s),Math.round(w*s),Math.round(h*s)) }

  // Outer glow halo (very transparent, large)
  ctx.save()
  ctx.globalAlpha = 0.25
  p(6, 4, 36, 36, '#b090ff')
  ctx.restore()

  // Wispy trailing tail (3 fading blob segments below the body)
  ctx.save()
  ctx.globalAlpha = 0.35
  p(16, 34, 16, 6, '#c8a8ff')
  ctx.globalAlpha = 0.22
  p(18, 39, 12, 5, '#c8a8ff')
  ctx.globalAlpha = 0.12
  p(20, 43, 8, 4, '#c8a8ff')
  ctx.restore()

  // Main body (rounded blob, semi-transparent)
  ctx.save()
  ctx.globalAlpha = 0.75
  p(14, 10, 20, 22, '#d8c0ff')
  p(12, 14, 24, 18, '#d8c0ff')
  ctx.restore()

  // Bright core
  ctx.save()
  ctx.globalAlpha = 0.9
  p(17, 14, 14, 14, '#f0e8ff')
  ctx.restore()

  // Eyes — simple glowing dots, no pupils (ghostly)
  ctx.save()
  ctx.globalAlpha = 0.95
  p(19, 19, 4, 4, '#6a3acc')
  p(27, 19, 4, 4, '#6a3acc')
  ctx.restore()

  // Tiny mouth
  ctx.globalAlpha = 0.7
  p(22, 26, 6, 2, '#6a3acc')
  ctx.globalAlpha = 1
}

// ── EYE POSITIONS (48-grid coords) — used by drawEnemyHurt ───────────────────

const EYE_POSITIONS = {
  bunny:        { lx: 20, rx: 28, ey: 19, r: 3 },
  sleepy_bunny: { lx: 20, rx: 28, ey: 19, r: 3 },
  slime:        { lx: 16, rx: 32, ey: 24, r: 4 },
  bouncy_slime: { lx: 16, rx: 32, ey: 24, r: 4 },
  fox:          { lx: 18, rx: 30, ey: 16, r: 2 },
  fox_kit:      { lx: 18, rx: 30, ey: 16, r: 2 },
  tiny_fox:     { lx: 18, rx: 30, ey: 16, r: 2 },
  egg_pawn:     { lx: 20, rx: 28, ey: 13, r: 3 },
  leaf_sprite:  { lx: 22, rx: 28, ey: 15, r: 2 },
  grumpy_mole:  { lx: 16, rx: 32, ey: 17, r: 5 },
  mushroom_imp: { lx: 18, rx: 30, ey: 32, r: 4 },
  baby_zombie:  { lx: 16, rx: 28, ey: 13, r: 3 },
  snake:        { lx: 19, rx: 27, ey: 10, r: 2 },
  ghost_wisp:   { lx: 21, rx: 29, ey: 21, r: 3 },
}

function drawHurtEyes(ctx, size, pos) {
  const s = size / 48
  const { lx, rx, ey, r } = pos

  ctx.strokeStyle = '#ff2222'
  ctx.lineWidth = Math.max(2, Math.round(size / 18))
  ctx.lineCap = 'square'

  for (const cx of [lx, rx]) {
    ctx.beginPath()
    ctx.moveTo((cx - r) * s, (ey - r) * s)
    ctx.lineTo((cx + r) * s, (ey + r) * s)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo((cx + r) * s, (ey - r) * s)
    ctx.lineTo((cx - r) * s, (ey + r) * s)
    ctx.stroke()
  }

  // Zigzag mouth
  const mx = (lx + rx) / 2
  const my = ey + r + 4
  const hw = (rx - lx) * 0.4
  ctx.strokeStyle = '#441111'
  ctx.lineWidth = Math.max(1, Math.round(size / 28))
  ctx.beginPath()
  ctx.moveTo((mx - hw) * s, my * s)
  ctx.lineTo((mx - hw * 0.33) * s, (my - 3) * s)
  ctx.lineTo((mx + hw * 0.33) * s, my * s)
  ctx.lineTo((mx + hw) * s, (my - 3) * s)
  ctx.stroke()
}

export function drawEnemyHurt(ctx, type, size, x = 0, y = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.imageSmoothingEnabled = false
  if (x === 0 && y === 0) ctx.clearRect(0, 0, size, size)

  // Slight tilt for hit impact
  const cx = size / 2, cy = size / 2
  ctx.translate(cx, cy)
  ctx.rotate(0.08)
  ctx.translate(-cx, -cy)

  const fn = DRAW_FNS[type] || _bunny
  fn(ctx, size)

  const pos = EYE_POSITIONS[type] || EYE_POSITIONS.bunny
  drawHurtEyes(ctx, size, pos)

  ctx.restore()
}

// ── Pandora-style pseudo-3D enemy sprites (2026-07-02, Stage 4/6) ─────────────
// Fully separate from DRAW_FNS/drawEnemy()/drawEnemyHurt() above — those stay
// byte-for-byte untouched as the original flat renderer's enemies. These are
// rounder/volumetric (ellipses over rects), each with a ground drop-shadow
// and a baked-in upper-left-light/lower-right-shade convention, keyed by the
// same enemy `type` strings so callers can look either set up interchangeably.

function pShadow(ctx, cx, groundY, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(cx, groundY, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
}

// Rounded body with a soft upper-left highlight + lower-right shade baked on
// top of a flat base fill — the shared "volumetric" look every type builds from.
function pBody(ctx, cx, cy, rx, ry, base, light, dark) {
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.fillStyle = light
  ctx.beginPath()
  ctx.ellipse(cx - rx * 0.35, cy - ry * 0.35, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.ellipse(cx + rx * 0.3, cy + ry * 0.35, rx * 0.45, ry * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // Dark outline (2026-07-04) — redraw the body ellipse as a stroke after the
  // fills for the RO-style crisp cartoon edge. Every Pandora enemy is built
  // from this primitive, so this outlines them all (head/body/segments each
  // get their own contour). Fill logic above is unchanged.
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
}

function pSleepyBunny(ctx, cx, groundY, frame) {
  pShadow(ctx, cx, groundY, 22, 6)
  const bodyCy = groundY - 9
  pBody(ctx, cx, bodyCy, 11, 8, '#f5eee8', '#ffffff', '#d8c0c0')
  const headCy = bodyCy - 11
  pBody(ctx, cx, headCy, 8, 7, '#f5eee8', '#ffffff', '#d8c0c0')
  ctx.fillStyle = '#f0d8d8'
  ctx.beginPath(); ctx.ellipse(cx - 4, headCy - 9, 2.5, 7, -0.15, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 4, headCy - 9, 2.5, 7, 0.15, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffb0b8'
  ctx.beginPath(); ctx.ellipse(cx - 4, headCy - 8, 1.2, 4.4, -0.15, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 4, headCy - 8, 1.2, 4.4, 0.15, 0, Math.PI * 2); ctx.fill()
  // Sleeping crescent eyes — curved downward (was flat straight lines), so
  // they read as genuinely closed/content rather than a plain dash.
  ctx.strokeStyle = '#886666'; ctx.lineWidth = 1.3
  ctx.beginPath(); ctx.moveTo(cx - 4.5, headCy); ctx.quadraticCurveTo(cx - 2.5, headCy + 1.6, cx - 0.8, headCy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + 0.8, headCy); ctx.quadraticCurveTo(cx + 2.5, headCy + 1.6, cx + 4.5, headCy); ctx.stroke()
  // Nose
  ctx.fillStyle = '#e0a0a8'
  ctx.beginPath(); ctx.ellipse(cx, headCy + 3, 1.3, 1, 0, 0, Math.PI * 2); ctx.fill()
  // Floating "Zzz" — gentle bob (seeded off frame) so it reads as drifting
  // off to sleep rather than a static label.
  const bob = Math.sin((frame || 0) * 0.06) * 2
  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 8px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Zzz', cx + 9, headCy - 14 + bob)
  ctx.restore()
}

function pBouncySlime(ctx, cx, groundY, frame) {
  pShadow(ctx, cx, groundY, 22, 6)
  const squish = Math.sin((frame || 0) * 0.15) * 0.12
  const rx = 13 * (1 + squish), ry = 11 * (1 - squish)
  const cy = groundY - ry
  ctx.save()
  ctx.globalAlpha = 0.82
  pBody(ctx, cx, cy, rx, ry, '#5acd7a', '#a0ffb0', '#2a8a4a')
  ctx.restore()
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.35, cy - ry * 0.4, 3, 2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1a1a2a'
  ctx.beginPath(); ctx.ellipse(cx - 4, cy, 1.8, 2.2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 4, cy, 1.8, 2.2, 0, 0, Math.PI * 2); ctx.fill()
  // Big happy grin — was missing entirely; gives the slime its "bouncy/
  // friendly" personality at a glance instead of just a blank blob face.
  ctx.strokeStyle = '#1a6a3a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(cx, cy + ry * 0.15, ry * 0.45, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
}

function pFoxKit(ctx, cx, groundY) {
  pShadow(ctx, cx, groundY, 22, 6)
  // Tail
  ctx.save()
  pBody(ctx, cx - 12, groundY - 10, 6, 9, '#e8863a', '#ffb060', '#b8622a')
  ctx.restore()
  const bodyCy = groundY - 9
  pBody(ctx, cx, bodyCy, 11, 8, '#e8863a', '#ffb060', '#b8622a')
  ctx.fillStyle = '#f8e8c8'
  ctx.beginPath(); ctx.ellipse(cx, bodyCy + 2, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill()
  const headCy = bodyCy - 11
  pBody(ctx, cx, headCy, 8, 7, '#e8863a', '#ffb060', '#b8622a')
  ctx.fillStyle = '#e8863a'
  ctx.beginPath(); ctx.moveTo(cx - 6, headCy - 3); ctx.lineTo(cx - 8, headCy - 11); ctx.lineTo(cx - 2, headCy - 5); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx + 6, headCy - 3); ctx.lineTo(cx + 8, headCy - 11); ctx.lineTo(cx + 2, headCy - 5); ctx.closePath(); ctx.fill()
  // White muzzle patch — a distinct pale snout on the face (was only the
  // body's belly patch, no separate muzzle), plus a tiny nose dot.
  ctx.fillStyle = '#fff8ee'
  ctx.beginPath(); ctx.ellipse(cx, headCy + 3, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#553030'
  ctx.beginPath(); ctx.ellipse(cx, headCy + 2.5, 1, 0.8, 0, 0, Math.PI * 2); ctx.fill()
  // Wide alert eyes — white sclera behind the pupil (was pupil-only), reads
  // as more curious/round rather than a small dark dot.
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(cx - 3, headCy - 1, 2.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 3, headCy - 1, 2.2, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath(); ctx.arc(cx - 3, headCy - 1, 1.4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 3, headCy - 1, 1.4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(cx - 3.6, headCy - 1.6, 0.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 2.4, headCy - 1.6, 0.5, 0, Math.PI * 2); ctx.fill()
}

function pGhostWisp(ctx, cx, groundY, frame) {
  const wave = Math.sin((frame || 0) * 0.12) * 2
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#c8a8ff'
  ctx.beginPath(); ctx.ellipse(cx, groundY, 24, 24, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  const cy = groundY - 14
  ctx.save()
  ctx.globalAlpha = 0.7
  pBody(ctx, cx, cy, 11, 12, '#d8c0ff', '#f0e8ff', '#9070c0')
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#f0e8ff'
  ctx.beginPath()
  ctx.moveTo(cx - 9, cy + 6)
  ctx.quadraticCurveTo(cx - 5, cy + 10 + wave, cx, cy + 6)
  ctx.quadraticCurveTo(cx + 5, cy + 10 - wave, cx + 9, cy + 6)
  ctx.quadraticCurveTo(cx, cy + 4, cx - 9, cy + 6)
  ctx.fill()
  ctx.restore()
  // Hollow eye sockets — a ring stroke with only a faint dark fill (was a
  // solid filled dot), reads as genuinely empty/ethereal rather than a
  // plain cartoon pupil.
  ctx.strokeStyle = '#6a3acc'; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.arc(cx - 4, cy - 1, 1.8, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx + 4, cy - 1, 1.8, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = 'rgba(40,20,70,0.5)'
  ctx.beginPath(); ctx.arc(cx - 4, cy - 1, 1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 4, cy - 1, 1, 0, Math.PI * 2); ctx.fill()
}

function pSnake(ctx, cx, groundY) {
  pShadow(ctx, cx, groundY, 20, 6)
  const segs = [[0, -4, 6], [-3, -12, 6.5], [2, -20, 6], [-2, -27, 5]]
  for (const [dx, dy, r] of segs) {
    pBody(ctx, cx + dx, groundY + dy, r, r * 0.75, '#3a9a3a', '#7ad07a', '#1a6a1a')
  }
  // Scale pattern — small darker diamonds on the 3 lower segments (was
  // missing; the coloured shading already implies volume but not scales).
  ctx.fillStyle = 'rgba(20,60,20,0.55)'
  for (const [dx, dy] of [segs[0], segs[1], segs[2]]) {
    const sx = cx + dx, sy = groundY + dy
    ctx.beginPath()
    ctx.moveTo(sx, sy - 2); ctx.lineTo(sx + 2, sy); ctx.lineTo(sx, sy + 2); ctx.lineTo(sx - 2, sy)
    ctx.closePath(); ctx.fill()
  }
  const [hx, hy] = [cx + segs[3][0], groundY + segs[3][1] - 4]
  pBody(ctx, hx, hy, 5, 4, '#3a9a3a', '#7ad07a', '#1a6a1a')
  ctx.fillStyle = '#ffcc00'
  ctx.beginPath(); ctx.arc(hx - 2, hy - 1, 1.3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(hx + 2, hy - 1, 1.3, 0, Math.PI * 2); ctx.fill()
  // Vertical slit pupils (was plain yellow arcs, no pupil at all).
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath(); ctx.ellipse(hx - 2, hy - 1, 0.5, 1.3, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(hx + 2, hy - 1, 0.5, 1.3, 0, 0, Math.PI * 2); ctx.fill()
  // Forked tongue flicking out beyond the head.
  ctx.strokeStyle = '#ee2222'; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.moveTo(hx, hy - 3); ctx.lineTo(hx, hy - 6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx - 1.4, hy - 8); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + 1.4, hy - 8); ctx.stroke()
}

// Rebuilt (2026-07-04, RO enemy pass) — the previous version was a red/
// yellow blob with buttons that didn't read as "mechanical" at all. Now a
// grey/purple pawn-bot: separate body + head (matches the two-part
// convention every other biped here uses), a dark visor slit with a glowing
// red eye-dot, an antenna, and small rivets instead of buttons.
function pEggPawn(ctx, cx, groundY) {
  pShadow(ctx, cx, groundY, 22, 6)
  const bodyCy = groundY - 11
  pBody(ctx, cx, bodyCy, 11, 12, '#7a7a9a', '#a8a8c8', '#4a4a68')
  const headCy = bodyCy - 15
  pBody(ctx, cx, headCy, 8, 8, '#8a8ab0', '#b8b8d8', '#54547a')
  // Antenna
  ctx.strokeStyle = '#5a5a7a'; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(cx, headCy - 8); ctx.lineTo(cx, headCy - 13); ctx.stroke()
  ctx.fillStyle = '#ff4444'
  ctx.beginPath(); ctx.arc(cx, headCy - 14, 1.6, 0, Math.PI * 2); ctx.fill()
  // Visor slit with a glowing red eye-dot centered inside.
  ctx.fillStyle = '#200a24'
  ctx.fillRect(cx - 6, headCy - 1.5, 12, 4)
  ctx.save()
  ctx.shadowBlur = 4; ctx.shadowColor = '#ff2222'
  ctx.fillStyle = '#ff2222'
  ctx.beginPath(); ctx.arc(cx, headCy + 0.5, 1.6, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  // Chest rivets (was 4 yellow buttons — smaller/darker reads as mechanical
  // panel fasteners rather than a cute jacket).
  ctx.fillStyle = '#3a3a58'
  ctx.beginPath(); ctx.arc(cx - 4, bodyCy + 3, 1.1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 4, bodyCy + 3, 1.1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx - 4, bodyCy + 8, 1.1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 4, bodyCy + 8, 1.1, 0, Math.PI * 2); ctx.fill()
}

function pLeafSprite(ctx, cx, groundY) {
  pShadow(ctx, cx, groundY, 20, 6)
  const bodyCy = groundY - 12
  pBody(ctx, cx, bodyCy, 10, 13, '#4aaa4a', '#8ad08a', '#2a7a2a')
  ctx.save()
  ctx.globalAlpha = 0.85
  pBody(ctx, cx - 11, bodyCy + 2, 6, 4, '#3a9a3a', '#8ad08a', '#2a7a2a')
  pBody(ctx, cx + 11, bodyCy, 6, 4, '#5aaa3a', '#8ad08a', '#2a7a2a')
  ctx.restore()
  // Leaf crown — 3 small pointed leaves fanned above the head, the
  // "nature sprite" identifier at a glance (was missing).
  ctx.fillStyle = '#1a6a08'
  for (const ang of [-0.55, 0, 0.55]) {
    const lx = cx + Math.sin(ang) * 6
    const ly = bodyCy - 13 - Math.cos(ang) * 2
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(ang)
    ctx.beginPath(); ctx.ellipse(0, -2, 1.8, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(cx - 3, bodyCy - 4, 2.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 3, bodyCy - 4, 2.2, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1a3a1a'
  ctx.beginPath(); ctx.arc(cx - 3, bodyCy - 4, 1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 3, bodyCy - 4, 1, 0, Math.PI * 2); ctx.fill()
}

function pGrumpyMole(ctx, cx, groundY) {
  pShadow(ctx, cx, groundY, 24, 7)
  const bodyCy = groundY - 10
  pBody(ctx, cx, bodyCy, 12, 9, '#8a6030', '#c09060', '#5a3a18')
  const headCy = bodyCy - 11
  pBody(ctx, cx, headCy, 9, 7, '#8a6030', '#c09060', '#5a3a18')
  ctx.fillStyle = '#333333'
  ctx.beginPath(); ctx.ellipse(cx - 4, headCy, 3.5, 3, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = '#333333'; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.ellipse(cx - 4, headCy, 3.2, 2.8, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx + 4, headCy, 3.2, 2.8, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx - 1, headCy); ctx.lineTo(cx + 1, headCy); ctx.stroke()
  ctx.fillStyle = 'rgba(170,220,255,0.5)'
  ctx.beginPath(); ctx.ellipse(cx - 4, headCy, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 4, headCy, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(cx - 3, headCy + 6); ctx.quadraticCurveTo(cx, headCy + 8, cx + 3, headCy + 6); ctx.stroke()
}

function pMushroomImp(ctx, cx, groundY) {
  pShadow(ctx, cx, groundY, 22, 6)
  const stemCy = groundY - 8
  pBody(ctx, cx, stemCy, 8, 8, '#e8c890', '#fff0d8', '#b89860')
  const capCy = stemCy - 10
  pBody(ctx, cx, capCy, 12, 8, '#cc3030', '#ff7060', '#902020')
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.ellipse(cx - 5, capCy - 2, 2.2, 1.8, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 5, capCy - 1, 2, 1.6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx, capCy - 4, 1.8, 1.4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.ellipse(cx - 3, stemCy, 2.4, 2.4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 3, stemCy, 2.4, 2.4, 0, 0, Math.PI * 2); ctx.fill()
  // Mischievous narrow eyes — angled inward (was round pupils), reads as a
  // sly/scheming look rather than plain surprise.
  ctx.fillStyle = '#1a1a2a'
  ctx.beginPath(); ctx.ellipse(cx - 3, stemCy, 1.5, 0.9, -0.35, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 3, stemCy, 1.5, 0.9, 0.35, 0, Math.PI * 2); ctx.fill()
  // Stubby legs peeking out from under the stem.
  ctx.fillStyle = '#d8b878'
  ctx.beginPath(); ctx.ellipse(cx - 4, stemCy + 7, 2.2, 1.6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + 4, stemCy + 7, 2.2, 1.6, 0, 0, Math.PI * 2); ctx.fill()
}

function pBabyZombie(ctx, cx, groundY) {
  // Shadow drawn before the tilt so it stays flat/grounded regardless of the
  // shambling body lean above it.
  pShadow(ctx, cx, groundY, 18, 5)
  ctx.save()
  ctx.translate(cx, groundY)
  ctx.rotate(0.09)
  ctx.translate(-cx, -groundY)
  const bodyCy = groundY - 8
  pBody(ctx, cx, bodyCy, 8, 7, '#7a9a6a', '#a8c898', '#4a6a3a')
  // Outstretched arms — thin rounded strokes reaching forward, the
  // classic "shambling" silhouette (was missing entirely).
  ctx.strokeStyle = '#6a9a5a'; ctx.lineWidth = 3; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(cx - 7, bodyCy - 2); ctx.lineTo(cx - 14, bodyCy + 4); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + 7, bodyCy - 2); ctx.lineTo(cx + 14, bodyCy + 4); ctx.stroke()
  const headCy = bodyCy - 9
  pBody(ctx, cx, headCy, 6, 6, '#9ab88a', '#c8e0b8', '#5a7a4a')
  // Half-closed droopy eyelids (was an X-mark "dead eyes" doodle) + a thin
  // bloodshot streak in each — reads as genuinely half-asleep/shambling.
  ctx.strokeStyle = '#2a3a20'; ctx.lineWidth = 1.3
  ctx.beginPath(); ctx.moveTo(cx - 4.5, headCy - 0.5); ctx.quadraticCurveTo(cx - 2.5, headCy + 1.2, cx - 0.8, headCy - 0.3); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + 0.8, headCy - 0.3); ctx.quadraticCurveTo(cx + 2.5, headCy + 1.2, cx + 4.5, headCy - 0.5); ctx.stroke()
  ctx.strokeStyle = '#cc2020'; ctx.lineWidth = 0.7
  ctx.beginPath(); ctx.moveTo(cx - 4, headCy - 0.6); ctx.lineTo(cx - 1.5, headCy + 0.2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + 1.5, headCy + 0.2); ctx.lineTo(cx + 4, headCy - 0.6); ctx.stroke()
  // Uneven teeth along the open mouth.
  ctx.fillStyle = '#1a0a0a'
  ctx.fillRect(cx - 2.5, headCy + 3, 5, 1.6)
  ctx.fillStyle = '#f0f0e0'
  ctx.fillRect(cx - 2.1, headCy + 3, 1, 1.6)
  ctx.fillRect(cx - 0.3, headCy + 3.3, 0.9, 1.3)
  ctx.fillRect(cx + 1.3, headCy + 3, 1, 1.6)
  ctx.restore()
}

const PANDORA_DRAW_FNS = {
  bunny: pSleepyBunny, sleepy_bunny: pSleepyBunny,
  slime: pBouncySlime, bouncy_slime: pBouncySlime,
  fox: pFoxKit, fox_kit: pFoxKit, tiny_fox: pFoxKit,
  egg_pawn: pEggPawn,
  leaf_sprite: pLeafSprite,
  grumpy_mole: pGrumpyMole,
  mushroom_imp: pMushroomImp,
  baby_zombie: pBabyZombie,
  snake: pSnake,
  ghost_wisp: pGhostWisp,
}

// Draws one enemy at its ground-contact screen point (cx, groundY) — same
// anchor convention as drawPandoraTree/renderPlayerPandora in tileEngine.js.
// `frame` only matters to slime (wobble) and ghost (wave); harmless to pass
// for every type.
export function drawEnemyPandora(ctx, type, cx, groundY, frame) {
  const fn = PANDORA_DRAW_FNS[type] || pSleepyBunny
  fn(ctx, cx, groundY, frame)
}

// ── MUSHROOM IMP ──────────────────────────────────────────────────────────────

function _mushroomImp(ctx, size) {
  // Body / stem
  px(ctx, 16, 26, 16, 18, size, '#e8c890')
  px(ctx, 14, 28, 20, 16, size, '#e8c890')
  // Arms
  px(ctx,  6, 28, 10,  6, size, '#e8c890')
  px(ctx, 32, 26, 10,  6, size, '#e8c890')
  // Cap rim
  px(ctx,  8, 22, 32,  8, size, '#dd4444')
  // Cap dome (stacked rows narrowing toward top)
  px(ctx, 10, 16, 28,  8, size, '#cc3030')
  px(ctx, 12, 10, 24,  8, size, '#cc3030')
  px(ctx, 16,  6, 16,  6, size, '#cc3030')
  px(ctx, 18,  4, 12,  4, size, '#cc3030')
  // White spots
  px(ctx, 13, 10,  7,  7, size, '#ffffff')
  px(ctx, 25, 12,  6,  6, size, '#ffffff')
  px(ctx, 20,  6,  6,  6, size, '#ffffff')
  // Eyes (wide + scared)
  px(ctx, 14, 28,  8,  8, size, '#ffffff')
  px(ctx, 26, 28,  8,  8, size, '#ffffff')
  px(ctx, 15, 29,  6,  6, size, '#1a1a2a')
  px(ctx, 27, 29,  6,  6, size, '#1a1a2a')
  px(ctx, 15, 29,  2,  2, size, '#ffffff')
  px(ctx, 27, 29,  2,  2, size, '#ffffff')
  // Worried eyebrows
  px(ctx, 11, 24,  8,  3, size, '#8a5020')
  px(ctx, 29, 24,  8,  3, size, '#8a5020')
  // O mouth (frame + cutout)
  px(ctx, 20, 38,  8,  4, size, '#8a5020')
  px(ctx, 22, 39,  4,  2, size, '#e8c890')
}
