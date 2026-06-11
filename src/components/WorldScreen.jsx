import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { SCREENS } from '../config/worldConfig.js'
import { playTone, playBGM, stopBGM, playSFX } from '../lib/audio.js'
import {
  MAP_ROWS, MAP_COLS, T,
  renderMap, renderPlayer, canMove, getCamera, getExitAt,
  EXIT_OPPOSITE, EXIT_DIR_NAME, getEntryPosition,
} from '../lib/tileEngine.js'
import { SCREEN_MAPS, SCREEN_ENEMIES } from '../lib/tileMaps.js'
import { drawEnemy } from '../lib/drawEnemy.js'
import { getBattleSubject, getBattleLevel } from '../lib/battleSubject.js'
import TreasureSlot from './TreasureSlot.jsx'

const TILE = 16 // px per tile (matches tileEngine TILE constant)

// ── Chest pixel art drawing ──────────────────────────────────────────────────

function drawChest(ctx, x, y, frame) {
  const s = TILE
  // Body
  ctx.fillStyle = '#8b5e3c'
  ctx.fillRect(x + 2, y + 5, s - 4, s - 7)
  // Lid
  ctx.fillStyle = '#a0713a'
  ctx.fillRect(x + 2, y + 2, s - 4, 5)
  // Gold trim on lid
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(x + 2, y + 6, s - 4, 1)
  // Gold lock
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(x + Math.floor(s / 2) - 1, y + 7, 3, 3)
  // Sparkle — alternates every 30 frames
  ctx.fillStyle = frame % 60 < 30 ? 'rgba(255,255,255,0.9)' : 'rgba(255,215,0,0.5)'
  ctx.fillRect(x + Math.floor(s / 2) - 1, y - 2, 2, 2)
}

// ── Chest spawning ────────────────────────────────────────────────────────────

function spawnChests(screenId) {
  const mapData = SCREEN_MAPS[screenId]
  if (!mapData) return []
  const map = mapData.map
  const enemyPositions = new Set((SCREEN_ENEMIES[screenId] || []).map(e => `${e.col},${e.row}`))
  const candidates = []
  for (let r = 2; r < map.length - 2; r++) {
    for (let c = 2; c < map[r].length - 2; c++) {
      const raw = map[r][c]
      const tileType = typeof raw === 'object' ? raw.type : raw
      if ((tileType === T.GRASS || tileType === T.FLOWER) && !enemyPositions.has(`${c},${r}`)) {
        candidates.push({ col: c, row: r })
      }
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const count = 2 + Math.floor(Math.random() * 2)
  return candidates.slice(0, count).map((pos, i) => ({
    col: pos.col, row: pos.row,
    id: `chest_${screenId}_${i}`,
    opened: false,
  }))
}

const STAGE_COLORS = ['#78c878','#58b878','#38a8c8','#5888e8','#8858e8','#d840d0','#e86040','#f0a830','#ffd040']

const OWL_LINES = [
  'สวัสดี โชแปง! ข้าคือ ศาสตราจารย์นกฮูก',
  'หญ้าสูงนั้น... อาจมีสัตว์ซ่อนอยู่นะ!',
]
const SIGN_LINES = [
  '→ ทาวน์สแควร์',
  '← ทุ่งดอกไม้',
  '↑ ยังไปไม่ได้...',
]

function findSpecials(tileMap) {
  const npcs = [], signs = []
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const raw = tileMap[r]?.[c]
      const type = typeof raw === 'object' ? raw.type : raw
      if (type === T.NPC)  npcs.push({ col: c, row: r, data: raw })
      if (type === T.SIGN) signs.push({ col: c, row: r })
    }
  }
  return { npcs, signs }
}

const DPAD_BTN = (pos) => ({
  position: 'absolute', width: 56, height: 56, borderRadius: 12,
  background: 'rgba(255,255,255,0.13)', border: '2px solid rgba(255,255,255,0.28)',
  color: 'rgba(255,255,255,0.88)', fontSize: 22, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  userSelect: 'none', fontFamily: 'system-ui,sans-serif',
  ...pos,
})

