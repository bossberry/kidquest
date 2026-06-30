import React from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import { useAppState } from '../context/StateContext.jsx'

/**
 * App-level EggCanvas wrapper.
 * Reads eye/gender/element from CompanionContext (permanent companion attributes).
 * Accepts legacy `stats` prop (extracts stage), or explicit `stage` prop.
 * All other styling props are passed through to the underlying canvas.
 */
export default function EggCanvas({
  stats,             // legacy { stage, ... }
  stage,             // explicit override
  aura = 0,
  mood = 'normal',
  anim = 'idle',
  width = 160,
  height = 190,
  equipped,          // optional override; if omitted, reads from state.equipped
  className,
  style,
  onClick,
}) {
  const { resolved } = useCompanion()
  const { state } = useAppState()

  const resolvedStage = stage ?? stats?.stage ?? 1
  const resolvedEquipped = equipped !== undefined ? equipped : (state.equipped ?? null)
  // Use the smaller dimension to drive basePx; set CSS to the requested width×height
  const size = Math.min(width, height)

  return (
    <EggCanvasCore
      element={resolved.element}
      eye={resolved.eye}
      gender={resolved.gender}
      mood={mood}
      anim={anim}
      stage={resolvedStage}
      aura={aura}
      size={size}
      equipped={resolvedEquipped}
      className={className}
      style={{ width, height, ...style }}
      onClick={onClick}
    />
  )
}
