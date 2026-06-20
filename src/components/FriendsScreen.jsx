import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const FONT_TH = { fontFamily: 'var(--font-thai)' }
const FONT_PX = { fontFamily: 'var(--font-pixel)' }

const TABS = [
  { key: 'mycode',   label: 'รหัสฉัน',    emoji: '🏷️' },
  { key: 'add',      label: 'เพิ่มเพื่อน', emoji: '➕' },
  { key: 'requests', label: 'คำขอ',       emoji: '📬' },
  { key: 'list',     label: 'เพื่อน',     emoji: '👥' },
]

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function FriendsScreen() {
  const [tab, setTab] = useState('mycode')
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '2px solid var(--px-border)', width: '100%', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none',
            borderBottom: tab === t.key ? '3px solid var(--px-yellow)' : '3px solid transparent',
            padding: '10px 4px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{ ...FONT_TH, fontSize: 10, color: tab === t.key ? 'var(--px-yellow)' : 'var(--px-light)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: 16, width: '100%', maxWidth: 480, alignSelf: 'center', boxSizing: 'border-box', flexGrow: 1 }}>
        {tab === 'mycode'   && <MyCodeTab userId={userId} />}
        {tab === 'add'      && <AddFriendTab />}
        {tab === 'requests' && <RequestsTab userId={userId} />}
        {tab === 'list'     && <FriendsListTab />}
      </div>
    </div>
  )
}

// ─── My Code ──────────────────────────────────────────────────────────────────

function MyCodeTab({ userId }) {
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!userId || !supabase) { setLoading(false); return }
    supabase.rpc('ensure_friend_code', { p_user_id: userId }).then(({ data, error }) => {
      if (!error) {
        const c = typeof data === 'string' ? data : (data?.code ?? data?.friend_code ?? null)
        setCode(c)
      }
      setLoading(false)
    })
  }, [userId])

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <LoadingBox />

  const displayCode = code ? `${code.slice(0, 3)}-${code.slice(3)}` : '???-???'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 16 }}>
      <div style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', textAlign: 'center' }}>
        รหัสเพื่อนของลูก
      </div>
      <div style={{ background: 'var(--px-dark)', border: '3px solid var(--px-yellow)', boxShadow: '4px 4px 0 var(--px-black)', padding: '20px 32px', textAlign: 'center' }}>
        <div style={{ ...FONT_PX, fontSize: 26, color: 'var(--px-yellow)', letterSpacing: 8 }}>
          {displayCode}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="px-btn"
        style={{ ...FONT_TH, fontSize: 14, textTransform: 'none', letterSpacing: 0, minWidth: 180 }}
      >
        {copied ? '✅ คัดลอกแล้ว!' : '📋 คัดลอกรหัส'}
      </button>
      <div style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-light)', textAlign: 'center', lineHeight: 1.7, opacity: 0.8, maxWidth: 260 }}>
        บอกรหัสนี้ให้เพื่อนใส่ในหน้า "เพิ่มเพื่อน" เพื่อเป็นเพื่อนกัน
      </div>
    </div>
  )
}

// ─── Add Friend ───────────────────────────────────────────────────────────────

function AddFriendTab() {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [msgOk, setMsgOk] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 6 || !supabase) return
    setSending(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('send_friend_request', { p_code: trimmed })
    setSending(false)
    if (error) {
      const m = error.message?.toLowerCase() ?? ''
      if (m.includes('self') || m.includes('yourself') || m.includes('own')) {
        setMsg('นั่นคือรหัสของลูกเอง 😅'); setMsgOk(false)
      } else if (m.includes('not found') || m.includes('no rows') || m.includes('invalid') || m.includes('exist')) {
        setMsg('ไม่พบรหัสนี้ ลองตรวจสอบอีกครั้งนะ'); setMsgOk(false)
      } else {
        setMsg('เกิดข้อผิดพลาด ลองใหม่นะ'); setMsgOk(false)
      }
    } else {
      // RPC returns table row — may come back as array or single object
      const row = Array.isArray(data) ? data[0] : data
      if (row?.status === 'accepted') {
        setMsg('เป็นเพื่อนกันอยู่แล้ว 😊'); setMsgOk(true)
      } else {
        setMsg('ส่งคำขอแล้ว! รอเพื่อนยืนยันนะ 🎉'); setMsgOk(true)
      }
      setCode('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
      <div style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)' }}>ใส่รหัสเพื่อน</div>
      <input
        className="px-auth-input"
        style={{ ...FONT_PX, fontSize: 20, textAlign: 'center', letterSpacing: 8, textTransform: 'uppercase' }}
        placeholder="ABCDEF"
        value={code}
        onChange={e => {
          const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
          setCode(raw)
          setMsg(null)
        }}
        maxLength={6}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
      />
      {msg && (
        <div style={{ ...FONT_TH, fontSize: 13, color: msgOk ? 'var(--px-green2)' : 'var(--px-red)', textAlign: 'center' }}>
          {msg}
        </div>
      )}
      <button
        onClick={handleSend}
        disabled={code.length < 6 || sending || !supabase}
        className="px-btn"
        style={{ ...FONT_TH, fontSize: 14, textTransform: 'none', letterSpacing: 0, opacity: code.length >= 6 && !sending ? 1 : 0.5 }}
      >
        {sending ? 'กำลังส่ง...' : 'ส่งคำขอเพื่อน ➕'}
      </button>
      <div style={{ ...FONT_TH, fontSize: 12, color: 'var(--px-light)', opacity: 0.6, textAlign: 'center', lineHeight: 1.6 }}>
        ขอรหัสจากเพื่อนแล้วใส่ที่นี่
      </div>
    </div>
  )
}

