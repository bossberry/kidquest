/**
 * roomScene.js — shared, non-React ISOMETRIC room renderer + geometry helpers.
 *
 * FULL REWRITE (2026-07-02): the room is now a true 2:1 isometric interior —
 * a diamond floor (6×4 tiles) plus two back walls (a 4-tile "left" wall on the
 * visual left, a 6-tile "right" wall on the visual right), instead of the old
 * flat top-down 12-slot grid.
 *
 * One helper draws the same room art everywhere:
 *   • DecoratedRoom.jsx  — Home hero zone + Room editor base (large, small=false)
 *   • RoomVisit.jsx      — full-screen friend-room visit (large, small=false)
 *   • FriendsScreen card — 72×80 thumbnail (small=true)
 *
 * Decoupled from any companion/egg state — callers draw the egg separately.
 *
 * NEW roomLayout schema: keys are "{zone}_{a}_{b}" strings, values are item ids:
 *   floor:      "floor_{col}_{row}"        col 0-5, row 0-3   (z=0)
 *   left_wall:  "left_wall_{y}_{z}"         y   0-3, z   1-2   (4 wide × 2 tall)
 *   right_wall: "right_wall_{x}_{z}"        x   0-5, z   1-2   (6 wide × 2 tall)
 *
 * NOTE (deviation from brief, intentional): the brief labelled left=6-wide /
 * right=4-wide, but with the standard isoProject convention the 6-tile (x) wall
 * lands on the visual RIGHT and the 4-tile (y) wall on the visual LEFT. We keep
 * the projection convention exact and label zones by their real on-screen side
 * so the "ผนังซ้าย / ผนังขวา" tabs match what the child sees. Slot counts are
 * identical (20 wall slots), only the two walls' widths are swapped vs the brief.
 */
import { ROOM_ITEMS } from './roomItems.js'

export const FLOOR_COLS = 6   // x: 0-5
export const FLOOR_ROWS = 4   // y: 0-3
export const WALL_HEIGHT = 3  // walls rise z 0..3
export const WALL_Z_ROWS = [1, 2]  // the two placeable height rows

export const ZONES = ['floor', 'left_wall', 'right_wall']

// ── Room themes ──────────────────────────────────────────────────────────────
// Multi-room expansion (2026-07-05): each room carries a `theme`. THEME_PALETTES
// recolors the base floor/wall surfaces + drives a cheap per-frame ambient decor
// layer (ripples / flowers / rows / leaves / stars). `default` reproduces the
// original tan/cream room EXACTLY (byte-for-byte colors), so existing players'
// `main` room looks unchanged. All wall polish / vignette / ceiling glow stays on
// top of whatever base colors the theme provides. This is a self-contained system
// — intentionally NOT imported from tileEngine.js (the world-map theme engine).
export const ROOM_BLOCK_PRICE = 1000

// UI-facing metadata (icon-first for a pre-reader child). Order = purchase-sheet order.
export const ROOM_THEMES = [
  { id: 'default', nameTh: 'ห้องนอน',     icon: '🏠', price: 0 },
  { id: 'pool',    nameTh: 'สระว่ายน้ำ',  icon: '🏊', price: ROOM_BLOCK_PRICE },
  { id: 'garden',  nameTh: 'สวนดอกไม้',   icon: '🌸', price: ROOM_BLOCK_PRICE },
  { id: 'veggie',  nameTh: 'สวนผัก',      icon: '🥦', price: ROOM_BLOCK_PRICE },
  { id: 'forest',  nameTh: 'ป่า',         icon: '🌲', price: ROOM_BLOCK_PRICE },
  { id: 'space',   nameTh: 'อวกาศ',       icon: '🚀', price: ROOM_BLOCK_PRICE },
]
export function themeMeta(id) {
  return ROOM_THEMES.find(t => t.id === id) || ROOM_THEMES[0]
}

