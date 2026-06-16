// Tile engine — GB-palette canvas renderer for Green Meadow

import { drawCreature } from './creatureAlgorithm.js'

// Cached offscreen canvas — reused every frame to avoid per-frame GC pressure
let _playerOff = null
function getPlayerOff() {
  if (typeof document === 'undefined') return null
  if (!_playerOff) {
    _playerOff = document.createElement('canvas')
    _playerOff.width = 16
    _playerOff.height = 16
  }
  return _playerOff
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

// -- Player sprite --

const DIR_FRAMES = { down: 0, left: 1, right: 2, up: 3 }

export function renderPlayer(ctx, playerX, playerY, direction, walkFrame, eggColor, camX, camY) {
  const px = Math.round(playerX * TILE - camX)
  const py = Math.round(playerY * TILE - camY)

  const off = getPlayerOff()
  if (off) {
    drawCreature(off, window.__kq_activeCreatureSeed ?? 0, window.__kq_activeCreatureStats ?? {})
    ctx.drawImage(off, px, py, TILE, TILE)
  }
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
