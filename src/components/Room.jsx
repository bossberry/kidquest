import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { ROOM_ITEMS, RECIPES, RECIPE_LIST, MATERIALS, MATERIAL_ICON } from '../lib/roomItems.js'
import {
  drawRoomScene, computeRoomGeometry, hitTestZone, parseSlotKey, slotCenter,
  ROOM_THEMES, THEME_PALETTES, themeMeta, ROOM_BLOCK_PRICE,
} from '../lib/roomScene.js'
import { mkSparks, tickEffects } from '../lib/particles.js'
import { playSFX, playBGM, stopBGM } from '../lib/audio.js'

const BOTTOM_NAV_H = 80   // px — clearance for the fixed .px-bottom-nav rendered by App.jsx

const ZONE_LABELS = {
  floor:      { icon: '🟫', text: 'วางของบนพื้น' },
  left_wall:  { icon: '⬅️', text: 'แขวนที่ผนังซ้าย' },
  right_wall: { icon: '➡️', text: 'แขวนที่ผนังขวา' },
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

// ── RoomMiniMap: top-right grid overlay of owned rooms + adjacent buy cells ──
function RoomMiniMap({ rooms, activeRoom, activeRoomId, homeRoomId, onSelect, onBuyCell, onSetHome }) {
  if (!activeRoom) return null
  const gxs = rooms.map(r => r.gridX), gys = rooms.map(r => r.gridY)
  // Pad by 1 around all rooms so every orthogonally-adjacent empty cell (a valid
  // purchase target) is visible; this also guarantees ≥3×3 when there's one room.
  const minX = Math.min(...gxs) - 1, maxX = Math.max(...gxs) + 1
  const minY = Math.min(...gys) - 1, maxY = Math.max(...gys) + 1
  const cols = maxX - minX + 1, rowsN = maxY - minY + 1
  const CELL = 24, GAP = 3
  const roomAt = (x, y) => rooms.find(r => r.gridX === x && r.gridY === y)
  const isAdjacent = (x, y) => rooms.some(r => Math.abs(r.gridX - x) + Math.abs(r.gridY - y) === 1)

  const cells = []
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const room = roomAt(x, y)
      if (room) {
        const meta = themeMeta(room.theme)
        const bg = (THEME_PALETTES[room.theme] || THEME_PALETTES.default).floorLight
        const isActive = room.id === activeRoomId
        cells.push(
          <button key={`${x}_${y}`} onClick={() => onSelect(room.id)} aria-label={meta.nameTh}
            style={{
              width: CELL, height: CELL, padding: 0, cursor: 'pointer', position: 'relative',
              borderRadius: 5, background: bg, fontSize: 12, lineHeight: `${CELL}px`, textAlign: 'center',
              border: isActive ? '2px solid #FFD23F' : '1px solid rgba(255,255,255,0.25)',
              boxShadow: isActive ? '0 0 6px rgba(255,210,63,0.6)' : 'none',
              WebkitTapHighlightColor: 'transparent',
            }}>
            {meta.icon}
            {room.id === homeRoomId && (
              <span style={{ position: 'absolute', top: -6, right: -5, fontSize: 9 }}>🏠</span>
            )}
          </button>
        )
      } else if (isAdjacent(x, y)) {
        cells.push(
          <button key={`${x}_${y}`} onClick={() => onBuyCell(x, y)} aria-label="ซื้อห้องใหม่"
            style={{
              width: CELL, height: CELL, padding: 0, cursor: 'pointer',
              borderRadius: 5, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,210,63,0.85)',
              border: '1.5px dashed rgba(255,210,63,0.55)', fontSize: 14, lineHeight: `${CELL}px`,
              WebkitTapHighlightColor: 'transparent',
            }}>
            +
          </button>
        )
      } else {
        cells.push(<div key={`${x}_${y}`} style={{ width: CELL, height: CELL }} />)
      }
    }
  }

  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 3,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
    }}>
      <div style={{
        background: 'rgba(10,8,22,0.6)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 8,
        display: 'grid', gap: GAP,
        gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
        gridTemplateRows: `repeat(${rowsN}, ${CELL}px)`,
      }}>
        {cells}
      </div>
      {onSetHome && (
        <button onClick={onSetHome} aria-label="ตั้งเป็นห้องหลัก"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            background: 'rgba(10,8,22,0.6)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '5px 10px',
            fontFamily: 'var(--font-thai)', fontSize: 11, color: '#FFD23F',
            WebkitTapHighlightColor: 'transparent',
          }}>
          🏠 ตั้งเป็นห้องหลัก
        </button>
      )}
    </div>
  )
}

