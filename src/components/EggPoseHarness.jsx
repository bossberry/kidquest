import React, { useState } from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { EGG_POSES } from '../egg/eggPoses.js'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'
import { OUTFIT_SETS, detectFullSet } from '../lib/outfitSets.js'

/**
 * Dev-only visual harness for SPEC GAME-A §A.3 (poses / mood idle / rim
 * light / element aura particles) AND SPEC GAME-B §B.1 (20 new body/back
 * cosmetics + 6 outfit sets). Same pattern as SpeechTestHarness.jsx — never
 * linked from the normal UI, opened directly via ?eggharness=1. Lets this be
 * verified live without the Supabase login gate blocking the way every
 * prior SPEC session's live checks did.
 */
const ELEMENTS = ['fire', 'water', 'thunder', 'nature', 'shadow', 'light']
const BODY_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'body')
const BACK_ITEMS = COSMETIC_ITEMS.filter(i => i.slot === 'back')

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 24 }}>
        {ELEMENTS.map(el => (
          <div key={el} style={{ textAlign: 'center', background: '#000', borderRadius: 8, padding: 4 }}>
            <EggCanvasCore element={el} eye="gba" gender="male" stage={stage} aura={0} mood="normal" anim="idle" size={160} />
            <div style={{ fontSize: 9 }}>{el}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>SPEC GAME-B §B.1 — 12 body items (fire, stage {stage})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 24 }}>
        {BODY_ITEMS.map(item => (
          <div key={item.id} style={{ textAlign: 'center', background: '#242424', borderRadius: 8, padding: 4 }}>
            <EggCanvasCore element="fire" eye="gba" gender="male" stage={stage} aura={0} mood="normal" anim="idle" size={80}
              equipped={{ body: item.id }} />
            <div style={{ fontSize: 8 }}>{item.id}{item.acquirable ? ` (${item.acquirable})` : ''}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>SPEC GAME-B §B.1 — 8 back items (fire, stage {stage})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 24 }}>
        {BACK_ITEMS.map(item => (
          <div key={item.id} style={{ textAlign: 'center', background: '#242424', borderRadius: 8, padding: 4 }}>
            <EggCanvasCore element="fire" eye="gba" gender="male" stage={stage} aura={0} mood="normal" anim="idle" size={80}
              equipped={{ back: item.id }} />
            <div style={{ fontSize: 8 }}>{item.id}{item.acquirable ? ` (${item.acquirable})` : ''}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>SPEC GAME-B §B.1 — 6 outfit sets (idle pose held for 1s to see tint/pose lock)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {OUTFIT_SETS.map(set => {
          const equipped = { [set.existingSlot]: set.existingId, body: set.bodyId, back: set.backId }
          const detected = detectFullSet(equipped)
          return (
            <div key={set.id} style={{ textAlign: 'center', background: '#242424', borderRadius: 8, padding: 4 }}>
              <EggCanvasCore element="fire" eye="gba" gender="male" stage={stage} aura={0} mood="normal" anim="idle" size={90}
                equipped={equipped} auraTint={set.tint} setPose={set.pose} />
              <div style={{ fontSize: 8, color: detected ? '#7dffa0' : '#ff7d7d' }}>
                {set.nameTh} {detected ? '✓ detected' : '✗ NOT detected'}
              </div>
              <div style={{ fontSize: 7, color: '#888' }}>{set.existingSlot}:{set.existingId} pose:{set.pose}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
