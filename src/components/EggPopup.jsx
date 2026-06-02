import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { eggProgress, EGG_STAGE_NAMES, STAGE_XP_NEEDED, EGG_STAGES } from '../lib/eggAlgorithm.js'
import { ITEMS } from '../config/gameConfig.js'
import { playTone, speakTh, playEatSound } from '../lib/audio.js'
import { showToast } from './Toasts.jsx'

export default function EggPopup({ open, onClose }) {
  const { state, dispatch, eggStatsData, eggProgressData } = useAppState()
  const [floats, setFloats] = useState([])
  if (!open) return null

  const { stage, stageXP, pct } = eggProgressData
  const h = state.happiness || 80
  const items = state.items || {}
  const totalItems = Object.values(items).reduce((a, b) => a + b, 0)

  const floatHappy = (emoji) => {
    const id = Date.now() + Math.random()
    setFloats(f => [...f, { id, emoji, x: 40 + Math.random() * 80, y: 40 + Math.random() * 60 }])
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 1100)
  }

  const handleTap = () => {
    playTone('click')
    floatHappy(['💕','😊','✨','🌟'][Math.floor(Math.random() * 4)])
    speakTh('สวัสดี')
  }

  const useItemHandler = (key) => {
    playEatSound()
    dispatch({ type: ACTIONS.USE_ITEM, payload: { key } })
    const item = ITEMS[key]
    let msg = ''
    if (key === 'food') { msg = '🍗 ไข่กินอาหารแล้ว! +25 ความสุข'; floatHappy('😋'); floatHappy('❤️') }
    else if (key === 'star') { msg = '⭐ XP x2 เป็นเวลา 5 นาที!'; floatHappy('⭐'); floatHappy('✨') }
    else if (key === 'ribbon') { msg = '🎀 ไข่ดูสวยขึ้น! +15 ความสุข'; floatHappy('🎀') }
    else if (key === 'potion') { msg = '💧 น้ำมนต์ +20 XP!'; floatHappy('✨'); floatHappy('🌟') }
    showToast(msg)
    playTone(key === 'food' || key === 'ribbon' ? 'correct' : 'streak')
  }

  return createPortal(
    <div className="egg-popup-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="egg-popup">
        <div className="egg-popup-handle" />
        <div className="egg-popup-title">{EGG_STAGE_NAMES[stage] || 'ไข่ลึกลับ'}</div>
        <div className="egg-popup-sub">Stage {stage+1} / {EGG_STAGES} · {stageXP}/{STAGE_XP_NEEDED} XP</div>
        <div className="egg-popup-canvas-wrap">
          <div className="egg-crack-wrap">
            <EggCanvas stats={eggStatsData} width={160} height={190} style={{ borderRadius:16, cursor:'pointer' }} onClick={handleTap} />
          </div>
          <div id="popup-happy-floats" style={{ position:'absolute', pointerEvents:'none' }}>
            {floats.map(f => (
              <div key={f.id} className="egg-happy" style={{ left: f.x + 'px', top: f.y + 'px' }}>{f.emoji}</div>
            ))}
          </div>
        </div>
        <div className="happy-row">
          <div className="happy-label">ความสุข 😊</div>
          <div className="happy-track"><div className="happy-fill" style={{ width: h + '%' }} /></div>
          <div style={{ fontSize:12, color:'var(--muted)', width:32, textAlign:'right' }}>{h}%</div>
        </div>
        <div className="items-label">ไอเทมในกระเป๋า</div>
        {totalItems === 0 ? (
          <div className="item-empty">ยังไม่มีไอเทม — ผ่านด่านเพื่อรับไอเทม!</div>
        ) : (
          <div className="items-grid">
            {Object.entries(ITEMS).map(([key, item]) => {
              const count = items[key] || 0
              return (
                <div
                  key={key}
                  className={`item-slot${count === 0 ? ' disabled' : ''}`}
                  title={item.desc}
                  onClick={() => count > 0 && useItemHandler(key)}
                >
                  <span className="item-emoji">{item.emoji}</span>
                  <div className="item-name">{item.name}</div>
                  {count > 0 && <div className="item-count">×{count}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
