import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { supabase } from '../lib/supabase.js'
import { MG_UNLOCK, MG_COLORS, todayStr } from '../config/gameConfig.js'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { showToast } from './Toasts.jsx'
import { playTone } from '../lib/audio.js'

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

function getRecommendation(state, stage) {
  if (state.readyToHatch && stage >= 6) {
    return {
      type: 'hatch', icon: '🥚',
      label: 'ฟักไข่!', sub: 'ไข่พร้อมฟักแล้ว ✨',
      bg: '#FFF8E1', border: '#FFD700', textColor: '#5A3A00', subColor: '#8A5500',
    }
  }
  if (state.pendingChallenger) {
    const ch = state.pendingChallenger
    return {
      type: 'battle', icon: ch.emoji || '⚔️',
      label: 'มอนสเตอร์ปรากฏตัว!', sub: `${ch.name} กำลังท้าทายคุณ — รับคำท้า!`,
      bg: 'linear-gradient(135deg,#1a0a3a,#3c1a6e)',
      border: '#7F77DD', textColor: '#fff', subColor: 'rgba(255,255,255,.75)',
    }
  }
  if ((state.shopV1?.runs || 0) === 0) {
    return {
      type: 'shop', icon: '🏪',
      label: 'ร้านค้า', sub: '🆕 ลองภารกิจใหม่ — 2–3 นาที',
      bg: '#FFF5E6', border: '#F0B86E', textColor: '#4A2A00', subColor: '#7A5500',
    }
  }
  const levels = state.subjectLevels || {}
  const subs = [
    { world:'thai', xp:state.xpThai||0, label:'ภาษาไทย', icon:'🇹🇭', lv:levels.thai||1, bg:'#E1F5EE', border:'#9FE1CB', textColor:'#085041', subColor:'#0F6E56' },
    { world:'math', xp:state.xpMath||0, label:'Math',     icon:'🔢', lv:levels.math||1, bg:'#EEEDFE', border:'#CECBF6', textColor:'#3C3489', subColor:'#534AB7' },
    { world:'eng',  xp:state.xpEng ||0, label:'English',  icon:'🔤', lv:levels.eng ||1, bg:'#E6F1FB', border:'#B5D4F4', textColor:'#0C447C', subColor:'#185FA5' },
  ]
  const weak = subs.reduce((a, b) => a.xp <= b.xp ? a : b)
  return {
    type: 'learn', world: weak.world, icon: weak.icon,
    label: weak.label, sub: `Lv ${weak.lv} — เรียนต่อ!`,
    bg: weak.bg, border: weak.border, textColor: weak.textColor, subColor: weak.subColor,
  }
}

function getSurpriseEvent(state, eggsHatched) {
  const all = ['catch', 'memory', 'tower', 'fishing']
  const unlocked = all.filter(id => eggsHatched >= MG_UNLOCK[id])
  if (!unlocked.length) return null
  const n = parseInt(todayStr().replace(/-/g, ''))
  const id = unlocked[n % unlocked.length]
  const today = new Date().toDateString()
  const played = (state.sessionLog || []).some(s => s.world === id && new Date(s.ts).toDateString() === today)
  return { id, played }
}

const MG_ICONS = { catch:'🧺', memory:'🃏', tower:'🏗️', fishing:'🎣' }
const MG_NAMES = { catch:'Egg Catch', memory:'Egg Memory', tower:'Egg Tower', fishing:'Egg Fishing' }

