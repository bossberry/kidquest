import React, { useRef, useEffect } from 'react'
import { drawRoomScene } from '../lib/roomScene.js'
import { renderEggSprite } from '../egg/renderEggSprite.js'

/**
 * RoomScene — presentational canvas that paints a room background (via the shared
 * drawRoomScene helper) and, optionally, a companion egg standing in the room.
 *
 * Decoupled from local player state: pass an explicit `egg` object so a visited
 * friend's / bot's egg + cosmetics can be shown (NOT the local companion).
 *
 * Props:
 *   roomLayout — { [slotIndex]: itemId }   (undefined/{} → undecorated room)
 *   width, height — canvas logical size in px
 *   small      — compact thumbnail scaling (skips the Thai hint text)
 *   egg        — optional { element, eye, gender, stage, aura, equipped }.
 *                When present, drawn standing on the room floor via renderEggSprite.
 *                When null, only the room is drawn (caller overlays its own egg).
 *   spriteSize — logical width of the in-room egg sprite (default derives from width)
 *   style      — passthrough style for the <canvas>
 */
export default function RoomScene({
  roomLayout,
  width,
  height,
  small = false,
  egg = null,
  spriteSize,
  theme = 'default',
  style,
}) {
  const canvasRef  = useRef(null)
  const layoutRef  = useRef(roomLayout)
  const eggRef     = useRef(egg)
  const themeRef   = useRef(theme)
  const spriteOff  = useRef(null)

  layoutRef.current = roomLayout
  eggRef.current    = egg
  themeRef.current  = theme

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const DPR = window.devicePixelRatio || 1
    canvas.width  = Math.round(width * DPR)
    canvas.height = Math.round(height * DPR)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    const S = spriteSize ?? (small ? Math.round(width * 0.62) : Math.round(width * 0.30))
    const spriteH = Math.round(S * 1.19)

    if (eggRef.current && !spriteOff.current) {
      const off = document.createElement('canvas')
      off.width = S; off.height = spriteH
      spriteOff.current = off
    }

    let raf
    function frame() {
      const t = performance.now() / 1000
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.clearRect(0, 0, width, height)
      drawRoomScene(ctx, { W: width, H: height, roomLayout: layoutRef.current, small, hint: false, theme: themeRef.current })

      const e = eggRef.current
      if (e && spriteOff.current) {
        const off = spriteOff.current
        const sctx = off.getContext('2d')
        sctx.setTransform(1, 0, 0, 1, 0, 0)
        sctx.clearRect(0, 0, S, spriteH)
        renderEggSprite(sctx, {
          element: e.element ?? 'fire',
          eye:     e.eye     ?? 'gba',
          gender:  e.gender  ?? 'male',
          stage:   e.stage   ?? 1,
          aura:    e.aura    ?? 0,
          anim:    'idle',
          t,
          canvasSize: S,
          equipped: e.equipped ?? null,
        })
        // Stand the egg on the floor, horizontally centered.
        const groundInSprite = spriteH * 0.83
        const drawX = (width - S) / 2
        const drawY = height - (small ? 5 : 10) - groundInSprite
        ctx.drawImage(off, drawX, drawY, S, spriteH)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, small, spriteSize, !!egg])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block', imageRendering: 'pixelated', ...style }}
    />
  )
}
