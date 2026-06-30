import React, { useRef, useEffect } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import { ROOM_ITEMS } from '../lib/roomItems.js'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { playSFX } from '../lib/audio.js'

const COLS = 4, ROWS = 3
const SLOT_SIZE = 64, GAP = 8
const GRID_W = COLS * SLOT_SIZE + (COLS - 1) * GAP
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
export default function DecoratedRoom({ style }) {
  const { state, eggStatsData } = useAppState()
  const { resolved: companion } = useCompanion()

  const roomLayoutRef = useRef(state.roomLayout ?? {})

  const containerRef    = useRef(null)
  const canvasRef       = useRef(null)
  const rafRef          = useRef(null)
  const spriteOffRef    = useRef(null)
  const companionRef    = useRef({ element: 'fire', eye: 'gba', gender: 'male', stage: 1, aura: 0 })
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
    }
  }, [companion?.element, companion?.eye, companion?.gender, eggStatsData?.stage])

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

    const WALL_FRAC = 0.65
    const wallH     = Math.floor(H * WALL_FRAC)
    const GRID_TOP  = Math.max(12, Math.floor(H * 0.04))
    const gridLeft  = (W - GRID_W) / 2
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
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0,           '#F2E8D8')
      grad.addColorStop(WALL_FRAC - 0.001, '#F2E8D8')
      grad.addColorStop(WALL_FRAC,  '#8B6340')
      grad.addColorStop(1,           '#8B6340')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Baseboard
      ctx.fillStyle = '#C09060'
      ctx.fillRect(0, wallH, W, 6)

      // Floor grain
      ctx.fillStyle = 'rgba(0,0,0,0.045)'
      for (let x = 0; x < W; x += 40) {
        ctx.fillRect(x, wallH + 7, 1, H - wallH - 7)
      }

      // Furniture
      const layout = roomLayoutRef.current
      for (const [idxStr, itemId] of Object.entries(layout)) {
        const idx = parseInt(idxStr)
        if (isNaN(idx)) continue
        const col = idx % COLS
        const row = Math.floor(idx / COLS)
        const cx  = gridLeft + col * (SLOT_SIZE + GAP) + SLOT_SIZE / 2
        const cy  = GRID_TOP + row * (SLOT_SIZE + GAP) + SLOT_SIZE / 2
        const item = ROOM_ITEMS.find(i => i.id === itemId)
        if (item) {
          ctx.save()
          item.draw(ctx, cx, cy, SLOT_SIZE * 0.80)
          ctx.restore()
        }
      }

      // Empty-room hint
      if (Object.keys(layout).length === 0) {
        ctx.fillStyle = 'rgba(139,99,64,0.55)'
        ctx.font      = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('แต่งห้องได้ที่เมนู ห้อง', W / 2, wallH - 18)
        ctx.textAlign = 'left'
      }
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
      spriteCtx.clearRect(0, 0, SIZE, SIZE)
      renderEggSprite(spriteCtx, { ...companionRef.current, t: tSec, canvasSize: SIZE, basePxOverride: 2 })

      ctx.clearRect(0, 0, W, H)
      drawScene()
      updateEntity()
      drawEntity(tSec)
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
