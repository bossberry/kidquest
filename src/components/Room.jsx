import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { ROOM_ITEMS, CRAFT_RECIPES, CRAFT_RECIPE_LIST, MATERIAL_ICON } from '../lib/roomItems.js'
import {
  drawRoomScene, hitTestZone, parseSlotKey, slotCenter,
  ROOM_THEMES, THEME_PALETTES, themeMeta, ROOM_BLOCK_PRICE,
  shiftGeometry, drawGhostRoom, drawMiniRoomBox, pointInQuad,
  FLOOR_COLS, FLOOR_ROWS,
} from '../lib/roomScene.js'
import { mkSparks, tickEffects } from '../lib/particles.js'
import { playSFX, playBGM, stopBGM } from '../lib/audio.js'

const BOTTOM_NAV_H = 80   // px — clearance for the fixed .px-bottom-nav rendered by App.jsx

const ZONE_LABELS = {
  floor:      { icon: '🟫', text: 'วางของบนพื้น' },
  left_wall:  { icon: '⬅️', text: 'แขวนที่ผนังซ้าย' },
  right_wall: { icon: '➡️', text: 'แขวนที่ผนังขวา' },
}

// Fills the canvas edge-to-edge — Room.jsx-only, deliberately NOT the shared
// computeRoomGeometry() (that stays untouched for DecoratedRoom.jsx/RoomVisit.jsx/
// the FriendsScreen thumbnail, which must keep their existing fit-within-bounds
// behavior). computeRoomGeometry takes the MIN of the width/height budgets so
// the whole iso shape always fits inside the canvas — on a canvas much wider
// than the iso room's natural ~10:8 aspect ratio, that leaves big empty
// margins left/right (the reported "dark border" bug); taking the MAX instead
// overcorrects the other way (verified live at a wide desktop viewport: it
// blew the room up so much the walls scrolled entirely off-screen, leaving
// just a floor). This averages the two axis-fits instead — splits the
// difference, trimming the margin substantially on the generous axis while
// only moderately cropping the tight one, rather than fully eliminating one
// side of the mismatch. Anchored so the FLOOR's bottom edge sits flush with
// the canvas bottom, since the floor (not the wall/ceiling) is what the child
// actually taps to place furniture.
function computeFullBleedGeometry(W, H) {
  const span = FLOOR_COLS + FLOOR_ROWS   // 10
  const THw = W / span
  const THh = H / (span * 0.8)
  const TH = Math.max(3, (THw + THh) / 2)
  const TW = TH * 2
  const originX = W / 2 - TH
  const originY = H - (span / 2) * TH
  const project = (x, y, z) => ({
    sx: originX + (x - y) * TW / 2,
    sy: originY + (x + y) * TH / 2 - z * TH,
  })
  return { TW, TH, originX, originY, project, W, H, small: false }
}

// ── SlotCanvas: renders one furniture item onto a small canvas ──────────────
function SlotCanvas({ item, size = 48 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    if (item) item.draw(ctx, size / 2, size / 2, size * 0.82)
  }, [item, size])
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}

