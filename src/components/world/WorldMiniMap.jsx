// SPEC GAME-B §B.3 (2026-07-11) — dedicated tap-to-toggle minimap. Distinct
// from the small 52px screen-status strip already living inside WorldHUD.jsx
// (which reads the session-only `discoveredScreens` reset every world-level
// change): this one reads the NEW persistent `exploredScreens` bitmask
// (state.exploredScreens[worldLevel]) so fog memory survives across visits/
// sessions, and adds exits + a boss icon per the spec. Both minimaps stay —
// documented as a judgment call in CHATBOT_NOTES rather than touching the
// already-tightly-integrated HUD bar widget.
import React, { useEffect, useRef, useState } from 'react'
import { DYNAMIC_SCREENS } from '../../config/worldConfig.js'
import { playTone } from '../../lib/audio.js'

const SIZE = 96
const SLOTS = [['NW', 'NE'], ['SW', 'SE']]

export default function WorldMiniMap({ worldLevel, screenId, exploredScreens, clearedMaps, bossMapActive, mazeActive, top }) {
  const [visible, setVisible] = useState(true)
  const canvasRef = useRef(null)
  const explored = exploredScreens?.[String(worldLevel)] ?? {}

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !visible) return
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = 'rgba(5,10,5,0.55)'
    ctx.fillRect(0, 0, SIZE, SIZE)

    const cell = 36, gap = 3, ox = 4, oy = 4
    for (let ri = 0; ri < 2; ri++) {
      for (let ci = 0; ci < 2; ci++) {
        const id = mazeActive && SLOTS[ri][ci] === 'SW' ? 'MAZE' : SLOTS[ri][ci]
        const realId = SLOTS[ri][ci]
        const isDisc = !!explored[realId] || id === 'MAZE'
        const x = ox + ci * (cell + gap), y = oy + ri * (cell + gap)
        ctx.fillStyle = !isDisc ? '#0a120a' : id === 'MAZE' ? '#180830' : (clearedMaps ?? []).includes(realId) ? '#245524' : '#2a4a2a'
        ctx.fillRect(x, y, cell, cell)
        ctx.strokeStyle = screenId === id ? '#e0e040' : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = screenId === id ? 2 : 1
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)

        if (screenId === id) {
          // Player dot + exit ticks toward connected screens (screen-level
          // addressing model — see docs/CHATBOT_NOTES for why per-tile fog
          // isn't the right grain here).
          ctx.fillStyle = '#ffe060'
          ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, 4, 0, Math.PI * 2); ctx.fill()
          const connects = DYNAMIC_SCREENS[realId]?.connects ?? {}
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          if (connects.N) ctx.fillRect(x + cell / 2 - 3, y - 1, 6, 2)
          if (connects.S) ctx.fillRect(x + cell / 2 - 3, y + cell - 1, 6, 2)
          if (connects.W) ctx.fillRect(x - 1, y + cell / 2 - 3, 2, 6)
          if (connects.E) ctx.fillRect(x + cell - 1, y + cell / 2 - 3, 2, 6)
        } else if (isDisc && (clearedMaps ?? []).includes(realId)) {
          ctx.fillStyle = '#90ff90'
          ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText('✓', x + cell / 2, y + cell / 2)
        }
      }
    }

    // Boss strip
    const by = oy + 2 * (cell + gap)
    const bw = cell * 2 + gap
    const bossDisc = !!explored.BOSS
    ctx.fillStyle = !bossDisc ? '#0a120a' : bossMapActive ? '#3a1010' : '#181818'
    ctx.fillRect(ox, by, bw, 16)
    ctx.strokeStyle = screenId === 'BOSS' ? '#ff5050' : bossMapActive ? '#aa2020' : 'rgba(255,255,255,0.12)'
    ctx.strokeRect(ox + 0.5, by + 0.5, bw - 1, 15)
    if (bossMapActive) {
      ctx.fillStyle = '#ff8080'
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(screenId === 'BOSS' ? '★ BOSS' : '! BOSS', ox + bw / 2, by + 8)
    }
  }, [visible, worldLevel, screenId, explored, clearedMaps, bossMapActive, mazeActive])

  const toggle = () => { playTone('click'); setVisible(v => !v) }

  if (!visible) {
    return (
      <button onClick={toggle} aria-label="เปิดแผนที่" style={{
        position: 'absolute', top, right: 8, zIndex: 27,
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(5,10,5,0.55)', border: '1px solid rgba(255,255,255,0.2)',
        fontSize: 16, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
      }}>🗺️</button>
    )
  }

  return (
    <button onClick={toggle} aria-label="ซ่อนแผนที่" style={{
      position: 'absolute', top, right: 8, zIndex: 27,
      width: SIZE, padding: 0, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
      background: 'transparent', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
      lineHeight: 0,
    }}>
      <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ display: 'block', borderRadius: 7 }} />
    </button>
  )
}