export default function WorldScreen({ navigate }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    playBGM('world')
    return () => stopBGM()
  }, [])
  const canvasRef = useRef(null)

  const [viewSize, setViewSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [screenId, setScreenId] = useState(state.currentScreen || 'BM')
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
  const rafRef       = useRef(null)
  const transTimer   = useRef(null)
  const enemiesRef   = useRef([]) // dynamic enemy runtime state
  const chestsRef    = useRef([]) // treasure chest runtime state
  const [slotMachineOpen, setSlotMachineOpen] = useState(false)

  screenIdRef.current   = screenId
  transRef.current      = transitioning
  dialogueRef.current   = dialogue

  const eggColor = STAGE_COLORS[eggStatsData?.stage ?? 0] || STAGE_COLORS[0]
  const eggColorRef = useRef(eggColor)
  eggColorRef.current = eggColor

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
    const mapData = SCREEN_MAPS[id] || SCREEN_MAPS.BM
    const tileMap = mapData.map
    const startPos = forcedStart || (fromExitType !== undefined
      ? getEntryPosition(tileMap, fromExitType)
      : mapData.start)

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
    const defs = SCREEN_ENEMIES[screenId] || []
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
      defeated:     false,
      respawnTimer: 0,
    }))
    chestsRef.current = spawnChests(screenId)
  }, [screenId]) // eslint-disable-line

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
    const targetId = SCREENS[sid]?.connects[dirName]
    if (!targetId) return

    playSFX('screen_enter')
    setTransitioning(true)
    setTransOverlay(1)

    transTimer.current = setTimeout(() => {
      setScreenId(targetId)
      dispatch({ type: ACTIONS.MOVE_SCREEN, payload: targetId })
      dispatch({ type: ACTIONS.DISCOVER_SCREEN, payload: targetId })
      initScreen(targetId, exitType)
      setTransOverlay(0)
      transTimer.current = setTimeout(() => setTransitioning(false), 170)
    }, 160)
  }, [dispatch, initScreen])

  // ── Player movement ──────────────────────────────────────────────────────────

  const triggerBattle = useCallback((enemy) => {
    const subject = getBattleSubject(stateRef.current.sessionLog, stateRef.current)
    const level   = getBattleLevel(subject, stateRef.current)
    enemiesRef.current = enemiesRef.current.map(e =>
      e.id === enemy.id ? { ...e, defeated: true, respawnTimer: 1800 } : e
    )
    setEncounterFlash(true)
    setTimeout(() => setEncounterFlash(false), 80)
    dispatch({ type: ACTIONS.ENTER_BATTLE_FROM_WORLD, payload: {
      position: { screen: screenIdRef.current, tileX: gameRef.current?.col ?? 0, tileY: gameRef.current?.row ?? 0 },
      enemy:    { type: enemy.type, subject, level },
    }})
    navigate('world-battle')
  }, [dispatch, navigate]) // eslint-disable-line

  const tryMove = useCallback((dCol, dRow, dir) => {
    const g = gameRef.current
    if (!g || g.moving || transRef.current || dialogueRef.current) return

    const tileMap = tileMapRef.current
    if (!tileMap) return

    g.dir = dir
    const newCol = g.col + dCol
    const newRow = g.row + dRow

    // Dynamic enemy collision
    const hitEnemy = enemiesRef.current.find(e =>
      !e.defeated && e.col === newCol && e.row === newRow
    )
    if (hitEnemy) {
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

  const openNPC  = () => { setDialogue({ lines: OWL_LINES,  index: 0 }); playSFX('npc_talk'); playTone('cardOpen') }
  const openSign = () => { setDialogue({ lines: SIGN_LINES, index: 0 }); playSFX('npc_talk'); playTone('cardOpen') }
  const advance  = () => {
    if (!dialogue) return
    if (dialogue.index < dialogue.lines.length - 1) setDialogue({ ...dialogue, index: dialogue.index + 1 })
    else setDialogue(null)
  }

  // ── rAF render loop ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let alive = true

    const DIRS4 = [[0,-1],[0,1],[-1,0],[1,0]]

    function updateEnemies(tileMap, frame) {
      enemiesRef.current = enemiesRef.current.map(e => {
        if (e.defeated) {
          const rt = e.respawnTimer - 1
          if (rt <= 0) return { ...e, defeated: false, respawnTimer: 0, timer: 0 }
          return { ...e, respawnTimer: rt }
        }

        let ne = { ...e, timer: e.timer + 1 }

        switch (e.type) {
          case 'sleepy_bunny': {
            // Proximity wake check
            const gc = gameRef.current
            if (gc && !ne.woken) {
              const dist = Math.abs(gc.col - ne.col) + Math.abs(gc.row - ne.row)
              if (dist <= 3) ne.woken = true
            }
            // Chase player when woken
            if (ne.woken && ne.timer >= 60 && gc) {
              ne.timer = 0
              const dc = Math.sign(gc.col - ne.col)
              const dr = Math.sign(gc.row - ne.row)
              const tryC = Math.abs(dc) >= Math.abs(dr)
              const nc1 = ne.col + (tryC ? dc : 0)
              const nr1 = ne.row + (tryC ? 0 : dr)
              const nc2 = ne.col + (tryC ? 0 : dc)
              const nr2 = ne.row + (tryC ? dr : 0)
              if (canMove(tileMap, nc1, nr1)) { ne.col = nc1; ne.row = nr1 }
              else if (canMove(tileMap, nc2, nr2)) { ne.col = nc2; ne.row = nr2 }
            }
            break
          }
          case 'bouncy_slime': {
            if (ne.timer >= 45) {
              ne.timer = 0
              const nr = ne.row + (ne.dir === 'up' ? -1 : 1)
              if (canMove(tileMap, ne.col, nr)) { ne.row = nr }
              else { ne.dir = ne.dir === 'up' ? 'down' : 'up' }
            }
            break
          }
          case 'fox_kit': {
            if (ne.timer >= 60) {
              ne.timer = 0
              const nc = ne.col + (ne.dir === 'right' ? 1 : -1)
              if (canMove(tileMap, nc, ne.row)) { ne.col = nc }
              else { ne.dir = ne.dir === 'right' ? 'left' : 'right' }
            }
            break
          }
          case 'egg_pawn': {
            if (ne.timer >= 60) {
              ne.timer = 0
              const nr = ne.row + (ne.dir === 'down' ? 1 : -1)
              if (canMove(tileMap, ne.col, nr)) { ne.row = nr }
              else { ne.dir = ne.dir === 'down' ? 'up' : 'down' }
            }
            break
          }
          case 'leaf_sprite':
          case 'mushroom_imp': {
            if (ne.timer >= 90) {
              ne.timer = 0
              ne.rngSeed = (ne.rngSeed * 31 + 7) % 97
              const d = DIRS4[ne.rngSeed % 4]
              const nc = ne.col + d[0]; const nr = ne.row + d[1]
              if (canMove(tileMap, nc, nr)) { ne.col = nc; ne.row = nr }
            }
            break
          }
          default: break
        }
        return ne
      })
    }

    function renderEnemies(ctx, camX, camY) {
      const spriteSize = TILE * 2 // 32px on world canvas
      enemiesRef.current.forEach(e => {
        if (e.defeated) return
        const px = Math.round((e.col + 0.5) * TILE - camX) - spriteSize / 2
        const py = Math.round((e.row + 0.5) * TILE - camY) - spriteSize / 2
        drawEnemy(ctx, e.type, spriteSize, px, py)
        if (e.type === 'sleepy_bunny' && e.woken) {
          const cx = px + spriteSize / 2
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${TILE}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText('!', cx, py - 2)
        }
      })
    }

    function renderChests(ctx, camX, camY, frame) {
      chestsRef.current.forEach(chest => {
        if (chest.opened) return
        const px = Math.round(chest.col * TILE - camX)
        const py = Math.round(chest.row * TILE - camY)
        drawChest(ctx, px, py, frame)
      })
    }

    function loop(now) {
      if (!alive) return
      rafRef.current = requestAnimationFrame(loop)

      const g = gameRef.current
      const tileMap = tileMapRef.current
      if (!g || !tileMap) return

      if (g.moving) {
        const t = Math.min(1, (now - g.moveStartTime) / 120)
        g.displayX = g.fromX + (g.col - g.fromX) * t
        g.displayY = g.fromY + (g.row - g.fromY) * t
        if (t >= 1) { g.displayX = g.col; g.displayY = g.row; g.moving = false }
      }

      g.frame = (g.frame + 1) % 120
      if (g.frame % 3 === 0) updateEnemies(tileMap, g.frame) // update at ~20fps

      const vw = canvas.width
      const vh = canvas.height
      const { camX, camY } = getCamera(g.displayX, g.displayY, vw, vh)
      ctx.clearRect(0, 0, vw, vh)
      renderMap(ctx, tileMap, null, null, camX, camY, g.frame)
      renderEnemies(ctx, camX, camY)
      renderChests(ctx, camX, camY, g.frame)
      renderPlayer(ctx, g.displayX, g.displayY, g.dir, g.walkFrame, eggColorRef.current, camX, camY)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, []) // stable — reads from refs only

  // ── Go home ──────────────────────────────────────────────────────────────────

  const goHome = () => { dispatch({ type: ACTIONS.EXIT_WORLD }); navigate('home') }

  // ── Treasure reward ──────────────────────────────────────────────────────────

  function handleTreasureReward(reward) {
    for (let i = 0; i < reward.qty; i++) {
      dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: reward.type } })
    }
    playSFX('stage_up')
  }

  const screenLabel = SCREENS[screenId]?.label || ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a1a0a' }}>

      {/* Canvas — fills full viewport */}
      <canvas
        ref={canvasRef}
        width={viewSize.w}
        height={viewSize.h}
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
      />

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

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
      }}>
        <button onClick={goHome} style={{
          background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: 20,
          padding: '5px 14px', fontFamily: 'Mitr,sans-serif', fontWeight: 700,
          fontSize: 13, color: '#2d5a1b', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          WebkitTapHighlightColor: 'transparent',
        }}>🏠 กลับบ้าน</button>
        <div style={{
          background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '3px 10px',
          fontFamily: 'Mitr,sans-serif', fontWeight: 700, fontSize: 11, color: '#fff',
        }}>{screenLabel}</div>
      </div>

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
    </div>
  )
}
