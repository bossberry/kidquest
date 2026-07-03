import React, { useRef, useEffect } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import {
  drawRoomScene, computeRoomGeometry, hitTestZone, slotCenter,
  FLOOR_COLS, FLOOR_ROWS,
} from '../lib/roomScene.js'
import { renderEggSprite } from '../egg/renderEggSprite.js'
import { playSFX } from '../lib/audio.js'

// ── DecoratedRoom — Home's exclusive interactive iso room ─────────────────────
// Renders the full isometric room (via drawRoomScene) at the container's size and
// walks the companion egg around the FLOOR using real iso tile-space targets.
//
// The egg is the interactive element:
//   • tap NEAR the egg  → onPetTap(event)  (Home routes to pet / bond / hatch / item-use)
//   • tap ELSEWHERE on the floor → egg walks there (hitTestZone + slotCenter), bounces, chirps
//   • apiRef.walkToScreen(x,y) → command the egg to an arbitrary screen point (item buttons)
//
// Live walker position is published two ways every frame:
//   • walkerPosRef.current = { x, y }               (read on demand, e.g. for hit-tests)
//   • followRef.current.style.transform = translate  (a DOM overlay layer that follows the egg —
//                                                      reaction emoji / heal float / particles)
//
// This is the ONLY component that imports DecoratedRoom (Home.jsx). RoomScene.jsx /
// RoomVisit.jsx / the FriendsScreen thumbnail use the separate RoomScene component.

const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const rand = n => Math.floor(Math.random() * n)

// Clamp a screen point to the visible floor diamond (keeps the egg off the walls)
function clampToFloorG(g, x, y) {
  if (!g) return { x, y }
  const topY   = g.project(0, 0, 0).sy
  const botY   = g.project(FLOOR_COLS, FLOOR_ROWS, 0).sy
  const leftX  = g.project(0, FLOOR_ROWS, 0).sx
  const rightX = g.project(FLOOR_COLS, 0, 0).sx
  return {
    x: Math.max(leftX, Math.min(rightX, x)),
    y: Math.max(topY + (botY - topY) * 0.18, Math.min(botY, y)),
  }
}

function makeEntity(fx, fy) {
  return {
    fx, fy, tx: fx, ty: fy, startX: fx, startY: fy,
    state: 'idle', stateTimer: 60,
    walkStart: 0, walkDur: 0, commanded: false, silent: false,
    facing: 1, jumpY: 0, jumpVel: 0, spinAngle: 0, bounceStart: 0,
  }
}

