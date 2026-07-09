import React, { useState, useEffect } from 'react'
import { useAppState, ACTIONS } from './context/StateContext.jsx'
import { useCompanion } from './context/CompanionContext.jsx'
import { initVoices, playSFX, playTone } from './lib/audio.js'
import Home from './components/Home.jsx'
import Collection from './components/Collection.jsx'
import Report from './components/Report.jsx'
import GameScreen from './games/GameScreen.jsx'
import WorldScreen from './components/WorldScreen.jsx'
import WorldBattle from './components/WorldBattle.jsx'
import PartySelect from './components/PartySelect.jsx'
import BottomNav from './components/BottomNav.jsx'
import EggPopup from './components/EggPopup.jsx'
import LevelUpCutscene from './components/LevelUpCutscene.jsx'
import LoginModal from './components/LoginModal.jsx'
import ResetPasswordModal from './components/ResetPasswordModal.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import { XPToast, ItemToast, ConfettiLayer, showToast, spawnConfetti } from './components/Toasts.jsx'
import { EVO_STAGE_LABELS_TH } from './lib/creatureSystem.js'
import { supabase } from './lib/supabase.js'
import SaveStatusIndicator from './components/SaveStatusIndicator.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'
import LoginBackdrop from './components/LoginBackdrop.jsx'
import FriendsScreen from './components/FriendsScreen.jsx'
import CompanionCreation from './components/CompanionCreation.jsx'
import Room from './components/Room.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import PlacementQuest from './components/PlacementQuest.jsx'
import SpeechTestHarness from './components/SpeechTestHarness.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [eggPopupOpen, setEggPopupOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { state, dispatch } = useAppState()
  const { companion, loading: companionLoading } = useCompanion()

  useEffect(() => {
    if (!state.pendingEvoNotice) return
    const { newStage, creatureName } = state.pendingEvoNotice
    const stageTH = EVO_STAGE_LABELS_TH[newStage] ?? newStage
    playSFX('stage_up')
    playTone('stageUp')
    showToast(`★ ${creatureName || 'สัตว์'} วิวัฒนาการแล้ว! → ${stageTH}`)
    dispatch({ type: ACTIONS.CLEAR_EVO_NOTICE })
  }, [state.pendingEvoNotice]) // eslint-disable-line

  // Phase 1.1 curriculum system: node-mastery celebration. Mirrors the
  // pendingEvoNotice pattern above exactly (same one-shot-event convention) —
  // a full-screen-covering confetti burst + fanfare + toast text, same
  // celebration primitives already used elsewhere in this codebase (e.g.
  // showVictory's spawnConfetti(35) in useBattleCombat.js) rather than a new
  // bespoke cutscene component.
  useEffect(() => {
    if (!state.pendingNodeMastery) return
    const { nextNodeNameTh } = state.pendingNodeMastery
    playSFX('level_up')
    playTone('fanfare')
    spawnConfetti(30)
    showToast(nextNodeNameTh ? `เก่งมาก! ปลดล็อก ${nextNodeNameTh}` : 'เก่งมาก! เรียนจบทุกบทแล้ว! 🏆')
    dispatch({ type: ACTIONS.CLEAR_NODE_MASTERY })
  }, [state.pendingNodeMastery]) // eslint-disable-line

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

  const navigate = (to) => {
    if (to === 'home') dispatch({ type: ACTIONS.SET_SESSION_XP, payload: 0 })
    setScreen(to)
    setEggPopupOpen(false)
  }

  // Dev-only speech-recognition test harness (Phase 1.4) — checked before any
  // auth/state gate below, since it needs no login and touches no app state.
  // Never linked from the normal UI; opened directly via ?speechtest=1.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('speechtest') === '1') {
    return <SpeechTestHarness />
  }

  if (!authChecked || (isLoggedIn && companionLoading)) {
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
    return (
      <>
        <LoginBackdrop onStartTap={() => setShowLoginModal(true)} />
        <LoginModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mandatory={false}
        />
      </>
    )
  }

  const needsOnboarding = !state.name || state.name.trim() === ''
  if (needsOnboarding) {
    return <OnboardingModal />
  }

  // Companion creation — shown once for new players or existing players who never chose.
  // Blocking: cannot be dismissed until completed.
  if (!companion) {
    return <CompanionCreation />
  }

  // Phase 1.2 placement test ("ด่านทดสอบพลัง") — shown once, before the child can
  // reach a battle, for genuinely new accounts only. Trigger: placementDone !== true
  // AND fewer than 20 total battle answers recorded so far (an existing account that
  // predates this field gets placementDone defaulted correctly by migrateStateShape's
  // skip-rule, so this check only ever fires live for a real first-launch case).
  // Blocking, same pattern as CompanionCreation above.
  const totalAnswersRecorded = Object.values(state.responseTimeLogs || {})
    .reduce((sum, arr) => sum + (arr?.length || 0), 0)
  const needsPlacement = state.placementDone !== true && totalAnswersRecorded < 20
  if (needsPlacement) {
    // No onDone handler needed here: PlacementQuest dispatches COMPLETE_PLACEMENT
    // itself, which flips placementDone to true — this gate then simply stops
    // matching on the next render and the app falls through to the normal screen
    // router below, same as how the CompanionCreation gate above resolves itself.
    return <PlacementQuest />
  }

  return (
    <>
      {/* Global overlays (always mounted) */}
      <SaveStatusIndicator />
      <XPToast />
      <ItemToast />
      <ConfettiLayer />
      <EggPopup open={eggPopupOpen} onClose={() => setEggPopupOpen(false)} />
{state.pendingLevelUp && (
        <LevelUpCutscene
          data={state.pendingLevelUp}
          onDone={() => { dispatch({ type: ACTIONS.CLEAR_PENDING_LEVEL_UP }); navigate('world') }}
        />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ResetPasswordModal />

      {/* Screens — each wrapped in its own ErrorBoundary (keyed by screen) so a
          crash in one screen never white-screens the whole app; the boundary
          resets automatically when the child navigates to a different screen. */}
      <ErrorBoundary key={screen} name={screen}>
        {screen === 'home' && (
          <Home
            navigate={navigate}
            onOpenEggPopup={() => setEggPopupOpen(true)}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
          />
        )}
        {screen === 'collection' && <Collection navigate={navigate} />}
        {screen === 'room' && <Room navigate={navigate} />}
        {screen === 'report' && <Report />}
        {screen === 'game' && <GameScreen navigate={navigate} />}
        {screen === 'world' && <WorldScreen navigate={navigate} />}
        {screen === 'world-battle' && <WorldBattle navigate={navigate} />}
        {screen === 'friends' && <FriendsScreen />}
      </ErrorBoundary>

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
      {screen !== 'game' && screen !== 'world' && screen !== 'world-battle' && <BottomNav current={screen} navigate={navigate} hasNewRoomItem={state.hasNewRoomItem} />}
    </>
  )
}
