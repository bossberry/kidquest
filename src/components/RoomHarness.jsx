import React, { useRef, useEffect, useState } from 'react'
import { drawRoomScene } from '../lib/roomScene.js'
import { WALLPAPER_ITEMS, FLOORING_ITEMS } from '../lib/roomItems.js'
import { computeCozy, cozyParticleDensity } from '../lib/cozyScore.js'
import DecoratedRoom from './DecoratedRoom.jsx'

/**
 * Dev-only visual harness for SPEC GAME-B §B.2 (Room): wallpaper/flooring
 * pattern painters + Cozy Score tiers, opened directly via ?roomharness=1.
 * Same pattern as ?eggharness=1 (SPEC GAME-A §A.3) — never linked from the
 * normal UI. `drawRoomScene` is fully decoupled from any app/companion
 * context (confirmed by reading it before this session's changes), so this
 * works standalone without the Supabase login gate that blocks Room.jsx
 * itself.
 *
 * DecoratedRoom.jsx (the furniture-interaction wander AI) DOES need
 * CompanionContext/StateContext, so it can't render standalone the same way
 * — this harness only screenshot-verifies the pure-canvas pieces. The
 * furniture-interaction FSM logic itself was verified by direct code review
 * (see CHATBOT_NOTES.md's handoff) rather than live observation, since it's
 * a probabilistic rAF loop (25% chance per idle decision) that would need
 * many minutes of real-time watching to reliably screenshot mid-interaction.
 */
function RoomCanvas({ label, wallpaper, flooring, layout }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const W = 220, H = 180
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    drawRoomScene(ctx, { W, H, roomLayout: layout || {}, small: false, hint: false, theme: 'default', wallpaper, flooring })
  }, [wallpaper, flooring, layout])
  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={ref} style={{ width: 220, height: 180, imageRendering: 'pixelated', borderRadius: 8, display: 'block' }} />
      <div style={{ fontSize: 10, marginTop: 4 }}>{label}</div>
    </div>
  )
}

const COZY_LAYOUTS = [
  { label: 'empty (score 0)', layout: {} },
  { label: 'sparse (1 item)', layout: { floor_0_0: 'desk' } },
  { label: 'cozy (light+soft+plant)', layout: { floor_0_0: 'lamp', floor_1_0: 'rug', floor_2_0: 'plant', floor_3_0: 'desk' } },
  { label: 'max cozy (score 100)', layout: {
    floor_0_0: 'lamp', floor_1_0: 'rug', floor_2_0: 'plant', floor_3_0: 'desk',
    floor_4_0: 'bookshelf', floor_5_0: 'toy_chest', floor_0_1: 'wall_art', floor_1_1: 'mirror_round',
    left_wall_0_1: 'fairy_lights', right_wall_0_1: 'trophy',
  } },
]

export default function RoomHarness() {
  const [showWalker, setShowWalker] = useState(true)

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', background: '#1a1a1a', color: '#eee', minHeight: '100vh' }}>
      <h2 style={{ fontSize: 14 }}>Room Harness — §B.2</h2>

      <h3 style={{ fontSize: 12 }}>8 wallpaper patterns (applied to both walls)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {WALLPAPER_ITEMS.map(item => (
          <RoomCanvas key={item.id} label={`${item.id}${item.acquirable ? ` (${item.acquirable})` : ''}`} wallpaper={item.id} flooring={null} />
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>8 flooring patterns</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {FLOORING_ITEMS.map(item => (
          <RoomCanvas key={item.id} label={`${item.id}${item.acquirable ? ` (${item.acquirable})` : ''}`} wallpaper={null} flooring={item.id} />
        ))}
      </div>

      <h3 style={{ fontSize: 12 }}>Combined (wallpaper + flooring together)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <RoomCanvas label="clouds_sky + wood_planks" wallpaper="clouds_sky" flooring="wood_planks" />
        <RoomCanvas label="galaxy_dream + galaxy_floor (event)" wallpaper="galaxy_dream" flooring="galaxy_floor" />
        <RoomCanvas label="rainbow_stripe + rainbow_tile (craft)" wallpaper="rainbow_stripe" flooring="rainbow_tile" />
        <RoomCanvas label="gingham_brown + checker_mono" wallpaper="gingham_brown" flooring="checker_mono" />
      </div>

      <h3 style={{ fontSize: 12 }}>Cozy Score tiers (computeCozy → cozyParticleDensity, pure logic check)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {COZY_LAYOUTS.map(({ label, layout }) => {
          const cozy = computeCozy(layout)
          const density = cozyParticleDensity(cozy)
          return (
            <div key={label} style={{ background: '#242424', borderRadius: 8, padding: 8, fontSize: 10 }}>
              <div>{label}</div>
              <div style={{ color: '#7dffa0' }}>score: {cozy.score} / density: {density}</div>
              <div style={{ color: '#888' }}>
                light:{String(cozy.hasLight)} soft:{String(cozy.hasSoft)} plant:{String(cozy.hasPlant)} walls:{String(cozy.wallBalance)}
              </div>
            </div>
          )
        })}
      </div>

      <h3 style={{ fontSize: 12 }}>
        DecoratedRoom smoke test (renders whatever the CURRENT session's home
        room actually has — DecoratedRoom reads state.rooms/homeRoomId
        directly, it has no layout-override prop, so this harness can't force
        a furniture-filled test layout without dispatching into real state.
        Confirms the wander loop still runs/renders without crashing after
        this session's changes; does NOT reliably demonstrate a furniture
        interaction firing live — that's a ~25%-per-idle-decision probabilistic
        event needing minutes of real-time observation against a room that
        actually has bed/chair/plant/fish_tank/rug placed. Verified that path
        by direct code review instead — see CHATBOT_NOTES.md.)
      </h3>
      <label style={{ fontSize: 11 }}>
        <input type="checkbox" checked={showWalker} onChange={e => setShowWalker(e.target.checked)} /> showWalker
      </label>
      <div style={{ width: 420, height: 320, marginTop: 8, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <DecoratedRoom style={{ width: '100%', height: '100%' }} showWalker={showWalker} anim="idle" mood="normal" />
      </div>
    </div>
  )
}
