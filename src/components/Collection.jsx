import React from 'react'
import { useAppState } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'

export default function Collection() {
  const { eggStatsData } = useAppState()
  const stage = eggStatsData?.stage ?? 1

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--px-darkest, #0a0a12)', paddingBottom: 80,
    }}>
      {/* Page header */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 10,
        color: '#EF9F27', letterSpacing: 3,
        padding: '14px 20px 10px',
        borderBottom: '2px solid rgba(255,255,255,0.08)',
        width: '100%', boxSizing: 'border-box',
      }}>
        COLLECTION
      </div>

      {/* Coming-soon card */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, padding: '32px 24px',
        gap: 20,
      }}>
        <EggCanvas
          stage={stage}
          aura={0}
          width={160} height={190}
          style={{ display: 'block' }}
        />

        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 14,
          color: '#EF9F27', letterSpacing: 2, textAlign: 'center',
        }}>
          เร็วๆ นี้!
        </div>

        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 13,
          color: 'rgba(255,255,255,0.45)', textAlign: 'center',
          lineHeight: 1.7,
        }}>
          ร้านค้า • ไอเทมแต่งตัว • แต่งบ้าน
          <br />
          กำลังจะมา
        </div>

        <div style={{
          marginTop: 8,
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 20px',
          fontFamily: 'var(--font-pixel)', fontSize: 7,
          color: 'rgba(255,255,255,0.2)', textAlign: 'center',
          letterSpacing: 1,
        }}>
          COMING SOON
        </div>
      </div>
    </div>
  )
}