export const THEME_PALETTES = {
  default: {
    floorLight: '#D9BA8C', floorDark: '#CDA875', floorStroke: 'rgba(120,84,48,0.28)',
    floorVignette: 'rgba(30,16,6,0.32)',
    leftWall: '#F3E6D2', leftGrid: 'rgba(150,120,88,0.16)', leftBase: 'rgba(176,140,96,0.55)',
    rightWall: '#E7D3B4', rightGrid: 'rgba(140,110,78,0.16)', rightBase: 'rgba(160,126,84,0.55)',
    corner: 'rgba(90,60,32,0.28)', decor: 'none',
  },
  pool: {
    floorLight: '#4ab4ee', floorDark: '#2a8acc', floorStroke: 'rgba(20,80,140,0.30)',
    floorVignette: 'rgba(6,30,60,0.34)',
    leftWall: '#cfeefb', leftGrid: 'rgba(90,150,190,0.22)', leftBase: 'rgba(120,180,215,0.55)',
    rightWall: '#bfe4f5', rightGrid: 'rgba(80,140,180,0.22)', rightBase: 'rgba(110,170,205,0.55)',
    corner: 'rgba(30,90,130,0.28)', decor: 'pool',
  },
  garden: {
    floorLight: '#4a9a2a', floorDark: '#3a7a1a', floorStroke: 'rgba(30,70,15,0.30)',
    floorVignette: 'rgba(10,30,6,0.32)',
    leftWall: '#bfe4f7', leftGrid: 'rgba(120,170,200,0.20)', leftBase: 'rgba(150,120,80,0.55)',
    rightWall: '#aed8f2', rightGrid: 'rgba(110,160,190,0.20)', rightBase: 'rgba(140,112,74,0.55)',
    corner: 'rgba(40,80,30,0.28)', decor: 'garden',
  },
  veggie: {
    floorLight: '#5a3a1a', floorDark: '#4a2a0a', floorStroke: 'rgba(30,18,6,0.34)',
    floorVignette: 'rgba(18,10,2,0.34)',
    leftWall: '#bfe4f7', leftGrid: 'rgba(120,170,200,0.20)', leftBase: 'rgba(120,90,60,0.55)',
    rightWall: '#aed8f2', rightGrid: 'rgba(110,160,190,0.20)', rightBase: 'rgba(110,84,56,0.55)',
    corner: 'rgba(40,26,12,0.30)', decor: 'veggie',
  },
  forest: {
    floorLight: '#2a5a1a', floorDark: '#1a3a0a', floorStroke: 'rgba(12,30,6,0.34)',
    floorVignette: 'rgba(6,16,4,0.40)',
    leftWall: '#274d2a', leftGrid: 'rgba(30,60,30,0.30)', leftBase: 'rgba(40,60,30,0.55)',
    rightWall: '#1f3f22', rightGrid: 'rgba(24,50,24,0.30)', rightBase: 'rgba(32,52,24,0.55)',
    corner: 'rgba(10,26,8,0.34)', decor: 'forest',
  },
  space: {
    floorLight: '#0a0a2a', floorDark: '#0a0a1a', floorStroke: 'rgba(80,90,160,0.30)',
    floorVignette: 'rgba(2,2,10,0.45)',
    leftWall: '#0a0a18', leftGrid: 'rgba(80,90,160,0.22)', leftBase: 'rgba(40,44,80,0.55)',
    rightWall: '#070712', rightGrid: 'rgba(70,80,150,0.22)', rightBase: 'rgba(34,38,70,0.55)',
    corner: 'rgba(60,70,140,0.30)', decor: 'space',
  },
}
export function resolveThemePalette(theme) {
  return THEME_PALETTES[theme] || THEME_PALETTES.default
}

// Stable per-index pseudo-random in [0,1) — keeps decor placement flicker-free
// (same idea as tileEngine.js's tileHash, kept local so the two stay independent).
function sHash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
function px(ctx, x, y, w, h, col) {
  ctx.fillStyle = col
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)))
}

