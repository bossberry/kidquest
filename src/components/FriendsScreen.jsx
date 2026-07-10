import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase.js'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import RoomScene from './RoomScene.jsx'
import RoomVisit from './RoomVisit.jsx'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import { detectFullSet } from '../lib/outfitSets.js'

// SPEC GAME-B §B.1 (2026-07-10) — builds the {head,face,body,back} equipped
// map a friend/bot record actually has. equipped_body/equipped_back come
// from a new RPC column (supabase/migrations/20260710_*.sql) — undefined
// until that migration is applied, which degrades gracefully to null (no
// body/back shown, no set ever detected) rather than throwing.
function equippedFor(a) {
  return {
    head: a.equipped_head ?? null, face: a.equipped_face ?? null,
    body: a.equipped_body ?? null, back: a.equipped_back ?? null,
  }
}

const FONT_TH = { fontFamily: 'var(--font-thai)' }
const FONT_PX = { fontFamily: 'var(--font-pixel)' }

const TABS = [
  { key: 'friends', label: 'เพื่อน',     emoji: '👥' },
  { key: 'others',  label: 'ผู้คนอื่นๆ', emoji: '🌐' },
]

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function FriendsScreen() {
  const [tab, setTab] = useState('friends')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', background: 'var(--px-darkest)', paddingBottom: 80 }}>
      <div style={{ ...FONT_PX, fontSize: 10, color: '#EF9F27', letterSpacing: 3, padding: '14px 20px 10px', borderBottom: '2px solid rgba(255,255,255,0.08)', width: '100%', boxSizing: 'border-box' }}>
        FRIENDS
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderBottom: '2px solid var(--px-border)', width: '100%', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none',
            borderBottom: tab === t.key ? '3px solid var(--px-yellow)' : '3px solid transparent',
            padding: '12px 4px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ fontSize: 22 }}>{t.emoji}</span>
            <span style={{ ...FONT_TH, fontSize: 11, color: tab === t.key ? 'var(--px-yellow)' : 'var(--px-light)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: 16, width: '100%', maxWidth: 480, alignSelf: 'center', boxSizing: 'border-box', flexGrow: 1 }}>
        {tab === 'friends' && <FriendsTab userId={userId} />}
        {tab === 'others'  && <MysteryTab />}
      </div>
    </div>
  )
}

// ─── Unified Friends tab ───────────────────────────────────────────────────────

function FriendsTab({ userId }) {
  const [loading, setLoading]     = useState(true)
  const [requests, setRequests]   = useState([])
  const [code, setCode]           = useState(null)
  const [friends, setFriends]     = useState([])
  const [responding, setResponding] = useState(null)
  const [copied, setCopied]       = useState(false)
  const [addCode, setAddCode]     = useState('')
  const [addMsg, setAddMsg]       = useState(null)
  const [addMsgOk, setAddMsgOk]  = useState(false)
  const [sending, setSending]     = useState(false)

  const loadAll = useCallback(async () => {
    if (!userId || !supabase) { setLoading(false); return }
    setLoading(true)

    const [reqResult, codeResult, friendsResult] = await Promise.all([
      supabase.from('friendships').select('id, requester_id').eq('target_id', userId).eq('status', 'pending'),
      supabase.rpc('ensure_friend_code', { p_user_id: userId }),
      supabase.from('my_friends').select('*'),
    ])

    if (!codeResult.error) {
      const d = codeResult.data
      setCode(typeof d === 'string' ? d : (d?.code ?? d?.friend_code ?? null))
    }

    setFriends(friendsResult.data || [])

    const friendships = reqResult.data || []
    if (friendships.length > 0) {
      const ids = friendships.map(f => f.requester_id)
      const { data: eggs } = await supabase.from('eggs').select('user_id, child_name').in('user_id', ids)
      const nameMap = Object.fromEntries((eggs || []).map(e => [e.user_id, e.child_name]))
      setRequests(friendships.map(f => ({ id: f.id, name: nameMap[f.requester_id] || 'เพื่อนลึกลับ' })))
    } else {
      setRequests([])
    }

    setLoading(false)
  }, [userId])

  useEffect(() => { loadAll() }, [loadAll])

  const respond = async (id, accept) => {
    setResponding(id)
    await supabase.rpc('respond_friend_request', { p_friendship_id: id, p_accept: accept })
    setResponding(null)
    loadAll()
  }

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    const trimmed = addCode.trim().toUpperCase()
    if (trimmed.length < 6 || !supabase) return
    setSending(true)
    setAddMsg(null)
    const { data, error } = await supabase.rpc('send_friend_request', { p_code: trimmed })
    setSending(false)
    if (error) {
      const m = error.message?.toLowerCase() ?? ''
      if (m.includes('self') || m.includes('yourself') || m.includes('own')) {
        setAddMsg('นั่นคือรหัสของลูกเอง 😅'); setAddMsgOk(false)
      } else if (m.includes('not found') || m.includes('no rows') || m.includes('invalid') || m.includes('exist')) {
        setAddMsg('ไม่พบรหัสนี้ ลองตรวจสอบอีกครั้งนะ'); setAddMsgOk(false)
      } else {
        setAddMsg('เกิดข้อผิดพลาด ลองใหม่นะ'); setAddMsgOk(false)
      }
    } else {
      const row = Array.isArray(data) ? data[0] : data
      if (row?.status === 'accepted') {
        setAddMsg('เป็นเพื่อนกันอยู่แล้ว 😊'); setAddMsgOk(true)
      } else {
        setAddMsg('ส่งคำขอแล้ว! รอเพื่อนยืนยันนะ 🎉'); setAddMsgOk(true)
      }
      setAddCode('')
    }
  }

  if (loading) return <LoadingBox />

  const displayCode = code ? `${code.slice(0, 3)}-${code.slice(3)}` : '???-???'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Incoming requests — only rendered if any */}
      {requests.length > 0 && (
        <section>
          <SectionLabel>📬 คำขอเพื่อน ({requests.length})</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(r => (
              <div key={r.id} style={{
                background: 'var(--px-dark)', border: '2px solid var(--px-border)',
                boxShadow: '3px 3px 0 var(--px-black)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>👤</span>
                  <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', fontWeight: 600 }}>{r.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => respond(r.id, true)} disabled={responding === r.id}
                    className="px-btn"
                    style={{ ...FONT_TH, fontSize: 12, textTransform: 'none', letterSpacing: 0, padding: '8px 14px', opacity: responding === r.id ? 0.6 : 1 }}>
                    ✓ ยืนยัน
                  </button>
                  <button onClick={() => respond(r.id, false)} disabled={responding === r.id}
                    style={{ ...FONT_TH, fontSize: 12, padding: '8px 14px', cursor: 'pointer',
                      background: 'transparent', border: '2px solid var(--px-border)',
                      color: 'var(--px-light)', boxShadow: '2px 2px 0 var(--px-black)',
                      opacity: responding === r.id ? 0.6 : 1 }}>
                    ✕ ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Code */}
      <section>
        <SectionLabel>🏷️ รหัสของลูก</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'var(--px-dark)', border: '3px solid var(--px-yellow)', boxShadow: '4px 4px 0 var(--px-black)', padding: '18px 28px', textAlign: 'center' }}>
            <div style={{ ...FONT_PX, fontSize: 24, color: 'var(--px-yellow)', letterSpacing: 8 }}>{displayCode}</div>
          </div>
          <button onClick={handleCopy} className="px-btn"
            style={{ ...FONT_TH, fontSize: 13, textTransform: 'none', letterSpacing: 0, minWidth: 160 }}>
            {copied ? '✅ คัดลอกแล้ว!' : '📋 คัดลอกรหัส'}
          </button>
          <div style={{ ...FONT_TH, fontSize: 11, color: 'var(--px-light)', textAlign: 'center', lineHeight: 1.7, opacity: 0.7, maxWidth: 240 }}>
            บอกรหัสนี้ให้เพื่อนใส่เพื่อเพิ่มเพื่อนกัน
          </div>
        </div>
      </section>

      {/* Add Friend */}
      <section>
        <SectionLabel>➕ เพิ่มเพื่อน</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="px-auth-input"
            style={{ ...FONT_PX, fontSize: 18, textAlign: 'center', letterSpacing: 8, textTransform: 'uppercase' }}
            placeholder="ABCDEF"
            value={addCode}
            onChange={e => {
              const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
              setAddCode(raw)
              setAddMsg(null)
            }}
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          {addMsg && (
            <div style={{ ...FONT_TH, fontSize: 13, color: addMsgOk ? 'var(--px-green2)' : 'var(--px-red)', textAlign: 'center' }}>
              {addMsg}
            </div>
          )}
          <button onClick={handleSend}
            disabled={addCode.length < 6 || sending || !supabase}
            className="px-btn"
            style={{ ...FONT_TH, fontSize: 14, textTransform: 'none', letterSpacing: 0, opacity: addCode.length >= 6 && !sending ? 1 : 0.5 }}>
            {sending ? '⏳ กำลังส่ง...' : 'ส่งคำขอเพื่อน ➕'}
          </button>
        </div>
      </section>

      {/* Friends list */}
      <section>
        <SectionLabel>
          {'👥 เพื่อนทั้งหมด'}
          {friends.length > 0 && ` (${friends.length})`}
        </SectionLabel>
        {friends.length === 0 ? (
          <EmptyState emoji="👥" text="ยังไม่มีเพื่อนเลย ลองเพิ่มเพื่อนดูนะ!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {friends.map((f, i) => (
              <div key={f.friendship_id ?? i} style={{
                background: 'var(--px-dark)', border: '2px solid var(--px-border)',
                boxShadow: '3px 3px 0 var(--px-black)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>🌟</span>
                <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', fontWeight: 600 }}>
                  {f.friend_name ?? f.child_name ?? 'เพื่อนลึกลับ'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

// ─── Rarity helpers ───────────────────────────────────────────────────────────

const RARITY = {
  common:    { color: '#aaaaaa', bg: 'rgba(170,170,170,0.10)', border: 'rgba(170,170,170,0.35)', glow: null },
  uncommon:  { color: '#44aaff', bg: 'rgba(68,170,255,0.10)',  border: 'rgba(68,170,255,0.45)',  glow: null },
  rare:      { color: '#bb55ff', bg: 'rgba(187,85,255,0.10)',  border: 'rgba(187,85,255,0.45)',  glow: null },
  epic:      { color: '#ff9900', bg: 'rgba(255,153,0,0.10)',   border: 'rgba(255,153,0,0.50)',   glow: null },
  legendary: { color: '#ffd700', bg: 'rgba(255,215,0,0.12)',   border: '#ffd700',                glow: '0 0 8px rgba(255,215,0,0.45)' },
}

function rarityKey(label) {
  return (label || 'common').toLowerCase().replace(/\s/g, '')
}

const ELEMENT_TH = {
  fire: 'ธาตุไฟ', water: 'ธาตุน้ำ', thunder: 'ธาตุฟ้า',
  nature: 'ธาตุธรรมชาติ', shadow: 'ธาตุเงา', light: 'ธาตุแสง',
}

function RarityBadge({ label }) {
  const s = RARITY[rarityKey(label)] ?? RARITY.common
  return (
    <span style={{
      ...FONT_TH, fontSize: 10, fontWeight: 700, color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      padding: '2px 7px', boxShadow: s.glow ?? 'none', flexShrink: 0,
    }}>
      {label || 'Common'}
    </span>
  )
}

function StatBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ ...FONT_PX, fontSize: 7, color: 'rgba(255,255,255,0.5)', width: 26, textAlign: 'right', flexShrink: 0 }}>
        {label}
      </div>
      <div className="px-hp-bar-outer" style={{ flex: 1 }}>
        <div className="px-hp-bar-inner" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ ...FONT_PX, fontSize: 8, color: 'rgba(255,255,255,0.75)', width: 28, textAlign: 'right', flexShrink: 0 }}>
        {value}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ ...FONT_PX, fontSize: 6, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ ...FONT_PX, fontSize: 8, color }}>{value ?? '-'}</span>
    </span>
  )
}

