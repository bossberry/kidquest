import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS } from './context/StateContext.jsx'
import { setSoundOn } from './lib/audio.js'
import { initVoices } from './lib/audio.js'
import Home from './components/Home.jsx'
import Collection from './components/Collection.jsx'
import Report from './components/Report.jsx'
import GameScreen from './games/GameScreen.jsx'
import BottomNav from './components/BottomNav.jsx'
import EggPopup from './components/EggPopup.jsx'
import HatchOverlay from './components/HatchOverlay.jsx'
import LoginModal from './components/LoginModal.jsx'
import { XPToast, ItemToast, ConfettiLayer } from './components/Toasts.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [soundOn, setSoundOnState] = useState(true)
  const [eggPopupOpen, setEggPopupOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const { state, dispatch } = useAppState()

  useEffect(() => { initVoices() }, [])
  useEffect(() => { setSoundOn(soundOn) }, [soundOn])

  const navigate = (to) => {
    if (to === 'home') dispatch({ type: ACTIONS.SET_SESSION_XP, payload: 0 })
    setScreen(to)
    setEggPopupOpen(false)
  }

  return (
    <>
      {/* Global overlays (always mounted) */}
      <XPToast />
      <ItemToast />
      <ConfettiLayer />
      <EggPopup open={eggPopupOpen} onClose={() => setEggPopupOpen(false)} />
      <HatchOverlay onClose={() => navigate('home')} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* Screens */}
      {screen === 'home' && (
        <Home
          navigate={navigate}
          soundOn={soundOn}
          toggleSound={() => setSoundOnState(v => !v)}
          onOpenEggPopup={() => setEggPopupOpen(true)}
          onOpenLogin={() => setLoginOpen(true)}
        />
      )}
      {screen === 'collection' && <Collection />}
      {screen === 'report' && <Report />}
      {screen === 'game' && (
        <GameScreen
          navigate={navigate}
          soundOn={soundOn}
          toggleSound={() => setSoundOnState(v => !v)}
        />
      )}

      {/* Bottom nav (hidden during game) */}
      {screen !== 'game' && <BottomNav current={screen} navigate={navigate} />}
    </>
  )
}
