import React, { useRef, useEffect, useState } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import { ROOM_ITEMS } from '../lib/roomItems.js'
import EggCanvas from './EggCanvas.jsx'

// Tier label + color (shared by cosmetics and furniture)
const TIER_META = {
  small: { label: 'COMMON',  color: '#aaaacc' },
  mid:   { label: 'RARE',    color: '#66aaff' },
  big:   { label: 'EPIC',    color: '#FFD23F' },
}

const HEAD_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'head')
const FACE_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'face')

// Map egg XP stage (0–8) to companion aura level (0–4) — mirrors Home.jsx
function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}

// Small canvas preview for a furniture item icon
function FurniturePreview({ item, size = 64 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !item) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    item.draw(ctx, size / 2, size / 2, size * 0.82)
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

export default function Collection() {
  const { state, dispatch, eggProgressData } = useAppState()
  // top-level tabs: 'wearable' | 'furniture'
  const [topTab, setTopTab] = useState('wearable')
  // wearable sub-tabs: 'head' | 'face'
  const [wearableTab, setWearableTab] = useState('head')
  const [toast, setToast] = useState(null)
  // Local-only try-on of an UNOWNED item: { slot, id } | null.
  // NEVER persisted — resets on unmount / buy / real equip. Owned items skip this
  // (their equip is real, driven straight from state.equipped).
  const [preview, setPreview] = useState(null)

  const coins       = state.coins ?? 0
  const owned       = state.ownedItems ?? []
  const equipped    = state.equipped ?? { head: null, face: null }
  const ownedRoom   = state.ownedRoomItems ?? []
  const stage       = eggProgressData?.stage ?? 1

  // Equipped map passed to the big preview egg: real equipped, but with the
  // tried-on slot overridden locally when previewing an unowned item.
  // undefined → EggCanvas wrapper falls back to state.equipped (real).
  const previewEquipped = preview
    ? { ...equipped, [preview.slot]: preview.id }
    : undefined

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  // ── Wearable actions ────────────────────────────────────────────────────
  function handleBuyWearable(item) {
    if (coins < item.price) { showToast('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_ITEM, payload: { id: item.id, price: item.price, slot: item.slot } })
    setPreview(null) // real state now reflects it — drop the local try-on
    showToast(`ได้รับ ${item.nameTh}!`)
  }
  // Tapping a card: owned → real equip toggle; unowned → local try-on only.
  function handleSelectWearable(item) {
    if (isOwned(item)) {
      dispatch({ type: ACTIONS.EQUIP_ITEM, payload: { id: item.id, slot: item.slot } })
      setPreview(null) // real equipped state drives the egg
    } else {
      setPreview({ slot: item.slot, id: item.id })
    }
  }
  const isOwned      = (item) => owned.includes(item.id)
  const isEquipped   = (item) => equipped[item.slot] === item.id
  const isPreviewing = (item) => preview && preview.slot === item.slot && preview.id === item.id
  // Which item is currently shown on the big egg for a slot (preview wins).
  const isShown = (item) =>
    (preview && preview.slot === item.slot ? preview.id : equipped[item.slot]) === item.id

  // ── Furniture actions ───────────────────────────────────────────────────
  function handleBuyFurniture(item) {
    if (coins < item.price) { showToast('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_ROOM_ITEM, payload: { id: item.id, price: item.price } })
    showToast(`ได้รับ ${item.nameTh}! วางในห้องได้เลย 🏠`)
  }
  const isOwnedRoom = (item) => ownedRoom.includes(item.id)

  // ── Wearable items to display ───────────────────────────────────────────
  const wearableItems = wearableTab === 'head' ? HEAD_ITEMS : FACE_ITEMS

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--px-darkest, #0a0a12)', paddingBottom: 80,
      boxSizing: 'border-box',
    }}>

      {/* Page header + coin balance */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 18px 10px',
        borderBottom: '2px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#EF9F27', letterSpacing: 3 }}>
          SHOP
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

      {/* Top-level category tabs */}
      {/* flexShrink/flexGrow 0: this is a fixed-size control inside the outer
          flex-column. Because it sets overflow:hidden (to clip the rounded
          corners), CSS flexbox gives it an automatic min-height of 0, so when
          page content exceeds the viewport the flex-shrink algorithm collapses
          it to ~2px — hiding both tab buttons and making the furniture tab
          unreachable. Pinning shrink/grow to 0 keeps its content height. */}
      <div style={{
        display: 'flex', gap: 0, flexShrink: 0, flexGrow: 0,
        margin: '12px 16px 0', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        {[
          { key: 'wearable',  label: '👗 แต่งตัว' },
          { key: 'furniture', label: '🏠 เฟอร์นิเจอร์' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTopTab(key); setPreview(null) }}
            style={{
              flex: 1, border: 'none', cursor: 'pointer', padding: '10px 0',
              fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 600,
              background: topTab === key ? 'rgba(255,210,63,0.18)' : 'transparent',
              color: topTab === key ? '#FFD23F' : 'rgba(255,255,255,0.45)',
              borderBottom: topTab === key ? '2px solid #FFD23F' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── WEARABLE section ─────────────────────────────────────────────── */}
      {topTab === 'wearable' && (
        <>
          {/* Big companion preview — always the child's real egg (element/eye/
              gender/stage/aura) + real equipped, OR a local try-on override.
              Tapping any item card below updates this instantly. */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <EggCanvas
                stage={stage}
                aura={stageToAura(stage)}
                width={140} height={166}
                anim="idle"
                equipped={previewEquipped}
              />
              {/* "trying on" tag — only while previewing an unowned item */}
              {preview && (
                <div style={{
                  position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(124,77,255,0.94)', color: '#fff',
                  fontFamily: 'var(--font-thai)', fontSize: 11, fontWeight: 700,
                  padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)', pointerEvents: 'none',
                }}>
                  👀 ลองใส่
                </div>
              )}
            </div>
          </div>

          {/* Head / Face sub-tabs */}
          {/* Same flexShrink/flexGrow 0 fix as the top-level tabs above: this
              overflow:hidden flex item otherwise collapses to ~2px (verified
              live) when page content exceeds the viewport, hiding both tabs. */}
          <div style={{
            display: 'flex', gap: 0, flexShrink: 0, flexGrow: 0,
            margin: '4px 16px 14px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
          }}>
            {[
              { key: 'head', label: 'หัว' },
              { key: 'face', label: 'หน้า' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setWearableTab(key)}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer', padding: '8px 0',
                  fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 600,
                  background: wearableTab === key ? 'rgba(255,210,63,0.14)' : 'transparent',
                  color: wearableTab === key ? '#FFD23F' : 'rgba(255,255,255,0.45)',
                  borderBottom: wearableTab === key ? '2px solid #FFD23F' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Wearable item grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12, padding: '0 14px',
          }}>
            {wearableItems.map(item => {
              const owned_ = isOwned(item)
              const eqd    = isEquipped(item)
              const shown  = isShown(item)        // currently on the big egg (preview or real)
              const trying = isPreviewing(item)   // local try-on of this unowned item
              const canAfford = coins >= item.price
              const iconEq = { head: null, face: null, [item.slot]: item.id }

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectWearable(item)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer',
                    background: shown ? 'rgba(255,210,63,0.08)' : 'rgba(255,255,255,0.03)',
                    border: shown ? '1.5px solid rgba(255,210,63,0.55)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '12px 8px 10px', gap: 8,
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  {/* Tier badge */}
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: 7, letterSpacing: 1,
                    color: TIER_META[item.tier].color,
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: 4, padding: '2px 5px', alignSelf: 'flex-end',
                  }}>
                    {TIER_META[item.tier].label}
                  </span>

                  {/* Isolated icon egg showing just this item */}
                  <EggCanvas width={80} height={95} anim="idle" equipped={iconEq} />

                  {/* Item name */}
                  <div style={{
                    fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 600,
                    color: '#ffffff', textAlign: 'center', lineHeight: 1.3,
                  }}>
                    {item.nameTh}
                  </div>

                  {/* Status line: real equipped vs local try-on */}
                  {eqd ? (
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: '#FFD23F', letterSpacing: 1 }}>
                      ✓ ใส่อยู่
                    </div>
                  ) : trying ? (
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, fontWeight: 700, color: '#b39dff' }}>
                      👀 กำลังลอง
                    </div>
                  ) : null}

                  {owned_ ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectWearable(item) }}
                      style={{
                        border: 'none', cursor: 'pointer', borderRadius: 8,
                        padding: '7px 14px', width: '100%',
                        fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                        background: eqd ? 'rgba(255,255,255,0.1)' : 'rgba(255,210,63,0.22)',
                        color: eqd ? 'rgba(255,255,255,0.5)' : '#FFD23F',
                        transition: 'all 0.15s',
                      }}
                    >
                      {eqd ? 'ถอดออก' : 'ใส่'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBuyWearable(item) }}
                      disabled={!canAfford}
                      style={{
                        border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed',
                        borderRadius: 8, padding: '7px 14px', width: '100%',
                        fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                        background: canAfford ? 'rgba(255,210,63,0.22)' : 'rgba(255,255,255,0.06)',
                        color: canAfford ? '#FFD23F' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.15s',
                      }}
                    >
                      ซื้อ 🪙 {item.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── FURNITURE section ─────────────────────────────────────────────── */}
      {topTab === 'furniture' && (
        <>
          <div style={{
            padding: '10px 18px 4px',
            fontFamily: 'var(--font-thai)', fontSize: 12,
            color: 'rgba(255,255,255,0.4)', textAlign: 'center',
          }}>
            ซื้อแล้ววางในห้องได้เลย!
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12, padding: '8px 14px',
          }}>
            {ROOM_ITEMS.map(item => {
              const ownedR    = isOwnedRoom(item)
              const canAfford = coins >= item.price

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: ownedR ? 'rgba(68,200,136,0.07)' : 'rgba(255,255,255,0.03)',
                    border: ownedR ? '1.5px solid rgba(68,200,136,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '12px 8px 10px', gap: 8,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Tier badge */}
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: 7, letterSpacing: 1,
                    color: TIER_META[item.tier].color,
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: 4, padding: '2px 5px', alignSelf: 'flex-end',
                  }}>
                    {TIER_META[item.tier].label}
                  </span>

                  {/* Furniture pixel-art preview on a warm background */}
                  <div style={{
                    width: 80, height: 80,
                    background: 'linear-gradient(to bottom, #F2E8D8 65%, #8B6340 65%)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <FurniturePreview item={item} size={64} />
                  </div>

                  {/* Name */}
                  <div style={{
                    fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 600,
                    color: '#ffffff', textAlign: 'center', lineHeight: 1.3,
                  }}>
                    {item.nameTh}
                  </div>

                  {ownedR && (
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: '#44CC88', letterSpacing: 1 }}>
                      ✓ มีแล้ว
                    </div>
                  )}

                  <button
                    onClick={() => !ownedR && handleBuyFurniture(item)}
                    disabled={ownedR || !canAfford}
                    style={{
                      border: 'none',
                      cursor: ownedR ? 'default' : canAfford ? 'pointer' : 'not-allowed',
                      borderRadius: 8, padding: '7px 14px', width: '100%',
                      fontFamily: ownedR ? 'var(--font-thai)' : 'var(--font-pixel)',
                      fontSize: ownedR ? 12 : 9, letterSpacing: ownedR ? 0 : 1,
                      fontWeight: 700,
                      background: ownedR
                        ? 'rgba(68,200,136,0.12)'
                        : canAfford
                          ? 'rgba(255,210,63,0.22)'
                          : 'rgba(255,255,255,0.06)',
                      color: ownedR
                        ? '#44CC88'
                        : canAfford ? '#FFD23F' : 'rgba(255,255,255,0.25)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {ownedR ? 'วางในห้อง' : `🪙 ${item.price}`}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
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
