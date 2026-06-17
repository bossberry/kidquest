// WorldScreen.jsx — world map, node progression, and zone unlock for Green Meadow (and future worlds).
import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { WORLD_LEVELS, DYNAMIC_SCREENS } from '../config/worldConfig.js'
import { playTone, playBGM, stopBGM, playSFX } from '../lib/audio.js'
import { BOSS_XP_THRESHOLD } from '../config/gameConfig.js'
import {
  T, canMove, getExitAt,
  EXIT_DIR_NAME, getEntryPosition,
} from '../lib/tileEngine.js'
import { generateScreenMap, generateBossMap, generateMazeMap, getScreenEnemies } from '../lib/tileMaps.js'
import { useWorldGameLoop } from '../hooks/useWorldGameLoop.js'
import { getBattleSubject } from '../lib/battleSubject.js'
import useBattleTrigger from '../hooks/useBattleTrigger.js'
import TreasureSlot from './TreasureSlot.jsx'
import PixelItemIcon from './PixelItemIcon.jsx'
import { drawItem } from '../lib/itemArt.js'
import WorldHUD, { HUD_CONTENT_H, HOME_ITEM_KEYS, BATTLE_ITEM_KEYS } from './world/WorldHUD.jsx'
import MissionPanel from './world/MissionPanel.jsx'
import {
  drawChest, drawPlayerGlow, spawnChests, findSpecials,
  getOwlLines, SIGN_LINES, STAGE_COLORS,
} from '../lib/worldDrawHelpers.js'

const TILE = 16 // px per tile (matches tileEngine TILE constant)

// Sky tint by subject level: morning → afternoon → sunset → night
const SKY_TINTS = [
  'rgba(0,0,0,0)',            // Lv1: dawn — no tint
  'rgba(255,200,60,0.09)',    // Lv2: golden afternoon
  'rgba(220,80,30,0.14)',     // Lv3: sunset
  'rgba(30,10,70,0.25)',      // Lv4+: dark / night
]



const DPAD_BTN = (pos) => ({
  position: 'absolute', width: 56, height: 56, borderRadius: 12,
  background: 'rgba(255,255,255,0.13)', border: '2px solid rgba(255,255,255,0.28)',
  color: 'rgba(255,255,255,0.88)', fontSize: 22, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  userSelect: 'none', fontFamily: 'system-ui,sans-serif',
  ...pos,
})

const VALID_DYNAMIC = new Set(['NW', 'NE', 'SW', 'SE', 'BOSS', 'MAZE'])
const BOSS_TILE = { col: 7, row: 3 }

// ─────────────────────────────────────────────────────────────────────────────

