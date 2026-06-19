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

// ── Fog-of-war (maze only) ───────────────────────────────────────────────────
// Solid darkness over the whole canvas, punched through with a flickering
// circular light radius centered on the player. No memory of lit areas.
export function drawMazeFog(ctx, playerPx, playerPy, frame, canvasW, canvasH) {
  const cx = playerPx + TILE / 2
  const cy = playerPy + TILE / 2

  // Candle-like flicker: two overlapping sines at different speeds/phases
  const flicker = Math.sin(frame * 0.15) * 3 + Math.sin(frame * 0.37 + 1.3) * 2
  const radius = 58 + flicker

  // Step 1: fill entire canvas with solid darkness
  ctx.save()
  ctx.fillStyle = 'rgba(8,4,14,0.96)'
  ctx.fillRect(0, 0, canvasW, canvasH)
  ctx.restore()

  // Step 2: punch a fully-transparent hole through the darkness using
  // destination-out. Full erasure through 55% of radius, soft feather only near edge.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  const eraseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  eraseGrad.addColorStop(0,    'rgba(0,0,0,1)')
  eraseGrad.addColorStop(0.55, 'rgba(0,0,0,1)')
  eraseGrad.addColorStop(0.85, 'rgba(0,0,0,0.6)')
  eraseGrad.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = eraseGrad
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Step 3: warm torch-light tint as a thin ring near the edge only —
  // NOT a filled disc, so it can't re-darken the transparent center.
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = `rgba(255,180,90,${0.25 + Math.max(0, flicker) * 0.03})`
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.78, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
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
