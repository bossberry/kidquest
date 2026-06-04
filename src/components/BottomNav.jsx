import React from 'react'
import { useAppState } from '../context/StateContext.jsx'

export default function BottomNav({ current, navigate }) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-btn${current === 'home' ? ' active' : ''}`} onClick={() => navigate('home')}>
        <span className="nav-icon">🏠</span><span>หน้าหลัก</span><div className="nav-dot"></div>
      </button>
      <button className={`nav-btn${current === 'collection' ? ' active' : ''}`} onClick={() => navigate('collection')}>
        <span className="nav-icon">🥚</span><span>คอลเลกชัน</span><div className="nav-dot"></div>
      </button>
      <button className={`nav-btn${current === 'report' ? ' active' : ''}`} onClick={() => navigate('report')}>
        <span className="nav-icon">📊</span><span>รีพอร์ต</span><div className="nav-dot"></div>
      </button>
    </nav>
  )
}
