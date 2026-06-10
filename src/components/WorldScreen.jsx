import React, { useState, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import EggCanvas from './EggCanvas.jsx'
import { SCREENS, SCREEN_THEMES } from '../config/worldConfig.js'

// Direction arrow config
const DIRS = {
  N: { label: '↑', pos: { top: 66, left: '50%', transform: 'translateX(-50%)' } },
  S: { label: '↓', pos: { bottom: 28, left: '50%', transform: 'translateX(-50%)' } },
  E: { label: '→', pos: { right: 14, top: '50%', transform: 'translateY(-50%)' } },
  W: { label: '←', pos: { left: 14, top: '50%', transform: 'translateY(-50%)' } },
}

// ─── Starting Path background (BM) ─────────────────────────────────────────
function StartingPathBG({ isDay }) {
  const skyGrad = isDay
    ? 'linear-gradient(180deg,#7EC8E3 0%,#B0DFF5 55%,#C8EEFF 100%)'
    : 'linear-gradient(180deg,#0D1B3E 0%,#1B2E5A 55%,#2A3F6F 100%)'
  const grdGrad = isDay
    ? 'linear-gradient(180deg,#82C47A 0%,#5E9E56 100%)'
    : 'linear-gradient(180deg,#2E5C28 0%,#1E3C18 100%)'

  return (
    <>
      {/* Sky */}
      <div style={{ position:'absolute', left:0, right:0, top:0, height:'58%', background:skyGrad }} />

      {/* Sun */}
      {isDay && (
        <div style={{ position:'absolute', right:'16%', top:'7%', width:50, height:50,
          borderRadius:'50%', background:'#FFD93D',
          boxShadow:'0 0 0 9px rgba(255,217,61,0.22), 0 0 0 18px rgba(255,217,61,0.09)',
        }} />
      )}

      {/* Moon + stars */}
      {!isDay && (
        <>
          <div style={{ position:'absolute', right:'15%', top:'9%', width:40, height:40,
            borderRadius:'50%', background:'#EEF0F5',
            boxShadow:'0 0 0 6px rgba(238,240,245,0.14)',
          }} />
          {[{l:'18%',t:'11%'},{l:'36%',t:'5%'},{l:'54%',t:'14%'},{l:'72%',t:'7%'},{l:'9%',t:'23%'},{l:'82%',t:'19%'}].map((s,i) => (
            <div key={i} style={{ position:'absolute', left:s.l, top:s.t,
              width:2+i%2, height:2+i%2, borderRadius:'50%',
              background:'#fff', opacity:0.7+i*0.04,
              animation:`hbg-twinkle ${2+i*0.7}s ease-in-out ${i*0.3}s infinite`,
            }} />
          ))}
        </>
      )}

      {/* Clouds */}
      {isDay && (
        <>
          <div className="hbg-cloud hbg-cloud-1" style={{ top:'13%', opacity:0.82 }} />
          <div className="hbg-cloud hbg-cloud-2" style={{ top:'7%', opacity:0.68 }} />
        </>
      )}

      {/* Distant hills (horizon) */}
      <div style={{ position:'absolute', left:'-8%', right:'-8%', bottom:'39%',
        height:'12%', background: isDay ? '#A8D898' : '#1F3825',
        borderRadius:'60% 60% 0 0 / 100% 100% 0 0', opacity:0.55,
      }} />
      <div style={{ position:'absolute', left:'28%', right:'-8%', bottom:'40%',
        height:'9%', background: isDay ? '#B8E0A0' : '#243C2A',
        borderRadius:'60% 60% 0 0 / 100% 100% 0 0', opacity:0.65,
      }} />

      {/* Ground */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:'42%', background:grdGrad }} />

      {/* Path — perspective trapezoid */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:'42%' }}>
        <div style={{ position:'absolute', inset:0,
          background: isDay ? '#D4B882' : '#8A7254',
          clipPath:'polygon(36% 0%,64% 0%,81% 100%,19% 100%)',
        }} />
        {/* subtle center stripe */}
        <div style={{ position:'absolute', inset:0,
          background: isDay ? 'rgba(255,255,240,0.12)' : 'rgba(255,255,240,0.05)',
          clipPath:'polygon(47% 0%,53% 0%,55% 100%,45% 100%)',
        }} />
      </div>

      {/* Left bushes */}
      <div style={{ position:'absolute', left:'-3%', bottom:'39%', width:'20%', height:'11%',
        background: isDay ? '#4A8A42' : '#1E3818', borderRadius:'60% 60% 0 0',
      }} />
      <div style={{ position:'absolute', left:'4%', bottom:'40%', width:'13%', height:'8%',
        background: isDay ? '#5C9E54' : '#243C20', borderRadius:'50% 50% 0 0', opacity:0.85,
      }} />

      {/* Right bushes */}
      <div style={{ position:'absolute', right:'-3%', bottom:'39%', width:'18%', height:'10%',
        background: isDay ? '#52924A' : '#213C1C', borderRadius:'60% 60% 0 0',
      }} />
      <div style={{ position:'absolute', right:'5%', bottom:'40%', width:'11%', height:'7%',
        background: isDay ? '#4E8E46' : '#1E381A', borderRadius:'50% 50% 0 0', opacity:0.8,
      }} />

      {/* Left flowers */}
      {['🌸','🌻','🌼','🌺','🌷'].map((f,i) => (
        <div key={`fl${i}`} style={{
          position:'absolute', fontSize:13+i%3,
          bottom:`${41+i*4}%`, left:`${4+i*3}%`,
          opacity: isDay ? 0.95 : 0.25,
          animation:`egg-home-float ${2.4+i*0.35}s ease-in-out ${i*0.45}s infinite`,
          zIndex:2,
        }}>{f}</div>
      ))}

      {/* Right flowers */}
      {['🌼','🌸','🌺','🌻','🌹'].map((f,i) => (
        <div key={`fr${i}`} style={{
          position:'absolute', fontSize:12+i%3,
          bottom:`${41+i*3.5}%`, right:`${5+i*3}%`,
          opacity: isDay ? 0.9 : 0.2,
          animation:`egg-home-float ${2.7+i*0.25}s ease-in-out ${i*0.6+0.3}s infinite`,
          zIndex:2,
        }}>{f}</div>
      ))}

      {/* Pollen particles (day only) */}
      {isDay && [0,1,2].map(i => (
        <div key={`p${i}`} style={{
          position:'absolute', width:5, height:5, borderRadius:'50%',
          background:'rgba(255,255,180,0.65)',
          left:`${22+i*22}%`, bottom:`${48+i*5}%`,
          animation:`hbg-float-magic ${3.2+i*0.9}s ease-in-out ${i*0.7}s infinite`,
        }} />
      ))}
    </>
  )
}