// ─── Inline cosmetic icon (static, no label) ────────────────────────────────────
// Renders the adventurer's egg wearing exactly one cosmetic, single-frame.

function CosmeticIcon({ egg, item, size = 30 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const H = Math.round(size * 1.19)
    const DPR = window.devicePixelRatio || 1
    canvas.width  = Math.round(size * DPR)
    canvas.height = Math.round(H * DPR)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    ctx.imageSmoothingEnabled = false
    renderEggSprite(ctx, {
      element: egg.element ?? 'fire', eye: egg.eye ?? 'gba', gender: egg.gender ?? 'male',
      stage: 1, aura: 0, anim: 'idle', t: 0, canvasSize: size,
      equipped: { [item.slot]: item.id, [item.slot === 'head' ? 'face' : 'head']: null },
    })
  }, [egg.element, egg.eye, egg.gender, item.id, item.slot, size])
  return (
    <canvas ref={ref} title={item.nameTh}
      style={{ width: size, height: Math.round(size * 1.19), imageRendering: 'pixelated', display: 'block' }} />
  )
}

function cosmeticIconsFor(a) {
  const out = []
  if (a.equipped_head) {
    const it = COSMETIC_ITEMS.find(i => i.id === a.equipped_head && i.slot === 'head')
    if (it) out.push(it)
  }
  if (a.equipped_face) {
    const it = COSMETIC_ITEMS.find(i => i.id === a.equipped_face && i.slot === 'face')
    if (it) out.push(it)
  }
  // SPEC GAME-B §B.1 (2026-07-10)
  if (a.equipped_body) {
    const it = COSMETIC_ITEMS.find(i => i.id === a.equipped_body && i.slot === 'body')
    if (it) out.push(it)
  }
  if (a.equipped_back) {
    const it = COSMETIC_ITEMS.find(i => i.id === a.equipped_back && i.slot === 'back')
    if (it) out.push(it)
  }
  return out
}

