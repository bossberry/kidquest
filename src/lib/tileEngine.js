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

// -- Isometric (2:1) projection math — Stage 1 of the iso world-map rollout --
// ISO_W/ISO_H describe the pixel footprint of one tile's diamond in iso space.
export const ISO_W = TILE * 2 // 32px — width of one iso tile diamond
export const ISO_H = TILE     // 16px — height of one iso tile diamond

// Projects a tile-space (col, row) into iso screen pixels, offset by a camera
// position that is itself already in iso pixel space (not tile-space).
export function isoProject(col, row, camX, camY) {
  const px = (col - row) * (ISO_W / 2) - camX
  const py = (col + row) * (ISO_H / 2) - camY
  return { px, py }
}

// Inverse of isoProject — converts iso screen pixels back to fractional
// tile-space (col, row). Not used until a later stage (tap hit-testing), but
// added now alongside its forward counterpart for symmetry.
export function isoUnproject(px, py, camX, camY) {
  const x = px + camX
  const y = py + camY
  const col = (x / (ISO_W / 2) + y / (ISO_H / 2)) / 2
  const row = (y / (ISO_H / 2) - x / (ISO_W / 2)) / 2
  return { col, row }
}

export const T = {
  GRASS: 0, TALL: 1, TREE: 2, PATH: 3, WATER: 4, WALL: 5,
  EXIT_N: 10, EXIT_S: 11, EXIT_E: 12, EXIT_W: 13,
  NPC: 20, SIGN: 21, FLOWER: 30, ITEM_SPOT: 31, ENEMY: 40,
}

// Tile colors (GB palette)
const C = {
  GRASS:      '#4a7a4a',
  GRASS_DARK: '#3a6a3a',
  TALL:       '#1a3a1a',
  TALL_STRIPE:'#142e14',
  TREE_BG:    '#0a2a0a',
  TREE_IN:    '#1a4a1a',
  PATH:       '#b8884a',
  PATH_DARK:  '#a07838',
  WATER_A:    '#3a5a90',
  WATER_B:    '#2a4a80',
  EXIT_ARROW: '#ffffff',
  SIGN_BODY:  '#7a4a18',
  SIGN_LINE:  '#f0e8d0',
  FLOWER_CTR: '#ffffff',
  FLOWER_PET: '#5ababa',
  SPARKLE:    '#ffe040',
  ISO_BG:       '#1a2a1a',
  ISO_HIGHLIGHT:'#7aae7a',
}

// -- Tile renderers --

function drawGrass(ctx, px, py) {
  ctx.fillStyle = C.GRASS
  ctx.fillRect(px, py, TILE, TILE)
}

function drawTall(ctx, px, py) {
  ctx.fillStyle = C.TALL
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = C.TALL_STRIPE
  for (let x = 0; x < TILE; x += 4) {
    ctx.fillRect(px + x, py, 2, TILE)
  }
}

function drawTree(ctx, px, py) {
  ctx.fillStyle = C.TREE_BG
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = C.TREE_IN
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
}

function drawPath(ctx, px, py) {
  ctx.fillStyle = C.PATH
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = C.PATH_DARK
  ctx.fillRect(px, py + TILE - 2, TILE, 2)
}

function drawWater(ctx, px, py, frame) {
  ctx.fillStyle = frame < 30 ? C.WATER_A : C.WATER_B
  ctx.fillRect(px, py, TILE, TILE)
}

function drawExit(ctx, px, py, type) {
  drawPath(ctx, px, py)
  ctx.fillStyle = C.EXIT_ARROW
  ctx.font = '8px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const arrows = { [T.EXIT_N]: '↑', [T.EXIT_S]: '↓', [T.EXIT_E]: '→', [T.EXIT_W]: '←' }
  ctx.fillText(arrows[type] || '?', px + TILE / 2, py + TILE / 2)
}

function drawFlower(ctx, px, py) {
  drawGrass(ctx, px, py)
  const cx = px + 8, cy = py + 8
  ctx.fillStyle = C.FLOWER_PET
  const petals = [[0,-3],[3,0],[0,3],[-3,0]]
  for (const [dx, dy] of petals) {
    ctx.fillRect(cx + dx - 1, cy + dy - 1, 3, 3)
  }
  ctx.fillStyle = C.FLOWER_CTR
  ctx.fillRect(cx - 1, cy - 1, 3, 3)
}