// ── Geometry ─────────────────────────────────────────────────────────────────
// Standard 2:1 iso projection. Scene bounding box spans 10*TH wide × 8*TH tall
// (derived from the floor + wall corner extremes), so we size TH to fit W×H.
export function computeRoomGeometry(W, H, small = false) {
  const pad = small ? 0.99 : 0.94
  const TH = Math.max(3, Math.min((W * pad) / 10, (H * pad) / 8))
  const TW = TH * 2
  const originX = W / 2 - TH
  const originY = H / 2 - TH
  const project = (x, y, z) => ({
    sx: originX + (x - y) * TW / 2,
    sy: originY + (x + y) * TH / 2 - z * TH,
  })
  return { TW, TH, originX, originY, project, W, H, small }
}

// Center of a slot (used for highlight + hit reference)
export function slotCenter(g, zone, a, b) {
  if (zone === 'floor')      return g.project(a + 0.5, b + 0.5, 0)
  if (zone === 'left_wall')  return g.project(0, a + 0.5, b + 0.5)
  if (zone === 'right_wall') return g.project(a + 0.5, 0, b + 0.5)
  return g.project(0, 0, 0)
}

// Bottom-center anchor where a furniture sprite "sits" (feet / hanging bottom)
function slotAnchor(g, zone, a, b) {
  if (zone === 'floor')      return g.project(a + 0.5, b + 0.5, 0)
  if (zone === 'left_wall')  return g.project(0, a + 0.5, b)
  if (zone === 'right_wall') return g.project(a + 0.5, 0, b)
  return g.project(0, 0, 0)
}

function floorQuad(g, c, r) {
  return [g.project(c, r, 0), g.project(c + 1, r, 0), g.project(c + 1, r + 1, 0), g.project(c, r + 1, 0)]
}
function leftWallQuad(g, a, z) {
  return [g.project(0, a, z), g.project(0, a + 1, z), g.project(0, a + 1, z + 1), g.project(0, a, z + 1)]
}
function rightWallQuad(g, a, z) {
  return [g.project(a, 0, z), g.project(a + 1, 0, z), g.project(a + 1, 0, z + 1), g.project(a, 0, z + 1)]
}
function zoneQuad(g, zone, a, b) {
  if (zone === 'floor')      return floorQuad(g, a, b)
  if (zone === 'left_wall')  return leftWallQuad(g, a, b)
  if (zone === 'right_wall') return rightWallQuad(g, a, b)
  return null
}

function pointInQuad(px, py, q) {
  let sign = 0
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4]
    const cross = (b.sx - a.sx) * (py - a.sy) - (b.sy - a.sy) * (px - a.sx)
    const s = Math.sign(cross)
    if (s !== 0) { if (sign === 0) sign = s; else if (s !== sign) return false }
  }
  return true
}

// Convert a tap (screen px) → { zone, a, b, key }, or null.
// When `zone` is provided, only that zone is tested (disambiguates overlapping
// wall/floor screen regions). When `zone` is falsy, all three zones are tested
// in visual-priority order (floor is drawn on top, so it wins ties) and the
// first hit is returned — this powers the "tap anywhere" editor flow.
export function hitTestZone(g, px, py, zone) {
  if (!zone) {
    for (const zn of ['floor', 'left_wall', 'right_wall']) {
      const hit = hitTestZone(g, px, py, zn)
      if (hit) return hit
    }
    return null
  }
  if (zone === 'floor') {
    for (let r = FLOOR_ROWS - 1; r >= 0; r--)
      for (let c = 0; c < FLOOR_COLS; c++)
        if (pointInQuad(px, py, floorQuad(g, c, r))) return { zone, a: c, b: r, key: `floor_${c}_${r}` }
  } else if (zone === 'left_wall') {
    for (const z of [...WALL_Z_ROWS].reverse())
      for (let a = 0; a < FLOOR_ROWS; a++)
        if (pointInQuad(px, py, leftWallQuad(g, a, z))) return { zone, a, b: z, key: `left_wall_${a}_${z}` }
  } else if (zone === 'right_wall') {
    for (const z of [...WALL_Z_ROWS].reverse())
      for (let a = 0; a < FLOOR_COLS; a++)
        if (pointInQuad(px, py, rightWallQuad(g, a, z))) return { zone, a, b: z, key: `right_wall_${a}_${z}` }
  }
  return null
}

