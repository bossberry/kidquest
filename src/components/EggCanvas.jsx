import React, { useRef, useEffect } from 'react'
import { drawEgg } from '../lib/eggAlgorithm.js'

function pixelateCanvas(canvas, blockSize) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const tmp = document.createElement('canvas')
  tmp.width  = Math.max(1, Math.ceil(W / blockSize))
  tmp.height = Math.max(1, Math.ceil(H / blockSize))
  const tc = tmp.getContext('2d')
  tc.imageSmoothingEnabled = false
  tc.drawImage(canvas, 0, 0, tmp.width, tmp.height)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, W, H)
  ctx.drawImage(tmp, 0, 0, W, H)
}

export default function EggCanvas({ stats, width = 160, height = 190, className, style, onClick }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && stats) {
      drawEgg(ref.current, stats)
      pixelateCanvas(ref.current, 4)
    }
  }, [stats])
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className}
      style={style}
      onClick={onClick}
    />
  )
}
