import React from 'react'

export default function BottomNav({ current, navigate }) {
  const tabs = [
    { key: 'home',       label: 'หน้าหลัก', color: '#ffcc00' },
    { key: 'collection', label: 'ร้านค้า',   color: '#aa66ff' },
    { key: 'room',       label: 'ห้อง',      color: '#44cc88' },
    { key: 'report',     label: 'รีพอร์ต',   color: '#4488ff' },
    { key: 'friends',    label: 'เพื่อน',    color: '#ff9933' },
  ]

  return (
    <nav className="px-bottom-nav">
      {tabs.map(({ key, label, color }) => (
        <button
          key={key}
          className={`px-nav-item${current === key ? ' active' : ''}`}
          onClick={() => navigate(key)}
        >
          <div style={{ width: 16, height: 16, background: color, margin: '0 auto 2px', border: '2px solid rgba(0,0,0,0.3)' }} />
          <span style={{ fontFamily: 'var(--font-thai)', fontSize: 10 }}>{label}</span>
          <div className="px-nav-dot" />
        </button>
      ))}
    </nav>
  )
}
