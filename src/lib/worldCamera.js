// URGENT FIX (2026-07-13) — extracted from useWorldGameLoop.js's per-frame
// camera math so the bottom-control safe-area clamp is actually unit
// testable (a plain node --test file, not just a source-grep guard for
// something this behaviorally important). Pure function, no canvas/DOM
// access — see useWorldGameLoop.js for how it's wired into the RAF loop.
//
// Reserves TOP_SAFE_H (HUD bar + mission panel) and BOTTOM_SAFE_H (D-pad
// control cluster) as a genuine safe PLAYABLE band the camera will never
// scroll the map's own top/bottom edge past, so neither the player sprite
// nor the south exit-arrow indicator can ever render underneath the
// controls, regardless of map size or viewport height.
export function computeCameraY({ playerWorldY, vh, mapPixH, topSafeH, bottomSafeH }) {
  const usableH = Math.max(1, vh - topSafeH - bottomSafeH)
  if (mapPixH <= usableH) {
    // Whole map fits inside the safe band — center it there.
    return mapPixH / 2 - topSafeH - usableH / 2
  }
  const rawCamY = playerWorldY - topSafeH - usableH / 2
  return Math.max(-topSafeH, Math.min(rawCamY, mapPixH - vh + bottomSafeH))
}
