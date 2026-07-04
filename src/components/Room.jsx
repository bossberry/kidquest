import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { ROOM_ITEMS } from '../lib/roomItems.js'
import { drawRoomScene, computeRoomGeometry, hitTestZone, parseSlotKey, slotCenter } from '../lib/roomScene.js'
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

// ── Main Room screen ─────────────────────────────────────────────────────────
export default function Room() {
  const { state, dispatch } = useAppState()
  const [selectedSlot, setSelectedSlot] = useState(null)   // { key, zone } | null — drives the unified sheet
  const [toast, setToast] = useState(null)
  const [buyTarget, setBuyTarget] = useState(null)   // ROOM_ITEMS entry currently up for purchase-confirm, or null

  const coins      = state.coins ?? 0
  const ownedRoom  = state.ownedRoomItems ?? []
  const roomLayout = state.roomLayout ?? {}

  const wrapRef    = useRef(null)
  const canvasRef  = useRef(null)
  const overlayRef = useRef(null)
  const geomRef    = useRef(null)   // { g, W, H } — geometry the visible canvas was last drawn with

  // Refs mirroring the latest render-relevant data so the rAF loop (which lives
  // outside React's render cycle) never reads a stale closure.
  const layoutRef      = useRef(roomLayout)
  const selectedKeyRef = useRef(null)
  layoutRef.current      = roomLayout
  selectedKeyRef.current = selectedSlot?.key ?? null

  // Tap-hint fade + placement-bounce + sparkle animation state (rAF-driven, Room-editor-only).
  const hintOpacityRef   = useRef(0)
  const lastActivityRef  = useRef(0)
  const justPlacedKeyRef = useRef(null)
  const justPlacedAtRef  = useRef(0)
  const effectsRef       = useRef([])
  const rafRef           = useRef(null)
  const lastFrameRef     = useRef(0)

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
      bounceKey, bounceScale,
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
  }, [roomLayout, selectedSlot, drawFrame])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function handleCanvasClick(e) {
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
    setSelectedSlot({ key: hit.key, zone: hit.zone })
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

  const zone       = selectedSlot?.zone ?? null
  const zoneItems  = zone ? ROOM_ITEMS.filter(i => (i.allowedZones || []).includes(zone)) : []
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
