// Tile engine — GB-palette canvas renderer for Green Meadow

import { renderEggSprite } from '../egg/renderEggSprite.js'

// Cached sprite offscreen (32×32) reused every frame; content redrawn each frame
let _spriteOff = null
function getSpriteOff() {
  if (typeof document === 'undefined') return null
  if (!_spriteOff) {
    _spriteOff = document.createElement('canvas')
    _spriteOff.width  = 32
    _spriteOff.height = 32
  }
  return _spriteOff
}

export const TILE = 16
export const CANVAS_W = 320
export const CANVAS_H = 240
export const MAP_COLS = 20
export const MAP_ROWS = 15

export const T = {
  GRASS: 0, TALL: 1, TREE: 2, PATH: 3, WATER: 4, WALL: 5,
  EXIT_N: 10, EXIT_S: 11, EXIT_E: 12, EXIT_W: 13,
  NPC: 20, SIGN: 21, FLOWER: 30, ITEM_SPOT: 31, ENEMY: 40,
}

// -- Pandora-style pseudo-3D world-map renderer (2026-07-02) --
// Sole world-map renderer as of Stage 6/6. This replaced two earlier
// approaches, both fully removed from this file: the original flat
// top-down GB-palette renderer this module started as, and an isometric
// (2:1 diamond-projection) renderer built and then superseded mid-session
// by a design pivot to this Y-sorted, non-isometric technique. See
// docs/CHANGELOG.md and the dated entries in docs/CHATBOT_NOTES.md if the
// staged history of either earlier approach is ever needed again — the
// commits are still in git history.
export const PANDORA_TILE = 32

// Deterministic small-int hash for a tile coordinate — keeps per-tile
// texture (grass speckles, path pebbles, tall-grass blade positions) stable
// across frames instead of flickering every frame. Always non-negative
// (0-96): JS's `%` keeps the sign of the dividend, so without the second
// `+97) % 97` wrap, negative col/row (routine now that Round 3 renders
// out-of-bounds forest-fill tiles, which can be arbitrarily far negative)
// produced a negative hash — which then produced negative indices into
// small lookup arrays like TREE_CANOPY_COLORS. A negative array index in
// JS returns `undefined`, and `ctx.fillStyle = undefined` is silently
// IGNORED by canvas (the previous fillStyle stays in effect) — this was
// causing canopy fills to inherit whatever was drawn immediately before
// (often the trunk's dark brown), bleeding a solid brown patch across the
// far off-map corners where both col and row went deeply negative.
function tileHash(col, row) {
  return (((col * 31 + row * 17) % 97) + 97) % 97
}

// FIX (2026-07-05): the map read dull/grey on real screens — brightened and
// warmed the whole ground/path palette (grass/path bases + their derived
// dot/hilite/line shades moved in step, so the texture still reads cohesive
// rather than a bright base with mismatched muddy detail colors on top).
const P = {
  GRASS_BASE:    '#6aaa3c',
  GRASS_DOT:     '#4a7e30',
  GRASS_HILITE:  '#8cc468',
  GRASS_LINE:    '#437a26',
  PATH_BASE:     '#d4a96a',
  PATH_LIGHT:    '#e6c187',
  PATH_DOT:      '#a8875a',
  PATH_LINE:     '#b08f5c',
  TALL_A:        '#548a34',
  TALL_B:        '#78c058',
  WATER_BASE:    '#2b83c4',
  WATER_SHIMMER: '#5fb2e8',
  WATER_FOAM:    '#eafaff',
  SHORE_FRINGE:  '#e0d0a0',
}

// Palette of tree-canopy greens (natural forest variation, not clones) —
// brightened/warmed 2026-07-05 to span #3a9a22 (rich) to #5abf30 (bright),
// up from the previous #1d5010-#5ab030 range which read muddy/grey on real
// screens — trees now pop more clearly against the ground.
const TREE_CANOPY_COLORS = ['#3a9a22', '#3fa024', '#45a627', '#4aad29', '#4fb32b', '#55b92e', '#5abf30']

// -- Neighbor lookups (Round 2 polish) — used for water-edge foam, shoreline
// fringes on adjacent land tiles, and palm-vs-round tree selection. `tileMap`
// may be undefined/out-of-bounds at any given (r,c); treated as non-water.
function tileTypeAt(tileMap, row, col) {
  const raw = tileMap?.[row]?.[col]
  return typeof raw === 'object' ? raw.type : raw
}
function isWaterAt(tileMap, row, col) {
  return tileTypeAt(tileMap, row, col) === T.WATER
}
const NEIGHBOR_DIRS = [[-1, 0, 'top'], [1, 0, 'bottom'], [0, -1, 'left'], [0, 1, 'right']]

// -- Pandora ground drawers (Stage 1 — flat ground layer only, no standing
// objects/entities yet; those land in later stages alongside the Y-sort
// depth system) --

