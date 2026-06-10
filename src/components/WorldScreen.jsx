import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { SCREENS } from '../config/worldConfig.js'
import { playTone } from '../lib/audio.js'
import {
  MAP_ROWS, MAP_COLS, T,
  renderMap, renderPlayer, canMove, getCamera, getExitAt,
  EXIT_OPPOSITE, EXIT_DIR_NAME, getEntryPosition,
} from '../lib/tileEngine.js'
import { SCREEN_MAPS } from '../lib/tileMaps.js'

const STAGE_COLORS = ['#78c878','#58b878','#38a8c8','#5888e8','#8858e8','#d840d0','#e86040','#f0a830','#ffd040']

function getWeakestSubject(sessionLog) {
  if (!sessionLog?.length) return 'thai'
  const scores = { thai: [], math: [], eng: [] }
  ;(sessionLog || []).slice(-20).forEach(e => {
    if (scores[e.world]) scores[e.world].push(e.score || 0)
  })
  const avgs = Object.entries(scores)
    .filter(([, arr]) => arr.length > 0)
    .map(([s, arr]) => ({ s, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
  if (!avgs.length) return 'thai'
  return avgs.sort((a, b) => a.avg - b.avg)[0].s
}

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

  const tryMove = useCallback((dCol, dRow, dir) => {
    const g = gameRef.current
    if (!g || g.moving || transRef.current || dialogueRef.current) return

    const tileMap = tileMapRef.current
    if (!tileMap) return

    g.dir = dir
    const newCol = g.col + dCol
    const newRow = g.row + dRow

    // Detect ENEMY tile collision → trigger world battle
    const targetRaw  = tileMap[newRow]?.[newCol]
    const targetType = typeof targetRaw === 'object' ? targetRaw.type : targetRaw
    if (targetType === T.ENEMY) {
      const subject   = getWeakestSubject(stateRef.current.sessionLog)
      const level     = stateRef.current.subjectLevels?.[subject] || 1
      const enemyType = typeof targetRaw === 'object' ? (targetRaw.enemy_type || 'bunny') : 'bunny'
      dispatch({ type: ACTIONS.ENTER_BATTLE_FROM_WORLD, payload: {
        position: { screen: screenIdRef.current, tileX: g.col, tileY: g.row },
        enemy:    { type: enemyType, subject, level },
      }})
      navigate('world-battle')
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

    playTone('tap')

    const exitType = getExitAt(tileMap, newCol, newRow)
    if (exitType !== null) {
      setTimeout(() => handleExit(exitType), 80)
      return
    }

    const raw = tileMap[newRow]?.[newCol]
    const ttype = typeof raw === 'object' ? raw.type : raw
    if (ttype === T.TALL && Math.random() < 0.25) {
      playTone('open')
      setEncounterFlash(true)
      setTimeout(() => setEncounterFlash(false), 50)
      dispatch({ type: ACTIONS.ENCOUNTER_TRIGGERED })
    }

    checkProximity(newCol, newRow)
  }, [dispatch, handleExit, checkProximity, navigate])

  const moveUp    = useCallback(() => tryMove( 0, -1, 'up'),    [tryMove])
  const moveDown  = useCallback(() => tryMove( 0,  1, 'down'),  [tryMove])
  const moveLeft  = useCallback(() => tryMove(-1,  0, 'left'),  [tryMove])
  const moveRight = useCallback(() => tryMove( 1,  0, 'right'), [tryMove])

  // ── Dialogue ─────────────────────────────────────────────────────────────────

  const openNPC  = () => { setDialogue({ lines: OWL_LINES,  index: 0 }); playTone('cardOpen') }
  const openSign = () => { setDialogue({ lines: SIGN_LINES, index: 0 }); playTone('cardOpen') }
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

      const vw = canvas.width
      const vh = canvas.height
      const { camX, camY } = getCamera(g.displayX, g.displayY, vw, vh)
      ctx.clearRect(0, 0, vw, vh)
      renderMap(ctx, tileMap, null, null, camX, camY, g.frame)
      renderPlayer(ctx, g.displayX, g.displayY, g.dir, g.walkFrame, eggColorRef.current, camX, camY)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, []) // stable — reads from refs only

  // ── Go home ──────────────────────────────────────────────────────────────────

  const goHome = () => { dispatch({ type: ACTIONS.EXIT_WORLD }); navigate('home') }

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

      {/* D-pad — bottom left, overlays on canvas */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: 24,
        opacity: 0.75,
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
    </div>
  )
}