export default function Home({ navigate, soundOn, toggleSound, onOpenEggPopup, onOpenLogin, onOpenProfile, onOpenChallenger }) {
  const { state, dispatch, totalXP, eggProgressData, eggStatsData } = useAppState()
  const [authUser, setAuthUser] = useState(null)
  const [subjectsOpen, setSubjectsOpen] = useState(false)
  const prevReadyRef = useRef(false)

  // Play a gentle chime the moment the egg becomes ready to hatch
  useEffect(() => {
    if (state.readyToHatch && !prevReadyRef.current) playTone('eggReady')
    prevReadyRef.current = state.readyToHatch
  }, [state.readyToHatch]) // eslint-disable-line

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user)).catch(() => {})
    const { data } = supabase.auth.onAuthStateChange((_, session) => setAuthUser(session?.user || null))
    return () => data?.subscription?.unsubscribe()
  }, [])

  const { stage, stageXP, pct, xpPerStage = 50 } = eggProgressData
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

  const dr = state.dailyRounds || 0
  const lives = state.eggRunLives ?? 3
  const erUnlocked = dr >= 10
  const erHasLives = lives > 0

  const spoilHint = ['🔮 เรียนเพื่อปลุกลวดลาย!','✨ ไข่เริ่มอบอุ่น...','👁️ มีบางอย่างขยับ...','🐾 เห็นเงาข้างใน...','👀 มีดวงตามองออกมา!','💥 ไข่สั่นแล้ว!!!','🎉 กำลังจะฟัก!!!'][stage] || ''

  const rec = getRecommendation(state, stage)
  const surprise = getSurpriseEvent(state, eggsHatched)

  const handleRecommendedAction = () => {
    playTone('tap')
    if (rec.type === 'hatch') {
      dispatch({ type: ACTIONS.SET_HATCHING, payload: true })
    } else if (rec.type === 'battle') {
      onOpenChallenger()
    } else if (rec.type === 'shop') {
      startWorld('shop')
    } else if (rec.type === 'learn') {
      startWorld(rec.world)
    }
  }

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
        <div className="egg-xp-label">
          {state.readyToHatch
            ? '🐣 พร้อมฟักแล้ว!'
            : stage >= 6
            ? `${stageXP} / ${xpPerStage} XP เกือบฟักแล้ว!`
            : `${stageXP} / ${xpPerStage} XP ถึง Stage ถัดไป`}
        </div>
        <div className={`spoil-txt${stage >= 3 ? ' lit' : ''}`}>
          {state.readyToHatch && stage >= 6
            ? <button onClick={() => dispatch({ type: ACTIONS.SET_HATCHING, payload: true })} style={{ background:'var(--amber)', color:'var(--amber-d)', border:'none', borderRadius:20, padding:'8px 20px', fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>🥚 แตะเพื่อฟักไข่!</button>
            : spoilHint}
        </div>
      </div>

      {/* ⭐ Continue Adventure — primary action */}
      <div style={{ width:'100%', maxWidth:480, padding:'16px 20px 0' }}>
        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'Mitr,sans-serif', marginBottom:8, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>⭐ ผจญภัยต่อ</div>
        <div
          onClick={handleRecommendedAction}
          className={rec.type === 'battle' ? 'rec-card-battle' : 'rec-card-float'}
          style={{
            display:'flex', alignItems:'center', gap:16,
            background: rec.bg,
            border: `2px solid ${rec.border}`,
            borderRadius:18, padding:'20px 22px',
            cursor:'pointer',
            boxShadow:'0 4px 24px rgba(0,0,0,.08)',
            transition:'transform .12s, box-shadow .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.13)' }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.08)' }}
        >
          <span style={{ fontSize:52, lineHeight:1 }}>{rec.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color: rec.textColor, lineHeight:1.1 }}>{rec.label}</div>
            <div style={{ fontSize:14, color: rec.subColor, marginTop:5 }}>{rec.sub}</div>
          </div>
          <div style={{ fontSize:26, color: rec.textColor, opacity:.45, flexShrink:0 }}>→</div>
        </div>
      </div>

      {/* Subject grid — collapsible secondary */}
      <div style={{ width:'100%', maxWidth:480, padding:'12px 20px 0' }}>
        <button
          onClick={() => { const next = !subjectsOpen; playTone(next ? 'open' : 'click'); setSubjectsOpen(next) }}
          style={{
            width:'100%', background:'none', border:'1.5px solid var(--border)',
            borderRadius:12, padding:'10px 18px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', fontFamily:'Mitr,sans-serif', fontSize:13,
            color:'var(--muted)', fontWeight:600, letterSpacing:'.03em',
          }}
        >
          <span>อยากเลือกเอง?</span>
          <span style={{ fontSize:9, display:'inline-block', transition:'transform .2s', transform: subjectsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
      </div>
      {subjectsOpen && (
        <div className="world-grid subjects-slide-in" style={{ marginTop:8 }}>
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
      )}

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

      {/* 🎁 Today's Surprise — single event rotation */}
      {surprise ? (
        <div style={{ width:'100%', maxWidth:480, padding:'10px 20px 0' }}>
          <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'Mitr,sans-serif', marginBottom:8, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>🎁 เซอร์ไพรส์วันนี้</div>
          {surprise.played ? (
            <div style={{ background:'#f9f9f9', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px 18px', textAlign:'center', color:'var(--muted)', fontSize:13, fontFamily:'Mitr,sans-serif' }}>
              เล่นแล้ว! มาพรุ่งนี้นะ 🌙
            </div>
          ) : (
            <div
              onClick={() => { playTone('tap'); startWorld(surprise.id) }}
              className="rec-card-surprise"
              style={{
                display:'flex', alignItems:'center', gap:14,
                background: MG_COLORS[surprise.id],
                borderRadius:14, padding:'16px 18px',
                cursor:'pointer',
                boxShadow:'0 2px 14px rgba(0,0,0,.12)',
                transition:'transform .12s, box-shadow .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 14px rgba(0,0,0,.12)' }}
            >
              <span style={{ fontSize:42, lineHeight:1 }}>{MG_ICONS[surprise.id]}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:19, color:'#fff' }}>{MG_NAMES[surprise.id]}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', marginTop:3 }}>แตะเพื่อเล่น!</div>
              </div>
              <div style={{ fontSize:22, color:'rgba(255,255,255,.65)', flexShrink:0 }}>→</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ width:'100%', maxWidth:480, padding:'10px 20px 0' }}>
          <div style={{ background:'linear-gradient(135deg,#1D1B3A,#3C3489)', borderRadius:14, padding:'14px 18px', textAlign:'center', color:'rgba(255,255,255,.55)', fontSize:13, fontFamily:'Mitr,sans-serif' }}>
            🎁 ฟักไข่เพื่อปลดล็อกเซอร์ไพรส์!
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-mini"><div className="stat-mini-val">{state.streak||0}{(state.streak||0)>=3?'🔥':''}</div><div className="stat-mini-lbl">Streak</div></div>
        <div className="stat-mini"><div className="stat-mini-val">{state.rounds||0}</div><div className="stat-mini-lbl">ด่านผ่าน</div></div>
        <div className="stat-mini"><div className="stat-mini-val">{state.badges||0}⭐</div><div className="stat-mini-lbl">Badge</div></div>
      </div>
    </div>
  )
}
