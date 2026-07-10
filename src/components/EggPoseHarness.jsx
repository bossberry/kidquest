import React, { useState } from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { EGG_POSES } from '../egg/eggPoses.js'

/**
 * Dev-only visual harness for SPEC GAME-A §A.3 (poses / mood idle / rim
 * light / element aura particles). Same pattern as SpeechTestHarness.jsx —
 * never linked from the normal UI, opened directly via ?eggharness=1. Lets
 * this be verified live without the Supabase login gate blocking the way
 * §A.1/§A.2's live checks did.
 */
const ELEMENTS = ['fire', 'water', 'thunder', 'nature', 'shadow', 'light']

export default function EggPoseHarness() {
  const [aura, setAura] = useState(3)
  const [stage, setStage] = useState(7)
  const [lowFx, setLowFx] = useState(false)

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', background: '#1a1a1a', color: '#eee', minHeight: '100vh' }}>
      <h2 style={{ fontSize: 14 }}>Egg Pose / Aura Harness — §A.3</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
        <label>aura <input type="range" min={0} max={4} value={aura} onChange={e => setAura(+e.target.value)} /> {aura}</label>
        <label>stage <input type="range" min={1} max={9} value={stage} onChange={e => setStage(+e.target.value)} /> {stage}</label>
        <label><input type="checkbox" checked={lowFx} onChange={e => setLowFx(e.target.checked)} /> lowFx</label>
      </div>

      <h3 style={{ fontSize: 12 }}>14 poses (fire, stage {stage})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 24 }}>
        {EGG_POSES.map(pose => (
          <div key={pose} style={{ textAlign: 'center', background: '#242424', borderRadius: 8, padding: 4 }}>
            <EggCanvasCore element="fire" eye="gba" gender="male" stage={stage} aura={0} mood="normal" anim={pose} size={72} lowFx={lowFx} />
            <div style={{ fontSize: 9 }}>{pose}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>Element aura particles (idle, aura {aura})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 24 }}>
        {ELEMENTS.map(el => (
          <div key={el} style={{ textAlign: 'center', background: '#242424', borderRadius: 8, padding: 4 }}>
            <EggCanvasCore element={el} eye="gba" gender="male" stage={stage} aura={aura} mood="normal" anim="idle" size={96} lowFx={lowFx} />
            <div style={{ fontSize: 9 }}>{el}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>Rim light close-up (all 6 elements, idle, aura 0)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {ELEMENTS.map(el => (
          <div key={el} style={{ textAlign: 'center', background: '#000', borderRadius: 8, padding: 4 }}>
            <EggCanvasCore element={el} eye="gba" gender="male" stage={stage} aura={0} mood="normal" anim="idle" size={160} />
            <div style={{ fontSize: 9 }}>{el}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
