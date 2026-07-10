import React, { useRef, useEffect } from 'react'
import { renderEggSprite } from './renderEggSprite.js'

/**
 * Animated Living Egg renderer — uses the finalized layer system.
 * Props: element, eye, gender, mood, anim, stage, aura, size (logical canvas width).
 * affinityLine (SPEC GAME-A §A.2, optional) — 'sage'|'architect'|'explorer'|'prism';
 * omit/null for no affinity tint or motif (fully backward compatible).
 * lowFx (SPEC GAME-A §A.3, optional) — true skips element aura particles.
 * Canvas height auto-computed as size * 1.19.
 *
 * SPEC GAME-A §A.3 consistency pass: this is a thin RAF/DPR wrapper around
 * renderEggSprite() — the same single painter every non-React canvas context
 * (world map, room scene, friends list, login backdrop) already uses, so the
 * egg renders identically everywhere it appears.
 */
export default function EggCanvas({
  element = 'fire',
  eye = 'gba',
  gender = 'male',
  mood = 'normal',
  anim = 'idle',
  stage = 1,
  aura = 0,
  affinityLine = null,
  size = 160,
  equipped = null,
  lowFx = false,
  careMood = null,
  className,
  style,
  onClick,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const DPR = window.devicePixelRatio || 1
    const logicalW = size
    const logicalH = Math.round(size * 1.19)

    canvas.width  = Math.round(logicalW * DPR)
    canvas.height = Math.round(logicalH * DPR)

    let raf
    const startTime = performance.now()

    function render() {
      const ctx = canvas.getContext('2d')
      const t = (performance.now() - startTime) / 1000

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.clearRect(0, 0, logicalW, logicalH)

      renderEggSprite(ctx, {
        element, eye, gender, stage, aura, affinityLine, mood, anim, t,
        canvasSize: size, equipped, lowFx, careMood,
      })

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(raf) }
  }, [element, eye, gender, mood, anim, stage, aura, affinityLine, size, equipped, lowFx, careMood])

  const logicalH = Math.round(size * 1.19)
  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: logicalH, imageRendering: 'pixelated', display: 'block', ...style }}
      className={className}
      onClick={onClick}
    />
  )
}
