// enemyAttackVariants.test.js — regression tests for the SPEC GAME-B §B.4
// pure logic (src/lib/enemyAttackVariants.js).

import test from 'node:test'
import assert from 'node:assert/strict'
import { getAttackVariant, ATTACK_VARIANT_BY_ENEMY } from '../enemyAttackVariants.js'

const VALID_VARIANTS = ['lunge', 'spin', 'bounce']

// The 9 canonical enemy body types that actually appear in normal (non-maze)
// world battles — see src/lib/tileMaps.js's SCREEN_ENEMIES/getScreenEnemies
// and src/config/worldConfig.js's WORLD_LEVELS[].enemies/bossEnemy pools.
const CANONICAL_TYPES = [
  'sleepy_bunny', 'bouncy_slime', 'leaf_sprite', 'mushroom_imp',
  'fox_kit', 'egg_pawn', 'grumpy_mole', 'baby_zombie', 'snake',
]

test('every canonical enemy type maps to a valid variant', () => {
  for (const type of CANONICAL_TYPES) {
    const v = getAttackVariant(type)
    assert.ok(VALID_VARIANTS.includes(v), `${type} -> "${v}" is not a valid variant`)
  }
})

test('the 9 canonical types are roughly evenly split across the 3 variants', () => {
  const counts = { lunge: 0, spin: 0, bounce: 0 }
  for (const type of CANONICAL_TYPES) counts[getAttackVariant(type)]++
  for (const v of VALID_VARIANTS) {
    assert.equal(counts[v], 3, `expected exactly 3 canonical types mapped to "${v}", got ${counts[v]}`)
  }
})

test('unknown enemy types (e.g. maze-only ghost_wisp) fall back to a valid default, never undefined', () => {
  assert.ok(VALID_VARIANTS.includes(getAttackVariant('ghost_wisp')))
  assert.ok(VALID_VARIANTS.includes(getAttackVariant('totally_unknown_type')))
  assert.ok(VALID_VARIANTS.includes(getAttackVariant(undefined)))
})

test('short aliases used by non-world battle pools (bunny/slime/fox) also resolve', () => {
  assert.equal(getAttackVariant('bunny'), getAttackVariant('sleepy_bunny'))
  assert.equal(getAttackVariant('slime'), getAttackVariant('bouncy_slime'))
  assert.equal(getAttackVariant('fox'), getAttackVariant('fox_kit'))
})

test('ATTACK_VARIANT_BY_ENEMY has no stray/invalid variant strings', () => {
  for (const v of Object.values(ATTACK_VARIANT_BY_ENEMY)) {
    assert.ok(VALID_VARIANTS.includes(v))
  }
})
