import React, { useEffect, useRef } from 'react'
import { drawEnemyPandora } from '../../lib/drawEnemy.js'

// Virtual design-space the Pandora sprite functions are tuned for (ground-contact
// anchor + upward silhouette, same convention as the world map's Y-sort renderer).
// Sized/positioned so every enemy type's tallest reach (bunny ears) and widest
// low-alpha spread (ghost wisp's ambient halo) both stay clear of the canvas edge.
const V = 70
const V_CX = 35
const V_GROUND = 41

export default function EnemyCanvas({ enemyType, size, hitFlash, enemyDefeating, enemyHurt }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.scale(size / V, size / V)
    drawEnemyPandora(ctx, enemyType, V_CX, V_GROUND, 0)
    ctx.restore()
  }, [enemyType, size, enemyHurt])
  return (
    <canvas
      ref={canvasRef}
      width={size} height={size}
      style={{
        display: 'block',
        filter: hitFlash ? 'brightness(10) saturate(0)' : enemyDefeating ? 'brightness(0.35)' : 'none',
        transform: enemyDefeating ? 'translateY(18px) rotate(-22deg)' : 'none',
        opacity: enemyDefeating ? 0 : 1,
        transition: enemyDefeating ? 'opacity 500ms ease, transform 500ms ease' : 'filter 80ms',
      }}
    />
  )
}
