import React from 'react'

export default function BottomNav({ current, navigate }) {
  const tabs = [
    { key: 'home',       label: 'หน้าหลัก', icon: '🏠' },
    { key: 'collection', label: 'ร้านค้า',   icon: '🛒' },
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
            style={{ minHeight: 44 }}
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
          </button>
        )
      })}
    </nav>
  )
}
