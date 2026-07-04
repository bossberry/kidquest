import React from 'react'

export default function GBHPBar({ pct, isPlayer, current, max }) {
  const color = isPlayer
    ? (pct > 50 ? 'var(--px-green)' : pct > 25 ? 'var(--px-yellow)' : 'var(--px-red)')
    : (pct > 50 ? 'var(--px-red)' : pct > 25 ? 'var(--px-orange)' : '#f66')
  const critical = pct < 20
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', flexShrink:0, fontFamily:'monospace' }}>HP</span>
      <div className="px-hp-bar-outer" style={{ flex:1 }}>
        <div
          className={`px-hp-bar-inner${critical ? ' px-hp-crit' : ''}`}
          style={{ width:`${Math.max(0, pct)}%`, background:color, color }}
        >
          <div className="px-hp-bar-shine" />
        </div>
      </div>
      {max != null && (
        <span style={{ fontSize:8, color:'rgba(255,255,255,0.5)', flexShrink:0, fontFamily:'monospace', minWidth:32, textAlign:'right' }}>
          {Math.max(0, Math.round(current ?? 0))}/{Math.round(max)}
        </span>
      )}
    </div>
  )
}
