import React from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { deriveCareMood } from '../egg/eggPoses.js'
import { detectFullSet } from '../lib/outfitSets.js'
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
  affinityLine,      // SPEC GAME-A §A.2 override; if omitted, reads from context
  mood = 'normal',
  anim = 'idle',
  width = 160,
  height = 190,
  equipped,          // optional override; if omitted, reads from state.equipped
  lowFx = false,     // SPEC GAME-A §A.3, optional — skip element aura particles
  careMood,          // SPEC GAME-A §A.3 override; if omitted, derived from state.eggCare
  auraTint,          // SPEC GAME-B §B.1 override; if omitted, derived from a full outfit set
  setPose,           // SPEC GAME-B §B.1 override; if omitted, derived from a full outfit set
  className,
  style,
  onClick,
}) {
  const { resolved } = useCompanion()
  const { state, affinityLine: contextAffinityLine, masteredCount } = useAppState()
  // Only affects the plain 'idle' anim (see getEggPose), so it's always safe
  // to pass — a caller mid-interaction/battle with a non-idle anim ignores it.
  const resolvedCareMood = careMood !== undefined ? careMood : deriveCareMood(state.eggCare)

  const resolvedStage = stage ?? stats?.stage ?? 1
  const resolvedEquipped = equipped !== undefined ? equipped : (state.equipped ?? null)
  // A zero-mastery account (brand-new, or a pre-curriculum account like
  // Chopin's real one) resolves to 'balanced' by computeAffinity()'s own tie
  // rule, but showing a prism badge for zero actual mastery would read as
  // unearned — so the visual layer only appears once at least one curriculum
  // node has genuinely been mastered.
  const resolvedAffinityLine = affinityLine !== undefined
    ? affinityLine
    : ((masteredCount || 0) > 0 ? contextAffinityLine : null)
  // SPEC GAME-B §B.1 — full outfit-set bonus (aura tint + exclusive pose),
  // auto-derived from the resolved equipped combo, same pattern as
  // affinityLine/careMood above. Purely cosmetic (fairness rule).
  const outfitSet = detectFullSet(resolvedEquipped)
  const resolvedAuraTint = auraTint !== undefined ? auraTint : (outfitSet?.tint ?? null)
  const resolvedSetPose = setPose !== undefined ? setPose : (outfitSet?.pose ?? null)
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
      affinityLine={resolvedAffinityLine}
      size={size}
      equipped={resolvedEquipped}
      lowFx={lowFx}
      careMood={resolvedCareMood}
      auraTint={resolvedAuraTint}
      setPose={resolvedSetPose}
      className={className}
      style={{ width, height, ...style }}
      onClick={onClick}
    />
  )
}
