import React from 'react'
import { HUD_CONTENT_H } from './WorldHUD.jsx'

const SCREEN_NAMES = {
  NW: 'ป่าเหนือ', NE: 'ป่าตะวันออก',
  SW: 'ทะเลทราย', SE: 'ภูเขาไฟ',
  MAZE: 'เขาวงกต', BOSS: 'ปราสาทบอส',
}
const SCREEN_ENEMIES = {
  NW: ['กระต่ายหลับ', 'สไลม์', 'จิ้งจอก'],
  NE: ['Egg Pawn', 'นางไม้ใบ', 'ตุ่นบึ้ก'],
  SW: ['เห็ดนิสัยซน', 'เบบี้ซอมบี้', 'งูยักษ์'],
  SE: ['Buzzbomber', 'Motobug', 'Crabmeat'],
  MAZE: ['ของลึกลับ', 'หีบสมบัติ'],
  BOSS: ['Dr. Eggman'],
}

export default function MissionPanel({ screenId, state, worldLevel }) {
  const clearedMaps        = state.clearedMaps ?? []
  const isCleared          = clearedMaps.includes(screenId)
  const dailyBattleRounds  = state.dailyBattleRounds ?? 0

  const objectives = {
    NW:   { text: 'กำจัดศัตรู + เก็บหีบสมบัติ', icon: '🌲' },
    NE:   { text: 'เอาชนะ Egg Pawn ให้ได้',       icon: '🌿' },
    SW:   { text: 'สำรวจทะเลทรายให้ครบ',          icon: '🏜️' },
    SE:   { text: 'ระวังภูเขาไฟ!',                icon: '🌋' },
    MAZE: { text: 'หาทางออกให้ได้ก่อนหมดเวลา',   icon: '🌀' },
    BOSS: { text: 'เอาชนะ Dr. Eggman!',           icon: '⚠️' },
  }
  const obj      = objectives[screenId] ?? { text: 'สำรวจแมพนี้', icon: '🗺️' }
  const mapName  = SCREEN_NAMES[screenId] ?? screenId
  const enemies  = SCREEN_ENEMIES[screenId] ?? []

  return (
    <div style={{
      position: 'absolute',
      top: HUD_CONTENT_H + 8,
      left: 12, right: 12,
      zIndex: 25,
      pointerEvents: 'none',
    }}>
      <div style={{
        // Fix 5 (2026-07-02, Pandora-style visual polish): lighter + blurred
        // so it floats over the map instead of reading as a solid dark box.
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {/* Map name + daily battles */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: 9,
            color: isCleared ? '#44ee44' : '#FFD700',
            letterSpacing: 1,
          }}>
            {obj.icon} {mapName.toUpperCase()}{isCleared && ' ✓'}
          </div>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: 8,
            color: 'rgba(255,255,255,0.35)',
          }}>
            วันนี้ {dailyBattleRounds} battle
          </div>
        </div>

        {/* Objective */}
        <div style={{
          fontFamily: 'var(--font-thai)', fontSize: 11,
          color: isCleared ? 'rgba(100,220,100,0.7)' : 'rgba(255,255,255,0.6)',
          lineHeight: 1.3,
        }}>
          {isCleared ? '✅ เคลียร์แล้ว!' : `🎯 ${obj.text}`}
        </div>

        {/* Enemy types */}
        {!isCleared && enemies.length > 0 && (
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: 7,
            color: 'rgba(255,100,100,0.5)',
            letterSpacing: 0.5,
          }}>
            ศัตรู: {enemies.join(' · ')}
          </div>
        )}

        {/* Daily progress bar */}
        {!isCleared && (
          <div style={{ marginTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>
                PROGRESS
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>
                {Math.min(100, Math.round((dailyBattleRounds / 10) * 100))}%
              </div>
            </div>
            <div style={{ height: 4, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (dailyBattleRounds / 10) * 100)}%`,
                background: dailyBattleRounds >= 10 ? '#44ee44' : '#FFD700',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