// ─── Placeholder background for non-BM screens (Phase 1) ──────────────────
function PlaceholderBG({ screenId, isDay }) {
  const t = SCREEN_THEMES[screenId] || SCREEN_THEMES.MC
  const dim = isDay ? '' : 'brightness(0.38)'
  const skyGrad = `linear-gradient(180deg,${t.skyA} 0%,${t.skyB} 100%)`
  const grdGrad = `linear-gradient(180deg,${t.grdA} 0%,${t.grdB} 100%)`

  return (
    <>
      <div style={{ position:'absolute', left:0, right:0, top:0, height:'58%',
        background:skyGrad, filter:dim || undefined,
      }} />
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:'42%',
        background:grdGrad, filter:dim || undefined,
      }} />
      {/* Large screen-type icon, centered in sky */}
      <div style={{ position:'absolute', left:'50%', top:'22%',
        transform:'translate(-50%,-50%)', fontSize:62, opacity: isDay ? 0.55 : 0.2,
      }}>{t.icon}</div>
    </>
  )
}

// ─── Screen background switcher ────────────────────────────────────────────
function ScreenBackground({ screenId, isDay }) {
  if (screenId === 'BM') return <StartingPathBG isDay={isDay} />
  return <PlaceholderBG screenId={screenId} isDay={isDay} />
}

