import React, { useRef, useEffect } from 'react'

// ── CosmeticIcon: the cosmetic item alone, no egg body/eyes underneath ─────
// Each COSMETIC_ITEMS entry's own draw(ctx, {px, ox, oy, faceX, t}) fn draws
// ONLY the hat/glasses/outfit/etc — it never touches the egg body itself, so
// calling it directly (skipping the rest of the egg render pipeline) is all
// that's needed for an icon-only preview. Coordinate convention is documented
// at the top of eggCosmeticLayer.js: a baby egg is an 18x18 "cell" grid,
// faceX=9 is the horizontal center. head items draw above y=0 (up to y≈-10
// for tall hats), face items around y≈7-13, SPEC GAME-B §B.1 body items
// y≈9-16, back items extend further (angel_wings up to y≈4, mini_rocket down
// to y≈14) — the frame below (-10..+17) covers all 4 slot types with margin.
// Extracted from Collection.jsx (2026-07-10, SPEC GAME-B §B.1) so Room.jsx's
// craft sheet can reuse it for the 2 new craft-only cosmetic recipes, which
// need this draw signature — incompatible with Room.jsx's own SlotCanvas
// (ROOM_ITEMS' `draw(ctx,cx,cy,sz)` shape).
export default function CosmeticIcon({ item, size = 76 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !item) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    const usableH = size * 0.85
    const padTop  = size * 0.075
    const cellPx  = usableH / 27   // content spans y -10..+17 (27 units) + margin
    const ox = size / 2 - 9 * cellPx
    const oy = padTop + 10 * cellPx
    item.draw(ctx, { px: cellPx, ox, oy, faceX: 9, t: 0 })
  }, [item, size])
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  )
}