export function parseSlotKey(key) {
  const m = /^(floor|left_wall|right_wall)_(\d+)_(\d+)$/.exec(key || '')
  if (!m) return null
  return { zone: m[1], a: +m[2], b: +m[3] }
}

// Enumerate every slot key of a zone (used by the editor for empty-slot hints)
export function zoneSlotKeys(zone) {
  const keys = []
  if (zone === 'floor') {
    for (let r = 0; r < FLOOR_ROWS; r++) for (let c = 0; c < FLOOR_COLS; c++) keys.push(`floor_${c}_${r}`)
  } else if (zone === 'left_wall') {
    for (const z of WALL_Z_ROWS) for (let a = 0; a < FLOOR_ROWS; a++) keys.push(`left_wall_${a}_${z}`)
  } else if (zone === 'right_wall') {
    for (const z of WALL_Z_ROWS) for (let a = 0; a < FLOOR_COLS; a++) keys.push(`right_wall_${a}_${z}`)
  }
  return keys
}

// ── Low-level fills ────────────────────────────────────────────────────────
function fillQuad(ctx, pts, color, stroke) {
  ctx.beginPath()
  ctx.moveTo(pts[0].sx, pts[0].sy)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke() }
}

// ── Room surfaces ────────────────────────────────────────────────────────────
function drawFloor(ctx, g, P) {
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const light = (c + r) % 2 === 0
      fillQuad(ctx, floorQuad(g, c, r), light ? P.floorLight : P.floorDark, P.floorStroke)
    }
  }
  if (!g.small) drawFloorDecor(ctx, g, P.decor)
  if (g.small) return
  // Subtle warm vignette: darker toward the far corners of the floor diamond.
  const corners = [g.project(0, 0, 0), g.project(FLOOR_COLS, 0, 0), g.project(FLOOR_COLS, FLOOR_ROWS, 0), g.project(0, FLOOR_ROWS, 0)]
  const cx = (corners[0].sx + corners[2].sx) / 2, cy = (corners[0].sy + corners[2].sy) / 2
  const radius = Math.max(g.TW * FLOOR_COLS, g.TH * FLOOR_ROWS) * 0.6
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(corners[0].sx, corners[0].sy)
  for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].sx, corners[i].sy)
  ctx.closePath()
  ctx.clip()
  const vg = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, P.floorVignette)
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, g.W, g.H)
  ctx.restore()
}

