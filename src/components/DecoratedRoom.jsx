import React, { useRef, useEffect } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import { drawRoomScene } from '../lib/roomScene.js'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { playSFX } from '../lib/audio.js'

const SIZE = 48

function makeEntity(W, groundY) {
  return {
    x: W * 0.5,
    y: groundY,
    dir: 1,
    speed: 0.45,
    walkFrame: 0,
    walkFrameTimer: 0,
    state: 'walk',
    stateTimer: 120 + Math.floor(Math.random() * 180),
    jumpY: 0,
    jumpVel: 0,
    spinAngle: 0,
  }
}

// Read-only decorated room: gradient background + placed furniture + walking companion.
// Used as background in Home (style={{ position:'absolute', inset:0, zIndex:-1 }})
// and as base visual in Room editor (style={{ position:'absolute', inset:0 }}).
// showWalker=false (Home, 2026-07-01 redesign) draws room art only — the large
// interactive EggCanvas is layered on top instead, so the tiny walker isn't
// duplicated/confusing next to it. Room.jsx doesn't pass this — defaults true.
export default function DecoratedRoom({ style, showWalker = true }) {
  const { state, eggStatsData } = useAppState()
  const { resolved: companion } = useCompanion()

  const roomLayoutRef = useRef(state.roomLayout ?? {})
  const showWalkerRef = useRef(showWalker)
  showWalkerRef.current = showWalker

  const containerRef    = useRef(null)
  const canvasRef       = useRef(null)
  const rafRef          = useRef(null)
  const spriteOffRef    = useRef(null)
  const companionRef    = useRef({ element: 'fire', eye: 'gba', gender: 'male', stage: 1, aura: 0, equipped: null })
  const entityRef       = useRef(null)
  const lastJumpRef     = useRef(0)

  // Keep roomLayout ref current (runs after every render; RAF reads from ref)
  useEffect(() => {
    roomLayoutRef.current = state.roomLayout ?? {}
  })

  // Keep companion ref current
  useEffect(() => {
    companionRef.current = {
      element: companion?.element ?? 'fire',
      eye:     companion?.eye     ?? 'gba',
      gender:  companion?.gender  ?? 'male',
      stage:   eggStatsData?.stage ?? 1,
      aura:    0,
      equipped: state.equipped ?? null,
    }
  }, [companion?.element, companion?.eye, companion?.gender, eggStatsData?.stage, state.equipped])

  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (!container || !canvas) return

    const W = container.clientWidth  || window.innerWidth
    const H = container.clientHeight || 380

    canvas.width  = W
    canvas.height = H

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    const groundY   = H - SIZE - 6

    if (!entityRef.current) entityRef.current = makeEntity(W, groundY)

    if (!spriteOffRef.current) {
      const sOff = document.createElement('canvas')
      sOff.width  = SIZE
      sOff.height = SIZE
      spriteOffRef.current = sOff
    }
    const spriteCtx = spriteOffRef.current.getContext('2d')
    spriteCtx.imageSmoothingEnabled = false

    function drawScene() {
      drawRoomScene(ctx, { W, H, roomLayout: roomLayoutRef.current, small: false })
    }

    function updateEntity() {
      const e = entityRef.current
      if (!e) return

      e.stateTimer--
      if (e.stateTimer <= 0) {
        const r = Math.random()
        if (r < 0.50) {
          e.state = 'walk'; e.stateTimer = 120 + Math.floor(Math.random() * 180)
        } else if (r < 0.70) {
          e.state = 'idle'; e.stateTimer = 60 + Math.floor(Math.random() * 60)
        } else if (r < 0.85) {
          e.state = 'jump'; e.jumpY = 0; e.jumpVel = -4; e.stateTimer = 120
          if (Date.now() - lastJumpRef.current > 800) {
            playSFX('footstep'); lastJumpRef.current = Date.now()
          }
        } else {
          e.state = 'spin'; e.spinAngle = 0; e.stateTimer = 60 + Math.floor(Math.random() * 60)
        }
      }

      if (e.state === 'walk' && Math.random() < 0.005) {
        e.state = 'jump'; e.jumpY = 0; e.jumpVel = -4; e.stateTimer = 120
        if (Date.now() - lastJumpRef.current > 800) {
          playSFX('footstep'); lastJumpRef.current = Date.now()
        }
      }

      switch (e.state) {
        case 'walk':
          e.x += e.dir * e.speed
          if (e.x < SIZE / 2 + 8) { e.x = SIZE / 2 + 8; e.dir = 1 }
          if (e.x > W - SIZE / 2 - 8) { e.x = W - SIZE / 2 - 8; e.dir = -1 }
          break
        case 'jump':
          e.jumpY  += e.jumpVel
          e.jumpVel += 0.3
          if (e.jumpY >= 0) {
            e.jumpY = 0; e.jumpVel = 0
            e.state = 'walk'; e.stateTimer = 120 + Math.floor(Math.random() * 180)
          }
          break
        case 'spin':
          e.spinAngle = (e.spinAngle ?? 0) + 0.15
          break
        default: break
      }

      e.walkFrameTimer = (e.walkFrameTimer ?? 0) + 1
      if (e.walkFrameTimer >= 20) {
        e.walkFrame = 1 - (e.walkFrame ?? 0)
        e.walkFrameTimer = 0
      }
    }

    function drawEntity(tSec) {
      const e   = entityRef.current
      const off = spriteOffRef.current
      if (!e || !off) return

      const bobOffset = e.state === 'idle' ? Math.floor(Math.sin(tSec * 3) * 2) : 0
      const drawY     = Math.floor(e.y + e.jumpY + bobOffset)

      ctx.save()
      if (e.state === 'spin') {
        ctx.translate(Math.floor(e.x), drawY + SIZE / 2)
        ctx.rotate(e.spinAngle)
        ctx.drawImage(off, -SIZE / 2, -SIZE / 2, SIZE, SIZE)
      } else if (e.dir < 0) {
        ctx.translate(Math.floor(e.x), 0)
        ctx.scale(-1, 1)
        ctx.drawImage(off, -SIZE / 2, drawY, SIZE, SIZE)
      } else {
        ctx.drawImage(off, Math.floor(e.x - SIZE / 2), drawY, SIZE, SIZE)
      }
      ctx.restore()
    }

    function frame() {
      const tSec = performance.now() / 1000
      ctx.clearRect(0, 0, W, H)
      drawScene()
      if (showWalkerRef.current) {
        spriteCtx.clearRect(0, 0, SIZE, SIZE)
        renderEggSprite(spriteCtx, { ...companionRef.current, t: tSec, canvasSize: SIZE, basePxOverride: 2 })
        updateEntity()
        drawEntity(tSec)
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ overflow: 'hidden', pointerEvents: 'none', ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </div>
  )
}
