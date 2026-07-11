// SPEC GAME-B §B.3 (2026-07-11) — side-quest generation. Pure logic, no
// state/DOM access, so it's covered by a plain node --test file. The caller
// (WorldScreen.jsx) owns all RNG-adjacent decisions that need tileMap access
// (the 'find' template's sparkle tile position) and dispatches the built
// quest object verbatim via ACTIONS.START_SIDE_QUEST.
import { MATERIALS } from './roomItems.js'
import { WORLD_LEVELS } from '../config/worldConfig.js'

export const QUEST_TEMPLATES = ['fetch', 'defeat', 'find']

export function pickQuestTemplate(rand = Math.random) {
  return QUEST_TEMPLATES[Math.floor(rand() * QUEST_TEMPLATES.length)]
}

function pickReward(rand) {
  const mat = MATERIALS[Math.floor(rand() * MATERIALS.length)]
  return { rewardCoins: 30 + Math.floor(rand() * 21), rewardMaterial: mat.id }
}

export function buildFetchQuest(worldLevel, screenId, rand = Math.random) {
  const mat = MATERIALS[Math.floor(rand() * MATERIALS.length)]
  const amount = 2 + Math.floor(rand() * 3) // 2-4
  return {
    npcId: 'quest_giver', template: 'fetch', worldLevel, screenId,
    material: mat.id, amount, createdAt: Date.now(),
    ...pickReward(rand),
  }
}

export function buildDefeatQuest(worldLevel, screenId, rand = Math.random) {
  const pool = WORLD_LEVELS[worldLevel]?.enemies ?? WORLD_LEVELS[0].enemies
  const enemyType = pool[Math.floor(rand() * pool.length)]
  const count = 2 + Math.floor(rand() * 3) // 2-4
  return {
    npcId: 'quest_giver', template: 'defeat', worldLevel, screenId,
    enemyType, count, progress: 0, createdAt: Date.now(),
    ...pickReward(rand),
  }
}

export function buildFindQuest(worldLevel, screenId, pos, rand = Math.random) {
  return {
    npcId: 'quest_giver', template: 'find', worldLevel, screenId,
    col: pos.col, row: pos.row, found: false, createdAt: Date.now(),
    ...pickReward(rand),
  }
}

// isQuestComplete — true once the child has satisfied the quest's condition
// (but hasn't yet talked to the NPC to turn it in — that's COMPLETE_SIDE_QUEST).
// `materials` is state.materials, needed only for the fetch template.
export function isQuestComplete(quest, materials) {
  if (!quest) return false
  if (quest.template === 'fetch') return (materials?.[quest.material] ?? 0) >= quest.amount
  if (quest.template === 'defeat') return (quest.progress ?? 0) >= quest.count
  if (quest.template === 'find') return !!quest.found
  return false
}
