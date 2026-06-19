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
