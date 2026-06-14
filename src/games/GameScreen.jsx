import React, { lazy, Suspense } from 'react'
import { useAppState } from '../context/StateContext.jsx'

const GameThai    = lazy(() => import('./GameThai.jsx'))
const GameMath    = lazy(() => import('./GameMath.jsx'))
const GamePhonics = lazy(() => import('./GamePhonics.jsx'))
const EggRun      = lazy(() => import('./minigames/EggRun.jsx'))
const EggCatch    = lazy(() => import('./minigames/EggCatch.jsx'))
const EggMemory   = lazy(() => import('./minigames/EggMemory.jsx'))
const EggTower    = lazy(() => import('./minigames/EggTower.jsx'))
const EggFishing  = lazy(() => import('./minigames/EggFishing.jsx'))
const GameShop        = lazy(() => import('./GameShop.jsx'))
const GameMathBattle       = lazy(() => import('./GameMathBattle.jsx'))

const WORLD_TITLES = {
  thai:'ภาษาไทย 🇹🇭', math:'Math 🔢', eng:'English Phonics 🔤',
  eggrun:'🏃 Egg Run', catch:'🧺 Egg Catch', memory:'🃏 Egg Memory',
  tower:'🏗️ Egg Tower', fishing:'🎣 Egg Fishing',
  shop:'🏪 ร้านค้า',
  mathbattle:'⚔️ Math Battle',
}

export default function GameScreen({ navigate, soundOn, toggleSound }) {
  const { state } = useAppState()
  const world = state.currentWorld || 'thai'

  // ── Classic games ────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100%', background:'var(--bg)' }}>
      <div className="back-bar">
        <button className="back-btn" onClick={() => navigate('home')}>← หน้าหลัก</button>
        <div className="game-title-bar">{WORLD_TITLES[world] || world}</div>
        <div className="xp-earned">+<span>{state.sessionXP||0}</span> XP</div>
      </div>
      <div id="game-container" style={{ width:'100%', maxWidth:480, flex:1, overflowY:'auto', display:'flex', flexDirection:'column', alignItems:'center', paddingBottom:20 }}>
        <Suspense fallback={<div style={{ padding:40, color:'var(--muted)' }}>กำลังโหลด...</div>}>
          {world === 'thai'    && <GameThai navigate={navigate} soundOn={soundOn} />}
          {world === 'math'    && <GameMath navigate={navigate} soundOn={soundOn} />}
          {world === 'eng'     && <GamePhonics navigate={navigate} soundOn={soundOn} />}
          {world === 'eggrun'  && <EggRun navigate={navigate} />}
          {world === 'catch'   && <EggCatch navigate={navigate} />}
          {world === 'memory'  && <EggMemory navigate={navigate} />}
          {world === 'tower'   && <EggTower navigate={navigate} />}
          {world === 'fishing' && <EggFishing navigate={navigate} />}
          {world === 'shop'        && <GameShop navigate={navigate} />}
          {world === 'mathbattle'  && <GameMathBattle navigate={navigate} />}
        </Suspense>
      </div>
    </div>
  )
}
