import React, { useState } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import EggCanvas from './EggCanvas.jsx'

// Tier label + color
const TIER_META = {
  small: { label: 'COMMON',  color: '#aaaacc' },
  mid:   { label: 'RARE',    color: '#66aaff' },
  big:   { label: 'EPIC',    color: '#FFD23F' },
}

const HEAD_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'head')
const FACE_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'face')

export default function Collection() {
  const { state, dispatch } = useAppState()
  const [tab, setTab] = useState('head')  // 'head' | 'face'
  const [toast, setToast] = useState(null)

  const coins = state.coins ?? 0
  const owned = state.ownedItems ?? []
  const equipped = state.equipped ?? { head: null, face: null }

  const items = tab === 'head' ? HEAD_ITEMS : FACE_ITEMS

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function handleBuy(item) {
    if (coins < item.price) { showToast('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_ITEM, payload: { id: item.id, price: item.price, slot: item.slot } })
    showToast(`ได้รับ ${item.nameTh}!`)
  }

  function handleEquip(item) {
    dispatch({ type: ACTIONS.EQUIP_ITEM, payload: { id: item.id, slot: item.slot } })
  }

  const isOwned    = (item) => owned.includes(item.id)
  const isEquipped = (item) => equipped[item.slot] === item.id

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

      {/* Egg preview — shows current equipped items */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 18, paddingBottom: 4 }}>
        <EggCanvas width={120} height={143} anim="idle" />
      </div>

      {/* Slot tabs */}
      <div style={{
        display: 'flex', gap: 0,
        margin: '0 16px 16px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        {[
          { key: 'head', label: 'หัว' },
          { key: 'face', label: 'หน้า' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, border: 'none', cursor: 'pointer',
              padding: '9px 0',
              fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 600,
              background: tab === key ? 'rgba(255,210,63,0.18)' : 'transparent',
              color: tab === key ? '#FFD23F' : 'rgba(255,255,255,0.45)',
              borderBottom: tab === key ? '2px solid #FFD23F' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12, padding: '0 14px',
      }}>
        {items.map(item => {
          const owned_  = isOwned(item)
          const eqd     = isEquipped(item)
          const canAfford = coins >= item.price
          const previewEq = { head: null, face: null, [item.slot]: item.id }

          return (
            <div
              key={item.id}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: eqd
                  ? 'rgba(255,210,63,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border: eqd
                  ? '1.5px solid rgba(255,210,63,0.45)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '12px 8px 10px',
                gap: 8,
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

              {/* Egg preview with this item equipped */}
              <EggCanvas
                width={80} height={95}
                anim="idle"
                equipped={previewEq}
              />

              {/* Item name */}
              <div style={{
                fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 600,
                color: '#ffffff', textAlign: 'center', lineHeight: 1.3,
              }}>
                {item.nameTh}
              </div>

              {/* Currently equipped indicator */}
              {eqd && (
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: 7, color: '#FFD23F', letterSpacing: 1,
                }}>
                  ✓ ใส่อยู่
                </div>
              )}

              {/* Action button */}
              {owned_ ? (
                <button
                  onClick={() => handleEquip(item)}
                  style={{
                    border: 'none', cursor: 'pointer', borderRadius: 8,
                    padding: '7px 14px', width: '100%',
                    fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                    background: eqd
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,210,63,0.22)',
                    color: eqd ? 'rgba(255,255,255,0.5)' : '#FFD23F',
                    transition: 'all 0.15s',
                  }}
                >
                  {eqd ? 'ถอดออก' : 'ใส่'}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  style={{
                    border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed',
                    borderRadius: 8, padding: '7px 14px', width: '100%',
                    fontFamily: 'var(--font-pixel)', fontSize: 9, letterSpacing: 1,
                    background: canAfford
                      ? 'rgba(255,210,63,0.22)'
                      : 'rgba(255,255,255,0.06)',
                    color: canAfford ? '#FFD23F' : 'rgba(255,255,255,0.25)',
                    transition: 'all 0.15s',
                  }}
                >
                  🪙 {item.price}
                </button>
              )}
            </div>
          )
        })}
      </div>

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