export default function DecoratedRoom({
  style, showWalker = true,
  apiRef, followRef, walkerPosRef,
  onPetTap, onSwipe,
  anim = 'idle', mood = 'normal',
}) {
  const { state, eggStatsData } = useAppState()
  const { resolved: companion } = useCompanion()

  const roomLayoutRef = useRef(state.roomLayout ?? {})
  const showWalkerRef = useRef(showWalker)
  showWalkerRef.current = showWalker

  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const rafRef       = useRef(null)
  const spriteOffRef = useRef(null)
  const companionRef = useRef({ element: 'fire', eye: 'gba', gender: 'male', stage: 1, aura: 0, equipped: null })
  const spriteStateRef = useRef({ anim: 'idle', mood: 'normal' })
  const entityRef    = useRef(null)
  const lastJumpRef  = useRef(0)
  const geomRef      = useRef(null)   // { g, W, H, SIZE }

  // Latest callbacks (the rAF/handlers are wired once, so read through refs)
  const onPetTapRef = useRef(onPetTap); onPetTapRef.current = onPetTap
  const onSwipeRef  = useRef(onSwipe);  onSwipeRef.current  = onSwipe

  // Keep refs current for the rAF loop (which lives outside React's render cycle)
  useEffect(() => { roomLayoutRef.current = state.roomLayout ?? {} })
  useEffect(() => { spriteStateRef.current = { anim, mood } }, [anim, mood])

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

  // ── Canvas sizing (ResizeObserver — flex sizing doesn't fire window resize) ──
  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (!container || !canvas) return

    const applySize = (W, H) => {
      if (W <= 0 || H <= 0) return
      if (canvas.width !== W)  canvas.width = W
      if (canvas.height !== H) canvas.height = H
      const g = computeRoomGeometry(W, H, false)
      const SIZE = Math.max(44, Math.min(96, Math.round(g.TW * 0.72)))
      geomRef.current = { g, W, H, SIZE }

      // (re)create the offscreen egg sprite sized to SIZE (height = SIZE * 1.19)
      const spriteH = Math.round(SIZE * 1.19)
      if (!spriteOffRef.current || spriteOffRef.current.width !== SIZE || spriteOffRef.current.height !== spriteH) {
        const sOff = document.createElement('canvas')
        sOff.width = SIZE; sOff.height = spriteH
        spriteOffRef.current = sOff
      }

      // place / clamp the walker onto the floor
      if (!entityRef.current) {
        const p = g.project(FLOOR_COLS / 2, FLOOR_ROWS / 2, 0)
        entityRef.current = makeEntity(p.sx, p.sy)
      } else {
        const e = entityRef.current
        const c = clampToFloorG(g, e.fx, e.fy)
        e.fx = c.x; e.fy = c.y; e.tx = c.x; e.ty = c.y
        e.state = 'idle'; e.stateTimer = 40
      }
    }

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        applySize(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height))
      }
    })
    ro.observe(container)
    // seed immediately so the first frames have geometry
    applySize(container.clientWidth || window.innerWidth, container.clientHeight || 380)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Movement + render loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    const clampToFloor = (x, y) => clampToFloorG(geomRef.current?.g, x, y)

    function startWalk(tx, ty, opts = {}) {
      const e = entityRef.current
      if (!e) return
      e.startX = e.fx; e.startY = e.fy; e.tx = tx; e.ty = ty
      const dist = Math.hypot(tx - e.fx, ty - e.fy)
      e.walkStart = performance.now()
      e.walkDur   = opts.commanded ? Math.min(700, Math.max(280, dist * 1.6)) : Math.max(650, dist * 4.2)
      e.commanded = !!opts.commanded
      e.silent    = !!opts.silent
      e.facing    = tx >= e.fx ? 1 : -1
      e.state     = 'walk'
    }

    function pickWander() {
      const g = geomRef.current?.g
      if (!g) return
      const gx = 0.5 + Math.random() * (FLOOR_COLS - 1)
      const gy = 0.5 + Math.random() * (FLOOR_ROWS - 1)
      const p = g.project(gx, gy, 0)
      startWalk(p.sx, p.sy, {})
    }

    function nextIdleDecision(now) {
      const e = entityRef.current
      const r = Math.random()
      if (r < 0.60) { pickWander() }
      else if (r < 0.80) { e.state = 'idle'; e.stateTimer = 60 + rand(70) }   // stop & look around
      else if (r < 0.92) {
        e.state = 'jump'; e.jumpY = 0; e.jumpVel = -6
        if (now - lastJumpRef.current > 800) { playSFX('footstep'); lastJumpRef.current = now }
      } else { e.state = 'spin'; e.spinAngle = 0; e.stateTimer = 45 + rand(45) }
    }

    function arrive(now) {
      const e = entityRef.current
      e.fx = e.tx; e.fy = e.ty
      if (e.commanded) {
        if (!e.silent) playSFX('egg_pet')
        e.bounceStart = now
        e.commanded = false
        e.state = 'idle'; e.stateTimer = 150 + rand(90)
      } else {
        e.state = 'idle'; e.stateTimer = 50 + rand(90)
      }
    }

    function update(now) {
      const e = entityRef.current
      if (!e) return
      switch (e.state) {
        case 'walk': {
          const el = e.walkDur > 0 ? Math.min(1, (now - e.walkStart) / e.walkDur) : 1
          const k  = easeInOut(el)
          e.fx = e.startX + (e.tx - e.startX) * k
          e.fy = e.startY + (e.ty - e.startY) * k
          if (el >= 1) arrive(now)
          break
        }
        case 'idle':
          e.stateTimer--
          if (e.stateTimer <= 0) nextIdleDecision(now)
          break
        case 'jump':
          e.jumpY += e.jumpVel; e.jumpVel += 0.6
          if (e.jumpY >= 0) { e.jumpY = 0; e.jumpVel = 0; e.state = 'idle'; e.stateTimer = 25 + rand(40) }
          break
        case 'spin':
          e.spinAngle += 0.18; e.stateTimer--
          if (e.stateTimer <= 0) { e.spinAngle = 0; e.state = 'idle'; e.stateTimer = 25 + rand(40) }
          break
        default: break
      }
    }

    function drawEntity(now) {
      const e = entityRef.current, off = spriteOffRef.current, geom = geomRef.current
      if (!e || !off || !geom) return
      const { SIZE } = geom
      const spriteH = Math.round(SIZE * 1.19)

      let scale = 1
      if (e.bounceStart) {
        const bt = (now - e.bounceStart) / 300
        if (bt < 1) scale = bt < 0.4 ? 1 + (bt / 0.4) * 0.2 : 1.2 - ((bt - 0.4) / 0.6) * 0.2
        else e.bounceStart = 0
      }
      const bob = e.state === 'walk' ? -Math.abs(Math.sin(now / 90)) * 2
                : e.state === 'idle' ? Math.sin(now / 360) * 1.5 : 0
      const destY = -spriteH * 0.83 + bob + (e.jumpY || 0)

      ctx.save()
      ctx.translate(Math.round(e.fx), Math.round(e.fy))
      if (e.state === 'spin') {
        ctx.translate(0, -spriteH * 0.35)
        ctx.rotate(e.spinAngle)
        ctx.translate(0, spriteH * 0.35)
      }
      if (scale !== 1) ctx.scale(scale, scale)
      if (e.facing < 0 && e.state !== 'spin') ctx.scale(-1, 1)
      ctx.drawImage(off, -SIZE / 2, destY, SIZE, spriteH)
      ctx.restore()
    }

    // Imperative command surface for the parent (item buttons walk the egg over)
    if (apiRef) {
      apiRef.current = {
        walkToScreen(x, y) {
          if (!geomRef.current?.g) return
          const c = clampToFloor(x, y)
          startWalk(c.x, c.y, { commanded: true, silent: true })
        },
      }
    }

    // Tap handling — canvas only receives taps NOT covered by the floating DOM
    // buttons / header (those are separate absolutely-positioned elements on top).
    function onCanvasTap(ev) {
      const geom = geomRef.current
      if (!geom?.g) return
      const rect = canvas.getBoundingClientRect()
      const cx = ev.clientX, cy = ev.clientY
      if (cx == null || cy == null) return
      const px = (cx - rect.left) * (canvas.width / rect.width)
      const py = (cy - rect.top)  * (canvas.height / rect.height)
      const e = entityRef.current
      const near = e && Math.hypot(px - e.fx, py - (e.fy - geom.SIZE * 0.5)) < Math.max(48, geom.SIZE * 0.95)
      if (near) { onPetTapRef.current?.(ev); return }
      const hit = hitTestZone(geom.g, px, py, 'floor')
      if (hit) {
        const c = slotCenter(geom.g, 'floor', hit.a, hit.b)
        startWalk(c.sx, c.sy, { commanded: true })
      }
    }
    function onCanvasTouchMove(ev) { onSwipeRef.current?.(ev) }

    canvas.addEventListener('click', onCanvasTap)
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: true })

    function frame() {
      const geom = geomRef.current
      if (geom) {
        const { W, H, SIZE } = geom
        ctx.imageSmoothingEnabled = false   // canvas.width changes (resize) reset this
        ctx.clearRect(0, 0, W, H)
        drawRoomScene(ctx, { W, H, roomLayout: roomLayoutRef.current, small: false, hint: false })

        if (showWalkerRef.current && entityRef.current && spriteOffRef.current) {
          const now = performance.now()
          const tSec = now / 1000
          const spriteCtx = spriteOffRef.current.getContext('2d')
          spriteCtx.imageSmoothingEnabled = false
          spriteCtx.clearRect(0, 0, spriteOffRef.current.width, spriteOffRef.current.height)
          renderEggSprite(spriteCtx, {
            ...companionRef.current,
            anim: spriteStateRef.current.anim,
            mood: spriteStateRef.current.mood,
            t: tSec, canvasSize: SIZE, basePxOverride: SIZE >= 66 ? 3 : 2,
          })
          update(now)
          drawEntity(now)

          const e = entityRef.current
          if (walkerPosRef) walkerPosRef.current = { x: e.fx, y: e.fy }
          if (followRef?.current) {
            followRef.current.style.transform = `translate(${e.fx}px, ${e.fy - SIZE * 0.55}px)`
          }
        }
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('click', onCanvasTap)
      canvas.removeEventListener('touchmove', onCanvasTouchMove)
      if (apiRef) apiRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', ...style }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block', width: '100%', height: '100%',
          imageRendering: 'pixelated', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    </div>
  )
}
