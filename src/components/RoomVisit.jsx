import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import RoomScene from './RoomScene.jsx'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import { themeMeta } from '../lib/roomScene.js'
import { detectFullSet } from '../lib/outfitSets.js'
import { playSFX } from '../lib/audio.js'
import { supabase } from '../lib/supabase.js'

// Normalize an adventurer into a rooms[] array. Post-migration the RPC returns a
// `rooms` jsonb array; pre-migration it only has the flat `room_layout` — degrade
// to a single default-themed room so nothing breaks until the migration is applied.
function adventurerRooms(a) {
  if (Array.isArray(a.rooms) && a.rooms.length > 0) {
    return a.rooms.map((r, i) => ({
      id: r.id ?? `r${i}`, theme: r.theme ?? 'default', layout: r.layout ?? {},
    }))
  }
  return [{ id: 'main', theme: 'default', layout: a.room_layout ?? {} }]
}

const FONT_TH = { fontFamily: 'var(--font-thai)' }
const FONT_PX = { fontFamily: 'var(--font-pixel)' }

const ELEMENT_TH = {
  fire: 'ธาตุไฟ', water: 'ธาตุน้ำ', thunder: 'ธาตุฟ้า',
  nature: 'ธาตุธรรมชาติ', shadow: 'ธาตุเงา', light: 'ธาตุแสง',
}

// Egg XP stage (1–9) → aura level (0–4). Mirrors Home.jsx's stageToAura.
function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}

// Small static icon: the visited egg wearing exactly one cosmetic (single-frame render).
function CosmeticChip({ egg, item }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const S = 40
    const H = Math.round(S * 1.19)
    const DPR = window.devicePixelRatio || 1
    canvas.width = Math.round(S * DPR)
    canvas.height = Math.round(H * DPR)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    ctx.imageSmoothingEnabled = false
    renderEggSprite(ctx, {
      element: egg.element ?? 'fire',
      eye:     egg.eye     ?? 'gba',
      gender:  egg.gender  ?? 'male',
      stage:   1, aura: 0, anim: 'idle', t: 0,
      canvasSize: S,
      equipped: { [item.slot]: item.id, [item.slot === 'head' ? 'face' : 'head']: null },
    })
  }, [egg.element, egg.eye, egg.gender, item.id, item.slot])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--px-dark)', border: '2px solid var(--px-border)',
      boxShadow: '2px 2px 0 var(--px-black)', padding: '6px 10px 6px 6px',
    }}>
      <canvas ref={ref} style={{ width: 40, height: Math.round(40 * 1.19), imageRendering: 'pixelated', display: 'block' }} />
      <span style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-light)', fontWeight: 600 }}>{item.nameTh}</span>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
      <span style={{ ...FONT_PX, fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ ...FONT_PX, fontSize: 11, color }}>{value ?? '-'}</span>
    </div>
  )
}

/**
 * RoomVisit — full-screen, read-only overlay showing a friend/adventurer's decorated
 * room + companion egg + stats + worn cosmetics. Slides in from the right.
 *
 * Purely visual: no taps on the egg/furniture. Back button (‹) closes.
 * Gracefully handles the pre-migration RPC shape (equipped/room_layout fields absent).
 */