// Cheap per-frame ambient floor decoration, keyed on the theme's `decor` tag.
// Placement is seeded (sHash) so it never flickers; only ripples gently animate.
function drawFloorDecor(ctx, g, decor) {
  if (!decor || decor === 'none') return
  const now = Date.now() / 1000
  const u = g.TH   // one iso tile-height as a size unit
  if (decor === 'veggie') {
    // planting furrows: darker line along each floor row seam
    ctx.save(); ctx.strokeStyle = 'rgba(20,12,4,0.35)'; ctx.lineWidth = Math.max(1, u * 0.05)
    for (let r = 0; r <= FLOOR_ROWS; r++) {
      const a = g.project(0, r, 0), b = g.project(FLOOR_COLS, r, 0)
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
    }
    ctx.restore()
    // little green sprouts dotted along the rows
    for (let r = 0; r < FLOOR_ROWS; r++) for (let c = 0; c < FLOOR_COLS; c++) {
      if (sHash(c * 13 + r * 29) < 0.55) continue
      const p = g.project(c + 0.5, r + 0.75, 0)
      px(ctx, p.sx - u * 0.03, p.sy - u * 0.16, u * 0.06, u * 0.16, '#5fae3a')
      px(ctx, p.sx - u * 0.11, p.sy - u * 0.12, u * 0.09, u * 0.05, '#6fbe4a')
    }
    return
  }
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const h = sHash(c * 31 + r * 7 + 1)
      const p = g.project(c + 0.5, r + 0.5, 0)
      if (decor === 'pool') {
        // gentle ripple squiggle — two short dashes that drift horizontally
        const ph = Math.sin(now * 1.3 + h * 6.28)
        const dx = ph * u * 0.10
        ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * (ph * 0.5 + 0.5)
        px(ctx, p.sx - u * 0.18 + dx, p.sy - u * 0.02, u * 0.14, Math.max(1, u * 0.04), '#bfeaff')
        px(ctx, p.sx + u * 0.02 - dx, p.sy + u * 0.06, u * 0.12, Math.max(1, u * 0.04), '#dff4ff')
        ctx.restore()
      } else if (decor === 'garden') {
        if (h < 0.5) continue
        const petal = ['#ff6fae', '#ffd23f', '#ff8f4a', '#ffffff'][Math.floor(sHash(c * 5 + r * 9) * 4)]
        const s = u * 0.05
        px(ctx, p.sx - s * 1.5, p.sy - s * 0.5, s, s, petal)
        px(ctx, p.sx + s * 0.5, p.sy - s * 0.5, s, s, petal)
        px(ctx, p.sx - s * 0.5, p.sy - s * 1.5, s, s, petal)
        px(ctx, p.sx - s * 0.5, p.sy + s * 0.5, s, s, petal)
        px(ctx, p.sx - s * 0.5, p.sy - s * 0.5, s, s, '#ffe27a')
      } else if (decor === 'forest') {
        if (h < 0.45) continue
        const leaf = h < 0.7 ? '#1f4a12' : '#3a6a1f'
        const s = u * 0.06
        px(ctx, p.sx - s, p.sy, s * 2, s, leaf)
        px(ctx, p.sx - s * 0.5, p.sy - s * 0.6, s, s * 0.6, leaf)
      } else if (decor === 'space') {
        // faint floor-grid node glints at some intersections
        if (h < 0.7) continue
        const tw = 0.4 + 0.6 * (Math.sin(now * 2 + h * 12) * 0.5 + 0.5)
        ctx.save(); ctx.globalAlpha = tw * 0.5
        px(ctx, p.sx - 1, p.sy - 1, 2, 2, '#9fb4ff')
        ctx.restore()
      }
    }
  }
}

// Twinkling star dots on a wall face (space theme only)
function drawWallStars(ctx, g, face) {
  const minX = Math.min(...face.map(p => p.sx)), maxX = Math.max(...face.map(p => p.sx))
  const minY = Math.min(...face.map(p => p.sy)), maxY = Math.max(...face.map(p => p.sy))
  const now = Date.now() / 1000
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(face[0].sx, face[0].sy)
  for (let i = 1; i < face.length; i++) ctx.lineTo(face[i].sx, face[i].sy)
  ctx.closePath()
  ctx.clip()
  const N = 26
  for (let i = 0; i < N; i++) {
    const sx = minX + sHash(i * 3 + 1) * (maxX - minX)
    const sy = minY + sHash(i * 7 + 2) * (maxY - minY)
    const tw = Math.sin(now * 2 + i) * 0.5 + 0.5
    ctx.globalAlpha = 0.25 + 0.6 * tw
    px(ctx, sx, sy, tw > 0.75 ? 2 : 1, tw > 0.75 ? 2 : 1, '#ffffff')
  }
  ctx.restore()
}

