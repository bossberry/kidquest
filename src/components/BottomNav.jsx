import React from 'react'

export default function BottomNav({ current, navigate, hasNewRoomItem, hasNewItem }) {
  const tabs = [
    { key: 'home',       label: 'หน้าหลัก', icon: '🏠' },
    { key: 'collection', label: 'แต่งตัว',   icon: '🛒' },
    { key: 'room',       label: 'ห้อง',      icon: '🏡' },
    { key: 'report',     label: 'รีพอร์ต',   icon: '📊' },
    { key: 'friends',    label: 'เพื่อน',    icon: '👥' },
  ]

  return (
    <nav className="px-bottom-nav">
      {tabs.map(({ key, label, icon }) => {
        const active = current === key
        return (
          <button
            key={key}
            className={`px-nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(key)}
            style={{ minHeight: 44, position: 'relative' }}
          >
            <span
              style={{
                fontSize: 26,
                lineHeight: 1,
                display: 'block',
                transition: 'transform .15s',
                transform: active ? 'scale(1.15)' : 'scale(1)',
                filter: active ? 'drop-shadow(0 0 6px rgba(240,208,32,0.9))' : 'none',
              }}
            >
              {icon}
            </span>
            <span style={{ fontFamily: 'var(--font-thai)', fontSize: 10 }}>{label}</span>
            <div className="px-nav-dot" />
            {key === 'room' && hasNewRoomItem && (
              <span aria-label="ของใหม่" style={{
                position: 'absolute', top: 2, right: '22%',
                background: '#FFD23F', color: '#3a2a00',
                fontFamily: 'var(--font-thai)', fontSize: 8, fontWeight: 700,
                borderRadius: 8, padding: '1px 5px', whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                animation: 'mg-badge-lowpulse 1.4s ease-in-out infinite',
              }}>
                ✨ ของใหม่!
              </span>
            )}
            {/* SPEC GAME-B §B.1 (2026-07-10) — same badge, cosmetic drop/craft on แต่งตัว */}
            {key === 'collection' && hasNewItem && (
              <span aria-label="ของใหม่" style={{
                position: 'absolute', top: 2, right: '22%',
                background: '#FFD23F', color: '#3a2a00',
                fontFamily: 'var(--font-thai)', fontSize: 8, fontWeight: 700,
                borderRadius: 8, padding: '1px 5px', whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                animation: 'mg-badge-lowpulse 1.4s ease-in-out infinite',
              }}>
                ✨ ของใหม่!
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
