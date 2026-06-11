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
  console.log('getBattleLevel:', subject, {
    xpThai: state.xpThai, xpMath: state.xpMath, xpEng: state.xpEng,
    dailyBattleRounds: state.dailyBattleRounds,
  })
  const XP_KEY = { thai: 'xpThai', math: 'xpMath', eng: 'xpEng' }
  const xp = state[XP_KEY[subject]] ?? 0
  const levels = LEVELS[subject]
  if (!levels?.length) return 1
  const maxId = levels[levels.length - 1].id
  const maxUnlocked = Math.min(Math.floor(xp / 120) + 1, maxId)
  console.log('getBattleLevel maxUnlocked:', maxUnlocked, 'maxId:', maxId)
  // Adaptive rotation: easy → hard → medium every 3 battles
  const rotation = [1, maxUnlocked, Math.ceil(maxUnlocked / 2)]
  const idx = (state?.dailyBattleRounds ?? 0) % 3
  const result = Math.max(1, rotation[idx])
  console.log('getBattleLevel returning:', result)
  return result
}
