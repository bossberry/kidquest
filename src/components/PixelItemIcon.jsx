import React, { useRef, useEffect } from 'react'

// 10×10 pixel grids: 0=transparent, 1=dark border, 2=main color, 3=highlight
const GRIDS = {
  scroll: [
    '1111111111',
    '1222222221',
    '1233333321',
    '1222222221',
    '1233333321',
    '1222222221',
    '1233333321',
    '1222222221',
    '1233333321',
    '1111111111',
  ],
  thunder: [
    '0011111000',
    '0012221000',
    '0001221000',
    '0012210000',
    '0122100000',
    '0121111100',
    '0012222100',
    '0001221000',
    '0000110000',
    '0000000000',
  ],
  gem: [
    '0001111000',
    '0012321000',
    '0123222100',
    '1232222210',
    '1222222210',
    '0122222100',
    '0012221000',
    '0001210000',
    '0000100000',
    '0000000000',
  ],
  mirror: [
    '0011111100',
    '0123333210',
    '1232222321',
    '1222222221',
    '1222222221',
    '0122222210',
    '0011111100',
    '0000110000',
    '0001221000',
    '0000110000',
  ],
  clover: [
    '0111001110',
    '1222112221',
    '1232112321',
    '1222112221',
    '0111001110',
    '0000110000',
    '0111001110',
    '1222112221',
    '1232112321',
    '1221112210',
  ],
}

// palette[0] unused (transparent), [1]=dark border, [2]=main, [3]=highlight
const PALETTES = {
  scroll:  ['', '#8a6000', '#e8c040', '#fff8a0'],
  thunder: ['', '#002266', '#66aaff', '#aaddff'],
  gem:     ['', '#660066', '#cc44cc', '#ffaaff'],
  mirror:  ['', '#006666', '#44cccc', '#aaffff'],
  clover:  ['', '#006600', '#44cc44', '#aaff88'],
}

const GRID_DIM = 10

export default function PixelItemIcon({ type, size = 20 }) {
  const canvasRef = useRef(null)
  const cell = Math.max(1, Math.floor(size / GRID_DIM))
  const actual = cell * GRID_DIM

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, actual, actual)
    const grid = GRIDS[type]
    const pal  = PALETTES[type]
    if (!grid || !pal) return
    for (let r = 0; r < GRID_DIM; r++) {
      for (let c = 0; c < GRID_DIM; c++) {
        const idx = parseInt(grid[r][c], 10)
        if (!idx) continue
        ctx.fillStyle = pal[idx]
        ctx.fillRect(c * cell, r * cell, cell, cell)
      }
    }
  }, [type, size]) // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      width={actual}
      height={actual}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}
