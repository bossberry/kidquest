import React, { useRef, useEffect } from 'react'
import { drawEgg } from '../lib/eggAlgorithm.js'

export default function EggCanvas({ stats, width = 160, height = 190, className, style, onClick }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && stats) drawEgg(ref.current, stats)
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
