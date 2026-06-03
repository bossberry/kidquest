import React from 'react'
import { useAppState } from '../context/StateContext.jsx'

export default function BottomNav({ current, navigate }) {
  const { state } = useAppState()
  const hasChallenger = !!state.pendingChallenger

  return (
    <nav className="bottom-nav">
      <button className={`nav-btn${current === 'home' ? ' active' : ''}`} onClick={() => navigate('home')}>
        <span className="nav-icon">🏠</span><span>หน้าหลัก</span><div className="nav-dot"></div>
      </button>
      <button className={`nav-btn${current === 'collection' ? ' active' : ''}`} onClick={() => navigate('collection')} style={{ position:'relative' }}>
        <span className="nav-icon">🥚</span><span>คอลเลกชัน</span><div className="nav-dot"></div>
        {hasChallenger && (
          <span style={{
            position:'absolute', top:4, right:8, fontSize:14,
            animation:'challenger-pulse 1s ease-in-out infinite',
            lineHeight:1,
          }}>⚔️</span>
        )}
      </button>
      <button className={`nav-btn${current === 'report' ? ' active' : ''}`} onClick={() => navigate('report')}>
        <span className="nav-icon">📊</span><span>รีพอร์ต</span><div className="nav-dot"></div>
      </button>
    </nav>
  )
}
