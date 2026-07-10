import React, { useRef, useEffect, useState } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import { detectFullSet } from '../lib/outfitSets.js'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import EggCanvas from './EggCanvas.jsx'
import CosmeticIcon from './CosmeticIcon.jsx'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { useCompanion } from '../context/CompanionContext.jsx'
import { playSFX, playTone, playBGM, stopBGM } from '../lib/audio.js'
import { FOOD_CATALOG } from '../lib/eggCare.js'

// Clearance for the fixed .px-bottom-nav rendered by App.jsx (matches Room.jsx).
const BOTTOM_NAV_H = 80

const HEAD_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'head')
const FACE_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'face')
// SPEC GAME-B §B.1 (2026-07-10) — new slots. All non-event items (shop +
// drop + craft) are candidates for the grid; drop/craft ones are filtered to
// "owned only" inside the component (see bodyBackItemsFor below) since they
// have no coin price to show a locked/buyable card for. Event items never
// appear here at all — "hidden from shop, dormant" per the acceptance
// criterion, regardless of ownership (there's no path to own one yet).
const BODY_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'body' && i.acquirable !== 'event')
const BACK_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'back' && i.acquirable !== 'event')
// Items visible in the grid for a given owned-list: shop items always, drop/
// craft items only once actually owned (no price to render otherwise).
function visibleItems(list, owned) {
  return list.filter(i => !i.acquirable || owned.includes(i.id))
}

// Map egg XP stage (0–8) to companion aura level (0–4) — mirrors Home.jsx
function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}

// ── Dressing-room background (canvas-drawn, no images) ──────────────────────
// Warm/cheerful scene behind the egg: cream→lavender gradient, oval mirror with
// gold frame + vanity bulbs, warm-wood wardrobe, potted plant, wooden floor.
// The whole static scene is drawn ONCE to an offscreen canvas; each frame only
// blits that + draws the handful of animated gold sparkles (cheap).
function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + rr, y)
  c.arcTo(x + w, y, x + w, y + h, rr)
  c.arcTo(x + w, y + h, x, y + h, rr)
  c.arcTo(x, y + h, x, y, rr)
  c.arcTo(x, y, x + w, y, rr)
  c.closePath()
}

function drawSparkle(c, x, y, r, alpha, rot) {
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  c.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.85
  c.fillStyle = '#FFE08A'
  c.shadowColor = 'rgba(255,210,63,0.9)'
  c.shadowBlur = 8
  c.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const rad = i % 2 === 0 ? r : r * 0.4
    const px = Math.cos(a) * rad
    const py = Math.sin(a) * rad
    if (i === 0) c.moveTo(px, py)
    else c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
  c.restore()
}

