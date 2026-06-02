import React from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { LEVELS } from '../config/gameConfig.js'

export default function LevelSelector({ world, onSelect }) {
  const { state, dispatch } = useAppState()
  const unlocked = (state.subjectLevels || {})[world] || 1
  const mastery = (state.levelMastery || {})[world] || {}

  const titles = { thai:'🇹🇭 ภาษาไทย', math:'🔢 Math', eng:'🔤 English' }

  return (
    <div style={{ width:'100%', maxWidth:480, padding:'16px 20px 20px' }}>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'var(--text)', marginBottom:4 }}>{titles[world]}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16 }}>เลือก Level ที่อยากเล่น</div>
      <div className="level-grid">
        {LEVELS[world].map(lv => {
          const isUnlocked = lv.id <= unlocked
          const isMystery = lv.id > unlocked + 2
          const pct = Math.round((mastery[lv.id] || 0) * 100)
          const isNew = lv.id === unlocked && !(state.seenTeach || []).includes(`${world}-${lv.id}-card`)
          return (
            <div
              key={lv.id}
              className={`level-card${isMystery ? ' mystery' : !isUnlocked ? ' locked' : ''}`}
              onClick={() => {
                if (!isUnlocked) return
                if (isNew) dispatch({ type: ACTIONS.SEEN_TEACH, payload: { key:`${world}-${lv.id}-card` } })
                onSelect(lv)
              }}
            >
              {isNew && <div className="level-new-badge">ใหม่! ✨</div>}
              {!isUnlocked && !isMystery && <div className="level-lock-icon">🔒</div>}
              {isMystery ? (
                <>
                  <div style={{ fontSize:22, marginBottom:3 }}>🔒</div>
                  <div className="level-name" style={{ color:'#1a1a1a' }}>???</div>
                  <div className="level-hint" style={{ color:'#1a1a1a' }}>ยังล็อกอยู่</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:22, marginBottom:3 }}>{lv.emoji}</div>
                  <div className="level-name">Level {lv.id}</div>
                  <div className="level-subname">{lv.name}</div>
                  <div className="level-hint">{lv.hint}</div>
                  <div className="level-meta">
                    <span style={{ fontSize:10 }}>{'⭐'.repeat(lv.stars)}</span>
                    <span style={{ fontSize:10, background:'var(--amber-l)', color:'var(--amber-d)', padding:'1px 6px', borderRadius:8 }}>+{Math.round(10*lv.diff)} XP ⚡</span>
                  </div>
                  {isUnlocked && pct > 0 && (
                    <div className="level-mastery-wrap"><div className="level-mastery-fill" style={{ width:`${pct}%` }} /></div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
