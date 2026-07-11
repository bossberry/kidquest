// sideQuests.test.js — regression tests for the SPEC GAME-B §B.3 pure logic
// (src/lib/sideQuests.js). Runs on Node's built-in test runner, same
// convention as every other pure-logic suite in this project.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pickQuestTemplate, buildFetchQuest, buildDefeatQuest, buildFindQuest, isQuestComplete,
  QUEST_TEMPLATES,
} from '../sideQuests.js'
import { MATERIALS } from '../roomItems.js'
import { WORLD_LEVELS } from '../../config/worldConfig.js'

test('pickQuestTemplate always returns one of the 3 templates', () => {
  assert.deepEqual(QUEST_TEMPLATES, ['fetch', 'defeat', 'find'])
  for (const r of [0, 0.34, 0.67, 0.99]) {
    assert.ok(QUEST_TEMPLATES.includes(pickQuestTemplate(() => r)))
  }
})

test('buildFetchQuest references a real material id and a 2-4 amount', () => {
  const q = buildFetchQuest(0, 'NW', () => 0.5)
  assert.equal(q.template, 'fetch')
  assert.ok(MATERIALS.some(m => m.id === q.material), 'material must be a real MATERIALS id')
  assert.ok(q.amount >= 2 && q.amount <= 4)
  assert.ok(MATERIALS.some(m => m.id === q.rewardMaterial))
  assert.ok(q.rewardCoins >= 30 && q.rewardCoins <= 50)
})

test('buildDefeatQuest references an enemy from that world\'s real enemy pool', () => {
  for (let w = 0; w < WORLD_LEVELS.length; w++) {
    const q = buildDefeatQuest(w, 'SW', () => 0.2)
    assert.ok(WORLD_LEVELS[w].enemies.includes(q.enemyType), `world ${w}: enemyType must come from its own pool`)
    assert.ok(q.count >= 2 && q.count <= 4)
    assert.equal(q.progress, 0)
  }
})

test('buildFindQuest stores the caller-supplied tile position verbatim', () => {
  const q = buildFindQuest(2, 'SE', { col: 7, row: 9 }, () => 0.1)
  assert.equal(q.col, 7)
  assert.equal(q.row, 9)
  assert.equal(q.found, false)
})

test('isQuestComplete: fetch checks materials >= amount, defeat checks progress >= count, find checks found', () => {
  assert.equal(isQuestComplete(null, {}), false)
  assert.equal(isQuestComplete({ template: 'fetch', material: 'wood', amount: 3 }, { wood: 2 }), false)
  assert.equal(isQuestComplete({ template: 'fetch', material: 'wood', amount: 3 }, { wood: 3 }), true)
  assert.equal(isQuestComplete({ template: 'defeat', count: 3, progress: 2 }, {}), false)
  assert.equal(isQuestComplete({ template: 'defeat', count: 3, progress: 3 }, {}), true)
  assert.equal(isQuestComplete({ template: 'find', found: false }, {}), false)
  assert.equal(isQuestComplete({ template: 'find', found: true }, {}), true)
})