export default function RoomVisit({ adventurer: a, onClose }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => { playSFX('room_visit_enter') }, [])

  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 360, h: 480 })
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const name    = a.display_name ?? 'นักผจญภัยลึกลับ'
  const stage   = a.stage ?? 1
  const visitRooms = adventurerRooms(a)
  const [roomIdx, setRoomIdx] = useState(0)
  // SPEC GAME-B §B.2 (2026-07-10) — Room Hearts. `a.like_token` is an OPAQUE,
  // per-viewer/per-day token minted server-side (get_or_create_like_token,
  // see supabase/migrations/20260711_room_hearts.sql) — the client never
  // sees or sends a raw user id in either direction; like_room resolves the
  // real owner from the token itself. Only exists for real (non-bot) rows —
  // bots have no stable identity to like against, so the button is hidden
  // for them entirely rather than doing something that can't mean anything real.
  const [heartTotal, setHeartTotal] = useState(a.heart_total ?? 0)
  const [liking, setLiking] = useState(false)
  const [liked, setLiked] = useState(false)
  const canLike = !a.is_bot && !!a.like_token
  async function handleLikeRoom() {
    if (!supabase || !canLike || liking || liked) return
    setLiking(true)
    const { data, error } = await supabase.rpc('like_room', {
      p_token: a.like_token,
      p_room_id: curRoom.id ?? 'main',
    })
    setLiking(false)
    if (error) return // pre-migration RPC / offline — fail silently, same convention as elsewhere
    if (typeof data === 'number') setHeartTotal(data)
    setLiked(true)
    playSFX('item_equip')
  }
  const curRoom = visitRooms[Math.min(roomIdx, visitRooms.length - 1)]
  const layout  = curRoom.layout ?? {}
  const roomTheme = curRoom.theme ?? 'default'
  const headId  = a.equipped_head ?? null
  const faceId  = a.equipped_face ?? null
  // SPEC GAME-B §B.1 (2026-07-10) — new slots; equipped_body/equipped_back
  // come from a new RPC column, undefined (→ null) until that migration is
  // applied, which just means no body/back shows and no set ever detects.
  const bodyId  = a.equipped_body ?? null
  const backId  = a.equipped_back ?? null
  const equipped = { head: headId, face: faceId, body: bodyId, back: backId }
  const outfitSet = detectFullSet(equipped)

  const headItem = headId ? COSMETIC_ITEMS.find(i => i.id === headId && i.slot === 'head') : null
  const faceItem = faceId ? COSMETIC_ITEMS.find(i => i.id === faceId && i.slot === 'face') : null
  const bodyItem = bodyId ? COSMETIC_ITEMS.find(i => i.id === bodyId && i.slot === 'body') : null
  const backItem = backId ? COSMETIC_ITEMS.find(i => i.id === backId && i.slot === 'back') : null
  const chips = [headItem, faceItem, bodyItem, backItem].filter(Boolean)

  const eggIdentity = {
    element: a.element ?? 'fire',
    eye:     a.eye ?? 'gba',
    gender:  a.gender ?? 'male',
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'var(--px-darkest)',
      transform: entered ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.28s cubic-bezier(.2,.8,.3,1)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderBottom: '2px solid rgba(255,255,255,0.08)',
        flexShrink: 0, background: 'rgba(10,8,22,0.6)',
      }}>
        <button onClick={onClose} aria-label="กลับ" style={{
          background: 'transparent', border: '2px solid var(--px-border)',
          color: 'var(--px-light)', boxShadow: '2px 2px 0 var(--px-black)',
          ...FONT_PX, fontSize: 14, cursor: 'pointer', padding: '4px 12px',
          WebkitTapHighlightColor: 'transparent',
        }}>‹</button>
        <span style={{ ...FONT_TH, fontSize: 15, fontWeight: 700, color: 'var(--px-light)' }}>
          ห้องของ {name}
        </span>
      </div>

      {/* Room + egg */}
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <RoomScene
          roomLayout={layout}
          theme={roomTheme}
          width={size.w}
          height={size.h}
          small={false}
          egg={null}
          style={{ position: 'absolute', inset: 0 }}
        />

        {/* Read-only room selector (only when the friend has more than one room) */}
        {visitRooms.length > 1 && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 3,
            display: 'flex', gap: 6, background: 'rgba(10,8,22,0.6)',
            border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 6,
          }}>
            {visitRooms.map((r, i) => {
              const meta = themeMeta(r.theme)
              const isActive = i === roomIdx
              return (
                <button key={r.id} onClick={() => setRoomIdx(i)} aria-label={meta.nameTh}
                  style={{
                    width: 30, height: 30, padding: 0, cursor: 'pointer', borderRadius: 6, fontSize: 15,
                    background: isActive ? 'rgba(255,210,63,0.18)' : 'rgba(255,255,255,0.05)',
                    border: isActive ? '2px solid #FFD23F' : '1px solid rgba(255,255,255,0.2)',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  {meta.icon}
                </button>
              )
            })}
          </div>
        )}
        {/* Large centered companion egg (their identity + cosmetics) */}
        <div style={{
          position: 'absolute', top: '52%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}>
          <EggCanvasCore
            element={eggIdentity.element}
            eye={eggIdentity.eye}
            gender={eggIdentity.gender}
            stage={stage}
            aura={stageToAura(stage)}
            anim="idle"
            size={190}
            equipped={equipped}
            auraTint={outfitSet?.tint}
            setPose={outfitSet?.pose}
            style={{ display: 'block' }}
          />
        </div>
        {/* SPEC GAME-B §B.1 — full outfit-set name */}
        {outfitSet && (
          <div style={{
            position: 'absolute', top: '52%', left: '50%',
            transform: 'translate(-50%, 78px)', zIndex: 3,
            background: 'rgba(10,8,22,0.7)', border: '1px solid rgba(255,210,63,0.4)',
            borderRadius: 20, padding: '4px 14px', whiteSpace: 'nowrap',
          }}>
            <span style={{ ...FONT_TH, fontSize: 12, fontWeight: 700, color: '#FFD23F' }}>
              ✨ ชุด: {outfitSet.nameTh} ✨
            </span>
          </div>
        )}
      </div>

      {/* Bottom panel: stats + cosmetics */}
      <div style={{
        flexShrink: 0, background: 'var(--px-dark)',
        borderTop: '2px solid var(--px-border)', padding: '14px 16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-light)', opacity: 0.65 }}>
            {ELEMENT_TH[a.element] ?? 'ธาตุลึกลับ'}
          </span>
          <span style={{ ...FONT_TH, fontSize: 11, fontWeight: 700, color: 'var(--px-yellow)' }}>
            {a.rarity_label || 'Common'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          <Stat label="HP"  value={a.hp}  color="var(--px-green)" />
          <Stat label="ATK" value={a.atk} color="var(--px-red)" />
          <Stat label="DEF" value={a.def} color="var(--px-blue2)" />
          <Stat label="SPD" value={a.spd} color="var(--px-yellow)" />
        </div>

        {chips.length > 0 ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: canLike || heartTotal > 0 ? 14 : 0 }}>
            {chips.map(item => <CosmeticChip key={item.id} egg={eggIdentity} item={item} />)}
          </div>
        ) : (
          <div style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-light)', opacity: 0.5, textAlign: 'center', marginBottom: canLike || heartTotal > 0 ? 14 : 0 }}>
            ยังไม่ได้แต่งตัว
          </div>
        )}

        {/* SPEC GAME-B §B.2 — ❤️ ชอบห้องนี้ (1/visitor/day, real accounts only —
            bots have no stable identity to like against, see canLike above) */}
        {(canLike || heartTotal > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {canLike && (
              <button onClick={handleLikeRoom} disabled={liking || liked}
                aria-label="ชอบห้องนี้"
                style={{
                  flex: 1, minHeight: 46, borderRadius: 12, cursor: liked ? 'default' : 'pointer',
                  border: liked ? '1px solid rgba(255,158,192,0.5)' : '2px solid var(--px-border)',
                  background: liked ? 'rgba(255,158,192,0.15)' : 'transparent',
                  color: liked ? '#ff9ec0' : 'var(--px-light)',
                  boxShadow: liked ? 'none' : '2px 2px 0 var(--px-black)',
                  ...FONT_TH, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  WebkitTapHighlightColor: 'transparent',
                }}>
                {liked ? '❤️ ชอบแล้ว!' : '🤍 ชอบห้องนี้'}
              </button>
            )}
            {heartTotal > 0 && (
              <span style={{ ...FONT_TH, fontSize: 13, fontWeight: 700, color: '#ff9ec0', whiteSpace: 'nowrap' }}>
                ❤️ {heartTotal}
              </span>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