// ─── Incoming Requests ────────────────────────────────────────────────────────

function RequestsTab({ userId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)

  const load = useCallback(async () => {
    if (!userId || !supabase) { setLoading(false); return }
    setLoading(true)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, requester_id')
      .eq('target_id', userId)
      .eq('status', 'pending')

    if (!friendships?.length) { setRequests([]); setLoading(false); return }

    const requesterIds = friendships.map(f => f.requester_id)
    const { data: eggs } = await supabase
      .from('eggs')
      .select('user_id, child_name')
      .in('user_id', requesterIds)

    const nameMap = Object.fromEntries((eggs || []).map(e => [e.user_id, e.child_name]))
    setRequests(friendships.map(f => ({ id: f.id, name: nameMap[f.requester_id] || 'เพื่อนลึกลับ' })))
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const respond = async (id, accept) => {
    setResponding(id)
    await supabase.rpc('respond_friend_request', { p_friendship_id: id, p_accept: accept })
    setResponding(null)
    load()
  }

  if (loading) return <LoadingBox />
  if (!requests.length) return <EmptyState emoji="📬" text="ยังไม่มีคำขอเพื่อนในขณะนี้" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
      <div style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', marginBottom: 4 }}>
        คำขอเพื่อน ({requests.length})
      </div>
      {requests.map(r => (
        <div key={r.id} style={{
          background: 'var(--px-dark)', border: '2px solid var(--px-border)',
          boxShadow: '3px 3px 0 var(--px-black)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>👤</span>
            <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', fontWeight: 600 }}>{r.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => respond(r.id, true)}
              disabled={responding === r.id}
              className="px-btn"
              style={{ ...FONT_TH, fontSize: 12, textTransform: 'none', letterSpacing: 0, padding: '8px 14px', opacity: responding === r.id ? 0.6 : 1 }}
            >✓ ยืนยัน</button>
            <button
              onClick={() => respond(r.id, false)}
              disabled={responding === r.id}
              style={{
                ...FONT_TH, fontSize: 12, padding: '8px 14px', cursor: 'pointer',
                background: 'transparent', border: '2px solid var(--px-border)',
                color: 'var(--px-light)', boxShadow: '2px 2px 0 var(--px-black)',
                opacity: responding === r.id ? 0.6 : 1,
              }}
            >✕ ปฏิเสธ</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Friends List ─────────────────────────────────────────────────────────────

function FriendsListTab() {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('my_friends').select('*').then(({ data }) => {
      setFriends(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingBox />
  if (!friends.length) return <EmptyState emoji="👥" text="ยังไม่มีเพื่อนเลย ลองเพิ่มเพื่อนดูนะ!" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
      <div style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', marginBottom: 4 }}>
        เพื่อนทั้งหมด ({friends.length})
      </div>
      {friends.map((f, i) => (
        <div key={f.friendship_id ?? f.friend_id ?? i} style={{
          background: 'var(--px-dark)', border: '2px solid var(--px-border)',
          boxShadow: '3px 3px 0 var(--px-black)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>🌟</span>
          <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', fontWeight: 600 }}>
            {f.friend_name ?? f.child_name ?? 'เพื่อนลึกลับ'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function LoadingBox() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <span style={{ ...FONT_TH, fontSize: 14, color: 'var(--px-light)', opacity: 0.6 }}>กำลังโหลด...</span>
    </div>
  )
}

function EmptyState({ emoji, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 48, opacity: 0.7 }}>
      <span style={{ fontSize: 52 }}>{emoji}</span>
      <span style={{ ...FONT_TH, fontSize: 13, color: 'var(--px-light)', textAlign: 'center', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}