function drawSign(ctx, px, py) {
  drawGrass(ctx, px, py)
  ctx.fillStyle = C.SIGN_BODY
  ctx.fillRect(px + 4, py + 3, 8, 7)
  ctx.fillStyle = C.SIGN_LINE
  ctx.fillRect(px + 5, py + 5, 6, 1)
  ctx.fillRect(px + 5, py + 7, 4, 1)
}

function drawNPC(ctx, px, py, npcType) {
  drawGrass(ctx, px, py)
  if (npcType === 'owl') {
    ctx.fillStyle = '#8B6914'
    ctx.fillRect(px + 4, py + 2, 8, 8)
    ctx.fillStyle = '#FFFACD'
    ctx.fillRect(px + 5, py + 3, 2, 2)
    ctx.fillRect(px + 9, py + 3, 2, 2)
    ctx.fillStyle = '#FFA500'
    ctx.fillRect(px + 7, py + 6, 2, 2)
    ctx.fillStyle = '#8B6914'
    ctx.fillRect(px + 4, py + 10, 3, 3)
    ctx.fillRect(px + 9, py + 10, 3, 3)
  } else {
    ctx.fillStyle = '#40a860'
    ctx.fillRect(px + 5, py + 2, 6, 10)
    ctx.fillStyle = '#ffe0a0'
    ctx.fillRect(px + 6, py + 2, 4, 4)
  }
}