// ── ItemCard: one card in the picker grid — owned / locked / elsewhere ──────
function ItemCard({ item, cardState, onTap }) {
  const locked    = cardState === 'locked'
  const elsewhere = cardState === 'elsewhere'
  const owned     = cardState === 'owned'
  return (
    <div
      onClick={onTap}
      style={{
        width: 90, height: 100, borderRadius: 12, padding: '10px 6px 8px',
        boxSizing: 'border-box', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        background: owned ? 'rgba(255,210,63,0.10)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${owned ? 'rgba(255,210,63,0.65)' : elsewhere ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)'}`,
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        opacity: elsewhere ? 0.55 : 1,
      }}
    >
      <div style={{ opacity: locked ? 0.35 : 1 }}>
        <SlotCanvas item={item} size={56} />
      </div>
      <span style={{
        fontFamily: 'var(--font-thai)', fontSize: 12,
        color: locked ? 'rgba(255,255,255,0.4)' : '#ffffff',
        textAlign: 'center', lineHeight: 1.15,
      }}>
        {item.nameTh}
      </span>
      {elsewhere && (
        <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 12 }}>📍</span>
      )}
      {locked && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          background: 'rgba(10,8,20,0.62)',
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: '#FFD23F' }}>🪙{item.price}</span>
        </div>
      )}
    </div>
  )
}

// RoomMiniMap was removed (2026-07-08) — the top-right room-grid overlay is
// gone entirely; panning the canvas is now the only way to reach a ghost or
// adjacent room. Note: this also removed the only UI entry point for
// SET_HOME_ROOM ("ตั้งเป็นห้องหลัก" — choosing which room shows on Home's
// background) — flagged in the session handoff since that's a real, working,
// unrelated feature that's now unreachable, not something this task asked to
// remove specifically.

// ── ROOM_ITEMS lookup by id (crafting UI + tap detection) ───────────────────
const ITEM_BY_ID = ROOM_ITEMS.reduce((m, i) => (m[i.id] = i, m), {})

// ── Ghost-room-preview directions (2026-07-07) ──────────────────────────────
// dx/dy are GRID deltas (same convention as BUY_ROOM_BLOCK).
// shiftX/shiftY are screen-space multipliers for isoRoomWidth/isoRoomHeight —
// "right"/"left" only move the ghost horizontally, "up"/"down" only vertically,
// per the spec (a deliberate simplification vs. true diagonal iso-grid tiling,
// chosen for readability: every neighbor stays screen-aligned with the center).
const DIRS = [
  { key: 'up',    dx: 0,  dy: -1, shiftX: 0,  shiftY: -1 },
  { key: 'down',  dx: 0,  dy: 1,  shiftX: 0,  shiftY: 1 },
  { key: 'left',  dx: -1, dy: 0,  shiftX: -1, shiftY: 0 },
  { key: 'right', dx: 1,  dy: 0,  shiftX: 1,  shiftY: 0 },
]
const DIR_LABEL = { up: 'ด้านบน', down: 'ด้านล่าง', left: 'ด้านซ้าย', right: 'ด้านขวา' }

// ── Main Room screen ─────────────────────────────────────────────────────────
export default function Room({ navigate }) {
  const { state, dispatch } = useAppState()
  const [selectedSlot, setSelectedSlot] = useState(null)   // { key, zone } | null — drives the unified sheet
  const [toast, setToast] = useState(null)
  const [buyTarget, setBuyTarget] = useState(null)   // ROOM_ITEMS entry currently up for purchase-confirm, or null
  const [buyRoomAt, setBuyRoomAt] = useState(null)   // { gridX, gridY } — empty mini-map cell tapped, opens room-block purchase sheet
  const [buyRoomTheme, setBuyRoomTheme] = useState(null)  // theme id selected inside that sheet, awaiting confirm
  const [craftSheetOpen, setCraftSheetOpen] = useState(false)  // ⚒️ craft button tapped → affordable-recipes sheet

  const materials = state.materials ?? {}
  const craftFxRef = useRef(null)   // dedicated sparkle canvas layered over the craft sheet
  const craftFxRafRef = useRef(null)

  const coins       = state.coins ?? 0
  const ownedRoom   = state.ownedRoomItems ?? []
  const rooms       = state.rooms ?? [{ id: 'main', theme: 'default', gridX: 0, gridY: 0, layout: {} }]
  const activeRoomId = state.activeRoomId ?? 'main'
  const homeRoomId  = state.homeRoomId ?? 'main'
  const activeRoom  = rooms.find(r => r.id === activeRoomId) || rooms[0]
  const activeTheme = activeRoom?.theme ?? 'default'
  const roomLayout  = activeRoom?.layout ?? (state.roomLayout ?? {})
  const activeMeta  = themeMeta(activeTheme)

  const wrapRef    = useRef(null)
  const canvasRef  = useRef(null)
  const overlayRef = useRef(null)
  const geomRef    = useRef(null)   // { g, W, H } — geometry the visible canvas was last drawn with

  // Refs mirroring the latest render-relevant data so the rAF loop (which lives
  // outside React's render cycle) never reads a stale closure.
  const layoutRef      = useRef(roomLayout)
  const selectedKeyRef = useRef(null)
  const themeRef       = useRef(activeTheme)
  const activeRoomRef  = useRef(activeRoom)
  const roomsRef       = useRef(rooms)
  layoutRef.current      = roomLayout
  selectedKeyRef.current = selectedSlot?.key ?? null
  themeRef.current       = activeTheme
  activeRoomRef.current   = activeRoom
  roomsRef.current        = rooms

  // Neighbor ghost/real-room screen zones, recomputed every drawFrame() —
  // { type: 'room'|'ghost', poly: [pts], roomId? | gridX,gridY,dir? }
  const neighborZonesRef = useRef([])

  // Tap-hint fade + placement-bounce + sparkle animation state (rAF-driven, Room-editor-only).
  const hintOpacityRef   = useRef(0)
  const lastActivityRef  = useRef(0)
  const justPlacedKeyRef = useRef(null)
  const justPlacedAtRef  = useRef(0)
  const effectsRef       = useRef([])
  const rafRef           = useRef(null)
  const lastFrameRef     = useRef(0)

  // ── Scrollable viewport (2026-07-07) — the main room renders at full size;
  // the player pans (drag/touch) to reveal neighboring ghost/purchased rooms
  // instead of the whole scene zooming out. A ref (not state) since panning
  // must not trigger React re-renders — drawFrame reads it every rAF tick.
  const viewOffsetRef = useRef({ x: 0, y: 0 })
  const dragRef       = useRef(null)   // { startX, startY, startOffsetX, startOffsetY, moved } | null
  const draggedRef    = useRef(false)  // set once a drag exceeds the tap threshold → suppresses the next click

  useEffect(() => {
    playBGM('room')
    return () => stopBGM()
  }, [])

  // Clears the "✨ ของใหม่!" BottomNav bubble now that the child has opened Room.
  useEffect(() => { dispatch({ type: ACTIONS.CLEAR_NEW_ROOM_ITEM }) }, [dispatch])

  // Draws a scrollable multi-room view: the active room renders at FULL SIZE
  // (same scale as before multi-room existed — computeRoomGeometry, not a
  // zoomed-out composite), and viewOffsetRef pans the whole scene so ghost/
  // purchased neighbors scroll into view at the edges instead of the screen
  // shrinking everything to fit them all at once. neighborZonesRef is rebuilt
  // every call so handleCanvasClick always hit-tests against the latest
  // screen positions (which shift as the player pans).
  const drawFrame = useCallback((hintOpacity, bounceKey, bounceScale) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width, H = canvas.height
    if (!W || !H) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#171232')
    bg.addColorStop(1, '#0e0b22')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    const baseG = computeFullBleedGeometry(W, H)   // fills the canvas edge-to-edge
    const span = FLOOR_COLS + FLOOR_ROWS
    const isoRoomWidth  = span * baseG.TW / 2
    const isoRoomHeight = span * baseG.TH / 2
    const { x: vx, y: vy } = viewOffsetRef.current
    const g = shiftGeometry(baseG, -vx, -vy)   // pan shifts the WHOLE view, main room included

    const room = activeRoomRef.current
    const allRooms = roomsRef.current
    const zones = []

    if (room) {
      for (const d of DIRS) {
        const gx = room.gridX + d.dx, gy = room.gridY + d.dy
        const shifted = shiftGeometry(g, d.shiftX * isoRoomWidth, d.shiftY * isoRoomHeight)
        // Only draw/hit-test a ghost or adjacent room once scrolling has
        // brought it within ~1 room-width/height of actually being visible —
        // it "appears" as the player discovers that edge, per spec, rather
        // than always being computed even while far off-screen.
        const center = shifted.project(FLOOR_COLS / 2, FLOOR_ROWS / 2, 0)
        const nearViewport = center.sx > -isoRoomWidth && center.sx < W + isoRoomWidth &&
                              center.sy > -isoRoomHeight && center.sy < H + isoRoomHeight
        if (!nearViewport) continue
        const neighbor = allRooms.find(r => r.gridX === gx && r.gridY === gy)
        if (neighbor) {
          const poly = drawMiniRoomBox(ctx, shifted, neighbor.theme, 0.7)
          zones.push({ type: 'room', roomId: neighbor.id, poly })
        } else {
          const poly = drawGhostRoom(ctx, shifted, ROOM_BLOCK_PRICE)
          zones.push({ type: 'ghost', gridX: gx, gridY: gy, dir: d.key, poly })
        }
      }
    }
    neighborZonesRef.current = zones

    drawRoomScene(ctx, {
      W, H, roomLayout: layoutRef.current, small: false, hint: false,
      selectedKey: selectedKeyRef.current,
      showTapHints: true, hintOpacity,
      bounceKey, bounceScale, theme: themeRef.current,
      geometry: g, paintBg: false,
    })
    geomRef.current = { g, W, H, isoRoomWidth, isoRoomHeight }
  }, [])

  // Single rAF loop drives three things at once: the "+" hint fade in/out, the
  // brief placement drop-in bounce, and the sparkle burst overlay. It stops
  // itself once everything has settled (hints fully faded, no bounce, no
  // sparkles) so the screen doesn't burn CPU forever — wake() restarts it.
  const loop = useCallback((now) => {
    const dt = lastFrameRef.current ? Math.min(50, now - lastFrameRef.current) : 16
    lastFrameRef.current = now

    const idle = now - lastActivityRef.current
    const target = idle > 3000 ? 0 : 1
    const cur = hintOpacityRef.current
    const rate = target > cur ? (1 / 0.4) : (1 / 0.6)   // ease in ~400ms, ease out ~600ms
    let next = cur + Math.sign(target - cur) * rate * (dt / 1000)
    if ((target - cur) * (target - next) <= 0) next = target
    hintOpacityRef.current = Math.max(0, Math.min(1, next))

    let bounceKey = null, bounceScale = 1
    if (justPlacedKeyRef.current) {
      const bt = now - justPlacedAtRef.current
      const dur = 220
      if (bt < dur) {
        const t = bt / dur
        bounceScale = t < 0.4 ? (t / 0.4) * 1.2 : 1.2 - ((t - 0.4) / 0.6) * 0.2
        bounceKey = justPlacedKeyRef.current
      } else {
        justPlacedKeyRef.current = null
      }
    }

    const overlay = overlayRef.current
    const octx = overlay?.getContext('2d')
    if (octx) {
      if (effectsRef.current.length > 0) effectsRef.current = tickEffects(octx, effectsRef.current, dt)
      else octx.clearRect(0, 0, overlay.width, overlay.height)
    }

    drawFrame(hintOpacityRef.current, bounceKey, bounceScale)

    const hintsSettled = hintOpacityRef.current <= 0.001 && target === 0
    // Ghost rooms pulse continuously (Date.now()-seeded sine in drawGhostRoom),
    // so the loop must keep running whenever any ghost is on screen — which is
    // almost always true unless the active room has real rooms in all 4 dirs.
    const hasGhost = neighborZonesRef.current.some(z => z.type === 'ghost')
    const stillActive = !hintsSettled || !!bounceKey || effectsRef.current.length > 0 || hasGhost
    if (stillActive) rafRef.current = requestAnimationFrame(loop)
    else rafRef.current = null
  }, [drawFrame])

  const wake = useCallback(() => {
    lastActivityRef.current = performance.now()
    if (!rafRef.current) {
      lastFrameRef.current = 0
      rafRef.current = requestAnimationFrame(loop)
    }
  }, [loop])

  // Mount: fade hints in, start the loop.
  useEffect(() => {
    wake()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [wake])

  // The newly-active room always starts centered — reset the pan viewport
  // whenever activeRoomId changes (buying a room, or tapping a revealed
  // neighbor both dispatch SET_ACTIVE_ROOM/BUY_ROOM_BLOCK).
  useEffect(() => {
    viewOffsetRef.current = { x: 0, y: 0 }
    wake()
  }, [activeRoomId, wake])

  // Keep the canvas backing store matched to the wrapper's real size. Flex sizing
  // doesn't reliably fire a window 'resize' event, so use ResizeObserver instead.
  useEffect(() => {
    const wrap    = wrapRef.current
    const canvas  = canvasRef.current
    const overlay = overlayRef.current
    if (!wrap || !canvas) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const W = Math.round(entry.contentRect.width)
        const H = Math.round(entry.contentRect.height)
        if (W <= 0 || H <= 0) continue
        if (canvas.width !== W)  canvas.width = W
        if (canvas.height !== H) canvas.height = H
        if (overlay) {
          if (overlay.width !== W)  overlay.width = W
          if (overlay.height !== H) overlay.height = H
        }
        drawFrame(hintOpacityRef.current, null, 1)
      }
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [drawFrame])

  // Redraw immediately on layout/selection change even when the animation loop
  // has settled and stopped (e.g. placing/removing an item while hints are faded).
  useEffect(() => {
    if (!rafRef.current) drawFrame(hintOpacityRef.current, null, 1)
  }, [roomLayout, selectedSlot, activeTheme, activeRoomId, drawFrame])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function handleCanvasClick(e) {
    // A completed pan drag fires a synthetic click right after pointerup —
    // swallow it once so scrolling the viewport never also drops furniture.
    if (draggedRef.current) { draggedRef.current = false; return }
    wake()
    const canvas = canvasRef.current
    const g = geomRef.current?.g
    if (!canvas || !g) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (canvas.width / rect.width)
    const py = (e.clientY - rect.top)  * (canvas.height / rect.height)

    // Neighbor ghost/real-room previews take priority over the center room's
    // own slots (they're drawn as full rooms, but the CENTER room is drawn on
    // top of any overlap, so this order only matters where the two don't overlap).
    for (const z of neighborZonesRef.current) {
      if (!pointInQuad(px, py, z.poly)) continue
      if (z.type === 'room') {
        if (z.roomId !== activeRoomId) {
          dispatch({ type: ACTIONS.SET_ACTIVE_ROOM, payload: { roomId: z.roomId } })
          setSelectedSlot(null); setBuyTarget(null)
          playSFX('room_visit_enter')
        }
      } else {
        setBuyRoomTheme(null)
        setBuyRoomAt({ gridX: z.gridX, gridY: z.gridY, dir: z.dir })
      }
      return
    }

    const hit = hitTestZone(g, px, py)   // zone-agnostic — figures out which zone was tapped
    if (!hit) return
    setBuyTarget(null)
    setSelectedSlot({ key: hit.key, zone: hit.zone })
  }

  // ── Pan-to-scroll the viewport (2026-07-07) — unifies touch drag and mouse
  // drag via the Pointer Events API. A small movement threshold (6px) keeps a
  // deliberate tap-to-place from being misread as a drag; once that threshold
  // is crossed the gesture is committed to panning for the rest of the pointer
  // sequence and the trailing click is suppressed (see handleCanvasClick).
  function handlePointerDown(e) {
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startOffsetX: viewOffsetRef.current.x, startOffsetY: viewOffsetRef.current.y,
      moved: false,
    }
    wake()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  function handlePointerMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true
    if (!d.moved) return
    // Clamp so the player can't scroll endlessly past the ring of neighbor
    // rooms — a little over one room-width/height keeps a neighbor fully
    // reachable without exposing empty space beyond it.
    const bounds = geomRef.current
    const maxX = (bounds?.isoRoomWidth ?? 200) * 1.15
    const maxY = (bounds?.isoRoomHeight ?? 150) * 1.15
    viewOffsetRef.current = {
      x: Math.max(-maxX, Math.min(maxX, d.startOffsetX - dx)),
      y: Math.max(-maxY, Math.min(maxY, d.startOffsetY - dy)),
    }
    wake()
  }

  function handlePointerUp(e) {
    const d = dragRef.current
    dragRef.current = null
    if (d?.moved) draggedRef.current = true
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
  }

  // owned+unplaced (or placed in THIS slot) → 'owned' (tappable, gold)
  // owned but placed in a DIFFERENT slot   → 'elsewhere' (grey, tap = toast)
  // not owned                              → 'locked' (faded + 🔒 + price)
  function cardStateFor(item) {
    if (!ownedRoom.includes(item.id)) return 'locked'
    const placedAt = Object.keys(roomLayout).find(k => roomLayout[k] === item.id)
    if (placedAt && placedAt !== selectedSlot?.key) return 'elsewhere'
    return 'owned'
  }

  function handlePlace(item) {
    const key = selectedSlot?.key
    if (!key) return
    dispatch({ type: ACTIONS.PLACE_ROOM_ITEM, payload: { slotKey: key, itemId: item.id } })
    playSFX('furniture_place')

    // Placement feedback: sparkle burst at the slot + a brief drop-in bounce.
    const g = geomRef.current?.g
    const p = parseSlotKey(key)
    if (g && p) {
      const c = slotCenter(g, p.zone, p.a, p.b)
      effectsRef.current.push(mkSparks(c.sx, c.sy))
    }
    justPlacedKeyRef.current = key
    justPlacedAtRef.current  = performance.now()
    wake()

    setSelectedSlot(null)
    flash(`วาง${item.nameTh}แล้ว! 🏠`)
  }

  // Furniture is bought right here — the Shop screen has no furniture tab
  // (removed 2026-07-03, on the assumption Room would sell it; this closes
  // that gap). Tapping a locked card opens a small buy-confirm view; buying
  // dispatches BUY_ROOM_ITEM then immediately places it in the open slot,
  // so the child buys AND places in one flow without leaving Room.
  function handleLockedTap(item) {
    setBuyTarget(item)
  }

  function handleBuyRoomItem(item) {
    if (coins < item.price) { flash('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_ROOM_ITEM, payload: { id: item.id, price: item.price } })
    playSFX('coin_purchase')
    setBuyTarget(null)
    handlePlace(item)   // React applies dispatches in order, so ownedRoomItems
                         // already includes `item.id` by the time this runs.
  }

  function handleBuyRoomBlock() {
    if (!buyRoomAt || !buyRoomTheme) return
    if (coins < ROOM_BLOCK_PRICE) { flash(`เหรียญไม่พอ 😢 ต้องการอีก ${ROOM_BLOCK_PRICE - coins}🪙`); return }
    dispatch({ type: ACTIONS.BUY_ROOM_BLOCK, payload: { gridX: buyRoomAt.gridX, gridY: buyRoomAt.gridY, theme: buyRoomTheme } })
    playSFX('coin_purchase')
    const meta = themeMeta(buyRoomTheme)
    setBuyRoomAt(null); setBuyRoomTheme(null)
    setSelectedSlot(null)
    // Confetti — the ghost room becomes solid and BUY_ROOM_BLOCK's reducer
    // already makes it active, so the burst lands where the new room will
    // appear (canvas center) once the next frame redraws.
    const canvas = canvasRef.current
    if (canvas) {
      effectsRef.current.push(
        ...Array.from({ length: 10 }, () =>
          mkSparks(canvas.width * (0.35 + Math.random() * 0.3), canvas.height * (0.35 + Math.random() * 0.25), 700 + Math.random() * 500))
      )
      wake()
    }
    flash(`สร้าง${meta.nameTh}แล้ว! ${meta.icon}`)
  }

  function handleRemove() {
    const key = selectedSlot?.key
    if (!key) return
    const itemId = roomLayout[key]
    const item = ROOM_ITEMS.find(i => i.id === itemId)
    dispatch({ type: ACTIONS.REMOVE_ROOM_ITEM, payload: { slotKey: key } })
    playSFX('furniture_remove')
    setSelectedSlot(null)
    flash(item ? `เก็บ${item.nameTh}แล้ว` : 'เก็บของแล้ว')
  }

  // ── Instant crafting (2026-07-07 — replaces the workbench+confirm-step flow) ─
  function canAfford(itemId) {
    const recipe = CRAFT_RECIPES[itemId]
    if (!recipe) return false
    return Object.keys(recipe).every(k => (materials[k] || 0) >= recipe[k])
  }

  // Sparkle burst on craft success — reuses mkSparks/tickEffects on a dedicated
  // canvas layered ON TOP of the craft sheet (the room's own overlay canvas
  // sits behind the sheet, so it wouldn't be visible from here).
  function fireCraftSparkle() {
    const cv = craftFxRef.current
    if (!cv) return
    const W = cv.clientWidth || cv.width, H = cv.clientHeight || cv.height
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')
    let effects = Array.from({ length: 8 }, () =>
      mkSparks(W * (0.3 + Math.random() * 0.4), H * (0.25 + Math.random() * 0.4), 600 + Math.random() * 400))
    let last = performance.now()
    const step = (now) => {
      const dt = now - last; last = now
      effects = tickEffects(ctx, effects, dt)
      if (effects.length) craftFxRafRef.current = requestAnimationFrame(step)
      else { ctx.clearRect(0, 0, cv.width, cv.height); craftFxRafRef.current = null }
    }
    if (craftFxRafRef.current) cancelAnimationFrame(craftFxRafRef.current)
    craftFxRafRef.current = requestAnimationFrame(step)
  }

  // Instant — no confirm dialog. Tapping an affordable recipe card crafts it
  // immediately (per spec, simplicity over ceremony for a 6-recipe list).
  function handleCraft(itemId) {
    if (!canAfford(itemId)) return
    if (ownedRoom.includes(itemId)) return
    dispatch({ type: ACTIONS.CRAFT_ITEM, payload: { itemId } })
    playSFX('coin_purchase')
    fireCraftSparkle()
    const item = ITEM_BY_ID[itemId]
    flash(item ? `ประดิษฐ์${item.nameTh}แล้ว! ✨` : 'ประดิษฐ์สำเร็จ! ✨')
  }

  useEffect(() => () => { if (craftFxRafRef.current) cancelAnimationFrame(craftFxRafRef.current) }, [])

  const zone       = selectedSlot?.zone ?? null
  // Craft-only and monster-drop-only items are hidden from the coin buy-picker
  // until actually unlocked (crafted / dropped); once owned they behave
  // exactly like any bought item here.
  const zoneItems  = zone ? ROOM_ITEMS.filter(i =>
    (i.allowedZones || []).includes(zone) && ((!i.craftedOnly && !i.dropOnly) || ownedRoom.includes(i.id))
  ) : []
  const occupiedId = selectedSlot ? roomLayout[selectedSlot.key] : null
  const occupiedItem = occupiedId ? ROOM_ITEMS.find(i => i.id === occupiedId) : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      width: '100%', height: '100%', background: '#0a0a12', boxSizing: 'border-box',
    }}>

      {/* Iso room scene — fills all available space above the bottom nav */}
      <div ref={wrapRef} style={{
        position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden',
        marginBottom: BOTTOM_NAV_H,
      }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            imageRendering: 'pixelated', cursor: 'pointer', touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
        {/* Sparkle-burst overlay — cleared/redrawn independently of the scene canvas */}
        <canvas
          ref={overlayRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />

        {/* Header — small overlay pill pinned to the top-left, doesn't eat layout space */}
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(10,8,20,0.55)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '6px 14px 6px 14px',
        }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: '#EF9F27', letterSpacing: 2 }}>
            ROOM
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-pixel)', fontSize: 9, color: '#FFD23F',
          }}>
            🪙 {coins}
          </span>
        </div>

        {/* Room label — floating pill, top-center: theme icon + Thai name */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          pointerEvents: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(10,8,22,0.55)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px',
        }}>
          <span style={{ fontSize: 15 }}>{activeMeta.icon}</span>
          <span style={{ fontFamily: 'var(--font-thai)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {activeMeta.nameTh}
          </span>
        </div>

        {/* Craft button (⚒️) — floating bottom-right, only shown once the child
            owns any material (per spec: materials themselves are shown in
            WorldHUD now, not here — Room only needs the entry point). */}
        {Object.values(materials).some(v => v > 0) && (
          <button
            onClick={() => setCraftSheetOpen(true)}
            aria-label="ประดิษฐ์ของ"
            style={{
              position: 'absolute', right: 14,
              bottom: 'calc(24px + env(safe-area-inset-bottom))', zIndex: 5,
              width: 52, height: 52, borderRadius: 30, border: 'none',
              background: 'linear-gradient(180deg, #FFD23F, #EF9F27)',
              color: '#3a2a00', fontSize: 24, lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 0 rgba(0,0,0,0.35), 0 8px 14px rgba(0,0,0,0.3)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ⚒️
          </button>
        )}

        {/* Hint text — pinned bottom overlay, taps pass through to the canvas */}
        <div style={{
          position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 2, pointerEvents: 'none',
          fontFamily: 'var(--font-thai)', fontSize: 11,
          color: 'rgba(255,255,255,0.45)', textAlign: 'center',
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}>
          แตะที่ห้องเพื่อแต่งได้เลย
        </div>
      </div>

      {/* ── Unified item picker / action sheet ─────────────────────────── */}
      {selectedSlot && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div
            onClick={() => { setSelectedSlot(null); setBuyTarget(null) }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            height: '40vh', display: 'flex', flexDirection: 'column',
            background: 'rgba(26,16,64,0.90)', backdropFilter: 'blur(14px)',
            borderRadius: '24px 24px 0 0',
            padding: '16px 16px 0',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            animation: 'fadeInUp 0.22s ease both',
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700,
              color: '#FFD23F', marginBottom: 10, textAlign: 'center', flexShrink: 0,
            }}>
              {ZONE_LABELS[zone]?.icon} {ZONE_LABELS[zone]?.text}
            </div>

            {buyTarget ? (
              // ── Buy-confirm view — furniture has no shop screen of its own
              // (removed 2026-07-03), so buying happens right here, right before
              // placing it in the slot the child was just trying to fill.
              <div style={{
                flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 14,
              }}>
                <SlotCanvas item={buyTarget} size={72} />
                <div style={{ fontFamily: 'var(--font-thai)', fontSize: 16, fontWeight: 700, color: '#ffffff', textAlign: 'center' }}>
                  {buyTarget.nameTh}
                </div>
                <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
                  <button
                    onClick={() => setBuyTarget(null)}
                    aria-label="ย้อนกลับ"
                    style={{
                      flex: 1, border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', borderRadius: 10,
                      padding: '12px 0', fontFamily: 'var(--font-thai)', fontSize: 14,
                      color: 'rgba(255,255,255,0.7)', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    ← ย้อนกลับ
                  </button>
                  <button
                    onClick={() => handleBuyRoomItem(buyTarget)}
                    disabled={coins < buyTarget.price}
                    aria-label={`ซื้อ ${buyTarget.price}`}
                    style={{
                      flex: 2, border: 'none',
                      cursor: coins < buyTarget.price ? 'default' : 'pointer',
                      background: coins < buyTarget.price ? 'rgba(255,255,255,0.08)' : 'rgba(255,210,63,0.22)',
                      borderRadius: 10, padding: '12px 0',
                      fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700,
                      color: coins < buyTarget.price ? 'rgba(255,255,255,0.3)' : '#FFD23F',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    🛒 ซื้อ 🪙{buyTarget.price}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {occupiedItem && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexShrink: 0 }}>
                    <SlotCanvas item={occupiedItem} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700, color: '#FFD23F' }}>
                        {occupiedItem.nameTh}
                      </div>
                      <div style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                        วางอยู่ในห้อง
                      </div>
                    </div>
                    <button
                      onClick={handleRemove}
                      aria-label="เอาออก"
                      style={{
                        flexShrink: 0,
                        border: '1.5px solid rgba(255,80,80,0.4)', cursor: 'pointer',
                        background: 'rgba(255,80,80,0.18)', borderRadius: 10,
                        padding: '8px 14px', fontFamily: 'var(--font-thai)', fontSize: 13,
                        color: '#ffffff', whiteSpace: 'nowrap',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      🗑️ เอาออก
                    </button>
                  </div>
                )}

                <div style={{
                  flex: 1, minHeight: 0, overflowY: 'auto',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                  justifyItems: 'center', paddingBottom: 10,
                }}>
                  {zoneItems.map(item => {
                    const cs = cardStateFor(item)
                    return (
                      <ItemCard
                        key={item.id}
                        item={item}
                        cardState={cs}
                        onTap={() => {
                          if (cs === 'locked') handleLockedTap(item)
                          else if (cs === 'owned') handlePlace(item)
                          else flash(`${item.nameTh} วางอยู่ที่อื่นแล้ว`)
                        }}
                      />
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Room-block purchase sheet (tapping an empty "+" mini-map cell) ──── */}
      {buyRoomAt && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div
            onClick={() => { setBuyRoomAt(null); setBuyRoomTheme(null) }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            maxHeight: '52vh', display: 'flex', flexDirection: 'column',
            background: 'rgba(26,16,64,0.92)', backdropFilter: 'blur(14px)',
            borderRadius: '24px 24px 0 0', padding: '16px 16px 0',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            animation: 'fadeInUp 0.22s ease both', boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700, color: '#FFD23F' }}>
                🏗️ เพิ่มห้อง{DIR_LABEL[buyRoomAt?.dir] ?? ''} 🪙{ROOM_BLOCK_PRICE}
              </span>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#FFD23F' }}>🪙 {coins}</span>
            </div>

            {buyRoomTheme ? (
              // Confirm view
              (() => {
                const meta = themeMeta(buyRoomTheme)
                const afford = coins >= ROOM_BLOCK_PRICE
                return (
                  <div style={{
                    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 12,
                  }}>
                    <div style={{ fontSize: 52 }}>{meta.icon}</div>
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 17, fontWeight: 700, color: '#fff' }}>
                      ซื้อ{meta.nameTh} 🪙{ROOM_BLOCK_PRICE}?
                    </div>
                    {!afford && (
                      <div style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: '#ff8a8a' }}>
                        เหรียญไม่พอ 😢 ต้องการอีก {ROOM_BLOCK_PRICE - coins}🪙
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
                      <button onClick={() => setBuyRoomTheme(null)} aria-label="ย้อนกลับ"
                        style={{
                          flex: 1, border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 0',
                          fontFamily: 'var(--font-thai)', fontSize: 14, color: 'rgba(255,255,255,0.7)',
                          WebkitTapHighlightColor: 'transparent',
                        }}>← ย้อนกลับ</button>
                      <button onClick={handleBuyRoomBlock} disabled={!afford} aria-label={`ซื้อ ${ROOM_BLOCK_PRICE}`}
                        style={{
                          flex: 2, border: 'none', cursor: afford ? 'pointer' : 'default',
                          background: afford ? 'rgba(255,210,63,0.22)' : 'rgba(255,255,255,0.08)',
                          borderRadius: 10, padding: '12px 0', fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700,
                          color: afford ? '#FFD23F' : 'rgba(255,255,255,0.3)', WebkitTapHighlightColor: 'transparent',
                        }}>🛒 ซื้อ + เพิ่มห้อง! 🪙{ROOM_BLOCK_PRICE}</button>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div style={{
                flex: 1, minHeight: 0, overflowY: 'auto',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                justifyItems: 'center', paddingBottom: 12,
              }}>
                {ROOM_THEMES.filter(t => t.price > 0).map(t => (
                  <div key={t.id} onClick={() => setBuyRoomTheme(t.id)}
                    style={{
                      width: 90, height: 104, borderRadius: 12, padding: '10px 6px 8px', boxSizing: 'border-box',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: (THEME_PALETTES[t.id] || THEME_PALETTES.default).floorLight + '22',
                      border: '1.5px solid rgba(255,255,255,0.14)', cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}>
                    <span style={{ fontSize: 30 }}>{t.icon}</span>
                    <span style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: '#fff', textAlign: 'center', lineHeight: 1.15 }}>
                      {t.nameTh}
                    </span>
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: '#FFD23F' }}>🪙{t.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Craft sheet (⚒️ button) — instant craft, affordable recipes only ─── */}
      {craftSheetOpen && (() => {
        const affordable = CRAFT_RECIPE_LIST.filter(id => canAfford(id) && !ownedRoom.includes(id))
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9100,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>
            <div
              onClick={() => setCraftSheetOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
            />
            <div style={{
              position: 'relative', zIndex: 1,
              maxHeight: '60vh', display: 'flex', flexDirection: 'column',
              background: 'rgba(26,16,64,0.92)', backdropFilter: 'blur(14px)',
              borderRadius: '24px 24px 0 0', padding: '16px 16px 0',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
              animation: 'fadeInUp 0.22s ease both', boxSizing: 'border-box',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700, color: '#FFD23F' }}>
                  ⚒️ ประดิษฐ์ของ
                </span>
                <button onClick={() => setCraftSheetOpen(false)} aria-label="ปิด"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '5px 9px',
                    fontSize: 14, color: '#fff', WebkitTapHighlightColor: 'transparent',
                  }}>✕</button>
              </div>

              {affordable.length === 0 ? (
                <div style={{
                  flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 20,
                }}>
                  <div style={{ fontSize: 44 }}>🗺️</div>
                  <div style={{ fontFamily: 'var(--font-thai)', fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                    เก็บวัตถุดิบเพิ่มในแผนที่ก่อนนะ 🗺️
                  </div>
                </div>
              ) : (
                <div style={{
                  flex: 1, minHeight: 0, overflowY: 'auto',
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
                  paddingBottom: 12,
                }}>
                  {affordable.map(itemId => {
                    const item = ITEM_BY_ID[itemId]
                    const recipe = CRAFT_RECIPES[itemId] || {}
                    return (
                      <button
                        key={itemId}
                        onClick={() => handleCraft(itemId)}
                        aria-label={`ประดิษฐ์${item?.nameTh}`}
                        style={{
                          borderRadius: 12, padding: '10px 8px', boxSizing: 'border-box',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          background: 'rgba(52,199,89,0.14)', border: '1.5px solid rgba(52,199,89,0.4)',
                          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <SlotCanvas item={item} size={60} />
                        <span style={{
                          fontFamily: 'var(--font-thai)', fontSize: 12, color: '#fff',
                          textAlign: 'center', lineHeight: 1.15,
                        }}>{item?.nameTh}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 1,
                          fontFamily: 'var(--font-pixel)', fontSize: 11, color: '#7dffa0',
                        }}>
                          {Object.keys(recipe).map(k => (
                            <span key={k}>{MATERIAL_ICON[k]}×{recipe[k]}</span>
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Craft-success sparkle — layered above the sheet (pointer-through). */}
            <canvas ref={craftFxRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              pointerEvents: 'none', zIndex: 2,
            }} />
          </div>
        )
      })()}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: BOTTOM_NAV_H + 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,20,60,0.95)', border: '1px solid rgba(255,210,63,0.4)',
          borderRadius: 20, padding: '10px 22px',
          fontFamily: 'var(--font-thai)', fontSize: 14, color: '#FFD23F',
          zIndex: 9999, whiteSpace: 'nowrap',
          animation: 'fadeInUp 0.25s ease both',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
