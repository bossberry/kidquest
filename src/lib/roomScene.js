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

// Convert a tap (screen px) → { zone, a, b, key } within the given active zone,
// or null. Restricting to one zone disambiguates overlapping wall/floor screen
// regions (that is exactly what the zone-switcher tabs are for).
export function hitTestZone(g, px, py, zone) {
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
function drawFloor(ctx, g) {
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const light = (c + r) % 2 === 0
      fillQuad(ctx, floorQuad(g, c, r), light ? '#D9BA8C' : '#CDA875', 'rgba(120,84,48,0.28)')
    }
  }
}

function drawLeftWall(ctx, g) {
  // back-left wall face (x = 0, y 0..FLOOR_ROWS, z 0..WALL_HEIGHT)
  const face = [
    g.project(0, 0, 0), g.project(0, FLOOR_ROWS, 0),
    g.project(0, FLOOR_ROWS, WALL_HEIGHT), g.project(0, 0, WALL_HEIGHT),
  ]
  fillQuad(ctx, face, '#F3E6D2')
  // faint tile grid
  ctx.strokeStyle = 'rgba(150,120,88,0.16)'; ctx.lineWidth = 1
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
  fillQuad(ctx, bb, 'rgba(176,140,96,0.55)')
}

function drawRightWall(ctx, g) {
  // back-right wall face (y = 0, x 0..FLOOR_COLS, z 0..WALL_HEIGHT) — slightly darker
  const face = [
    g.project(0, 0, 0), g.project(FLOOR_COLS, 0, 0),
    g.project(FLOOR_COLS, 0, WALL_HEIGHT), g.project(0, 0, WALL_HEIGHT),
  ]
  fillQuad(ctx, face, '#E7D3B4')
  ctx.strokeStyle = 'rgba(140,110,78,0.16)'; ctx.lineWidth = 1
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
  fillQuad(ctx, bb, 'rgba(160,126,84,0.55)')
  // back-corner shadow line (vertical edge where the two walls meet)
  const c0 = g.project(0, 0, 0), c1 = g.project(0, 0, WALL_HEIGHT)
  ctx.strokeStyle = 'rgba(90,60,32,0.28)'; ctx.lineWidth = 1.5
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

// ── Furniture ────────────────────────────────────────────────────────────────
function drawFloorFurniture(ctx, g, layout) {
  // back-to-front so nearer items overlap farther ones
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const id = layout[`floor_${c}_${r}`]
      if (!id) continue
      const item = ROOM_ITEMS.find(i => i.id === id)
      if (!item) continue
      const p = slotAnchor(g, 'floor', c, r)
      ctx.save(); item.draw(ctx, p.sx, p.sy, g.TW); ctx.restore()
    }
  }
}

function drawWallFurniture(ctx, g, layout, zone) {
  const skew = zone === 'left_wall' ? -(g.TH / g.TW) : (g.TH / g.TW) // ±0.5 → matches wall slope
  const n = zone === 'left_wall' ? FLOOR_ROWS : FLOOR_COLS
  for (const z of WALL_Z_ROWS) {
    for (let a = 0; a < n; a++) {
      const id = layout[`${zone}_${a}_${z}`]
      if (!id) continue
      const item = ROOM_ITEMS.find(i => i.id === id)
      if (!item) continue
      const p = slotAnchor(g, zone, a, z)
      ctx.save()
      ctx.transform(1, skew, 0, 1, p.sx, p.sy)
      item.draw(ctx, 0, 0, g.TW)
      ctx.restore()
    }
  }
}

/**
 * drawRoomScene(ctx, { W, H, roomLayout, small, hint, activeZone, selectedKey })
 *   activeZone  — editor only: draws faint yellow outlines on that zone's empty slots
 *   selectedKey — editor only: strong yellow highlight on the currently selected slot
 */
export function drawRoomScene(ctx, { W, H, roomLayout, small = false, hint = true, activeZone = null, selectedKey = null }) {
  const layout = roomLayout ?? {}
  const g = computeRoomGeometry(W, H, small)

  // soft backdrop so margins blend with the app's dark theme
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#171232')
  bg.addColorStop(1, '#0e0b22')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // surfaces (back → front): right wall, left wall, floor
  drawRightWall(ctx, g)
  drawLeftWall(ctx, g)
  drawFloor(ctx, g)

  if (activeZone) drawZoneHints(ctx, g, activeZone, layout)

  // furniture: wall items first (behind), then floor items row-by-row
  drawWallFurniture(ctx, g, layout, 'right_wall')
  drawWallFurniture(ctx, g, layout, 'left_wall')
  drawFloorFurniture(ctx, g, layout)

  if (selectedKey) drawHighlight(ctx, g, selectedKey)

  if (hint && !small && Object.keys(layout).length === 0 && !activeZone) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('แต่งห้องได้ที่เมนู ห้อง', W / 2, H - 14)
    ctx.textAlign = 'left'
  }
}
