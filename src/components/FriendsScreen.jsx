import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

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
            {sending ? 'กำลังส่ง...' : 'ส่งคำขอเพื่อน ➕'}
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

// ─── Mystery Adventurers tab ───────────────────────────────────────────────────

function MysteryTab() {
  const [adventurers, setAdventurers] = useState([])
  const [loading, setLoading]         = useState(true)
  const [toastMsg, setToastMsg]       = useState(null)
  const toastTimerRef                 = useRef(null)

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
          {adventurers.map((a, i) => (
            <div key={i} style={{
              background: 'var(--px-dark)', border: '2px solid var(--px-border)',
              boxShadow: '3px 3px 0 var(--px-black)', padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, background: 'var(--px-mid)',
                  border: '2px solid var(--px-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 18 }}>⚔️</span>
                </div>
                <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', fontWeight: 600 }}>
                  {a.display_name ?? 'นักผจญภัยลึกลับ'}
                </span>
              </div>
              <button onClick={() => handleChallenge(a.display_name)}
                className="px-btn px-btn-purple"
                style={{ ...FONT_TH, fontSize: 12, textTransform: 'none', letterSpacing: 0, padding: '8px 14px' }}>
                ท้าเล่น
              </button>
            </div>
          ))}
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
