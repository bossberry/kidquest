/**
 * roomScene.js — shared, non-React room-background renderer.
 *
 * Extracted from DecoratedRoom.jsx so the same room art (gradient wall + floor,
 * baseboard, floor grain, furniture placed from a layout, empty-room hint) can be
 * drawn in three places:
 *   • DecoratedRoom.jsx  — Home hero zone + Room editor base (large, small=false)
 *   • RoomVisit.jsx      — full-screen friend-room visit (large, small=false)
 *   • FriendsScreen card — 72×80 thumbnail (small=true)
 *
 * This helper is intentionally decoupled from any companion/egg state — it only
 * knows about `roomLayout` + furniture. Callers draw the companion egg separately
 * (via renderEggSprite / EggCanvasCore) so a visited friend's egg can differ from
 * the local player's.
 *
 * drawRoomScene(ctx, { W, H, roomLayout, small })
 *   W, H       — canvas logical size in px
 *   roomLayout — { [slotIndex]: itemId }  (0–11 → ROOM_ITEMS id)
 *   small      — true → compact thumbnail scaling (skips the Thai hint text)
 *   hint       — draw the "decorate at the Room menu" empty-room hint (default true).
 *                Pass false for a friend's visited room (it's not the player's own).
 *
 * The small=false path reproduces DecoratedRoom's prior drawScene EXACTLY
 * (SLOT_SIZE 64, GAP 8, same grid math) so Home/Room are pixel-unchanged.
 */
import { ROOM_ITEMS } from './roomItems.js'

export const ROOM_COLS = 4
export const ROOM_ROWS = 3
const WALL_FRAC = 0.65

export function drawRoomScene(ctx, { W, H, roomLayout, small = false, hint = true }) {
  const layout = roomLayout ?? {}
  const wallH  = Math.floor(H * WALL_FRAC)

  // Slot geometry — large path matches DecoratedRoom's original constants exactly.
  const slotSize = small ? Math.max(10, Math.floor(W / 5.4)) : 64
  const gap      = small ? 2 : 8
  const gridW    = ROOM_COLS * slotSize + (ROOM_COLS - 1) * gap
  const gridLeft = (W - gridW) / 2
  const gridTop  = small ? Math.max(4, Math.floor(H * 0.05)) : Math.max(12, Math.floor(H * 0.04))

  // Wall + floor gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0,               '#F2E8D8')
  grad.addColorStop(WALL_FRAC - 0.001, '#F2E8D8')
  grad.addColorStop(WALL_FRAC,       '#8B6340')
  grad.addColorStop(1,               '#8B6340')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Baseboard
  ctx.fillStyle = '#C09060'
  ctx.fillRect(0, wallH, W, small ? 3 : 6)

  // Floor grain
  ctx.fillStyle = 'rgba(0,0,0,0.045)'
  const grainStep = small ? 14 : 40
  const grainTop  = wallH + (small ? 4 : 7)
  for (let x = 0; x < W; x += grainStep) {
    ctx.fillRect(x, grainTop, 1, H - grainTop)
  }

  // Furniture from layout
  for (const [idxStr, itemId] of Object.entries(layout)) {
    const idx = parseInt(idxStr)
    if (isNaN(idx)) continue
    const col = idx % ROOM_COLS
    const row = Math.floor(idx / ROOM_COLS)
    const cx  = gridLeft + col * (slotSize + gap) + slotSize / 2
    const cy  = gridTop  + row * (slotSize + gap) + slotSize / 2
    const item = ROOM_ITEMS.find(i => i.id === itemId)
    if (item) {
      ctx.save()
      item.draw(ctx, cx, cy, slotSize * 0.80)
      ctx.restore()
    }
  }

  // Empty-room hint (large only — no room for text on a thumbnail)
  if (hint && !small && Object.keys(layout).length === 0) {
    ctx.fillStyle = 'rgba(139,99,64,0.55)'
    ctx.font      = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('แต่งห้องได้ที่เมนู ห้อง', W / 2, wallH - 18)
    ctx.textAlign = 'left'
  }
}