// Subtle wallpaper texture + top-edge "ceiling" shadow strip, clipped to a wall face.
// Full-size render path only — skipped for the small thumbnail where it'd just read muddy.
function wallPolish(ctx, g, face) {
  if (g.small) return
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(face[0].sx, face[0].sy)
  for (let i = 1; i < face.length; i++) ctx.lineTo(face[i].sx, face[i].sy)
  ctx.closePath()
  ctx.clip()
  const minX = Math.min(...face.map(p => p.sx)), maxX = Math.max(...face.map(p => p.sx))
  const minY = Math.min(...face.map(p => p.sy)), maxY = Math.max(...face.map(p => p.sy))
  // faint diagonal stripe wallpaper texture
  ctx.strokeStyle = 'rgba(120,90,60,0.05)'
  ctx.lineWidth = 1
  const span = (maxX - minX) + (maxY - minY)
  for (let d = 0; d < span; d += 9) {
    ctx.beginPath()
    ctx.moveTo(minX + d, minY)
    ctx.lineTo(minX + d - (maxY - minY), maxY)
    ctx.stroke()
  }
  // dark gradient strip along the top edge (implies a ceiling corner)
  const topGrad = ctx.createLinearGradient(0, minY, 0, minY + (maxY - minY) * 0.22)
  topGrad.addColorStop(0, 'rgba(20,10,5,0.28)')
  topGrad.addColorStop(1, 'rgba(20,10,5,0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(minX, minY, maxX - minX, (maxY - minY) * 0.22)
  ctx.restore()
}

function drawLeftWall(ctx, g, P) {
  // back-left wall face (x = 0, y 0..FLOOR_ROWS, z 0..WALL_HEIGHT)
  const face = [
    g.project(0, 0, 0), g.project(0, FLOOR_ROWS, 0),
    g.project(0, FLOOR_ROWS, WALL_HEIGHT), g.project(0, 0, WALL_HEIGHT),
  ]
  fillQuad(ctx, face, P.leftWall)
  wallPolish(ctx, g, face)
  if (!g.small && P.decor === 'space') drawWallStars(ctx, g, face)
  // faint tile grid
  ctx.strokeStyle = P.leftGrid; ctx.lineWidth = 1
  for (let y = 1; y < FLOOR_ROWS; y++) {
    const a = g.project(0, y, 0), b = g.project(0, y, WALL_HEIGHT)
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
  }
  for (let z = 1; z < WALL_HEIGHT; z++) {
    const a = g.project(0, 0, z), b = g.project(0, FLOOR_ROWS, z)
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
  }
  // baseboard along the floor edge
  const bb = [
    g.project(0, 0, 0), g.project(0, FLOOR_ROWS, 0),
    g.project(0, FLOOR_ROWS, 0.28), g.project(0, 0, 0.28),
  ]
  fillQuad(ctx, bb, P.leftBase)
}

function drawRightWall(ctx, g, P) {
  // back-right wall face (y = 0, x 0..FLOOR_COLS, z 0..WALL_HEIGHT) — slightly darker
  const face = [
    g.project(0, 0, 0), g.project(FLOOR_COLS, 0, 0),
    g.project(FLOOR_COLS, 0, WALL_HEIGHT), g.project(0, 0, WALL_HEIGHT),
  ]
  fillQuad(ctx, face, P.rightWall)
  wallPolish(ctx, g, face)
  if (!g.small && P.decor === 'space') drawWallStars(ctx, g, face)
  ctx.strokeStyle = P.rightGrid; ctx.lineWidth = 1
  for (let x = 1; x < FLOOR_COLS; x++) {
    const a = g.project(x, 0, 0), b = g.project(x, 0, WALL_HEIGHT)
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
  }
  for (let z = 1; z < WALL_HEIGHT; z++) {
    const a = g.project(0, 0, z), b = g.project(FLOOR_COLS, 0, z)
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
  }
  const bb = [
    g.project(0, 0, 0), g.project(FLOOR_COLS, 0, 0),
    g.project(FLOOR_COLS, 0, 0.28), g.project(0, 0, 0.28),
  ]
  fillQuad(ctx, bb, P.rightBase)
  // back-corner shadow line (vertical edge where the two walls meet)
  const c0 = g.project(0, 0, 0), c1 = g.project(0, 0, WALL_HEIGHT)
  ctx.strokeStyle = P.corner; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(c0.sx, c0.sy); ctx.lineTo(c1.sx, c1.sy); ctx.stroke()
}

// ── Editor overlays: empty-slot hints + selected highlight ───────────────────
function drawZoneHints(ctx, g, zone, layout) {
  const keys = zoneSlotKeys(zone)
  for (const key of keys) {
    if (layout[key]) continue
    const p = parseSlotKey(key)
    const q = zoneQuad(g, zone, p.a, p.b)
    if (!q) continue
    fillQuad(ctx, q, 'rgba(255,210,63,0.10)', 'rgba(255,210,63,0.42)')
  }
}

function drawHighlight(ctx, g, key) {
  const p = parseSlotKey(key)
  if (!p) return
  const q = zoneQuad(g, p.zone, p.a, p.b)
  if (!q) return
  fillQuad(ctx, q, 'rgba(255,210,63,0.34)', 'rgba(255,210,63,0.9)')
}

// Room-editor-only: faint pulsing "+" on every empty slot across all three zones,
// and a soft glow behind every occupied slot. `opacity` is driven by Room.jsx's
// own rAF fade loop — this function is purely a stateless draw at that opacity.
function drawTapHints(ctx, g, layout, opacity) {
  if (opacity <= 0) return
  for (const zone of ZONES) {
    for (const key of zoneSlotKeys(zone)) {
      const p = parseSlotKey(key)
      const c = slotCenter(g, zone, p.a, p.b)
      if (layout[key]) {
        // soft glow behind a placed item
        ctx.save()
        ctx.globalAlpha = opacity * 0.5
        const glowR = g.TH * 0.9
        const glow = ctx.createRadialGradient(c.sx, c.sy, 0, c.sx, c.sy, glowR)
        glow.addColorStop(0, 'rgba(255,210,63,0.28)')
        glow.addColorStop(1, 'rgba(255,210,63,0)')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(c.sx, c.sy, glowR, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      } else {
        ctx.save()
        ctx.globalAlpha = opacity * 0.3
        ctx.strokeStyle = '#FFD23F'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        const s = Math.max(4, g.TH * 0.16)
        ctx.beginPath()
        ctx.moveTo(c.sx - s, c.sy); ctx.lineTo(c.sx + s, c.sy)
        ctx.moveTo(c.sx, c.sy - s); ctx.lineTo(c.sx, c.sy + s)
        ctx.stroke()
        ctx.restore()
      }
    }
  }
}

// ── Furniture ────────────────────────────────────────────────────────────────
// bounceKey/bounceScale: Room.jsx-only "just placed" pop animation — the one
// matching slot is drawn scaled up/down around its anchor point for a brief
// window after placement. Both default to no-op for all other callers.
function drawFloorFurniture(ctx, g, layout, bounceKey, bounceScale) {
  // back-to-front so nearer items overlap farther ones
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const key = `floor_${c}_${r}`
      const id = layout[key]
      if (!id) continue
      const item = ROOM_ITEMS.find(i => i.id === id)
      if (!item) continue
      const p = slotAnchor(g, 'floor', c, r)
      ctx.save()
      if (key === bounceKey) { ctx.translate(p.sx, p.sy); ctx.scale(bounceScale, bounceScale); ctx.translate(-p.sx, -p.sy) }
      item.draw(ctx, p.sx, p.sy, g.TW)
      ctx.restore()
    }
  }
}