// ─── Main WorldScreen ──────────────────────────────────────────────────────
export default function WorldScreen({ navigate }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const [screenId, setScreenId] = useState(state.currentScreen || 'BM')
  const [transOverlay, setTransOverlay] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef(null)

  const hour = new Date().getHours()
  const isDay = hour >= 6 && hour < 19
  const screen = SCREENS[screenId]

  const moveToScreen = (dir) => {
    if (transitioning) return
    const target = screen?.connects[dir]
    if (!target) return

    setTransitioning(true)
    setTransOverlay(1)

    timerRef.current = setTimeout(() => {
      setScreenId(target)
      dispatch({ type: ACTIONS.MOVE_SCREEN, payload: target })
      dispatch({ type: ACTIONS.DISCOVER_SCREEN, payload: target })
      setTransOverlay(0)
      timerRef.current = setTimeout(() => setTransitioning(false), 170)
    }, 160)
  }

  const goHome = () => {
    dispatch({ type: ACTIONS.EXIT_WORLD })
    navigate('home')
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, overflow:'hidden',
      background: isDay ? '#7EC8E3' : '#0D1B3E',
    }}>

      {/* Background scene */}
      <ScreenBackground screenId={screenId} isDay={isDay} />

      {/* AC-style transition overlay */}
      <div style={{
        position:'absolute', inset:0, zIndex:20, pointerEvents:'none',
        background:'#14231a',
        opacity:transOverlay,
        transition:'opacity 160ms ease',
      }} />

      {/* Top bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:30,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px',
        paddingTop:'max(10px, env(safe-area-inset-top, 10px))',
      }}>
        <button
          onClick={goHome}
          style={{
            background:'rgba(255,255,255,0.88)', border:'none', borderRadius:22,
            padding:'6px 18px', fontFamily:'Mitr,sans-serif', fontWeight:700,
            fontSize:14, color:'#2d5a1b', cursor:'pointer',
            display:'flex', alignItems:'center', gap:5,
            boxShadow:'0 2px 10px rgba(0,0,0,0.18)',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          🏠 กลับบ้าน
        </button>
        <div style={{
          background:'rgba(0,0,0,0.28)', borderRadius:14, padding:'4px 12px',
          fontFamily:'Mitr,sans-serif', fontWeight:700, fontSize:12, color:'#fff',
          maxWidth:'55%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {screen?.label || ''}
        </div>
      </div>

      {/* Egg avatar — floating above ground line */}
      <div style={{
        position:'absolute', left:'50%', top:'54%',
        transform:'translate(-50%,-50%)',
        zIndex:15,
        animation:'egg-home-float 3s ease-in-out infinite',
        filter:'drop-shadow(0 6px 12px rgba(0,0,0,0.22))',
      }}>
        <EggCanvas stats={eggStatsData} width={80} height={95} />
      </div>

      {/* Direction arrows */}
      {Object.entries(DIRS).map(([dir, cfg]) => {
        const target = screen?.connects[dir]
        if (!target) return null
        return (
          <button
            key={dir}
            onClick={() => moveToScreen(dir)}
            disabled={transitioning}
            className="world-arrow-btn"
            style={{
              position:'absolute', zIndex:30,
              width:58, height:58, borderRadius:29,
              background:'rgba(255,255,255,0.78)',
              border:'2.5px solid rgba(255,255,255,0.95)',
              fontSize:24, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 3px 14px rgba(0,0,0,0.22)',
              opacity: transitioning ? 0.45 : 1,
              transition:'opacity 100ms ease',
              fontFamily:'system-ui,sans-serif',
              WebkitTapHighlightColor:'transparent',
              ...cfg.pos,
            }}
          >
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}
