import { computeReadiness } from './subjectReadiness.js'
import { LEVELS } from '../config/gameConfig.js'

const ROTATION = ['thai', 'math', 'eng']

export function getBattleSubject(sessionLog, state) {
  const count = state?.dailyBattleRounds ?? 0
  // If any subject has never been played, prioritise it
  if (sessionLog?.length) {
    const readiness = {}
    for (const s of ROTATION) readiness[s] = computeReadiness(sessionLog, s)
    const notReady = ROTATION.find(s => readiness[s] === 'notready')
    if (notReady) return notReady
  }
  // Strict thai→math→eng rotation
  return ROTATION[count % 3]
}

export function getBattleLevel(subject, state) {
  const XP_KEY = { thai: 'xpThai', math: 'xpMath', eng: 'xpEng' }
  const xp = state[XP_KEY[subject]] ?? 0
  const levels = LEVELS[subject]
  if (!levels?.length) return 1

  const minId = levels[0].id               // 0 for math, 1 for thai/eng
  const maxId = levels[levels.length - 1].id // 8 for math, 5 for thai, 4 for eng

  // Unlock a new level every 60 XP so variety appears sooner
  const maxUnlocked = Math.min(minId + Math.floor(xp / 60), maxId)

  // Rotation: easy (min) → hard (maxUnlocked) → middle
  const midId = Math.floor((minId + maxUnlocked) / 2)
  const rotation = [minId, maxUnlocked, midId]
  const result = rotation[(state?.dailyBattleRounds ?? 0) % 3]

  console.log('getBattleLevel', subject, {
    xp, minId, maxId, maxUnlocked, rotation, result,
    dailyBattleRounds: state.dailyBattleRounds,
  })
  return result
}