function drawEnemy(ctx, px, py, enemyType) {
  drawGrass(ctx, px, py)
  if (enemyType === 'bunny') {
    ctx.fillStyle = '#f0e0e8'
    ctx.fillRect(px + 4, py + 4, 8, 8)
    ctx.fillStyle = '#f0b0b8'
    ctx.fillRect(px + 5, py + 2, 2, 4)
    ctx.fillRect(px + 9, py + 2, 2, 4)
    ctx.fillStyle = '#d08090'
    ctx.fillRect(px + 6, py + 7, 2, 2)
    ctx.fillRect(px + 9, py + 10, 2, 2)
    ctx.fillRect(px + 5, py + 10, 2, 2)
  } else {
    ctx.fillStyle = '#80c0f0'
    ctx.beginPath()
    ctx.arc(px + 8, py + 8, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawItemSpot(ctx, px, py, frame) {
  drawGrass(ctx, px, py)
  const phase = Math.floor(frame / 15) % 4
  const cx = px + 8, cy = py + 8
  ctx.fillStyle = C.SPARKLE
  if (phase === 0) {
    ctx.fillRect(cx - 1, cy - 3, 2, 7)
    ctx.fillRect(cx - 3, cy - 1, 7, 2)
  } else if (phase === 1) {
    ctx.fillRect(cx - 2, cy - 2, 2, 2)
    ctx.fillRect(cx + 1, cy - 2, 2, 2)
    ctx.fillRect(cx - 2, cy + 1, 2, 2)
    ctx.fillRect(cx + 1, cy + 1, 2, 2)
  } else if (phase === 2) {
    ctx.fillRect(cx - 1, cy - 2, 2, 5)
    ctx.fillRect(cx - 2, cy - 1, 5, 2)
  } else {
    ctx.fillRect(cx, cy - 1, 1, 3)
    ctx.fillRect(cx - 1, cy, 3, 1)
  }
}

// -- Map renderer --

export function renderMap(ctx, tileMap, npcData, enemyData, camX, camY, frame) {
  // Fill background (covers viewport area outside map bounds)
  ctx.fillStyle = '#3a6a3a'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const viewW = ctx.canvas.width
  const viewH = ctx.canvas.height
  const startCol = Math.max(0, Math.floor(camX / TILE))
  const startRow = Math.max(0, Math.floor(camY / TILE))
  const endCol = Math.min(MAP_COLS, Math.ceil((camX + viewW) / TILE))
  const endRow = Math.min(MAP_ROWS, Math.ceil((camY + viewH) / TILE))

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const px = c * TILE - camX
      const py = r * TILE - camY
      const raw = tileMap[r]?.[c]
      const tileType = typeof raw === 'object' ? raw.type : raw

      switch (tileType) {
        case T.GRASS:      drawGrass(ctx, px, py); break
        case T.TALL:       drawTall(ctx, px, py); break
        case T.TREE:       drawTree(ctx, px, py); break
        case T.PATH:       drawPath(ctx, px, py); break
        case T.WATER:      drawWater(ctx, px, py, frame); break
        case T.EXIT_N:     drawExit(ctx, px, py, T.EXIT_N); break
        case T.EXIT_S:     drawExit(ctx, px, py, T.EXIT_S); break
        case T.EXIT_E:     drawExit(ctx, px, py, T.EXIT_E); break
        case T.EXIT_W:     drawExit(ctx, px, py, T.EXIT_W); break
        case T.FLOWER:     drawFlower(ctx, px, py); break
        case T.SIGN:       drawSign(ctx, px, py); break
        case T.NPC: {
          const npc = typeof raw === 'object' ? raw : (npcData?.[r * MAP_COLS + c])
          drawNPC(ctx, px, py, npc?.npc_type || 'default')
          break
        }
        case T.ENEMY: {
          const enemy = typeof raw === 'object' ? raw : (enemyData?.[r * MAP_COLS + c])
          drawEnemy(ctx, px, py, enemy?.enemy_type || 'bunny')
          break
        }
        case T.ITEM_SPOT:  drawItemSpot(ctx, px, py, frame); break
        default:           drawGrass(ctx, px, py)
      }
    }
  }
}

// -- Pandora-style pseudo-3D renderer (2026-07-02) --
// Supersedes the isometric track above per a design pivot — a different,
// non-isometric technique (Y-sorted top-down, painted textures, tall trees
// with real height via canopies drawn above the tile). Kept behind its own
// `window.__kq_pandoraDebug` flag and its own tile-size constant so it can
// be built up in stages without disturbing either the original flat
// renderer or the (now-superseded, left in place) isometric renderer.
export const PANDORA_TILE = 32

const P = {
  GRASS_BASE:    '#5a8a3c',
  GRASS_DOT:     '#3f6b28',
  GRASS_HILITE:  '#7aac54',
  PATH_BASE:     '#c8a96e',
  PATH_LIGHT:    '#d8bd8a',
  PATH_DOT:      '#9a7d4e',
  TALL_A:        '#4a7a2c',
  TALL_B:        '#6ab04c',
  WATER_BASE:    '#2a6aaa',
  WATER_SHIMMER: '#4a8acc',
}

// -- Pandora ground drawers (Stage 1 — flat ground layer only, no standing
// objects/entities yet; those land in later stages alongside the Y-sort
// depth system) --

function drawPandoraGrass(ctx, px, py, col, row) {
  ctx.fillStyle = P.GRASS_BASE
  ctx.fillRect(px, py, PANDORA_TILE, PANDORA_TILE)

  // 3-5 stable per-tile speckle dots (hashed from col/row, not per-frame
  // random, so the texture doesn't flicker every frame).
  const h = tileHash(col, row)
  ctx.fillStyle = P.GRASS_DOT
  const dotCount = 3 + (h % 3)
  for (let i = 0; i < dotCount; i++) {
    const dh = tileHash(col * 7 + i, row * 13 + i * 3)
    const dx = 3 + (dh % (PANDORA_TILE - 6))
    const dy = 3 + ((dh * 5) % (PANDORA_TILE - 6))
    ctx.fillRect(px + dx, py + dy, 2, 2)
  }

  // Faint highlight stripe along the top edge.
  ctx.fillStyle = P.GRASS_HILITE
  ctx.globalAlpha = 0.35
  ctx.fillRect(px, py, PANDORA_TILE, 2)
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

function drawPandoraTree(ctx, px, py) {
  const cx = px + PANDORA_TILE / 2
  const groundY = py + PANDORA_TILE - 4

  drawPandoraShadow(ctx, cx, groundY, 40, 12)

  // Trunk, base planted at the ground point.
  const trunkW = 8, trunkH = 14
  ctx.fillStyle = '#4a2f18'
  ctx.fillRect(cx - trunkW / 2, groundY - trunkH, trunkW, trunkH)

  // Canopy — rim + fill, centered ~18px above the trunk top. Intentionally
  // extends above the tile's top boundary (real height); Y-sort in the
  // caller (not row order) is what makes this occlude correctly against
  // neighboring standing objects.
  const canopyR = 22
  const canopyCy = groundY - trunkH - 18
  ctx.fillStyle = '#2d6a1e'
  ctx.beginPath()
  ctx.arc(cx, canopyCy, canopyR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3d8a28'
  ctx.beginPath()
  ctx.arc(cx, canopyCy, canopyR - 3, 0, Math.PI * 2)
  ctx.fill()

  // Upper-left highlight blob (ambient light source convention).
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#5ab040'
  ctx.beginPath()
  ctx.arc(cx - 7, canopyCy - 7, 12, 0, Math.PI * 2)
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

  const bodyColor = npcType === 'owl' ? '#8B6914' : '#40a860'
  const bodyCy = groundY - 8
  pandoraFriendlyBody(ctx, cx, bodyCy, 7, 8, bodyColor)
  const headCy = bodyCy - 11
  pandoraFriendlyBody(ctx, cx, headCy, 7, 6.5, npcType === 'owl' ? '#8B6914' : '#ffe0a0')
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
  const startCol = Math.max(0, Math.floor(camX / PANDORA_TILE))
  const startRow = Math.max(0, Math.floor(camY / PANDORA_TILE))
  const endCol = Math.min(MAP_COLS, Math.ceil((camX + viewW) / PANDORA_TILE))
  const endRow = Math.min(MAP_ROWS, Math.ceil((camY + viewH) / PANDORA_TILE))

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
        default:      drawPandoraGrass(ctx, px, py, c, r) // includes TREE/WALL ground + fallback
      }

      if (tileType === T.TREE) {
        standing.push({ y: py + PANDORA_TILE - 4, draw: () => drawPandoraTree(ctx, px, py) })
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

// -- Isometric tile renderer --
// Stage 1 drew every tile as a flat grass diamond. Stage 2 branches on the
// real tile type and gives trees/tall-grass/signs a "raised" element above
// the diamond. Raised elements are drawn in a SEPARATE second pass over the
// whole map, after every floor diamond has already been painted — this is
// what makes a tree's canopy visually occlude a "nearer" tile correctly
// instead of getting clipped by that tile's flat floor diamond (which is
// what would happen if floor + raised parts were interleaved in one
// row-major pass, since a later-drawn floor tile would paint over any
// earlier canopy pixels landing in its footprint). Within the raised pass,
// row0→rowN-1 order is preserved so nearer raised objects (trees, in
// particular) still correctly overlap farther ones when they intersect.

// Draws one tile as a 4-point iso diamond at iso-pixel origin (px, py) — the
// top-left corner of the diamond's bounding box, matching isoProject()'s output.
function drawIsoTile(ctx, px, py, fillColor) {
  const top    = { x: px + ISO_W / 2, y: py }
  const right  = { x: px + ISO_W,     y: py + ISO_H / 2 }
  const bottom = { x: px + ISO_W / 2, y: py + ISO_H }
  const left   = { x: px,             y: py + ISO_H / 2 }

  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.moveTo(top.x, top.y)
  ctx.lineTo(right.x, right.y)
  ctx.lineTo(bottom.x, bottom.y)
  ctx.lineTo(left.x, left.y)
  ctx.closePath()
  ctx.fill()

  // Subtle top-left highlight (simulated light from upper-left) so adjacent
  // tiles read as distinct diamonds rather than a solid blob.
  ctx.strokeStyle = C.ISO_HIGHLIGHT
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(left.x, left.y)
  ctx.lineTo(top.x, top.y)
  ctx.lineTo(right.x, right.y)
  ctx.stroke()
}

// Deterministic small-int hash for a tile coordinate — used to keep per-tile
// texture (path dirt speckles) stable across frames instead of flickering.
function tileHash(col, row) {
  return (col * 31 + row * 17) % 97
}

// -- Floor drawers (pass 1 — flat, confined to the diamond) --

function drawIsoGrass(ctx, px, py) {
  drawIsoTile(ctx, px, py, C.GRASS)
}

function drawIsoPath(ctx, px, py, col, row) {
  drawIsoTile(ctx, px, py, C.PATH)
  const h = tileHash(col, row)
  const cx = px + ISO_W / 2
  const cy = py + ISO_H / 2
  ctx.fillStyle = C.PATH_DARK
  ctx.fillRect(cx - 7 + (h % 6), cy - 3 + (h % 3), 2, 1)
  ctx.fillRect(cx + 2 + (h % 5), cy + 1 + (h % 2), 2, 1)
}

function drawIsoTallBase(ctx, px, py) {
  drawIsoTile(ctx, px, py, C.TALL)
}

function drawIsoTreeBase(ctx, px, py) {
  drawIsoTile(ctx, px, py, C.TREE_BG)
}

function drawIsoWater(ctx, px, py, frame) {
  drawIsoTile(ctx, px, py, frame < 30 ? C.WATER_A : C.WATER_B)
}

function drawIsoFlower(ctx, px, py) {
  // Flush with the tile surface (not a raised element) — petals flattened
  // onto the diamond top, centered on the tile.
  drawIsoTile(ctx, px, py, C.GRASS)
  const cx = px + ISO_W / 2
  const cy = py + ISO_H / 2
  ctx.fillStyle = C.FLOWER_PET
  const petals = [[0, -3], [3, 0], [0, 3], [-3, 0]]
  for (const [dx, dy] of petals) ctx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2)
  ctx.fillStyle = C.FLOWER_CTR
  ctx.fillRect(cx - 1, cy - 1, 2, 2)
}

function drawIsoSignBase(ctx, px, py) {
  drawIsoTile(ctx, px, py, C.GRASS)
}

function drawIsoFloor(ctx, tileType, px, py, col, row, frame) {
  switch (tileType) {
    case T.GRASS:  drawIsoGrass(ctx, px, py); break
    case T.PATH:   drawIsoPath(ctx, px, py, col, row); break
    case T.TALL:   drawIsoTallBase(ctx, px, py); break
    case T.TREE:   drawIsoTreeBase(ctx, px, py); break
    case T.WATER:  drawIsoWater(ctx, px, py, frame); break
    case T.FLOWER: drawIsoFlower(ctx, px, py); break
    case T.SIGN:   drawIsoSignBase(ctx, px, py); break
    // T.WALL is declared but never placed by any generator in tileMaps.js
    // (verified — only referenced in canMove's collision list) — no
    // dedicated iso visual added for it. T.EXIT_*/T.ITEM_SPOT/T.NPC/T.ENEMY
    // fall through to the grass default too: exits/item-spot iso shapes are
    // out of this stage's scope, and NPC/enemy tiles must render as plain
    // grass underneath since their sprites aren't drawn until a later stage.
    default:       drawIsoGrass(ctx, px, py)
  }
}

// -- Raised drawers (pass 2 — extend upward from the tile's visual "ground"
// anchor, i.e. the diamond's center depth, not its top vertex) --

function drawIsoTallBlades(ctx, px, py) {
  const cx = px + ISO_W / 2
  const groundY = py + ISO_H / 2
  ctx.strokeStyle = C.TALL_STRIPE
  ctx.lineWidth = 2
  const blades = [[-5, 6], [0, 8], [5, 6]]
  for (const [dx, h] of blades) {
    ctx.beginPath()
    ctx.moveTo(cx + dx, groundY)
    ctx.lineTo(cx + dx, groundY - h)
    ctx.stroke()
  }
}

function drawIsoTreeCanopy(ctx, px, py) {
  const cx = px + ISO_W / 2
  const groundY = py + ISO_H / 2

  // Trunk: small dark box, base planted at the tile's ground anchor
  const trunkW = 4, trunkH = 8
  ctx.fillStyle = '#4a3018'
  ctx.fillRect(cx - trunkW / 2, groundY - trunkH, trunkW, trunkH)

  // Canopy: ellipse above the trunk, ~1.8x the tile (diamond) height tall —
  // this is the part that spills upward into neighboring tiles' screen-space
  // and relies on the two-pass draw order above to occlude correctly.
  const canopyH = ISO_H * 1.8
  const canopyW = ISO_W * 0.85
  const canopyCy = groundY - trunkH - canopyH / 2 + 4
  ctx.fillStyle = C.TREE_IN
  ctx.beginPath()
  ctx.ellipse(cx, canopyCy, canopyW / 2, canopyH / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  // Darker underside for a touch of depth/shading
  ctx.fillStyle = C.TREE_BG
  ctx.beginPath()
  ctx.ellipse(cx, canopyCy + canopyH / 2 - 3, canopyW / 2 - 2, 4, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawIsoSignPost(ctx, px, py) {
  const cx = px + ISO_W / 2
  const groundY = py + ISO_H / 2

  ctx.fillStyle = C.SIGN_BODY
  ctx.fillRect(cx - 1, groundY - 8, 2, 8)
  // Board — a darker-left/lighter-right pseudo-3D box so it reads as a sign
  ctx.fillStyle = C.SIGN_BODY
  ctx.fillRect(cx - 4, groundY - 12, 8, 5)
  ctx.fillStyle = C.SIGN_LINE
  ctx.fillRect(cx - 3, groundY - 11, 6, 1)
  ctx.fillRect(cx - 3, groundY - 9, 4, 1)
}

function drawIsoRaised(ctx, tileType, px, py) {
  switch (tileType) {
    case T.TALL: drawIsoTallBlades(ctx, px, py); break
    case T.TREE: drawIsoTreeCanopy(ctx, px, py); break
    case T.SIGN: drawIsoSignPost(ctx, px, py); break
    default: break
  }
}

// Draws the full map every frame in back-to-front painter's-algorithm order
// (row 0 → MAP_ROWS-1, col 0 → MAP_COLS-1 within each row) — no viewport
// culling yet, matching the current tile-map's small entity count.
export function renderMapIso(ctx, tileMap, camX, camY, frame = 0) {
  ctx.fillStyle = C.ISO_BG
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const rows = tileMap?.length ?? MAP_ROWS

  // Pass 1 — every tile's flat floor diamond.
  for (let r = 0; r < rows; r++) {
    const cols = tileMap?.[r]?.length ?? MAP_COLS
    for (let c = 0; c < cols; c++) {
      const raw = tileMap?.[r]?.[c]
      const tileType = typeof raw === 'object' ? raw.type : raw
      const { px, py } = isoProject(c, r, camX, camY)
      drawIsoFloor(ctx, tileType, px, py, c, r, frame)
    }
  }

  // Pass 2 — raised decorations, drawn after ALL floors so they're never
  // clipped by a "closer" tile's flat diamond (see comment block above).
  for (let r = 0; r < rows; r++) {
    const cols = tileMap?.[r]?.length ?? MAP_COLS
    for (let c = 0; c < cols; c++) {
      const raw = tileMap?.[r]?.[c]
      const tileType = typeof raw === 'object' ? raw.type : raw
      const { px, py } = isoProject(c, r, camX, camY)
      drawIsoRaised(ctx, tileType, px, py)
    }
  }
}

// -- Player sprite --

const DIR_FRAMES = { down: 0, left: 1, right: 2, up: 3 }

export function renderPlayer(ctx, playerX, playerY, direction, walkFrame, eggColor, camX, camY) {
  const px = Math.round(playerX * TILE - camX)
  const py = Math.round(playerY * TILE - camY)

  const companion = window.__kq_companionEgg
  const off = getSpriteOff()
  if (off && companion) {
    const sCtx = off.getContext('2d')
    sCtx.imageSmoothingEnabled = false
    sCtx.clearRect(0, 0, 32, 32)
    renderEggSprite(sCtx, { ...companion, t: performance.now() / 1000, canvasSize: 32 })
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, px, py, TILE, TILE)
  }
}

// Iso counterpart of renderPlayer (Stage 3) — reprojects the same
// interpolated tile-space (playerX, playerY) through isoProject() every
// frame, so the existing walk-tween (still computed in tile-space floats in
// useWorldGameLoop.js, unchanged) glides smoothly across the diamond floor
// instead of snapping tile-to-tile. Anchors the sprite's bottom-center at
// the tile's visual "ground" point (px+ISO_W/2, py+ISO_H/2) — the same
// center-depth anchor used for tree trunks/sign posts in Stage 2 — so the
// egg reads as standing ON the diamond surface, extending upward from there.
export function renderPlayerIso(ctx, playerX, playerY, direction, walkFrame, eggColor, camX, camY) {
  const companion = window.__kq_companionEgg
  const off = getSpriteOff()
  if (!off || !companion) return

  const { px: tpx, py: tpy } = isoProject(playerX, playerY, camX, camY)
  const groundX = tpx + ISO_W / 2
  const groundY = tpy + ISO_H / 2

  const sCtx = off.getContext('2d')
  sCtx.imageSmoothingEnabled = false
  sCtx.clearRect(0, 0, 32, 32)
  renderEggSprite(sCtx, { ...companion, t: performance.now() / 1000, canvasSize: 32 })
  ctx.imageSmoothingEnabled = false

  const spriteW = 28
  const spriteH = 28
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

// -- Camera clamp (centers map when smaller than viewport) --

export function getCamera(playerX, playerY, viewW, viewH) {
  const mapPixW = MAP_COLS * TILE
  const mapPixH = MAP_ROWS * TILE
  // When map is narrower/shorter than viewport, center it (negative cam offsets map inward)
  const camX = mapPixW <= viewW
    ? -(viewW - mapPixW) / 2
    : Math.max(0, Math.min(playerX * TILE - viewW / 2, mapPixW - viewW))
  const camY = mapPixH <= viewH
    ? -(viewH - mapPixH) / 2
    : Math.max(0, Math.min(playerY * TILE - viewH / 2, mapPixH - viewH))
  return { camX, camY }
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