export default function WorldScreen({ navigate }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const stateRef = useRef(state)
  // useLayoutEffect runs before the browser paint (unlike useEffect which runs after).
  // This ensures stateRef.current.pendingBattle is set before the next RAF frame fires,
  // preventing triggerBattle from dispatching SET_PENDING_BATTLE multiple times in rapid
  // succession (the "PartySelect infinite loop" bug).
  useLayoutEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    playBGM('world')
    return () => stopBGM()
  }, [])
  const canvasRef = useRef(null)

  const [viewSize, setViewSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [screenId, setScreenId] = useState(VALID_DYNAMIC.has(state.currentScreen) ? state.currentScreen : 'NW')
  const [transitioning, setTransitioning] = useState(false)
  const [transOverlay, setTransOverlay] = useState(0)
  const [nearNPC, setNearNPC] = useState(null)
  const [nearSign, setNearSign] = useState(null)
  const [dialogue, setDialogue] = useState(null)
  const [encounterFlash, setEncounterFlash] = useState(false)

  // Mutable refs for game loop (avoid stale closures)
  const gameRef      = useRef(null)
  const tileMapRef   = useRef(null)
  const specialsRef  = useRef({ npcs: [], signs: [] })
  const screenIdRef  = useRef(screenId)
  const transRef     = useRef(transitioning)
  const dialogueRef  = useRef(dialogue)
  const transTimer   = useRef(null)
  const enemiesRef        = useRef([]) // dynamic enemy runtime state
  const chestsRef         = useRef([]) // treasure chest runtime state
  const [slotMachineOpen, setSlotMachineOpen] = useState(false)
  const [bossConfirm, setBossConfirm] = useState(false)
  const [worldUnlockBanner, setWorldUnlockBanner] = useState(null)
  const [itemBagOpen, setItemBagOpen] = useState(false)
  const [bossCutscene, setBossCutscene] = useState(null) // null | string (world name)
  const [mazeTimerTick, setMazeTimerTick] = useState(0)
  const { triggerBattle, triggerBattleRef, battleDispatchedRef, battlePendingRef, enterBossBattle } =
    useBattleTrigger({ stateRef, screenIdRef, gameRef, setEncounterFlash, setBossConfirm, BOSS_TILE })

  screenIdRef.current   = screenId
  transRef.current      = transitioning
  dialogueRef.current   = dialogue

  const eggColor = STAGE_COLORS[eggStatsData?.stage ?? 0] || STAGE_COLORS[0]
  const eggColorRef = useRef(eggColor)
  eggColorRef.current = eggColor

  const clearedMaps = state.clearedMaps ?? []
  const allMapsCleared = ['NW', 'NE', 'SW', 'SE'].every(s => clearedMaps.includes(s))
  const totalXP = (state.xpThai ?? 0) + (state.xpMath ?? 0) + (state.xpEng ?? 0)
  const bossMapActive = !state.bossEnemyDefeated && allMapsCleared && totalXP >= BOSS_XP_THRESHOLD

  // ── Viewport resize ──────────────────────────────────────────────────────────

  useEffect(() => {
    const onResize = () => setViewSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  // ── Screen setup ────────────────────────────────────────────────────────────

  const initScreen = useCallback((id, fromExitType, forcedStart) => {
    const wLevel = stateRef.current.worldLevel ?? 0
    let tileMap, startPos

    if (id === 'BOSS') {
      tileMap = generateBossMap(wLevel)
      startPos = forcedStart ?? (fromExitType !== undefined
        ? getEntryPosition(tileMap, fromExitType)
        : { col: 10, row: 13 })
    } else if (id === 'MAZE') {
      tileMap = generateMazeMap()
      startPos = forcedStart ?? { col: 1, row: 13 }
    } else {
      tileMap = generateScreenMap(id, wLevel)
      startPos = forcedStart ?? (fromExitType !== undefined
        ? getEntryPosition(tileMap, fromExitType)
        : { col: 10, row: 7 })
    }

    tileMapRef.current  = tileMap
    specialsRef.current = findSpecials(tileMap)
    gameRef.current = {
      col: startPos.col, row: startPos.row,
      displayX: startPos.col, displayY: startPos.row,
      fromX: startPos.col, fromY: startPos.row,
      dir: 'down', walkFrame: 0,
      moving: false, moveStartTime: 0, frame: 0,
    }
    setNearNPC(null)
    setNearSign(null)
    setDialogue(null)
  }, [])

  useEffect(() => {
    const savedPos = stateRef.current.worldPosition
    if (savedPos && (savedPos.screen === screenId || !savedPos.screen)) {
      initScreen(screenId, undefined, { col: savedPos.tileX, row: savedPos.tileY })
      dispatch({ type: ACTIONS.CLEAR_WORLD_POSITION })
    } else {
      initScreen(screenId, undefined)
    }
  }, []) // eslint-disable-line

  // ── Enemy initialization on screen change ────────────────────────────────────

  useEffect(() => {
    const wLevel = stateRef.current.worldLevel ?? 0
    const worldDef = WORLD_LEVELS[wLevel] ?? WORLD_LEVELS[0]

    if (screenId === 'BOSS') {
      // Don't spawn boss if already defeated this tier
      if (stateRef.current.bossEnemyDefeated) {
        enemiesRef.current = []
        chestsRef.current = []
        return
      }
      enemiesRef.current = [{
        id: 'world_boss',
        type: worldDef.bossEnemy,
        col: BOSS_TILE.col, row: BOSS_TILE.row,
        dir: 'down', timer: 0, rngSeed: 42,
        woken: false, isAggro: false, aggroTimer: 0,
        defeated: false, respawnTimer: 0, dead: false,
        deathTimer: 0, opacity: 1, isWorldBoss: true,
      }]
      chestsRef.current = []
      return
    }

    const defs = screenId === 'MAZE' ? [] : getScreenEnemies(screenId, wLevel)
    enemiesRef.current = defs.map((def, i) => ({
      id:           `${screenId}_${i}`,
      type:         def.type,
      col:          def.col,
      row:          def.row,
      dir:          def.type === 'bouncy_slime' ? 'up'
                  : def.type === 'egg_pawn'     ? 'down'
                  : def.type === 'fox_kit'      ? 'right'
                  : 'none',
      timer:        i * 17,
      rngSeed:      (i * 37 + 11) % 97,
      woken:        false,
      isAggro:      false,
      aggroTimer:   0,
      defeated:     false,
      respawnTimer: 0,
      dead:         false,
      deathTimer:   0,
      opacity:      1,
    }))
    chestsRef.current = screenId === 'MAZE' ? [] : spawnChests(tileMapRef.current, defs)
    // Apply death animation for the enemy that was just defeated in battle
    try {
      const lb = JSON.parse(sessionStorage.getItem('kq_last_battle') || 'null')
      if (lb && lb.screenId === screenId) {
        sessionStorage.removeItem('kq_last_battle')
        let applied = false
        enemiesRef.current = enemiesRef.current.map(e => {
          if (!applied && e.type === lb.enemyType) {
            applied = true
            return { ...e, dead: true }
          }
          return e
        })
      }
    } catch {}
    // Roaming boss: after defeating boss, it respawns as a rare encounter on normal maps
    const bossRoamingScreen = stateRef.current.bossRoamingScreen
    if (bossRoamingScreen && bossRoamingScreen === screenId && stateRef.current.bossEnemyDefeated) {
      enemiesRef.current = [
        ...enemiesRef.current,
        {
          id: 'roaming_boss',
          type: worldDef.bossEnemy,
          col: 5, row: 5,
          dir: 'down', timer: 0, rngSeed: 99,
          woken: false, isAggro: false, aggroTimer: 0,
          defeated: false, respawnTimer: 0, dead: false,
          deathTimer: 0, opacity: 1, isWorldBoss: true,
        }
      ]
    }
  }, [screenId]) // eslint-disable-line

  // ── Boss respawn trigger: after 10 battle wins, boss roams on a normal map ──

  useEffect(() => {
    const s = stateRef.current
    if (!s.bossEnemyDefeated) return
    const wins = state.battleWins ?? 0
    const winsSince = wins - (s.bossWinsAtDefeat ?? 0)
    if (winsSince > 0 && winsSince % 10 === 0) {
      dispatch({ type: ACTIONS.RESPAWN_BOSS_ON_NORMAL_MAP })
    }
  }, [state.battleWins]) // eslint-disable-line

  // ── Proximity detection ─────────────────────────────────────────────────────

  const checkProximity = useCallback((col, row) => {
    const { npcs, signs } = specialsRef.current
    const near = (a) => Math.abs(a.col - col) + Math.abs(a.row - row) <= 2
    setNearNPC(npcs.find(near) || null)
    setNearSign(signs.find(near) || null)
  }, [])

  // ── Screen transition ────────────────────────────────────────────────────────

  const handleExit = useCallback((exitType) => {
    if (transRef.current) return
    const sid = screenIdRef.current
    const dirName = EXIT_DIR_NAME[exitType]
    const curState = stateRef.current

    // Maze exit: leaving MAZE via EXIT_N clears the maze and drops 3 items
    if (sid === 'MAZE' && dirName === 'N') {
      dispatch({ type: ACTIONS.CLEAR_MAZE })
      const ITEM_KEYS = ['scroll', 'thunder', 'gem', 'mirror', 'clover']
      for (let i = 0; i < 3; i++) {
        dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)] } })
      }
    }

    // Mark regular map as cleared when exiting for the first time
    if (['NW', 'NE', 'SW', 'SE'].includes(sid)) {
      dispatch({ type: ACTIONS.MAP_CLEARED, payload: sid })
    }

    // Dynamic routing with maze override for NW→S and SE→W
    let connects = { ...(DYNAMIC_SCREENS[sid]?.connects ?? {}) }
    if (curState.mazeActive && sid === 'NW' && dirName === 'S') connects.S = 'MAZE'
    if (curState.mazeActive && sid === 'SE' && dirName === 'W') connects.W = 'MAZE'

    const targetId = connects[dirName]
    if (!targetId) return

    // Block BOSS entry if boss already defeated or unlock conditions not met
    if (targetId === 'BOSS') {
      if (curState.bossEnemyDefeated) return
      const cleared = curState.clearedMaps ?? []
      const xp = (curState.xpThai ?? 0) + (curState.xpMath ?? 0) + (curState.xpEng ?? 0)
      const allCleared = ['NW', 'NE', 'SW', 'SE'].every(s => cleared.includes(s))
      if (!allCleared || xp < BOSS_XP_THRESHOLD) return
    }

    const forcedStart = targetId === 'MAZE' ? { col: 1, row: 13 } : undefined

    playSFX('screen_enter')
    setTransitioning(true)
    setTransOverlay(1)

    transTimer.current = setTimeout(() => {
      initScreen(targetId, exitType, forcedStart)
      setScreenId(targetId)
      dispatch({ type: ACTIONS.MOVE_SCREEN, payload: targetId })
      dispatch({ type: ACTIONS.DISCOVER_SCREEN, payload: targetId })
      setTransOverlay(0)
      transTimer.current = setTimeout(() => setTransitioning(false), 170)
    }, 160)
  }, [dispatch, initScreen])

  // ── Player movement ──────────────────────────────────────────────────────────
  const tryMove = useCallback((dCol, dRow, dir) => {
    const g = gameRef.current
    if (!g || g.moving || transRef.current || dialogueRef.current) return
    if (stateRef.current.pendingBattle) return

    const tileMap = tileMapRef.current
    if (!tileMap) return

    g.dir = dir
    const shoesActive = (stateRef.current.activeBoosts?.shoes?.endsAt ?? 0) > Date.now()
    window.__kq_moveSpeedMult = shoesActive ? 4.0 : 1.0
    const newCol = g.col + dCol
    const newRow = g.row + dRow

    // Dynamic enemy collision — also catches chasers already on player's tile
    const saiyanActive = (stateRef.current.activeBoosts?.rainbow_star?.endsAt ?? 0) > Date.now()

    const hitEnemy = enemiesRef.current.find(e => {
      if (e.defeated || e.dead) return false
      const isChaser = e.type === 'snake' || e.type === 'baby_zombie' ||
                       (e.type === 'sleepy_bunny' && e.woken)
      // Saiyan mode: phase through chasers, but still collide with enemies walked into directly
      if (isChaser && saiyanActive) return false
      if (e.col === newCol && e.row === newRow) return true
      if (isChaser && e.col === g.col && e.row === g.row) return true
      return false
    })
    if (hitEnemy) {
      if (hitEnemy.isWorldBoss) {
        playSFX('enemy_notice')
        setBossConfirm(true)
        return
      }
      if (hitEnemy.type === 'sleepy_bunny' && !hitEnemy.woken) {
        // Wake the bunny — player bumped it, bunny wakes up
        enemiesRef.current = enemiesRef.current.map(e =>
          e.id === hitEnemy.id ? { ...e, woken: true, timer: 0 } : e
        )
        playSFX('enemy_notice')
        return
      }
      triggerBattle(hitEnemy)
      return
    }

    // Treasure chest collision
    const hitChest = chestsRef.current.find(c => !c.opened && c.col === newCol && c.row === newRow)
    if (hitChest) {
      chestsRef.current = chestsRef.current.map(c => c.id === hitChest.id ? { ...c, opened: true } : c)
      playTone('cardOpen')
      setSlotMachineOpen(true)
      return
    }

    if (!canMove(tileMap, newCol, newRow)) return

    g.fromX = g.displayX
    g.fromY = g.displayY
    g.col = newCol
    g.row = newRow
    g.moving = true
    g.moveStartTime = performance.now()
    g.walkFrame = (g.walkFrame + 1) % 2

    playSFX('footstep')

    const exitType = getExitAt(tileMap, newCol, newRow)
    if (exitType !== null) {
      setTimeout(() => handleExit(exitType), 80)
      return
    }

    const raw = tileMap[newRow]?.[newCol]
    const ttype = typeof raw === 'object' ? raw.type : raw
    if (ttype === T.TALL && Math.random() < 0.30) {
      playSFX('tall_grass')
      const GRASS_POOL = ['sleepy_bunny', 'bouncy_slime', 'fox_kit', 'leaf_sprite', 'mushroom_imp']
      const randomType = GRASS_POOL[Math.floor(Math.random() * GRASS_POOL.length)]
      triggerBattle({ id: '_grass_', type: randomType })
      return
    }

    checkProximity(newCol, newRow)
  }, [dispatch, handleExit, checkProximity, navigate, triggerBattle])

  const moveUp    = useCallback(() => tryMove( 0, -1, 'up'),    [tryMove])
  const moveDown  = useCallback(() => tryMove( 0,  1, 'down'),  [tryMove])
  const moveLeft  = useCallback(() => tryMove(-1,  0, 'left'),  [tryMove])
  const moveRight = useCallback(() => tryMove( 1,  0, 'right'), [tryMove])

  // ── Dialogue ─────────────────────────────────────────────────────────────────

  const openNPC  = () => { setDialogue({ lines: getOwlLines(state.name || 'เพื่อน'),  index: 0 }); playSFX('npc_talk'); playTone('cardOpen') }
  const openSign = () => { setDialogue({ lines: SIGN_LINES, index: 0 }); playSFX('npc_talk'); playTone('cardOpen') }
  const advance  = () => {
    if (!dialogue) return
    if (dialogue.index < dialogue.lines.length - 1) setDialogue({ ...dialogue, index: dialogue.index + 1 })
    else setDialogue(null)
  }

  // ── rAF render loop ──────────────────────────────────────────────────────────

  useWorldGameLoop({
    canvasRef, gameRef, tileMapRef, enemiesRef, chestsRef, stateRef,
    battlePendingRef, battleDispatchedRef, triggerBattleRef,
    eggColorRef, HUD_CONTENT_H,
  })

  // ── Secret maze: countdown expiry ────────────────────────────────────────────

  useEffect(() => {
    if (!state.secretMapExpiry || !state.mazeActive) return
    const remaining = state.secretMapExpiry - Date.now()
    if (remaining <= 0) {
      dispatch({ type: ACTIONS.SECRET_MAP_EXPIRE })
      return
    }
    const t = setTimeout(() => dispatch({ type: ACTIONS.SECRET_MAP_EXPIRE }), remaining)
    return () => clearTimeout(t)
  }, [state.secretMapExpiry, state.mazeActive]) // eslint-disable-line

  // ── Secret maze: countdown display tick ──────────────────────────────────────

  useEffect(() => {
    if (!state.mazeActive || !state.secretMapExpiry) return
    const id = setInterval(() => setMazeTimerTick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [state.mazeActive, state.secretMapExpiry])

  // ── Boss defeat → tier advance ────────────────────────────────────────────────

  useEffect(() => {
    if (!state.bossDefeatedThisTier) return
    const wl = state.worldLevel ?? 0
    const nextLevel = wl + 1
    const nextDef = WORLD_LEVELS[nextLevel]
    const currentName = WORLD_LEVELS[wl]?.nameTH ?? `Tier ${wl}`
    setBossCutscene(currentName)
    const t1 = setTimeout(() => {
      setBossCutscene(null)
      if (nextDef) {
        dispatch({ type: ACTIONS.SET_WORLD_LEVEL, payload: nextLevel })
        setWorldUnlockBanner(nextDef.nameTH)
        setTimeout(() => setWorldUnlockBanner(null), 4000)
      } else {
        dispatch({ type: ACTIONS.SET_WORLD_LEVEL, payload: wl })
      }
    }, 3500)
    return () => clearTimeout(t1)
  }, [state.bossDefeatedThisTier]) // eslint-disable-line

  // ── Go home ──────────────────────────────────────────────────────────────────

  const goHome = () => { dispatch({ type: ACTIONS.EXIT_WORLD }); navigate('home') }

  // ── Treasure reward ──────────────────────────────────────────────────────────

  function handleTreasureReward(reward) {
    const { rewards } = reward
    if (!rewards?.length) return
    rewards.forEach(r => {
      if (r.type === 'home') {
        dispatch({ type: ACTIONS.DROP_HOME_ITEM, payload: { key: r.key } })
      } else if (r.type === 'battle') {
        dispatch({ type: ACTIONS.DROP_BATTLE_ITEM, payload: { key: r.key } })
      }
    })
    playSFX('stage_up')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a1a0a' }}>

      {/* Canvas — fills full viewport */}
      <canvas
        ref={canvasRef}
        width={viewSize.w}
        height={viewSize.h}
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
      />

      {/* Sky tint — changes with subject level (morning/afternoon/sunset/night) */}
      {(() => {
        const subj = getBattleSubject(state.sessionLog, state)
        const lvl  = Math.max(0, (state.subjectLevels?.[subj] ?? 1) - 1)
        const tint = SKY_TINTS[Math.min(lvl, SKY_TINTS.length - 1)]
        return <div style={{
          position: 'absolute', inset: 0, background: tint,
          pointerEvents: 'none', zIndex: 1, transition: 'background 3s ease',
        }} />
      })()}

      {/* Fade overlay */}
      <div style={{
        position: 'absolute', inset: 0, background: '#14231a',
        opacity: transOverlay, pointerEvents: 'none',
        transition: 'opacity 160ms ease', zIndex: 20,
      }} />

      {/* Encounter flash */}
      <div style={{
        position: 'absolute', inset: 0, background: '#ffffff',
        opacity: encounterFlash ? 0.85 : 0,
        transition: encounterFlash ? 'none' : 'opacity 300ms ease',
        pointerEvents: 'none', zIndex: 22,
      }} />

      {/* World HUD */}
      <WorldHUD
        screenId={screenId}
        discoveredScreens={state.discoveredScreens}
        state={state}
        onGoHome={goHome}
        onOpenItemBag={() => setItemBagOpen(true)}
        bossMapActive={bossMapActive}
      />

      {/* Mission Progress Panel */}
      <MissionPanel
        screenId={screenId}
        state={state}
        worldLevel={state.worldLevel ?? 0}
      />

      {/* NPC talk button */}
      {nearNPC && !dialogue && (
        <button onClick={openNPC} style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 25,
          background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 20,
          padding: '6px 14px', fontFamily: 'Mitr,sans-serif', fontWeight: 700,
          fontSize: 13, color: '#4a2a08', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          WebkitTapHighlightColor: 'transparent',
        }}>💬 คุย</button>
      )}

      {/* Sign read button */}
      {nearSign && !dialogue && !nearNPC && (
        <button onClick={openSign} style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 25,
          background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 20,
          padding: '6px 14px', fontFamily: 'Mitr,sans-serif', fontWeight: 700,
          fontSize: 13, color: '#4a2a08', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          WebkitTapHighlightColor: 'transparent',
        }}>📋 อ่าน</button>
      )}

      {/* D-pad — bottom center, overlays on canvas */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0.82,
        width: 168,
        height: 168,
        zIndex: 30,
      }}>
        <button onPointerDown={moveUp}    style={DPAD_BTN({ left: 56,  top: 0   })}>▲</button>
        <button onPointerDown={moveLeft}  style={DPAD_BTN({ left: 0,   top: 56  })}>◄</button>
        <div style={{ position: 'absolute', left: 56, top: 56, width: 56, height: 56 }} />
        <button onPointerDown={moveRight} style={DPAD_BTN({ left: 112, top: 56  })}>►</button>
        <button onPointerDown={moveDown}  style={DPAD_BTN({ left: 56,  top: 112 })}>▼</button>
      </div>

      {/* Dialogue overlay */}
      {dialogue && (
        <div onClick={advance} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'flex-end',
          padding: '0 12px 20px',
        }}>
          <div style={{
            width: '100%', background: 'rgba(10,25,10,0.95)',
            border: '2px solid #4a8a4a', borderRadius: 12,
            padding: '14px 16px', fontFamily: 'Mitr,sans-serif',
            color: '#e8f8e8', fontSize: 16, lineHeight: 1.7,
            boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
          }}>
            <div>{dialogue.lines[dialogue.index]}</div>
            <div style={{ fontSize: 11, color: '#80c080', textAlign: 'right', marginTop: 6 }}>แตะเพื่อดำเนินต่อ ▶</div>
          </div>
        </div>
      )}

      {/* Treasure slot machine overlay */}
      {slotMachineOpen && (
        <TreasureSlot
          subject={getBattleSubject(stateRef.current.sessionLog, stateRef.current)}
          onReward={handleTreasureReward}
          onClose={() => setSlotMachineOpen(false)}
        />
      )}

      {/* Boss confirm dialog */}
      {bossConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#1a0a0a', border: '2px solid #aa2020', borderRadius: 14,
            padding: '20px 24px', maxWidth: 280, width: '100%',
            fontFamily: 'Mitr,sans-serif', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚔️</div>
            <div style={{ color: '#ffb0b0', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              พบบอส Final!
            </div>
            <div style={{ color: '#d0a0a0', fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              {WORLD_LEVELS[state.worldLevel ?? 0]?.bossNameTH} กำลังรออยู่!<br />
              พร้อมสู้หรือยัง?
            </div>
            <div style={{
              background: 'rgba(180,40,20,0.18)', border: '1px solid #aa3020',
              borderRadius: 8, padding: '7px 12px', marginBottom: 18,
              color: '#ffaa80', fontSize: 12, lineHeight: 1.5,
            }}>
              ⚠️ ใช้ไอเทมไม่ได้ในการสู้ครั้งนี้
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBossConfirm(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#2a1010', border: '1px solid #553030',
                  color: '#c09090', fontFamily: 'Mitr,sans-serif', fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                หนีก่อน
              </button>
              <button
                onClick={enterBossBattle}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#8a1010', border: '1px solid #cc2020',
                  color: '#fff', fontFamily: 'Mitr,sans-serif', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                สู้เลย! ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maze notification */}
      {state.mazeActive && !state.mazeCleared && (() => {
        const expiry = state.secretMapExpiry
        const msLeft = expiry ? Math.max(0, expiry - Date.now() + mazeTimerTick * 0) : 0
        const mins   = Math.floor(msLeft / 60000)
        const secs   = Math.floor((msLeft % 60000) / 1000)
        const countdown = expiry ? ` · ${mins}:${String(secs).padStart(2, '0')}` : ''
        return (
          <div style={{
            position: 'absolute', bottom: 200, left: 0, right: 0, zIndex: 28,
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(24,8,48,0.92)', border: '1px solid #6030a0',
              borderRadius: 10, padding: '8px 16px',
              fontFamily: 'Mitr,sans-serif', color: '#c090ff', fontSize: 13,
            }}>
              🌀 แมพลับปรากฏทางทิศใต้{countdown}
            </div>
          </div>
        )
      })()}

      {/* World unlock banner */}
      {worldUnlockBanner && (
        <div style={{
          position: 'absolute', top: HUD_CONTENT_H + 12, left: 0, right: 0, zIndex: 35,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.88)', border: '2px solid #e0c030',
            borderRadius: 12, padding: '12px 20px',
            fontFamily: 'Mitr,sans-serif', textAlign: 'center',
          }}>
            <div style={{ color: '#ffe060', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              ✨ ปลดล็อคโลกใหม่!
            </div>
            <div style={{ color: '#d0c060', fontSize: 14 }}>{worldUnlockBanner}</div>
          </div>
        </div>
      )}

      {/* Boss cutscene banner */}
      {bossCutscene && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, fontFamily: 'Mitr,sans-serif', textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <div style={{ color: '#ffe060', fontSize: 22, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>
            {state.name}พิชิต
          </div>
          <div style={{ color: '#ffcc00', fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
            {bossCutscene}!
          </div>
          <div style={{ color: '#c0b080', fontSize: 15, lineHeight: 1.7 }}>
            กำลังย้ายไปโลกใหม่...
          </div>
        </div>
      )}

      {/* Item bag popup */}
      {itemBagOpen && (
        <div
          onClick={() => setItemBagOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 55,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:'#0a0a12',
              border:'2px solid rgba(255,255,255,0.12)',
              padding:'16px',
              maxWidth:300, width:'90%',
            }}
          >
            <div style={{
              fontFamily:'var(--font-pixel)', fontSize:9,
              color:'#FFD700', letterSpacing:2,
              marginBottom:14, textAlign:'center',
            }}>
              ITEMS
            </div>

            {/* Home items */}
            <div style={{
              fontFamily:'var(--font-pixel)', fontSize:7,
              color:'rgba(255,255,255,0.3)', marginBottom:8, letterSpacing:1,
            }}>HOME</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {HOME_ITEM_KEYS.map(key => {
                const count = (state.homeItems ?? {})[key] ?? 0
                return (
                  <button
                    key={key}
                    disabled={count === 0}
                    onClick={() => {
                      if (count === 0) return
                      dispatch({ type: ACTIONS.USE_HOME_ITEM, payload: { key } })
                      setItemBagOpen(false)
                    }}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      padding:'8px 4px',
                      background: count > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)',
                      border: count > 0 ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                      cursor: count > 0 ? 'pointer' : 'default',
                      position:'relative',
                      opacity: count > 0 ? 1 : 0.35,
                    }}
                  >
                    <canvas
                      ref={r => r && drawItem(r, key)}
                      width={40} height={40}
                      style={{ imageRendering:'pixelated' }}
                    />
                    <div style={{
                      fontFamily:'var(--font-pixel)', fontSize:9,
                      color: count > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)',
                    }}>
                      ×{count}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Battle items */}
            <div style={{
              fontFamily:'var(--font-pixel)', fontSize:7,
              color:'rgba(255,255,255,0.3)', marginBottom:8, letterSpacing:1,
            }}>BATTLE</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:16 }}>
              {BATTLE_ITEM_KEYS.map(key => {
                const count = (state.battleItems ?? {})[key] ?? 0
                return (
                  <div key={key} style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    padding:'6px 2px',
                    background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.06)',
                    opacity: count > 0 ? 1 : 0.3,
                    position:'relative',
                  }}>
                    <PixelItemIcon type={key} size={32} />
                    <div style={{
                      fontFamily:'var(--font-pixel)', fontSize:9,
                      color: count > 0 ? '#a8d030' : 'rgba(255,255,255,0.2)',
                    }}>
                      ×{count}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setItemBagOpen(false)}
              style={{
                width:'100%', padding:'8px 0',
                background:'transparent',
                border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(255,255,255,0.4)',
                fontFamily:'var(--font-pixel)', fontSize:8,
                cursor:'pointer', letterSpacing:1,
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Boss unlock hint */}
      {screenId === 'BOSS' && !bossMapActive && (
        <div style={{
          position: 'absolute', top: HUD_CONTENT_H + 12, left: 0, right: 0, zIndex: 28,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(20,10,30,0.92)', border: '1px solid #604060',
            borderRadius: 10, padding: '8px 16px',
            fontFamily: 'Mitr,sans-serif', color: '#c080c0', fontSize: 12, textAlign: 'center',
          }}>
            🔒 เคลียร์ครบ 4 แมพ + XP {BOSS_XP_THRESHOLD} เพื่อต่อสู้บอส<br />
            ({clearedMaps.length}/4 แมพ · {totalXP}/{BOSS_XP_THRESHOLD} XP)
          </div>
        </div>
      )}
    </div>
  )
}
