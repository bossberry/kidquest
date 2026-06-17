import React, { useState, useEffect, useRef } from 'react'

const ITEM_NAMES = {
  scroll: 'ม้วนใบ', thunder: 'สายฟ้า', gem: 'อัญมณี', mirror: 'กระจก', clover: 'โคลเวอร์',
  food: 'น่องไก่', ribbon: 'ริบบิ้น', shoes: 'รองเท้า', rainbow_star: 'ดาวสีรุ้ง',
}
const ITEM_COLORS = {
  scroll: '#e8c040', thunder: '#66aaff', gem: '#cc44cc', mirror: '#44cccc', clover: '#44cc44',
  food: '#8B4513', ribbon: '#FF1493', shoes: '#EF9F27', rainbow_star: '#FF88FF',
}
const SPARKLE_POSITIONS = [12, 28, 46, 64, 80]  // fixed % positions to avoid per-render random

export default function RewardChest({ rewards, onDone }) {
  const [phase, setPhase] = useState('closed')
  const t1Ref = useRef(null)
  const t2Ref = useRef(null)

  useEffect(() => {
    t1Ref.current = setTimeout(() => setPhase('shaking'), 400)
    return () => { clearTimeout(t1Ref.current); clearTimeout(t2Ref.current) }
  }, [])

  const handleTap = () => {
    if (phase === 'reveal') { onDone?.(); return }
    if (phase === 'shaking' || phase === 'closed') {
      setPhase('opening')
      t2Ref.current = setTimeout(() => setPhase('reveal'), 600)
    }
  }

  const lidStyle = {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 44,
    background: '#8B6914',
    border: '3px solid #DAA520',
    borderBottom: phase === 'reveal' ? 'none' : '3px solid #DAA520',
    transformOrigin: 'top center',
    transform: phase === 'reveal' ? 'rotateX(-120deg)' : 'rotateX(0deg)',
    transition: phase === 'opening' ? 'transform 0.5s ease' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '4px 4px 0 0',
    perspective: 400,
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.87)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 12,
        color: '#FFD700', letterSpacing: 3,
        marginBottom: 32,
        opacity: phase !== 'closed' ? 1 : 0,
        transition: 'opacity 0.3s',
      }}>
        REWARD!
      </div>

      {/* Chest */}
      <div style={{
        position: 'relative',
        width: 120, height: 100,
        animation: phase === 'shaking' ? 'chest-shake 0.15s ease infinite' : 'none',
      }}>
        {/* Lid */}
        <div style={lidStyle}>
          <div style={{
            width: 20, height: 20,
            background: '#FFD700',
            border: '2px solid #B8860B',
            borderRadius: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#412402',
          }}>★</div>
        </div>

        {/* Body */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 60,
          background: '#6B4F10',
          border: '3px solid #DAA520',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: '80%', height: 2, background: '#DAA520', opacity: 0.3 }} />
        </div>

        {/* Sparkles when opening */}
        {(phase === 'opening' || phase === 'reveal') && (
          <div style={{ position: 'absolute', inset: -30, pointerEvents: 'none' }}>
            {['⭐', '✨', '💫', '⭐', '✨'].map((s, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${SPARKLE_POSITIONS[i]}%`,
                top: `${10 + i * 12}%`,
                fontSize: 16,
                animation: `sparkle-rise 0.8s ease ${i * 0.1}s both`,
              }}>{s}</div>
            ))}
          </div>
        )}
      </div>

      {/* Revealed items */}
      {phase === 'reveal' && (
        <div style={{
          marginTop: 32,
          display: 'flex', gap: 16, justifyContent: 'center',
          animation: 'fadeInUp 0.4s ease both',
        }}>
          {rewards.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-thai)', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              ไม่มีของรางวัลครั้งนี้...
            </div>
          ) : rewards.map((r, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              animation: `scale-pop 0.4s ease ${i * 0.15}s both`,
            }}>
              <canvas
                ref={ref => {
                  if (ref) import('../lib/itemArt.js').then(({ drawItem }) => drawItem(ref, r.key))
                }}
                width={56} height={56}
                style={{ imageRendering: 'pixelated' }}
              />
              <div style={{
                fontFamily: 'var(--font-thai)', fontSize: 13,
                color: ITEM_COLORS[r.key] ?? '#fff',
                textShadow: `0 0 8px ${ITEM_COLORS[r.key] ?? '#fff'}`,
              }}>
                {ITEM_NAMES[r.key] ?? r.key}
              </div>
              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: 8,
                color: 'rgba(255,255,255,0.4)',
              }}>
                {r.type === 'battle' ? 'ไอเทมสู้' : 'ไอเทมบ้าน'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tap hint */}
      <div style={{
        marginTop: 24,
        fontFamily: 'var(--font-thai)', fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        animation: 'blink 1.2s ease infinite',
      }}>
        {phase === 'reveal' ? 'แตะเพื่อดำเนินการต่อ' : 'แตะเพื่อเปิด!'}
      </div>
    </div>
  )
}