function drawWallFurniture(ctx, g, layout, zone, bounceKey, bounceScale) {
  const skew = zone === 'left_wall' ? -(g.TH / g.TW) : (g.TH / g.TW) // ±0.5 → matches wall slope
  const n = zone === 'left_wall' ? FLOOR_ROWS : FLOOR_COLS
  for (const z of WALL_Z_ROWS) {
    for (let a = 0; a < n; a++) {
      const key = `${zone}_${a}_${z}`
      const id = layout[key]
      if (!id) continue
      const item = ROOM_ITEMS.find(i => i.id === id)
      if (!item) continue
      const p = slotAnchor(g, zone, a, z)
      // soft hanging shadow — wall items have no built-in contact shadow like floor items do
      ctx.save()
      ctx.globalAlpha = 0.22
      const shR = g.TW * 0.28
      const sh = ctx.createRadialGradient(p.sx, p.sy + shR * 0.3, 0, p.sx, p.sy + shR * 0.3, shR)
      sh.addColorStop(0, '#000000')
      sh.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = sh
      ctx.beginPath(); ctx.arc(p.sx, p.sy + shR * 0.3, shR, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      ctx.save()
      ctx.transform(1, skew, 0, 1, p.sx, p.sy)
      if (key === bounceKey) ctx.scale(bounceScale, bounceScale)
      item.draw(ctx, 0, 0, g.TW)
      ctx.restore()
    }
  }
}

/**
 * drawRoomScene(ctx, { W, H, roomLayout, small, hint, activeZone, selectedKey,
 *                       showTapHints, hintOpacity, bounceKey, bounceScale })
 *   activeZone   — editor only: draws faint yellow outlines on that zone's empty slots
 *   selectedKey  — editor only: strong yellow highlight on the currently selected slot
 *   showTapHints — Room.jsx editor only: when true, draws the all-zone "+" tap hints
 *                  (see drawTapHints). All other callers (DecoratedRoom, RoomVisit,
 *                  the FriendsScreen thumbnail via RoomScene.jsx) leave this false.
 *   hintOpacity  — 0..1 opacity for the tap hints, driven by Room.jsx's own rAF fade loop
 *   bounceKey/bounceScale — Room.jsx-only "just placed" pop animation on one slot
 */
export function drawRoomScene(ctx, {
  W, H, roomLayout, small = false, hint = true, activeZone = null, selectedKey = null,
  showTapHints = false, hintOpacity = 0, bounceKey = null, bounceScale = 1, theme = 'default',
}) {
  const layout = roomLayout ?? {}
  const P = resolveThemePalette(theme)
  const g = computeRoomGeometry(W, H, small)

  // soft backdrop so margins blend with the app's dark theme
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#171232')
  bg.addColorStop(1, '#0e0b22')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // surfaces (back → front): right wall, left wall, floor
  drawRightWall(ctx, g, P)
  drawLeftWall(ctx, g, P)
  drawFloor(ctx, g, P)

  if (!small) {
    // faint warm "ceiling light" ambient glow near the top-center of the scene
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const lx = W / 2, ly = H * 0.12, lr = Math.max(W, H) * 0.5
    const amb = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr)
    amb.addColorStop(0, 'rgba(255,214,150,0.10)')
    amb.addColorStop(1, 'rgba(255,214,150,0)')
    ctx.fillStyle = amb
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }

  if (activeZone) drawZoneHints(ctx, g, activeZone, layout)

  // furniture: wall items first (behind), then floor items row-by-row
  drawWallFurniture(ctx, g, layout, 'right_wall', bounceKey, bounceScale)
  drawWallFurniture(ctx, g, layout, 'left_wall', bounceKey, bounceScale)
  drawFloorFurniture(ctx, g, layout, bounceKey, bounceScale)

  if (showTapHints) drawTapHints(ctx, g, layout, hintOpacity)

  if (selectedKey) drawHighlight(ctx, g, selectedKey)

  if (hint && !small && Object.keys(layout).length === 0 && !activeZone) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('แต่งห้องได้ที่เมนู ห้อง', W / 2, H - 14)
    ctx.textAlign = 'left'
  }
}
