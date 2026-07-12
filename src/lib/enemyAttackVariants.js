// SPEC GAME-B §B.4 (2026-07-12) — Battle: enemy attack animations. Pure
// logic, no DOM/canvas access — the actual CSS animation classes
// (enemy-atk-lunge/-spin/-bounce) live in index.css, applied by
// MoveSelectBattleMode.jsx. 3 variants mapped roughly evenly (3 each) across
// the 9 enemy body types that actually appear in normal (non-maze) battles —
// ghost_wisp is excluded: it only ever spawns in the maze's enemy pool
// (tileMaps.js's spawnMazeContents), never in a real battle encounter, so a
// 10th variant for it would be dead code.
export const ATTACK_VARIANT_BY_ENEMY = {
  // lunge — aggressive forward dash toward the player
  fox_kit: 'lunge', fox: 'lunge', tiny_fox: 'lunge',
  snake: 'lunge',
  grumpy_mole: 'lunge',
  // spin — a playful whirl in place
  bouncy_slime: 'spin', slime: 'spin',
  mushroom_imp: 'spin',
  egg_pawn: 'spin',
  // bounce — a cute vertical hop
  sleepy_bunny: 'bounce', bunny: 'bounce',
  leaf_sprite: 'bounce',
  baby_zombie: 'bounce',
}

export function getAttackVariant(enemyType) {
  return ATTACK_VARIANT_BY_ENEMY[enemyType] ?? 'bounce'
}
