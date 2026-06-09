import React, { useRef, useEffect } from 'react'
import { drawCreature } from '../lib/drawCreature.js'

// Renders a procedural creature from its DNA object.
// Same dna → same pixels every render.
// Legacy creatures (no dna) should not be passed here — use emoji instead.
export default function CreatureCanvas({ dna, size = 88, style = {}, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && dna) drawCreature(ref.current, dna)
  }, [dna])

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: 8, display: 'block', ...style }}
    />
  )
}