// SPEC GAME-B §B.1 (2026-07-10) — "full-body mirror that mirrors the egg
// live (flipped renderEggSprite draw)". mirrorPropsRef always holds the
// LATEST equipped/element/etc (updated by a separate effect below, not
// captured once at effect-setup time) so the reflection stays live without
// tearing down/rebuilding the sparkle animation loop on every equip change.
function DressingRoomBackground({ mirrorPropsRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let staticImg = null
    let sparkles = []
    let size = { w: 0, h: 0 }
    let mirror = { mx: 0, my: 0, mrx: 0, mry: 0 }
    let reflectCanvas = document.createElement('canvas')
    let raf = 0

    function buildStatic(w, h) {
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const c = off.getContext('2d')

      // Warm gradient sky
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#fff2e2')
      g.addColorStop(0.55, '#ffe6ef')
      g.addColorStop(1, '#ece0f6')
      c.fillStyle = g
      c.fillRect(0, 0, w, h)

      // Wooden floor strip
      const floorH = Math.max(30, h * 0.15)
      const fy = h - floorH
      const fg = c.createLinearGradient(0, fy, 0, h)
      fg.addColorStop(0, '#cf9159')
      fg.addColorStop(1, '#a86b3c')
      c.fillStyle = fg
      c.fillRect(0, fy, w, floorH)
      c.strokeStyle = 'rgba(120,70,30,0.22)'
      c.lineWidth = 1
      for (let x = 30; x < w; x += 48) {
        c.beginPath()
        c.moveTo(x, fy)
        c.lineTo(x - 9, h)
        c.stroke()
      }
      c.fillStyle = 'rgba(255,240,220,0.4)'
      c.fillRect(0, fy, w, 2)

      // Wardrobe (right)
      const wbW = Math.min(w * 0.26, 118)
      const wbH = h * 0.52
      const wbx = w - wbW - 12
      const wby = h * 0.3
      roundRect(c, wbx, wby, wbW, wbH, 10)
      const wg = c.createLinearGradient(wbx, 0, wbx + wbW, 0)
      wg.addColorStop(0, '#bd8551')
      wg.addColorStop(1, '#9a6538')
      c.fillStyle = wg
      c.fill()
      const pad = 8
      const doorW = (wbW - pad * 3) / 2
      c.fillStyle = 'rgba(255,242,214,0.14)'
      roundRect(c, wbx + pad, wby + pad, doorW, wbH - pad * 2, 6)
      c.fill()
      roundRect(c, wbx + pad * 2 + doorW, wby + pad, doorW, wbH - pad * 2, 6)
      c.fill()
      c.save()
      c.fillStyle = '#f0c24a'
      c.shadowColor = 'rgba(240,194,74,0.7)'
      c.shadowBlur = 6
      c.beginPath()
      c.arc(wbx + pad + doorW - 6, wby + wbH * 0.5, 3.6, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.arc(wbx + pad * 2 + doorW + 6, wby + wbH * 0.5, 3.6, 0, Math.PI * 2)
      c.fill()
      c.restore()

      // Mirror (left) — oval glass + gold bezier frame + shine
      const mx = w * 0.23
      const my = h * 0.44
      const mrx = Math.min(w * 0.15, 60)
      const mry = mrx * 1.35
      mirror = { mx, my, mrx, mry }
      c.save()
      c.lineWidth = 8
      c.strokeStyle = '#e9b84a'
      c.shadowColor = 'rgba(233,184,74,0.5)'
      c.shadowBlur = 10
      c.beginPath()
      c.ellipse(mx, my, mrx + 5, mry + 5, 0, 0, Math.PI * 2)
      c.stroke()
      c.restore()
      const mg = c.createLinearGradient(mx - mrx, my - mry, mx + mrx, my + mry)
      mg.addColorStop(0, '#e2f1ff')
      mg.addColorStop(1, '#bcd6ef')
      c.fillStyle = mg
      c.beginPath()
      c.ellipse(mx, my, mrx, mry, 0, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 0.5
      c.fillStyle = '#ffffff'
      c.beginPath()
      c.ellipse(mx - mrx * 0.35, my - mry * 0.22, mrx * 0.18, mry * 0.5, -0.4, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1

      // Vanity bulbs — warm-glow arc over the top of the mirror
      const bulbN = 7
      for (let i = 0; i < bulbN; i++) {
        const a = Math.PI * (1.15 + (i / (bulbN - 1)) * 0.7)
        const bx = mx + Math.cos(a) * (mrx + 15)
        const by = my + Math.sin(a) * (mry + 15)
        c.save()
        c.fillStyle = '#fff6cf'
        c.shadowColor = 'rgba(255,220,120,0.95)'
        c.shadowBlur = 12
        c.beginPath()
        c.arc(bx, by, 4.5, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }

      // Potted plant (bottom-left corner)
      const px0 = 26
      const py0 = fy
      c.fillStyle = '#d98b5a'
      roundRect(c, px0 - 11, py0 - 14, 24, 18, 3)
      c.fill()
      c.fillStyle = '#5bbf6a'
      c.beginPath()
      c.ellipse(px0, py0 - 27, 7, 15, -0.4, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.ellipse(px0 - 9, py0 - 22, 6, 12, 0.35, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.ellipse(px0 + 9, py0 - 22, 6, 12, -0.9, 0, Math.PI * 2)
      c.fill()

      return off
    }

    function initSparkles(w, h) {
      sparkles = []
      const n = 7
      for (let i = 0; i < n; i++) {
        sparkles.push({
          x: 20 + Math.random() * (w - 40),
          y: 16 + Math.random() * (h * 0.72),
          r: 3 + Math.random() * 4,
          phase: Math.random() * Math.PI * 2,
          spd: 0.6 + Math.random() * 0.8,
        })
      }
    }

    function resize() {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      size = { w, h }
      staticImg = buildStatic(w, h)
      initSparkles(w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    function drawReflection(t) {
      const props = mirrorPropsRef?.current
      if (!props || !mirror.mrx) return
      const rw = Math.round(mirror.mrx * 2)
      const rh = Math.round(mirror.mry * 2.15)
      if (reflectCanvas.width !== rw || reflectCanvas.height !== rh) {
        reflectCanvas.width = rw
        reflectCanvas.height = rh
      }
      const rctx = reflectCanvas.getContext('2d')
      rctx.clearRect(0, 0, rw, rh)
      renderEggSprite(rctx, { ...props, t, canvasSize: rw })
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(mirror.mx, mirror.my, mirror.mrx, mirror.mry, 0, 0, Math.PI * 2)
      ctx.clip()
      // Flip horizontally — a genuine mirror reflection, not just a copy.
      ctx.translate(mirror.mx, mirror.my - mirror.mry * 0.08)
      ctx.scale(-1, 1)
      ctx.drawImage(reflectCanvas, -rw / 2, -rh * 0.42, rw, rh)
      ctx.restore()
    }
    function frame(now) {
      const t = (now - start) / 1000
      const { w, h } = size
      if (staticImg) ctx.drawImage(staticImg, 0, 0, w, h)
      drawReflection(t)
      for (const s of sparkles) {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * s.spd + s.phase))
        const rot = t * s.spd * 0.5 + s.phase
        drawSparkle(ctx, s.x, s.y, s.r, tw, rot)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [mirrorPropsRef])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}

// ── FavoriteCard: one of the 4 wardrobe QoL "save a combo" slots ───────────
// Big kid-friendly card with a live mini EggCanvas preview (per spec). An
// empty slot is a big "+" tile that saves the CURRENT combo; a filled slot
// shows the saved combo and offers one-tap wear or clear.
function FavoriteCard({ fav, idx, onSave, onWear, onClear }) {
  if (!fav) {
    return (
      <button onClick={() => onSave(idx)} style={{
        minHeight: 150, borderRadius: 16, cursor: 'pointer',
        border: '2px dashed rgba(91,70,54,0.3)', background: 'rgba(91,70,54,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 30 }}>➕</span>
        <span style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: 'rgba(91,70,54,0.6)', fontWeight: 700 }}>
          บันทึกชุดนี้
        </span>
      </button>
    )
  }
  return (
    <div style={{
      minHeight: 150, borderRadius: 16, background: '#ffffff',
      border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 6px rgba(120,90,60,0.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 6px 8px', gap: 6,
    }}>
      <div onClick={() => onWear(idx)} style={{ cursor: 'pointer' }}>
        <EggCanvas width={90} height={107} anim="idle" equipped={fav} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onWear(idx)} style={{
          cursor: 'pointer', border: 'none', borderRadius: 10, padding: '5px 10px',
          background: 'linear-gradient(180deg, #FFDf7a, #F2B838)', color: '#5b4020',
          fontFamily: 'var(--font-thai)', fontSize: 11, fontWeight: 800,
        }}>✅ ใส่</button>
        <button onClick={() => onClear(idx)} aria-label="ลบชุดโปรด" style={{
          cursor: 'pointer', border: '1px solid rgba(91,70,54,0.2)', borderRadius: 10, padding: '5px 9px',
          background: 'rgba(91,70,54,0.08)', color: 'rgba(91,70,54,0.7)', fontSize: 12,
        }}>🗑️</button>
      </div>
    </div>
  )
}

export default function Collection({ navigate }) {
  const { state, dispatch, eggProgressData } = useAppState()
  const { resolved } = useCompanion()
  // Single dressing-room mode now — only the head/face slot switcher remains.
  const [slot, setSlot] = useState('head')
  const [toast, setToast] = useState(null)
  // Local-only "selected / trying-on" state: { slot, id } | null. NEVER persisted —
  // resets on unmount / buy / equip. Drives both the live try-on on the big egg
  // and which card is highlighted. The bottom CTA is the single confirm action.
  const [preview, setPreview] = useState(null)

  const coins    = state.coins ?? 0
  const owned    = state.ownedItems ?? []
  const equipped = state.equipped ?? { head: null, face: null, body: null, back: null }
  const favorites = state.favoriteOutfits ?? [null, null, null, null]
  const stage    = eggProgressData?.stage ?? 1
  const foodInventory = state.eggCare?.foodInventory ?? {}

  const activeEgg = (state.hatchedEggs ?? []).find(e => e.id === state.party?.[0]) ?? state.hatchedEggs?.[0]
  const eggLevel  = activeEgg?.battleLevel ?? 1
  const stageName = EGG_STAGE_NAMES[stage] || 'ไข่น้อย'

  useEffect(() => {
    playBGM('shop')
    return () => stopBGM()
  }, [])

  useEffect(() => {
    dispatch({ type: ACTIONS.CLEAR_NEW_ITEM })
  }, [dispatch])

  // Equipped map for the big preview egg: real equipped, with the selected slot
  // overridden locally when a preview is active. undefined → EggCanvas wrapper
  // falls back to state.equipped (real).
  const previewEquipped = preview
    ? { ...equipped, [preview.slot]: preview.id }
    : undefined

  // SPEC GAME-B §B.1 — full outfit-set detection on whatever's currently
  // shown on the big egg (real equipped, or the local try-on preview), so
  // the set badge/pose/tint update live while trying on the 3rd matching piece.
  const outfitSetShown = detectFullSet(previewEquipped ?? equipped)

  // Live mirror reflection (see DressingRoomBackground) — a ref, not state,
  // so updating it every render doesn't restart the mirror's own RAF/sparkle
  // effect (which only runs once, keyed on the ref's stable identity).
  const mirrorPropsRef = useRef(null)
  mirrorPropsRef.current = {
    element: resolved.element, eye: resolved.eye, gender: resolved.gender,
    stage, aura: stageToAura(stage), anim: 'idle',
    equipped: previewEquipped ?? equipped,
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const isOwned    = (item) => owned.includes(item.id)
  const isEquipped = (item) => equipped[item.slot] === item.id
  const isSelected = (item) => preview && preview.id === item.id

  // ── Actions ──────────────────────────────────────────────────────────────
  // Buy → BUY_ITEM auto-equips (see StateContext reducer), so a single dispatch
  // both purchases AND wears the item. No separate equip needed.
  function handleBuyWearable(item) {
    if (coins < item.price) { showToast('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_ITEM, payload: { id: item.id, price: item.price, slot: item.slot } })
    playSFX('coin_purchase')
    setPreview(null) // real state now reflects it — drop the local try-on
    showToast(`ได้รับ ${item.nameTh}!`)
  }
  // Tapping any card just SELECTS it for preview (consistent for owned + unowned).
  // The big egg wears it instantly; the bottom CTA confirms buy/equip/unequip.
  function handleTapCard(item) {
    playTone('tap')
    setPreview({ slot: item.slot, id: item.id })
  }
  // Bottom CTA — acts on the currently selected item.
  function handleCTA() {
    if (!selectedItem) return
    if (isOwned(selectedItem)) {
      // EQUIP_ITEM toggles: wears it, or unequips if already worn.
      dispatch({ type: ACTIONS.EQUIP_ITEM, payload: { id: selectedItem.id, slot: selectedItem.slot } })
      playSFX('item_equip')
      setPreview(null)
    } else {
      handleBuyWearable(selectedItem)
    }
  }

  // ── Food tab (SPEC GAME-A §A.1) — a genuinely different transaction shape
  // from the cosmetics above (stackable/repeatable "buy 1 more", never worn/
  // equipped), so it deliberately bypasses the preview/CTA try-on machinery
  // entirely rather than shoehorning it in. Tapping a card buys instantly (no
  // confirm step), same low-friction pattern this project already uses for
  // Room.jsx's instant-craft sheet.
  function handleBuyFood(foodKey) {
    const entry = FOOD_CATALOG[foodKey]
    if (coins < entry.price) { showToast('เหรียญไม่พอ!'); return }
    dispatch({ type: ACTIONS.BUY_FOOD_ITEM, payload: { food: foodKey } })
    playSFX('coin_purchase')
    playTone('tap')
    showToast(`ได้รับ ${entry.emoji} ${entry.nameTh}!`)
  }

  // SPEC GAME-B §B.1 wardrobe QoL — favorites/random/remove-all
  function handleSaveFavorite(idx) {
    dispatch({ type: ACTIONS.SAVE_FAVORITE_OUTFIT, payload: { slotIndex: idx } })
    playSFX('coin_purchase')
    showToast('บันทึกชุดแล้ว! ⭐')
  }
  function handleWearFavorite(idx) {
    if (!favorites[idx]) return
    dispatch({ type: ACTIONS.WEAR_FAVORITE_OUTFIT, payload: { slotIndex: idx } })
    playSFX('item_equip')
    setPreview(null)
    showToast('ใส่ชุดโปรดแล้ว! ✨')
  }
  function handleClearFavorite(idx) {
    dispatch({ type: ACTIONS.CLEAR_FAVORITE_OUTFIT, payload: { slotIndex: idx } })
    playTone('tap')
  }
  function handleRandomOutfit() {
    dispatch({ type: ACTIONS.RANDOM_OUTFIT })
    playSFX('item_equip')
    setPreview(null)
    showToast('สุ่มชุดใหม่! 🎲')
  }
  function handleRemoveAllOutfit() {
    dispatch({ type: ACTIONS.REMOVE_ALL_OUTFIT })
    playTone('tap')
    setPreview(null)
    showToast('ถอดหมดแล้ว')
  }

  const isFoodTab = slot === 'food'
  const isFavTab  = slot === 'favorites'
  const items = slot === 'head' ? HEAD_ITEMS
    : slot === 'face' ? FACE_ITEMS
    : slot === 'body' ? visibleItems(BODY_ITEMS, owned)
    : slot === 'back' ? visibleItems(BACK_ITEMS, owned)
    : []
  const selectedItem = (!isFoodTab && !isFavTab && preview) ? COSMETIC_ITEMS.find(i => i.id === preview.id) : null
  // Show the "trying on" tag only when the egg is wearing something that differs
  // from what's really equipped in that slot (a genuine try-on).
  const showTryTag = selectedItem && equipped[selectedItem.slot] !== selectedItem.id

  // Bottom CTA descriptor derived from the selected item's state. Not shown
  // at all on the food tab — food buys instantly per-card, no confirm step.
  let cta
  if (!selectedItem) {
    cta = { label: '👀 แตะเพื่อลองใส่', disabled: true }
  } else if (isOwned(selectedItem)) {
    cta = isEquipped(selectedItem)
      ? { label: '❌ ถอด', tone: 'unequip' }
      : { label: '✅ ใส่', tone: 'equip' }
  } else if (coins >= selectedItem.price) {
    cta = { label: `🛒 ซื้อ + ใส่  🪙 ${selectedItem.price}`, tone: 'buy' }
  } else {
    cta = { label: '🔒 ยังไม่มีเงิน', disabled: true }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#fdf1e3', boxSizing: 'border-box',
    }}>

      {/* Floating header overlay — coin balance left, title center, close right */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', pointerEvents: 'none',
      }}>
        <span style={{
          position: 'absolute', left: '50%', top: 14, transform: 'translateX(-50%)',
          fontFamily: 'var(--font-thai)', fontSize: 15, fontWeight: 700, color: '#5b4020',
          textShadow: '0 1px 3px rgba(255,255,255,0.6)', whiteSpace: 'nowrap',
        }}>
          ห้องแต่งตัว
        </span>
        <span style={{
          pointerEvents: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(30,20,45,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,210,63,0.4)', borderRadius: 20, padding: '6px 13px',
          fontFamily: 'var(--font-pixel)', fontSize: 11, color: '#FFD23F',
        }}>
          🪙 {coins}
        </span>
        <button
          onClick={() => navigate && navigate('home')}
          aria-label="ปิด"
          style={{
            pointerEvents: 'auto', cursor: 'pointer',
            width: 38, height: 38, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(30,20,45,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            color: '#fff', fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Egg / dressing-room zone ────────────────────────────────────────── */}
      <div style={{
        position: 'relative', flexShrink: 0,
        height: '43vh', minHeight: 250, maxHeight: 400,
        overflow: 'hidden',
      }}>
        <DressingRoomBackground mirrorPropsRef={mirrorPropsRef} />

        {/* SPEC GAME-B §B.1 — 🎲 random / ถอดหมด, reachable from any equip tab */}
        <button
          onClick={handleRandomOutfit}
          aria-label="สุ่มชุด"
          style={{
            position: 'absolute', left: 12, bottom: 12, zIndex: 12,
            width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(30,20,45,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          🎲
        </button>
        <button
          onClick={handleRemoveAllOutfit}
          aria-label="ถอดหมด"
          style={{
            position: 'absolute', right: 12, bottom: 12, zIndex: 12,
            minHeight: 40, padding: '0 12px', borderRadius: 20, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(30,20,45,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            fontFamily: 'var(--font-thai)', fontSize: 12, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          🧺 ถอดหมด
        </button>

        {/* Centered companion + label, above the scene */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, pointerEvents: 'none',
        }}>
          <div style={{ position: 'relative' }}>
            <EggCanvas
              stage={stage}
              aura={stageToAura(stage)}
              width={190} height={225}
              anim="idle"
              equipped={previewEquipped}
            />
            {showTryTag && (
              <div style={{
                position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(124,77,255,0.95)', color: '#fff',
                fontFamily: 'var(--font-thai)', fontSize: 11, fontWeight: 700,
                padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}>
                👀 ลองใส่
              </div>
            )}
          </div>

          {/* Lv · stage-name pill (mirrors Home.jsx) */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(30,20,45,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, padding: '4px 12px',
          }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 8, color: '#FFD23F', letterSpacing: 0.5 }}>
              Lv.{eggLevel}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>·</span>
            <span style={{ fontFamily: 'var(--font-thai)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {stageName}
            </span>
          </div>

          {/* SPEC GAME-B §B.1 — full outfit-set badge (aura tint + exclusive pose active) */}
          {outfitSetShown && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: `${outfitSetShown.tint}cc`, borderRadius: 20, padding: '3px 12px',
              boxShadow: `0 0 12px ${outfitSetShown.tint}88`,
              animation: 'mg-badge-lowpulse 1.6s ease-in-out infinite',
            }}>
              <span style={{ fontFamily: 'var(--font-thai)', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                ✨ ชุด: {outfitSetShown.nameTh} ✨
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Slot switcher — 🎩หัว / 🧥ตัว / 🎒หลัง / 😎หน้า / ⭐โปรด / 🍎ของกิน */}
      <div style={{
        display: 'flex', gap: 6, flexShrink: 0,
        padding: '12px 12px 8px', overflowX: 'auto',
      }}>
        {[
          { key: 'head', label: 'หัว', icon: '🎩' },
          { key: 'body', label: 'ตัว', icon: '🧥' },
          { key: 'back', label: 'หลัง', icon: '🎒' },
          { key: 'face', label: 'หน้า', icon: '😎' },
          { key: 'favorites', label: 'โปรด', icon: '⭐' },
          { key: 'food', label: 'ของกิน', icon: '🍎' },
        ].map(({ key, label, icon }) => {
          const active = slot === key
          return (
            <button
              key={key}
              onClick={() => setSlot(key)}
              style={{
                flex: '0 0 auto', minWidth: 60, minHeight: 52, cursor: 'pointer', borderRadius: 14,
                border: active ? '1px solid rgba(224,163,46,0.9)' : '1px solid rgba(91,70,54,0.14)',
                background: active
                  ? 'linear-gradient(180deg, #FFDf7a, #F2B838)'
                  : 'rgba(91,70,54,0.10)',
                boxShadow: active ? '0 3px 10px rgba(242,184,56,0.4)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                fontFamily: 'var(--font-thai)', fontSize: 10, fontWeight: 700,
                color: active ? '#ffffff' : 'rgba(91,70,54,0.55)',
                textShadow: active ? '0 1px 2px rgba(150,90,0,0.4)' : 'none',
                transition: 'all 0.15s', padding: '4px 8px', position: 'relative',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
              {label}
            </button>
          )
        })}
      </div>

      {/* Item grid — scrollable, 3 columns */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
        padding: '6px 14px',
        paddingBottom: BOTTOM_NAV_H + ((isFoodTab || isFavTab) ? 24 : 90),
      }}>
        {isFavTab ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {favorites.map((fav, idx) => (
              <FavoriteCard
                key={idx} fav={fav} idx={idx}
                onSave={handleSaveFavorite} onWear={handleWearFavorite} onClear={handleClearFavorite}
              />
            ))}
          </div>
        ) : isFoodTab ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {Object.entries(FOOD_CATALOG).map(([key, food]) => {
              const canAfford = coins >= food.price
              const owned = foodInventory[key] || 0
              return (
                <div
                  key={key}
                  onClick={() => handleBuyFood(key)}
                  style={{
                    position: 'relative', cursor: 'pointer', minHeight: 96,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    background: '#ffffff', border: '1px solid rgba(91,70,54,0.14)', borderRadius: 16,
                    padding: '12px 6px 9px', boxShadow: '0 2px 6px rgba(120,90,60,0.1)',
                  }}
                >
                  {/* Owned-count badge (top-left) — how many the child already has */}
                  {owned > 0 && (
                    <span style={{
                      position: 'absolute', top: -7, left: -7, zIndex: 2,
                      minWidth: 22, height: 22, padding: '0 5px', borderRadius: 11,
                      background: '#7CBF5A', color: '#fff', fontSize: 11, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                    }}>
                      ×{owned}
                    </span>
                  )}
                  {/* Coin price badge (bottom-right) — every food is always buyable (stackable) */}
                  <span style={{
                    position: 'absolute', bottom: -6, right: -6, zIndex: 2,
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    background: canAfford ? '#F2B838' : 'rgba(120,100,90,0.9)',
                    color: '#fff', borderRadius: 20, padding: '2px 8px',
                    fontFamily: 'var(--font-pixel)', fontSize: 8, letterSpacing: 0.5,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
                  }}>
                    🪙{food.price}
                  </span>

                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 44, lineHeight: 1, filter: canAfford ? 'none' : 'grayscale(0.6) opacity(0.7)' }}>{food.emoji}</div>
                  </div>
                  <div style={{
                    width: '100%', textAlign: 'center',
                    fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                    color: '#5b4636', lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {food.nameTh}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {items.map(item => {
            const owned_    = isOwned(item)
            const eqd       = isEquipped(item)
            const selected  = isSelected(item)
            const canAfford = coins >= item.price
            const locked    = !owned_ && !canAfford
            const shortName = item.nameTh.length > 6 ? item.nameTh.slice(0, 6) + '…' : item.nameTh

            // Border: equipped = gold; owned = subtle white; else normal
            const border = eqd
              ? '2px solid #F2B838'
              : owned_
                ? '1.5px solid rgba(255,255,255,0.9)'
                : '1px solid rgba(91,70,54,0.14)'
            const boxShadow = selected
              ? '0 0 0 3px rgba(124,77,255,0.85), 0 4px 12px rgba(124,77,255,0.25)'
              : eqd
                ? '0 0 12px rgba(242,184,56,0.45)'
                : '0 2px 6px rgba(120,90,60,0.1)'

            return (
              <div
                key={item.id}
                onClick={() => handleTapCard(item)}
                style={{
                  position: 'relative', cursor: 'pointer', minHeight: 96,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: '#ffffff', border, borderRadius: 16,
                  padding: '12px 6px 9px', boxShadow,
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
              >
                {/* Equipped ✓ badge (top-right) — owned+equipped only */}
                {eqd && (
                  <span style={{
                    position: 'absolute', top: -7, right: -7, zIndex: 2,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#F2B838', color: '#fff', fontSize: 13, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                  }}>
                    ✓
                  </span>
                )}
                {/* Lock badge (top-right) — unowned + can't afford only */}
                {locked && (
                  <span style={{
                    position: 'absolute', top: -7, right: -7, zIndex: 3, fontSize: 15,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                  }}>
                    🔒
                  </span>
                )}
                {/* Coin price badge (bottom-right) — any unowned item */}
                {!owned_ && (
                  <span style={{
                    position: 'absolute', bottom: -6, right: -6, zIndex: 2,
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    background: canAfford ? '#F2B838' : 'rgba(120,100,90,0.9)',
                    color: '#fff', borderRadius: 20, padding: '2px 8px',
                    fontFamily: 'var(--font-pixel)', fontSize: 8, letterSpacing: 0.5,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
                  }}>
                    🪙{item.price}
                  </span>
                )}

                {/* Item icon alone — no egg body/eyes underneath */}
                <div style={{ position: 'relative' }}>
                  <CosmeticIcon item={item} size={76} />
                  {/* Dark overlay over just the icon — can't-afford only */}
                  {locked && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 8, zIndex: 1,
                      background: 'rgba(20,14,10,0.45)',
                    }} />
                  )}
                </div>

                {/* Item name — pre-truncated to 6 Thai chars, one line */}
                <div style={{
                  width: '100%', textAlign: 'center',
                  fontFamily: 'var(--font-thai)', fontSize: 13, fontWeight: 700,
                  color: '#5b4636', lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {shortName}
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Fade so a scrolled-up row doesn't hard-cut under the floating CTA —
          without this, on shorter viewports the initial (unscrolled) grid can
          show a card row overlapping the button with a jarring flat edge.
          Not needed on the food tab — there's no floating CTA to fade into. */}
      {!isFoodTab && !isFavTab && <div style={{
        position: 'fixed', left: 0, right: 0, bottom: BOTTOM_NAV_H, zIndex: 35,
        height: 96, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(253,241,227,0) 0%, rgba(253,241,227,0.88) 55%, rgba(253,241,227,1) 100%)',
      }} />}

      {/* Bottom CTA — single confirm action for the selected item. Food buys
          instantly per-card (see handleBuyFood), so this is cosmetics-only. */}
      {!isFoodTab && !isFavTab && <button
        onClick={cta.disabled ? undefined : handleCTA}
        disabled={!!cta.disabled}
        style={{
          position: 'fixed', left: 16, right: 16, bottom: BOTTOM_NAV_H + 12, zIndex: 40,
          minHeight: 58, borderRadius: 16, border: 'none',
          cursor: cta.disabled ? 'default' : 'pointer',
          fontFamily: 'var(--font-thai)', fontSize: 17, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: cta.disabled
            ? 'rgba(120,100,90,0.25)'
            : cta.tone === 'unequip'
              ? 'linear-gradient(180deg, #ff8a8a, #e85c5c)'
              : 'linear-gradient(180deg, #FFDf7a, #F2B838)',
          color: cta.disabled ? 'rgba(91,70,54,0.6)' : cta.tone === 'unequip' ? '#fff' : '#5b4020',
          boxShadow: cta.disabled ? 'none' : '0 6px 18px rgba(242,184,56,0.45)',
          transition: 'all 0.15s',
        }}
      >
        {cta.label}
      </button>}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: BOTTOM_NAV_H + 84, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,20,45,0.95)', border: '1px solid rgba(255,210,63,0.4)',
          borderRadius: 20, padding: '10px 22px', zIndex: 50,
          fontFamily: 'var(--font-thai)', fontSize: 14, color: '#FFD23F',
          whiteSpace: 'nowrap', animation: 'fadeInUp 0.25s ease both', pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
