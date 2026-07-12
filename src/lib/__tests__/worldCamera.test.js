// worldCamera.test.js — regression test for the 2026-07-13 urgent fix: the
// world-map camera used to only reserve space at the TOP (HUD/mission
// panel), never at the bottom (D-pad), so the player sprite and the south
// exit arrow could render underneath the controls on short viewports.
// computeCameraY() must guarantee neither map edge ever scrolls past the
// safe playable band, for any map size / viewport height combination.

import test from 'node:test'
import assert from 'node:assert/strict'
import { computeCameraY } from '../worldCamera.js'

const MAP_PIX_H = 15 * 32 // MAP_ROWS * PANDORA_TILE — every screen in this game is this size
const TOP_SAFE_H = 64 + 72 // HUD_CONTENT_H + approximate MissionPanel height
const BOTTOM_SAFE_H = 220  // D-pad footprint (168 + 24 offset) + safe-area allowance

// screenY = worldY - camY. Convert to a helper so assertions read naturally.
function screenYOf(worldY, camY) { return worldY - camY }

test('player at the very bottom row never renders below the safe band (never under the D-pad)', () => {
  const vh = 700 // iPhone with Safari chrome eating height
  const playerWorldY = MAP_PIX_H - 16 // near the map's bottom edge
  const camY = computeCameraY({ playerWorldY, vh, mapPixH: MAP_PIX_H, topSafeH: TOP_SAFE_H, bottomSafeH: BOTTOM_SAFE_H })
  const screenY = screenYOf(playerWorldY, camY)
  assert.ok(screenY <= vh - BOTTOM_SAFE_H,
    `player screenY ${screenY} must be <= ${vh - BOTTOM_SAFE_H} (top of the D-pad zone)`)
})

test('player at the very top row never renders above the safe band (never under the HUD/mission panel)', () => {
  const vh = 700
  const playerWorldY = 16
  const camY = computeCameraY({ playerWorldY, vh, mapPixH: MAP_PIX_H, topSafeH: TOP_SAFE_H, bottomSafeH: BOTTOM_SAFE_H })
  const screenY = screenYOf(playerWorldY, camY)
  assert.ok(screenY >= TOP_SAFE_H,
    `player screenY ${screenY} must be >= ${TOP_SAFE_H} (bottom of the HUD/panel zone)`)
})

test('the map bottom edge itself never scrolls past the safe band, at any player row', () => {
  const vh = 700
  for (let row = 0; row <= 14; row++) {
    const playerWorldY = row * 32 + 16
    const camY = computeCameraY({ playerWorldY, vh, mapPixH: MAP_PIX_H, topSafeH: TOP_SAFE_H, bottomSafeH: BOTTOM_SAFE_H })
    const mapBottomScreenY = screenYOf(MAP_PIX_H, camY)
    assert.ok(mapBottomScreenY >= vh - BOTTOM_SAFE_H - 1,
      `row ${row}: map bottom edge at screenY ${mapBottomScreenY} scrolled past the D-pad zone (${vh - BOTTOM_SAFE_H})`)
  }
})

test('an even shorter viewport (360x640 small Android) still keeps the player above the D-pad zone', () => {
  const vh = 640
  const playerWorldY = MAP_PIX_H - 16
  const camY = computeCameraY({ playerWorldY, vh, mapPixH: MAP_PIX_H, topSafeH: TOP_SAFE_H, bottomSafeH: BOTTOM_SAFE_H })
  const screenY = screenYOf(playerWorldY, camY)
  assert.ok(screenY <= vh - BOTTOM_SAFE_H, `player screenY ${screenY} must clear the D-pad zone on a 640px-tall viewport too`)
})

test('a tall/desktop viewport where the whole map fits in the safe band centers it, without ever exceeding the band', () => {
  const vh = 1200
  const playerWorldY = MAP_PIX_H / 2
  const camY = computeCameraY({ playerWorldY, vh, mapPixH: MAP_PIX_H, topSafeH: TOP_SAFE_H, bottomSafeH: BOTTOM_SAFE_H })
  const topScreenY = screenYOf(0, camY)
  const bottomScreenY = screenYOf(MAP_PIX_H, camY)
  assert.ok(topScreenY >= TOP_SAFE_H - 1, `map top ${topScreenY} must not render above the HUD zone`)
  assert.ok(bottomScreenY <= vh - BOTTOM_SAFE_H + 1, `map bottom ${bottomScreenY} must not render below the D-pad zone`)
})
