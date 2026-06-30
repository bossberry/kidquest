import React, { useRef, useEffect, useState } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { ROOM_ITEMS } from '../lib/roomItems.js'
import EggCanvas from './EggCanvas.jsx'

const COLS = 4
const ROWS = 3
const TOTAL_SLOTS = COLS * ROWS   // 12

const SLOT_SIZE = 64   // px — each slot square
const GAP = 8          // px — gap between slots

// Grid total width: 4×64 + 3×8 = 280px
const GRID_W = COLS * SLOT_SIZE + (COLS - 1) * GAP

// ── SlotCanvas: renders one furniture item onto a canvas element ────────────
function SlotCanvas({ item, size = SLOT_SIZE - 16 }) {
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

// ── Slot: one grid cell in the room ───────────────────────────────────────
function Slot({ index, roomItem, onTap }) {
  return (
    <div
      onClick={() => onTap(index)}
      style={{
        width: SLOT_SIZE, height: SLOT_SIZE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: 10,
        background: roomItem
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.06)',
        border: roomItem
          ? '1.5px solid rgba(255,255,255,0.22)'
          : '1.5px dashed rgba(255,255,255,0.18)',
        boxSizing: 'border-box',
        transition: 'background 0.15s, border-color 0.15s',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {roomItem ? (
        <SlotCanvas item={roomItem} size={SLOT_SIZE - 16} />
      ) : (
        <span style={{
          fontSize: 18, color: 'rgba(255,255,255,0.18)',
          fontFamily: 'var(--font-pixel)', lineHeight: 1,
          userSelect: 'none',
        }}>+</span>
      )}
    </div>
  )
}

// ── ItemThumb: small card in the placement picker ─────────────────────────
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

// ── Main Room screen ───────────────────────────────────────────────────────
export default function Room() {
  const { state, dispatch } = useAppState()
  const [pickerSlot, setPickerSlot] = useState(null)   // slot index awaiting placement
  const [actionSlot, setActionSlot] = useState(null)   // slot index for remove/swap action
  const [toast, setToast]   = useState(null)

  const coins       = state.coins ?? 0
  const ownedRoom   = state.ownedRoomItems ?? []
  const roomLayout  = state.roomLayout ?? {}

  // Items currently placed somewhere in the room
  const placedIds = Object.values(roomLayout)

  // Items owned but not yet placed (available to place)
  const unplaced = ROOM_ITEMS.filter(i => ownedRoom.includes(i.id) && !placedIds.includes(i.id))

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function handleSlotTap(idx) {
    if (roomLayout[idx]) {
      setActionSlot(idx)
    } else {
      setPickerSlot(idx)
    }
  }

  function handlePlace(item) {
    dispatch({ type: ACTIONS.PLACE_ROOM_ITEM, payload: { slotIndex: pickerSlot, itemId: item.id } })
    setPickerSlot(null)
    flash(`วาง${item.nameTh}แล้ว! 🏠`)
  }

  function handleSwapPick(item) {
    // Remove what's already there, then place new item
    dispatch({ type: ACTIONS.REMOVE_ROOM_ITEM, payload: { slotIndex: actionSlot } })
    dispatch({ type: ACTIONS.PLACE_ROOM_ITEM,  payload: { slotIndex: actionSlot, itemId: item.id } })
    setActionSlot(null)
    flash(`เปลี่ยนเป็น${item.nameTh}แล้ว!`)
  }

  function handleRemove() {
    const itemId = roomLayout[actionSlot]
    const item = ROOM_ITEMS.find(i => i.id === itemId)
    dispatch({ type: ACTIONS.REMOVE_ROOM_ITEM, payload: { slotIndex: actionSlot } })
    setActionSlot(null)
    flash(item ? `เก็บ${item.nameTh}แล้ว` : 'เก็บของแล้ว')
  }

  // The item currently in the action slot (for swap: show all owned-but-unplaced PLUS current)
  const actionItemId = actionSlot !== null ? roomLayout[actionSlot] : null
  const swapChoices = actionSlot !== null
    ? ROOM_ITEMS.filter(i => ownedRoom.includes(i.id) && i.id !== actionItemId && !placedIds.includes(i.id))
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

      {/* Room scene */}
      <div style={{
        position: 'relative', width: '100%',
        height: 380, flexShrink: 0, overflow: 'hidden',
        // Wall (warm cream) top 65%, wood floor bottom 35%
        background: 'linear-gradient(to bottom, #F2E8D8 65%, #8B6340 65%)',
      }}>
        {/* Baseboard line */}
        <div style={{
          position: 'absolute', top: '65%', left: 0, right: 0,
          height: 6, background: '#C09060',
        }} />

        {/* Furniture grid — centered horizontally, pinned top */}
        <div style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${SLOT_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${SLOT_SIZE}px)`,
          gap: GAP,
          width: GRID_W,
        }}>
          {Array.from({ length: TOTAL_SLOTS }).map((_, idx) => {
            const itemId = roomLayout[idx]
            const roomItem = itemId ? ROOM_ITEMS.find(i => i.id === itemId) : null
            return (
              <Slot
                key={idx}
                index={idx}
                roomItem={roomItem}
                onTap={handleSlotTap}
              />
            )
          })}
        </div>

        {/* Companion egg — standing on the floor */}
        <div style={{
          position: 'absolute', bottom: 10,
          left: '50%', transform: 'translateX(-50%)',
        }}>
          <EggCanvas width={80} height={95} anim="idle" />
        </div>

        {/* Floor grain hint */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '35%', pointerEvents: 'none',
          background: 'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.06) 40px)',
        }} />
      </div>

      {/* Hint text below room */}
      <div style={{
        padding: '10px 18px 6px',
        fontFamily: 'var(--font-thai)', fontSize: 12,
        color: 'rgba(255,255,255,0.35)', textAlign: 'center',
      }}>
        แตะช่องว่างเพื่อวางของ • แตะของที่วางไว้เพื่อเปลี่ยน/เก็บ
      </div>

      {/* ── Placement picker modal ─────────────────────────────────────── */}
      {pickerSlot !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9100,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setPickerSlot(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          {/* Sheet */}
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

            {unplaced.length === 0 ? (
              <div style={{
                padding: '20px 0', textAlign: 'center',
                fontFamily: 'var(--font-thai)', fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.7,
              }}>
                ยังไม่มีของที่วางได้<br />
                <span style={{ color: '#FFD23F' }}>ซื้อในร้านค้าก่อนนะ</span>
              </div>
            ) : (
              <div style={{
                display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
              }}>
                {unplaced.map(item => (
                  <ItemThumb key={item.id} item={item} onTap={() => handlePlace(item)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action modal (remove / swap for occupied slot) ─────────────── */}
      {actionSlot !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9100,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={() => setActionSlot(null)}
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
            {/* Current item preview */}
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

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: swapChoices.length > 0 ? 14 : 0 }}>
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
                  onClick={() => { setActionSlot(null); setPickerSlot(actionSlot) }}
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
