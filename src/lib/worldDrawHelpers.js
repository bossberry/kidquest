import { T, MAP_ROWS, MAP_COLS } from './tileEngine.js'

const TILE = 16 // px per tile (matches tileEngine TILE constant)

// ── Chest pixel art drawing ──────────────────────────────────────────────────

export function drawChest(ctx, x, y, frame) {
  const s = TILE
  // Body
  ctx.fillStyle = '#8b5e3c'
  ctx.fillRect(x + 2, y + 5, s - 4, s - 7)
  // Lid
  ctx.fillStyle = '#a0713a'
  ctx.fillRect(x + 2, y + 2, s - 4, 5)
  // Gold trim on lid
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(x + 2, y + 6, s - 4, 1)
  // Gold lock
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(x + Math.floor(s / 2) - 1, y + 7, 3, 3)
  // Sparkle — alternates every 30 frames
  ctx.fillStyle = frame % 60 < 30 ? 'rgba(255,255,255,0.9)' : 'rgba(255,215,0,0.5)'
  ctx.fillRect(x + Math.floor(s / 2) - 1, y - 2, 2, 2)
}

// ── Pandora-style chest (2026-07-02, Stage 5/6) ───────────────────────────────
// Separate from drawChest() above — that stays untouched as the flat
// renderer's chest. Anchored at a ground-contact point like every other
// Pandora standing object (trees/rocks/enemies/player), with a matching
// drop shadow.

export function drawPandoraChest(ctx, cx, groundY, frame) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(cx, groundY, 10, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  const w = 18, h = 12
  const top = groundY - h

  // Box body
  ctx.fillStyle = '#8a5a2a'
  ctx.fillRect(cx - w / 2, top + 5, w, h - 5)
  // Lid (darker) with a lighter top face for a touch of 3D perspective
  ctx.fillStyle = '#6a4218'
  ctx.fillRect(cx - w / 2, top, w, 6)
  ctx.fillStyle = '#a97638'
  ctx.fillRect(cx - w / 2 + 1, top, w - 2, 2)
  // Metal clasp
  ctx.fillStyle = frame % 60 < 30 ? '#ffd700' : '#e0b400'
  ctx.beginPath()
  ctx.arc(cx, top + 6, 1.8, 0, Math.PI * 2)
  ctx.fill()
}

// ── Chest spawning ────────────────────────────────────────────────────────────

export function spawnChests(tileMap, enemyDefs) {
  if (!tileMap) return []
  const enemyPositions = new Set((enemyDefs || []).map(e => `${e.col},${e.row}`))
  const candidates = []
  for (let r = 2; r < tileMap.length - 2; r++) {
    for (let c = 2; c < tileMap[r].length - 2; c++) {
      const raw = tileMap[r][c]
      const tileType = typeof raw === 'object' ? raw.type : raw
      if ((tileType === T.GRASS || tileType === T.FLOWER) && !enemyPositions.has(`${c},${r}`)) {
        candidates.push({ col: c, row: r })
      }
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const count = 2 + Math.floor(Math.random() * 2)
  return candidates.slice(0, count).map((pos, i) => ({
    col: pos.col, row: pos.row,
    id: `chest_${Date.now()}_${i}`,
    opened: false,
  }))
}

export const STAGE_COLORS = ['#78c878','#58b878','#38a8c8','#5888e8','#8858e8','#d840d0','#e86040','#f0a830','#ffd040']

// ── Player glow rendering ────────────────────────────────────────────────────

export function drawPlayerGlow(ctx, px, py, frame) {
  const cx = px + TILE / 2
  const cy = py + TILE / 2
  const pulse = (Math.sin(frame * 0.06) + 1) / 2

  ctx.strokeStyle = `rgba(255,255,180,${0.15 + pulse * 0.50})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, TILE * 0.85, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = `rgba(255,255,220,${0.30 + pulse * 0.40})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, TILE * 0.58, 0, Math.PI * 2)
  ctx.stroke()
}

// ── Maze portal rendering ────────────────────────────────────────────────────

export function drawMazePortal(ctx, x, y, frame) {
  const s = TILE
  const cx = x + s / 2
  const cy = y + s / 2
  const pulse = (Math.sin(frame * 0.08) + 1) / 2

  // Outer glow rings
  ctx.strokeStyle = `rgba(160,60,220,${0.25 + pulse * 0.35})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, s * 0.9, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = `rgba(200,120,255,${0.4 + pulse * 0.4})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, s * 0.6, 0, Math.PI * 2)
  ctx.stroke()

  // Swirling core
  ctx.fillStyle = `rgba(120,40,180,${0.7 + pulse * 0.3})`
  ctx.beginPath()
  ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = `rgba(220,160,255,${0.6 + pulse * 0.4})`
  ctx.beginPath()
  ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2)
  ctx.fill()

  // Orbiting sparkle particles
  const sparkleAngle = (frame * 0.05) % (Math.PI * 2)
  for (let i = 0; i < 3; i++) {
    const a = sparkleAngle + (i * Math.PI * 2 / 3)
    const sx = cx + Math.cos(a) * s * 0.75
    const sy = cy + Math.sin(a) * s * 0.75
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(sx - 1, sy - 1, 2, 2)
  }
}


export function getOwlLines(name) {
  return [
    `สวัสดี ${name}! ข้าคือ ศาสตราจารย์นกฮูก`,
    'หญ้าสูงนั้น... อาจมีสัตว์ซ่อนอยู่นะ!',
  ]
}

export const SIGN_LINES = [
  '→ ทาวน์สแควร์',
  '← ทุ่งดอกไม้',
  '↑ ยังไปไม่ได้...',
]

export function findSpecials(tileMap) {
  const npcs = [], signs = []
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const raw = tileMap[r]?.[c]
      const type = typeof raw === 'object' ? raw.type : raw
      if (type === T.NPC)  npcs.push({ col: c, row: r, data: raw })
      if (type === T.SIGN) signs.push({ col: c, row: r })
    }
  }
  return { npcs, signs }
}