// ─── Adventurer stats modal ────────────────────────────────────────────────────

function AdventurerModal({ adventurer: a, onChallenge, onClose }) {
  const s = RARITY[rarityKey(a.rarity_label)] ?? RARITY.common
  const outfitSet = detectFullSet(equippedFor(a))
  return createPortal(
    <div className="auth-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="px-auth-sheet" style={{ maxWidth: 340 }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          ...FONT_PX, fontSize: 12, color: 'var(--px-light)', padding: 4,
          WebkitTapHighlightColor: 'transparent',
        }}>✕</button>

        {/* Egg avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{
            background: 'var(--px-black)',
            border: `2px solid ${s.border}`,
            boxShadow: s.glow ? `4px 4px 0 var(--px-black), ${s.glow}` : '4px 4px 0 var(--px-black)',
            lineHeight: 0,
          }}>
            <EggCanvasCore
              element={a.element ?? 'fire'} eye={a.eye ?? 'gba'} gender={a.gender ?? 'male'}
              stage={a.stage ?? 1} aura={0} size={160}
              equipped={equippedFor(a)}
              auraTint={outfitSet?.tint} setPose={outfitSet?.pose}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ ...FONT_TH, fontSize: 15, fontWeight: 700, color: 'var(--px-light)' }}>
              {a.display_name ?? 'นักผจญภัยลึกลับ'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...FONT_TH, fontSize: 11, color: 'var(--px-light)', opacity: 0.65 }}>
                {ELEMENT_TH[a.element] ?? 'ธาตุลึกลับ'}
              </span>
              <RarityBadge label={a.rarity_label} />
            </div>
            {/* SPEC GAME-B §B.1 — full outfit-set name */}
            {outfitSet && (
              <div style={{ ...FONT_TH, fontSize: 11, color: 'var(--px-yellow)', fontWeight: 700 }}>
                ✨ ชุด: {outfitSet.nameTh} ✨
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <StatBar label="HP"  value={a.hp  ?? 0} max={300} color="var(--px-green)"  />
          <StatBar label="ATK" value={a.atk ?? 0} max={80}  color="var(--px-red)"   />
          <StatBar label="DEF" value={a.def ?? 0} max={60}  color="var(--px-blue2)" />
          <StatBar label="SPD" value={a.spd ?? 0} max={300} color="var(--px-yellow)"/>
        </div>

        <button onClick={() => onChallenge(a.display_name)}
          className="px-btn px-btn-purple"
          style={{ width: '100%', ...FONT_TH, fontSize: 14, textTransform: 'none', letterSpacing: 0 }}>
          ⚔️ ท้าเล่น
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─── Mystery Adventurers tab ───────────────────────────────────────────────────

function MysteryTab() {
  const [adventurers, setAdventurers]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null)
  const [visiting, setVisiting]         = useState(null)
  const [toastMsg, setToastMsg]         = useState(null)
  const toastTimerRef                   = useRef(null)

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.rpc('get_mystery_adventurers', { p_limit: 8 })
    setAdventurers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const handleChallenge = (name) => {
    setSelected(null)
    clearTimeout(toastTimerRef.current)
    setToastMsg(`ส่งคำท้า${name ? ` ${name}` : ''}แล้ว! รอสักครู่นะ...`)
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000)
  }

  return (
    <div>
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--px-dark)', border: '2px solid var(--px-yellow)',
          boxShadow: '4px 4px 0 var(--px-black)', padding: '12px 20px',
          zIndex: 9999, width: 260, textAlign: 'center',
          ...FONT_TH, fontSize: 13, color: 'var(--px-light)',
        }}>
          {toastMsg}
        </div>
      )}

      {selected && (
        <AdventurerModal
          adventurer={selected}
          onChallenge={handleChallenge}
          onClose={() => setSelected(null)}
        />
      )}

      {visiting && (
        <RoomVisit adventurer={visiting} onClose={() => setVisiting(null)} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-yellow)', fontWeight: 700 }}>🌐 ผู้คนอื่นๆ</div>
        <button onClick={load} disabled={loading}
          style={{ ...FONT_TH, fontSize: 12, background: 'transparent', border: '2px solid var(--px-border)',
            color: 'var(--px-light)', padding: '6px 12px', cursor: 'pointer',
            boxShadow: '2px 2px 0 var(--px-black)', opacity: loading ? 0.5 : 1 }}>
          🔄 สับใหม่
        </button>
      </div>

      {loading ? <LoadingBox /> : adventurers.length === 0 ? (
        <EmptyState emoji="🌐" text="ไม่มีผู้คนให้แสดงตอนนี้" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {adventurers.map((a, i) => {
            const s = RARITY[rarityKey(a.rarity_label)] ?? RARITY.common
            const eggIdentity = { element: a.element ?? 'fire', eye: a.eye ?? 'gba', gender: a.gender ?? 'male' }
            const icons = cosmeticIconsFor(a)
            // Multi-room aware: preview the friend's first room (falls back to the
            // flat room_layout when the RPC hasn't been migrated yet).
            const primaryRoom = (Array.isArray(a.rooms) && a.rooms.length > 0)
              ? a.rooms[0]
              : { theme: 'default', layout: a.room_layout ?? {} }
            return (
              <div key={i}
                onClick={() => setVisiting(a)}
                style={{
                  background: 'var(--px-dark)',
                  border: `2px solid ${s.border}`,
                  boxShadow: s.glow ? `3px 3px 0 var(--px-black), ${s.glow}` : '3px 3px 0 var(--px-black)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>
                {/* Room preview thumbnail: room background + companion egg (with cosmetics) */}
                <div style={{
                  flexShrink: 0, background: 'var(--px-black)',
                  border: `2px solid ${s.border}`, lineHeight: 0,
                }}>
                  <RoomScene
                    width={72} height={80} small
                    roomLayout={primaryRoom.layout ?? {}}
                    theme={primaryRoom.theme ?? 'default'}
                    egg={{
                      ...eggIdentity, stage: a.stage ?? 1, aura: 0,
                      equipped: equippedFor(a),
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ ...FONT_TH, fontSize: 13, color: 'var(--px-light)', fontWeight: 700 }}>
                      {a.display_name ?? 'นักผจญภัยลึกลับ'}
                    </span>
                    <RarityBadge label={a.rarity_label} />
                  </div>
                  <div style={{ ...FONT_TH, fontSize: 10, color: 'var(--px-light)', opacity: 0.55 }}>
                    {ELEMENT_TH[a.element] ?? 'ธาตุลึกลับ'} · Lv.{a.stage ?? 1}
                  </div>
                  {/* SPEC GAME-B §B.1 — full outfit-set name, if the friend/bot's
                      equipped combo forms one (undefined body/back pre-migration
                      just means detectFullSet never matches — degrades cleanly) */}
                  {detectFullSet(equippedFor(a)) && (
                    <div style={{ ...FONT_TH, fontSize: 10, color: 'var(--px-yellow)', fontWeight: 700 }}>
                      ✨ ชุด: {detectFullSet(equippedFor(a)).nameTh}
                    </div>
                  )}
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <MiniStat label="HP"  value={a.hp}  color="var(--px-green)" />
                    <MiniStat label="ATK" value={a.atk} color="var(--px-red)" />
                    <MiniStat label="SPD" value={a.spd} color="var(--px-yellow)" />
                  </div>
                  {/* Worn cosmetics — icons only, no label/count */}
                  {icons.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {icons.map(it => <CosmeticIcon key={it.id} egg={eggIdentity} item={it} size={28} />)}
                    </div>
                  )}
                </div>

                {/* View stats button — preserves the existing ดูสเตตัส → ท้าเล่น modal flow */}
                <button onClick={(e) => { e.stopPropagation(); setSelected(a) }}
                  aria-label="ดูสเตตัส"
                  style={{
                    flexShrink: 0, ...FONT_TH, fontSize: 10, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    minWidth: 44, minHeight: 44, justifyContent: 'center',
                    background: 'transparent', border: '2px solid var(--px-border)',
                    color: 'var(--px-light)', padding: '5px 8px',
                    boxShadow: '2px 2px 0 var(--px-black)', whiteSpace: 'nowrap',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>📊</span>
                  สเตตัส
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-yellow)', fontWeight: 700, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function LoadingBox() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', opacity: 0.6 }}>กำลังโหลด...</span>
    </div>
  )
}

function EmptyState({ emoji, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 32, opacity: 0.7 }}>
      <span style={{ fontSize: 48 }}>{emoji}</span>
      <span style={{ ...FONT_TH, fontSize: 13, color: 'var(--px-light)', textAlign: 'center', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}