function drawPandoraGrass(ctx, px, py, col, row, tileMap) {
  ctx.fillStyle = P.GRASS_BASE
  ctx.fillRect(px, py, PANDORA_TILE, PANDORA_TILE)

  // 3-5 stable irregular light/dark patches (hashed from col/row, not
  // per-frame random, so the texture doesn't flicker every frame) — reads as
  // natural meadow color variation rather than a flat single-tone fill.
  const h = tileHash(col, row)
  const patchCount = 3 + (h % 3)
  for (let i = 0; i < patchCount; i++) {
    const dh = tileHash(col * 7 + i, row * 13 + i * 3)
    const dx = 4 + (dh % (PANDORA_TILE - 8))
    const dy = 4 + ((dh * 5) % (PANDORA_TILE - 8))
    const r = 3 + (dh % 4) // 3-6px
    ctx.fillStyle = dh % 2 === 0 ? P.GRASS_DOT : P.GRASS_HILITE
    ctx.globalAlpha = dh % 2 === 0 ? 0.5 : 0.3
    ctx.beginPath()
    ctx.ellipse(px + dx, py + dy, r, r * 0.7, (dh % 5) * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Faint highlight stripe along the top edge — only ~55% of tiles get it
  // (gated on the same hash) so it reads as broken/organic texture instead
  // of a continuous grid-line running across every row.
  if (h % 9 < 5) {
    ctx.fillStyle = P.GRASS_HILITE
    ctx.globalAlpha = 0.22
    ctx.fillRect(px, py, PANDORA_TILE, 2)
    ctx.globalAlpha = 1
  }

  // Subtle darker shadow along the bottom edge of every tile — a cheap but
  // effective way to suggest each row has a hair of depth/thickness.
  ctx.fillStyle = '#000000'
  ctx.globalAlpha = 0.08
  ctx.fillRect(px, py + PANDORA_TILE - 2, PANDORA_TILE, 2)
  ctx.globalAlpha = 1

  // Round 2 Fix 3 — 2-3 subtle curved ground-contour strokes, seeded so
  // they're stable, suggesting grass blades/terrain rather than a flat fill.
  const lineCount = 2 + (h % 2)
  for (let i = 0; i < lineCount; i++) {
    const dh = tileHash(col * 17 + i * 3, row * 23 + i)
    const lx = 4 + (dh % (PANDORA_TILE - 8))
    const ly = 6 + ((dh * 7) % (PANDORA_TILE - 12))
    const lw = 6 + (dh % 8)
    ctx.strokeStyle = P.GRASS_LINE
    ctx.globalAlpha = 0.12
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px + lx, py + ly)
    ctx.quadraticCurveTo(px + lx + lw / 2, py + ly - 3, px + lx + lw, py + ly)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Round 2 Fix 3 — shoreline fringe where this land tile touches water.
  if (tileMap) {
    for (const [dr, dc, side] of NEIGHBOR_DIRS) {
      if (!isWaterAt(tileMap, row + dr, col + dc)) continue
      ctx.fillStyle = P.SHORE_FRINGE
      ctx.globalAlpha = 0.3
      if (side === 'top')    ctx.fillRect(px, py, PANDORA_TILE, 4)
      if (side === 'bottom') ctx.fillRect(px, py + PANDORA_TILE - 4, PANDORA_TILE, 4)
      if (side === 'left')   ctx.fillRect(px, py, 4, PANDORA_TILE)
      if (side === 'right')  ctx.fillRect(px + PANDORA_TILE - 4, py, 4, PANDORA_TILE)
      ctx.globalAlpha = 1
    }
  }

  // Round 2 Fix 5 — ambient scattered details (tufts/rocks/flowers), each
  // gated on its own hash so the three don't correlate with each other or
  // with the texture rolls above. Purely decorative, drawn as part of the
  // ground layer (before standing objects/entities).
  const tuftRoll = tileHash(col * 41 + 3, row * 59 + 7) % 100
  if (tuftRoll < 25) {
    const tx = px + 6 + (tuftRoll % (PANDORA_TILE - 12))
    const ty = py + 8 + ((tuftRoll * 3) % (PANDORA_TILE - 14))
    ctx.strokeStyle = tuftRoll % 2 === 0 ? P.TALL_A : P.TALL_B
    ctx.lineWidth = 2
    for (const lean of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx + lean * 3, ty - 7)
      ctx.stroke()
    }
  }

  const rockRoll = tileHash(col * 83 + 11, row * 97 + 5) % 100
  if (rockRoll < 8) {
    const rx = px + 8 + (rockRoll % (PANDORA_TILE - 16))
    const ry = py + 10 + ((rockRoll * 5) % (PANDORA_TILE - 18))
    ctx.fillStyle = '#8a8a8a'
    ctx.beginPath()
    ctx.ellipse(rx, ry, 5 + (rockRoll % 3), 3 + (rockRoll % 2), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.ellipse(rx - 1.5, ry - 1.5, 2, 1.2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const flowerRoll = tileHash(col * 13 + 29, row * 29 + 13) % 100
  if (flowerRoll < 5) {
    const fx = px + 6 + (flowerRoll % (PANDORA_TILE - 12))
    const fy = py + 8 + ((flowerRoll * 7) % (PANDORA_TILE - 14))
    const petalColor = ['#ff88aa', '#ffdd44', '#ffffff'][flowerRoll % 3]
    ctx.strokeStyle = '#3f6b28'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(fx, fy + 4); ctx.lineTo(fx, fy); ctx.stroke()
    ctx.fillStyle = petalColor
    ctx.beginPath()
    ctx.arc(fx, fy - 1, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPandoraPath(ctx, px, py, col, row, tileMap) {
  ctx.fillStyle = P.PATH_BASE
  ctx.fillRect(px, py, PANDORA_TILE, PANDORA_TILE)

  // Lighter center, darker toward the tile edges.
  ctx.fillStyle = P.PATH_LIGHT
  ctx.globalAlpha = 0.4
  ctx.fillRect(px + 6, py + 6, PANDORA_TILE - 12, PANDORA_TILE - 12)
  ctx.globalAlpha = 1

  // 4-6 stable pebble dots.
  const h = tileHash(col, row)
  ctx.fillStyle = P.PATH_DOT
  const pebbleCount = 4 + (h % 3)
  for (let i = 0; i < pebbleCount; i++) {
    const dh = tileHash(col * 11 + i, row * 5 + i * 7)
    const dx = 2 + (dh % (PANDORA_TILE - 4))
    const dy = 2 + ((dh * 3) % (PANDORA_TILE - 4))
    ctx.fillRect(px + dx, py + dy, 2, 1)
  }

  ctx.fillStyle = '#000000'
  ctx.globalAlpha = 0.08
  ctx.fillRect(px, py + PANDORA_TILE - 2, PANDORA_TILE, 2)
  ctx.globalAlpha = 1

  // Round 2 Fix 3 — 2-3 parallel curved lines ("raked sand"/tire-track look).
  const lineCount = 2 + (h % 2)
  for (let i = 0; i < lineCount; i++) {
    const dh = tileHash(col * 19 + i * 5, row * 29 + i * 2)
    const ly = 5 + (i * 9) + (dh % 4)
    ctx.strokeStyle = P.PATH_LINE
    ctx.globalAlpha = 0.1
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px + 2, py + ly)
    ctx.quadraticCurveTo(px + PANDORA_TILE / 2, py + ly + (dh % 5) - 2, px + PANDORA_TILE - 2, py + ly)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Round 2 Fix 3 — shoreline fringe where this path touches water.
  if (tileMap) {
    for (const [dr, dc, side] of NEIGHBOR_DIRS) {
      if (!isWaterAt(tileMap, row + dr, col + dc)) continue
      ctx.fillStyle = P.SHORE_FRINGE
      ctx.globalAlpha = 0.3
      if (side === 'top')    ctx.fillRect(px, py, PANDORA_TILE, 4)
      if (side === 'bottom') ctx.fillRect(px, py + PANDORA_TILE - 4, PANDORA_TILE, 4)
      if (side === 'left')   ctx.fillRect(px, py, 4, PANDORA_TILE)
      if (side === 'right')  ctx.fillRect(px + PANDORA_TILE - 4, py, 4, PANDORA_TILE)
      ctx.globalAlpha = 1
    }
  }
}

function drawPandoraTallGrass(ctx, px, py, col, row, tileMap) {
  // Grass base underneath, then 6-8 vertical blade strokes in varying
  // greens with a slight per-blade left/right lean for a sway feel.
  drawPandoraGrass(ctx, px, py, col, row, tileMap)
  const h = tileHash(col, row)
  const bladeCount = 6 + (h % 3)
  for (let i = 0; i < bladeCount; i++) {
    const dh = tileHash(col * 3 + i * 5, row * 9 + i)
    const bx = 3 + (dh % (PANDORA_TILE - 6))
    const bh = 8 + (dh % 5)
    const lean = (dh % 2 === 0) ? -1 : 1
    ctx.strokeStyle = (dh % 3 === 0) ? P.TALL_B : P.TALL_A
    ctx.lineWidth = (dh % 4 === 0) ? 2 : 1
    ctx.beginPath()
    ctx.moveTo(px + bx, py + PANDORA_TILE - 2)
    ctx.lineTo(px + bx + lean * 3, py + PANDORA_TILE - 2 - bh)
    ctx.stroke()
  }

  // Wildflower dots nestled among the blades — ~45% of tall-grass tiles get
  // 1-2 small colored blooms (pink/yellow/white/violet), seeded so stable.
  const flowerRoll = tileHash(col * 37 + 5, row * 41 + 9) % 100
  if (flowerRoll < 45) {
    const blooms = 1 + (flowerRoll % 2)
    for (let i = 0; i < blooms; i++) {
      const dh = tileHash(col * 43 + i * 9, row * 53 + i * 3)
      const fx = px + 5 + (dh % (PANDORA_TILE - 10))
      const fy = py + PANDORA_TILE - 6 - (dh % 8)
      const petal = ['#ff88aa', '#ffdd44', '#ffffff', '#c890ff'][dh % 4]
      ctx.fillStyle = petal
      ctx.beginPath()
      ctx.arc(fx, fy, 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffd23c'
      ctx.beginPath()
      ctx.arc(fx, fy, 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawPandoraWater(ctx, px, py, frame, col, row, tileMap) {
  ctx.fillStyle = P.WATER_BASE
  ctx.fillRect(px, py, PANDORA_TILE, PANDORA_TILE)

  // Wave shimmer — lighter streaks that drift vertically over time (Round 2
  // Fix 2 replaces the old 2-frame flicker-swap with continuous motion).
  const t = Date.now() / 1000
  ctx.strokeStyle = P.WATER_SHIMMER
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.3
  for (let i = 0; i < 3; i++) {
    const baseY = 6 + i * 10
    const ly = ((baseY + t * 4) % (PANDORA_TILE - 4)) + 2
    ctx.beginPath()
    ctx.moveTo(px + 4, py + ly)
    ctx.lineTo(px + PANDORA_TILE - 4, py + ly)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Inner foam patches — 2-3 irregular light blobs that slowly drift, seeded
  // per-tile so different water tiles don't move in lockstep.
  const h = tileHash(col, row)
  for (let i = 0; i < 3; i++) {
    const dh = tileHash(col * 7 + i, row * 13 + i * 5)
    const driftX = Math.sin(t * 0.5 + dh) * 3
    const driftY = Math.cos(t * 0.4 + dh) * 2
    const fx = px + 6 + (dh % (PANDORA_TILE - 12)) + driftX
    const fy = py + 6 + ((dh * 3) % (PANDORA_TILE - 12)) + driftY
    ctx.fillStyle = P.WATER_FOAM
    ctx.globalAlpha = 0.2 + (dh % 3) * 0.06
    ctx.beginPath()
    ctx.ellipse(fx, fy, 3 + (dh % 3), 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Sparkle twinkles — 1-2 tiny bright points that blink on/off over time
  // (seeded phase per-tile), adding the crisp glint of an RO water surface.
  for (let i = 0; i < 2; i++) {
    const dh = tileHash(col * 19 + i * 7, row * 23 + i * 3)
    const twinkle = Math.sin(t * 2.2 + dh) * 0.5 + 0.5
    if (twinkle < 0.6) continue
    const sx = px + 5 + (dh % (PANDORA_TILE - 10))
    const sy = py + 5 + ((dh * 3) % (PANDORA_TILE - 10))
    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = (twinkle - 0.6) * 2.2
    ctx.fillRect(sx, sy, 2, 1)
    ctx.fillRect(sx, sy - 0.5, 1, 2)
    ctx.globalAlpha = 1
  }

  // Edge foam — a wavy animated line along any border shared with a
  // non-water tile (beach/shore edge), phase per Round 2's own formula.
  const phase = (Date.now() / 500) % (Math.PI * 2)
  ctx.strokeStyle = P.WATER_FOAM
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.7
  for (const [dr, dc, side] of NEIGHBOR_DIRS) {
    if (tileMap && isWaterAt(tileMap, row + dr, col + dc)) continue
    ctx.beginPath()
    const steps = 6
    for (let s = 0; s <= steps; s++) {
      const frac = s / steps
      const wave = Math.sin(phase + frac * Math.PI * 3 + h) * 2
      let fx, fy
      if (side === 'top')    { fx = px + frac * PANDORA_TILE; fy = py + 2 + wave }
      if (side === 'bottom') { fx = px + frac * PANDORA_TILE; fy = py + PANDORA_TILE - 2 + wave }
      if (side === 'left')   { fx = px + 2 + wave; fy = py + frac * PANDORA_TILE }
      if (side === 'right')  { fx = px + PANDORA_TILE - 2 + wave; fy = py + frac * PANDORA_TILE }
      if (s === 0) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// -- Standing objects (Stage 2 — trees, rocks/walls) --
// Each is anchored at a tile's "ground contact" point (bottom-center of the
// tile, slightly inset) rather than the tile's top-left, since these are
// tall objects that extend upward past the tile boundary. A drop shadow is
// drawn first (flush with the ground), then the object body above it.

function drawPandoraShadow(ctx, cx, groundY, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(cx, groundY, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawPandoraTree(ctx, px, py, col, row, tileMap, simple = false) {
  const cx = px + PANDORA_TILE / 2
  const groundY = py + PANDORA_TILE - 4
  const h = tileHash(col, row)

  // Round 2 Fix 4 — coastal tiles get a palm instead of a round tree.
  const nearWater = tileMap && NEIGHBOR_DIRS.some(([dr, dc]) => isWaterAt(tileMap, row + dr, col + dc))
  if (nearWater) { drawPandoraPalm(ctx, cx, groundY, h); return }

  // Per-tree size/color/height variation — seeded by tile position so it's
  // stable across frames. Round 3: canopy pushed way up (36-52px, was
  // 28-36) so neighboring canopies visibly overlap into a continuous
  // forest edge instead of reading as individual balls, plus a per-tree
  // height offset so the tree line isn't perfectly level.
  const canopyR = 36 + (h % 17)        // 36-52
  const trunkH  = 10 + ((h * 3) % 9)   // 10-18
  const heightOffset = -8 + (tileHash(col * 71 + row, row * 83 + col) % 25) // -8..+16
  const canopyColor = TREE_CANOPY_COLORS[h % TREE_CANOPY_COLORS.length]

  // `simple` (Round 3) — used only for the off-map forest-continuation fill
  // (see renderMapPandora): skips the shadow ellipse + undergrowth blobs,
  // since at the density needed to fill an unbounded viewport with
  // overlapping 36-52px canopies, dozens of those semi-transparent dark
  // layers were stacking on top of each other and compositing into a muddy
  // brown/maroon mess instead of reading as "more forest" — plus it's a lot
  // of otherwise-invisible (always-occluded-by-canopies) draw calls for
  // tiles the player can never actually stand on. In-bounds trees are
  // unaffected — they still get the full shadow+undergrowth treatment.
  if (!simple) {
    // Undergrowth — 3-5 dark blobs scattered at the base (bigger/more than
    // before, to visually ground the now much-larger canopies), drawn
    // BEFORE the shadow/trunk so they read as bushes/ground shadow.
    const bushCount = 3 + (h % 3) // 3-5
    for (let i = 0; i < bushCount; i++) {
      const dh = tileHash(col * 5 + i * 7, row * 11 + i)
      const bx = cx + ((dh % 29) - 14)
      const by = groundY - 2 + ((dh % 5) - 2)
      const br = 8 + (dh % 7) // 8-14
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.fillStyle = '#1d4a10'
      ctx.beginPath()
      ctx.arc(bx, by, br, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.globalAlpha = 0.6
    drawPandoraShadow(ctx, cx, groundY, 50, 14)
    ctx.restore()
  }

  // Trunk, base planted at the ground point — two-tone: a darker right "side"
  // face with a lighter "front" face over most of the width, plus a dark
  // outline, giving the trunk RO-style volume instead of a flat brown bar.
  const trunkW = 8
  const trunkX = cx - trunkW / 2
  const trunkTop = groundY - trunkH
  ctx.fillStyle = '#33200f'                 // darker side (right) face
  ctx.fillRect(trunkX, trunkTop, trunkW, trunkH)
  ctx.fillStyle = '#5a3a1e'                 // lighter front face
  ctx.fillRect(trunkX, trunkTop, trunkW - 3, trunkH)
  ctx.strokeStyle = 'rgba(20,12,6,0.85)'    // dark outline
  ctx.lineWidth = 1
  ctx.strokeRect(trunkX + 0.5, trunkTop + 0.5, trunkW - 1, trunkH - 1)

  // Canopy — centered ~18px above the trunk top plus the per-tree height
  // offset. Intentionally extends above the tile's top boundary (real
  // height); Y-sort in the caller (not row order) is what makes this
  // occlude correctly against neighboring standing objects.
  const canopyCy = groundY - trunkH - 18 + heightOffset

  // Round 3 Fix 2 — irregular lumpy silhouette instead of a perfect circle:
  // main circle + 3-4 smaller offset circles, all filled solid before any
  // shading pass so the lobes read as one continuous blob, not a snowman.
  // 2026-07-04 — build the blob list once so we can draw a dark OUTLINE pass
  // (same blobs, +2px, in a near-black forest green) BEHIND the colored fill.
  // The oversized dark shapes peek out ~2px around the whole union silhouette,
  // giving RO's signature crisp outline WITHOUT any internal seam lines (a
  // plain per-circle stroke would draw the overlapping inner arcs too).
  const blobs = [{ x: cx, y: canopyCy, r: canopyR }]
  const lobeCount = 3 + (h % 2) // 3-4
  for (let i = 0; i < lobeCount; i++) {
    const dh = tileHash(col * 53 + i * 11, row * 67 + i)
    const angle = (dh / 97) * Math.PI * 2
    const dist = canopyR * (0.55 + (dh % 4) * 0.1)
    const lobeR = 8 + (dh % 7) // 8-14
    blobs.push({ x: cx + Math.cos(angle) * dist, y: canopyCy + Math.sin(angle) * dist, r: lobeR })
  }
  ctx.fillStyle = '#0d2b09' // dark outline (drawn first, oversized)
  for (const b of blobs) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = canopyColor
  for (const b of blobs) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Round 3 — the remaining decorative layers below (inner wash, rim leaf
  // clusters, highlights) are ALL semi-transparent. At normal in-map tree
  // density that's fine, but the `simple` off-map filler trees can overlap
  // dozens-deep in the unbounded viewport fill, and stacking that many
  // alpha<1 dark-green layers on top of each other composites into a muddy
  // brown/maroon mess rather than "more forest" — so `simple` trees stop
  // here (opaque canopy + lobes + trunk only, still varied in size/color/
  // shape) and skip every alpha-blended layer below.
  if (simple) return

  // Lighter inner fill (rim/fill two-tone) via a white-alpha wash over the
  // canopy color, rather than a second hardcoded hex — keeps the rim/fill
  // contrast per-tree-color-correct instead of clashing with the randomized hue.
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, canopyCy, canopyR - 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 4-6 small dark leaf clusters around the canopy rim (more than before,
  // scaled to the bigger canopy) to further break up the silhouette.
  const clusterCount = 4 + (h % 3) // 4-6
  for (let i = 0; i < clusterCount; i++) {
    const dh = tileHash(col * 47 + i * 9, row * 61 + i)
    const angle = (dh / 97) * Math.PI * 2
    const lx = cx + Math.cos(angle) * canopyR * 0.9
    const ly = canopyCy + Math.sin(angle) * canopyR * 0.9
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#1d5010'
    ctx.beginPath()
    ctx.arc(lx, ly, 7 + (dh % 4), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Upper-left highlight blob (ambient light source convention) + a second,
  // smaller inner highlight for more depth — both scaled to canopyR now
  // that trees vary more in size.
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#5ab040'
  ctx.beginPath()
  ctx.arc(cx - canopyR * 0.3, canopyCy - canopyR * 0.3, canopyR * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#8ad868'
  ctx.beginPath()
  ctx.arc(cx - canopyR * 0.35, canopyCy - canopyR * 0.4, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Round 2 Fix 4 — palm tree variant for tiles adjacent to water: curved
// trunk, a fan of fronds, small coconut cluster. Ground-anchored the same
// way as the round tree (drawPandoraShadow, then body extending upward).
function drawPandoraPalm(ctx, cx, groundY, h) {
  drawPandoraShadow(ctx, cx, groundY, 34, 10)

  const trunkH = 30 + (h % 10) // 30-39, taller/leaner than a round tree
  const lean = ((h % 7) - 3) * 1.5 // slight per-tree curve direction

  // Curved trunk via a quadratic bezier.
  ctx.strokeStyle = '#7a5a30'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, groundY)
  ctx.quadraticCurveTo(cx + lean * 2, groundY - trunkH * 0.6, cx + lean * 3.5, groundY - trunkH)
  ctx.stroke()

  const topX = cx + lean * 3.5
  const topY = groundY - trunkH

  // Fan of 5-6 fronds radiating from the trunk top.
  const frondCount = 5 + (h % 2)
  for (let i = 0; i < frondCount; i++) {
    const dh = tileHash(i * 13 + 7, Math.round(h))
    const angle = -Math.PI / 2 + (i - (frondCount - 1) / 2) * 0.42 + ((dh % 5) - 2) * 0.02
    const len = 20 + (dh % 8)
    const fx = topX + Math.cos(angle) * len
    const fy = topY + Math.sin(angle) * len
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.fillStyle = i % 2 === 0 ? '#2d6a1e' : '#3d8a28'
    ctx.beginPath()
    ctx.ellipse(
      (topX + fx) / 2, (topY + fy) / 2,
      len * 0.55, 5,
      angle, 0, Math.PI * 2,
    )
    ctx.fill()
    ctx.restore()
  }

  // Small coconut cluster at the frond base.
  ctx.fillStyle = '#7a5a30'
  for (const [dx, dy] of [[-3, 2], [3, 2], [0, -2]]) {
    ctx.beginPath()
    ctx.arc(topX + dx, topY + dy, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPandoraRock(ctx, px, py) {
  const cx = px + PANDORA_TILE / 2
  const groundY = py + PANDORA_TILE - 4
  const rw = 22, rh = 16
  const top = groundY - rh

  drawPandoraShadow(ctx, cx, groundY, 26, 8)

  // Rounded boulder base.
  ctx.fillStyle = '#8a8a8a'
  ctx.beginPath()
  ctx.ellipse(cx, top + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  // Dark outline (2026-07-04) for RO-style pop.
  ctx.strokeStyle = 'rgba(30,30,34,0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(cx, top + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2)
  ctx.stroke()
  // Darker left face.
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#6a6a6a'
  ctx.beginPath()
  ctx.ellipse(cx - rw * 0.18, top + rh / 2 + 2, rw * 0.3, rh * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // Lighter right face.
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#aaaaaa'
  ctx.beginPath()
  ctx.ellipse(cx + rw * 0.2, top + rh / 2 - 2, rw * 0.25, rh * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // Thin top highlight arc.
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(cx, top + rh * 0.3, rw * 0.35, rh * 0.2, 0, Math.PI * 1.1, Math.PI * 1.9)
  ctx.stroke()
}

function drawPandoraSignStanding(ctx, px, py) {
  const cx = px + PANDORA_TILE / 2
  const groundY = py + PANDORA_TILE - 4

  drawPandoraShadow(ctx, cx, groundY, 12, 4)

  // Post
  ctx.fillStyle = '#7a4a18'
  ctx.fillRect(cx - 1.5, groundY - 12, 3, 12)
  // Board, beige, sitting on the post
  ctx.fillStyle = '#e8d8b0'
  ctx.fillRect(cx - 8, groundY - 20, 16, 10)
  ctx.strokeStyle = '#a08050'
  ctx.lineWidth = 1
  ctx.strokeRect(cx - 8, groundY - 20, 16, 10)
  // Squiggly "text" lines
  ctx.strokeStyle = '#7a6040'
  ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(cx - 5, groundY - 16); ctx.lineTo(cx + 5, groundY - 16); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx - 5, groundY - 13); ctx.lineTo(cx + 2, groundY - 13); ctx.stroke()
}

function drawPandoraNPCStanding(ctx, px, py, npcType) {
  const cx = px + PANDORA_TILE / 2
  const groundY = py + PANDORA_TILE - 4

  drawPandoraShadow(ctx, cx, groundY, 18, 5)

  // Stage 6 polish: owl gets a dedicated silhouette (pale face patches, beak,
  // ear tufts) instead of a uniform brown blob that read as under-
  // differentiated from an enemy at a glance.
  if (npcType === 'owl') {
    const bodyCy = groundY - 9
    pandoraFriendlyBody(ctx, cx, bodyCy, 8, 9, '#8B6914')
    const headCy = bodyCy - 12
    pandoraFriendlyBody(ctx, cx, headCy, 7.5, 7, '#a67d1a')
    ctx.fillStyle = '#FFFACD'
    ctx.beginPath(); ctx.ellipse(cx - 3, headCy, 2.6, 3, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx + 3, headCy, 2.6, 3, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath(); ctx.arc(cx - 3, headCy, 1.1, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + 3, headCy, 1.1, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#FFA500'
    ctx.beginPath()
    ctx.moveTo(cx - 2, headCy + 3); ctx.lineTo(cx + 2, headCy + 3); ctx.lineTo(cx, headCy + 6)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#8B6914'
    ctx.beginPath(); ctx.moveTo(cx - 6, headCy - 6); ctx.lineTo(cx - 4, headCy - 11); ctx.lineTo(cx - 2, headCy - 6); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(cx + 6, headCy - 6); ctx.lineTo(cx + 4, headCy - 11); ctx.lineTo(cx + 2, headCy - 6); ctx.closePath(); ctx.fill()
    return
  }

  const bodyColor = '#40a860'
  const bodyCy = groundY - 8
  pandoraFriendlyBody(ctx, cx, bodyCy, 7, 8, bodyColor)
  const headCy = bodyCy - 11
  pandoraFriendlyBody(ctx, cx, headCy, 7, 6.5, '#ffe0a0')
  // Waving arm
  ctx.strokeStyle = bodyColor
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx + 6, bodyCy - 2)
  ctx.lineTo(cx + 11, bodyCy - 9)
  ctx.stroke()
  // Simple eyes
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath(); ctx.arc(cx - 2, headCy, 1.1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + 2, headCy, 1.1, 0, Math.PI * 2); ctx.fill()
}

// Small local helper shared by drawPandoraNPCStanding — a lighter-weight
// version of the enemy sprites' pBody() volumetric shading (kept local since
// tileEngine.js doesn't import drawEnemy.js and this is the only standing
// tile-object that needs it, unlike trees/rocks which use flat fills).
function pandoraFriendlyBody(ctx, cx, cy, rx, ry, base) {
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// -- Maze dungeon theme (2026-07-04) --
// The maze map is built (in tileMaps.js) from the SAME tile types as the
// overworld — T.TREE for impassable walls, T.GRASS for the carved corridors —
// so collision/generation stay byte-for-byte identical. The dungeon LOOK is
// produced purely here in the renderer: when renderMapPandora is called with
// isMaze=true, T.GRASS floor cells route to drawMazeFloor and T.TREE wall
// cells route to drawMazeWall instead of the grass/tree drawers. Nothing about
// the stored tile type or canMove() changes — only which paint function runs.

function drawMazeFloor(ctx, px, py, col, row) {
  const h = tileHash(col, row)
  // Cool dark stone-grey base with a subtle seeded per-tile shade so the floor
  // reads as laid flagstones rather than one flat fill.
  const shade = h % 3
  ctx.fillStyle = shade === 0 ? '#3a3f4a' : shade === 1 ? '#343947' : '#2e333e'
  ctx.fillRect(px, py, PANDORA_TILE, PANDORA_TILE)

  // 2-3 lighter worn-stone speckle patches.
  const patchCount = 2 + (h % 2)
  for (let i = 0; i < patchCount; i++) {
    const dh = tileHash(col * 7 + i, row * 13 + i * 3)
    const dx = 3 + (dh % (PANDORA_TILE - 6))
    const dy = 3 + ((dh * 5) % (PANDORA_TILE - 6))
    ctx.fillStyle = 'rgba(130,140,158,0.16)'
    ctx.beginPath()
    ctx.ellipse(px + dx, py + dy, 3 + (dh % 3), 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Flagstone grout: dark seam along the right + bottom edges, with a faint
  // light bevel along the top + left, so each tile reads as a raised block.
  ctx.strokeStyle = 'rgba(14,17,23,0.7)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px + PANDORA_TILE - 0.5, py); ctx.lineTo(px + PANDORA_TILE - 0.5, py + PANDORA_TILE)
  ctx.moveTo(px, py + PANDORA_TILE - 0.5); ctx.lineTo(px + PANDORA_TILE, py + PANDORA_TILE - 0.5)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(150,160,180,0.10)'
  ctx.beginPath()
  ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + PANDORA_TILE)
  ctx.moveTo(px, py + 0.5); ctx.lineTo(px + PANDORA_TILE, py + 0.5)
  ctx.stroke()
}

function drawMazeWall(ctx, px, py, col, row) {
  const h = tileHash(col, row)
  // A pseudo-3D stone block: the front face extends slightly ABOVE the tile
  // (like the overworld trees) so Y-sorting gives the wall real height, with a
  // lighter top face catching the torchlight, a darker cracked front face, a
  // dark outline, and a cast shadow on the floor below.
  const left = px
  const w = PANDORA_TILE
  const topH = 8                    // thickness of the lit top face
  const rise = 6                    // how far the block extends above its tile
  const top = py - rise
  const fullH = PANDORA_TILE + rise

  // Cast shadow on the floor tile just below.
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fillRect(left + 2, py + PANDORA_TILE - 2, w, 4)

  // Front (darker) face.
  ctx.fillStyle = '#474b56'
  ctx.fillRect(left, top + topH, w, fullH - topH)
  // Top (lighter, torch-lit) face.
  ctx.fillStyle = '#6b7280'
  ctx.fillRect(left, top, w, topH)

  // Faint warm torch glow on the top face (dungeons are lit by torchlight).
  ctx.fillStyle = 'rgba(255,180,90,0.10)'
  ctx.fillRect(left, top, w, topH)

  // Horizontal crack/mortar lines across the front face.
  ctx.strokeStyle = 'rgba(18,20,26,0.55)'
  ctx.lineWidth = 1
  const frontH = fullH - topH
  for (let i = 1; i <= 2; i++) {
    const ly = top + topH + i * (frontH / 3) + ((h % 3) - 1)
    ctx.beginPath()
    ctx.moveTo(left + 1, ly); ctx.lineTo(left + w - 1, ly)
    ctx.stroke()
  }
  // One seeded vertical brick seam.
  const vx = left + 4 + (h % (w - 8))
  ctx.beginPath()
  ctx.moveTo(vx, top + topH); ctx.lineTo(vx, top + fullH - 2)
  ctx.stroke()

  // Seam between the top and front faces.
  ctx.strokeStyle = 'rgba(12,14,18,0.5)'
  ctx.beginPath()
  ctx.moveTo(left, top + topH); ctx.lineTo(left + w, top + topH)
  ctx.stroke()

  // Dark outline around the whole block — the RO "pop".
  ctx.strokeStyle = 'rgba(10,12,16,0.85)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(left + 0.75, top + 0.75, w - 1.5, fullH - 1.5)
}

// Stage 2: trees + rocks/walls drawn as standing objects, Y-sorted by their
// ground-contact point (screen Y) so nearer objects correctly occlude
// farther ones — this is the core of the pseudo-3D depth feel. Ground tiles
// still draw first as one flat pass (they're always behind every standing
// object); standing objects are collected into a list and sorted/drawn
// AFTER the whole ground pass, same reasoning as the iso track's two-pass
// floor/raised split (Stage 2 there) but generalized to explicit Y instead
// of row order, since Y-sort must also correctly interleave with entities
// (player/enemies) added in later stages.
//
// `extraEntities` (Stage 3+): an array of `{ y, draw }` the caller supplies
// for anything dynamic that also needs Y-sorting against trees/rocks — the
// player this stage, enemies from Stage 4. `y` must already be in the same
// camera-adjusted screen-space as the tree/rock entries below (world Y minus
// camY), so it sorts correctly against them.
export function renderMapPandora(ctx, tileMap, camX, camY, frame = 0, extraEntities = [], isMaze = false) {
  // Dark stone backdrop in the maze (so out-of-frame gaps read as dungeon, not
  // a green flash); sunny grass base everywhere else.
  ctx.fillStyle = isMaze ? '#1a1d24' : P.GRASS_BASE
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const viewW = ctx.canvas.width
  const viewH = ctx.canvas.height
  // Fix 1 (2026-07-02, refined Round 3): NOT clamped to [0, MAP_COLS)/
  // [0, MAP_ROWS) — the loop covers the full viewport regardless of the
  // real map's size. Round 3: cells truly outside the map bounds are no
  // longer plain grass — they're forced to render as trees (forest
  // continuation, seeded by the same stable tileHash as everything else),
  // so the world reads as an endless forest surrounding the playable map
  // instead of a rectangle sitting on a flat void. Collision/gameplay is
  // completely unaffected — this override only exists inside this render
  // loop's local `tileType`, never touches the actual tileMap array that
  // canMove()/tryMove() read from, so the player is still only ever
  // physically inside the real map.
  const startCol = Math.floor(camX / PANDORA_TILE)
  const startRow = Math.floor(camY / PANDORA_TILE)
  const endCol = Math.ceil((camX + viewW) / PANDORA_TILE)
  const endRow = Math.ceil((camY + viewH) / PANDORA_TILE)

  const standing = [...extraEntities]

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const px = c * PANDORA_TILE - camX
      const py = r * PANDORA_TILE - camY
      const outOfBounds = r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS
      const raw = outOfBounds ? undefined : tileMap[r]?.[c]
      const tileType = outOfBounds ? T.TREE : (typeof raw === 'object' ? raw.type : raw)

      switch (tileType) {
        case T.PATH:  drawPandoraPath(ctx, px, py, c, r, tileMap); break
        case T.WATER: drawPandoraWater(ctx, px, py, frame, c, r, tileMap); break
        case T.TALL:  drawPandoraTallGrass(ctx, px, py, c, r, tileMap); break
        default:      isMaze
          ? drawMazeFloor(ctx, px, py, c, r)                       // dungeon stone floor under everything
          : drawPandoraGrass(ctx, px, py, c, r, tileMap)           // includes TREE/WALL ground + fallback + out-of-map
      }

      if (tileType === T.TREE) {
        standing.push({ y: py + PANDORA_TILE - 4, draw: () => (isMaze
          ? drawMazeWall(ctx, px, py, c, r)                        // dungeon stone wall (same T.TREE tile, dungeon paint)
          : drawPandoraTree(ctx, px, py, c, r, tileMap, outOfBounds)) })
      } else if (tileType === T.WALL) {
        standing.push({ y: py + PANDORA_TILE - 4, draw: () => drawPandoraRock(ctx, px, py) })
      } else if (tileType === T.SIGN) {
        standing.push({ y: py + PANDORA_TILE - 4, draw: () => drawPandoraSignStanding(ctx, px, py) })
      } else if (tileType === T.NPC) {
        const npcType = (typeof raw === 'object' && raw.npc_type) || 'default'
        standing.push({ y: py + PANDORA_TILE - 4, draw: () => drawPandoraNPCStanding(ctx, px, py, npcType) })
      }
    }
  }

  standing.sort((a, b) => a.y - b.y)
  standing.forEach(s => s.draw())

  // Warm ambient sunlight wash (2026-07-05) — the map read flat/overcast
  // without it; a very faint warm tint over the whole frame (ground, trees,
  // player, everything) unifies the scene into a sunnier outdoor feel. Skipped
  // in the maze, where the fog/torch overlay owns the lighting mood instead.
  if (!isMaze) {
    ctx.fillStyle = 'rgba(255,220,150,0.06)'
    ctx.fillRect(0, 0, viewW, viewH)
  }
}

// -- Pandora player sprite (Stage 3) --
// Drop shadow drawn first, then the egg sprite scaled up (~40x48, vs the
// original 32x32) to feel prominent on the larger 32px tiles. `groundX/
// groundY` are the screen-space feet-contact point the caller computed via
// the brief's own anchor formula (worldX*TILE+TILE/2, worldY*TILE+TILE*0.8)
// minus camera — the sprite is drawn extending UPWARD from that point,
// mirroring how drawPandoraTree/drawPandoraRock anchor at their base.
export function renderPlayerPandora(ctx, groundX, groundY) {
  const companion = window.__kq_companionEgg
  const off = getSpriteOff()
  if (!off || !companion) return

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(groundX, groundY, 10, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const sCtx = off.getContext('2d')
  sCtx.imageSmoothingEnabled = false
  sCtx.clearRect(0, 0, 32, 32)
  renderEggSprite(sCtx, { ...companion, t: performance.now() / 1000, canvasSize: 32 })
  ctx.imageSmoothingEnabled = false

  const spriteW = 40, spriteH = 48
  const dx = Math.round(groundX - spriteW / 2)
  const dy = Math.round(groundY - spriteH)
  ctx.drawImage(off, dx, dy, spriteW, spriteH)
}

// -- Collision --

export function canMove(tileMap, col, row) {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false
  const raw = tileMap[row]?.[col]
  const t = typeof raw === 'object' ? raw.type : raw
  if (t === undefined) return false
  return ![T.TREE, T.WATER, T.WALL, T.NPC, T.SIGN, T.ENEMY].includes(t)
}

// -- Exit check --

export function getExitAt(tileMap, col, row) {
  const raw = tileMap[row]?.[col]
  const t = typeof raw === 'object' ? raw.type : raw
  if ([T.EXIT_N, T.EXIT_S, T.EXIT_E, T.EXIT_W].includes(t)) return t
  return null
}

export const EXIT_OPPOSITE = {
  [T.EXIT_N]: T.EXIT_S,
  [T.EXIT_S]: T.EXIT_N,
  [T.EXIT_E]: T.EXIT_W,
  [T.EXIT_W]: T.EXIT_E,
}

export const EXIT_DIR_NAME = {
  [T.EXIT_N]: 'N',
  [T.EXIT_S]: 'S',
  [T.EXIT_E]: 'E',
  [T.EXIT_W]: 'W',
}

// Find entry position for arriving from a direction
export function getEntryPosition(tileMap, fromExitType) {
  // fromExitType is the exit we came FROM, so we enter from the opposite side
  const entrySide = EXIT_OPPOSITE[fromExitType]
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const raw = tileMap[r]?.[c]
      const t = typeof raw === 'object' ? raw.type : raw
      if (t === entrySide) return { col: c, row: r }
    }
  }
  // Fallback: center of map
  return { col: Math.floor(MAP_COLS / 2), row: Math.floor(MAP_ROWS / 2) }
}
