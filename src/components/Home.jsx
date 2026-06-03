import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { supabase } from '../lib/supabase.js'
import { MG_UNLOCK, MG_COLORS, todayStr } from '../config/gameConfig.js'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { showToast } from './Toasts.jsx'

function XpBoostBadge({ xpBoostEnd, xpBoost }) {
  const [ms, setMs] = useState(() => Math.max(0, (xpBoostEnd || 0) - Date.now()))
  const idRef = useRef(null)

  useEffect(() => {
    clearInterval(idRef.current)
    const left = Math.max(0, (xpBoostEnd || 0) - Date.now())
    setMs(left)
    if (left > 0) {
      idRef.current = setInterval(() => {
        const remaining = Math.max(0, (xpBoostEnd || 0) - Date.now())
        setMs(remaining)
        if (remaining <= 0) clearInterval(idRef.current)
      }, 1000)
    }
    return () => clearInterval(idRef.current)
  }, [xpBoostEnd])

  if (ms <= 0 || (xpBoost || 1) <= 1) return null
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return (
    <div style={{ background:'var(--amber)', color:'var(--amber-d)', borderRadius:8, padding:'3px 8px', fontSize:11, fontFamily:'Mitr,sans-serif', fontWeight:700, display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
      ⭐ ×2 {m}:{String(s).padStart(2,'0')}
    </div>
  )
}

export default function Home({ navigate, soundOn, toggleSound, onOpenEggPopup, onOpenLogin, onOpenProfile }) {
  const { state, dispatch, totalXP, eggProgressData, eggStatsData } = useAppState()
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user)).catch(() => {})
    const { data } = supabase.auth.onAuthStateChange((_, session) => setAuthUser(session?.user || null))
    return () => data?.subscription?.unsubscribe()
  }, [])

  const { stage, stageXP, pct } = eggProgressData
  const eggsHatched = (state.hatchedEggs || []).length

  const startWorld = (world) => {
    dispatch({ type: ACTIONS.SET_CURRENT_WORLD, payload: world })
    dispatch({ type: ACTIONS.SET_SESSION_XP, payload: 0 })
    navigate('game')
  }

  const onEggRunClick = () => {
    const dr = state.dailyRounds || 0
    if (dr < 10) { showToast(`📚 เรียนอีก ${10 - dr} ด่านเพื่อ Unlock Egg Run!`); return }
    if ((state.eggRunLives ?? 3) <= 0) { showToast('🌙 หมดชีวิตแล้ว มาเรียนพรุ่งนี้นะ!'); return }
    startWorld('eggrun')
  }

  const onMgClick = (id) => {
    startWorld(id)
  }

  const dr = state.dailyRounds || 0
  const lives = state.eggRunLives ?? 3
  const erUnlocked = dr >= 10
  const erHasLives = lives > 0

  const spoilHint = ['🔮 เรียนเพื่อปลุกลวดลาย!','✨ ไข่เริ่มอบอุ่น...','👁️ มีบางอย่างขยับ...','🐾 เห็นเงาข้างใน...','👀 มีดวงตามองออกมา!','💥 ไข่สั่นแล้ว!!!','🎉 กำลังจะฟัก!!!'][stage] || ''

  return (
    <div id="home" style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', minHeight:'100%', overflowY:'auto', overflowX:'hidden', background:'var(--bg)', paddingBottom:80 }}>
      {/* Header */}
      <div className="home-header">
        <div className="home-logo">KidQuest</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="home-xp">⚡ <span>{totalXP}</span> XP</div>
          <XpBoostBadge xpBoostEnd={state.xpBoostEnd} xpBoost={state.xpBoost} />
          <button onClick={onOpenProfile} style={{ fontSize:11, background:'var(--purple-l)', border:'none', borderRadius:8, padding:'4px 8px', color:'var(--purple-d)', cursor:'pointer', fontFamily:'Mitr,sans-serif', fontWeight:600, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            👤 {state.name}
          </button>
          {authUser ? (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div className="auth-avatar" title={authUser.email}>{(authUser.email || '?')[0].toUpperCase()}</div>
              <button onClick={async () => { await supabase?.auth.signOut() }} style={{ fontSize:11, background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontFamily:'Mitr,sans-serif' }}>Logout</button>
            </div>
          ) : (
            <button className="auth-login-btn" onClick={onOpenLogin}>Login</button>
          )}
        </div>
      </div>

      {/* Egg */}
      <div className="home-egg" onClick={state.readyToHatch && stage >= 6 ? null : onOpenEggPopup}>
        <div className="egg-stage-txt">ไข่ของ{state.name} — Stage {stage + 1}/{7}</div>
        <EggCanvas
          stats={eggStatsData}
          width={160} height={190}
          className={stage >= 5 ? 'egg-shaking' : ''}
          style={{ cursor:'pointer' }}
          onClick={state.readyToHatch ? () => { dispatch({ type: ACTIONS.SET_HATCHING, payload: true }) } : onOpenEggPopup}
        />
        <div className="egg-name-txt">{EGG_STAGE_NAMES[stage] || 'ไข่ลึกลับ'}</div>
        <div className="egg-xp-bar-wrap"><div className="egg-xp-bar" style={{ width: pct + '%' }} /></div>
        <div className="egg-xp-label">{stage >= 6 ? '🐣 พร้อมฟักแล้ว!' : `${stageXP} / 50 XP ถึง Stage ถัดไป`}</div>
        <div className={`spoil-txt${stage >= 3 ? ' lit' : ''}`}>
          {state.readyToHatch && stage >= 6
            ? <button onClick={() => dispatch({ type: ACTIONS.SET_HATCHING, payload: true })} style={{ background:'var(--amber)', color:'var(--amber-d)', border:'none', borderRadius:20, padding:'8px 20px', fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>🥚 แตะเพื่อฟักไข่!</button>
            : spoilHint}
        </div>
      </div>

      {/* World selector */}
      <div className="world-label">เลือกด่านที่อยากเล่น</div>
      <div className="world-grid">
        <div className="world-card" style={{ background:'#E1F5EE' }} onClick={() => startWorld('thai')}>
          <span className="world-icon">🇹🇭</span>
          <div className="world-name" style={{ color:'#085041' }}>ภาษาไทย</div>
          <div className="world-sub" style={{ color:'#0F6E56' }}>ก-ฮ</div>
          <div className="world-xp-mini" style={{ background:'#9FE1CB', color:'#085041' }}>{state.xpThai||0} XP</div>
        </div>
        <div className="world-card" style={{ background:'#EEEDFE' }} onClick={() => startWorld('math')}>
          <span className="world-icon">🔢</span>
          <div className="world-name" style={{ color:'#3C3489' }}>Math</div>
          <div className="world-sub" style={{ color:'#534AB7' }}>บวกเลข</div>
          <div className="world-xp-mini" style={{ background:'#CECBF6', color:'#3C3489' }}>{state.xpMath||0} XP</div>
        </div>
        <div className="world-card" style={{ background:'#E6F1FB' }} onClick={() => startWorld('eng')}>
          <span className="world-icon">🔤</span>
          <div className="world-name" style={{ color:'#0C447C' }}>English</div>
          <div className="world-sub" style={{ color:'#185FA5' }}>Phonics</div>
          <div className="world-xp-mini" style={{ background:'#B5D4F4', color:'#0C447C' }}>{state.xpEng||0} XP</div>
        </div>
      </div>

      {/* Egg Run */}
      <div style={{ width:'100%', maxWidth:480, padding:'10px 20px 0' }}>
        <div
          id="er-banner"
          className={`eggrun-banner${!erUnlocked ? ' locked' : erHasLives ? ' ready' : ' locked'}`}
          onClick={onEggRunClick}
          style={{ cursor: !erUnlocked || !erHasLives ? 'default' : 'pointer' }}
        >
          <EggCanvas stats={eggStatsData} width={44} height={52} style={{ borderRadius:8, flexShrink:0, opacity: erUnlocked && erHasLives ? 1 : 0.3 }} />
          <div style={{ flex:1, minWidth:0 }}>
            {!erUnlocked ? (
              <>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:15, color:'rgba(255,255,255,.45)', marginBottom:3 }}>🏃 Egg Run 🔒</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>เรียนอีก {10 - dr} ด่านเพื่อ Unlock</div>
                <div style={{ marginTop:6, height:4, background:'rgba(255,255,255,.12)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:4, background:'rgba(255,255,255,.4)', borderRadius:4, width:`${Math.round(dr/10*100)}%` }} />
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:3 }}>{dr}/10 ด่าน</div>
              </>
            ) : !erHasLives ? (
              <>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:15, color:'rgba(255,255,255,.5)', marginBottom:3 }}>🏃 Egg Run 🌙</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>มาเรียนพรุ่งนี้เพื่อเล่นอีกครั้ง!</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:4 }}>Best: {state.erBestDist||0}m · 💛{state.erBestRings||0}</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:16, color:'#FFD700', marginBottom:2 }}>🏃 Egg Run</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.9)' }}>Egg Run พร้อมแล้ว! 🥚⚡</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:4 }}>{'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0,3-lives))} · Best: {state.erBestDist||0}m</div>
              </>
            )}
          </div>
          {erUnlocked && erHasLives && <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', flexShrink:0 }}>แตะเพื่อเล่น →</div>}
        </div>
      </div>

      {/* Mini-games grid */}
      <div className="minigames-grid">
        {['catch','memory','tower','fishing'].map(id => {
          const unlocked = eggsHatched >= MG_UNLOCK[id]
          const far = eggsHatched < MG_UNLOCK[id] - 3
          const icons = { catch:'🧺', memory:'🃏', tower:'🏗️', fishing:'🎣' }
          const names = { catch:'Egg Catch', memory:'Egg Memory', tower:'Egg Tower', fishing:'Egg Fishing' }
          return (
            <div
              key={id}
              className={`mg-card${unlocked ? '' : far ? ' mystery-lock' : ' locked'}`}
              style={unlocked ? { background: MG_COLORS[id], borderColor:'transparent', cursor:'pointer' } : {}}
              onClick={() => unlocked && onMgClick(id)}
            >
              <span className="mg-icon">{icons[id]}</span>
              <div className="mg-name" style={unlocked ? { color:'#fff' } : {}}>{far ? '???' : names[id]}</div>
              <div className="mg-sub" style={unlocked ? { color:'rgba(255,255,255,.7)' } : {}}>
                {far ? '???' : unlocked ? 'พร้อมเล่น! →' : `ฟักอีก ${MG_UNLOCK[id] - eggsHatched} ใบ 🔒`}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-mini"><div className="stat-mini-val">{state.streak||0}{(state.streak||0)>=3?'🔥':''}</div><div className="stat-mini-lbl">Streak</div></div>
        <div className="stat-mini"><div className="stat-mini-val">{state.rounds||0}</div><div className="stat-mini-lbl">ด่านผ่าน</div></div>
        <div className="stat-mini"><div className="stat-mini-val">{state.badges||0}⭐</div><div className="stat-mini-lbl">Badge</div></div>
      </div>
    </div>
  )
}
