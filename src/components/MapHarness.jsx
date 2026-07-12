import React, { useEffect, useState } from 'react'
import WorldScreen from './WorldScreen.jsx'
import { KEY as STATE_KEY } from '../lib/state.js'

/**
 * Dev-only world-map test harness (2026-07-13 urgent bugfix session), opened
 * directly via ?mapharness=1. Same pattern as ?eggharness=1/?roomharness=1 —
 * never linked from the normal UI, no login needed.
 *
 * WorldScreen.jsx needs a real party/hatchedEggs/worldPosition in global
 * state to render its player sprite and pick a starting tile — there's no
 * prop-override path for that (by design, it reads state directly, same as
 * DecoratedRoom.jsx). Rather than adding a harness-only prop to a screen
 * this project's docs repeatedly flag as fragile, this seeds a minimal
 * fixture directly into localStorage (same technique used to manually
 * verify WorldScreen in the SPEC GAME-B §B.3 session, now made repeatable)
 * — including `worldPosition: { screen:'NW', tileX:10, tileY:13 }`, which
 * WorldScreen's OWN pre-existing mount effect already knows how to consume
 * (the same mechanism that restores your position after a battle) to force
 * the player to start near the BOTTOM row, right where the camera/D-pad/
 * exit-arrow safe-area fix needs verifying. One reload applies the seed
 * (loadState() reads localStorage fresh), then this renders the real
 * WorldScreen directly.
 */
const FIXTURE_STATE = {
  name: 'ทดสอบแผนที่', grade: 1, coins: 500,
  worldLevel: 0,
  currentWorld: 'thai',
  currentScreen: 'NW',
  worldPosition: { screen: 'NW', tileX: 10, tileY: 13 }, // row 13 — one tile above the south border, right against the safe-area boundary
  subjectLevels: { thai: 1, math: 1, eng: 1 },
  hatchedEggs: [{
    id: 'harness_creature', hatched_at: Date.now() - 100000, grade: 'อนุบาล', tier: 0, date: '2026-07-01',
    dna: { family: 'puff', seed: 5, h1: 140 },
  }],
  party: ['harness_creature'],
  partySlots: 1,
  xpThai: 50, xpMath: 20, xpEng: 10,
}

function isSeeded() {
  try {
    const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null')
    return !!s?.hatchedEggs?.some(e => e.id === 'harness_creature')
  } catch { return false }
}

export default function MapHarness() {
  const [ready, setReady] = useState(() => isSeeded())

  useEffect(() => {
    if (ready) return
    localStorage.setItem(STATE_KEY, JSON.stringify(FIXTURE_STATE))
    window.location.reload()
  }, [ready])

  if (!ready) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
        seeding fixture state, reloading…
      </div>
    )
  }

  return <WorldScreen navigate={() => {}} />
}
