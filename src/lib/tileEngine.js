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
// across frames instead of flickering every frame.
function tileHash(col, row) {
  return (col * 31 + row * 17) % 97
}

const P = {
  GRASS_BASE:    '#5c8a3c',
  GRASS_DOT:     '#3f6b28',
  GRASS_HILITE:  '#7aac54',
  PATH_BASE:     '#c4a265',
  PATH_LIGHT:    '#d4b47f',
  PATH_DOT:      '#96794a',
  TALL_A:        '#4a7a2c',
  TALL_B:        '#6ab04c',
  WATER_BASE:    '#2a6aaa',
  WATER_SHIMMER: '#4a8acc',
}

// Small palette of tree-canopy greens (Fix 3 — natural forest variation, not
// clones) — picked from within the brief's #2d6a1e–#4a9a2c range.
const TREE_CANOPY_COLORS = ['#2d6a1e', '#357a22', '#3d8a28', '#459228', '#4a9a2c']

// -- Pandora ground drawers (Stage 1 — flat ground layer only, no standing
// objects/entities yet; those land in later stages alongside the Y-sort
// depth system) --

function drawPandoraGrass(ctx, px, py, col, row) {
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
}

function drawPandoraPath(ctx, px, py, col, row) {
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
}

function drawPandoraTallGrass(ctx, px, py, col, row) {
  // Grass base underneath, then 6-8 vertical blade strokes in varying
  // greens with a slight per-blade left/right lean for a sway feel.
  drawPandoraGrass(ctx, px, py, col, row)
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
}

function drawPandoraWater(ctx, px, py, frame) {
  ctx.fillStyle = P.WATER_BASE
  ctx.fillRect(px, py, PANDORA_TILE, PANDORA_TILE)

  // Existing 2-frame flicker convention (frame < 30 vs >= 30), just drawn as
  // shimmer lines instead of a flat color swap.
  ctx.strokeStyle = P.WATER_SHIMMER
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.55
  const rows = frame < 30 ? [10, 20] : [6, 16, 26]
  for (const ly of rows) {
    ctx.beginPath()
    ctx.moveTo(px + 4, py + ly)
    ctx.lineTo(px + PANDORA_TILE - 4, py + ly)
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

function drawPandoraTree(ctx, px, py, col, row) {
  const cx = px + PANDORA_TILE / 2
  const groundY = py + PANDORA_TILE - 4
  const h = tileHash(col, row)

  // Per-tree size/color variation (Fix 3) — seeded by tile position so it's
  // stable across frames, breaks up the "identical clones = fence" look of
  // a uniform tree border into something reading as a natural forest edge.
  const canopyR = 18 + (h % 11)        // 18-28
  const trunkH  = 10 + ((h * 3) % 9)   // 10-18
  const canopyColor = TREE_CANOPY_COLORS[h % TREE_CANOPY_COLORS.length]

  // Undergrowth — 2-3 dark blobs scattered at the base, drawn BEFORE the
  // shadow/trunk so they read as bushes/ground shadow, not on top of them.
  const bushCount = 2 + (h % 2)
  for (let i = 0; i < bushCount; i++) {
    const dh = tileHash(col * 5 + i * 7, row * 11 + i)
    const bx = cx + ((dh % 21) - 10)
    const by = groundY - 2 + ((dh % 5) - 2)
    const br = 4 + (dh % 5) // 4-8
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#1d4a10'
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  drawPandoraShadow(ctx, cx, groundY, 40, 12)

  // Trunk, base planted at the ground point.
  const trunkW = 8
  ctx.fillStyle = '#4a2f18'
  ctx.fillRect(cx - trunkW / 2, groundY - trunkH, trunkW, trunkH)

  // Canopy — rim + fill, centered ~18px above the trunk top. Intentionally
  // extends above the tile's top boundary (real height); Y-sort in the
  // caller (not row order) is what makes this occlude correctly against
  // neighboring standing objects.
  const canopyCy = groundY - trunkH - 18
  ctx.fillStyle = canopyColor
  ctx.beginPath()
  ctx.arc(cx, canopyCy, canopyR, 0, Math.PI * 2)
  ctx.fill()
  // Lighter inner fill (rim/fill two-tone) via a white-alpha wash over the
  // canopy color, rather than a second hardcoded hex — keeps the rim/fill
  // contrast per-tree-color-correct instead of clashing with the randomized hue.
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, canopyCy, canopyR - 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Upper-left highlight blob (ambient light source convention).
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#5ab040'
  ctx.beginPath()
  ctx.arc(cx - 7, canopyCy - 7, canopyR * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
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
export function renderMapPandora(ctx, tileMap, camX, camY, frame = 0, extraEntities = []) {
  ctx.fillStyle = P.GRASS_BASE
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const viewW = ctx.canvas.width
  const viewH = ctx.canvas.height
  // Fix 1 (2026-07-02): NOT clamped to [0, MAP_COLS)/[0, MAP_ROWS) — the
  // loop covers the full viewport regardless of the real map's size, so
  // when the map is smaller than the screen the ground texture (grass
  // speckle/highlight, stable per the same tileHash) extends seamlessly
  // past the map edge instead of leaving a flat, differently-toned void
  // outside a visible "box". Cells outside the real tileMap array read as
  // `undefined` and fall through to the same drawPandoraGrass default as
  // any other untyped tile — no special-casing needed.
  const startCol = Math.floor(camX / PANDORA_TILE)
  const startRow = Math.floor(camY / PANDORA_TILE)
  const endCol = Math.ceil((camX + viewW) / PANDORA_TILE)
  const endRow = Math.ceil((camY + viewH) / PANDORA_TILE)

  const standing = [...extraEntities]

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const px = c * PANDORA_TILE - camX
      const py = r * PANDORA_TILE - camY
      const raw = tileMap[r]?.[c]
      const tileType = typeof raw === 'object' ? raw.type : raw

      switch (tileType) {
        case T.PATH:  drawPandoraPath(ctx, px, py, c, r); break
        case T.WATER: drawPandoraWater(ctx, px, py, frame); break
        case T.TALL:  drawPandoraTallGrass(ctx, px, py, c, r); break
        default:      drawPandoraGrass(ctx, px, py, c, r) // includes TREE/WALL ground + fallback + out-of-map
      }

      if (tileType === T.TREE) {
        standing.push({ y: py + PANDORA_TILE - 4, draw: () => drawPandoraTree(ctx, px, py, c, r) })
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
