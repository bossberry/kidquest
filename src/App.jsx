import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS } from './context/StateContext.jsx'
import { setSoundOn, initVoices, playSFX, playTone } from './lib/audio.js'
import Home from './components/Home.jsx'
import Collection from './components/Collection.jsx'
import Report from './components/Report.jsx'
import GameScreen from './games/GameScreen.jsx'
import WorldScreen from './components/WorldScreen.jsx'
import WorldBattle from './components/WorldBattle.jsx'
import PartySelect from './components/PartySelect.jsx'
import BottomNav from './components/BottomNav.jsx'
import EggPopup from './components/EggPopup.jsx'
import HatchOverlay from './components/HatchOverlay.jsx'
import LevelUpCutscene from './components/LevelUpCutscene.jsx'
import LoginModal from './components/LoginModal.jsx'
import ResetPasswordModal from './components/ResetPasswordModal.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import { XPToast, ItemToast, ConfettiLayer, showToast } from './components/Toasts.jsx'
import { EVO_STAGE_LABELS_TH } from './lib/creatureSystem.js'
import { supabase } from './lib/supabase.js'
import SaveStatusIndicator from './components/SaveStatusIndicator.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [soundOn, setSoundOnState] = useState(() => {
    try { return localStorage.getItem('kq_sound') !== 'off' } catch { return true }
  })
  const [eggPopupOpen, setEggPopupOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { state, dispatch } = useAppState()

  useEffect(() => {
    if (!state.pendingEvoNotice) return
    const { newStage, creatureName } = state.pendingEvoNotice
    const stageTH = EVO_STAGE_LABELS_TH[newStage] ?? newStage
    playSFX('stage_up')
    playTone('stageUp')
    showToast(`★ ${creatureName || 'สัตว์'} วิวัฒนาการแล้ว! → ${stageTH}`)
    dispatch({ type: ACTIONS.CLEAR_EVO_NOTICE })
  }, [state.pendingEvoNotice]) // eslint-disable-line

  useEffect(() => {
    if (!supabase) { setAuthChecked(true); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setAuthChecked(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => data?.subscription?.unsubscribe()
  }, [])

  useEffect(() => { initVoices() }, [])
  useEffect(() => { setSoundOn(soundOn) }, [soundOn])

  const navigate = (to) => {
    if (to === 'home') dispatch({ type: ACTIONS.SET_SESSION_XP, payload: 0 })
    setScreen(to)
    setEggPopupOpen(false)
  }

  if (!authChecked) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'Mitr,sans-serif', fontSize: 14,
      }}>
        กำลังโหลด...
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginModal open={true} onClose={() => {}} mandatory />
  }

  const needsOnboarding = !state.name || state.name.trim() === ''
  if (needsOnboarding) {
    return <OnboardingModal />
  }

  return (
    <>
      {/* Global overlays (always mounted) */}
      <SaveStatusIndicator />
      <XPToast />
      <ItemToast />
      <ConfettiLayer />
      <EggPopup open={eggPopupOpen} onClose={() => setEggPopupOpen(false)} />
      <HatchOverlay onClose={() => navigate('home')} suppressAutoOpen={screen === 'game' || screen === 'world-battle' || !!state.pendingBattle || !!state.battleCreatureId} />
      {state.pendingLevelUp && (
        <LevelUpCutscene
          data={state.pendingLevelUp}
          onDone={() => { dispatch({ type: ACTIONS.CLEAR_PENDING_LEVEL_UP }); navigate('world') }}
        />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ResetPasswordModal />

      {/* Screens */}
      {screen === 'home' && (
        <Home
          navigate={navigate}
          soundOn={soundOn}
          toggleSound={() => setSoundOnState(v => {
            const next = !v
            try { localStorage.setItem('kq_sound', next ? 'on' : 'off') } catch {}
            return next
          })}
          onOpenEggPopup={() => setEggPopupOpen(true)}
          onOpenLogin={() => setLoginOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />
      )}
      {screen === 'collection' && <Collection />}
      {screen === 'report' && <Report />}
      {screen === 'game' && (
        <GameScreen
          navigate={navigate}
          soundOn={soundOn}
          toggleSound={() => setSoundOnState(v => {
            const next = !v
            try { localStorage.setItem('kq_sound', next ? 'on' : 'off') } catch {}
            return next
          })}
        />
      )}
      {screen === 'world' && <WorldScreen navigate={navigate} />}
      {screen === 'world-battle' && <WorldBattle navigate={navigate} />}

      {/* Party select overlay — shown when a battle is pending but no creature chosen yet */}
      {state.pendingBattle && !state.battleCreatureId && (
        <PartySelect
          onSelect={(creatureId) => {
            dispatch({
              type: ACTIONS.SELECT_CREATURE_AND_ENTER_BATTLE,
              payload: { creatureId, battle: state.pendingBattle },
            })
            navigate('world-battle')
          }}
          onFlee={() => dispatch({ type: ACTIONS.CLEAR_PENDING_BATTLE })}
        />
      )}

      {/* Bottom nav (hidden during game, world, and world battle) */}
      {screen !== 'game' && screen !== 'world' && screen !== 'world-battle' && <BottomNav current={screen} navigate={navigate} />}
    </>
  )
}