// ── ROOM_ITEMS lookup by id (crafting UI + tap detection) ───────────────────
const ITEM_BY_ID = ROOM_ITEMS.reduce((m, i) => (m[i.id] = i, m), {})

// ── Main Room screen ─────────────────────────────────────────────────────────
export default function Room({ navigate }) {
  const { state, dispatch } = useAppState()
  const [selectedSlot, setSelectedSlot] = useState(null)   // { key, zone } | null — drives the unified sheet
  const [toast, setToast] = useState(null)
  const [buyTarget, setBuyTarget] = useState(null)   // ROOM_ITEMS entry currently up for purchase-confirm, or null
  const [buyRoomAt, setBuyRoomAt] = useState(null)   // { gridX, gridY } — empty mini-map cell tapped, opens room-block purchase sheet
  const [buyRoomTheme, setBuyRoomTheme] = useState(null)  // theme id selected inside that sheet, awaiting confirm
  const [craftingTable, setCraftingTable] = useState(null) // { key, zone } — a placed crafting_table was tapped → recipe sheet
  const [craftConfirm, setCraftConfirm] = useState(null)   // recipe itemId awaiting confirm inside the crafting sheet
  const [matPanelOpen, setMatPanelOpen] = useState(false)  // 🎒 material inventory panel expanded?

  const materials = state.materials ?? {}
  const craftFxRef = useRef(null)   // dedicated sparkle canvas layered over the crafting sheet
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
  layoutRef.current      = roomLayout
  selectedKeyRef.current = selectedSlot?.key ?? null
  themeRef.current       = activeTheme

  // Tap-hint fade + placement-bounce + sparkle animation state (rAF-driven, Room-editor-only).
  const hintOpacityRef   = useRef(0)
  const lastActivityRef  = useRef(0)
  const justPlacedKeyRef = useRef(null)
  const justPlacedAtRef  = useRef(0)
  const effectsRef       = useRef([])
  const rafRef           = useRef(null)
  const lastFrameRef     = useRef(0)
  const swipeStartRef    = useRef(null)   // { x, y, t } touchstart, for swipe-to-navigate
  const swipedRef        = useRef(false)  // set when a touchend resolved as a nav swipe → suppress the click

  useEffect(() => {
    playBGM('room')
    return () => stopBGM()
  }, [])

  const drawFrame = useCallback((hintOpacity, bounceKey, bounceScale) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width, H = canvas.height
    if (!W || !H) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    drawRoomScene(ctx, {
      W, H, roomLayout: layoutRef.current, small: false, hint: false,
      selectedKey: selectedKeyRef.current,
      showTapHints: true, hintOpacity,
      bounceKey, bounceScale, theme: themeRef.current,
    })
    geomRef.current = { g: computeRoomGeometry(W, H, false), W, H }
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
    const stillActive = !hintsSettled || !!bounceKey || effectsRef.current.length > 0
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
    // A nav swipe (touchend) fires a synthetic click right after — swallow it once
    // so a deliberate left/right swipe never also drops furniture on a slot.
    if (swipedRef.current) { swipedRef.current = false; return }
    wake()
    const canvas = canvasRef.current
    const g = geomRef.current?.g
    if (!canvas || !g) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (canvas.width / rect.width)
    const py = (e.clientY - rect.top)  * (canvas.height / rect.height)
    const hit = hitTestZone(g, px, py)   // zone-agnostic — figures out which zone was tapped
    if (!hit) return
    setBuyTarget(null)
    // Special-case: tapping a placed crafting table opens the recipe sheet
    // instead of the generic occupied-item sheet. Every OTHER item still opens
    // the normal picker/action sheet exactly as before.
    if (roomLayout[hit.key] === 'crafting_table') {
      setSelectedSlot(null)
      setCraftConfirm(null)
      setCraftingTable({ key: hit.key, zone: hit.zone })
      playSFX('furniture_place')
      return
    }
    setSelectedSlot({ key: hit.key, zone: hit.zone })
  }

  // Switch to the room orthogonally adjacent to the active one in a grid direction.
  // Convention: dx/dy are grid deltas (dx +1 = room to the right, dy +1 = room "below").
  function navigateGrid(dx, dy) {
    if (!activeRoom) return
    const target = rooms.find(r => r.gridX === activeRoom.gridX + dx && r.gridY === activeRoom.gridY + dy)
    if (!target || target.id === activeRoomId) return false
    dispatch({ type: ACTIONS.SET_ACTIVE_ROOM, payload: { roomId: target.id } })
    setSelectedSlot(null); setBuyTarget(null)
    playSFX('room_visit_enter')
    return true
  }

  function handleTouchStart(e) {
    const t = e.touches?.[0]
    if (!t) return
    swipeStartRef.current = { x: t.clientX, y: t.clientY, t: performance.now() }
  }

  function handleTouchEnd(e) {
    const s = swipeStartRef.current
    swipeStartRef.current = null
    const t = e.changedTouches?.[0]
    if (!s || !t) return
    const dx = t.clientX - s.x, dy = t.clientY - s.y
    const adx = Math.abs(dx), ady = Math.abs(dy)
    const dist = Math.max(adx, ady)
    const dt = performance.now() - s.t
    // Require a decisive, fast-ish drag so a slow placement-tap-with-jitter never
    // reads as navigation (tap-to-place lands via the click handler instead).
    if (dist < 50 || dt > 700) return
    let moved = false
    if (adx > ady * 1.3)      moved = navigateGrid(dx < 0 ? 1 : -1, 0)  // swipe left → next room right
    else if (ady > adx * 1.3) moved = navigateGrid(0, dy < 0 ? 1 : -1)  // swipe up → next room "below"
    if (moved) swipedRef.current = true
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
    if (coins < ROOM_BLOCK_PRICE) { flash('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_ROOM_BLOCK, payload: { gridX: buyRoomAt.gridX, gridY: buyRoomAt.gridY, theme: buyRoomTheme } })
    playSFX('coin_purchase')
    const meta = themeMeta(buyRoomTheme)
    setBuyRoomAt(null); setBuyRoomTheme(null)
    setSelectedSlot(null)
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

  // ── Crafting ──────────────────────────────────────────────────────────────
  function canAfford(itemId) {
    const recipe = RECIPES[itemId]
    if (!recipe) return false
    return Object.keys(recipe).every(k => (materials[k] || 0) >= recipe[k])
  }

  // Sparkle burst on craft success — reuses mkSparks/tickEffects on a dedicated
  // canvas layered ON TOP of the crafting sheet (the room's own overlay canvas
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

  function handleCraft(itemId) {
    if (!canAfford(itemId)) { flash('วัตถุดิบไม่พอ!'); return }
    if (ownedRoom.includes(itemId)) { flash('มีแล้ว!'); return }
    dispatch({ type: ACTIONS.CRAFT_ITEM, payload: { itemId } })
    playSFX('coin_purchase')
    setCraftConfirm(null)
    fireCraftSparkle()
    const item = ITEM_BY_ID[itemId]
    flash(item ? `ประดิษฐ์${item.nameTh}แล้ว! ✨` : 'ประดิษฐ์สำเร็จ! ✨')
  }

  function handleRemoveCraftingTable() {
    const key = craftingTable?.key
    if (!key) return
    dispatch({ type: ACTIONS.REMOVE_ROOM_ITEM, payload: { slotKey: key } })
    playSFX('furniture_remove')
    setCraftingTable(null)
    setCraftConfirm(null)
    flash('เก็บโต๊ะประดิษฐ์แล้ว')
  }

  useEffect(() => () => { if (craftFxRafRef.current) cancelAnimationFrame(craftFxRafRef.current) }, [])

  const zone       = selectedSlot?.zone ?? null
  // Craft-only items are hidden from the coin buy-picker until they're actually
  // crafted (owned); once owned they behave exactly like any bought item here.
  const zoneItems  = zone ? ROOM_ITEMS.filter(i =>
    (i.allowedZones || []).includes(zone) && (!i.craftedOnly || ownedRoom.includes(i.id))
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            imageRendering: 'pixelated', cursor: 'pointer',
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

        {/* Mini-map — top-right grid of rooms + adjacent "+" purchase cells */}
        <RoomMiniMap
          rooms={rooms}
          activeRoom={activeRoom}
          activeRoomId={activeRoomId}
          homeRoomId={homeRoomId}
          onSelect={(id) => {
            if (id === activeRoomId) return
            dispatch({ type: ACTIONS.SET_ACTIVE_ROOM, payload: { roomId: id } })
            setSelectedSlot(null); setBuyTarget(null)
            playSFX('room_visit_enter')
          }}
          onBuyCell={(gridX, gridY) => { setBuyRoomTheme(null); setBuyRoomAt({ gridX, gridY }) }}
          onSetHome={activeRoomId !== homeRoomId ? () => {
            dispatch({ type: ACTIONS.SET_HOME_ROOM, payload: { roomId: activeRoomId } })
            playSFX('coin_purchase')
            flash('ตั้งเป็นห้องหลักแล้ว 🏠')
          } : null}
        />

        {/* Material inventory panel (🎒 วัตถุดิบ) — collapsible, top-left below
            the ROOM header pill. Shows collected materials + a shortcut to go
            collect more in the world. */}
        <div style={{
          position: 'absolute', top: 48, left: 10, zIndex: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
        }}>
          <button
            onClick={() => setMatPanelOpen(o => !o)}
            aria-label="วัตถุดิบ"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              background: 'rgba(10,8,20,0.55)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16,
              padding: '5px 12px', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 15 }}>🎒</span>
            <span style={{ fontFamily: 'var(--font-thai)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              วัตถุดิบ
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{matPanelOpen ? '▲' : '▼'}</span>
          </button>
          {matPanelOpen && (
            <div style={{
              background: 'rgba(10,8,22,0.72)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14,
              padding: 10, minWidth: 150,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {MATERIALS.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    opacity: (materials[m.id] ?? 0) > 0 ? 1 : 0.4,
                  }}>
                    <span style={{ fontSize: 18 }}>{m.icon}</span>
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#FFD23F' }}>
                      {materials[m.id] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate && navigate('world')}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 0',
                  background: 'rgba(52,199,89,0.22)', color: '#7dffa0',
                  fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                🧺 ไปเก็บ →
              </button>
            </div>
          )}
        </div>

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
                🏗️ สร้างห้องใหม่
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
                        }}>🛒 ซื้อ 🪙{ROOM_BLOCK_PRICE}</button>
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

      {/* ── Crafting sheet (tapping a placed crafting_table) ─────────────────── */}
      {craftingTable && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div
            onClick={() => { setCraftingTable(null); setCraftConfirm(null) }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            maxHeight: '66vh', display: 'flex', flexDirection: 'column',
            background: 'rgba(26,16,64,0.92)', backdropFilter: 'blur(14px)',
            borderRadius: '24px 24px 0 0', padding: '16px 16px 0',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            animation: 'fadeInUp 0.22s ease both', boxSizing: 'border-box',
          }}>
            {/* Header — title + material summary + remove-table + close */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700, color: '#FFD23F' }}>
                🔨 โต๊ะประดิษฐ์
              </span>
              <div style={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
                overflowX: 'auto', justifyContent: 'flex-end',
              }}>
                {MATERIALS.filter(m => (materials[m.id] ?? 0) > 0).map(m => (
                  <span key={m.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 1,
                    fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#fff', whiteSpace: 'nowrap',
                  }}>
                    <span style={{ fontSize: 13 }}>{m.icon}</span>{materials[m.id]}
                  </span>
                ))}
              </div>
              <button onClick={handleRemoveCraftingTable} aria-label="เก็บโต๊ะ"
                style={{
                  flexShrink: 0, border: '1px solid rgba(255,80,80,0.4)', cursor: 'pointer',
                  background: 'rgba(255,80,80,0.16)', borderRadius: 9, padding: '5px 9px',
                  fontSize: 14, WebkitTapHighlightColor: 'transparent',
                }}>🗑️</button>
              <button onClick={() => { setCraftingTable(null); setCraftConfirm(null) }} aria-label="ปิด"
                style={{
                  flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '5px 9px',
                  fontSize: 14, color: '#fff', WebkitTapHighlightColor: 'transparent',
                }}>✕</button>
            </div>

            {craftConfirm ? (
              // Confirm sub-view
              (() => {
                const item = ITEM_BY_ID[craftConfirm]
                const recipe = RECIPES[craftConfirm] || {}
                const afford = canAfford(craftConfirm)
                return (
                  <div style={{
                    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 12,
                  }}>
                    <SlotCanvas item={item} size={80} />
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                      ประดิษฐ์{item?.nameTh}?
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {Object.keys(recipe).map(k => (
                        <span key={k} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          fontFamily: 'var(--font-pixel)', fontSize: 12,
                          color: (materials[k] || 0) >= recipe[k] ? '#7dffa0' : '#ff8a8a',
                        }}>
                          <span style={{ fontSize: 16 }}>{MATERIAL_ICON[k]}</span>×{recipe[k]}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
                      <button onClick={() => setCraftConfirm(null)} aria-label="ย้อนกลับ"
                        style={{
                          flex: 1, border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 0',
                          fontFamily: 'var(--font-thai)', fontSize: 14, color: 'rgba(255,255,255,0.7)',
                          WebkitTapHighlightColor: 'transparent',
                        }}>← ย้อนกลับ</button>
                      <button onClick={() => handleCraft(craftConfirm)} disabled={!afford} aria-label="ประดิษฐ์"
                        style={{
                          flex: 2, border: 'none', cursor: afford ? 'pointer' : 'default',
                          background: afford ? 'rgba(255,210,63,0.22)' : 'rgba(255,255,255,0.08)',
                          borderRadius: 10, padding: '12px 0', fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700,
                          color: afford ? '#FFD23F' : 'rgba(255,255,255,0.3)', WebkitTapHighlightColor: 'transparent',
                        }}>🔨 ประดิษฐ์!</button>
                    </div>
                  </div>
                )
              })()
            ) : (
              // Recipe grid — 2 columns
              <div style={{
                flex: 1, minHeight: 0, overflowY: 'auto',
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
                paddingBottom: 12,
              }}>
                {RECIPE_LIST.map(itemId => {
                  const item = ITEM_BY_ID[itemId]
                  const recipe = RECIPES[itemId] || {}
                  const owned = ownedRoom.includes(itemId)
                  const afford = canAfford(itemId)
                  return (
                    <div key={itemId} style={{
                      borderRadius: 12, padding: '10px 8px', boxSizing: 'border-box', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: owned ? 'rgba(255,210,63,0.10)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${owned ? 'rgba(255,210,63,0.55)' : 'rgba(255,255,255,0.10)'}`,
                    }}>
                      <SlotCanvas item={item} size={54} />
                      <span style={{
                        fontFamily: 'var(--font-thai)', fontSize: 12, color: '#fff',
                        textAlign: 'center', lineHeight: 1.15,
                      }}>{item?.nameTh}</span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {Object.keys(recipe).map(k => (
                          <span key={k} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 1,
                            fontFamily: 'var(--font-pixel)', fontSize: 10,
                            color: (materials[k] || 0) >= recipe[k] ? '#cfe8d0' : '#ff9a9a',
                          }}>
                            <span style={{ fontSize: 13 }}>{MATERIAL_ICON[k]}</span>×{recipe[k]}
                          </span>
                        ))}
                      </div>
                      {owned ? (
                        <div style={{
                          width: '100%', textAlign: 'center', borderRadius: 8, padding: '7px 0',
                          background: 'rgba(255,210,63,0.14)', color: '#FFD23F',
                          fontFamily: 'var(--font-thai)', fontSize: 12, fontWeight: 700,
                        }}>✓ มีแล้ว</div>
                      ) : (
                        <button
                          onClick={() => { if (afford) setCraftConfirm(itemId); else flash('วัตถุดิบไม่พอ!') }}
                          aria-label="ประดิษฐ์"
                          style={{
                            width: '100%', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '7px 0',
                            background: afford ? 'rgba(52,199,89,0.24)' : 'rgba(255,255,255,0.06)',
                            color: afford ? '#7dffa0' : 'rgba(255,255,255,0.35)',
                            fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                            WebkitTapHighlightColor: 'transparent',
                          }}>ประดิษฐ์!</button>
                      )}
                    </div>
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
      )}

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
