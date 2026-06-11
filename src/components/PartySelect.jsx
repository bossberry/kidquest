import React, { useMemo } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import CreatureCanvas from './CreatureCanvas.jsx'
import { buildLegacyPreviewDNA } from '../lib/creatureGenerator.js'

export default function PartySelect({ onSelect, onFlee }) {
  const { state } = useAppState()

  const partyCreatures = useMemo(() => {
    return (state.party || [])
      .map(id => (state.hatchedEggs || []).find(e => e.id === id))
      .filter(Boolean)
  }, [state.party, state.hatchedEggs])

  const allFainted = partyCreatures.length > 0 &&
    partyCreatures.every(c => (c.currentHP ?? 0) <= 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'var(--px-darkest, #0a0a12)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '24px 16px', gap: 14,
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
          fontSize: 10, fontFamily: 'var(--font-pixel)',
          color: 'var(--px-light, #9090c0)',
        }}>
          vs {state.pendingBattle.enemy.nameTH ?? state.pendingBattle.enemy.type}
        </div>
      )}

      {/* Party grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10, width: '100%', maxWidth: 320,
      }}>
        {partyCreatures.map(creature => {
          const maxHP = creature.stats?.HP ?? 10
          const currentHP = creature.currentHP ?? maxHP
          const fainted = currentHP <= 0
          const dna = creature.dna ?? (() => {
            try { return buildLegacyPreviewDNA(creature, 0) } catch { return null }
          })()

          return (
            <button
              key={creature.id}
              onClick={() => !fainted && onSelect(creature.id)}
              disabled={fainted}
              style={{
                background: fainted ? '#111' : 'var(--px-dark, #2a2a4a)',
                border: `2px solid ${fainted ? '#333' : 'var(--px-border, #5a5a9a)'}`,
                borderRadius: 0,
                padding: 10,
                opacity: fainted ? 0.4 : 1,
                cursor: fainted ? 'not-allowed' : 'pointer',
                boxShadow: fainted ? 'none' : '3px 3px 0 #000',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              }}
            >
              {dna ? (
                <CreatureCanvas
                  dna={dna}
                  size={60}
                  personality={dna.personality}
                  animationEnabled={!fainted}
                  idleMode={fainted ? 'sleep' : 'idle'}
                />
              ) : (
                <div style={{ fontSize: 40, lineHeight: 1 }}>🥚</div>
              )}

              {/* Creature name */}
              <div style={{
                fontFamily: 'var(--font-thai)', fontSize: 12,
                color: fainted ? '#555' : 'var(--px-white, #f0f0f0)',
                textAlign: 'center',
              }}>
                {creature.creature?.n || 'สัตว์ลึกลับ'}
              </div>

              {/* Battle level */}
              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: 8,
                color: 'var(--px-light, #9090c0)',
              }}>
                Lv.{creature.battleLevel ?? 1}
              </div>

              {/* HP bar */}
              <div style={{ width: '100%', background: '#000', border: '1px solid #333', height: 6 }}>
                <div style={{
                  width: `${Math.max(0, (currentHP / maxHP) * 100)}%`,
                  height: '100%',
                  background: currentHP / maxHP > 0.5 ? '#4acd4a'
                    : currentHP / maxHP > 0.2 ? '#cdcd20' : '#cd2020',
                  transition: 'width 300ms steps(10)',
                }} />
              </div>

              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: 7,
                color: 'var(--px-light, #9090c0)',
              }}>
                {fainted ? 'หลับ...' : `${currentHP}/${maxHP}`}
              </div>
            </button>
          )
        })}

        {/* Empty party slots */}
        {Array.from({ length: Math.max(0, (state.partySlots || 1) - partyCreatures.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{
            border: '2px dashed #333', borderRadius: 0,
            height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 8, color: '#333' }}>
              EMPTY
            </span>
          </div>
        ))}
      </div>

      {/* No party at all */}
      {partyCreatures.length === 0 && (
        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 12,
          color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 280,
        }}>
          ยังไม่มี creature ในทีม<br/>
          <span style={{ fontSize: 10 }}>ฟักไข่ก่อนออกสำรวจ!</span>
        </div>
      )}

      {/* All fainted */}
      {allFainted && (
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 9,
          color: '#cc2020', textAlign: 'center',
        }}>
          CREATURE ทุกตัวกำลังหลับ...<br/>ใช้ potion หรือรอสักครู่
        </div>
      )}

      {/* Flee */}
      <button
        onClick={onFlee}
        style={{
          marginTop: 8,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.4)',
          borderRadius: 0, padding: '8px 28px',
          fontFamily: 'var(--font-thai)', fontSize: 12,
          cursor: 'pointer',
        }}
      >
        หนี
      </button>
    </div>
  )
}
