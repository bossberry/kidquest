import React from 'react'
import { useAppState } from '../context/StateContext.jsx'

export default function BottomNav({ current, navigate }) {
  return (
    <nav className="px-bottom-nav">
      <button className={`px-nav-item${current === 'home' ? ' active' : ''}`} onClick={() => navigate('home')}>
        <span style={{ fontSize:22 }}>🏠</span>
        <span style={{ fontFamily:'var(--font-thai)', fontSize:11 }}>หน้าหลัก</span>
        <div className="px-nav-dot"></div>
      </button>
      <button className={`px-nav-item${current === 'collection' ? ' active' : ''}`} onClick={() => navigate('collection')}>
        <span style={{ fontSize:22 }}>🥚</span>
        <span style={{ fontFamily:'var(--font-thai)', fontSize:11 }}>คอลเลกชัน</span>
        <div className="px-nav-dot"></div>
      </button>
      <button className={`px-nav-item${current === 'report' ? ' active' : ''}`} onClick={() => navigate('report')}>
        <span style={{ fontSize:22 }}>📊</span>
        <span style={{ fontFamily:'var(--font-thai)', fontSize:11 }}>รีพอร์ต</span>
        <div className="px-nav-dot"></div>
      </button>
    </nav>
  )
}
