import React, { useRef } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'

export default function PartySelect({ onSelect, onFlee }) {
  const { state, eggStatsData } = useAppState()

  // Render-loop safety net: bail out visibly instead of freezing the app.
  const renderCount = useRef(0)
  renderCount.current++
  if (renderCount.current > 50) {
    console.error('PartySelect render loop detected, count:', renderCount.current)
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: '#0a0a12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={onFlee}
          style={{
            color: 'white', fontSize: 16, background: 'transparent',
            border: '1px solid #555', padding: '12px 24px', cursor: 'pointer',
          }}
        >
          กลับแมพ (เกิดข้อผิดพลาด)
        </button>
      </div>
    )
  }

  // Pure derivation from state — no side effects, no dispatch, no useMemo needed.
  const partyCreatures = (state.party ?? [])
    .map(id => (state.hatchedEggs ?? []).find(e => e.id === id))
    .filter(Boolean)

  // Fallback: if party is empty but eggs exist, show most recently hatched one
  const displayCreatures = partyCreatures.length > 0
    ? partyCreatures
    : [...(state.hatchedEggs ?? [])]
        .sort((a, b) => (b.hatched_at ?? 0) - (a.hatched_at ?? 0))
        .slice(0, 1)

  const allFainted = displayCreatures.length > 0 &&
    displayCreatures.every(c => (c.currentHP ?? 1) <= 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'var(--px-darkest, #0a0a12)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: '24px 16px',
      overflowY: 'auto',
    }}>
      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 11,
        color: 'var(--px-yellow, #f0d020)', letterSpacing: 2,
      }}>
        เลือก CREATURE
      </div>

      {/* Enemy preview */}
      {state.pendingBattle?.enemy && (
        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 14,
          color: 'var(--px-light, #9090c0)',
        }}>
          vs {state.pendingBattle.enemy.nameTH ?? state.pendingBattle.enemy.type ?? '???'}
        </div>
      )}

      {/* Creature buttons */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        width: '100%', maxWidth: 320,
      }}>
        {displayCreatures.map(c => {
          const lvBonus = Math.max(0, (c.battleLevel ?? 1) - 1)
          const maxHP = (c.stats?.HP ?? 10) + lvBonus
          const hp = Math.min(c.currentHP ?? maxHP, maxHP)
          const fainted = hp <= 0
          return (
            <button
              key={c.id}
              onClick={() => !fainted && onSelect(c.id)}
              disabled={fainted}
              style={{
                background: fainted ? '#111' : 'var(--px-dark, #2a2a4a)',
                border: `2px solid ${fainted ? '#333' : 'var(--px-border, #5a5a9a)'}`,
                borderRadius: 0, padding: '12px 16px', minWidth: 140,
                opacity: fainted ? 0.4 : 1,
                cursor: fainted ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                boxShadow: fainted ? 'none' : '3px 3px 0 #000',
              }}
            >
              <EggCanvas
                stage={eggStatsData?.stage ?? 1}
                aura={0}
                width={56} height={66}
                style={{ display:'block' }}
              />

              <div style={{
                fontFamily: 'var(--font-thai)', fontSize: 12,
                color: fainted ? '#555' : 'var(--px-white, #f0f0f0)',
                textAlign: 'center',
              }}>
                {state.name}
              </div>

              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: 8,
                color: 'var(--px-light, #9090c0)',
              }}>
                Lv.{c.battleLevel ?? 1}
              </div>

              <div style={{ width: '100%', background: '#000', border: '1px solid #333', height: 6 }}>
                <div style={{
                  width: `${Math.max(0, (hp / maxHP) * 100)}%`,
                  height: '100%',
                  background: hp / maxHP > 0.5 ? '#4acd4a'
                    : hp / maxHP > 0.2 ? '#cdcd20' : '#cd2020',
                }} />
              </div>

              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: 7,
                color: 'var(--px-light, #9090c0)',
              }}>
                {fainted ? 'หลับ...' : `${hp}/${maxHP}`}
              </div>
            </button>
          )
        })}
      </div>

      {/* No eggs at all */}
      {displayCreatures.length === 0 && (
        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 12,
          color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 280,
          marginBottom: 8,
        }}>
          ยังไม่มี creature ในทีม<br/>
          <span style={{ fontSize: 10 }}>ฟักไข่ก่อนออกสำรวจ!</span>
        </div>
      )}

      {/* Escape button — shown when all fainted OR party is empty */}
      {(allFainted || displayCreatures.length === 0) && (
        <button
          onClick={onFlee}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.5)',
            borderRadius: 0, padding: '8px 28px',
            fontFamily: 'var(--font-thai)', fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {allFainted ? 'CREATURE ทุกตัวกำลังหลับ... กลับแมพ' : 'กลับแมพ'}
        </button>
      )}
    </div>
  )
}
