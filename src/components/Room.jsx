import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { ROOM_ITEMS } from '../lib/roomItems.js'
import { drawRoomScene, computeRoomGeometry, hitTestZone, parseSlotKey } from '../lib/roomScene.js'
import { playSFX, playBGM, stopBGM } from '../lib/audio.js'

const SCENE_H = 380   // px — iso room canvas height

const ZONE_TABS = [
  { zone: 'floor',      label: 'พื้น' },
  { zone: 'left_wall',  label: 'ผนังซ้าย' },
  { zone: 'right_wall', label: 'ผนังขวา' },
]

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

// ── ItemThumb: small card in the placement picker ───────────────────────────
function ItemThumb({ item, onTap }) {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        minWidth: 72, padding: '8px 6px 6px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10, cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
      }}
    >
      <SlotCanvas item={item} size={48} />
      <span style={{
        fontFamily: 'var(--font-thai)', fontSize: 11, color: '#ffffff',
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {item.nameTh}
      </span>
    </div>
  )
}

// ── Main Room screen ─────────────────────────────────────────────────────────
export default function Room() {
  const { state, dispatch } = useAppState()
  const [activeZone, setActiveZone] = useState('floor')
  const [pickerKey, setPickerKey] = useState(null)   // empty slot key awaiting placement / swap
  const [actionKey, setActionKey] = useState(null)   // occupied slot key for remove/swap
  const [toast, setToast] = useState(null)

  const coins      = state.coins ?? 0
  const ownedRoom  = state.ownedRoomItems ?? []
  const roomLayout = state.roomLayout ?? {}

  const wrapRef   = useRef(null)
  const canvasRef = useRef(null)
  const geomRef   = useRef(null)   // { g, W, H } — geometry the visible canvas was drawn with

  // The slot currently highlighted (whichever sheet is open)
  const selectedKey = actionKey || pickerKey || null

  useEffect(() => {
    playBGM('room')
    return () => stopBGM()
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return
    const W = wrap.clientWidth || 360
    const H = SCENE_H
    if (canvas.width !== W)  canvas.width = W
    if (canvas.height !== H) canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    drawRoomScene(ctx, { W, H, roomLayout, small: false, hint: false, activeZone, selectedKey })
    geomRef.current = { g: computeRoomGeometry(W, H, false), W, H }
  }, [roomLayout, activeZone, selectedKey])

  useEffect(() => { redraw() }, [redraw])

  useEffect(() => {
    const onResize = () => redraw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [redraw])

  const placedIds = Object.values(roomLayout)

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current
    const g = geomRef.current?.g
    if (!canvas || !g) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (canvas.width / rect.width)
    const py = (e.clientY - rect.top)  * (canvas.height / rect.height)
    const hit = hitTestZone(g, px, py, activeZone)
    if (!hit) return
    if (roomLayout[hit.key]) setActionKey(hit.key)
    else                     setPickerKey(hit.key)
  }

  // Items owned + allowed in the picker's zone + not already placed elsewhere
  function pickChoices(slotKey) {
    const zone = parseSlotKey(slotKey)?.zone
    if (!zone) return []
    return ROOM_ITEMS.filter(i =>
      ownedRoom.includes(i.id) &&
      (i.allowedZones || []).includes(zone) &&
      !placedIds.includes(i.id)
    )
  }

  function handlePlace(item) {
    dispatch({ type: ACTIONS.PLACE_ROOM_ITEM, payload: { slotKey: pickerKey, itemId: item.id } })
    playSFX('furniture_place')
    setPickerKey(null)
    flash(`วาง${item.nameTh}แล้ว! 🏠`)
  }

  function handleRemove() {
    const itemId = roomLayout[actionKey]
    const item = ROOM_ITEMS.find(i => i.id === itemId)
    dispatch({ type: ACTIONS.REMOVE_ROOM_ITEM, payload: { slotKey: actionKey } })
    playSFX('furniture_remove')
    setActionKey(null)
    flash(item ? `เก็บ${item.nameTh}แล้ว` : 'เก็บของแล้ว')
  }

  function handleZoneTab(zone) {
    setActiveZone(zone)
    setPickerKey(null)
    setActionKey(null)
  }

  const pickerChoices = pickerKey ? pickChoices(pickerKey) : []
  const actionItemId  = actionKey ? roomLayout[actionKey] : null
  const actionZone    = actionKey ? parseSlotKey(actionKey)?.zone : null
  const swapChoices   = actionKey
    ? ROOM_ITEMS.filter(i =>
        ownedRoom.includes(i.id) &&
        (i.allowedZones || []).includes(actionZone) &&
        i.id !== actionItemId &&
        !placedIds.includes(i.id))
    : []

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: '#0a0a12', paddingBottom: 80, boxSizing: 'border-box',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 18px 10px',
        borderBottom: '2px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#EF9F27', letterSpacing: 3 }}>
          ROOM
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,210,63,0.12)', border: '1px solid rgba(255,210,63,0.35)',
          borderRadius: 20, padding: '4px 12px',
          fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#FFD23F',
        }}>
          🪙 {coins}
        </span>
      </div>

      {/* Iso room scene — single canvas doing both draw + hit-test */}
      <div ref={wrapRef} style={{
        position: 'relative', width: '100%',
        height: SCENE_H, flexShrink: 0, overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            display: 'block', width: '100%', height: '100%',
            imageRendering: 'pixelated', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      </div>

      {/* Zone switcher */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'center',
        padding: '12px 18px 4px',
      }}>
        {ZONE_TABS.map(t => {
          const on = activeZone === t.zone
          return (
            <button
              key={t.zone}
              onClick={() => handleZoneTab(t.zone)}
              style={{
                flex: 1, maxWidth: 120, border: 'none', cursor: 'pointer',
                borderRadius: 10, padding: '9px 0',
                fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 700,
                background: on ? 'rgba(255,210,63,0.22)' : 'rgba(255,255,255,0.05)',
                color: on ? '#FFD23F' : 'rgba(255,255,255,0.5)',
                border: on ? '1.5px solid rgba(255,210,63,0.5)' : '1.5px solid transparent',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Hint text below room */}
      <div style={{
        padding: '8px 18px 6px',
        fontFamily: 'var(--font-thai)', fontSize: 12,
        color: 'rgba(255,255,255,0.35)', textAlign: 'center',
      }}>
        แตะช่องว่างเพื่อวางของ • แตะของที่วางไว้เพื่อเปลี่ยน/เก็บ
      </div>

      {/* ── Placement picker modal ─────────────────────────────────────── */}
      {pickerKey !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div
            onClick={() => setPickerKey(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            background: '#1a1040',
            borderRadius: '18px 18px 0 0',
            padding: '18px 16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            animation: 'fadeInUp 0.22s ease both',
          }}>
            <div style={{
              fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700,
              color: '#FFD23F', marginBottom: 14, textAlign: 'center',
            }}>
              เลือกของที่จะวาง
            </div>

            {pickerChoices.length === 0 ? (
              <div style={{
                padding: '20px 0', textAlign: 'center',
                fontFamily: 'var(--font-thai)', fontSize: 13,
                color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
              }}>
                ยังไม่มีของสำหรับตรงนี้<br />
                <span style={{ color: '#FFD23F' }}>ซื้อในร้านค้าก่อนนะ</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {pickerChoices.map(item => (
                  <ItemThumb key={item.id} item={item} onTap={() => handlePlace(item)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action modal (remove / swap for occupied slot) ─────────────── */}
      {actionKey !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div
            onClick={() => setActionKey(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            background: '#1a1040',
            borderRadius: '18px 18px 0 0',
            padding: '18px 16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            animation: 'fadeInUp 0.22s ease both',
          }}>
            {actionItemId && (() => {
              const cur = ROOM_ITEMS.find(i => i.id === actionItemId)
              return cur ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <SlotCanvas item={cur} size={52} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700, color: '#FFD23F' }}>
                      {cur.nameTh}
                    </div>
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      วางอยู่ในห้อง
                    </div>
                  </div>
                </div>
              ) : null
            })()}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleRemove}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,80,80,0.18)', borderRadius: 10,
                  padding: '10px 0',
                  fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 700,
                  color: '#ff8080',
                }}
              >
                ย้ายออก
              </button>
              {swapChoices.length > 0 && (
                <button
                  onClick={() => { const k = actionKey; setActionKey(null); setPickerKey(k) }}
                  style={{
                    flex: 1, border: 'none', cursor: 'pointer',
                    background: 'rgba(255,210,63,0.18)', borderRadius: 10,
                    padding: '10px 0',
                    fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 700,
                    color: '#FFD23F',
                  }}
                >
                  เปลี่ยน
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
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
