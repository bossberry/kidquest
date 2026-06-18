import React, { useEffect, useRef } from 'react'
import { drawEnemy, drawEnemyHurt } from '../../lib/drawEnemy.js'

export default function EnemyCanvas({ enemyType, size, hitFlash, enemyDefeating, enemyHurt }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (enemyHurt) {
      drawEnemyHurt(canvas.getContext('2d'), enemyType, size)
    } else {
      drawEnemy(canvas.getContext('2d'), enemyType, size)
    }
  }, [enemyType, size, enemyHurt])
  return (
    <canvas
      ref={canvasRef}
      width={size} height={size}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        filter: hitFlash ? 'brightness(10) saturate(0)' : enemyDefeating ? 'brightness(0.35)' : 'none',
        transform: enemyDefeating ? 'translateY(18px) rotate(-22deg)' : 'none',
        opacity: enemyDefeating ? 0 : 1,
        transition: enemyDefeating ? 'opacity 500ms ease, transform 500ms ease' : 'filter 80ms',
      }}
    />
  )
}
