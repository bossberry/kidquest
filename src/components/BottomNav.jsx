import React from 'react'
import { useAppState } from '../context/StateContext.jsx'

export default function BottomNav({ current, navigate }) {
  return (
    <nav className="px-bottom-nav">
      <button className={`px-nav-item${current === 'home' ? ' active' : ''}`} onClick={() => navigate('home')}>
        <div style={{ width:18, height:18, background:'#ffcc00', margin:'0 auto 2px', border:'2px solid rgba(0,0,0,0.3)' }} />
        <span style={{ fontFamily:'var(--font-thai)', fontSize:11 }}>หน้าหลัก</span>
        <div className="px-nav-dot"></div>
      </button>
      <button className={`px-nav-item${current === 'collection' ? ' active' : ''}`} onClick={() => navigate('collection')}>
        <div style={{ width:18, height:18, background:'#aa66ff', margin:'0 auto 2px', border:'2px solid rgba(0,0,0,0.3)' }} />
        <span style={{ fontFamily:'var(--font-thai)', fontSize:11 }}>คอลเลกชัน</span>
        <div className="px-nav-dot"></div>
      </button>
      <button className={`px-nav-item${current === 'report' ? ' active' : ''}`} onClick={() => navigate('report')}>
        <div style={{ width:18, height:18, background:'#4488ff', margin:'0 auto 2px', border:'2px solid rgba(0,0,0,0.3)' }} />
        <span style={{ fontFamily:'var(--font-thai)', fontSize:11 }}>รีพอร์ต</span>
        <div className="px-nav-dot"></div>
      </button>
    </nav>
  )
}
